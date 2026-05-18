import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { SEO_BASE, OG_IMAGE, getAlternateLinks } from "@/lib/seo";

/**
 * Auto-referencing canonical + hreflang FR/EN/x-default for every page.
 * Also injects:
 *  - og:locale + og:site_name + og:type + og:url + og:image (default)
 *  - twitter:card defaults
 *  - <html lang="fr|en">
 *  - noindex on /selector and /diagnostic funnel routes
 *
 * Page-specific title / description / og:title / og:image continue to be set
 * imperatively via setSeoTags() in each page — Helmet here only fills universal defaults.
 */
export default function DynamicCanonical() {
  const { pathname } = useLocation();
  const clean = pathname.replace(/\/+$/, "") || "";
  const canonicalPath = getCanonicalPath(clean);
  const canonical = `${SEO_BASE}${canonicalPath}`;

  const localizedMatch = clean.match(/^\/(fr|en)(\/.*)?$/);
  const alternates = localizedMatch ? getAlternateLinks(clean) : [];

  const isEn = clean.startsWith("/en");
  const locale = isEn ? "en_US" : "fr_FR";
  const isFunnel =
    /\/selector(\/|$)/.test(canonicalPath) || /\/diagnostic(\/|$)/.test(canonicalPath);

  return (
    <Helmet>
      <html lang={isEn ? "en" : "fr"} />
      <link rel="canonical" href={canonical} />
      {alternates.map(([hrefLang, href]) => (
        <link key={hrefLang} rel="alternate" hrefLang={hrefLang} href={href} />
      ))}

      {/* Universal OG defaults */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="ToolTrim" />
      <meta property="og:locale" content={locale} />
      <meta property="og:image" content={OG_IMAGE} />

      {/* Twitter defaults */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@tooltrim" />
      <meta name="twitter:image" content={OG_IMAGE} />

      {/* Noindex on funnel pages */}
      {isFunnel && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}

function getCanonicalPath(pathname: string) {
  const toolPricingAlias = pathname.match(/^\/(fr|en)\/tool\/([^/]+)\/(prix|pricing)$/);
  if (!toolPricingAlias) return pathname;

  const [, lang, slug] = toolPricingAlias;
  return `/${lang}/tool/${slug}/${lang === "fr" ? "prix" : "pricing"}`;
}
