import { expect, it } from "vitest";
import { mapToolFromJson } from "./toolFromJson";
import { formatPriceLabel, isOneTimePrice } from "./toolUtils";
import { toolPriceFacts } from "./toolSeo";
import { toolPriceLine } from "./toolPriceLine";
import { resolveMonthlyPrice, hasConfirmedFreeTier } from "./pricing";
import { nativePriceFromTool } from "./currencyRates";
const make = (
  status: string,
  period = "monthly",
  amount: number | null = null,
) =>
  mapToolFromJson({
    id: "fresh-authoring",
    slug: "fresh-authoring",
    name: "Fresh",
    defaultMonthlyPrice: 999,
    pricing: { free: "Old free statement", paid: "Old paid statement" },
    pricing_v5: {
      compare_price_monthly_eur: 999,
      plans: [
        {
          planKey: "p",
          displayName: "Current offer",
          isFree: false,
          isComparePlan: true,
          priceStatus: status,
          nativeAmount: amount,
          nativeCurrency: "EUR",
          billingPeriod: period,
        },
      ],
    },
  });
it.each(["quote", "unknown", "usage"])(
  "uses explicit %s intent across facts, mobile line, labels and price instead of stale legacy values",
  (status) => {
    const tool = make(status);
    expect(resolveMonthlyPrice(tool)).toBe(0);
    expect(nativePriceFromTool(tool)).toBeNull();
    expect(hasConfirmedFreeTier(tool)).toBe(false);
    expect(formatPriceLabel(tool, 0, (fr) => fr)).not.toBe("Gratuit");
    expect(toolPriceFacts(tool).hasPrice).toBe(false);
    expect(toolPriceLine(tool, "fr", (fr) => fr).priceLine).not.toMatch(
      /999|Gratuit/,
    );
  },
);
it.each(["one_time", "one-time"])(
  "keeps %s purchase totals without any monthly suffix in shared consumers",
  (period) => {
    const tool = make("paid", period, 120);
    expect(isOneTimePrice(tool)).toBe(true);
    expect(toolPriceFacts(tool).oneTime).toBe(true);
    expect(formatPriceLabel(tool, 120, (fr) => fr)).not.toContain("/mois");
    expect(toolPriceLine(tool, "fr", (fr) => fr).priceLine).not.toContain(
      "/mois",
    );
  },
);
it("uses explicit annual offer amount to derive normalized monthly comparison while retaining raw annual total", () => {
  const tool = make("paid", "year", 240);
  expect(resolveMonthlyPrice(tool)).toBe(20);
  expect(nativePriceFromTool(tool)?.amount).toBe(20);
  expect(tool.pricing_v5?.plans?.[0].nativeAmount).toBe(240);
});

it("keeps explicit free and nonfree facts on light card/filter inputs instead of stale prose", async () => {
  const { stackCatalogPrice } = await import("./stackView");
  const { hasFreePlan } = await import("./catalogFilters");
  const free: any = {
    id: "light-free",
    pricing: { free: "", paid: "Old paid prose" },
    hasConfirmedFreePlan: true,
  };
  const paid: any = {
    id: "light-paid",
    pricing: { free: "Free plan forever", paid: "Paid" },
    hasConfirmedFreePlan: false,
    nativePrices: [{ amount: 10, currency: "EUR", period: "monthly" }],
  };
  expect(hasFreePlan(free)).toBe(true);
  expect(hasFreePlan(paid)).toBe(false);
  expect(stackCatalogPrice(free, "en")).toBe("Free");
  expect(stackCatalogPrice(paid, "en")).not.toBe("Freemium");
});
it("never converts a usage unit price into a monthly comparison and keeps the explicit mobile intent label", () => {
  const tool = make("usage", "usage", 12);
  expect(nativePriceFromTool(tool)).toBeNull();
  expect(resolveMonthlyPrice(tool)).toBe(0);
  expect(formatPriceLabel(tool, 0, (fr) => fr)).toBe("Selon l’usage");
  expect(toolPriceLine(tool, "fr", (fr) => fr).priceLine).toBe("Selon l’usage");
  expect(toolPriceLine(make("unknown"), "fr", (fr) => fr).priceLine).toBe(
    "Prix non communiqué",
  );
});
it("does not resurrect an old paid comparison after the current offers become explicitly free only", () => {
  const tool = make("free", "monthly", 0);
  tool.pricing_v5!.plans![0].isFree = true;
  tool.pricing_v5!.plans![0].isComparePlan = false;
  expect(resolveMonthlyPrice(tool)).toBe(0);
  expect(nativePriceFromTool(tool)).toBeNull();
  expect(toolPriceFacts(tool).hasPrice).toBe(false);
  expect(toolPriceFacts(tool).free).toBe(true);
});

it.each(["CAD", "AUD", "CHF", "JPY"])(
  "retains a paid native %s offer without relabelling it as euros or free",
  (currency) => {
    const tool = make("paid", "monthly", 120);
    tool.pricing_v5!.plans![0].nativeCurrency = currency;
    expect(nativePriceFromTool(tool)).toMatchObject({ amount: 120, currency });
    const label = formatPriceLabel(tool, resolveMonthlyPrice(tool), (fr) => fr);
    expect(label).not.toMatch(/Gratuit|€/);
    expect(label).toContain("120");
    expect(toolPriceFacts(tool).hasPrice).toBe(true);
    expect(toolPriceLine(tool, "en", (_, en) => en).priceLine).not.toMatch(
      /Free|€/,
    );
  },
);
it("uses an EN-only explicit one-time offer consistently across labels, mobile and SEO", () => {
  const tool = make("paid", "one_time", 120);
  tool.pricing_v5En = tool.pricing_v5;
  tool.pricing_v5 = null;
  tool.pricing_v5En!.plans![0].nativeCurrency = "USD";
  expect(formatPriceLabel(tool, 120, (_, en) => en, "USD", "en")).not.toContain(
    "/mo",
  );
  expect(isOneTimePrice(tool)).toBe(true);
  expect(toolPriceFacts(tool).oneTime).toBe(true);
  expect(toolPriceLine(tool, "en", (_, en) => en).priceLine).toContain(
    "one-time",
  );
});
it("prefers an explicit recurring offer over retained legacy one-time metadata", () => {
  const tool = make("paid", "monthly", 120);
  tool.pricing_v5!.compare_plan_kind = "one_time";
  expect(formatPriceLabel(tool, 120, (fr) => fr)).toContain("/mois");
  expect(isOneTimePrice(tool)).toBe(false);
  expect(toolPriceFacts(tool).oneTime).toBe(false);
  expect(toolPriceLine(tool, "fr", (fr) => fr).priceLine).toContain("/mois");
});
it("does not describe an explicit unreferenced paid draft as free or use stale prices", () => {
  const tool = mapToolFromJson({ id: "review", slug: "review", name: "Review", defaultMonthlyPrice: 20, pricing_v5: { compare_price_monthly_eur: 20, plans: [{ planKey: "p", displayName: "Paid", nativeAmount: 25, nativeCurrency: "EUR", billingPeriod: "monthly", priceStatus: "paid", isFree: false, isComparePlan: false }] } });
  expect(formatPriceLabel(tool, resolveMonthlyPrice(tool), fr => fr)).not.toBe("Gratuit");
  expect(toolPriceFacts(tool).hasPrice).toBe(false);
});
