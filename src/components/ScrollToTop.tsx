import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { getScrollTop, onScroll, scrollToTop, scrollToY } from "@/lib/scroll";

const scrollPositions = new Map<string, number>();
const MAX_SAVED_POSITIONS = 100;

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

const ScrollToTop = () => {
  const { hash, key, pathname, search, state } = useLocation();
  const navigationType = useNavigationType();
  const locationId = `${key}:${pathname}${search}`;

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

  useEffect(() => {
    if (hash) {
      window.setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ block: "start" });
      }, 0);
      return;
    }

    const locationState = state as ScrollLocationState | null;
    const savedPosition = navigationType === "POP"
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
  }, [hash, key, locationId, navigationType, pathname, search, state]);

  return null;
};

export default ScrollToTop;
