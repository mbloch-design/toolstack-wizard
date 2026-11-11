import { describe, expect, it } from "vitest";
import { buildToolFaqs } from "./toolFaq";
import { toolDisplayPrice, toolFaqPageSchema, toolSoftwareApplicationSchema, toolWebPageSchema } from "./toolSchema";

const tool = {
  name: "Fictif",
  shortDescription: "Outil de test pour la FAQ.",
  pricing: { free: "Gratuit" },
  pricing_v5: { verified_on: "2026-10-04", compare_plan_kind: "free" },
  verdict: { threshold: "Utile quand on a besoin d'un outil de test." },
  soloRelevance: "high",
  pros: ["Simple", "Rapide"],
  cons: ["Limité"],
  alternatives: [],
} as any;

const noAlternatives: any[] = [];

describe("toolFaqPageSchema", () => {
  it("reprend exactement les questions et réponses de la FAQ visible", () => {
    const displayPrice = toolDisplayPrice(tool, "fr");
    const visible = buildToolFaqs(tool, "fr", displayPrice, "2026-10-04", noAlternatives);
    const schema = toolFaqPageSchema({ tool, lang: "fr", displayPrice, verifiedOn: "2026-10-04", alternatives: noAlternatives });
    const entries = schema.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>;

    expect(entries.map((entry) => entry.name)).toEqual(visible.map((faq) => faq.q));
    expect(entries.map((entry) => entry.acceptedAnswer.text)).toEqual(visible.map((faq) => faq.a));
    // Le prérendu n'en posait que quatre : la question « débutants » manquait.
    expect(entries.length).toBeGreaterThanOrEqual(5);
  });

  it("ajoute la question d'alternative gratuite quand la fiche en déclare une", () => {
    const withFree = { ...tool, freeAlternative: "Autre outil gratuit" };
    const visible = buildToolFaqs(withFree, "fr", 0, "2026-10-04", noAlternatives);
    const schema = toolFaqPageSchema({ tool: withFree, lang: "fr", displayPrice: 0, verifiedOn: "2026-10-04", alternatives: noAlternatives });
    expect((schema.mainEntity as unknown[]).length).toBe(visible.length);
    expect((schema.mainEntity as Array<{ name: string }>).at(-1)!.name).toContain("alternative gratuite");
  });

  it("declare la meme URL produit que le prerendu, meme sans websiteUrl", () => {
    const affiliateOnly = {
      ...tool,
      websiteUrl: undefined,
      affiliateLink: "https://partenaire.example/x",
      defaultMonthlyPrice: 20,
      pricing: { free: "Gratuit", paid: "20$/mois" },
    };
    const schema = toolSoftwareApplicationSchema({ tool: affiliateOnly, lang: "fr", canonicalUrl: "https://tooltrim.com/fr/tool/fictif" });
    expect(schema.url).toBe("https://partenaire.example/x");
    expect((schema.offers as any)?.url).toBe("https://partenaire.example/x");
    expect((schema.mainEntityOfPage as any)["@id"]).toBe("https://tooltrim.com/fr/tool/fictif");
  });

  it("expose un WebPage referencable par @id", () => {
    const page = toolWebPageSchema({ tool, lang: "fr", url: "https://tooltrim.com/fr/tool/fictif", verifiedOn: "2026-10-04" });
    expect(page["@id"]).toBe("https://tooltrim.com/fr/tool/fictif");
    expect(page.url).toBe(page["@id"]);
  });

  it("nomme la page comme le titre SEO", () => {
    const page = toolWebPageSchema({ tool, lang: "fr", url: "https://tooltrim.com/fr/tool/fictif", verifiedOn: "2026-10-04" });
    expect(page.name).toContain("Fictif");
    expect(page.dateModified).toBe("2026-10-04");
  });

  it("prix affiché : 0 pour un outil gratuit, jamais undefined", () => {
    expect(toolDisplayPrice(tool, "fr")).toBe(0);
    expect(Number.isFinite(toolDisplayPrice(tool, "en"))).toBe(true);
  });
});
