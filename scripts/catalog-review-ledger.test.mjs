import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildLedger, buildReviewWorkOrder, markEntry, validateLedger, validateMediaEvidence } from "./catalog-review-ledger.mjs";

const bundleDir = mkdtempSync(path.join(tmpdir(), "tooltrim-review-ledger-"));
const mediaEvidenceDir = mkdtempSync(path.join(tmpdir(), "tooltrim-media-evidence-"));
writeFileSync(path.join(bundleDir, "alpha.json"), "{}\n");
const sourcedMedia = {
  slug: "alpha",
  verified_on: "2026-08-29",
  mode: "sourced",
  discovery: { official_media_found: true, official_pages_checked: ["https://alpha.example"] },
  items: [{ kind: "image", url: "https://alpha.example/media.jpg", source_page_url: "https://alpha.example", official: true }],
};
writeFileSync(path.join(mediaEvidenceDir, "alpha.json"), JSON.stringify(sourcedMedia));

const tools = [
  { slug: "alpha", name: "Alpha", category: "creation", longDescription: "x".repeat(400), longDescriptionEn: "x", websiteUrl: "https://alpha.example" },
  { slug: "beta", name: "Beta", category: "creation", longDescription: "court" },
];

const ledger = buildLedger({ tools, today: "2026-08-29", batchSize: 10, bundleDir, mediaEvidenceDir });
assert.equal(ledger.entries.length, 2);
assert.equal(new Set(ledger.entries.map((entry) => entry.slug)).size, 2);
assert.ok(ledger.entries.every((entry) => entry.assigned_batch));
assert.deepEqual(validateLedger(ledger, tools), []);
const firstBatch = ledger.entries[0].assigned_batch;
const workOrder = buildReviewWorkOrder({ ledger, tools, batchId: firstBatch, bundleDir, mediaEvidenceDir });
assert.ok(workOrder.tools.length >= 1);
assert.ok(workOrder.tools.every((item) => item.tracking.assigned_batch === firstBatch));
assert.ok(workOrder.tools.every((item) => item.current.slug));

const alpha = ledger.entries.find((entry) => entry.slug === "alpha");
markEntry(ledger, { slug: "alpha", status: "RESEARCHED", at: "2026-08-29" });
markEntry(ledger, { slug: "alpha", status: "EDITORIAL_READY", at: "2026-08-29" });
markEntry(ledger, { slug: "alpha", status: "MEDIA_READY", at: "2026-08-29" });
markEntry(ledger, { slug: "alpha", status: "VALIDATED", reviewer: "ToolTrim", at: "2026-08-29" });
assert.equal(alpha.reviewed_hash, alpha.review_fingerprint);
markEntry(ledger, { slug: "alpha", status: "RENDER_VERIFIED", reviewer: "ToolTrim", at: "2026-08-29" });
markEntry(ledger, { slug: "alpha", status: "PUBLISHED", reviewer: "ToolTrim", at: "2026-08-29" });
assert.equal(alpha.status, "PUBLISHED");
assert.deepEqual(validateLedger(ledger, tools), []);

const changedTools = [{ ...tools[0], longDescription: "changed" }, tools[1]];
const changed = buildLedger({ tools: changedTools, previous: ledger, today: "2026-08-30", batchSize: 10, bundleDir, mediaEvidenceDir });
const changedAlpha = changed.entries.find((entry) => entry.slug === "alpha");
assert.equal(changedAlpha.status, "STALE");
assert.equal(changedAlpha.invalidated_from, "PUBLISHED");
assert.equal(changedAlpha.assigned_batch, alpha.assigned_batch);
assert.equal(changedAlpha.batch_position, alpha.batch_position);

const priorityChangedTools = [
  { ...tools[0], longDescription: "x" },
  { ...tools[1], longDescription: "x".repeat(400), websiteUrl: "https://beta.example" },
];
const priorityChanged = buildLedger({ tools: priorityChangedTools, previous: ledger, today: "2026-08-30", batchSize: 10, bundleDir, mediaEvidenceDir });
for (const previousEntry of ledger.entries) {
  const currentEntry = priorityChanged.entries.find((entry) => entry.slug === previousEntry.slug);
  assert.equal(currentEntry.assigned_batch, previousEntry.assigned_batch);
  assert.equal(currentEntry.batch_position, previousEntry.batch_position);
}

assert.throws(
  () => markEntry(changed, { slug: "beta", status: "PUBLISHED", reviewer: "ToolTrim", at: "2026-08-30" }),
  /Transition interdite/,
);
const beta = changed.entries.find((entry) => entry.slug === "beta");
beta.status = "EDITORIAL_READY";
assert.throws(
  () => markEntry(changed, { slug: "beta", status: "MEDIA_READY", at: "2026-08-30" }),
  /preuve média valide requise/,
);

assert.deepEqual(validateMediaEvidence({
  slug: "beta",
  verified_on: "2026-08-29",
  mode: "fallback_screenshot",
  discovery: { official_media_found: false, official_pages_checked: ["https://beta.example"] },
  items: [{ kind: "screenshot", url: "/og-screenshots/beta.png", source_page_url: "https://beta.example", official: false, capture_method: "browser_screenshot" }],
}, "beta"), []);
assert.ok(validateMediaEvidence({
  ...sourcedMedia,
  items: [{ ...sourcedMedia.items[0], capture_method: "browser_screenshot" }],
}, "alpha").includes("sourced_media_cannot_be_self_captured"));
assert.ok(validateMediaEvidence({
  slug: "beta",
  verified_on: "2026-08-29",
  mode: "fallback_screenshot",
  discovery: { official_media_found: false, official_pages_checked: ["https://beta.example"] },
  items: [
    { kind: "screenshot", url: "/one.png", source_page_url: "https://beta.example", official: false, capture_method: "browser_screenshot" },
    { kind: "screenshot", url: "/two.png", source_page_url: "https://beta.example", official: false, capture_method: "browser_screenshot" },
  ],
}, "beta").includes("fallback_requires_exactly_one_screenshot"));

console.log("catalog-review-ledger tests: PASS");
