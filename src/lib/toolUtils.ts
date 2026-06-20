/**
 * Shared tool utility functions — single source of truth.
 * Previously duplicated in ToolDetailPage, CategoryPage, GuidesPage, HomePage, HeroSection.
 */

/** True if the tool's paid pricing is a one-time/perpetual license, not a subscription. */
export function isOneTimePrice(tool: { pricing?: { paid?: string } }): boolean {
  return /licence|à vie|perp[ée]tuel|one-?time|perpetual/i.test(tool.pricing?.paid || "");
}

/** Format a displayable price label ("995€" or "995€/mois"), free-aware and one-time-aware. */
export function formatPriceLabel(
  tool: { pricing?: { paid?: string } },
  price: number,
  t: (fr: string, en: string) => string
): string {
  if (price === 0) return t("Gratuit", "Free");
  const rounded = Math.round(price);
  return isOneTimePrice(tool) ? `${rounded}€` : `${rounded}€/${t("mois", "mo")}`;
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
