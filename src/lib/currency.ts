import { convertAmount, formatAmount, type Currency } from "@/lib/currencyRates";

export function convertCurrencyAmount(
  amount: number,
  from: Currency,
  to: Currency,
): number {
  return convertAmount(amount, from, to);
}

export function formatCurrencyAmount(
  amount: number,
  currency: Currency,
  lang: string,
): string {
  return formatAmount(amount, currency, lang);
}

/** Formats a catalogue amount whose normalized source of truth is EUR. */
export function formatEuroAmount(amount: number, currency: Currency, lang: string): string {
  return formatAmount(convertAmount(amount, "EUR", currency), currency, lang);
}
