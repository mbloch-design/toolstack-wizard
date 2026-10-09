// @vitest-environment jsdom
import { createElement } from "react";
import { act, renderHook } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { STACK_STATE_STORAGE_KEY, createDefaultToolCartState, pinToolInState, saveToolCartState } from "@/lib/stackState";

it("hydrates saved pins without replacing SSR, then shares updates without losing saved selections", async () => {
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => values.clear(),
  } });
  vi.resetModules();
  const serverHook = (await import("@/hooks/useStackPins")).useStackPins;
  function ServerProbe() {
    const { state } = serverHook();
    return createElement("p", null, state.pinnedToolSlugs.join(",") || "empty");
  }
  const html = renderToString(createElement(ServerProbe));
  expect(html).toBe("<p>empty</p>");
  const savedState = pinToolInState(createDefaultToolCartState(), "notion", ["organisation"], "2026-10-08T00:00:00.000Z");
  saveToolCartState(window.localStorage, savedState);
  const saved = window.localStorage.getItem(STACK_STATE_STORAGE_KEY);

  // Browser and SSR load independent module instances in production.
  vi.resetModules();
  const clientHook = (await import("@/hooks/useStackPins")).useStackPins;
  let pin: (slug: string) => void = () => { throw new Error("Not mounted"); };
  function ClientProbe() {
    const { state, pinTool } = clientHook();
    pin = pinTool;
    return createElement("p", null, state.pinnedToolSlugs.join(",") || "empty");
  }
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.append(container);
  const errors: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, createElement(ClientProbe), { onRecoverableError: error => errors.push(error) });
    });
    expect(container.textContent).toBe("notion");
    expect(errors).toEqual([]);
    expect(window.localStorage.getItem(STACK_STATE_STORAGE_KEY)).toBe(saved);
    // A cached browser snapshot must never leak into a later SSR render.
    expect(renderToString(createElement(ClientProbe))).toBe("<p>empty</p>");
    const other = renderHook(() => clientHook());
    await act(async () => pin("figma"));
    expect(container.textContent).toBe("notion,figma");
    expect(other.result.current.state.pinnedToolSlugs).toEqual(["notion", "figma"]);
    expect(JSON.parse(window.localStorage.getItem(STACK_STATE_STORAGE_KEY)!).toolEntries[0]).toEqual(savedState.toolEntries[0]);
    other.unmount();
  } finally {
    await act(async () => root?.unmount());
    container.remove();
    window.localStorage.clear();
  }
});
