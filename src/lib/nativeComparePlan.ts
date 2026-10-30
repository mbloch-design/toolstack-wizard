/** Typed facade retained for server and browser consumers; Node generators share the implementation. */
export {
  selectNativeComparePlan,
  nativeMonthlyAmount,
  hasExplicitNonNumericPricing,
  nativeSummaryPrices,
  explicitNonNumericStatus,
  blocksLegacyPriceFallback,
} from "./nativeComparePlan.mjs";
