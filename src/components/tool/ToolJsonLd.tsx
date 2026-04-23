import { useEffect } from "react";
import type { Tool, Category } from "@/data/types";
import { setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";

interface Props {
  tool: Tool;
  category: Category | undefined;
  displayPrice: number;
  verifiedOn: string;
  alternatives: Tool[];
  lang: string;
}

/**
 * Manages all JSON-LD schemas for the tool detail page:
 * - WebPage
 * - BreadcrumbList
 * - SoftwareApplication + Offer
 * - FAQPage
 */
export default function ToolJsonLd({ tool, category, displayPrice, verifiedOn, alternatives, lang }: Props) {
  useEffect(() => {
    const canonicalUrl = `${SEO_BASE}/${lang}/tool/${tool.slug || tool.id}`;
    const categoryLabel = category
      ? category.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "")
      : "";

    // 1. WebPage
    setJsonLd("tool-webpage-jsonld", {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${tool.name} — ${lang === "fr" ? "Avis et alternatives" : "Review & alternatives"} | ToolTrim`,
      description: tool.shortDescription,
      url: canonicalUrl,
      dateModified: verifiedOn,
      publisher: {
        "@type": "Organization",
        name: "ToolTrim",
        url: SEO_BASE,
      },
    });

    // 2. BreadcrumbList
    const breadcrumbItems = [
      { "@type": "ListItem", position: 1, name: "ToolTrim", item: SEO_BASE },
      { "@type": "ListItem", position: 2, name: lang === "fr" ? "Outils" : "Tools", item: `${SEO_BASE}/${lang}/tools` },
    ];
    if (category) {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 3,
        name: categoryLabel,
        item: `${SEO_BASE}/${lang}/category/${category.slug}`,
      });
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 4,
        name: tool.name,
        item: canonicalUrl,
      });
    } else {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: canonicalUrl,
      });
    }
    setJsonLd("tool-breadcrumb-jsonld", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    });

    // 3. SoftwareApplication + Offer + AggregateRating + Review
    // Derive ToolTrim score (out of 100) from pros/cons ratio, fallback 75/100
    const prosCount = tool.pros?.length || 0;
    const consCount = tool.cons?.length || 0;
    const total = prosCount + consCount;
    const scoreOn100 = total > 0
      ? Math.round((prosCount / total) * 50 + 50) // 50-100 range based on pros ratio
      : 75;
    const ratingValue = (Math.round((scoreOn100 / 20) * 10) / 10).toFixed(1); // 0-5, 1 decimal
    const reviewBody =
      (lang === "en" ? tool.verdictEn?.threshold : tool.verdict?.threshold) ||
      tool.verdict?.threshold ||
      (lang === "en" && tool.longDescriptionEn ? tool.longDescriptionEn : tool.longDescription) ||
      tool.shortDescription ||
      `${tool.name} review by ToolTrim.`;

    setJsonLd("tool-software-jsonld", {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tool.name,
      description: tool.shortDescription,
      url: tool.websiteUrl || canonicalUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: String(displayPrice || 0),
        priceCurrency: "EUR",
        ...(displayPrice > 0 && {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            billingDuration: "P1M",
          },
        }),
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue,
        bestRating: "5",
        worstRating: "1",
        ratingCount: "1",
        reviewCount: "1",
      },
      review: {
        "@type": "Review",
        author: {
          "@type": "Organization",
          name: "ToolTrim",
          url: SEO_BASE,
        },
        reviewRating: {
          "@type": "Rating",
          ratingValue,
          bestRating: "5",
          worstRating: "1",
        },
        reviewBody,
      },
    });

    // 4. FAQPage
    const freeAlts = alternatives.filter(a => a.defaultMonthlyPrice === 0).slice(0, 3);
    const topAlts = alternatives.slice(0, 5).map(a => a.name).join(", ");

    const faqEntries = [
      {
        "@type": "Question",
        name: lang === "fr" ? `À quoi sert ${tool.name} ?` : `What is ${tool.name} used for?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: tool.longDescription || tool.shortDescription || `${tool.name} is a SaaS tool.`,
        },
      },
      {
        "@type": "Question",
        name: lang === "fr" ? `Combien coûte ${tool.name} ?` : `How much does ${tool.name} cost?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: lang === "fr"
            ? `${tool.name} coûte ${displayPrice === 0 ? "0€ (gratuit)" : `${displayPrice}€/mois`}. Prix vérifié le ${verifiedOn}.`
            : `${tool.name} costs ${displayPrice === 0 ? "€0 (free)" : `€${displayPrice}/month`}. Price verified on ${verifiedOn}.`,
        },
      },
      {
        "@type": "Question",
        name: lang === "fr" ? `${tool.name} vaut-il son prix ?` : `Is ${tool.name} worth the price?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: tool.verdict?.threshold || (lang === "fr" ? "Cela dépend de votre usage." : "It depends on your usage."),
        },
      },
      {
        "@type": "Question",
        name: lang === "fr" ? `Quelles sont les meilleures alternatives à ${tool.name} ?` : `What are the best alternatives to ${tool.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: topAlts
            ? (lang === "fr"
              ? `Les principales alternatives à ${tool.name} sont : ${topAlts}.${freeAlts.length > 0 ? ` Alternatives gratuites : ${freeAlts.map(a => a.name).join(", ")}.` : ""}`
              : `The main alternatives to ${tool.name} are: ${topAlts}.${freeAlts.length > 0 ? ` Free alternatives: ${freeAlts.map(a => a.name).join(", ")}.` : ""}`)
            : (lang === "fr" ? "Aucune alternative directe référencée." : "No direct alternative listed."),
        },
      },
    ];

    if (tool.freeAlternative) {
      faqEntries.push({
        "@type": "Question",
        name: lang === "fr" ? `Existe-t-il une alternative gratuite à ${tool.name} ?` : `Is there a free alternative to ${tool.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: lang === "fr"
            ? `Oui, ${tool.freeAlternative} est une alternative gratuite à ${tool.name}.`
            : `Yes, ${tool.freeAlternative} is a free alternative to ${tool.name}.`,
        },
      });
    }

    setJsonLd("tool-faq-jsonld", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqEntries,
    });

    return () => cleanupSeo(["tool-webpage-jsonld", "tool-breadcrumb-jsonld", "tool-software-jsonld", "tool-faq-jsonld"]);
  }, [tool, category, displayPrice, verifiedOn, alternatives, lang]);

  return null;
}
