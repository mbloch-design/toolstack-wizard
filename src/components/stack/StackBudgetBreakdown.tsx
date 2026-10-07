import { useState } from "react";
import ToolLogo from "@/components/ToolLogo";
import { ChevronLeft } from "@/lib/icons";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { convertAmount, CURRENCY_RATE_DATE, formatAmount, type Currency } from "@/lib/currencyRates";
import { toolMonthlyCost } from "@/lib/stackCost";
import { stackCatalogPrice, toolKey } from "@/lib/stackView";
import { AREA_COLORS, type Territory } from "@/lib/stackAreas";

/**
 * Tuile Budget du tableau de bord Ma stack : l'anneau de répartition des pages
 * Stack (sg-donut, sg-storage-legend). Par domaine ou par outil ; un clic sur
 * un domaine zoome l'anneau sur ses outils (zoom local : il ne filtre pas le
 * reste de la page, qui le précède en partie). Les outils freemium se déclarent dans
 * la fenêtre Freemium, que la note du budget rouvre (« Modifier »). Mêmes règles que le
 * reste de la page : offres d'entrée attestées, freemium à 0 sauf « Je paie », total
 * converti au taux daté et affiché comme converti (Michael, 7 oct. 2026).
 */

interface Props {
  territories: Territory[];
  /** Colour index of each area in the whole stack, so a filtered area keeps its colour. */
  colorOf: (id: string) => string;
  paid: { isPaid: (slug: string) => boolean; setPaid: (slug: string, value: boolean) => void };
  currency: Currency;
  lang: "fr" | "en";
  onSelect: (slug: string) => void;
  /** Opens the freemium question, where plans are declared. */
  onFreemium: () => void;
}

type Line = { id: string; label: string; amount: number; tool?: ToolSummary; color?: string };
const LEGEND_MAX = 6;

