import { useState } from "react";
import { Moon, Rocket, Zap } from "@/lib/icons";
import Button, { TextButton } from "@/ds/Button/Button";
import Choice, { Choices, IconTile } from "@/ds/Choice/Choice";
import Field from "@/ds/Field/Field";
import { Collapse } from "@/ds/Motion/Motion";
import Segmented from "@/ds/Segmented/Segmented";
import Stepper from "@/ds/Stepper/Stepper";
import CostEditorLayout, { EditorBlock } from "@/ds/ToolSheet/CostEditor";
import type { Tool, ToolPricingPlan } from "@/data/types";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import type { PlanChoice } from "@/hooks/useStackPaidPlans";
import { convertAmount, CURRENCY_RATE_DATE, formatAmount, isCurrency, type Currency } from "@/lib/currencyRates";
import { parseInvoiceAmount } from "@/lib/invoiceAmount";
import { monthlyFromChoice } from "@/lib/stackCost";
import { formatNativePrice, stackPlanPrice, toolKey } from "@/lib/stackView";
import { trackEvent } from "@/lib/analytics";

/**
 * « Modifier ce que je paie », dans la feuille outil de Ma stack : un
 * formulaire, pas des réglages instantanés (Michael, 8 oct. 2026). Les choix
 * forment un brouillon : plan du catalogue (montant natif), places pour un
 * plan par utilisateur, ou montant réellement payé (devise et période). Un
 * aperçu dit le nouveau coût ; rien ne change dans la stack avant
 * « Enregistrer », et « Annuler » (ou fermer la feuille) abandonne.
 */

const SEAT_UNITS = /seat|utilisateur|membre|collaborateur|per user/i;

/** What the person will pay once saved. */
export type CostDraft = { kind: "entry" } | { kind: "free" } | { kind: "choice"; choice: PlanChoice };

interface Props {
  tool: ToolSummary;
  detail?: ToolSummary | Tool | null;
  /** Saved state the draft starts from. */
  initial: CostDraft;
  /** Monthly cost of the catalogue entry plan, already formatted (or null). */
  entryLabel: string | null;
  /** The catalogue entry price, to recognise its plan in the list. */
  entryNative?: { amount: number; currency: string; period: string } | null;
  currency: Currency;
  lang: "fr" | "en";
  freemium: boolean;
  onSave: (draft: CostDraft) => void;
  onCancel: () => void;
}

export function usablePlans(detail: ToolSummary | Tool | null | undefined, lang: string): ToolPricingPlan[] {
  const full = detail as Tool | null | undefined;
  const plans: ToolPricingPlan[] = (lang === "en" ? full?.pricing_v5En?.plans : null) || full?.pricing_v5?.plans || [];
  return plans.filter((plan) => !plan.isFree && !plan.comingSoon && plan.nativeAmount != null && plan.nativeAmount > 0
    && !!plan.nativeCurrency && isCurrency(plan.nativeCurrency) && (plan.billingPeriod === "monthly" || plan.billingPeriod === "annual"));
}

const sameDraft = (a: CostDraft, b: CostDraft) => JSON.stringify(a) === JSON.stringify(b);

