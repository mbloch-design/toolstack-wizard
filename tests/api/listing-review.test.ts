import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { httpFixture } from "./http";

const dependencies = vi.hoisted(() => ({ rpc: vi.fn(), requireAccount: vi.fn(), readCatalog: vi.fn(), verifyBadge: vi.fn() }));
vi.mock("../../api/_account-auth.js", async (original) => ({
  ...await original<typeof import("../../api/_account-auth.js")>(),
  getAccountServiceClient: () => ({ rpc: dependencies.rpc }),
  requireAccount: dependencies.requireAccount,
}));
vi.mock("../../api/_backoffice-catalog-github.js", () => ({ readCatalog: dependencies.readCatalog }));
vi.mock("../../api/_badge-verification.js", () => ({ verifyBadgeOnPage: dependencies.verifyBadge }));
import ownerReview from "../../api/listing-review";
import adminReview from "../../api/backoffice-listing-review";

const id = "00000000-0000-0000-0000-000000000001";
const productRevisionId = "00000000-0000-0000-0000-000000000002";
const editorialRevisionId = "00000000-0000-0000-0000-000000000003";
const role = { userId: "account", sessionId: "session", emailConfirmed: true };

beforeEach(() => {
  vi.stubEnv("PUBLISHER_CMS_ENABLED", "true");
  dependencies.rpc.mockReset().mockResolvedValue({ data: { review: {} }, error: null });
  dependencies.requireAccount.mockReset().mockResolvedValue(role);
  dependencies.readCatalog.mockReset().mockResolvedValue({ tools: [] });
  dependencies.verifyBadge.mockReset().mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());

it("does not accept factual confirmation when the CMS is disabled", async () => {
  vi.stubEnv("PUBLISHER_CMS_ENABLED", "false");
  const fixture = httpFixture({ action: "respondFactualReview", id, version: 2, productRevisionId, hash: "a".repeat(64), decision: "confirm", note: "" });
  await ownerReview(fixture.req, fixture.res);
  expect(fixture.res.statusCode).toBe(503);
  expect(fixture.body).toEqual({ error: { code: "CMS_DISABLED" } });
  expect(dependencies.rpc).not.toHaveBeenCalled();
});

it("keeps initial admin review closed while the CMS is disabled", async () => {
  vi.stubEnv("PUBLISHER_CMS_ENABLED", "false");
  const fixture = httpFixture({ action: "approveInitialEditorial", id, version: 3 });
  await adminReview(fixture.req, fixture.res);
  expect(fixture.res.statusCode).toBe(503);
  expect(fixture.body).toEqual({ error: { code: "CMS_DISABLED" } });
  expect(dependencies.rpc).not.toHaveBeenCalled();
});

it("the owner endpoint only accepts a response tied to the exact revision ID and digest", async () => {
  const input = { action: "respondFactualReview", id, version: 2, productRevisionId, hash: "a".repeat(64), decision: "confirm", note: "" };
  const invalid = httpFixture({ ...input, editorialRevisionId });
  await ownerReview(invalid.req, invalid.res);
  expect(invalid.res.statusCode).toBe(400);
  expect(dependencies.rpc).not.toHaveBeenCalled();
  const fixture = httpFixture(input);
  await ownerReview(fixture.req, fixture.res);
  expect(fixture.res.statusCode).toBe(200);
  expect(dependencies.rpc).toHaveBeenCalledWith("cms_initial_listing_review", {
    p_actor: "account", p_session: "session", p_action: "respondFactualReview",
    p_payload: { id, version: 2, productRevisionId, hash: "a".repeat(64), decision: "confirm", note: "" },
  });
});

it("the independent editorial approval only accepts known categories and reserved editorial fields", async () => {
  const input = { action: "approveInitialEditorial", id, version: 3, category: "crm", fields: {
    longDescription: "Analyse française", longDescriptionEn: "English analysis",
  } };
  for (const invalid of [{ ...input, category: "unsupported-category" }, { ...input, fields: { ...input.fields, websiteUrl: "https://other.test" } }]) {
    const fixture = httpFixture(invalid);
    await adminReview(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(400);
  }
  expect(dependencies.rpc).not.toHaveBeenCalled();
  const fixture = httpFixture(input);
  await adminReview(fixture.req, fixture.res);
  expect(fixture.res.statusCode).toBe(200);
  expect(dependencies.rpc.mock.lastCall?.[1].p_payload).toMatchObject({ id, version: 3, category: "crm", fields: input.fields, hash: expect.stringMatching(/^[a-f0-9]{64}$/) });
});

it("promotion rechecks the admin-approved standard badge before issuing the atomic SQL promotion", async () => {
  const input = {
    action: "promoteInitial", id, version: 3, productRevisionId, editorialRevisionId,
    idempotencyKey: "initial-idempotent", brandName: "Example Brand", brandDomain: "example.com",
  };
  dependencies.rpc.mockResolvedValueOnce({ data: { review: {
    approvalId: null, badgeUrl: "https://example.com/badge",
    listing: { slug: "available", websiteUrl: "https://example.com/", offer: "standard_badge", version: 3, status: "ready" },
  } }, error: null }).mockResolvedValueOnce({ data: { approval: { toolId: "stable-id" } }, error: null });
  const fixture = httpFixture(input);
  await adminReview(fixture.req, fixture.res);
  expect(fixture.res.statusCode).toBe(200);
  expect(dependencies.verifyBadge).toHaveBeenCalledWith("https://example.com/badge", "https://example.com/", expect.objectContaining({ fetch: expect.any(Function), isPublicAddress: expect.any(Function) }));
  expect(dependencies.rpc.mock.lastCall?.[1].p_payload).toMatchObject({
    id, version: 3, verifiedBadgeUrl: "https://example.com/badge", badgeVerifiedAt: expect.any(String),
  });
});
