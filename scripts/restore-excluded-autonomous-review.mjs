#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const excluded = new Set([
  "wized",
  "ae-animation-composer",
  "ae-bao-boa",
  "ae-bodymovin",
  "ae-gifgun",
  "ae-newton3",
  "ae-overlord",
  "ae-red-giant",
  "ae-rubberhose",
  "aescripts-flow",
  "auto-rig-pro",
]);
const file = "src/data/tools_v4.json";
const current = JSON.parse(readFileSync(file, "utf8"));
const baseline = JSON.parse(execFileSync("git", ["show", `HEAD:${file}`], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
const baselineBySlug = new Map(baseline.map((tool) => [tool.slug, tool]));
const run = JSON.parse(readFileSync("research/review-runs/review-autonomous-100-001.json", "utf8"));
const selected = new Set(run.slugs);
const restored = current.map((tool) => {
  if (excluded.has(tool.slug)) return baselineBySlug.get(tool.slug);
  if (selected.has(tool.slug)) return JSON.parse(JSON.stringify(tool).replaceAll("—", "-"));
  return tool;
});
writeFileSync(file, `${JSON.stringify(restored, null, 2)}\n`);
console.log(`Excluded records restored: ${excluded.size}`);
