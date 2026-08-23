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

  // L'eligibilite se juge PAR FAMILLE DE ROUTE, pas sur le total. Une page
  // /plugins/<hote> ne liste que des plugins : compter tous les rattachements
  // confondus autoriserait des pages vides. Framer totalise 3 outils mais un
  // seul plugin ; Photoshop en totalise 3 dont aucun plugin (ce sont des apps
  // compatibles). Le total sert au filtre « Fonctionne avec », pas aux pages.
  const ROUTES = [
    { segment: "plugins", champ: "plugins", forme: "plugin" },
    { segment: "libraries", champ: "libs", forme: "library" },
    { segment: "mcp", champ: "mcp", forme: "mcp" },
  ];

  console.log(`Seuil : ${SEUIL} outil(s) minimum.\n`);
  console.log("── Pages dédiées, par famille de route ──");
  for (const route of ROUTES) {
    const eligibles = rows.filter((r) => r[route.champ] >= SEUIL);
    console.log(`\n/${route.segment}/ → ${eligibles.length} page(s) :`);
    if (!eligibles.length) console.log("   (aucune)");
    for (const r of eligibles) console.log(`   ${String(r[route.champ]).padStart(3)}  /${route.segment}/${r.hote}`);
    const justeEnDessous = rows.filter((r) => r[route.champ] > 0 && r[route.champ] < SEUIL);
    if (justeEnDessous.length) {
      console.log(`   sous le seuil : ${justeEnDessous.map((r) => `${r.hote}(${r[route.champ]})`).join(", ")}`);
    }
  }

  // Le filtre, lui, raisonne sur tous les rattachements : un utilisateur qui
  // coche « Figma » veut tout ce qui fonctionne avec Figma, plugins ou non.
  const filtrables = rows.filter((r) => r.n > 0);
  console.log(`\n── Filtre « Fonctionne avec » : ${filtrables.length} option(s) ──`);
  for (const r of filtrables) {
    const detail = [
      r.plugins ? `${r.plugins} plugin` : null,
      r.libs ? `${r.libs} library` : null,
      r.mcp ? `${r.mcp} mcp` : null,
      r.apps ? `${r.apps} app` : null,
    ].filter(Boolean).join(", ");
    console.log(`   ${String(r.n).padStart(3)}  ${r.hote.padEnd(24)} (${detail})`);
  }
  console.log(`\nPages → sitemap et prérendu. Options du filtre → dérivées de la liste ci-dessus.`);
} finally {
  await sql.end({ timeout: 5 });
}
