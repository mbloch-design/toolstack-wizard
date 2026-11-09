import { expect, it } from "vitest";
import * as contract from "../../src/lib/backofficeCatalog";
const base = { id: "one", slug: "one", name: "One", seo: { metaTitle: "Old" } };
const plan = {
  planKey: "pro",
  displayName: "Pro",
  nativeAmount: 12,
  nativeCurrency: "EUR",
  isFree: false,
  isComparePlan: true,
  billingPeriod: "monthly",
  detailsSourceUrl: "https://example.com/pricing",
  observedOn: "2026-10-30",
  priceStatus: "paid",
};
it("rejects identity-less plan replacement under a display-name-only grant", () => {
  const old = { ...base, pricing_v5: { plans: [plan] } };
  const actor = contract.catalogCapabilities({
    isAdmin: true,
    editablePaths: ["pricing_v5.plans.*.displayName"],
  });
  expect(() => contract.validateCatalogDraft(old, {
    ...old,
    pricing_v5: { plans: [{ displayName: "Replacement" }] },
  }, actor)).toThrow();
});
it("rejects empty ungranted container creation under a name-only grant", () => {
  const actor = contract.catalogCapabilities({
    isAdmin: true,
    editablePaths: ["name"],
  });
  for (const edit of [{ verdict: {} }, { pros: [] }])
    expect(() => contract.validateCatalogDraft(base, { ...base, ...edit }, actor)).toThrow();
});
it("rejects renaming an otherwise retained offer and keeps genuine add remove and reorder", () => {
  const other = {
    ...plan,
    planKey: "other",
    displayName: "Other",
    isComparePlan: false,
  };
  const old = { ...base, pricing_v5: { plans: [plan, other] } };
  expect(() => contract.validateCatalogDraft(old, {
    ...old,
    pricing_v5: { plans: [{ ...plan, planKey: "renamed" }, other] },
  })).toThrow();
  expect(contract.isEditableCatalogPath([
    "pricing_v5", "plans", 0, "planKey",
  ])).toBe(false);
  const added = {
    ...plan,
    planKey: "new",
    displayName: "New",
    isComparePlan: false,
  };
  for (const plans of [[other, plan], [], [plan, other, added]])
    expect(contract.validateCatalogPublication(old, {
      ...old, pricing_v5: { plans },
    })).toMatchObject({ pricing_v5: { plans } });
  expect(() => contract.validateCatalogPublication(old, { ...old, pricing_v5: { plans: [other] } })).toThrow();
  expect(contract.validateCatalogDraft(old, {
    ...old, pricing_v5: {},
  })).toMatchObject({ pricing_v5: {} });
});
it("requires explicit intent for new and price-edited legacy offers while preserving untouched neighbors", () => {
  const { priceStatus: _status, ...legacy } = plan;
  expect(() => contract.validateCatalogPublication(base, {
    ...base, pricing_v5: { plans: [legacy] },
  })).toThrow();
  const old = { ...base, pricing_v5: { plans: [legacy] } };
  expect(() => contract.validateCatalogPublication(old, {
    ...old,
    pricing_v5: { plans: [{ ...legacy, nativeAmount: 20 }] },
  })).toThrow();
  expect(contract.validateCatalogPublication(old, {
    ...old,
    pricing_v5: { plans: [{ ...legacy, displayName: "Editorial" }] },
  })).toMatchObject({ pricing_v5: { plans: [{ displayName: "Editorial" }] } });
  expect(contract.validateCatalogPublication(old, {
    ...old,
    pricing_v5: {
      plans: [legacy, { ...plan, planKey: "new", isComparePlan: false }],
    },
  })).toMatchObject({ pricing_v5: { plans: [legacy, {}] } });
});
it("rejects pooled locale comparison conflicts but deduplicates proven shared copies", () => {
  const conflict = {
    ...base,
    pricing_v5: { plans: [plan] },
    pricing_v5En: { plans: [{ ...plan, planKey: "second", nativeAmount: 25 }] },
  };
  expect(() => contract.validateCatalogPublication(base, conflict)).toThrow();
  const localized = {
    ...base,
    pricing_v5: { plans: [plan] },
    pricing_v5En: { plans: [{ ...plan, displayName: "English" }] },
  };
  expect(contract.validateCatalogPublication(base, localized)).toEqual(localized);
  const old = { ...conflict };
  expect(contract.validateCatalogPublication(old, {
    ...old,
    pricing_v5: { plans: [{ ...plan, summary: "Editorial" }] },
  })).toMatchObject({ pricing_v5: { plans: [{ summary: "Editorial" }] } });
  expect(() => contract.validateCatalogPublication(old, {
    ...old,
    pricing_v5En: { plans: [{ ...plan, planKey: "second", nativeAmount: 30 }] },
  })).toThrow();
});
it("blocks a newly independent reference when an absent price fact becomes null", () => {
  const old = {
    ...base,
    pricing_v5: { plans: [plan] },
    pricing_v5En: { plans: [{ ...plan }] },
  };
  expect(() => contract.validateCatalogPublication(old, {
    ...old,
    pricing_v5En: { plans: [{ ...plan, observedMarket: null }] },
  })).toThrow();
});
it("retains incomplete safe drafts and exposes precise publication blockers", () => {
  const value = {
    ...base,
    name: "",
    pricing_v5: {
      plans: [
        { ...plan, nativeAmount: null, detailsSourceUrl: "", observedOn: "" },
      ],
    },
  };
  expect(contract.validateCatalogDraft(base, value)).toEqual(value);
  expect(contract.catalogValidationIssues(base, value)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: "name",
        stage: "publish",
        severity: "error",
      }),
      expect.objectContaining({
        path: "pricing_v5.plans.0.detailsSourceUrl",
        stage: "publish",
        severity: "error",
      }),
    ]),
  );
  expect(() => contract.validateCatalogPublication(base, value)).toThrow();
});
it("supports explicit optional deletion but protects identity and unknown data", () => {
  expect(
    contract.validateCatalogTool(base, { id: "one", slug: "one", name: "One" }),
  ).toEqual({ id: "one", slug: "one", name: "One" });
  expect(() =>
    contract.validateCatalogDraft(base, { ...base, id: "other" }),
  ).toThrow();
  expect(() =>
    contract.validateCatalogDraft({ ...base, research: { sources: 2 } }, base),
  ).toThrow();
});
it("accepts typed rating, taxonomy, verdict and SEO children", () => {
  const value = {
    ...base,
    functional_needs: ["design"],
    personas: ["solo"],
    toolTrimRating: {
      puissance: 4,
      evidence: { puissance: "Verified capabilities" },
      notedOn: "2026-10-30",
    },
    verdict: { keepIf: ["Suitable"], threshold: "A team" },
    seo: { aiAngle: { stance: "assist", aiTools: ["one"], augmentFr: "Aide" } },
  };
  expect(contract.validateCatalogTool(base, value)).toEqual(value);
  expect(() =>
    contract.validateCatalogDraft(base, {
      ...value,
      toolTrimRating: { puissance: 9 },
    }),
  ).toThrow();
});
it("allows one comparison reference per currency and blocks same currency duplicates", () => {
  const value = {
    ...base,
    pricing_v5: {
      plans: [plan, { ...plan, planKey: "pro-usd", nativeCurrency: "USD" }],
    },
  };
  expect(contract.validateCatalogTool(base, value)).toEqual(value);
  expect(() =>
    contract.validateCatalogTool(base, {
      ...base,
      pricing_v5: { plans: [plan, { ...plan, planKey: "second" }] },
    }),
  ).toThrow();
});
it("distinguishes quote and unknown without pretending zero is free", () => {
  for (const priceStatus of ["quote", "unknown"]) {
    const value = {
      ...base,
      pricing_v5: {
        plans: [
          {
            ...plan,
            priceStatus,
            nativeAmount: null,
            nativeCurrency: null,
            isComparePlan: false,
          },
        ],
      },
    };
    expect(contract.validateCatalogTool(base, value)).toEqual(value);
    expect(() =>
      contract.validateCatalogTool(base, {
        ...base,
        pricing_v5: { plans: [{ ...plan, priceStatus }] },
      }),
    ).toThrow();
  }
});
it("denies absent actors and server-restricted paths", () => {
  const denied = contract.catalogCapabilities(null);
  expect(denied.canSaveDraft).toBe(false);
  expect(() =>
    contract.validateCatalogDraft(base, { ...base, name: "Other" }, denied),
  ).toThrow();
  const limited = contract.catalogCapabilities({
    isAdmin: true,
    editablePaths: ["description"],
  });
  expect(() =>
    contract.validateCatalogDraft(base, { ...base, name: "Other" }, limited),
  ).toThrow();
  expect(contract.isCatalogPathAllowed(limited, ["description"])).toBe(true);
  expect(contract.isCatalogPathAllowed(limited, ["id"])).toBe(false);
});
it("links only identical sourced observations, propagates facts and keeps editorial independent", () => {
  const value = {
    ...base,
    pricing_v5: { plans: [plan] },
    pricing_v5En: { plans: [{ ...plan, displayName: "English" }] },
  };
  const linked = contract.initializeCatalogPriceObservations(value);
  const fr = (linked.pricing_v5 as any).plans[0],
    en = (linked.pricing_v5En as any).plans[0];
  expect(fr.priceObservationId).toBeTruthy();
  expect(en.priceObservationId).toBe(fr.priceObservationId);
  const changed = contract.updateCatalogPriceObservation(
    linked,
    "pricing_v5",
    0,
    { nativeAmount: 20, displayName: "French" },
  );
  expect((changed.pricing_v5En as any).plans[0]).toMatchObject({
    nativeAmount: 20,
    displayName: "English",
  });
  const different = contract.initializeCatalogPriceObservations({
    ...value,
    pricing_v5En: { plans: [{ ...plan, observedMarket: "US" }] },
  });
  expect(
    (different.pricing_v5 as any).plans[0].priceObservationId,
  ).toBeUndefined();
  expect(() =>
    contract.validateCatalogDraft(value, {
      ...value,
      pricing_v5: { plans: [{ ...plan, priceObservationId: "forged" }] },
    }),
  ).toThrow();
});
it("preserves unchanged irregular neighbors during a sourced price edit", () => {
  const legacy = {
    ...plan,
    planKey: "historic",
    billingPeriod: "old-period",
    nativeCurrency: "?",
    isComparePlan: false,
  };
  const old = { ...base, pricing_v5: { plans: [plan, legacy] } };
  const value = {
    ...old,
    pricing_v5: { plans: [{ ...plan, nativeAmount: 22 }, legacy] },
  };
  expect(contract.validateCatalogTool(old, value)).toEqual(value);
});
it("does not let a child grant delete or reorder rows or change sibling paths", () => {
  const old = {
    ...base,
    pricing_v5: {
      plans: [plan, { ...plan, planKey: "other", isComparePlan: false }],
    },
  };
  const limited = contract.catalogCapabilities({
    isAdmin: true,
    editablePaths: ["pricing_v5.plans.*.displayName"],
  });
  expect(() =>
    contract.validateCatalogDraft(
      old,
      { ...old, pricing_v5: { plans: [old.pricing_v5.plans[1]] } },
      limited,
    ),
  ).toThrow();
  expect(() =>
    contract.validateCatalogDraft(
      old,
      { ...old, pricing_v5: { plans: [old.pricing_v5.plans[1], plan] } },
      limited,
    ),
  ).toThrow();
  expect(() =>
    contract.validateCatalogDraft(
      old,
      {
        ...old,
        pricing_v5: {
          plans: [{ ...plan, nativeAmount: 99 }, old.pricing_v5.plans[1]],
        },
      },
      limited,
    ),
  ).toThrow();
  expect(
    contract.validateCatalogDraft(
      old,
      {
        ...old,
        pricing_v5: {
          plans: [{ ...plan, displayName: "Edited" }, old.pricing_v5.plans[1]],
        },
      },
      limited,
    ),
  ).toMatchObject({ pricing_v5: { plans: [{ displayName: "Edited" }, {}] } });
});
it("requires changed rating evidence and observation dates only for changed rating dependencies", () => {
  const value = { ...base, toolTrimRating: { puissance: 4 } };
  expect(contract.validateCatalogDraft(base, value)).toEqual(value);
  expect(() => contract.validateCatalogPublication(base, value)).toThrow();
  const old = { ...value, toolTrimRating: { puissance: 4, simplicite: 3 } };
  expect(
    contract.validateCatalogPublication(old, {
      ...old,
      description: "Editorial",
    }),
  ).toMatchObject({ description: "Editorial" });
});
it("rejects removing a price source or period from an edited paid observation at publication", () => {
  const old = { ...base, pricing_v5: { plans: [plan] } };
  for (const key of ["detailsSourceUrl", "observedOn", "billingPeriod"]) {
    const edited: Record<string, unknown> = { ...plan };
    delete edited[key];
    const value = { ...base, pricing_v5: { plans: [edited] } };
    expect(contract.validateCatalogDraft(old, value)).toEqual(value);
    expect(() => contract.validateCatalogPublication(old, value)).toThrow();
  }
});
it("edits structured profile recommendations and protects unused aliases", () => {
  const value = {
    ...base,
    verdict: {
      profileTable: [{ profile: "Freelance", recommendation: "Keep" }],
    },
  };
  expect(contract.validateCatalogTool(base, value)).toEqual(value);
  expect(() =>
    contract.validateCatalogDraft(base, { ...base, tags: ["invented"] }),
  ).toThrow();
  expect(() =>
    contract.validateCatalogDraft(base, { ...base, bestFor: ["invented"] }),
  ).toThrow();
});
it("does not report a fallback when explicit pricing blocks it", () => {
  const value = {
    ...base,
    pricing_v5: { plans: [{ ...plan, isFree: true, nativeAmount: 0 }] },
  };
  expect(contract.resolveCatalogComparison(value, "EUR")).toMatchObject({
    plan: null,
    fallback: null,
  });
});
it("does not discard unknown nested data through nullable or deleted parents", () => {
  const old = {
    ...base,
    verdict: { keepIf: ["A"], legacy: { untouched: true } },
  };
  const deleted = { ...old } as Record<string, unknown>;
  delete deleted.verdict;
  expect(() => contract.validateCatalogDraft(old, deleted)).toThrow();
  expect(() =>
    contract.validateCatalogDraft(old, { ...old, verdict: null }),
  ).toThrow();
});
it("does not grant parent deletion from a child-only or parent-only restricted actor", () => {
  const old = { ...base, verdict: { keepIf: ["A"], threshold: "B" } };
  const limited = contract.catalogCapabilities({
    isAdmin: true,
    editablePaths: ["verdict"],
  });
  expect(() =>
    contract.validateCatalogDraft(old, { ...old, verdict: null }, limited),
  ).toThrow();
});
it("does not merge separately sourced observations that differ by missing and null facts", () => {
  const a = { ...plan, planKey: "a" },
    b = { ...plan, planKey: "a", observedMarket: null };
  const old = {
    ...base,
    pricing_v5: { plans: [a, b] },
    pricing_v5En: { plans: [{ ...a }, { ...b }] },
  };
  const linked = contract.initializeCatalogPriceObservations(old);
  const rows = (linked.pricing_v5 as any).plans;
  expect(rows[0].priceObservationId).not.toBe(rows[1].priceObservationId);
});
it("requires integer rating axes from one to five", () => {
  for (const puissance of [0, 2.5])
    expect(() =>
      contract.validateCatalogDraft(base, {
        ...base,
        toolTrimRating: { puissance },
      }),
    ).toThrow();
});
it("rejects null array rows and null text items that public consumers cannot safely render", () => {
  for (const edit of [
    { pros: [null] },
    { pricing_v5: { plans: [null] } },
    { galleryImages: [null] },
  ])
    expect(() =>
      contract.validateCatalogDraft(base, { ...base, ...edit }),
    ).toThrow();
});
it("blocks removing evidence from a published rating while allowing an unrelated historic incomplete axis", () => {
  const old = {
    ...base,
    toolTrimRating: {
      puissance: 4,
      evidence: { puissance: "Source" },
      notedOn: "2026-10-30",
      simplicite: 3,
    },
  };
  expect(() =>
    contract.validateCatalogPublication(old, {
      ...old,
      toolTrimRating: { ...old.toolTrimRating, evidence: {} },
    }),
  ).toThrow();
  expect(
    contract.validateCatalogPublication(old, {
      ...old,
      toolTrimRating: {
        ...old.toolTrimRating,
        evidence: { puissance: "Updated source" },
      },
    }),
  ).toMatchObject({ toolTrimRating: { simplicite: 3 } });
});
it("preserves existing duplicate historical compare flags during unrelated row text editing", () => {
  const legacy = { ...plan, planKey: "legacy" };
  const old = { ...base, pricing_v5: { plans: [plan, legacy] } };
  expect(
    contract.validateCatalogPublication(old, {
      ...old,
      pricing_v5: { plans: [{ ...plan, summary: "Text" }, legacy] },
    }),
  ).toMatchObject({ pricing_v5: { plans: [{ summary: "Text" }, {}] } });
});
it("exposes observation identity as protected while accepting deterministic initialization", () => {
  const old = {
    ...base,
    pricing_v5: { plans: [plan] },
    pricing_v5En: { plans: [{ ...plan }] },
  };
  expect(
    contract.catalogFieldAt(["pricing_v5", "plans", 0, "priceObservationId"]),
  ).toMatchObject({ editable: false, ownership: "identity" });
  const linked = contract.initializeCatalogPriceObservations(old);
  expect(contract.validateCatalogDraft(old, linked)).toEqual(linked);
  expect(
    contract.validateCatalogDraft(
      old,
      contract.updateCatalogPriceObservation(linked, "pricing_v5", 0, {
        nativeAmount: 19,
      }),
    ),
  ).toMatchObject({ pricing_v5En: { plans: [{ nativeAmount: 19 }] } });
});
it("keeps incomplete dates and enums in drafts but blocks publication of those changed fields", () => {
  for (const edit of [
    { lifecycle: { checkedOn: "" } },
    { pricing_v5: { plans: [{ ...plan, taxInclusion: "" }] } },
  ]) {
    const value = { ...base, ...edit };
    expect(contract.validateCatalogDraft(base, value)).toEqual(value);
    expect(() => contract.validateCatalogPublication(base, value)).toThrow();
  }
});
it("requires existing comparison evidence when its source is deleted", () => {
  const old = {
    ...base,
    pricing_v5: {
      compare_price_monthly_eur: 12,
      official_source_url: "https://example.com/pricing",
      verified_on: "2026-10-30",
    },
  };
  const value = {
    ...old,
    pricing_v5: { ...old.pricing_v5, official_source_url: "" },
  };
  expect(contract.validateCatalogDraft(old, value)).toEqual(value);
  expect(() => contract.validateCatalogPublication(old, value)).toThrow();
});
it("requires a reference for newly changed paid pricing but permits draft and unchanged history", () => {
  const legacy = { ...base, defaultMonthlyPrice: 20, pricing_v5: { compare_price_monthly_eur: 20 } };
  const value = { ...legacy, pricing_v5: { ...legacy.pricing_v5, plans: [{ ...plan, isComparePlan: false }] } };
  expect(contract.validateCatalogDraft(legacy, value)).toEqual(value);
  expect(() => contract.validateCatalogPublication(legacy, value)).toThrow();
  expect(contract.validateCatalogPublication(value, { ...value, name: "Changed" })).toBeTruthy();
});
