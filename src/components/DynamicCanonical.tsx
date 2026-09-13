import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SEO_BASE, OG_IMAGE, getAlternateLinks } from "@/lib/seo";

/**
 * Canonical auto-référent + hreflang FR/EN/x-default de chaque page, plus les
 * valeurs par défaut Open Graph et Twitter, et l'attribut `lang` du document.
 *
 * Écrit directement dans le DOM, et non via react-helmet-async.
 *
 * Le composant déléguait à Helmet, en supprimant au passage les balises
 * statiques du prérendu « puisque Helmet en devient le seul propriétaire ».
 * Helmet ne les reprenait jamais : sur une page servie, le canonical et les
 * hreflang étaient présents dans le HTML, puis disparaissaient du DOM une
 * seconde après l'hydratation. Aucune balise `data-rh` n'apparaissait, en
 * hydratation comme en navigation interne, et le résultat de Helmet n'est de
 * toute façon jamais lu par le prérendu, qui écrit ses balises lui-même.
 * Le nettoyage supprimait donc sans remplacer.
 *
 * Comme Google exécute le JavaScript, les pages finissaient rendues sans
 * canonical ni hreflang, alors que tout l'appariement FR/EN repose dessus.
 *
 * On met donc à jour les balises existantes au lieu de les détruire : le
 * prérendu reste la source pour les robots sans JavaScript, et la navigation
 * interne garde des balises justes.
 *
 * Le titre, la description et og:title restent posés par setSeoTags() dans
 * chaque page.
 */

/** Met à jour une balise existante, ou la crée si le prérendu ne l'a pas posée. */
function upsertTag<E extends HTMLElement>(
  selector: string,
  create: () => E,
  apply: (element: E) => void,
): void {
  const existing = document.head.querySelector<E>(selector);
  const element = existing ?? create();
  apply(element);
  if (!existing) document.head.appendChild(element);
}

function upsertMeta(attribute: "name" | "property", key: string, content: string): void {
  upsertTag<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
    () => {
      const meta = document.createElement("meta");
      meta.setAttribute(attribute, key);
      return meta;
    },
    (meta) => { meta.content = content; },
  );
}
export default function DynamicCanonical() {
  const { pathname } = useLocation();
  const clean = pathname.replace(/\/+$/, "") || "";
  const canonicalPath = getCanonicalPath(clean);
  // Query-string variants collapse to their bare route. Indexable Explorer
  // tool pages now live at /explorer/around/:slug; the former
  // ?type=outil&source= form is kept only as a client-side compatibility path.
  const canonical = `${SEO_BASE}${canonicalPath}`;

  // Alternates are derived from the canonical path, not the visited one:
  // hreflang has to name canonical URLs, and a page whose canonical points
  // elsewhere (a tool `/faq`) must not advertise itself as the FR/EN pair.
  const localizedMatch = clean.match(/^\/(fr|en)(\/.*)?$/);
  const alternates = localizedMatch ? getAlternateLinks(canonicalPath) : [];

  const isEn = clean.startsWith("/en");
  const locale = isEn ? "en_US" : "fr_FR";
  // Internal query-result pages are useful navigation surfaces but should not
  // become an unlimited family of thin, duplicate pages in search indexes.
  const isInternalSearch = /\/search$/.test(canonicalPath);

  const alternatesKey = alternates.map(([lang, href]) => `${lang}|${href}`).join(",");

  useEffect(() => {
    document.documentElement.lang = isEn ? "en" : "fr";

    upsertTag<HTMLLinkElement>(
      'link[rel="canonical"]',
      () => {
        const link = document.createElement("link");
        link.rel = "canonical";
        return link;
      },
      (link) => { link.href = canonical; },
    );

    // Les hreflang forment un ensemble : on remplace l'ensemble plutôt que de
    // réconcilier balise par balise, sinon une paire retirée survivrait.
    document
      .head
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach((element) => element.remove());
    for (const [hrefLang, href] of alternates) {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = hrefLang;
      link.href = href;
      document.head.appendChild(link);
    }

    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:site_name", "ToolTrim");
    upsertMeta("property", "og:locale", locale);
    upsertMeta("property", "og:image", OG_IMAGE);

    // twitter:site est volontairement absent : c'est une constante deja posee
    // dans le <head> statique d'index.html, la redeclarer creait un doublon.
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:image", OG_IMAGE);
  }, [canonical, alternatesKey, isEn, locale]);

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

  // Tout passe par les effets ci-dessus : le composant ne rend rien.
  return null;
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

  // `/faq` carries no content of its own — every answer is derived from fields
  // the fiche already displays — and GSC gives the whole family 8 clicks for
  // 4648 impressions over three months. It now points at the fiche so the two
  // stop splitting one signal. Mirrored in the prerenderer and excluded from
  // the sitemap — keep the three in sync.
  if (subPage === "faq") return `/${lang}/tool/${slug}`;

  const localized = TOOL_SUBPAGE_ALIASES[subPage];
  if (!localized) return pathname;

  return `/${lang}/tool/${slug}/${lang === "fr" ? localized.fr : localized.en}`;
}
