/**
 * Taux, conversion et formatage de devise, sans dépendance à React ni à Vite.
 *
 * Ce module existe pour que le prérendu (vite.config.ts, qui tourne sous Node
 * avant que l'application n'existe) et l'application partagent exactement le
 * même taux et le même formatage. Auparavant le taux vivait dans
 * useCurrency.tsx, inatteignable depuis la config Vite, et les chaînes SEO
 * anglaises se contentaient donc d'un « € » codé en dur.
 */

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

const PRICE_IN_TEXT = /(?:([$€£])\s*([0-9]+(?:[.,][0-9]+)?)|([0-9]+(?:[.,][0-9]+)?)\s*([$€£]))/g;

function currencyForSymbol(symbol: string): Currency {
  return symbol === "$" ? "USD" : symbol === "£" ? "GBP" : "EUR";
}

/**
 * Devise réellement affichée par l'éditeur, quand elle est connaissable sans
 * lecture de fichier : le plan de comparaison canonique d'abord, sinon le
 * premier montant non nul du texte tarifaire éditorial.
 *
 * Le texte « paid » liste souvent le palier gratuit en premier
 * (« Free: 0 $ ; Pro: 22 $/mois »), d'où le filtre sur les montants nuls.
 */
export function nativePriceFromTool(tool: any): NativePrice | null {
  const plan = tool?.pricing_v5?.plans?.find(
    (item: any) => item?.isComparePlan && !item?.isFree && item?.nativeAmount != null,
  );
  if (plan && isCurrency(plan.nativeCurrency)) {
    return { amount: Number(plan.nativeAmount), currency: plan.nativeCurrency };
  }

  const text = [tool?.pricing?.paid, tool?.pricingEn?.paid].filter(Boolean).join(" ");
  for (const match of text.matchAll(PRICE_IN_TEXT)) {
    const amount = Number((match[2] || match[3]).replace(",", "."));
    if (Number.isFinite(amount) && amount > 0) {
      return { amount, currency: currencyForSymbol(match[1] || match[4]) };
    }
  }
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
 * Formate un prix catalogue (normalisé en euros) dans la devise demandée.
 * Le prix natif de l'éditeur prime quand il est déjà dans la bonne devise :
 * $19.99 vaut mieux qu'un €17.31 reconverti.
 */
export function formatToolPrice(
  tool: any,
  normalizedEur: number,
  currency: Currency,
  lang: string,
  options: { round?: boolean } = {},
): ToolPriceDisplay {
  const native = nativePriceFromTool(tool);
  const useNative = native?.currency === currency;
  const raw = useNative ? native!.amount : convertAmount(normalizedEur, "EUR", currency);
  const converted = !useNative && currency !== "EUR";
  // Un montant converti est arrondi d'office : afficher « $22.13 » pour un
  // éditeur qui publie 19 € invente une précision au centime qui n'existe pas.
  const amount = options.round || converted ? Math.round(raw) : raw;
  return { amount, currency, converted, text: formatAmount(amount, currency, lang) };
}
