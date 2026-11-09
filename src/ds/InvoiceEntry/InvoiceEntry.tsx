import { useEffect, useId, useState } from "react";
import { CURRENCY_RATE_DATE, convertAmount, formatAmount, type Currency } from "@/lib/currencyRates";
import { parseInvoiceAmount } from "@/lib/invoiceAmount";
import Button from "../Button/Button";
import styles from "./InvoiceEntry.module.css";

/** A monthly invoice total, kept in its original currency until explicitly saved. */
export default function InvoiceEntry({ currency, lang, onSave, onPreview }: {
  currency: Currency; lang: "fr" | "en";
  onSave: (amount: number, invoiceCurrency: Currency) => void;
  onPreview: (monthly: number | null) => void;
}) {
  const en = lang === "en";
  const [value, setValue] = useState("");
  const [invoiceCurrency, setInvoiceCurrency] = useState<Currency>(currency);
  const amount = parseInvoiceAmount(value, lang);
  const monthly = amount === null ? null : convertAmount(amount, invoiceCurrency, currency);
  const help = useId();
  useEffect(() => { onPreview(monthly); }, [monthly, onPreview]);
  return <form className={styles.entry} data-invoice="" onSubmit={event => { event.preventDefault(); if (amount !== null) onSave(amount, invoiceCurrency); }}>
    <div className={styles.field}>
      <label className={styles.amount}>
        <input inputMode="decimal" autoComplete="off" placeholder="0" value={value} onChange={event => setValue(event.target.value)}
          aria-label={en ? `Monthly billed amount (${invoiceCurrency})` : `Montant mensuel facturé (${invoiceCurrency})`}
          aria-describedby={help} aria-invalid={value.trim() !== "" && amount === null ? true : undefined} />
        <span aria-hidden>{en ? "/ mo" : "/ mois"}</span>
      </label>
      <label className={styles.currency}><span className={styles.caption}>{en ? "Invoice currency" : "Devise de facture"}</span>
        <select aria-label={en ? "Invoice currency" : "Devise de facture"} value={invoiceCurrency} onChange={event => setInvoiceCurrency(event.target.value as Currency)}>
          {(["EUR", "USD", "GBP"] as const).map(code => <option key={code} value={code}>{code}</option>)}
        </select>
      </label>
      <Button type="submit" variant="primary" disabled={amount === null}>{en ? "Save" : "Enregistrer"}</Button>
    </div>
    <p className={styles.note} id={help}>{value.trim() !== "" && amount === null
      ? (en ? "Enter a valid amount with at most two decimals." : "Saisissez un montant valide avec deux décimales maximum.")
      : monthly !== null && invoiceCurrency !== currency
        ? `${formatAmount(amount!, invoiceCurrency, lang)}${en ? "/mo" : "/mois"} ≈ ${formatAmount(monthly, currency, lang)}${en ? "/mo in your budget" : "/mois dans votre budget"}. ${en ? "Reference rate" : "Taux de référence"} ${CURRENCY_RATE_DATE} (${invoiceCurrency} → ${currency}).`
        : (en ? "Total billed each month, all users included." : "Total facturé chaque mois, tous les utilisateurs inclus.")}</p>
  </form>;
}
