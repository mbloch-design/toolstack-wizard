import { beforeEach, expect, it, vi } from "vitest";
import { httpFixture } from "./http";
const auth = vi.hoisted(() => ({ rpc: vi.fn(), requireAccount: vi.fn() }));
vi.mock("../../api/_account-auth.js", async (original) => ({
  ...await original<typeof import("../../api/_account-auth.js")>(),
  getAccountServiceClient: () => ({ rpc: auth.rpc }),
  requireAccount: auth.requireAccount,
}));
import handler from "../../api/publisher-catalog";

const brandId = "00000000-0000-0000-0000-000000000004";
const locale = { shortDescription: null, productDescription: null, features: [], useCases: [] };
const value = {
  schemaVersion: 1, name: "Publisher tool", websiteUrl: "https://example.org",
  localized: { fr: locale, en: locale }, plans: [], media: [], classificationProposals: [], integrations: [],
};
const draft = { brandId, value, version: 2, updatedAt: "2026-11-16T15:00:00Z", canEdit: true };

beforeEach(() => {
  auth.rpc.mockReset().mockResolvedValue({ data: draft, error: null });
  auth.requireAccount.mockReset().mockResolvedValue({ userId: "account", sessionId: "session", emailConfirmed: true });
});

async function invoke(method = "GET", body?: unknown) {
  const fixture = httpFixture(body, method);
  fixture.req.query.tool = "stable-tool-id";
  await handler(fixture.req, fixture.res);
  return fixture;
}

it("reads a private draft with session identity and a stable tool ID", async () => {
  const result = await invoke();
  expect(result.res.statusCode).toBe(200);
  expect(result.res.getHeader("Cache-Control")).toBe("no-store");
  expect(auth.rpc).toHaveBeenCalledWith("cms_read_tool_draft", {
    p_actor: "account", p_session: "session", p_tool: "stable-tool-id",
  });
});

it("validates the patch and binds the SQL write to its exact assignment and draft", async () => {
  const next = { ...value, name: "Updated name" };
  auth.rpc.mockResolvedValueOnce({ data: draft, error: null })
    .mockResolvedValueOnce({ data: { ...draft, version: 3, value: next }, error: null });
  const result = await invoke("PUT", { brandId, version: 2, value: next });
  expect(result.res.statusCode).toBe(200);
  expect(auth.rpc).toHaveBeenLastCalledWith("cms_save_tool_draft", {
    p_actor: "account", p_session: "session", p_tool: "stable-tool-id",
    p_expected_brand: brandId, p_expected_version: 2, p_value: next,
  });
});

it("rejects protected fields before SQL can save anything", async () => {
  const result = await invoke("PUT", { brandId, version: 2, value: { ...value, toolTrimRating: 99 } });
  expect(result.res.statusCode).toBe(400);
  expect(auth.rpc).toHaveBeenCalledTimes(1);
});

it("does not write a draft from another brand even if the draft version is the same", async () => {
  const result = await invoke("PUT", { brandId: "00000000-0000-0000-0000-000000000005", version: 2, value });
  expect(result.res.statusCode).toBe(409);
  expect(auth.rpc).toHaveBeenCalledTimes(1);
});

it("keeps the SQL revocation check authoritative after a successful read", async () => {
  auth.rpc.mockResolvedValueOnce({ data: draft, error: null })
    .mockResolvedValueOnce({ data: null, error: { code: "PT403", message: "CMS_ACCESS_DENIED" } });
  expect((await invoke("PUT", { brandId, version: 2, value })).res.statusCode).toBe(403);
});
