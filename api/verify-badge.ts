import { createHmac } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyBadgeOnPage } from "./_badge-verification.js";

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
    const { badgePage, toolSite, finalUrl } = await verifyBadgeOnPage(req.body?.badgeUrl, req.body?.toolUrl);

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
