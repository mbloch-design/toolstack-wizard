import { beforeEach, it, expect, vi } from "vitest";
const redis = vi.hoisted(() => vi.fn());
vi.mock("../../api/_submission-store", () => ({ redisCommand: redis }));
import {
  getCatalogSnapshot,
  saveCatalogDraft,
  deleteCatalogDraft,
  cleanupCatalogDrafts,
  CATALOG_HASH,
  MUTATE_CATALOG_SCRIPT,
  CLEANUP_CATALOG_SCRIPT,
} from "../../api/_backoffice-catalog-store";
import { catalogHash } from "../../api/_backoffice-catalog-contract";
const tool = { id: "one", slug: "one", name: "One" };
const draft = {
  slug: "one",
  version: 4,
  baseHash: catalogHash(tool),
  base: tool,
  value: { ...tool, name: "Edited" },
  updatedAt: "2026-10-26T10:00:00Z",
};
beforeEach(() => {
  redis.mockReset();
});
it("loads one atomic hash snapshot with monotonic revision", async () => {
  redis.mockResolvedValue([
    "revision",
    "4",
    "draft:one",
    JSON.stringify({ version: draft.version, data: draft }),
  ]);
  expect(await getCatalogSnapshot()).toEqual({ revision: 4, drafts: [draft] });
  expect(redis).toHaveBeenCalledWith(["HGETALL", CATALOG_HASH]);
});
it.each(
  [
    [
      "revision",
      "3",
      "draft:one",
      JSON.stringify({ version: draft.version, data: draft }),
    ],
    ["revision", "invalid"],
    ["draft:other", JSON.stringify({ version: draft.version, data: draft })],
    [
      "revision",
      "4",
      "draft:one",
      JSON.stringify({ version: 4, data: { ...draft, baseHash: "forged" } }),
    ],
  ].map((row) => [row]),
)("fails closed on corrupt persistence", async (row) => {
  redis.mockResolvedValue(row);
  await expect(getCatalogSnapshot()).rejects.toMatchObject({ status: 503 });
});
it("uses one server-side CAS for saves and returns the persisted version", async () => {
  redis.mockResolvedValue([
    "saved",
    JSON.stringify({ version: draft.version, data: draft }),
  ]);
  expect(await saveCatalogDraft({ ...draft, version: 0 }, 3)).toEqual(draft);
  expect(redis).toHaveBeenCalledWith([
    "EVAL",
    MUTATE_CATALOG_SCRIPT,
    1,
    CATALOG_HASH,
    "one",
    3,
    expect.any(String),
  ]);
});
it("maps rejected stale writes and delete versions to conflict", async () => {
  redis.mockResolvedValue(["conflict"]);
  await expect(saveCatalogDraft(draft, 2)).rejects.toMatchObject({
    status: 409,
    code: "CATALOG_DRAFT_CONFLICT",
  });
  await expect(deleteCatalogDraft("one", 2)).rejects.toMatchObject({
    status: 409,
  });
});
it("reports the draft cap distinctly", async () => {
  redis.mockResolvedValue(["limit"]);
  await expect(saveCatalogDraft(draft, 0)).rejects.toMatchObject({
    code: "CATALOG_DRAFT_LIMIT",
  });
});
it("sends only exact reviewed versions to conditional cleanup", async () => {
  redis.mockResolvedValue(1);
  await cleanupCatalogDrafts([draft]);
  expect(redis).toHaveBeenCalledWith([
    "EVAL",
    CLEANUP_CATALOG_SCRIPT,
    1,
    CATALOG_HASH,
    JSON.stringify([{ slug: "one", version: 4 }]),
  ]);
});
it("never treats transport errors as a saved value", async () => {
  redis.mockRejectedValue(new Error("secret"));
  await expect(saveCatalogDraft(draft, 0)).rejects.toMatchObject({
    status: 503,
  });
});
it("stores payload JSON verbatim so Lua cannot turn empty arrays into objects", async () => {
  const value = {
    ...draft,
    value: { ...draft.value, pros: [], verdict: { keepIf: [] } },
  };
  redis.mockResolvedValue([
    "saved",
    JSON.stringify({ version: 5, data: value }),
  ]);
  expect(await saveCatalogDraft(value, 4)).toMatchObject({
    version: 5,
    value: { pros: [], verdict: { keepIf: [] } },
  });
});
