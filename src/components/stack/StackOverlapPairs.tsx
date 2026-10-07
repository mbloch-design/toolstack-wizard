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
 * Tuile du tableau de bord : filtrée par le domaine choisi dans la carte des
 * usages (paires dont au moins un outil est dans le domaine).
 */

interface Props {
  tools: ToolSummary[];
  categories: Category[];
  isPaid: (slug: string) => boolean;
  currency: Currency;
  prefix: string;
  lang: "fr" | "en";
  onSelect: (slug: string) => void;
  /** Tool ids of the area picked on the usage map; all tools when absent. */
  scopeIds?: Set<string>;
}
const SHOWN = 3;

export default function StackOverlapPairs({ tools, categories, isPaid, currency, prefix, lang, onSelect, scopeIds }: Props) {
  const en = lang === "en";
  const [all, setAll] = useState(false);
  const pairs: { a: ToolSummary; b: ToolSummary; shared: string[]; explicit: boolean }[] = [];
  const seen = new Set<string>();
  for (const a of tools) {
    for (const relation of stackRelations(a, tools, categories, lang)) {
      if (!relation.explicit && relation.commonUses.length === 0) continue;
      const key = [a.id, relation.tool.id].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      if (scopeIds && !scopeIds.has(a.id) && !scopeIds.has(relation.tool.id)) continue;
      pairs.push({ a, b: relation.tool, shared: relation.commonUses, explicit: relation.explicit });
    }
  }

  const costLabel = (tool: ToolSummary) => {
    const cost = toolMonthlyCost(tool, isPaid, lang);
    if (cost.kind === "paid") return `≈ ${formatAmount(Math.round(convertAmount(cost.monthly, cost.currency, currency)), currency, lang)}${en ? "/mo" : "/mois"}`;
    if (cost.kind === "free") return en ? "Free" : "Gratuit";
    if (cost.kind === "freemium-free") return en ? "Free use" : "Usage gratuit";
    return en ? "Price not checked" : "Prix non relevé";
  };

  return (
    <section id="ms-overlaps" className="ms-tile ms-overlaps-tile" aria-labelledby="ms-overlaps-section-title">
      <header className="ms-tile-head">
        <div>
          <h2 id="ms-overlaps-section-title">{en ? "Overlaps" : "Recoupements"}</h2>
          <p>{pairs.length === 0
            ? (en ? "No known overlap here." : "Aucun recoupement connu ici.")
            : en ? `${pairs.length} pair${pairs.length > 1 ? "s" : ""} may do the same job` : `${pairs.length} paire${pairs.length > 1 ? "s" : ""} ${pairs.length > 1 ? "font" : "fait"} peut-être doublon`}</p>
        </div>
      </header>
      {pairs.length > 0 && <ul className="ms-pairs">
        {(all ? pairs : pairs.slice(0, SHOWN)).map(({ a, b, shared, explicit }) => (
          <li key={`${a.id}|${b.id}`} className="ms-pair">
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
      </ul>}
      {pairs.length > 0 && <p className="ms-tile-note">{en ? "Keeping both can be the right call: compare before deciding." : "Garder les deux peut être le bon choix : comparez avant de décider."}</p>}
      {pairs.length > SHOWN && <button type="button" className="ms-tile-more" aria-expanded={all} onClick={() => setAll((v) => !v)}>
        {all ? (en ? "Show fewer" : "Afficher moins") : (en ? `Show all ${pairs.length}` : `Voir les ${pairs.length}`)}
      </button>}
    </section>
  );
}
