import { useState } from "react";
import { Button, Field, IconButton, Select } from "@/ds/Controls/Controls";
import { CatalogNote, CatalogSettings } from "@/ds/CatalogAuthoring/CatalogAuthoring";
import styles from "@/ds/CatalogAuthoring/CatalogAuthoring.module.css";
import { ArrowUp, ArrowDown, CirclePlus, CircleMinus } from "@/lib/icons";
import {
  catalogPlanRows,
  PRICE_FACT_FIELDS,
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
  referencesAfter: Record<string, string[]>;
  wasReference: boolean;
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
    const referencesAfter: Record<string, string[]> = {};
    for (const pricingRoot of ["pricing_v5", "pricing_v5En"]) {
      const rows = catalogValueAt(next, [pricingRoot, "plans"]);
      referencesAfter[pricingRoot] = Array.isArray(rows)
        ? rows
            .filter(
              (row) =>
                row.nativeCurrency === plan.nativeCurrency && row.isComparePlan,
            )
            .map((row) => String(row.planKey))
            .sort()
        : [];
    }
    if (applyChanges(context, differences(context.value, next)))
      setRemoved((old) => [
        ...old,
        {
          slug: context.value.slug,
          root,
          index,
          plan: removedPlan,
          references,
          referencesAfter,
          wasReference: plan.isComparePlan === true,
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
    if (!parent || !Array.isArray(parent.plans)) return;
    const plans = parent.plans as Record<string, unknown>[];
    if (plans.some((plan) => plan.planKey === item.plan.planKey)) return;
    // Invert only the reference decision made by this removal, while its post-state is still current.
    const restoreReferences =
      item.wasReference &&
      ["pricing_v5", "pricing_v5En"].every((pricingRoot) => {
        const rows = catalogValueAt(next, [pricingRoot, "plans"]);
        const current = Array.isArray(rows)
          ? rows
              .filter(
                (row) =>
                  row.nativeCurrency === item.plan.nativeCurrency &&
                  row.isComparePlan,
              )
              .map((row) => String(row.planKey))
              .sort()
          : [];
        return (
          JSON.stringify(current) ===
          JSON.stringify(item.referencesAfter[pricingRoot] ?? [])
        );
      });
    const restored = structuredClone(item.plan);
    const peer = restored.priceObservationId ? catalogPlanRows(next).find((row) => row.plan.priceObservationId === restored.priceObservationId)?.plan : undefined;
    if (peer) for (const key of PRICE_FACT_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(peer, key)) restored[key] = peer[key];
      else delete restored[key];
    }
    const sameCurrency = restored.nativeCurrency === item.plan.nativeCurrency;
    if (item.wasReference && (!restoreReferences || !sameCurrency)) restored.isComparePlan = false;
    plans.splice(item.index, 0, restored);
    if (restoreReferences && sameCurrency)
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
    <div className={styles.collectionActions}>
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
      <IconButton
        size="compact"
        variant="quiet"
        aria-label={t("Retirer l’offre", "Remove offer")}
        title={t("Retirer l’offre", "Remove offer")}
        icon={<CircleMinus />}
        disabled={!allowed || (candidates.length > 0 && !replacement)}
        onClick={() => {
          if (allowed) onRemove(root, index, replacement);
        }}
      />
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
    <div className={styles.collectionActions}>
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
            disabled={!allowed || !Array.isArray(plansValue)}
            size="compact"
            onClick={() => onUndo(item)}
          >
            {t("Annuler le retrait de", "Undo removal of")}{" "}
            {String(item.plan.displayName)}
          </Button>
        ))}
      {!Array.isArray(plansValue) && removed.some(item => item.root === root) && (
        <CatalogNote>{t("Restaurez d’abord le groupe tarifaire pour annuler le retrait de l’offre.", "Restore the pricing group first to undo the offer removal.")}</CatalogNote>
      )}
      {context.capabilities.canPublishAll && (
        <p>
          {t(
            "Si cette offre utilise le même prix dans l’autre langue, modifier son prix met aussi cette version à jour. Les noms et descriptions restent indépendants.",
            "If this offer uses the same price in the other language, editing its price also updates that version. Names and descriptions stay independent.",
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
    <CatalogSettings
      flush
      summary={catalogText(context, "Détails de l’offre", "Offer details")}
    >
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
    </CatalogSettings>
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
  if (!comparison.plan) {
    const plans = catalogPlanRows(context.value).map(row => row.plan);
    const paidWithoutReference = plans.some(plan => plan.priceStatus === "paid");
    const freeOnly = plans.length > 0 && plans.every(plan => plan.priceStatus === "free" || (plan.priceStatus == null && plan.isFree === true));
    return (
      <CatalogNote>
        {paidWithoutReference
          ? t("Choisissez une offre payante éligible comme prix de référence avant publication. Aucun prix historique n’est utilisé.", "Choose an eligible paid offer as the price reference before publishing. No historical price is used.")
          : freeOnly ? t("Les offres renseignées sont gratuites ; aucun prix historique n’est utilisé.", "The recorded offers are free; no historical price is used.")
          : hasExplicitNonNumericPricing(context.value)
          ? t(
              "Le prix actuel est sur devis, non communiqué ou dépend de l’usage. Aucun montant historique de repli n’est affiché.",
              "The current price is quoted, undisclosed or usage based. No historical fallback amount is displayed.",
            )
          : t(
              "Aucune offre de comparaison native retenue. Le prix historique reste un repli à vérifier dans les paramètres tarifaires.",
              "No native comparison offer selected. Historical pricing remains a fallback to verify in the pricing settings.",
            )}
      </CatalogNote>
    );
  }
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
    <div className={styles.provenance} role="note">
      <strong>
        {t("Prix de référence effectif :", "Effective comparison price:")}{" "}
        {String(plan.displayName)} · <span data-nowrap>{money(amount)}</span>
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
      {!["EUR", "USD", "GBP"].includes(String(plan.nativeCurrency)) && (
        <p>
          {t(
            "La comparaison normalisée en euros ne prend pas en charge cette devise ; le prix reste affiché dans sa devise native, sans conversion.",
            "Normalized euro comparison does not support this currency; the price stays in its native currency without conversion.",
          )}
        </p>
      )}
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
        {typeof plan.observedOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(plan.observedOn)
          ? <time data-nowrap dateTime={plan.observedOn}>{plan.observedOn}</time>
          : String(plan.observedOn || t("date à renseigner", "date not provided"))}
      </p>
    </div>
  );
}
