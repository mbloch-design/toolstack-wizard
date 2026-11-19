import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(), prepare: vi.fn(), publish: vi.fn(), match: vi.fn(), read: vi.fn(), cleanup: vi.fn(),
}));
vi.mock("../../api/_account-auth.js", async (importOriginal) => ({
  ...await importOriginal<typeof import("../../api/_account-auth.js")>(),
  getAccountServiceClient: () => ({ rpc: mocks.rpc }),
}));
vi.mock("../../api/_cms-prepare-release.js", () => ({ preparePublisherRelease: mocks.prepare }));
vi.mock("../../api/_backoffice-catalog-github.js", () => ({
  readCatalog: mocks.read, publishCatalog: mocks.publish, matchPublishedCatalogRelease: mocks.match,
}));
vi.mock("../../api/_backoffice-catalog-store.js", () => ({ cleanupCatalogDrafts: mocks.cleanup }));
import { deliverPublisherRelease, verifyPublisherRelease } from "../../api/_cms-delivery";
import { catalogHash } from "../../api/_backoffice-catalog-contract";

const actor = { userId: "admin", sessionId: "session" };
const tools = [{ id: "t1", slug: "example", name: "Example" }];
const manifest = {
  sourceHead: "1".repeat(40), catalogueHash: catalogHash(tools), legacyItems: [{ slug: "legacy", name: "Legacy", version: 2, hash: "hash" }],
  items: [{ approvalId: "approval", version: 1, toolId: "t1", slug: "example", name: "Example", hash: catalogHash(tools[0]) }],
};
const key = catalogHash(manifest);
const draft = { batch_key: key, manifest, commit_sha: null, verified_at: null };
const committed = { ...draft, commit_sha: "2".repeat(40) };
const media = [{ path: "public/tool-media/cms/sample.webp", bytes: new Uint8Array([1]) }];

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CMS_VERCEL_TOKEN", "test-token");
  vi.stubEnv("CMS_VERCEL_PROJECT_ID", "test-project");
  mocks.prepare.mockResolvedValue({ tools, manifest, source: { headSha: manifest.sourceHead }, legacyDrafts: [], mediaFiles: media });
  mocks.publish.mockResolvedValue({ commitSha: committed.commit_sha });
  mocks.rpc.mockImplementation(async (name: string) => ({
    error: null, data: name === "cms_get_release_batch" ? null : name === "cms_seal_release_batch" ? draft : committed,
  }));
});

it("rejects a changed preview before creating a commit", async () => {
  await expect(deliverPublisherRelease(actor, "0".repeat(64))).rejects.toMatchObject({ code: "CMS_RELEASE_SOURCE_CHANGED" });
  expect(mocks.publish).not.toHaveBeenCalled();
  expect(mocks.rpc).toHaveBeenCalledTimes(1);
});

it("writes catalogue, media and marker together and keeps verification separate", async () => {
  const result = await deliverPublisherRelease(actor, key);
  expect(result.release).toMatchObject({ commit_sha: committed.commit_sha, verified_at: null });
  expect(mocks.publish).toHaveBeenCalledWith({ headSha: manifest.sourceHead }, tools,
    { marker: { batchKey: key, catalogueHash: manifest.catalogueHash }, media });
  expect(mocks.rpc).toHaveBeenCalledWith("cms_record_release_commit", {
    p_actor: "admin", p_session: "session", p_key: key, p_commit: committed.commit_sha,
  });
  expect(mocks.cleanup).toHaveBeenCalledWith(manifest.legacyItems);
});

it("recovers a lost receipt without writing Git a second time", async () => {
  mocks.rpc.mockResolvedValueOnce({ data: draft, error: null });
  mocks.read.mockResolvedValue({ headSha: committed.commit_sha, tools });
  mocks.match.mockResolvedValue({ commitSha: committed.commit_sha });
  expect((await deliverPublisherRelease(actor, key)).release?.commit_sha).toBe(committed.commit_sha);
  expect(mocks.publish).not.toHaveBeenCalled();
});

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("requires the matching READY Vercel deployment, public marker and localized pages", async () => {
  vi.stubEnv("CMS_VERCEL_TOKEN", "fixture");
  vi.stubEnv("CMS_VERCEL_PROJECT_ID", "project");
  mocks.rpc.mockResolvedValueOnce({ data: committed, error: null });
  mocks.rpc.mockResolvedValueOnce({ data: { ...committed, verified_at: "2026-11-17T12:00:00Z" }, error: null });
  const html = (path: string) => new Response(`<link rel="canonical" href="https://tooltrim.com${path}">`);
  const canonicalPaths = ["/fr/tool/example", "/en/tool/example", "/fr/tool/legacy", "/en/tool/legacy"];
  const fetcher = vi.fn(async (input: string | URL) => {
    const path = new URL(input).pathname;
    if (path.startsWith("/v4/aliases/")) return Response.json({ deploymentId: "dpl_fixture" });
    if (path.startsWith("/v13/deployments/")) return Response.json({
      projectId: "project", readyState: "READY", meta: { githubCommitSha: committed.commit_sha },
    });
    if (path.endsWith("catalog-release.json")) return Response.json({ batchKey: key, catalogueHash: manifest.catalogueHash });
    if (path === "/sitemap.xml") return new Response(canonicalPaths.map((route) => `<loc>https://tooltrim.com${route}</loc>`).join(""));
    if (canonicalPaths.includes(path)) return html(path);
    return new Response("", { status: 404 });
  });
  vi.stubGlobal("fetch", fetcher);
  expect((await verifyPublisherRelease(actor, key))?.verified_at).toBeTruthy();
  expect(fetcher.mock.calls.filter(([input]) => new URL(input).pathname.startsWith("/v4/aliases/"))).toHaveLength(2);
  expect(mocks.rpc).toHaveBeenCalledWith("cms_record_verified_release", {
    p_actor: "admin", p_session: "session", p_key: key, p_commit: committed.commit_sha,
  });
});

it("refuses delivery before reserving a batch when deployment verification is not configured", async () => {
  vi.stubEnv("CMS_VERCEL_TOKEN", "");
  await expect(deliverPublisherRelease(actor, key)).rejects.toMatchObject({ code: "CMS_RELEASE_VERIFICATION_NOT_CONFIGURED" });
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(mocks.publish).not.toHaveBeenCalled();
});

it.each(["http://tooltrim.com", "https://tooltrim.com/path", "not-a-url"])("rejects invalid verification origin %s before any release mutation", async (origin) => {
  vi.stubEnv("CMS_PUBLIC_ORIGIN", origin);
  await expect(deliverPublisherRelease(actor, key)).rejects.toMatchObject({ code: "CMS_RELEASE_VERIFICATION_NOT_CONFIGURED" });
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(mocks.publish).not.toHaveBeenCalled();
});

it.each(['editorialItems', 'commercialItems'])('publishes a batch containing only %s', async lane => {
  const only = { ...manifest, items: [], legacyItems: [], [lane]: [{ approvalId: 'overlay', version: 1, toolId: 't1', slug: 'example', hash: catalogHash(tools[0]) }] };
  mocks.prepare.mockResolvedValue({ tools, manifest: only, source: { headSha: manifest.sourceHead }, legacyDrafts: [], mediaFiles: [] });
  await deliverPublisherRelease(actor, catalogHash(only));
  expect(mocks.publish).toHaveBeenCalledOnce();
});
