import { rmSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { STACKS } from "../src/data/stacks";

const outputDir = resolve("dist/assets/stack-catalog");
const getShardKey = (slug: string) => {
  const firstCharacter = slug.trim().toLowerCase().charAt(0);
  return /^[a-z0-9]$/.test(firstCharacter) ? firstCharacter : "other";
};

const shards = new Map<string, typeof STACKS>();
for (const stack of STACKS) {
  const key = getShardKey(stack.slug);
  const entries = shards.get(key) || [];
  entries.push(stack);
  shards.set(key, entries);
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

let bytes = 0;
for (const [key, entries] of [...shards].sort(([a], [b]) => a.localeCompare(b))) {
  const json = JSON.stringify(entries);
  writeFileSync(resolve(outputDir, `${key}.json`), json);
  bytes += Buffer.byteLength(json);
}

console.log(
  `Stack catalogue shards: ${shards.size} files, ${STACKS.length} stacks, ` +
  `${(bytes / (1024 * 1024)).toFixed(1)} MiB.`,
);
