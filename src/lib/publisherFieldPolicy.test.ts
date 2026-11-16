import { expect, it } from "vitest";
import { assertProductPatchAllowed } from "./publisherFieldPolicy.js";
import type { ProductDraft } from "./publisherCatalog.js";

const locale = { shortDescription: null, productDescription: null, features: [], useCases: [] };
const base: ProductDraft = {
  schemaVersion: 1, name: "Tool", websiteUrl: "https://example.org",
  localized: { fr: locale, en: locale }, plans: [], media: [],
  classificationProposals: [], integrations: [],
};
const caps = { canRead: true, canEditFacts: true, canUpload: false, canSubmit: true,
  canReview: false, canPublish: false, editablePaths: ["localized.fr.shortDescription"] };

it("accepts only the authorized language and leaf", () => {
  const next = { ...base, localized: { ...base.localized,
    fr: { ...locale, shortDescription: "Présentation" } } };
  expect(assertProductPatchAllowed(base, next, caps)).toEqual(next);
  expect(() => assertProductPatchAllowed(base, next, { ...caps, editablePaths: ["localized"] })).toThrow();
  expect(() => assertProductPatchAllowed(base, { ...next, name: "Other" }, caps)).toThrow();
  expect(base.localized.fr.shortDescription).toBeNull();
});

it("never grants a server-controlled identity using a client value or capability path", () => {
  const planText = { name: "Basic", highlights: [], summary: null };
  const plan = { id: "plan", planKey: "basic", archived: false,
    localized: { fr: planText, en: planText }, options: [] };
  const current = { ...base, plans: [plan] };
  expect(() => assertProductPatchAllowed(current, { ...base, plans: [{ ...plan, planKey: "other" }] },
    { ...caps, editablePaths: ["plans.*.planKey"] })).toThrow();
  expect(() => assertProductPatchAllowed(base, current, { ...caps, editablePaths: ["plans.$add"] })).toThrow();
});

it("checks ToolTrim fields against the existing editorial schema", async () => {
  const { validateToolTrimDraft } = await import("./publisherFieldPolicy.js");
  expect(validateToolTrimDraft({ schemaVersion: 1, fields: { longDescription: "Analyse" } })).toEqual([]);
  expect(validateToolTrimDraft({ schemaVersion: 1, fields: { websiteUrl: "https://example.org" } })[0]?.path)
    .toBe("fields.websiteUrl");
  expect(validateToolTrimDraft({ schemaVersion: 1, fields: { longDescription: 1 } })[0]?.path)
    .toBe("fields.longDescription");
  expect(validateToolTrimDraft({ schemaVersion: 1, fields: { seo: { adminOnlyAlias: "x" } } })).not.toEqual([]);
});

it("keeps plan identities and requires a separate grant to reorder the cards", () => {
  const planText = { name: "Basic", highlights: [], summary: null };
  const plan = { id: "plan", planKey: "basic", archived: false,
    localized: { fr: planText, en: planText }, options: [] };
  const other = { ...plan, id: "pro", planKey: "pro" };
  const current = { ...base, plans: [plan, other] };
  const reordered = { ...current, plans: [other, plan] };
  expect(() => assertProductPatchAllowed(current, reordered, caps)).toThrow();
  expect(assertProductPatchAllowed(current, reordered, { ...caps, editablePaths: ["plans.$order"] })
    .plans.map(({ id }) => id)).toEqual(["pro", "plan"]);
  expect(() => assertProductPatchAllowed(current, { ...current, plans: [other] },
    { ...caps, editablePaths: ["plans.$remove"] })).toThrow();
});
