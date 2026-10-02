import { computeToolTrimScoreV2 } from "./toolTrimScore";
import { hasGenuineFreeTier } from "./pricing";
import { convertAmount, formatAmount, nativePriceFromTool, type Currency } from "./currencyRates";

/**
 * Classement des pages « meilleurs outils pour une intention »
 * (src/pages/BestOfGuidePage.tsx).
 *
 * Tout vient des données vérifiées de la fiche, rien n'est écrit à la main :
 * - l'ordre suit la note ToolTrim à cinq axes ; à égalité, la demande Google
 *   mesurée, puis le nom, pour que le prérendu et le client produisent le
 *   même ordre (les notes se tiennent souvent à 0,2 près) ;
 * - le prix affiché est celui que l'éditeur publie, dans sa devise, jamais
 *   une conversion (règle du 02/10/2026) ;
 * - les trois choix rapides se déduisent de ces deux données.
 *
 * Aucun emplacement sponsorisé n'entre ici : un partenaire n'influence ni
 * l'ordre ni les choix rapides.
 */

export type Lang = "fr" | "en";

export interface BestOfTool {
  id: string;
  slug: string;
  name: string;
  logo?: string | null;
  websiteUrl?: string | null;
  tagline?: { fr?: string; en?: string } | null;
  shortDescription?: string;
  shortDescriptionEn?: string;
  pricing?: { free?: string; paid?: string } | null;
  pricingEn?: { free?: string; paid?: string } | null;
  defaultMonthlyPrice?: number;
  pricing_v5?: any;
  pricing_v5En?: any;
  toolTrimRating?: any;
  verdict?: { keepIf?: string[]; avoidIf?: string[]; threshold?: string; billingTraps?: { title: string; text: string }[] } | null;
  verdictEn?: BestOfTool["verdict"];
  pros?: string[];
  prosEn?: string[];
  cons?: string[];
  consEn?: string[];
  researchedOn?: string | null;
  /** Impressions Google mesurées (tool_demand.json), pour départager deux notes égales. */
  demand?: number;
}

export type PriceKind = "free" | "one_time" | "recurring" | "usage" | "quote";

export interface RankedTool {
  rank: number;
  tool: BestOfTool;
  score: number | null;
  scoreLabel: string;
  hasFreePlan: boolean;
  /** Plan gratuit réservé à un usage non commercial : inutilisable pour un freelance qui facture. */
  freeNonCommercialOnly: boolean;
  priceKind: PriceKind;
  /** Montant publié, dans sa devise, ou null (gratuit, sur devis). */
  priceText: string | null;
  /** Prix normalisé en euros, pour comparer en interne seulement (jamais affiché). */
  sortPrice: number;
}

export interface QuickPicks {
  overall: RankedTool | null;
  free: RankedTool | null;
  budget: RankedTool | null;
}

const comparePlan = (tool: BestOfTool, lang: Lang) => {
  const records = lang === "en" ? [tool.pricing_v5En, tool.pricing_v5] : [tool.pricing_v5, tool.pricing_v5En];
  for (const record of records) {
    const plan = record?.plans?.find((p: any) => p.isComparePlan);
    if (plan) return plan;
  }
  return null;
};

export function priceOf(tool: BestOfTool, lang: Lang): { kind: PriceKind; text: string | null; sortEur: number } {
  const plan = comparePlan(tool, lang);
  const currency: Currency = lang === "en" ? "USD" : "EUR";
  // Un plan à l'usage sans prix d'entrée (Fly.io) n'a pas de montant à
  // afficher ; avec un prix plancher (Droplet à 4 $), il se compare comme
  // un abonnement.
  if (plan?.pricingUnit === "usage" && !(plan.nativeAmount > 0)) {
    const native = nativePriceFromTool(tool, currency);
    return { kind: "usage", text: native && native.amount > 0 ? formatAmount(native.amount, native.currency, lang) : null, sortEur: 0 };
  }
  if (!plan || plan.nativeAmount == null) {
    const paid = (lang === "en" ? tool.pricingEn?.paid : tool.pricing?.paid) || "";
    if (/devis|quote|non public|not public|promot/i.test(paid)) return { kind: "quote", text: null, sortEur: 0 };
    return { kind: "free", text: null, sortEur: 0 };
  }
  if (plan.isFree || plan.nativeAmount === 0) return { kind: "free", text: null, sortEur: 0 };
  // Le montant de la page : celui de la devise demandée s'il est publié,
  // sinon la seule devise de l'éditeur. Jamais recalculé.
  const native = nativePriceFromTool(tool, currency);
  const amount = native?.amount ?? plan.nativeAmount;
  const cur = (native?.currency ?? plan.nativeCurrency) as Currency;
  const kind: PriceKind = plan.billingPeriod == null ? "one_time" : "recurring";
  // Comparer deux licences publiées dans des devises différentes demande un
  // taux : il ne sert qu'au tri, jamais à l'affichage.
  const sortEur = kind === "one_time" ? convertAmount(amount, cur, "EUR") : Number(tool.defaultMonthlyPrice) || 0;
  return { kind, text: formatAmount(amount, cur, lang), sortEur };
}

export function rankTools(tools: BestOfTool[], lang: Lang): RankedTool[] {
  return tools
    .map((tool) => {
      const result = computeToolTrimScoreV2(tool.toolTrimRating);
      const price = priceOf(tool, lang);
      const freeText = lang === "en" ? tool.pricingEn?.free : tool.pricing?.free;
      const nonCommercial = /non[- ]?commerci/i.test(freeText || "") && price.kind !== "free";
      return {
        rank: 0,
        tool,
        score: result?.score ?? null,
        scoreLabel: result ? (lang === "en" ? result.labelEn : result.labelFr) : "",
        hasFreePlan: (hasGenuineFreeTier(freeText) && !nonCommercial) || price.kind === "free",
        freeNonCommercialOnly: nonCommercial,
        priceKind: price.kind,
        priceText: price.text,
        sortPrice: price.sortEur,
      };
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || (b.tool.demand ?? 0) - (a.tool.demand ?? 0) || a.tool.name.localeCompare(b.tool.name))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function quickPicks(rows: RankedTool[]): QuickPicks {
  const overall = rows[0] || null;
  // Meilleur gratuit : le mieux noté parmi ceux qui ont un vrai plan gratuit,
  // autre que le choix global quand c'est possible.
  const freeRows = rows.filter((r) => r.hasFreePlan);
  const free = freeRows.find((r) => r !== overall) || freeRows[0] || null;
  // Moins cher pour démarrer : seulement parmi des prix comparables entre eux.
  // Un abonnement mensuel et une licence à vie ne se comparent pas : on prend
  // la famille la plus représentée sur la page.
  const recurring = rows.filter((r) => r.priceKind === "recurring" && r.sortPrice > 0);
  const oneTime = rows.filter((r) => r.priceKind === "one_time" && r.sortPrice > 0);
  const pool = recurring.length >= oneTime.length ? recurring : oneTime;
  const cheapest = [...pool].sort((a, b) => a.sortPrice - b.sortPrice || a.tool.name.localeCompare(b.tool.name));
  // Trois choix distincts quand la page le permet : un outil déjà désigné ne
  // reprend une place que s'il n'y a pas d'autre candidat.
  const budget = pool.length >= 2 ? cheapest.find((r) => r !== overall && r !== free) || cheapest[0] : null;
  return { overall, free, budget };
}
