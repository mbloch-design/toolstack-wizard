/**
 * Titles and meta descriptions of tool pages (fiche, pricing, alternatives,
 * reviews), shared by the prerender (vite.config.ts) and ToolDetailPage.
 *
 * The two used to carry their own templates. They had drifted apart, so on
 * part of the pages the tab title and the description changed after
 * hydration, and Google, which renders JavaScript, saw two versions.
 *
 * `tool.seo.<prefix>Title{Fr,En}` and `<prefix>MetaDescription{Fr,En}` still
 * override any template (prefix: presentation, prix, alt, avis).
 */
import { fitBrandedTitle } from "./seoTitle";
import { formatToolPrice, nativePriceFromTool } from "./currencyRates";
import { hasGenuineFreeTier, resolveMonthlyPrice } from "./pricing";
import { localizePlanName } from "./planNames";

export type ToolSeoPage = "presentation" | "prix" | "alternatives" | "avis";

// Loose on purpose: the prerender passes raw catalogue records.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SeoTool = any;

export function toolPriceFacts(tool: SeoTool) {
  const price = nativePriceFromTool(tool)?.amount ?? resolveMonthlyPrice(tool);
  const hasPrice = price != null && price > 0;
  const free = hasGenuineFreeTier(tool.pricing?.free);
  // The wording of the paid offer alone is not enough: Motion Bro (free
  // plugin, one-off packs) or Capture One (subscription, perpetual option)
  // mention a licence without being sold that way first.
  const oneTime = tool.pricing_v5?.compare_plan_kind === "one_time"
    || (!hasPrice && !free && /licence|à vie|perp[ée]tuel|one-?time|perpetual|lifetime/i.test(String(tool.pricing?.paid || "")));
  return { price, hasPrice, oneTime, free };
}

/** Rounded from 10 up only: 1.99 shown as 2 would misstate a small price. */
function priceLabel(tool: SeoTool, price: number, lang: string, round = true): string {
  const options = { round: round && price >= 10 };
  return lang === "fr"
    ? formatToolPrice(tool, price, "EUR", "fr", options).text
    : formatToolPrice(tool, price, "USD", "en", options).text;
}

/** Closes a sentence without doubling an ellipsis ("exports…."). */
function closeSentence(text: string): string {
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}

/** "(Pro plan)", never "(Entry paid plan plan)". */
function planNote(plan: string | null, fr: boolean): string {
  // Catalogue placeholders ("Entry paid plan", "License") name no real plan.
  if (!plan || /^(entry paid plan|paid plan|license|licence)$/i.test(plan.trim())) return "";
  if (/\bplan$/i.test(plan) || /^plan\b/i.test(plan)) return ` (${plan})`;
  return fr ? ` (plan ${plan})` : ` (${plan} plan)`;
}

/**
 * The first sentence of `text`, kept whole when it fits in `max` characters;
 * otherwise cut at the last clause boundary, never mid-clause. The old word
 * cut produced snippets such as "…for After Effects and Premiere Pro,
 * providing."
 */