export default function StackCostEditor({ tool, detail, initial, entryLabel, entryNative, currency, lang, freemium, onSave, onCancel }: Props) {
  const en = lang === "en";
  const slug = toolKey(tool);
  const plans = usablePlans(detail && detail.id === tool.id ? detail : null, lang);
  const [draft, setDraft] = useState<CostDraft>(initial);
  const savedCustom = initial.kind === "choice" && initial.choice.source === "custom" ? initial.choice : null;
  const [amount, setAmount] = useState(savedCustom ? String(savedCustom.amount).replace(".", en ? "." : ",") : "");
  const [customActive, setCustomActive] = useState(!!savedCustom);
  const invalidAmount = customActive && parseInvoiceAmount(amount, lang) === null;
  const [period, setPeriod] = useState<"monthly" | "annual">(savedCustom?.period || "monthly");
  // The invoice's own currency: what the person pays is often billed in dollars.
  const [entryCurrency, setEntryCurrency] = useState<Currency>(savedCustom?.currency || currency);
  const picked = draft.kind === "choice" ? draft.choice : null;
  const seats = picked?.perSeat ? Math.max(1, picked.seats || 1) : null;
  const shownSeats = seats ?? 1;
  const dirty = !sameDraft(draft, initial);

  function pickPlan(plan: ToolPricingPlan) {
    const perSeat = SEAT_UNITS.test(plan.pricingUnit || "");
    setDraft({ kind: "choice", choice: { source: "plan", label: plan.displayName, amount: plan.nativeAmount as number, currency: plan.nativeCurrency as Currency, period: plan.billingPeriod as "monthly" | "annual", perSeat, seats: perSeat ? shownSeats : undefined } });
    setAmount(""); setCustomActive(false);
  }
  function typeAmount(value: string, nextPeriod = period, nextCurrency = entryCurrency) {
    setAmount(value); setCustomActive(true);
    const parsed = parseInvoiceAmount(value, lang);
    if (parsed !== null) setDraft({ kind: "choice", choice: { source: "custom", amount: parsed, currency: nextCurrency, period: nextPeriod } });
  }
  function setSeats(next: number) {
    if (!picked) return;
    setDraft({ kind: "choice", choice: { ...picked, seats: next } });
  }
  function save() {
    if (invalidAmount) return;
    if (dirty) trackEvent("stack_cost_save", { tool_slug: slug, kind: draft.kind, source: draft.kind === "choice" ? draft.choice.source : undefined });
    onSave(draft);
  }

  // What saving would change, before saving.
  const preview = invalidAmount ? (en ? "Amount not saved" : "Montant non enregistré") : draft.kind === "free" ? (en ? "Free version" : "Version gratuite")
    : draft.kind === "entry" ? entryLabel || (en ? "Price not checked" : "Prix non relevé")
    : (() => { const monthly = monthlyFromChoice(draft.choice); return monthly === null ? "" : `${draft.choice.currency !== currency ? "≈ " : ""}${formatAmount(convertAmount(monthly, draft.choice.currency, currency), currency, lang)}${en ? "/mo" : "/mois"}`; })();
  const monthlyNative = draft.kind === "choice" ? monthlyFromChoice(draft.choice) : null;
  const converted = !invalidAmount && draft.kind === "choice" && draft.choice.currency !== currency && monthlyNative !== null;
  const number = (value: number, digits = 2) => new Intl.NumberFormat(en ? "en-US" : "fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  const symbol = (code: Currency) => code === "EUR" ? "€" : code === "GBP" ? "£" : "$";

  const maxPlan = Math.max(0, ...plans.map((plan) => plan.nativeAmount as number));
  return (
    <CostEditorLayout
      blocks={<>
        {(plans.length > 0 || freemium) && <EditorBlock label={en ? "Plan" : "Offre"}>
          <Choices radio label={en ? "Plan" : "Offre"}>
            {freemium && <Choice role="radio" media={<IconTile><Moon /></IconTile>} name={en ? "Free version" : "Version gratuite"} note={en ? "No subscription" : "Aucun abonnement"}
              amount={formatNativePrice({ amount: 0, currency, period: "monthly" }, lang)} state={draft.kind === "free" ? "kept" : undefined} checked={draft.kind === "free"}
              onClick={() => { setDraft({ kind: "free" }); setAmount(""); setCustomActive(false); }} />}
            {plans.map((plan) => {
              // The plan the catalogue entry price comes from: checked while the
              // cost is still the entry plan, so the base of the figure is visible.
              const isEntry = !!entryNative && plan.nativeAmount === entryNative.amount && plan.nativeCurrency === entryNative.currency && plan.billingPeriod === entryNative.period;
              const on = (picked?.source === "plan" && picked.label === plan.displayName) || (draft.kind === "entry" && isEntry);
              // A price list: name and amount on the first line, conditions quieter under the name.
              const [, ...terms] = (stackPlanPrice(plan, lang) || "").split(" · ");
              const PlanIcon = (plan.nativeAmount as number) >= maxPlan && plans.length > 1 ? Rocket : Zap;
              return <Choice key={plan.planKey} role="radio" media={<IconTile><PlanIcon /></IconTile>} name={plan.displayName}
                note={[isEntry ? (en ? "entry level" : "entrée de gamme") : null, ...terms].filter(Boolean).join(" · ") || undefined}
                amount={formatNativePrice({ amount: plan.nativeAmount as number, currency: plan.nativeCurrency as string, period: plan.billingPeriod as "monthly" | "annual" }, lang)}
                state={on ? "kept" : undefined} checked={on} onClick={() => pickPlan(plan)} />;
            })}
          </Choices>
        </EditorBlock>}

        {/* Seats open in height when a per-user plan is picked: nothing jumps. */}
        <Collapse open={seats !== null}>
          <EditorBlock label={en ? "Users" : "Utilisateurs"}>
            <Stepper value={shownSeats} onChange={setSeats} label={en ? "Users" : "Utilisateurs"} lessLabel={en ? "One user less" : "Un utilisateur de moins"} moreLabel={en ? "One user more" : "Un utilisateur de plus"} />
          </EditorBlock>
        </Collapse>

        <Field id={`ms-ce-amount-${slug}`} label={plans.length > 0 || freemium ? (en ? "Or the billed amount" : "Ou le montant facturé") : (en ? "Billed amount" : "Montant facturé")}
          type="text" inputMode="decimal" placeholder="12" value={amount} onChange={(event) => typeAmount(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); save(); } }}
          error={invalidAmount ? (en ? "Enter a valid billed amount, including zero if nothing is charged." : "Saisissez un montant facturé valide, y compris zéro si rien n’est facturé.") : undefined}
          after={<>
            <Segmented label={en ? "Invoice currency" : "Devise de facture"} value={entryCurrency}
              options={(["EUR", "USD", "GBP"] as const).map((code) => ({ value: code, ariaLabel: code, label: symbol(code) }))}
              onChange={(code) => { setEntryCurrency(code); if (amount) typeAmount(amount, period, code); }} />
            <Segmented label={en ? "Billing" : "Facturation"} value={period}
              options={[{ value: "monthly" as const, label: en ? "Monthly" : "Mensuel" }, { value: "annual" as const, label: en ? "Yearly" : "Annuel" }]}
              onChange={(value) => { setPeriod(value); if (amount) typeAmount(amount, value); }} />
          </>} />

        <Collapse open={draft.kind !== "entry"}>
          <TextButton tone="quiet" onClick={() => { setDraft({ kind: "entry" }); setAmount(""); setCustomActive(false); }}>
            {entryLabel ? (en ? "Back to the catalogue entry level" : "Revenir à l’entrée de gamme du catalogue") : (en ? "Clear the amount" : "Effacer le montant")}
          </TextButton>
        </Collapse>
      </>}
      previewLabel={dirty ? (en ? "New monthly cost" : "Nouveau coût mensuel") : (en ? "Monthly cost" : "Coût mensuel")}
      preview={preview}
      previewNote={converted && draft.kind === "choice" ? `${number(monthlyNative!)} ${draft.choice.currency}${en ? "/mo" : "/mois"} ≈ ${number(convertAmount(monthlyNative!, draft.choice.currency, currency))} ${currency}${en ? "/mo" : "/mois"} · ${en ? "Reference rate of" : "Taux de référence du"} ${CURRENCY_RATE_DATE} (1 ${draft.choice.currency} ≈ ${number(convertAmount(1, draft.choice.currency, currency), 4)} ${currency}).` : undefined}
      actions={<>
        <Button variant="quiet" onClick={onCancel}>{en ? "Cancel" : "Annuler"}</Button>
        <Button variant="primary" disabled={invalidAmount} onClick={save}>{en ? "Save" : "Enregistrer"}</Button>
      </>} />
  );
}
