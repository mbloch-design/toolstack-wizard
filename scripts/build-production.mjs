#!/usr/bin/env node
import { existsSync, mkdirSync, renameSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const generatedDirs = ["dist", "dist-ssr"];
const trashRoot = ".build-trash";

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
run(
  "Index catalogue stacks",
  process.platform === "win32" ? "node_modules\\.bin\\tsx.cmd" : "node_modules/.bin/tsx",
  ["scripts/gen-stacks-catalog-index.ts"],
);
console.log("Mise à l'écart des anciens dossiers générés : dist, dist-ssr");
archiveGeneratedDirs();

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
