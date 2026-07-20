import type { Tool, ToolType, PrescriptionQuality, PricingV5, ToolPricingPlan } from "@/data/types";

export type CatalogProjectionRow = Record<string, any> & {
  id: string;
  slug: string;
  lang: "fr" | "en";
  name: string;
  data_contract: "legacy" | "canonical";
};

function text(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function array<T = string>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function canonicalPricingV5(row: CatalogProjectionRow): PricingV5 | null {
  if (row.data_contract !== "canonical") return row.legacy_pricing_v5 || null;
  const guidance = (row.pricing_guidance || {}) as Record<string, unknown>;
  const planDetails = (guidance.plan_details || {}) as Record<string, Record<string, unknown>>;
  const plans = array<Record<string, unknown>>(row.plans).map((plan): ToolPricingPlan => ({
    planKey: text(plan.plan_key),
    displayName: text(plan.display_name, text(plan.plan_key)),
    summary: text(planDetails[text(plan.plan_key)]?.summary) || null,
    featureHighlights: array<string>(planDetails[text(plan.plan_key)]?.highlights),
    detailsSourceUrl: text(planDetails[text(plan.plan_key)]?.source_url) || null,
    pricingUnit: text(plan.pricing_unit) || null,
    isFree: plan.is_free === true,
    isComparePlan: plan.is_compare_plan === true,
    nativeAmount: plan.native_amount == null ? null : Number(plan.native_amount),
    nativeCurrency: text(plan.native_currency) || null,
    billingPeriod: (text(plan.billing_period) || null) as ToolPricingPlan["billingPeriod"],
    billingCommitment: (text(plan.billing_commitment) || null) as ToolPricingPlan["billingCommitment"],
    taxInclusion: (text(plan.tax_inclusion) || null) as ToolPricingPlan["taxInclusion"],
    observedMarket: text(plan.observed_market) || null,
    observedLocale: text(plan.observed_locale) || null,
    observedOn: text(plan.observed_on) || null,
    lastConfirmedOn: text(plan.last_confirmed_on) || null,
  }));
  if (row.compare_monthly_eur == null && !row.pricing_guidance && plans.length === 0) return null;
  return {
    ...guidance,
    compare_price_monthly_eur: Number(row.compare_monthly_eur ?? 0),
    compare_plan_name: row.compare_plan || undefined,
    compare_plan_kind: row.pricing_unit || undefined,
    price_reliability: row.price_status || undefined,
    verified_on: row.price_last_confirmed_on || row.price_observed_on || undefined,
    official_source_url: row.price_source_url || undefined,
    plans,
  };
}

/**
 * Converts the two localized public-projection rows into the Tool shape used by
 * the current UI. This function is pure: it performs no fetch and does not
 * mutate either source row.
 */
export function catalogProjectionRowsToTool(rows: CatalogProjectionRow[]): Tool | null {
  const fr = rows.find((row) => row.lang === "fr");
  const en = rows.find((row) => row.lang === "en");
  const base = fr || en;
  if (!base) return null;

  const verdictFallback = { keepIf: [], avoidIf: [], threshold: "" };
  const pricing = base.legacy_pricing || { free: "", paid: "" };
  const relationships = array<Record<string, unknown>>(base.relationships);

  return {
    id: text(base.id),
    slug: text(base.slug || base.id),
    name: text(base.name, text(base.id)),
    categoryId: text(base.category),
    shortDescription: text(fr?.short_description ?? en?.short_description),
    shortDescriptionEn: text(en?.short_description ?? fr?.short_description),
    longDescription: text(fr?.long_description ?? en?.long_description),
    longDescriptionEn: text(en?.long_description ?? fr?.long_description),
    pricing,
    pricingEn: base.legacy_pricing_en || null,
    defaultMonthlyPrice: Number(base.compare_monthly_eur ?? base.legacy_default_monthly_price ?? 0) || 0,
    verdict: fr?.verdict || en?.verdict || verdictFallback,
    verdictEn: en?.verdict || fr?.verdict || null,
    pros: array(fr?.pros ?? en?.pros),
    prosEn: array(en?.pros ?? fr?.pros),
    cons: array(fr?.cons ?? en?.cons),
    consEn: array(en?.cons ?? fr?.cons),
    useCases: array(fr?.use_cases ?? en?.use_cases),
    useCasesEn: array(en?.use_cases ?? fr?.use_cases),
    covers: array(base.covers),
    relevantFor: array(base.relevant_for),
    personas: array(base.personas),
    affiliateLink: text(base.affiliate_link),
    websiteUrl: text(base.website_url || base.affiliate_link),
    logo: text(base.logo),
    ogImageUrl: base.og_image_url || null,
    soloRelevance: text(base.solo_relevance),
    teamRelevance: text(base.team_relevance),
    alternatives: array(base.alternatives),
    seo: fr?.seo || en?.seo || null,
    articles: array(base.articles),
    timeGainedHoursPerMonth: base.time_gained_hours_per_month ?? undefined,
    freeAlternative: base.free_alternative || null,
    tool_type: (base.tool_type || "satellite") as ToolType,
    substitutable: base.substitutable ?? true,
    host_app: base.host_app || null,
    bundle_parent: base.bundle_parent || null,
    verticals: array(base.verticals),
    functional_needs: array(base.functional_needs),
    ia_use_case: base.ia_use_case || null,
    betterAlternative: base.better_alternative || null,
    migrationGuide: base.migration_guide || null,
    downgradePlan: base.downgrade_plan || null,
    prescription_quality: (base.prescription_quality || "silence") as PrescriptionQuality,
    substitution_cluster_v2: base.substitution_cluster_v2 || null,
    pricing_v5: canonicalPricingV5(base),
    // Kept outside the current Tool contract but useful to future projection
    // consumers; the cast avoids silently dropping these public fields.
    relationships,
    galleryImages: fr?.gallery_images || en?.gallery_images || [],
    aiAngle: fr?.ai_angle || en?.ai_angle || null,
  } as Tool;
}

/** Read-only helper. It is intentionally not wired to a page yet. */
export async function fetchProjectedTool(slugOrId: string): Promise<Tool | null> {
  const { supabase } = await import("@/integrations/supabase/client");
  const catalog = (supabase as any).schema("catalog_api");
  let result = await catalog
    .from("published_tool_projection")
    .select("*")
    .eq("slug", slugOrId)
    .order("lang", { ascending: true });

  if (!result.error && result.data?.length) {
    return catalogProjectionRowsToTool(result.data as CatalogProjectionRow[]);
  }

  result = await catalog
    .from("published_tool_projection")
    .select("*")
    .eq("id", slugOrId)
    .order("lang", { ascending: true });

  if (result.error) throw result.error;
  return catalogProjectionRowsToTool((result.data || []) as CatalogProjectionRow[]);
}
