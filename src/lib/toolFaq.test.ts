import { describe, expect, it } from "vitest";
import type { Tool } from "@/data/types";
import { buildToolFaqs } from "./toolFaq";

describe("buildToolFaqs native pricing", () => {
  it("does not describe a tool as free when paid prices are only available in another currency", () => {
    const tool = {
      id: "viso-ai",
      slug: "viso-ai",
      name: "Viso AI",
      categoryId: "ai-general",
      shortDescription: "Computer vision applications.",
      pricing: { free: "Free plan available.", paid: "Pro: $25/month. Business: $50/month." },
      pricingEn: { free: "Free plan available.", paid: "Pro: $25/month. Business: $50/month." },
      defaultMonthlyPrice: 0,
      verdict: { keepIf: [], avoidIf: [], threshold: "Start on the free plan." },
      pros: [],
      cons: [],
      relevantFor: [],
      affiliateLink: "",
      tool_type: "ia",
      substitutable: true,
      verticals: [],
      functional_needs: [],
      prescription_quality: "question",
      pricing_v5: {
        compare_price_monthly_eur: null,
        plans: [{ planKey: "pro", displayName: "Pro", isFree: false, isComparePlan: false, nativeAmount: 25, nativeCurrency: "USD" }],
      },
    } as Tool;

    const faq = buildToolFaqs(tool, "fr", 0, "30 septembre 2026", []);
    expect(faq[1].a).toContain("25/month");
    expect(faq[1].a).not.toContain("0€ (gratuit)");
  });
});
