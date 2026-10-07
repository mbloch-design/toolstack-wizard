import { describe, expect, it } from "vitest";
import { budgetEntry, estimateStackBudget, formatBudgetEstimate, formatApproximateBudget } from "@/lib/stackBudget";
type Period = "monthly" | "annual" | "once";
const tool = (id: string, amount?: number, currency = "EUR", period: Period = "monthly", free = "") =>
  ({ id, pricing: { paid: "", free }, ...(amount != null ? { nativePrices: [{ amount, currency, period }] } : {}) });
describe("catalogue budget estimate (attested prices, no conversion)", () => {
  it("keeps one total per real currency, never converts", () => {
    const budget = estimateStackBudget([tool("a", 75.99, "USD"), tool("b", 24.99, "EUR")], "EUR");
    expect(budget.totals).toEqual([{ currency: "EUR", monthly: 24.99 }, { currency: "USD", monthly: 75.99 }]);
    expect(formatApproximateBudget(budget, "fr", "EUR")).toBe("25\u00a0€ + 76\u00a0$");
    expect(formatApproximateBudget(budget, "en", "USD")).toBe("€25 + $76");
  });
  it("deduplicates tools and sums within a currency", () => {
    const first = tool("a", 9, "USD");
    const budget = estimateStackBudget([first, first, tool("b", 19.99, "USD"), tool("c", 10, "EUR")]);
    expect(budget.total).toBe(3);
    expect(budget.totals).toEqual([{ currency: "EUR", monthly: 10 }, { currency: "USD", monthly: 28.99 }]);
  });
  it("normalizes annual billing mathematically, leaves one-off licences out", () => {
    expect(budgetEntry(tool("a", 120, "EUR", "annual"))).toEqual({ currency: "EUR", monthly: 10 });
    expect(formatBudgetEstimate(estimateStackBudget([tool("a", 120, "EUR", "annual")]), "fr", true)).toBe("120\u00a0€");
    expect(budgetEntry(tool("b", 99, "EUR", "once"))).toBeNull();
  });
  it("counts a genuinely free tool as zero, never assumes a free subscription for a paid one", () => {
    expect(budgetEntry(tool("a", 16, "USD", "monthly", "Plan gratuit disponible"))?.monthly).toBe(16);
    expect(budgetEntry({ id: "b", pricing: { paid: "", free: "Entièrement gratuit" } })?.monthly).toBe(0);
  });
  it("excludes tools without an attested price, and undisclosed ones", () => {
    expect(budgetEntry({ id: "a", pricing: { paid: "Environ 10 €/mois", free: "" } })).toBeNull();
    expect(budgetEntry({ ...tool("a", 10), priceUndisclosed: true })).toBeNull();
    const partial = estimateStackBudget([tool("a", 10), { id: "b", pricing: { paid: "Sur devis", free: "" } }]);
    expect(partial.included).toBe(1); expect(partial.excluded).toBe(1);
    expect(formatBudgetEstimate(estimateStackBudget([{ id: "b", pricing: { paid: "Sur devis", free: "" } }]), "fr")).toBe("Non disponible");
  });
});
