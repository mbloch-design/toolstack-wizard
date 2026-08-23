#!/usr/bin/env node
// Execute un ou plusieurs fichiers SQL passes en argument, dans l'ordre donne.
//   node scripts/apply-sql-file.mjs scripts/sql/a.sql scripts/sql/b.sql
//
// Complement de apply-archive-sql.mjs, qui porte une liste figee : ce lanceur
// evite d'avoir a modifier cette liste pour une migration ponctuelle, et donc
// les conflits quand plusieurs sessions travaillent sur le meme depot.
import { readFileSync, existsSync } from "node:fs";
import postgres from "postgres";

for (const l of readFileSync(".env.preprod", "utf8").split(/\r?\n/)) {
  const x = l.match(/^([A-Za-z_]\w*)=(.*)$/);
  if (x && !process.env[x[1]]) process.env[x[1]] = x[2].trim().replace(/^["']|["']$/g, "");
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage : node scripts/apply-sql-file.mjs <fichier.sql> [autre.sql ...]");
  process.exit(1);
}
for (const f of files) {
  if (!existsSync(f)) {
    console.error(`fichier introuvable : ${f}`);
    process.exit(1);
  }
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

let failed = false;
try {
  for (const f of files) {
    try {
      // Sur un fichier multi-instructions, postgres.js ne remonte pas un
      // compte agrégé fiable : il affichait « 0 ligne(s) touchée(s) » sur des
      // migrations qui avaient pourtant modifié des centaines de lignes. Un
      // faux zéro sur un succès est pire que pas de compteur du tout, donc on
      // n'annonce un nombre que lorsqu'il est réellement disponible.
      const res = await sql.unsafe(readFileSync(f, "utf8"));
      const counts = (Array.isArray(res) ? res : [res])
        .map((r) => r?.count)
        .filter((n) => typeof n === "number");
      const touched = counts.length ? counts.reduce((a, b) => a + b, 0) : null;
      console.log(`  ✓ ${f}${touched === null ? " — appliqué" : ` — ${touched} ligne(s) touchée(s)`}`);
    } catch (e) {
      failed = true;
      console.error(`  ✗ ${f} — ${e.message}`);
      break; // les migrations sont ordonnées : on n'enchaîne pas sur un échec
    }
  }
} finally {
  await sql.end({ timeout: 5 });
}
process.exitCode = failed ? 1 : 0;
