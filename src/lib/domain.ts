/** A site's bare host name (no www.), from a URL with or without its scheme. Dependency-free, so build scripts can use it. */
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
