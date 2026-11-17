import { validateCatalogFieldValues } from "./catalogValidation.js";
import { cmsIssue, parseProductDraft, type CmsCapabilities, type CmsIssue, type ProductDraft } from "./publisherCatalog.js";

export class PublisherDraftError extends Error {
  constructor(readonly issues: CmsIssue[]) {
    super("INVALID_PUBLISHER_DRAFT");
  }
}

type JsonObject = Record<string, unknown>;
const record = (value: unknown): value is JsonObject =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const serverCollections = new Map([
  ["plans", "id"], ["plans.*.options", "id"], ["media", "assetId"],
]);
const localCollections = new Map([
  ["localized.fr.features", "id"], ["localized.fr.useCases", "id"],
  ["localized.en.features", "id"], ["localized.en.useCases", "id"],
  ["classificationProposals", "key"], ["integrations", "id"],
]);

const protectedLeaves = new Set(["schemaVersion", "plans.*.planKey"]);

function inspectChanges(
  base: unknown,
  next: unknown,
  path: string,
  grants: Set<string>,
  issues: CmsIssue[],
) {
  if (Object.is(base, next)) return;
  const check = (key: string) => {
    if (!grants.has(key)) issues.push(cmsIssue(key, "PATH_FORBIDDEN"));
  };
  if (Array.isArray(base) && Array.isArray(next)) {
    const serverKey = serverCollections.get(path);
    const key = serverKey ?? localCollections.get(path);
    if (!key) {
      if (base.length !== next.length || base.some((item, index) => item !== next[index])) check(path);
      return;
    }

    const previous = new Map((base as JsonObject[]).map((row) => [row[key], row]));
    const current = new Map((next as JsonObject[]).map((row) => [row[key], row]));
    for (const [id, row] of current) {
      if (previous.has(id)) inspectChanges(previous.get(id), row, path + ".*", grants, issues);
      else if (serverKey && path !== "media") issues.push(cmsIssue(path, "SERVER_IDENTITY_REQUIRED"));
      else check(path + ".$add");
    }
    for (const id of previous.keys()) {
      if (current.has(id)) continue;
      if (path === "plans") issues.push(cmsIssue(path, "ARCHIVE_REQUIRED"));
      else check(path + ".$remove");
    }
    const beforeOrder = [...previous.keys()].filter((id) => current.has(id));
    const afterOrder = [...current.keys()].filter((id) => previous.has(id));
    if (beforeOrder.some((id, index) => id !== afterOrder[index])) check(path + ".$order");
    return;
  }
  if (record(base) && record(next)) {
    for (const key of Object.keys(next)) {
      inspectChanges(base[key], next[key], path ? path + "." + key : key, grants, issues);
    }
    return;
  }
  if (protectedLeaves.has(path)) issues.push(cmsIssue(path, "SERVER_IDENTITY_REQUIRED"));
  else check(path);
}

/** The base document and grants must come from the authorized server workspace. */
export function assertProductPatchAllowed(
  base: ProductDraft,
  next: unknown,
  caps: CmsCapabilities,
): ProductDraft {
  if (!caps.canRead || !caps.canEditFacts) throw new PublisherDraftError([cmsIssue("", "EDIT_FORBIDDEN")]);
  const { draft, issues } = parseProductDraft(next, { phase: "draft", purpose: "update" });
  if (!draft) throw new PublisherDraftError(issues);
  inspectChanges(base, draft, "", new Set(caps.editablePaths), issues);
  if (issues.length) throw new PublisherDraftError(issues);
  return draft;
}

export type ToolTrimDraft = { schemaVersion: 1; fields: Record<string, unknown> };

// Some existing catalogue objects mix factual and editorial data. They need a
// dedicated contract before an editorial draft can update any of their leaves.
const toolTrimFields = new Set([
  "category", "longDescription", "longDescriptionEn", "pros", "prosEn", "cons", "consEn",
  "verdict", "verdictEn", "toolTrimRating", "seo", "alternatives", "betterAlternative",
  "freeAlternative", "migrationGuide", "downgradePlan", "articles", "relations",
  "tool_type", "soloRelevance", "teamRelevance", "substitution_cluster_v2",
  "functional_needs", "personas", "covers", "verticals", "relevantFor", "relevantForEn",
  "prescription_block_reasons", "prescription_context_questions", "decision_policy_v3",
  "substitutable", "force_silence", "timeGainedHoursPerMonth", "lifecycle",
  "affiliateLink", "affiliateCtaLabelEn", "affiliateCtaLabelFr", "affiliateDisclosureEn",
  "affiliateDisclosureFr", "promoCode", "promoDescriptionEn", "promoDescriptionFr",
]);

export function validateToolTrimDraft(value: unknown): CmsIssue[] {
  const issue = (path: string, code: string): CmsIssue => ({
    path, code, block: "analysis", severity: "error",
  });
  if (!record(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))
    || value.schemaVersion !== 1 || !Object.hasOwn(value, "schemaVersion")
    || !Object.hasOwn(value, "fields") || !record(value.fields)
    || Object.keys(value).some((key) => key !== "schemaVersion" && key !== "fields")) {
    return [issue("", "INVALID_TOOLTRIM_DRAFT")];
  }
  const forbidden = Object.keys(value.fields).filter((key) => !toolTrimFields.has(key));
  if (forbidden.length) return forbidden.map((key) => issue("fields." + key, "PATH_FORBIDDEN"));
  return validateCatalogFieldValues(value.fields).map(({ path, code }) =>
    issue(path ? "fields." + path : "fields", code),
  );
}
