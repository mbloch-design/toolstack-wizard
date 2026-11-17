import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";
import { AccountApiError, requireAccount } from "./_account-auth.js";
import { readAccountBody } from "./_account-body.js";
import { asObject, listingUuid } from "./_cms-commercial-creem.js";
import { requireListingCommerceEnabled, runListingCommerce, type CommerceAction } from "./_cms-commercial.js";

export const config = { api: { bodyParser: false } };
const actions = new Set(["status", "start", "reconcile", "checkBadge", "requestHistoricalReview"]);

export function parseListingCommerce(input: unknown) {
  const body = asObject(input);
  const { action, listingId, badgeUrl } = body;
  if (Object.keys(body).some((key) => !["action", "listingId", "badgeUrl"].includes(key))
    || !listingUuid(listingId) || typeof action !== "string" || !actions.has(action)
    || (Object.hasOwn(body, "badgeUrl") && (action !== "checkBadge" || typeof badgeUrl !== "string" || badgeUrl.length > 2048))) {
    throw new AccountApiError(400, "INVALID_LISTING_COMMERCE");
  }
  return { action: action as CommerceAction, listingId, badgeUrl: badgeUrl as string | undefined };
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
    const actor = await requireAccount(req);
    if (!actor.emailConfirmed) throw new AccountApiError(403, "CMS_ACCESS_DENIED");
    const input = parseListingCommerce(await readAccountBody(req, 4096, "INVALID_LISTING_COMMERCE"));
    res.status(200).json(await runListingCommerce(actor, input.listingId, input.action, input.badgeUrl));
  } catch (cause) {
    const error = cause instanceof AccountApiError ? cause : new AccountApiError(503, "CMS_COMMERCE_UNAVAILABLE");
    res.status(error.status).json({ error: { code: error.code } });
  }
}
