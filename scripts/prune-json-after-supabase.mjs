/**
 * prune-json-after-supabase.mjs
 *
 * Retire des entrées de src/data/tools_v4.json UNIQUEMENT après avoir
 * confirmé que le slug existe bien dans la table `tools` de Supabase.
 * Objectif : faire maigrir le JSON au fil de l'eau, vers une bascule
 * complète sur Supabase à terme.
 *
 * Garde-fous :
 *  - Pour chaque slug, vérifie d'abord sa présence dans Supabase (lecture).
 *    S'il n'y est pas, on NE retire PAS l'entrée du JSON (sinon la fiche casse).
 *  - Suppression par découpage texte (préserve le formatage du reste du
 *    fichier, diff minimal). Les éléments du tableau sont au niveau "  {".
 *  - Ne touche PAS tools_index.json (listings/sitemap restent complets).
 *  - DRY-RUN par défaut. --apply pour écrire.
 *
 * Usage :
 *   node scripts/prune-json-after-supabase.mjs <slug...>           # aperçu
 *   node scripts/prune-json-after-supabase.mjs --apply <slug...>   # écrit
 */

import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";

const APPLY = process.argv.includes("--apply");
const SLUGS = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (SLUGS.length === 0) {
  console.error("Donne au moins un slug à retirer.");
  process.exit(1);
}

// Lecture seule : la clé anon (publishable) suffit pour vérifier l'existence.
const SUPABASE_URL = "https://rtfyfuwfdpnsogovkwai.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZnlmdXdmZHBuc29nb3Zrd2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTcyMDcsImV4cCI6MjA4ODg3MzIwN30.pwpmh9Qe8dLZFq1rMqtCRmEMJ9dnbcdvT_B4CjIu4Xc";
const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false },
});

const PATH = "src/data/tools_v4.json";
let text = await readFile(PATH, "utf8");
let lines = text.split("\n");

// Trouve les bornes [start, end] (indices de lignes) de l'élément de tableau
// qui contient la ligne `    "id": "<slug>",`. L'ouverture est le `  {` qui
// précède, la fermeture le premier `  }` / `  },` au même niveau (2 espaces).
function findElementBounds(slug) {
  const idLine = `    "id": "${slug}",`;
  const idx = lines.findIndex((l) => l === idLine);
  if (idx === -1) return null;
  let start = -1;
  for (let i = idx; i >= 0; i--) {
    if (lines[i] === "  {") { start = i; break; }
    // un `  }` rencontré avant le `  {` voudrait dire qu'on a changé d'élément
    if (lines[i] === "  }," || lines[i] === "  }") break;
  }
  if (start === -1) return null;
  let end = -1;
  for (let i = idx; i < lines.length; i++) {
    if (lines[i] === "  }," || lines[i] === "  }") { end = i; break; }
  }
  if (end === -1) return null;
  const lastEntry = lines[end] === "  }"; // dernier élément du tableau
  return { start, end, lastEntry };
}

let removed = 0, kept = 0, notFoundDb = 0, notFoundJson = 0;

for (const slug of SLUGS) {
  const { data, error } = await supabase
    .from("tools").select("slug").eq("slug", slug).maybeSingle();
  if (error) { console.error(`ERR   ${slug} — lecture Supabase : ${error.message}`); kept++; continue; }
  if (!data) { console.warn(`GARDE ${slug} — absent de Supabase, on NE retire PAS du JSON`); notFoundDb++; kept++; continue; }

  const b = findElementBounds(slug);
  if (!b) { console.warn(`SKIP  ${slug} — entrée introuvable dans le JSON (déjà retirée ?)`); notFoundJson++; continue; }

  if (b.lastEntry) {
    // dernier élément : retirer aussi la virgule de l'élément précédent
    console.warn(`SKIP  ${slug} — dernier élément du tableau, retrait manuel requis`);
    kept++;
    continue;
  }

  if (!APPLY) {
    console.log(`DRY   ${slug} — retirerait les lignes ${b.start + 1}-${b.end + 1}`);
    removed++;
    continue;
  }
  lines.splice(b.start, b.end - b.start + 1);
  console.log(`OK    ${slug} — entrée retirée du JSON`);
  removed++;
}

if (APPLY && removed > 0) {
  const out = lines.join("\n");
  JSON.parse(out); // valide avant d'écrire
  await writeFile(PATH, out);
}

console.log("\n=== Résumé ===");
console.log(`${APPLY ? "Retirées" : "À retirer"} : ${removed}`);
console.log(`Gardées (sécurité) : ${kept}  | absentes Supabase : ${notFoundDb}  | déjà hors JSON : ${notFoundJson}`);
if (!APPLY) console.log("\nDry-run terminé. Relance avec --apply pour écrire.");
