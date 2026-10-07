import { useState } from "react";
import ToolLogo from "@/components/ToolLogo";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { convertAmount, CURRENCY_RATE_DATE, formatAmount, type Currency } from "@/lib/currencyRates";
import { toolMonthlyCost } from "@/lib/stackCost";
import { toolKey } from "@/lib/stackView";
import type { Territory } from "@/components/stack/StackAreaBoard";

/**
 * Tuile Budget du tableau de bord Ma stack : l'anneau de répartition des pages
 * Stack (sg-donut, sg-storage-legend), sur le périmètre choisi dans la carte
 * des usages (toute la stack ou un domaine), toujours par outil : le poids
 * par domaine, ce sont les bulles (taille = coût), pas une deuxième vue de
 * l'anneau. Les outils freemium se déclarent ici
 * (« Je paie ») : c'est un réglage du budget. Mêmes règles que le reste de la
 * page : offres d'entrée attestées, freemium à 0 sauf « Je paie », total
 * converti au taux daté et affiché comme converti (Michael, 7 oct. 2026).
 */

interface Props {
  territories: Territory[];
  paid: { isPaid: (slug: string) => boolean; setPaid: (slug: string, value: boolean) => void };
  currency: Currency;
  lang: "fr" | "en";
  onSelect: (slug: string) => void;
  declareOpen: boolean;
  onDeclareOpen: (open: boolean) => void;
}

type Line = { id: string; label: string; amount: number; tool: ToolSummary };
const LEGEND_MAX = 6;

