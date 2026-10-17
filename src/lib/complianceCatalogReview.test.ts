import { describe, expect, it } from "vitest";
import catalogue from "@/data/tools_v4.json";

const reviewed = ["vanta", "drata", "onetrust", "didomi", "axeptio"];
const record = (slug: string): any => catalogue.find((tool) => tool.slug === slug);
const axes = ["valeurAjoutee", "simplicite", "utilisation", "puissance", "reversibilite"];

describe("compliance catalogue review", () => {
  it.each(reviewed)("keeps %s sourced, rated and linked to existing public alternatives", (slug) => {
    const tool = record(slug);
    expect(tool.toolTrimRating.notedOn).toBe("2026-10-17");
    for (const axis of axes) {
      expect(tool.toolTrimRating[axis]).toBeGreaterThanOrEqual(1);
      expect(tool.toolTrimRating[axis]).toBeLessThanOrEqual(5);
      expect(tool.toolTrimRating.evidence[axis]).toContain("https://");
      expect(tool.toolTrimRating.evidenceEn[axis]).toContain("https://");
    }
    expect(tool.alternatives.length).toBeGreaterThan(0);
    for (const alternative of tool.alternatives) expect(record(alternative)).toBeDefined();
    expect(JSON.stringify(tool)).not.toMatch(/sovkern/i);
  });

  it("does not turn quote-only plans into made-up monthly prices or currencies", () => {
    for (const slug of reviewed.filter((slug) => slug !== "axeptio")) {
      for (const pricing of [record(slug).pricing_v5, record(slug).pricing_v5En]) {
        expect(pricing.compare_price_monthly_eur).toBe(0);
        for (const plan of pricing.plans) {
          expect(plan.nativeAmount).toBeNull();
          expect(plan.nativeCurrency).toBeNull();
          expect(plan.billingPeriod).toBeNull();
        }
      }
    }
  });

  it("keeps Axeptio annual totals separate from genuine monthly prices", () => {
    for (const [pricing, currency] of [[record("axeptio").pricing_v5, "EUR"], [record("axeptio").pricing_v5En, "USD"]] as const) {
      expect(pricing.plans[0]).toMatchObject({ nativeAmount: 90, nativeCurrency: currency, billingPeriod: "annual" });
      expect(pricing.plans[1]).toMatchObject({ nativeAmount: 29, nativeCurrency: currency, billingPeriod: "monthly" });
      expect(pricing.cautions.join(" ")).toMatch(/contradictoires|conflict/);
    }
  });

  it("removes unsourced Drata budget estimates and does not force Advanced for a second framework", () => {
    const tool = record("drata");
    expect(tool.description).not.toMatch(/7 500|24 600|45 000|70 000/);
    expect(tool.longDescription).toContain("un second référentiel n'impose donc pas automatiquement Advanced");
  });
});
