#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { compactHtml, assertHtmlEquivalent } from "./lib/compact-html.mjs";

// Exact comments from the source template, selected by their documented role.
// Verification tokens, conditional comments and React markers are excluded.
const documentaryPrefixes = [
  "Cookieless analytics —", "Dark mode is disabled site-wide", "Static OG defaults",
  "Static JSON-LD:", "Favicon stack —", "Preconnect for tool-logo fallback CDNs",
  "Uncut Sans Variable —", "Inter + Inter Tight —", "Google Consent Mode v2:",
];
const template = fs.readFileSync(path.resolve("index.html"), "utf8");
const documentaryComments = new Set([...template.matchAll(/<!--([\s\S]*?)-->/g)]
  .map((match) => match[1])
  .filter((comment) => documentaryPrefixes.some((prefix) => comment.trim().startsWith(prefix))));
const dist = path.resolve("dist");
let count = 0;
let beforeBytes = 0;
let afterBytes = 0;

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && entry.name.endsWith(".html")) {
      try {
        const before = fs.readFileSync(file, "utf8");
        const after = compactHtml(before, documentaryComments);
        assertHtmlEquivalent(before, after, documentaryComments);
        beforeBytes += Buffer.byteLength(before);
        afterBytes += Buffer.byteLength(after);
        if (after !== before) fs.writeFileSync(file, after, "utf8");
        count += 1;
      } catch (error) {
        throw new Error(`HTML compaction failed for ${path.relative(dist, file)}`, { cause: error });
      }
    }
  }
}
walk(dist);
if (count === 0) throw new Error("HTML compaction failed: no generated HTML documents");
console.log(`HTML compaction PASS: ${count} equivalent documents; ${((beforeBytes - afterBytes) / 1024 / 1024).toFixed(2)} MiB saved.`);
