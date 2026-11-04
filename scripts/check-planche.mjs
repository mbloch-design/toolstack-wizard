#!/usr/bin/env node
/**
 * Garde-fou de la planche validée.
 *
 * Construit la source validée de la planche deux fois : avec le système validé, puis avec
 * le système actuel (src/styles/tooltrim-system.css et .js). Les deux rendus doivent être
 * identiques au pixel, en clair et en sombre. Une différence veut dire qu'une modification
 * du système change un module validé : on l'annule, ou on la fait valider puis on déplace
 * l'étiquette de référence.
 *
 *   npm run planche:check
 *   PLANCHE_REF=<commit ou étiquette> npm run planche:check
 *
 * Référence par défaut : la plus récente des étiquettes `planche-validee-AAAA-MM-JJ`.
 * Après une validation, on en pose une nouvelle (on ne réécrit jamais une étiquette) :
 *   git tag -a planche-validee-AAAA-MM-JJ <commit> -m "…"
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { buildPlanche } from "./build-planche.mjs";

// The latest validation: one dated tag per validation (planche-validee-AAAA-MM-JJ), never rewritten.
const REF = process.env.PLANCHE_REF || execFileSync("git", ["tag", "--list", "planche-validee-*", "--sort=-refname"], { encoding: "utf8" }).split("\n")[0].trim();
if (!REF) throw new Error("Aucune étiquette planche-validee-AAAA-MM-JJ : rien à comparer.");
const atRef = (path) => execFileSync("git", ["show", `${REF}:${path}`], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const src = atRef("design-system/planche.html");
const dir = mkdtempSync(join(tmpdir(), "planche-check-"));
const validated = buildPlanche({ src, system: atRef("src/styles/tooltrim-system.css"), behaviour: atRef("src/styles/tooltrim-system.js"), out: join(dir, "validee.html") }).out;
const current = buildPlanche({ src, system: readFileSync("src/styles/tooltrim-system.css", "utf8"), behaviour: readFileSync("src/styles/tooltrim-system.js", "utf8"), out: join(dir, "actuelle.html") }).out;
// The planche as it stands (source and system of today): a module moved from the planche into
// the system must render the same, so this one must match the validated render too.
const today = buildPlanche({ out: join(dir, "aujourdhui.html") }).out;

const browser = await chromium.launch();
/** Each chapter of the planche (a section with an h2), captured on its own, keyed by its title. */
async function shoot(file, colorScheme, hideProposals = false) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme });
  await page.goto(`file://${file}`, { waitUntil: "load" });
  // Fonts first: a capture before Uncut Sans is ready differs from the next one.
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((img) => img.decode().catch(() => {}))); });
  // Proposals awaiting validation ([data-proposal]) are not part of the validated planche.
  if (hideProposals) await page.addStyleTag({ content: "[data-proposal] { display: none !important; }" });
  await page.waitForTimeout(800);
  await page.evaluate(() => document.getAnimations().forEach((animation) => { try { animation.finish(); } catch { /* infinite */ } }));
  await page.waitForTimeout(200);
  const count = await page.locator("section:has(> .chapter-head h2)").count();
  const chapters = new Map();
  for (let i = 0; i < count; i++) {
    const section = page.locator("section:has(> .chapter-head h2)").nth(i);
    if (!(await section.isVisible())) continue;
    const title = (await section.locator(".chapter-head h2").first().textContent()).trim();
    chapters.set(title, await section.screenshot({ animations: "disabled" }));
  }
  await page.close();
  return chapters;
}

let failed = false;
for (const [label, file] of [["système actuel", current], ["planche actuelle", today]]) for (const scheme of ["light", "dark"]) {
  const [a, b] = [await shoot(validated, scheme), await shoot(file, scheme, file === today)];
  const changed = [...a.keys()].filter((title) => b.has(title) && !a.get(title).equals(b.get(title)));
  const removed = [...a.keys()].filter((title) => !b.has(title)), added = [...b.keys()].filter((title) => !a.has(title));
  if (changed.length || removed.length || added.length) {
    failed = true;
    console.error(`✖ ${label}, ${scheme} :` + (changed.length ? `\n  modifiés : ${changed.join(" · ")}` : "") + (removed.length ? `\n  retirés : ${removed.join(" · ")}` : "") + (added.length ? `\n  ajoutés : ${added.join(" · ")}` : ""));
  } else console.log(`✓ ${label}, ${scheme} : ${a.size} chapitres identiques au pixel à la version validée (${REF})`);
}
await browser.close();
if (failed) {
  console.error(`\nUne modification du système change un module validé. Annulez-la, ou faites-la valider puis posez une nouvelle étiquette : git tag -a planche-validee-AAAA-MM-JJ <commit>`);
  process.exit(1);
}
