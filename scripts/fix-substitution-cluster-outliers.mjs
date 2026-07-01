/** fix-substitution-cluster-outliers.mjs
 * One-off write to `substitution_cluster_v2` (not in sync-json-to-
 * supabase.mjs's FIELD_MAP, same guardrail pattern as `category`) for
 * exactly 10 slugs, per the same authorization granted for the category
 * fix (2026-06-25). These tools shared a "workspace-ops" cluster value
 * with Asana/Confluence/Zendesk/etc — a 38-tool mega-cluster mixing real
 * ops/productivity tools with health insurance (Allstate), network
 * monitoring (Auvik), corporate ridesharing (Bolt Business), trucking
 * fleet management (KeepTruckin), and other unrelated services. This is
 * the actual mechanism behind the external audit's complaint about
 * irrelevant "alternatives" surfacing on tool pages (ToolDetailPage's
 * "Substituables directement" chips read this field). Already nulled in
 * tools_v4.json; this lets that reach Supabase, which wins over JSON for
 * any tool with an existing row.
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

const SLUGS = ["allstate", "auvik", "bolt-business", "boompop", "desktopready", "keeptruckin", "navan", "ruby", "spaceiq", "sysaid"];

const APPLY = process.argv.includes("--apply");
console.log(`Mode : ${APPLY ? "APPLICATION RÉELLE (--apply)" : "DRY-RUN"}\n`);

for (const slug of SLUGS) {
  if (!APPLY) {
    console.log(`DRY   ${slug} -> substitution_cluster_v2: null`);
    continue;
  }
  const { error } = await supabase.from("tools").update({ substitution_cluster_v2: null }).eq("slug", slug);
  if (error) console.error(`ERR   ${slug} — ${error.message}`);
  else console.log(`OK    ${slug} -> substitution_cluster_v2: null`);
}
if (!APPLY) console.log("\nDry-run terminé. Relance avec --apply pour écrire réellement.");
