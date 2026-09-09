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

const emitted = new Map();
let converted = 0;
let alreadyExternal = 0;
let standalone = 0;
let inlineBytes = 0;

for (const htmlPath of htmlFiles) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const match = html.match(stylePattern);
  if (!match) {
    if (html.includes('<link id="critical-css" rel="stylesheet"')) alreadyExternal += 1;
    else standalone += 1;
    continue;
  }

  const css = match[1];
  const hash = crypto.createHash("sha256").update(css).digest("hex").slice(0, 16);
  const fileName = `critical-${hash}.css`;
  const outputPath = path.join(assetsDir, fileName);

  if (!emitted.has(hash)) {
    if (!fs.existsSync(outputPath)) fs.writeFileSync(outputPath, css, "utf8");
    emitted.set(hash, { fileName, bytes: Buffer.byteLength(css) });
  }

  const link = `<link id="critical-css" rel="stylesheet" href="/assets/${fileName}">`;
  fs.writeFileSync(htmlPath, html.replace(stylePattern, link), "utf8");
  converted += 1;
  inlineBytes += Buffer.byteLength(css);
}

const uniqueBytes = [...emitted.values()].reduce((sum, asset) => sum + asset.bytes, 0);
const savedBytes = inlineBytes - uniqueBytes;
const formatMiB = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;

console.log(
  `Critical CSS externalized: ${converted} HTML files, ${emitted.size} shared assets, ` +
  `${formatMiB(savedBytes)} removed from repeated HTML, ${standalone} standalone HTML skipped.`,
);

if (converted === 0 && alreadyExternal === 0) {
  console.error("Critical CSS externalization failed: no ToolTrim HTML document was found.");
  process.exit(1);
}
