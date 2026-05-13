import { Helmet } from "react-helmet-async";
import { SEO_BASE } from "@/lib/seo";

/**
 * Injects an Organization + WebSite JSON-LD via react-helmet-async.
 *
 * ⚠️ HomePage already injects an Organization schema imperatively via setJsonLd().
 * Do NOT mount this on HomePage to avoid duplicates. Use it on secondary pages
 * (About, Methodology, Contact, etc.) where no Organization schema exists yet.
 */
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "ToolTrim",
        url: SEO_BASE,
        logo: {
          "@type": "ImageObject",
          url: `${SEO_BASE}/picto-logo.svg`,
          width: 512,
          height: 512,
        },
        description:
          "Independent SaaS tool directory with human-verified pricing, honest alternatives and zero affiliate bias.",
        foundingDate: "2024",
        email: "contact@tooltrim.com",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "contact@tooltrim.com",
          url: `${SEO_BASE}/fr/contact`,
          availableLanguage: ["French", "English"],
        },
        sameAs: [
          "https://twitter.com/tooltrim",
          "https://www.linkedin.com/company/tooltrim",
          "https://github.com/tooltrim",
          "https://www.producthunt.com/products/tooltrim",
          "https://www.crunchbase.com/organization/tooltrim",
        ],
      },
      {
        "@type": "WebSite",
        name: "ToolTrim",
        url: SEO_BASE,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SEO_BASE}/fr/tools?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
