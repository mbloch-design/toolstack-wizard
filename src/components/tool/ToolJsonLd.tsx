import { useEffect } from "react";
import type { Tool, Category } from "@/data/types";
import { setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { buildToolFaqs } from "@/lib/toolFaq";
import { computeToolTrimScore } from "@/lib/toolTrimScore";
import { hasGenuineFreeTier } from "@/lib/pricing";
import { getToolTutorials } from "@/data/toolTutorials";

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
    const pageIntent = canonicalUrl.endsWith("/prix") || canonicalUrl.endsWith("/pricing")
      ? (lang === "fr" ? "Prix et tarifs" : "Pricing and plans")
      : canonicalUrl.endsWith("/alternatives")
      ? (lang === "fr" ? "Alternatives" : "Alternatives")
      : canonicalUrl.endsWith("/avis") || canonicalUrl.endsWith("/reviews")
      ? (lang === "fr" ? "Avis et verdict" : "Review and verdict")
      : canonicalUrl.endsWith("/faq")
      ? "FAQ"
      : (lang === "fr" ? "Avis, prix et alternatives" : "Review, pricing and alternatives");

    // 1. WebPage
    setJsonLd("tool-webpage-jsonld", {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${tool.name} : ${pageIntent} | ToolTrim`,
      description: tool.shortDescription,
      url: canonicalUrl,
      dateModified: verifiedOn,
      publisher: {
        "@type": "Organization",
        name: "ToolTrim",
        url: SEO_BASE,
      },
    });

    // 2. SoftwareApplication + editorial Review. Deliberately no
    // AggregateRating: ToolTrim publishes one editorial score, not a pool of
    // user ratings, so inventing ratingCount/reviewCount would be misleading.
    const score = computeToolTrimScore(tool);
    const ratingValue = score.score.toFixed(1);
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
      offers: hasGenuineFreeTier(tool.pricing?.free) && displayPrice > 0
        ? {
            "@type": "AggregateOffer",
            lowPrice: "0",
            highPrice: String(displayPrice),
            priceCurrency: "EUR",
            offerCount: "2",
          }
        : {
            "@type": "Offer",
            price: String(displayPrice || 0),
            priceCurrency: "EUR",
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

    // VideoObject is emitted only when the curated video is visible on the
    // overview page. The UI and structured data share the same metadata.
    const tutorials = getToolTutorials(tool.slug || tool.id);
    const isOverview = canonicalUrl === `${SEO_BASE}/${lang}/tool/${tool.slug || tool.id}`;
    if (isOverview && tutorials.length > 0) {
      const videos = tutorials.map((tutorial) => ({
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: lang === "en" ? tutorial.titleEn : tutorial.titleFr,
        description: lang === "en"
          ? `Official ${tool.name} tutorial published by ${tutorial.author}.`
          : `Tutoriel officiel ${tool.name} publié par ${tutorial.author}.`,
        thumbnailUrl: `https://i.ytimg.com/vi/${tutorial.videoId}/hqdefault.jpg`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${tutorial.videoId}`,
        contentUrl: tutorial.sourceUrl,
        uploadDate: tutorial.publishedOn,
      }));
      setJsonLd("tool-video-jsonld", videos.length === 1 ? videos[0] : {
        "@context": "https://schema.org",
        "@graph": videos,
      });
    }

    // 3. FAQPage — mirrors the on-page FAQ (ToolFAQSection) exactly: both
    // pull from buildToolFaqs, the single source of these questions/answers,
    // so they can never drift out of sync (required by Google's FAQPage policy).
    if (includeFaq) {
      const faqEntries = buildToolFaqs(tool, lang, displayPrice, verifiedOn, alternatives).map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      }));

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

    return () => cleanupSeo(["tool-webpage-jsonld", "tool-software-jsonld", "tool-video-jsonld", "tool-faq-jsonld", "tool-breadcrumb-jsonld"]);
  }, [tool, category, displayPrice, verifiedOn, alternatives, lang, includeFaq, pageCanonicalUrl]);

  return null;
}
