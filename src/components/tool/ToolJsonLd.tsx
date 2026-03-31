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

    // 3. SoftwareApplication + Offer
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
      review: {
        "@type": "Review",
        reviewBody: tool.verdict?.threshold || tool.pros?.slice(0, 3).join(". ") + "." || "",
        author: {
          "@type": "Organization",
          name: "ToolTrim",
          url: SEO_BASE,
        },
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
