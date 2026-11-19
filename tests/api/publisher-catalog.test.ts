import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { httpFixture } from "./http";
const auth = vi.hoisted(() => ({ rpc: vi.fn(), requireAccount: vi.fn() }));
vi.mock("../../api/_account-auth.js", async (original) => ({
  ...await original<typeof import("../../api/_account-auth.js")>(),
  getAccountServiceClient: () => ({ rpc: auth.rpc }),
  requireAccount: auth.requireAccount,
}));
import handler from "../../api/publisher-catalog";
import contributions from "../../api/publisher-contributions";

const brandId = "00000000-0000-0000-0000-000000000004";
const locale = { shortDescription: null, productDescription: null, features: [], useCases: [] };
const value = {
  schemaVersion: 1, name: "Publisher tool", websiteUrl: "https://example.org",
  localized: { fr: locale, en: locale }, plans: [], media: [], classificationProposals: [], integrations: [],
};
const draft = { brandId, value, version: 2, updatedAt: "2026-11-16T15:00:00Z", canEdit: true };

beforeEach(() => {
  vi.stubEnv("PUBLISHER_CMS_ENABLED", "true");
  auth.rpc.mockReset().mockResolvedValue({ data: draft, error: null });
  auth.requireAccount.mockReset().mockResolvedValue({ userId: "account", sessionId: "session", emailConfirmed: true });
});
afterEach(() => vi.unstubAllEnvs());

it("closes catalogue and contribution routes while the CMS is disabled", async () => {
  vi.stubEnv("PUBLISHER_CMS_ENABLED", "false");
  for (const [route, method] of [[handler, "GET"], [handler, "PUT"], [contributions, "POST"], [contributions, "DELETE"]] as const) {
    const fixture = httpFixture(undefined, method);
    await route(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(503);
    expect(fixture.body).toEqual({ error: { code: "CMS_DISABLED" } });
  }
  expect(auth.requireAccount).not.toHaveBeenCalled();
  expect(auth.rpc).not.toHaveBeenCalled();
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

it("allocates plan identity on the server while preserving the draft revision", async () => {
  auth.rpc.mockImplementation(async (name: string, args: { p_value?: typeof value }) => name === "cms_read_tool_draft"
    ? { data: draft, error: null }
    : { data: { ...draft, value: args.p_value, version: 3 }, error: null });
  const result = await invoke("PATCH", { brandId, version: 2, action: "addPlan" });
  expect(result.res.statusCode).toBe(200);
  expect(result.body).toMatchObject({ draft: { version: 3, value: { plans: [{
    id: expect.stringMatching(/^[0-9a-f-]{36}$/), planKey: expect.stringMatching(/^offer-/), archived: false, options: [],
  }] } } });
  expect((await invoke("PATCH", { brandId, version: 2, action: "addPlan", id: "forged" })).res.statusCode).toBe(400);
});
