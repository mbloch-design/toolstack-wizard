import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";
import { AccountApiError } from "./_account-auth.js";
import { applyVerifiedBillingEvent, requireListingCommerceEnabled } from "./_cms-commercial.js";
import { parseCreemEvent } from "./_cms-commercial-creem.js";

export const config = { api: { bodyParser: false } };
const MAX_WEBHOOK_BYTES = 128 * 1024;

async function readRawWebhook(req: VercelRequest) {
  const supplied = Object.getOwnPropertyDescriptor(req, "body")?.value;
  if (supplied !== undefined && !Buffer.isBuffer(supplied)) throw new AccountApiError(400, "CREEM_RAW_BODY_REQUIRED");
  if (Number(req.headers["content-length"]) > MAX_WEBHOOK_BYTES || supplied?.length > MAX_WEBHOOK_BYTES) {
    throw new AccountApiError(413, "PAYLOAD_TOO_LARGE");
  }
  if (Buffer.isBuffer(supplied)) return supplied;
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    if (!Buffer.isBuffer(chunk)) throw new AccountApiError(400, "CREEM_RAW_BODY_REQUIRED");
    size += chunk.length;
    if (size > MAX_WEBHOOK_BYTES) throw new AccountApiError(413, "PAYLOAD_TOO_LARGE");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED" } });
    return;
  }
  try {
    requireListingCommerceEnabled();
    const secret = process.env.CREEM_WEBHOOK_SECRET;
    if (!secret) throw new AccountApiError(503, "CREEM_WEBHOOK_UNAVAILABLE");
    const signature = req.headers["creem-signature"];
    if (typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) throw new AccountApiError(401, "CREEM_SIGNATURE_INVALID");
    const event = parseCreemEvent(await readRawWebhook(req), signature, secret);
    await applyVerifiedBillingEvent(event);
    res.status(200).json({ received: true });
  } catch (cause) {
    const error = cause instanceof AccountApiError ? cause : new AccountApiError(503, "CREEM_WEBHOOK_UNAVAILABLE");
    res.status(error.status).json({ error: { code: error.code } });
  }
}
