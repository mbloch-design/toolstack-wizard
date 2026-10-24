import { describe, expect, it } from "vitest";
import { toolSeoDescription, toolSeoTitle } from "./toolSeo";

const tool = {
  slug: "demo", name: "Demo",
  pricing: { free: "Plan gratuit.", paid: "Pro." },
  pricing_v5: {
    verified_on: new Date(Date.now() - 10 * 86_400_000).toISOString().slice(0, 10),
    compare_plan_name: "Pro", compare_plan_kind: "account",
    plans: [{ isComparePlan: true, isFree: false, nativeAmount: 9.5, nativeCurrency: "EUR", pricingUnit: "account", billingPeriod: "monthly" }],
  },
  toolTrimRating: { valeurAjoutee: 4, simplicite: 4, utilisation: 3, puissance: 4, reversibilite: 3 },
  seo: {
    prixMetaDescriptionFr: "Prix de Demo : dès {price}/mois. Prix vérifiés en {verified}, note {rating}.",
    prixTitleEn: "Demo pricing: from {price}/mo",
  },
};

describe("written SEO text tokens", () => {
  it("fills price, verification month and the score shown on the fiche", () => {
    const text = toolSeoDescription(tool, "prix", "fr", 2026);
    expect(text).toMatch(/^Prix de Demo : dès 9,50\s?€\/mois\. Prix vérifiés en [a-zéû]+ 20\d\d, note 3,6\/5\.$/);
  });

  it("brands a written title when it fits", () => {
    expect(toolSeoTitle(tool, "prix", "en", 2026)).toMatch(/^Demo pricing: from €9\.50\/mo \| ToolTrim$/);
  });

  it("falls back to the template when a token has no value", () => {
    const stale = { ...tool, pricing_v5: { ...tool.pricing_v5, verified_on: "2025-01-01" } };
    expect(toolSeoDescription(stale, "prix", "fr", 2026)).not.toContain("{verified}");
    expect(toolSeoDescription(stale, "prix", "fr", 2026)).not.toContain("Prix vérifiés en");
  });
});
