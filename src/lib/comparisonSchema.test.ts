import { describe, expect, it } from "vitest";
import { chatgptClaudeGuides } from "@/data/comparisonDecisionGuides";
import { comparisonDates, comparisonJsonLd, comparisonJsonLdScript } from "./comparisonSchema";

const toolA = { name: "ChatGPT", websiteUrl: "https://chatgpt.com" };
const toolB = { name: "Claude", websiteUrl: "https://claude.com" };
const base = "https://tooltrim.com";

const input = {
  base,
  lang: "fr",
  slugPair: "chatgpt-vs-claude",
  title: "ChatGPT vs Claude : comparatif 2026 | ToolTrim",
  description: "ChatGPT vs Claude : comparez les usages, le budget et ce qui justifie de changer.",
  toolA,
  toolB,
};

const articleOf = (value: Record<string, unknown>) =>
  (value["@graph"] as Array<Record<string, any>>).find((node) => node["@type"] === "Article")!;

describe("comparisonJsonLd", () => {
  it("expose un Article avec un auteur Person, un about et des dates", () => {
    const article = articleOf(comparisonJsonLd(input));
    expect(article["@type"]).toBe("Article");
    expect(article.author).toMatchObject({
      "@type": "Person",
      name: "Michael Bloch",
      url: `${base}/fr/about`,
    });
    expect(article.author["@type"]).not.toBe("Organization");
    expect(article.about).toEqual([
      { "@type": "SoftwareApplication", name: "ChatGPT", url: "https://chatgpt.com" },
      { "@type": "SoftwareApplication", name: "Claude", url: "https://claude.com" },
    ]);
    expect(article.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(article.dateModified >= article.datePublished).toBe(true);
    expect(article.mainEntityOfPage).toEqual({ "@type": "WebPage", "@id": article.url });
    expect(article.image).toBe(`${base}/og-image-v2.png`);
  });

  it("date depuis le guide éditorial quand il existe", () => {
    const dates = comparisonDates("chatgpt-vs-claude", "fr", toolA, toolB);
    expect(dates.dateModified).toBe(chatgptClaudeGuides.fr.checkedAt);
  });

  it("garde la date du guide meme quand une donnee de fiche est plus recente", () => {
    // Le defaut corrige : prendre la date la plus recente faisait dire au
    // balisage autre chose que la date affichee sur la page.
    const fresh = { ...toolA, pricing_v5: { verified_on: "2026-10-04" } };
    const dates = comparisonDates("chatgpt-vs-claude", "fr", fresh, toolB);
    expect(fresh.pricing_v5.verified_on > chatgptClaudeGuides.fr.checkedAt).toBe(true);
    expect(dates.dateModified).toBe(chatgptClaudeGuides.fr.checkedAt);
  });

  it("retombe sur la date de la donnée des fiches, jamais sur une date inventée", () => {
    const datedA = { ...toolA, pricing_v5: { verified_on: "2026-10-04T10:00:00Z" } };
    const datedB = { ...toolB, research: { researchedOn: "2026-09-30" } };
    const dates = comparisonDates("slack-vs-front", "fr", datedA, datedB);
    expect(dates.dateModified).toBe("2026-10-04");
    expect(dates.datePublished).toBe("2026-10-04");
  });

  it("produit la même sortie pour la même entrée (prérendu = client)", () => {
    expect(JSON.stringify(comparisonJsonLd(input))).toBe(
      JSON.stringify(comparisonJsonLd({ ...input, toolA: { ...toolA }, toolB: { ...toolB } })),
    );
  });

  it("échappe les chevrons pour un script JSON-LD", () => {
    const script = comparisonJsonLdScript({ ...input, toolA: { name: "</script><b>x" } });
    expect(script).not.toContain("</script");
    expect(JSON.parse(script.replace(/\\u003c/g, "<"))["@graph"]).toHaveLength(2);
  });

  it("nomme le fil d'Ariane dans la langue de la page", () => {
    const en = comparisonJsonLd({ ...input, lang: "en" });
    const breadcrumb = (en["@graph"] as Array<Record<string, any>>).find(
      (node) => node["@type"] === "BreadcrumbList",
    )!;
    expect(breadcrumb.itemListElement[1].name).toBe("Comparisons");
    expect(articleOf(en).author.jobTitle).toBe("Creative director");
    expect(articleOf(en).author.url).toBe(`${base}/en/about`);
  });
});
