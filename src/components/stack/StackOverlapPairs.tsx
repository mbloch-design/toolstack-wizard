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

export default function StackOverlapPairs({ tools, categories, isPaid, currency, prefix, lang, onSelect }: Props) {
  const en = lang === "en";
  const pairs: { a: ToolSummary; b: ToolSummary; shared: string[]; explicit: boolean }[] = [];
  const seen = new Set<string>();
  for (const a of tools) {
    for (const relation of stackRelations(a, tools, categories, lang)) {
      if (!relation.explicit && relation.commonUses.length === 0) continue;
      const key = [a.id, relation.tool.id].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ a, b: relation.tool, shared: relation.commonUses, explicit: relation.explicit });
    }
  }
  if (!pairs.length) return null;

  const costLabel = (tool: ToolSummary) => {
    const cost = toolMonthlyCost(tool, isPaid, lang);
    if (cost.kind === "paid") return `≈ ${formatAmount(Math.round(convertAmount(cost.monthly, cost.currency, currency)), currency, lang)}${en ? "/mo" : "/mois"}`;
    if (cost.kind === "free") return en ? "Free" : "Gratuit";
    if (cost.kind === "freemium-free") return en ? "Free use" : "Usage gratuit";
    return en ? "Price not checked" : "Prix non relevé";
  };

  return (
    <section id="ms-overlaps" className="sg-section ms-section" aria-labelledby="ms-overlaps-section-title">
      <div className="sg-section-heading">
        <span className="sg-eyebrow">03 / {en ? "Overlaps" : "Recoupements"}</span>
        <h2 id="ms-overlaps-section-title">{en ? "What may be doing the same job?" : "Qu’est-ce qui fait peut-être doublon ?"}</h2>
      </div>
      <p className="ms-section-lead">{en
        ? `${pairs.length} pair${pairs.length > 1 ? "s" : ""} of tools share uses or are catalogue alternatives. Keeping both can be the right call; compare before deciding.`
        : `${pairs.length} paire${pairs.length > 1 ? "s" : ""} d’outils partage${pairs.length > 1 ? "nt" : ""} des usages ou sont des alternatives du catalogue. Garder les deux peut être le bon choix : comparez avant de décider.`}</p>
      <ul className="ms-pairs">
        {pairs.map(({ a, b, shared, explicit }) => (
          <li key={`${a.id}|${b.id}`} className="ms-pair">
            <div className="ms-pair-tools">
              {[a, b].map((tool, i) => (
                <button key={tool.id} type="button" className="ms-pair-tool" onClick={() => onSelect(toolKey(tool))}>
                  <ToolLogo tool={tool} size={40} />
                  <span><strong>{tool.name}</strong><small>{costLabel(tool)}</small></span>
                  {i === 0 && <span className="ms-pair-sign" aria-hidden="true">⇄</span>}
                </button>
              ))}
            </div>
            <p className="ms-pair-why">{shared.length > 0
              ? (en ? `Shared: ${shared.slice(0, 3).join(", ")}` : `En commun : ${shared.slice(0, 3).map((use) => stackDisplayLabel(use, lang)).join(", ")}`)
              : explicit ? (en ? "Listed as alternatives in the catalogue" : "Alternatives l’une de l’autre au catalogue") : ""}</p>
            <Link className="ms-pair-compare" to={comparisonPath(prefix, toolKey(a), toolKey(b))}>{en ? "Compare" : "Comparer"}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
