#!/usr/bin/env node
/**
 * Index d'exploration de la sidebar des fiches outils : « rebondir » vers
 * d'autres domaines, pas vers des alternatives (le contenu de la fiche s'en
 * charge).
 *
 * Pour chaque outil, à partir des stacks éditoriales, `w` : les outils
 * souvent utilisés avec lui, d'un AUTRE besoin du catalogue (un outil de
 * facturation à côté d'un wiki, pas un autre wiki), classés par nombre de
 * stacks partagées.
 *
 * Découpé par première lettre du slug (src/data/toolExplore/<lettre>.json)
 * et chargé à la demande : les stacks complètes pèsent 515 Ko, chaque
 * morceau quelques Ko.
 */
import fs from "node:fs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const toolsRaw = read("src/data/tools_v4.json");
const tools = Array.isArray(toolsRaw) ? toolsRaw : toolsRaw.tools || Object.values(toolsRaw)[0];
const stacks = read("src/data/stacks-catalog-index.json").stacks;

// Besoin de chaque catégorie, lu dans src/data/catalogNeeds.ts.
const needsSource = fs.readFileSync("src/data/catalogNeeds.ts", "utf8");
const needOfCategory = new Map();
for (const match of needsSource.matchAll(/id:\s*"([^"]+)"[^\n]*categoryIds:\s*\[([^\]]*)\]/g)) {
  for (const cat of match[2].matchAll(/"([^"]+)"/g)) needOfCategory.set(cat[1], match[1]);
}
const toolBySlug = new Map(tools.map((t) => [t.slug || t.id, t]));
const needOf = (slug) => {
  const tool = toolBySlug.get(slug);
  return tool ? needOfCategory.get(tool.category) || tool.category : null;
};

const stacksOf = new Map();
for (const stack of stacks) {
  const slugs = [...new Set((stack.tools || []).map((entry) => entry.slug).filter((slug) => toolBySlug.has(slug)))];
  for (const slug of slugs) {
    if (!stacksOf.has(slug)) stacksOf.set(slug, []);
    stacksOf.get(slug).push({ stack, slugs });
  }
}

const shards = {};
for (const [slug, entries] of stacksOf) {
  const ownNeed = needOf(slug);
  const together = new Map();
  for (const { slugs } of entries) {
    for (const other of slugs) {
      if (other === slug || needOf(other) === ownNeed) continue;
      together.set(other, (together.get(other) || 0) + 1);
    }
  }
  const w = [...together.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([other]) => other);

  const key = /^[a-z]/.test(slug) ? slug[0] : "0";
  if (w.length) (shards[key] ||= {})[slug] = { w };
}

fs.rmSync("src/data/toolExplore", { recursive: true, force: true });
fs.mkdirSync("src/data/toolExplore", { recursive: true });
let total = 0;
for (const [key, data] of Object.entries(shards)) {
  fs.writeFileSync(`src/data/toolExplore/${key}.json`, JSON.stringify(data));
  total += Object.keys(data).length;
}
console.log(`Index d'exploration : ${total} outils avec des voisins d'autres domaines, ${Object.keys(shards).length} morceaux.`);
