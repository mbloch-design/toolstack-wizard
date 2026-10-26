import { beforeEach, afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession: mocks.session } },
}));
import {
  loadCatalogWorkspace,
  saveCatalogDraft,
  publishCatalogDrafts,
} from "./backofficeCatalogApi";
beforeEach(() => {
  mocks.session.mockResolvedValue({
    data: { session: { access_token: "verified-session" } },
    error: null,
  });
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => vi.unstubAllGlobals());
it("authenticates every call and sends only the reviewed global revision on publication", async () => {
  vi.mocked(fetch).mockResolvedValue(
    new Response(
      JSON.stringify({
        commitSha: "a".repeat(40),
        commitUrl:
          "https://github.com/mbloch-design/toolstack-wizard/commit/" +
          "a".repeat(40),
        published: 2,
        cleanupPending: false,
      }),
    ),
  );
  await publishCatalogDrafts(8);
  expect(fetch).toHaveBeenCalledWith(
    "/api/backoffice-catalog?",
    expect.objectContaining({
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: "Bearer verified-session",
        "Content-Type": "application/json",
      },
      body: '{"revision":8}',
    }),
  );
});
it("does not send requests without an authenticated session", async () => {
  mocks.session.mockResolvedValue({ data: { session: null }, error: null });
  await expect(loadCatalogWorkspace()).rejects.toMatchObject({ status: 401 });
  expect(fetch).not.toHaveBeenCalled();
});
it("preserves server conflict and configuration codes", async () => {
  vi.mocked(fetch).mockResolvedValue(
    new Response(
      JSON.stringify({ error: { code: "CATALOG_DRAFT_CONFLICT" } }),
      { status: 409 },
    ),
  );
  await expect(
    saveCatalogDraft({
      slug: "notion",
      baseHash: "base",
      version: 1,
      value: { id: "notion", slug: "notion", name: "Notion" },
    }),
  ).rejects.toMatchObject({ status: 409, code: "CATALOG_DRAFT_CONFLICT" });
});
it("rejects malformed list responses instead of inventing an empty catalogue", async () => {
  vi.mocked(fetch).mockResolvedValue(new Response("{}"));
  await expect(loadCatalogWorkspace()).rejects.toMatchObject({ status: 503 });
});
it("rejects malformed commit URLs and transport failures", async () => {
  vi.mocked(fetch).mockResolvedValue(
    new Response(
      JSON.stringify({
        commitSha: "a".repeat(40),
        commitUrl: "https://evil.test",
        published: 1,
      }),
    ),
  );
  await expect(publishCatalogDrafts(1)).rejects.toMatchObject({ status: 503 });
  vi.mocked(fetch).mockRejectedValue(new TypeError("fetch"));
  await expect(loadCatalogWorkspace()).rejects.toMatchObject({
    status: 503,
    code: "CATALOG_UNAVAILABLE",
  });
});
