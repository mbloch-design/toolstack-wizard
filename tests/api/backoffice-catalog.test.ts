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
  rpc: vi.fn(),
}));
vi.mock("../../api/_account-auth", async (original) => ({
  ...(await original<object>()),
  requireAccount: m.auth,
  getAccountServiceClient: () => ({ rpc: m.rpc }),
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
import { applyEditorialPatch, editorialBaseHash } from "../../api/_cms-editorial";
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
  vi.stubEnv("PUBLISHER_CMS_ENABLED", "false");
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

it("routes a linked tool to the admin editorial writer, seals its exact revision, and lists it", async () => {
  vi.stubEnv("PUBLISHER_CMS_ENABLED", "true");
  m.snapshot.mockResolvedValue({ revision: 1, drafts: [] });
  const baseHash = editorialBaseHash(tool);
  const patch = { set: { longDescription: "Independent analysis", longDescriptionEn: "English analysis" }, remove: [] };
  let snapshot: { version: number; baseHash: string | null; patch: typeof patch | null; updatedAt: string | null; state: string | null } = {
    version: 0, baseHash: null, patch: null, updatedAt: null, state: null,
  };
  m.rpc.mockImplementation(async (name: string, args: { p_action: string; p_expected?: number }) => {
    if (name === "cms_list_editorial_workspaces") return { data: [{
      toolId: tool.id, version: 1, updatedAt: draft.updatedAt, state: "approved", fields: Object.keys(patch.set),
    }], error: null };
    expect(name).toBe("cms_editorial_workspace");
    if (args.p_action === "save") {
      expect(args.p_expected).toBe(0);
      expect(args).toMatchObject({ p_base: baseHash, p_patch: patch });
      snapshot = { version: 1, baseHash, patch, updatedAt: draft.updatedAt, state: null };
    }
    if (args.p_action === "approve") {
      expect(args.p_expected).toBe(1);
      snapshot = { ...snapshot, state: "approved" };
    }
    return { data: snapshot, error: null };
  });
  const detail = await call("GET", undefined, { mode: "detail", slug: tool.slug });
  expect(detail.body).toMatchObject({ editorial: "empty", baseHash });
  expect(detail.body).toMatchObject({ capabilities: { editablePaths: expect.not.arrayContaining(["shortDescription"]) } });
  const outOfScope = await call("PUT", { slug: tool.slug, version: 0, baseHash, value: { ...tool, shortDescription: "Fact" } });
  expect(outOfScope.res.statusCode).toBe(400);
  const saved = await call("PUT", { slug: tool.slug, version: 0, baseHash, value: { ...tool, ...patch.set } });
  expect(saved.body).toMatchObject({ editorial: "draft", version: 1, tool: patch.set });
  expect(m.save).not.toHaveBeenCalled();
  const stale = await call("PATCH", { slug: tool.slug, version: 0, baseHash });
  expect(stale.res.statusCode).toBe(409);
  expect((await call("PATCH", { slug: tool.slug, version: 1, baseHash })).body).toMatchObject({ editorial: "approved" });
  expect((await call("GET", undefined, { mode: "list", draftsOnly: "true" })).body).toMatchObject({
    total: 1, tools: [{ slug: tool.slug, draft: { editorial: "approved" } }],
  });
  const changedFacts = { ...tool, shortDescription: "New and independent facts" };
  expect(editorialBaseHash(changedFacts)).toBe(baseHash);
  expect(applyEditorialPatch(changedFacts, patch)).toMatchObject({ ...changedFacts, ...patch.set });
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
it("saves incomplete drafts and returns server capability and validation metadata", async () => {
  m.save.mockImplementation(async (value) => ({ ...value, version: 2 }));
  const f = await call("PUT", {
    slug: "one",
    version: 1,
    baseHash: draft.baseHash,
    value: { ...tool, name: "" },
    capabilities: { editablePaths: ["id"] },
  });
  expect(f.res.statusCode).toBe(200);
  expect(f.body).toMatchObject({
    tool: { name: "" },
    capabilities: { canSaveDraft: true, canPublishAll: true },
    validation: expect.arrayContaining([
      expect.objectContaining({
        path: "name",
        severity: "error",
        stage: "publish",
      }),
    ]),
  });
});
it("returns publication blockers grouped by slug and keeps the batch durable", async () => {
  m.snapshot.mockResolvedValue({
    revision: 2,
    drafts: [{ ...draft, value: { ...tool, name: "" } }],
  });
  const f = await call("POST", { revision: 2 });
  expect(f.res.statusCode).toBe(400);
  expect(f.body).toMatchObject({
    error: {
      code: "INVALID_CATALOG_TOOL",
      issuesBySlug: {
        one: expect.arrayContaining([
          expect.objectContaining({ path: "name", stage: "publish" }),
        ]),
      },
    },
  });
  expect(m.write).not.toHaveBeenCalled();
  expect(m.cleanup).not.toHaveBeenCalled();
});
