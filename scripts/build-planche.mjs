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
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const src = readFileSync(join(ROOT, "design-system/planche.html"), "utf8");
const system = readFileSync(join(ROOT, "src/styles/tooltrim-system.css"), "utf8");
// The page runs the module inline, so its export keyword goes.
const behaviour = readFileSync(join(ROOT, "src/styles/tooltrim-system.js"), "utf8").replace(/^export /gm, "");
const font = readFileSync(join(ROOT, "public/fonts/UncutSans-Variable.woff2")).toString("base64");

for (const marker of ["/*@tooltrim-system*/", "/*@tooltrim-system-js*/", "/*@font:uncut*/"]) {
  if (!src.includes(marker)) throw new Error(`Marqueur absent de la planche : ${marker}`);
}

const out = src
  .replace("/*@tooltrim-system*/", () => system)
  .replace("/*@tooltrim-system-js*/", () => behaviour)
  .replace("/*@font:uncut*/", () => `data:font/woff2;base64,${font}`);

// Les captures des cas à régler (design-system/cases) sont inlinées.
const withCases = out.replace(/src="cases\/([a-z0-9-]+\.jpg)"/g, (_, file) =>
  `src="data:image/jpeg;base64,${readFileSync(join(ROOT, "design-system/cases", file)).toString("base64")}"`);

mkdirSync(join(ROOT, "design-system/dist"), { recursive: true });
writeFileSync(join(ROOT, "design-system/dist/systeme-tooltrim.html"), withCases);
console.log(`Planche construite : design-system/dist/systeme-tooltrim.html (${Math.round(withCases.length / 1024)} Ko)`);
