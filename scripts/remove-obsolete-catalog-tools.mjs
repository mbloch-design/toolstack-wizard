#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const obsolete = new Set(["sendinblue", "clearbit", "modo", "condeco", "affinity-designer", "affinity-photo", "affinity-publisher"]);
const replacements = {
  sendinblue: "brevo",
  clearbit: "hubspot",
  condeco: "eptura-engage",
  "affinity-designer": "affinity",
  "affinity-photo": "affinity",
  "affinity-publisher": "affinity",
};

const toolsFile = path.join(root, "src/data/tools_v4.json");
const tools = JSON.parse(readFileSync(toolsFile, "utf8"));
const epturaSource = tools.find((tool) => tool.slug === "condeco");
const affinitySource = tools.find((tool) => tool.slug === "affinity-designer");
const canonical = [
  {
    ...epturaSource,
    id: "eptura-engage",
    slug: "eptura-engage",
    name: "Eptura Engage",
    websiteUrl: "https://eptura.com/our-platform/eptura-engage/",
    affiliateLink: "https://eptura.com/our-platform/eptura-engage/",
    logo: "",
    ogImageUrl: "https://tooltrim.com/og-screenshots/eptura-engage.jpg",
  },
  {
    ...affinitySource,
    id: "affinity",
    slug: "affinity",
    name: "Affinity",
    websiteUrl: "https://www.affinity.studio/get-affinity",
    affiliateLink: "https://www.affinity.studio/get-affinity",
    logo: "",
    ogImageUrl: "https://static.canva.com/static/images/fb_cover-1.jpg",
  },
].filter((tool) => tool.id);
writeFileSync(toolsFile, `${JSON.stringify([...tools.filter((tool) => !obsolete.has(tool.slug)), ...canonical], null, 2)}\n`);

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

for (const relativeFile of ["src/data/stacks.ts", "src/data/comparisons.ts"]) {
  const file = path.join(root, relativeFile);
  let source = readFileSync(file, "utf8");
  for (const [legacy, current] of Object.entries(replacements)) source = source.replaceAll(`"${legacy}"`, `"${current}"`);
  writeFileSync(file, source);
}

console.log(JSON.stringify({ removed: [...obsolete], replacements }, null, 2));
