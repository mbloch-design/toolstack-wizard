import { describe, expect, it } from "vitest";
import type { Tool } from "@/data/types";
import { comparisonPriceDisplay } from "@/lib/comparisonPricing";
import { decisionSavingInCurrency, type StackDecision } from "@/lib/stackDecisions";
import { EUR_TO_USD } from "@/lib/currencyRates";

const tool = (override: Partial<Tool> = {}) => ({ id: "test", name: "Test", defaultMonthlyPrice: 0, pricing: { free: "", paid: "" }, ...override } as Tool);
const plan = (override = {}) => ({ planKey: "entry", displayName: "Entry", isFree: false, isComparePlan: true, nativeAmount: 99, nativeCurrency: "USD", billingPeriod: null, ...override });

describe("comparison pricing audit", () => {
  it("keeps a one-time native amount despite a zero monthly comparison price", () => {
    const record = tool({ pricing_v5: { compare_price_monthly_eur: 0, compare_plan_kind: "one_time", plans: [plan({ pricingUnit: "one_time" })] } });
    expect(comparisonPriceDisplay(record, "fr").label).toContain("99");
    expect(comparisonPriceDisplay(record, "fr").period).toBe("achat unique");
    expect(comparisonPriceDisplay(record, "en").period).toBe("one-time");
  });
  it("does not derive free access from an absent monthly price or a trial", () => {
    expect(comparisonPriceDisplay(tool(), "fr").kind).toBe("unknown");
    expect(comparisonPriceDisplay(tool({ pricing: { free: "Essai gratuit 90 jours", paid: "Licence à vie" } }), "fr").kind).toBe("trial");
    expect(comparisonPriceDisplay(tool({ pricing: { free: "Non communiqué", paid: "Sur devis" } }), "fr").kind).toBe("custom");
  });
  it("treats generic free placeholders and undisclosed prices as unknown", () => {
    expect(comparisonPriceDisplay(tool({ pricing: { free: "Gratuit ou plan gratuit disponible", paid: "" } }), "fr").kind).toBe("unknown");
    expect(comparisonPriceDisplay(tool({ pricing_v5: { compare_plan_name: "Prix non public", compare_price_monthly_eur: 0 } }), "fr").kind).toBe("unknown");
  });
  it("retains genuine free access and monthly / annual native periods", () => {
    expect(comparisonPriceDisplay(tool({ pricing: { free: "Entièrement gratuit", paid: "" } }), "fr").label).toBe("Gratuit");
    for (const [billingPeriod, suffix] of [["monthly", "/mois"], ["annual", "/an"]] as const) {
      expect(comparisonPriceDisplay(tool({ pricing_v5: { compare_price_monthly_eur: 10, plans: [plan({ billingPeriod })] } }), "fr").period).toBe(suffix);
    }
  });
  it("does not invent a monthly period for an incomplete native observation", () => {
    expect(comparisonPriceDisplay(tool({ pricing_v5: { compare_price_monthly_eur: 0, plans: [plan()] } }), "fr").period).toBeNull();
  });
});

describe("persistent decision currency", () => {
  const decision = { kind: "keep-one", kept: "figma", removed: "canva", saving: 9.17, at: "2026-10-07T00:00:00Z" } as StackDecision;
  it("converts a recorded amount using its own currency", () => {
    expect(decisionSavingInCurrency({ ...decision, savingCurrency: "EUR" }, "USD")).toBeCloseTo(9.17 * EUR_TO_USD);
    expect(decisionSavingInCurrency({ ...decision, savingCurrency: "USD" }, "EUR")).toBeCloseTo(9.17 / EUR_TO_USD);
  });
  it("does not guess the currency of legacy savings or accept corrupt amounts", () => {
    expect(decisionSavingInCurrency(decision, "USD")).toBeNull();
    expect(decisionSavingInCurrency({ ...decision, saving: NaN, savingCurrency: "EUR" }, "EUR")).toBeNull();
    expect(decisionSavingInCurrency({ ...decision, saving: -5, savingCurrency: "EUR" }, "EUR")).toBeNull();
  });
});
