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
  const FORM_FACTORS = ["app", "plugin", "library", "mcp", "suite", "asset"];

  const formatsInconnus = await sql`
    select coalesce(form_factor, '(null)') v, count(*)::int n from public.tools
    where content_status = 'published' and (form_factor is null or form_factor <> all(${FORM_FACTORS}))
    group by 1 order by n desc`;

  // Un plugin, une bibliotheque ou un serveur MCP doit etre rattache a quelque
  // chose, sinon il ne remonte sur aucune page ni dans aucun filtre.
  //
  // Le controle porte sur works_with et NON sur host_app : un plugin peut viser
  // plusieurs hotes (Typescale s'installe dans Figma, Adobe XD et Penpot), et
  // host_app, mono-value, ne sait pas l'exprimer. Dans ce cas host_app reste
  // nul et works_with porte les trois — le rattachement existe bien.
  const sansRattachement = await sql`
    select slug, form_factor from public.tools
    where content_status = 'published' and form_factor in ('plugin', 'library', 'mcp')
      and jsonb_array_length(coalesce(works_with, '[]'::jsonb)) = 0
    order by slug`;

  // INVARIANT : works_with contient toujours host_app. Le filtre « Works with »
  // n'interroge que works_with ; si un plugin y manquait, il serait absent du
  // filtre de son propre hote sans que rien ne le signale.
  const incoherents = await sql`
    select slug, host_app from public.tools
    where host_app is not null
      and not (coalesce(works_with, '[]'::jsonb) ? host_app)
    order by slug`;

  // Une compatibilite declaree vers un slug inexistant ne remontera jamais
  // dans le filtre : meme classe de defaut que les 19 host_app morts.
  const compatMortes = await sql`
    select t.slug, v as cible from public.tools t,
      jsonb_array_elements_text(coalesce(t.works_with, '[]'::jsonb)) v
    where not exists (select 1 from public.tools h where h.slug = v)
    order by t.slug`;

  let ko = false;
  if (incoherents.length) {
    ko = true;
    console.log(`⚠️  ${incoherents.length} fiche(s) dont works_with ne contient pas son host_app :`);
    for (const r of incoherents.slice(0, 20)) console.log(`   ${r.slug} → ${r.host_app}`);
    if (incoherents.length > 20) console.log(`   … +${incoherents.length - 20}`);
  }
  if (compatMortes.length) {
    ko = true;
    console.log(`\n⚠️  ${compatMortes.length} compatibilité(s) works_with vers un slug inexistant :`);
    for (const r of compatMortes.slice(0, 20)) console.log(`   ${r.slug} → ${r.cible}`);
  }
  if (formatsInconnus.length) {
    ko = true;
    console.log(`⚠️  form_factor hors vocabulaire (${FORM_FACTORS.join(", ")}) :`);
    for (const r of formatsInconnus) console.log(`   ${r.v} — ${r.n} fiche(s)`);
  }
  if (sansRattachement.length) {
    ko = true;
    console.log(`\n⚠️  ${sansRattachement.length} fiche(s) rattachable(s) sans aucun works_with :`);
    for (const r of sansRattachement.slice(0, 20)) console.log(`   ${r.slug} (${r.form_factor})`);
    if (sansRattachement.length > 20) console.log(`   … +${sansRattachement.length - 20}`);
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
