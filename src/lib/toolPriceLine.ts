import type { Tool } from "@/data/types";
import { formatToolPrice } from "@/lib/currencyRates";
import { hasGenuineFreeTier, resolveMonthlyPrice } from "@/lib/pricing";

/** Ligne de prix de la barre d'action mobile. */
export function toolPriceLine(tool: Tool, lang: "fr" | "en", t: (fr: string, en: string) => string) {
  const pricing = lang === "en" ? (tool as any).pricingEn || tool.pricing : tool.pricing;
  const free = hasGenuineFreeTier(pricing?.free);
  const monthly = resolveMonthlyPrice(tool);
  const v5 = lang === "en" ? (tool as any).pricing_v5En || tool.pricing_v5 : tool.pricing_v5;
  const comparePlan = (v5?.plans || []).find((plan: any) => plan.isComparePlan);
  const oneTime = comparePlan ? comparePlan.billingPeriod == null && comparePlan.nativeAmount > 0 : false;
  const onQuote = /devis|quote|non public|not public/i.test(String(pricing?.paid || ""));
  const priceText = monthly > 0 || (comparePlan?.nativeAmount ?? 0) > 0
    ? formatToolPrice(tool, monthly, lang === "en" ? "USD" : "EUR", lang).text
    : null;
  const priceLine = priceText
    ? oneTime
      ? t(`${priceText}, licence à vie`, `${priceText} one-time`)
      : t(`Dès ${priceText}/mois`, `From ${priceText}/mo`)
    : onQuote
      ? t("Prix sur devis", "Price on quote")
      : free
        ? t("Gratuit", "Free")
        : null;

  return { priceLine, priceText, free, v5 };
}
