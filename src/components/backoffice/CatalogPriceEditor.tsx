import { useState } from "react";
import { Button, Field, Select } from "@/components/ui/primitives";
import { ArrowUp, ArrowDown, CirclePlus } from "@/lib/icons";
import {
  resolveCatalogComparison,
  initializeCatalogPriceObservations,
  updateCatalogPriceObservation,
} from "@/lib/catalogPriceObservations";
import {
  hasExplicitNonNumericPricing,
  nativeMonthlyAmount,
} from "@/lib/nativeComparePlan";
import { catalogPlanSchema } from "@/lib/catalogFieldRegistry";
import { CatalogFieldEditor } from "./CatalogFieldEditor";
import {
  catalogText,
  catalogValueAt,
  canEdit,
  record,
  applyChanges,
  differences,
  type CatalogEditingValue,
} from "./catalogEditingModel";

export type RemovedOffer = {
  slug: string;
  root: string;
  index: number;
  plan: Record<string, unknown>;
  references: Record<string, string[]>;
};
export function useOfferOperations(context: CatalogEditingValue) {
  const [removed, setRemoved] = useState<RemovedOffer[]>([]);
  function remove(root: string, index: number, replacement: string) {
    if (!canEdit(context, [root, "plans"])) return;
    const plans = catalogValueAt(context.value, [root, "plans"]) as Record<
      string,
      unknown
    >[];
    const plan = plans[index],
      references: Record<string, string[]> = {};
    let next = initializeCatalogPriceObservations(context.value);
    for (const pricingRoot of ["pricing_v5", "pricing_v5En"] as const) {
      const rows = catalogValueAt(next, [pricingRoot, "plans"]);
      if (!Array.isArray(rows)) continue;
      references[pricingRoot] = rows
        .filter(
          (row) =>
            row.nativeCurrency === plan.nativeCurrency && row.isComparePlan,
        )
        .map((row) => row.planKey);
      if (plan.isComparePlan && replacement)
        rows.forEach((_, i) => {
          const row = catalogValueAt(next, [pricingRoot, "plans", i]) as Record<
            string,
            unknown
          >;
          if (row.nativeCurrency !== plan.nativeCurrency) return;
          const selected = row.planKey === replacement;
          if (row.isComparePlan !== selected) {
            row.isComparePlan = selected;
            if (!row.priceStatus)
              next = updateCatalogPriceObservation(next, pricingRoot, i, {
                priceStatus: row.isFree
                  ? "free"
                  : Number(row.nativeAmount) > 0
                    ? "paid"
                    : "unknown",
              });
          }
        });
    }
    const parent = next[root] as Record<string, unknown>;
    const removedPlan = structuredClone(
      (parent.plans as Record<string, unknown>[])[index],
    );
    parent.plans = (parent.plans as unknown[]).filter((_, i) => i !== index);
    if (applyChanges(context, differences(context.value, next)))
      setRemoved((old) => [
        ...old,
        {
          slug: context.value.slug,
          root,
          index,
          plan: removedPlan,
          references,
        },
      ]);
  }
  function undo(item: RemovedOffer) {
    if (
      item.slug !== context.value.slug ||
      !canEdit(context, [item.root, "plans"])
    )
      return;
    const next = structuredClone(context.value),
      parent = next[item.root] as Record<string, unknown>;
    const plans = parent.plans as Record<string, unknown>[];
    if (plans.some((plan) => plan.planKey === item.plan.planKey)) return;
    plans.splice(item.index, 0, item.plan);
    for (const pricingRoot of Object.keys(item.references)) {
      const rows = catalogValueAt(next, [pricingRoot, "plans"]);
      if (Array.isArray(rows))
        rows.forEach((row) => {
          if (row.nativeCurrency === item.plan.nativeCurrency)
            row.isComparePlan = item.references[pricingRoot].includes(
              row.planKey,
            );
        });
    }
    if (applyChanges(context, differences(context.value, next)))
      setRemoved((old) => old.filter((candidate) => candidate !== item));
  }
  return {
    removed: removed.filter((item) => item.slug === context.value.slug),
    remove,
    undo,
  };
}
export function PlanActions({
  context,
  root,
  index,
  onRemove,
}: {
  context: CatalogEditingValue;
  root: string;
  index: number;
  onRemove: (root: string, index: number, replacement: string) => void;
}) {
  const t = (fr: string, en: string) => catalogText(context, fr, en);
  const rawPlans = catalogValueAt(context.value, [root, "plans"]);
  const plans = Array.isArray(rawPlans)
    ? (rawPlans as Record<string, unknown>[])
    : [];
  const [replacement, setReplacement] = useState("");
  if (!plans) return null;
  const plan = plans[index],
    allowed = canEdit(context, [root, "plans"]);
  const candidates = plan.isComparePlan
    ? plans.filter(
        (candidate) =>
          candidate !== plan &&
          candidate.nativeCurrency === plan.nativeCurrency &&
          candidate.isFree !== true &&
          Number(candidate.nativeAmount) > 0,
      )
    : [];
  function reorder(offset: number) {
    if (!allowed) return;
    const next = [...plans];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    context.onChange([root, "plans"], next);
  }
  return (
    <div className="bo-inline-plan-actions">
      <Button
        size="compact"
        disabled={!allowed || index === 0}
        aria-label={t("Monter l’offre", "Move offer up")}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => reorder(-1)}
        icon={<ArrowUp />}
      />
      <Button
        size="compact"
        disabled={!allowed || index === plans.length - 1}
        aria-label={t("Descendre l’offre", "Move offer down")}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => reorder(1)}
        icon={<ArrowDown />}
      />
      {candidates.length > 0 && (
        <Field
          label={t(
            "Prix de référence après retrait",
            "Reference price after removal",
          )}
        >
          <Select
            disabled={!allowed}
            value={replacement}
            onChange={(event) => setReplacement(event.target.value)}
          >
            <option value="">
              {t("Choisir une offre", "Choose an offer")}
            </option>
            {candidates.map((candidate) => (
              <option
                key={String(candidate.planKey)}
                value={String(candidate.planKey)}
              >
                {String(candidate.displayName)}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Button
        size="compact"
        variant="quiet"
        disabled={!allowed || (candidates.length > 0 && !replacement)}
        onClick={() => {
          if (allowed) onRemove(root, index, replacement);
        }}
      >
        {t("Retirer l’offre", "Remove offer")}
      </Button>
    </div>
  );
}
export function PlanCollection({
  context,
  root,
  removed,
  onUndo,
}: {
  context: CatalogEditingValue;
  root: string;
  removed: RemovedOffer[];
  onUndo: (item: RemovedOffer) => void;
}) {
  const t = (fr: string, en: string) => catalogText(context, fr, en);
  const plansValue = catalogValueAt(context.value, [root, "plans"]),
    plans = Array.isArray(plansValue) ? plansValue : [];
  const allowed = canEdit(context, [root, "plans"]);
  return (
    <div className="bo-inline-collection-actions">
      <Button
        disabled={!allowed}
        size="compact"
        icon={<CirclePlus />}
        onClick={() => {
          if (allowed)
            context.onChange(
              [root, "plans"],
              [
                ...plans,
                {
                  planKey: `offer-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
                  displayName: t("Nouvelle offre", "New offer"),
                  nativeAmount: null,
                  nativeCurrency: "EUR",
                  priceStatus: "unknown",
                  isFree: false,
                  isComparePlan: false,
                },
              ],
            );
        }}
      >
        {t("Ajouter une offre", "Add an offer")}
      </Button>
      {removed
        .filter((item) => item.root === root)
        .map((item) => (
          <Button
            key={String(item.plan.planKey)}
            disabled={!allowed}
            size="compact"
            onClick={() => onUndo(item)}
          >
            {t("Annuler le retrait de", "Undo removal of")}{" "}
            {String(item.plan.displayName)}
          </Button>
        ))}
      {context.capabilities.canPublishAll && (
        <p>
          {t(
            "Les prix partagés sourcés sont liés au premier changement de prix. Les textes restent propres à chaque langue.",
            "Sourced shared prices are linked on the first price edit. Text remains independent in each language.",
          )}
        </p>
      )}
    </div>
  );
}

export function PlanDetails({
  context,
  root,
  index,
}: {
  context: CatalogEditingValue;
  root: string;
  index: number;
}) {
  return (
    <details className="bo-inline-settings">
      <summary>
        {catalogText(context, "Détails de l’offre", "Offer details")}
      </summary>
      {Object.entries(catalogPlanSchema.children!)
        .filter(
          ([key]) =>
            ![
              "displayName",
              "nativeAmount",
              "nativeCurrency",
              "priceStatus",
            ].includes(key),
        )
        .map(([key, schema]) => (
          <CatalogFieldEditor
            key={key}
            context={context}
            path={[root, "plans", index, key]}
            schema={schema}
          />
        ))}
    </details>
  );
}

export function ComparisonPriceSummary({
  context,
  currency,
}: {
  context: CatalogEditingValue;
  currency: string;
}) {
  const t = (fr: string, en: string) => catalogText(context, fr, en);
  const comparison = resolveCatalogComparison(context.value, currency);
  if (!comparison.plan)
    return (
      <p className="bo-inline-note">
        {hasExplicitNonNumericPricing(context.value)
          ? t(
              "Le prix actuel est sur devis, non communiqué ou dépend de l’usage. Aucun montant historique de repli n’est affiché.",
              "The current price is quoted, undisclosed or usage based. No historical fallback amount is displayed.",
            )
          : t(
              "Aucune offre de comparaison native retenue. Le prix historique reste un repli à vérifier dans les paramètres tarifaires.",
              "No native comparison offer selected. Historical pricing remains a fallback to verify in the pricing settings.",
            )}
      </p>
    );
  const plan = comparison.plan,
    amount = Number(plan.nativeAmount),
    once = ["one_time", "one-time"].includes(String(plan.billingPeriod));
  const money = (value: number) =>
    new Intl.NumberFormat(context.lang === "en" ? "en-US" : "fr-FR", {
      maximumFractionDigits: 2,
    }).format(value) +
    " " +
    String(plan.nativeCurrency);
  return (
    <div className="bo-inline-provenance" role="note">
      <strong>
        {t("Prix de référence effectif :", "Effective comparison price:")}{" "}
        {String(plan.displayName)} · {money(amount)}
      </strong>
      <p>
        {once
          ? t(
              "Achat unique ; aucun équivalent mensuel calculé.",
              "One-time purchase; no monthly equivalent calculated.",
            )
          : t(
              `Équivalent mensuel calculé : ${money(nativeMonthlyAmount(amount, plan.billingPeriod))}.`,
              `Calculated monthly equivalent: ${money(nativeMonthlyAmount(amount, plan.billingPeriod))}.`,
            )}
      </p>
      {comparison.fallback === "other_currency" && (
        <p>
          {t(
            "Aucun prix attesté dans la devise de consultation ; le montant garde sa devise d’origine.",
            "No observed price in the viewing currency; this amount retains its original currency.",
          )}
        </p>
      )}
      <p>
        {t("Source :", "Source:")}{" "}
        {String(plan.detailsSourceUrl || t("à renseigner", "not provided"))} ·{" "}
        {String(plan.observedOn || t("date à renseigner", "date not provided"))}
      </p>
    </div>
  );
}
