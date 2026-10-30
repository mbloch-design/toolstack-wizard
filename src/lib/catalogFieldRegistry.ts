/** Explicit authoring schema. No schema is inferred from untrusted stored values. */
export type CatalogField = {
  kind:
    | "text"
    | "number"
    | "boolean"
    | "url"
    | "media"
    | "date"
    | "enum"
    | "object"
    | "array"
    | "union";
  nullable?: boolean;
  optional?: boolean;
  max?: number;
  min?: number;
  integer?: boolean;
  options?: readonly string[];
  children?: Record<string, CatalogField>;
  item?: CatalogField;
  variants?: CatalogField[];
};
const text: CatalogField = { kind: "text", nullable: true, optional: true };
const number: CatalogField = { kind: "number", nullable: true, optional: true };
const boolean: CatalogField = { kind: "boolean", optional: true };
const url: CatalogField = { kind: "url", nullable: true, optional: true };
const date: CatalogField = { kind: "date", nullable: true, optional: true };
const media: CatalogField = { kind: "media", nullable: true, optional: true };
const object = (children: Record<string, CatalogField>): CatalogField => ({
  kind: "object",
  children,
  nullable: true,
  optional: true,
});
const array = (item: CatalogField): CatalogField => ({
  kind: "array",
  item: { ...item, nullable: false, optional: false },
  nullable: true,
  optional: true,
});
const texts = array(text);
const fields = (keys: string[], field = text) =>
  Object.fromEntries(keys.map((k) => [k, field]));
