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
afterEach(cleanup);
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
