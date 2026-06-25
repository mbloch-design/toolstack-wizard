/** push-asana-cluster-taxonomy.mjs
 * One-off write to `functional_needs` and `verticals` (not in
 * sync-json-to-supabase.mjs's FIELD_MAP, same guardrail pattern as
 * `category`/`substitution_cluster_v2`) for exactly the 8 slugs already
 * normalized locally in tools_v4.json by
 * normalize-asana-related-taxonomy.mjs. Without this, Supabase keeps the
 * old inconsistent tags and wins over the JSON fallback on the live site,
 * silently undoing the pilot normalization. Authorized 2026-06-25, same
 * scope as that script (Asana fiche pilot only, not full-catalog).
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
const SLUGS = ["asana", "wrike", "basecamp", "clickup", "trello", "airtable", "monday", "notion"];

const APPLY = process.argv.includes("--apply");
console.log(`Mode : ${APPLY ? "APPLICATION RÉELLE (--apply)" : "DRY-RUN"}\n`);

for (const slug of SLUGS) {
  const t = tools.find((x) => (x.slug || x.id) === slug);
  if (!t) { console.warn(`SKIP  ${slug} — absent du JSON local`); continue; }
  const update = { functional_needs: t.functional_needs || [], verticals: t.verticals || [] };
  if (!APPLY) {
    console.log(`DRY   ${slug} -> ${JSON.stringify(update)}`);
    continue;
  }
  const { error } = await supabase.from("tools").update(update).eq("slug", slug);
  if (error) console.error(`ERR   ${slug} — ${error.message}`);
  else console.log(`OK    ${slug} -> ${JSON.stringify(update)}`);
}
if (!APPLY) console.log("\nDry-run terminé. Relance avec --apply pour écrire réellement.");