const union = (...variants: CatalogField[]): CatalogField => ({
  kind: "union",
  variants,
  nullable: true,
  optional: true,
});
const enumeration = (...options: string[]): CatalogField => ({
  kind: "enum",
  options,
  nullable: true,
  optional: true,
});
export const CATALOG_BILLING_PERIODS = [
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
] as const;
export const catalogPlanSchema = object({
  ...fields([
    "planKey",
    "displayName",
    "summary",
    "pricingUnit",
    "observedMarket",
    "observedLocale",
    "priceObservationId",
  ]),
  featureHighlights: texts,
  detailsSourceUrl: url,
  isFree: boolean,
  isComparePlan: boolean,
  nativeAmount: number,
  nativeCurrency: text,
  billingPeriod: enumeration(...CATALOG_BILLING_PERIODS),
  priceStatus: enumeration("paid", "free", "quote", "unknown", "usage"),
  taxInclusion: enumeration(
    "unknown",
    "included",
    "excluded",
    "ht",
    "ttc",
    "tax_included",
  ),
  observedOn: date,
  lastConfirmedOn: date,
  billingCommitment: enumeration("monthly", "annual_prepaid"),
  comingSoon: boolean,
});
const pricing = object({
  ...fields([
    "compare_plan_name",
    "compare_plan_kind",
    "price_reliability",
    "verification_status",
    "source_domain",
    "tcoExampleEn",
    "tcoExampleFr",
    "free_plan_card",
    "free_plan_cardEn",
    "billing_model",
    "currency",
    "price_original_currency",
    "plan_name",
    "reliability",
    "billing_note",
    "free_tier_note",
    "currency_original",
    "costTableNoteEn",
    "costTableNoteFr",
  ]),
  ...fields(
    [
      "compare_price_monthly_eur",
      "price_original",
      "conversion_rate_to_eur",
      "monthly_eur",
      "annual_monthly_eur",
      "minSeats",
    ],
    number,
  ),
  ...fields(
    ["location_sensitive", "usage_sensitive", "free_tier", "showCostTable"],
    boolean,
  ),
  ...fields(["official_source_url", "source_url", "affiliate_url"], url),
  verified_on: date,
  cautions: texts,
  cautionsEn: texts,
  plans: array(catalogPlanSchema),
  billing_options: array(
    object({
      ...fields(["currency", "label_en", "label_fr", "value"]),
      needs_verification: boolean,
      price_monthly_eur: number,
      price_original: number,
    }),
  ),
  costTable: array(
    object(
      fields([
        "annualUsd",
        "monthlyUsd",
        "plan",
        "planEn",
        "team",
        "teamEn",
        "verdictEn",
        "verdictFr",
      ]),
    ),
  ),
});
const verdict = object({
  keepIf: texts,
  avoidIf: texts,
  threshold: text,
  profileTable: array(object({ profile: text, recommendation: text })),
  billingTraps: array(union(text, object({ title: text, text }))),
  faqPriceAnswer: text,
  profitableIf: texts,
  tooExpensiveIf: texts,
  label: text,
  score: number,
  summary: text,
  tcoExampleFr: text,
});
const scoreNames = [
  "puissance",
  "reversibilite",
  "simplicite",
  "utilisation",
  "valeurAjoutee",
];
const rating = object({
  ...fields(scoreNames, { ...number, min: 1, max: 5, integer: true }),
  evidence: object(fields(scoreNames)),
  evidenceEn: object(fields(scoreNames)),
  notedOn: date,
  lastActivityVerifiedOn: date,
});
export const catalogSchema: Record<string, CatalogField> = {
  ...fields([
    "name",
    "category",
    "shortDescription",
    "shortDescriptionEn",
    "description",
    "descriptionEn",
    "longDescription",
    "longDescriptionEn",
    "tool_type",
    "soloRelevance",
    "teamRelevance",
    "substitution_cluster_v2",
    "bundle_parent",
    "host_app",
    "freeAlternative",
    "affiliateCtaLabelEn",
    "affiliateCtaLabelFr",
    "affiliateDisclosureEn",
    "affiliateDisclosureFr",
    "promoCode",
    "promoDescriptionEn",
    "promoDescriptionFr",
  ]),
  ...fields(
    [
      "pros",
      "prosEn",
      "cons",
      "consEn",
      "useCases",
      "useCasesEn",
      "relevantFor",
      "relevantForEn",
      "functional_needs",
      "personas",
      "covers",
      "verticals",
      "integrates_with",
      "complements",
      "prescription_block_reasons",
      "prescription_context_questions",
    ],
    texts,
  ),
  ...fields(
    ["substitutable", "force_silence", "pivot_integration_source"],
    boolean,
  ),
  ...fields(["websiteUrl", "affiliateLink"], url),
  logo: media,
  ogImageUrl: media,
  galleryImages: array(media),
  defaultMonthlyPrice: number,
  timeGainedHoursPerMonth: number,
  pricing: union(text, object({ free: text, paid: text })),
  pricingEn: union(text, object({ free: text, paid: text })),
  pricing_v5: pricing,
  pricing_v5En: pricing,
  verdict,
  verdictEn: verdict,
  toolTrimRating: rating,
  tagline: object({ fr: text, en: text }),
  ia_use_case: union(text, texts),
  alternatives: array(union(text, object({ name: text, reason: text }))),
  articles: array(object({ slug: text, title: text, excerpt: text })),
  betterAlternative: union(
    text,
    object({
      tool: text,
      reason: text,
      reasonEn: text,
      performanceGain: text,
      performanceGainEn: text,
      saving: number,
    }),
  ),
  downgradePlan: union(text, object({ available: boolean, freeTier: text })),
  migrationGuide: union(
    text,
    object({ dataLoss: text, steps: texts, timeEstimate: text }),
  ),
  relations: array(
    object({
      confidence: text,
      kind: text,
      needKeys: texts,
      targetToolId: text,
    }),
  ),
  lifecycle: object({
    checkedOn: date,
    note: union(text, object({ fr: text, en: text })),
    status: text,
  }),
  decision_policy_v3: object({
    ...fields(
      [
        "auto_cancel_allowed",
        "auto_downgrade_allowed",
        "auto_replace_allowed",
        "requires_context_questions",
      ],
      boolean,
    ),
    default_decision_lane: text,
    never_auto_cancel_reason: text,
  }),
  seo: object({
    ...fields([
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
    ]),
    aiAngle: object({
      aiTools: texts,
      augmentEn: text,
      augmentFr: text,
      replaceEn: text,
      replaceFr: text,
      stance: text,
    }),
  }),
};
catalogSchema.name = { kind: "text" };
export type CatalogFieldRegistration = {
  path: string;
  label: string;
  family: string;
  schema: CatalogField;
  ownership: "editorial" | "identity" | "alias" | "generated" | "research";
  editable: boolean;
  deletion: "remove" | "protected";
  publicConsumers: string[];
  canonicalPath?: string;
  explanation?: string;
};
const family = (root: string): string => {
  if (
    [
      "category",
      "tool_type",
      "covers",
      "functional_needs",
      "personas",
      "verticals",
      "useCases",
      "useCasesEn",
      "relevantFor",
      "relevantForEn",
      "ia_use_case",
      "soloRelevance",
      "teamRelevance",
      "substitutable",
      "substitution_cluster_v2",
    ].includes(root)
  )
    return "classification";
  if (
    [
      "name",
      "shortDescription",
      "shortDescriptionEn",
      "description",
      "descriptionEn",
      "tagline",
    ].includes(root)
  )
    return "presentation";
  if (/pricing|Price/.test(root)) return "pricing";
  if (root === "seo") return "seo";
  if (/Rating|verdict|pros|cons|longDescription|timeGained/.test(root))
    return "analysis";
  if (/logo|Image/.test(root)) return "media";
  if (
    /Alternative|alternatives|migration|relations|articles|host|bundle|integrat|complements|downgrade/.test(
      root,
    )
  )
    return "relations";
  if (/affiliate|website|promo/.test(root)) return "links";
  return "metadata";
};
const consumers = (root: string): string[] => {
  if (
    [
      "description",
      "descriptionEn",
      "tagline",
      "lifecycle",
      "relevantForEn",
      "relations",
      "integrates_with",
      "complements",
    ].includes(root)
  )
    return [];
  switch (family(root)) {
    case "pricing":
      return ["ToolPricingSection", "nativePricing", "stackView", "toolSeo"];
    case "classification":
      return [
        "mapToolFromJson",
        "ToolFeaturesBlock",
        "ToolAudienceBlock",
        "toolExploration",
        "useCatalogSearch",
      ];
    case "seo":
      return ["toolSeo", "ToolAiBlock"];
    case "analysis":
      return root === "toolTrimRating"
        ? ["StickyDecisionCard", "computeToolTrimScoreV2"]
        : ["ToolDetailPage", "ToolProfitabilityBlock"];
    case "metadata":
      return /policy|silence|prescription/.test(root)
        ? ["mapToolFromJson", "diagnostic"]
        : [];
    default:
      return ["mapToolFromJson", "ToolDetailPage"];
  }
};
export const CATALOG_FIELD_REGISTRY: CatalogFieldRegistration[] = [];
function register(path: string, schema: CatalogField) {
  const root = path.split(".")[0];
  CATALOG_FIELD_REGISTRY.push({
    path,
    label: path,
    family: family(root),
    schema,
    ownership:
      path.endsWith(".priceObservationId") || path.endsWith(".planKey")
        ? "identity"
        : "editorial",
    editable: !path.endsWith(".priceObservationId"),
    deletion: path.endsWith(".priceObservationId")
      ? "protected"
      : schema.optional
        ? "remove"
        : "protected",
    ...(path.endsWith(".priceObservationId")
      ? {
          explanation:
            "Deterministic sourced observation identity; managed by the shared-price helper, never entered manually.",
        }
      : path.endsWith(".planKey")
        ? {
            explanation:
              "Stable plan identity. Set on creation; retain during edits and reorder.",
          }
        : {}),
    publicConsumers: consumers(root),
    ...(consumers(root).length
      ? {}
      : {
          explanation:
            "Stored editorial metadata; currently not projected by mapToolFromJson into the public fiche.",
        }),
  });
  for (const [key, child] of Object.entries(schema.children ?? {}))
    register(`${path}.${key}`, child);
  if (schema.item) register(`${path}.*`, schema.item);
  for (const variant of schema.variants ?? []) {
    for (const [key, child] of Object.entries(variant.children ?? {}))
      register(`${path}.${key}`, child);
    if (variant.item) register(`${path}.*`, variant.item);
  }
}
for (const [key, schema] of Object.entries(catalogSchema))
  register(key, schema);