export default function StackBudgetBreakdown({ territories, paid, currency, lang, onSelect, declareOpen, onDeclareOpen }: Props) {
  const en = lang === "en";
  const rateDate = new Intl.DateTimeFormat(en ? "en-US" : "fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${CURRENCY_RATE_DATE}T00:00:00`));
  const [focus, setFocus] = useState<string | null>(null);
  const money = (amount: number) => formatAmount(Math.round(amount), currency, lang);

  const tools = [...new Map(territories.flatMap((t) => t.tools).map((tool) => [tool.id, tool])).values()];
  const monthly = (tool: ToolSummary) => {
    const cost = toolMonthlyCost(tool, paid.isPaid, lang);
    return cost.kind === "paid" ? convertAmount(cost.monthly, cost.currency, currency) : 0;
  };
  const toolLines: Line[] = tools.map((tool) => ({ id: tool.id, label: tool.name, amount: monthly(tool), tool }))
    .filter((line) => line.amount > 0).sort((a, b) => b.amount - a.amount);
  const lines = toolLines;
  const total = toolLines.reduce((sum, line) => sum + line.amount, 0);
  const freemium = tools.filter((tool) => {
    const kind = toolMonthlyCost(tool, paid.isPaid, lang).kind;
    return kind === "freemium-free" || (kind === "paid" && paid.isPaid(toolKey(tool)));
  }).sort((a, b) => a.name.localeCompare(b.name, lang));
  const undeclared = tools.filter((tool) => toolMonthlyCost(tool, paid.isPaid, lang).kind === "freemium-free").length;
  const unknown = tools.filter((tool) => toolMonthlyCost(tool, paid.isPaid, lang).kind === "unknown").length;
  const shade = (i: number) => (lines.length > 1 ? 1 - (i / (lines.length - 1)) * 0.72 : 1);
  const r = 76, c = 2 * Math.PI * r, gap = 3;
  let offset = 0;
  const focused = lines.find((line) => line.id === focus);
  const shown = lines.slice(0, LEGEND_MAX);
  const rest = lines.slice(LEGEND_MAX);

  return (
    <section id="ms-budget" className="ms-tile ms-budget-tile" aria-labelledby="ms-budget-title">
      <header className="ms-tile-head">
        <div>
          <h2 id="ms-budget-title">{en ? "Budget" : "Budget"}</h2>
          <p>{total > 0
            ? (en ? `Where the money goes, ${toolLines.length} paid tool${toolLines.length > 1 ? "s" : ""}` : `Où part l’argent, ${toolLines.length} outil${toolLines.length > 1 ? "s" : ""} payant${toolLines.length > 1 ? "s" : ""}`)
            : (en ? "Nothing paid here" : "Rien de payant ici")}</p>
        </div>
      </header>
      {total > 0 && <div className="sg-budget-viz sg-budget-viz--share" onMouseLeave={() => setFocus(null)}>
        <svg className="sg-donut" viewBox="0 0 200 200" role="img" aria-label={en ? `Monthly cost breakdown: about ${money(total)}` : `Répartition du coût mensuel : environ ${money(total)}`}>
          <g transform="rotate(-90 100 100)">
            {lines.map((line, i) => {
              const len = (line.amount / total) * c;
              const seg = <circle key={line.id} cx="100" cy="100" r={r} fill="none" strokeWidth="26"
                className={`sg-donut-seg${focus && focus !== line.id ? " is-dim" : ""}${focus === line.id ? " is-focus" : ""}`}
                style={{ opacity: shade(i) }}
                strokeDasharray={`${Math.max(0.5, len - gap)} ${c}`} strokeDashoffset={-offset}
                onMouseEnter={() => setFocus(line.id)}><title>{`${line.label} · ≈ ${money(line.amount)} (${Math.round((line.amount / total) * 100)} %)`}</title></circle>;
              offset += len;
              return seg;
            })}
          </g>
          <text x="100" y="96" textAnchor="middle" className="sg-donut-value">≈ {money(focused ? focused.amount : total)}</text>
          <text x="100" y="118" textAnchor="middle" className="sg-donut-label">{focused ? `${Math.round((focused.amount / total) * 100)} %` : (en ? "per month" : "par mois")}</text>
        </svg>
        <ul className="sg-storage-legend">
          {shown.map((line, i) => (
            <li key={line.id} className={[focus === line.id ? "is-focus" : "", focus && focus !== line.id ? "is-dim" : ""].filter(Boolean).join(" ") || undefined} onMouseEnter={() => setFocus(line.id)}>
              <span className="sg-storage-dot" style={{ opacity: shade(i) }} aria-hidden />
              <ToolLogo tool={line.tool} size={24} className="sg-budget-logo" />
              <button type="button" className="sg-budget-name ms-budget-link" onClick={() => onSelect(toolKey(line.tool))}>{line.label}</button>
              <span className="sg-budget-value">≈ {money(line.amount)}</span>
            </li>
          ))}
          {rest.length > 0 && <li className="ms-budget-rest"><span aria-hidden /><span aria-hidden /><span className="sg-budget-name">{en ? `${rest.length} more` : `${rest.length} autre${rest.length > 1 ? "s" : ""}`}</span><span className="sg-budget-value">≈ {money(rest.reduce((sum, line) => sum + line.amount, 0))}</span></li>}
        </ul>
      </div>}
      {freemium.length > 0 && <details className="ms-declare" open={declareOpen} onToggle={(event) => onDeclareOpen((event.currentTarget as HTMLDetailsElement).open)}>
        <summary>{undeclared > 0
          ? (en ? `${undeclared} freemium counted as free. Do you pay for one?` : `${undeclared} freemium compté${undeclared > 1 ? "s" : ""} gratuit${undeclared > 1 ? "s" : ""}. Vous en payez un ?`)
          : (en ? "Freemium plans you declared" : "Les freemium que vous avez déclarés")}</summary>
        <ul>
          {freemium.map((tool) => {
            const on = paid.isPaid(toolKey(tool));
            return <li key={tool.id}>
              <ToolLogo tool={tool} size={22} />
              <span>{tool.name}</span>
              <button type="button" className={`ms-plan-switch${on ? " is-paid" : ""}`} aria-pressed={on}
                title={on ? (en ? "Counted at its entry paid plan" : "Compté à son offre payante d’entrée") : (en ? "Counted as free" : "Compté comme gratuit")}
                onClick={() => paid.setPaid(toolKey(tool), !on)}>
                {on ? (en ? "I pay" : "Je paie") : (en ? "Free use" : "Usage gratuit")}
              </button>
            </li>;
          })}
        </ul>
      </details>}
      <p className="ms-tile-note">
        {en
          ? `Catalogue entry plans, not your invoices. Converted to ${currency} at the site's rate of ${rateDate}.${unknown > 0 ? ` ${unknown} without a checked price.` : ""}`
          : `Offres d’entrée du catalogue, pas vos factures. Converti en ${currency} au taux du ${rateDate}.${unknown > 0 ? ` ${unknown} sans prix relevé.` : ""}`}
      </p>
    </section>
  );
}
