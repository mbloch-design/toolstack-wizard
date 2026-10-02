#!/usr/bin/env -S npx vite-node
/**
 * Couleur d'accent de chaque fiche outil, tirée de son logo : le violet
 * d'Obsidian, l'orange de Figma. Elle teinte quelques détails de la fiche
 * (cadre du logo, onglet actif, repère de plan) pour donner une personnalité
 * à chaque page sans toucher à la charte.
 *
 * Mêmes sources que le site (getToolLogoSources). Chaque logo est téléchargé
 * puis dessiné dans Chromium (Playwright) ; on garde la teinte saturée la
 * plus représentée. Un logo noir, blanc ou gris (Notion) n'a pas d'accent :
 * la fiche reste neutre plutôt que d'inventer une couleur.
 *
 * Écrit src/data/toolAccents.json ({ slug: "#rrggbb" }). Lancer :
 *   npx vite-node scripts/gen-tool-accents.mjs
 */
import fs from "node:fs";
import { chromium } from "playwright";
import { getToolLogoSources } from "../src/lib/toolLogos.ts";

const raw = JSON.parse(fs.readFileSync("src/data/tools_v4.json", "utf8"));
const tools = Array.isArray(raw) ? raw : raw.tools || Object.values(raw)[0];
const OUT = "src/data/toolAccents.json";

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
await page.setContent("<canvas id=c width=48 height=48></canvas>");

// Analyse dans la page : teinte dominante parmi les pixels assez saturés.
const analyse = (dataUrl) => page.evaluate(async (src) => {
  const img = new Image();
  img.src = src;
  try { await img.decode(); } catch { return null; }
  const c = document.getElementById("c");
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, 48, 48);
  ctx.drawImage(img, 0, 0, 48, 48);
  const { data } = ctx.getImageData(0, 0, 48, 48);
  const bins = Array.from({ length: 24 }, () => ({ n: 0, r: 0, g: 0, b: 0 }));
  let opaque = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 160) continue;
    opaque++;
    const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
    const l = (max + min) / 2, d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    if (s < 0.38 || l < 0.18 || l > 0.82) continue;
    let h;
    if (max === r / 255) h = ((g - b) / 255 / d) % 6;
    else if (max === g / 255) h = (b - r) / 255 / d + 2;
    else h = (r - g) / 255 / d + 4;
    const bin = bins[Math.floor(((h * 60 + 360) % 360) / 15)];
    bin.n++; bin.r += r; bin.g += g; bin.b += b;
  }
  const best = bins.reduce((a, b) => (b.n > a.n ? b : a));
  if (!opaque || best.n / opaque < 0.08) return null;
  const hex = (v) => Math.round(v / best.n).toString(16).padStart(2, "0");
  return `#${hex(best.r)}${hex(best.g)}${hex(best.b)}`;
}, dataUrl);

const fetchImage = async (url) => {
  try {
    const res = await context.request.get(url, { timeout: 8000, maxRedirects: 5 });
    const type = (res.headers()["content-type"] || "").split(";")[0];
    if (!res.ok() || !type.startsWith("image/")) return null;
    const body = await res.body();
    if (body.length < 120) return null; // pixel vide ou favicon par défaut
    return `data:${type};base64,${body.toString("base64")}`;
  } catch { return null; }
};

const accents = {};
let done = 0, colored = 0;
for (const tool of tools) {
  const slug = tool.slug || tool.id;
  done++;
  for (const src of getToolLogoSources(tool, 64)) {
    const url = src.startsWith("/") ? null : src; // logos locaux : lus sur disque
    const dataUrl = url
      ? await fetchImage(url)
      : fs.existsSync(`public${src}`)
        ? `data:image/${src.endsWith(".svg") ? "svg+xml" : src.split(".").pop()};base64,${fs.readFileSync(`public${src}`).toString("base64")}`
        : null;
    if (!dataUrl) continue;
    const color = await analyse(dataUrl);
    if (color) { accents[slug] = color; colored++; }
    break; // premier logo réellement servi, comme sur le site
  }
  if (done % 100 === 0) console.log(`${done}/${tools.length} (${colored} avec accent)`);
}
await browser.close();

const sorted = Object.fromEntries(Object.entries(accents).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(OUT, JSON.stringify(sorted));
console.log(`Accents : ${colored} outils sur ${tools.length} ; les autres restent neutres.`);
