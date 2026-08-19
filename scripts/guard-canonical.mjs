#!/usr/bin/env node
// Garde-fou : liste les fiches locales qui visent un outil au contrat canonical
// (ou research_status=approved). Ces outils ont un éditorial plus riche dans
// catalog_private ; les écraser avec du niveau A est une régression.
//   node scripts/guard-canonical.mjs
import { readFileSync, readdirSync } from "node:fs";
import postgres from "postgres";
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
  const slugs = readdirSync("research/bundle-editorial").filter(f => f.endsWith(".json")).map(f => f.replace(".json", ""));
  const rows = await sql`
    select slug, data_contract, research_status from public.tools
    where slug = any(${slugs}) and (data_contract = 'canonical' or research_status = 'approved')
    order by slug`;
  if (rows.length === 0) {
    console.log("✅ Aucune fiche niveau A ne vise un outil canonical.");
  } else {
    console.log(`⚠️  ${rows.length} fiche(s) à retirer de research/bundle-editorial/ :`);
    for (const r of rows) console.log(`   ${r.slug} (${r.data_contract}/${r.research_status})`);
    process.exitCode = 1;
  }
} finally {
  await sql.end({ timeout: 5 });
}
