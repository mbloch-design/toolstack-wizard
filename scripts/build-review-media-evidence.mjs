#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const batch = process.argv.find((arg) => arg.startsWith("--batch="))?.split("=")[1];
if (!batch) throw new Error("Usage: node scripts/build-review-media-evidence.mjs --batch=<id>");

const manifest = JSON.parse(readFileSync(path.join(root, "research/review-work-orders", batch, "manifest.json"), "utf8"));
const candidates = JSON.parse(readFileSync(path.join(root, "research", `${batch}-media-candidates.json`), "utf8"));
const selectionFile = path.join(root, "research", `${batch}-media-selection.json`);
const selections = JSON.parse(readFileSync(selectionFile, "utf8"));
const tools = JSON.parse(readFileSync(path.join(root, "src/data/tools_v4.json"), "utf8"));
const ledger = JSON.parse(readFileSync(path.join(root, "research/catalog-review-ledger.json"), "utf8"));
const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
const statusBySlug = new Map(ledger.entries.map((entry) => [entry.slug, entry.status]));
const written = [];

function normalizedKey(url) {
  return String(url).replace(/-p-\d+(?=\.(?:avif|gif|jpe?g|png|webp))/i, "").replace(/[?#].*$/, "");
}

for (const item of manifest.tools) {
  const slug = item.slug;
  if (statusBySlug.get(slug) !== "QUEUED") continue;
  const tool = bySlug.get(slug);
  const config = selections[slug] || {};
  const found = candidates[slug]?.candidates || [];
  const selected = [
    ...(config.candidate_indexes || []).map((index) => found[index]).filter(Boolean),
    ...(config.urls || []).map((url) => ({ url, alt: `${tool.name} product preview` })),
  ];
  const existing = config.include_existing === false ? [] : [tool?.ogImageUrl, ...(tool?.galleryImages || [])]
    .filter(Boolean)
    .map((url) => ({ url, alt: `${tool.name} official product preview`, existing: true }));
  const combined = [...selected, ...existing];
  const hasRemoteSelection = selected.some((entry) => /^https?:/.test(entry.url) && !entry.url.includes("tooltrim.com/og-screenshots/"));
  const seen = new Set();
  const items = [];
  for (const candidate of combined) {
    const key = normalizedKey(candidate.url);
    if (seen.has(key)) continue;
    seen.add(key);
    const localFallback = /^\/?(?:tool-media|og-screenshots)\//.test(candidate.url) || candidate.url.includes("tooltrim.com/og-screenshots/");
    if (hasRemoteSelection && localFallback) continue;
    items.push({
      kind: "image",
      url: candidate.url,
      source_page_url: tool.websiteUrl,
      official: !localFallback,
      alt: candidate.alt || `${tool.name} official product preview`,
    });
    if (items.length === 4) break;
  }
  if (!items.length) throw new Error(`${slug}: aucun média sélectionné`);
  const onlyFallback = !items.some((entry) => entry.official);
  const finalItems = onlyFallback
    ? [{
        ...items[0],
        url: new URL(items[0].url, "https://tooltrim.com").pathname,
        kind: "screenshot",
        capture_method: "browser_screenshot",
        official: false,
      }]
    : items;
  const evidence = {
    slug,
    verified_on: "2026-08-31",
    mode: onlyFallback ? "fallback_screenshot" : "sourced",
    discovery: {
      official_media_found: !onlyFallback,
      official_pages_checked: [tool.websiteUrl],
    },
    items: finalItems,
  };
  writeFileSync(path.join(root, "research/media-evidence", `${slug}.json`), `${JSON.stringify(evidence, null, 2)}\n`);
  written.push({ slug, media: finalItems.length, mode: evidence.mode });
}

console.log(JSON.stringify({ batch, written }, null, 2));
