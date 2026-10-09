import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";
import { PaymentVerificationError, verifySubmissionPayment } from "./_payment-verification.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  const origin = String(req.headers.origin || "");
  if (/^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    await verifySubmissionPayment(req.body ?? {});
    return res.status(200).json({ verified: true });
  } catch (error) {
    const failure = error instanceof PaymentVerificationError ? error : new PaymentVerificationError(503, "payment_verification_unavailable");
    return res.status(failure.status).json({ error: failure.message });
  }
}
