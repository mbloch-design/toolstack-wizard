/** Node-compatible canonical price intent shared by public runtime and catalogue generation. */
export function selectNativeComparePlan(plans, preferredCurrency) {
  const candidates = plans.filter(
    (p) =>
      p?.isComparePlan &&
      !p.isFree &&
      (p.priceStatus == null || p.priceStatus === "paid") &&
      p.nativeAmount != null &&
      ["EUR", "USD", "GBP"].includes(String(p.nativeCurrency)),
  );
  return (
    (preferredCurrency
      ? candidates.find((p) => p.nativeCurrency === preferredCurrency)
      : undefined) ?? candidates[0]
  );
}
export function nativeMonthlyAmount(amount, period) {
  return period === "annual" || period === "year"
    ? amount / 12
    : period === "quarterly"
      ? amount / 3
      : period === "week"
        ? (amount * 52) / 12
        : period === "day"
          ? (amount * 365) / 12
          : amount;
}
export function explicitNonNumericStatus(tool) {
  const plans = [
    ...(tool.pricing_v5?.plans ?? []),
    ...(tool.pricing_v5En?.plans ?? []),
  ];
  const nonnumeric = plans.find((p) =>
    ["quote", "unknown", "usage"].includes(String(p.priceStatus)),
  );
  return nonnumeric && !selectNativeComparePlan(plans)
    ? nonnumeric.priceStatus
    : null;
}
export function hasExplicitNonNumericPricing(tool) {
  return explicitNonNumericStatus(tool) !== null;
}
export function blocksLegacyPriceFallback(tool) {
  const plans = [
    ...(tool.pricing_v5?.plans ?? []),
    ...(tool.pricing_v5En?.plans ?? []),
  ];
  return (
    plans.some((plan) => plan.priceStatus != null) &&
    !selectNativeComparePlan(plans)
  );
}
export function nativeSummaryPrices(tool) {
  const out = [];
  for (const plan of [
    ...(tool.pricing_v5?.plans ?? []),
    ...(tool.pricing_v5En?.plans ?? []),
  ]) {
    if (
      !selectNativeComparePlan([plan]) ||
      !(plan.nativeAmount > 0) ||
      out.some((entry) => entry.currency === plan.nativeCurrency)
    )
      continue;
    const legacy = plan.priceStatus == null;
    const period =
      plan.billingPeriod === "monthly" ||
      (!legacy && plan.billingPeriod === "month")
        ? "monthly"
        : plan.billingPeriod === "annual" ||
            (!legacy && plan.billingPeriod === "year")
          ? "annual"
          : !legacy && plan.billingPeriod === "usage"
            ? "usage"
            : !legacy &&
                ["quarterly", "week", "day"].includes(plan.billingPeriod)
              ? "monthly"
              : "once";
    out.push({
      amount:
        !legacy && ["quarterly", "week", "day"].includes(plan.billingPeriod)
          ? nativeMonthlyAmount(plan.nativeAmount, plan.billingPeriod)
          : plan.nativeAmount,
      currency: plan.nativeCurrency,
      period,
      ...(period === "usage" && plan.pricingUnit
        ? { unit: plan.pricingUnit }
        : {}),
    });
  }
  return out;
}
