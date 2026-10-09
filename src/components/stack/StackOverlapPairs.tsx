import { useState } from "react";
import { Link } from "@/lib/routerLinks";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ToolLogo from "@/components/ToolLogo";
import type { Category } from "@/data/types";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { comparisonPath } from "@/lib/comparisonLinks";
import { convertAmount, formatAmount, type Currency } from "@/lib/currencyRates";
import { toolMonthlyCost } from "@/lib/stackCost";
import { stackDisplayLabel, stackRelations } from "@/lib/stackUsage";
import { toolKey } from "@/lib/stackView";
import { trackEvent } from "@/lib/analytics";
import { decisionSavingInCurrency } from "@/lib/stackDecisions";
import { pairKey, type StackDecision } from "@/hooks/useStackDecisions";

/**
 * « 03 / Recoupements, ce qui fait doublon » de Ma stack : chaque paire
 * d'outils qui se recoupent (même règle que les cartes et le panneau :
 * alternative explicite ou usages communs du catalogue), ce qu'ils partagent,
 * ce que chacun coûte, et la comparaison. Aucune injonction de retirer :
 * garder les deux peut être un choix ; la personne décide.
 * Première section après le hero : c'est ce que la personne peut simplifier,
 * la promesse de ToolTrim. Masquée sans recoupement.
 * Chiffrée : quand les deux outils d'une paire sont payants, le moins cher
 * des deux est payé « en double » (même travail, deux abonnements). Les paires
 * se trient par ce montant ; le total ne compte chaque outil qu'une fois.
 */

interface Props {
  tools: ToolSummary[];
  categories: Category[];
  isPaid: (slug: string) => boolean;
  currency: Currency;
  prefix: string;
  lang: "fr" | "en";
  onSelect: (slug: string) => void;
  /** Decisions already taken (keep both, keep one, replace). */
  decisions: Record<string, StackDecision>;
  onDecide: (kind: "keep-both" | "keep-one", kept: ToolSummary, removed: ToolSummary, saving: number) => void;
  onReopen: (keys: string[]) => void;
}
const SHOWN = 4;

export type ScoredPair = { a: ToolSummary; b: ToolSummary; shared: string[]; explicit: boolean; double: number; cheaper: ToolSummary };

/**
 * Pairs of tools that overlap (explicit catalogue alternative or shared
 * catalogue uses), each with what is paid twice: when both are paid, the
 * cheaper one. Sorted by that amount. `doubleTotal` counts each tool once.
 * Shared by the hero figure and the Overlaps section so both say the same.
 * Pairs the person chose to keep both are left out.
 */
export function scoreOverlapPairs(tools: ToolSummary[], categories: Category[], isPaid: (slug: string) => boolean, currency: Currency, lang: "fr" | "en", decisions: Record<string, StackDecision> = {}) {
  const monthly = (tool: ToolSummary) => {
    const cost = toolMonthlyCost(tool, isPaid, lang);
    return cost.kind === "paid" ? convertAmount(cost.monthly, cost.currency, currency) : 0;
  };
  const pairs: ScoredPair[] = [];
  const seen = new Set<string>();
  for (const a of tools) {
    for (const relation of stackRelations(a, tools, categories, lang)) {
      if (!relation.explicit && relation.commonUses.length === 0) continue;
      const key = [a.id, relation.tool.id].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      // A pair the person decided to keep is no longer "to review" nor paid twice.
      if (decisions[pairKey(toolKey(a), toolKey(relation.tool))]?.kind === "keep-both") continue;
      const [ca, cb] = [monthly(a), monthly(relation.tool)];
      pairs.push({ a, b: relation.tool, shared: relation.commonUses, explicit: relation.explicit, double: ca > 0 && cb > 0 ? Math.min(ca, cb) : 0, cheaper: ca <= cb ? a : relation.tool });
    }
  }
  pairs.sort((x, y) => y.double - x.double || Number(y.explicit) - Number(x.explicit));
  const counted = new Set<string>();
  const doubleTotal = pairs.reduce((sum, pair) => {
    if (!pair.double || counted.has(pair.cheaper.id)) return sum;
    counted.add(pair.cheaper.id);
    return sum + pair.double;
  }, 0);
  return { pairs, doubleTotal };
}

