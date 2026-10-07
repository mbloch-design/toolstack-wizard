import ToolLogo from "@/components/ToolLogo";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { estimateStackBudget, formatApproximateBudget } from "@/lib/stackBudget";
import { stackDisplayLabel } from "@/lib/stackUsage";
import { stackCatalogPrice, toolKey } from "@/lib/stackView";

/**
 * Vue « Par usage » de Ma stack : un tableau de domaines plutôt qu'une carte
 * de bulles. Les bulles montraient des proportions mais se lisaient mal dès
 * qu'on descendait d'un niveau (quelques bulles serrées, libellés qui
 * débordent, outil caché derrière le nom de son usage). Ici tout se lit d'un
 * coup : une carte par domaine (couleur, nombre d'outils, budget d'entrée),
 * ses usages, et sous chacun ses outils. Un clic sur un outil ouvre le même
 * panneau que la vue Cartes.
 */

type Territory = { id: string; label: string; tools: ToolSummary[]; groups: { id: string; label: string; tools: ToolSummary[] }[] };

const AREA_COLORS = ["#2F6FED", "#7C3AED", "#0E9F6E", "#E8590C", "#D6336C", "#0C8599", "#B08800", "#5F3DC4"];

interface Props {
  territories: Territory[];
  lang: "fr" | "en";
  selectedId?: string;
  onSelect: (slug: string) => void;
  /** Potential overlaps per tool id, same rule as the Cards view and panel. */
  overlaps?: Map<string, ToolSummary[]>;
}

export default function StackAreaBoard({ territories, lang, selectedId, onSelect, overlaps }: Props) {
  const en = lang === "en";
  const all = territories.flatMap((territory) => territory.tools);
  const total = estimateStackBudget(all, undefined, lang);
  const budgetText = (tools: ToolSummary[]) => {
    const budget = estimateStackBudget(tools, undefined, lang);
    if (!budget.included) return null;
    if (!budget.totals.length) return en ? "Free" : "Gratuit";
    return `${formatApproximateBudget(budget, lang)}${en ? "/mo" : "/mois"}`;
  };

  return (
    <section className="ms-board" aria-label={en ? "My tools by use" : "Mes outils par usage"}>
      {total.included > 0 && (
        <p className="ms-board-total">
          <span>{en ? "Estimated entry budget" : "Budget d’entrée estimé"}</span>
          <strong>{budgetText(all)}</strong>
          <small>
            {en ? "Catalogue entry plans, per currency, never converted." : "Offres d’entrée du catalogue, par devise, jamais converties."}
            {total.excluded > 0 && (en ? ` ${total.excluded} of ${total.total} tools without a checked price.` : ` ${total.excluded} outil${total.excluded > 1 ? "s" : ""} sur ${total.total} sans prix relevé.`)}
          </small>
        </p>
      )}
      <div className="ms-board-grid">
        {territories.map((territory, index) => {
          const color = AREA_COLORS[index % AREA_COLORS.length];
          const areaBudget = budgetText(territory.tools);
          return (
            <article key={territory.id} className="ms-area" style={{ ["--area-color" as string]: color, ["--area-delay" as string]: `${index * 60}ms` }}>
              <header className="ms-area-head">
                <span className="ms-area-dot" aria-hidden="true" />
                <h3>{territory.label}</h3>
                <span className="ms-area-count">{en ? `${territory.tools.length} ${territory.tools.length === 1 ? "tool" : "tools"}` : `${territory.tools.length} outil${territory.tools.length > 1 ? "s" : ""}`}</span>
                {areaBudget && <span className="ms-area-budget">{areaBudget}</span>}
              </header>
              {territory.groups.map((group) => (
                <section key={group.id} className="ms-area-group">
                  {territory.groups.length > 1 && <h4>{stackDisplayLabel(group.label, lang)}</h4>}
                  <ul>
                    {group.tools.map((tool) => {
                      const price = stackCatalogPrice(tool, lang);
                      const others = overlaps?.get(tool.id) || [];
                      return (
                        <li key={tool.id}>
                          <button type="button" className="ms-area-tool" aria-pressed={tool.id === selectedId} onClick={() => onSelect(toolKey(tool))}>
                            <ToolLogo tool={tool} size={28} />
                            <span className="ms-area-tool-name">{tool.name}</span>
                            {others.length > 0 && <span className="ms-area-tool-overlap" title={en ? `Overlaps with ${others.map((o) => o.name).join(", ")}` : `Recoupe ${others.map((o) => o.name).join(", ")}`}>⇄ {others[0].name}{others.length > 1 ? ` +${others.length - 1}` : ""}</span>}
                            {price && <span className="ms-area-tool-price">{price}</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </article>
          );
        })}
      </div>
    </section>
  );
}
