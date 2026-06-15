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
  compare_plan_name?: string | null;
  compare_plan_kind?: string | null;
} | null | undefined;

type ToolPriceLike = {
  price?: number;
  priceCurrency?: PriceCurrency;
  catalogMonthlyPrice?: number;
  catalogMonthlyPriceCurrency?: PriceCurrency;
  selectedOffer?: "free" | "paid" | "team" | "unknown";
  selectedPriceIsEstimate?: boolean;
  pricing_v5?: PricingV5Like;
};

type PricingAuditToolLike = ToolPriceLike & {
  selectedOffer?: "free" | "paid" | "team" | "unknown";
  selectedPriceIsEstimate?: boolean;
  pricing_v5?: {
    compare_price_monthly_eur?: number | string | null;
    compare_plan_name?: string | null;
    compare_plan_kind?: string | null;
    price_reliability?: string | null;
    verification_status?: string | null;
    source_domain?: string | null;
  } | null;
};

export type PricingAudit = {
  status: "free" | "confirmed" | "catalog" | "missing_currency" | "unknown";
  tone: "ok" | "info" | "warning";
  label: string;
  detail: string;
  needsVerification: boolean;
};

export const USD_TO_EUR_RATE = 0.92;

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
  const comparePrice = toNumber(pricingV5?.compare_price_monthly_eur);

  if (comparePrice != null) {
    return {
      amount: comparePrice,
      currency: "EUR" as const,
      source: "pricing_v5_eur" as const,
    };
  }

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

function toEur(value: number, currency?: PriceCurrency) {
  if (!Number.isFinite(value)) return 0;
  if (currency === "USD") return value * USD_TO_EUR_RATE;
  return value;
}

function getDisplayAmountEur(tool: ToolPriceLike) {
  const comparePrice = toNumber(tool.pricing_v5?.compare_price_monthly_eur);
  if (
    comparePrice != null &&
    tool.selectedPriceIsEstimate !== false &&
    (tool.selectedOffer === undefined || tool.selectedOffer !== "free")
  ) {
    return comparePrice;
  }

  const amount = Number(tool.price ?? tool.catalogMonthlyPrice ?? 0);
  const currency = tool.priceCurrency || tool.catalogMonthlyPriceCurrency;
  return toEur(amount, currency);
}

export function formatMoney(value: number, currency?: PriceCurrency) {
  const formatted = formatNumber(toEur(value, currency));
  return `${formatted} €`;
}

export function formatMonthlyEur(value: number) {
  return `${formatNumber(value)} €/mois`;
}

export function formatToolMonthlyBudget(tool: ToolPriceLike, t: (fr: string, en: string) => string) {
  const amount = getDisplayAmountEur(tool);
  if (tool.selectedOffer === "free" || amount <= 0) return t("Gratuit", "Free");
  return formatMonthlyEur(amount);
}

export function formatToolMonthlyPrice(
  tool: ToolPriceLike,
  t: (fr: string, en: string) => string,
  options: { approximate?: boolean; catalog?: boolean } = {}
) {
  const amount = getDisplayAmountEur(tool);
  if (amount <= 0) return t("Gratuit", "Free");

  const prefix = options.approximate ? "≈ " : "";
  const suffix = options.catalog ? ` ${t("catalogue", "catalog")}` : "";
  return `${prefix}${formatMonthlyEur(amount)}${suffix}`;
}

export function formatMonthlyTotal(
  tools: ToolPriceLike[],
  _t: (fr: string, en: string) => string
) {
  let total = 0;

  for (const tool of tools) {
    const amount = getDisplayAmountEur(tool);
    if (amount <= 0) continue;
    total += amount;
  }

  return formatMoney(total, "EUR");
}

export function getMonthlyBudgetBreakdown(
  tools: ToolPriceLike[]
) {
  let confirmedEur = 0;
  let toVerifyEur = 0;

  for (const tool of tools) {
    const amount = getDisplayAmountEur(tool);
    if (amount <= 0 || tool.selectedOffer === "free") continue;
    const hasReliablePrice = tool.selectedOffer !== "unknown" && !tool.selectedPriceIsEstimate;
    if (hasReliablePrice) confirmedEur += amount;
    else toVerifyEur += amount;
  }

  return {
    confirmedEur,
    toVerifyEur,
    hasToVerify: toVerifyEur > 0,
  };
}

export function getPricingAudit(
  tool: PricingAuditToolLike,
  t: (fr: string, en: string) => string
): PricingAudit {
  const amount = getDisplayAmountEur(tool);
  const sourceDomain = tool.pricing_v5?.source_domain;
  const sourceLabel = sourceDomain
    ? t(`Source : ${sourceDomain}`, `Source: ${sourceDomain}`)
    : t("Source catalogue ToolTrim", "ToolTrim catalog source");

  if (tool.selectedOffer === "free" || amount <= 0) {
    return {
      status: "free",
      tone: "ok",
      label: t("Gratuit déclaré", "Declared free"),
      detail: t("Aucun coût mensuel retenu pour cet outil.", "No monthly cost kept for this tool."),
      needsVerification: false,
    };
  }

  if (tool.selectedOffer === "unknown") {
    return {
      status: "unknown",
      tone: "warning",
      label: t("Plan à vérifier", "Plan to check"),
      detail: t(
        "Je garde ce montant comme repère, mais le plan exact reste à confirmer.",
        "I keep this amount as a guide, but the exact plan still needs confirmation."
      ),
      needsVerification: true,
    };
  }

  if (tool.selectedPriceIsEstimate) {
    return {
      status: "catalog",
      tone: "info",
      label: t("Prix catalogue", "Catalog price"),
      detail: `${sourceLabel} · ${formatMonthlyEur(amount)}`,
      needsVerification: true,
    };
  }

  return {
    status: "confirmed",
    tone: "ok",
    label: t("Plan confirmé", "Confirmed plan"),
    detail: formatMonthlyEur(amount),
    needsVerification: false,
  };
}

export function getPricingCaptureSummary(tools: PricingAuditToolLike[]) {
  const summary = {
    freeCount: 0,
    paidCount: 0,
    teamCount: 0,
    unknownPlanCount: 0,
    estimateCount: 0,
    missingCurrencyCount: 0,
    needsVerificationCount: 0,
  };

  for (const tool of tools) {
    const amount = getDisplayAmountEur(tool);
    if (tool.selectedOffer === "free" || amount <= 0) summary.freeCount += 1;
    else if (tool.selectedOffer === "team") summary.teamCount += 1;
    else if (tool.selectedOffer === "unknown") summary.unknownPlanCount += 1;
    else summary.paidCount += 1;

    if (tool.selectedPriceIsEstimate && amount > 0) summary.estimateCount += 1;
  }

  summary.needsVerificationCount =
    summary.unknownPlanCount + summary.estimateCount + summary.missingCurrencyCount;

  return summary;
}
