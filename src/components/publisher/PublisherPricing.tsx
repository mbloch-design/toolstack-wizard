import Button, { linkClass } from "@/ds/Button/Button";
import Field, { Checkbox, FormGrid, SelectField, TextAreaField } from "@/ds/Field/Field";
import { useLang } from "@/hooks/useLang";
import type { ProductDraft } from "@/lib/publisherCatalog";
import { pricePresentation, type PriceOption } from "@/lib/publisherPricing";
import styles from "./PublisherWorkspace.module.css";

type Plans = ProductDraft["plans"];
type FieldError = (path: string) => { id: string; error?: string };

export default function PublisherPricing({ plans, locale, update, field, allocate }: {
  plans: Plans;
  locale: "fr" | "en";
  update?: (plans: Plans) => void;
  field?: FieldError;
  allocate?: (planId?: string) => Promise<void>;
}) {
  const { t } = useLang();
  const shown = update ? plans : plans.filter((plan) => !plan.archived);
  function move(index: number, other: number) {
    const next = [...plans];
    [next[index], next[other]] = [next[other], next[index]];
    update?.(next);
  }
  return <div className={styles.fields}>
    {!shown.length && <p className={styles.muted}>{t("Aucune offre renseignée.", "No plans provided.")}</p>}
    <div className={styles.cards}>{shown.map((plan, index) => {
      const localeValues = plan.localized[locale];
      const change = (next: Partial<typeof plan>) => update?.(plans.map((row) => row.id === plan.id ? { ...row, ...next } : row));
      const changeLocale = (next: Partial<typeof localeValues>) => change({ localized: { ...plan.localized, [locale]: { ...localeValues, ...next } } });
      const path = `plans.${index}`;
      return <article className={styles.card} key={plan.id}>
        <h3>{localeValues.name || t("Offre sans nom", "Unnamed plan")}</h3>
        {update ? <>
          <Field label={t("Nom de l’offre", "Plan name")} {...field?.(`${path}.localized.${locale}.name`)}
            maxLength={100} value={localeValues.name} onChange={(event) => changeLocale({ name: event.target.value })} />
          <TextAreaField label={t("Résumé de l’offre", "Plan summary")} {...field?.(`${path}.localized.${locale}.summary`)}
            maxLength={1000} value={localeValues.summary ?? ""} onChange={(event) => changeLocale({ summary: event.target.value || null })} />
          <TextAreaField label={t("Ce qui est inclus", "What’s included")} {...field?.(`${path}.localized.${locale}.highlights`)}
            help={t("Une ligne par élément.", "One item per line.")} value={localeValues.highlights.join("\n")} onChange={(event) => changeLocale({ highlights: event.target.value.split("\n") })} />
          <Checkbox checked={plan.archived} label={t("Archiver cette offre", "Archive this plan")} onChange={(event) => change({ archived: event.target.checked })} />
          <div className={styles.actions}>
            <Button disabled={index === 0} onClick={() => move(index, index - 1)}>{t("Monter l’offre", "Move plan up")}</Button>
            <Button disabled={index + 1 === plans.length} onClick={() => move(index, index + 1)}>{t("Descendre l’offre", "Move plan down")}</Button>
          </div>
        </> : <>
          {localeValues.summary && <p>{localeValues.summary}</p>}
          {!!localeValues.highlights.length && <ul>{localeValues.highlights.filter(Boolean).map((item, index) => <li key={index}>{item}</li>)}</ul>}
        </>}
        {plan.options.map((option, optionIndex) => {
          const price = pricePresentation(option, locale);
          return update ? <div key={option.id} className={styles.fields}>
            <h4>{t(`Tarif ${optionIndex + 1}`, `Price ${optionIndex + 1}`)}</h4>
            <PriceFields value={option} field={(key) => field?.(`${path}.options.${optionIndex}.${key}`) ?? {}}
              update={(next) => change({ options: plan.options.map((row) => row.id === option.id ? { ...row, ...next } : row) })} />
            <div className={styles.actions}>
              <Button disabled={optionIndex === 0} onClick={() => {
                const options = [...plan.options];
                [options[optionIndex], options[optionIndex - 1]] = [options[optionIndex - 1], options[optionIndex]];
                change({ options });
              }}>{t("Monter le tarif", "Move price up")}</Button>
              <Button disabled={optionIndex + 1 === plan.options.length} onClick={() => {
                const options = [...plan.options];
                [options[optionIndex], options[optionIndex + 1]] = [options[optionIndex + 1], options[optionIndex]];
                change({ options });
              }}>{t("Descendre le tarif", "Move price down")}</Button>
              <Button variant="quiet" onClick={() => change({ options: plan.options.filter((row) => row.id !== option.id) })}>{t("Retirer ce tarif", "Remove this price")}</Button>
            </div>
          </div> : <div key={option.id}>
            <p><strong>{price.amountLabel}</strong> {price.billingLabel}{option.unit ? ` · ${option.unit}` : ""}{option.market ? ` · ${option.market}` : ""}</p>
            {option.sourceUrl && <a className={linkClass("inline")} target="_blank" rel="noreferrer" href={option.sourceUrl}>{t("Source du tarif", "Price source")}</a>}
          </div>;
        })}
        {allocate && <Button disabled={plan.options.length >= 12} onClick={() => void allocate(plan.id)}>{t("Ajouter un autre tarif", "Add a price")}</Button>}
      </article>;
    })}</div>
    {allocate && <div className={styles.actions}><Button disabled={plans.length >= 30} onClick={() => void allocate()}>{t("Ajouter une offre", "Add a plan")}</Button></div>}
  </div>;
}

