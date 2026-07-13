import { describe, expect, it } from "vitest";
import { computeStackPricing, formatStackToolPrice, getStackToolPriceKind, type StackPricedTool } from "@/lib/stackPricing";

function tool(overrides: Partial<StackPricedTool> & Pick<StackPricedTool, "id" | "name">): StackPricedTool {
  return {
    defaultMonthlyPrice: 0,
    pricing: { free: "", paid: "" },
    ...overrides,
  };
}

describe("stack pricing", () => {
  it("distingue gratuit, prix inconnu et prix de départ", () => {
    const free = tool({ id: "free", name: "Free", pricing: { free: "Plan gratuit permanent", paid: "" } });
    const unknown = tool({ id: "unknown", name: "Unknown" });
    const paid = tool({ id: "paid", name: "Paid", defaultMonthlyPrice: 19 });

    expect(getStackToolPriceKind(free)).toBe("free");
    expect(getStackToolPriceKind(unknown)).toBe("unknown");
    expect(getStackToolPriceKind(paid)).toBe("starting-at");
    expect(formatStackToolPrice(free, "fr")).toBe("Gratuit");
    expect(formatStackToolPrice(unknown, "fr")).toBe("Prix inconnu");
    expect(formatStackToolPrice(paid, "fr")).toBe("À partir de 19 €/mois");
  });

  it("compte une seule fois un outil présent dans plusieurs besoins", () => {
    const paid = tool({ id: "paid", slug: "paid", name: "Paid", defaultMonthlyPrice: 19 });
    const summary = computeStackPricing([paid, paid], [paid]);

    expect(summary.total).toBe(19);
    expect(summary.uniqueToolCount).toBe(1);
    expect(summary.pricedToolCount).toBe(1);
  });

  it("expose le nombre de prix inconnus sans les présenter comme gratuits", () => {
    const free = tool({ id: "free", name: "Free", pricing: { free: "Entièrement gratuit", paid: "" } });
    const unknown = tool({ id: "unknown", name: "Unknown" });
    const paid = tool({ id: "paid", name: "Paid", defaultMonthlyPrice: 12 });
    const summary = computeStackPricing([free, unknown, paid], [free, unknown, paid]);

    expect(summary.total).toBe(12);
    expect(summary.freeToolCount).toBe(1);
    expect(summary.unknownPriceCount).toBe(1);
  });

  it("ne force un bundle que s'il est réellement moins cher", () => {
    const expensiveBundle = tool({ id: "suite", name: "Suite", defaultMonthlyPrice: 30 });
    const childA = tool({ id: "child-a", name: "Child A", defaultMonthlyPrice: 10, bundle_parent: "suite" });
    const childB = tool({ id: "child-b", name: "Child B", defaultMonthlyPrice: 10, bundle_parent: "suite" });
    const standalone = computeStackPricing([childA, childB], [expensiveBundle, childA, childB]);
    expect(standalone.total).toBe(20);
    expect(standalone.bundleLines).toHaveLength(0);

    const cheaperBundle = { ...expensiveBundle, defaultMonthlyPrice: 15 };
    const bundled = computeStackPricing([childA, childB], [cheaperBundle, childA, childB]);
    expect(bundled.total).toBe(15);
    expect(bundled.bundleLines).toHaveLength(1);
  });
});
