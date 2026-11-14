import { useCallback, useEffect, useRef, useState } from "react";
import { getScrollTop, scrollToY } from "@/lib/scroll";

/**
 * A click in the catalogue bar is a filter. From down the list it is one quiet change (13/11/2026, Michael: the
 * earlier « remonter en douceur » showed every step — the whole list scrolling up, the bars swapping, then the new
 * results): the content fades out, the filter applies and the page is back at the top while it is hidden, then
 * the content fades in. Never a visible scroll. Pass these with every navigation the bar triggers, so the router
 * does not reset the scroll on its own.
 */
export const CATALOG_BAR_NAV = { preventScrollReset: true, state: { skipScrollReset: true } } as const;

/** Fade length, matched by html[data-catalog-swap] in index.css. */
const SWAP_MS = 140;
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Apply a filter from the bar: at the top, at once; down the list, swapped out of sight and back at the top. */
export async function runCatalogFilter(change: () => void) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (getScrollTop() <= 1) { change(); return; }
  const root = document.documentElement;
  if (!reduced) { root.dataset.catalogSwap = "out"; await wait(SWAP_MS); }
  change();
  // Let the new results render before the jump, so the top shows them and not the old list.
  await nextFrame();
  scrollToY(0, "auto");
  await nextFrame();
  delete root.dataset.catalogSwap;
}

/**
 * Single sticky-state controller for every catalogue command bar.
 * The callback ref also supports pages whose sentinel mounts after loading.
 */
export function useCatalogStickyToolbar() {
  const [toolbarStuck, setToolbarStuck] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const toolbarSentinelRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!node) {
      setToolbarStuck(false);
      return;
    }

    // Always observe against the viewport. .asv2-content scrolls on desktop
    // but not below 640px, and a root picked once at mount went stale as soon
    // as the window was resized across that breakpoint. With root: null the
    // ancestor scroll container still clips the sentinel, so both layouts
    // report correctly. The -56px top margin is the app topbar.
    const observer = new IntersectionObserver(
      ([entry]) => setToolbarStuck(!entry.isIntersecting),
      { root: null, rootMargin: "-56px 0px 0px 0px", threshold: 0 },
    );

    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { toolbarStuck, toolbarSentinelRef };
}
