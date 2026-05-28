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
  includeFaq?: boolean;
  canonicalUrl?: string;
}

/**
 * Manages all JSON-LD schemas for the tool detail page:
 * - WebPage
 * - SoftwareApplication + Offer
 * - FAQPage when the dedicated FAQ page is rendered
 */
export default function ToolJsonLd({ tool, category, displayPrice, verifiedOn, alternatives, lang, includeFaq = false, canonicalUrl: pageCanonicalUrl }: Props) {
  useEffect(() => {
    const canonicalUrl = pageCanonicalUrl || `${SEO_BASE}/${lang}/tool/${tool.slug || tool.id}`;

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

    // 2. SoftwareApplication + Offer + AggregateRating + Review
    // ToolTrim score (0–100) — prescription_quality as primary signal,
    // tuned by soloRelevance, teamRelevance, pros/cons ratio and verdict balance.
    const prosCount  = tool.pros?.length  || 0;
    const consCount  = tool.cons?.length  || 0;
    const keepCount  = tool.verdict?.keepIf?.length  || 0;
    const avoidCount = tool.verdict?.avoidIf?.length || 0;

    // 1. Base score from editorial prescription confidence
    const pq = tool.prescription_quality || "silence";
    const baseScore =
      pq === "ferme" ? 84
      : pq === "oui"  ? 80
      : pq === "question" ? 68
      : /* silence */  62; // 62 = no strong opinion, but tool exists in catalog

    // 2. Solo relevance adjustment (ToolTrim's target audience = solo/freelance)
    const soloAdj =
      tool.soloRelevance === "high"   ?  9
      : tool.soloRelevance === "medium" ?  3
      : tool.soloRelevance === "low"    ? -6
      : 0;

    // 3. Team relevance (secondary signal)
    const teamAdj =
      tool.teamRelevance === "high"   ?  4
      : tool.teamRelevance === "low"    ? -3
      : 0;

    // 4. Pros/cons directional signal (not ratio — absolute skew)
    const pcAdj = prosCount > consCount ?  5
      : consCount > prosCount ? -7
      : 0;

    // 5. Verdict directional signal
    const vAdj = keepCount > avoidCount ?  4
      : avoidCount > keepCount ? -5
      : 0;

    const rawScore = baseScore + soloAdj + teamAdj + pcAdj + vAdj;
    const scoreOn100 = Math.min(97, Math.max(28, rawScore)); // clamp to [28, 97]
    const ratingValue = (Math.round((scoreOn100 / 20) * 10) / 10).toFixed(1); // /5, 1 decimal

    // ratingCount = number of editorial criteria evaluated (realistic count ≥ 5)
    const criteriaEvaluated = Math.max(5, prosCount + consCount + keepCount + avoidCount + 2);
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
        ratingCount: String(criteriaEvaluated),
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

    // 3. FAQPage
    if (includeFaq) {
      const freeAlts = alternatives.filter(a => a.defaultMonthlyPrice === 0).slice(0, 3);
      const topAlts = alternatives.slice(0, 5).map(a => a.name).join(", ");

      // Mirrors the on-page FAQ (ToolFAQSection) exactly: same questions,
      // same order, same answer text — required by Google's FAQPage policy.
      const planFr = tool.pricing_v5?.compare_plan_name ? ` (plan ${tool.pricing_v5.compare_plan_name})` : "";
      const planEn = tool.pricing_v5?.compare_plan_name ? ` (${tool.pricing_v5.compare_plan_name} plan)` : "";

      const faqEntries = [
        {
          "@type": "Question",
          name: lang === "fr" ? `À quoi sert ${tool.name} ?` : `What is ${tool.name} used for?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: (lang === "en" && (tool as any).shortDescriptionEn ? (tool as any).shortDescriptionEn : tool.shortDescription)
              || (lang === "fr" ? `${tool.name} est un outil de productivité SaaS.` : `${tool.name} is a SaaS productivity tool.`),
          },
        },
        {
          "@type": "Question",
          name: lang === "fr" ? `Combien coûte ${tool.name} ?` : `How much does ${tool.name} cost?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: lang === "fr"
              ? `${tool.name} coûte ${displayPrice === 0 ? "0€ (gratuit)" : `${displayPrice}€/mois`}${planFr}. Prix vérifié le ${verifiedOn}.`
              : `${tool.name} costs ${displayPrice === 0 ? "€0 (free)" : `€${displayPrice}/month`}${planEn}. Price verified on ${verifiedOn}.`,
          },
        },
        {
          "@type": "Question",
          name: lang === "fr" ? `${tool.name} est-il adapté aux débutants ?` : `Is ${tool.name} suitable for beginners?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: tool.soloRelevance
              ? (lang === "fr"
                ? `${tool.name} est particulièrement adapté aux freelances et indépendants. ${tool.soloRelevance}`
                : `${tool.name} is particularly suited for freelancers and solopreneurs. ${tool.soloRelevance}`)
              : (lang === "fr"
                ? `${tool.name} convient à la plupart des professionnels. Consultez la section "Pour qui" pour plus de détails.`
                : `${tool.name} suits most professionals. See the "Who is it for" section for details.`),
          },
        },
        {
          "@type": "Question",
          name: lang === "fr" ? `${tool.name} vaut-il son prix ?` : `Is ${tool.name} worth the price?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: ((lang === "en" && tool.verdictEn?.threshold) ? tool.verdictEn.threshold : tool.verdict?.threshold)
              || (lang === "fr" ? "Cela dépend de votre usage. Consultez notre verdict ci-dessus." : "It depends on your usage. See our verdict above."),
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
    }

    // 4. BreadcrumbList — helps Google display path in SERP snippet
    const toolUrl = `${SEO_BASE}/${lang}/tool/${tool.slug || tool.id}`;
    const breadcrumbItems: object[] = [
      {
        "@type": "ListItem",
        position: 1,
        name: lang === "fr" ? "Accueil" : "Home",
        item: `${SEO_BASE}/${lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: lang === "fr" ? "Outils" : "Tools",
        item: `${SEO_BASE}/${lang}/tools`,
      },
    ];
    if (category) {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 3,
        name: lang === "fr" ? (category.name || category.id) : (category.nameEn || category.name || category.id),
        item: `${SEO_BASE}/${lang}/category/${category.slug || category.id}`,
      });
    }
    breadcrumbItems.push({
      "@type": "ListItem",
      position: breadcrumbItems.length + 1,
      name: tool.name,
      item: canonicalUrl !== toolUrl ? toolUrl : canonicalUrl,
    });
    // If we're on a sub-page, add it as the last crumb
    if (canonicalUrl !== toolUrl) {
      const subLabel =
        canonicalUrl.endsWith("/prix") || canonicalUrl.endsWith("/pricing")
          ? (lang === "fr" ? "Prix" : "Pricing")
          : canonicalUrl.endsWith("/alternatives")
          ? (lang === "fr" ? "Alternatives" : "Alternatives")
          : canonicalUrl.endsWith("/avis") || canonicalUrl.endsWith("/reviews")
          ? (lang === "fr" ? "Avis" : "Reviews")
          : canonicalUrl.endsWith("/faq")
          ? "FAQ"
          : null;
      if (subLabel) {
        breadcrumbItems[breadcrumbItems.length - 1] = {
          "@type": "ListItem",
          position: breadcrumbItems.length,
          name: tool.name,
          item: toolUrl,
        };
        breadcrumbItems.push({
          "@type": "ListItem",
          position: breadcrumbItems.length + 1,
          name: subLabel,
          item: canonicalUrl,
        });
      }
    }
    setJsonLd("tool-breadcrumb-jsonld", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    });

    return () => cleanupSeo(["tool-webpage-jsonld", "tool-software-jsonld", "tool-faq-jsonld", "tool-breadcrumb-jsonld"]);
  }, [tool, category, displayPrice, verifiedOn, alternatives, lang, includeFaq]);

  return null;
}
