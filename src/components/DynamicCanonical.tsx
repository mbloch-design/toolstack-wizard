import { Helmet } from "react-helmet-async";
import { useLocation, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const clean = pathname.replace(/\/+$/, "") || "";
  const canonicalPath = getCanonicalPath(clean);
  // Every other query-string variant of a page collapses to its bare path
  // (that's the point of a canonical tag). Explorer's "outil" source is the
  // one deliberate exception: /explorer?type=outil&source=X is a distinct,
  // indexable page per tool (see ExplorerPage's noindex logic), so it must
  // self-canonicalise with those two params rather than defer to the bare
  // /explorer landing page. Any other Explorer params (angle, theme,
  // destination) still collapse into this canonical form.
  const isExplorerOutilSource = /\/explorer$/.test(clean) && searchParams.get("type") === "outil" && !!searchParams.get("source");
  const canonical = isExplorerOutilSource
    ? `${SEO_BASE}${canonicalPath}?type=outil&source=${encodeURIComponent(searchParams.get("source")!)}`
    : `${SEO_BASE}${canonicalPath}`;

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

      {/* Twitter defaults. twitter:site is intentionally omitted here — it's
          a static constant already baked into index.html's <head>, and
          Helmet doesn't recognise that pre-existing tag as its own, so
          re-declaring it here produced a duplicate <meta name="twitter:site">
          once the page hydrated. */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={OG_IMAGE} />

      {/* Noindex on funnel pages */}
      {isFunnel && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}

/**
 * FR and EN each own one spelling of a tool sub-page; the other spelling is an
 * alias that must not self-canonicalise. Mirrors EN_SUB_PATH in vite.config.ts
 * and the 301s in vercel.json — keep the three in sync.
 */
const TOOL_SUBPAGE_ALIASES: Record<string, { fr: string; en: string }> = {
  prix: { fr: "prix", en: "pricing" },
  pricing: { fr: "prix", en: "pricing" },
  avis: { fr: "avis", en: "reviews" },
  reviews: { fr: "avis", en: "reviews" },
};

function getCanonicalPath(pathname: string) {
  const subPageAlias = pathname.match(/^\/(fr|en)\/tool\/([^/]+)\/([^/]+)$/);
  if (!subPageAlias) return pathname;

  const [, lang, slug, subPage] = subPageAlias;
  const localized = TOOL_SUBPAGE_ALIASES[subPage];
  if (!localized) return pathname;

  return `/${lang}/tool/${slug}/${lang === "fr" ? localized.fr : localized.en}`;
}
