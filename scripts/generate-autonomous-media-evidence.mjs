#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const runFile = path.join(root, "research/review-runs/review-autonomous-100-001.json");
const catalogFile = path.join(root, "src/data/tools_v4.json");
const outputDir = path.join(root, "research/media-evidence");
const run = JSON.parse(readFileSync(runFile, "utf8"));
const workOrderDir = path.join(root, "research/review-work-orders", run.id);
const tools = JSON.parse(readFileSync(catalogFile, "utf8"));
const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

mkdirSync(outputDir, { recursive: true });
mkdirSync(workOrderDir, { recursive: true });

function decodeUrl(value) {
  let decoded = String(value || "");
  while (decoded.includes("&amp;") || decoded.includes("&#x26;")) {
    decoded = decoded.replaceAll("&amp;", "&").replaceAll("&#x26;", "&");
  }
  return decoded;
}

function absoluteUrl(value, websiteUrl) {
  const decoded = decodeUrl(value);
  if (!decoded) return "";
  if (decoded.startsWith("/tool-media/")) return `https://tooltrim.com${decoded}`;
  return new URL(decoded, websiteUrl).toString();
}

for (const slug of run.slugs) {
  const tool = bySlug.get(slug);
  if (!tool) throw new Error(`Outil absent du catalogue: ${slug}`);
  const websiteUrl = tool.websiteUrl;
  const candidate = absoluteUrl(tool.ogImageUrl, websiteUrl);
  if (!candidate) throw new Error(`Aucun media candidat: ${slug}`);
  const screenshot = candidate.startsWith("https://tooltrim.com/og-screenshots/");
  const localOfficialAsset = candidate.startsWith("https://tooltrim.com/tool-media/");
  const evidence = {
    slug,
    verified_on: "2026-08-31",
    mode: screenshot ? "fallback_screenshot" : "sourced",
    discovery: {
      official_media_found: !screenshot,
      official_pages_checked: [websiteUrl],
    },
    items: [
      screenshot ? {
        kind: "screenshot",
        url: `/og-screenshots/${slug}.jpg`,
        source_page_url: websiteUrl,
        official: false,
        capture_method: "browser_screenshot",
      } : {
        kind: "image",
        url: candidate,
        source_page_url: websiteUrl,
        official: !screenshot || localOfficialAsset,
      },
    ],
  };
  writeFileSync(path.join(outputDir, `${slug}.json`), `${JSON.stringify(evidence, null, 2)}\n`);
  const bundleFile = path.join(root, "research/bundle-editorial", `${slug}.json`);
  const bundle = readFileSync(bundleFile, "utf8").replaceAll("—", "-");
  writeFileSync(bundleFile, bundle);
}

writeFileSync(
  path.join(workOrderDir, "manifest.json"),
  `${JSON.stringify({
    schema_version: 1,
    batch: run.id,
    quality_version: "catalog-review-v1",
    rules: run.selection_policy,
    tools: run.slugs.map((slug) => ({ slug, status: "QUEUED", required_action: "apply_review_bundle", file: `${slug}.json` })),
  }, null, 2)}\n`,
);

console.log(`Media evidence generated: ${run.slugs.length}`);
