/**
 * Thin wrapper around window.gtag. The SPA only ever fires one GA4 page_view
 * (from the static script in index.html, on first load) — client-side route
 * changes and business actions (add to stack, outbound tool clicks) were
 * never reported at all, making GA4's flow/path reports show a single
 * pageview per session regardless of how much the visitor actually browsed.
 */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

export function trackPageView(path: string, title: string): void {
  trackEvent("page_view", { page_path: path, page_title: title, page_location: window.location.href });
}
