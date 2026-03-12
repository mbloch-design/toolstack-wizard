/**
 * SEO utility: set meta tags, canonical, and JSON-LD dynamically.
 */

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

export function setCanonical(url: string) {
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = url;
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

export function cleanupSeo(ids: string[]) {
  ids.forEach((id) => document.getElementById(id)?.remove());
  document.querySelector('link[rel="canonical"]')?.remove();
}

export function setSeoTags({
  title,
  description,
  url,
  type = "website",
}: {
  title: string;
  description: string;
  url: string;
  type?: string;
}) {
  document.title = title;
  setMeta("description", description);
  setMeta("og:title", title);
  setMeta("og:description", description);
  setMeta("og:type", type);
  setMeta("og:url", url);
  setMeta("twitter:title", title);
  setMeta("twitter:description", description);
  setCanonical(url);
}
