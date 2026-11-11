import { nativePriceFromTool } from "./currencyRates";
import { hasConfirmedFreeTier, isPriceUndisclosed, resolveMonthlyPrice } from "./pricing";
import { buildToolFaqs } from "./toolFaq";
import { computeToolTrimScore } from "./toolTrimScore";
import { toolSeoDescription, toolSeoTitle, type ToolSeoPage } from "./toolSeo";

/**
 * Balisage des fiches outils, construit une seule fois pour le prérendu
 * (`vite.config.ts`) et pour le client (`ToolJsonLd`).
 *
 * Pourquoi : les deux côtés écrivaient dans les **mêmes** blocs (`setJsonLd`
 * écrase par id), avec deux constructeurs différents. Le prérendu posait une
 * `FAQPage` de 4 questions quand la FAQ visible en compte 5 ou 6, disait
 * « Prix vérifié par ToolTrim » là où la page affiche une date, et le client
 * supprimait ensuite `Review.name` et `offers.url`. Le HTML lu par Google
 * décrivait donc une FAQ qui n'était pas celle de la page — ce que la règle
 * FAQPage de Google interdit. Un seul constructeur supprime la cause.
 *
 * Les entrées aussi sont partagées : `toolProductUrl`, `toolDisplayPrice` et
 * `toolOfferPrice` évitent que les deux côtés résolvent un prix ou une URL
 * différemment, ce qui reproduirait la divergence par les données.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Map a ToolTrim category to the closest schema.org applicationCategory. */
const APP_CATEGORY_BY_TOOL_CATEGORY: Record<string, string> = {
  "design-tools": "DesignApplication", design: "DesignApplication", illustration: "DesignApplication",
  prototyping: "DesignApplication", "ui-components": "DeveloperApplication",
  photo: "MultimediaApplication", video: "MultimediaApplication", "3d": "MultimediaApplication",
  creation: "MultimediaApplication", publishing: "MultimediaApplication",
  "nocode-web": "DeveloperApplication", automation: "DeveloperApplication",
  security: "SecurityApplication", "vendor-risk-data": "SecurityApplication",
  finance: "FinanceApplication", "budgeting-fpa": "FinanceApplication", erp: "FinanceApplication",
  communication: "CommunicationApplication", "communication-team": "CommunicationApplication",
  "email-productivity": "CommunicationApplication",
  "formation-education": "EducationalApplication",
  storage: "UtilitiesApplication",
};

export function appCategoryFor(tool: any): string {
  return APP_CATEGORY_BY_TOOL_CATEGORY[tool?.category] || "BusinessApplication";
}

export function operatingSystemFor(tool: any): string | undefined {
  const host = String(tool?.host_app || "").toLowerCase();
  if (host === "macos") return "macOS";
  if (host) return undefined;
  return "Web";
}

/**
 * URL officielle de l'outil, telle que les deux côtés la déclarent.
 * L'ancien client ne regardait que `websiteUrl` : sur une fiche dont le seul
 * lien est affilié, il publiait un `offers.url` vide là où le prérendu mettait
 * le lien. Une seule règle ici.
 */
export function toolProductUrl(tool: any): string {
  return tool?.websiteUrl || tool?.affiliateLink || tool?.website_url || tool?.affiliate_link || "";
}

/** Prix affiché par la fiche — même expression des deux côtés. */
export function toolDisplayPrice(tool: any, lang: string): number {
  const currency = lang === "en" ? "USD" : "EUR";
  return resolveMonthlyPrice(tool) || nativePriceFromTool(tool, currency)?.amount || 0;
}

/** Prix publié par l'éditeur, sinon chiffre du catalogue — même règle des deux côtés. */
export function toolOfferPrice(tool: any, lang: string): number | null {
  const currency = lang === "en" ? "USD" : "EUR";
  const native = nativePriceFromTool(tool, currency);
  if (native) return native.amount;
  const catalogue = resolveMonthlyPrice(tool);
  return Number.isFinite(catalogue) ? catalogue : null;
}

/**
 * Alternatives de la fiche : curatées d'abord, puis recouvrement de couverture.
 * La dernière question de la FAQ cite leurs noms, donc la page et le prérendu
 * doivent résoudre exactement la même liste.
 */
