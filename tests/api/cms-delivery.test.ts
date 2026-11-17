import { beforeEach, expect, it, vi } from "vitest";

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
import { deliverPublisherRelease } from "../../api/_cms-delivery";
import { catalogHash } from "../../api/_backoffice-catalog-contract";

const actor = { userId: "admin", sessionId: "session" };
const tools = [{ id: "t1", slug: "example", name: "Example" }];
const manifest = {
  sourceHead: "1".repeat(40), catalogueHash: catalogHash(tools), legacyItems: [],
  items: [{ approvalId: "approval", version: 1, toolId: "t1", slug: "example", name: "Example", hash: catalogHash(tools[0]) }],
};
const key = catalogHash(manifest);
const draft = { batch_key: key, manifest, commit_sha: null, verified_at: null };
const committed = { ...draft, commit_sha: "2".repeat(40) };
const media = [{ path: "public/tool-media/cms/sample.webp", bytes: new Uint8Array([1]) }];

beforeEach(() => {
  vi.resetAllMocks();
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
  expect(mocks.cleanup).toHaveBeenCalledOnce();
});

it("recovers a lost receipt without writing Git a second time", async () => {
  mocks.rpc.mockResolvedValueOnce({ data: draft, error: null });
  mocks.read.mockResolvedValue({ headSha: committed.commit_sha, tools });
  mocks.match.mockResolvedValue({ commitSha: committed.commit_sha });
  expect((await deliverPublisherRelease(actor, key)).release?.commit_sha).toBe(committed.commit_sha);
  expect(mocks.publish).not.toHaveBeenCalled();
});
