#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import { resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const generatedDirs = ["dist", "dist-ssr"];
const trashRoot = ".build-trash";
const archivesConservees = 1;

function archiveGeneratedDirs() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  for (const dir of generatedDirs) {
    const source = resolve(dir);

    if (!existsSync(source)) {
      continue;
    }

    mkdirSync(resolve(trashRoot), { recursive: true });
    const archived = resolve(trashRoot, `${dir}-${timestamp}-${process.pid}`);

    try {
      renameSync(source, archived);
      console.log(`  ${dir} → ${trashRoot}/${dir}-${timestamp}-${process.pid}`);
    } catch (error) {
      console.error(`✖ Impossible d'écarter ${dir} avant le build.`);
      console.error(
        "  Le dossier généré semble verrouillé ou corrompu. Déplace-le manuellement puis relance le build.",
      );
      console.error(`  Détail : ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
}

/**
 * `archiveGeneratedDirs` empile un dossier par build sans jamais rien reprendre :
 * cinq builds suffisaient à immobiliser plusieurs gigaoctets. Seule la dernière
 * archive est conservée, comme point de comparaison si un build casse quelque chose.
 */
function purgeOldArchives() {
  const root = resolve(trashRoot);

  if (!existsSync(root)) {
    return;
  }

  const entries = readdirSync(root);
  const obsoletes = [];

  for (const dir of generatedDirs) {
    // `dist-ssr-…` commence lui aussi par `dist-` : l'horodatage est capturé
    // strictement pour ne pas confondre les deux familles.
    const motif = new RegExp(`^${dir}-\\d{4}-\\d{2}-\\d{2}T[\\d-]+Z-\\d+$`);
    const archives = entries.filter((entry) => motif.test(entry)).sort().reverse();
    obsoletes.push(...archives.slice(archivesConservees));
  }

  if (obsoletes.length === 0) {
    return;
  }

  // Suppression détachée : elle dure plusieurs minutes sur un gros `dist`, et le
  // build n'a aucune raison de l'attendre — ni d'échouer si elle n'aboutit pas.
  // C'est la même raison qui a fait préférer `renameSync` à une suppression directe.
  // Une purge interrompue (fin de session, CI qui coupe) ne laisse pas de trace :
  // les archives survivantes gardent leur nom et sont reprises au build suivant.
  const purge = spawn(
    process.execPath,
    [
      "-e",
      "for (const cible of process.argv.slice(1)) { try { require('node:fs').rmSync(cible, { recursive: true, force: true }); } catch {} }",
      ...obsoletes.map((entry) => resolve(root, entry)),
    ],
    { detached: true, stdio: "ignore" },
  );

  purge.unref();
  console.log(`  purge en arrière-plan : ${obsoletes.length} archive(s) obsolète(s)`);
}

function run(label, command, args) {
  console.log(`\n▶ ${label}`);
  console.log(`  ${[command, ...args].join(" ")}`);

  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(`✖ ${label} — ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`✖ ${label} — échec`);
    process.exit(result.status || 1);
  }
}

console.log("Tooltrim — build production reproductible");
run("Index léger des outils", "node", ["scripts/gen-tools-index.mjs"]);
run(
  "Index catalogue stacks",
  process.platform === "win32" ? "node_modules\\.bin\\tsx.cmd" : "node_modules/.bin/tsx",
  ["scripts/gen-stacks-catalog-index.ts"],
);
run("Index léger des guides d’accueil", "node", ["scripts/gen-home-posts-index.mjs"]);
console.log("Mise à l'écart des anciens dossiers générés : dist, dist-ssr");
archiveGeneratedDirs();
purgeOldArchives();

run("Build SSR", "vite", [
  "build",
  "--ssr",
  "src/entry-server.tsx",
  "--outDir",
  "dist-ssr",
  "--emptyOutDir",
  "false",
]);

run("Build client", "vite", [
  "build",
  "--emptyOutDir",
  "false",
]);

run("Alias assets historiques", "node", ["scripts/alias-legacy-assets.mjs"]);

console.log("\nVerdict build production : PASS");
