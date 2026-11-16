import assert from "node:assert/strict";
import test from "node:test";
import { reconcileCatalog } from "./reconcile.mjs";

test("matches stable IDs independently from slugs and keeps JSON-only tools", () => {
  const report = reconcileCatalog({
    publishedJson: [{ id: "tool-1", slug: "alpha" }, { id: "tool-2", slug: "beta" }],
    dbSnapshot: [{ id: "tool-1", slug: "alpha", content_status: "published" }],
  });
  assert.deepEqual(report.identities, [{ id: "tool-1", slug: "alpha" }]);
  assert.deepEqual(report.missingRecords.jsonOnly, [{ id: "tool-2", slug: "beta" }]);
  assert.equal(report.sourceHashes.redisDrafts, null);
});

test("reports archive collisions and refuses a slug match with a different ID", () => {
  const report = reconcileCatalog({
    publishedJson: [{ id: "1", slug: "alpha" }],
    archives: [{ id: "2", slug: "alpha" }],
    dbSnapshot: [{ id: "3", slug: "alpha" }],
  });
  assert.equal(report.identityConflicts.catalogSlug[0].value, "alpha");
  assert.deepEqual(report.identityConflicts.crossSource, [
    { published: { id: "1", slug: "alpha" }, database: { id: "3", slug: "alpha" } },
  ]);
  assert.deepEqual(report.identities, []);
});

test("identifies differing projected facts without selecting a winner or exposing draft content", () => {
  const publicTool = { id: "1", slug: "alpha", defaultMonthlyPrice: 8, futureField: { flag: true } };
  const input = {
    publishedJson: [publicTool],
    dbSnapshot: [{ id: "1", slug: "alpha", projection: { ...publicTool, defaultMonthlyPrice: 12 } }],
    redisDrafts: { revision: 2, drafts: [{ slug: "alpha", version: 2, value: { privateNote: "private" } }] },
  };
  const report = reconcileCatalog(input);
  assert.deepEqual(report.fieldConflicts, [{ id: "1", slug: "alpha", fields: ["defaultMonthlyPrice"] }]);
  assert.deepEqual(report.unpublishedDrafts, { revision: 2, drafts: [{ slug: "alpha", version: 2 }] });
  assert.ok(!JSON.stringify(report).includes("private"));
  assert.notEqual(
    report.sourceHashes.publishedJson,
    reconcileCatalog({ ...input, publishedJson: [{ ...publicTool, futureField: null }] }).sourceHashes.publishedJson,
  );
});

test("does not treat an unavailable DB snapshot as an empty one", () => {
  const report = reconcileCatalog({ publishedJson: [{ id: "1", slug: "alpha" }] });
  assert.equal(report.missingRecords, null);
  assert.equal(report.sourceHashes.dbSnapshot, null);
});