export function resolveToolAlternatives(tool: any, tools: any[], limit = 6): any[] {
  const sameCategory = tools.filter((tt) => tt.categoryId === tool?.categoryId && tt.id !== tool?.id);
  const covers = new Set(tool?.covers || []);
  const coverOverlap = covers.size
    ? sameCategory
        .filter((tt) => (tt.covers || []).some((c: string) => covers.has(c)))
        .sort((a: any, b: any) =>
          (b.covers || []).filter((c: string) => covers.has(c)).length -
          (a.covers || []).filter((c: string) => covers.has(c)).length)
    : [];
  const curated = ((tool?.alternatives || []) as string[])
    .map((slug) => tools.find((tt) => tt.id === slug || tt.slug === slug))
    .filter(Boolean);
  const seen = new Set<string>();
  const resolved: any[] = [];
  for (const list of [curated, coverOverlap]) {
    for (const candidate of list) {
      if (resolved.length >= limit || seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      resolved.push(candidate);
    }
  }
  return resolved;
}

/** Free plan ToolTrim can confirm — never a bulk placeholder. */
function toolHasFreePlan(tool: any): boolean {
  const pricing = tool?.pricing;
  return !!(pricing && typeof pricing === "object" && hasConfirmedFreeTier(tool));
}

/**
 * schema.org Offer/AggregateOffer for a tool.
 *  - freemium (free plan + a paid tier): AggregateOffer 0 → paid, so the
 *    schema doesn't claim a paid-only price on a page that shows "Gratuit".
 *  - paid only: single Offer at that price.
 *  - free only: single Offer at 0.
 */
function buildToolOffers(price: number | null, hasFree: boolean, currency: string, url: string) {
  const urlPart = url ? { url } : {};
  const paid = price != null && price > 0 ? price : 0;
  if (hasFree && paid > 0) {
    return { "@type": "AggregateOffer", lowPrice: "0", highPrice: String(paid), priceCurrency: currency, offerCount: "2", ...urlPart };
  }
  return { "@type": "Offer", price: String(paid), priceCurrency: currency, ...urlPart };
}

export function buildToolOffersFor(tool: any, price: number | null, url: string, currency: "EUR" | "USD") {
  const hasFree = toolHasFreePlan(tool);
  // Une fiche arrêtée, incluse dans une suite, en bêta ou d'accessibilité
  // inconnue ne publie pas de prix : annoncer une offre inventerait un tarif.
  if (["included", "beta", "discontinued", "unknown"].includes(tool?.pricing_v5?.compare_plan_kind || "")) return undefined;
  const native = nativePriceFromTool(tool, currency);
  if (native) return buildToolOffers(native.amount, hasFree, native.currency, url);
  if (!hasFree && isPriceUndisclosed(tool)) return undefined;
  if (price != null && price > 0) return buildToolOffers(price, hasFree, currency, url);
  return hasFree ? buildToolOffers(0, true, currency, url) : undefined;
}

/** positiveNotes / negativeNotes from the visible pros and cons (max 3 each). */
function reviewNotes(pros: unknown, cons: unknown) {
  const notes = (values: unknown) => (Array.isArray(values) ? values : [])
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean).slice(0, 3)
    .map((name, index) => ({ "@type": "ListItem", position: index + 1, name }));
  const positive = notes(pros);
  const negative = notes(cons);
  return {
    ...(positive.length ? { positiveNotes: { "@type": "ItemList", itemListElement: positive } } : {}),
    ...(negative.length ? { negativeNotes: { "@type": "ItemList", itemListElement: negative } } : {}),
  };
}

export const TOOL_SCHEMA_YEAR = new Date().getFullYear();

export function toolSeoPageForUrl(canonicalUrl: string): ToolSeoPage {
  if (canonicalUrl.endsWith("/prix") || canonicalUrl.endsWith("/pricing")) return "prix";
  if (canonicalUrl.endsWith("/alternatives")) return "alternatives";
  if (canonicalUrl.endsWith("/avis") || canonicalUrl.endsWith("/reviews")) return "avis";
  return "presentation";
}

