#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("dist");
const MiB = 1024 * 1024;

// These ceilings capture the current architecture without pretending it is
// lightweight. They stop silent regressions while the larger prerender/data
// redesign is handled separately.
const budgets = {
  // 12_800 left 4 files of headroom; guide pages gained cover/tools/related
  // variants (2026-09-24), a handful of small shared critical CSS files.
  // 12_900 (2026-09-25): category pages aligned on /tools, about twenty
  // critical CSS variants across the 48 pages; shared catalogue modules are
  // already grouped in one chunk (vite.config.ts, "catalog-shared").
  // 13_000 (2026-09-25): 1179 tools (two added) and researched fiches with
  // full plan grids, each tool is about ten prerendered files.
  // 13_200 (2026-09-27): verified baseline 13_022, plus 3 new tools
  // (30 routes), 78 sourced media assets and 2 shared CSS variants = 13_132.
  // Keep the byte budgets unchanged; this is catalogue growth, not a bypass.
  // 13_250 (2026-09-27): five new tool records (50 routes), sourced
  // media and shared CSS; measured output 13_217. Byte limits unchanged.
  // PDF Agile and Piktochart additions: measured 13,251 files, 750.5 MiB HTML.
  // B12/Wix and two bilingual guides: measured 13,294 files, six new routes.
  // 2026-09-28: 150 sourced Maxon listings generate 1,500 additional
  // localized tool routes. Measured output: 14,816 files, 975.7 MiB total,
  // 873.5 MiB HTML. Retain a narrow margin rather than disabling the audit.
  // 2026-09-30: 100 researched fiches merged (full plan grids per language):
  // measured 14,886 files and 30.1 MiB CSS, the new critical CSS variants of
  // the pricing cards. Narrow margin kept.
  // 2026-09-30: Viso AI adds 47 bilingual prerender outputs; measured 14,933.
  // Keep a narrow 17-file margin for generated variants, without changing byte budgets.
  // 2026-10-01: 54 more researched fiches and 48 hashed catalogue shards
  // (was 29 by first letter): measured 14,972 files, 987.2 MiB total,
  // 880.1 MiB HTML, 32.5 MiB CSS. Sized for the ~120 dossiers still to merge.
  files: 15_050,
  // Four-listing release: measured total 850.2 MiB after Pixlr addition.
  // 2026-10-02 (US-NAV-01): search and menu buttons in the shared topbar add
  // about 2 KB of markup and critical CSS to each of the ~13,100 pages, plus
  // ten best-of guide pages: measured 1,018.2 MiB total, 907.9 MiB HTML,
  // 34.5 MiB CSS.
  // Rail redesign (same story): measured 1,042.4 MiB total, 931.5 MiB HTML;
  // the rail rules are written twice (manual and forced rail), see TODO.
  totalBytes: 1_060 * MiB,
  // Three bilingual comparison pages: measured HTML 752.2 MiB (six new routes).
  htmlBytes: 950 * MiB,
  javascriptBytes: 15 * MiB,
  // 32 MiB (2026-09-30): each researched fiche adds pricing-card critical CSS
  // variants (+0.2 MiB per 25 fiches, 30.7 MiB at 146); sized for the ~200
  // remaining fiches instead of a bump per batch.
  // 2026-10-02: Nick Launches adds two localized routes; measured 34.021 MiB.
  // Keep 80 KiB of headroom for the generated critical-CSS variants.
  // 2026-10-02 (US-NAV-01): shell search and menu buttons on every page,
  // measured 34.5 MiB.
  cssBytes: 36 * MiB,
  duplicateBytes: 3 * MiB,
};

if (!fs.existsSync(root)) {
  console.error("Build output audit failed: dist/ does not exist.");
  process.exit(1);
}

const files = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else files.push({ absolute, relative: path.relative(root, absolute), size: fs.statSync(absolute).size });
  }
};
walk(root);

const byExtension = new Map();
const byHash = new Map();
let totalBytes = 0;

for (const file of files) {
  totalBytes += file.size;
  const extension = path.extname(file.relative).toLowerCase() || "[none]";
  const extensionStats = byExtension.get(extension) || { files: 0, bytes: 0 };
  extensionStats.files += 1;
  extensionStats.bytes += file.size;
  byExtension.set(extension, extensionStats);

  const hash = crypto.createHash("sha256").update(fs.readFileSync(file.absolute)).digest("hex");
  const matches = byHash.get(hash) || [];
  matches.push(file);
  byHash.set(hash, matches);
}

