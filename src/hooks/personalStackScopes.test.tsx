import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const toasts = vi.hoisted(() => [] as Array<{ action: { onClick: () => void } }>);
vi.mock("sonner", () => ({ toast: (_message: unknown, options: typeof toasts[number]) => toasts.push(options) }));
vi.mock("@/lib/analytics", () => ({ trackEvent() {} }));
const values = new Map<string, string>();
beforeEach(() => {
  vi.resetModules(); values.clear(); toasts.length = 0;
  Object.defineProperty(window, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  } });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const t = (fr: string) => fr;

it("shares one scope across all existing hook APIs and non-React plan lookup", async () => {
  const store = await import("@/lib/personalStackStore");
  const { useStackPins } = await import("./useStackPins");
  const { useStackPaidPlans, getPlanChoice } = await import("./useStackPaidPlans");
  const { useStackDecisions } = await import("./useStackDecisions");
  const pins = renderHook(useStackPins), billing = renderHook(useStackPaidPlans);
  const decisions = renderHook(() => useStackDecisions(t, String, "EUR"));
  act(() => {
    pins.result.current.pinTool("anonymous");
    billing.result.current.setChoice("anonymous", { source: "custom", amount: 12, currency: "EUR", period: "monthly" });
    store.setPersonalStackScope("A");
  });
  expect(pins.result.current.state.pinnedToolSlugs).toEqual([]);
  expect(billing.result.current.choices).toEqual({}); expect(getPlanChoice("anonymous")).toBeUndefined();
  act(() => {
    pins.result.current.pinTool("canva"); billing.result.current.setPaid("canva", true); billing.result.current.markReviewed(["canva"]);
    billing.result.current.setChoice("canva", { source: "custom", amount: 30, currency: "USD", period: "annual" });
    decisions.result.current.decide("replace", { slug: "figma", name: "Figma" }, { slug: "canva", name: "Canva" }, 5, "compare");
  });
  expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual(["figma"]);
  expect(store.readPersonalStack().billing.paid).toEqual(["canva"]);
  expect(store.readPersonalStack().decisions["canva|figma"]).toMatchObject({ savingCurrency: "EUR" });
  expect(getPlanChoice("canva")?.amount).toBe(30);
  act(() => store.setPersonalStackScope("B"));
  expect(pins.result.current.state.pinnedToolSlugs).toEqual([]); expect(billing.result.current.paid).toEqual([]); expect(decisions.result.current.decisions).toEqual({});
  act(() => store.setPersonalStackScope("anonymous"));
  expect(pins.result.current.state.pinnedToolSlugs).toEqual(["anonymous"]); expect(getPlanChoice("anonymous")?.amount).toBe(12);
});

it("does not let an old decision toast undo inject account A entries into B", async () => {
  const store = await import("@/lib/personalStackStore");
  const { useStackPins } = await import("./useStackPins"); const { useStackDecisions } = await import("./useStackDecisions");
  store.setPersonalStackScope("A"); const pins = renderHook(useStackPins); const decisions = renderHook(() => useStackDecisions(t, String, "EUR"));
  act(() => pins.result.current.pinTool("canva"));
  act(() => decisions.result.current.decide("replace", { slug: "figma", name: "Figma" }, { slug: "canva", name: "Canva" }, 9, "compare"));
  const undoA = toasts.at(-1)!.action.onClick;
  act(() => store.setPersonalStackScope("B")); act(() => pins.result.current.pinTool("b-only")); act(undoA);
  expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual(["b-only"]); expect(store.readPersonalStack().decisions).toEqual({});
});

