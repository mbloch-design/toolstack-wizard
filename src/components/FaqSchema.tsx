import { Helmet } from "react-helmet-async";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSchemaProps {
  faqs: FaqItem[];
}

/**
 * Injects a FAQPage JSON-LD via react-helmet-async.
 *
 * ⚠️ Avoid duplicates: HomePage, ToolJsonLd, GuideDetailPage and ComparePage
 * already inject their own FAQ/Article schemas imperatively via setJsonLd().
 * Use this component ONLY on new pages that don't already have FAQ JSON-LD.
 */
export function FaqSchema({ faqs }: FaqSchemaProps) {
  if (!faqs || faqs.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
