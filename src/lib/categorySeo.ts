/**
 * SEO rules for /category/:slug pages, shared by the prerender (vite.config.ts)
 * and the client page, so the title Google indexes is the one the page keeps
 * after hydration.
 */
import { fitBrandedTitle } from "./seoTitle";

/**
 * Below this many tools a category page is too thin to earn a place in the
 * index: it stays reachable and followed, but noindex and out of the sitemap.
 */
export const MIN_INDEXABLE_CATEGORY_TOOLS = 10;

/**
 * Category pages are out of the index until they are rebuilt (decision of
 * 19/10/2026): ~150 words of names, off-topic members (Gong and WhatsApp in
 * project management), French slugs on English URLs, 6 impressions in three
 * months. They stay reachable and followed for navigation.
 */
export const CATEGORY_PAGES_INDEXED = false;

/** Enough tools to be a useful page to link to, indexed or not. */
export function isCategoryLinkable(toolCount: number): boolean {
  return toolCount >= MIN_INDEXABLE_CATEGORY_TOOLS;
}

export function isCategoryIndexable(toolCount: number): boolean {
  return CATEGORY_PAGES_INDEXED && isCategoryLinkable(toolCount);
}

export function categorySeoTitle(name: string, lang: string, year: number): string {
  return lang === "fr"
    ? fitBrandedTitle(`${name} : meilleurs outils SaaS pour freelances ${year}`)
    : fitBrandedTitle(`${name}: best SaaS tools for freelancers ${year}`);
}

export function categorySeoDescription(name: string, lead: string, lang: string): string {
  const intro = lead ? `${lead.trim()} ` : "";
  return lang === "fr"
    ? `${intro}Comparez les meilleurs outils de la catégorie ${name} : avis, prix vérifiés et alternatives. Recommandations ToolTrim pour freelances.`
    : `${intro}Compare the best ${name} tools: honest reviews, verified pricing and alternatives. ToolTrim recommendations for freelancers.`;
}
