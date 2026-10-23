import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { PlanChoice } from "./useStackPaidPlans";

beforeEach(() => {
  vi.resetModules();
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  } });
});
afterEach(cleanup);
const custom: PlanChoice = { source: "custom", amount: 17, currency: "EUR", period: "annual", seats: 3, perSeat: true };
const plan: PlanChoice = { source: "plan", label: "Pro", amount: 20, currency: "USD", period: "monthly" };
async function setup() {
  const store = await import("@/lib/personalStackStore");
  const { useStackPaidPlans } = await import("./useStackPaidPlans");
  store.setPersonalStackScope("A");
  return { store, ...renderHook(useStackPaidPlans) };
}

it("answers paid atomically and undo restores the unreviewed free state without erasing other tools", async () => {
  const { store, result } = await setup();
  const snapshots: unknown[] = [];
  const unsubscribe = store.subscribePersonalStack(() => snapshots.push(store.readPersonalStack().billing));
  let undo!: () => void;
  act(() => { undo = result.current.choosePlan("canva", plan); });
  expect(snapshots).toEqual([{ paid: ["canva"], reviewed: ["canva"], choices: { canva: plan } }]);
  act(() => result.current.choosePlan("figma", custom));
  act(undo);
  expect(store.readPersonalStack().billing).toEqual({ paid: ["figma"], reviewed: ["figma"], choices: { figma: custom } });
  unsubscribe();
});

it.each([null, { ...plan, amount: 0 }])("clears a previous custom price for a free answer and restores it exactly (%j)", async choice => {
  const { store, result } = await setup();
  act(() => { result.current.setChoice("canva", custom); result.current.setPaid("canva", true); result.current.markReviewed(["canva"]); });
  let undo!: () => void;
  act(() => { undo = result.current.choosePlan("canva", choice); });
  expect(store.readPersonalStack().billing).toEqual({ paid: [], reviewed: ["canva"], choices: choice ? { canva: choice } : {} });
  act(undo);
  expect(store.readPersonalStack().billing).toEqual({ paid: ["canva"], reviewed: ["canva"], choices: { canva: custom } });
});

it("can defer reviewed membership", async () => {
  const { result } = await setup();
  act(() => result.current.choosePlan("canva", plan, false));
  expect(result.current.isPaid("canva")).toBe(true);
  expect(result.current.isReviewed("canva")).toBe(false);
});

it("does not apply an undo to another account or a cleared account epoch", async () => {
  const { store, result } = await setup();
  let undo!: () => void;
  act(() => { undo = result.current.choosePlan("canva", plan); });
  act(() => store.setPersonalStackScope("B"));
  act(() => result.current.choosePlan("canva", custom));
  act(undo);
  expect(result.current.choiceFor("canva")).toEqual(custom);
  act(() => { store.setPersonalStackScope("A"); store.clearPersonalStackScope("A"); });
  act(undo);
  expect(store.readPersonalStack().billing).toEqual({ paid: [], reviewed: [], choices: {} });
});

it("preserves a newer answer and does not reuse undo", async () => {
  const { result } = await setup();
  let first!: () => void, second!: () => void;
  act(() => { first = result.current.choosePlan("canva", plan); });
  act(() => { second = result.current.choosePlan("canva", custom); });
  act(first);
  expect(result.current.choiceFor("canva")).toEqual(custom);
  act(second);
  expect(result.current.choiceFor("canva")).toEqual(plan);
  act(first);
  expect(result.current.choiceFor("canva")).toEqual(plan);
});


it("persists an explicit custom zero price without declaring the tool paid", async () => {
  const { store, result } = await setup();
  const zero: PlanChoice = { source: "custom", amount: 0, currency: "EUR", period: "monthly" };
  act(() => result.current.choosePlan("paid-only-tool", zero));
  expect(store.readPersonalStack().billing).toEqual({ paid: [], reviewed: ["paid-only-tool"], choices: { "paid-only-tool": zero } });
  expect(result.current.choiceFor("paid-only-tool")).toEqual(zero);
});
