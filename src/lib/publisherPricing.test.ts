import { expect, it } from "vitest";
import { pricePresentation, type PriceOption } from "./publisherPricing.js";

const annual: PriceOption = {
  id: "annual", type: "paid", amount: "120", currency: "EUR", period: "year",
  unit: "seat", commitment: "annual_prepaid", tax: "unknown", market: "FR",
  offerLocale: null, sourceUrl: null, observedOn: null,
};

it("preserves the actual annual invoice and calculates a separate monthly equivalent", () => {
  expect(pricePresentation(annual, "en")).toEqual({
    amountLabel: "€120.00", billingLabel: "per year", monthlyEquivalent: "10",
  });
  expect(pricePresentation({ ...annual, amount: "12", period: "month" }, "en").monthlyEquivalent).toBe("12");
});

it.each(["free", "quote", "unknown", "usage"] as const)("makes retained amounts invisible for %s", (type) => {
  const price = pricePresentation({ ...annual, type }, "fr");
  expect(price.amountLabel).not.toContain("120");
  expect(price.monthlyEquivalent).toBeNull();
});
