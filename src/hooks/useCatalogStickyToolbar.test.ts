import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as scroll from "@/lib/scroll";
import { runCatalogFilter } from "./useCatalogStickyToolbar";

// 13/11/2026: a filter from the floating bar showed every step (the whole list scrolling up, the bars swapping,
// then the new results). It is now one quiet change: the content fades, the filter applies and the page is back at
// the top while hidden, then the content returns. Never a visible scroll.
describe("runCatalogFilter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0));
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); document.documentElement.removeAttribute("data-catalog-swap"); });

  it("from down the list, applies the filter while hidden and jumps to the top without a smooth scroll", async () => {
    vi.spyOn(scroll, "getScrollTop").mockReturnValue(2400);
    const scrollTo = vi.spyOn(scroll, "scrollToY").mockImplementation(() => {});
    const order: string[] = [];
    const change = vi.fn(() => order.push(`change:${document.documentElement.dataset.catalogSwap ?? "shown"}`));
    scrollTo.mockImplementation((_top, behavior) => { order.push(`scroll:${behavior}:${document.documentElement.dataset.catalogSwap ?? "shown"}`); });

    const done = runCatalogFilter(change);
    expect(document.documentElement.dataset.catalogSwap).toBe("out");
    expect(change).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();
    await done;

    expect(order).toEqual(["change:out", "scroll:auto:out"]);
    expect(scrollTo).not.toHaveBeenCalledWith(0, "smooth");
    expect(document.documentElement.dataset.catalogSwap).toBeUndefined();
  });

  it("at the top, applies at once with no fade", async () => {
    vi.spyOn(scroll, "getScrollTop").mockReturnValue(0);
    const change = vi.fn();
    await runCatalogFilter(change);
    expect(change).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.catalogSwap).toBeUndefined();
  });
});
