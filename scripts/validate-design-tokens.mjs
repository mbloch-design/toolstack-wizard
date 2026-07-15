#!/usr/bin/env node
/**
 * Design-token ratchet.
 *
 * The palette (--color-*), the radii (--radius*) and the class layer already
 * exist. They keep getting bypassed: every page that re-types #222222 or
 * border-radius: 8px forks the design system a little further.
 *
 * This does not try to fix that. It stops it from getting worse: the counts
 * below may only go down. Lower a number, run --update-baseline, commit.
 *
 *   npm run validate:design-tokens
 *   npm run validate:design-tokens -- --update-baseline
 *   npm run validate:design-tokens -- --list        # show every offender
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const postcss = require("postcss");

const ROOT = process.cwd();
const CSS_FILE = "src/index.css";
const TSX_ROOTS = ["src/components", "src/pages"];
const BASELINE = "scripts/design-tokens-baseline.json";

const listMode = process.argv.includes("--list");
const updateMode = process.argv.includes("--update-baseline");

const HEX = /#[0-9A-Fa-f]{6}\b/g;

/** A hex in a data: URI is SVG payload, not a CSS colour — it cannot take var(). */
const isUrlPayload = (value) => /data:|url\(/i.test(value);

/**
 * Two contexts legitimately hold colour literals:
 *  - .dark rules: the token flips, these are the values it flips to.
 *  - @media print: ink on paper. Tokenising these would make a printed page
 *    follow the screen theme — black pages in dark mode.
 */
const isExemptContext = (node) => {
  for (let p = node.parent; p; p = p.parent) {
    if (p.type === "rule" && /\.dark\b/.test(p.selector)) return true;
    if (p.type === "atrule" && p.name === "media" && /print/.test(p.params)) return true;
  }
  return false;
};

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

function scanCss() {
  const hexes = [];
  const radii = [];
  const css = readFileSync(join(ROOT, CSS_FILE), "utf8");
  const root = postcss.parse(css, { from: CSS_FILE });

  root.walkDecls((decl) => {
    const line = decl.source?.start?.line ?? 0;
    // token definitions are where literals are supposed to live
    if (decl.prop.startsWith("--")) return;

    if (!isUrlPayload(decl.value) && !isExemptContext(decl)) {
      for (const hex of decl.value.match(HEX) ?? []) {
        hexes.push({ file: CSS_FILE, line, text: `${decl.prop}: ${hex}` });
      }
    }
    // `border-radius: 0` is not drift, it means square. Anything else with a
    // number in it is a value that should have come from the radius scale.
    const isRadius = /^border(-[a-z]+)?-radius$/.test(decl.prop);
    const isSquare = /^0[a-z%]*$/.test(decl.value.trim());
    if (isRadius && !isSquare && /\d/.test(decl.value) && !decl.value.includes("var(")) {
      radii.push({ file: CSS_FILE, line, text: `${decl.prop}: ${decl.value}` });
    }
  });
  return { hexes, radii };
}

function scanTsx() {
  const hexes = [];
  const inline = [];
  const radii = [];
  for (const file of TSX_ROOTS.flatMap((d) => walkFiles(join(ROOT, d)))) {
    const rel = relative(ROOT, file);
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((raw, i) => {
        const line = i + 1;
        // only quoted strings reach the DOM as styles; a hex in a comment is prose
        for (const quoted of raw.match(/"[^"\n]*"/g) ?? []) {
          for (const hex of quoted.match(HEX) ?? []) {
            hexes.push({ file: rel, line, text: hex });
          }
        }
        if (raw.includes("style={{")) inline.push({ file: rel, line, text: raw.trim().slice(0, 70) });
        // an inline radius bypasses the scale just as surely as a CSS one.
        // `50%` counts too: it is a circle, and the scale has a token for that.
        for (const m of raw.matchAll(/borderRadius:\s*"?(\d+(?:\.\d+)?(?:px|%)?)"?/g)) {
          if (m[1] !== "0") radii.push({ file: rel, line, text: `borderRadius: ${m[1]}` });
        }
      });
  }
  return { hexes, inline, radii };
}

const css = scanCss();
const tsx = scanTsx();

const found = {
  cssHardcodedColors: css.hexes,
  cssLiteralRadii: css.radii,
  tsxHardcodedColors: tsx.hexes,
  tsxLiteralRadii: tsx.radii,
  tsxInlineStyles: tsx.inline,
};

const LABELS = {
  cssHardcodedColors: "couleurs en dur dans index.css   → var(--color-*)",
  cssLiteralRadii: "rayons littéraux dans index.css  → var(--radius*)",
  tsxHardcodedColors: "couleurs en dur dans les TSX     → var(--color-*)",
  tsxLiteralRadii: "rayons littéraux dans les TSX    → var(--radius*)",
  tsxInlineStyles: "styles inline dans les TSX       → classe CSS",
};

const counts = Object.fromEntries(Object.entries(found).map(([k, v]) => [k, v.length]));

if (updateMode) {
  writeFileSync(join(ROOT, BASELINE), JSON.stringify(counts, null, 2) + "\n");
  console.log("Baseline mise à jour :");
  for (const [k, n] of Object.entries(counts)) console.log(`  ${String(n).padStart(4)}  ${LABELS[k]}`);
  process.exit(0);
}

if (!existsSync(join(ROOT, BASELINE))) {
  console.error(`Baseline absente. Créez-la : npm run validate:design-tokens -- --update-baseline`);
  process.exit(1);
}
const baseline = JSON.parse(readFileSync(join(ROOT, BASELINE), "utf8"));

let failed = false;
let improved = false;
console.log("Dette de design (le cliquet n'autorise que la baisse)\n");

for (const [key, label] of Object.entries(LABELS)) {
  const now = counts[key];
  const was = baseline[key] ?? 0;
  const delta = now - was;
  const mark = delta > 0 ? "RÉGRESSION" : delta < 0 ? "mieux" : "stable";
  console.log(`  ${String(now).padStart(4)}  ${label}   [${mark}${delta ? ` ${delta > 0 ? "+" : ""}${delta}` : ""}]`);
  if (delta > 0) failed = true;
  if (delta < 0) improved = true;

  if (listMode || delta > 0) {
    for (const v of found[key].slice(0, delta > 0 ? 15 : 1e9)) {
      console.log(`        ${v.file}:${v.line}  ${v.text}`);
    }
  }
}

if (failed) {
  console.error("\nÉCHEC : de nouvelles valeurs en dur ont été ajoutées.");
  console.error("Utilisez les tokens (var(--color-*), var(--radius*)) ou une classe CSS.");
  console.error("Si l'ajout est délibéré et justifié : -- --update-baseline");
  process.exit(1);
}

console.log(
  improved
    ? "\nOK — dette en baisse. Pensez à figer le gain : -- --update-baseline"
    : "\nOK — aucune régression."
);
