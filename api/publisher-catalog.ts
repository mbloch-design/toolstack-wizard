import { AccountApiError, requireAccount } from "./_account-auth.js";
import { readAccountBody } from "./_account-body.js";
import { readPublisherDraft, savePublisherDraft } from "./_cms-store.js";
import { assertProductPatchAllowed, PublisherDraftError } from "../src/lib/publisherFieldPolicy.js";
import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";

export const config = { api: { bodyParser: false } };

const editablePaths = [
  "name", "websiteUrl", "plans.$order", "plans.*.archived",
  "plans.*.options.$order", "plans.*.options.$remove",
  ...["type", "amount", "currency", "period", "unit", "commitment", "tax",
    "market", "offerLocale", "sourceUrl", "observedOn"].map((key) => "plans.*.options.*." + key),
  "media.$order", "media.$remove", "media.*.role",
  "classificationProposals.$add", "classificationProposals.$remove", "classificationProposals.*.values",
  "integrations.$add", "integrations.$remove", "integrations.$order", "integrations.*.relatedToolId",
  "integrations.*.type", "integrations.*.sourceUrl",
  ...["fr", "en"].flatMap((lang) => [
    ...["shortDescription", "productDescription"].map((key) => `localized.${lang}.${key}`),
    ...["features", "useCases"].flatMap((key) =>
      ["$add", "$remove", "$order", "*.text"].map((action) => `localized.${lang}.${key}.${action}`)),
    ...["name", "highlights", "summary"].map((key) => `plans.*.localized.${lang}.${key}`),
    `media.*.alt.${lang}`, `media.*.caption.${lang}`,
  ]),
];

function parseSaveBody(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AccountApiError(400, "INVALID_PUBLISHER_DRAFT");
  }
  const input = body as Record<string, unknown>;
  if (Object.keys(input).length !== 3 || !["brandId", "version", "value"].every((key) => Object.hasOwn(input, key))
    || typeof input.brandId !== "string" || typeof input.version !== "number"
    || !Number.isSafeInteger(input.version) || input.version < 1) {
    throw new AccountApiError(400, "INVALID_PUBLISHER_DRAFT");
  }
  return { brandId: input.brandId, version: input.version, value: input.value };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "PUT") {
    res.setHeader("Allow", "GET, PUT");
    res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED" } });
    return;
  }
  try {
    const actor = await requireAccount(req);
    if (!actor.emailConfirmed) throw new AccountApiError(403, "CMS_ACCESS_DENIED");
    const toolId = req.query.tool;
    if (typeof toolId !== "string" || !toolId.trim() || toolId.length > 200) {
      throw new AccountApiError(400, "INVALID_TOOL_ID");
    }
    const snapshot = await readPublisherDraft(actor, toolId);
    if (req.method === "GET") {
      res.status(200).json({ draft: snapshot });
      return;
    }
    if (!snapshot.canEdit) throw new AccountApiError(403, "CMS_ACCESS_DENIED");
    const input = parseSaveBody(await readAccountBody(req, 524288, "INVALID_PUBLISHER_DRAFT"));
    if (input.brandId !== snapshot.brandId || input.version !== snapshot.version) {
      throw new AccountApiError(409, "CMS_REVISION_CONFLICT");
    }
    const value = assertProductPatchAllowed(snapshot.value, input.value, {
      canRead: true, canEditFacts: true, canUpload: false, canSubmit: false,
      canReview: false, canPublish: false, editablePaths,
    });
    const draft = await savePublisherDraft(actor, toolId, snapshot, value);
    res.status(200).json({ draft });
  } catch (cause) {
    if (cause instanceof PublisherDraftError) {
      res.status(400).json({ error: { code: cause.message, issues: cause.issues } });
      return;
    }
    const error = cause instanceof AccountApiError ? cause : new AccountApiError(503, "CMS_WORKSPACE_UNAVAILABLE");
    res.status(error.status).json({ error: { code: error.code } });
  }
}
