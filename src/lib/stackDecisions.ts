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

/** Recover valid records individually, including older records without currency. */
export function normalizeStackDecisions(value: unknown): Record<string, StackDecision> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = Object.entries(value).filter((entry): entry is [string, StackDecision] => {
    const record = entry[1];
    if (!record || typeof record !== "object" || Array.isArray(record)) return false;
    const decision = record as Partial<StackDecision>;
    if (!["keep-both", "keep-one", "replace"].includes(decision.kind || "")) return false;
    if (typeof decision.kept !== "string" || !decision.kept.trim()) return false;
    if (typeof decision.saving !== "number" || !Number.isFinite(decision.saving) || decision.saving < 0) return false;
    if (typeof decision.at !== "string" || !Number.isFinite(Date.parse(decision.at))) return false;
    if (decision.removed !== undefined && (typeof decision.removed !== "string" || !decision.removed.trim())) return false;
    if (decision.kind !== "keep-both" && !decision.removed) return false;
    return decision.savingCurrency === undefined || isCurrency(decision.savingCurrency);
  });
  return Object.fromEntries(entries);
}

export function decisionSavingInCurrency(decision: StackDecision, currency: Currency): number | null {
  if (!isCurrency(decision.savingCurrency) || !Number.isFinite(decision.saving) || decision.saving < 0) return null;
  return convertAmount(decision.saving, decision.savingCurrency, currency);
}
