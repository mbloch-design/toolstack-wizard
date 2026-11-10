import type { ReactNode } from "react";
import { Button } from "@/ds/Controls/Controls";
import styles from "@/ds/CatalogRecordWorkspace/CatalogRecordWorkspace.module.css";
import { CirclePlus } from "@/lib/icons";
import { catalogPlanSchema } from "@/lib/catalogFieldRegistry";
import { CatalogFieldEditor } from "./CatalogFieldEditor";
import { ComparisonPriceSummary, PlanActions, useOfferOperations } from "./CatalogPriceEditor";
import { canEdit, catalogText, catalogValueAt, record, type CatalogChange, type CatalogEditingValue } from "./catalogEditingModel";

function priceType(plan: Record<string, unknown>) {
  return typeof plan.priceStatus === "string" && plan.priceStatus ? plan.priceStatus :
    plan.isFree ? "free" : Number(plan.nativeAmount) > 0 ? "paid" : "unknown";
}

function offerPrice(plan: Record<string, unknown>, lang: "fr" | "en") {
  const type = priceType(plan);
  const t = (fr: string, en: string) => lang === "fr" ? fr : en;
  if (type === "free") return t("Gratuit", "Free");
  if (type === "quote") return t("Sur devis", "On request");
  if (!(Number(plan.nativeAmount) > 0) || type === "unknown")
    return type === "usage" ? t("Selon l’usage", "Usage-based") : t("Prix non communiqué", "Price not disclosed");
  const amount = new Intl.NumberFormat(lang).format(Number(plan.nativeAmount));
  const periods: Record<string, string> = {
    month: t("mois", "month"), monthly: t("mois", "month"),
    year: t("an", "year"), annual: t("an", "year"),
    week: t("semaine", "week"), day: t("jour", "day"),
    quarterly: t("trimestre", "quarter"), usage: t("usage", "usage"),
  };
  const period = periods[String(plan.billingPeriod)];
  const oneTime = ["one_time", "one-time"].includes(String(plan.billingPeriod));
  const payment = plan.billingCommitment === "annual_prepaid" ? t(" · Facturé à l’année", " · Billed annually") :
    oneTime ? t(" · Paiement unique", " · One-time payment") : "";
  const units: Record<string, string> = {
    seat: t("par siège", "per seat"), user: t("par utilisateur", "per user"),
    workspace: t("par espace", "per workspace"), team: t("par équipe", "per team"),
    project: t("par projet", "per project"), transaction: t("par transaction", "per transaction"),
  };
  const rawUnit = typeof plan.pricingUnit === "string" ? plan.pricingUnit.trim() : "";
  const unit = rawUnit ? units[rawUnit] ?? rawUnit : "";
  return [amount, typeof plan.nativeCurrency === "string" ? plan.nativeCurrency : "", period ? "/ " + period : "", unit]
    .filter(Boolean).join(" ") + payment;
}