/** `WebPage` de la fiche — nom et description pris au même titre que la page. */
export function toolWebPageSchema(params: {
  tool: any;
  lang: string;
  url: string;
  verifiedOn?: string | null;
  seoPage?: ToolSeoPage;
}): Record<string, unknown> {
  const { tool, lang, url, verifiedOn } = params;
  const seoPage = params.seoPage ?? toolSeoPageForUrl(url);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    // Sans @id, les noeuds voisins ne peuvent pas référencer cette page :
    // `mainEntityOfPage.@id` d'un Article tombait dans le vide.
    "@id": url,
    name: toolSeoTitle(tool, seoPage, lang, TOOL_SCHEMA_YEAR),
    description: toolSeoDescription(tool, seoPage, lang, TOOL_SCHEMA_YEAR),
    url,
    // Pas de dateModified sans vérification réelle.
    ...(verifiedOn ? { dateModified: verifiedOn } : {}),
    publisher: { "@type": "Organization", name: "ToolTrim", url: "https://tooltrim.com" },
  };
}

/** `SoftwareApplication` + `Review` éditorial de la fiche. */
export function toolSoftwareApplicationSchema(params: {
  tool: any;
  lang: string;
  canonicalUrl: string;
}): Record<string, unknown> {
  const { tool, lang, canonicalUrl } = params;
  const isFr = lang !== "en";
  const currency = isFr ? "EUR" : "USD";
  const name = tool.name || tool.slug || tool.id;
  const productUrl = toolProductUrl(tool);
  const verifiedOn = tool.pricing_v5?.verified_on || null;
  // La note est calculée : une fiche sans données de notation ne doit pas
  // faire échouer le build entier (l'ancien prérendu testait `score`).
  const score = computeToolTrimScore(tool);
  const hasScore = !!score && typeof score.score === "number" && Number.isFinite(score.score);
  const reviewBody =
    (isFr ? tool.verdict?.threshold : tool.verdictEn?.threshold) ||
    (isFr ? tool.longDescription : tool.longDescriptionEn) ||
    (isFr ? tool.shortDescription : tool.shortDescriptionEn) ||
    (isFr ? `${name} : avis ToolTrim.` : `${name} review by ToolTrim.`);
  const os = operatingSystemFor(tool);
  const offers = buildToolOffersFor(tool, toolOfferPrice(tool, lang), productUrl, currency);

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${canonicalUrl}#software`,
    name,
    ...(productUrl ? { url: productUrl } : {}),
    // `toolSeoDescription` est la description de la balise meta : c'est elle qui
    // doit être reprise par le schema, pas la description courte du hero, qui
    // disait autre chose au prérendu.
    description: toolSeoDescription(tool, "presentation", lang, TOOL_SCHEMA_YEAR),
    applicationCategory: appCategoryFor(tool),
    ...(os ? { operatingSystem: os } : {}),
    ...(offers ? { offers } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    ...(hasScore
      ? {
          review: {
            "@type": "Review",
            // Avis d'un média sur un outil tiers : cas autorisé par Google (la
            // restriction « self-serving » vise l'avis sur sa propre entité).
            author: { "@type": "Organization", name: "ToolTrim", url: "https://tooltrim.com" },
            name: isFr ? `Avis ToolTrim : ${score.labelFr}` : `ToolTrim review: ${score.labelEn}`,
            reviewRating: {
              "@type": "Rating",
              ratingValue: score.score.toFixed(1),
              bestRating: "5",
              worstRating: "1",
            },
            reviewBody: String(reviewBody),
            ...(verifiedOn ? { datePublished: verifiedOn, dateModified: verifiedOn } : {}),
            ...reviewNotes(isFr ? tool.pros : tool.prosEn, isFr ? tool.cons : tool.consEn),
          },
        }
      : {}),
  };
}

/**
 * `FAQPage` — construit à partir de `buildToolFaqs`, la même source que la FAQ
 * affichée. C'est tout l'enjeu : le balisage doit reprendre les questions
 * visibles, pas une liste plus courte écrite à part.
 */
export function toolFaqPageSchema(params: {
  tool: any;
  lang: string;
  displayPrice: number;
  verifiedOn: string | null;
  alternatives: any[];
}): Record<string, unknown> {
  const { tool, lang, displayPrice, verifiedOn, alternatives } = params;
  const entries = buildToolFaqs(tool, lang, displayPrice, verifiedOn, alternatives).map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  }));
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries,
  };
}
