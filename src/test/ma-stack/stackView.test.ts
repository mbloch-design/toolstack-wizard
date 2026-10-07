import { describe, expect, it } from "vitest";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import type { Category, ToolPricingPlan } from "@/data/types";
import { knownStackAlternatives, stackCatalogPrice, stackPlanPrice, stackTerritories } from "@/lib/stackView";
const tool = (id: string, categoryId = "design", extra: Partial<ToolSummary> = {}): ToolSummary => ({ id, slug: id, name: id, categoryId, pricing: { free: "", paid: "" }, ...extra } as ToolSummary);

describe("Mon Stack catalogue representation", () => {
  it("uses one main category per tool and never creates empty territories", () => {
    const categories = [{ id: "design", name: "Design", nameEn: "Design" }, { id: "crm", name: "CRM", nameEn: "CRM" }] as Category[];
    const groups = stackTerritories([tool("figma"), tool("canva", "design", { functional_needs: ["crm"] })], categories, "en");
    expect(groups).toHaveLength(1);
    expect(groups[0].tools.map((item) => item.id)).toEqual(["canva", "figma"]);
    expect(stackTerritories([], categories, "fr")).toEqual([]);
  });
  it("uses explicit or shared-cluster relations, never just a shared category", () => {
    const source = tool("miro", "design", { freeAlternative: "figjam", substitution_cluster_v2: "whiteboard" });
    expect(knownStackAlternatives(source, [source, tool("figjam"), tool("mural", "design", { substitution_cluster_v2: "whiteboard" }), tool("canva")]).map((item) => item.id)).toEqual(["figjam", "mural"]);
  });
  it("omits unknown/undisclosed prices and trials, preserves literal prices and currencies", () => {
    expect(stackCatalogPrice(tool("x"), "fr")).toBeNull();
    expect(stackCatalogPrice(tool("x", "design", { pricing: { free: "Essai gratuit 14 jours", paid: "" } }), "fr")).toBeNull();
    expect(stackCatalogPrice(tool("x", "design", { priceUndisclosed: true, pricing: { free: "Gratuit", paid: "" } }), "fr")).toBeNull();
    expect(stackCatalogPrice(tool("x", "design", { pricing: { free: "", paid: "$12/mo, billed annually" } }), "en")).toBeNull();
    expect(stackCatalogPrice(tool("x", "design", { nativePrices: [{ amount: 12, currency: "USD", period: "monthly" }] }), "en")).toBe("From $12/mo");
    // A vendor publishing both currencies: dollars on the English page, euros on the French one.
    const both = tool("x", "design", { nativePrices: [{ amount: 11, currency: "EUR", period: "monthly" }, { amount: 12, currency: "USD", period: "monthly" }] });
    expect(stackCatalogPrice(both, "en")).toBe("From $12/mo");
    expect(stackCatalogPrice(both, "fr")).toBe("Dès 11\u00a0€/mois");
  });
  it("shows updated catalogue data rather than a stored price", () => {
    const selection = ["figma"];
    const before = [tool("figma", "design", { nativePrices: [{ amount: 12, currency: "EUR", period: "monthly" }] })];
    const after = [tool("figma", "design", { nativePrices: [{ amount: 15, currency: "EUR", period: "monthly" }] })];
    expect(stackCatalogPrice(before.find((item) => selection.includes(item.id))!, "fr")).toBe("Dès 12\u00a0€/mois");
    expect(stackCatalogPrice(after.find((item) => selection.includes(item.id))!, "fr")).toBe("Dès 15\u00a0€/mois");
  });
  it("preserves annual native amounts, unit, tax and billing commitment", () => {
    const plan = { nativeAmount: 120, nativeCurrency: "USD", billingPeriod: "annual", billingCommitment: "annual_prepaid", pricingUnit: "per seat", taxInclusion: "ht" } as ToolPricingPlan;
    expect(stackPlanPrice(plan, "en")).toBe("120 USD/year · per seat excl. tax · annual billing");
    expect(stackPlanPrice({ ...plan, nativeAmount: null }, "en")).toBeNull();
    expect(stackPlanPrice({ ...plan, pricingUnit: "unknown-internal-unit" }, "en")).toBeNull();
    expect(stackPlanPrice({ ...plan, pricingUnit: "one_time", billingPeriod: null, billingCommitment: null }, "fr")).toBe("120 USD · achat unique HT");
  });
});
