/** Shared canonical selector used by public pricing and publication diagnostics.
 * Intentionally retains the legacy ordering and eligibility for absent priceStatus.
 * Pricing-truth and normalized-price fallbacks are applied by the caller.
 */
export function selectNativeComparePlan<
  T extends {
    isComparePlan?: unknown;
    isFree?: unknown;
    nativeAmount?: unknown;
    nativeCurrency?: unknown;
  },
>(plans: readonly T[], preferredCurrency?: string): T | undefined {
  const candidates = plans.filter(
    (p) =>
      p.isComparePlan &&
      !p.isFree &&
      p.nativeAmount != null &&
      ["EUR", "USD", "GBP"].includes(String(p.nativeCurrency)),
  );
  return (
    (preferredCurrency
      ? candidates.find((p) => p.nativeCurrency === preferredCurrency)
      : undefined) ?? candidates[0]
  );
}
