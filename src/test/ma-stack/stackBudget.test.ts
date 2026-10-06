import { describe, expect, it } from "vitest";
import { budgetEntry, estimateStackBudget, formatBudgetEstimate, formatApproximateBudget } from "@/lib/stackBudget";
const tool = (id: string, paid: string, free = "") => ({ id, pricing: { paid, free } });
describe("catalogue budget estimate", () => {
  it("produces one rounded approximate total in the selected currency", () => {
    const budget = estimateStackBudget([tool("a", "75,99 $/mois"), tool("b", "24,99 €/mois")], "EUR");
    expect(budget.totals).toHaveLength(1);
    expect(formatApproximateBudget(budget, "fr", "EUR")).toBe("≈ 90 €");
    const partial = estimateStackBudget([tool("a", "10 €/mois"), tool("b", "20 CA$/mois")], "EUR");
    expect(partial.included).toBe(1); expect(partial.excluded).toBe(1);
  });
  it("keeps source currencies separate and deduplicates tools", () => {
    const first = tool("a", "9$/mois (Core)");
    const budget = estimateStackBudget([first, first, tool("b", "Dès 19,99 $/mois"), tool("c", "10 EUR/month"), tool("d", "US$ 20/month")]);
    expect(budget.total).toBe(4);
    expect(budget.totals).toEqual([{ currency: "$", monthly: 28.99 }, { currency: "€", monthly: 10 }, { currency: "USD", monthly: 20 }]);
  });
  it("normalizes annual billing mathematically without currency conversion", () => {
    expect(budgetEntry(tool("a", "120 €/an"))).toEqual({ currency: "€", monthly: 10 });
    expect(formatBudgetEstimate(estimateStackBudget([tool("a", "120 €/an")]), "fr", true)).toBe("120 €");
  });
  it("includes the paid entry offer for freemium, never assumes a free subscription", () => {
    expect(budgetEntry(tool("a", "16 $/mois", "Plan gratuit disponible"))?.monthly).toBe(16);
    expect(budgetEntry(tool("b", "", "Entièrement gratuit"))?.monthly).toBe(0);
  });
  it("excludes ambiguous, one-off, usage-based, undisclosed or incomplete prices", () => {
    for (const paid of ["1 $/M input, 5 $/M output", "99 € achat unique", "Environ 10 €/mois", "Sur devis", "10 €/mois ou 100 €/an", "10 €/mois, minimum 3 utilisateurs", "10 €", "1,000 $/mois"]) expect(budgetEntry(tool(paid, paid))).toBeNull();
    expect(budgetEntry({ ...tool("a", "10 €/mois"), priceUndisclosed: true })).toBeNull();
    const partial = estimateStackBudget([tool("a", "10 €/mois"), tool("b", "Sur devis")]);
    expect(partial.included).toBe(1); expect(partial.excluded).toBe(1);
    expect(formatBudgetEstimate(estimateStackBudget([tool("b", "Sur devis")]), "fr")).toBe("Non disponible");
  });
});
