import { createElement, StrictMode, type ReactNode } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { normalizePersonalStack, personalStackFingerprint, type PersonalStackRecord, type PersonalStackV4 } from "@/lib/personalStack";
import { pinToolInState } from "@/lib/stackState";
import { clearPersonalStackScope, getPersonalStackScope, personalStackStorageKey, readPersonalStack, replacePersonalStack, setPersonalStackScope } from "@/lib/personalStackStore";

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), onAuthStateChange: vi.fn(), signOut: vi.fn(), oauth: vi.fn(), otp: vi.fn(), verifyOtp: vi.fn(), load: vi.fn(), save: vi.fn(), remove: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: mocks.getSession, onAuthStateChange: mocks.onAuthStateChange, signOut: mocks.signOut, signInWithOAuth: mocks.oauth, signInWithOtp: mocks.otp, verifyOtp: mocks.verifyOtp } } }));
vi.mock("@/lib/stackAccountApi", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/stackAccountApi")>(), loadPersonalStack: mocks.load, savePersonalStack: mocks.save, deletePersonalAccount: mocks.remove }));
import { getStackAccountReturnUrl, StackAccountProvider, useStackAccount } from "./useStackAccount";
import { StackAccountApiError } from "@/lib/stackAccountApi";

const at = "2026-10-19T12:00:00Z";
function state(...slugs: string[]): PersonalStackV4 {
  const value = normalizePersonalStack(null);
  value.selection = slugs.reduce((selection, slug) => pinToolInState(selection, slug, [], at), value.selection);
  return value;
}
function record(value: PersonalStackV4, revision = 1): PersonalStackRecord { return { state: value, revision, updatedAt: at }; }
function session(owner = "A", token = `token-${owner}`): Session { return { user: { id: owner }, access_token: token } as Session; }
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (cause: unknown) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
let authChange: (event: string, value: Session | null) => void;
const wrapper = ({ children }: { children: ReactNode }) => createElement(StackAccountProvider, { enabled: true, children });
const mount = () => renderHook(() => useStackAccount(), { wrapper });
async function settle() { await act(async () => { await Promise.resolve(); }); }
async function tick() { await act(async () => { await vi.advanceTimersByTimeAsync(700); }); }
async function login(value: Session | null) { await act(async () => { authChange(value ? "SIGNED_IN" : "SIGNED_OUT", value); }); }

beforeEach(() => {
  vi.useFakeTimers(); vi.resetAllMocks();
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); }, clear: () => values.clear(),
  } });
  for (const scope of ["anonymous", "A", "B"]) clearPersonalStackScope(scope);
  window.localStorage.clear(); setPersonalStackScope("anonymous"); replacePersonalStack(state());
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mocks.onAuthStateChange.mockImplementation(callback => { authChange = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; });
  mocks.signOut.mockResolvedValue({ error: null });
  mocks.oauth.mockResolvedValue({ error: null }); mocks.otp.mockResolvedValue({ error: null }); mocks.verifyOtp.mockResolvedValue({ error: null });
  mocks.load.mockResolvedValue(null);
  mocks.save.mockImplementation(async (_token, input) => record(input.state, input.expectedRevision + 1));
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("global personal account coordinator", () => {
  it("keeps disabled accounts local without starting auth or network", async () => {
    const hook = renderHook(() => useStackAccount(), { wrapper: ({ children }) => createElement(StackAccountProvider, { enabled: false, children }) });
    await settle();
    expect(hook.result.current.syncStatus).toBe("local");
    expect(mocks.getSession).not.toHaveBeenCalled(); expect(mocks.load).not.toHaveBeenCalled();
  });

  it("hydrates full account state once above consumers and never autosaves hydration", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: session() }, error: null });
    const saved = state("saved"); saved.billing.paid = ["saved"];
    saved.billing.choices.saved = { source: "custom", amount: 17, currency: "GBP", period: "annual" };
    mocks.load.mockResolvedValue(record(saved, 3));
    const hook = renderHook(() => [useStackAccount(), useStackAccount()], { wrapper });
    await settle(); await tick();
    expect(getPersonalStackScope()).toBe("A"); expect(readPersonalStack()).toEqual(saved);
    expect(hook.result.current[0].syncStatus).toBe("synced");
    expect(mocks.onAuthStateChange).toHaveBeenCalledTimes(1); expect(mocks.load).toHaveBeenCalledTimes(1); expect(mocks.save).not.toHaveBeenCalled();
  });

  it("restarts hydration safely under StrictMode even when auth synchronously publishes the session", async () => {
    mocks.onAuthStateChange.mockImplementation(callback => { callback("INITIAL_SESSION", session()); return { data: { subscription: { unsubscribe: vi.fn() } } }; });
    mocks.load.mockResolvedValue(record(state("strict-mode-account")));
    const hook = renderHook(() => useStackAccount(), { wrapper: ({ children }) => createElement(StrictMode, null, createElement(StackAccountProvider, { enabled: true, children })) });
    await settle();
    expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["strict-mode-account"]);
    expect(hook.result.current.syncStatus).toBe("synced"); expect(mocks.save).not.toHaveBeenCalled();
  });

  it("ignores an initial getSession result after a newer B auth event", async () => {
    const initial = deferred<{ data: { session: Session }; error: null }>(); mocks.getSession.mockReturnValue(initial.promise);
    mocks.load.mockResolvedValue(record(state("B")));
    const hook = mount(); await login(session("B"));
    await act(async () => { initial.resolve({ data: { session: session("A") }, error: null }); });
    expect(hook.result.current.user?.id).toBe("B"); expect(getPersonalStackScope()).toBe("B");
    expect(mocks.load).toHaveBeenCalledTimes(1); expect(mocks.load).toHaveBeenCalledWith("token-B");
  });

  it("requires an explicit choice for a divergent anonymous draft and preserves it until chosen", async () => {
    replacePersonalStack(state("draft")); mocks.load.mockResolvedValue(record(state("saved"), 4));
    const hook = mount(); await settle(); await login(session()); await tick();
    expect(hook.result.current.pendingDraftChoice).toMatchObject({ draft: { selection: { pinnedToolSlugs: ["draft"] } }, saved: { revision: 4 } });
    expect(mocks.save).not.toHaveBeenCalled();
    expect(JSON.parse(window.localStorage.getItem(personalStackStorageKey("anonymous"))!).selection.pinnedToolSlugs).toEqual(["draft"]);
    await act(async () => { await hook.result.current.loadSaved(); });
    expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["saved"]);
    expect(hook.result.current.pendingDraftChoice).toBeNull(); expect(hook.result.current.syncStatus).toBe("synced");
  });

  it("captures anonymous edits made after the global provider starts before email sign-in completes", async () => {
    mocks.load.mockResolvedValue(record(state("saved")));
    const hook = mount(); await settle();
    act(() => replacePersonalStack(state("built-after-page-load")));
    await login(session()); await tick();
    expect(hook.result.current.pendingDraftChoice?.draft.selection.pinnedToolSlugs).toEqual(["built-after-page-load"]);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("retains account edits made while the anonymous draft choice is pending when adding it", async () => {
    replacePersonalStack(state("draft")); mocks.load.mockResolvedValue(record(state("saved")));
    const hook = mount(); await settle(); await login(session());
    act(() => replacePersonalStack(state("saved", "edited-during-choice")));
    await act(async () => { await hook.result.current.addDraft(); });
    expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["saved", "edited-during-choice", "draft"]);
  });

  it("adds a true anonymous draft only explicitly and keeps saved plan declarations", async () => {
    const draft = state("saved", "new"); draft.billing.paid = ["saved", "new"];
    draft.billing.choices = { saved: { source: "custom", amount: 99, currency: "EUR", period: "monthly" }, new: { source: "custom", amount: 9, currency: "USD", period: "monthly" } };
    replacePersonalStack(draft);
    const saved = state("saved"); saved.billing.reviewed = ["saved"]; mocks.load.mockResolvedValue(record(saved, 4));
    const hook = mount(); await settle(); await login(session());
    await act(async () => { await hook.result.current.addDraft(); });
    expect(mocks.save).toHaveBeenCalledWith("token-A", expect.objectContaining({ expectedRevision: 4 }));
    expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["saved", "new"]);
    expect(readPersonalStack().billing.paid).toEqual(["new"]);
    expect(readPersonalStack().billing.choices).toEqual({ new: draft.billing.choices.new });
  });

  it("preserves unrecorded same-tool billing from a legacy saved stack only after explicit addition", async () => {
    const draft = state("legacy"); draft.billing.paid = ["legacy"]; draft.billing.reviewed = ["legacy"];
    draft.billing.choices.legacy = { source: "custom", amount: 25, currency: "EUR", period: "monthly" };
    replacePersonalStack(draft); mocks.load.mockResolvedValue(record(state("legacy"), 5));
    const hook = mount(); await settle(); await login(session()); await tick();
    expect(hook.result.current.pendingDraftChoice).not.toBeNull(); expect(mocks.save).not.toHaveBeenCalled();
    await act(async () => { await hook.result.current.addDraft(); });
    expect(readPersonalStack().billing).toEqual(draft.billing);
  });

  it("recognizes identical anonymous and saved states without a prompt or redundant write", async () => {
    replacePersonalStack(state("same")); mocks.load.mockResolvedValue(record(state("same")));
    const hook = mount(); await settle(); await login(session()); await tick();
    expect(hook.result.current.pendingDraftChoice).toBeNull(); expect(mocks.save).not.toHaveBeenCalled();
    expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["same"]);
  });

  it("keeps the anonymous draft until its initial creation is confirmed", async () => {
    const saving = deferred<PersonalStackRecord>(); mocks.save.mockReturnValue(saving.promise);
    replacePersonalStack(state("draft")); const hook = mount(); await settle(); await login(session()); await tick();
    expect(mocks.save).toHaveBeenCalledWith("token-A", expect.objectContaining({ expectedRevision: 0 }));
    expect(JSON.parse(window.localStorage.getItem(personalStackStorageKey("anonymous"))!).selection.pinnedToolSlugs).toEqual(["draft"]);
    await act(async () => { saving.resolve(record(state("draft"))); });
    expect(hook.result.current.syncStatus).toBe("synced");
    expect(JSON.parse(window.localStorage.getItem(personalStackStorageKey("anonymous"))!).selection.pinnedToolSlugs).toEqual([]);
  });

  it("ignores A hydration arriving after B and never offers A as B's anonymous draft", async () => {
    const lateA = deferred<PersonalStackRecord | null>();
    mocks.load.mockImplementation(token => token === "token-A" ? lateA.promise : Promise.resolve(record(state("B-only"))));
    const hook = mount(); await settle(); await login(session("A")); await login(session("B"));
    await act(async () => { lateA.resolve(record(state("A-only"))); }); await tick();
    expect(getPersonalStackScope()).toBe("B"); expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["B-only"]);
    expect(hook.result.current.user?.id).toBe("B"); expect(hook.result.current.pendingDraftChoice).toBeNull();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("keeps expired private edits under their owner instead of relabeling them anonymous", async () => {
    mocks.load.mockResolvedValue(record(state("private")));
    const hook = mount(); await settle(); await login(session());
    act(() => replacePersonalStack(state("private", "offline")));
    await login(null); await tick();
    expect(getPersonalStackScope()).toBe("A"); expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["private", "offline"]);
    expect(hook.result.current.syncStatus).toBe("session-expired"); expect(mocks.save).not.toHaveBeenCalled();
    await login(session("B"));
    expect(hook.result.current.pendingDraftChoice).toBeNull();
  });

  it("preserves persisted dirty account state across provider reload and detects remote conflict", async () => {
    mocks.load.mockResolvedValue(record(state("base"), 2));
    const first = mount(); await settle(); await login(session());
    act(() => replacePersonalStack(state("local-edit"))); first.unmount();
    mocks.getSession.mockResolvedValue({ data: { session: session() }, error: null });
    mocks.load.mockResolvedValue(record(state("other-device"), 3));
    const second = mount(); await settle(); await tick();
    expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["local-edit"]);
    expect(second.result.current.conflict).toMatchObject({ remote: { revision: 3 }, local: { selection: { pinnedToolSlugs: ["local-edit"] } } });
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("recovers a committed save with a lost acknowledgement through an identical reread", async () => {
    mocks.load.mockResolvedValueOnce(record(state("base"), 1)).mockResolvedValueOnce(record(state("changed"), 2));
    mocks.save.mockRejectedValue(new StackAccountApiError(0, "STACK_ACCOUNT_NETWORK_ERROR"));
    const hook = mount(); await settle(); await login(session());
    act(() => replacePersonalStack(state("changed"))); await tick();
    expect(hook.result.current.syncStatus).toBe("synced"); expect(hook.result.current.conflict).toBeNull();
    expect(mocks.save).toHaveBeenCalledTimes(1); expect(mocks.load).toHaveBeenCalledTimes(2);
  });

  it("holds both versions after 409 and only overwrites the latest revision on explicit keepCurrent", async () => {
    mocks.load.mockResolvedValueOnce(record(state("base"), 1)).mockResolvedValueOnce(record(state("remote-edit"), 2));
    mocks.save.mockRejectedValueOnce(new StackAccountApiError(409, "STACK_REVISION_CONFLICT"));
    const hook = mount(); await settle(); await login(session());
    act(() => replacePersonalStack(state("local-edit"))); await tick();
    expect(hook.result.current.conflict).toMatchObject({ local: { selection: { pinnedToolSlugs: ["local-edit"] } }, remote: { revision: 2 } });
    expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["local-edit"]);
    await tick(); expect(mocks.save).toHaveBeenCalledTimes(1);
    await act(async () => { await hook.result.current.keepCurrent(); });
    expect(mocks.save).toHaveBeenLastCalledWith("token-A", expect.objectContaining({ expectedRevision: 2 }));
    expect(hook.result.current.syncStatus).toBe("synced");
  });

  it("uses the latest full store after a save completes so edits during the request survive", async () => {
    mocks.load.mockResolvedValue(record(state("base"), 1));
    const inFlight = deferred<PersonalStackRecord>(); mocks.save.mockReturnValueOnce(inFlight.promise);
    const hook = mount(); await settle(); await login(session());
    act(() => replacePersonalStack(state("first-edit"))); await tick();
    act(() => { const latest = state("second-edit"); latest.billing.paid = ["second-edit"]; replacePersonalStack(latest); });
    await act(async () => { inFlight.resolve(record(state("first-edit"), 2)); }); await tick();
    expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["second-edit"]);
    expect(mocks.save).toHaveBeenLastCalledWith("token-A", expect.objectContaining({ expectedRevision: 2, state: expect.objectContaining({ billing: expect.objectContaining({ paid: ["second-edit"] }) }) }));
    expect(hook.result.current.syncStatus).toBe("synced");
  });

  it("ignores late A save completion after B connects", async () => {
    mocks.load.mockImplementation(token => Promise.resolve(record(state(token === "token-A" ? "A" : "B"))));
    const saving = deferred<PersonalStackRecord>(); mocks.save.mockReturnValue(saving.promise);
    const hook = mount(); await settle(); await login(session("A"));
    act(() => replacePersonalStack(state("A-edit"))); await tick(); await login(session("B"));
    await act(async () => { saving.resolve(record(state("A-edit"), 2)); });
    expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["B"]); expect(hook.result.current.user?.id).toBe("B");
  });

  it("does not silently replace edits made while account hydration is pending", async () => {
    const loading = deferred<PersonalStackRecord | null>(); mocks.load.mockReturnValue(loading.promise);
    const hook = mount(); await settle(); await login(session());
    act(() => replacePersonalStack(state("during-load")));
    await act(async () => { loading.resolve(record(state("remote"), 2)); });
    expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["during-load"]);
    expect(hook.result.current.conflict).not.toBeNull(); expect(mocks.save).not.toHaveBeenCalled();
  });

  it("leaves edits and ownership intact when a save session is revoked", async () => {
    mocks.load.mockResolvedValue(record(state("base")));
    mocks.save.mockRejectedValue(new StackAccountApiError(401, "ACCOUNT_SESSION_INVALID"));
    const hook = mount(); await settle(); await login(session());
    act(() => replacePersonalStack(state("unsaved"))); await tick();
    expect(getPersonalStackScope()).toBe("A"); expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["unsaved"]);
    expect(hook.result.current.syncStatus).toBe("session-expired");
  });

  it("keeps unavailable deletion as an error without clearing local account state", async () => {
    mocks.load.mockResolvedValue(record(state("private"))); mocks.remove.mockRejectedValue(new StackAccountApiError(503, "ACCOUNT_DELETION_UNAVAILABLE"));
    const hook = mount(); await settle(); await login(session());
    await act(async () => { expect(await hook.result.current.deleteAccount()).toBe(false); });
    expect(getPersonalStackScope()).toBe("A"); expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["private"]);
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("retains unsaved private state until logout is explicitly confirmed", async () => {
    mocks.load.mockResolvedValue(record(state("saved")));
    const hook = mount(); await settle(); await login(session());
    act(() => replacePersonalStack(state("unsaved")));
    await act(async () => { expect(await hook.result.current.signOut()).toBe(false); });
    expect(hook.result.current.signOutNeedsConfirmation).toBe(true); expect(mocks.signOut).not.toHaveBeenCalled();
    expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["unsaved"]);
    await act(async () => { expect(await hook.result.current.signOut({ discardUnsaved: true })).toBe(true); });
    expect(getPersonalStackScope()).toBe("anonymous"); expect(readPersonalStack().selection.pinnedToolSlugs).toEqual([]);
  });

  it("ignores A logout completion after B connects during the request", async () => {
    mocks.load.mockImplementation(token => Promise.resolve(record(state(token === "token-A" ? "A" : "B"))));
    const signingOut = deferred<{ error: null }>(); mocks.signOut.mockReturnValue(signingOut.promise);
    const hook = mount(); await settle(); await login(session("A"));
    let pending!: Promise<boolean>;
    act(() => { pending = hook.result.current.signOut(); });
    await login(session("B"));
    await act(async () => { signingOut.resolve({ error: null }); await pending; });
    expect(getPersonalStackScope()).toBe("B"); expect(hook.result.current.user?.id).toBe("B");
    expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["B"]);
  });

  it("allows known same-origin OAuth returns with query/hash and rejects external or unknown destinations", () => {
    const origin = window.location.origin;
    expect(getStackAccountReturnUrl({ lang: "en", returnTo: "/en/comparatif/notion-vs-coda?from=stack#decision" })).toBe(`${origin}/en/comparatif/notion-vs-coda?from=stack#decision`);
    for (const returnTo of ["https://attacker.example/en/ma-stack", "//attacker.example/fr/ma-stack", "javascript:alert(1)", "/en/arbitrary-page", "/fr/../external", "/en/tool\\attacker"]) {
      expect(getStackAccountReturnUrl({ lang: "en", returnTo })).toBe(`${origin}/en/ma-stack`);
    }
  });

  it("preserves the draft through OAuth/code failures and verifies the exact typed email code", async () => {
    replacePersonalStack(state("draft")); const hook = mount(); await settle();
    mocks.oauth.mockResolvedValueOnce({ error: new Error("cancelled") });
    mocks.verifyOtp.mockResolvedValueOnce({ error: new Error("expired code") });
    await act(async () => { expect(await hook.result.current.signInWithGoogle({ lang: "en", returnTo: "/en/ma-stack?save=1#budget" })).toBe(false); });
    await act(async () => { expect(await hook.result.current.sendEmailCode(" Owner@Example.Test ", { lang: "en" })).toBe(true); });
    await act(async () => { expect(await hook.result.current.verifyEmailCode("Owner@Example.Test", " 123456 ")).toBe(false); });
    expect(mocks.verifyOtp).toHaveBeenCalledWith({ email: "owner@example.test", token: "123456", type: "email" });
    expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["draft"]); expect(mocks.save).not.toHaveBeenCalled();
  });

  it("ignores a late email-code response after another account connects", async () => {
    const sending = deferred<{ error: null }>(); mocks.otp.mockReturnValue(sending.promise);
    const hook = mount(); await settle();
    let pending!: Promise<boolean>;
    act(() => { pending = hook.result.current.sendEmailCode("private-a@example.test"); });
    await login(session("B"));
    await act(async () => { sending.resolve({ error: null }); await pending; });
    expect(hook.result.current.magicLinkSentTo).toBeNull(); expect(hook.result.current.user?.id).toBe("B");
  });

  it("restores expired ownership after a provider reload with no session", async () => {
    mocks.load.mockResolvedValue(record(state("private")));
    const first = mount(); await settle(); await login(session()); first.unmount();
    // Emulate the store's default namespace on a fresh application boot.
    setPersonalStackScope("anonymous"); mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    const second = mount(); await settle();
    expect(getPersonalStackScope()).toBe("A"); expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["private"]);
    expect(second.result.current.syncStatus).toBe("session-expired");
  });
});
