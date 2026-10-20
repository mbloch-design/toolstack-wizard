/**
 * What the /pricing (/prix) sub-page adds to the fiche: a one-sentence answer,
 * a per-seat cost example and a pricing FAQ, all derived from the verified
 * plan grid (`pricing_v5`) and nothing else.
 *
 * Why: the sub-page only repeated the fiche's pricing block (87 to 98 % of
 * its text was already on the fiche), so Google ranked the fiche for « X
 * pricing » queries and the sub-page earned nothing (GSC, 18/07-17/10/2026).
 * Pilot on PRICING_DETAIL_PILOT first, measured before any wider rollout.
 *
 * Shared by ToolPricingDetail (page) and the prerender (FAQPage JSON-LD), so
 * relative imports only: vite.config.ts cannot resolve the `@/` alias.
 */
import { formatAmount, isCurrency, type Currency } from "./currencyRates";

/** Pricing URLs with impressions on price queries (GSC, 18/07-17/10/2026). */
export const PRICING_DETAIL_PILOT = new Set([
  "nordpass", "jest", "safetyculture", "gitlens", "zbrush", "capture-one",
  "touchdesigner", "material-ui", "magnific-ai", "mongodb-atlas", "hotjar",
  "dependabot", "enscape", "adobe-photoshop", "adobe-premiere-pro",
  "adobe-lightroom", "logic-pro", "clerk", "cinema-4d", "maxon-one",
]);

export const SEAT_EXAMPLES = [1, 3, 5, 10];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Plan = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DetailTool = any;

export interface PricingDetail {
  answer: string;
  seatCosts: { seats: number; monthly: string; yearly: string | null }[];
  seatPlanName: string | null;
  faq: { q: string; a: string }[];
}

function writtenDate(iso: string | null | undefined, lang: string): string {
  if (!iso) return "";
  const date = new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? String(iso)
    : new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

/** The grid in the page's language, then every plan, the compare plan for that currency first. */
function plansFor(tool: DetailTool, lang: string): { plans: Plan[]; compare: Plan | null } {
  const grid = lang === "en" && tool?.pricing_v5En?.plans?.length ? tool.pricing_v5En : tool?.pricing_v5;
  const plans: Plan[] = (grid?.plans || []).filter((plan: Plan) => plan && isCurrency(plan.nativeCurrency) && plan.nativeAmount != null);
  const preferred: Currency = lang === "en" ? "USD" : "EUR";
  const candidates = plans.filter((plan) => plan.isComparePlan && !plan.isFree);
  const compare = candidates.find((plan) => plan.nativeCurrency === preferred) || candidates[0] || null;
  return { plans, compare };
}

/** « Logic Pro (Mac) » inside « (offre …) » read as nested parentheses. */
function flatName(name: unknown): string {
  return String(name || "").replace(/\s*\(([^)]*)\)/g, ", $1").trim();
}

function billing(plan: Plan, fr: boolean): string {
  if (plan.pricingUnit === "one_time") return fr ? " en achat unique" : " as a one-time purchase";
  const unit = plan.pricingUnit === "seat" ? (fr ? " par utilisateur" : " per user") : "";
  const commitment = plan.billingCommitment === "annual_prepaid"
    ? (fr ? ", facturé à l'année" : ", billed yearly")
    : plan.billingCommitment === "monthly" ? (fr ? ", sans engagement" : ", billed monthly") : "";
  const period = plan.billingPeriod === "annual" ? (fr ? " par an" : " per year") : (fr ? " par mois" : " per month");
  return `${unit}${period}${commitment}`;
}

