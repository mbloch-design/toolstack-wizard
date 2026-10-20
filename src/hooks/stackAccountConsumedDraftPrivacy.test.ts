import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePersonalStack, type PersonalStackV4 } from "@/lib/personalStack";
import { pinToolInState } from "@/lib/stackState";

const api = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn(), remove: vi.fn() }));
vi.mock("@/lib/stackAccountApi", async original => ({ ...await original<typeof import("@/lib/stackAccountApi")>(),
  loadPersonalStack: api.load, savePersonalStack: api.save, deletePersonalAccount: api.remove,
}));
const primary = "tooltrim-personal-stack-v4:anonymous";
const backup = `${primary}:backup`;
const values = new Map<string, string>();
let denyPrimary = false, denyBackup = false, denyBackupRead = false;
let stops: (() => void)[] = [];
function state(slug: string): PersonalStackV4 {
  const current = normalizePersonalStack(null);
  return { ...current, selection: pinToolInState(current.selection, slug) };
}
async function boot(owner: string) {
  const store = await import("@/lib/personalStackStore");
  const { StackAccountCoordinator } = await import("@/lib/stackAccountCoordinator");
  const auth = { getSession: async () => ({ data: { session: { user: { id: owner }, access_token: owner } } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({ error: null }) } as unknown as SupabaseClient["auth"];
  const coordinator = new StackAccountCoordinator(auth, true);
  stops.push(coordinator.start());
  await vi.advanceTimersByTimeAsync(700);
  return { store, coordinator };
}
beforeEach(() => {
  vi.resetModules(); vi.useFakeTimers(); vi.resetAllMocks(); values.clear(); denyPrimary = false; denyBackup = false; denyBackupRead = false;
  Object.defineProperty(window, "localStorage", { configurable: true, value: {
    getItem: (key: string) => { if (denyBackupRead && key === backup) throw new Error("backup read denied"); return values.get(key) ?? null; },
    setItem: (key: string, value: string) => { if (denyPrimary && key === primary) throw new Error("primary denied"); values.set(key, value); },
    removeItem: (key: string) => { if (denyBackup && key === backup) throw new Error("backup denied"); values.delete(key); },
  } });
  api.load.mockResolvedValue(null);
  api.save.mockImplementation(async (_token, input) => ({ state: input.state, revision: input.expectedRevision + 1, updatedAt: "2026-10-20T00:00:00Z" }));
  api.remove.mockResolvedValue(undefined);
  const consumed = JSON.stringify(state("consumed-private-A"));
  values.set(primary, consumed); values.set(backup, consumed);
});
afterEach(() => { stops.forEach(stop => stop()); stops = []; vi.useRealTimers(); });

it.each([
  ["primary", "signOut"], ["backup", "signOut"], ["primary", "deleteAccount"], ["backup", "deleteAccount"],
] as const)("warns on consumed %s cleanup denial and retries after a fresh module before %s", async (failure, action) => {
  denyPrimary = failure === "primary"; denyBackup = failure === "backup";
  const first = await boot("A");
  expect(first.coordinator.getSnapshot().privacyWarning).toBe("ACCOUNT_LOCAL_CLEANUP_INCOMPLETE");
  first.store.setPersonalStackScope("anonymous");
  expect(first.store.readPersonalStack().selection.pinnedToolSlugs).toEqual([]);
  first.store.setPersonalStackScope("A");
  stops.pop()!(); vi.resetModules();
  // The cleanup identity must survive losing every in-memory reference to the draft.
  denyPrimary = false; denyBackup = false;
  api.load.mockResolvedValue({ state: state("consumed-private-A"), revision: 1, updatedAt: "2026-10-20T00:00:00Z" });
  const reloaded = await boot("A");
  expect(await reloaded.coordinator[action]()).toBe(true);
  expect(reloaded.coordinator.getSnapshot().privacyWarning).toBeNull();
  expect([...values.values()].some(value => value.includes("consumed-private-A"))).toBe(false);
  stops.pop()!(); vi.resetModules(); api.load.mockResolvedValue(null); api.save.mockClear();
  const next = await boot("B");
  expect(next.store.readPersonalStack().selection.pinnedToolSlugs).toEqual([]);
  expect(api.save).not.toHaveBeenCalled();
  expect(values.has(backup)).toBe(false);
});

it.each(["signOut", "deleteAccount"] as const)("retries consumed cleanup on %s while preserving a later unrelated draft", async action => {
  denyPrimary = true;
  const { store, coordinator } = await boot("A");
  expect(coordinator.getSnapshot().privacyWarning).toBe("ACCOUNT_LOCAL_CLEANUP_INCOMPLETE");
  values.set(primary, JSON.stringify(state("later-unrelated"))); denyPrimary = false;
  expect(await coordinator[action]()).toBe(true);
  expect(coordinator.getSnapshot().privacyWarning).toBeNull();
  expect(JSON.parse(values.get(primary)!).selection.pinnedToolSlugs).toEqual(["later-unrelated"]);
  expect(values.has(backup)).toBe(false);
  expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual(["later-unrelated"]);
  stops.pop()!(); vi.resetModules(); api.save.mockClear();
  const next = await boot("B");
  expect(next.store.readPersonalStack().selection.pinnedToolSlugs).toEqual(["later-unrelated"]);
});

it("keeps a truthful warning and an empty in-memory view while consumed cleanup is still blocked", async () => {
  denyPrimary = true; denyBackup = true;
  const { store, coordinator } = await boot("A");
  expect(await coordinator.deleteAccount()).toBe(true);
  expect(coordinator.getSnapshot().deletionConfirmed).toBe(true);
  expect(coordinator.getSnapshot().privacyWarning).toBe("ACCOUNT_LOCAL_CLEANUP_INCOMPLETE");
  expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual([]);
  expect(values.get(primary)).toContain("consumed-private-A");
  // Even another identity after reload must not import the known consumed copy.
  stops.pop()!(); vi.resetModules(); api.save.mockClear();
  const next = await boot("B");
  expect(next.coordinator.getSnapshot().privacyWarning).toBe("ACCOUNT_LOCAL_CLEANUP_INCOMPLETE");
  expect(next.store.readPersonalStack().selection.pinnedToolSlugs).toEqual([]);
  expect(api.save).not.toHaveBeenCalled();
});

it("preserves a later unrelated backup while retrying the consumed primary", async () => {
  denyPrimary = true;
  const { coordinator } = await boot("A");
  values.set(backup, JSON.stringify(state("later-backup")));
  denyPrimary = false;
  expect(await coordinator.signOut()).toBe(true);
  expect(coordinator.getSnapshot().privacyWarning).toBeNull();
  expect(JSON.parse(values.get(primary)!).selection.pinnedToolSlugs).toEqual([]);
  expect(JSON.parse(values.get(backup)!).selection.pinnedToolSlugs).toEqual(["later-backup"]);
});

it("keeps confirmed deletion truthful when the storage accessor itself becomes unavailable", async () => {
  denyPrimary = true;
  const { store, coordinator } = await boot("A");
  Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new Error("storage unavailable"); } });
  expect(await coordinator.deleteAccount()).toBe(true);
  expect(coordinator.getSnapshot().deletionConfirmed).toBe(true);
  expect(coordinator.getSnapshot().privacyWarning).toBe("ACCOUNT_LOCAL_CLEANUP_INCOMPLETE");
  expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual([]);
});

