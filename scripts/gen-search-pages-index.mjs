#!/usr/bin/env node
/**
 * Index des pages que la recherche globale doit retrouver en plus des outils,
 * catégories et guides (US-NAV-01) : comparatifs, stacks et pages « meilleurs
 * outils ». Écrit src/data/searchPagesIndex.json, chargé à l'ouverture de la
 * recherche seulement (pas dans le bundle principal).
 *
 * Une entrée : { k: type, fr, en, p: { fr, en }, kw } ; `p` est le chemin
 * sous /:lang, `kw` des mots qui doivent aussi trouver la page (noms d'outils).
 */
import fs from "node:fs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const toolsIndex = read("src/data/tools_index.json");
const tools = Array.isArray(toolsIndex) ? toolsIndex : toolsIndex.tools || Object.values(toolsIndex)[0];
const nameOf = new Map(tools.map((t) => [t.slug || t.id, t.name]));

const entries = [];

// Comparatifs : « Outil A vs Outil B ».
const comparisons = fs.readFileSync("src/data/comparisons.ts", "utf8");
const seen = new Set();
for (const block of comparisons.match(/\{[^{}]*slugPair[^{}]*\}/g) || []) {
  const slugPair = block.match(/slugPair:\s*["']([^"']+)["']/)?.[1];
  const a = block.match(/toolA:\s*["']([^"']+)["']/)?.[1];
  const b = block.match(/toolB:\s*["']([^"']+)["']/)?.[1];
  if (!slugPair || !a || !b || seen.has(slugPair)) continue;
  seen.add(slugPair);
  const label = `${nameOf.get(a) || a} vs ${nameOf.get(b) || b}`;
  entries.push({ k: "comparison", fr: label, en: label, p: { fr: `/comparatif/${slugPair}`, en: `/comparatif/${slugPair}` }, kw: [a, b] });
}

// Stacks.
const stacksIndex = read("src/data/stacks-catalog-index.json");
for (const s of stacksIndex.stacks || []) {
  entries.push({ k: "stack", fr: s.title, en: s.titleEn || s.title, p: { fr: `/stacks/${s.slug}`, en: `/stacks/${s.slug}` }, kw: [] });
}

// Pages « meilleurs outils ».
for (const g of read("src/data/bestOfGuides.json").guides) {
  entries.push({ k: "bestof", fr: g.h1.fr, en: g.h1.en, p: { fr: `/guide/${g.slug.fr}`, en: `/guide/${g.slug.en}` }, kw: g.tools.map((slug) => nameOf.get(slug) || slug) });
}

fs.writeFileSync("src/data/searchPagesIndex.json", JSON.stringify(entries));
const count = (k) => entries.filter((e) => e.k === k).length;
console.log(`Index de recherche des pages : ${count("comparison")} comparatifs, ${count("stack")} stacks, ${count("bestof")} pages « meilleurs outils ».`);
