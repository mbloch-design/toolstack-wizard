import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultToolCartState, pinToolInState, STACK_STATE_STORAGE_KEY } from "./stackState";
import { normalizePersonalStack } from "./personalStack";

const values = new Map<string, string>();
let blocked = false;
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem(key: string, value: string) { if (blocked) throw new Error("storage blocked"); values.set(key, value); },
  removeItem(key: string) { if (blocked) throw new Error("storage blocked"); values.delete(key); },
};
const choice = { source: "custom", amount: 123, currency: "EUR", period: "annual", seats: 3, perSeat: true } as const;
const decision = { kind: "replace", kept: "figma", removed: "canva", saving: 9, savingCurrency: "EUR", at: "2026-10-19T10:00:00Z" } as const;
const draft = (slug: string) => normalizePersonalStack({ version: 4, selection: pinToolInState(createDefaultToolCartState(), slug), billing: { paid: [slug], reviewed: [slug], choices: { [slug]: choice } }, decisions: { "canva|figma": decision } });
let unsubscribe = () => {};
beforeEach(() => {
  vi.resetModules(); values.clear(); blocked = false;
  Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
});
afterEach(() => { unsubscribe(); vi.restoreAllMocks(); });

// Each case guards a concrete loss/leak boundary, using the actual browser store.
describe("personal stack scope store", () => {
  it("imports all legacy anonymous declarations once, then ignores stale keys on reload", async () => {
    storage.setItem(STACK_STATE_STORAGE_KEY, JSON.stringify(pinToolInState(createDefaultToolCartState(), "notion")));
    storage.setItem("tooltrim-ma-stack-paid-plans-v1", '["notion"]');
    storage.setItem("tooltrim-ma-stack-freemium-reviewed-v1", '["notion"]');
    storage.setItem("tooltrim-ma-stack-plan-choices-v1", JSON.stringify({ notion: choice }));
    storage.setItem("tooltrim-ma-stack-decisions-v1", JSON.stringify({ "canva|figma": decision }));
    let store = await import("./personalStackStore");
    const migrated = store.readPersonalStack();
    expect(migrated.selection.pinnedToolSlugs).toEqual(["notion"]);
    expect(migrated.billing).toEqual({ paid: ["notion"], reviewed: ["notion"], choices: { notion: choice } });
    expect(migrated.decisions).toEqual({ "canva|figma": decision });
    store.replacePersonalStack(normalizePersonalStack(null));
    vi.resetModules(); store = await import("./personalStackStore");
    expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual([]);
    expect(store.readPersonalStack().billing.paid).toEqual([]);
  });

  it("round trips selection, actual prices and historical decisions together", async () => {
    let store = await import("./personalStackStore");
    store.setPersonalStackScope("account/A"); store.replacePersonalStack(draft("missing-in-catalogue"));
    vi.resetModules(); store = await import("./personalStackStore"); store.setPersonalStackScope("account/A");
    expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual(["missing-in-catalogue"]);
    expect(store.readPersonalStack().billing.choices["missing-in-catalogue"]).toEqual(choice);
    expect(store.readPersonalStack().decisions["canva|figma"]).toEqual(decision);
  });

  it("keeps separate complete memories for A, anonymous and B when writes are blocked", async () => {
    const store = await import("./personalStackStore"); blocked = true;
    store.replacePersonalStack(draft("anonymous-draft"));
    store.setPersonalStackScope("A"); expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual([]);
    store.replacePersonalStack(draft("private-a"));
    store.setPersonalStackScope("anonymous"); expect(store.readPersonalStack().billing.choices).toHaveProperty("anonymous-draft");
    store.setPersonalStackScope("B"); expect(store.readPersonalStack().billing.choices).toEqual({});
    expect(store.readPersonalStack().decisions).toEqual({});
    store.replacePersonalStack(draft("private-b")); store.setPersonalStackScope("A");
    expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual(["private-a"]);
    expect(store.readPersonalStack().billing.paid).toEqual(["private-a"]);
    expect(store.getPersonalStackPersistenceStatus()).toMatchObject({ state: "degraded", source: "memory", issue: "storage-write-failed" });
  });

  it("never initializes anonymous from a persisted account after a fresh reload", async () => {
    let store = await import("./personalStackStore"); store.setPersonalStackScope("A"); store.replacePersonalStack(draft("private-a"));
    vi.resetModules(); store = await import("./personalStackStore");
    expect(store.getPersonalStackScope()).toBe("anonymous");
    expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual([]);
    expect(store.readPersonalStack().billing.choices).toEqual({});
    expect(store.readPersonalStack().decisions).toEqual({});
  });

  it("ignores a queued A storage event after switching to B", async () => {
    const store = await import("./personalStackStore");
    const listener = vi.fn(); unsubscribe = store.subscribePersonalStack(listener);
    store.setPersonalStackScope("A"); store.replacePersonalStack(draft("private-a"));
    store.setPersonalStackScope("B"); store.replacePersonalStack(draft("private-b")); listener.mockClear();
    window.dispatchEvent(new StorageEvent("storage", { key: store.personalStackStorageKey("A"), newValue: JSON.stringify(draft("late-a")) }));
    expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual(["private-b"]);
    expect(listener).not.toHaveBeenCalled();
  });

  it("rereads current persistence before mutation and ignores stale event payloads", async () => {
    const store = await import("./personalStackStore"); unsubscribe = store.subscribePersonalStack(() => {});
    store.readPersonalStack();
    storage.setItem(store.personalStackStorageKey("anonymous"), JSON.stringify(draft("remote")));
    store.updatePersonalStack(current => ({ ...current, billing: { ...current.billing, reviewed: [...current.billing.reviewed, "local"] } }));
    window.dispatchEvent(new StorageEvent("storage", { key: store.personalStackStorageKey("anonymous"), newValue: JSON.stringify(draft("obsolete")) }));
    expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual(["remote"]);
    expect(store.readPersonalStack().billing.reviewed).toEqual(["remote", "local"]);
  });

  it("preserves failed writes on repeated reads but accepts a real later remote write", async () => {
    const store = await import("./personalStackStore"); unsubscribe = store.subscribePersonalStack(() => {});
    store.readPersonalStack(); blocked = true; store.replacePersonalStack(draft("local"));
    expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual(["local"]);
    expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual(["local"]);
    blocked = false; storage.setItem(store.personalStackStorageKey("anonymous"), JSON.stringify(draft("remote")));
    window.dispatchEvent(new StorageEvent("storage", { key: store.personalStackStorageKey("anonymous") }));
    expect(store.readPersonalStack().billing.paid).toEqual(["remote"]);
  });

  it("notifies all subscribers on scope changes and current storage changes", async () => {
    const store = await import("./personalStackStore"); const first = vi.fn(), second = vi.fn();
    const offFirst = store.subscribePersonalStack(first); unsubscribe = store.subscribePersonalStack(second);
    store.setPersonalStackScope("A"); expect(first).toHaveBeenCalledTimes(1); expect(second).toHaveBeenCalledTimes(1);
    storage.setItem(store.personalStackStorageKey("A"), JSON.stringify(draft("remote"))); store.readPersonalStack();
    window.dispatchEvent(new StorageEvent("storage", { key: store.personalStackStorageKey("A") }));
    expect(first).toHaveBeenCalledTimes(2); expect(second).toHaveBeenCalledTimes(2); offFirst();
  });

  it("clears only the requested scope and never resurrects a cleared anonymous legacy draft", async () => {
    storage.setItem(STACK_STATE_STORAGE_KEY, JSON.stringify(pinToolInState(createDefaultToolCartState(), "legacy")));
    let store = await import("./personalStackStore"); store.readPersonalStack();
    store.setPersonalStackScope("A"); store.replacePersonalStack(draft("private-a"));
    store.clearPersonalStackScope("anonymous"); expect(store.readPersonalStack().billing.paid).toEqual(["private-a"]);
    store.setPersonalStackScope("anonymous"); expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual([]);
    vi.resetModules(); store = await import("./personalStackStore");
    expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual([]);
    store.setPersonalStackScope("A"); expect(store.readPersonalStack().billing.paid).toEqual(["private-a"]);
  });

  it("keeps stable SSR snapshots after reading private browser state", async () => {
    const store = await import("./personalStackStore"); const server = store.getServerPersonalStack();
    store.setPersonalStackScope("A"); store.replacePersonalStack(draft("private-a"));
    expect(store.getServerPersonalStack()).toBe(server);
    expect(server.selection.pinnedToolSlugs).toEqual([]); expect(server.billing.choices).toEqual({}); expect(server.decisions).toEqual({});
    expect(store.readPersonalStack()).toBe(store.readPersonalStack());
  });

  it("retries migration after a legacy read failure instead of durably dropping declarations", async () => {
    storage.setItem(STACK_STATE_STORAGE_KEY, JSON.stringify(pinToolInState(createDefaultToolCartState(), "notion")));
    storage.setItem("tooltrim-ma-stack-paid-plans-v1", '["notion"]');
    Object.defineProperty(window, "localStorage", { configurable: true, value: { ...storage, getItem(key: string) {
      if (key === "tooltrim-ma-stack-paid-plans-v1") throw new Error("temporary read failure");
      return storage.getItem(key);
    } } });
    const store = await import("./personalStackStore"); store.readPersonalStack();
    expect(storage.getItem(store.personalStackStorageKey("anonymous"))).toBeNull();
    expect(store.getPersonalStackPersistenceStatus()).toMatchObject({ state: "degraded", issue: "storage-read-failed" });
    Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
    expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual(["notion"]);
    expect(store.readPersonalStack().billing.paid).toEqual(["notion"]);
  });

  it("retains the session draft when a blocked storage getter becomes readable and empty", async () => {
    const store = await import("./personalStackStore");
    Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new Error("blocked getter"); } });
    store.replacePersonalStack(draft("session-only"));
    const status = store.getPersonalStackPersistenceStatus();
    expect(store.getPersonalStackPersistenceStatus()).toBe(status);
    Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
    expect(store.readPersonalStack().billing.paid).toEqual(["session-only"]);
    store.setPersonalStackScope("B"); expect(store.readPersonalStack().billing.paid).toEqual([]);
    store.setPersonalStackScope("anonymous"); expect(store.readPersonalStack().billing.paid).toEqual(["session-only"]);
  });

  it("recovers the scoped backup when its current key is missing", async () => {
    let store = await import("./personalStackStore"); store.setPersonalStackScope("A"); store.replacePersonalStack(draft("private-a"));
    storage.removeItem(store.personalStackStorageKey("A")); vi.resetModules(); store = await import("./personalStackStore"); store.setPersonalStackScope("A");
    expect(store.readPersonalStack().billing.paid).toEqual(["private-a"]);
  });

  it("recovers the complete previous envelope from a corrupt current value", async () => {
    let store = await import("./personalStackStore"); store.replacePersonalStack(draft("previous")); store.replacePersonalStack(draft("latest"));
    storage.setItem(store.personalStackStorageKey("anonymous"), "broken-json"); vi.resetModules(); store = await import("./personalStackStore");
    expect(store.readPersonalStack().billing.paid).toEqual(["previous"]);
    expect(store.getPersonalStackPersistenceStatus()).toMatchObject({ state: "recovered", source: "backup", issue: "current-corrupt" });
  });
});
