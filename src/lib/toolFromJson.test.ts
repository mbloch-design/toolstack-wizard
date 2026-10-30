import { describe, expect, it } from "vitest";
import { mapToolFromJson } from "./toolFromJson";

describe("mapToolFromJson", () => {
  it("projects bilingual legacy records without losing editorial fields", () => {
    const pricing = { free: "Gratuit", paid: "12 €" };
    const verdict = { keepIf: ["Solo"], avoidIf: ["Enterprise"], threshold: "12 €" };
    const raw = {
      id: "fixture", name: { fr: "Outil", en: "Tool" }, category: "design",
      short_description: { fr: "Court", en: "Short" }, long_description: { fr: "Long FR", en: "Long EN" },
      pricingTiers: pricing, pricing_en: { free: "Free", paid: "€12" }, default_monthly_price: 12,
      verdict, verdict_en: { keepIf: ["Solo EN"], avoidIf: [], threshold: "€12" },
      pros: ["Rapide"], pros_en: ["Fast"], cons: ["Cher"], cons_en: ["Expensive"],
      use_cases: ["Créer"], use_cases_en: ["Create"], covers: ["image"], relevant_for: ["freelance"], personas: ["designer"],
      affiliate_link: "https://example.com/partner", logo: "https://example.com/logo.svg", og_image_url: "/cover.png", gallery_images: ["/gallery.png"],
      solo_relevance: "solo", team_relevance: "team", alternatives: ["other"], seo: { title: "Title" }, articles: ["article"],
      time_gained_hours_per_month: 2, free_alternative: "free", tool_type: "core", substitutable: false,
      host_app: "host", bundle_parent: "bundle", verticals: ["creative"], functional_needs: ["draw"], ia_use_case: "image",
      better_alternative: "better", migration_guide: "guide", downgrade_plan: "downgrade",
      prescription_quality: "ready", prescription_output: { recommendation: "keep" }, prescription_block_reasons: ["reason"],
      prescription_context_questions: ["question"], substitution_cluster_v2: { cluster: "image" }, pricing_v5: { version: 5 },
      pricing_v5En: { version: 5 }, decision_policy_v3: { version: 3 }, toolTrimRating: { score: 4 },
      affiliateDisclosureFr: "Disclosure FR", affiliateDisclosureEn: "Disclosure EN", affiliateCtaLabelFr: "Voir", affiliateCtaLabelEn: "View",
      promoCode: "CODE", promoDescriptionFr: "Promo FR", promoDescriptionEn: "Promo EN",
    };
    expect(mapToolFromJson(raw)).toEqual({
      id: "fixture", slug: "fixture", name: "Outil", categoryId: "design", shortDescription: "Court", shortDescriptionEn: "Short",
      longDescription: "Long FR", longDescriptionEn: "Long EN", pricing, pricingEn: raw.pricing_en, defaultMonthlyPrice: 12,
      verdict, verdictEn: raw.verdict_en, pros: ["Rapide"], prosEn: ["Fast"], cons: ["Cher"], consEn: ["Expensive"],
      useCases: ["Créer"], useCasesEn: ["Create"], covers: ["image"], relevantFor: ["freelance"], personas: ["designer"],
      affiliateLink: "https://example.com/partner", websiteUrl: "https://example.com/partner", logo: "https://example.com/logo.svg",
      ogImageUrl: "/cover.png", galleryImages: ["/gallery.png"], soloRelevance: "solo", teamRelevance: "team", alternatives: ["other"],
      seo: { title: "Title" }, articles: ["article"], timeGainedHoursPerMonth: 2, freeAlternative: "free", tool_type: "core", substitutable: false,
      host_app: "host", bundle_parent: "bundle", verticals: ["creative"], functional_needs: ["draw"], ia_use_case: "image",
      betterAlternative: "better", migrationGuide: "guide", downgradePlan: "downgrade", prescription_quality: "ready",
      prescription_output: { recommendation: "keep" }, prescription_block_reasons: ["reason"], prescription_context_questions: ["question"],
      substitution_cluster_v2: { cluster: "image" }, pricing_v5: { version: 5 }, pricing_v5En: { version: 5 },
      decision_policy_v3: { version: 3 }, toolTrimRating: { score: 4 }, affiliateDisclosureFr: "Disclosure FR", affiliateDisclosureEn: "Disclosure EN",
      affiliateCtaLabelFr: "Voir", affiliateCtaLabelEn: "View", promoCode: "CODE", promoDescriptionFr: "Promo FR", promoDescriptionEn: "Promo EN",
    });
  });

  it("retains the public null, zero, false and empty defaults", () => {
    expect(mapToolFromJson({ id: 0, pricing: null, pricingEn: null, defaultMonthlyPrice: 0, timeGainedHoursPerMonth: 0, substitutable: false,
      pros: [], covers: ["fallback"], ogImageUrl: null, toolTrimRating: null })).toMatchObject({
      id: "0", slug: "0", name: "0", pricing: { free: "", paid: "" }, pricingEn: null, defaultMonthlyPrice: 0,
      timeGainedHoursPerMonth: 0, substitutable: false, pros: [], prosEn: null, ogImageUrl: null, toolTrimRating: null,
      functional_needs: ["fallback"], verdict: { keepIf: [], avoidIf: [], threshold: "" }, tool_type: "satellite",
    });
    expect(mapToolFromJson({ timeGainedHoursPerMonth: null, time_gained_hours_per_month: 0 }).timeGainedHoursPerMonth).toBe(0);
    expect(mapToolFromJson({}).timeGainedHoursPerMonth).toBeUndefined();
    // Existing public price precedence intentionally uses ||, unlike time gained.
    expect(mapToolFromJson({ defaultMonthlyPrice: 0, default_monthly_price: 9 }).defaultMonthlyPrice).toBe(9);
  });

  it("prefers canonical fields and preserves localized fallback behavior", () => {
    expect(mapToolFromJson({ id: "id", slug: "slug", category: "first", categoryId: "second",
      shortDescription: { label: "Label" }, short_description: "Legacy", longDescription: { en: "English only" },
      pricing: { free: "yes", paid: "no" }, pricingTiers: { free: "legacy", paid: "legacy" }, websiteUrl: "https://example.com/official",
      affiliateLink: "https://example.com/affiliate" })).toMatchObject({
      slug: "slug", categoryId: "first", shortDescription: "Label", shortDescriptionEn: "Label", longDescription: "English only",
      longDescriptionEn: "English only", pricing: { free: "yes", paid: "no" }, websiteUrl: "https://example.com/official",
    });
  });

  it("applies exact audited URL replacements while leaving newer URLs and raw data intact", () => {
    const raw = { id: "chatbase", og_image_url: "https://www.chatbase.co/og-home.png", gallery_images: ["", null, "/valid.png"] };
    expect(mapToolFromJson(raw)).toMatchObject({ ogImageUrl: "https://www.chatbase.co/og-home.jpg", galleryImages: ["/valid.png"] });
    expect(raw.og_image_url).toBe("https://www.chatbase.co/og-home.png");
    expect(raw.gallery_images).toEqual(["", null, "/valid.png"]);
    expect(mapToolFromJson({ id: "chatbase", ogImageUrl: "/new-cover.webp" }).ogImageUrl).toBe("/new-cover.webp");
    expect(mapToolFromJson({ id: "cloudtask-marketplace", affiliate_link: "https://cloudtask.com/marketplace" }).affiliateLink).toBe("https://cloudtask.com/");
    expect(mapToolFromJson({ id: "brandcrowd", ogImageUrl: "https://dcstatic.com/images/brandcrowd/logos/brandcrowd-logo-black-bc9e817e0f.en-us.svg" }).ogImageUrl).toBeNull();
  });
});
