import { describe, expect, it } from "vitest";
import { catalogProjectionRowsToTool, type CatalogProjectionRow } from "./catalogProjection";

function row(lang: "fr" | "en", overrides: Record<string, unknown> = {}): CatalogProjectionRow {
  return {
    id: "wix",
    slug: "wix",
    lang,
    name: "Wix",
    data_contract: "legacy",
    category: "nocode-web",
    short_description: lang === "fr" ? "Créer un site." : "Build a website.",
    long_description: lang === "fr" ? "Description FR" : "English description",
    verdict: lang === "fr" ? { keepIf: ["FR"], avoidIf: [], threshold: "Test" } : null,
    pros: lang === "fr" ? ["Simple"] : ["Easy"],
    cons: [],
    use_cases: [],
    covers: ["site"],
    relevant_for: ["freelance"],
    legacy_pricing: { free: "Oui", paid: "20 €" },
    legacy_default_monthly_price: 20,
    legacy_pricing_v5: { compare_price_monthly_eur: 20 },
    alternatives: ["webflow"],
    tool_type: "metier",
    substitutable: true,
    prescription_quality: "silence",
    ...overrides,
  } as CatalogProjectionRow;
}

describe("catalogProjectionRowsToTool", () => {
  it("reconstruit une Tool bilingue sans muter les lignes", () => {
    const rows = [row("en"), row("fr")];
    const snapshot = structuredClone(rows);
    const tool = catalogProjectionRowsToTool(rows);

    expect(tool).toMatchObject({
      id: "wix",
      slug: "wix",
      shortDescription: "Créer un site.",
      shortDescriptionEn: "Build a website.",
      defaultMonthlyPrice: 20,
      alternatives: ["webflow"],
    });
    expect(tool?.verdict.keepIf).toEqual(["FR"]);
    expect(tool?.verdictEn?.keepIf).toEqual(["FR"]);
    expect(rows).toEqual(snapshot);
  });

  it("retourne null sans ligne localisée", () => {
    expect(catalogProjectionRowsToTool([])).toBeNull();
  });

  it("construit pricing_v5 depuis les faits canoniques approuvés", () => {
    const tool = catalogProjectionRowsToTool([
      row("fr", {
        data_contract: "canonical",
        legacy_pricing_v5: null,
        compare_monthly_eur: 16.8,
        compare_plan: "light",
        pricing_unit: "site",
        price_status: "approved",
        price_last_confirmed_on: "2026-07-20",
        price_source_url: "https://example.com/pricing",
        pricing_guidance: {
          plan_details: {
            light: {
              summary: "Pour les entrepreneurs individuels",
              highlights: ["2 Go de stockage", "2 collaborateurs"],
              source_url: "https://example.com/plans",
            },
          },
        },
        plans: [
          {
            plan_key: "light",
            display_name: "Light",
            pricing_unit: "site",
            is_free: false,
            is_compare_plan: true,
            native_amount: 16.8,
            native_currency: "EUR",
            billing_period: "monthly",
            billing_commitment: "annual_prepaid",
            tax_inclusion: "ttc",
            observed_market: "FR",
            observed_locale: "fr-FR",
          },
        ],
      }),
    ]);

    expect(tool?.pricing_v5).toMatchObject({
      compare_price_monthly_eur: 16.8,
      compare_plan_name: "light",
      compare_plan_kind: "site",
      price_reliability: "approved",
      plans: [
        expect.objectContaining({
          planKey: "light",
          displayName: "Light",
          summary: "Pour les entrepreneurs individuels",
          featureHighlights: ["2 Go de stockage", "2 collaborateurs"],
          detailsSourceUrl: "https://example.com/plans",
          nativeAmount: 16.8,
          isComparePlan: true,
        }),
      ],
    });
  });
});
