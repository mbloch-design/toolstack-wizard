#!/usr/bin/env node
/**
 * Repasse typographique de Ma stack contre la règle validée de la planche (chapitre 02),
 * dans tous les états des modules, pas seulement le premier affichage.
 *
 *   Tailles : 64 · 42 · 21 · 17 · 16 · 14, et 12 seulement en capitales.
 *   Graisses : 400 ou 500 (jamais 600 ni plus, y compris dans un <b>).
 *   Interlettrage : Inter et Inter Tight 0 ; Uncut Sans de −0,017 à −0,022 em ; capitales +0,08 em.
 *   Familles : Uncut Sans, Inter, Inter Tight. Pas de texte gris.
 *   Un nom tronqué (points de suspension) est signalé aussi.
 *
 *   node scripts/audit-typo-rules.mjs        (serveur de dev lancé)
 */
import { chromium } from "playwright";

const BASE = process.env.TT_BASE_URL || "http://localhost:3000";
const SIZES = [64, 42, 21, 17, 16, 14];
const tools = (slugs, extra = {}) => ({ version: 4, selection: { version: 3, needs: [], pinnedToolSlugs: slugs, toolEntries: slugs.map((toolSlug) => ({ toolSlug, needIds: [], intent: "stack", addedAt: "2026-10-21T00:00:00Z", assignmentMode: "pending" })) }, billing: { paid: [], reviewed: [], choices: {} }, decisions: {}, usage: {}, trade: null, dailyRate: null, ...extra });
const priced = (slugs, amounts) => ({ paid: slugs, reviewed: slugs, choices: Object.fromEntries(slugs.map((slug, i) => [slug, { source: "custom", amount: amounts[i], currency: "EUR", period: "monthly" }])) });
const eight = ["notion", "trello", "asana", "figma", "slack", "chatgpt", "claude", "canva"];
const STATES = {
  "duel et partie": tools(eight, { billing: priced(eight, [36, 6, 11, 15, 8, 20, 18, 12]) }),
  "question de formule": tools(["figma", "adobe-illustrator", "adobe-photoshop"], { billing: { paid: ["adobe-illustrator", "adobe-photoshop"], reviewed: ["adobe-illustrator", "adobe-photoshop"], choices: {} }, dailyRate: { amount: 343, currency: "EUR" } }),
  "fin de partie": tools(["notion", "figma", "slack"], { billing: priced(["notion", "figma", "slack"], [36, 15, 8]), usage: { notion: 5, figma: 1, slack: 1 } }),
};

const audit = (SIZES) => {
  const out = [];
  const moduleOf = (el) => { const m = el.closest("[data-card], .tt-pagehead, section, footer, header"); if (!m) return "page"; return m.dataset.card || [...m.classList].find((c) => c.startsWith("tt-")) || m.tagName.toLowerCase(); };
  const seen = new Set();
  const walker = document.createTreeWalker(document.querySelector("main") || document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const el = walker.currentNode.parentElement; const text = walker.currentNode.textContent.trim();
    if (!el || !text || seen.has(el)) continue; seen.add(el);
    const r = el.getBoundingClientRect(); if (r.width <= 1 || r.height <= 1) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden") continue;
    const size = parseFloat(s.fontSize), weight = Number(s.fontWeight), family = s.fontFamily.split(",")[0].replace(/"/g, "").trim();
    const caps = s.textTransform === "uppercase", ls = parseFloat(s.letterSpacing) || 0, em = +(ls / size).toFixed(3);
    const issues = [];
    if (!SIZES.includes(Math.round(size)) && !(Math.round(size) === 12 && caps)) issues.push(`taille ${+size.toFixed(1)} px`);
    if (Math.round(size) === 12 && !caps) issues.push("12 px sans capitales");
    if (weight > 500) issues.push(`graisse ${weight}`);
    if (!["Uncut Sans", "Inter", "Inter Tight"].includes(family)) issues.push(`famille ${family}`);
    if (caps) { if (Math.abs(em - 0.08) > 0.005) issues.push(`capitales à ${em} em`); }
    else if (family === "Uncut Sans") { if (em > -0.016 || em < -0.023) issues.push(`Uncut à ${em} em`); }
    else if (Math.abs(em) > 0.002) issues.push(`Inter à ${em} em`);
    const [cr, cg, cb] = (s.color.match(/[\d.]+/g) || []).map(Number);
    if (s.color.startsWith("rgb") && Math.abs(cr - cg) < 6 && Math.abs(cg - cb) < 6 && cr > 70 && cr < 200) issues.push(`texte gris ${s.color}`);
    if (el.scrollWidth > el.clientWidth + 1 && s.textOverflow === "ellipsis") issues.push("tronqué");
    if (issues.length) out.push({ module: moduleOf(el), text: text.slice(0, 38), tag: el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""), issues });
  }
  return out;
};

const browser = await chromium.launch();
const all = [];
for (const [state, data] of Object.entries(STATES)) for (const lang of ["fr", "en"]) for (const width of [1280, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
  await page.addInitScript((d) => { localStorage.setItem("tooltrim-analytics-consent", JSON.stringify({ version: 1, choice: "refused", decidedAt: 1, expiresAt: 4102444800000 })); localStorage.setItem("tooltrim-personal-stack-v4:anonymous", JSON.stringify(d)); }, data);
  await page.goto(`${BASE}/${lang}/ma-stack`, { waitUntil: "networkidle" }).catch(() => {});
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(2500);
  for (const f of await page.evaluate(audit, SIZES)) all.push({ ...f, where: `${state} · ${lang} · ${width}` });
  // The inventory as a list too.
  if (width === 1280 && lang === "fr" && state === "duel et partie") {
    await page.getByRole("group", { name: /^(Affichage|Layout)$/ }).getByRole("button").nth(1).click().catch(() => {}); await page.waitForTimeout(400);
    for (const f of await page.evaluate(audit, SIZES)) all.push({ ...f, where: "inventaire en liste · fr · 1280" });
  }
  await page.close();
}
await browser.close();

// One line per distinct problem (module + element + issue), with where it shows.
const groups = new Map();
for (const f of all) for (const issue of f.issues) {
  const key = `${f.module} | ${f.tag} | ${issue}`;
  if (!groups.has(key)) groups.set(key, { ...f, issue, where: new Set(), texts: new Set() });
  groups.get(key).where.add(f.where); groups.get(key).texts.add(f.text);
}
const list = [...groups.values()].sort((a, b) => a.module.localeCompare(b.module));
for (const g of list) console.log(`${g.module.padEnd(16)} ${g.issue.padEnd(26)} ${g.tag.padEnd(36)} « ${[...g.texts].slice(0, 2).join(" » « ")} »  [${g.where.size} vues]`);
console.log(`\n${list.length} problèmes distincts sur ${Object.keys(STATES).length * 4} vues.`);
process.exit(list.length ? 1 : 0);
