import type { LookupAddress } from "node:dns";
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

type BadgeTransport = {
  isPublicAddress: (address: string) => boolean;
  fetch: (url: URL, address: LookupAddress, signal: AbortSignal) => Promise<Response>;
};

async function resolveBadgeUrl(value: unknown, signal: AbortSignal, transport?: BadgeTransport) {
  const url = new URL(String(value ?? ""));
  if (url.protocol !== "https:") throw new Error("https_required");
  if (url.username || url.password || url.port) throw new Error("invalid_url");
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (hostname === "localhost" || (isIP(hostname) && (transport || isPrivateAddress(hostname)))) throw new Error("private_url");

  signal.throwIfAborted();
  // DNS lookup itself has no signal option. Keep its wait within the same
  // deadline as every redirect and the response body, and discard late results.
  const addresses = await new Promise<LookupAddress[]>((resolve, reject) => {
    const abort = () => reject(new Error("page_unreachable"));
    signal.addEventListener("abort", abort, { once: true });
    void lookup(hostname, { all: true }).then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
  if (!addresses.length || addresses.some(({ address }) => transport ? !transport.isPublicAddress(address) : isPrivateAddress(address))) {
    throw new Error("private_url");
  }
  return { url, address: addresses[0] };
}

export const safePublicUrl = async (value: unknown) => (await resolveBadgeUrl(value, AbortSignal.timeout(8000))).url;

const canonicalHostname = (hostname: string) => hostname.toLowerCase().replace(/^www\./, "");
export const isSameSite = (candidate: string, expected: string) => {
  const candidateHost = canonicalHostname(candidate);
  const expectedHost = canonicalHostname(expected);
  return candidateHost === expectedHost || candidateHost.endsWith(`.${expectedHost}`);
};

const fetchPublicPage = async (initialUrl: Awaited<ReturnType<typeof resolveBadgeUrl>>, signal: AbortSignal, transport?: BadgeTransport) => {
  let current = initialUrl;
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    const response = await (transport ? transport.fetch(current.url, current.address, signal) : fetch(current.url, {
      redirect: "manual",
      headers: { "User-Agent": "ToolTrimBadgeVerifier/1.2 (+https://tooltrim.com)" },
      signal,
    }));
    if (response.status < 300 || response.status >= 400) return { response, finalUrl: current.url };
    const location = response.headers.get("location");
    await response.body?.cancel();
    if (!location || redirectCount === 3) throw new Error("page_unreachable");
    current = await resolveBadgeUrl(new URL(location, current.url), signal, transport);
    if (!isSameSite(current.url.hostname, initialUrl.url.hostname)) throw new Error("badge_wrong_domain");
  }
  throw new Error("page_unreachable");
};

export async function readBoundedBadgePage(response: Response) {
  const maxBytes = 1_000_000;
  if (Number(response.headers.get("content-length")) > maxBytes || !response.body) {
    await response.body?.cancel();
    throw new Error("page_unreachable");
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return Buffer.concat(chunks, size).toString("utf8");
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error("page_unreachable");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
}

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

export const verifyBadgeOnPage = async (badgeUrl: unknown, toolUrl: unknown, transport?: BadgeTransport) => {
  const signal = AbortSignal.timeout(8000);
  const candidate = new URL(String(badgeUrl ?? ""));
  const official = new URL(String(toolUrl ?? ""));
  if (transport && !isSameSite(candidate.hostname, official.hostname)) throw new Error("badge_wrong_domain");
  const resolved = await resolveBadgeUrl(candidate, signal, transport);
  const { url: toolSite } = await resolveBadgeUrl(official, signal, transport);
  if (!isSameSite(candidate.hostname, official.hostname)) throw new Error("badge_wrong_domain");
  const { response, finalUrl } = await fetchPublicPage(resolved, signal, transport);
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error("page_unreachable");
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    await response.body?.cancel();
    throw new Error("not_html");
  }
  if (!containsVisibleLinkedBadge(await readBoundedBadgePage(response), finalUrl)) throw new Error("badge_not_found");
  return { badgePage: resolved.url, toolSite, finalUrl };
};
