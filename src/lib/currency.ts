import { EUR_TO_USD, type Currency } from "@/hooks/useCurrency";

export function convertCurrencyAmount(
  amount: number,
  from: Currency,
  to: Currency,
): number {
  if (from === to) return amount;
  return from === "EUR" ? amount * EUR_TO_USD : amount / EUR_TO_USD;
}

export function formatCurrencyAmount(
  amount: number,
  currency: Currency,
  lang: string,
): string {
  return new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Formats a catalogue amount whose normalized source of truth is EUR. */
export function formatEuroAmount(amount: number, currency: Currency, lang: string): string {
  return formatCurrencyAmount(convertCurrencyAmount(amount, "EUR", currency), currency, lang);
}

