/** GA4 is configured before any events, and loaded with denied storage until explicit consent (advanced Consent Mode). */
export const GA_ID = 'G-DL5MJKQ3JE';
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __tooltrimAnalyticsConsent?: boolean;
    'ga-disable-G-DL5MJKQ3JE'?: boolean;
  }
}

const ANALYTICS_READY_EVENT = 'tooltrim:analytics-ready';
let ready = false;
let lastPagePath: string | null = null;
let previousPageLocation: string | null = null;

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined' || !window.__tooltrimAnalyticsConsent || !ready || !window.gtag) return;
  window.gtag('event', name, params);
}

/** Measure only the current visible view once both the tag and consent are ready.
 * The caller must dispose on navigation; past clicks are never queued or replayed.
 */
export function whenAnalyticsReady(report: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const dispose = () => window.removeEventListener(ANALYTICS_READY_EVENT, notify);
  const notify = () => {
    if (!ready || !window.__tooltrimAnalyticsConsent || !window.gtag) return;
    dispose();
    report();
  };
  window.addEventListener(ANALYTICS_READY_EVENT, notify);
  notify();
  return dispose;
}

const PRIVATE_QUERY_PARAMS = ["email", "name"];

/** Outreach links may carry a recipient's email or name for prefilling: never send them to analytics. */
function withoutPrivateParams(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    PRIVATE_QUERY_PARAMS.forEach((key) => parsed.searchParams.delete(key));
    return url.startsWith("/") ? parsed.pathname + parsed.search : parsed.href;
  } catch {
    return url.split("?")[0];
  }
}

export function trackPageView(rawPath: string, title: string): void {
  const path = withoutPrivateParams(rawPath);
  if (!ready || !window.gtag || lastPagePath === path) return;
  const granted = window.__tooltrimAnalyticsConsent;
  const location = granted ? withoutPrivateParams(window.location.href) : window.location.origin + window.location.pathname;
  let referrer = previousPageLocation ?? document.referrer;
  if (!granted && referrer) {
    try { referrer = new URL(referrer).origin; } catch { referrer = ''; }
  }
  window.gtag('set', {page_location: location, page_referrer: referrer, page_title: granted ? title : window.location.pathname});
  window.gtag('event', 'page_view', {
    page_path: granted ? path : window.location.pathname,
    page_title: granted ? title : window.location.pathname,
    page_location: location, page_referrer: referrer,
  });
  lastPagePath = path;
  previousPageLocation = location;
}

export function loadGoogleAnalytics(granted = true): void {
  const existing = document.querySelector(`script[data-tooltrim-ga="${GA_ID}"]`);
  const changed = window.__tooltrimAnalyticsConsent !== granted;
  window.__tooltrimAnalyticsConsent = granted;
  window[`ga-disable-${GA_ID}`] = false;
  window.dataLayer ??= [];
  window.gtag ??= (...args: unknown[]) => { window.dataLayer!.push(args); };
  if (!existing) window.gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  });
  if (!existing || changed) window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  });
  if (existing) {
    if (changed && granted && ready) window.dispatchEvent(new Event(ANALYTICS_READY_EVENT));
    return;
  }
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('set', 'url_passthrough', false);
  // Also minimise fields used by Google's automatically generated denied pings.
  window.gtag('set', {
    page_location: window.location.origin + window.location.pathname,
    page_title: window.location.pathname,
    page_referrer: (() => { try { return new URL(document.referrer).origin; } catch { return ''; } })(),
  });
  // Queue configuration before loading the asynchronous tag. Events wait for load.
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false});
  const script = document.createElement('script');
  script.async = true;
  script.dataset.tooltrimGa = GA_ID;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script.addEventListener('load', () => {
    if (window[`ga-disable-${GA_ID}`]) return;
    ready = true;
    // Measure the page visible now, including acceptance after the router effect.
    trackPageView(window.location.pathname + window.location.search, document.title);
    window.dispatchEvent(new Event(ANALYTICS_READY_EVENT));
  }, {once: true});
  script.addEventListener('error', () => {
    ready = false;
    script.remove(); // A later explicit acceptance can retry a failed download.
  }, {once: true});
  document.head.appendChild(script);
}

/** Returns whether a reload is needed to remove Google's automatic listeners. */
export function stopGoogleAnalytics(): boolean {
  const loaded = !!document.querySelector('script[data-tooltrim-ga]');
  const wasGranted = !!window.__tooltrimAnalyticsConsent;
  if (!wasGranted && loaded) return false;
  window.__tooltrimAnalyticsConsent = false;
  window[`ga-disable-${GA_ID}`] = true;
  ready = false;
  lastPagePath = null;
  previousPageLocation = null;
  if (loaded) window.gtag?.('consent', 'update', {
    analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  });
  // GA can set first-party cookies at the host or a parent domain.
  const domains = window.location.hostname.split('.');
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim();
    if (!/^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name)) continue;
    document.cookie = `${name}=; Max-Age=0; Path=/`;
    for (let i = 0; i < domains.length; i++) {
      document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${domains.slice(i).join('.')}`;
    }
  }
  return loaded && wasGranted;
}
