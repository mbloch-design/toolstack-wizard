import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizePersonalStack } from "./personalStack";
import { deletePersonalAccount, loadPersonalStack, savePersonalStack, StackAccountApiError } from "./stackAccountApi";

const state = normalizePersonalStack(null);
const record = { state, revision: 1, updatedAt: "2026-10-19T12:00:00Z" };
afterEach(() => vi.unstubAllGlobals());

describe("stack account HTTP client", () => {
  it("sends bearer credentials and expected revision with the full personal envelope", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ stack: record }), { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    expect(await savePersonalStack("token-A", { expectedRevision: 0, state })).toEqual(record);
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe("/api/stack-account");
    expect(options).toMatchObject({ method: "PUT", cache: "no-store", headers: { Authorization: "Bearer token-A", "Content-Type": "application/json" } });
    expect(JSON.parse(options.body)).toEqual({ expectedRevision: 0, state });
  });
  it("loads a null stack without fabricating an empty saved record", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"stack":null}', { status: 200 })));
    expect(await loadPersonalStack("token")).toBeNull();
  });
  it.each([401, 409, 503])("retains stable typed API error status %s", async status => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"error":{"code":"ACCOUNT_SESSION_INVALID"}}', { status })));
    await expect(loadPersonalStack("token")).rejects.toMatchObject({ status, code: "ACCOUNT_SESSION_INVALID" });
  });
  it("rejects malformed success responses instead of announcing saved", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"stack":{}}', { status: 200 })));
    await expect(loadPersonalStack("token")).rejects.toBeInstanceOf(StackAccountApiError);
  });
  it("validates before serializing nonfinite personal values", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    const invalid = normalizePersonalStack(null);
    invalid.billing.choices.a = { source: "custom", currency: "EUR", period: "monthly", amount: NaN };
    await expect(savePersonalStack("token", { expectedRevision: 0, state: invalid })).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("treats DELETE503 as failure and only accepts a completed 204", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('{"error":{"code":"ACCOUNT_DELETION_UNAVAILABLE"}}', { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetcher);
    await expect(deletePersonalAccount("token")).rejects.toMatchObject({ status: 503 });
    await expect(deletePersonalAccount("token")).resolves.toBeUndefined();
  });
});
