import { AccountApiError, getAccountServiceClient, requireAccount } from "./_account-auth.js";
import { readAccountBody } from "./_account-body.js";
import { cmsActorArgs, readPublisherDraft, requireCmsRpcSuccess } from "./_cms-store.js";
import { validateProductDraft } from "../src/lib/publisherCatalog.js";
import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";

export const config = { api: { bodyParser: false } };
const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", "GET, POST, DELETE");
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
    const args = { ...cmsActorArgs(actor), p_tool: toolId };
    const client = getAccountServiceClient();
    if (req.method === "GET") {
      const { data, error } = await client.rpc("cms_list_tool_submissions", args);
      requireCmsRpcSuccess(error);
      if (!Array.isArray(data)) throw new AccountApiError(503, "CMS_WORKSPACE_UNAVAILABLE");
      res.status(200).json({ submissions: data });
      return;
    }

    if (req.method === "DELETE") {
      const id = req.query.id;
      if (typeof id !== "string" || !uuid.test(id)) throw new AccountApiError(400, "INVALID_PUBLISHER_DRAFT");
      const { data, error } = await client.rpc("cms_withdraw_tool_submission", { ...args, p_id: id });
      requireCmsRpcSuccess(error);
      res.status(200).json({ submission: data });
      return;
    }

    const body = await readAccountBody(req, 2048, "INVALID_PUBLISHER_DRAFT");
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AccountApiError(400, "INVALID_PUBLISHER_DRAFT");
    const { brandId, version } = body as Record<string, unknown>;
    if (Object.keys(body).length !== 2 || typeof brandId !== "string" || !uuid.test(brandId)
      || typeof version !== "number" || !Number.isSafeInteger(version) || version < 1) {
      throw new AccountApiError(400, "INVALID_PUBLISHER_DRAFT");
    }
    const snapshot = await readPublisherDraft(actor, toolId);
    if (!snapshot.canEdit) throw new AccountApiError(403, "CMS_ACCESS_DENIED");
    if (snapshot.brandId !== brandId || version > snapshot.version) {
      throw new AccountApiError(409, "CMS_REVISION_CONFLICT");
    }
    if (version === snapshot.version) {
      const issues = validateProductDraft(snapshot.value, { phase: "submit", purpose: "update" });
      if (issues.length) {
        res.status(400).json({ error: { code: "INVALID_PUBLISHER_DRAFT", issues } });
        return;
      }
    }
    // Older versions can only replay an existing submission. SQL checks both
    // assignment and current draft version before it creates any new row.
    const { data, error } = await client.rpc("cms_submit_tool_draft", {
      ...args, p_expected_brand: brandId, p_expected_version: version,
    });
    requireCmsRpcSuccess(error);
    if (!data) throw new AccountApiError(503, "CMS_WORKSPACE_UNAVAILABLE");
    res.status(200).json({ submission: data });
  } catch (cause) {
    const error = cause instanceof AccountApiError ? cause : new AccountApiError(503, "CMS_WORKSPACE_UNAVAILABLE");
    res.status(error.status).json({ error: { code: error.code } });
  }
}
