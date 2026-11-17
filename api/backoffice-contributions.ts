import { AccountApiError, getAccountServiceClient, requireAccount } from "./_account-auth.js";
import { readAccountBody } from "./_account-body.js";
import { cmsActorArgs, requireCmsRpcSuccess } from "./_cms-store.js";
import { catalogHash } from "./_backoffice-catalog-contract.js";
import { cancelPreparedRelease, deliverPublisherRelease, verifyPublisherRelease } from "./_cms-delivery.js";
import { readCatalog } from "./_backoffice-catalog-github.js";
import { preparePublisherRelease } from "./_cms-prepare-release.js";
import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";

export const config = { api: { bodyParser: false } };
const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED" } });
    return;
  }
  try {
    const actor = await requireAccount(req);
    const allowed = (process.env.BACKOFFICE_ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase());
    if (!actor.email || !allowed.includes(actor.email.trim().toLowerCase())) {
      throw new AccountApiError(403, "CMS_ACCESS_DENIED");
    }
    const args = cmsActorArgs(actor);
    const id = req.query.id;
    if (id !== undefined && (typeof id !== "string" || !uuid.test(id))) throw new AccountApiError(400, "INVALID_CMS_REVIEW");
    const client = getAccountServiceClient();
    if (req.method === "GET" && req.query.mode === "release-history") {
      const { data, error } = await client.rpc("cms_list_release_batches", args);
      requireCmsRpcSuccess(error);
      res.status(200).json({ history: data, canDeliver: process.env.PUBLISHER_CMS_ENABLED === "true" });
      return;
    }
    if (req.method === "GET" && req.query.mode === "release-preview") {
      const { manifest, blocked, source } = await preparePublisherRelease(actor);
      const publishedIds = new Set(source.tools.map((tool) => tool.id));
      const newToolIds = manifest.items.filter((item) => !publishedIds.has(item.toolId)).map((item) => item.toolId);
      res.status(200).json({ manifest, blocked, batchKey: catalogHash(manifest),
        newToolIds, canDeliver: process.env.PUBLISHER_CMS_ENABLED === "true" });
      return;
    }
    if (req.method === "GET") {
      const { data, error } = await client.rpc("cms_read_review_queue", { ...args, p_id: id });
      requireCmsRpcSuccess(error);
      if (!id) {
        res.status(200).json({ submissions: data });
        return;
      }
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new AccountApiError(404, "CMS_SUBMISSION_NOT_FOUND");
      }
      const source = await readCatalog();
      const current = source.tools.find(({ id }) => id === data.toolId);
      if (!current) throw new AccountApiError(409, "CMS_RELEASE_BASE_REQUIRED");
      const value = data.value;
      const hasMedia = value && typeof value === "object" && !Array.isArray(value)
        && Array.isArray(value.media) && value.media.length > 0;
      let media: { assetId: string; url: string }[] = [];
      if (hasMedia) {
        const result = await client.rpc("cms_review_submission_media", { ...args, p_id: id });
        requireCmsRpcSuccess(result.error);
        if (!Array.isArray(result.data)) throw new AccountApiError(503, "CMS_MEDIA_UNAVAILABLE");
        media = await Promise.all(result.data.map(async (item) => {
          if (!item || typeof item !== "object" || Array.isArray(item) || typeof item.assetId !== "string"
            || typeof item.path !== "string" || !/^derived\/[a-f0-9-]{36}\/[a-f0-9]{64}\.webp$/.test(item.path)) {
            throw new AccountApiError(503, "CMS_MEDIA_UNAVAILABLE");
          }
          const signed = await client.storage.from("catalog-drafts").createSignedUrl(item.path, 60);
          if (signed.error || !signed.data?.signedUrl) throw new AccountApiError(503, "CMS_MEDIA_UNAVAILABLE");
          return { assetId: item.assetId, url: signed.data.signedUrl };
        }));
      }
      res.status(200).json({
        submission: data,
        media,
        published: {
          name: current.name, slug: current.slug,
          websiteUrl: current.websiteUrl ?? null,
          shortDescription: current.shortDescription ?? null,
          shortDescriptionEn: current.shortDescriptionEn ?? null,
        },
      });
      return;
    }
    if (req.query.mode === "publish-release" || req.query.mode === "verify-release" || req.query.mode === "cancel-release") {
      if (process.env.PUBLISHER_CMS_ENABLED !== "true") throw new AccountApiError(503, "CMS_RELEASE_DISABLED");
      const body = await readAccountBody(req, 2048, "INVALID_CMS_RELEASE");
      const batchKey = body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>).batchKey : null;
      if (typeof batchKey !== "string" || !/^[a-f0-9]{64}$/.test(batchKey)) {
        throw new AccountApiError(400, "INVALID_CMS_RELEASE");
      }
      if (req.query.mode === "publish-release") {
        res.status(200).json(await deliverPublisherRelease(actor, batchKey));
      } else if (req.query.mode === "cancel-release") {
        res.status(200).json({ release: await cancelPreparedRelease(actor, batchKey) });
      } else {
        res.status(200).json({ release: await verifyPublisherRelease(actor, batchKey) });
      }
      return;
    }
    const body = await readAccountBody(req, 12000, "INVALID_CMS_REVIEW");
    if (!body || typeof body !== "object" || Array.isArray(body) || !id) throw new AccountApiError(400, "INVALID_CMS_REVIEW");
    const { status, note } = body as Record<string, unknown>;
    if (Object.keys(body).length !== 2 || typeof status !== "string" || !["approved", "changes_requested", "rejected", "cancel_approval"].includes(status)
      || typeof note !== "string" || note.length > 2000) throw new AccountApiError(400, "INVALID_CMS_REVIEW");
    const { data, error } = await client.rpc("cms_review_tool_submission", {
      ...args, p_id: id, p_action: status, p_note: note.trim(),
    });
    requireCmsRpcSuccess(error);
    res.status(200).json({ submission: data });
  } catch (cause) {
    const error = cause instanceof AccountApiError ? cause : new AccountApiError(503, "CMS_WORKSPACE_UNAVAILABLE");
    res.status(error.status).json({ error: { code: error.code } });
  }
}
