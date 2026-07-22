import { hasGenuineFreeTier, isFreemiumPricing } from "@/lib/pricing";

export type ToolPresentationInput = {
  id: string;
  slug?: string;
  name?: string;
  shortDescription?: string;
  shortDescriptionEn?: string;
  pricing?: { free?: string; paid?: string } | null;
  pricing_v5?: { compare_price_monthly_eur?: number | null } | null;
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
  const planLabel = freemium
    ? "Freemium"
    : freeTier
      ? (lang === "fr" ? "Gratuit" : "Free")
      : monthlyPrice > 0
        ? (lang === "fr" ? `${monthlyPrice} €/mois` : `€${monthlyPrice}/mo`)
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
