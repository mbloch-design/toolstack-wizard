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

it("saves a usage level in the personal stack, per scope, and clears it", async () => {
  const store = await import("@/lib/personalStackStore");
  const { useStackUsage } = await import("./useStackUsage");
  const hook = renderHook(useStackUsage);
  act(() => hook.result.current.setUsage("figma", 4));
  expect(hook.result.current.usage).toEqual({ figma: 4 });
  expect(store.readPersonalStack().usage).toEqual({ figma: 4 });
  // An account has its own answers: switching scope switches them.
  act(() => store.setPersonalStackScope("A"));
  expect(hook.result.current.usage).toEqual({});
  act(() => hook.result.current.setUsage("figma", 2));
  act(() => store.setPersonalStackScope("anonymous"));
  expect(hook.result.current.usage).toEqual({ figma: 4 });
  act(() => hook.result.current.setUsage("figma", null));
  expect(store.readPersonalStack().usage).toEqual({});
});
