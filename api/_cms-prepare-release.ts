import { AccountApiError, getAccountServiceClient } from "./_account-auth.js";
import { catalogValidationIssues } from "../src/lib/catalogValidation.js";
import { getCatalogSnapshot } from "./_backoffice-catalog-store.js";
import { readCatalog } from "./_backoffice-catalog-github.js";
import { cmsActorArgs, requireCmsRpcSuccess, type CmsActor } from "./_cms-store.js";
import { assembleCmsRelease, projectPublisherFacts } from "./_cms-release.js";
import type { CatalogTool } from "../src/lib/backofficeCatalog.js";
import { verifyBadgeOnPage } from "./_badge-verification.js";
import { materializePublisherMedia } from "./_catalog-media.js";
import { cmsCreemMode } from "./_cms-commercial-creem.js";
import { pinnedBadgeTransport } from "./_cms-commercial-badge.js";
import { parseProductDraft } from "../src/lib/publisherCatalog.js";

export async function preparePublisherRelease(actor: CmsActor, verifyCommercial = false) {
  const client = getAccountServiceClient();
  const args = cmsActorArgs(actor);
  const [{ data, error }, protectedResult, initialResult] = await Promise.all([
    client.rpc("cms_approved_release_inputs", args),
    client.rpc("cms_protected_tool_ids", args),
    client.rpc("cms_initial_release_inputs", args),
  ]);
  requireCmsRpcSuccess(protectedResult.error);
  requireCmsRpcSuccess(initialResult.error);
  requireCmsRpcSuccess(error);
  if (!Array.isArray(data) || !Array.isArray(initialResult.data)) throw new AccountApiError(503, "CMS_WORKSPACE_UNAVAILABLE");
  const [source, legacy] = await Promise.all([readCatalog(), getCatalogSnapshot()]);
  const toolsById = new Map(source.tools.map((tool) => [tool.id, tool]));
  if (!Array.isArray(protectedResult.data) || !protectedResult.data.every((id) => typeof id === "string")) {
    throw new AccountApiError(503, "CMS_WORKSPACE_UNAVAILABLE");
  }
  const attachedToolIds = protectedResult.data as string[];
  const blocked: { toolId: string; approvalId: string }[] = [];
  const all = [...data, ...initialResult.data].filter((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return true;
    const commercial = entry.commercialEvidence;
    const mixedMode = commercial && typeof commercial === "object" && !Array.isArray(commercial)
      && commercial.type === "priority_paid" && commercial.mode !== cmsCreemMode();
    if ((entry.attached === false || mixedMode) && typeof entry.toolId === "string" && typeof entry.approvalId === "string") {
      blocked.push({ toolId: entry.toolId, approvalId: entry.approvalId });
      return false;
    }
    return true;
  });
  const changes = await Promise.all(all.map(async (entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)
      || typeof entry.approvalId !== "string" || typeof entry.toolId !== "string"
      || typeof entry.version !== "number") {
      throw new AccountApiError(503, "CMS_WORKSPACE_UNAVAILABLE");
    }
    if (entry.attached !== true) throw new AccountApiError(409, "CMS_TOOL_NOT_ATTACHED");
    const initial = entry.baseHash === null && entry.base && typeof entry.base === "object" && !Array.isArray(entry.base);
    const base = initial ? entry.base as CatalogTool : toolsById.get(entry.toolId);
    if (!base || base.id !== entry.toolId || typeof base.slug !== "string" || typeof base.name !== "string"
      || (!initial && typeof entry.baseHash !== "string")) {
      throw new AccountApiError(409, "CMS_RELEASE_BASE_REQUIRED");
    }
    if (initial && verifyCommercial && entry.commercialEvidence && typeof entry.commercialEvidence === "object"
      && !Array.isArray(entry.commercialEvidence) && entry.commercialEvidence.type === "standard_badge") {
      const { badgeUrl, websiteUrl } = entry.commercialEvidence;
      if (typeof badgeUrl !== "string" || typeof websiteUrl !== "string") {
        throw new AccountApiError(409, "LISTING_REQUIREMENTS_PENDING");
      }
      try {
        await verifyBadgeOnPage(badgeUrl, websiteUrl, pinnedBadgeTransport);
      } catch {
        throw new AccountApiError(409, "LISTING_REQUIREMENTS_PENDING");
      }
    }
    const { draft } = parseProductDraft(entry.value, { phase: "submit", purpose: initial ? "initial" : "update" });
    if (!draft) throw new AccountApiError(409, "INVALID_PUBLISHER_DRAFT");
    return {
      approvalId: entry.approvalId, version: entry.version, toolId: entry.toolId, baseHash: typeof entry.baseHash === "string" ? entry.baseHash : null,
      draft, initial: Boolean(initial), tool: projectPublisherFacts(base, draft),
    };
  }));
  const legacyDrafts = legacy.drafts.map(({ value, base, baseHash, version }) => {
    if (catalogValidationIssues(base, value).some((issue) => issue.severity === "error")) {
      throw new AccountApiError(409, "INVALID_CATALOG_TOOL");
    }
    return { tool: value, baseHash, version };
  });
  const approvalIds = changes.filter(({ draft }) => draft.media.length > 0).map(({ approvalId }) => approvalId);
  const assets = await materializePublisherMedia(actor, approvalIds);
  for (const change of changes) {
    const media = assets.filter((asset) => asset.approvalId === change.approvalId && asset.toolId === change.toolId);
    const isCmsImage = (candidate: unknown) => typeof candidate === "string" && candidate.startsWith("/tool-media/cms/");
    if (isCmsImage(change.tool.logo)) delete change.tool.logo;
    if (isCmsImage(change.tool.ogImageUrl)) delete change.tool.ogImageUrl;
    if (Array.isArray(change.tool.galleryImages)) {
      change.tool.galleryImages = change.tool.galleryImages.filter((image) => !isCmsImage(image));
    }
    delete change.tool.publisherMediaAlts;
    const alternateText: { url: string; fr: string; en: string }[] = [];
    for (const ref of change.draft.media) {
      const asset = media.find((item) => item.assetId === ref.assetId && item.role === ref.role);
      if (!asset) throw new AccountApiError(409, "CMS_INVALID_MEDIA_REFERENCE");
      if (ref.role === "logo") change.tool.logo = asset.url;
      if (ref.role === "cover") change.tool.ogImageUrl = asset.url;
      if (ref.role === "gallery") {
        const current = Array.isArray(change.tool.galleryImages)
          ? change.tool.galleryImages.filter((value) => typeof value === "string" && !value.startsWith("/tool-media/cms/")) : [];
        change.tool.galleryImages = [...current, ...media.filter(({ role }) => role === "gallery").map(({ url }) => url)];
      }
      alternateText.push({ url: asset.url, fr: ref.alt.fr, en: ref.alt.en });
    }
    if (alternateText.length) change.tool.publisherMediaAlts = alternateText;
  }
  const assembled = assembleCmsRelease(source, { expectedHead: source.headSha, attachedToolIds, changes, legacyDrafts });
  return { ...assembled, blocked, source, legacyDrafts: legacy.drafts, mediaFiles: [...new Map(assets.map((item) => [item.path, { path: item.path, bytes: item.bytes }])).values()] };
}