it("publishes a compare decision as one complete selection and decision snapshot", async () => {
  const store = await import("@/lib/personalStackStore"); const { useStackPins } = await import("./useStackPins"); const { useStackDecisions } = await import("./useStackDecisions");
  const pins = renderHook(useStackPins), decisions = renderHook(() => useStackDecisions(t, String, "EUR"));
  act(() => pins.result.current.pinTool("canva"));
  const snapshots: ReturnType<typeof store.readPersonalStack>[] = []; const off = store.subscribePersonalStack(() => snapshots.push(store.readPersonalStack()));
  act(() => decisions.result.current.decide("replace", { slug: "figma", name: "Figma" }, { slug: "canva", name: "Canva" }, 9, "compare")); off();
  expect(snapshots).toHaveLength(1); expect(snapshots[0].selection.pinnedToolSlugs).toEqual(["figma"]); expect(snapshots[0].decisions).toHaveProperty("canva|figma");
});

it.each(["anonymous", "B"])("ignores the ordinary removal toast from A after switching to %s", async targetScope => {
  const store = await import("@/lib/personalStackStore");
  const { useStackPins } = await import("./useStackPins");
  store.setPersonalStackScope("A");
  const pins = renderHook(useStackPins);
  act(() => pins.result.current.saveToolSelection("private-a", ["design"], "wishlist"));
  // Same captured state/functions as CartPage.removeTool's six-second toast.
  const { state, unpinTool, restoreTool } = pins.result.current;
  const index = state.toolEntries.findIndex(entry => entry.toolSlug === "private-a");
  const entry = state.toolEntries[index];
  const undoRemoval = () => restoreTool(entry, index);
  act(() => unpinTool("private-a"));
  act(() => store.setPersonalStackScope(targetScope));
  act(() => pins.result.current.pinTool("current-only"));
  act(undoRemoval);
  expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual(["current-only"]);
  act(() => store.setPersonalStackScope("A"));
  expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual([]);
});

