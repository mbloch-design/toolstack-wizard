import pricingTruthCsv from "@/data/pricing_truth.csv?raw";
import type { Tool } from "@/data/types";
import type { Currency } from "@/hooks/useCurrency";
import { convertCurrencyAmount } from "@/lib/currency";

type NativePrice = {
  amount: number;
  currency: Currency;
  source: "canonical_plan" | "pricing_truth";
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


/**
 * Prix natif atteste, ou rien.
 *
 * L'extraction par expression reguliere du texte tarifaire editorial a ete
 * retiree de cette chaine : elle prenait le premier montant non nul trouve,
 * sans verifier qu'il correspondait au plan de comparaison. Sur les 263 outils
 * mesures, 109 la voyaient contredire la valeur normalisee d'une facon
 * qu'aucune conversion n'explique (Adobe CC : 22,99 $ pour une application
 * seule contre 64,90 pour la suite ; 3ds Max : 785 $ annuels contre 149 au
 * mois). Un montant devine qui tombe juste reste un montant devine.
 *
 * Sans attestation, resolveDisplayPrice retombe sur la valeur normalisee du
 * catalogue, convertie et signalee comme telle par le drapeau `converted`.
 */
export function getNativeComparePrice(tool: Tool): NativePrice | null {
  const plan = tool.pricing_v5?.plans?.find((item) => item.isComparePlan && !item.isFree && item.nativeAmount != null);
  if (plan && (plan.nativeCurrency === "EUR" || plan.nativeCurrency === "USD" || plan.nativeCurrency === "GBP")) {
    return { amount: plan.nativeAmount!, currency: plan.nativeCurrency, source: "canonical_plan" };
  }
  const id = tool.slug || tool.id;
  return pricingTruth.get(id) || pricingTruth.get(tool.id) || null;
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
