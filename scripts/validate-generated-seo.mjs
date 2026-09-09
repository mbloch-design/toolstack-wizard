import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sitemapPath = path.join(root, "dist", "sitemap.xml");
const failures = [];

if (!fs.existsSync(sitemapPath)) {
  console.error("SEO validation failed: dist/sitemap.xml is missing. Run npm run build first.");
  process.exit(1);
}

const xml = fs.readFileSync(sitemapPath, "utf8");
const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
const getTag = (block, tag) => block.match(new RegExp(`<${tag}>(.*?)<\\/${tag}>`))?.[1];
const locs = blocks.map((block) => getTag(block, "loc")).filter(Boolean);
const locSet = new Set(locs);
const htmlCache = new Map();

function htmlFor(url) {
  if (htmlCache.has(url)) return htmlCache.get(url);
  const pathname = new URL(url).pathname;
  const file = path.resolve(root, "dist", `.${pathname}`, "index.html");
  const html = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  htmlCache.set(url, html);
  return html;
}

if (locSet.size !== locs.length) failures.push(`duplicate sitemap URLs: ${locs.length - locSet.size}`);

for (const [index, block] of blocks.entries()) {
  const loc = locs[index];
  if (!loc) continue;
  const parsed = new URL(loc);
  if (parsed.protocol !== "https:" || parsed.hostname !== "tooltrim.com") failures.push(`${loc}: non-canonical host or protocol`);
  if (parsed.search || parsed.hash) failures.push(`${loc}: sitemap URL contains parameters or a fragment`);

  const html = htmlFor(loc);
  if (!html) {
    failures.push(`${loc}: generated HTML missing`);
    continue;
  }
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  if (canonical !== loc) failures.push(`${loc}: canonical is ${canonical || "missing"}`);
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) failures.push(`${loc}: sitemap page is noindex`);

  const alternates = [...block.matchAll(/<xhtml:link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"/g)];
  for (const [, lang, href] of alternates) {
    if (!locSet.has(href)) failures.push(`${loc}: hreflang ${lang} target is outside the sitemap (${href})`);
    const targetHtml = htmlFor(href);
    if (!targetHtml) continue;
    const reciprocal = [...targetHtml.matchAll(/<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href="([^"]+)"/gi)]
      .some((match) => match[1] === loc);
    if (!reciprocal && lang !== "x-default") failures.push(`${loc}: no reciprocal hreflang from ${href}`);
  }
}

if (failures.length) {
  console.error(`SEO validation failed with ${failures.length} issue(s):`);
  failures.slice(0, 50).forEach((failure) => console.error(`- ${failure}`));
  if (failures.length > 50) console.error(`- … ${failures.length - 50} more`);
  process.exit(1);
}

console.log(`SEO generated validation PASS: ${locs.length} unique, indexable, self-canonical URLs with valid sitemap hreflang targets.`);
