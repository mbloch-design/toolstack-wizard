#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const sourcePath = path.resolve("src/data/tools_v4.json");
const outputDir = path.resolve("dist/assets/tool-catalog");
const tools = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

if (!Array.isArray(tools)) {
  throw new Error(`${sourcePath} must contain a tool array.`);
}

// Keep in sync with getToolShardKey in src/hooks/useSupabaseData.ts.
// Shards were keyed by first letter until 106 "universal-*" slugs pushed the
// "u" shard past 1 MiB; a hash spreads the catalogue evenly instead.
const SHARD_COUNT = 48;
const getShardKey = (value) => {
  const key = String(value || "").trim().toLowerCase();
  let hash = 5381;
  for (let index = 0; index < key.length; index += 1) {
    hash = ((hash * 33) ^ key.charCodeAt(index)) >>> 0;
  }
  return `s${hash % SHARD_COUNT}`;
};

const shards = new Map();
for (const tool of tools) {
  const slug = String(tool.slug || tool.id || "").trim();
  const id = String(tool.id || slug).trim();
  if (!slug) throw new Error("Tool catalogue contains an entry without a slug or id.");

  const keys = new Set([getShardKey(slug), getShardKey(id)]);
  for (const key of keys) {
    const entries = shards.get(key) || [];
    entries.push(tool);
    shards.set(key, entries);
  }
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

let bytes = 0;
for (const [key, entries] of [...shards].sort(([a], [b]) => a.localeCompare(b))) {
  const json = JSON.stringify(entries);
  fs.writeFileSync(path.join(outputDir, `${key}.json`), json);
  bytes += Buffer.byteLength(json);
}

console.log(
  `Tool catalogue shards: ${shards.size} files, ${tools.length} tools, ` +
  `${(bytes / (1024 * 1024)).toFixed(1)} MiB.`,
);
