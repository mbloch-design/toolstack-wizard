import { beforeEach, it, expect, vi } from "vitest";
import { httpFixture } from "./http";
const m = vi.hoisted(() => ({
  auth: vi.fn(),
  read: vi.fn(),
  write: vi.fn(),
  snapshot: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  cleanup: vi.fn(),
}));
vi.mock("../../api/_account-auth", async (original) => ({
  ...(await original<object>()),
  requireAccount: m.auth,
}));
vi.mock("../../api/_backoffice-catalog-github", () => ({
  readCatalog: m.read,
  publishCatalog: m.write,
}));
vi.mock("../../api/_backoffice-catalog-store", () => ({
  getCatalogSnapshot: m.snapshot,
  saveCatalogDraft: m.save,
  deleteCatalogDraft: m.remove,
  cleanupCatalogDrafts: m.cleanup,
}));
import handler from "../../api/backoffice-catalog";
import { catalogHash } from "../../api/_backoffice-catalog-contract";
const tool = { id: "one", slug: "one", name: "One", description: "Before" };
const draft = {
  slug: "one",
  version: 1,
  baseHash: catalogHash(tool),
  base: tool,
  value: { ...tool, description: "After" },
  updatedAt: "2026-10-26T10:00:00Z",
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("BACKOFFICE_ADMIN_EMAILS", "admin@example.com");
  m.auth.mockResolvedValue({ email: "admin@example.com" });
  m.read.mockResolvedValue({
    headSha: "a".repeat(40),
    treeSha: "b".repeat(40),
    tools: [tool],
    text: JSON.stringify([tool], null, 2) + "\n",
  });
  m.snapshot.mockResolvedValue({ revision: 1, drafts: [draft] });
  m.cleanup.mockResolvedValue(undefined);
  m.write.mockResolvedValue({
    commitSha: "c".repeat(40),
    commitUrl:
      "https://github.com/mbloch-design/toolstack-wizard/commit/" +
      "c".repeat(40),
  });
});
async function call(
  method = "GET",
  body?: unknown,
  query: Record<string, string> = {},
) {
  const f = httpFixture(body, method);
  f.req.query = query;
  await handler(f.req, f.res);
  return f;
}
it("denies unconfirmed/non-admin sessions before reading privileged sources", async () => {
  m.auth.mockResolvedValue({ email: null });
  expect((await call()).res.statusCode).toBe(403);
  expect(m.read).not.toHaveBeenCalled();
});
it("returns saved detail and base conflict state", async () => {
  expect(
    (await call("GET", undefined, { mode: "detail", slug: "one" })).body,
  ).toMatchObject({
    tool: draft.value,
    published: tool,
    version: 1,
    conflict: false,
  });
});
it("publishes the reviewed global batch once", async () => {
  const f = await call("POST", { revision: 1 });
  expect(f.res.statusCode).toBe(200);
  expect(f.body).toMatchObject({ published: 1, cleanupPending: false });
  expect(m.write).toHaveBeenCalledWith(
    expect.objectContaining({ tools: [tool] }),
    [draft.value],
  );
  expect(m.cleanup).toHaveBeenCalledWith([draft]);
});
it("rejects stale review before GitHub writes", async () => {
  expect((await call("POST", { revision: 0 })).res.statusCode).toBe(409);
  expect(m.write).not.toHaveBeenCalled();
});
it("keeps all drafts when an edited source tool changed", async () => {
  m.read.mockResolvedValue({
    headSha: "a".repeat(40),
    tools: [{ ...tool, name: "External" }],
  });
  expect((await call("POST", { revision: 1 })).res.statusCode).toBe(409);
  expect(m.write).not.toHaveBeenCalled();
  expect(m.cleanup).not.toHaveBeenCalled();
});
it("reconciles already-published values without another write", async () => {
  m.read.mockResolvedValue({ headSha: "a".repeat(40), tools: [draft.value] });
  expect((await call("POST", { revision: 1 })).body).toMatchObject({
    published: 1,
    commitSha: "a".repeat(40),
  });
  expect(m.write).not.toHaveBeenCalled();
  expect(m.cleanup).toHaveBeenCalled();
});
it("preserves drafts after ambiguous GitHub failure", async () => {
  m.write.mockRejectedValue(new Error("provider secret"));
  const f = await call("POST", { revision: 1 });
  expect(f.res.statusCode).toBe(503);
  expect(JSON.stringify(f.body)).not.toContain("secret");
  expect(m.cleanup).not.toHaveBeenCalled();
});
it("reports cleanup pending only after a verifiable commit", async () => {
  m.cleanup.mockRejectedValue(new Error("Redis unavailable"));
  expect((await call("POST", { revision: 1 })).body).toMatchObject({
    cleanupPending: true,
    published: 1,
  });
});
it("rejects invalid fields before save", async () => {
  expect(
    (
      await call("PUT", {
        slug: "one",
        version: 1,
        baseHash: draft.baseHash,
        value: { ...tool, id: "other" },
      })
    ).res.statusCode,
  ).toBe(400);
  expect(m.save).not.toHaveBeenCalled();
});
it("bounds request and search sizes", async () => {
  expect(
    (await call("PUT", { value: "a".repeat(270000) })).res.statusCode,
  ).toBe(413);
  expect(
    (await call("GET", undefined, { search: "a".repeat(201) })).res.statusCode,
  ).toBe(400);
});
it("rejects invented catalogue categories", async () => {
  const f = await call("PUT", {
    slug: "one",
    version: 1,
    baseHash: draft.baseHash,
    value: { ...tool, category: "invented" },
  });
  expect(f.res.statusCode).toBe(400);
  expect(m.save).not.toHaveBeenCalled();
});
it("bounds advertised request body lengths before privileged reads", async () => {
  const f = httpFixture({}, "PUT");
  f.req.headers["content-length"] = "999999";
  await handler(f.req, f.res);
  expect(f.res.statusCode).toBe(413);
  expect(m.read).not.toHaveBeenCalled();
});
it("accepts a Buffer JSON request body", async () => {
  const f = await call(
    "DELETE",
    Buffer.from(JSON.stringify({ slug: "one", version: 1 })),
  );
  expect(f.res.statusCode).toBe(200);
  expect(m.remove).toHaveBeenCalledWith("one", 1);
});
it("removes a saved draft with CAS when edits revert to the published fiche", async () => {
  const f = await call("PUT", {
    slug: "one",
    version: 1,
    baseHash: draft.baseHash,
    value: tool,
  });
  expect(f.res.statusCode).toBe(200);
  expect(f.body).toMatchObject({
    tool,
    published: tool,
    version: 0,
    draft: null,
    conflict: false,
  });
  expect(m.remove).toHaveBeenCalledWith("one", 1);
  expect(m.save).not.toHaveBeenCalled();
});
it("checks CAS even when a new save has no changes", async () => {
  m.snapshot.mockResolvedValue({ revision: 0, drafts: [] });
  const f = await call("PUT", {
    slug: "one",
    version: 0,
    baseHash: draft.baseHash,
    value: tool,
  });
  expect(f.body).toMatchObject({ version: 0, draft: null });
  expect(m.remove).toHaveBeenCalledWith("one", 0);
  expect(m.save).not.toHaveBeenCalled();
});
it("preserves a newer draft when reverting a stale edit", async () => {
  m.remove.mockRejectedValue(
    new (await import("../../api/_account-auth")).AccountApiError(
      409,
      "CATALOG_DRAFT_CONFLICT",
    ),
  );
  const f = await call("PUT", {
    slug: "one",
    version: 1,
    baseHash: draft.baseHash,
    value: tool,
  });
  expect(f.res.statusCode).toBe(409);
  expect(m.save).not.toHaveBeenCalled();
});
