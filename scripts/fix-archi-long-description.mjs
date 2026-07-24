#!/usr/bin/env node
// Neutralise le long_description générique du cluster archi/CAO :
//   « <Nom> aide les architectes d'intérieur à couvrir un besoin précis :
//     <short_description>. À garder si… À éviter si… »
// = cadrage persona (souvent inexact) + short_description + boilerplate.
// On remplace long_description par le short_description (déjà propre) ; idem EN.
// Aucune invention. Dry-run par défaut ; --apply pour écrire.
//
//   node scripts/fix-archi-long-description.mjs
//   node scripts/fix-archi-long-description.mjs --apply
import { readFileSync } from "node:fs";
import postgres from "postgres";

const APPLY = process.argv.includes("--apply");
for (const l of readFileSync(".env.preprod", "utf8").split(/\r?\n/)) {
  const x = l.match(/^([A-Za-z_]\w*)=(.*)$/);
  if (x && !process.env[x[1]]) process.env[x[1]] = x[2].trim().replace(/^["']|["']$/g, "");
}
const sql = postgres({
  host: "aws-1-eu-central-1.pooler.supabase.com", port: 5432, database: "postgres",
  username: `postgres.${process.env.VITE_SUPABASE_PROJECT_ID}`,
  password: process.env.SUPABASE_DB_PASSWORD, ssl: "require", max: 1,
});

try {
  const rows = await sql`
    select slug, short_description sd, short_description_en sden
    from public.tools
    where content_status='published'
      and long_description ilike '%aide les architectes d''intérieur à couvrir un besoin précis%'
      and coalesce(short_description,'') <> ''`;
  console.log(`${rows.length} fiche(s) archi/CAO à neutraliser :`);
  for (const r of rows) {
    if (APPLY) {
      const en = r.sden || r.sd;
      await sql`update public.tools set long_description=${r.sd}, long_description_en=${en} where slug=${r.slug}`;
    }
    console.log(`  ${APPLY ? "✓" : "→"} ${r.slug}`);
  }
  console.log(`\n${APPLY ? "Appliqué" : "Dry-run"} : ${rows.length} fiche(s).`);
  if (!APPLY) console.log("→ relance avec --apply pour écrire.");
} catch (e) {
  console.error("✗", e.message); process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