const aliases: Record<string, string> = {
  bestFor: "relevantFor",
  tags: "functional_needs",
  nameEn: "name",
  categoryId: "category",
  gallery_images: "galleryImages",
  link: "websiteUrl",
  website: "websiteUrl",
  lifecycleStatus: "lifecycle.status",
  pricingTiers: "pricing",
  verdictFr: "verdict",
};
for (const key of [
  "id",
  "slug",
  "research",
  "prescription_output",
  "prescription_quality",
  ...Object.keys(aliases),
])
  CATALOG_FIELD_REGISTRY.push({
    path: key,
    label: key,
    family: "protected",
    schema: text,
    ownership: aliases[key]
      ? "alias"
      : key === "research"
        ? "research"
        : ["id", "slug"].includes(key)
          ? "identity"
          : "generated",
    editable: false,
    deletion: "protected",
    canonicalPath: aliases[key],
    publicConsumers: [],
    explanation: aliases[key]
      ? `Historical compatibility value; active authoring owner: ${aliases[key]}. Preserved, never copied automatically.`
      : "Managed identity, research evidence or generated output; preserved unchanged.",
  });
export function catalogFieldAt(
  path: readonly (string | number)[],
): CatalogFieldRegistration | undefined {
  if (
    path.some(
      (p) => typeof p === "number" && (!Number.isSafeInteger(p) || p < 0),
    )
  )
    return undefined;
  const normalized = path
    .map((p) => (typeof p === "number" ? "*" : p))
    .join(".");
  return CATALOG_FIELD_REGISTRY.find((f) => f.path === normalized);
}
