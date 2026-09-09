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
  files: 12_800,
  totalBytes: 850 * MiB,
  htmlBytes: 750 * MiB,
  javascriptBytes: 15 * MiB,
  cssBytes: 30 * MiB,
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
