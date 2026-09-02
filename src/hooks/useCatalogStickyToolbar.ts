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

    // .asv2-content is only a real scroll container on desktop (bounded
    // height, overflow-y: auto) — below the 640px breakpoint it's
    // overflow-y: visible and the page scrolls as a whole instead. An
    // IntersectionObserver root that isn't an actual scrolling ancestor
    // never reports the sentinel as leaving view, so toolbarStuck would
    // stay stuck at false forever. Fall back to the viewport (root: null)
    // whenever the candidate root isn't really scrollable.
    const candidateRoot = node.closest(".asv2-content");
    const scrollRoot = candidateRoot && getComputedStyle(candidateRoot).overflowY !== "visible"
      ? candidateRoot
      : null;
    const observer = new IntersectionObserver(
      ([entry]) => setToolbarStuck(!entry.isIntersecting),
      { root: scrollRoot, threshold: 0 },
    );

    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { toolbarStuck, toolbarSentinelRef };
}
