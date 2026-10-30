import { explicitNonNumericStatus } from "./nativeComparePlan";
import type { Tool } from "@/data/types";
import { formatToolPrice } from "@/lib/currencyRates";
import { hasConfirmedFreeTier, isPriceUndisclosed, resolveMonthlyPrice } from "@/lib/pricing";

/** Ligne de prix de la barre d'action mobile. */
export function toolPriceLine(tool: Tool, lang: "fr" | "en", t: (fr: string, en: string) => string) {
  const pricing = lang === "en" ? (tool as any).pricingEn || tool.pricing : tool.pricing;
  const free = hasConfirmedFreeTier(tool);
  const monthly = resolveMonthlyPrice(tool);
  const v5 = lang === "en" ? (tool as any).pricing_v5En || tool.pricing_v5 : tool.pricing_v5;
  const comparePlan = (v5?.plans || []).find((plan: any) => plan.isComparePlan);
  const oneTime = comparePlan ? (["one_time", "one-time"].includes(comparePlan.billingPeriod) || (comparePlan.billingPeriod == null && comparePlan.nativeAmount > 0)) : false;
  const onQuote = isPriceUndisclosed(tool) || /devis|quote|non public|not public/i.test(String(pricing?.paid || ""));
  const priceText = monthly > 0 || (comparePlan?.nativeAmount ?? 0) > 0
    ? formatToolPrice(tool, monthly, lang === "en" ? "USD" : "EUR", lang).text
    : null;
  const intent = explicitNonNumericStatus(tool);
  const priceLine = intent ? intent === "usage" ? t("Selon l’usage", "Usage based") : intent === "quote" ? t("Prix sur devis", "Price on quote") : t("Prix non communiqué", "Price not public") : priceText
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
