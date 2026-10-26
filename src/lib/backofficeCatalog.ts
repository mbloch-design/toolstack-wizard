/** Shared JSON-only contract. Provider credentials and persistence stay server-side. */
export type CatalogTool = Record<string, unknown> & {
  id: string;
  slug: string;
  name: string;
};
export type CatalogDraftSummary = {
  slug: string;
  name: string;
  version: number;
  updatedAt: string;
  fields: string[];
};
export type CatalogWorkspace = {
  revision: number;
  tools: {
    slug: string;
    name: string;
    category: string;
    draft: CatalogDraftSummary | null;
  }[];
  drafts: CatalogDraftSummary[];
  total: number;
  page: number;
  pageSize: number;
  headSha: string;
};
export type CatalogEditorDetail = {
  tool: CatalogTool;
  published: CatalogTool;
  baseHash: string;
  version: number;
  draft: CatalogDraftSummary | null;
  conflict: boolean;
};
export type CatalogPublication = {
  commitSha: string;
  commitUrl: string;
  published: number;
  cleanupPending: boolean;
};
export const EDITABLE_CATALOG_FIELDS = [
  "name",
  "category",
  "shortDescription",
  "shortDescriptionEn",
  "description",
  "descriptionEn",
  "longDescription",
  "longDescriptionEn",
  "pros",
  "prosEn",
  "cons",
  "consEn",
  "useCases",
  "useCasesEn",
  "relevantFor",
  "relevantForEn",
  "verdict",
  "verdictEn",
  "pricing",
  "pricingEn",
  "pricing_v5",
  "pricing_v5En",
  "defaultMonthlyPrice",
  "websiteUrl",
  "affiliateLink",
  "logo",
  "ogImageUrl",
  "galleryImages",
  "alternatives",
  "seo",
] as const;
export class CatalogValidationError extends Error {
  readonly code = "INVALID_CATALOG_TOOL";
  constructor() {
    super("INVALID_CATALOG_TOOL");
  }
}
function fail(): never {
  throw new CatalogValidationError();
}
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
export function changedCatalogFields(
  base: CatalogTool,
  value: CatalogTool,
): string[] {
  return [...new Set([...Object.keys(base), ...Object.keys(value)])]
    .filter((key) => !equal(base[key], value[key]))
    .sort();
}
function record(v: unknown): v is Record<string, unknown> {
  return (
    !!v &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    (Object.getPrototypeOf(v) === Object.prototype ||
      Object.getPrototypeOf(v) === null)
  );
}
function safeTree(v: unknown, depth = 0): void {
  if (depth > 24) fail();
  if (v === null || typeof v === "boolean" || typeof v === "string") return;
  if (typeof v === "number") {
    if (!Number.isFinite(v)) fail();
    return;
  }
  if (Array.isArray(v)) {
    if (v.length > 1000) fail();
    for (const x of v) safeTree(x, depth + 1);
    return;
  }
  if (!record(v)) fail();
  for (const [k, x] of Object.entries(v)) {
    if (["__proto__", "prototype", "constructor"].includes(k)) fail();
    safeTree(x, depth + 1);
  }
}
type Check = ((v: unknown, b?: unknown) => void) & {
  children?: Record<string, Check>;
  item?: Check;
};
const str: Check = (v) => {
  if (typeof v !== "string" || v.length > 60000) fail();
};
const number: Check = (v) => {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) fail();
};
const bool: Check = (v) => {
  if (typeof v !== "boolean") fail();
};
const url: Check = (v) => {
  str(v);
  if (v === "") return;
  try {
    const u = new URL(v as string);
    if (!["https:", "http:"].includes(u.protocol) || u.username || u.password)
      fail();
  } catch {
    fail();
  }
};
const media: Check = (v) => {
  if (typeof v === "string" && /^\/(?!\/)[^\s]*$/.test(v)) return;
  url(v);
};
const list = (check: Check): Check =>
  Object.assign(
    (v: unknown, b?: unknown) => {
      if (!Array.isArray(v) || v.length > 100) fail();
      v.forEach((x, i) => check(x, Array.isArray(b) ? b[i] : undefined));
    },
    { item: check },
  );
const nullable = (check: Check): Check =>
  Object.assign(
    (v: unknown, b?: unknown) => {
      if (v !== null) check(v, b);
    },
    { children: check.children, item: check.item },
  );
const enumeration =
  (values: string[]): Check =>
  (v) => {
    if (typeof v !== "string" || !values.includes(v)) fail();
  };
