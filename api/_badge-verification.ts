import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const isPrivateAddress = (address: string) => {
  if (address === "::1" || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:")) return true;
  const parts = address.split(".").map(Number);
  if (parts.length !== 4) return false;
  return parts[0] === 10
    || parts[0] === 127
    || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
    || parts[0] === 0;
};

export const safePublicUrl = async (value: unknown) => {
  const url = new URL(String(value ?? ""));
  if (url.protocol !== "https:") throw new Error("https_required");
  if (url.username || url.password || url.port) throw new Error("invalid_url");
  if (url.hostname === "localhost" || (isIP(url.hostname) && isPrivateAddress(url.hostname))) throw new Error("private_url");
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error("private_url");
  return url;
};

const canonicalHostname = (hostname: string) => hostname.toLowerCase().replace(/^www\./, "");
export const isSameSite = (candidate: string, expected: string) => {
  const candidateHost = canonicalHostname(candidate);
  const expectedHost = canonicalHostname(expected);
  return candidateHost === expectedHost || candidateHost.endsWith(`.${expectedHost}`);
};

const fetchPublicPage = async (initialUrl: URL) => {
  let currentUrl = initialUrl;
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      redirect: "manual",
      headers: { "User-Agent": "ToolTrimBadgeVerifier/1.2 (+https://tooltrim.com)" },
      signal: AbortSignal.timeout(8000),
    });
    if (response.status < 300 || response.status >= 400) return { response, finalUrl: currentUrl };
    const location = response.headers.get("location");
    if (!location || redirectCount === 3) throw new Error("page_unreachable");
    currentUrl = await safePublicUrl(new URL(location, currentUrl).toString());
    if (!isSameSite(currentUrl.hostname, initialUrl.hostname)) throw new Error("badge_wrong_domain");
  }
  throw new Error("page_unreachable");
};

const attributeValue = (attributes: string, name: string) => {
  const match = attributes.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1] || "";
};

const hasHiddenInlineStyle = (attributes: string) => {
  const style = attributeValue(attributes, "style").replace(/\s+/g, "").toLowerCase();
  return /(?:display:none|visibility:hidden|opacity:0(?:;|$)|width:0(?:px)?(?:;|$)|height:0(?:px)?(?:;|$))/.test(style);
};

export const containsVisibleLinkedBadge = (html: string, pageUrl: URL) => {
  const anchors = html.matchAll(/<a\b([^>]*)>([\s\S]{0,2000}?)<\/a>/gi);
  for (const anchor of anchors) {
    const anchorAttributes = anchor[1];
    if (hasHiddenInlineStyle(anchorAttributes)) continue;
    try {
      const href = new URL(attributeValue(anchorAttributes, "href"), pageUrl);
      if (canonicalHostname(href.hostname) !== "tooltrim.com") continue;
    } catch { continue; }

    const images = anchor[2].matchAll(/<img\b([^>]*)>/gi);
    for (const image of images) {
      const imageAttributes = image[1];
      if (hasHiddenInlineStyle(imageAttributes)) continue;
      try {
        const src = new URL(attributeValue(imageAttributes, "src"), pageUrl);
        if (canonicalHostname(src.hostname) === "tooltrim.com" && /^\/tooltrim-badge(?:-dark)?\.svg$/.test(src.pathname)) return true;
      } catch { /* Ignore malformed image URLs. */ }
    }
  }
  return false;
};

export const verifyBadgeOnPage = async (badgeUrl: unknown, toolUrl: unknown) => {
  const badgePage = await safePublicUrl(badgeUrl);
  const toolSite = await safePublicUrl(toolUrl);
  if (!isSameSite(badgePage.hostname, toolSite.hostname)) throw new Error("badge_wrong_domain");

  const { response, finalUrl } = await fetchPublicPage(badgePage);
  if (!response.ok) throw new Error("page_unreachable");
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) throw new Error("not_html");

  const html = (await response.text()).slice(0, 1_000_000);
  if (!containsVisibleLinkedBadge(html, finalUrl)) throw new Error("badge_not_found");

  return { badgePage, toolSite, finalUrl };
};
