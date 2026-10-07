import type { Tool } from "@/data/types";
import { currencyForLang, formatToolPrice } from "./currencyRates";
import { hasGenuineFreeTier, isPriceUndisclosed, resolveMonthlyPrice } from "./pricing";

export type ComparisonPriceDisplay = {
  kind: "paid" | "free" | "trial" | "custom" | "unknown";
  label: string;
  period: string | null;
  amount: number | null;
  currency: string | null;
};

/** Preserve the published amount and its actual billing period. Zero alone
 * carries no evidence of free access, and an annual total is never monthly. */
export function comparisonPriceDisplay(tool: Tool, lang: string): ComparisonPriceDisplay {
  const fr = lang !== "en";
  const pricing = (fr ? tool.pricing_v5 : tool.pricing_v5En) || tool.pricing_v5;
  const plan = pricing?.plans?.find(p => p.isComparePlan && !p.comingSoon)
    || tool.pricing_v5?.plans?.find(p => p.isComparePlan && !p.comingSoon)
    || tool.pricing_v5En?.plans?.find(p => p.isComparePlan && !p.comingSoon);
  const oneTime = plan?.pricingUnit === "one_time" || pricing?.compare_plan_kind === "one_time";
  if (plan && !plan.isFree && typeof plan.nativeAmount === "number" && Number.isFinite(plan.nativeAmount)
      && plan.nativeAmount > 0 && typeof plan.nativeCurrency === "string" && /^[A-Z]{3}$/.test(plan.nativeCurrency)) {
    return {
      kind: "paid", label: new Intl.NumberFormat(fr ? "fr-FR" : "en-US", {
        style: "currency", currency: plan.nativeCurrency,
        minimumFractionDigits: plan.nativeAmount % 1 ? 2 : 0, maximumFractionDigits: 2,
      }).format(plan.nativeAmount),
      period: oneTime ? (fr ? "achat unique" : "one-time")
        : plan.billingPeriod === "annual" ? (fr ? "/an" : "/yr")
        : plan.billingPeriod === "monthly" ? (fr ? "/mois" : "/mo") : null,
      amount: plan.nativeAmount, currency: plan.nativeCurrency,
    };
  }
  const monthly = resolveMonthlyPrice(tool);
  if (monthly > 0 && !oneTime && !plan) {
    const display = formatToolPrice(tool, monthly, currencyForLang(lang), lang);
    return { kind: "paid", label: display.text, period: fr ? "/mois" : "/mo", amount: display.amount, currency: display.currency };
  }
  const text = (fr ? tool.pricing : tool.pricingEn) || tool.pricing;
  const freeText = text?.free || "";
  const placeholderFree = /^(gratuit ou plan gratuit disponible|free or free plan available)[.!]?$/i.test(freeText.trim());
  const unknown = (kind: ComparisonPriceDisplay["kind"], label: string): ComparisonPriceDisplay =>
    ({ kind, label, period: null, amount: null, currency: null });
  if (isPriceUndisclosed(tool)) return unknown("unknown", fr ? "Prix non communiqué" : "Price undisclosed");
  if (/sur devis|on quote|contact sales|custom pric/i.test(`${freeText} ${text?.paid || ""}`)) {
    return unknown("custom", fr ? "Sur devis" : "On quote");
  }
  if (plan?.isFree || (!placeholderFree && hasGenuineFreeTier(freeText) && /gratuit|\bfree\b|open[ -]?source/i.test(freeText))) {
    return { kind: "free", label: fr ? "Gratuit" : "Free", period: null, amount: 0, currency: null };
  }
  if (/essai|trial/i.test(freeText)) return unknown("trial", fr ? "Essai gratuit" : "Free trial");
  return unknown("unknown", fr ? "Prix non renseigné" : "Price unknown");
}

export function comparisonPriceText(tool: Tool, lang: string): string {
  const price = comparisonPriceDisplay(tool, lang);
  return price.period ? `${price.label}${price.period.startsWith("/") ? "" : " · "}${price.period}` : price.label;
}
