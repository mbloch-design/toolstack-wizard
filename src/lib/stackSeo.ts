/**
 * Title and meta description of a stack page, shared by the prerender
 * (vite.config.ts, under Node) and StackDetailPage, so the served HTML and the
 * hydrated tab never announce two different titles.
 *
 * The old pattern « Video editor stack: tools, use cases and budget » only
 * matched queries containing "stack", which almost nobody types (GSC, July to
 * October 2026: 350 impressions for 424 pages). The title now also carries
 * "best tools", the wording of the real intent, and the year.
 */
import type { StackGuide } from "../data/stacks";
import { usdFromEur } from "./currencyRates";
import { fitBrandedTitle } from "./seoTitle";

type StackSeoFields = Pick<StackGuide, "slug" | "title" | "titleEn" | "seoTitle" | "seoTitleEn" | "subtitle" | "subtitleEn" | "monthlyBudget">;

// Keeps acronyms intact: « IA rédaction » stays « IA », « Veille » becomes « veille ».
const lowerFirst = (value: string) =>
  /^\p{Lu}\p{Lu}/u.test(value) ? value : value.charAt(0).toLocaleLowerCase("fr") + value.slice(1);

export function stackSeoTitle(stack: StackSeoFields, lang: "fr" | "en", year: number = new Date().getFullYear()): string {
  if (lang === "fr") {
    if (stack.seoTitle) return fitBrandedTitle(stack.seoTitle);
    const name = /^stack\b/i.test(stack.title) ? stack.title : `Stack ${lowerFirst(stack.title)}`;
    return fitBrandedTitle(`${name} : meilleurs outils et budget ${year}`);
  }
  if (stack.seoTitleEn) return fitBrandedTitle(stack.seoTitleEn);
  const name = /\bstack\b/i.test(stack.titleEn) ? stack.titleEn : `${stack.titleEn} stack`;
  return fitBrandedTitle(`${name}: best tools and budget (${year})`);
}

// `subtitleEn` is generic boilerplate on the auto-generated stacks
// ("Recommended tools for this consulting profile."), so it is replaced by a
// sentence built from the title whenever it matches that pattern.
const GENERIC_SUBTITLE_EN = /^Recommended tools for this \w[\w-]* profile\.$/;

export function stackSeoDescription(stack: StackSeoFields, lang: "fr" | "en"): string {
  const budgetFr = `${stack.monthlyBudget}€/mois`;
  const budgetEn = `${usdFromEur(stack.monthlyBudget)}/month`;
  if (stack.slug === "developpeur-freelance-shipper") {
    return lang === "fr"
      ? `Stack dev freelance pour coder, partager une preview client, documenter et encaisser sans payer une stack produit trop lourde. Budget cible : ${budgetFr}.`
      : `Freelance dev stack to code, share a client preview, document, and get paid without paying for an overweight product stack. Target budget: ${budgetEn}.`;
  }
  if (stack.slug === "createur-sites-ia-automation") {
    return lang === "fr"
      ? `Stack sites IA & automation pour lancer une page, un prototype ou un workflow automatisé sans empiler les outils IA. Budget cible : ${budgetFr}.`
      : `AI sites and automation stack to launch a page, prototype, or automated workflow without stacking AI tools. Target budget: ${budgetEn}.`;
  }
  if (lang === "fr") return `${stack.subtitle} Budget cible : ${budgetFr}.`;
  return GENERIC_SUBTITLE_EN.test(stack.subtitleEn.trim())
    ? `${stack.titleEn}: the tools recommended for this profile, with a target budget of ${budgetEn}, organized by workflow, budget, risks and calibration.`
    : `${stack.subtitleEn} Target budget: ${budgetEn}.`;
}
