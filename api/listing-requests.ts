import { safeParse } from "valibot";
import { productMediaSchema } from "../src/lib/publisherCatalog.js";
import { AccountApiError, requireAccount } from "./_account-auth.js";
import { readAccountBody } from "./_account-body.js";
import { requirePublisherCmsEnabled } from "./_cms-store.js";
import { runListingCommerce } from "./_cms-commercial.js";
import {
  acceptListingInvitation, callListing, checkAvailablePublicIdentity, findPublicCandidates, invalidListing,
  listingUuid, parseIdentity, readPublicClaimTarget,
} from "./_cms-listing-requests.js";
import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";

export const config = { api: { bodyParser: false } };

const fieldNames: Record<string, readonly string[]> = {
  lookup: ["name", "websiteUrl"],
  create: ["name", "websiteUrl", "offer", "locale", "idempotencyKey"],
  claimExisting: ["toolId"],
  acceptInvitation: ["token"],
  save: ["id", "version", "representativeRole", "notes", "media"],
  submit: ["id", "version"],
  withdraw: ["id", "version"],
};

function readListingId(value: unknown) {
  if (!listingUuid(value)) throw invalidListing();
  return value;
}

function readMutation(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw invalidListing();
  const input = body as Record<string, unknown>;
  const { action } = input;
  if (typeof action !== "string" || !Object.prototype.hasOwnProperty.call(fieldNames, action)
    || Object.keys(input).some((key) => key !== "action" && !fieldNames[action].includes(key))) {
    throw invalidListing();
  }
  return { action, input };
}

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
      const id = req.query.id;
      const result = id === undefined
        ? await callListing(actor, "list")
        : await callListing(actor, "read", { id: readListingId(id) });
      res.status(200).json(result);
      return;
    }

    const { action, input } = readMutation(await readAccountBody(req, 16384, "INVALID_LISTING_REQUEST"));
    if (action === "lookup") {
      const identity = parseIdentity(input);
      const result = await callListing(actor, "lookup", { hostname: identity.hostname });
      if (!Array.isArray(result.candidates)) throw new AccountApiError(503, "CMS_LISTING_UNAVAILABLE");
      res.status(200).json({ candidates: [...findPublicCandidates(identity), ...result.candidates] });
      return;
    }
    if (action === "create") {
      const identity = parseIdentity(input);
      const { offer, idempotencyKey, locale = "en" } = input;
      if ((offer !== "standard_badge" && offer !== "priority_paid")
        || (locale !== "en" && locale !== "fr")
        || typeof idempotencyKey !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(idempotencyKey)) {
        throw invalidListing();
      }
      checkAvailablePublicIdentity(identity);
      res.status(200).json(await callListing(actor, action, { ...identity, offer, locale, idempotencyKey }));
      return;
    }
    if (action === "claimExisting") {
      res.status(200).json(await callListing(actor, action, readPublicClaimTarget(input.toolId)));
      return;
    }

    if (action === "acceptInvitation") {
      res.status(200).json(await acceptListingInvitation(actor, input.token));
      return;
    }

    const id = readListingId(input.id);
    const { version } = input;
    if (typeof version !== "number" || !Number.isSafeInteger(version) || version < 1) throw invalidListing();
    if (action === "save") {
      const { representativeRole, notes } = input;
      if (typeof representativeRole !== "string" || representativeRole.trim().length > 120
        || typeof notes !== "string" || notes.trim().length > 3000) throw invalidListing();
      let media;
      if (input.media !== undefined) {
        const parsed = safeParse(productMediaSchema, input.media);
        if (!parsed.success) throw invalidListing();
        media = parsed.output;
      }
      res.status(200).json(await callListing(actor, action, {
        id, version, representativeRole: representativeRole.trim(), notes: notes.trim(),
        ...(media && { media }),
      }));
      return;
    }
    if (action === "submit") {
      const { listing } = await callListing(actor, "read", { id });
      if (!listing || typeof listing !== "object" || Array.isArray(listing)) {
        throw new AccountApiError(503, "CMS_LISTING_UNAVAILABLE");
      }
      if (listing.version !== version) throw new AccountApiError(409, "LISTING_REVISION_CONFLICT");
      if (listing.status !== "draft" && listing.status !== "changes_requested") {
        throw new AccountApiError(409, "LISTING_NOT_EDITABLE");
      }
      if (listing.commercialStatus !== "satisfied" || !listing.representativeRole) {
        throw new AccountApiError(409, "LISTING_REQUIREMENTS_PENDING");
      }
      if (listing.offer === "standard_badge") {
        const checked = await runListingCommerce(actor, id, "checkBadge");
        if (checked.state !== "present") throw new AccountApiError(409, "LISTING_REQUIREMENTS_PENDING");
      }
      res.status(200).json(await callListing(actor, action, { id, version }));
      return;
    }
    if (action === "withdraw") {
      res.status(200).json(await callListing(actor, action, { id, version }));
      return;
    }
    throw invalidListing();
  } catch (cause) {
    const error = cause instanceof AccountApiError ? cause : new AccountApiError(503, "CMS_LISTING_UNAVAILABLE");
    res.status(error.status).json({ error: { code: error.code } });
  }
}
