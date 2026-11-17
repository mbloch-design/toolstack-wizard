import { AccountApiError, getAccountServiceClient } from "./_account-auth.js";
import { catalogValidationIssues } from "../src/lib/catalogValidation.js";
import { getCatalogSnapshot } from "./_backoffice-catalog-store.js";
import { readCatalog } from "./_backoffice-catalog-github.js";
import { cmsActorArgs, requireCmsRpcSuccess, type CmsActor } from "./_cms-store.js";
import { assembleCmsRelease, projectPublisherFacts } from "./_cms-release.js";
import { parseProductDraft } from "../src/lib/publisherCatalog.js";

export async function preparePublisherRelease(actor: CmsActor) {
  const { data, error } = await getAccountServiceClient().rpc("cms_approved_release_inputs", cmsActorArgs(actor));
  requireCmsRpcSuccess(error);
  if (!Array.isArray(data)) throw new AccountApiError(503, "CMS_WORKSPACE_UNAVAILABLE");
  const [source, legacy] = await Promise.all([readCatalog(), getCatalogSnapshot()]);
  const toolsById = new Map(source.tools.map((tool) => [tool.id, tool]));
  const attachedToolIds: string[] = [];
  const changes = data.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)
      || typeof entry.approvalId !== "string" || typeof entry.toolId !== "string"
      || typeof entry.version !== "number") {
      throw new AccountApiError(503, "CMS_WORKSPACE_UNAVAILABLE");
    }
    if (entry.attached !== true) throw new AccountApiError(409, "CMS_TOOL_NOT_ATTACHED");
    const base = toolsById.get(entry.toolId);
    if (!base || typeof entry.baseHash !== "string") {
      throw new AccountApiError(409, "CMS_RELEASE_BASE_REQUIRED");
    }
    const { draft } = parseProductDraft(entry.value, { phase: "submit", purpose: "update" });
    if (!draft) throw new AccountApiError(409, "INVALID_PUBLISHER_DRAFT");
    attachedToolIds.push(entry.toolId);
    return {
      approvalId: entry.approvalId, version: entry.version, toolId: entry.toolId, baseHash: entry.baseHash,
      tool: projectPublisherFacts(base, draft),
    };
  });
  const legacyDrafts = legacy.drafts.map(({ value, base, baseHash, version }) => {
    if (catalogValidationIssues(base, value).some((issue) => issue.severity === "error")) {
      throw new AccountApiError(409, "INVALID_CATALOG_TOOL");
    }
    return { tool: value, baseHash, version };
  });
  return assembleCmsRelease(source, { expectedHead: source.headSha, attachedToolIds, changes, legacyDrafts });
}
