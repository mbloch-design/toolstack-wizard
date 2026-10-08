import { useState } from "react";
import { Check, Minus, Plus } from "@/lib/icons";
import Collapse from "@/components/motion/Collapse";
import ValueChange from "@/components/motion/ValueChange";
import type { Tool, ToolPricingPlan } from "@/data/types";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import type { PlanChoice } from "@/hooks/useStackPaidPlans";
import { isCurrency, type Currency } from "@/lib/currencyRates";
import { stackPlanPrice, toolKey } from "@/lib/stackView";
import { trackEvent } from "@/lib/analytics";

/**
 * « Ajuster mon coût », dans la feuille outil de Ma stack (point 1 du recul
 * produit, 8 oct. 2026) : rendre le chiffre juste. Trois façons, de la plus
 * guidée à la plus libre :
 * - un plan du catalogue (montant natif, sans conversion inventée) ;
 * - son nombre de places, quand le plan est facturé par utilisateur ;
 * - ce que la personne paie vraiment, dans la devise affichée, au mois ou à
 *   l'année. C'est la réponse quand le catalogue n'a pas le bon prix.
 * Tout s'applique tout de suite, et « Revenir à l'offre d'entrée » annule.
 */

const SEAT_UNITS = /seat|utilisateur|membre|collaborateur|per user/i;

interface Props {
  tool: ToolSummary;
  detail?: ToolSummary | Tool | null;
  choice?: PlanChoice;
  currency: Currency;
  lang: "fr" | "en";
  onChange: (choice: PlanChoice | null) => void;
  onFree?: () => void;
  freemium: boolean;
  /** Freemium declared paid at its entry plan (switch on, no plan picked). */
  paidAtEntry?: boolean;
}

export function usablePlans(detail: ToolSummary | Tool | null | undefined, lang: string): ToolPricingPlan[] {
  const full = detail as Tool | null | undefined;
  const plans: ToolPricingPlan[] = (lang === "en" ? full?.pricing_v5En?.plans : null) || full?.pricing_v5?.plans || [];
  return plans.filter((plan) => !plan.isFree && !plan.comingSoon && plan.nativeAmount != null && plan.nativeAmount > 0
    && !!plan.nativeCurrency && isCurrency(plan.nativeCurrency) && (plan.billingPeriod === "monthly" || plan.billingPeriod === "annual"));
}

