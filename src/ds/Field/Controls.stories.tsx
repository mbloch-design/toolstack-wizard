import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Field from "./Field";
import Segmented from "../Segmented/Segmented";
import Stepper from "../Stepper/Stepper";
import Switch from "../Switch/Switch";

const meta: Meta = { title: "Molécules/Contrôles", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);

function All({ lang }: { lang: Lang }) {
  const [on, setOn] = useState(true);
  const [seats, setSeats] = useState(1);
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP">("USD");
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const [amount, setAmount] = useState("120,12");
  return <div style={{ display: "grid", gap: 28, maxWidth: 520 }}>
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Switch checked={on} onChange={setOn} label={t(lang, "Abonnement payant", "Paid subscription")} />
      <Switch checked={false} onChange={() => {}} label={t(lang, "Indisponible", "Unavailable")} disabled />
    </div>
    <Stepper value={seats} onChange={setSeats} label={t(lang, "Utilisateurs", "Users")} lessLabel={t(lang, "Un de moins", "One less")} moreLabel={t(lang, "Un de plus", "One more")} />
    <Field label={t(lang, "Ou le montant facturé", "Or the billed amount")} value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal"
      after={<>
        <Segmented label={t(lang, "Devise de facture", "Invoice currency")} value={currency} onChange={setCurrency} options={[{ value: "EUR", label: "€" }, { value: "USD", label: "$" }, { value: "GBP", label: "£" }]} />
        <Segmented label={t(lang, "Facturation", "Billing")} value={period} onChange={setPeriod} options={[{ value: "monthly", label: t(lang, "Mensuel", "Monthly") }, { value: "annual", label: t(lang, "Annuel", "Yearly") }]} />
      </>} />
    <Field label={t(lang, "Montant facturé", "Billed amount")} value="-1" onChange={() => {}} error={t(lang, "Saisissez un montant facturé valide, y compris zéro si rien n’est facturé.", "Enter a valid billed amount, including zero if nothing is charged.")} />
  </div>;
}

/** Switch, stepper (« − » refuses below one with a shake), a field with its currency and period, a field in error. */
export const Controls: Story = { render: (_a, { globals: { lang } }) => <All lang={lang} /> };
