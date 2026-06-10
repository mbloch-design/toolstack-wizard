type PriceCurrency = "EUR" | "USD" | string;

type PricingText = {
  free?: string;
  paid?: string;
} | null | undefined;

type PricingV5Like = {
  price_original?: number | string | null;
  price_original_currency?: string | null;
  monthly_public_price_original?: number | string | null;
  currency?: string | null;
  compare_price_monthly_eur?: number | string | null;
} | null | undefined;

type ToolPriceLike = {
  price?: number;
  priceCurrency?: PriceCurrency;
  catalogMonthlyPrice?: number;
  catalogMonthlyPriceCurrency?: PriceCurrency;
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeCurrency(value: unknown): PriceCurrency | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase();
  if (!normalized) return undefined;
  if (normalized === "$") return "USD";
  if (normalized === "€") return "EUR";
  return normalized;
}

function parsePriceFromText(text: string): { amount: number; currency: PriceCurrency } | null {
  const normalized = text.replace(/\s+/g, " ");
  const usd =
    normalized.match(/(?:USD|\$)\s*(\d+(?:[.,]\d+)?)/i) ||
    normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:USD|\$)/i);
  if (usd) {
    const amount = toNumber(usd[1]);
    if (amount != null) return { amount, currency: "USD" };
  }

  const eur =
    normalized.match(/(?:EUR|€)\s*(\d+(?:[.,]\d+)?)/i) ||
    normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:EUR|€)/i);
  if (eur) {
    const amount = toNumber(eur[1]);
    if (amount != null) return { amount, currency: "EUR" };
  }

  return null;
}

export function inferCatalogMonthlyPrice(input: {
  defaultMonthlyPrice: number;
  pricing?: PricingText;
  pricingEn?: PricingText;
  pricing_v5?: PricingV5Like;
}) {
  const pricingV5 = input.pricing_v5;
  const explicitOriginal = toNumber(
    pricingV5?.monthly_public_price_original ?? pricingV5?.price_original
  );
  const explicitCurrency = normalizeCurrency(
    pricingV5?.currency ?? pricingV5?.price_original_currency
  );

  if (explicitOriginal != null && explicitCurrency) {
    return {
      amount: explicitOriginal,
      currency: explicitCurrency,
      source: "original" as const,
    };
  }

  const paidTexts = [
    input.pricing?.paid,
    input.pricingEn?.paid,
  ].filter(Boolean).join(" ");
  const parsed = paidTexts ? parsePriceFromText(paidTexts) : null;
  const comparePrice = toNumber(pricingV5?.compare_price_monthly_eur);

  if (parsed && !(input.defaultMonthlyPrice === 0 && comparePrice === 0)) {
    return {
      amount: parsed.amount,
      currency: parsed.currency,
      source: "pricing_text" as const,
    };
  }

  return {
    amount: input.defaultMonthlyPrice,
    currency: undefined,
    source: "unknown" as const,
  };
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100).replace(".", ",");
}

export function formatMoney(value: number, currency?: PriceCurrency) {
  const formatted = formatNumber(value);
  if (currency === "USD") return `${formatted}$`;
  if (currency === "EUR") return `${formatted}€`;
  if (currency) return `${formatted} ${currency}`;
  return formatted;
}

export function formatToolMonthlyPrice(
  tool: ToolPriceLike,
  t: (fr: string, en: string) => string,
  options: { approximate?: boolean; catalog?: boolean } = {}
) {
  const amount = Number(tool.price ?? 0);
  const currency = tool.priceCurrency || tool.catalogMonthlyPriceCurrency;
  if (amount <= 0) return t("Gratuit", "Free");

  const prefix = options.approximate ? "≈ " : "";
  const suffix = options.catalog ? ` ${t("catalogue", "catalog")}` : "";
  const monthly = `${prefix}${formatMoney(amount, currency)}/${t("mois", "mo")}${suffix}`;
  if (currency) return monthly;
  return `${monthly} · ${t("devise à vérifier", "currency to check")}`;
}

export function formatMonthlyTotal(
  tools: ToolPriceLike[],
  t: (fr: string, en: string) => string
) {
  const totals = new Map<string, number>();
  let unknown = 0;

  for (const tool of tools) {
    const amount = Number(tool.price ?? 0);
    if (amount <= 0) continue;
    const currency = tool.priceCurrency || tool.catalogMonthlyPriceCurrency;
    if (!currency) {
      unknown += amount;
      continue;
    }
    totals.set(currency, (totals.get(currency) || 0) + amount);
  }

  const parts = Array.from(totals.entries()).map(([currency, amount]) => formatMoney(amount, currency));
  if (unknown > 0) parts.push(`${formatMoney(unknown)} ${t("à vérifier", "to check")}`);
  if (parts.length === 0) return formatMoney(0);
  return parts.join(" + ");
}
