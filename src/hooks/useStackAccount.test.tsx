import { createElement, lazy, Suspense, StrictMode, type ReactNode } from "react";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { normalizePersonalStack, personalStackFingerprint, type PersonalStackRecord, type PersonalStackV4 } from "@/lib/personalStack";
import { pinToolInState } from "@/lib/stackState";
import { clearPersonalStackScope, getPersonalStackScope, personalStackStorageKey, readPersonalStack, replacePersonalStack, setPersonalStackScope } from "@/lib/personalStackStore";

const mocks = vi.hoisted(() => ({ acquireAuth: vi.fn(), getSession: vi.fn(), onAuthStateChange: vi.fn(), signOut: vi.fn(), oauth: vi.fn(), otp: vi.fn(), verifyOtp: vi.fn(), load: vi.fn(), save: vi.fn(), remove: vi.fn(), password: vi.fn(), signup: vi.fn(), resend: vi.fn(), reset: vi.fn(), update: vi.fn() }));
vi.mock("@/config/features", () => ({ STACK_ACCOUNT_ENABLED: true, ACCOUNT_GOOGLE_ENABLED: true, ACCOUNT_GITHUB_ENABLED: true }));
vi.mock("@/components/v2shell/AppShellV2", () => ({ default: ({ children }: { children: ReactNode }) => createElement("main", null, children) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { get auth() { mocks.acquireAuth(); return { getSession: mocks.getSession, onAuthStateChange: mocks.onAuthStateChange, signOut: mocks.signOut, signInWithOAuth: mocks.oauth, signInWithOtp: mocks.otp, verifyOtp: mocks.verifyOtp, signInWithPassword: mocks.password, signUp: mocks.signup, resend: mocks.resend, resetPasswordForEmail: mocks.reset, updateUser: mocks.update }; } } }));
vi.mock("@/lib/stackAccountApi", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/stackAccountApi")>(), loadPersonalStack: mocks.load, savePersonalStack: mocks.save, deletePersonalAccount: mocks.remove }));
import { getStackAccountReturnUrl, StackAccountProvider, StackAccountRouteHydrated, useStackAccount } from "./useStackAccount";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
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
  vi.stubEnv("VITE_ACCOUNT_GOOGLE_ENABLED", "true"); vi.stubEnv("VITE_ACCOUNT_GITHUB_ENABLED", "true");
  const values = new Map<string, string>();
  for (const storageName of ["localStorage", "sessionStorage"]) Object.defineProperty(window, storageName, { configurable: true, value: {
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
  mocks.password.mockResolvedValue({ data: { session: session() }, error: null });
  mocks.signup.mockResolvedValue({ data: { session: null }, error: null });
  mocks.resend.mockResolvedValue({ data: {}, error: null }); mocks.reset.mockResolvedValue({ data: {}, error: null });
  mocks.update.mockResolvedValue({ data: { user: session().user }, error: null });
  mocks.load.mockResolvedValue(null);
  mocks.save.mockImplementation(async (_token, input) => record(input.state, input.expectedRevision + 1));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllEnvs(); });

describe("global personal account coordinator", () => {
  it("keeps disabled accounts local without starting auth or network", async () => {
    const hook = renderHook(() => useStackAccount(), { wrapper: ({ children }) => createElement(StackAccountProvider, { enabled: false, children }) });
    await settle();
    expect(hook.result.current.syncStatus).toBe("local");
    expect(mocks.acquireAuth).not.toHaveBeenCalled();
    expect(mocks.getSession).not.toHaveBeenCalled(); expect(mocks.load).not.toHaveBeenCalled();
  });

  it("waits for the route boundary commit before starting auth and keeps it alive across later route changes", async () => {
    const route = deferred<{ default: () => ReactNode }>();
    const SlowRoute = lazy(() => route.promise);
    const layout = (showRoute: boolean) => createElement(StackAccountProvider, { enabled: true, deferUntilRouteHydrated: true, children:
      createElement(Suspense, { fallback: createElement("p", null, "Loading") },
        showRoute && createElement(SlowRoute), createElement(StackAccountRouteHydrated)) });
    const view = render(layout(true));
    await settle();
    expect(mocks.acquireAuth).not.toHaveBeenCalled();
    expect(mocks.onAuthStateChange).not.toHaveBeenCalled();
    await act(async () => route.resolve({ default: () => createElement("h1", null, "Ready") }));
    await settle();
    expect(screen.getByText("Ready")).toBeVisible();
    expect(mocks.onAuthStateChange).toHaveBeenCalledTimes(1);
    view.rerender(layout(false));
    await settle();
    view.rerender(layout(true));
    await settle();
    expect(mocks.onAuthStateChange).toHaveBeenCalledTimes(1);
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
  });

  it("starts the gated provider once under StrictMode and keeps owner changes immediate", async () => {
    const unsubscribe = vi.fn();
    mocks.onAuthStateChange.mockImplementation(callback => {
      authChange = callback;
      callback("INITIAL_SESSION", session("A"));
      return { data: { subscription: { unsubscribe } } };
    });
    mocks.load.mockImplementation(async token => record(state(token === "token-A" ? "private-A" : "private-B")));
    const hook = renderHook(() => useStackAccount(), { wrapper: ({ children }) =>
      createElement(StrictMode, null, createElement(StackAccountProvider, { enabled: true, deferUntilRouteHydrated: true, children:
        createElement(Suspense, { fallback: null }, children, createElement(StackAccountRouteHydrated)) })) });
    await settle();
    expect(hook.result.current.user?.id).toBe("A");
    expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["private-A"]);
    expect(mocks.onAuthStateChange).toHaveBeenCalledTimes(1);
    act(() => authChange("SIGNED_IN", session("B")));
    // No deferred snapshot: the prior owner's selection is cleared immediately.
    expect(hook.result.current.user?.id).toBe("B");
    expect(readPersonalStack().selection.pinnedToolSlugs).not.toContain("private-A");
    await settle();
    expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["private-B"]);
    hook.unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
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

  it("keeps a revert unsaved during the pending write and resaves it against the resulting revision", async () => {
    const confirmed = state("confirmed-A");
    const submitted = state("submitted-B");
    mocks.load.mockResolvedValue(record(confirmed, 1));
    const saveB = deferred<PersonalStackRecord>();
    const saveA = deferred<PersonalStackRecord>();
    mocks.save.mockReturnValueOnce(saveB.promise).mockReturnValueOnce(saveA.promise);
    const hook = mount(); await settle(); await login(session());
    act(() => replacePersonalStack(submitted)); await tick();
    expect(mocks.save).toHaveBeenCalledWith("token-A", { expectedRevision: 1, state: submitted });

    act(() => replacePersonalStack(confirmed));
    expect(hook.result.current.syncStatus).toBe("syncing");
    expect(hook.result.current.hasUnsavedChanges).toBe(true);
    await act(async () => { expect(await hook.result.current.signOut()).toBe(false); });
    expect(mocks.signOut).not.toHaveBeenCalled();

    await act(async () => { saveB.resolve(record(submitted, 2)); });
    expect(readPersonalStack()).toEqual(confirmed);
    expect(hook.result.current.hasUnsavedChanges).toBe(true);
    await tick();
    expect(mocks.save).toHaveBeenCalledTimes(2);
    expect(mocks.save).toHaveBeenLastCalledWith("token-A", { expectedRevision: 2, state: confirmed });
    expect(hook.result.current.syncStatus).toBe("syncing");
    expect(hook.result.current.hasUnsavedChanges).toBe(true);

    await act(async () => { saveA.resolve(record(confirmed, 3)); });
    expect(hook.result.current.syncStatus).toBe("synced");
    expect(hook.result.current.hasUnsavedChanges).toBe(false);
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

  it("purges the complete account cache after confirmed deletion and ignores a late save", async () => {
    const saved = state("private"); saved.billing.paid = ["private"]; saved.billing.choices.private = { source: "custom", amount: 12, currency: "EUR", period: "monthly" };
    saved.decisions["old|private"] = { kind: "replace", kept: "private", removed: "old", saving: 5, at };
    mocks.load.mockResolvedValue(record(saved)); mocks.remove.mockResolvedValue(undefined);
    const saving = deferred<PersonalStackRecord>(); mocks.save.mockReturnValue(saving.promise);
    const hook = mount(); await settle(); await login(session());
    act(() => replacePersonalStack({ ...saved, selection: state("private", "new").selection })); await tick();
    await act(async () => { expect(await hook.result.current.deleteAccount()).toBe(true); });
    expect(hook.result.current.deletionConfirmed).toBe(true); expect(hook.result.current.user).toBeNull();
    expect(getPersonalStackScope()).toBe("anonymous"); expect(readPersonalStack()).toEqual(state());
    expect(window.localStorage.getItem(`${personalStackStorageKey("A")}:backup`)).toBeNull();
    expect(window.localStorage.getItem(`${personalStackStorageKey("A")}:sync`)).toBeNull();
    await act(async () => { saving.resolve(record(saved, 2)); });
    expect(readPersonalStack()).toEqual(state());
    mocks.password.mockResolvedValue({ data: { session: session() }, error: null });
  mocks.signup.mockResolvedValue({ data: { session: null }, error: null });
  mocks.resend.mockResolvedValue({ data: {}, error: null }); mocks.reset.mockResolvedValue({ data: {}, error: null });
  mocks.update.mockResolvedValue({ data: { user: session().user }, error: null });
  mocks.load.mockResolvedValue(null); await login(session("recreated")); await tick();
    expect(readPersonalStack()).toEqual(state()); expect(hook.result.current.pendingDraftChoice).toBeNull();
  });

  it("purges consumed legacy sources on import and preserves a later unrelated anonymous draft on logout", async () => {
    replacePersonalStack(state("original"));
    window.localStorage.setItem("tooltrim-ma-stack-mvp-v3", JSON.stringify(state("original").selection));
    window.localStorage.setItem("tooltrim-ma-stack-mvp-v3-backup", JSON.stringify(state("original").selection));
    window.localStorage.setItem("tooltrim-ma-stack-paid-plans-v1", '["original"]');
    const hook = mount(); await settle(); await login(session()); await tick();
    expect(window.localStorage.getItem("tooltrim-ma-stack-mvp-v3")).toBeNull();
    expect(window.localStorage.getItem("tooltrim-ma-stack-mvp-v3-backup")).toBeNull();
    expect(window.localStorage.getItem("tooltrim-ma-stack-paid-plans-v1")).toBeNull();
    window.localStorage.setItem(personalStackStorageKey("anonymous"), JSON.stringify(state("later-unrelated")));
    await act(async () => { expect(await hook.result.current.signOut()).toBe(true); });
    expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["later-unrelated"]);
  });

  it("does not claim durable cleanup when browser storage rejects a confirmed deletion purge", async () => {
    mocks.load.mockResolvedValue(record(state("private"))); mocks.remove.mockResolvedValue(undefined);
    const hook = mount(); await settle(); await login(session());
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => { throw new Error("denied"); });
    vi.spyOn(window.localStorage, "removeItem").mockImplementation(() => { throw new Error("denied"); });
    await act(async () => { expect(await hook.result.current.deleteAccount()).toBe(true); });
    expect(hook.result.current.deletionConfirmed).toBe(true);
    expect(hook.result.current.privacyWarning).toBe("ACCOUNT_LOCAL_CLEANUP_INCOMPLETE");
    expect(readPersonalStack()).toEqual(state());
    act(() => setPersonalStackScope("A")); expect(readPersonalStack()).toEqual(state());
  });

  it("allows deletion retry after provider failure and never autosaves the deleting account", async () => {
    mocks.load.mockResolvedValue(record(state("private"))); mocks.remove.mockRejectedValueOnce(new StackAccountApiError(503, "ACCOUNT_DELETION_FAILED")).mockResolvedValueOnce(undefined);
    const hook = mount(); await settle(); await login(session());
    await act(async () => { expect(await hook.result.current.deleteAccount()).toBe(false); });
    expect(getPersonalStackScope()).toBe("A"); expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["private"]);
    act(() => replacePersonalStack(state("still-local"))); await tick(); expect(mocks.save).not.toHaveBeenCalled();
    await act(async () => { expect(await hook.result.current.deleteAccount()).toBe(true); });
    expect(hook.result.current.deletionConfirmed).toBe(true);
  });

  it("keeps a lost deletion acknowledgement unconfirmed after 401 and offers separate local cleanup", async () => {
    mocks.load.mockResolvedValue(record(state("private"))); mocks.remove.mockRejectedValueOnce(new StackAccountApiError(0, "STACK_ACCOUNT_NETWORK_ERROR")).mockRejectedValueOnce(new StackAccountApiError(401, "ACCOUNT_SESSION_INVALID"));
    const hook = mount(); await settle(); await login(session());
    await act(async () => { expect(await hook.result.current.deleteAccount()).toBe(false); });
    await act(async () => { expect(await hook.result.current.deleteAccount()).toBe(false); });
    expect(hook.result.current.deletionConfirmed).toBe(false); expect(hook.result.current.error).toBe("ACCOUNT_DELETION_UNCONFIRMED");
    await act(async () => { await hook.result.current.clearLocalAccount(); });
    expect(hook.result.current.deletionConfirmed).toBe(false); expect(hook.result.current.user).toBeNull(); expect(readPersonalStack()).toEqual(state());
  });

  it.each(["success", "failure"])("recovers a failed sign-out with a pending PUT after its late %s without reload", async outcome => {
    const pending = deferred<PersonalStackRecord>();
    mocks.load.mockResolvedValueOnce(record(state("base"), 1)).mockResolvedValueOnce(record(state(outcome === "success" ? "pending" : "base"), outcome === "success" ? 2 : 1));
    mocks.save.mockReturnValueOnce(pending.promise); mocks.signOut.mockResolvedValueOnce({ error: new Error("sign-out unavailable") });
    const hook = mount(); await settle(); await login(session());
    act(() => replacePersonalStack(state("pending"))); await tick();
    await act(async () => { expect(await hook.result.current.signOut({ discardUnsaved: true })).toBe(false); });
    await act(async () => { if (outcome === "success") pending.resolve(record(state("pending"), 2)); else pending.reject(new StackAccountApiError(0, "STACK_ACCOUNT_NETWORK_ERROR")); });
    await act(async () => { await hook.result.current.retry(); }); await tick();
    act(() => replacePersonalStack(state("after-recovery"))); await tick();
    expect(mocks.save).toHaveBeenLastCalledWith("token-A", expect.objectContaining({ state: expect.objectContaining({ selection: expect.objectContaining({ pinnedToolSlugs: ["after-recovery"] }) }) }));
    expect(hook.result.current.syncStatus).toBe("synced"); expect(getPersonalStackScope()).toBe("A");
  });

  it("retains unsaved private state until logout is explicitly confirmed", async () => {
    mocks.load.mockResolvedValue(record(state("saved")));
    const hook = mount(); await settle(); await login(session());
    act(() => replacePersonalStack(state("unsaved")));
    await act(async () => { expect(await hook.result.current.signOut()).toBe(false); });
    expect(hook.result.current.signOutNeedsConfirmation).toBe(true); expect(mocks.signOut).not.toHaveBeenCalled();
    expect(readPersonalStack().selection.pinnedToolSlugs).toEqual(["unsaved"]);
    await act(async () => { expect(await hook.result.current.signOut({ discardUnsaved: true })).toBe(true); });
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
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

function recoverySession(owner = "A", sessionId = "session-A", nonce = "first"): Session {
  return { ...session(owner, `header.${btoa(JSON.stringify({ session_id: sessionId, nonce }))}.sig`), expires_at: Math.floor(Date.now() / 1000) + 3600 } as Session;
}
async function event(name: string, value: Session | null) { await act(async () => { authChange(name, value); }); }
describe("complete account identity operations", () => {
  it("serializes all consumers while a request survives close/reopen and releases after SDK rejection", async () => {
    const pending = deferred<{ data: { session: null }; error: { code: string } }>(); mocks.password.mockReturnValue(pending.promise);
    const hook = mount(); await settle(); let operation!: Promise<unknown>;
    act(() => { operation = hook.result.current.signInWithPassword("a@example.invalid", "password"); });
    expect(hook.result.current.authBusy).toBe(true);
    await act(async () => { expect(await hook.result.current.signUpWithPassword("a@example.invalid", "password")).toEqual({ ok: false, error: "ACCOUNT_AUTH_BUSY" }); });
    await act(async () => { expect(await hook.result.current.signOut()).toBe(false); });
    await act(async () => { pending.resolve({ data: { session: null }, error: { code: "invalid_credentials" } }); await operation; });
    expect(hook.result.current.authBusy).toBe(false); expect(hook.result.current.error).toBe("ACCOUNT_INVALID_CREDENTIALS");
    await act(async () => { expect(await hook.result.current.signUpWithPassword("a@example.invalid", "password")).toEqual({ ok: true, outcome: "confirmation-required" }); });
    expect(mocks.signup).toHaveBeenCalledTimes(1);
  });
  it("never enables recovery from a forged query or ordinary authenticated session", async () => {
    window.history.replaceState(null, "", "/fr/compte/reinitialiser?recovery=true");
    const hook = mount(); await settle(); await login(recoverySession());
    await act(async () => { expect(await hook.result.current.completePasswordReset("new phrase")).toEqual({ ok: false, error: "ACCOUNT_RECOVERY_INVALID" }); });
    expect(hook.result.current.recoveryStatus).toBe("invalid"); expect(mocks.update).not.toHaveBeenCalled();
  });
  it("keeps real recovery valid through USER_UPDATED and TOKEN_REFRESHED while changing the password", async () => {
    const hook = mount(); await settle(); const recovered = recoverySession(); await event("PASSWORD_RECOVERY", recovered);
    mocks.update.mockImplementation(async () => { await event("USER_UPDATED", { ...recovered, user: { ...recovered.user, updated_at: at } }); await event("TOKEN_REFRESHED", recoverySession("A", "session-A", "refreshed")); return { data: { user: recovered.user }, error: null }; });
    await act(async () => { expect(await hook.result.current.completePasswordReset("  new phrase  ")).toEqual({ ok: true, outcome: "password-updated" }); });
    expect(mocks.update).toHaveBeenCalledWith({ password: "  new phrase  " }); expect(mocks.signOut).toHaveBeenCalledWith({ scope: "others" });
    expect(hook.result.current.recoveryStatus).toBe("complete"); expect(hook.result.current.authBusy).toBe(false);
    await act(async () => { expect((await hook.result.current.completePasswordReset("different phrase")).ok).toBe(false); });
    expect(mocks.update).toHaveBeenCalledTimes(1);
  });
  it("returns password success with a warning when other-session revocation fails", async () => {
    const hook = mount(); await settle(); await event("PASSWORD_RECOVERY", recoverySession()); mocks.signOut.mockResolvedValue({ error: { code: "network" } });
    await act(async () => { expect(await hook.result.current.completePasswordReset("new phrase")).toEqual({ ok: true, outcome: "password-updated", warning: "ACCOUNT_OTHER_SESSIONS_NOT_REVOKED" }); });
    expect(hook.result.current.recoveryStatus).toBe("complete");
  });
  it("rejects expired recovery and discards proof when another session of the same owner takes over", async () => {
    const hook = mount(); await settle(); await event("PASSWORD_RECOVERY", recoverySession());
    await act(async () => { await vi.advanceTimersByTimeAsync(16 * 60 * 1000); expect((await hook.result.current.completePasswordReset("new phrase")).ok).toBe(false); });
    expect(mocks.update).not.toHaveBeenCalled();
    await event("PASSWORD_RECOVERY", recoverySession()); await login(recoverySession("A", "another-session"));
    await act(async () => { expect((await hook.result.current.completePasswordReset("new phrase")).ok).toBe(false); });
  });
  it("restores recovery across reload only for the matching subject and session", async () => {
    const first = mount(); await settle(); await event("PASSWORD_RECOVERY", recoverySession()); first.unmount();
    mocks.getSession.mockResolvedValue({ data: { session: recoverySession("A", "session-A", "refresh") }, error: null });
    const second = mount(); await settle(); expect(second.result.current.recoveryStatus).toBe("ready"); second.unmount();
    mocks.getSession.mockResolvedValue({ data: { session: recoverySession("A", "new-session") }, error: null });
    const third = mount(); await settle(); expect(third.result.current.recoveryStatus).not.toBe("ready");
    await act(async () => { expect((await third.result.current.completePasswordReset("new phrase")).ok).toBe(false); });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("does not restore recovery when marker persistence is blocked", async () => {
    vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    const first = mount(); await settle(); await event("PASSWORD_RECOVERY", recoverySession()); expect(first.result.current.recoveryStatus).toBe("ready"); first.unmount();
    mocks.getSession.mockResolvedValue({ data: { session: recoverySession() }, error: null }); const second = mount(); await settle();
    expect(second.result.current.recoveryStatus).not.toBe("ready");
  });
  it.each([false, true])("ignores late recovery result after A is replaced by B (SDK success=%s), and never revokes B sessions", async succeeds => {
    const pending = deferred<{ data: { user: Session["user"] | null }; error: { code: string } | null }>(); mocks.update.mockReturnValue(pending.promise);
    const hook = mount(); await settle(); await event("PASSWORD_RECOVERY", recoverySession()); let operation!: Promise<unknown>;
    act(() => { operation = hook.result.current.completePasswordReset("new phrase"); }); await login(recoverySession("B", "session-B"));
    await act(async () => { pending.resolve({ data: { user: succeeds ? recoverySession().user : null }, error: succeeds ? null : { code: "otp_expired" } }); await operation; });
    expect(hook.result.current.user?.id).toBe("B"); expect(hook.result.current.error).toBeNull(); expect(hook.result.current.authBusy).toBe(false); expect(mocks.signOut).not.toHaveBeenCalled();
  });
  it("returns only the current SDK token and discards getSession responses from a former owner", async () => {
    const hook = mount(); await settle(); await login(session());
    const late = deferred<{ data: { session: Session }; error: null }>(); mocks.getSession.mockReturnValue(late.promise);
    const token = hook.result.current.getAccessToken(); await login(session("B"));
    late.resolve({ data: { session: session() }, error: null }); expect(await token).toBeNull();
    mocks.getSession.mockResolvedValue({ data: { session: session("B") }, error: null }); expect(await hook.result.current.getAccessToken()).toBe("token-B");
  });
  it("records only successful email session method and preserves the public hint across logout", async () => {
    const hook = mount(); await settle();
    await act(async () => { await hook.result.current.signUpWithPassword("a@example.invalid", "password"); }); expect(hook.result.current.lastAuthMethod).toBeNull();
    mocks.password.mockImplementation(async () => { await login(session()); return { data: { session: session() }, error: null }; });
    await act(async () => { expect((await hook.result.current.signInWithPassword("a@example.invalid", "password")).ok).toBe(true); });
    expect(hook.result.current.lastAuthMethod).toBe("email");
    await act(async () => { await hook.result.current.signOut({ discardUnsaved: true }); }); expect(hook.result.current.lastAuthMethod).toBe("email");
    expect(window.localStorage.getItem("tooltrim:last-auth-method")).toBe("email");
  });
});

it("keeps the real LangLayout owner across Outlet and language navigation", async () => {
  const { LangLayout } = await import("@/App");
  function Consumer() { const account = useStackAccount(); const navigate = useNavigate(); return createElement('button', { onClick: () => navigate('/en/tools') }, account.user?.id ?? 'visitor'); }
  render(createElement(MemoryRouter, { initialEntries: ['/fr/ma-stack'] }, createElement(Routes, null,
    createElement(Route, { path: '/:lang', element: createElement(LangLayout) }, createElement(Route, { path: '*', element: createElement(Consumer) })))));
  await settle(); await login(session()); expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument();
  const sessionReads = mocks.getSession.mock.calls.length;
  act(() => fireEvent.click(screen.getByRole('button', { name: 'A' }))); await settle();
  expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument(); expect(mocks.onAuthStateChange).toHaveBeenCalledTimes(1); expect(mocks.getSession).toHaveBeenCalledTimes(sessionReads);
}, 20000);
it("records OAuth only after a real matching callback, never on a button or cancellation", async () => {
  window.history.replaceState(null, '', '/fr/tools'); const first = mount(); await settle();
  await act(async () => { expect(await first.result.current.signInWithProvider('github', { lang: 'en', returnTo: '/en/tool/notion' })).toEqual({ ok: true, outcome: 'redirecting' }); });
  expect(first.result.current.lastAuthMethod).toBeNull(); expect(window.sessionStorage.getItem('tooltrim:pending-auth-method')).toBe('github'); first.unmount();
  window.history.replaceState(null, '', '/en/sign-in/callback?error=access_denied'); const callback = mount(); await settle();
  expect(callback.result.current.lastAuthMethod).toBeNull();
  const actual = recoverySession(); actual.user.app_metadata = { provider: 'github' };
  await event('SIGNED_IN', actual); expect(callback.result.current.lastAuthMethod).toBeNull();
  expect(window.sessionStorage.getItem('tooltrim:pending-auth-method')).toBeNull();
  window.history.replaceState(null, '', '/en/sign-in/callback');
  window.sessionStorage.setItem('tooltrim:pending-auth-method', 'github');
  await event('SIGNED_IN', actual); expect(callback.result.current.lastAuthMethod).toBe('github');
  expect(window.localStorage.getItem('tooltrim:last-auth-method')).toBe('github'); expect(window.sessionStorage.getItem('tooltrim:pending-auth-method')).toBeNull();
});
it("does not return a stale token when the SDK refreshes during getAccessToken", async () => {
  const hook = mount(); await settle(); const original = recoverySession(); await login(original);
  const late = deferred<{ data: { session: Session }; error: null }>(); mocks.getSession.mockReturnValue(late.promise);
  const pending = hook.result.current.getAccessToken(); const refreshed = recoverySession('A', 'session-A', 'new'); await event('TOKEN_REFRESHED', refreshed);
  late.resolve({ data: { session: original }, error: null }); expect(await pending).toBe(refreshed.access_token);
});

it("records email confirmation only after its matching SDK callback session", async () => {
  window.history.replaceState(null, '', '/fr/inscription'); const hook = mount(); await settle();
  await act(async () => { await hook.result.current.signUpWithPassword('a@example.invalid', 'password'); });
  expect(hook.result.current.lastAuthMethod).toBeNull();
  window.history.replaceState(null, '', '/fr/connexion/retour'); const actual = recoverySession(); actual.user.app_metadata = { provider: 'email' };
  await event('SIGNED_IN', actual); expect(hook.result.current.lastAuthMethod).toBe('email');
});

it("reports pending SDK initialization until a settled session result without granting recovery", async () => {
  const initial = deferred<{ data: { session: Session | null }; error: null }>();
  mocks.getSession.mockReturnValue(initial.promise);
  const hook = mount();
  expect(hook.result.current.authInitialized).toBe(false);
  expect(hook.result.current.recoveryStatus).toBe("none");
  await act(async () => initial.resolve({ data: { session: null }, error: null }));
  expect(hook.result.current.authInitialized).toBe(false);
  await act(async () => vi.advanceTimersByTimeAsync(0));
  expect(hook.result.current.authInitialized).toBe(true);
  expect(hook.result.current.recoveryStatus).toBe("none");
});
it("settles SDK initialization after session failure so recovery can offer retry", async () => {
  mocks.getSession.mockRejectedValue(new Error("offline"));
  const hook = mount();
  await settle();
  await act(async () => vi.advanceTimersByTimeAsync(0));
  expect(hook.result.current.authInitialized).toBe(true);
  expect(hook.result.current.recoveryStatus).not.toBe("ready");
});

it("waits for the SDK deferred PASSWORD_RECOVERY notification after getSession resolves", async () => {
  const initial = deferred<{ data: { session: Session }; error: null }>();
  mocks.getSession.mockReturnValue(initial.promise);
  const hook = mount();
  const states: { initialized: boolean; proof: string }[] = [];
  // Installed SDK 2.99.1 queues the recovery event during initialize before getSession settles.
  setTimeout(() => authChange("PASSWORD_RECOVERY", recoverySession()), 0);
  await act(async () => initial.resolve({ data: { session: recoverySession() }, error: null }));
  states.push({ initialized: hook.result.current.authInitialized, proof: hook.result.current.recoveryStatus });
  expect(hook.result.current.authInitialized).toBe(false);
  await act(async () => vi.advanceTimersByTimeAsync(0));
  states.push({ initialized: hook.result.current.authInitialized, proof: hook.result.current.recoveryStatus });
  expect(states).toEqual([{ initialized: false, proof: "none" }, { initialized: true, proof: "ready" }]);
});
