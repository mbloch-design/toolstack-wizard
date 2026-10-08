import { useState } from "react";
import { Minus, Plus } from "@/lib/icons";
import Collapse from "@/components/motion/Collapse";
import Segmented from "@/components/motion/Segmented";
import ValueChange from "@/components/motion/ValueChange";
import type { Tool, ToolPricingPlan } from "@/data/types";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import type { PlanChoice } from "@/hooks/useStackPaidPlans";
import { convertAmount, formatAmount, isCurrency, type Currency } from "@/lib/currencyRates";
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
const CHECK = <span className="ms-ce-check" aria-hidden="true"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>;

export default function StackCostEditor({ tool, detail, initial, entryLabel, entryNative, currency, lang, freemium, onSave, onCancel }: Props) {
  const en = lang === "en";
  const slug = toolKey(tool);
  const plans = usablePlans(detail && detail.id === tool.id ? detail : null, lang);
  const [draft, setDraft] = useState<CostDraft>(initial);
  const savedCustom = initial.kind === "choice" && initial.choice.source === "custom" ? initial.choice : null;
  const [amount, setAmount] = useState(savedCustom ? String(savedCustom.amount).replace(".", en ? "." : ",") : "");
  const [period, setPeriod] = useState<"monthly" | "annual">(savedCustom?.period || "monthly");
  // The invoice's own currency: what the person pays is often billed in dollars.
  const [entryCurrency, setEntryCurrency] = useState<Currency>(savedCustom?.currency || currency);
  const picked = draft.kind === "choice" ? draft.choice : null;
  const seats = picked?.perSeat ? Math.max(1, picked.seats || 1) : null;
  const shownSeats = seats ?? 1;
  // The counter rolls in the direction of the change; at one seat, "−" says no.
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [refused, setRefused] = useState(0);
  const dirty = !sameDraft(draft, initial);

  function pickPlan(plan: ToolPricingPlan) {
    const perSeat = SEAT_UNITS.test(plan.pricingUnit || "");
    setDraft({ kind: "choice", choice: { source: "plan", label: plan.displayName, amount: plan.nativeAmount as number, currency: plan.nativeCurrency as Currency, period: plan.billingPeriod as "monthly" | "annual", perSeat, seats: perSeat ? shownSeats : undefined } });
    setAmount("");
  }
  function typeAmount(value: string, nextPeriod = period, nextCurrency = entryCurrency) {
    setAmount(value);
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed) && parsed > 0) setDraft({ kind: "choice", choice: { source: "custom", amount: Math.round(parsed * 100) / 100, currency: nextCurrency, period: nextPeriod } });
    else if (picked?.source === "custom") setDraft({ kind: "entry" });
  }
  function changeSeats(delta: 1 | -1) {
    if (!picked) return;
    if (shownSeats + delta < 1) { setRefused((n) => n + 1); return; }
    setDirection(delta > 0 ? "up" : "down");
    setDraft({ kind: "choice", choice: { ...picked, seats: shownSeats + delta } });
  }
  function save() {
    if (dirty) trackEvent("stack_cost_save", { tool_slug: slug, kind: draft.kind, source: draft.kind === "choice" ? draft.choice.source : undefined });
    onSave(draft);
  }

  // What saving would change, before saving.
  const preview = draft.kind === "free" ? (en ? "Free version" : "Version gratuite")
    : draft.kind === "entry" ? entryLabel || (en ? "Price not checked" : "Prix non relevé")
    : (() => { const monthly = monthlyFromChoice(draft.choice); return monthly === null ? "" : `≈ ${formatAmount(Math.round(convertAmount(monthly, draft.choice.currency, currency)), currency, lang)}${en ? "/mo" : "/mois"}`; })();
  const symbol = (code: Currency) => code === "EUR" ? "€" : code === "GBP" ? "£" : "$";

  return (
    <div className="ms-cost-editor">
      {(plans.length > 0 || freemium) && <div className="ms-ce-block">
        <p className="ms-ce-label">{en ? "Plan" : "Offre"}</p>
        <div className="ms-ce-plans" role="radiogroup" aria-label={en ? "Plan" : "Offre"}>
          {freemium && <button type="button" role="radio" aria-checked={draft.kind === "free"} className="ms-ce-plan" onClick={() => { setDraft({ kind: "free" }); setAmount(""); }}>
            <strong>{en ? "Free version" : "Version gratuite"}</strong><b className="ms-ce-amount">{formatNativePrice({ amount: 0, currency, period: "monthly" }, lang)}</b><small>{en ? "No subscription" : "Aucun abonnement"}</small>{CHECK}
          </button>}
          {plans.map((plan) => {
            // The plan the catalogue entry price comes from: checked while the
            // cost is still the entry plan, so the base of the figure is visible.
            const isEntry = !!entryNative && plan.nativeAmount === entryNative.amount && plan.nativeCurrency === entryNative.currency && plan.billingPeriod === entryNative.period;
            const on = (picked?.source === "plan" && picked.label === plan.displayName) || (draft.kind === "entry" && isEntry);
            return <button key={plan.planKey} type="button" role="radio" aria-checked={on} className="ms-ce-plan" onClick={() => pickPlan(plan)}>
              {(() => {
                // A price list: name and amount on the first line (amounts line
                // up for comparison), conditions quieter under the name.
                const [, ...terms] = (stackPlanPrice(plan, lang) || "").split(" · ");
                const amount = formatNativePrice({ amount: plan.nativeAmount as number, currency: plan.nativeCurrency as string, period: plan.billingPeriod as "monthly" | "annual" }, lang);
                return <>
                  <strong>{plan.displayName}</strong>
                  <b className="ms-ce-amount">{amount}</b>
                  {(terms.length > 0 || isEntry) && <small>{[isEntry ? (en ? "entry level" : "entrée de gamme") : null, ...terms].filter(Boolean).join(" · ")}</small>}
                </>;
              })()}{CHECK}
            </button>;
          })}
        </div>
      </div>}

      {/* Seats open in height when a per-user plan is picked: nothing jumps. */}
      <Collapse open={seats !== null}>
        <div className="ms-ce-block ms-ce-seats">
          <p className="ms-ce-label">{en ? "Users" : "Utilisateurs"}</p>
          {/* Two alternating names replay the "no" shake without remounting
              the stepper, so keyboard focus stays on the button. */}
          <div className="ms-ce-stepper" data-refused={refused === 0 ? undefined : refused % 2 ? "a" : "b"}>
            <button type="button" aria-label={en ? "One user less" : "Un utilisateur de moins"} aria-disabled={shownSeats <= 1} onClick={() => changeSeats(-1)}><Minus size={16} aria-hidden /></button>
            <output aria-live="polite"><ValueChange value={shownSeats} direction={direction}>{shownSeats}</ValueChange></output>
            <button type="button" aria-label={en ? "One user more" : "Un utilisateur de plus"} onClick={() => changeSeats(1)}><Plus size={16} aria-hidden /></button>
          </div>
        </div>
      </Collapse>

      <div className="ms-ce-block">
        <label className="ms-ce-label" htmlFor={`ms-ce-amount-${slug}`}>{plans.length > 0 || freemium ? (en ? "Or the billed amount" : "Ou le montant facturé") : (en ? "Billed amount" : "Montant facturé")}</label>
        <div className="ms-ce-custom">
          <span className="ms-ce-input">
            <input id={`ms-ce-amount-${slug}`} type="text" inputMode="decimal" placeholder="12" value={amount}
              onChange={(event) => typeAmount(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") save(); }} />
          </span>
          <Segmented className="ms-ce-currency" ariaLabel={en ? "Currency" : "Devise"} value={entryCurrency}
            options={(["EUR", "USD", "GBP"] as const).map((code) => ({ value: code, ariaLabel: code, label: symbol(code) }))}
            onChange={(code) => { setEntryCurrency(code); if (amount) typeAmount(amount, period, code); }} />
          <Segmented ariaLabel={en ? "Billing" : "Facturation"} value={period}
            options={[{ value: "monthly", label: en ? "Monthly" : "Mensuel" }, { value: "annual", label: en ? "Yearly" : "Annuel" }]}
            onChange={(value) => { setPeriod(value); if (amount) typeAmount(amount, value); }} />
        </div>
      </div>

      <Collapse open={draft.kind !== "entry"}>
        <button type="button" className="ms-ce-reset" onClick={() => { setDraft({ kind: "entry" }); setAmount(""); }}>
          {entryLabel ? (en ? "Back to the catalogue entry level" : "Revenir à l’entrée de gamme du catalogue") : (en ? "Clear the amount" : "Effacer le montant")}
        </button>
      </Collapse>

      {/* The commit: a preview of the new cost, then Cancel or Save. */}
      <div className="ms-ce-foot">
        <p className="ms-ce-preview" aria-live="polite">
          <span>{dirty ? (en ? "New monthly cost" : "Nouveau coût mensuel") : (en ? "Monthly cost" : "Coût mensuel")}</span>
          <strong><ValueChange value={preview}>{preview}</ValueChange></strong>
        </p>
        <div className="ms-ce-actions">
          <button type="button" className="ms-ce-cancel" onClick={onCancel}>{en ? "Cancel" : "Annuler"}</button>
          <button type="button" className="tt-button-primary ms-ce-save" onClick={save}>{en ? "Save" : "Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
}
