import { useCallback, useEffect, useRef, useState } from "react";
import { getScrollTop, onScroll, scrollToY } from "@/lib/scroll";

/**
 * A click in the catalogue bar is a filter (12/11/2026, Michael's call: « remonter en douceur »). From down the
 * list, one continuous move: the page glides back to the top, the bar settles under the title, and only then
 * do the new results show. Never a jump. Pass these with every navigation the bar triggers, so the router does
 * not reset the scroll on its own.
 */
export const CATALOG_BAR_NAV = { preventScrollReset: true, state: { skipScrollReset: true } } as const;

/** Resolves once the page has stopped moving (or after a ceiling, if the browser never says so). */
function whenScrollSettles(ceiling = 1200): Promise<void> {
  return new Promise((resolve) => {
    let idle = 0;
    let done = false;
    const finish = () => { if (done) return; done = true; stop(); window.clearTimeout(idle); window.clearTimeout(cap); resolve(); };
    const stop = onScroll(() => { window.clearTimeout(idle); idle = window.setTimeout(finish, 90); }, { passive: true });
    idle = window.setTimeout(finish, 90);
    const cap = window.setTimeout(finish, ceiling);
  });
}

/** Apply a filter from the bar: glide to the top first when the page is down the list, then change. */
export async function runCatalogFilter(change: () => void) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (getScrollTop() > 1) {
    scrollToY(0, reduced ? "auto" : "smooth");
    await whenScrollSettles();
  }
  change();
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
