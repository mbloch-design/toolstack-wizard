import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { getScrollTop, onScroll, scrollToTop, scrollToY } from "@/lib/scroll";

const scrollPositions = new Map<string, number>();
const MAX_SAVED_POSITIONS = 100;
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface ScrollLocationState {
  skipScrollReset?: boolean;
  scrollPosition?: number;
}

function rememberScrollPosition(key: string, top: number) {
  scrollPositions.delete(key);
  scrollPositions.set(key, top);
  if (scrollPositions.size <= MAX_SAVED_POSITIONS) return;
  const oldestKey = scrollPositions.keys().next().value;
  if (oldestKey) scrollPositions.delete(oldestKey);
}

function persistScrollPosition(top: number) {
  const historyState = window.history.state || {};
  window.history.replaceState({
    ...historyState,
    usr: { ...(historyState.usr || {}), scrollPosition: top },
  }, "");
}

function isDocumentReload(): boolean {
  if (typeof window === "undefined") return false;
  const navigation = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return navigation?.type === "reload";
}

const ScrollToTop = () => {
  const { hash, key, pathname, search, state } = useLocation();
  const navigationType = useNavigationType();
  const locationId = `${key}:${pathname}${search}`;
  const initialLocationIdRef = useRef(locationId);
  const hasLeftInitialLocationRef = useRef(false);
  if (locationId !== initialLocationIdRef.current) hasLeftInitialLocationRef.current = true;

  /* React Router reports both browser Back/Forward and a full document reload
     as POP. Only Back/Forward should restore the saved position. Keep the
     initial-location check stable across StrictMode's double effect run, but
     stop treating it as a reload once the SPA has visited another location. */
  const isInitialReload = !hasLeftInitialLocationRef.current
    && locationId === initialLocationIdRef.current
    && isDocumentReload();

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useEffect(() => {
    const savePosition = () => {
      const top = getScrollTop();
      rememberScrollPosition(locationId, top);
      persistScrollPosition(top);
    };
    const stopListening = onScroll(savePosition, { passive: true });
    return () => {
      stopListening();
      savePosition();
    };
  }, [locationId]);

  // Reset before the browser paints the new route. A passive effect leaves
  // one frame where the persistent AppShell scroll container still has the
  // catalogue's old scrollTop; when the asynchronously loaded tool page then
  // grows, browser scroll anchoring can keep the footer in view.
  useIsomorphicLayoutEffect(() => {
    if (hash) {
      window.setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ block: "start" });
      }, 0);
      return;
    }

    const locationState = state as ScrollLocationState | null;
    const savedPosition = navigationType === "POP" && !isInitialReload
      ? locationState?.scrollPosition ?? scrollPositions.get(locationId)
      : undefined;
    if (savedPosition !== undefined) {
      let firstFrame = 0;
      let secondFrame = 0;
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => scrollToY(savedPosition, "auto"));
      });
      return () => {
        window.cancelAnimationFrame(firstFrame);
        window.cancelAnimationFrame(secondFrame);
      };
    }

    // In-page tab navigation (e.g. the tool detail page's pill nav) already
    // owns its own smooth scroll to the target section; resetting to 0 here
    // would race with and cancel that animation.
    if (locationState?.skipScrollReset) return;

    scrollToTop();
  }, [hash, isInitialReload, key, locationId, navigationType, pathname, search, state]);

  return null;
};

export default ScrollToTop;