export function clauseExcerpt(text: string, max: number): string {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const sentence = (clean.split(/(?<=[.!?])\s/)[0] || clean).replace(/[.!?…]+$/, "").trim();
  if (sentence.length <= max) return sentence;
  const window = sentence.slice(0, max);
  const boundary = Math.max(
    window.lastIndexOf(", "),
    window.lastIndexOf("; "),
    window.lastIndexOf(": "),
    window.lastIndexOf(" ("),
    window.lastIndexOf(" – "),
    window.lastIndexOf(" - "),
  );
  if (boundary >= max * 0.45) return sentence.slice(0, boundary).replace(/[\s,;:(–-]+$/, "").trim();
  return `${window.replace(/\s+\S*$/, "").replace(/[\s,;:(–-]+$/, "")}…`;
}

function localizedShort(tool: SeoTool, lang: string): string {
  return lang === "fr"
    ? (tool.shortDescription || "")
    : (tool.shortDescriptionEn || tool.shortDescription || "");
}

function override(tool: SeoTool, page: ToolSeoPage, field: "Title" | "MetaDescription", lang: string): string | undefined {
  const prefix = page === "alternatives" ? "alt" : page;
  const value = tool.seo?.[`${prefix}${field}${lang === "fr" ? "Fr" : "En"}`];
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function toolSeoTitle(tool: SeoTool, page: ToolSeoPage, lang: string, year: number): string {
  const custom = override(tool, page, "Title", lang);
  if (custom) return custom;
  const name = tool.name || tool.slug || tool.id;
  const fr = lang === "fr";
  const { price, hasPrice, oneTime, free } = toolPriceFacts(tool);

  if (page === "prix") {
    // Pricing queries ask a question ("nordpass cost", "is dependabot
    // free"): the title answers it instead of promising "plans".
    if (oneTime) {
      return fitBrandedTitle(fr ? `${name} prix ${year} : licence à vie, sans abonnement` : `${name} price ${year}: lifetime license, no subscription`);
    }
    if (hasPrice) {
      const from = priceLabel(tool, price, lang);
      return fitBrandedTitle(fr
        ? `${name} prix ${year} : dès ${from}/mois${free ? ", offre gratuite" : ""}`
        : `${name} pricing ${year}: from ${from}/mo${free ? ", free plan" : ""}`);
    }
    // French searches lead with "<outil> prix", English ones ask "is it free".
    if (free) return fitBrandedTitle(fr ? `${name} prix ${year} : est-il gratuit ?` : `Is ${name} free? Pricing ${year}`);
    return fitBrandedTitle(fr ? `${name} : prix et tarifs ${year}` : `${name} pricing & plans ${year}`);
  }
  if (page === "alternatives") {
    return fitBrandedTitle(fr ? `Meilleures alternatives à ${name} en ${year}` : `Best ${name} alternatives in ${year}`);
  }
  if (page === "avis") {
    return fitBrandedTitle(fr ? `Avis ${name} ${year} : note et retours` : `${name} reviews ${year}: rating and feedback`);
  }
  const tag = oneTime
    ? (fr ? "licence à vie" : "lifetime license")
    : hasPrice
      ? (fr ? `prix dès ${priceLabel(tool, price, lang)}` : `pricing from ${priceLabel(tool, price, lang)}`)
      : free ? (fr ? "gratuit" : "free") : (fr ? "prix" : "pricing");
  return fitBrandedTitle(fr ? `${name} : ${tag}, avis et alternatives ${year}` : `${name}: ${tag}, review & alternatives ${year}`);
}

/** The fiche snippet: what the tool is, the price signal, a hook. 160 chars max. */
function presentationDescription(tool: SeoTool, lang: string): string {
  const fr = lang === "fr";
  const long = fr ? (tool.longDescription || "") : (tool.longDescriptionEn || tool.longDescription || "");
  const { price, hasPrice, oneTime, free } = toolPriceFacts(tool);
  let base = localizedShort(tool, lang).replace(/\s+/g, " ").trim();
  // A very thin short description gives way to the first sentence of the long one.
  if (base.length < 45 && long) {
    const sentence = (String(long).split(/(?<=[.!?])\s/)[0] || "").trim();
    if (sentence.length > base.length) base = sentence;
  }
  const mentionsFree = /gratuit|free/i.test(base);
  const priceClause = fr
    ? (oneTime ? "Licence à vie, sans abonnement." : hasPrice ? `Prix dès ${priceLabel(tool, price, lang)}/mois.` : free && !mentionsFree ? "Version gratuite." : "")
    : (oneTime ? "Lifetime license with no subscription." : hasPrice ? `From ${priceLabel(tool, price, lang, false)}/mo.` : free && !mentionsFree ? "Free version." : "");
  const hook = fr ? "Avis ToolTrim et alternatives moins chères." : "ToolTrim review and cheaper alternatives.";
  const tail = [priceClause, hook].filter(Boolean).join(" ");
  const excerpt = clauseExcerpt(base, Math.max(40, 160 - tail.length - 2));
  return `${excerpt ? `${closeSentence(excerpt)} ` : ""}${tail}`.replace(/\s+/g, " ").trim();
}

export function toolSeoDescription(tool: SeoTool, page: ToolSeoPage, lang: string, year: number): string {
  const custom = override(tool, page, "MetaDescription", lang);
  if (custom) return custom;
  if (page === "presentation") return presentationDescription(tool, lang);

  const name = tool.name || tool.slug || tool.id;
  const fr = lang === "fr";
  const { price, hasPrice, oneTime, free } = toolPriceFacts(tool);
  const excerpt = clauseExcerpt(localizedShort(tool, lang), 90);
  // Its own sentence: lowercasing it to splice it in broke proper nouns.
  const what = excerpt ? ` ${closeSentence(excerpt)}` : "";
  const plan = planNote(localizePlanName(tool.pricing_v5?.compare_plan_name || null, fr ? "fr" : "en"), fr);

  if (page === "prix") {
    if (oneTime) {
      return fr
        ? `Combien coûte ${name} en ${year} ? Licence à vie, sans abonnement. Tarif, conditions et alternatives.`
        : `How much does ${name} cost in ${year}? Lifetime license, no subscription. Price, terms and alternatives.`;
    }
    if (hasPrice) {
      const from = priceLabel(tool, price, lang);
      return fr
        ? `Combien coûte ${name} en ${year} ? Dès ${from}/mois${plan}${free ? ", avec une offre gratuite" : ""}.${what} Détail des plans et alternatives moins chères.`
        : `How much does ${name} cost in ${year}? From ${from}/mo${plan}${free ? ", with a free plan" : ""}.${what} All plans and cheaper alternatives.`;
    }
    if (free) {
      return fr
        ? `${name} est-il gratuit en ${year} ?${what} Ce que couvre l'offre gratuite, les plans payants et les alternatives.`
        : `Is ${name} free in ${year}?${what} What the free plan covers, paid options and alternatives.`;
    }
    return fr
      ? `Prix de ${name} en ${year} : ce que l'éditeur publie, les plans et les alternatives aux tarifs connus.`
      : `${name} pricing in ${year}: what the vendor publishes, the plans and alternatives with known prices.`;
  }
  if (page === "alternatives") {
    if (hasPrice && !oneTime) {
      const from = priceLabel(tool, price, lang);
      return fr
        ? `Vous payez ${from}/mois pour ${name} ? Les meilleures alternatives moins chères ou gratuites, comparées par ToolTrim en ${year}.`
        : `Paying ${from}/mo for ${name}? The best cheaper or free alternatives, compared by ToolTrim for ${year}.`;
    }
    return fr
      ? `Quelles alternatives à ${name} en ${year} ? ToolTrim compare les options gratuites, freemium et payantes les plus adaptées.`
      : `What are the best ${name} alternatives in ${year}? ToolTrim compares the top free, freemium and paid options.`;
  }
  // avis
  return fr
    ? `${what.trim() ? `${what.trim()} ` : ""}Avis indépendant sur ${name} : points forts, points faibles, rapport qualité-prix et verdict ToolTrim ${year}.`
    : `${what.trim() ? `${what.trim()} ` : ""}Independent review of ${name}: pros, cons, value for money and ToolTrim verdict for ${year}.`;
}

/**
 * What a sub-page adds to the tool name in its H1, separator included:
 * "NordPass pricing" in English, "NordPass : prix" in French (the bare
 * "NordPass prix" reads as a keyword, not a title).
 */
export function toolPageHeadingSuffix(page: ToolSeoPage, lang: string): string {
  const fr = lang === "fr";
  const word = page === "prix" ? (fr ? "prix" : "pricing")
    : page === "alternatives" ? "alternatives"
    : page === "avis" ? (fr ? "avis" : "reviews")
    : "";
  if (!word) return "";
  return fr ? `\u00a0: ${word}` : ` ${word}`;
}
