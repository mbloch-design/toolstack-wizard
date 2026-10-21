import { afterEach, describe, expect, it, vi } from "vitest";
import { loadAccountProfile, saveAccountProfile, AccountProfileApiError } from "./accountProfileApi";
const profile = { userId: "11111111-1111-4111-8111-111111111111", displayName: null, email: "owner@example.test", emailConfirmed: true, createdAt: "2026-10-19T12:00:00Z", updatedAt: "2026-10-21T12:00:00Z", canAccessBackoffice: false };
afterEach(() => vi.unstubAllGlobals());
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
describe("account profile client", () => {
  it("sends name only with same-origin bearer and abort signal", async () => {
    const fetcher = vi.fn().mockResolvedValue(response({ profile: { ...profile, displayName: "Name" } })); vi.stubGlobal("fetch", fetcher);
    const controller = new AbortController(); expect(await saveAccountProfile("private-token", " Name ", controller.signal)).toEqual({ ...profile, displayName: "Name" });
    expect(fetcher).toHaveBeenCalledWith("/api/account-profile", expect.objectContaining({ method: "PUT", cache: "no-store", signal: controller.signal, headers: { Authorization: "Bearer private-token", "Content-Type": "application/json" }, body: '{"displayName":"Name"}' }));
  });
  it.each([null, {}, { ...profile, displayName: 1 }, { ...profile, emailConfirmed: "true" }, { ...profile, canAccessBackoffice: null }, { ...profile, createdAt: "bad" }, { ...profile, updatedAt: null }, { ...profile, userId: "" }, { ...profile, email: 5 }, { ...profile, displayName: "a\u0085b" }])("rejects invalid source instead of a null profile %j", async value => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ profile: value }))); await expect(loadAccountProfile("token")).rejects.toMatchObject({ code: "ACCOUNT_PROFILE_UNAVAILABLE" });
  });
  it("preserves real null name/email and false confirmations", async () => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ profile: { ...profile, email: null, emailConfirmed: false } }))); expect(await loadAccountProfile("token")).toEqual({ ...profile, email: null, emailConfirmed: false }); });
  it("rejects invalid names before issuing any request", async () => { const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher); await expect(saveAccountProfile("token", "\nname")).rejects.toThrow(); expect(fetcher).not.toHaveBeenCalled(); });
  it.each([401, 409, 503])("retains HTTP status %s and stable error code", async status => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ error: { code: "ACCOUNT_SESSION_INVALID" } }, status))); await expect(loadAccountProfile("token")).rejects.toMatchObject({ status, code: "ACCOUNT_SESSION_INVALID" }); });
  it("distinguishes network errors and malformed successful JSON", async () => { vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private"))); await expect(loadAccountProfile("token")).rejects.toMatchObject({ code: "ACCOUNT_PROFILE_NETWORK_ERROR" }); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad"))); await expect(loadAccountProfile("token")).rejects.toBeInstanceOf(AccountProfileApiError); });
});