function PriceFields({ value, field, update }: {
  value: PriceOption;
  field: (key: keyof PriceOption) => { id?: string; error?: string };
  update: (value: Partial<PriceOption>) => void;
}) {
  const { t } = useLang();
  const types = {
    free: t("Gratuit", "Free"), paid: t("Payant", "Paid"), quote: t("Sur devis", "On request"),
    usage: t("À l’usage", "Usage based"), unknown: t("À préciser", "Unknown"),
  };
  const periods = {
    month: t("Par mois", "Per month"), year: t("Par an", "Per year"),
    one_time: t("Une fois", "One time"), usage: t("À l’usage", "Usage based"),
  };
  const commitments = {
    none: t("Sans engagement", "No commitment"), monthly: t("Mensuel", "Monthly"),
    annual_prepaid: t("Annuel prépayé", "Annual prepaid"),
  };
  const taxes = { unknown: t("Non précisé", "Not provided"), included: t("Incluses", "Included"), excluded: t("Exclues", "Excluded") };
  return <FormGrid>
    <SelectField label={t("Type de tarif", "Price type")} {...field("type")} value={value.type}
      onChange={(event) => update({ type: event.target.value as PriceOption["type"] })}>
      {Object.entries(types).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </SelectField>
    {(value.type === "paid" || value.type === "usage") && <>
      <Field label={t("Montant facturé", "Amount charged")} {...field("amount")} inputMode="decimal" value={value.amount ?? ""}
        onChange={(event) => update({ amount: event.target.value.replace(",", ".") || null })} />
      <Field label={t("Devise", "Currency")} {...field("currency")} placeholder="EUR" maxLength={3} value={value.currency ?? ""}
        onChange={(event) => update({ currency: event.target.value.toUpperCase() || null })} />
      <SelectField label={t("Périodicité", "Billing period")} {...field("period")} value={value.period ?? ""}
        onChange={(event) => update({ period: (event.target.value || null) as PriceOption["period"] })}>
        <option value="">{t("Choisir", "Choose")}</option>
        {Object.entries(periods).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </SelectField>
      <Field label={t("Unité facturée", "Billing unit")} {...field("unit")} maxLength={80} value={value.unit ?? ""}
        placeholder={t("Ex. par utilisateur", "E.g. per user")} onChange={(event) => update({ unit: event.target.value || null })} />
      <SelectField label={t("Engagement", "Commitment")} {...field("commitment")} value={value.commitment ?? ""}
        onChange={(event) => update({ commitment: (event.target.value || null) as PriceOption["commitment"] })}>
        <option value="">{t("Choisir", "Choose")}</option>
        {Object.entries(commitments).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </SelectField>
      <SelectField label={t("Taxes", "Taxes")} {...field("tax")} value={value.tax}
        onChange={(event) => update({ tax: event.target.value as PriceOption["tax"] })}>
        {Object.entries(taxes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </SelectField>
    </>}
    <Field label={t("Marché", "Market")} {...field("market")} placeholder="FR" maxLength={2} value={value.market ?? ""}
      onChange={(event) => update({ market: event.target.value.toUpperCase() || null })} />
    <Field label={t("Langue du tarif", "Price language")} {...field("offerLocale")} placeholder="fr-FR" maxLength={6} value={value.offerLocale ?? ""}
      onChange={(event) => update({ offerLocale: event.target.value || null })} />
    <Field label={t("Page des tarifs", "Pricing page")} {...field("sourceUrl")} type="url" value={value.sourceUrl ?? ""}
      onChange={(event) => update({ sourceUrl: event.target.value || null })} />
    <Field label={t("Date du relevé", "Date observed")} {...field("observedOn")} type="date" max={new Date().toISOString().slice(0, 10)} value={value.observedOn ?? ""}
      onChange={(event) => update({ observedOn: event.target.value || null })} />
  </FormGrid>;
}
