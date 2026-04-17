import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { SEO_BASE, OG_IMAGE } from "@/lib/seo";

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
  const canonical = `${SEO_BASE}${clean}`;

  const frMatch = clean.match(/^\/fr(\/.*)?$/);
  const enMatch = clean.match(/^\/en(\/.*)?$/);

  let frHref: string | null = null;
  let enHref: string | null = null;

  if (frMatch) {
    const rest = frMatch[1] || "";
    frHref = `${SEO_BASE}/fr${rest}`;
    enHref = `${SEO_BASE}/en${rest}`;
  } else if (enMatch) {
    const rest = enMatch[1] || "";
    frHref = `${SEO_BASE}/fr${rest}`;
    enHref = `${SEO_BASE}/en${rest}`;
  }

  const isEn = !!enMatch;
  const locale = isEn ? "en_US" : "fr_FR";
  const isFunnel =
    /\/selector(\/|$)/.test(clean) || /\/diagnostic(\/|$)/.test(clean);

  return (
    <Helmet>
      <html lang={isEn ? "en" : "fr"} />
      <link rel="canonical" href={canonical} />
      {frHref && <link rel="alternate" hrefLang="fr" href={frHref} />}
      {enHref && <link rel="alternate" hrefLang="en" href={enHref} />}
      {(frHref || enHref) && (
        <link rel="alternate" hrefLang="x-default" href={frHref ?? `${SEO_BASE}/fr`} />
      )}

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
