import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getScrollTop, scrollContainerCandidate, scrollToY } from "@/lib/scroll";

/**
 * A click in the catalogue bar is a filter, not a new page (12/11/2026): the bar stays where it is (same state,
 * no frame without it) and the page holds its place at the top of the results. Pass these with every
 * navigation the bar triggers.
 */
export const CATALOG_BAR_NAV = { preventScrollReset: true, state: { skipScrollReset: true, catalogBar: true } } as const;


/** After a filter: if the bar was floating, land at the top of the new results so it keeps floating. */
function holdCatalogPlace(force = false): boolean {
  const slot = document.querySelector<HTMLElement>('[data-toolbar="catalog"]')?.parentElement;
  if (!slot) return false;
  const scroller = scrollContainerCandidate();
  const origin = scroller && getComputedStyle(scroller).overflowY !== "visible" ? scroller.getBoundingClientRect().top : 0;
  const top = getScrollTop();
  const resultsTop = top + slot.getBoundingClientRect().bottom - origin;
  if (!force && top <= resultsTop - 1) return false;
  scrollToY(resultsTop);
  return true;
}

/**
 * Single sticky-state controller for every catalogue command bar.
 * The callback ref also supports pages whose sentinel mounts after loading.
 */
/** The bar's last state, so a page loaded by a filter starts where the bar was (no frame without it). */
let lastStuck = false;

export function useCatalogStickyToolbar() {
  const location = useLocation();
  const fromBar = (location.state as { catalogBar?: boolean } | null)?.catalogBar;
  const [toolbarStuck, setStuckState] = useState(() => Boolean(fromBar) && lastStuck);
  const setToolbarStuck = useCallback((next: boolean) => { lastStuck = next; setStuckState(next); }, []);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const toolbarSentinelRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!node) {
      // Unmounting (often a filter loading the next page): keep the remembered state for that page.
      setStuckState(false);
      return;
    }

    // Always observe against the viewport. .asv2-content scrolls on desktop
    // but not below 640px, and a root picked once at mount went stale as soon
    // as the window was resized across that breakpoint: the bar stayed
    // sticky with no glass behind it. With root: null the ancestor scroll
    // container still clips the sentinel, so both layouts report correctly.
    // The -56px top margin is the app topbar: on mobile the bar sticks right
    // under it, on desktop the scroll container starts there anyway.
    const observer = new IntersectionObserver(
      ([entry]) => setToolbarStuck(!entry.isIntersecting),
      { root: null, rootMargin: "-56px 0px 0px 0px", threshold: 0 },
    );

    observer.observe(node);
    observerRef.current = observer;
  }, [setToolbarStuck]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  // Once now, then again after the layout settles (the new page's sections mount a frame or two later), so the
  // landing is the same on every page: the top of the results, under the top of the content.
  useLayoutEffect(() => {
    if (!fromBar) return;
    if (!holdCatalogPlace()) return;
    const again = () => holdCatalogPlace(true);
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(again); });
    const late = window.setTimeout(again, 250);
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); window.clearTimeout(late); };
  }, [location.key, fromBar]);

  return { toolbarStuck, toolbarSentinelRef };
}