const duplicateGroups = [...byHash.values()].filter((group) => group.length > 1);
const duplicateBytes = duplicateGroups.reduce(
  (sum, group) => sum + group[0].size * (group.length - 1),
  0,
);
const htmlBytes = byExtension.get(".html")?.bytes || 0;
const javascriptBytes = byExtension.get(".js")?.bytes || 0;
const cssBytes = byExtension.get(".css")?.bytes || 0;
const legacyFaqFiles = files.filter((file) => /^(fr|en)\/tool\/[^/]+\/faq\/index\.html$/.test(file.relative));
const inlineCriticalStyles = files.filter((file) => {
  if (!file.relative.endsWith(".html")) return false;
  return fs.readFileSync(file.absolute, "utf8").includes('<style id="critical-css">');
});
const htmlWithoutCriticalCss = files.filter((file) => {
  if (!file.relative.endsWith(".html") || file.relative.startsWith("verification/")) return false;
  const html = fs.readFileSync(file.absolute, "utf8");
  return !html.includes('id="critical-css"');
});
const monolithicToolCatalogChunks = files.filter((file) =>
  /^assets\/data-tools-[^/]+\.js$/.test(file.relative),
);
const toolCatalogShards = files.filter((file) =>
  /^assets\/tool-catalog\/[^/]+\.json$/.test(file.relative),
);
const largestToolCatalogShard = toolCatalogShards.reduce(
  (largest, file) => Math.max(largest, file.size),
  0,
);
const monolithicStackCatalogChunks = files.filter((file) =>
  /^assets\/data-stacks-[^/]+\.js$/.test(file.relative),
);
const stackCatalogShards = files.filter((file) =>
  /^assets\/stack-catalog\/[^/]+\.json$/.test(file.relative),
);
const largestStackCatalogShard = stackCatalogShards.reduce(
  (largest, file) => Math.max(largest, file.size),
  0,
);
const formatMiB = (bytes) => `${(bytes / MiB).toFixed(1)} MiB`;

console.log(`Build output: ${files.length} files, ${formatMiB(totalBytes)}`);
console.log(`  HTML: ${byExtension.get(".html")?.files || 0} files, ${formatMiB(htmlBytes)}`);
console.log(`  JavaScript: ${byExtension.get(".js")?.files || 0} files, ${formatMiB(javascriptBytes)}`);
console.log(`  CSS: ${byExtension.get(".css")?.files || 0} files, ${formatMiB(cssBytes)}`);
console.log(`  Exact duplicates: ${duplicateGroups.length} groups, ${formatMiB(duplicateBytes)} redundant`);
console.log(`  Legacy tool FAQ files: ${legacyFaqFiles.length}`);
console.log(`  Inline critical CSS blocks: ${inlineCriticalStyles.length}`);
console.log(`  ToolTrim HTML files without critical CSS: ${htmlWithoutCriticalCss.length}`);
console.log(`  Monolithic tool catalogue chunks: ${monolithicToolCatalogChunks.length}`);
console.log(`  Tool catalogue shards: ${toolCatalogShards.length}, largest ${formatMiB(largestToolCatalogShard)}`);
console.log(`  Monolithic stack catalogue chunks: ${monolithicStackCatalogChunks.length}`);
console.log(`  Stack catalogue shards: ${stackCatalogShards.length}, largest ${formatMiB(largestStackCatalogShard)}`);

for (const group of duplicateGroups
  .sort((a, b) => b[0].size * (b.length - 1) - a[0].size * (a.length - 1))
  .slice(0, 5)) {
  console.log(
    `    ${group.length}x ${formatMiB(group[0].size)}: ${group.map((file) => file.relative).join(", ")}`,
  );
}

const failures = [
  [files.length, budgets.files, "file count", (value) => String(value)],
  [totalBytes, budgets.totalBytes, "total output", formatMiB],
  [htmlBytes, budgets.htmlBytes, "HTML output", formatMiB],
  [javascriptBytes, budgets.javascriptBytes, "JavaScript output", formatMiB],
  [cssBytes, budgets.cssBytes, "CSS output", formatMiB],
  [duplicateBytes, budgets.duplicateBytes, "exact duplicate bytes", formatMiB],
  [legacyFaqFiles.length, 0, "legacy tool FAQ files", (value) => String(value)],
  [inlineCriticalStyles.length, 0, "inline critical CSS blocks", (value) => String(value)],
  [htmlWithoutCriticalCss.length, 0, "ToolTrim HTML files without critical CSS", (value) => String(value)],
  [monolithicToolCatalogChunks.length, 0, "monolithic tool catalogue chunks", (value) => String(value)],
  [toolCatalogShards.length < 1 ? 1 : 0, 0, "missing tool catalogue shards", (value) => String(value)],
  [largestToolCatalogShard, 1 * MiB, "largest tool catalogue shard", formatMiB],
  [monolithicStackCatalogChunks.length, 0, "monolithic stack catalogue chunks", (value) => String(value)],
  [stackCatalogShards.length < 1 ? 1 : 0, 0, "missing stack catalogue shards", (value) => String(value)],
  [largestStackCatalogShard, 1 * MiB, "largest stack catalogue shard", formatMiB],
].filter(([value, limit]) => value > limit);

if (failures.length > 0) {
  for (const [value, limit, label, format] of failures) {
    console.error(`Budget exceeded — ${label}: ${format(value)} > ${format(limit)}`);
  }
  process.exit(1);
}

console.log("Build output budgets PASS");
