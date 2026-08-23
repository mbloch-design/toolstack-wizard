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

  let ko = false;
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
  if (!ko) console.log("✅ Tous les liens host_app et bundle_parent résolvent vers une fiche publiée.");
  process.exitCode = ko ? 1 : 0;
} finally {
  await sql.end({ timeout: 5 });
}
