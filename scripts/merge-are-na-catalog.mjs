#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";

const catalogFile = "src/data/tools_v4.json";
const categoriesFile = "src/data/categories_index.json";
const tools = JSON.parse(readFileSync(catalogFile, "utf8"));
const before = tools.length;
const merged = tools.filter((tool) => tool.slug !== "are-na");
if (merged.length !== before - 1) throw new Error("Le doublon are-na est absent ou présent plusieurs fois.");
if (!merged.some((tool) => tool.slug === "arena")) throw new Error("La fiche canonique arena est absente.");
writeFileSync(catalogFile, `${JSON.stringify(merged, null, 2)}\n`);

const categories = JSON.parse(readFileSync(categoriesFile, "utf8"));
for (const category of categories) {
  if (Array.isArray(category.tools)) category.tools = [...new Set(category.tools.map((slug) => slug === "are-na" ? "arena" : slug))];
  if (Array.isArray(category.toolSlugs)) category.toolSlugs = [...new Set(category.toolSlugs.map((slug) => slug === "are-na" ? "arena" : slug))];
}
writeFileSync(categoriesFile, `${JSON.stringify(categories, null, 2)}\n`);
console.log(`Fusion are-na -> arena: ${before} -> ${merged.length} fiches`);
