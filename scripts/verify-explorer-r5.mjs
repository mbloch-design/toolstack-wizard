import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { summarizeExplorerReview } from "./lib/explorer-r5-review.mjs";

// Integrity can pass while editorial quality remains open. Release callers
// must explicitly request --require-quality to enforce the editorial gate.
const flags = process.argv.slice(2);
if (flags.some(flag => flag !== "--require-quality")) throw new Error("Unknown R5 audit option");
const proof = path.resolve("docs/proofs/explorer-r5-second-2026-10-09");
const read = file => JSON.parse(fs.readFileSync(path.join(proof, file), "utf8"));
const manifest = read("manifest.json");
const hash = file => createHash("sha256").update(fs.readFileSync(file)).digest("hex");
assert.equal(hash("src/data/tools_index.json"), manifest.catalogueSha256, "R5 catalogue changed; repeat the review");
assert.equal(hash(path.join(proof, "candidate.json")), manifest.candidateSha256, "R5 candidate evidence changed");
assert.equal(hash(path.join(proof, "independent-review.json")), manifest.reviewSha256, "R5 editorial evidence changed");
const replay = spawnSync(path.resolve("node_modules/.bin/tsx"), ["scripts/audit-explorer-relations-r5.ts"], {
  encoding: "utf8", maxBuffer: 4 * 1024 * 1024,
});
if (replay.error || replay.status !== 0) throw new Error("R5 candidate replay failed", { cause: replay.error || replay.stderr });
const candidate = read("candidate.json");
assert.deepEqual(JSON.parse(replay.stdout), candidate, "R5 output changed; repeat the editorial review");
assert.deepEqual(candidate.map(row => row.slug), manifest.sourceSlugs, "R5 source coverage changed");
const summary = summarizeExplorerReview(candidate, read("independent-review.json"));
assert.deepEqual(summary, manifest.summary, "R5 recorded metrics are stale");
console.log("R5 evidence integrity: PASS (catalogue, replay, coverage, ranks, directions, displayed reasons and metrics)");
console.log(JSON.stringify(summary, null, 2));
console.log(`R5 editorial gate: ${summary.quality_gate}; missing and partial/unknown slots are not successes.`);
if (flags.includes("--require-quality") && summary.quality_gate !== "ATTAINED") process.exit(1);