/** Null when the tool has no verified grid: the sub-page then stays as it was. */
export function buildPricingDetail(tool: DetailTool, lang: string): PricingDetail | null {
  const fr = lang === "fr";
  const { plans, compare } = plansFor(tool, lang);
  if (!compare) return null;
  const name = tool.name || tool.slug;
  const money = (amount: number, currency: Currency) => formatAmount(amount, currency, fr ? "fr" : "en");
  const free = plans.find((plan) => plan.isFree);
  const freeLine = free
    ? (fr ? ` Une offre gratuite existe (${flatName(free.displayName)}).` : ` A free plan exists (${flatName(free.displayName)}).`)
    : (fr ? " Pas d'offre gratuite permanente dans la grille publiée." : " No permanent free plan in the published grid.");
  const verified = tool.pricing_v5?.verified_on;
  const verifiedLine = verified ? (fr ? ` Prix vérifié le ${writtenDate(verified, lang)}.` : ` Price verified on ${writtenDate(verified, lang)}.`) : "";
  const price = money(Number(compare.nativeAmount), compare.nativeCurrency);
  const planName = flatName(compare.displayName);
  const answer = fr
    ? `${name} coûte ${price}${billing(compare, true)} (offre ${planName}).${freeLine}${verifiedLine}`
    : `${name} costs ${price}${billing(compare, false)} (${/\bplan$/i.test(planName) ? planName : `${planName} plan`}).${freeLine}${verifiedLine}`;

  // Per-seat example: a multiplication of the published price, never a quote.
  const perSeat = compare.pricingUnit === "seat" && compare.billingPeriod !== "annual";
  const seatCosts = perSeat
    ? SEAT_EXAMPLES.map((seats) => {
      const monthly = Number(compare.nativeAmount) * seats;
      return {
        seats,
        monthly: money(Math.round(monthly * 100) / 100, compare.nativeCurrency),
        yearly: compare.billingCommitment === "annual_prepaid" ? money(Math.round(monthly * 12 * 100) / 100, compare.nativeCurrency) : null,
      };
    })
    : [];

  const paid = plans.filter((plan) => !plan.isFree && plan.nativeCurrency === compare.nativeCurrency);
  const faq: { q: string; a: string }[] = [
    { q: fr ? `Combien coûte ${name} ?` : `How much does ${name} cost?`, a: answer.replace(verifiedLine, "").replace(freeLine, "").trim() },
    {
      q: fr ? `${name} a-t-il une offre gratuite ?` : `Does ${name} have a free plan?`,
      a: free
        ? (fr ? `Oui : ${free.displayName}.${free.featureHighlights?.[0] ? ` ${free.featureHighlights[0]}` : ""}` : `Yes: ${free.displayName}.`)
        : (fr ? `Non, la grille publiée par l'éditeur ne comporte pas d'offre gratuite permanente.` : `No, the vendor's published grid has no permanent free plan.`),
    },
  ];
  if (paid.length > 1) {
    faq.push({
      q: fr ? `Quelles sont les offres payantes de ${name} ?` : `What are ${name}'s paid plans?`,
      a: paid.map((plan) => `${plan.displayName} : ${money(Number(plan.nativeAmount), plan.nativeCurrency)}${billing(plan, fr)}`).join(" ; ") + ".",
    });
  }
  if (compare.pricingUnit === "seat") {
    faq.push({
      q: fr ? `${name} est-il facturé par utilisateur ?` : `Is ${name} billed per user?`,
      a: fr
        ? `Oui, l'offre ${planName} est facturée par utilisateur${seatCosts[2] ? ` : ${seatCosts[2].monthly} par mois pour 5 utilisateurs` : ""}.`
        : `Yes, the ${planName} plan is billed per user${seatCosts[2] ? `: ${seatCosts[2].monthly} per month for 5 users` : ""}.`,
    });
  }
  if (verified && tool.pricing_v5?.official_source_url) {
    faq.push({
      q: fr ? `D'où viennent ces prix ?` : `Where do these prices come from?`,
      a: fr
        ? `De la page tarifaire officielle (${tool.pricing_v5.source_domain || tool.pricing_v5.official_source_url}), relevée le ${writtenDate(verified, lang)}, sans conversion de devise.`
        : `From the official pricing page (${tool.pricing_v5.source_domain || tool.pricing_v5.official_source_url}), checked on ${writtenDate(verified, lang)}, with no currency conversion.`,
    });
  }
  return { answer, seatCosts, seatPlanName: perSeat ? compare.displayName : null, faq };
}

export function isPricingDetailPilot(tool: DetailTool): boolean {
  return PRICING_DETAIL_PILOT.has(tool?.slug || tool?.id);
}
