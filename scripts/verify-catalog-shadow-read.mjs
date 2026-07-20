import { existsSync, readFileSync } from "node:fs";

const ENV_FILE = process.env.TOOLTRIM_ENV_FILE || ".env.preprod";
const PAGE_SIZE = 1000;

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

function required(name, fallback) {
  const value = process.env[name] || process.env[fallback];
  if (!value || value.includes("<")) throw new Error(`Variable manquante : ${name}`);
  return value;
}

async function readAll(url, key, schema, table, columns) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const response = await fetch(`${url}/rest/v1/${table}?select=${columns.join(",")}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Accept-Profile": schema,
        Range: `${from}-${from + PAGE_SIZE - 1}`,
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`${schema}.${table}: HTTP ${response.status} ${await response.text()}`);
    const page = await response.json();
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

loadEnvFile(ENV_FILE);
const url = required("SUPABASE_URL", "VITE_SUPABASE_URL").replace(/\/+$/, "");
const key = required("VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY");

const projectionColumns = [
  "id", "slug", "name", "logo", "og_image_url", "category", "tool_type",
  "website_url", "affiliate_link", "lang", "short_description", "long_description",
  "verdict", "pros", "cons", "covers", "use_cases", "relevant_for", "seo",
  "solo_relevance", "team_relevance", "personas", "time_gained_hours_per_month",
  "articles", "substitutable", "verticals", "functional_needs", "ia_use_case",
  "host_app", "bundle_parent", "better_alternative", "free_alternative",
  "migration_guide", "downgrade_plan", "prescription_quality",
  "substitution_cluster_v2", "legacy_pricing", "legacy_pricing_en",
  "legacy_default_monthly_price", "legacy_pricing_v5", "data_contract",
  "alternatives",
];

const toolColumns = [
  "id", "slug", "name", "logo", "og_image_url", "category", "tool_type",
  "website_url", "affiliate_link", "short_description", "short_description_en",
  "long_description", "long_description_en", "verdict", "verdict_en", "pros",
  "pros_en", "cons", "cons_en", "covers", "use_cases", "use_cases_en",
  "relevant_for", "seo", "solo_relevance", "team_relevance", "personas",
  "time_gained_hours_per_month", "articles", "substitutable", "verticals",
  "functional_needs", "ia_use_case", "host_app", "bundle_parent",
  "better_alternative", "free_alternative", "migration_guide", "downgrade_plan",
  "prescription_quality", "substitution_cluster_v2", "pricing", "pricing_en",
  "default_monthly_price", "pricing_v5", "data_contract",
  "alternatives",
];

const [projection, tools] = await Promise.all([
  readAll(url, key, "catalog_api", "published_tool_projection", projectionColumns),
  readAll(url, key, "public", "tools", toolColumns),
]);

if (tools.length !== 1126) throw new Error(`public.tools : 1126 attendus, ${tools.length} reçus`);
if (projection.length !== 2252) throw new Error(`projection : 2252 attendues, ${projection.length} reçues`);

const toolsById = new Map(tools.map((tool) => [tool.id, tool]));
const publishedSlugs = new Set(tools.map((tool) => tool.slug));
const mismatches = new Map();
const firstSamples = new Map();
let derivedAlternativeDeltas = 0;

const directFields = [
  "id", "slug", "name", "logo", "og_image_url", "category", "tool_type",
  "website_url", "affiliate_link", "covers", "relevant_for", "seo",
  "solo_relevance", "team_relevance", "personas", "time_gained_hours_per_month",
  "articles", "substitutable", "verticals", "functional_needs", "ia_use_case",
  "host_app", "bundle_parent", "better_alternative", "free_alternative",
  "migration_guide", "downgrade_plan", "prescription_quality",
  "substitution_cluster_v2", "data_contract",
];

const localizedFields = {
  short_description: ["short_description", "short_description_en"],
  long_description: ["long_description", "long_description_en"],
  verdict: ["verdict", "verdict_en"],
  pros: ["pros", "pros_en"],
  cons: ["cons", "cons_en"],
  use_cases: ["use_cases", "use_cases_en"],
};

const legacyFields = {
  legacy_pricing: "pricing",
  legacy_pricing_en: "pricing_en",
  legacy_default_monthly_price: "default_monthly_price",
  legacy_pricing_v5: "pricing_v5",
};

function compare(field, actual, expected, slug, lang) {
  if (stable(actual) === stable(expected)) return;
  mismatches.set(field, (mismatches.get(field) || 0) + 1);
  if (!firstSamples.has(field)) firstSamples.set(field, `${slug}/${lang}`);
}

for (const row of projection) {
  const tool = toolsById.get(row.id);
  if (!tool) throw new Error(`outil source absent : ${row.id}`);

  for (const field of directFields) compare(field, row[field], tool[field], row.slug, row.lang);

  for (const [output, [frField, enField]] of Object.entries(localizedFields)) {
    const localized = row.lang === "en" ? (tool[enField] ?? tool[frField]) : tool[frField];
    compare(output, row[output], localized, row.slug, row.lang);
  }

  for (const [output, source] of Object.entries(legacyFields)) {
    compare(output, row[output], tool[source], row.slug, row.lang);
  }

  if (row.lang === "fr") {
    const projectedAlternatives = Array.isArray(row.alternatives) ? row.alternatives : [];
    const legacyAlternatives = Array.isArray(tool.alternatives) ? tool.alternatives : [];
    if (stable([...projectedAlternatives].sort()) !== stable([...legacyAlternatives].sort())) {
      derivedAlternativeDeltas += 1;
    }
    const invalidTarget = projectedAlternatives.find(
      (slug) => typeof slug !== "string" || !publishedSlugs.has(slug),
    );
    if (invalidTarget) throw new Error(`alternative projetée invalide : ${row.slug} -> ${String(invalidTarget)}`);
  }
}

if (mismatches.size) {
  console.error(JSON.stringify({
    status: "FAIL",
    tools: tools.length,
    projection: projection.length,
    mismatchCounts: Object.fromEntries([...mismatches].sort()),
    firstSamples: Object.fromEntries([...firstSamples].sort()),
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  tools: tools.length,
  projection: projection.length,
  checkedFields: directFields.length + Object.keys(localizedFields).length + Object.keys(legacyFields).length,
  mismatches: 0,
  derivedAlternativeDeltas,
}, null, 2));
console.log("CATALOG_SHADOW_READ_READY");
