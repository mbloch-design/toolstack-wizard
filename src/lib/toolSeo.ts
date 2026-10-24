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
import { hasConfirmedFreeTier, resolveMonthlyPrice } from "./pricing";
import { localizePlanName } from "./planNames";
import { computeToolTrimScore } from "./toolTrimScore";

const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** A price check older than this is not advertised in a snippet. */
const VERIFIED_MAX_DAYS = 120;

/** « octobre 2026 » / « October 2026 », or null when the check is missing or stale. */
export function verifiedMonth(tool: SeoTool, lang: string, now = Date.now()): string | null {
  const iso = String(tool?.pricing_v5?.verified_on || "").slice(0, 10);
  const date = new Date(`${iso}T00:00:00Z`);
  if (!iso || Number.isNaN(date.getTime()) || (now - date.getTime()) / 86_400_000 > VERIFIED_MAX_DAYS) return null;
  return `${(lang === "fr" ? MONTHS_FR : MONTHS_EN)[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** The score shown on the fiche, « 3,6/5 » / « 3.6/5 ». */
export function ratingLabel(tool: SeoTool, lang: string): string {
  const score = computeToolTrimScore(tool).score.toFixed(1);
  return `${lang === "fr" ? score.replace(".", ",") : score}/5`;
}

export type ToolSeoPage = "presentation" | "prix" | "alternatives" | "avis";

// Loose on purpose: the prerender passes raw catalogue records.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SeoTool = any;

export function toolPriceFacts(tool: SeoTool) {
  const price = nativePriceFromTool(tool)?.amount ?? resolveMonthlyPrice(tool);
  const hasPrice = price != null && price > 0;
  // Only a free tier ToolTrim can stand behind: bulk placeholders such as
  // « Gratuit ou plan gratuit disponible » made Logic Pro ($199.99) « free ».
  const free = hasConfirmedFreeTier(tool);
  // The wording of the paid offer alone is not enough: Motion Bro (free
  // plugin, one-off packs) or Capture One (subscription, perpetual option)
  // mention a licence without being sold that way first. The compare plan's
  // own unit is: TouchDesigner's « Commercial » plan is a $600 one-time
  // licence filed under an "account" kind, and was titled « from $600/mo ».
  const comparePlan = [...(tool.pricing_v5?.plans || []), ...(tool.pricing_v5En?.plans || [])]
    .find((plan: SeoTool) => plan?.isComparePlan && !plan?.isFree);
  const oneTime = tool.pricing_v5?.compare_plan_kind === "one_time"
    || comparePlan?.pricingUnit === "one_time"
    || (!tool.pricing_v5?.compare_plan_kind && !hasPrice && !free && /licence à vie|licence perp[ée]tuelle|one-?time|perpetual license|lifetime license/i.test(String(tool.pricing?.paid || "")));
  return { price, hasPrice, oneTime, free };
}

/**
 * The exact published amount. Rounding (« $20 » for Photoshop's $19.99,
 * « €21 » for Capture One's €20.50) made the title disagree with the page
 * and with every competing result quoting the real price.
 */
export function priceLabel(tool: SeoTool, price: number, lang: string): string {
  const options = { round: false };
  return lang === "fr"
    ? formatToolPrice(tool, price, "EUR", "fr", options).text
    : formatToolPrice(tool, price, "USD", "en", options).text;
}

/** Closes a sentence without doubling an ellipsis ("exports…."). */
function closeSentence(text: string): string {
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}

/** "(Pro plan)", never "(Entry paid plan plan)" nor "(Premiere Pro (single app) plan)". */
function planNote(rawPlan: string | null, fr: boolean): string {
  // Catalogue placeholders ("Entry paid plan", "License") name no real plan.
  if (!rawPlan || /^(entry paid plan|paid plan|license|licence)$/i.test(rawPlan.trim())) return "";
  const plan = rawPlan.replace(/\s*\(([^)]*)\)/g, ", $1").trim();
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

/**
 * Written titles and descriptions may carry {price}, {verified}, {rating}
 * and {year}. The price is
 * filled from the verified grid, {verified} from the date of that check
 * (skipped past 120 days) and {rating} from the score the fiche shows, at
 * render time: a written snippet never contradicts the page. Without a value
 * to fill, the written text is skipped and the template answers instead.
 */
function override(tool: SeoTool, page: ToolSeoPage, field: "Title" | "MetaDescription", lang: string, year?: number): string | undefined {
  const prefix = page === "alternatives" ? "alt" : page;
  const value = tool.seo?.[`${prefix}${field}${lang === "fr" ? "Fr" : "En"}`];
  if (typeof value !== "string" || !value.trim()) return undefined;
  let text = value;
  if (text.includes("{price}")) {
    const { price, hasPrice } = toolPriceFacts(tool);
    if (!hasPrice) return undefined;
    text = text.split("{price}").join(priceLabel(tool, price, lang));
  }
  if (text.includes("{verified}")) {
    const month = verifiedMonth(tool, lang);
    if (!month) return undefined;
    text = text.split("{verified}").join(month);
  }
  if (text.includes("{rating}")) text = text.split("{rating}").join(ratingLabel(tool, lang));
  if (text.includes("{year}")) text = text.split("{year}").join(String(year ?? new Date().getFullYear()));
  return text;
}

export function toolSeoTitle(tool: SeoTool, page: ToolSeoPage, lang: string, year: number): string {
  const custom = override(tool, page, "Title", lang, year);
  // Written titles carry no brand; it is added when it fits, as for templates.
  if (custom) return /\|\s*ToolTrim\s*$/.test(custom) ? custom : fitBrandedTitle(custom);
  const name = tool.name || tool.slug || tool.id;
  const fr = lang === "fr";
  const { price, hasPrice, oneTime, free } = toolPriceFacts(tool);
  const access = tool.pricing_v5?.compare_plan_kind;
  const suite = tool.pricing_v5?.compare_plan_name || "la suite";
  if (page === "prix" && access === "included") return fitBrandedTitle(fr ? `${name} prix ${year} : inclus dans ${suite}` : `${name} pricing ${year}: included in ${suite}`);
  if (page === "prix" && access === "discontinued") return fitBrandedTitle(fr ? `${name} prix ${year} : produit arrêté` : `${name} pricing ${year}: discontinued`);
  if (page === "prix" && access === "beta") return fitBrandedTitle(fr ? `${name} prix ${year} : bêta` : `${name} pricing ${year}: beta`);
  if (page === "presentation" && access === "included") return fitBrandedTitle(fr ? `${name} : inclus dans ${suite}, avis ${year}` : `${name}: included in ${suite}, review ${year}`);
  if (page === "presentation" && access === "discontinued") return fitBrandedTitle(fr ? `${name} : produit arrêté, alternatives ${year}` : `${name}: discontinued, alternatives ${year}`);
  if (page === "presentation" && access === "beta") return fitBrandedTitle(fr ? `${name} : bêta, disponibilité et avis ${year}` : `${name}: beta, availability and review ${year}`);

  if (page === "prix") {
    // Pricing queries ask a question ("nordpass cost", "is dependabot
    // free"): the title answers it instead of promising "plans".
    if (oneTime) {
      if (hasPrice) {
        const once = priceLabel(tool, price, lang);
        return fitBrandedTitle(fr ? `${name} prix ${year} : ${once} en achat unique` : `${name} price ${year}: ${once} one-time license`);
      }
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
    ? (hasPrice
      ? (fr ? `${priceLabel(tool, price, lang)} en achat unique` : `${priceLabel(tool, price, lang)} one-time`)
      : (fr ? "licence à vie" : "lifetime license"))
    : hasPrice
      ? (fr ? `prix dès ${priceLabel(tool, price, lang)}` : `pricing from ${priceLabel(tool, price, lang)}`)
      : free ? (fr ? "gratuit" : "free") : (fr ? "prix" : "pricing");
  return fitBrandedTitle(fr ? `${name} : ${tag}, avis et alternatives ${year}` : `${name}: ${tag}, review & alternatives ${year}`);
}

/** The fiche snippet: what the tool is, the price signal, a hook. 155 chars max. */
function presentationDescription(tool: SeoTool, lang: string): string {
  const fr = lang === "fr";
  const long = fr ? (tool.longDescription || "") : (tool.longDescriptionEn || tool.longDescription || "");
  const { price, hasPrice, oneTime, free } = toolPriceFacts(tool);
  const access = tool.pricing_v5?.compare_plan_kind;
  const suite = tool.pricing_v5?.compare_plan_name || (fr ? "la suite" : "the suite");
  let base = localizedShort(tool, lang).replace(/\s+/g, " ").trim();
  // A very thin short description gives way to the first sentence of the long one.
  if (base.length < 45 && long) {
    const sentence = (String(long).split(/(?<=[.!?])\s/)[0] || "").trim();
    if (sentence.length > base.length) base = sentence;
  }
  const mentionsFree = /gratuit|free/i.test(base);
  const priceClause = fr
    ? (access === "included" ? `Inclus dans ${suite}, sans tarif autonome.` : access === "discontinued" ? "Produit arrêté." : access === "beta" ? "Disponible en bêta." : oneTime ? (hasPrice ? `${priceLabel(tool, price, lang)} en achat unique, sans abonnement.` : "Licence à vie, sans abonnement.") : hasPrice ? `Prix dès ${priceLabel(tool, price, lang)}/mois.` : free && !mentionsFree ? "Version gratuite." : "")
    : (access === "included" ? `Included in ${suite}, no standalone price.` : access === "discontinued" ? "Discontinued product." : access === "beta" ? "Available in beta." : oneTime ? (hasPrice ? `${priceLabel(tool, price, lang)} one-time, no subscription.` : "Lifetime license with no subscription.") : hasPrice ? `From ${priceLabel(tool, price, lang)}/mo.` : free && !mentionsFree ? "Free version." : "");
  const hook = access === "included" || access === "discontinued" || access === "beta"
    ? (fr ? "Avis ToolTrim et options à comparer." : "ToolTrim review and options to compare.")
    : (fr ? "Avis ToolTrim et alternatives moins chères." : "ToolTrim review and cheaper alternatives.");
  const tail = [priceClause, hook].filter(Boolean).join(" ");
  const excerpt = clauseExcerpt(base, Math.max(40, DESCRIPTION_MAX_CHARS - tail.length - 2));
  return `${excerpt ? `${closeSentence(excerpt)} ` : ""}${tail}`.replace(/\s+/g, " ").trim();
}

/** Google cuts snippets around 155 characters. */
export const DESCRIPTION_MAX_CHARS = 155;

/**
 * The first variant that fits, from the richest to the barest. 3,191 pricing
 * and review descriptions ran past 160 characters, cut mid-sentence in results.
 */
function firstFitting(variants: string[]): string {
  const clean = variants.map((v) => v.replace(/\s+/g, " ").trim()).filter(Boolean);
  const fit = clean.find((v) => v.length <= DESCRIPTION_MAX_CHARS);
  if (fit) return fit;
  const last = clean[clean.length - 1] || "";
  return `${last.slice(0, DESCRIPTION_MAX_CHARS - 1).replace(/\s+\S*$/, "").replace(/[\s,;:(–-]+$/, "")}…`;
}

export function toolSeoDescription(tool: SeoTool, page: ToolSeoPage, lang: string, year: number): string {
  const custom = override(tool, page, "MetaDescription", lang, year);
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
    const access = tool.pricing_v5?.compare_plan_kind;
    if (access === "included") return fr ? `${name} est inclus dans ${tool.pricing_v5?.compare_plan_name || "une suite"}. Aucun tarif individuel confirmé. Vérifiez la licence et la compatibilité.` : `${name} is included in ${tool.pricing_v5?.compare_plan_name || "a suite"}. No confirmed standalone price. Check licensing and compatibility.`;
    if (access === "discontinued") return fr ? `${name} est arrêté. Aucune nouvelle licence vendue. Découvrez les alternatives disponibles.` : `${name} is discontinued. No new licenses are sold. Explore available alternatives.`;
    if (access === "beta") return fr ? `${name} est en bêta. Vérifiez la disponibilité et les conditions d'accès auprès de l'éditeur.` : `${name} is in beta. Check availability and access terms with the vendor.`;
    if (oneTime) {
      const once = hasPrice ? priceLabel(tool, price, lang) : "";
      return fr
        ? `Combien coûte ${name} en ${year} ? ${once ? `${once} en achat unique` : "Licence à vie"}, sans abonnement. Tarif, conditions et alternatives.`
        : `How much does ${name} cost in ${year}? ${once ? `${once} one-time` : "Lifetime license"}, no subscription. Price, terms and alternatives.`;
    }
    if (hasPrice) {
      const from = priceLabel(tool, price, lang);
      const variant = (withWhat: boolean, withPlan: boolean) => fr
        ? `Combien coûte ${name} en ${year} ? Dès ${from}/mois${withPlan ? plan : ""}${free ? ", avec une offre gratuite" : ""}.${withWhat ? what : ""} Détail des plans et alternatives moins chères.`
        : `How much does ${name} cost in ${year}? From ${from}/mo${withPlan ? plan : ""}${free ? ", with a free plan" : ""}.${withWhat ? what : ""} All plans and cheaper alternatives.`;
      return firstFitting([variant(true, true), variant(false, true), variant(false, false)]);
    }
    if (free) {
      const variant = (withWhat: boolean) => fr
        ? `${name} est-il gratuit en ${year} ?${withWhat ? what : ""} Ce que couvre l'offre gratuite, les plans payants et les alternatives.`
        : `Is ${name} free in ${year}?${withWhat ? what : ""} What the free plan covers, paid options and alternatives.`;
      return firstFitting([variant(true), variant(false)]);
    }
    return fr
      ? `Prix de ${name} en ${year} : ce que l'éditeur publie, les plans et les alternatives aux tarifs connus.`
      : `${name} pricing in ${year}: what the vendor publishes, the plans and alternatives with known prices.`;
  }
  if (page === "alternatives") {
    if (hasPrice && !oneTime) {
      const from = priceLabel(tool, price, lang);
      return firstFitting([fr
        ? `Vous payez ${from}/mois pour ${name} ? Les meilleures alternatives moins chères ou gratuites, comparées par ToolTrim en ${year}.`
        : `Paying ${from}/mo for ${name}? The best cheaper or free alternatives, compared by ToolTrim for ${year}.`]);
    }
    return firstFitting([fr
      ? `Quelles alternatives à ${name} en ${year} ? ToolTrim compare les options gratuites, freemium et payantes les plus adaptées.`
      : `What are the best ${name} alternatives in ${year}? ToolTrim compares the top free, freemium and paid options.`]);
  }
  // avis
  const review = fr
    ? `Avis indépendant sur ${name} : points forts, points faibles, rapport qualité-prix et verdict ToolTrim ${year}.`
    : `Independent review of ${name}: pros, cons, value for money and ToolTrim verdict for ${year}.`;
  return firstFitting([`${what.trim()} ${review}`, review]);
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
