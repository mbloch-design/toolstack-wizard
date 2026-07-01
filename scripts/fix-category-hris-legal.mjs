/** fix-category-hris-legal.mjs
 * One-off, narrowly-scoped write to the `category` column (deliberately
 * excluded from sync-json-to-supabase.mjs's FIELD_MAP) for exactly 10
 * slugs, per explicit user authorization (2026-06-25). These tools were
 * mistagged "organization" (HR/payroll and legal tools dumped into the
 * project-management category, surfaced by an external audit report) and
 * already correctly recategorized in tools_v4.json; this just lets that
 * fix reach Supabase, which otherwise wins over the JSON for any tool with
 * an existing row. Not a change to the sync script's guardrail itself.
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

const MOVES = {
  bamboohr: "hris-payroll", lano: "hris-payroll", netchex: "hris-payroll",
  oyster: "hris-payroll", personio: "hris-payroll", rippling: "hris-payroll",
  mycase: "legal-contracts", "wolters-kluwer": "legal-contracts",
  legalstart: "legal-contracts", "legifrance-pro": "legal-contracts",
};

const APPLY = process.argv.includes("--apply");
console.log(`Mode : ${APPLY ? "APPLICATION RÉELLE (--apply)" : "DRY-RUN"}\n`);

for (const [slug, category] of Object.entries(MOVES)) {
  if (!APPLY) {
    console.log(`DRY   ${slug} -> category: ${category}`);
    continue;
  }
  const { error } = await supabase.from("tools").update({ category }).eq("slug", slug);
  if (error) console.error(`ERR   ${slug} — ${error.message}`);
  else console.log(`OK    ${slug} -> category: ${category}`);
}
if (!APPLY) console.log("\nDry-run terminé. Relance avec --apply pour écrire réellement.");
