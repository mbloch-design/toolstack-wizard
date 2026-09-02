import pricingTruthCsv from "@/data/pricing_truth.csv?raw";
import type { Tool } from "@/data/types";
import type { Currency } from "@/hooks/useCurrency";
import { convertCurrencyAmount } from "@/lib/currency";

type NativePrice = {
  amount: number;
  currency: Currency;
  source: "canonical_plan" | "pricing_truth" | "editorial_price";
};

export type ResolvedDisplayPrice = {
  amount: number;
  currency: Currency;
  converted: boolean;
  nativePrice: NativePrice | null;
};

function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[i + 1] === "\n") i += 1;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const pricingTruth = (() => {
  const [headers, ...rows] = parseCsvRows(pricingTruthCsv);
  const idIndex = headers.indexOf("id");
  const amountIndex = headers.indexOf("price_original");
  const currencyIndex = headers.indexOf("price_original_currency");
  const result = new Map<string, NativePrice>();
  rows.forEach((row) => {
    const currency = row[currencyIndex];
    const amount = Number(row[amountIndex]);
    if (row[idIndex] && Number.isFinite(amount) && (currency === "EUR" || currency === "USD" || currency === "GBP")) {
      result.set(row[idIndex], { amount, currency, source: "pricing_truth" });
    }
  });
  return result;
})();

function extractEditorialNativePrice(tool: Tool): NativePrice | null {
  const text = [tool.pricing?.paid, tool.pricingEn?.paid].filter(Boolean).join(" ");
  // "paid" text often lists the free tier first (e.g. "Free: 0 $ ; Pro: 22 $/mois"),
  // so the first amount found isn't necessarily the actual paid price — skip zero matches.
  const matches = text.matchAll(/(?:([$€£])\s*([0-9]+(?:[.,][0-9]+)?)|([0-9]+(?:[.,][0-9]+)?)\s*([$€£]))/g);
  for (const match of matches) {
    const symbol = match[1] || match[4];
    const amount = Number((match[2] || match[3]).replace(",", "."));
    if (Number.isFinite(amount) && amount > 0) {
      return {
        amount,
        currency: symbol === "$" ? "USD" : symbol === "£" ? "GBP" : "EUR",
        source: "editorial_price",
      };
    }
  }
  return null;
}

export function getNativeComparePrice(tool: Tool): NativePrice | null {
  const plan = tool.pricing_v5?.plans?.find((item) => item.isComparePlan && !item.isFree && item.nativeAmount != null);
  if (plan && (plan.nativeCurrency === "EUR" || plan.nativeCurrency === "USD" || plan.nativeCurrency === "GBP")) {
    return { amount: plan.nativeAmount!, currency: plan.nativeCurrency, source: "canonical_plan" };
  }
  const id = tool.slug || tool.id;
  return pricingTruth.get(id) || pricingTruth.get(tool.id) || extractEditorialNativePrice(tool);
}

export function resolveDisplayPrice(
  tool: Tool,
  normalizedEur: number,
  selectedCurrency: Currency,
): ResolvedDisplayPrice {
  const nativePrice = getNativeComparePrice(tool);
  if (nativePrice?.currency === selectedCurrency) {
    return { amount: nativePrice.amount, currency: selectedCurrency, converted: false, nativePrice };
  }
  if (selectedCurrency === "EUR") {
    return { amount: normalizedEur, currency: "EUR", converted: false, nativePrice };
  }
  return {
    amount: convertCurrencyAmount(normalizedEur, "EUR", selectedCurrency),
    currency: selectedCurrency,
    converted: true,
    nativePrice,
  };
}
