import { randomUUID } from "node:crypto";
import { AccountApiError, getAccountServiceClient, requireAccount } from "./_account-auth.js";
import { readAccountBody } from "./_account-body.js";
import { cmsActorArgs, readPublisherDraft, requireCmsRpcSuccess, savePublisherDraft } from "./_cms-store.js";
import { parseProductDraft, type ProductDraft } from "../src/lib/publisherCatalog.js";
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

function parseAllocationBody(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AccountApiError(400, "INVALID_PUBLISHER_DRAFT");
  }
  const { action, planId, ...revision } = body as Record<string, unknown>;
  if (action !== "addPlan" && action !== "addPriceOption") {
    throw new AccountApiError(400, "INVALID_PUBLISHER_DRAFT");
  }
  if (action === "addPlan" ? planId !== undefined : typeof planId !== "string" || !planId) {
    throw new AccountApiError(400, "INVALID_PUBLISHER_DRAFT");
  }
  const input = parseSaveBody({ ...revision, value: null });
  return { brandId: input.brandId, version: input.version, action, planId };
}

function allocateOfferIdentity(base: ProductDraft, input: ReturnType<typeof parseAllocationBody>) {
  const value = structuredClone(base);
  const id = randomUUID();
  if (input.action === "addPlan") {
    value.plans.push({
      id, planKey: "offer-" + id, archived: false,
      localized: {
        fr: { name: "", summary: null, highlights: [] },
        en: { name: "", summary: null, highlights: [] },
      }, options: [],
    });
  } else {
    const plan = value.plans.find((row) => row.id === input.planId && !row.archived);
    if (!plan) throw new AccountApiError(404, "CMS_PLAN_NOT_FOUND");
    plan.options.push({
      id, type: "unknown", amount: null, currency: null, period: null, unit: null,
      commitment: null, tax: "unknown", market: null, offerLocale: null,
      sourceUrl: null, observedOn: null,
    });
  }
  const { draft, issues } = parseProductDraft(value, { phase: "draft", purpose: "update" });
  if (!draft) throw new PublisherDraftError(issues);
  return draft;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "PUT" && req.method !== "PATCH") {
    res.setHeader("Allow", "GET, PUT, PATCH");
    res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED" } });
    return;
  }
  try {
    const actor = await requireAccount(req);
    if (!actor.emailConfirmed) throw new AccountApiError(403, "CMS_ACCESS_DENIED");
    const toolId = req.query.tool;
    if (req.method === "GET" && toolId === undefined) {
      const { data, error } = await getAccountServiceClient().rpc("cms_list_tool_drafts", cmsActorArgs(actor));
      requireCmsRpcSuccess(error);
      if (!Array.isArray(data)) throw new AccountApiError(503, "CMS_WORKSPACE_UNAVAILABLE");
      res.status(200).json({ tools: data });
      return;
    }
    if (typeof toolId !== "string" || !toolId.trim() || toolId.length > 200) {
      throw new AccountApiError(400, "INVALID_TOOL_ID");
    }
    const snapshot = await readPublisherDraft(actor, toolId);
    if (req.method === "GET") {
      res.status(200).json({ draft: snapshot });
      return;
    }
    if (!snapshot.canEdit) throw new AccountApiError(403, "CMS_ACCESS_DENIED");
    if (req.method === "PATCH") {
      const input = parseAllocationBody(await readAccountBody(req, 2048, "INVALID_PUBLISHER_DRAFT"));
      if (input.brandId !== snapshot.brandId || input.version !== snapshot.version) {
        throw new AccountApiError(409, "CMS_REVISION_CONFLICT");
      }
      const draft = await savePublisherDraft(actor, toolId, snapshot, allocateOfferIdentity(snapshot.value, input));
      res.status(200).json({ draft });
      return;
    }
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
