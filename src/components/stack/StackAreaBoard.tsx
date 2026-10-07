import ToolLogo from "@/components/ToolLogo";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { stackDisplayLabel } from "@/lib/stackUsage";
import { stackCatalogPrice, toolKey } from "@/lib/stackView";

/**
 * Vue « Par usage » de Ma stack : un tableau de domaines plutôt qu'une carte
 * de bulles. Les bulles montraient des proportions mais se lisaient mal dès
 * qu'on descendait d'un niveau (quelques bulles serrées, libellés qui
 * débordent, outil caché derrière le nom de son usage). Ici tout se lit d'un
 * coup : une carte par domaine (couleur, nombre d'outils), sans somme de prix,
 * ses usages, et sous chacun ses outils. Un clic sur un outil ouvre le même
 * panneau que la vue Cartes.
 */

export type Territory = { id: string; label: string; tools: ToolSummary[]; groups: { id: string; label: string; tools: ToolSummary[] }[] };


interface Props {
  territories: Territory[];
  lang: "fr" | "en";
  selectedId?: string;
  onSelect: (slug: string) => void;
  /** Potential overlaps per tool id, same rule as the Cards view and panel. */
  overlaps?: Map<string, ToolSummary[]>;
}

export const AREA_COLORS = ["#2F6FED", "#7C3AED", "#0E9F6E", "#E8590C", "#D6336C", "#0C8599", "#B08800", "#5F3DC4"];

/** "6 free · 13 freemium · 2 paid · 2 without a checked price": a count, never a sum. */
export function PriceKinds({ tools, lang }: { tools: ToolSummary[]; lang: "fr" | "en" }) {
  const en = lang === "en";
  // No sums. A catalogue entry price is not what the person pays (a freemium
  // tool used for free would be counted at its first paid plan), and seat,
  // monthly and annual prices do not add up. V1 rule: "catalogue information,
  // not the user's spend; no conversion, no sum". Only a count by price type.
  const kinds = { free: 0, freemium: 0, paid: 0, unknown: 0 };
  for (const tool of tools) {
    const price = stackCatalogPrice(tool, lang);
    if (price === "Free" || price === "Gratuit") kinds.free++;
    else if (price === "Freemium") kinds.freemium++;
    else if (price) kinds.paid++;
    else kinds.unknown++;
  }
  const parts = [
    kinds.free && (en ? `${kinds.free} free` : `${kinds.free} gratuit${kinds.free > 1 ? "s" : ""}`),
    kinds.freemium && `${kinds.freemium} freemium`,
    kinds.paid && (en ? `${kinds.paid} paid` : `${kinds.paid} payant${kinds.paid > 1 ? "s" : ""}`),
    kinds.unknown && (en ? `${kinds.unknown} without a checked price` : `${kinds.unknown} sans prix relevé`),
  ].filter(Boolean);
  return (
    <p className="ms-board-total">
      <span>{parts.join(" · ")}</span>
      <small>{en ? "Catalogue prices, not what you pay: a freemium tool may be used for free." : "Prix du catalogue, pas vos dépenses : un outil freemium peut être utilisé gratuitement."}</small>
    </p>
  );
}

/** One area: coloured head, then its uses and their tools. */
export function AreaCard({ territory, color, delay = 0, lang, selectedId, onSelect, overlaps, paid, extra }: {
  territory: Territory; color: string; delay?: number; lang: "fr" | "en"; selectedId?: string;
  onSelect: (slug: string) => void; overlaps?: Map<string, ToolSummary[]>;
  /** Freemium plan declared by the person ("I pay"); counts 0 otherwise. */
  paid?: { isPaid: (slug: string) => boolean; setPaid: (slug: string, value: boolean) => void };
  /** Extra line under the area name (e.g. its monthly cost). */
  extra?: string | null;
}) {
  const en = lang === "en";
  return (
    <article className="ms-area" style={{ ["--area-color" as string]: color, ["--area-delay" as string]: `${delay}ms` }}>
      <header className="ms-area-head">
        <span className="ms-area-dot" aria-hidden="true" />
        <h3>{territory.label}</h3>
        <span className="ms-area-count">{en ? `${territory.tools.length} ${territory.tools.length === 1 ? "tool" : "tools"}` : `${territory.tools.length} outil${territory.tools.length > 1 ? "s" : ""}`}</span>
        {extra && <span className="ms-area-budget">{extra}</span>}
      </header>
      {territory.groups.map((group) => (
        <section key={group.id} className="ms-area-group">
          {territory.groups.length > 1 && <h4>{stackDisplayLabel(group.label, lang)}</h4>}
          <ul>
            {group.tools.map((tool) => {
              const price = stackCatalogPrice(tool, lang);
              const others = overlaps?.get(tool.id) || [];
              return (
                <li key={tool.id} className="ms-area-row">
                  <button type="button" className="ms-area-tool" aria-pressed={tool.id === selectedId} onClick={() => onSelect(toolKey(tool))}>
                    <ToolLogo tool={tool} size={28} />
                    <span className="ms-area-tool-name">{tool.name}</span>
                    {others.length > 0 && <span className="ms-area-tool-overlap" title={en ? `Overlaps with ${others.map((o) => o.name).join(", ")}` : `Recoupe ${others.map((o) => o.name).join(", ")}`}>⇄ {others[0].name}{others.length > 1 ? ` +${others.length - 1}` : ""}</span>}
                    {price && <span className="ms-area-tool-price">{price}</span>}
                  </button>
                  {paid && price === "Freemium" && (() => {
                    const on = paid.isPaid(toolKey(tool));
                    return (
                      <button type="button" className={`ms-plan-switch${on ? " is-paid" : ""}`} aria-pressed={on}
                        title={on ? (en ? "Counted at its entry paid plan" : "Compté à son offre payante d’entrée") : (en ? "Counted as free" : "Compté comme gratuit")}
                        onClick={() => paid.setPaid(toolKey(tool), !on)}>
                        {on ? (en ? "I pay" : "Je paie") : (en ? "Free use" : "Usage gratuit")}
                      </button>
                    );
                  })()}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </article>
  );
}

export default function StackAreaBoard({ territories, lang, selectedId, onSelect, overlaps }: Props) {
  const all = territories.flatMap((territory) => territory.tools);
  return (
    <section className="ms-board" aria-label={lang === "en" ? "My tools by use" : "Mes outils par usage"}>
      <PriceKinds tools={all} lang={lang} />
      <div className="ms-board-grid">
        {territories.map((territory, index) => (
          <AreaCard key={territory.id} territory={territory} color={AREA_COLORS[index % AREA_COLORS.length]} delay={index * 60} lang={lang} selectedId={selectedId} onSelect={onSelect} overlaps={overlaps} />
        ))}
      </div>
    </section>
  );
}
