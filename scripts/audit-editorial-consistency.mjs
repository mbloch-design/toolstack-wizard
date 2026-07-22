/**
 * Structural audit for the lightweight catalogue projection.
 * This does not rewrite editorial content: it identifies records that need to
 * be corrected in the canonical database/editorial pipeline.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "src", "data", "tools_index.json");
const STRICT = process.argv.includes("--strict");
const WRITE = process.argv.includes("--write");
const tools = JSON.parse(readFileSync(SOURCE, "utf8"));
const issues = [];

const add = (tool, severity, code, detail) => issues.push({
  slug: tool.slug || tool.id || "unknown",
  name: tool.name || tool.id || "Unknown",
  severity,
  code,
  detail,
});

const seenSlugs = new Set();
for (const tool of tools) {
  const slug = String(tool.slug || tool.id || "").trim();
  const name = String(tool.name || "").trim();
  const fr = String(tool.shortDescription || tool.short_description || "").replace(/\s+/g, " ").trim();
  const en = String(tool.shortDescriptionEn || tool.short_description_en || "").replace(/\s+/g, " ").trim();
  const price = Number(tool.pricing_v5?.compare_price_monthly_eur ?? tool.defaultMonthlyPrice ?? tool.default_monthly_price ?? 0);

  if (!slug) add(tool, "error", "missing_slug", "A stable slug is required by every consumer.");
  else if (seenSlugs.has(slug)) add(tool, "error", "duplicate_slug", slug);
  else seenSlugs.add(slug);
  if (!name) add(tool, "error", "missing_name", "Product name is empty.");
  if (!tool.categoryId && !tool.category) add(tool, "error", "missing_category", "Category projection is empty.");
  if (!fr) add(tool, "warning", "missing_description_fr", "French card description is empty.");
  else if (fr.length < 36) add(tool, "review", "description_fr_too_short", `${fr.length} characters`);
  else if (fr.length > 180) add(tool, "review", "description_fr_too_long", `${fr.length} characters`);
  if (!en) add(tool, "warning", "missing_description_en", "English card description falls back to French.");
  else if (en.length > 180) add(tool, "review", "description_en_too_long", `${en.length} characters`);
  if (!Number.isFinite(price) || price < 0) add(tool, "error", "invalid_monthly_price", String(price));
  if (tool.substitutable === false && tool.betterAlternative) {
    add(tool, "warning", "replacement_conflict", "Marked non-replaceable but exposes a better alternative.");
  }
}

const counts = issues.reduce((acc, issue) => ({
  ...acc,
  [issue.severity]: (acc[issue.severity] || 0) + 1,
}), {});

console.log(`Editorial consistency audit — ${tools.length} tools`);
console.table(counts);
issues.slice(0, 40).forEach((issue) => {
  console.log(`${issue.severity.toUpperCase().padEnd(8)} ${issue.slug.padEnd(32)} ${issue.code} — ${issue.detail}`);
});
if (issues.length > 40) console.log(`… ${issues.length - 40} additional issues`);

if (WRITE) {
  const outputDir = path.join(ROOT, "reports");
  mkdirSync(outputDir, { recursive: true });
  const output = path.join(outputDir, "editorial-consistency-audit.json");
  writeFileSync(output, `${JSON.stringify({ generatedAt: new Date().toISOString(), counts, items: issues }, null, 2)}\n`);
  console.log(`Report written to ${path.relative(ROOT, output)}`);
}

if (STRICT && issues.some((issue) => issue.severity === "error")) process.exitCode = 1;
