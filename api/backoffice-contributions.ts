import { AccountApiError, getAccountServiceClient, requireAccount } from "./_account-auth.js";
import { readAccountBody } from "./_account-body.js";
import { cmsActorArgs, requireCmsRpcSuccess } from "./_cms-store.js";
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
    if (req.method === "GET" && req.query.mode === "release-preview") {
      const { manifest } = await preparePublisherRelease(actor);
      res.status(200).json({ manifest });
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
      res.status(200).json({
        submission: data,
        published: {
          name: current.name, slug: current.slug,
          websiteUrl: current.websiteUrl ?? null,
          shortDescription: current.shortDescription ?? null,
          shortDescriptionEn: current.shortDescriptionEn ?? null,
        },
      });
      return;
    }
    const body = await readAccountBody(req, 12000, "INVALID_CMS_REVIEW");
    if (!body || typeof body !== "object" || Array.isArray(body) || !id) throw new AccountApiError(400, "INVALID_CMS_REVIEW");
    const { status, note } = body as Record<string, unknown>;
    if (Object.keys(body).length !== 2 || typeof status !== "string" || !["approved", "changes_requested", "rejected"].includes(status)
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
