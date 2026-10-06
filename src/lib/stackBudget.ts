import type { ToolSummary } from "@/hooks/useSupabaseData";
import { stackCatalogPrice } from "@/lib/stackView";
import { convertAmount, type Currency } from "@/lib/currencyRates";

type BudgetTool = Pick<ToolSummary, "id" | "pricing" | "pricingEn"> & { priceUndisclosed?: boolean };
export type BudgetEstimate = { totals: { currency: string; monthly: number }[]; included: number; excluded: number; total: number };

// Use only an unambiguous recurring source amount. Never use converted catalogue
// fields or assume that a free tier is the offer the user actually uses.
export function budgetEntry(tool: BudgetTool): { currency: string; monthly: number } | null {
  if (tool.priceUndisclosed) return null;
  const paid = tool.pricing?.paid?.trim() || "";
  if (stackCatalogPrice(tool, "fr") === "Gratuit") return { currency: "€", monthly: 0 };
  if (/environ|\benv\b|approx|about|~|usage|consommation|tokens?|\bAPI\b|sur devis|custom pricing|quote|minimum|au moins|at least|\d\s*[-–]\s*\d/i.test(paid)) return null;
  const amounts = [...paid.matchAll(/(?:(US\$|CA\$|AU\$|\$US|\$CA|\$AU|[$€£]|USD|EUR|GBP)\s*(\d[\d.,]*)|(?<![\d.,])(\d[\d.,]*)\s*(US\$|CA\$|AU\$|\$US|\$CA|\$AU|[$€£]|USD|EUR|GBP))\s*\/?\s*(mois|months?|mo\b|an\b|ans\b|years?|yr\b)?/gi)];
  if (amounts.length !== 1) return null;
  const match = amounts[0];
  const raw = match[2] || match[3];
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(raw) || !match[5]) return null;
  const amount = Number(raw.replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const currency = match[1] || match[4];
  // Normalize only explicit equivalents. A bare $ stays separate from USD.
  const aliases: Record<string, string> = { EUR: "€", GBP: "£", "US$": "USD", "$US": "USD", "CA$": "CAD", "$CA": "CAD", "AU$": "AUD", "$AU": "AUD" };
  return { currency: aliases[currency.toUpperCase()] || currency, monthly: /^(mo|month)/i.test(match[5]) ? amount : amount / 12 };
}

export function estimateStackBudget(tools: BudgetTool[], targetCurrency?: Currency): BudgetEstimate {
  const unique = [...new Map(tools.map(tool => [tool.id, tool])).values()];
  const totals = new Map<string, number>();
  let included = 0;
  for (const tool of unique) {
    const entry = budgetEntry(tool);
    if (!entry) continue;
    const sourceCurrencies: Record<string, Currency> = { "$": "USD", USD: "USD", "€": "EUR", "£": "GBP" };
    const sourceCurrency = sourceCurrencies[entry.currency];
    if (targetCurrency && !sourceCurrency && entry.monthly > 0) continue;
    included++;
    const currency = targetCurrency || entry.currency;
    const monthly = targetCurrency && sourceCurrency ? convertAmount(entry.monthly, sourceCurrency, targetCurrency) : entry.monthly;
    if (monthly > 0) totals.set(currency, (totals.get(currency) || 0) + monthly);
  }
  return { totals: [...totals].map(([currency, monthly]) => ({ currency, monthly })).sort((a, b) => a.currency.localeCompare(b.currency)), included, excluded: unique.length - included, total: unique.length };
}

export function formatApproximateBudget(estimate: BudgetEstimate, lang: string, currency: Currency, annual = false): string {
  if (!estimate.included) return "—";
  const amount = Math.round(estimate.totals.reduce((sum, entry) => sum + entry.monthly, 0) * (annual ? 12 : 1));
  return `≈ ${new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)}`;
}

export function formatBudgetEstimate(estimate: BudgetEstimate, lang: string, annual = false): string {
  if (!estimate.included) return lang === "en" ? "Not available" : "Non disponible";
  if (!estimate.totals.length) return "0";
  return estimate.totals.map(({ currency, monthly }) => `${new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR", { maximumFractionDigits: 2 }).format(monthly * (annual ? 12 : 1))} ${currency}`).join(" + ");
}
