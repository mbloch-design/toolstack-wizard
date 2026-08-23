#!/usr/bin/env node
// Audite les captures de secours deja publiees (public/og-screenshots).
//
// Deux defauts connus, tous deux constates en production :
//   - page de challenge anti-bot capturee a la place du produit (personio,
//     quillbot : « We're verifying your browser »)
//   - page blanche ou reduite a un spinner (jquery, openai)
//
// Le garde-fou ajoute a screenshot-fallback-images.mjs empeche d'en creer de
// nouvelles, mais ne dit rien des captures anterieures. Ce script les relit.
//
//   node scripts/audit-screenshots.mjs            # audite tout
//   node scripts/audit-screenshots.mjs --limit=40
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import postgres from "postgres";

for (const l of readFileSync(".env.preprod", "utf8").split(/\r?\n/)) {
  const x = l.match(/^([A-Za-z_]\w*)=(.*)$/);
  if (x && !process.env[x[1]]) process.env[x[1]] = x[2].trim().replace(/^["']|["']$/g, "");
}
const LIMIT = parseInt(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "9999");
const DIR = "public/og-screenshots";
const BLANK_BYTES = 15000; // en dessous : page blanche ou spinner, verifie a la main
const CHALLENGE = /Just a moment|verifying your browser|Performing security verification|Checking your browser|cf-browser-verification|Enable JavaScript and cookies to continue|Attention Required/i;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const sql = postgres({
  host: "aws-1-eu-central-1.pooler.supabase.com", port: 5432, database: "postgres",
  username: `postgres.${process.env.VITE_SUPABASE_PROJECT_ID}`,
  password: process.env.SUPABASE_DB_PASSWORD, ssl: "require", max: 1,
});

const suspects = { blanches: [], challenge: [], injoignable: [] };
try {
  const rows = await sql`
    select slug, website_url from public.tools
    where og_image_url like '%og-screenshots%' and website_url is not null
    order by slug`;
  const locales = new Set(readdirSync(DIR).filter((f) => f.endsWith(".png")).map((f) => f.replace(".png", "")));
  const cibles = rows.filter((r) => locales.has(r.slug)).slice(0, LIMIT);
  console.log(`${cibles.length} captures a auditer\n`);

  let i = 0;
  for (const r of cibles) {
    i++;
    const taille = statSync(`${DIR}/${r.slug}.png`).size;
    if (taille < BLANK_BYTES) suspects.blanches.push({ slug: r.slug, taille });

    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch(r.website_url, { signal: ctrl.signal, headers: { "user-agent": UA } });
      clearTimeout(t);
      const head = (await res.text()).slice(0, 4000);
      if (CHALLENGE.test(head)) suspects.challenge.push({ slug: r.slug, url: r.website_url });
    } catch (e) {
      suspects.injoignable.push({ slug: r.slug, raison: e.message.slice(0, 40) });
    }
    if (i % 25 === 0) console.log(`  ${i}/${cibles.length}…`);
  }
} finally {
  await sql.end({ timeout: 5 });
}

writeFileSync("/tmp/audit-screenshots.json", JSON.stringify(suspects, null, 1));
console.log(`\n── Résultat ──`);
console.log(`Pages de challenge  : ${suspects.challenge.length}  ${suspects.challenge.map((x) => x.slug).join(", ")}`);
console.log(`Captures blanches   : ${suspects.blanches.length}  ${suspects.blanches.map((x) => x.slug).join(", ")}`);
console.log(`Sites injoignables  : ${suspects.injoignable.length}  ${suspects.injoignable.map((x) => x.slug).join(", ")}`);
console.log(`\nDétail dans /tmp/audit-screenshots.json`);
