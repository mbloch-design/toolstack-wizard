/**
 * Shared tool utility functions — single source of truth.
 * Previously duplicated in ToolDetailPage, CategoryPage, GuidesPage, HomePage, HeroSection.
 */

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
