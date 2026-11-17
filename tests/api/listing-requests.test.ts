import { beforeEach, expect, it, vi } from "vitest";
import { httpFixture } from "./http";

const auth = vi.hoisted(() => ({ rpc: vi.fn(), requireAccount: vi.fn() }));
const commerce = vi.hoisted(() => ({ verify: vi.fn() }));
vi.mock("../../api/_cms-commercial.js", () => ({ runListingCommerce: commerce.verify }));
vi.mock("../../api/_account-auth.js", async (original) => ({
  ...await original<typeof import("../../api/_account-auth.js")>(),
  getAccountServiceClient: () => ({ rpc: auth.rpc }),
  requireAccount: auth.requireAccount,
}));
vi.mock("../../src/data/tools_v4.json", () => ({
  default: [
    { id: "internal-42", slug: "suite-docs", name: "Suite Docs", websiteUrl: "https://www.suite.test/docs" },
    { id: "suite-sheets", slug: "suite-sheets", name: "Suite Sheets", websiteUrl: "https://suite.test/sheets" },
  ],
}));
import handler from "../../api/listing-requests";
import { AccountApiError } from "../../api/_account-auth";

beforeEach(() => {
  auth.rpc.mockReset().mockResolvedValue({ data: {}, error: null });
  commerce.verify.mockReset().mockResolvedValue({ state: "missing" });
  auth.requireAccount.mockReset().mockResolvedValue({ userId: "account", sessionId: "session", emailConfirmed: true });
});

async function invoke(method = "GET", body?: unknown, query = {}) {
  const fixture = httpFixture(body, method);
  fixture.req.query = query;
  await handler(fixture.req, fixture.res);
  return fixture;
}

it("requires a valid authenticated account before serving candidate data", async () => {
  auth.requireAccount.mockRejectedValue(new AccountApiError(401, "ACCOUNT_SESSION_INVALID"));
  const result = await invoke("POST", { action: "lookup", name: "Suite", websiteUrl: "https://suite.test" });
  expect(result.res.statusCode).toBe(401);
  expect(result.res.getHeader("Cache-Control")).toBe("no-store");
  expect(auth.rpc).not.toHaveBeenCalled();
});

it("returns both products on the given official domain and the actor's drafts", async () => {
  auth.rpc.mockResolvedValue({ data: { candidates: [{ id: "draft", kind: "listing" }] }, error: null });
  const result = await invoke("POST", { action: "lookup", name: "Suite", websiteUrl: "https://www.suite.test/" });
  expect(result.body).toMatchObject({ candidates: [
    { id: "internal-42", kind: "tool" }, { id: "suite-sheets", kind: "tool" }, { id: "draft", kind: "listing" },
  ] });
  expect(auth.rpc).toHaveBeenCalledWith("cms_listing_requests", {
    p_actor: "account", p_session: "session", p_action: "lookup", p_payload: { hostname: "suite.test" },
  });
});

it("blocks the public product's own slug while allowing a distinct tool on its domain", async () => {
  const body = { action: "create", websiteUrl: "https://suite.test/", offer: "standard_badge", idempotencyKey: "safe-1234" };
  expect((await invoke("POST", { ...body, name: "Suite Docs" })).res.statusCode).toBe(409);
  expect(auth.rpc).not.toHaveBeenCalled();
  expect((await invoke("POST", { ...body, name: "Suite Notes", locale: "fr" })).res.statusCode).toBe(200);
  expect(auth.rpc).toHaveBeenCalledWith("cms_listing_requests", {
    p_actor: "account", p_session: "session", p_action: "create",
    p_payload: {
      name: "Suite Notes", websiteUrl: "https://suite.test/", hostname: "suite.test", slug: "suite-notes",
      offer: "standard_badge", locale: "fr", idempotencyKey: "safe-1234",
    },
  });
});

it("only accepts a stable public catalogue identity when claiming", async () => {
  const claimed = { claim: { toolId: "internal-42", status: "pending" } };
  auth.rpc.mockResolvedValue({ data: claimed, error: null });
  expect((await invoke("POST", { action: "claimExisting", toolId: "suite-docs" })).res.statusCode).toBe(404);
  expect(auth.rpc).not.toHaveBeenCalled();
  expect((await invoke("POST", { action: "claimExisting", toolId: "internal-42" })).body).toEqual(claimed);
  expect(auth.rpc).toHaveBeenCalledWith("cms_listing_requests", {
    p_actor: "account", p_session: "session", p_action: "claimExisting",
    p_payload: { toolId: "internal-42", slug: "suite-docs" },
  });
});

it("rejects attempts to submit account, payment or authority fields supplied by the client", async () => {
  expect((await invoke("POST", {
    action: "create", name: "New Product", websiteUrl: "https://example.com",
    offer: "priority_paid", idempotencyKey: "safe-1234", paid: true, ownerId: "someone else",
  })).res.statusCode).toBe(400);
  expect(auth.rpc).not.toHaveBeenCalled();
});

it("returns a private lookup failure without internal error details", async () => {
  auth.rpc.mockResolvedValue({ data: null, error: { code: "PT404", message: "Some private SQL details" } });
  const result = await invoke("GET", undefined, { id: "00000000-0000-0000-0000-000000000001" });
  expect(result.res.statusCode).toBe(404);
  expect(result.body).toEqual({ error: { code: "LISTING_NOT_FOUND" } });
});

it("accepts an invitation only by hashing the opaque token on the server", async () => {
  const token = "5".repeat(43);
  expect((await invoke("POST", { action: "acceptInvitation", token, toolId: "different" })).res.statusCode).toBe(400);
  expect(auth.rpc).not.toHaveBeenCalled();
  expect((await invoke("POST", { action: "acceptInvitation", token })).res.statusCode).toBe(200);
  expect(auth.rpc).toHaveBeenCalledWith("cms_accept_listing_invitation", {
    p_actor: "account", p_session: "session",
    p_digest: "3ada7043f1f1a0d975ed3529c400bc7a582d404287f79abb4417caed4300c806",
  });
});

it("rechecks the standard badge before submitting the exact draft version", async () => {
  const id = "00000000-0000-0000-0000-000000000001";
  const listing = {
    id, version: 2, status: "draft", offer: "standard_badge", commercialStatus: "satisfied", representativeRole: "Founder",
  };
  auth.rpc.mockResolvedValue({ data: { listing }, error: null });
  const body = { action: "submit", id, version: 2 };
  expect(await invoke("POST", body).then((result) => result.body)).toEqual({ error: { code: "LISTING_REQUIREMENTS_PENDING" } });
  expect(commerce.verify).toHaveBeenCalledWith({ userId: "account", sessionId: "session", emailConfirmed: true }, id, "checkBadge");
  expect(auth.rpc).toHaveBeenCalledTimes(1);
  commerce.verify.mockResolvedValueOnce({ state: "present" });
  expect((await invoke("POST", body)).res.statusCode).toBe(200);
  expect(auth.rpc).toHaveBeenLastCalledWith("cms_listing_requests", {
    p_actor: "account", p_session: "session", p_action: "submit", p_payload: { id, version: 2 },
  });
});
