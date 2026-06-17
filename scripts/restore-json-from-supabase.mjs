/**
 * restore-json-from-supabase.mjs
 *
 * Réinjecte dans src/data/tools_v4.json les fiches qui existent dans Supabase
 * mais ont été retirées du JSON. Raison : le prerender SEO au build
 * (vite.config.ts staticPrerenderPlugin) lit tools_v4.json pour générer le
 * <title>/meta/JSON-LD de chaque page /tool/<slug>. Une fiche absente du JSON
 * n'est plus prérendue et retombe sur le shell générique (mauvais SEO).
 *
 * Mappe les colonnes snake_case de Supabase vers la forme camelCase attendue
 * par le prerender et l'app. N'écrase JAMAIS une entrée déjà présente dans le
 * JSON ; ajoute seulement les manquantes. Réécrit le fichier au format
 * JSON.stringify(.,2)+"\n" (identique au format actuel => diff = ajouts seuls).
 *
 * DRY-RUN par défaut. --apply pour écrire.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const APPLY = process.argv.includes("--apply");
const PATH = "src/data/tools_v4.json";

const SUPABASE_URL = "https://rtfyfuwfdpnsogovkwai.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZnlmdXdmZHBuc29nb3Zrd2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTcyMDcsImV4cCI6MjA4ODg3MzIwN30.pwpmh9Qe8dLZFq1rMqtCRmEMJ9dnbcdvT_B4CjIu4Xc";
const supabase = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

// colonnes Supabase (snake) -> clés JSON (camel). Les autres colonnes gardent
// le même nom (id, slug, name, category, pricing, pricing_v5, verdict, pros,
// cons, seo, alternatives, covers, verticals, personas, tool_type, etc.).
const RENAME = {
  short_description: "shortDescription",
  short_description_en: "shortDescriptionEn",
  long_description: "longDescription",
  long_description_en: "longDescriptionEn",
  default_monthly_price: "defaultMonthlyPrice",
  pricing_en: "pricingEn",
  verdict_en: "verdictEn",
  pros_en: "prosEn",
  cons_en: "consEn",
  use_cases: "useCases",
  use_cases_en: "useCasesEn",
  relevant_for: "relevantFor",
  better_alternative: "betterAlternative",
  free_alternative: "freeAlternative",
  website_url: "websiteUrl",
  affiliate_link: "affiliateLink",
  time_gained_hours_per_month: "timeGainedHoursPerMonth",
  migration_guide: "migrationGuide",
  downgrade_plan: "downgradePlan",
  solo_relevance: "soloRelevance",
  team_relevance: "teamRelevance",
};
// colonnes Supabase à ignorer (pas dans le schéma JSON)
const DROP = new Set(["pertinence_by_persona"]);

function rowToTool(row) {
  const t = {};
  for (const [col, val] of Object.entries(row)) {
    if (DROP.has(col)) continue;
    const key = RENAME[col] || col;
    t[key] = val;
  }
  // le JSON historique porte un champ `description` = longDescription
  if (t.description === undefined && t.longDescription != null) {
    t.description = t.longDescription;
  }
  return t;
}

const tools = JSON.parse(readFileSync(PATH, "utf8"));
const existing = new Set(tools.map((t) => t.slug || t.id));

const { data, error } = await supabase.from("tools").select("*").limit(2000);
if (error) {
  console.error(`Lecture Supabase impossible : ${error.message}`);
  process.exit(1);
}

const toAdd = data.filter((r) => r.slug && !existing.has(r.slug));
console.log(`\nMode : ${APPLY ? "APPLICATION RÉELLE (--apply)" : "DRY-RUN"}`);
console.log(`Fiches Supabase : ${data.length}`);
console.log(`Déjà dans le JSON : ${tools.length}`);
console.log(`À réinjecter (en base, absentes du JSON) : ${toAdd.length}`);
console.log("Slugs : " + toAdd.map((r) => r.slug).join(", "));

if (toAdd.length === 0) {
  console.log("\nRien à faire.");
  process.exit(0);
}

if (!APPLY) {
  console.log("\nDry-run terminé. Relance avec --apply pour écrire.");
  process.exit(0);
}

for (const row of toAdd) tools.push(rowToTool(row));
const out = JSON.stringify(tools, null, 2) + "\n";
JSON.parse(out); // valide
writeFileSync(PATH, out);
console.log(`\nOK — ${toAdd.length} fiches réinjectées. Total : ${tools.length}.`);
