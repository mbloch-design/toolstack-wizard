import { catalogError, catalogHash, validSlug } from "./_backoffice-catalog-contract.js";
import type { CatalogTool } from "../src/lib/backofficeCatalog.js";
import type { PublisherPublicFacts } from "../src/lib/publisherPublicFacts.js";
import type { ProductDraft } from "../src/lib/publisherCatalog.js";
import type { CatalogSource } from "./_backoffice-catalog-github.js";

type ApprovedChange = {
  approvalId: string;
  version: number;
  toolId: string;
  baseHash: string | null;
  tool: CatalogTool;
};
type Assembly = {
  expectedHead: string;
  attachedToolIds: readonly string[];
  archivedSlugs?: readonly string[];
  changes: readonly ApprovedChange[];
  legacyDrafts?: readonly { tool: CatalogTool; baseHash: string; version: number }[];
};

/** Assemble server-approved projections against one immutable Git revision. */
export function assembleCmsRelease(
  source: Pick<CatalogSource, "headSha" | "tools">,
  { expectedHead, attachedToolIds, archivedSlugs = [], changes, legacyDrafts = [] }: Assembly,
) {
  if (source.headSha !== expectedHead) throw catalogError(409, "CMS_RELEASE_SOURCE_CHANGED");
  const allowed = new Set(attachedToolIds);
  const byId = new Map(source.tools.map((tool) => [tool.id, tool]));
  const claimedSlugs = new Set([...source.tools.map((tool) => tool.slug), ...archivedSlugs]);
  const revisions = new Set<string>();
  const updated = new Map<string, CatalogTool>();
  for (const change of changes) {
    const { approvalId, toolId, version, baseHash, tool } = change;
    if (!allowed.has(toolId)) throw catalogError(403, "CMS_TOOL_NOT_ATTACHED");
    if (updated.has(toolId) || revisions.has(approvalId)) throw catalogError(409, "CMS_RELEASE_DUPLICATE");
    if (!approvalId || !Number.isSafeInteger(version) || version < 1) throw catalogError(400, "CMS_RELEASE_INVALID");
    const current = byId.get(toolId);
    if ((current ? catalogHash(current) : null) !== baseHash) {
      throw catalogError(409, "CMS_RELEASE_SOURCE_CHANGED");
    }
    if (tool.id !== toolId || !validSlug(tool.slug) || !tool.name.trim()
      || (current ? current.slug !== tool.slug : claimedSlugs.has(tool.slug))) {
      throw catalogError(409, "CMS_RELEASE_IDENTITY_CONFLICT");
    }
    claimedSlugs.add(tool.slug);
    revisions.add(approvalId);
    updated.set(toolId, tool);
  }
  for (const { tool, baseHash, version } of legacyDrafts) {
    if (updated.has(tool.id) || allowed.has(tool.id)) throw catalogError(409, "CMS_RELEASE_DRAFT_OVERLAP");
    const current = byId.get(tool.id);
    if (!current || catalogHash(current) !== baseHash) throw catalogError(409, "CMS_RELEASE_SOURCE_CHANGED");
    if (tool.slug !== current.slug || !Number.isSafeInteger(version) || version < 1) {
      throw catalogError(409, "CMS_RELEASE_IDENTITY_CONFLICT");
    }
    updated.set(tool.id, tool);
  }
  const additions = [...updated.values()].filter((tool) => !byId.has(tool.id))
    .sort((a, b) => a.slug.localeCompare(b.slug, "en"));
  const tools = [...source.tools.map((tool) => updated.get(tool.id) ?? tool), ...additions];
  return {
    tools,
    manifest: {
      sourceHead: source.headSha,
      catalogueHash: catalogHash(tools),
      legacyItems: legacyDrafts.map(({ tool, version }) => ({
        slug: tool.slug, name: tool.name, version, hash: catalogHash(tool),
      })).sort((a, b) => a.slug.localeCompare(b.slug, "en")),
      items: changes.map(({ approvalId, version, toolId, tool }) => ({
        approvalId, version, toolId, slug: tool.slug, name: tool.name, hash: catalogHash(tool),
      })).sort((a, b) => a.toolId.localeCompare(b.toolId, "en")),
    },
  };
}

/** Factual publisher content is projected separately from independent ToolTrim evidence. */
export function projectPublisherFacts(base: CatalogTool, draft: ProductDraft): CatalogTool {
  const localized = (locale: "fr" | "en") => {
    const content = draft.localized[locale];
    return {
      shortDescription: content.shortDescription,
      productDescription: content.productDescription,
      features: content.features.map(({ text }) => text).filter((text) => text.trim()),
      useCases: content.useCases.map(({ text }) => text).filter((text) => text.trim()),
    };
  };

  return {
    ...base,
    name: draft.name.trim() || base.name,
    websiteUrl: draft.websiteUrl || base.websiteUrl,
    shortDescription: draft.localized.fr.shortDescription ?? base.shortDescription,
    shortDescriptionEn: draft.localized.en.shortDescription ?? base.shortDescriptionEn,
    publisherFacts: {
      localized: { fr: localized("fr"), en: localized("en") },
      plans: draft.plans.filter(({ archived }) => !archived).map((plan) => ({
        localized: plan.localized,
        options: plan.options.map((option) => {
          const { id: _id, ...facts } = option;
          if (option.type === "paid"
            || (option.type === "usage" && option.period === "usage" && option.amount && option.currency && option.unit)) return facts;
          return { type: option.type, market: option.market, offerLocale: option.offerLocale };
        }),
      })),
    } satisfies PublisherPublicFacts,
  };
}
