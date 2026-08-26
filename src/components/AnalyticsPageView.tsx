import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

/**
 * gtag('config', ...) in index.html already reports the very first page_view
 * on initial load. This only needs to report the ones after that — every
 * client-side route change a BrowserRouter SPA never surfaces to GA4 on
 * its own.
 */
export default function AnalyticsPageView() {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Best-effort delay so the page's own setSeoTags() effect has a chance
    // to update document.title first. On some routes that effect itself
    // waits on data (e.g. resolving the tool object on client-side
    // navigation), so title can still lag by one navigation even with this
    // buffer — that's a known, non-critical gap. page_path is what GA4's
    // flow/path reports actually key on, and it's correct immediately.
    const id = window.setTimeout(() => {
      trackPageView(location.pathname + location.search, document.title);
    }, 300);
    return () => window.clearTimeout(id);
  }, [location.pathname, location.search]);

  return null;
}
