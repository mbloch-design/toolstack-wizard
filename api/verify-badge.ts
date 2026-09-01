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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const badgePage = await safePublicUrl(req.body?.badgeUrl);
    const toolSite = await safePublicUrl(req.body?.toolUrl);
    if (badgePage.hostname !== toolSite.hostname && !badgePage.hostname.endsWith(`.${toolSite.hostname}`)) {
      return res.status(400).json({ error: "badge_wrong_domain" });
    }

    const response = await fetch(badgePage, {
      redirect: "error",
      headers: { "User-Agent": "ToolTrimBadgeVerifier/1.0 (+https://tooltrim.com)" },
      signal: AbortSignal.timeout(8000),
    });
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
    return res.status(200).json({ verified: true, url: badgePage.toString(), token: `${payload}.${signature}` });
  } catch {
    return res.status(400).json({ error: "verification_failed" });
  }
}
