import { useState } from "react";
import ToolLogo from "@/components/ToolLogo";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { convertAmount, CURRENCY_RATE_DATE, formatAmount, type Currency } from "@/lib/currencyRates";
import { toolMonthlyCost } from "@/lib/stackCost";
import { toolKey } from "@/lib/stackView";
import { AREA_COLORS, type Territory } from "@/components/stack/StackAreaBoard";

/**
 * « 02 / Budget, où part l'argent ? » de Ma stack : l'anneau de répartition
 * des pages Stack (sg-donut, sg-storage-legend), appliqué à ma stack.
 * Par outil (teintes monochromes, comme les pages Stack) ou par domaine (les
 * couleurs des bulles). Mêmes règles que le reste de la page : offres
 * d'entrée attestées, freemium à 0 sauf « Je paie », total converti au taux
 * daté et affiché comme converti (Michael, 7 oct. 2026).
 */

interface Props {
  territories: Territory[];
  isPaid: (slug: string) => boolean;
  currency: Currency;
  lang: "fr" | "en";
  onSelect: (slug: string) => void;
}

type Line = { id: string; label: string; amount: number; tool?: ToolSummary; color?: string };

export default function StackBudgetBreakdown({ territories, isPaid, currency, lang, onSelect }: Props) {
  const en = lang === "en";
  const rateDate = new Intl.DateTimeFormat(en ? "en-US" : "fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${CURRENCY_RATE_DATE}T00:00:00`));
  const [view, setView] = useState<"tool" | "area">("tool");
  const [focus, setFocus] = useState<string | null>(null);
  const money = (amount: number) => formatAmount(Math.round(amount), currency, lang);

  const tools = [...new Map(territories.flatMap((t) => t.tools).map((tool) => [tool.id, tool])).values()];
  const monthly = (tool: ToolSummary) => {
    const cost = toolMonthlyCost(tool, isPaid, lang);
    return cost.kind === "paid" ? convertAmount(cost.monthly, cost.currency, currency) : 0;
  };
  const toolLines: Line[] = tools.map((tool) => ({ id: tool.id, label: tool.name, amount: monthly(tool), tool }))
    .filter((line) => line.amount > 0).sort((a, b) => b.amount - a.amount);
  const areaLines: Line[] = territories.map((t, i) => ({ id: t.id, label: t.label, amount: t.tools.reduce((sum, tool) => sum + monthly(tool), 0), color: AREA_COLORS[i % AREA_COLORS.length] }))
    .filter((line) => line.amount > 0).sort((a, b) => b.amount - a.amount);
  const lines = view === "tool" ? toolLines : areaLines;
  const total = toolLines.reduce((sum, line) => sum + line.amount, 0);
  const notCounted = tools.filter((tool) => monthly(tool) === 0);
  const freemiumFree = notCounted.filter((tool) => toolMonthlyCost(tool, isPaid, lang).kind === "freemium-free").length;
  const shade = (i: number) => (lines.length > 1 ? 1 - (i / (lines.length - 1)) * 0.72 : 1);
  const top = toolLines[0];

  if (!total) return null;
  const r = 76, c = 2 * Math.PI * r, gap = 3;
  let offset = 0;
  const focused = lines.find((line) => line.id === focus);

  return (
    <section className="sg-section ms-section" aria-labelledby="ms-budget-title">
      <div className="sg-section-heading"><span className="sg-eyebrow">02 / Budget</span><h2 id="ms-budget-title">{en ? "Where does the money go?" : "Où part l’argent ?"}</h2></div>
      <div className="sg-budget-card">
        <div className="sg-budget-figures">
          <div className="sg-budget-figure sg-budget-figure--target">
            <span>{en ? "Estimated monthly cost" : "Coût mensuel estimé"}</span>
            <strong>≈ {money(total)}</strong>
            <small>{en ? `per month, ${toolLines.length} paid tool${toolLines.length > 1 ? "s" : ""}, converted to ${currency}` : `par mois, ${toolLines.length} outil${toolLines.length > 1 ? "s" : ""} payant${toolLines.length > 1 ? "s" : ""}, converti en ${currency}`}</small>
          </div>
          {top && <div className="sg-budget-figure">
            <span>{en ? "Biggest line" : "Premier poste"}</span>
            <strong>{Math.round((top.amount / total) * 100)} %</strong>
            <small>{en ? `of the budget is ${top.label}` : `du budget pour ${top.label}`}</small>
          </div>}
        </div>
        <div className="sg-budget-switch" role="tablist" aria-label={en ? "Breakdown" : "Répartition"}>
          {([["tool", en ? "By tool" : "Par outil"], ["area", en ? "By area" : "Par domaine"]] as const).map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={view === key} className="sg-budget-switch-tab" onClick={() => { setView(key); setFocus(null); }}>{label}</button>
          ))}
        </div>
        <div className="sg-budget-viz sg-budget-viz--share" onMouseLeave={() => setFocus(null)}>
          <svg className="sg-donut" viewBox="0 0 200 200" role="img" aria-label={en ? `Monthly cost breakdown: about ${money(total)}` : `Répartition du coût mensuel : environ ${money(total)}`}>
            <g transform="rotate(-90 100 100)">
              {lines.map((line, i) => {
                const len = (line.amount / total) * c;
                const seg = <circle key={line.id} cx="100" cy="100" r={r} fill="none" strokeWidth="26"
                  className={`sg-donut-seg${focus && focus !== line.id ? " is-dim" : ""}${focus === line.id ? " is-focus" : ""}`}
                  style={line.color ? { stroke: line.color } : { opacity: shade(i) }}
                  strokeDasharray={`${Math.max(0.5, len - gap)} ${c}`} strokeDashoffset={-offset}
                  onMouseEnter={() => setFocus(line.id)}><title>{`${line.label} · ≈ ${money(line.amount)} (${Math.round((line.amount / total) * 100)} %)`}</title></circle>;
                offset += len;
                return seg;
              })}
            </g>
            <text x="100" y="96" textAnchor="middle" className="sg-donut-value">≈ {money(focused ? focused.amount : total)}</text>
            <text x="100" y="118" textAnchor="middle" className="sg-donut-label">{focused ? `${focused.label} · ${Math.round((focused.amount / total) * 100)} %` : (en ? "per month" : "par mois")}</text>
          </svg>
          <ul className="sg-storage-legend">
            {lines.map((line, i) => (
              <li key={line.id} className={[focus === line.id ? "is-focus" : "", focus && focus !== line.id ? "is-dim" : ""].filter(Boolean).join(" ") || undefined} onMouseEnter={() => setFocus(line.id)}>
                <span className="sg-storage-dot" style={line.color ? { background: line.color } : { opacity: shade(i) }} aria-hidden />
                {line.tool ? <ToolLogo tool={line.tool} size={24} className="sg-budget-logo" /> : null}
                {line.tool
                  ? <button type="button" className="sg-budget-name ms-budget-link" onClick={() => onSelect(toolKey(line.tool!))}>{line.label}</button>
                  : <span className="sg-budget-name">{line.label}</span>}
                <span className="sg-budget-value">≈ {money(line.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="sg-budget-note">
          {en
            ? `Entry plans from the catalogue, not your invoices. Converted to ${currency} at the site's rate of ${rateDate}. ${notCounted.length} tool${notCounted.length > 1 ? "s" : ""} not counted${freemiumFree > 0 ? `, including ${freemiumFree} freemium counted as free (mark the ones you pay in By use)` : ""}.`
            : `Offres d’entrée du catalogue, pas vos factures. Converti en ${currency} au taux du ${rateDate}. ${notCounted.length} outil${notCounted.length > 1 ? "s" : ""} non compté${notCounted.length > 1 ? "s" : ""}${freemiumFree > 0 ? `, dont ${freemiumFree} freemium comptés gratuits (indiquez ceux que vous payez dans Par usage)` : ""}.`}
        </p>
      </div>
    </section>
  );
}
