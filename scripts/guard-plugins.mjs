#!/usr/bin/env node
// Garde-fou d'integrite des liens plugin -> logiciel hote.
//
// host_app est une cle etrangere de fait, sans contrainte en base : rien
// n'empeche d'y ecrire un slug qui n'existe pas. C'est ainsi que 19 fiches
// (Bodymovin, Newton3, Trapcode, Magic Bullet...) ont pointe dans le vide sans
// que cela se voie nulle part, jusqu'a un audit manuel.
//
// A lancer avant toute vague d'ajout de plugins :
//   node scripts/guard-plugins.mjs
// Sort en code 1 si un lien ne resout pas, pour bloquer une CI ou un script.
import { readFileSync } from "node:fs";
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
  const morts = await sql`
    select t.slug, t.host_app from public.tools t
    where t.host_app is not null
      and not exists (select 1 from public.tools h where h.slug = t.host_app)
    order by t.host_app, t.slug`;

  const hotesArchives = await sql`
    select t.slug, t.host_app from public.tools t
    join public.tools h on h.slug = t.host_app
    where t.host_app is not null and t.content_status = 'published'
      and h.content_status <> 'published'
    order by t.slug`;

  const bundlesMorts = await sql`
    select t.slug, t.bundle_parent from public.tools t
    where t.bundle_parent is not null
      and not exists (select 1 from public.tools h where h.slug = t.bundle_parent)
    order by t.slug`;

  // Vocabulaire ferme de form_factor. Etendre le modele = ajouter une valeur
  // ICI et dans scripts/sql/form-factor.sql, jamais ecrire une valeur libre en
  // base. C'est cette gouvernance qui evite de refaire le nettoyage de
  // taxonomie : covers avait derive a 590 termes faute de liste fermee.
  const FORM_FACTORS = ["app", "plugin", "library", "mcp", "suite"];

  const formatsInconnus = await sql`
    select coalesce(form_factor, '(null)') v, count(*)::int n from public.tools
    where content_status = 'published' and (form_factor is null or form_factor <> all(${FORM_FACTORS}))
    group by 1 order by n desc`;

  // Un plugin sans hote n'est rattachable a rien : il ne remontera sur aucune
  // page /plugins/<hote>. Symetriquement, un hote declare sans forme adaptee
  // signale un typage oublie.
  const pluginsSansHote = await sql`
    select slug from public.tools
    where content_status = 'published' and form_factor in ('plugin', 'library', 'mcp')
      and host_app is null order by slug`;

  let ko = false;
  if (formatsInconnus.length) {
    ko = true;
    console.log(`⚠️  form_factor hors vocabulaire (${FORM_FACTORS.join(", ")}) :`);
    for (const r of formatsInconnus) console.log(`   ${r.v} — ${r.n} fiche(s)`);
  }
  if (pluginsSansHote.length) {
    ko = true;
    console.log(`\n⚠️  ${pluginsSansHote.length} fiche(s) de forme rattachable mais sans host_app :`);
    for (const r of pluginsSansHote.slice(0, 20)) console.log(`   ${r.slug}`);
    if (pluginsSansHote.length > 20) console.log(`   … +${pluginsSansHote.length - 20}`);
  }
  if (morts.length) {
    ko = true;
    console.log(`⚠️  ${morts.length} lien(s) host_app vers un slug inexistant :`);
    for (const r of morts) console.log(`   ${r.slug} → ${r.host_app}`);
  }
  if (hotesArchives.length) {
    ko = true;
    console.log(`\n⚠️  ${hotesArchives.length} plugin(s) publié(s) dont l'hôte ne l'est pas :`);
    for (const r of hotesArchives) console.log(`   ${r.slug} → ${r.host_app}`);
  }
  if (bundlesMorts.length) {
    ko = true;
    console.log(`\n⚠️  ${bundlesMorts.length} lien(s) bundle_parent vers un slug inexistant :`);
    for (const r of bundlesMorts) console.log(`   ${r.slug} → ${r.bundle_parent}`);
  }
  if (!ko) console.log("✅ Liens host_app et bundle_parent résolus, form_factor conforme au vocabulaire.");
  process.exitCode = ko ? 1 : 0;
} finally {
  await sql.end({ timeout: 5 });
}
