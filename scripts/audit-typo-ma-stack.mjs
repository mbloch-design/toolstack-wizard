// Audit typographique de Ma stack : chaque texte visible doit avoir la signature
// (taille, graisse, interlettrage, famille) d’un atome .tt-* du système.
// Usage : npm run audit:typo -- 1280   (serveur de dev lancé ; rapport dans design-system/dist/)
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
const ATOMS = ["tt-title-xl", "tt-title-section", "tt-title-l", "tt-title-m", "tt-figure", "tt-label", "tt-text", "tt-note", "tt-eyebrow", "tt-amount", "tt-tag"];
const width = Number(process.argv[2] || 1280);
const base = process.env.TT_BASE_URL || "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
await p.addInitScript(() => {
  localStorage.setItem('tooltrim-analytics-consent', JSON.stringify({ version: 1, choice: 'refused', decidedAt: 1, expiresAt: 4102444800000 }));
  const slugs = ['chatgpt', 'claude', 'supabase', 'mongodb-atlas', 'notion', 'figma', 'slack', 'trello'];
  localStorage.setItem('tooltrim-personal-stack-v4:anonymous', JSON.stringify({ version: 4, selection: { version: 3, needs: [], pinnedToolSlugs: slugs, toolEntries: slugs.map(toolSlug => ({ toolSlug, needIds: [], intent: 'stack', addedAt: '2026-10-21T00:00:00Z', assignmentMode: 'pending' })) }, billing: { paid: slugs, reviewed: slugs, choices: Object.fromEntries(slugs.map((slug, i) => [slug, { source: 'custom', amount: [20, 18, 25, 9, 10, 15, 8, 6][i], currency: 'EUR', period: 'monthly' }])) }, decisions: {}, usage: {}, trade: null, dailyRate: null }));
});
await p.goto(`${base}/fr/ma-stack`, { waitUntil: "networkidle" }).catch(() => {});
await p.waitForTimeout(3000);
const res = await p.evaluate((ATOMS) => {
  const sig = (s) => [parseFloat(s.fontSize), s.fontWeight, (parseFloat(s.letterSpacing) || 0).toFixed(2), s.fontFamily.split(",")[0].replace(/"/g, "").trim(), s.textTransform === "uppercase" ? "CAPS" : ""].join(" | ");
  // Signatures of each atom, measured on probes inside the page (same cascade, same theme).
  const host = document.createElement("div"); host.style.cssText = "position:absolute;left:-9999px"; document.body.appendChild(host);
  const atoms = {};
  for (const a of ATOMS) { const e = document.createElement("span"); e.className = a; e.textContent = "x"; host.appendChild(e); atoms[sig(getComputedStyle(e))] = (atoms[sig(getComputedStyle(e))] || []).concat(a); }
  const root = document.querySelector("main") || document.body;
  const out = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const n = walker.currentNode; if (!n.textContent.trim()) continue;
    const el = n.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
    const r = el.getBoundingClientRect(); if (r.width <= 1 || r.height <= 1) continue; // hidden or screen-reader-only
    const st = getComputedStyle(el); if (st.visibility === "hidden" || st.opacity === "0") continue;
    if (el.closest("[aria-hidden='true'] svg")) continue;
    const s = sig(st);
    const path = []; let x = el; for (let i = 0; i < 3 && x && x !== root; i++, x = x.parentElement) path.unshift(x.tagName.toLowerCase() + (x.className && typeof x.className === "string" ? "." + x.className.trim().split(/\s+/).slice(0, 3).join(".") : ""));
    out.push({ sig: s, atom: atoms[s] ? atoms[s].join("/") : null, text: n.textContent.trim().slice(0, 40), path: path.join(" > ") });
  }
  host.remove();
  return { atoms, out };
}, ATOMS);
await b.close();
const off = res.out.filter((x) => !x.atom);
const bySig = {};
for (const x of off) (bySig[x.sig] ||= []).push(x);
let report = `Atomes mesurés :\n${Object.entries(res.atoms).map(([s, a]) => `  ${a.join("/")} = ${s}`).join("\n")}\n\nTextes : ${res.out.length}, conformes : ${res.out.length - off.length}, hors système : ${off.length}\n\n`;
for (const [s, xs] of Object.entries(bySig).sort((a, b) => b[1].length - a[1].length)) {
  report += `## ${s}  (${xs.length})\n` + xs.slice(0, 8).map((x) => `  « ${x.text} »  ${x.path}`).join("\n") + "\n\n";
}
writeFileSync(`design-system/dist/typo-audit-${width}.txt`, report);
console.log(report.split("\n").slice(0, 16).join("\n"));
