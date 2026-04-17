import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { SEO_BASE } from "@/lib/seo";

/**
 * Auto-referencing canonical + hreflang FR/EN/x-default for every page.
 * - Strips trailing slashes.
 * - Forces "www" domain via SEO_BASE.
 * - If pathname starts with /fr or /en, emits proper alternate links.
 */
export default function DynamicCanonical() {
  const { pathname } = useLocation();
  const clean = pathname.replace(/\/+$/, "") || "";
  const canonical = `${SEO_BASE}${clean}`;

  // Detect lang prefix
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

  return (
    <Helmet>
      <link rel="canonical" href={canonical} />
      {frHref && <link rel="alternate" hrefLang="fr" href={frHref} />}
      {enHref && <link rel="alternate" hrefLang="en" href={enHref} />}
      {(frHref || enHref) && (
        <link rel="alternate" hrefLang="x-default" href={frHref ?? `${SEO_BASE}/fr`} />
      )}
    </Helmet>
  );
}
