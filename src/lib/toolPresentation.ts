import { hasGenuineFreeTier, isFreemiumPricing } from "@/lib/pricing";
import { formatToolPrice } from "@/lib/currencyRates";
import { formatCurrencyAmount } from "@/lib/currency";

export type ToolPresentationInput = {
  id: string;
  slug?: string;
  name?: string;
  shortDescription?: string;
  shortDescriptionEn?: string;
  pricing?: { free?: string; paid?: string } | null;
  pricing_v5?: {
    compare_price_monthly_eur?: number | null;
    compare_plan_kind?: string | null;
    source_domain?: string | null;
    plans?: { isComparePlan?: boolean; billingPeriod?: string | null; nativeAmount?: number | null; nativeCurrency?: string | null }[];
  } | null;
  defaultMonthlyPrice?: number | null;
  substitutable?: boolean | null;
};

export type ToolReplaceability = "replaceable" | "not-replaceable" | "unknown";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export function getToolPresentation(tool: ToolPresentationInput, lang: "fr" | "en") {
  const name = cleanText(tool.name) || cleanText(tool.id);
  const descriptionFr = cleanText(tool.shortDescription);
  const descriptionEn = cleanText(tool.shortDescriptionEn) || descriptionFr;
  const rawCanonicalPrice = tool.pricing_v5?.compare_price_monthly_eur;
  const canonicalPrice = rawCanonicalPrice == null ? Number.NaN : Number(rawCanonicalPrice);
  const fallbackPrice = Number(tool.defaultMonthlyPrice);
  const monthlyPrice = Number.isFinite(canonicalPrice) && canonicalPrice >= 0
    ? canonicalPrice
    : Number.isFinite(fallbackPrice) && fallbackPrice >= 0 ? fallbackPrice : 0;
  const freeTier = hasGenuineFreeTier(tool.pricing?.free);
  const freemium = isFreemiumPricing(tool.pricing);
  const oneTime = tool.pricing_v5?.compare_plan_kind === "one_time";
  const lifetimeLicense = /licence (?:à vie|perp[ée]tuelle)|lifetime|perpetual/i.test(`${tool.pricing_v5?.compare_plan_name || ""} ${tool.pricing?.paid || ""}`);
  const maxonAnnual = tool.pricing_v5?.source_domain === "maxon.net"
    ? tool.pricing_v5.plans?.find((plan) => plan.isComparePlan && plan.billingPeriod === "annual" && plan.nativeAmount != null)
    : null;
  const planLabel = maxonAnnual
    ? `${formatCurrencyAmount(maxonAnnual.nativeAmount!, "EUR", lang)}/${lang === "fr" ? "an" : "yr"}`
    : freemium
    ? "Freemium"
    : freeTier
      ? (lang === "fr" ? "Gratuit" : "Free")
      : oneTime
        ? (lifetimeLicense ? (lang === "fr" ? "Licence à vie" : "Lifetime license") : (lang === "fr" ? "Achat unique" : "One-time purchase"))
      : monthlyPrice > 0
        ? (lang === "fr"
            ? `${formatToolPrice(tool, monthlyPrice, "EUR", "fr").text}/mois`
            : `${formatToolPrice(tool, monthlyPrice, "USD", "en").text}/mo`)
        : "N/A";
  const replaceability: ToolReplaceability = tool.substitutable === true
    ? "replaceable"
    : tool.substitutable === false ? "not-replaceable" : "unknown";

  return {
    slug: cleanText(tool.slug) || cleanText(tool.id),
    name,
    description: lang === "en" ? descriptionEn : descriptionFr,
    descriptionFr,
    descriptionEn,
    monthlyPrice,
    planLabel,
    replaceability,
  };
}
