import { AccountApiError, requireAccount } from "./_account-auth.js";
import { readAccountBody } from "./_account-body.js";
import { requirePublisherCmsEnabled } from "./_cms-store.js";
import { callListingInitialReview, invalidListing, listingBody, listingFieldsOnly, listingUuid } from "./_cms-listing-requests.js";
import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";

export const config = { api: { bodyParser: false } };

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED" } });
    return;
  }
  try {
    requirePublisherCmsEnabled();
    const actor = await requireAccount(req);
    if (!actor.emailConfirmed) throw new AccountApiError(403, "CMS_ACCESS_DENIED");
    if (req.method === "GET") {
      if (!listingUuid(req.query.id)) throw invalidListing();
      res.status(200).json(await callListingInitialReview(actor, "ownerRead", { id: req.query.id }));
      return;
    }

    const input = listingBody(await readAccountBody(req, 16000, "INVALID_LISTING_REQUEST"));
    listingFieldsOnly(input, ["action", "id", "version", "productRevisionId", "hash", "decision", "note"]);
    const { action, id, version, productRevisionId, hash, decision, note } = input;
    if (action !== "respondFactualReview" || !listingUuid(id) || !listingUuid(productRevisionId)
      || typeof version !== "number" || !Number.isSafeInteger(version) || version < 1
      || typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash)
      || (decision !== "confirm" && decision !== "requestChanges")
      || typeof note !== "string" || note.trim().length > 2000 || (decision === "requestChanges" && !note.trim())) {
      throw invalidListing();
    }
    res.status(200).json(await callListingInitialReview(actor, action, {
      id, version, productRevisionId, hash, decision, note: note.trim(),
    }));
  } catch (cause) {
    const error = cause instanceof AccountApiError ? cause : new AccountApiError(503, "CMS_LISTING_UNAVAILABLE");
    res.status(error.status).json({ error: { code: error.code } });
  }
}
