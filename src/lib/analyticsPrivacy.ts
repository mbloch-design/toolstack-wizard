const PRIVATE_QUERY_PARAMS = new Set([
  "email", "name", "displayname", "fullname", "givenname", "familyname",
  "code", "state", "nonce", "error", "errorcode", "errordescription", "sessionid",
  "returnto", "redirectto", "redirecturi",
]);
function privateQueryKey(key: string): boolean {
  const normalized = key.replace(/[_-]/g, "").toLowerCase();
  return PRIVATE_QUERY_PARAMS.has(normalized) || /token|password|secret|authorization|credential/i.test(normalized);
}
const PRIVATE_ACCOUNT_PATH = /^\/(?:fr|en)\/(?:connexion|inscription|compte|sign-in|sign-up|account|back-office)(?:\/|$)/i;

/** Auth transport can still be in the URL while the SDK initializes. Consent
 * never permits credentials, nested return URLs, or fragments to leave the page.
 */
export function sanitizeAnalyticsUrl(url: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url, typeof window === "undefined" ? "https://tooltrim.com" : window.location.origin);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    parsed.hash = "";
    parsed.username = "";
    parsed.password = "";
    if (PRIVATE_ACCOUNT_PATH.test(parsed.pathname) || /^\/auth\/v1(?:\/|$)/i.test(parsed.pathname)) parsed.search = "";
    else for (const key of [...parsed.searchParams.keys()]) {
      const normalized = key.replace(/[_-]/g, "").toLowerCase();
      if (privateQueryKey(normalized)) parsed.searchParams.delete(key);
    }
    return url.startsWith("/") ? parsed.pathname + parsed.search : parsed.href;
  } catch {
    return "";
  }
}

/** Raw trackers cannot sanitize their own initial href/referrer: omit them for
 * this document. A fragment of any kind is omitted at bootstrap conservatively.
 */
export function isSensitiveAnalyticsUrl(url: string, anyFragment = false): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url, typeof window === "undefined" ? "https://tooltrim.com" : window.location.origin);
    if (!["http:", "https:"].includes(parsed.protocol)) return true;
    return !!(parsed.username || parsed.password || anyFragment && parsed.hash)
      || PRIVATE_ACCOUNT_PATH.test(parsed.pathname) || /^\/auth\/v1(?:\/|$)/i.test(parsed.pathname)
      || [...parsed.searchParams.keys()].some(privateQueryKey)
      || [...new URLSearchParams(parsed.hash.replace(/^#/, "")).keys()].some(privateQueryKey);
  } catch { return true; }
}
declare global { interface Window { __tooltrimAnalyticsPrivateDocument?: boolean } }
export function sensitiveAnalyticsDocument(): boolean {
  return typeof window !== "undefined" && (window.__tooltrimAnalyticsPrivateDocument === true
    || isSensitiveAnalyticsUrl(window.location.href, true) || isSensitiveAnalyticsUrl(document.referrer, true));
}
export function beforeSendAnalyticsEvent<T extends { type: string; url: string }>(event: T): T | null {
  if (isSensitiveAnalyticsUrl(event.url)) return null;
  const url = sanitizeAnalyticsUrl(event.url);
  return url ? { ...event, url } : null;
}
