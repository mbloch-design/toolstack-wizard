/**
 * insert-missing-supabase.mjs
 *
 * Crée dans la table `tools` de Supabase les fiches qui n'ont pas encore
 * de ligne (elles étaient servies via le fallback JSON). Insère le contenu
 * depuis src/data/tools_v4.json.
 *
 * Garde-fous :
 *  - N'insère QUE les slugs ciblés (par défaut les 5 manquants connus).
 *  - Saute un slug s'il a déjà une ligne (ne duplique jamais).
 *  - Exclut solo_relevance / team_relevance (colonnes varchar(50)).
 *  - Coerce prescription_quality vers une valeur sûre.
 *  - DRY-RUN par défaut. --apply pour écrire.
 *
 * Usage :
 *   node scripts/insert-missing-supabase.mjs            # aperçu
 *   node scripts/insert-missing-supabase.mjs --apply    # insertion réelle
 *   node scripts/insert-missing-supabase.mjs --apply ovh wordpress
 */

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";

const APPLY = process.argv.includes("--apply");
const slugArgs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const DEFAULT_MISSING = ["remix", "gitlens", "dart", "ovh", "wordpress"];
const SLUGS = slugArgs.length ? slugArgs : DEFAULT_MISSING;

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
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
const pick = (...n) => n.map((k) => process.env[k] || fileEnv[k]).find(Boolean);

const SUPABASE_URL =
  pick("SUPABASE_URL", "VITE_SUPABASE_URL") ||
  "https://rtfyfuwfdpnsogovkwai.supabase.co";
const SERVICE_KEY = pick(
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_KEY",
  "SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE"
);
if (!SERVICE_KEY) {
  console.error("Clé service_role introuvable (ajoute SUPABASE_SERVICE_ROLE_KEY dans .env.preprod).");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const VALID_PQ = new Set(["ferme", "oui", "question", "silence"]);
const coercePQ = (v) => (VALID_PQ.has(v) ? v : "question");

// Construit la ligne snake_case à insérer depuis l'objet JSON camelCase.
function buildRow(t) {
  return {
    id: t.id,
    name: t.name,
    slug: t.slug || t.id,
    category: t.category || t.categoryId,
    short_description: t.shortDescription ?? "",
    long_description: t.longDescription ?? t.description ?? "",
    short_description_en: t.shortDescriptionEn ?? null,
    long_description_en: t.longDescriptionEn ?? null,
    affiliate_link: t.affiliateLink ?? "",
    website_url: t.websiteUrl ?? "",
    logo: t.logo ?? "",
    default_monthly_price: t.defaultMonthlyPrice ?? 0,
    pricing: t.pricing ?? null,
    pricing_en: t.pricingEn ?? null,
    pricing_v5: t.pricing_v5 ?? null,
    verdict: t.verdict ?? null,
    verdict_en: t.verdictEn ?? null,
    pros: t.pros ?? [],
    pros_en: t.prosEn ?? null,
    cons: t.cons ?? [],
    cons_en: t.consEn ?? null,
    use_cases: t.useCases ?? [],
    use_cases_en: t.useCasesEn ?? null,
    covers: t.covers ?? [],
    relevant_for: t.relevantFor ?? [],
    alternatives: t.alternatives ?? [],
    seo: t.seo ?? null,
    articles: t.articles ?? [],
    time_gained_hours_per_month: t.timeGainedHoursPerMonth ?? null,
    free_alternative: t.freeAlternative ?? null,
    personas: t.personas ?? [],
    tool_type: t.tool_type ?? "satellite",
    substitutable: t.substitutable ?? true,
    host_app: t.host_app ?? null,
    bundle_parent: t.bundle_parent ?? null,
    verticals: t.verticals ?? [],
    functional_needs: t.functional_needs ?? [],
    ia_use_case: t.ia_use_case ?? null,
    better_alternative: t.betterAlternative ?? null,
    migration_guide: t.migrationGuide ?? null,
    downgrade_plan: t.downgradePlan ?? null,
    prescription_quality: coercePQ(t.prescription_quality),
    prescription_output: t.prescription_output ?? null,
    prescription_block_reasons: t.prescription_block_reasons ?? [],
    prescription_context_questions: t.prescription_context_questions ?? [],
    substitution_cluster_v2: t.substitution_cluster_v2 ?? null,
    decision_policy_v3: t.decision_policy_v3 ?? null,
    force_silence: t.force_silence ?? false,
    // solo_relevance / team_relevance volontairement omis (varchar(50)).
    // pertinence_by_persona omis (absent du JSON, défaut DB).
  };
}

const tools = JSON.parse(await readFile("src/data/tools_v4.json", "utf8"));
const bySlug = new Map(tools.map((t) => [t.slug || t.id, t]));

console.log(`\nMode : ${APPLY ? "INSERTION RÉELLE (--apply)" : "DRY-RUN"}`);
console.log(`Cible : ${SUPABASE_URL}`);
console.log(`Slugs : ${SLUGS.join(", ")}\n`);

let inserted = 0, skipped = 0, errors = 0;
for (const slug of SLUGS) {
  const t = bySlug.get(slug);
  if (!t) {
    console.warn(`SKIP  ${slug} — absent du JSON`);
    skipped++;
    continue;
  }
  const { data: existing } = await supabase
    .from("tools").select("slug").eq("slug", slug).maybeSingle();
  if (existing) {
    console.warn(`SKIP  ${slug} — ligne déjà présente`);
    skipped++;
    continue;
  }
  const row = buildRow(t);
  if (!APPLY) {
    console.log(`DRY   ${slug} — ${Object.keys(row).length} colonnes prêtes`);
    inserted++;
    continue;
  }
  const { error } = await supabase.from("tools").insert(row);
  if (error) {
    console.error(`ERR   ${slug} — ${error.message}`);
    errors++;
  } else {
    console.log(`OK    ${slug} — ligne créée`);
    inserted++;
  }
}

console.log("\n=== Résumé ===");
console.log(`${APPLY ? "Créées" : "À créer"} : ${inserted}`);
console.log(`Sautées : ${skipped}`);
console.log(`Erreurs : ${errors}`);
if (!APPLY) console.log("\nDry-run terminé. Relance avec --apply pour insérer.");
