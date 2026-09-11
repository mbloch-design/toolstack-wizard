/**
 * Taux, conversion et formatage de devise, sans dépendance à React ni à Vite.
 *
 * Ce module existe pour que le prérendu (vite.config.ts, qui tourne sous Node
 * avant que l'application n'existe) et l'application partagent exactement le
 * même taux et le même formatage. Auparavant le taux vivait dans
 * useCurrency.tsx, inatteignable depuis la config Vite, et les chaînes SEO
 * anglaises se contentaient donc d'un « € » codé en dur.
 */

// Chemin relatif volontaire : vite.config.ts importe ce module sous Node pour
// le prerendu, et l'alias @/ n'est pas resolu dans ses propres imports.
import { NATIVE_PRICES } from "../data/nativePrices";

export type Currency = "EUR" | "USD" | "GBP";

// Taux de référence BCE publiés le 2026-08-27. Volontairement datés : les prix
// ToolTrim servent à comparer, pas à encaisser.
export const EUR_TO_USD = 1.1645;
export const EUR_TO_GBP = 0.8574;
export const CURRENCY_RATE_DATE = "2026-08-27";

const EUR_RATES: Record<Currency, number> = {
  EUR: 1,
  USD: EUR_TO_USD,
  GBP: EUR_TO_GBP,
};

export function isCurrency(value: unknown): value is Currency {
  return value === "EUR" || value === "USD" || value === "GBP";
}

/** Devise par défaut d'une langue de route. L'anglais sert un public international. */
export function currencyForLang(lang: string): Currency {
  return lang === "en" ? "USD" : "EUR";
}

export function convertAmount(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  return (amount / EUR_RATES[from]) * EUR_RATES[to];
}

export function formatAmount(amount: number, currency: Currency, lang: string): string {
  return new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formate en dollars un montant catalogue normalise en euros.
 *
 * Sert aux budgets de stack, qui sont des sommes sur plusieurs outils et n'ont
 * donc pas de devise native : contrairement au prix d'un outil, il n'existe
 * aucun montant publie par un editeur a preferer. La conversion au taux date
 * est ici le seul traitement possible, et le resultat est arrondi parce qu'une
 * somme convertie n'a pas de centimes signifiants.
 */
export function usdFromEur(eurAmount: number): string {
  return formatAmount(Math.round(convertAmount(eurAmount, "EUR", "USD")), "USD", "en");
}

export type NativePrice = { amount: number; currency: Currency };

/**
 * Devise et montant réellement publiés par l'éditeur, uniquement quand c'est
 * attesté. Deux sources, et pas une de plus :
 *
 * 1. le plan de comparaison canonique de `pricing_v5.plans`, qui porte sa
 *    devise explicitement ;
 * 2. `src/data/nativePrices.ts`, genere depuis pricing_truth.csv, ou chaque
 *    ligne a ete relevee sur la page officielle a une date donnee.
 *
 * Une troisième source existait : le premier montant non nul trouvé dans le
 * texte tarifaire éditorial, par expression régulière. Elle a été retirée. Elle
 * attrapait régulièrement un autre plan ou une autre période que le plan de
 * comparaison, et sur les 263 outils mesurés, 109 la voyaient contredire la
 * valeur normalisée d'une façon qu'aucune conversion n'explique : Adobe CC
 * remontait 22,99 $ (une application seule) contre 64,90 pour la suite,
 * 3ds Max remontait 785 $ (un tarif annuel) contre 149 au mois. Un montant
 * deviné qui tombe juste reste un montant deviné.
 *
 * Sans attestation, l'appelant retombe sur la valeur normalisée du catalogue,
 * convertie et signalée comme telle.
 */
export function nativePriceFromTool(tool: any): NativePrice | null {
  const plan = tool?.pricing_v5?.plans?.find(
    (item: any) => item?.isComparePlan && !item?.isFree && item?.nativeAmount != null,
  );
  if (plan && isCurrency(plan.nativeCurrency)) {
    return { amount: Number(plan.nativeAmount), currency: plan.nativeCurrency };
  }

  const attested = NATIVE_PRICES[tool?.slug] || NATIVE_PRICES[tool?.id];
  if (attested) return { amount: attested.amount, currency: attested.currency };

  return null;
}

export type ToolPriceDisplay = {
  amount: number;
  currency: Currency;
  /** true quand le montant vient d'une conversion et non du prix affiché par l'éditeur. */
  converted: boolean;
  text: string;
};

/**
 * Formate le prix catalogue d'un outil : toujours sa devise réelle, jamais
 * une conversion dans la devise de la page.
 *
 * Un outil a toujours une devise : celle attestée par l'éditeur, ou à défaut
 * l'euro dans lequel le catalogue normalise ses prix. Le paramètre `currency`
 * (dérivé de la langue de la page) ne sert plus qu'à choisir le format
 * d'affichage `Intl.NumberFormat`, jamais à recalculer un montant. Un outil
 * sans devise attestée est un manque de sourcing à combler, pas un taux de
 * change à appliquer.
 */
export function formatToolPrice(
  tool: any,
  normalizedEur: number,
  _currency: Currency,
  lang: string,
  options: { round?: boolean } = {},
): ToolPriceDisplay {
  const native = nativePriceFromTool(tool);
  const currency = native?.currency ?? "EUR";
  const raw = native?.amount ?? normalizedEur;
  const amount = options.round ? Math.round(raw) : raw;
  return { amount, currency, converted: false, text: formatAmount(amount, currency, lang) };
}
