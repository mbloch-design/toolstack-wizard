import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { scrollToTop } from "@/lib/scroll";

const ScrollToTop = () => {
  const { hash, pathname, state } = useLocation();

  useEffect(() => {
    if (hash) {
      window.setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ block: "start" });
      }, 0);
      return;
    }

    // In-page tab navigation (e.g. the tool detail page's pill nav) already
    // owns its own smooth scroll to the target section; resetting to 0 here
    // would race with and cancel that animation.
    if ((state as { skipScrollReset?: boolean } | null)?.skipScrollReset) return;

    scrollToTop();
  }, [hash, pathname, state]);

  return null;
};

export default ScrollToTop;
