import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { startRedis } from "./redis-fixture";
import {
  CATALOG_HASH,
  getCatalogSnapshot,
  saveCatalogDraft,
  deleteCatalogDraft,
  cleanupCatalogDrafts,
} from "../../api/_backoffice-catalog-store";
import {
  catalogHash,
  type CatalogDraft,
} from "../../api/_backoffice-catalog-contract";
const suite = process.env.SUBMISSION_TEST_REDIS_BIN ? describe : describe.skip;
function draft(slug = "one"): CatalogDraft {
  const base = {
    id: slug,
    slug,
    name: slug,
    pros: [],
    pricing_v5: { compare_price_monthly_eur: null },
    research: { legacy: null, items: [] },
  };
  return {
    slug,
    version: 0,
    baseHash: catalogHash(base),
    base,
    value: { ...base, name: "Edited " + slug },
    updatedAt: "2026-10-26T10:00:00Z",
  };
}
suite("catalogue Lua against isolated real Redis", () => {
  let redis: Awaited<ReturnType<typeof startRedis>>;
  beforeAll(async () => {
    redis = await startRedis();
    vi.stubEnv("SUBMISSION_REDIS_URL", "https://catalog-test.upstash.io");
    vi.stubEnv("SUBMISSION_REDIS_TOKEN", "local-only");
    vi.stubGlobal("fetch", async (url: unknown, init?: RequestInit) => {
      // redis-cli --json renders HGETALL as an object; Upstash REST exposes the
      // RESP2 flat key/value array consumed by the production transport.
      const args = JSON.parse(String(init?.body));
      if (args[0] === "HGETALL") {
        const result = await redis.command(args);
        return new Response(
          JSON.stringify({
            result: Array.isArray(result)
              ? result
              : Object.entries(result).flat(),
          }),
        );
      }
      return redis.fetch(url, init);
    });
  });
  afterAll(async () => {
    await redis?.stop();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  beforeEach(async () => {
    await redis.command(["DEL", CATALOG_HASH]);
  });
  it("admits exactly one of twenty concurrent same-version saves", async () => {
    const first = await saveCatalogDraft(draft(), 0);
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, (_, index) =>
        saveCatalogDraft(
          { ...first, value: { ...first.value, name: "Concurrent " + index } },
          first.version,
        ),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.filter(
      (r) => r.status === "rejected",
    ) as PromiseRejectedResult[];
    expect(rejected).toHaveLength(19);
    for (const r of rejected)
      expect(r.reason).toMatchObject({
        status: 409,
        code: "CATALOG_DRAFT_CONFLICT",
      });
    const state = await getCatalogSnapshot();
    expect(state.revision).toBe(2);
    expect(state.drafts).toHaveLength(1);
    expect(state.drafts[0].value.name).toMatch(/^Concurrent \d+$/);
  });
  it("preserves empty arrays and nulls through Lua save, update and reload", async () => {
    const first = await saveCatalogDraft(draft(), 0);
    expect(first.base.pros).toEqual([]);
    expect(first.value.research).toEqual({ legacy: null, items: [] });
    const next = await saveCatalogDraft(
      {
        ...first,
        value: {
          ...first.value,
          pros: [],
          cons: [],
          verdict: { keepIf: [], billingTraps: [] },
        },
      },
      first.version,
    );
    const loaded = (await getCatalogSnapshot()).drafts[0];
    expect(loaded).toEqual(next);
    expect(loaded.value.verdict).toEqual({ keepIf: [], billingTraps: [] });
    expect(loaded.value.pricing_v5).toEqual({
      compare_price_monthly_eur: null,
    });
  });
  it("rejects ABA stale versions after deleting then recreating a draft", async () => {
    const old = await saveCatalogDraft(draft(), 0);
    await deleteCatalogDraft(old.slug, old.version);
    const replacement = await saveCatalogDraft(draft(), 0);
    expect(replacement.version).toBeGreaterThan(old.version);
    await expect(
      saveCatalogDraft(
        { ...old, value: { ...old.value, name: "Stale" } },
        old.version,
      ),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      deleteCatalogDraft(old.slug, old.version),
    ).rejects.toMatchObject({ status: 409 });
    expect((await getCatalogSnapshot()).drafts).toEqual([replacement]);
  });
  it("cleanup deletes exact published versions and preserves newer edits", async () => {
    const one = await saveCatalogDraft(draft("one"), 0),
      two = await saveCatalogDraft(draft("two"), 0);
    const updated = await saveCatalogDraft(
      { ...one, value: { ...one.value, name: "New after review" } },
      one.version,
    );
    await cleanupCatalogDrafts([one, two]);
    const state = await getCatalogSnapshot();
    expect(state.drafts).toEqual([updated]);
    expect(state.revision).toBe(4);
    await cleanupCatalogDrafts([one, two]);
    expect(await getCatalogSnapshot()).toEqual(state);
  });
  it("caps one hundred drafts atomically without blocking existing updates", async () => {
    const records: CatalogDraft[] = [];
    for (let index = 0; index < 100; index++)
      records.push(await saveCatalogDraft(draft("tool-" + index), 0));
    await expect(saveCatalogDraft(draft("overflow"), 0)).rejects.toMatchObject({
      code: "CATALOG_DRAFT_LIMIT",
    });
    const saved = await saveCatalogDraft(
      {
        ...records[0],
        value: { ...records[0].value, name: "Updated within cap" },
      },
      records[0].version,
    );
    const state = await getCatalogSnapshot();
    expect(state.drafts).toHaveLength(100);
    expect(state.drafts.find((d) => d.slug === saved.slug)).toEqual(saved);
  });
  it("fails closed on malformed state without replacing the hash", async () => {
    await redis.command(["SET", CATALOG_HASH, "preserved"]);
    await expect(saveCatalogDraft(draft(), 0)).rejects.toMatchObject({
      status: 503,
    });
    expect(await redis.command(["GET", CATALOG_HASH])).toBe("preserved");
    await redis.command(["DEL", CATALOG_HASH]);
    await redis.command([
      "HSET",
      CATALOG_HASH,
      "revision",
      "1",
      "draft:one",
      "not-json",
    ]);
    await expect(getCatalogSnapshot()).rejects.toMatchObject({ status: 503 });
  });
});
