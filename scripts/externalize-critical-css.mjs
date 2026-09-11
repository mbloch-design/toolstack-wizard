#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const assetsDir = path.join(distDir, "assets");
const stylePattern = /<style id="critical-css">([\s\S]*?)<\/style>/;

if (!fs.existsSync(distDir)) {
  console.error("Critical CSS externalization failed: dist/ does not exist.");
  process.exit(1);
}

fs.mkdirSync(assetsDir, { recursive: true });

const htmlFiles = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.name.endsWith(".html")) htmlFiles.push(absolute);
  }
};
walk(distDir);

// Chaque bloc critique est construit comme `utilityCss` + `criticalCss`, ou la
// seconde moitie est identique partout (voir extractCriticalCss dans
// vite.config.ts). Externalisee telle quelle, cette part constante etait donc
// recopiee dans chacun des ~780 fichiers emis. C'est ce qui a fait passer le
// budget CSS au-dessus de 30 Mio et casser le deploiement.
//
// On la sort dans un fichier partage et on n'emet plus que le prefixe propre a
// la page. L'ordre du cascade est conserve : le lien de la page vient avant
// celui du socle, exactement comme la concatenation d'origine.
function commonSuffix(values) {
  if (values.length === 0) return "";
  let suffix = values[0];
  for (const value of values.slice(1)) {
    const max = Math.min(suffix.length, value.length);
    let k = 0;
    while (k < max && suffix[suffix.length - 1 - k] === value[value.length - 1 - k]) k += 1;
    suffix = suffix.slice(suffix.length - k);
    if (!suffix) break;
  }
  return suffix;
}

const documents = [];
let alreadyExternal = 0;
let standalone = 0;

for (const htmlPath of htmlFiles) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const match = html.match(stylePattern);
  if (!match) {
    if (html.includes('<link id="critical-css" rel="stylesheet"')) alreadyExternal += 1;
    else standalone += 1;
    continue;
  }
  documents.push({ htmlPath, html, css: match[1] });
}

// Seuil : en dessous, le round-trip reseau supplementaire ne vaut pas l'octet
// economise, et on garde le comportement d'origine.
const shared = commonSuffix(documents.map((d) => d.css));
const useShared = shared.length >= 1024;
let sharedLink = "";
let sharedBytes = 0;
if (useShared) {
  const sharedName = `critical-base-${crypto.createHash("sha256").update(shared).digest("hex").slice(0, 16)}.css`;
  fs.writeFileSync(path.join(assetsDir, sharedName), shared, "utf8");
  sharedLink = `<link rel="stylesheet" href="/assets/${sharedName}">`;
  sharedBytes = Buffer.byteLength(shared);
}

const emitted = new Map();
let converted = 0;
let inlineBytes = 0;

for (const { htmlPath, html, css } of documents) {
  const own = useShared && css.endsWith(shared) ? css.slice(0, css.length - shared.length) : css;
  const hash = crypto.createHash("sha256").update(own).digest("hex").slice(0, 16);
  const fileName = `critical-${hash}.css`;
  const outputPath = path.join(assetsDir, fileName);

  if (!emitted.has(hash)) {
    if (!fs.existsSync(outputPath)) fs.writeFileSync(outputPath, own, "utf8");
    emitted.set(hash, { fileName, bytes: Buffer.byteLength(own) });
  }

  const link = `<link id="critical-css" rel="stylesheet" href="/assets/${fileName}">${sharedLink}`;
  fs.writeFileSync(htmlPath, html.replace(stylePattern, link), "utf8");
  converted += 1;
  inlineBytes += Buffer.byteLength(css);
}

const uniqueBytes = [...emitted.values()].reduce((sum, asset) => sum + asset.bytes, 0) + sharedBytes;
const savedBytes = inlineBytes - uniqueBytes;
const formatMiB = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;

console.log(
  `Critical CSS externalized: ${converted} HTML files, ${emitted.size} shared assets, ` +
  `${formatMiB(savedBytes)} removed from repeated HTML, ${standalone} standalone HTML skipped.`,
);
if (useShared) {
  console.log(
    `  socle commun: ${(sharedBytes / 1024).toFixed(1)} KiB sortis de ${emitted.size} fichiers, ` +
    `${formatMiB(sharedBytes * (emitted.size - 1))} economises`,
  );
}

if (converted === 0 && alreadyExternal === 0) {
  console.error("Critical CSS externalization failed: no ToolTrim HTML document was found.");
  process.exit(1);
}
