import { Helmet } from "react-helmet-async";
import { SEO_BASE } from "@/lib/seo";

/**
 * Injects an Organization JSON-LD via react-helmet-async.
 *
 * ⚠️ HomePage already injects an Organization schema imperatively via setJsonLd().
 * Do NOT mount this on HomePage to avoid duplicates. Use it on secondary pages
 * (About, Methodology, Contact, etc.) where no Organization schema exists yet.
 */
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ToolTrim",
    url: SEO_BASE,
    logo: `${SEO_BASE}/picto-logo.svg`,
    description:
      "SaaS stack audit tool for freelancers. Detect duplicates, ghost subscriptions and optimize your tool costs.",
    sameAs: [],
    foundingDate: "2026",
    knowsAbout: [
      "SaaS",
      "freelance tools",
      "software audit",
      "subscription management",
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