it("clears consumed memory even if storage becomes inaccessible as the import is confirmed", async () => {
  api.save.mockImplementation(async (_token, input) => {
    Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new Error("storage unavailable"); } });
    return { state: input.state, revision: 1, updatedAt: "2026-10-20T00:00:00Z" };
  });
  const { store, coordinator } = await boot("A");
  expect(await coordinator.signOut()).toBe(true);
  expect(coordinator.getSnapshot().privacyWarning).toBe("ACCOUNT_LOCAL_CLEANUP_INCOMPLETE");
  expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual([]);
});

async function realAnonymousEdits() {
  values.clear();
  const store = await import("@/lib/personalStackStore");
  const previous = state("previous-private-X");
  previous.billing.paid = ["previous-private-X"];
  previous.billing.choices["previous-private-X"] = { source: "custom", amount: 23, currency: "EUR", period: "monthly" };
  store.replacePersonalStack(previous);
  const consumed = state("consumed-private-Y");
  consumed.billing.reviewed = ["consumed-private-Y"];
  store.replacePersonalStack(consumed);
  expect(JSON.parse(values.get(backup)!)).toEqual(previous);
  expect(JSON.parse(values.get(primary)!)).toEqual(consumed);
  return consumed;
}

it.each(["none", "primary", "backup"] as const)("cleans real X-to-Y edit history with %s cleanup denial and a fresh B after deletion", async failure => {
  await realAnonymousEdits();
  denyPrimary = failure === "primary"; denyBackup = failure === "backup";
  const { coordinator } = await boot("A");
  expect(coordinator.getSnapshot().privacyWarning).toBe(failure === "none" ? null : "ACCOUNT_LOCAL_CLEANUP_INCOMPLETE");
  if (failure === "none") expect(values.has(backup)).toBe(false);
  denyPrimary = false; denyBackup = false;
  expect(await coordinator.deleteAccount()).toBe(true);
  expect(coordinator.getSnapshot().privacyWarning).toBeNull();
  expect([...values.values()].some(value => value.includes("previous-private-X") || value.includes("consumed-private-Y"))).toBe(false);
  stops.pop()!(); vi.resetModules(); api.save.mockClear();
  const next = await boot("B");
  expect(next.store.readPersonalStack().selection.pinnedToolSlugs).toEqual([]);
  expect(api.save).not.toHaveBeenCalled();
});

