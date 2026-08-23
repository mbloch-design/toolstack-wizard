#!/usr/bin/env node
// Hotes eligibles a une page dediee (/plugins/<hote>, /libraries/<hote>...).
//
// REGLE : une page n'existe que si elle a de quoi la remplir. En dessous du
// seuil, pas de page, pas d'entree de sitemap, pas d'option dans le filtre.
// Une page « 0 outil » indexee est du contenu mince : elle dilue le site et
// deçoit le visiteur. La reference Toolfolio affiche « 0 tools » sur
// /integrations/figma — c'est precisement ce qu'il faut eviter.
//
//   node scripts/hosts-eligibles.mjs            # seuil par defaut
//   node scripts/hosts-eligibles.mjs --seuil=5
import { readFileSync } from "node:fs";
import postgres from "postgres";

const SEUIL = parseInt(process.argv.find((a) => a.startsWith("--seuil="))?.split("=")[1] ?? "3");
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
    select v as hote, h.name, count(*)::int n,
           count(*) filter (where t.form_factor = 'plugin')::int plugins,
           count(*) filter (where t.form_factor = 'library')::int libs,
           count(*) filter (where t.form_factor = 'mcp')::int mcp,
           count(*) filter (where t.form_factor = 'app')::int apps
    from public.tools t,
         jsonb_array_elements_text(coalesce(t.works_with, '[]'::jsonb)) v
    join public.tools h on h.slug = v
    where t.content_status = 'published' and h.content_status = 'published'
    group by v, h.name order by n desc, v`;

  const ok = rows.filter((r) => r.n >= SEUIL);
  const insuffisants = rows.filter((r) => r.n < SEUIL);

  console.log(`Seuil : ${SEUIL} outil(s) minimum pour ouvrir une page.\n`);
  console.log(`✅ ${ok.length} hôte(s) éligible(s) :`);
  for (const r of ok) {
    const detail = [
      r.plugins ? `${r.plugins} plugin` : null,
      r.libs ? `${r.libs} library` : null,
      r.mcp ? `${r.mcp} mcp` : null,
      r.apps ? `${r.apps} app` : null,
    ].filter(Boolean).join(", ");
    console.log(`   ${String(r.n).padStart(3)}  ${r.hote.padEnd(24)} (${detail})`);
  }
  console.log(`\n⏳ ${insuffisants.length} hôte(s) sous le seuil — pas de page, pas de filtre :`);
  for (const r of insuffisants) console.log(`   ${String(r.n).padStart(3)}  ${r.hote}`);
  console.log(`\nÀ brancher sur la génération du sitemap et sur les options du filtre.`);
} finally {
  await sql.end({ timeout: 5 });
}
