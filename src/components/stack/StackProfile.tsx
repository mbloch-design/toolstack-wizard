import { useState } from "react";
import { Pencil } from "@/lib/icons";
import Button from "@/ds/Button/Button";
import styles from "./StackProfile.module.css";
import Drawer, { DrawerDescription, DrawerTitle } from "@/ds/Drawer/Drawer";
import Field, { SelectField } from "@/ds/Field/Field";
import { formatAmount } from "@/lib/currencyRates";
import { TRADES, type Trade } from "@/lib/personalStack";
import { useStackTrade } from "@/hooks/useStackTrade";
import { TRADE_LABELS } from "@/components/stack/StackPersonalWelcome";

/**
 * The person's profile on their dashboard (M01, 14/11/2026, Michael: « ça doit être éditable »): their trade and
 * day rate in one quiet button, opened into the site's side panel. Saved as they type, in the personal stack:
 * it follows the account and prices their time across the page.
 */
export default function StackProfile({ lang }: { lang: "fr" | "en" }) {
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const { trade, setTrade, dailyRate, setDailyRate } = useStackTrade();
  const [open, setOpen] = useState(false);
  const [rate, setRate] = useState(dailyRate ? String(dailyRate.amount) : "");
  const currency = dailyRate?.currency ?? "EUR";
  const summary = [trade && t(...TRADE_LABELS[trade]), dailyRate && t(`${formatAmount(dailyRate.amount, currency, lang)}/jour`, `${formatAmount(dailyRate.amount, currency, lang)}/day`)].filter(Boolean).join(" · ");
  const saveRate = (value: string) => {
    setRate(value);
    const amount = Number(value.replace(",", "."));
    if (!value.trim()) setDailyRate(null);
    else if (Number.isFinite(amount) && amount >= 1 && amount <= 100000) setDailyRate({ amount: Math.round(amount), currency });
  };
  return <>
    <button type="button" className={styles.pill} onClick={() => { setRate(dailyRate ? String(dailyRate.amount) : ""); setOpen(true); }}
      aria-label={summary ? t(`Modifier mon profil : ${summary}`, `Edit my profile: ${summary}`) : t("Renseigner mon métier et mon prix jour", "Add my trade and day rate")}>
      <span>{summary || t("Mon métier, mon prix jour", "My trade, my day rate")}</span><Pencil aria-hidden />
    </button>
    <Drawer open={open} onClose={() => setOpen(false)} closeLabel={t("Fermer", "Close")}>
      <DrawerTitle>{t("Mon profil", "My profile")}</DrawerTitle>
      <DrawerDescription>{t("Votre prix jour transforme votre budget en temps de travail. Rien n'est partagé.", "Your day rate turns your budget into working time. Nothing is shared.")}</DrawerDescription>
      <SelectField label={t("Mon métier", "My trade")} value={trade ?? ""} onChange={(event) => setTrade((event.target.value || null) as Trade | null)}>
        <option value="">{t("Non précisé", "Not set")}</option>
        {TRADES.map((id) => <option key={id} value={id}>{t(...TRADE_LABELS[id])}</option>)}
      </SelectField>
      <Field label={t(`Mon prix jour (${currency})`, `My day rate (${currency})`)} inputMode="numeric" value={rate} onChange={(event) => saveRate(event.target.value)}
        help={t("Sur une journée de 7 heures.", "On a 7-hour day.")} placeholder="400" />
      <Button variant="primary" onClick={() => setOpen(false)}>{t("Terminé", "Done")}</Button>
    </Drawer>
  </>;
}
