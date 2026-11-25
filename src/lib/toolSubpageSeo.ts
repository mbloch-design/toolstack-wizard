/**
 * Indexation des sous-pages outil (/prix, /alternatives), partagée par le
 * sitemap et le prérendu (vite.config.ts), les hreflang (getAlternateLinks)
 * et la page client (ToolDetailPage), pour que le HTML servi et le DOM
 * hydraté disent la même chose.
 *
 * La liste vient de scripts/gen-tool-subpage-noindex.mjs (exports Search
 * Console + mesure du build). Une page sortie reste accessible et suivie
 * (noindex, follow), hors sitemap et sans hreflang.
 */
import noindexList from "../data/toolSubpageNoindex.json";

export type ToolSubpageKind = "prix" | "alternatives" | "avis";

const LISTED = new Set<string>();
for (const [lang, kinds] of Object.entries(noindexList.pages as Record<string, Record<string, string[]>>)) {
  for (const [kind, slugs] of Object.entries(kinds)) {
    for (const slug of slugs) LISTED.add(`${lang}:${kind}:${slug}`);
  }
}

export function isToolSubpageIndexable(lang: "fr" | "en", slug: string, kind: ToolSubpageKind): boolean {
  return !LISTED.has(`${lang}:${kind}:${slug}`);
}

/** hreflang only when both language versions are in the index. */
export function isToolSubpagePairIndexable(slug: string, kind: ToolSubpageKind): boolean {
  return isToolSubpageIndexable("fr", slug, kind) && isToolSubpageIndexable("en", slug, kind);
}

/** Reads a /fr|en/tool/:slug/:segment path; segment in either language. */
export function parseToolSubpagePath(path: string): { lang: "fr" | "en"; slug: string; kind: ToolSubpageKind } | null {
  const match = path.match(/^\/(fr|en)\/tool\/([^/]+)\/(prix|pricing|alternatives|avis|reviews)\/?$/);
  if (!match) return null;
  const segment = match[3];
  const kind: ToolSubpageKind = segment === "pricing" ? "prix" : segment === "reviews" ? "avis" : (segment as ToolSubpageKind);
  return { lang: match[1] as "fr" | "en", slug: match[2], kind };
}
