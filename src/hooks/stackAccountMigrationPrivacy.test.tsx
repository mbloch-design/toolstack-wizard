import { createElement } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createDefaultToolCartState, pinToolInState, STACK_STATE_STORAGE_KEY } from "@/lib/stackState";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: {
  getSession: async () => ({ data: { session: { user: { id: "migration-A" }, access_token: "fixture-token" } }, error: null }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
} } }));
vi.mock("@/lib/stackAccountApi", async original => ({ ...await original<typeof import("@/lib/stackAccountApi")>(),
  loadPersonalStack: async () => null,
  savePersonalStack: async (_token: string, input: { state: unknown }) => ({ state: input.state, revision: 1, updatedAt: "2026-10-20T00:00:00Z" }),
}));
afterEach(() => { cleanup(); vi.useRealTimers(); });

it("does not purge unread legacy sources or queued anonymous edits when a partial draft is saved", async () => {
  vi.resetModules(); vi.useFakeTimers();
  const values = new Map<string, string>(); let blocked = true;
  values.set(STACK_STATE_STORAGE_KEY, JSON.stringify(pinToolInState(createDefaultToolCartState(), "notion")));
  values.set("tooltrim-ma-stack-paid-plans-v1", '["notion"]');
  Object.defineProperty(window, "localStorage", { configurable: true, value: {
    getItem: (key: string) => { if (blocked && key === "tooltrim-ma-stack-paid-plans-v1") throw new Error("temporary read denial"); return values.get(key) ?? null; },
    setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); },
  } });
  const store = await import("@/lib/personalStackStore");
  store.updatePersonalStack(current => ({ ...current, selection: pinToolInState(current.selection, "figma") }));
  const { StackAccountProvider, useStackAccount } = await import("./useStackAccount");
  const hook = renderHook(() => useStackAccount(), { wrapper: ({ children }) => createElement(StackAccountProvider, { enabled: true, children }) });
  await act(async () => { await vi.advanceTimersByTimeAsync(700); });
  expect(values.get("tooltrim-ma-stack-paid-plans-v1")).toBe('["notion"]');
  expect(hook.result.current.privacyWarning).toBe("ACCOUNT_LOCAL_RECOVERY_PENDING");
  blocked = false;
  act(() => store.setPersonalStackScope("anonymous"));
  expect(store.readPersonalStack().selection.pinnedToolSlugs).toEqual(["notion", "figma"]);
  expect(store.readPersonalStack().billing.paid).toEqual(["notion"]);
});
