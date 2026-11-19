import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";
import { AccountApiError, getAccountServiceClient, requireAccount } from "./_account-auth.js";
import { readAccountBody } from "./_account-body.js";
import { asObject, creemCheckoutId, listingUuid, readHistoricalListingReceipt } from "./_cms-commercial-creem.js";
import { requireListingCommerceEnabled } from "./_cms-commercial.js";
import { requireCmsRpcSuccess } from "./_cms-store.js";

export const config = { api: { bodyParser: false } };
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST"); res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED" } }); return;
  }
  try {
    requireListingCommerceEnabled();
    const actor = await requireAccount(req);
    if (!actor.emailConfirmed) throw new AccountApiError(403, "CMS_ACCESS_DENIED");
    const body = req.method === "GET" ? { listingId: req.query.listingId } : asObject(await readAccountBody(req, 4096, "INVALID_LISTING_COMMERCE"));
    if (!listingUuid(body.listingId)) throw new AccountApiError(400, "INVALID_LISTING_COMMERCE");
    const rpc = getAccountServiceClient().rpc.bind(getAccountServiceClient()) as unknown as
      (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { code: string; message: string } | null }>;
    const args = { p_actor: actor.userId, p_session: actor.sessionId, p_listing: body.listingId };
    // Database checks super-admin access before any provider read or private application disclosure.
    const inspected = await rpc("cms_admin_listing_payment", { ...args, p_action: "inspect", p_proof: {} });
    requireCmsRpcSuccess(inspected.error);
    const listing = asObject(inspected.data);
    if (req.method === "GET") { res.status(200).json(listing); return; }
    if (Object.keys(body).some(key => !["listingId", "checkoutId", "paymentReference", "reviewNote"].includes(key))
      || !creemCheckoutId(body.checkoutId) || !listingUuid(body.paymentReference)
      || typeof body.reviewNote !== "string" || body.reviewNote.trim().length < 20 || body.reviewNote.length > 2000
      || typeof listing.websiteUrl !== "string") throw new AccountApiError(400, "INVALID_LISTING_COMMERCE");
    const proof = await readHistoricalListingReceipt(body.checkoutId, body.paymentReference, listing.websiteUrl);
    const result = await rpc("cms_admin_listing_payment", { ...args, p_action: "attach", p_proof: {
      ...proof, websiteUrl: listing.websiteUrl, paymentReference: body.paymentReference, reviewNote: body.reviewNote.trim(),
    } });
    if (result.error?.code === "23505") throw new AccountApiError(409,"CMS_RECEIPT_ALREADY_USED");
    requireCmsRpcSuccess(result.error);
    res.status(200).json(result.data);
  } catch (cause) {
    const error = cause instanceof AccountApiError ? cause : new AccountApiError(503, "CMS_COMMERCE_UNAVAILABLE");
    res.status(error.status).json({ error: { code: error.code } });
  }
}
