import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SEO_BASE, OG_IMAGE, getAlternateLinks } from "@/lib/seo";

/**
 * Auto-referencing canonical + hreflang FR/EN/x-default for every page.
 * Also injects:
 *  - og:locale + og:site_name + og:type + og:url + og:image (default)
 *  - twitter:card defaults
 *  - <html lang="fr|en">
 *
 * Page-specific title / description / og:title / og:image continue to be set
 * imperatively via setSeoTags() in each page — Helmet here only fills universal defaults.
 */
export default function DynamicCanonical() {
  const { pathname } = useLocation();
  const clean = pathname.replace(/\/+$/, "") || "";
  const canonicalPath = getCanonicalPath(clean);
  // Query-string variants collapse to their bare route. Indexable Explorer
  // tool pages now live at /explorer/around/:slug; the former
  // ?type=outil&source= form is kept only as a client-side compatibility path.
  const canonical = `${SEO_BASE}${canonicalPath}`;

  const localizedMatch = clean.match(/^\/(fr|en)(\/.*)?$/);
  const alternates = localizedMatch ? getAlternateLinks(clean) : [];

  const isEn = clean.startsWith("/en");
  const locale = isEn ? "en_US" : "fr_FR";
  // Internal query-result pages are useful navigation surfaces but should not
  // become an unlimited family of thin, duplicate pages in search indexes.
  const isInternalSearch = /\/search$/.test(canonicalPath);

  // The prerenderer writes crawlable canonical/hreflang tags into the static
  // HTML. Once React hydrates, Helmet becomes the single owner: remove only
  // the unmanaged static copies so the live DOM never exposes duplicates.
  useEffect(() => {
    document
      .querySelectorAll('link[rel="canonical"]:not([data-rh]), link[rel="alternate"][hreflang]:not([data-rh])')
      .forEach((element) => element.remove());
  }, [canonical]);

  useEffect(() => {
    if (!isInternalSearch) return;
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]:not([data-rh])');
    if (!robots) return;

    const previousContent = robots.content;
    robots.content = "noindex, follow";
    robots.dataset.tooltrimSearchRobots = "true";

    return () => {
      if (robots.dataset.tooltrimSearchRobots !== "true") return;
      robots.content = previousContent;
      delete robots.dataset.tooltrimSearchRobots;
    };
  }, [isInternalSearch]);

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
