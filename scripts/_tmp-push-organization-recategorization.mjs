/** push-organization-recategorization.mjs
 * One-off write to `category` (not in sync-json-to-supabase.mjs's
 * FIELD_MAP, deliberate guardrail) for the 30 tools reclassified out of
 * "organization" by /tmp/recategorize_organization.mjs. Without this,
 * Supabase keeps the old category and wins over the JSON fallback on the
 * live site, silently undoing the reassignment. Authorized 2026-06-27,
 * full mapping reviewed by the user before this script ran.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnvFile(path) {
  const env = {};
  let content;
  try { content = readFileSync(path, "utf8"); } catch { return env; }
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return env;
}
const fileEnv = {
  ...loadEnvFile(".env"),
  ...loadEnvFile(".env.local"),
  ...loadEnvFile(".env.preprod"),
  ...loadEnvFile(".env.production"),
};
const pick = (...names) => names.map((n) => process.env[n] || fileEnv[n]).find(Boolean);
const SUPABASE_URL = pick("SUPABASE_URL", "VITE_SUPABASE_URL") || "https://rtfyfuwfdpnsogovkwai.supabase.co";
const SERVICE_KEY = pick("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY", "SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE");
if (!SERVICE_KEY) { console.error("Clé service_role introuvable."); process.exit(1); }
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const tools = JSON.parse(readFileSync("src/data/tools_v4.json", "utf8"));

const MOVES = {
  allstate: "hris-payroll",
  auvik: "analytics",
  keeptruckin: "analytics",
  "bolt-business": "finance",
  navan: "finance",
  captaindoc: "legal-contracts",
  connective: "legal-contracts",
  axeptio: "legal-contracts",
  didomi: "legal-contracts",
  "houzz-pro": "project-management",
  raycast: "productivity-tracking",
  ruby: "communication",
  arena: "design-tools",
  eagle: "design-tools",
  "are-na": "design-tools",
  meltwater: "marketing",
  cision: "marketing",
  prowly: "marketing",
  profitwell: "analytics",
  "triple-whale": "analytics",
  usertesting: "analytics",
  bubble: "nocode-web",
  greenly: "finance",
  sweep: "finance",
  sami: "finance",
  zotero: "formation-education",
  desktopready: "security",
  boompop: "communication",
  upwork: "communication",
  zoho: "erp",
};

const APPLY = process.argv.includes("--apply");
console.log(`Mode : ${APPLY ? "APPLICATION RÉELLE (--apply)" : "DRY-RUN"}\n`);

for (const [slug, expectedCat] of Object.entries(MOVES)) {
  const t = tools.find((x) => (x.slug || x.id) === slug);
  if (!t) { console.warn(`SKIP  ${slug} — absent du JSON local`); continue; }
  if (t.category !== expectedCat) { console.warn(`MISMATCH ${slug} — JSON local a "${t.category}", attendu "${expectedCat}"`); continue; }
  if (!APPLY) {
    console.log(`DRY   ${slug} -> category: ${expectedCat}`);
    continue;
  }
  const { error } = await supabase.from("tools").update({ category: expectedCat }).eq("slug", slug);
  if (error) console.error(`ERR   ${slug} — ${error.message}`);
  else console.log(`OK    ${slug} -> category: ${expectedCat}`);
}
if (!APPLY) console.log("\nDry-run terminé. Relance avec --apply pour écrire réellement.");
