#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const obsolete = new Set(["sendinblue", "clearbit", "modo"]);
const replacements = { sendinblue: "brevo", clearbit: "hubspot" };

const toolsFile = path.join(root, "src/data/tools_v4.json");
const tools = JSON.parse(readFileSync(toolsFile, "utf8"));
writeFileSync(toolsFile, `${JSON.stringify(tools.filter((tool) => !obsolete.has(tool.slug)), null, 2)}\n`);

const categoriesFile = path.join(root, "src/data/categories_index.json");
const categories = JSON.parse(readFileSync(categoriesFile, "utf8"));
for (const category of Object.values(categories)) {
  if (!Array.isArray(category)) continue;
  const mapped = category.map((slug) => replacements[slug] || slug).filter((slug) => !obsolete.has(slug));
  category.splice(0, category.length, ...new Set(mapped));
}
writeFileSync(categoriesFile, `${JSON.stringify(categories, null, 2)}\n`);

const contentFile = path.join(root, "src/data/content.json");
const content = JSON.parse(readFileSync(contentFile, "utf8"));
if (Array.isArray(content.tools)) content.tools = content.tools.filter((tool) => !obsolete.has(tool.slug || tool.id));
writeFileSync(contentFile, `${JSON.stringify(content, null, 2)}\n`);

console.log(JSON.stringify({ removed: [...obsolete], replacements }, null, 2));
