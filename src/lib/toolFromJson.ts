import type { Tool } from "@/data/types";
import { applyAuditedToolUrls } from "@/lib/toolUrlCorrections.mjs";

export function asLocalizedText(value: unknown, fallback = "", locale: "fr" | "en" = "fr"): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidate = record[locale] ?? record.fr ?? record.en ?? record.name ?? record.label;
    if (candidate != null && candidate !== value) return asLocalizedText(candidate, fallback, locale);
    const firstText = Object.values(record).find((item) => typeof item === "string");
    if (firstText) return firstText;
  }
  return fallback;
}

export function mapToolFromJson(raw: unknown): Tool {
  // Catalogue records retain their existing permissive field contract.
  const t = raw as Record<string, any>;
  return applyAuditedToolUrls({
    id: asLocalizedText(t.id, ""),
    slug: asLocalizedText(t.slug || t.id, ""),
    name: asLocalizedText(t.name, asLocalizedText(t.id, ""), "fr"),
    categoryId: asLocalizedText(t.category || t.categoryId, ""),
    shortDescription: asLocalizedText(t.shortDescription || t.short_description, "", "fr"),
    shortDescriptionEn: asLocalizedText(t.shortDescriptionEn || t.short_description_en || t.shortDescription || t.short_description, "", "en"),
    longDescription: asLocalizedText(t.longDescription || t.long_description, "", "fr"),
    longDescriptionEn: asLocalizedText(t.longDescriptionEn || t.long_description_en || t.longDescription || t.long_description, "", "en"),
    pricing: t.pricing || t.pricingTiers || { free: "", paid: "" },
    pricingEn: t.pricingEn || t.pricing_en || null,
    defaultMonthlyPrice: t.defaultMonthlyPrice || t.default_monthly_price || 0,
    verdict: t.verdict || { keepIf: [], avoidIf: [], threshold: "" },
    verdictEn: t.verdictEn || t.verdict_en || null,
    pros: t.pros || [],
    prosEn: t.prosEn || t.pros_en || null,
    cons: t.cons || [],
    consEn: t.consEn || t.cons_en || null,
    useCases: t.useCases || t.use_cases || [],
    useCasesEn: t.useCasesEn || t.use_cases_en || null,
    covers: t.covers || [],
    relevantFor: t.relevantFor || t.relevant_for || [],
    personas: t.personas || [],
    affiliateLink: asLocalizedText(t.affiliateLink || t.affiliate_link, ""),
    affiliateDisclosureFr: t.affiliateDisclosureFr,
    affiliateDisclosureEn: t.affiliateDisclosureEn,
    affiliateCtaLabelFr: t.affiliateCtaLabelFr,
    affiliateCtaLabelEn: t.affiliateCtaLabelEn,
    promoCode: t.promoCode,
    promoDescriptionFr: t.promoDescriptionFr,
    promoDescriptionEn: t.promoDescriptionEn,
    websiteUrl: asLocalizedText(t.websiteUrl || t.website_url || t.affiliateLink || t.affiliate_link, ""),
    logo: asLocalizedText(t.logo, ""),
    ogImageUrl: t.ogImageUrl || t.og_image_url || null,
    galleryImages: t.galleryImages || t.gallery_images || [],
    soloRelevance: t.soloRelevance || t.solo_relevance || "",
    teamRelevance: t.teamRelevance || t.team_relevance || "",
    alternatives: t.alternatives || [],
    seo: t.seo || null,
    articles: t.articles || [],
    timeGainedHoursPerMonth: t.timeGainedHoursPerMonth ?? t.time_gained_hours_per_month ?? undefined,
    freeAlternative: t.freeAlternative || t.free_alternative || null,
    tool_type: t.tool_type || "satellite",
    substitutable: t.substitutable ?? true,
    host_app: t.host_app || null,
    bundle_parent: t.bundle_parent || null,
    verticals: t.verticals || [],
    functional_needs: t.functional_needs || t.covers || [],
    ia_use_case: t.ia_use_case || null,
    betterAlternative: t.betterAlternative || t.better_alternative || null,
    migrationGuide: t.migrationGuide || t.migration_guide || null,
    downgradePlan: t.downgradePlan || t.downgrade_plan || null,
    prescription_quality: t.prescription_quality || "silence",
    prescription_output: t.prescription_output || null,
    prescription_block_reasons: t.prescription_block_reasons || [],
    prescription_context_questions: t.prescription_context_questions || [],
    substitution_cluster_v2: t.substitution_cluster_v2 || null,
    pricing_v5: t.pricing_v5 || null,
    pricing_v5En: t.pricing_v5En || null,
    decision_policy_v3: t.decision_policy_v3 || null,
    toolTrimRating: t.toolTrimRating || null,
  });
}
