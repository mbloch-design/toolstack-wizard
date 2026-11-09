import { blocksLegacyPriceFallback, selectNativeComparePlan } from "./nativeComparePlan.js";
import type { CatalogTool } from "./backofficeCatalog.js";
export const PRICE_FACT_FIELDS = [
  "nativeAmount",
  "nativeCurrency",
  "billingPeriod",
  "billingCommitment",
  "pricingUnit",
  "observedMarket",
  "taxInclusion",
  "comingSoon",
  "isFree",
  "priceStatus",
  "detailsSourceUrl",
  "observedOn",
  "lastConfirmedOn",
] as const;
export const priceRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export const priceEqual = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
export function catalogPlanRows(tool: CatalogTool) {
  return (["pricing_v5", "pricing_v5En"] as const).flatMap((root) => {
    const pricing = tool[root];
    return priceRecord(pricing) && Array.isArray(pricing.plans)
      ? pricing.plans.flatMap((plan, index) =>
          priceRecord(plan)
            ? [{ root, index, plan, path: `${root}.plans.${index}` }]
            : [],
        )
      : [];
  });
}
function observationKey(tool: CatalogTool, plan: Record<string, unknown>) {
  // Full encoded evidence is collision-free and deterministic; never an inferred fact.
  return `observation:${encodeURIComponent(JSON.stringify([tool.slug, plan.planKey, ...PRICE_FACT_FIELDS.map((k) => [k, Object.prototype.hasOwnProperty.call(plan, k), plan[k]])]))}`;
}
export function initializeCatalogPriceObservations(
  tool: CatalogTool,
): CatalogTool {
  const value = JSON.parse(JSON.stringify(tool)) as CatalogTool;
  const rows = catalogPlanRows(value);
  for (const { plan } of rows) {
    if (
      plan.priceObservationId ||
      typeof plan.planKey !== "string" ||
      !plan.planKey ||
      typeof plan.detailsSourceUrl !== "string" ||
      !plan.detailsSourceUrl.trim() ||
      typeof plan.observedOn !== "string" ||
      !plan.observedOn.trim()
    )
      continue;
    const matches = rows.filter(
      (r) =>
        r.plan.planKey === plan.planKey &&
        PRICE_FACT_FIELDS.every((k) => priceEqual(plan[k], r.plan[k])),
    );
    if (matches.length < 2 || matches.some((r) => r.plan.priceObservationId))
      continue;
    const id = observationKey(value, plan);
    matches.forEach((r) => {
      r.plan.priceObservationId = id;
    });
  }
  return value;
}
/** Only shared price facts propagate. Names, summaries, feature lists and compare selection stay local. */
export function updateCatalogPriceObservation(
  tool: CatalogTool,
  root: "pricing_v5" | "pricing_v5En",
  index: number,
  patch: Record<string, unknown>,
): CatalogTool {
  const value = initializeCatalogPriceObservations(tool),
    rows = catalogPlanRows(value);
  const target = rows.find((r) => r.root === root && r.index === index);
  if (!target) throw new Error("CATALOG_PLAN_NOT_FOUND");
  const id = target.plan.priceObservationId;
  Object.assign(target.plan, patch);
  if (id)
    for (const row of rows)
      if (row !== target && row.plan.priceObservationId === id)
        for (const key of PRICE_FACT_FIELDS)
          if (Object.prototype.hasOwnProperty.call(patch, key))
            row.plan[key] = patch[key];
  return value;
}
/** Pure server-compatible selector. Public legacy fallbacks remain explicit to callers. */
export function resolveCatalogComparison(tool: CatalogTool, currency: string) {
  const rows = catalogPlanRows(tool);
  const selected = selectNativeComparePlan(
    rows.map((r) => r.plan),
    currency,
  );
  const candidate = rows.find((r) => r.plan === selected);
  if (!candidate)
    return { plan: null, path: null, fallback: blocksLegacyPriceFallback(tool) ? null : "legacy" as const };
  return {
    plan: candidate.plan,
    path: candidate.path,
    fallback:
      candidate.plan.nativeCurrency === currency
        ? null
        : ("other_currency" as const),
  };
}
