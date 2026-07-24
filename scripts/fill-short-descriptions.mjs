#!/usr/bin/env node
// Renseigne short_description / long_description (FR) à partir de facts.what des
// fiches sourcées, UNIQUEMENT quand la valeur actuelle est le texte générique
// « Outil ou ressource… » / « Outil spécialisé… » (ne touche pas à du bon contenu).
//
//   node scripts/fill-short-descriptions.mjs            # dry-run (lecture seule)
//   node scripts/fill-short-descriptions.mjs --apply    # écrit en base
//
// NB : n'écrit que le FR. Les descriptions EN (short_description_en) restent à
// traiter séparément (pas de facts.what en anglais dans les JSON).
import { readFileSync, readdirSync } from "node:fs";
import postgres from "postgres";

const APPLY = process.argv.includes("--apply");
const DIR = "research/bundle-editorial";
// Gabarits génériques à remplacer : le placeholder court (short_description)
// ET le gabarit long_description « <X> est référencé pour couvrir un besoin
// précis dans les stacks … » (le nom en tête, donc non capté par ^placeholder).
const PLACEHOLDER = /^(Outil ou ressource|Outil spécialisé)|référencé pour couvrir un besoin précis dans les stacks/;
const PLACEHOLDER_EN = /^(Tool or resource|Tool special)|referenced to cover a specific need/;
const WHAT_EN = JSON.parse(readFileSync("research/what-en.json", "utf8"));

for (const l of readFileSync(".env.preprod", "utf8").split(/\r?\n/)) {
  const x = l.match(/^([A-Za-z_]\w*)=(.*)$/);
  if (x && !process.env[x[1]]) process.env[x[1]] = x[2].trim().replace(/^["']|["']$/g, "");
}
const sql = postgres({
  host: "aws-1-eu-central-1.pooler.supabase.com", port: 5432, database: "postgres",
  username: `postgres.${process.env.VITE_SUPABASE_PROJECT_ID}`,
  password: process.env.SUPABASE_DB_PASSWORD, ssl: "require", max: 1,
});

let updated = 0, skipped = 0, missing = 0;
try {
  // Descriptions partagées par >1 fiche publiée = doublons paresseux à remplacer
  // (ex. teamwork/wrike, learnworlds/teachable), en plus des placeholders. FR + EN.
  const dupFr = await sql`select short_description sd from public.tools where content_status='published' and coalesce(short_description,'')<>'' group by short_description having count(*)>1`;
  const dupEn = await sql`select short_description_en sd from public.tools where content_status='published' and coalesce(short_description_en,'')<>'' group by short_description_en having count(*)>1`;
  const DUPES = new Set(dupFr.map((r) => r.sd));
  const DUPES_EN = new Set(dupEn.map((r) => r.sd));
  const isGenericFr = (v) => v == null || PLACEHOLDER.test(v) || DUPES.has(v);
  const isGenericEn = (v) => v == null || PLACEHOLDER_EN.test(v) || DUPES_EN.has(v);

  for (const file of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
    const j = JSON.parse(readFileSync(`${DIR}/${file}`, "utf8"));
    const what = j?.facts?.what;
    if (!j.sources || !what) { continue; } // seulement les fiches sourcées avec un "what"
    const slug = j.slug;
    const whatEn = WHAT_EN[slug]; // description EN (map research/what-en.json)
    const [row] = await sql`select short_description sd, long_description ld, short_description_en sden, long_description_en lden from public.tools where slug=${slug}`;
    if (!row) { console.log(`  ? ${slug} — absent en base`); missing++; continue; }

    const set = {};
    if (isGenericFr(row.sd)) set.short_description = what;
    if (isGenericFr(row.ld)) set.long_description = what;
    if (whatEn && isGenericEn(row.sden)) set.short_description_en = whatEn;
    if (whatEn && isGenericEn(row.lden)) set.long_description_en = whatEn;

    const cols = Object.keys(set);
    if (cols.length === 0) { skipped++; continue; }
    if (APPLY) await sql`update public.tools set ${sql(set)} where slug=${slug}`;
    const tags = cols.map((c) => c.replace("short_description", "sd").replace("long_description", "ld").replace("_en", ":en")).join(" ");
    console.log(`  ${APPLY ? "✓" : "→"} ${slug.padEnd(22)} [${tags}]`);
    updated++;
  }
  console.log(`\n${APPLY ? "Appliqué" : "Dry-run"} : ${updated} à mettre à jour, ${skipped} déjà OK, ${missing} absents.`);
  if (!APPLY) console.log("→ relance avec --apply pour écrire en base.");
} catch (e) {
  console.error("✗", e.message); process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
