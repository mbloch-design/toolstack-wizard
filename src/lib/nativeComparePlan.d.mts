type Plan = {
  isComparePlan?: unknown;
  isFree?: unknown;
  nativeAmount?: unknown;
  nativeCurrency?: unknown;
  priceStatus?: unknown;
  billingPeriod?: unknown;
  pricingUnit?: unknown;
};
type Input =
  | {
      pricing_v5?: { plans?: readonly Plan[] } | null;
      pricing_v5En?: { plans?: readonly Plan[] } | null;
    }
  | Record<string, unknown>;
export function selectNativeComparePlan<T extends Plan>(
  plans: readonly T[],
  preferredCurrency?: string,
): T | undefined;
export function nativeMonthlyAmount(amount: number, period: unknown): number;
export function hasExplicitNonNumericPricing(tool: Input): boolean;
export function nativeSummaryPrices(tool: Input): {
  amount: number;
  currency: string;
  period: "monthly" | "annual" | "once" | "usage";
  unit?: string;
}[];

export function explicitNonNumericStatus(
  tool: Input,
): "quote" | "unknown" | "usage" | null;

export function blocksLegacyPriceFallback(tool: Input): boolean;

export function nativePlanIntent(
  tool: Input,
  preferredCurrency?: string,
): { plan: Plan | undefined; explicit: boolean; oneTime: boolean };
