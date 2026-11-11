#!/usr/bin/env node
/**
 * Storybook keeps only what lives: every component exported by src/ds must be used outside its own
 * folder (by the site, or by another component of the system). A story of a component nobody uses
 * is a dead story: remove it or bring the component back into the site.
 *
 *   npm run audit:ds-usage
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(import.meta.dirname, "..");
const walk = (dir) => readdirSync(dir).flatMap((name) => { const path = join(dir, name); return statSync(path).isDirectory() ? walk(path) : [path]; });
const code = walk(join(root, "src")).filter((file) => /\.(tsx?|jsx?)$/.test(file) && !/\.(stories|test|browser\.test)\.tsx?$/.test(file));
const sources = new Map(code.map((file) => [file, readFileSync(file, "utf8")]));
const ds = join(root, "src/ds");
// Folders that are documentation only, never imported by the site.
const DOCS = new Set(["Foundations", "Inventory", "test"]);
const dead = [];
for (const folder of readdirSync(ds)) {
  const dir = join(ds, folder);
  if (!statSync(dir).isDirectory() || DOCS.has(folder)) continue;
  for (const file of readdirSync(dir).filter((name) => /\.tsx?$/.test(name) && !/\.(stories|test|fixtures|browser\.test)\.tsx?$/.test(name))) {
    const text = readFileSync(join(dir, file), "utf8");
    const names = [...text.matchAll(/^export (?:default )?(?:function|const) ([A-Z][A-Za-z0-9]*)/gm)].map((m) => m[1]);
    for (const name of names) {
      const used = [...sources].some(([other, body]) => !other.startsWith(dir) && new RegExp(`\\b${name}\\b`).test(body)
        && (body.includes(`/${folder}/${file.replace(/\.tsx?$/, "")}`) || body.includes(`/${folder}"`)));
      if (!used) dead.push(`${relative(root, join(dir, file))} → ${name}`);
    }
  }
}
for (const line of dead) console.log(`inutilisé : ${line}`);
console.log(`\n${dead.length} composant${dead.length > 1 ? "s" : ""} du système sans usage.`);
process.exit(dead.length ? 1 : 0);
