import categories from "../src/data/categories_index.json";
import type { Json } from "../src/integrations/supabase/types.js";
import { validateCatalogPublication } from "../src/lib/backofficeCatalog.js";
import { CatalogValidationError } from "../src/lib/catalogValidation.js";
import { parseProductDraft } from "../src/lib/publisherCatalog.js";
import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";
import { AccountApiError, requireAccount } from "./_account-auth.js";
import { readAccountBody } from "./_account-body.js";
import { catalogHash } from "./_backoffice-catalog-contract.js";
import { readCatalog } from "./_backoffice-catalog-github.js";
import { verifyBadgeOnPage } from "./_badge-verification.js";
import { pinnedBadgeTransport } from "./_cms-commercial-badge.js";
import {
  callListingInitialReview, invalidListing, listingBody, listingFieldsOnly, listingUuid, readListingBrand,
} from "./_cms-listing-requests.js";

export const config = { api: { bodyParser: false } };

const categoryIds = new Set(categories.map(({ id }) => id));
const editorialFields = [
  "longDescription", "longDescriptionEn", "verdict", "verdictEn", "pros", "prosEn", "cons", "consEn",
  "toolTrimRating", "seo",
];

function readEditorial(input: Record<string, unknown>) {
  const { category } = input;
  if (typeof category !== "string" || !categoryIds.has(category)) throw invalidListing();
  const fields = listingBody(input.fields);
  listingFieldsOnly(fields, editorialFields);
  if (typeof fields.longDescription !== "string" || !fields.longDescription.trim()
    || typeof fields.longDescriptionEn !== "string" || !fields.longDescriptionEn.trim()) throw invalidListing();
  const identity = { id: "initial-review", slug: "initial-review", name: "Initial review" };
  validateCatalogPublication(identity, { ...identity, category, ...fields });
  return { category, fields: fields as Record<string, Json>, hash: catalogHash({ category, fields }) };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED" } });
    return;
  }
  try {
    const actor = await requireAccount(req);
    if (!actor.emailConfirmed) throw new AccountApiError(403, "CMS_ACCESS_DENIED");
    if (req.method === "GET") {
      if (!listingUuid(req.query.id)) throw invalidListing();
      res.status(200).json(await callListingInitialReview(actor, "adminRead", { id: req.query.id }));
      return;
    }

    const input = listingBody(await readAccountBody(req, 524288, "INVALID_LISTING_REQUEST"));
    const { action, id, version } = input;
    if (!listingUuid(id) || typeof version !== "number" || !Number.isSafeInteger(version) || version < 1) throw invalidListing();
    const common = ["action", "id", "version"];
    const target = { id, version };
    if (action === "prepareInitial") {
      listingFieldsOnly(input, [...common, "value"]);
      const { draft } = parseProductDraft(input.value, { phase: "submit", purpose: "initial" });
      if (!draft || draft.websiteUrl.length > 500 || draft.media.length) throw invalidListing();
      res.status(200).json(await callListingInitialReview(actor, action, { ...target, value: draft, hash: catalogHash(draft) }));
      return;
    }
    if (action === "requestFactualReview") {
      listingFieldsOnly(input, [...common, "productRevisionId"]);
      if (!listingUuid(input.productRevisionId)) throw invalidListing();
      res.status(200).json(await callListingInitialReview(actor, action, { ...target, productRevisionId: input.productRevisionId }));
      return;
    }
    if (action === "approveInitialEditorial") {
      listingFieldsOnly(input, [...common, "category", "fields"]);
      res.status(200).json(await callListingInitialReview(actor, action, { ...target, ...readEditorial(input) }));
      return;
    }
    if (action !== "promoteInitial") throw invalidListing();
    listingFieldsOnly(input, [...common, "productRevisionId", "editorialRevisionId", "idempotencyKey", "brandId", "brandName", "brandDomain"]);
    const { productRevisionId, editorialRevisionId, idempotencyKey } = input;
    if (!listingUuid(productRevisionId) || !listingUuid(editorialRevisionId)
      || typeof idempotencyKey !== "string" || !/^[a-zA-Z0-9_-]{8,128}$/.test(idempotencyKey)) throw invalidListing();
    const brand = readListingBrand(input, "owner");
    const { review } = await callListingInitialReview(actor, "adminRead", { id });
    const details = listingBody(review);
    const listing = listingBody(details.listing);
    const evidence: Record<string, Json> = {};
    if (!details.approvalId) {
      if (listing.version !== version) throw new AccountApiError(409, "LISTING_REVISION_CONFLICT");
      if (listing.status !== "ready") throw new AccountApiError(409, "LISTING_REVIEW_INCOMPLETE");
      const source = await readCatalog();
      if (source.tools.some(({ slug }) => slug === listing.slug)) throw new AccountApiError(409, "LISTING_SLUG_UNAVAILABLE");
      if (listing.offer === "standard_badge") {
        if (typeof details.badgeUrl !== "string") throw new AccountApiError(409, "LISTING_REQUIREMENTS_PENDING");
        try {
          await verifyBadgeOnPage(details.badgeUrl, listing.websiteUrl, pinnedBadgeTransport);
        } catch {
          throw new AccountApiError(409, "LISTING_REQUIREMENTS_PENDING");
        }
        evidence.verifiedBadgeUrl = details.badgeUrl;
        evidence.badgeVerifiedAt = new Date().toISOString();
      }
    }
    res.status(200).json(await callListingInitialReview(actor, action, {
      ...target, productRevisionId, editorialRevisionId, idempotencyKey, ...brand, ...evidence,
    }));
  } catch (cause) {
    if (cause instanceof CatalogValidationError) {
      res.status(400).json({ error: { code: "INVALID_LISTING_EDITORIAL", issues: cause.issues } });
      return;
    }
    const error = cause instanceof AccountApiError ? cause : new AccountApiError(503, "CMS_LISTING_UNAVAILABLE");
    res.status(error.status).json({ error: { code: error.code } });
  }
}
