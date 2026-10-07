import type { ToolSummary } from "@/hooks/useSupabaseData";
import { pickNativePrice, stackCatalogPrice, type NativePrice } from "@/lib/stackView";
import type { Currency } from "@/lib/currencyRates";

type BudgetTool = Pick<ToolSummary, "id" | "pricing" | "pricingEn"> & { priceUndisclosed?: boolean; nativePrices?: NativePrice[] };
export type BudgetEstimate = { totals: { currency: string; monthly: number }[]; included: number; excluded: number; total: number };

// Only the attested compare-plan price, in its own currency. Never an amount
// read out of editorial text, never a conversion: totals stay per currency
// ("$59/mo + 11 €/mo"). A free tool counts as 0; a one-off licence is left out
// of a monthly budget.
export function budgetEntry(tool: BudgetTool, lang = "fr"): { currency: string; monthly: number } | null {
  if (tool.priceUndisclosed) return null;
  const label = stackCatalogPrice(tool, "fr");
  if (label === "Gratuit") return { currency: "EUR", monthly: 0 };
  const price = pickNativePrice(tool, lang);
  if (!price || price.period === "once") return null;
  return { currency: price.currency, monthly: price.period === "annual" ? price.amount / 12 : price.amount };
}

/** `_targetCurrency` is accepted for compatibility and ignored: no conversion. */
export function estimateStackBudget(tools: BudgetTool[], _targetCurrency?: Currency, lang = "fr"): BudgetEstimate {
  const unique = [...new Map(tools.map(tool => [tool.id, tool])).values()];
  const totals = new Map<string, number>();
  let included = 0;
  for (const tool of unique) {
    const entry = budgetEntry(tool, lang);
    if (!entry) continue;
    included++;
    if (entry.monthly > 0) totals.set(entry.currency, (totals.get(entry.currency) || 0) + entry.monthly);
  }
  return { totals: [...totals].map(([currency, monthly]) => ({ currency, monthly })).sort((a, b) => a.currency.localeCompare(b.currency)), included, excluded: unique.length - included, total: unique.length };
}

const formatMoney = (amount: number, currency: string, lang: string, digits: number) => {
  const value = new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR", { maximumFractionDigits: digits }).format(amount);
  const symbol = { USD: "$", EUR: "€", GBP: "£" }[currency] || currency;
  return lang === "en" && symbol.length === 1 ? `${symbol}${value}` : `${value}\u00a0${symbol}`;
};

/** Per-currency totals joined with "+", rounded. `_currency` ignored (no conversion). */
export function formatApproximateBudget(estimate: BudgetEstimate, lang: string, _currency?: Currency, annual = false): string {
  if (!estimate.included) return "—";
  if (!estimate.totals.length) return formatMoney(0, lang === "en" ? "USD" : "EUR", lang, 0);
  return estimate.totals.map(({ currency, monthly }) => formatMoney(Math.round(monthly * (annual ? 12 : 1)), currency, lang, 0)).join(" + ");
}

export function formatBudgetEstimate(estimate: BudgetEstimate, lang: string, annual = false): string {
  if (!estimate.included) return lang === "en" ? "Not available" : "Non disponible";
  if (!estimate.totals.length) return "0";
  return estimate.totals.map(({ currency, monthly }) => formatMoney(monthly * (annual ? 12 : 1), currency, lang, 2)).join(" + ");
}