export default function StackCostEditor({ tool, detail, choice, currency, lang, onChange, onFree, freemium, paidAtEntry }: Props) {
  const en = lang === "en";
  const plans = usablePlans(detail && detail.id === tool.id ? detail : null, lang);
  const [amount, setAmount] = useState(choice?.source === "custom" ? String(choice.amount) : "");
  const [period, setPeriod] = useState<"monthly" | "annual">(choice?.source === "custom" ? choice.period : "monthly");
  // The invoice's own currency: what the person pays is often billed in dollars.
  const [entryCurrency, setEntryCurrency] = useState<Currency>(choice?.source === "custom" ? choice.currency : currency);
  const slug = toolKey(tool);

  function pickPlan(plan: ToolPricingPlan) {
    const perSeat = SEAT_UNITS.test(plan.pricingUnit || "");
    onChange({ source: "plan", label: plan.displayName, amount: plan.nativeAmount as number, currency: plan.nativeCurrency as Currency, period: plan.billingPeriod as "monthly" | "annual", perSeat, seats: perSeat ? Math.max(1, choice?.seats || 1) : undefined });
    trackEvent("stack_cost_plan", { tool_slug: slug, plan: plan.planKey });
  }
  function applyCustom(value: string, nextPeriod: "monthly" | "annual", nextCurrency: Currency = entryCurrency) {
    const parsed = Number(value.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onChange({ source: "custom", amount: Math.round(parsed * 100) / 100, currency: nextCurrency, period: nextPeriod });
    trackEvent("stack_cost_custom", { tool_slug: slug, period: nextPeriod, currency: nextCurrency });
  }
  const seats = choice?.perSeat ? Math.max(1, choice.seats || 1) : null;
  const shownSeats = seats ?? 1;

  return (
    <div className="ms-cost-editor">
      {(plans.length > 0 || freemium) && <div className="ms-ce-block">
        <p className="ms-ce-label">{en ? "My plan" : "Mon plan"}</p>
        <div className="ms-ce-plans" role="radiogroup" aria-label={en ? "My plan" : "Mon plan"}>
          {freemium && onFree && <button type="button" role="radio" aria-checked={!choice && !paidAtEntry} className="ms-ce-plan" onClick={() => { onChange(null); onFree(); }}>
            <strong>{en ? "Free plan" : "Gratuit"}</strong><small>{en ? "I don’t pay" : "Je ne paie pas"}</small>
            <span className="ms-ce-check" aria-hidden="true"><Check size={16} /></span>
          </button>}
          {plans.map((plan) => {
            const on = choice?.source === "plan" && choice.label === plan.displayName;
            return <button key={plan.planKey} type="button" role="radio" aria-checked={on} className="ms-ce-plan" onClick={() => pickPlan(plan)}>
              <strong>{plan.displayName}</strong><small>{stackPlanPrice(plan, lang) || ""}</small>
              <span className="ms-ce-check" aria-hidden="true"><Check size={16} /></span>
            </button>;
          })}
        </div>
      </div>}

      {/* Seats open in height when a per-user plan is picked: nothing jumps. */}
      <Collapse open={seats !== null}>
        <div className="ms-ce-block ms-ce-seats">
          <p className="ms-ce-label">{en ? "Seats" : "Places"}</p>
          <div className="ms-ce-stepper">
            <button type="button" aria-label={en ? "One seat less" : "Une place de moins"} disabled={shownSeats <= 1} onClick={() => choice && onChange({ ...choice, seats: shownSeats - 1 })}><Minus size={16} aria-hidden /></button>
            <output aria-live="polite"><ValueChange value={shownSeats}>{shownSeats}</ValueChange></output>
            <button type="button" aria-label={en ? "One seat more" : "Une place de plus"} onClick={() => choice && onChange({ ...choice, seats: shownSeats + 1 })}><Plus size={16} aria-hidden /></button>
          </div>
        </div>
      </Collapse>

      <div className="ms-ce-block">
        <label className="ms-ce-label" htmlFor={`ms-ce-amount-${slug}`}>{en ? "Or what I really pay" : "Ou ce que je paie vraiment"}</label>
        <div className="ms-ce-custom">
          <span className="ms-ce-input">
            <input id={`ms-ce-amount-${slug}`} type="text" inputMode="decimal" placeholder="12" value={amount}
              onChange={(event) => setAmount(event.target.value)}
              onBlur={() => applyCustom(amount, period)}
              onKeyDown={(event) => { if (event.key === "Enter") applyCustom(amount, period); }} />
          </span>
          <div className="ms-size-switch ms-ce-currency" role="group" aria-label={en ? "Currency" : "Devise"}>
            {(["EUR", "USD", "GBP"] as const).map((code) => (
              <button key={code} type="button" aria-pressed={entryCurrency === code} aria-label={code}
                onClick={() => { setEntryCurrency(code); if (amount) applyCustom(amount, period, code); }}>
                {code === "EUR" ? "€" : code === "GBP" ? "£" : "$"}
              </button>
            ))}
          </div>
          <div className="ms-size-switch" role="group" aria-label={en ? "Billing period" : "Période"}>
            {(["monthly", "annual"] as const).map((value) => (
              <button key={value} type="button" aria-pressed={period === value} onClick={() => { setPeriod(value); if (amount) applyCustom(amount, value); }}>
                {value === "monthly" ? (en ? "per month" : "par mois") : (en ? "per year" : "par an")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Collapse open={!!choice}>
        <button type="button" className="ms-ce-reset" onClick={() => { onChange(null); setAmount(""); trackEvent("stack_cost_reset", { tool_slug: slug }); }}>
          {en ? "Back to the catalogue entry plan" : "Revenir à l’offre d’entrée du catalogue"}
        </button>
      </Collapse>
    </div>
  );
}