it("retains unread backup provenance until it can prove and retire real X-to-Y history", async () => {
  await realAnonymousEdits(); denyBackupRead = true;
  const first = await boot("A");
  expect(first.coordinator.getSnapshot().privacyWarning).toBe("ACCOUNT_LOCAL_CLEANUP_INCOMPLETE");
  expect(JSON.parse(values.get(primary)!).selection.pinnedToolSlugs).toEqual(["consumed-private-Y"]);
  stops.pop()!(); vi.resetModules(); denyBackupRead = false;
  api.load.mockResolvedValue({ state: state("saved-A"), revision: 1, updatedAt: "2026-10-20T00:00:00Z" });
  const reloaded = await boot("A");
  expect(await reloaded.coordinator.signOut()).toBe(true);
  expect(reloaded.coordinator.getSnapshot().privacyWarning).toBeNull();
  expect([...values.values()].some(value => value.includes("previous-private-X") || value.includes("consumed-private-Y"))).toBe(false);
});

it("keeps primary ownership evidence if persisting the newly captured backup identity fails", async () => {
  await realAnonymousEdits();
  const storage = window.localStorage;
  const setItem = storage.setItem.bind(storage);
  let obligationWrites = 0;
  vi.spyOn(storage, "setItem").mockImplementation((key, value) => {
    if (key === "tooltrim-personal-stack-v4:consumed-anonymous-cleanup" && ++obligationWrites > 1) throw new Error("provenance write denied");
    setItem(key, value);
  });
  denyBackup = true;
  const first = await boot("A");
  expect(first.coordinator.getSnapshot().privacyWarning).toBe("ACCOUNT_LOCAL_CLEANUP_INCOMPLETE");
  expect(JSON.parse(values.get(primary)!).selection.pinnedToolSlugs).toEqual(["consumed-private-Y"]);
  stops.pop()!(); vi.resetModules(); denyBackup = false;
  storage.setItem = setItem;
  const next = await boot("B");
  expect(next.store.readPersonalStack().selection.pinnedToolSlugs).toEqual([]);
  expect(values.has(backup)).toBe(false);
});
