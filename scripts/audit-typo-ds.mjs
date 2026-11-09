#!/usr/bin/env node
/**
 * Typography pass over every Storybook story, against the validated rule:
 *   sizes 64 · 42 · 21 · 17 · 16 · 14, and 12 only in capitals;
 *   weights: the role weights of tokens.css (--tt-w-*, one step finer in dark mode);
 *   families Uncut Sans and Inter (Inter Tight cramps interface sizes);
 *   tracking: capitals +0.08 em, Uncut Sans −0.010 to −0.034 em, Inter −0.011 em at 16 and −0.004 em at 14; no grey text.
 *
 *   npm run build-storybook && node scripts/audit-typo-ds.mjs
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const index = JSON.parse(readFileSync(join(root, "storybook-static/index.json"), "utf8"));
const stories = Object.values(index.entries).filter((entry) => entry.type === "story");
const server = spawn("node", [join(root, "visual/serve.mjs")]);
await new Promise((resolve) => setTimeout(resolve, 600));

const audit = () => {
  const dark = document.documentElement.classList.contains("dark");
  const weights = dark ? [260, 280, 340, 360, 370, 400, 410, 430, 440, 450] : [280, 300, 370, 390, 400, 420, 430, 440, 460, 470, 480];
  const out = [];
  const walker = document.createTreeWalker(document.querySelector("#storybook-root"), NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const el = walker.currentNode.parentElement; const text = walker.currentNode.textContent.trim();
    if (!el || !text || seen.has(el)) continue; seen.add(el);
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    if (r.width <= 1 || r.height <= 1 || s.visibility === "hidden" || el.closest("[aria-hidden='true'] svg")) continue;
    const size = Math.round(parseFloat(s.fontSize) * 10) / 10, weight = Number(s.fontWeight), family = s.fontFamily.split(",")[0].replace(/"/g, "").trim();
    const caps = s.textTransform === "uppercase", em = +((parseFloat(s.letterSpacing) || 0) / parseFloat(s.fontSize)).toFixed(3);
    const issues = [];
    if (![64, 42, 21, 17, 16, 14].includes(Math.round(size)) && !(Math.round(size) === 12 && caps)) issues.push(`taille ${size}`);
    if (!weights.includes(weight)) issues.push(`graisse ${weight}`);
    if (!["Uncut Sans", "Inter"].includes(family)) issues.push(`famille ${family}`);
    if (caps) { if (Math.abs(em - 0.08) > 0.005) issues.push(`capitales ${em}em`); }
    else if (family === "Uncut Sans") { if (em > -0.01 || em < -0.034) issues.push(`Uncut ${em}em`); }
    else { const want = Math.round(size) >= 16 ? -0.011 : -0.004; if (Math.abs(em - want) > 0.002) issues.push(`Inter ${em}em`); }
    const [cr, cg, cb] = (s.color.match(/[\d.]+/g) || []).map(Number);
    if (Math.abs(cr - cg) < 6 && Math.abs(cg - cb) < 6 && cr > 70 && cr < 200) issues.push(`gris ${s.color}`);
    if (issues.length) out.push({ el: `${el.tagName.toLowerCase()}.${(typeof el.className === "string" ? el.className : "").split(/\s+/)[0].replace(/_[a-z0-9]{5}_\d+$/, "").replace(/^_/, "")}`, text: text.slice(0, 30), issues });
  }
  return out;
};

const browser = await chromium.launch();
const found = new Map();
for (const story of stories) for (const [width, theme] of [[390, "light"], [1280, "light"], [1280, "dark"]]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  await page.goto(`http://127.0.0.1:6007/iframe.html?id=${story.id}&viewMode=story&globals=lang:fr;theme:${theme}`);
  await page.locator("#storybook-root > *").first().waitFor({ timeout: 10000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  // Self-check: TYPO_PROBE=1 slips a wrong text into the first story; the audit must report it.
  if (process.env.TYPO_PROBE && story === stories[0]) await page.evaluate(() => { const p = document.createElement("p"); p.textContent = "sonde"; p.style.cssText = "font: 15px Arial; color: #888"; document.querySelector("#storybook-root").append(p); });
  for (const f of await page.evaluate(audit)) for (const issue of f.issues) {
    const key = `${story.title} | ${f.el} | ${issue.replace(/rgb.*/, "")}`;
    if (!found.has(key)) found.set(key, { ...f, issue, where: new Set() });
    found.get(key).where.add(`${width}${theme === "dark" ? "d" : ""}`);
  }
  await page.close();
}
await browser.close(); server.kill();
const list = [...found.entries()].sort(([a], [b]) => a.localeCompare(b));
for (const [key, f] of list) console.log(`${key.padEnd(70)} « ${f.text} »  [${[...f.where].join(" ")}]`);
console.log(`\n${list.length} écarts distincts sur ${stories.length} stories.`);
process.exit(list.length ? 1 : 0);
