import { describe, it, expect } from "vitest";
import {
  validateCatalogTool,
  changedCatalogFields,
} from "../../src/lib/backofficeCatalog";
const base = {
  id: "one",
  slug: "one",
  name: "One",
  research: { sources: 3 },
  description: "Before",
  pricing_v5: {
    plans: [
      {
        planKey: "pro",
        displayName: "Pro",
        nativeAmount: 12,
        nativeCurrency: "EUR",
        billingPeriod: "month",
        detailsSourceUrl: "https://example.com/pricing",
      },
    ],
  },
};
describe("catalogue editing contract", () => {
  it("keeps legacy values while accepting editorial changes", () => {
    const value = { ...base, description: "After" };
    expect(validateCatalogTool(base, value)).toEqual(value);
    expect(changedCatalogFields(base, value)).toEqual(["description"]);
  });
  it.each([
    { ...base, slug: "other" },
    { ...base, research: {} },
    { ...base, newKey: "value" },
    { ...base, websiteUrl: "javascript:alert(1)" },
    { ...base, pros: [4] },
    { ...base, defaultMonthlyPrice: Infinity },
    { ...base, pricing_v5: { plans: [{ nativeAmount: -1 }] } },
  ])("rejects immutable, unsafe, or malformed values", (value) => {
    expect(() => validateCatalogTool(base, value)).toThrow();
  });
  it("rejects prototype keys at any depth", () => {
    expect(() =>
      validateCatalogTool(
        base,
        JSON.parse(
          JSON.stringify(base).replace('"sources":3', '"__proto__":{}'),
        ),
      ),
    ).toThrow();
  });
  it("preserves unknown nested legacy keys exactly", () => {
    const old = { ...base, verdict: { keepIf: ["A"], legacy: { old: true } } };
    expect(
      validateCatalogTool(old, {
        ...old,
        verdict: { ...old.verdict, keepIf: ["B"] },
      }),
    ).toMatchObject({ verdict: { legacy: { old: true } } });
    expect(() =>
      validateCatalogTool(old, {
        ...old,
        verdict: { ...old.verdict, legacy: { old: false } },
      }),
    ).toThrow();
  });
});
it.each([
  { plans: [{}] },
  {
    plans: [
      {
        planKey: "new",
        displayName: "New",
        nativeAmount: 12,
        nativeCurrency: "EUR",
        detailsSourceUrl: "javascript:alert(1)",
      },
    ],
  },
  {
    plans: [
      {
        planKey: "new",
        displayName: "New",
        nativeAmount: 12,
        nativeCurrency: "EUR",
        detailsSourceUrl: "https://example.com",
        billingPeriod: "invented",
      },
    ],
  },
])("requires valid structured plans and source URLs", (pricing_v5) => {
  expect(() => validateCatalogTool(base, { ...base, pricing_v5 })).toThrow();
});
it("rejects newly added plans lacking identity, numeric amount and evidence", () => {
  const old = { id: "new", slug: "new", name: "New" };
  expect(() =>
    validateCatalogTool(old, { ...old, pricing_v5: { plans: [{}] } }),
  ).toThrow();
});
it("rejects blank categories", () => {
  expect(() => validateCatalogTool(base, { ...base, category: "" })).toThrow();
});
it("requires attestation when changing a legacy plan price", () => {
  expect(() =>
    validateCatalogTool(base, {
      ...base,
      pricing_v5: {
        ...base.pricing_v5,
        plans: [{ ...base.pricing_v5.plans[0], nativeAmount: 30 }],
      },
    }),
  ).toThrow();
});
it("rejects duplicate plan identities and multiple compare plans", () => {
  const p = {
    ...base.pricing_v5.plans[0],
    observedOn: "2026-10-26",
    isFree: false,
    isComparePlan: true,
  };
  expect(() =>
    validateCatalogTool(base, { ...base, pricing_v5: { plans: [p, p] } }),
  ).toThrow();
  expect(() =>
    validateCatalogTool(base, {
      ...base,
      pricing_v5: { plans: [p, { ...p, planKey: "second" }] },
    }),
  ).toThrow();
});
it("requires source and date for changed comparison and fallback amounts", () => {
  expect(() =>
    validateCatalogTool(base, { ...base, defaultMonthlyPrice: 30 }),
  ).toThrow();
  expect(() =>
    validateCatalogTool(base, {
      ...base,
      pricing_v5: { ...base.pricing_v5, compare_price_monthly_eur: 30 },
    }),
  ).toThrow();
});
it("rejects impossible source dates", () => {
  expect(() =>
    validateCatalogTool(base, {
      ...base,
      pricing_v5: { ...base.pricing_v5, verified_on: "2026-02-31" },
    }),
  ).toThrow();
});
it.each([
  [["seo", "metaDescription"], true],
  [["seo", "aiAngle"], false],
  [["pricing_v5", "plans", 0, "nativeAmount"], true],
  [["pricing_v5", "plans", 0, "featureHighlights", 2], true],
  [["pricing_v5", "billing_options"], false],
  [["pricing_v5", "plans", 0, "unknown"], false],
  [["slug"], false],
  [["seo", "constructor"], false],
  [["pros", -1], false],
  [[], false],
] as [readonly (string | number)[], boolean][])(
  "derives editable path %j from the schema",
  async (path, expected) => {
    const contract = await import("../../src/lib/backofficeCatalog");
    expect(contract.isEditableCatalogPath(path)).toBe(expected);
  },
);
it("rejects inherited object properties masquerading as schema keys", () => {
  expect(() =>
    validateCatalogTool(base, { ...base, seo: { toString: "unsupported" } }),
  ).toThrow();
});
it("matches existing plans by identity when removing a preceding plan with legacy fields", () => {
  const old = {
    ...base,
    pricing_v5: {
      plans: [
        { ...base.pricing_v5.plans[0], planKey: "a", legacy: "first" },
        { ...base.pricing_v5.plans[0], planKey: "b", legacy: "second" },
      ],
    },
  };
  const value = { ...old, pricing_v5: { plans: [old.pricing_v5.plans[1]] } };
  expect(validateCatalogTool(old, value)).toEqual(value);
});
