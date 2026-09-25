import { useCallback, useEffect, useRef, useState } from "react";

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
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { toolbarStuck, toolbarSentinelRef };
}
