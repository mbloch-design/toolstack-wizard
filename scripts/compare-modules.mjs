#!/usr/bin/env node
/**
 * Conformité des modules : le site dessine-t-il les modules de la planche comme elle ?
 *
 * Les données diffèrent (la planche montre des exemples), donc on ne compare pas des pixels
 * mais le dessin : pour chaque élément d'un module, repéré par son chemin de classes `tt-*`,
 * les styles calculés (police, interlettrage, couleurs, marges, écarts, arrondis, tailles
 * fixes) doivent être ceux de la planche. Un chemin présent d'un seul côté est signalé aussi :
 * structure différente.
 *
 *   npm run modules:check        (serveur de dev lancé, planche construite : npm run planche)
 */
import { chromium } from "playwright";
import { resolve } from "node:path";

const BASE = process.env.TT_BASE_URL || "http://localhost:3000";
const PLANCHE = resolve("design-system/dist/systeme-tooltrim.html");
// Module → [selector on the site, selector in the planche's Ma stack template].
const MODULES = {
  "En-tête de page": [".tt-pagehead", ".gb-page .tt-pagehead"],
  Budget: [".tt-board > [data-card=price]", ".gb-page .gb-grid > .tt-tile"],
  Décision: [".tt-board .tt-decision", ".gb-page .tt-decision"],
  "Vos usages": [".tt-board .tt-usage", ".gb-page .tt-usage"],
  Répartition: [".tt-board .tt-split", ".gb-page .tt-split"],
  "Carte d'outil": [".tt-toolcard", ".gb-page .tt-toolcard"],
  "Nom de groupe": [".tt-groupname", ".gb-page .tt-groupname"],
  "Titre de section": [".ms-all .tt-sectionhead", ".gb-page .gb-section .tt-sectionhead"],
  "Carte média": [".tt-mediacard", ".gb-page .tt-mediacard"],
};
const PROPS = ["font-family", "font-size", "font-weight", "line-height", "letter-spacing", "text-transform", "color", "background-color", "border-radius", "padding", "gap", "row-gap", "column-gap", "box-shadow", "width", "height", "display"];
// Width and height only when the module fixes them (logos, dots, bars), not when content sets them.
const FIXED = /tt-logo-tile|tt-check|tt-steps-track|tt-share-bar|tt-split-bar|tt-cutgauge|i$/;

function signature(root, props, fixed) {
  const out = {};
  const walk = (el, path) => {
    const tt = [...el.classList].filter((c) => c.startsWith("tt-")).sort().join(".");
    const here = tt ? `${path} > .${tt}` : path;
    if (tt) {
      const s = getComputedStyle(el), sig = {};
      for (const p of props) {
        if ((p === "width" || p === "height") && !new RegExp(fixed).test(here)) continue;
        sig[p] = s.getPropertyValue(p);
      }
      if (!out[here]) out[here] = sig;
    }
    for (const child of el.children) walk(child, here);
  };
  walk(root, "");
  return out;
}

const seed = () => {
  localStorage.setItem("tooltrim-analytics-consent", JSON.stringify({ version: 1, choice: "refused", decidedAt: 1, expiresAt: 4102444800000 }));
  const slugs = ["notion", "trello", "asana", "figma", "slack", "chatgpt", "claude", "canva"];
  localStorage.setItem("tooltrim-personal-stack-v4:anonymous", JSON.stringify({ version: 4, selection: { version: 3, needs: [], pinnedToolSlugs: slugs, toolEntries: slugs.map((toolSlug) => ({ toolSlug, needIds: [], intent: "stack", addedAt: "2026-10-21T00:00:00Z", assignmentMode: "pending" })) }, billing: { paid: slugs, reviewed: slugs, choices: Object.fromEntries(slugs.map((slug, i) => [slug, { source: "custom", amount: [36, 6, 11, 15, 8, 20, 18, 12][i], currency: "EUR", period: "monthly" }])) }, decisions: {}, usage: {}, trade: null, dailyRate: null }));
};

const browser = await chromium.launch();
const collect = async (url, pick, init) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  if (init) await page.addInitScript(init);
  await page.goto(url, { waitUntil: "networkidle" }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500);
  const result = {};
  for (const [name, selectors] of Object.entries(MODULES)) {
    result[name] = await page.evaluate(([sel, props, fixed, fn]) => {
      const root = document.querySelector(sel); if (!root) return null;
      return new Function("return " + fn)()(root, props, fixed);
    }, [selectors[pick], PROPS, FIXED.source, signature.toString()]);
  }
  await page.close();
  return result;
};
const site = await collect(`${BASE}/fr/ma-stack`, 0, seed);
const planche = await collect(`file://${PLANCHE}`, 1);
await browser.close();

let gaps = 0;
for (const name of Object.keys(MODULES)) {
  const s = site[name], p = planche[name];
  if (!s || !p) { console.log(`? ${name} : ${!s ? "absent du site" : "absent de la planche"}`); continue; }
  const lines = [];
  for (const path of Object.keys(p)) {
    if (!s[path]) { lines.push(`  structure : ${path} existe dans la planche, pas sur le site`); continue; }
    for (const prop of Object.keys(p[path])) if (s[path][prop] !== p[path][prop]) lines.push(`  ${path}  ${prop} : planche ${p[path][prop]} | site ${s[path][prop]}`);
  }
  for (const path of Object.keys(s)) if (!p[path]) lines.push(`  structure : ${path} existe sur le site, pas dans la planche`);
  gaps += lines.length;
  console.log(`${lines.length ? "✖" : "✓"} ${name}${lines.length ? ` (${lines.length})` : ""}`);
  if (lines.length) console.log(lines.slice(0, 40).join("\n"));
}
console.log(gaps ? `\n${gaps} écarts entre le site et la planche validée.` : "\nLe site dessine chaque module comme la planche.");
process.exit(gaps ? 1 : 0);
