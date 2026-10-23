import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const values = new Map<string, string>();
beforeEach(() => {
  vi.resetModules(); values.clear();
  Object.defineProperty(window, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  } });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("saves the trade in the personal stack, per scope, and clears it", async () => {
  const store = await import("@/lib/personalStackStore");
  const { useStackTrade } = await import("./useStackTrade");
  const hook = renderHook(useStackTrade);
  expect(hook.result.current.trade).toBeNull();
  act(() => hook.result.current.setTrade("designer"));
  expect(store.readPersonalStack().trade).toBe("designer");
  // An account keeps its own trade: switching scope switches it.
  act(() => store.setPersonalStackScope("A"));
  expect(hook.result.current.trade).toBeNull();
  act(() => hook.result.current.setTrade("ops"));
  act(() => store.setPersonalStackScope("anonymous"));
  expect(hook.result.current.trade).toBe("designer");
  act(() => hook.result.current.setTrade(null));
  expect(store.readPersonalStack().trade).toBeNull();
});