export function CatalogOfferWorkspace({ context, activeEditor, start, renderEditor, currency }: {
  context: CatalogEditingValue;
  activeEditor: string | null;
  start: (id: string, initial?: CatalogChange[]) => void;
  renderEditor: (id: string, content: (staged: CatalogEditingValue) => ReactNode) => ReactNode;
  currency: string;
}) {
  const lang = context.lang ?? "fr";
  const t = (fr: string, en: string) => catalogText(context, fr, en);
  const root = lang === "en" ? "pricing_v5En" : "pricing_v5";
  const path = [root, "plans"];
  const raw = catalogValueAt(context.value, path);
  const plans: unknown[] = Array.isArray(raw) ? raw : [];
  const operations = useOfferOperations(context);
  const allowed = canEdit(context, path);
  const newId = "offer:new";
  function controls(staged: CatalogEditingValue, index: number) {
    const plan = catalogValueAt(staged.value, [...path, index]);
    if (!record(plan)) return null;
    const type = priceType(plan);
    const fields = ["displayName", "priceStatus"];
    if (type === "paid" || type === "usage") fields.push("nativeAmount", "nativeCurrency", "pricingUnit");
    if (type === "paid") fields.push("billingPeriod", "billingCommitment");
    fields.push("summary", "featureHighlights");
    const seen = new Set([...fields, "isFree", "nativeAmount", "nativeCurrency", "pricingUnit", "billingPeriod", "billingCommitment"]);
    const input = (key: string) => <CatalogFieldEditor key={key} context={staged}
      path={[...path, index, key]} schema={catalogPlanSchema.children?.[key]} />;
    return <>
      <p className={styles.note}>{offerPrice(plan, lang)}</p>
      {fields.map(input)}
      <details className={styles.form}>
        <summary className={styles.label}>{t("Référence et source du prix", "Price reference and source")}</summary>
        <div className={styles.form}>{Object.keys(catalogPlanSchema.children ?? {}).filter((key) => !seen.has(key)).map(input)}</div>
      </details>
      {staged.capabilities.canPublishAll && <p className={styles.note}>{t(
        "Les faits d’un prix lié sont aussi mis à jour dans l’autre langue. Les textes restent indépendants.",
        "Linked price facts also update in the other language. Text stays independent.",
      )}</p>}
    </>;
  }
  return <>
    <div className={styles.cardHeader}>
      <p className={styles.note}>{t("Les offres suivent l’ordre de la fiche publique dans cette langue.", "Offers follow the public record order in this language.")}</p>
      {allowed && <Button variant="primary" icon={<CirclePlus />} disabled={!!activeEditor} onClick={() => start(newId, [{
        path,
        value: [...plans, {
          planKey: `offer-${crypto.randomUUID()}`, displayName: "",
          nativeAmount: null, nativeCurrency: currency, priceStatus: "unknown",
          isFree: false, isComparePlan: false,
        }],
      }])}>{t("Ajouter une offre", "Add an offer")}</Button>}
    </div>
    {!plans.length && activeEditor !== newId && <p className={styles.note}>{t("Aucune offre renseignée.", "No offers yet.")}</p>}
    {plans.map((plan, index) => {
      if (!record(plan)) return null;
      const key = typeof plan.planKey === "string" && plans.filter((item) => record(item) && item.planKey === plan.planKey).length === 1 ? plan.planKey : String(index);
      const id = "offer:" + key;
      const name = typeof plan.displayName === "string" && plan.displayName ? plan.displayName : t("Offre sans nom", "Unnamed offer");
      return <div className={styles.card} key={id}>
        <div className={styles.cardHeader}>
          <div><h3 className={styles.label}>{name}</h3><p className={styles.note}>{offerPrice(plan, lang)}</p></div>
          {allowed && <span hidden={activeEditor === id}><Button size="compact" disabled={!!activeEditor} onClick={() => start(id)}
            aria-label={t("Modifier ", "Edit ") + name}>{t("Modifier", "Edit")}</Button></span>}
        </div>
        {activeEditor === id ? renderEditor(id, (staged) => controls(staged, index)) :
          allowed && <PlanActions context={context} root={root} index={index} onRemove={operations.remove} disabled={!!activeEditor} labelled />}
      </div>;
    })}
    {activeEditor === newId && <div className={styles.card}>
      <h3 className={styles.label}>{t("Nouvelle offre", "New offer")}</h3>
      {renderEditor(newId, (staged) => controls(staged, plans.length))}
    </div>}
    {allowed && operations.removed.filter((item) => item.root === root).map((item, index) =>
      <div className={styles.actions} key={String(item.plan.planKey) + index}>
        <Button size="compact" disabled={!!activeEditor} onClick={() => operations.undo(item)}>
          {t("Annuler le retrait de", "Undo removal of")} {String(item.plan.displayName)}
        </Button>
      </div>)}
    <ComparisonPriceSummary context={context} currency={currency} />
  </>;
}