export default function StackOverlapPairs({ tools, categories, isPaid, currency, prefix, lang, onSelect, decisions, onDecide, onReopen }: Props) {
  const en = lang === "en";
  const [all, setAll] = useState(false);
  const [deciding, setDeciding] = useState<string | null>(null);
  const { pairs: scored, doubleTotal } = scoreOverlapPairs(tools, categories, isPaid, currency, lang, decisions);
  const monthly = (tool: ToolSummary) => {
    const cost = toolMonthlyCost(tool, isPaid, lang);
    return cost.kind === "paid" ? convertAmount(cost.monthly, cost.currency, currency) : 0;
  };
  // Follow-up of past decisions: what is no longer paid, and pairs kept on purpose.
  const pinned = new Set(tools.map(toolKey));
  const keptBoth = Object.entries(decisions).filter(([key, d]) => d.kind === "keep-both" && key.split("|").every((slug) => pinned.has(slug))).map(([key]) => key);
  const pastSavings = Object.values(decisions).filter(d => d.kind !== "keep-both" && d.removed && !pinned.has(d.removed));
  const saved = pastSavings.reduce((sum, d) => sum + (decisionSavingInCurrency(d, currency) ?? 0), 0);
  const unknownSavings = pastSavings.some(d => d.saving > 0 && decisionSavingInCurrency(d, currency) === null);
  const costLabel = (tool: ToolSummary) => {
    const cost = toolMonthlyCost(tool, isPaid, lang);
    if (cost.kind === "paid") return `≈ ${formatAmount(Math.round(convertAmount(cost.monthly, cost.currency, currency)), currency, lang)}${en ? "/mo" : "/mois"}`;
    if (cost.kind === "free") return en ? "Free" : "Gratuit";
    if (cost.kind === "freemium-free") return en ? "Free version" : "Version gratuite";
    return en ? "Price not checked" : "Prix non relevé";
  };

  if (!scored.length && !keptBoth.length && saved <= 0 && !unknownSavings) return null;
  const money = (amount: number) => `≈ ${formatAmount(Math.round(amount), currency, lang)}${en ? "/mo" : "/mois"}`;

  return (
    <section id="ms-overlaps" className="sg-section ms-section ms-overlaps-section" aria-labelledby="ms-overlaps-section-title">
      <div className="sg-section-heading">
        <span className="sg-eyebrow">{en ? "Overlaps" : "Recoupements"}</span>
        <h2 id="ms-overlaps-section-title">{en ? "What may be doing the same job?" : "Qu’est-ce qui fait peut-être doublon ?"}</h2>
      </div>
      {scored.length === 0
        ? <p className="ms-section-lead">{en ? "Nothing left to review: every overlap has a decision." : "Plus rien à examiner : chaque recoupement a sa décision."}</p>
        : <p className="ms-section-lead">{en
        ? <>{scored.length} pair{scored.length > 1 ? "s" : ""} of tools may do the same job{doubleTotal > 0 && <>, <strong className="ms-double">{money(doubleTotal)} paid twice</strong> on catalogue entry plans</>}. Keeping both can be the right call: compare before deciding.</>
        : <>{scored.length} paire{scored.length > 1 ? "s" : ""} d’outils {scored.length > 1 ? "font" : "fait"} peut-être le même travail{doubleTotal > 0 && <>, soit <strong className="ms-double">{money(doubleTotal)} payés en double</strong> sur les offres d’entrée du catalogue</>}. Garder les deux peut être le bon choix : comparez avant de décider.</>}</p>}
      {(saved > 0 || keptBoth.length > 0 || unknownSavings) && <p className="ms-decided">
        {saved > 0 && <span className="ms-decided-saved">{en ? `Already ${money(saved)} lighter` : `Déjà ${money(saved)} en moins`}</span>}
        {unknownSavings && <span>{en ? "Recorded saving: currency unknown." : "Économie enregistrée : devise inconnue."}</span>}
        {keptBoth.length > 0 && <span>{en ? `${keptBoth.length} pair${keptBoth.length > 1 ? "s" : ""} kept on purpose.` : `${keptBoth.length} paire${keptBoth.length > 1 ? "s" : ""} gardée${keptBoth.length > 1 ? "s" : ""} volontairement.`} <button type="button" className="ms-inline-link" onClick={() => onReopen(keptBoth)}>{en ? "Review again" : "Revoir"}</button></span>}
      </p>}
      {scored.length > 0 && <div className="ms-pairs-panel">
      <ul className="ms-pairs">
        {(all ? scored : scored.slice(0, SHOWN)).map(({ a, b, shared, explicit, double }) => {
          const key = pairKey(toolKey(a), toolKey(b));
          const open = deciding === key;
          const why = shared.length > 0
            ? (en ? `Shared: ${shared.slice(0, 2).join(", ")}` : `En commun : ${shared.slice(0, 2).map((use) => stackDisplayLabel(use, lang)).join(", ")}`)
            : explicit ? (en ? "Catalogue alternatives" : "Alternatives au catalogue") : "";
          // One row per pair (iOS list): both icons, "A ⇄ B" with the reason
          // and both costs under it, what is paid twice, then the actions.
          return <li key={key} className="ms-pair ms-pair-row">
            {/* The only images of the list: two real app icons, the swap badge between them. */}
            <span className="ms-pair-icons" aria-hidden="true"><ToolLogo tool={a} size={44} /><span className="ms-pair-swap">⇄</span><ToolLogo tool={b} size={44} /></span>
            <span className="ms-pair-text">
              <span className="ms-pair-names">
                <button type="button" onClick={() => onSelect(toolKey(a))}>{a.name}</button>
                <span className="ms-pair-x">{en ? "and" : "et"}</span>
                <button type="button" onClick={() => onSelect(toolKey(b))}>{b.name}</button>
              </span>
              <small>{why}{double > 0 && <><span aria-hidden="true"> · </span><span className="ms-pair-double-text">{en ? `${money(double)} paid twice` : `${money(double)} en double`}</span></>}</small>
            </span>
            <div className="ms-pair-actions-wrap">
              <div className="ms-pair-actions">
                <Link className="ms-pair-compare" to={comparisonPath(prefix, toolKey(a), toolKey(b))} onClick={() => trackEvent("stack_compare_click", { source: "pairs", a: toolKey(a), b: toolKey(b) })}>{en ? "Compare" : "Comparer"}</Link>
                {/* The decision opens in a menu anchored to the button: the card
                    keeps its size, nothing around it moves. */}
                <Popover open={open} onOpenChange={(value) => setDeciding(value ? key : null)}>
                  <PopoverTrigger asChild>
                    <button type="button" className="ms-pair-decide">{en ? "Decide" : "Décider"}</button>
                  </PopoverTrigger>
                  <PopoverContent align="end" sideOffset={8} className="ms-decide-menu">
                    <p className="ms-decide-title">{en ? "Your decision" : "Votre décision"}</p>
                    {[[a, b], [b, a]].map(([keep, drop]) => {
                      const saving = monthly(drop);
                      return <button key={keep.id} type="button" onClick={() => { setDeciding(null); onDecide("keep-one", keep, drop, saving); }}>
                        <ToolLogo tool={keep} size={28} />
                        <span><strong>{en ? `Keep ${keep.name}` : `Garder ${keep.name}`}</strong><small>{saving > 0 ? (en ? `${money(saving)} less, ${drop.name} leaves` : `${money(saving)} en moins, ${drop.name} part`) : (en ? `${drop.name} leaves the stack` : `${drop.name} quitte la stack`)}</small></span>
                      </button>;
                    })}
                    <button type="button" onClick={() => { setDeciding(null); onDecide("keep-both", a, b, 0); }}>
                      <span className="ms-decide-both" aria-hidden="true">⇄</span>
                      <span><strong>{en ? "Keep both" : "Garder les deux"}</strong><small>{en ? "They don’t do the same job" : "Ils ne font pas le même travail"}</small></span>
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </li>;
        })}
      </ul>
      {scored.length > SHOWN && <button type="button" className="ms-tile-more" aria-expanded={all} onClick={() => setAll((v) => !v)}>
        {all ? (en ? "Show fewer" : "Afficher moins") : (en ? `Show all ${scored.length}` : `Voir les ${scored.length}`)}
      </button>}
      </div>}
    </section>
  );
}
