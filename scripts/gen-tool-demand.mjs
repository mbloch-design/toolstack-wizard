#!/usr/bin/env node

/**
 * Builds src/data/tool_demand.json: Google search impressions per tool fiche,
 * from a Search Console "Performance on Search" export.
 *
 * The catalogue shelves rank on real demand (plus editorial curation), never
 * on how complete a fiche is: completeness reflects the order fiches were
 * built in, not how much a tool matters.
 *
 * Usage: node scripts/gen-tool-demand.mjs [path/to/export-folder]
 * Without an argument, the most recent unfiltered export in ~/Downloads is
 * used. An export filtered on a page subset would skew the ranking, so it is
 * refused (read Filtres.csv / Filters.csv before trusting a number).
 */

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

const pickExport = () => {
  if (process.argv[2]) return resolve(process.argv[2]);
  const downloads = join(homedir(), "Downloads");
  const candidates = readdirSync(downloads)
    .filter((name) => /Performance-on-Search/.test(name) && statSync(join(downloads, name)).isDirectory())
    .map((name) => join(downloads, name))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  const unfiltered = candidates.find((dir) => {
    const filters = ["Filtres.csv", "Filters.csv"].map((f) => join(dir, f)).find(existsSync);
    return filters && !/\n\s*(Page|Requête|Query)\s*,/i.test(readFileSync(filters, "utf8"));
  });
  if (!unfiltered) throw new Error("No unfiltered Search Console export found in ~/Downloads.");
  return unfiltered;
};

const dir = pickExport();
const pages = readFileSync(join(dir, existsSync(join(dir, "Pages.csv")) ? "Pages.csv" : "Pages.csv"), "utf8").trim().split("\n").slice(1);
const demand = {};
for (const line of pages) {
  const [url, , impressions] = line.split(",");
  const match = url?.match(/\/(?:fr|en)\/tool\/([^/?#]+)/);
  if (!match) continue;
  demand[match[1]] = (demand[match[1]] || 0) + (Number(impressions) || 0);
}
const sorted = Object.fromEntries(Object.entries(demand).sort((a, b) => b[1] - a[1]));
writeFileSync(resolve("src/data/tool_demand.json"), `${JSON.stringify({ source: dir.split("/").pop(), impressions: sorted }, null, 2)}\n`);
console.log(`tool_demand.json written from ${dir.split("/").pop()}: ${Object.keys(sorted).length} tools`);
