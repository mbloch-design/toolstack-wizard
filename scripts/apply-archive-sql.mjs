#!/usr/bin/env node
// Exécute les fichiers SQL d'archivage (remplace psql, absent de la machine).
// Usage : node scripts/apply-archive-sql.mjs
// Connexion identique aux autres scripts catalogue (.env.preprod).
import { readFileSync } from "node:fs";
import postgres from "postgres";

for (const l of readFileSync(".env.preprod", "utf8").split(/\r?\n/)) {
  const x = l.match(/^([A-Za-z_]\w*)=(.*)$/);
  if (x && !process.env[x[1]]) process.env[x[1]] = x[2].trim().replace(/^["']|["']$/g, "");
}

const sql = postgres({
  host: "aws-1-eu-central-1.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  username: `postgres.${process.env.VITE_SUPABASE_PROJECT_ID}`,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: "require",
  max: 1,
});

const files = [
  // Publication conditionnelle des outils créés en draft : passe en published
  // uniquement ce qui a déjà un verdict et une description en base.
  "scripts/sql/publish-recent-tools.sql",
  "scripts/sql/og-images-recent-tools.sql",
  "scripts/sql/archive-adobe-duplicates.sql",
  "scripts/sql/archive-feature-aliases.sql",
  "scripts/sql/archive-placeholder-recategorization.sql",
  "scripts/sql/archive-shield-discontinued.sql",
  "scripts/sql/archive-avocode-discontinued.sql",
  "scripts/sql/archive-repass-final.sql",
  "scripts/sql/archive-repass-flags.sql",
  "scripts/sql/archive-repass-flags-2.sql",
  "scripts/sql/archive-repass-flags-3.sql",
  "scripts/sql/archive-repass-flags-4.sql",
  "scripts/sql/archive-repass-flags-5.sql",
  "scripts/sql/archive-invision-discontinued.sql",
  "scripts/sql/archive-specify-discontinued.sql",
  "scripts/sql/archive-repass-flags-6.sql",
  "scripts/sql/archive-wunderlist.sql",
  "scripts/sql/archive-repass-flags-7.sql",
  "scripts/sql/archive-repass-flags-8.sql",
  "scripts/sql/archive-repass-flags-9.sql",
  "scripts/sql/archive-repass-flags-10.sql",
  "scripts/sql/archive-repass-flags-11.sql",
  "scripts/sql/archive-repass-flags-12.sql",
];

let totalArchived = 0;
try {
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    const res = await sql.unsafe(text);
    // postgres renvoie le résultat du dernier statement ; count = lignes affectées
    const n = res.count ?? 0;
    totalArchived += n;
    console.log(`  ✓ ${f} — ${n} fiche(s) archivée(s)`);
  }
  // Récapitulatif
  const [{ n }] = await sql`select count(*)::int n from public.tools where content_status='archived'`;
  console.log(`\nTotal archivé en base : ${n} fiche(s). (cette exécution : ${totalArchived})`);
} catch (e) {
  console.error("✗ Échec :", e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
