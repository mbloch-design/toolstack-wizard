/** GA4 is configured before any events, and loaded only with consent. */
export const GA_ID = 'G-DL5MJKQ3JE';
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __tooltrimAnalyticsConsent?: boolean;
    'ga-disable-G-DL5MJKQ3JE'?: boolean;
  }
}

let ready = false;
let lastPagePath: string | null = null;
let previousPageLocation: string | null = null;

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined' || !window.__tooltrimAnalyticsConsent || !ready || !window.gtag) return;
  window.gtag('event', name, params);
}

export function trackPageView(path: string, title: string): void {
  if (!window.__tooltrimAnalyticsConsent || !ready || !window.gtag || lastPagePath === path) return;
  trackEvent('page_view', {
    page_path: path, page_title: title, page_location: window.location.href,
    page_referrer: previousPageLocation ?? document.referrer,
  });
  lastPagePath = path;
  previousPageLocation = window.location.href;
}

export function loadGoogleAnalytics(): void {
  if (document.querySelector(`script[data-tooltrim-ga="${GA_ID}"]`)) return;
  window.__tooltrimAnalyticsConsent = true;
  window[`ga-disable-${GA_ID}`] = false;
  window.dataLayer ??= [];
  window.gtag ??= (...args: unknown[]) => { window.dataLayer!.push(args); };
  window.gtag('consent', 'update', {
    analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  });
  // Queue configuration before loading the asynchronous tag. Events wait for load.
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {send_page_view: false});
  const script = document.createElement('script');
  script.async = true;
  script.dataset.tooltrimGa = GA_ID;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script.addEventListener('load', () => {
    if (!window.__tooltrimAnalyticsConsent) return;
    ready = true;
    // Measure the page visible now, including acceptance after the router effect.
    trackPageView(window.location.pathname + window.location.search, document.title);
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
  return loaded;
}
