#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const batch = process.argv.find((arg) => arg.startsWith("--batch="))?.split("=")[1];
if (!batch) throw new Error("Usage: node scripts/collect-review-media-candidates.mjs --batch=<id>");

const manifest = JSON.parse(readFileSync(path.join(root, "research/review-work-orders", batch, "manifest.json"), "utf8"));
const tools = JSON.parse(readFileSync(path.join(root, "src/data/tools_v4.json"), "utf8"));
const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
const output = {};

const blocked = /(logo|avatar|icon|favicon|badge|star|flag|portrait|testimonial|customer|client|cookie|pixel|tracking|spinner|loader|payment|rating|trustpilot|capterra|gartner|background)/i;
const imageLike = /\.(?:avif|gif|jpe?g|png|webp)(?:[?#]|$)|\/_next\/image\?|\/cdn-cgi\/image\/|\/image\/upload\//i;

function decode(value) {
  let result = String(value || "");
  for (let pass = 0; pass < 3; pass += 1) {
    result = result
      .replaceAll("&amp;", "&")
      .replaceAll("&#x26;", "&")
      .replaceAll("&#38;", "&")
      .replaceAll("&#x2F;", "/")
      .replaceAll("&#47;", "/")
      .replaceAll("&quot;", "\"");
  }
  return result;
}

function extract(html, pageUrl) {
  const raw = [];
  for (const match of html.matchAll(/<img\b([^>]+)>/gi)) {
    const attrs = match[1];
    const alt = attrs.match(/\balt=["']([^"']*)["']/i)?.[1] || "";
    const width = Number(attrs.match(/\bwidth=["']?(\d+)/i)?.[1] || 0);
    const height = Number(attrs.match(/\bheight=["']?(\d+)/i)?.[1] || 0);
    for (const source of attrs.matchAll(/(?:src|data-src|data-lazy-src)=["']([^"']+)["']/gi)) raw.push({ value: source[1], alt, width, height });
    for (const sourceSet of attrs.matchAll(/(?:srcset|data-srcset)=["']([^"']+)["']/gi)) {
      for (const part of sourceSet[1].split(",")) raw.push({ value: part.trim().split(/\s+/)[0], alt, width, height });
    }
  }
  for (const match of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/gi)) raw.push({ value: match[1], alt: "Official product preview", width: 0, height: 0 });
  for (const match of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/gi)) raw.push({ value: match[1], alt: "Official product preview", width: 0, height: 0 });

  const seen = new Set();
  const items = [];
  for (const candidate of raw) {
    try {
      const url = new URL(decode(candidate.value), pageUrl).toString();
      const parsed = new URL(url);
      const key = `${parsed.origin}${parsed.pathname}`;
      const tooSmall = candidate.width > 0 && candidate.height > 0 && (candidate.width < 500 || candidate.height < 250);
      if (!/^https?:/.test(url) || !imageLike.test(url) || blocked.test(`${url} ${candidate.alt}`) || tooSmall || seen.has(key)) continue;
      seen.add(key);
      items.push({ url, alt: decode(candidate.alt), width: candidate.width, height: candidate.height });
    } catch {}
  }
  return items.slice(0, 30);
}

async function collect(slug) {
  const tool = bySlug.get(slug);
  const pageUrl = tool?.websiteUrl || tool?.website_url || tool?.affiliateLink || tool?.affiliate_link;
  if (!pageUrl) return { slug, page_url: null, candidates: [], error: "official_url_missing" };
  try {
    const response = await fetch(pageUrl, {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; ToolTrimMediaReview/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    return { slug, page_url: response.url, candidates: extract(html, response.url) };
  } catch (error) {
    return { slug, page_url: pageUrl, candidates: [], error: String(error.message || error) };
  }
}

for (let offset = 0; offset < manifest.tools.length; offset += 8) {
  const slugs = manifest.tools.slice(offset, offset + 8).map((item) => item.slug);
  const results = await Promise.all(slugs.map(collect));
  for (const result of results) output[result.slug] = result;
}

const outputFile = path.join(root, "research", `${batch}-media-candidates.json`);
writeFileSync(outputFile, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({
  batch,
  total: manifest.tools.length,
  with_four: Object.values(output).filter((item) => item.candidates.length >= 4).length,
  with_two: Object.values(output).filter((item) => item.candidates.length >= 2).length,
  empty: Object.values(output).filter((item) => item.candidates.length === 0).length,
  output: path.relative(root, outputFile),
}, null, 2));