export default function StackBudgetBreakdown({ territories: all, colorOf, paid, currency, lang, onSelect, onFreemium }: Props) {
  const en = lang === "en";
  const rateDate = new Intl.DateTimeFormat(en ? "en-US" : "fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${CURRENCY_RATE_DATE}T00:00:00`));
  const [view, setView] = useState<"tool" | "area">("area");
  const [focus, setFocus] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const zoomed = all.find((t) => t.id === zoom) || null;
  const territories = zoomed ? [zoomed] : all;
  const onChooseArea = (id: string) => { setZoom(id); setFocus(null); };
  const money = (amount: number) => formatAmount(Math.round(amount), currency, lang);

  const tools = [...new Map(territories.flatMap((t) => t.tools).map((tool) => [tool.id, tool])).values()];
  const monthly = (tool: ToolSummary) => {
    const cost = toolMonthlyCost(tool, paid.isPaid, lang);
    return cost.kind === "paid" ? convertAmount(cost.monthly, cost.currency, currency) : 0;
  };
  const toolLines: Line[] = tools.map((tool) => ({ id: tool.id, label: tool.name, amount: monthly(tool), tool }))
    .filter((line) => line.amount > 0).sort((a, b) => b.amount - a.amount);
  const areaLines: Line[] = territories.map((t) => ({ id: t.id, label: t.label, amount: t.tools.reduce((sum, tool) => sum + monthly(tool), 0), color: colorOf(t.id) }))
    .filter((line) => line.amount > 0).sort((a, b) => b.amount - a.amount);
  // One paid area makes a full circle that says nothing: go by tool then.
  const byArea = view === "area" && areaLines.length > 1;
  const lines = byArea ? areaLines : toolLines;
  const total = toolLines.reduce((sum, line) => sum + line.amount, 0);
  const freemiumCount = tools.filter((tool) => stackCatalogPrice(tool, lang) === "Freemium").length;
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
          <h2 id="ms-budget-title">{en ? "Where the money goes" : "Où part l’argent"}</h2>
          <p>{zoomed ? zoomed.label : total > 0
            ? (en ? `${toolLines.length} paid tool${toolLines.length > 1 ? "s" : ""}` : `${toolLines.length} outil${toolLines.length > 1 ? "s" : ""} payant${toolLines.length > 1 ? "s" : ""}`)
            : (en ? "Nothing paid yet" : "Rien de payant pour l’instant")}</p>
        </div>
        {zoomed
          ? <button type="button" className="ms-zoom-back" onClick={() => { setZoom(null); setFocus(null); }}><ChevronLeft size={16} aria-hidden />{en ? "All areas" : "Tous les domaines"}</button>
          : total > 0 && areaLines.length > 1 && <div className="ms-size-switch" role="group" aria-label={en ? "Breakdown" : "Répartition"}>
            {([["area", en ? "Areas" : "Domaines"], ["tool", en ? "Tools" : "Outils"]] as const).map(([key, label]) => (
              <button key={key} type="button" aria-pressed={view === key} onClick={() => { setView(key); setFocus(null); }}>{label}</button>
            ))}
          </div>}
      </header>
      {total > 0 && <div className="sg-budget-viz sg-budget-viz--share" onMouseLeave={() => setFocus(null)}>
        <svg className="sg-donut" viewBox="0 0 200 200" role="img" aria-label={en ? `Monthly cost breakdown: about ${money(total)}` : `Répartition du coût mensuel : environ ${money(total)}`}>
          <g transform="rotate(-90 100 100)">
            {lines.map((line, i) => {
              const len = (line.amount / total) * c;
              const seg = <circle key={line.id} cx="100" cy="100" r={r} fill="none" strokeWidth="26"
                className={`sg-donut-seg${focus && focus !== line.id ? " is-dim" : ""}${focus === line.id ? " is-focus" : ""}`}
                style={line.color ? { stroke: line.color } : { opacity: shade(i) }}
                strokeDasharray={`${Math.max(0.5, len - gap)} ${c}`} strokeDashoffset={-offset}
                onMouseEnter={() => setFocus(line.id)} onClick={byArea ? () => onChooseArea(line.id) : undefined}><title>{`${line.label} · ≈ ${money(line.amount)} (${Math.round((line.amount / total) * 100)} %)`}</title></circle>;
              offset += len;
              return seg;
            })}
          </g>
          <text x="100" y="96" textAnchor="middle" className="sg-donut-value">≈ {money(focused ? focused.amount : total)}</text>
          <text x="100" y="118" textAnchor="middle" className="sg-donut-label">{focused ? `${Math.round((focused.amount / total) * 100)} %` : (en ? "per month" : "par mois")}</text>
        </svg>
        <ul className="sg-storage-legend">
          {shown.map((line, i) => (
            <li key={line.id} className={[line.tool ? "" : "ms-budget-area", focus === line.id ? "is-focus" : "", focus && focus !== line.id ? "is-dim" : ""].filter(Boolean).join(" ") || undefined} onMouseEnter={() => setFocus(line.id)}>
              <span className="sg-storage-dot" style={line.color ? { background: line.color } : { opacity: shade(i) }} aria-hidden />
              {line.tool && <ToolLogo tool={line.tool} size={24} className="sg-budget-logo" />}
              {line.tool
                ? <button type="button" className="sg-budget-name ms-budget-link" onClick={() => onSelect(toolKey(line.tool!))}>{line.label}</button>
                : <button type="button" className="sg-budget-name ms-budget-link" onClick={() => onChooseArea(line.id)} aria-label={en ? `Focus on ${line.label}` : `Zoomer sur ${line.label}`}>{line.label}</button>}
              <span className="sg-budget-value">≈ {money(line.amount)}</span>
            </li>
          ))}
          {rest.length > 0 && <li className="ms-budget-rest"><span aria-hidden /><span aria-hidden /><span className="sg-budget-name">{en ? `${rest.length} more` : `${rest.length} autre${rest.length > 1 ? "s" : ""}`}</span><span className="sg-budget-value">≈ {money(rest.reduce((sum, line) => sum + line.amount, 0))}</span></li>}
        </ul>
      </div>}
      <p className="ms-tile-note">
        {en
          ? `Catalogue entry plans, not your invoices. Converted to ${currency} at the site's rate of ${rateDate}.${unknown > 0 ? ` ${unknown} without a checked price.` : ""}`
          : `Offres d’entrée du catalogue, pas vos factures. Converti en ${currency} au taux du ${rateDate}.${unknown > 0 ? ` ${unknown} sans prix relevé.` : ""}`}
        {freemiumCount > 0 && <> {en ? `${undeclared} of ${freemiumCount} freemium counted as free.` : `${undeclared} freemium sur ${freemiumCount} comptés gratuits.`} <button type="button" className="ms-inline-link" onClick={onFreemium}>{en ? "Edit" : "Modifier"}</button></>}
      </p>
    </section>
  );
}