const date: Check = (v) => {
  if (
    typeof v !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
    !Number.isFinite(Date.parse(v)) ||
    new Date(v).toISOString().slice(0, 10) !== v
  )
    fail();
};
function group(schema: Record<string, Check>): Check {
  return Object.assign(
    (v: unknown, b?: unknown) => {
      if (!record(v)) fail();
      const previous = record(b) ? b : {};
      for (const key of new Set([
        ...Object.keys(previous),
        ...Object.keys(v),
      ])) {
        if (equal(previous[key], v[key])) continue;
        if (!Object.hasOwn(schema, key) || !Object.hasOwn(v, key)) fail();
        schema[key](v[key], previous[key]);
      }
    },
    { children: schema },
  );
}
const planFields = group({
  planKey: str,
  displayName: str,
  summary: nullable(str),
  featureHighlights: list(str),
  detailsSourceUrl: nullable(url),
  pricingUnit: nullable(str),
  isFree: bool,
  isComparePlan: bool,
  nativeAmount: nullable(number),
  nativeCurrency: nullable((v) => {
    if (typeof v !== "string" || !/^[A-Z]{3}$/.test(v)) fail();
  }),
  billingPeriod: nullable(
    enumeration([
      "month",
      "year",
      "monthly",
      "annual",
      "quarterly",
      "one_time",
      "one-time",
      "usage",
      "week",
      "day",
    ]),
  ),
  taxInclusion: nullable(
    enumeration([
      "unknown",
      "included",
      "excluded",
      "ht",
      "ttc",
      "tax_included",
    ]),
  ),
  observedMarket: nullable(str),
  observedLocale: nullable(str),
  observedOn: nullable(date),
  lastConfirmedOn: nullable(date),
  billingCommitment: nullable(enumeration(["monthly", "annual_prepaid"])),
  comingSoon: bool,
});
const plan: Check = (v, b) => {
  planFields(v, b);
  if (!record(v)) fail();
  const old = record(b) ? b : {};
  if (!record(b)) {
    for (const key of ["planKey", "displayName"]) {
      if (typeof v[key] !== "string" || !v[key]) fail();
    }
    for (const key of [
      "nativeAmount",
      "nativeCurrency",
      "isFree",
      "isComparePlan",
    ])
      if (!Object.hasOwn(v, key)) fail();
  }
  if (
    !record(b) ||
    [
      "nativeAmount",
      "nativeCurrency",
      "billingPeriod",
      "billingCommitment",
      "pricingUnit",
      "isFree",
    ].some((key) => !equal(v[key], old[key]))
  ) {
    if (
      typeof v.detailsSourceUrl !== "string" ||
      !v.detailsSourceUrl ||
      typeof v.observedOn !== "string" ||
      !v.observedOn
    )
      fail();
    url(v.detailsSourceUrl);
    date(v.observedOn);
    if (
      v.nativeAmount !== null &&
      (typeof v.nativeCurrency !== "string" ||
        !/^[A-Z]{3}$/.test(v.nativeCurrency))
    )
      fail();
  }
};
plan.children = planFields.children;
const plans: Check = (v, b) => {
  if (!Array.isArray(v) || v.length > 100) fail();
  const previous = Array.isArray(b) ? b : [];
  for (const row of v) {
    const old = record(row)
      ? previous.find((item) => record(item) && item.planKey === row.planKey)
      : undefined;
    plan(row, old);
  }
  const rows = v as Record<string, unknown>[];
  if (
    new Set(rows.map((p) => p.planKey)).size !== rows.length ||
    rows.filter((p) => p.isComparePlan === true).length > 1
  )
    fail();
};
plans.item = plan;
const pricing = group({
  compare_price_monthly_eur: nullable(number),
  compare_plan_name: str,
  compare_plan_kind: str,
  price_reliability: str,
  verification_status: str,
  verified_on: date,
  official_source_url: url,
  source_domain: str,
  location_sensitive: bool,
  usage_sensitive: bool,
  cautions: list(str),
  cautionsEn: list(str),
  plans,
  tcoExampleEn: str,
  tcoExampleFr: str,
  free_plan_card: str,
  free_plan_cardEn: str,
  billing_model: str,
  currency: str,
  price_original: number,
  price_original_currency: str,
  conversion_rate_to_eur: number,
  free_tier: bool,
  plan_name: str,
  source_url: url,
  monthly_eur: number,
  reliability: str,
  billing_note: str,
  free_tier_note: str,
  currency_original: str,
  annual_monthly_eur: number,
  minSeats: number,
  costTableNoteEn: str,
  costTableNoteFr: str,
  showCostTable: bool,
  affiliate_url: url,
});
const verdict = group({
  keepIf: list(str),
  avoidIf: list(str),
  threshold: str,
  billingTraps: list(group({ title: str, text: str })),
  faqPriceAnswer: str,
  profitableIf: list(str),
  tooExpensiveIf: list(str),
});
const seoKeys = [
  "metaDescription",
  "metaDescriptionEn",
  "metaTitle",
  "presentationTitleFr",
  "presentationTitleEn",
  "idealForFr",
  "idealForEn",
  "presentationMetaDescriptionEn",
  "presentationMetaDescriptionFr",
  "prixTitleEn",
  "prixTitleFr",
  "prixMetaDescriptionEn",
  "prixMetaDescriptionFr",
  "altTitleEn",
  "altTitleFr",
  "altMetaDescriptionEn",
  "altMetaDescriptionFr",
  "avisTitleEn",
  "avisTitleFr",
  "avisMetaDescriptionEn",
  "avisMetaDescriptionFr",
];
const checks: Record<string, Check> = {};
for (const key of EDITABLE_CATALOG_FIELDS) checks[key] = str;
for (const key of [
  "pros",
  "prosEn",
  "cons",
  "consEn",
  "useCases",
  "useCasesEn",
  "relevantFor",
  "relevantForEn",
  "alternatives",
])
  checks[key] = list(str);
