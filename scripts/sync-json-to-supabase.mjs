/**
 * sync-json-to-supabase.mjs
 *
 * Pousse le contenu éditorial de src/data/tools_v4.json vers la table `tools`
 * de Supabase (la source réellement servie en production par useToolBySlug).
 *
 * Sûr par conception :
 *  - Met à jour UNIQUEMENT les slugs listés dans SLUGS (pas toute la table).
 *  - Introspecte les colonnes réelles de chaque ligne et n'écrit que celles
 *    qui existent (essaie camelCase puis snake_case).
 *  - Ne touche jamais la catégorie ni les clés techniques.
 *  - Ne crée pas de ligne : si un slug n'existe pas dans Supabase, il est
 *    déjà servi via le JSON local, donc rien à faire.
 *  - DRY-RUN par défaut. Ajoute --apply pour écrire vraiment.
 *
 * Usage :
 *   # aperçu (n'écrit rien)
 *   SUPABASE_SERVICE_ROLE_KEY=xxxxx node scripts/sync-json-to-supabase.mjs
 *
 *   # application réelle
 *   SUPABASE_SERVICE_ROLE_KEY=xxxxx node scripts/sync-json-to-supabase.mjs --apply
 */

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";

const APPLY = process.argv.includes("--apply");

// Charge les variables depuis un fichier .env local (comme le fait
// scripts/deploy-preprod-supabase.mjs) pour ne pas avoir à coller de clé.
function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const fileEnv = {
  ...loadEnvFile(".env"),
  ...loadEnvFile(".env.local"),
  ...loadEnvFile(".env.preprod"),
  ...loadEnvFile(".env.production"),
};
const pick = (...names) =>
  names.map((n) => process.env[n] || fileEnv[n]).find(Boolean);

const SUPABASE_URL =
  pick("SUPABASE_URL", "VITE_SUPABASE_URL") ||
  "https://rtfyfuwfdpnsogovkwai.supabase.co";

// Cherche la clé service_role sous les noms de variable les plus courants.
const SERVICE_KEY = pick(
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_KEY",
  "SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE"
);

if (!SERVICE_KEY) {
  console.error(
    "Clé service_role introuvable.\n" +
      "Ajoute-la dans .env.preprod sous le nom SUPABASE_SERVICE_ROLE_KEY=...,\n" +
      "ou exporte-la avant de lancer : SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/sync-json-to-supabase.mjs"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Slugs passés en argument (ex: node ... --apply figma canva) sinon la
// liste par défaut ci-dessous (Remix + lot 1 + lot 2).
const slugArgs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const DEFAULT_SLUGS = [
  "remix",
  "wetransfer",
  "linear",
  "figma-tokens",
  "rive",
  "gitlens",
  "neon",
  "zoom-pro",
  "cargo-site",
  "dart",
  "adobe-after-effects",
  "adobe-illustrator",
  "adobe-podcast-ai",
  "basecamp",
  "mongodb-atlas",
  "semrush",
  "looker-studio",
  "metabase",
  "sentry",
  "hotjar",
];
const SLUGS = slugArgs.length ? slugArgs : DEFAULT_SLUGS;

// Champ JSON -> noms de colonne possibles (on prend le premier qui existe
// réellement dans la ligne Supabase).
const FIELD_MAP = {
  shortDescription: ["shortDescription", "short_description"],
  shortDescriptionEn: ["shortDescriptionEn", "short_description_en"],
  description: ["description"],
  longDescription: ["longDescription", "long_description"],
  longDescriptionEn: ["longDescriptionEn", "long_description_en"],
  pricing: ["pricing"],
  pricingEn: ["pricingEn", "pricing_en"],
  defaultMonthlyPrice: ["defaultMonthlyPrice", "default_monthly_price"],
  pricing_v5: ["pricing_v5", "pricingV5"],
  verdict: ["verdict"],
  verdictEn: ["verdictEn", "verdict_en"],
  pros: ["pros"],
  prosEn: ["prosEn", "pros_en"],
  cons: ["cons"],
  consEn: ["consEn", "cons_en"],
  useCases: ["useCases", "use_cases"],
  useCasesEn: ["useCasesEn", "use_cases_en"],
  seo: ["seo"],
  alternatives: ["alternatives"],
  relevantFor: ["relevantFor", "relevant_for"],
  // solo_relevance / team_relevance volontairement exclus : ces colonnes
  // sont en varchar(50) dans Supabase et n'acceptent pas le texte long.
  freeAlternative: ["freeAlternative", "free_alternative"],
  betterAlternative: ["betterAlternative", "better_alternative"],
  prescription_quality: ["prescription_quality"],
  prescription_output: ["prescription_output"],
  tool_type: ["tool_type"],
};

const tools = JSON.parse(await readFile("src/data/tools_v4.json", "utf8"));
const bySlug = new Map(tools.map((t) => [t.slug || t.id, t]));

console.log(
  `\nMode : ${APPLY ? "APPLICATION RÉELLE (--apply)" : "DRY-RUN (aucune écriture)"}`
);
console.log(`Cible : ${SUPABASE_URL}`);
console.log(`Fiches : ${SLUGS.length}\n`);

let updated = 0;
let skippedNoRow = 0;
let missingJson = 0;
let errors = 0;

for (const slug of SLUGS) {
  const t = bySlug.get(slug);
  if (!t) {
    console.warn(`SKIP  ${slug} — absent du JSON local`);
    missingJson++;
    continue;
  }

  const { data: row, error: selErr } = await supabase
    .from("tools")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (selErr) {
    console.error(`ERR   ${slug} — lecture : ${selErr.message}`);
    errors++;
    continue;
  }
  if (!row) {
    console.warn(`SKIP  ${slug} — pas de ligne Supabase (servi via JSON)`);
    skippedNoRow++;
    continue;
  }

  const cols = new Set(Object.keys(row));
  const update = {};
  for (const [jsonField, candidates] of Object.entries(FIELD_MAP)) {
    if (t[jsonField] === undefined) continue;
    const col = candidates.find((c) => cols.has(c));
    if (col) update[col] = t[jsonField];
  }

  if (Object.keys(update).length === 0) {
    console.warn(`SKIP  ${slug} — aucune colonne correspondante`);
    continue;
  }

  if (!APPLY) {
    console.log(`DRY   ${slug} — colonnes : ${Object.keys(update).join(", ")}`);
    updated++;
    continue;
  }

  const { error: updErr } = await supabase
    .from("tools")
    .update(update)
    .eq("slug", slug);

  if (updErr) {
    console.error(`ERR   ${slug} — écriture : ${updErr.message}`);
    errors++;
  } else {
    console.log(`OK    ${slug} — ${Object.keys(update).length} colonnes mises à jour`);
    updated++;
  }
}

console.log("\n=== Résumé ===");
console.log(`${APPLY ? "Mises à jour" : "À mettre à jour"} : ${updated}`);
console.log(`Sans ligne Supabase (déjà OK via JSON) : ${skippedNoRow}`);
console.log(`Absents du JSON : ${missingJson}`);
console.log(`Erreurs : ${errors}`);
if (!APPLY) {
  console.log("\nDry-run terminé. Relance avec --apply pour écrire réellement.");
}
