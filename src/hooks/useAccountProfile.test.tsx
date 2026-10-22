import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountProfile } from "../lib/accountProfile";
const mocks = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn() }));
vi.mock("../lib/accountProfileApi", async original => ({ ...await original<typeof import("../lib/accountProfileApi")>(), loadAccountProfile: mocks.load, saveAccountProfile: mocks.save }));
import { useAccountProfile } from "./useAccountProfile";
const profile = (userId = "A"): AccountProfile => ({ avatarUrl:null,providerLocale:null,oauthProfileSource:null,userId, displayName: userId, email: null, emailConfirmed: false, createdAt: "2026-10-19T12:00:00Z", updatedAt: "2026-10-19T12:00:00Z", canAccessBackoffice: false });
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(yes => { resolve = yes; }); return { promise, resolve }; }
beforeEach(() => { vi.resetAllMocks(); mocks.load.mockImplementation(async (token: string) => profile(token)); mocks.save.mockImplementation(async (token: string, displayName: string) => ({ ...profile(token), displayName })); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe("owner-bound profile hook", () => {
  it("loads only when enabled with owner and fetches fresh credentials for every operation", async () => {
    const getToken = vi.fn().mockResolvedValue("A"); const h = renderHook(({ enabled }) => useAccountProfile("A", getToken, enabled), { initialProps: { enabled: false } }); expect(h.result.current.status).toBe("idle"); expect(mocks.load).not.toHaveBeenCalled();
    h.rerender({ enabled: true }); await waitFor(() => expect(h.result.current.status).toBe("ready"));
    await act(async () => { expect(await h.result.current.saveDisplayName("Name")).toBe(true); }); expect(h.result.current.profile?.displayName).toBe("Name"); expect(getToken).toHaveBeenCalledTimes(2);
  });
  it("hides A immediately on B/logout and ignores A's late response", async () => {
    const pending = deferred<AccountProfile>(); mocks.load.mockImplementation((token: string) => token === "A" ? pending.promise : Promise.resolve(profile("B")));
    const h = renderHook(({ owner, getToken }) => useAccountProfile(owner, getToken, true), { initialProps: { owner: "A" as string | null, getToken: async () => "A" } }); await waitFor(() => expect(mocks.load).toHaveBeenCalled());
    h.rerender({ owner: "B", getToken: async () => "B" }); expect(h.result.current.profile).toBeNull(); await waitFor(() => expect(h.result.current.profile?.userId).toBe("B"));
    await act(async () => { pending.resolve({...profile("A"),avatarUrl:"https://avatars.githubusercontent.com/u/1",providerLocale:"fr",oauthProfileSource:"github"}); }); expect(h.result.current.profile?.userId).toBe("B"); h.rerender({ owner: null, getToken: async () => "B" }); expect(h.result.current.profile).toBeNull(); expect(h.result.current.status).toBe("idle");
  });
  it("never starts A's fetch if fresh token resolves after a switch to B", async () => {
    const token = deferred<string | null>(); const h = renderHook(({ owner, getToken }) => useAccountProfile(owner, getToken, true), { initialProps: { owner: "A", getToken: () => token.promise } });
    h.rerender({ owner: "B", getToken: async () => "B" }); await waitFor(() => expect(h.result.current.profile?.userId).toBe("B")); await act(async () => { token.resolve("A"); }); expect(mocks.load.mock.calls.map(([t]) => t)).toEqual(["B"]);
  });
  it("failed save returns false, retains prior profile, exposes error, and retry really reloads", async () => {
    const h = renderHook(() => useAccountProfile("A", async () => "A", true)); await waitFor(() => expect(h.result.current.status).toBe("ready")); mocks.save.mockRejectedValue(new Error("offline"));
    await act(async () => { expect(await h.result.current.saveDisplayName("Unsaved")).toBe(false); }); expect(h.result.current.status).toBe("error"); expect(h.result.current.profile?.displayName).toBe("A"); expect(h.result.current.error).toBeTruthy();
    act(() => { h.result.current.retry(); }); await waitFor(() => expect(h.result.current.status).toBe("ready")); expect(mocks.load).toHaveBeenCalledTimes(2);
  });
  it("rejects foreign successful profiles and retries a source failure", async () => {
    mocks.load.mockResolvedValueOnce(profile("B")); const h = renderHook(() => useAccountProfile("A", async () => "A", true)); await waitFor(() => expect(h.result.current.status).toBe("error")); expect(h.result.current.profile).toBeNull(); act(() => h.result.current.retry()); await waitFor(() => expect(h.result.current.profile?.userId).toBe("A"));
  });
  it("invalidates a late save after logout and never reports it as successful", async () => {
    const pending = deferred<AccountProfile>(); mocks.save.mockReturnValue(pending.promise); const getToken = async () => "A";
    const h = renderHook(({ owner }) => useAccountProfile(owner, getToken, true), { initialProps: { owner: "A" as string | null } }); await waitFor(() => expect(h.result.current.status).toBe("ready")); let saved!: Promise<boolean>;
    act(() => { saved = h.result.current.saveDisplayName("Late"); }); await waitFor(() => expect(mocks.save).toHaveBeenCalled()); h.rerender({ owner: null }); await act(async () => { pending.resolve({ ...profile(), displayName: "Late" }); expect(await saved).toBe(false); }); expect(h.result.current.profile).toBeNull();
  });
  it("bounds a stuck token wait and handles a missing session as an error", async () => {
    vi.useFakeTimers(); const never = deferred<string | null>(); const h = renderHook(() => useAccountProfile("A", () => never.promise, true)); await act(async () => { await vi.advanceTimersByTimeAsync(15000); }); expect(h.result.current.status).toBe("error"); expect(mocks.load).not.toHaveBeenCalled();
  });
  it("rejects absent fresh session without fetching private data", async () => {
    const h = renderHook(() => useAccountProfile("A", async () => null, true)); await waitFor(() => expect(h.result.current.status).toBe("error"));
    expect(h.result.current.error).toBe("ACCOUNT_SESSION_INVALID"); expect(mocks.load).not.toHaveBeenCalled();
  });
  it("never fetches when a token arrives after the deadline", async () => {
    vi.useFakeTimers(); const pending = deferred<string | null>(); const h = renderHook(() => useAccountProfile("A", () => pending.promise, true));
    await act(async () => { await vi.advanceTimersByTimeAsync(10001); }); expect(h.result.current.error).toBe("ACCOUNT_PROFILE_TIMEOUT");
    await act(async () => { pending.resolve("A"); }); expect(mocks.load).not.toHaveBeenCalled(); expect(h.result.current.status).toBe("error");
  });
  it("preserves the latest retry when an older generation finishes later", async () => {
    const pending = deferred<AccountProfile>(); mocks.load.mockReturnValueOnce(pending.promise).mockResolvedValueOnce({ ...profile(), displayName: "Retried" });
    const h = renderHook(() => useAccountProfile("A", async () => "A", true)); await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(1));
    act(() => h.result.current.retry()); await waitFor(() => expect(h.result.current.profile?.displayName).toBe("Retried"));
    await act(async () => pending.resolve(profile())); expect(h.result.current.profile?.displayName).toBe("Retried");
  });
  it("bounds a stuck fetch and ignores a success after timeout", async () => {
    vi.useFakeTimers(); const pending = deferred<AccountProfile>(); mocks.load.mockReturnValue(pending.promise); const h = renderHook(() => useAccountProfile("A", async () => "A", true));
    await act(async () => { await vi.advanceTimersByTimeAsync(15000); }); expect(h.result.current.status).toBe("error"); await act(async () => { pending.resolve(profile()); }); expect(h.result.current.profile).toBeNull(); expect(h.result.current.status).toBe("error");
  });
});
