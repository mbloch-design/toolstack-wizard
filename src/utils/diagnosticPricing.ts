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
  billing_model?: string | null;
  billing_options?: BillingOptionLike[] | null;
} | null | undefined;

type BillingChoice =
  | "free"
  | "paid"
  | "team"
  | "single_app"
  | "bundle"
  | "included"
  | "one_time"
  | "usage"
  | "credits"
  | "marketplace"
  | "custom_quote"
  | "unknown";

type BillingOptionLike = {
  value?: BillingChoice | string | null;
  price_monthly_eur?: number | string | null;
  price_original?: number | string | null;
  currency?: string | null;
  needs_verification?: boolean | null;
} | null;

type ToolPriceLike = {
  id?: string;
  price?: number;
  priceCurrency?: PriceCurrency;
  catalogMonthlyPrice?: number;
  catalogMonthlyPriceCurrency?: PriceCurrency;
  selectedOffer?: BillingChoice;
  selectedPriceIsEstimate?: boolean;
  pricing_v5?: PricingV5Like;
};

type PricingAuditToolLike = ToolPriceLike & {
  selectedOffer?: BillingChoice;
  selectedPriceIsEstimate?: boolean;
  pricing_v5?: {
    compare_price_monthly_eur?: number | string | null;
    compare_plan_name?: string | null;
    compare_plan_kind?: string | null;
    billing_model?: string | null;
    billing_options?: BillingOptionLike[] | null;
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
const ZERO_MONTHLY_OFFERS = new Set<BillingChoice>(["free", "included", "one_time"]);
const VARIABLE_OFFERS = new Set<BillingChoice>(["usage", "credits", "marketplace", "custom_quote", "unknown"]);

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

function findBillingOption(tool: ToolPriceLike, offer?: BillingChoice) {
  if (!offer) return null;
  const options = tool.pricing_v5?.billing_options;
  if (!Array.isArray(options)) return null;
  return options.find((option) => option?.value === offer) || null;
}

function getBillingOptionAmountEur(option: BillingOptionLike) {
  if (!option) return null;
  const monthly = toNumber(option.price_monthly_eur);
  if (monthly != null) return monthly;
  const original = toNumber(option.price_original);
  const currency = normalizeCurrency(option.currency);
  if (original != null && currency) return toEur(original, currency);
  return null;
}

function getDisplayAmountEur(tool: ToolPriceLike) {
  if (tool.selectedOffer && ZERO_MONTHLY_OFFERS.has(tool.selectedOffer)) return 0;

  const option = findBillingOption(tool, tool.selectedOffer);
  const optionAmount = getBillingOptionAmountEur(option);
  if (optionAmount != null) return optionAmount;

  const comparePrice = toNumber(tool.pricing_v5?.compare_price_monthly_eur);
  if (
    comparePrice != null &&
    tool.selectedPriceIsEstimate !== false &&
    (tool.selectedOffer === undefined || !ZERO_MONTHLY_OFFERS.has(tool.selectedOffer))
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

export function formatMonthlyEur(
  value: number,
  t?: (fr: string, en: string) => string
) {
  return `${formatNumber(value)} €/${t ? t("mois", "mo") : "mois"}`;
}

export function formatToolMonthlyBudget(tool: ToolPriceLike, t: (fr: string, en: string) => string) {
  const amount = getDisplayAmountEur(tool);
  if (tool.selectedOffer === "one_time") return t("Achat unique", "One-time");
  if (tool.selectedOffer === "included") return t("Déjà inclus", "Already included");
  if (tool.selectedOffer === "free" || amount <= 0) return t("Gratuit", "Free");
  return formatMonthlyEur(amount, t);
}

export function formatToolMonthlyPrice(
  tool: ToolPriceLike,
  t: (fr: string, en: string) => string,
  options: { approximate?: boolean; catalog?: boolean } = {}
) {
  const amount = getDisplayAmountEur(tool);
  if (tool.selectedOffer === "one_time") return t("Achat unique", "One-time");
  if (tool.selectedOffer === "included") return t("Déjà inclus", "Already included");
  if (amount <= 0) return t("Gratuit", "Free");

  const prefix = options.approximate ? "≈ " : "";
  const suffix = options.catalog ? ` ${t("catalogue", "catalog")}` : "";
  return `${prefix}${formatMonthlyEur(amount, t)}${suffix}`;
}

export function formatMonthlyTotal(
  tools: ToolPriceLike[],
  _t: (fr: string, en: string) => string,
  contracts: CommercialContract[] = []
) {
  let total = contractMonthlyTotal(contracts);
  const coveredIds = contractCoveredProductIds(contracts);

  for (const tool of tools) {
    if ("id" in tool && typeof tool.id === "string" && coveredIds.has(tool.id)) continue;
    const amount = getDisplayAmountEur(tool);
    if (amount <= 0) continue;
    total += amount;
  }

  return formatMoney(total, "EUR");
}

export function getMonthlyBudgetBreakdown(
  tools: ToolPriceLike[],
  contracts: CommercialContract[] = []
) {
  let confirmedEur = contractMonthlyTotal(contracts);
  let toVerifyEur = 0;
  const coveredIds = contractCoveredProductIds(contracts);

  for (const tool of tools) {
    if ("id" in tool && typeof tool.id === "string" && coveredIds.has(tool.id)) continue;
    const amount = getDisplayAmountEur(tool);
    if (tool.selectedOffer && ZERO_MONTHLY_OFFERS.has(tool.selectedOffer)) continue;
    if (amount <= 0) continue;
    const hasReliablePrice = !tool.selectedOffer || (!VARIABLE_OFFERS.has(tool.selectedOffer) && !tool.selectedPriceIsEstimate);
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

  if (tool.selectedOffer === "one_time") {
    return {
      status: "confirmed",
      tone: "ok",
      label: t("Achat unique", "One-time purchase"),
      detail: t("Licence ou achat ponctuel : aucun coût mensuel retenu.", "One-time license or purchase: no monthly cost kept."),
      needsVerification: false,
    };
  }

  if (tool.selectedOffer === "included") {
    return {
      status: "confirmed",
      tone: "ok",
      label: t("Déjà inclus", "Already included"),
      detail: t("L'outil est retenu comme inclus dans une suite, une équipe ou une licence existante.", "The tool is kept as included in an existing suite, team or license."),
      needsVerification: false,
    };
  }

  if (tool.selectedOffer === "free" || amount <= 0) {
    return {
      status: "free",
      tone: "ok",
      label: t("Gratuit déclaré", "Declared free"),
      detail: t("Aucun coût mensuel retenu pour cet outil.", "No monthly cost kept for this tool."),
      needsVerification: false,
    };
  }

  if (tool.selectedOffer && VARIABLE_OFFERS.has(tool.selectedOffer)) {
    return {
      status: "unknown",
      tone: "warning",
      label: t("Mode à vérifier", "Mode to check"),
      detail: t(
        "Je garde ce montant comme repère, mais le mode exact reste à confirmer.",
        "I keep this amount as a guide, but the exact mode still needs confirmation."
      ),
      needsVerification: true,
    };
  }

  if (tool.selectedPriceIsEstimate) {
    return {
      status: "catalog",
      tone: "info",
      label: t("Prix catalogue", "Catalog price"),
      detail: `${sourceLabel} · ${formatMonthlyEur(amount, t)}`,
      needsVerification: true,
    };
  }

  return {
    status: "confirmed",
    tone: "ok",
    label: t("Mode confirmé", "Confirmed mode"),
    detail: formatMonthlyEur(amount, t),
    needsVerification: false,
  };
}

export function getPricingCaptureSummary(
  tools: PricingAuditToolLike[],
  contracts: CommercialContract[] = []
) {
  const summary = {
    freeCount: 0,
    paidCount: 0,
    teamCount: 0,
    includedCount: 0,
    oneTimeCount: 0,
    variableCount: 0,
    unknownModeCount: 0,
    estimateCount: 0,
    missingCurrencyCount: 0,
    needsVerificationCount: 0,
  };

  const coveredIds = contractCoveredProductIds(contracts);
  const contractScopedIds = new Set(
    contracts.flatMap((contract) => contract.productIds || [])
  );
  const verificationKeys = new Set<string>();
  for (const [index, tool] of tools.entries()) {
    const verificationKey =
      "id" in tool && typeof tool.id === "string"
        ? `tool:${tool.id}`
        : `tool-index:${index}`;
    if ("id" in tool && typeof tool.id === "string" && coveredIds.has(tool.id)) {
      summary.includedCount += 1;
      continue;
    }
    if ("id" in tool && typeof tool.id === "string" && contractScopedIds.has(tool.id)) {
      summary.includedCount += 1;
      continue;
    }
    const amount = getDisplayAmountEur(tool);
    if (tool.selectedOffer === "included") summary.includedCount += 1;
    else if (tool.selectedOffer === "one_time") summary.oneTimeCount += 1;
    else if (tool.selectedOffer === "unknown") {
      summary.unknownModeCount += 1;
      verificationKeys.add(verificationKey);
    } else if (tool.selectedOffer && VARIABLE_OFFERS.has(tool.selectedOffer)) {
      summary.variableCount += 1;
      verificationKeys.add(verificationKey);
    }
    else if (tool.selectedOffer === "free" || amount <= 0) summary.freeCount += 1;
    else if (tool.selectedOffer === "team") summary.teamCount += 1;
    else summary.paidCount += 1;

    if (tool.selectedPriceIsEstimate && amount > 0) {
      summary.estimateCount += 1;
      verificationKeys.add(verificationKey);
    }
  }

  contracts
    .filter((contract) => !contract.confirmed)
    .forEach((contract) => verificationKeys.add(`contract:${contract.id}`));
  summary.needsVerificationCount = verificationKeys.size;

  return summary;
}
import type { CommercialContract } from "@/types/diagnostic";
import {
  contractCoveredProductIds,
  contractMonthlyTotal,
} from "@/lib/commercialAccess";
