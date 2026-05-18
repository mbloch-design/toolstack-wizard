/**
 * SEO utility: set meta tags, canonical, and JSON-LD dynamically.
 */

export const SEO_BASE = "https://tooltrim.com";
export const OG_IMAGE = "https://tooltrim.com/og-image.png";

const GUIDE_SLUG_ALTERNATES: Record<string, string> = {
  "loom-prix-alternatives": "loom-pricing-alternatives",
  "conseils-ia-freelances-2026": "ai-tips-freelancers-2026",
  "notion-gratuit-ou-payant": "notion-free-or-paid",
  "toggl-track-gratuit-ou-payant": "toggl-track-free-or-paid",
  "calendly-gratuit-suffisant": "calendly-free-enough",
  "chatgpt-plus-utile-ou-inutile": "chatgpt-plus-worth-it",
  "grammarly-gratuit-ou-payant": "grammarly-free-or-paid",
  "stripe-vs-virement": "stripe-vs-bank-transfer",
  "claude-vs-chatgpt-2026-lequel-choisir-business": "claude-vs-chatgpt-deepseek",
  "grammarly-vs-languagetool-comparaison": "grammarly-vs-languagetool-comparison-2026",
  "notion-vs-coda-comparatif-2026": "notion-vs-coda-comparison-2026",
  "chatgpt-vs-claude-comparatif-2026": "chatgpt-vs-claude-comparison-2026",
  "zapier-vs-make-comparatif-2026": "zapier-vs-make-comparison-2026",
  "figma-vs-canva-comparatif-2026": "figma-vs-canva-comparison-2026",
  "slack-vs-teams-comparatif-2026": "slack-vs-teams-comparison-2026",
  "stack-redactrice-freelance": "stack-freelance-writer",
};

const GUIDE_EN_TO_FR = Object.fromEntries(
  Object.entries(GUIDE_SLUG_ALTERNATES).map(([fr, en]) => [en, fr]),
) as Record<string, string>;

const GUIDE_FR_ONLY_SLUGS = new Set([
  "claude-sonnet-4-6-vs-chatgpt-vs-deepseek-vs-gemini-fevrier-2026",
  "meilleurs-outils-ia-freelances-2026",
  "claude-opus-4-6-guide-complet-freelances",
  "alternatives-gratuites-notion-freelance-2026",
  "stack-minimaliste-freelance-2026",
  "stripe-freelance-tarifs-alternatives",
  "perplexity-vs-chatgpt-recherche",
  "notion-gratuit-vs-payant-vrai-calcul",
]);

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

  const entries = getAlternateLinks(path, base);

  for (const [lang, href] of entries) {
    const link = document.createElement("link");
    link.rel = "alternate";
    link.hreflang = lang;
    link.href = href;
    document.head.appendChild(link);
  }
}

export function getAlternateLinks(path: string, base = SEO_BASE): [string, string][] {
  const cleanPath = path.replace(/^\/(fr|en)/, "");
  const guideMatch = cleanPath.match(/^\/guide\/([^/]+)$/);

  if (guideMatch) {
    const slug = guideMatch[1];
    const frSlug = GUIDE_EN_TO_FR[slug] || slug;
    const enSlug = GUIDE_SLUG_ALTERNATES[slug] || slug;
    const entries: [string, string][] = [
      ["fr", `${base}/fr/guide/${frSlug}`],
    ];
    if (!GUIDE_FR_ONLY_SLUGS.has(frSlug)) {
      entries.push(["en", `${base}/en/guide/${enSlug}`]);
    }
    entries.push(["x-default", `${base}/fr/guide/${frSlug}`]);
    return entries;
  }

  const frPath = cleanPath.replace(/\/pricing$/, "/prix").replace(/\/reviews$/, "/avis");
  const enPath = cleanPath.replace(/\/prix$/, "/pricing").replace(/\/avis$/, "/reviews");
  return [
    ["fr", `${base}/fr${frPath}`],
    ["en", `${base}/en${enPath}`],
    ["x-default", `${base}/fr${frPath}`],
  ];
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
