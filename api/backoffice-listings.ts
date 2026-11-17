import { randomBytes } from "node:crypto";
import { AccountApiError, requireAccount } from "./_account-auth.js";
import { readAccountBody } from "./_account-body.js";
import { catalogHash } from "./_backoffice-catalog-contract.js";
import { readCatalog } from "./_backoffice-catalog-github.js";
import {
  callAdminListing, invalidListing, invitationDigest, listingBody, listingFieldsOnly, listingUuid, readListingBrand,
} from "./_cms-listing-requests.js";
import type { CatalogTool } from "../src/lib/backofficeCatalog.js";
import { parseProductDraft } from "../src/lib/publisherCatalog.js";
import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";

export const config = { api: { bodyParser: false } };

const roles = new Set(["owner", "admin", "editor", "viewer"]);

function draftFromPublished(tool: CatalogTool) {
  const exactText = (value: unknown) => typeof value === "string" ? value : null;
  const websiteUrl = typeof tool.websiteUrl === "string" ? tool.websiteUrl : "";
  const { draft } = parseProductDraft({
    schemaVersion: 1,
    name: tool.name,
    websiteUrl,
    localized: {
      fr: {
        shortDescription: exactText(tool.shortDescription), productDescription: exactText(tool.productDescription),
        features: [], useCases: [],
      },
      en: {
        shortDescription: exactText(tool.shortDescriptionEn), productDescription: exactText(tool.productDescriptionEn),
        features: [], useCases: [],
      },
    },
    plans: [], media: [], classificationProposals: [], integrations: [],
  }, { phase: "draft", purpose: "update" });
  if (!draft || websiteUrl.length > 500) throw new AccountApiError(409, "LISTING_SOURCE_RECONCILIATION_REQUIRED");
  return draft;
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
      res.status(200).json(await callAdminListing(actor, "list"));
      return;
    }

    const input = listingBody(await readAccountBody(req, 8192, "INVALID_LISTING_REQUEST"));
    if (input.action === "revokeInvitation") {
      listingFieldsOnly(input, ["action", "id"]);
      if (!listingUuid(input.id)) throw invalidListing();
      res.status(200).json(await callAdminListing(actor, input.action, { id: input.id }));
      return;
    }
    if (input.action !== "invite") throw invalidListing();
    listingFieldsOnly(input, ["action", "ownerId", "toolId", "role", "brandId", "brandName", "brandDomain"]);
    const { ownerId, toolId, role } = input;
    if (!listingUuid(ownerId) || typeof toolId !== "string" || toolId.length < 1 || toolId.length > 200
      || typeof role !== "string" || !roles.has(role)) throw invalidListing();
    const brand = readListingBrand(input, role);

    const { claim } = await callAdminListing(actor, "inspectClaim", { ownerId, toolId });
    if (!claim || typeof claim !== "object" || Array.isArray(claim) || claim.toolId !== toolId || typeof claim.slug !== "string") {
      throw new AccountApiError(503, "CMS_LISTING_UNAVAILABLE");
    }
    const source = await readCatalog();
    const tool = source.tools.find((candidate) => candidate.id === toolId);
    if (!tool || tool.slug !== claim.slug) throw new AccountApiError(409, "LISTING_ATTRIBUTION_CONFLICT");

    const token = randomBytes(32).toString("base64url");
    const { invitation } = await callAdminListing(actor, "invite", {
      ownerId, toolId, slug: tool.slug, role, ...brand,
      digest: invitationDigest(token), sourceSha: source.headSha, baseHash: catalogHash(tool), draft: draftFromPublished(tool),
    });
    if (!invitation || typeof invitation !== "object" || Array.isArray(invitation)) {
      throw new AccountApiError(503, "CMS_LISTING_UNAVAILABLE");
    }
    res.status(200).json({ invitation: { ...invitation, token } });
  } catch (cause) {
    const error = cause instanceof AccountApiError ? cause : new AccountApiError(503, "CMS_LISTING_UNAVAILABLE");
    res.status(error.status).json({ error: { code: error.code } });
  }
}
