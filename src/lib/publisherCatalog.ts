import * as v from "valibot";
import { identifier, priceOptionSchema, publicUrl } from "./publisherPricing.js";

export type CmsTarget = { kind: "listing" | "tool"; id: string };
export type CmsCapabilities = {
  canRead: boolean;
  canEditFacts: boolean;
  canUpload: boolean;
  canSubmit: boolean;
  canReview: boolean;
  canPublish: boolean;
  editablePaths: string[];
};
export type CmsIssue = { path: string; block: string; code: string; severity: "error" | "warning" };
type ValidationContext = { phase: "draft" | "submit"; purpose: "initial" | "update" };

const text = (max: number) => v.pipe(v.string(), v.maxLength(max));
const localizedText = v.strictObject({ fr: text(500), en: text(500) });
const editorialRow = v.strictObject({ id: identifier, text: text(800) });
const productLocale = v.strictObject({
  shortDescription: v.nullable(text(350)),
  productDescription: v.nullable(text(8000)),
  features: v.pipe(v.array(editorialRow), v.maxLength(30)),
  useCases: v.pipe(v.array(editorialRow), v.maxLength(30)),
});
const planLocale = v.strictObject({
  name: text(100),
  summary: v.nullable(text(1000)),
  highlights: v.pipe(v.array(text(500)), v.maxLength(30)),
});

const productDraftSchema = v.strictObject({
  schemaVersion: v.literal(1),
  name: text(120),
  websiteUrl: v.union([v.literal(""), publicUrl]),
  localized: v.strictObject({ fr: productLocale, en: productLocale }),
  plans: v.pipe(v.array(v.strictObject({
    id: identifier,
    planKey: identifier,
    archived: v.boolean(),
    localized: v.strictObject({ fr: planLocale, en: planLocale }),
    options: v.pipe(v.array(priceOptionSchema), v.maxLength(12)),
  })), v.maxLength(30)),
  media: v.pipe(v.array(v.strictObject({
    assetId: identifier,
    role: v.picklist(["logo", "cover", "gallery"]),
    alt: localizedText,
    caption: localizedText,
  })), v.maxLength(14)),
  classificationProposals: v.pipe(v.array(v.strictObject({
    key: identifier,
    values: v.pipe(v.array(identifier), v.maxLength(30)),
  })), v.maxLength(20)),
  integrations: v.pipe(v.array(v.strictObject({
    id: identifier,
    relatedToolId: identifier,
    type: v.picklist(["integration", "host", "bundle"]),
    sourceUrl: publicUrl,
  })), v.maxLength(30)),
});

export type ProductDraft = v.InferOutput<typeof productDraftSchema>;

export function cmsIssue(path: string, code: string): CmsIssue {
  const [root, , leaf] = path.split(".");
  const block = root === "plans" ? "pricing" : root === "localized" && ["features", "useCases"].includes(leaf)
    ? "usage" : ["media", "classificationProposals", "integrations"].includes(root) ? root : "presentation";
  return { path, block, code, severity: "error" };
}

function checkJson(value: unknown, path = "", depth = 0): CmsIssue | undefined {
  if (depth > 12) return cmsIssue(path, "MAX_DEPTH");
  if (!value || typeof value !== "object") return;
  const proto = Object.getPrototypeOf(value);
  if (Array.isArray(value) ? proto !== Array.prototype : proto !== Object.prototype && proto !== null) {
    return cmsIssue(path, "INVALID_OBJECT");
  }
  const entries = Object.entries(value);
  if (entries.length > 100) return cmsIssue(path, "TOO_MANY_PROPERTIES");
  for (const [key, child] of entries) {
    const childPath = path ? path + "." + key : key;
    if (["__proto__", "constructor", "prototype"].includes(key)) return cmsIssue(childPath, "UNSAFE_KEY");
    const issue = checkJson(child, childPath, depth + 1);
    if (issue) return issue;
  }
}

export function parseProductDraft(value: unknown, context: ValidationContext) {
  const unsafe = checkJson(value);
  if (unsafe) return { issues: [unsafe] };
  const result = v.safeParse(productDraftSchema, value);
  if (!result.success) {
    return { issues: result.issues.map((issue) =>
      cmsIssue(issue.path?.map(({ key }) => String(key)).join(".") ?? "", issue.type.toUpperCase()),
    ) };
  }
  const draft = result.output;
  const issues: CmsIssue[] = [];
  const required = (condition: unknown, path: string) => {
    if (!condition) issues.push(cmsIssue(path, "REQUIRED"));
  };
  const unique = (values: string[], path: string) => {
    if (new Set(values).size !== values.length) issues.push(cmsIssue(path, "DUPLICATE_IDENTITY"));
  };
  unique(draft.plans.map(({ id }) => id), "plans");
  unique(draft.plans.map(({ planKey }) => planKey), "plans");
  unique(draft.plans.flatMap(({ options }) => options.map(({ id }) => id)), "plans");
  unique(draft.media.map(({ assetId }) => assetId), "media");
  unique(draft.classificationProposals.map(({ key }) => key), "classificationProposals");
  unique(draft.integrations.map(({ id }) => id), "integrations");
  for (const role of ["logo", "cover", "gallery"] as const) {
    if (draft.media.filter((item) => item.role === role).length > (role === "gallery" ? 12 : 1)) {
      issues.push(cmsIssue("media", "TOO_MANY_MEDIA"));
    }
  }
  for (const lang of ["fr", "en"] as const) {
    for (const field of ["features", "useCases"] as const) {
      unique(draft.localized[lang][field].map(({ id }) => id), `localized.${lang}.${field}`);
    }
  }
  if (context.phase === "submit") {
    if (context.purpose === "initial") {
      required(draft.name.trim(), "name");
      required(draft.websiteUrl, "websiteUrl");
    }
    draft.plans.forEach((plan, i) => {
      if (plan.archived) return;
      required(plan.localized.fr.name.trim() || plan.localized.en.name.trim(), `plans.${i}.localized`);
      plan.options.forEach((option, j) => {
        if (option.type !== "paid") return;
        const path = `plans.${i}.options.${j}`;
        required(option.amount, path + ".amount");
        required(option.currency, path + ".currency");
        required(option.period && option.period !== "usage", path + ".period");
        required(option.unit?.trim(), path + ".unit");
        required(option.commitment, path + ".commitment");
      });
    });
  }
  return issues.length ? { issues } : { issues, draft };
}

export function validateProductDraft(value: unknown, context: ValidationContext): CmsIssue[] {
  return parseProductDraft(value, context).issues;
}
