import { describe, expect, it } from "vitest";
import { validateProductDraft } from "./publisherCatalog.js";

const locale = { shortDescription: null, productDescription: null, features: [], useCases: [] };
export const emptyDraft = {
  schemaVersion: 1 as const, name: "", websiteUrl: "",
  localized: { fr: locale, en: locale }, plans: [], media: [],
  classificationProposals: [], integrations: [],
};

describe("publisher product contract", () => {
  it("accepts an incomplete draft and requires essentials at initial submission", () => {
    expect(validateProductDraft(emptyDraft, { phase: "draft", purpose: "initial" })).toEqual([]);
    expect(validateProductDraft(emptyDraft, { phase: "submit", purpose: "initial" })
      .map(({ path }) => path)).toEqual(["name", "websiteUrl"]);
  });

  it.each(["verdict", "longDescription", "toolTrimRating", "pricing_v5", "__proto__", "constructor"])(
    "rejects the field %s in a product draft",
    (key) => {
      expect(validateProductDraft({ ...emptyDraft, [key]: {} }, { phase: "draft", purpose: "update" })).not.toEqual([]);
    },
  );

  it("rejects extra plan fields and credentials in the website URL", () => {
    const planText = { name: "Basic", highlights: [], summary: null };
    const value = {
      ...emptyDraft, websiteUrl: "https://user:pass@example.org",
      plans: [{ id: "plan-1", planKey: "basic", archived: false, isComparePlan: true,
        localized: { fr: planText, en: planText }, options: [] }],
    };
    expect(validateProductDraft(value, { phase: "draft", purpose: "update" })
      .map(({ path }) => path)).toEqual(expect.arrayContaining(["websiteUrl", "plans.0.isComparePlan"]));
  });
});
