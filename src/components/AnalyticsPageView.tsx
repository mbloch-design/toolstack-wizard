import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

/**
 * analytics.ts configures GA4 with send_page_view:false and reports the
 * current page after the tag loads. This component reports route changes;
 * analytics.ts deduplicates the overlapping initial route effect.
 */
export default function AnalyticsPageView() {
  const location = useLocation();
  useEffect(() => {
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
