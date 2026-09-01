import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { createHmac } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

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

const safePublicUrl = async (value: unknown) => {
  const url = new URL(String(value ?? ""));
  if (url.protocol !== "https:") throw new Error("https_required");
  if (url.username || url.password || url.port) throw new Error("invalid_url");
  if (url.hostname === "localhost" || (isIP(url.hostname) && isPrivateAddress(url.hostname))) throw new Error("private_url");
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error("private_url");
  return url;
};

const canonicalHostname = (hostname: string) => hostname.toLowerCase().replace(/^www\./, "");
const isSameSite = (candidate: string, expected: string) => {
  const candidateHost = canonicalHostname(candidate);
  const expectedHost = canonicalHostname(expected);
  return candidateHost === expectedHost || candidateHost.endsWith(`.${expectedHost}`);
};

const fetchPublicPage = async (initialUrl: URL) => {
  let currentUrl = initialUrl;
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      redirect: "manual",
      headers: { "User-Agent": "ToolTrimBadgeVerifier/1.1 (+https://tooltrim.com)" },
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestOrigin = String(req.headers.origin || "");
  if (/^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(requestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const badgePage = await safePublicUrl(req.body?.badgeUrl);
    const toolSite = await safePublicUrl(req.body?.toolUrl);
    if (!isSameSite(badgePage.hostname, toolSite.hostname)) {
      return res.status(400).json({ error: "badge_wrong_domain" });
    }

    const { response, finalUrl } = await fetchPublicPage(badgePage);
    if (!response.ok) return res.status(400).json({ error: "page_unreachable" });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return res.status(400).json({ error: "not_html" });

    const html = (await response.text()).slice(0, 1_000_000).toLowerCase();
    const hasToolTrimLink = /href\s*=\s*["'][^"']*tooltrim\.com(?:[/?#][^"']*)?["']/.test(html);
    const hasBadgeImage = /src\s*=\s*["'][^"']*tooltrim-badge(?:-dark)?\.svg[^"']*["']/.test(html);
    if (!hasToolTrimLink || !hasBadgeImage) return res.status(400).json({ error: "badge_not_found" });

    const secret = process.env.BADGE_VERIFICATION_SECRET || process.env.RESEND_API_KEY;
    if (!secret) return res.status(500).json({ error: "verification_unavailable" });
    const payload = Buffer.from(JSON.stringify({
      badgeUrl: badgePage.toString(),
      toolUrl: toolSite.toString(),
      exp: Date.now() + 30 * 60 * 1000,
    })).toString("base64url");
    const signature = createHmac("sha256", secret).update(payload).digest("base64url");
    return res.status(200).json({ verified: true, url: finalUrl.toString(), token: `${payload}.${signature}` });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "verification_failed";
    const exposedErrors = new Set(["badge_wrong_domain", "page_unreachable", "https_required", "invalid_url", "private_url"]);
    return res.status(400).json({ error: exposedErrors.has(reason) ? reason : "verification_failed" });
  }
}
