import { useState } from "react";
import { Link } from "react-router-dom";
import ToolLogo from "@/components/ToolLogo";
import type { Category } from "@/data/types";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { comparisonPath } from "@/lib/comparisonLinks";
import { convertAmount, formatAmount, type Currency } from "@/lib/currencyRates";
import { toolMonthlyCost } from "@/lib/stackCost";
import { stackDisplayLabel, stackRelations } from "@/lib/stackUsage";
import { toolKey } from "@/lib/stackView";

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
}
const SHOWN = 4;

export type ScoredPair = { a: ToolSummary; b: ToolSummary; shared: string[]; explicit: boolean; double: number; cheaper: ToolSummary };

/**
 * Pairs of tools that overlap (explicit catalogue alternative or shared
 * catalogue uses), each with what is paid twice: when both are paid, the
 * cheaper one. Sorted by that amount. `doubleTotal` counts each tool once.
 * Shared by the hero figure and the Overlaps section so both say the same.
 */
export function scoreOverlapPairs(tools: ToolSummary[], categories: Category[], isPaid: (slug: string) => boolean, currency: Currency, lang: "fr" | "en") {
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

export default function StackOverlapPairs({ tools, categories, isPaid, currency, prefix, lang, onSelect }: Props) {
  const en = lang === "en";
  const [all, setAll] = useState(false);
  const { pairs: scored, doubleTotal } = scoreOverlapPairs(tools, categories, isPaid, currency, lang);
  const costLabel = (tool: ToolSummary) => {
    const cost = toolMonthlyCost(tool, isPaid, lang);
    if (cost.kind === "paid") return `≈ ${formatAmount(Math.round(convertAmount(cost.monthly, cost.currency, currency)), currency, lang)}${en ? "/mo" : "/mois"}`;
    if (cost.kind === "free") return en ? "Free" : "Gratuit";
    if (cost.kind === "freemium-free") return en ? "Free use" : "Usage gratuit";
    return en ? "Price not checked" : "Prix non relevé";
  };

  if (!scored.length) return null;
  const money = (amount: number) => `≈ ${formatAmount(Math.round(amount), currency, lang)}${en ? "/mo" : "/mois"}`;

  return (
    <section id="ms-overlaps" className="sg-section ms-section ms-overlaps-section" aria-labelledby="ms-overlaps-section-title">
      <div className="sg-section-heading">
        <span className="sg-eyebrow">{en ? "Overlaps" : "Recoupements"}</span>
        <h2 id="ms-overlaps-section-title">{en ? "What may be doing the same job?" : "Qu’est-ce qui fait peut-être doublon ?"}</h2>
      </div>
      <p className="ms-section-lead">{en
        ? <>{scored.length} pair{scored.length > 1 ? "s" : ""} of tools may do the same job{doubleTotal > 0 && <>, <strong className="ms-double">{money(doubleTotal)} paid twice</strong> on catalogue entry plans</>}. Keeping both can be the right call: compare before deciding.</>
        : <>{scored.length} paire{scored.length > 1 ? "s" : ""} d’outils {scored.length > 1 ? "font" : "fait"} peut-être le même travail{doubleTotal > 0 && <>, soit <strong className="ms-double">{money(doubleTotal)} payés en double</strong> sur les offres d’entrée du catalogue</>}. Garder les deux peut être le bon choix : comparez avant de décider.</>}</p>
      <div className="ms-pairs-panel">
      <ul className="ms-pairs">
        {(all ? scored : scored.slice(0, SHOWN)).map(({ a, b, shared, explicit, double }) => (
          <li key={`${a.id}|${b.id}`} className="ms-pair">
            {double > 0 && <span className="ms-pair-double">{en ? `${money(double)} paid twice` : `${money(double)} en double`}</span>}
            <div className="ms-pair-tools">
              {[a, b].map((tool, i) => (
                <button key={tool.id} type="button" className="ms-pair-tool" onClick={() => onSelect(toolKey(tool))}>
                  <ToolLogo tool={tool} size={32} />
                  <span><strong>{tool.name}</strong><small>{costLabel(tool)}</small></span>
                  {i === 0 && <span className="ms-pair-sign" aria-hidden="true">⇄</span>}
                </button>
              ))}
            </div>
            <div className="ms-pair-foot">
              <p className="ms-pair-why">{shared.length > 0
                ? (en ? `Shared: ${shared.slice(0, 3).join(", ")}` : `En commun : ${shared.slice(0, 3).map((use) => stackDisplayLabel(use, lang)).join(", ")}`)
                : explicit ? (en ? "Listed as alternatives in the catalogue" : "Alternatives l’une de l’autre au catalogue") : ""}</p>
              <Link className="ms-pair-compare" to={comparisonPath(prefix, toolKey(a), toolKey(b))}>{en ? "Compare" : "Comparer"}</Link>
            </div>
          </li>
        ))}
      </ul>
      {scored.length > SHOWN && <button type="button" className="ms-tile-more" aria-expanded={all} onClick={() => setAll((v) => !v)}>
        {all ? (en ? "Show fewer" : "Afficher moins") : (en ? `Show all ${scored.length}` : `Voir les ${scored.length}`)}
      </button>}
      </div>
    </section>
  );
}
