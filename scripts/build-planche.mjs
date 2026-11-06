#!/usr/bin/env node
/**
 * Construit la planche design system, référence du site.
 *
 * Source : design-system/planche.html. Le système partagé
 * (src/styles/tooltrim-system.css et .js, aussi importés par le site)
 * remplace les marqueurs, la police Uncut Sans du site est inlinée : la planche publiée est
 * un seul fichier autonome, et elle montre exactement les tokens et
 * composants que le site utilise.
 *
 *   npm run planche   → design-system/dist/systeme-tooltrim.html
 *
 * `buildPlanche()` sert aussi au garde-fou (scripts/check-planche.mjs), qui construit la
 * même source avec deux versions du système pour les comparer.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();

export function buildPlanche({
  src = readFileSync(join(ROOT, "design-system/planche.html"), "utf8"),
  system = readFileSync(join(ROOT, "src/styles/tooltrim-system.css"), "utf8"),
  behaviour = readFileSync(join(ROOT, "src/styles/tooltrim-system.js"), "utf8"),
  out = join(ROOT, "design-system/dist/systeme-tooltrim.html"),
} = {}) {
  // The tokens live in src/ds/tokens.css since 06/11/2026: inline them, the planche is one file.
  system = system.replace('@import "../ds/tokens.css";', () => readFileSync(join(ROOT, "src/ds/tokens.css"), "utf8"));
  const font = readFileSync(join(ROOT, "public/fonts/UncutSans-Variable.woff2")).toString("base64");
  for (const marker of ["/*@tooltrim-system*/", "/*@tooltrim-system-js*/", "/*@font:uncut*/"]) {
    if (!src.includes(marker)) throw new Error(`Marqueur absent de la planche : ${marker}`);
  }
  const page = src
    .replace("/*@tooltrim-system*/", () => system)
    // The page runs the module inline, so its export keyword goes.
    .replace("/*@tooltrim-system-js*/", () => behaviour.replace(/^export /gm, ""))
    .replace("/*@font:uncut*/", () => `data:font/woff2;base64,${font}`)
    // Les captures des cas à régler (design-system/cases) sont inlinées.
    .replace(/src="cases\/([a-z0-9-]+\.jpg)"/g, (_, file) =>
      `src="data:image/jpeg;base64,${readFileSync(join(ROOT, "design-system/cases", file)).toString("base64")}"`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, page);
  return { out, kb: Math.round(page.length / 1024) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { out, kb } = buildPlanche();
  console.log(`Planche construite : ${out.replace(`${ROOT}/`, "")} (${kb} Ko)`);
}
