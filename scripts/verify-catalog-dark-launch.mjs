import { existsSync, readFileSync } from "node:fs";

const ENV_FILE = process.env.TOOLTRIM_ENV_FILE || ".env.preprod";
const EXPECTED_TOOLS = 1126;
const EXPECTED_PROJECTION_ROWS = 2252;

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

function required(name, ...fallbacks) {
  const value = [name, ...fallbacks].map((key) => process.env[key]).find(Boolean);
  if (!value || value.includes("<")) throw new Error(`Variable manquante : ${name}`);
  return value;
}

function totalFrom(contentRange) {
  const match = contentRange?.match(/\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

async function request(url, key, { schema = "public", query, count = false } = {}) {
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    "Accept-Profile": schema,
  };
  if (count) {
    headers.Prefer = "count=exact";
    headers.Range = "0-0";
  }
  const response = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/${query}`, {
    headers,
    cache: "no-store",
  });
  const text = await response.text();
  let body = text;
  try { body = text ? JSON.parse(text) : null; } catch { /* keep text */ }
  return { response, body, total: totalFrom(response.headers.get("content-range")) };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

loadEnvFile(ENV_FILE);

const url = required("SUPABASE_URL", "VITE_SUPABASE_URL");
const key = required("VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY");
const checks = [];

async function check(name, fn) {
  const started = Date.now();
  try {
    const detail = await fn();
    checks.push({ name, status: "PASS", durationMs: Date.now() - started, detail });
  } catch (error) {
    checks.push({ name, status: "FAIL", durationMs: Date.now() - started, detail: error.message });
  }
}

await check("public.tools reste lisible et complet", async () => {
  const result = await request(url, key, { query: "tools?select=slug", count: true });
  assert(result.response.ok, `HTTP ${result.response.status}`);
  assert(result.total === EXPECTED_TOOLS, `attendu ${EXPECTED_TOOLS}, reçu ${result.total}`);
  return `${result.total} outils`;
});

await check("catalog_api est exposé et complet", async () => {
  const result = await request(url, key, {
    schema: "catalog_api",
    query: "published_tool_projection?select=slug",
    count: true,
  });
  if (result.response.status === 406 && result.body?.code === "PGRST106") {
    throw new Error("catalog_api non exposé dans Settings > Data API > Exposed schemas");
  }
  assert(result.response.ok, `HTTP ${result.response.status}`);
  assert(result.total === EXPECTED_PROJECTION_ROWS, `attendu ${EXPECTED_PROJECTION_ROWS}, reçu ${result.total}`);
  return `${result.total} lignes`;
});

await check("Wix et Webflow sont les deux pilotes canonical", async () => {
  const result = await request(url, key, {
    schema: "catalog_api",
    query: "published_tool_projection?select=slug,lang,data_contract,price_status,compare_plan,compare_native_amount,compare_native_currency,compare_monthly_eur,compare_eur_is_legacy_conversion,billing_commitment,tax_inclusion,compare_market,compare_locale,plans&slug=eq.wix&order=lang.asc",
  });
  assert(result.response.ok, `HTTP ${result.response.status}`);
  assert(Array.isArray(result.body) && result.body.length === 2, `attendu 2 langues, reçu ${result.body?.length ?? 0}`);
  assert(result.body.every((row) => row.data_contract === "canonical"), "Wix n'est pas canonical");
  assert(result.body.every((row) => row.price_status === "approved"), "price_status Wix non approved");
  assert(result.body.every((row) => row.compare_plan === "light"), "plan comparatif Wix inattendu");
  assert(result.body.every((row) => Number(row.compare_native_amount) === 16.8 && row.compare_native_currency === "EUR"), "prix natif Wix inattendu");
  assert(result.body.every((row) => Number(row.compare_monthly_eur) === 16.8 && row.compare_eur_is_legacy_conversion === false), "prix comparatif Wix incorrect");
  assert(result.body.every((row) => row.billing_commitment === "annual_prepaid" && row.tax_inclusion === "ttc"), "conditions Wix incomplètes");
  assert(result.body.every((row) => row.compare_market === "FR" && row.compare_locale === "fr-FR"), "contexte Wix incorrect");
  assert(result.body.every((row) => Array.isArray(row.plans) && row.plans.length === 5), "jeu de plans Wix incomplet");

  const canonical = await request(url, key, {
    schema: "catalog_api",
    query: "published_tool_projection?select=slug&data_contract=eq.canonical",
    count: true,
  });
  assert(canonical.response.ok, `canonical count HTTP ${canonical.response.status}`);
  assert(canonical.total === 4, `Wix + Webflow doivent produire 4 lignes localisées, reçu ${canonical.total}`);

  const webflow = await request(url, key, {
    schema: "catalog_api",
    query: "published_tool_projection?select=slug,lang,data_contract,price_status,compare_plan,compare_native_amount,compare_native_currency,compare_monthly_eur,billing_commitment,tax_inclusion,compare_market,compare_locale,plans&slug=eq.webflow&order=lang.asc",
  });
  assert(webflow.response.ok, `Webflow HTTP ${webflow.response.status}`);
  assert(Array.isArray(webflow.body) && webflow.body.length === 2, "projection Webflow bilingue absente");
  assert(webflow.body.every((row) => row.data_contract === "canonical" && row.price_status === "approved"), "Webflow non canonical/approved");
  assert(webflow.body.every((row) => row.compare_plan === "basic" && Number(row.compare_native_amount) === 15 && row.compare_native_currency === "USD"), "prix natif Webflow incorrect");
  assert(webflow.body.every((row) => row.compare_monthly_eur == null), "conversion EUR Webflow non sourcée");
  assert(webflow.body.every((row) => row.billing_commitment === "annual_prepaid" && row.tax_inclusion === "ht"), "conditions Webflow incomplètes");
  assert(webflow.body.every((row) => row.compare_market == null && row.compare_locale == null), "locale Webflow artificielle");
  assert(webflow.body.every((row) => Array.isArray(row.plans) && row.plans.length === 3), "jeu de plans Webflow incomplet");
  return "Wix FR/EUR + Webflow global/USD, fr/en, prix approuvés";
});

await check("catalog_private demeure hors Data API", async () => {
  const result = await request(url, key, {
    schema: "catalog_private",
    query: "tool_claims?select=id&limit=1",
  });
  assert(result.response.status === 406 && result.body?.code === "PGRST106", `refus PGRST106 attendu, reçu HTTP ${result.response.status}`);
  return "PGRST106";
});

for (const item of checks) {
  console.log(`[${item.status}] ${item.name} (${item.durationMs}ms) — ${item.detail}`);
}

const failures = checks.filter((item) => item.status === "FAIL");
if (failures.length) {
  console.error(`CATALOG_DARK_LAUNCH_BLOCKED=${failures.length}`);
  process.exit(1);
}

console.log("CATALOG_DARK_LAUNCH_READY");
