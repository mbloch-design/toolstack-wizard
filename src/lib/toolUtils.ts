/**
 * Shared tool utility functions — single source of truth.
 * Previously duplicated in ToolDetailPage, CategoryPage, GuidesPage, HomePage, HeroSection.
 */

/** True if the tool's paid pricing is a one-time/perpetual license, not a subscription. */
export function isOneTimePrice(tool: { pricing?: { paid?: string } }): boolean {
  return /licence|à vie|perp[ée]tuel|one-?time|perpetual/i.test(tool.pricing?.paid || "");
}

/** Format a displayable price label ("16,80€" or "16,80€/mois"), without hiding observed decimals. */
export function formatPriceLabel(
  tool: { pricing?: { paid?: string } },
  price: number,
  t: (fr: string, en: string) => string
): string {
  if (price === 0) return t("Gratuit", "Free");
  const amount = t(
    price.toLocaleString("fr-FR", { maximumFractionDigits: 2 }),
    price.toLocaleString("en-US", { maximumFractionDigits: 2 }),
  );
  return isOneTimePrice(tool) ? `${amount}€` : `${amount}€/${t("mois", "mo")}`;
}

interface VerdictLike {
  keepIf?: string[] | string;
  avoidIf?: string[] | string;
  threshold?: string;
}

/**
 * Resolve the lang-aware verdict (verdictEn on English pages, falling back
 * to verdict) into normalized keepItems/avoidItems/threshold. Previously
 * duplicated verbatim in ToolDetailPage and StickyDecisionCard — each then
 * formats the result differently (a 3-block "quick decision" vs a single
 * sentence), so only this shared resolution step is extracted, not the
 * downstream formatting.
 */
export function resolveVerdict(
  tool: { verdict?: VerdictLike; verdictEn?: VerdictLike },
  lang: string
): { keepItems: string[]; avoidItems: string[]; threshold: string | undefined } {
  const vd = lang === "en" && tool.verdictEn ? tool.verdictEn : tool.verdict;
  const keepItems = (Array.isArray(vd?.keepIf) ? vd.keepIf : [vd?.keepIf]).filter(Boolean) as string[];
  const avoidItems = (Array.isArray(vd?.avoidIf) ? vd.avoidIf : [vd?.avoidIf]).filter(Boolean) as string[];
  return { keepItems, avoidItems, threshold: vd?.threshold };
}

/** Extract bare hostname from a tool's websiteUrl or affiliateLink */
export function getToolDomain(tool: {
  websiteUrl?: string;
  affiliateLink?: string;
}): string {
  const url = tool.websiteUrl || tool.affiliateLink;
  return getDomainFromUrl(url);
}

/** Extract bare hostname from any URL string */
export function getDomainFromUrl(url?: string): string {
  if (!url) return "";
  try {
    return new URL(
      url.startsWith("http") ? url : `https://${url}`
    ).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

/** Deprecated: logo fallbacks are rendered locally to avoid third-party favicon 404s. */
export function getToolFaviconUrl(
  tool: { websiteUrl?: string; affiliateLink?: string },
  size: 32 | 64 = 64
): string {
  void tool;
  void size;
  return "";
}

/** Slug-ish taxonomy value ("generation-texte") -> label ("Generation texte"). */
export function humanizeValue(value: string) {
  const cleaned = value.replace(/[-_]+/g, " ").trim();
  return cleaned ? `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}` : "";
}

/**
 * The four lists behind the tool overview, resolved the same way on the tool
 * page and inside the Ma stack inspector — the two must tell the same story
 * about the same tool.
 *
 * `limit` truncates for the inspector, which is a preview inside a board. The
 * tool page is the reference sheet and passes nothing: it shows everything.
 */
export function resolveToolOverview(
  tool: any,
  lang: string,
  limits?: { pros?: number; useCases?: number; cons?: number; coverage?: number }
) {
  const pick = (fr: string, en: string) =>
    ((lang === "en" ? tool?.[en] || tool?.[fr] : tool?.[fr]) || []).filter(Boolean);
  const cap = (arr: any[], n?: number) => (n ? arr.slice(0, n) : arr);

  return {
    longDescription: lang === "en"
      ? tool?.longDescriptionEn || tool?.longDescription
      : tool?.longDescription,
    pros: cap(pick("pros", "prosEn"), limits?.pros),
    useCases: cap(pick("useCases", "useCasesEn"), limits?.useCases),
    cons: cap(pick("cons", "consEn"), limits?.cons),
    coverage: cap(
      Array.from(new Set([...(tool?.functional_needs || []), ...(tool?.covers || [])]))
        .map(humanizeValue)
        .filter(Boolean),
      limits?.coverage
    ),
  };
}