it("replays ordinary edits after a partial legacy read recovers without reviving removals", async () => {
  const { createDefaultToolCartState, pinToolInState, STACK_STATE_STORAGE_KEY } = await import("@/lib/stackState");
  const selection = pinToolInState(pinToolInState(createDefaultToolCartState(), "notion"), "obsidian");
  const legacyChoice = { source: "custom", amount: 24, currency: "EUR", period: "annual" };
  values.set(STACK_STATE_STORAGE_KEY, JSON.stringify(selection));
  values.set("tooltrim-ma-stack-paid-plans-v1", '["notion","obsidian"]');
  values.set("tooltrim-ma-stack-plan-choices-v1", JSON.stringify({ notion: legacyChoice, obsidian: legacyChoice }));
  values.set("tooltrim-ma-stack-decisions-v1", JSON.stringify({ "notion|obsidian": { kind: "keep-both", kept: "notion", saving: 0, at: "2026-10-19T00:00:00Z" } }));
  let legacyUnreadable = true;
  Object.defineProperty(window, "localStorage", { configurable: true, value: {
    getItem(key: string) { if (key === "tooltrim-ma-stack-paid-plans-v1" && legacyUnreadable) throw new Error("temporary read failure"); return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
    removeItem(key: string) { values.delete(key); },
  } });
  let store = await import("@/lib/personalStackStore");
  const { useStackPins } = await import("./useStackPins");
  const { useStackPaidPlans } = await import("./useStackPaidPlans");
  const { useStackDecisions } = await import("./useStackDecisions");
  const pins = renderHook(useStackPins), billing = renderHook(useStackPaidPlans), decisions = renderHook(() => useStackDecisions(t, String, "EUR"));
  act(() => {
    pins.result.current.pinTool("figma");
    pins.result.current.unpinTool("notion");
    billing.result.current.setPaid("notion", false);
    billing.result.current.setChoice("figma", { source: "custom", amount: 9, currency: "USD", period: "monthly" });
    billing.result.current.setChoice("obsidian", null);
    decisions.result.current.reopen("notion", "obsidian");
  });
  expect(pins.result.current.state.pinnedToolSlugs).toContain("figma");
  expect(values.get(store.personalStackStorageKey("anonymous"))).toBeUndefined();
  expect(values.get("tooltrim-personal-stack-v4:anonymous-migrated")).toBeUndefined();
  legacyUnreadable = false;
  act(() => window.dispatchEvent(new StorageEvent("storage", { key: null })));
  expect(pins.result.current.state.pinnedToolSlugs).toEqual(["obsidian", "figma"]);
  expect(billing.result.current.paid).toEqual(["obsidian"]);
  expect(billing.result.current.choices.notion).toEqual(legacyChoice);
  expect(billing.result.current.choices.obsidian).toBeUndefined();
  expect(billing.result.current.choices.figma.amount).toBe(9);
  expect(decisions.result.current.decisions).toEqual({});
  cleanup(); vi.resetModules(); store = await import("@/lib/personalStackStore");
  expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual(["obsidian", "figma"]);
  expect(store.readPersonalStack().billing.paid).toEqual(["obsidian"]);
  expect(store.readPersonalStack().billing.choices.notion).toEqual(legacyChoice);
  expect(store.readPersonalStack().billing.choices.figma.amount).toBe(9);
  expect(store.readPersonalStack().decisions).toEqual({});
});


it.each(["custom-client", "custom-00000000-0000-4000-8000-000000000001"])("keeps created Client identity and assignments when legacy contains %s", async legacyId => {
  const { createDefaultToolCartState, normalizeToolCartState, pinToolInState, STACK_STATE_STORAGE_KEY } = await import("@/lib/stackState");
  const base = createDefaultToolCartState();
  const legacy = pinToolInState(normalizeToolCartState({ ...base, needs: [...base.needs, {
    id: legacyId, labelFr: "Client historique", labelEn: "Legacy client", source: "custom", order: 90,
  }] }), "legacy-tool", [legacyId]);
  values.set(STACK_STATE_STORAGE_KEY, JSON.stringify(legacy));
  values.set("tooltrim-ma-stack-paid-plans-v1", '["legacy-tool"]');
  let unreadable = true;
  Object.defineProperty(window, "localStorage", { configurable: true, value: {
    getItem(key: string) { if (key === "tooltrim-ma-stack-paid-plans-v1" && unreadable) throw new Error("read blocked"); return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
    removeItem(key: string) { values.delete(key); },
  } });
  // The second table row forces an exact collision with an unknown legacy ID.
  vi.stubGlobal("crypto", { randomUUID: () => "00000000-0000-4000-8000-000000000001" });
  let store = await import("@/lib/personalStackStore"); const { useStackPins } = await import("./useStackPins");
  const pins = renderHook(useStackPins);
  let createdId: string | null = null;
  act(() => { createdId = pins.result.current.createNeed("Client"); });
  expect(createdId).not.toBeNull();
  act(() => {
    pins.result.current.saveToolSelection("new-tool", [createdId!], "wishlist");
    pins.result.current.renameNeed(createdId!, "Nouveau client");
  });
  unreadable = false;
  act(() => window.dispatchEvent(new StorageEvent("storage", { key: null })));
  function assertReferences(selection: typeof legacy) {
    const oldNeed = selection.needs.find(need => need.labelFr === "Client historique")!;
    const newNeed = selection.needs.find(need => need.labelFr === "Nouveau client")!;
    expect(oldNeed).toBeDefined(); expect(newNeed).toBeDefined();
    expect(newNeed.id).toBe(createdId);
    expect(oldNeed.id).not.toBe(createdId);
    if (legacyId === "custom-client") expect(oldNeed.id).toBe("custom-client");
    expect(selection.toolEntries.find(entry => entry.toolSlug === "legacy-tool")!.needIds).toEqual([oldNeed.id]);
    expect(selection.toolEntries.find(entry => entry.toolSlug === "new-tool")!).toMatchObject({ needIds: [createdId], intent: "wishlist" });
  }
  assertReferences(pins.result.current.state);
  cleanup(); vi.resetModules(); store = await import("@/lib/personalStackStore");
  assertReferences(store.readPersonalStack().selection);
});
