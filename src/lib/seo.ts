/**
 * SEO utility: set meta tags, canonical, and JSON-LD dynamically.
 */

export const SEO_BASE = "https://www.tooltrim.com";
export const OG_IMAGE = "https://www.tooltrim.com/og-image.png";

export function setMeta(nameOrProp: string, content: string) {
  const isOg = nameOrProp.startsWith("og:") || nameOrProp.startsWith("article:");
  const attr = isOg ? "property" : "name";
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${nameOrProp}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, nameOrProp);
    document.head.appendChild(el);
  }
  el.content = content;
}

/** @deprecated Canonical is now managed by react-helmet-async via DynamicCanonical */
export function setCanonical(_url: string) {
  // no-op: canonical is handled by <DynamicCanonical /> in App.tsx
}

export function setJsonLd(id: string, data: Record<string, unknown>) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    (el as HTMLScriptElement).type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function setHreflang(path: string, base = SEO_BASE) {
  // Remove existing hreflang links
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());

  const cleanPath = path.replace(/^\/(fr|en)/, "");
  const entries: [string, string][] = [
    ["fr", `${base}/fr${cleanPath}`],
    ["en", `${base}/en${cleanPath}`],
    ["x-default", `${base}/fr${cleanPath}`],
  ];

  for (const [lang, href] of entries) {
    const link = document.createElement("link");
    link.rel = "alternate";
    link.hreflang = lang;
    link.href = href;
    document.head.appendChild(link);
  }
}

export function setNoindex() {
  setMeta("robots", "noindex, follow");
}

export function removeNoindex() {
  const el = document.querySelector<HTMLMetaElement>('meta[name="robots"][content*="noindex"]');
  el?.remove();
}

export function cleanupSeo(ids: string[]) {
  ids.forEach((id) => document.getElementById(id)?.remove());
  // canonical is managed by react-helmet-async, no manual cleanup needed
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
  removeNoindex();
}

export function setSeoTags({
  title,
  description,
  url,
  type = "website",
  locale = "fr_FR",
}: {
  title: string;
  description: string;
  url: string;
  type?: string;
  locale?: string;
}) {
  document.title = title;
  setMeta("description", description);
  setMeta("og:title", title);
  setMeta("og:description", description);
  setMeta("og:type", type);
  setMeta("og:url", url);
  setMeta("og:image", OG_IMAGE);
  setMeta("og:locale", locale);
  setMeta("og:site_name", "ToolTrim");
  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", title);
  setMeta("twitter:description", description);
  setMeta("twitter:image", OG_IMAGE);
  setCanonical(url);
  // Remove any previous noindex
  removeNoindex();
}
