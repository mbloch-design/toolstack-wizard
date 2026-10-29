#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { splitSharedCriticalCss } from "./lib/shared-critical-css.mjs";

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

// Share only complete AST boundaries and keep stylesheet order. Retain CSS
// variants, not thousands of full prerendered HTML documents, in memory.
const documents = [];
const variants = new Map();
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
  const css = match[1];
  let variant = variants.get(css);
  if (!variant) {
    variant = { css };
    variants.set(css, variant);
  }
  documents.push({ htmlPath, css: variant.css });
}

// Seuil : en dessous, le round-trip reseau supplementaire ne vaut pas l'octet
// economise, et on garde le comportement d'origine.
const split = splitSharedCriticalCss(documents.map(d => d.css));
const shared = split.suffix;
function emitShared(name, css) {
  if (!css) return "";
  const fileName = `critical-${name}-${crypto.createHash("sha256").update(css).digest("hex").slice(0, 16)}.css`;
  fs.writeFileSync(path.join(assetsDir, fileName), css, "utf8");
  return `<link rel="stylesheet" href="/assets/${fileName}">`;
}
const sharedLink = emitShared("base", shared);
const prefixLink = emitShared("prefix", split.prefix);
const sharedBytes = Buffer.byteLength(shared) + Buffer.byteLength(split.prefix);

const emitted = new Map();
let converted = 0;
let inlineBytes = 0;

for (const [index, { htmlPath, css }] of documents.entries()) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const { own, hasPrefix } = split.parts[index];
  const hash = crypto.createHash("sha256").update(own).digest("hex").slice(0, 16);
  const fileName = `critical-${hash}.css`;
  const outputPath = path.join(assetsDir, fileName);

  if (!emitted.has(hash)) {
    if (!fs.existsSync(outputPath)) fs.writeFileSync(outputPath, own, "utf8");
    emitted.set(hash, { fileName, bytes: Buffer.byteLength(own) });
  }

  const link = `${hasPrefix ? prefixLink : ""}<link id="critical-css" rel="stylesheet" href="/assets/${fileName}">${sharedLink}`;
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
if (sharedBytes) {
  console.log(
    `  blocs communs (préfixe/suffixe): ${(sharedBytes / 1024).toFixed(1)} KiB sortis de ${emitted.size} fichiers, ` +
    `${formatMiB(sharedBytes * (emitted.size - 1))} economises`,
  );
}

if (converted === 0 && alreadyExternal === 0) {
  console.error("Critical CSS externalization failed: no ToolTrim HTML document was found.");
  process.exit(1);
}
