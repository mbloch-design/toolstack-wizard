#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";

const root = process.cwd();
const run = JSON.parse(readFileSync(`${root}/research/review-runs/review-autonomous-100-001.json`, "utf8"));
const candidates = JSON.parse(readFileSync(`${root}/research/autonomous-100-media-candidates.json`, "utf8"));
const decorative = /(logo|avatar|icon|badge|star|flag|portrait|testimonial|customer|client|cookie|pixel|tracking|spinner|loader|rating|gartner|gradient|linear|background)/i;

let enriched = 0;
let retained = 0;

for (const slug of run.slugs) {
  const file = `${root}/research/media-evidence/${slug}.json`;
  const evidence = JSON.parse(readFileSync(file, "utf8"));
  const observed = (candidates[slug]?.assets || [])
    .filter((asset) => asset.w >= 500 && asset.h >= 250)
    .filter((asset) => !decorative.test(`${asset.src} ${asset.alt || ""}`));
  const existingUrls = new Set(evidence.items.map((item) => item.url.split("?")[0]));
  const additions = [];
  for (const asset of observed) {
    const key = asset.src.split("?")[0];
    if (existingUrls.has(key)) continue;
    existingUrls.add(key);
    additions.push({
      kind: "image",
      url: asset.src,
      source_page_url: candidates[slug]?.url || evidence.discovery.official_pages_checked[0],
      official: true,
      alt: asset.alt || undefined,
    });
    if (additions.length === 3) break;
  }

  if (evidence.mode === "fallback_screenshot") {
    if (additions.length >= 2) {
      evidence.mode = "sourced";
      evidence.discovery.official_media_found = true;
      evidence.items = additions;
      enriched += 1;
    } else {
      retained += 1;
    }
  } else if (additions.length) {
    evidence.items = [...evidence.items, ...additions].slice(0, 4);
    enriched += 1;
  } else {
    retained += 1;
  }
  writeFileSync(file, `${JSON.stringify(evidence, null, 2)}\n`);
}

console.log(JSON.stringify({ enriched, retained }, null, 2));