for (const key of ["websiteUrl", "affiliateLink"]) checks[key] = url;
for (const key of ["logo", "ogImageUrl"]) checks[key] = media;
Object.assign(checks, {
  category: (v: unknown) => {
    if (typeof v !== "string" || !/^[a-z0-9][a-z0-9-]{0,100}$/.test(v)) fail();
  },
  galleryImages: list(media),
  defaultMonthlyPrice: number,
  pricing: group({ free: str, paid: str }),
  pricingEn: group({ free: str, paid: str }),
  pricing_v5: pricing,
  pricing_v5En: pricing,
  verdict,
  verdictEn: verdict,
  seo: group(Object.fromEntries(seoKeys.map((k) => [k, str]))),
});
/** True only for fields whose complete path is represented by the validator schema. */
export function isEditableCatalogPath(
  path: readonly (string | number)[],
): boolean {
  if (
    !path.length ||
    typeof path[0] !== "string" ||
    !Object.hasOwn(checks, path[0])
  )
    return false;
  let check: Check = checks[path[0]];
  for (const part of path.slice(1)) {
    if (typeof part === "number") {
      if (!Number.isSafeInteger(part) || part < 0 || !check.item) return false;
      check = check.item;
    } else {
      if (!check.children || !Object.hasOwn(check.children, part)) return false;
      check = check.children[part];
    }
  }
  return true;
}
export function validateCatalogTool(
  base: CatalogTool,
  value: unknown,
): CatalogTool {
  safeTree(value);
  if (
    !record(value) ||
    value.id !== base.id ||
    value.slug !== base.slug ||
    typeof value.name !== "string" ||
    !value.name.trim()
  )
    fail();
  const tool = value as CatalogTool;
  for (const key of changedCatalogFields(base, tool)) {
    if (!Object.hasOwn(checks, key) || !Object.hasOwn(tool, key)) fail();
    checks[key](tool[key], base[key]);
  }
  for (const key of ["pricing_v5", "pricing_v5En"]) {
    const p = tool[key],
      old = base[key];
    if (
      record(p) &&
      (!record(old) ||
        [
          "compare_price_monthly_eur",
          "price_original",
          "conversion_rate_to_eur",
          "monthly_eur",
          "annual_monthly_eur",
        ].some((k) => !equal(p[k], old[k])))
    ) {
      const source = p.official_source_url ?? p.source_url;
      if (
        typeof source !== "string" ||
        !source ||
        typeof p.verified_on !== "string"
      )
        fail();
      url(source);
      date(p.verified_on);
    }
  }
  if (!equal(base.defaultMonthlyPrice, tool.defaultMonthlyPrice)) {
    const p = tool.pricing_v5;
    if (
      !record(p) ||
      typeof p.official_source_url !== "string" ||
      !p.official_source_url ||
      typeof p.verified_on !== "string"
    )
      fail();
    url(p.official_source_url);
    date(p.verified_on);
  }
  return JSON.parse(JSON.stringify(tool)) as CatalogTool;
}
