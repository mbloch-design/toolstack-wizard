import { convertAmount, isCurrency, type Currency } from "@/lib/currencyRates";

export type StackDecision = {
  kind: "keep-both" | "keep-one" | "replace";
  kept: string;
  removed?: string;
  /** Monthly saving in savingCurrency. Older records omit the currency. */
  saving: number;
  savingCurrency?: Currency;
  at: string;
};

export function decisionSavingInCurrency(decision: StackDecision, currency: Currency): number | null {
  if (!isCurrency(decision.savingCurrency) || !Number.isFinite(decision.saving) || decision.saving < 0) return null;
  return convertAmount(decision.saving, decision.savingCurrency, currency);
}
