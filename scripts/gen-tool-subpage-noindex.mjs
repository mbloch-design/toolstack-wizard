#!/usr/bin/env node
/**
 * Liste des sous-pages outil (/prix, /alternatives) sorties de l'index, écrite
 * dans src/data/toolSubpageNoindex.json et lue par src/lib/toolSubpageSeo.ts
 * (sitemap, prérendu, hreflang et page client).
 *
 * Usage, après un build (le script lit dist/ pour mesurer les pages) :
 *   node scripts/gen-tool-subpage-noindex.mjs --source "GSC 3 mois au 2026-11-25" \
 *     pages-prix.csv pages-pricing.csv pages-alternatives.csv
 *
 * Les CSV sont les exports « Pages » de Search Console (onglet Performances,
 * 3 mois), un par segment d'URL, car l'interface plafonne à 1 000 lignes.
 *
 * Règles (décision du 25/11/2026) :
 *   - /prix, /pricing : 0 impression sur la période ET moins de 250 mots de
 *     contenu rendu (hors navigation) ;
 *   - /alternatives : la page n'a aucun substitut à proposer (« Pas de
 *     substitut établi ») ET 0 clic ET moins de 100 impressions. L'export
 *     /alternatives est tronqué : on ne retire que les pages vides par
 *     construction, jamais sur la seule absence de l'export ;
 *   - EXTRA_PATHS : exclusions manuelles motivées.
 * Une page sortie redevient indexable dès qu'elle quitte la liste.
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const sourceIdx = args.indexOf("--source");
const source = sourceIdx >= 0 ? args.splice(sourceIdx, 2)[1] : "";
if (!source || args.length === 0) {
  console.error("Usage: gen-tool-subpage-noindex.mjs --source <libellé> <export Pages.csv>…");
  process.exit(1);
}

// Exclusions manuelles, avec leur motif.
const EXTRA_PATHS = {
  // Se classe sur « alternatives to ruby » (le langage) alors que la fiche est
  // Ruby, le service de réception d'appels : intention opposée, 0 clic.
  "/en/tool/ruby/alternatives": "intention de recherche opposée",
  "/fr/tool/ruby/alternatives": "intention de recherche opposée",
};

const num = (value) => Number(String(value).replace(/[\s %]/g, "").replace(",", ".")) || 0;
function parseCsv(text) {
  const rows = [];
  for (const line of text.replace(/^﻿/, "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = [];
    let cell = "";
    let quoted = false;
    for (const char of line) {
      if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) { cells.push(cell); cell = ""; }
      else cell += char;
    }
    cells.push(cell);
    rows.push(cells);
  }
  return rows.slice(1);
}

const gsc = new Map();
for (const file of args) {
  for (const [url, clicks, impressions] of parseCsv(fs.readFileSync(file, "utf8"))) {
    const pathname = url.replace(/^https:\/\/tooltrim\.com/, "").replace(/\/$/, "");
    if (!pathname.startsWith("/")) continue;
    gsc.set(pathname, { clicks: num(clicks), impressions: num(impressions) });
  }
}

const sitemap = fs.readFileSync("dist/sitemap.xml", "utf8");
const subpages = [...new Set([...sitemap.matchAll(/<loc>https:\/\/tooltrim\.com(\/(?:fr|en)\/tool\/[^/<]+\/(?:prix|pricing|alternatives))<\/loc>/g)].map((m) => m[1]))];
// Pages déjà sorties : elles ne sont plus au sitemap mais restent à évaluer.
const previous = fs.existsSync("src/data/toolSubpageNoindex.json")
  ? JSON.parse(fs.readFileSync("src/data/toolSubpageNoindex.json", "utf8"))
  : null;
for (const [lang, kinds] of Object.entries(previous?.pages ?? {})) {
  for (const [kind, slugs] of Object.entries(kinds)) {
    for (const slug of slugs) subpages.push(`/${lang}/tool/${slug}/${lang === "en" && kind === "prix" ? "pricing" : kind}`);
  }
}

function renderedWords(html) {
  const root = html.split('<div id="root">')[1] ?? "";
  return root
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<(nav|footer|header)[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

const pages = { fr: { prix: [], alternatives: [] }, en: { prix: [], alternatives: [] } };
const counts = { prix: 0, alternatives: 0, manual: 0 };
for (const pathname of [...new Set(subpages)].sort()) {
  const [, lang, , slug, segment] = pathname.split("/");
  const kind = segment === "pricing" ? "prix" : segment;
  const file = path.join("dist", pathname, "index.html");
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  const { clicks = 0, impressions = 0 } = gsc.get(pathname) ?? {};
  let out = false;
  if (EXTRA_PATHS[pathname]) { out = true; counts.manual++; }
  else if (kind === "prix") out = impressions === 0 && renderedWords(html) < 250;
  else if (kind === "alternatives") {
    const noSubstitute = html.includes("Pas de substitut établi") || html.includes("No established substitute");
    out = noSubstitute && clicks === 0 && impressions < 100;
  }
  if (!out) continue;
  if (!EXTRA_PATHS[pathname]) counts[kind]++;
  pages[lang][kind].push(slug);
}

const output = {
  source,
  rules: [
    "/prix, /pricing : 0 impression sur la période et moins de 250 mots rendus",
    "/alternatives : aucun substitut, 0 clic et moins de 100 impressions",
    ...Object.entries(EXTRA_PATHS).map(([p, why]) => `${p} : ${why}`),
  ],
  pages,
};
fs.writeFileSync("src/data/toolSubpageNoindex.json", `${JSON.stringify(output, null, 1)}\n`);
console.log(`toolSubpageNoindex.json : ${counts.prix} /prix, ${counts.alternatives} /alternatives, ${counts.manual} manuelles`);
