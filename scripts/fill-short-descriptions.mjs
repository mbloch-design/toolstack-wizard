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
const PLACEHOLDER = /^(Outil ou ressource|Outil spécialisé)/;

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
  // (ex. teamwork/wrike, learnworlds/teachable), en plus des placeholders.
  const dupRows = await sql`
    select short_description sd from public.tools
    where content_status='published' and coalesce(short_description,'')<>''
    group by short_description having count(*)>1`;
  const DUPES = new Set(dupRows.map((r) => r.sd));

  for (const file of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
    const j = JSON.parse(readFileSync(`${DIR}/${file}`, "utf8"));
    const what = j?.facts?.what;
    if (!j.sources || !what) { continue; } // seulement les fiches sourcées avec un "what"
    const slug = j.slug;
    const [row] = await sql`select short_description sd, long_description ld from public.tools where slug=${slug}`;
    if (!row) { console.log(`  ? ${slug} — absent en base`); missing++; continue; }

    const fixSd = row.sd == null || PLACEHOLDER.test(row.sd) || DUPES.has(row.sd);
    const fixLd = row.ld == null || PLACEHOLDER.test(row.ld) || DUPES.has(row.ld);
    if (!fixSd && !fixLd) { skipped++; continue; } // déjà du vrai contenu

    if (APPLY) {
      if (fixSd && fixLd) await sql`update public.tools set short_description=${what}, long_description=${what} where slug=${slug}`;
      else if (fixSd)     await sql`update public.tools set short_description=${what} where slug=${slug}`;
      else                await sql`update public.tools set long_description=${what} where slug=${slug}`;
    }
    console.log(`  ${APPLY ? "✓" : "→"} ${slug}${fixSd ? " [sd]" : ""}${fixLd ? " [ld]" : ""}  « ${what.slice(0, 55)}… »`);
    updated++;
  }
  console.log(`\n${APPLY ? "Appliqué" : "Dry-run"} : ${updated} à mettre à jour, ${skipped} déjà OK, ${missing} absents.`);
  if (!APPLY) console.log("→ relance avec --apply pour écrire en base.");
} catch (e) {
  console.error("✗", e.message); process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
