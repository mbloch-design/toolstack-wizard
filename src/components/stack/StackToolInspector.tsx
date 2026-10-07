import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight, Trash2 } from "@/lib/icons";
import ToolLogo from "@/components/ToolLogo";
import type { Category, Tool } from "@/data/types";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { stackCatalogPrice, toolKey } from "@/lib/stackView";
import { comparisonPath } from "@/lib/comparisonLinks";
import { stackDisplayLabel, stackPlacement, stackRelations, stackUsageLabels } from "@/lib/stackUsage";
import { getScrollTop, scrollToY } from "@/lib/scroll";

interface StackToolInspectorProps {
  tool: ToolSummary | Tool;
  relations: ReturnType<typeof stackRelations>;
  categories: Category[];
  prefix: string;
  lang: "fr" | "en";
  onClose: () => void;
  onSelect: (slug: string) => void;
  onRemove: () => void;
  t: (fr: string, en: string) => string;
}

export default function StackToolInspector({ tool, relations, categories, prefix, lang, onClose, onSelect, onRemove, t }: StackToolInspectorProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      const top = heading.current?.getBoundingClientRect().top;
      // Reveal the response to the click, leaving room for the selected row.
      if (top !== undefined && (top < 90 || top > window.innerHeight - 220)) scrollToY(getScrollTop() + top - 180, "instant");
    });
    return () => cancelAnimationFrame(frame);
  }, [tool.id]);
  const place = stackPlacement(tool, categories, lang);
  const overlaps = relations.filter((relation) => relation.explicit || relation.commonUses.length > 0);
  const price = stackCatalogPrice(tool, lang);
  const short = lang === "en" ? tool.shortDescriptionEn || tool.shortDescription : tool.shortDescription;
  const long = "longDescription" in tool ? (lang === "en" ? tool.longDescriptionEn || tool.longDescription : tool.longDescription) : undefined;
  // Use a complete catalogue sentence, never a cut fragment or an invented capability.
  const firstSentence = long?.split(/(?<=[.!?])\s+/)[0]?.trim();
  const conciseShort = short && short.length <= 240 && !/[€$£]/.test(short);
  const catalogueDescription = conciseShort ? short : firstSentence && firstSentence.length <= 400 ? firstSentence : short;
  const description = catalogueDescription?.replace(/\bsimulation VFX\b/g, lang === "fr" ? "simulation d’effets visuels" : "visual effects simulation")
    .replace(/\bVFX\b/g, lang === "fr" ? "effets visuels" : "visual effects")
    .replace(/\brigging\b/g, lang === "fr" ? "préparation à l’animation" : "animation rigging");
  const uses = stackUsageLabels(tool, lang).slice(0, 4);
  return <article className="ms-inspector" aria-labelledby="ms-inspector-title" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
    <header className="ms-inspector-heading">
      <ToolLogo tool={tool} size={52} />
      <div className="ms-inspector-identity"><p className="ms-focus-eyebrow">{stackDisplayLabel(place.label, lang)}</p><h3 id="ms-inspector-title" tabIndex={-1} ref={heading}>{tool.name}</h3></div>
      <button className="ms-icon-action ms-inspector-close" onClick={onClose} aria-label={t("Fermer le contexte", "Close tool context")}><X size={16} aria-hidden /></button>
    </header>
    {price && <p className="ms-focus-price"><span>{t("Tarif public", "Public price")}</span><strong>{price}</strong></p>}
    <div className="ms-focus-body">
      <p className="ms-focus-summary">{description || (uses.length > 0 ? uses.map((use) => stackDisplayLabel(use, lang)).join(" · ") : t("La description de cet outil n’est pas renseignée.", "A description is not available for this tool."))}</p>
      {overlaps.length > 0 && <section className="ms-focus-overlaps" aria-labelledby="ms-overlaps-title">
        <h4 id="ms-overlaps-title">{t("Chevauchements possibles", "Potential overlaps")}</h4>
        <div>{overlaps.map((relation) => <div key={relation.tool.id} className="ms-overlap-row">
          <button type="button" className="ms-overlap-tool" onClick={() => onSelect(toolKey(relation.tool))}>
            <ToolLogo tool={relation.tool} size={28} />
            <span><strong>{relation.tool.name}</strong>
              <span>{relation.commonUses.length > 0
                ? t(`${relation.commonUses.slice(0, 2).map((use) => stackDisplayLabel(use, lang)).join(", ")} en commun`, `Shared: ${relation.commonUses.slice(0, 2).join(", ")}`)
                : t("Alternative du catalogue", "Catalogue alternative")}</span>
            </span>
          </button>
          {/* From an overlap to a decision: the comparison of the two tools. */}
          <Link className="ms-overlap-compare" to={comparisonPath(prefix, toolKey(tool), toolKey(relation.tool))}>
            {t("Comparer", "Compare")}
          </Link>
        </div>)}</div>
      </section>}
    </div>
    <footer className="ms-inspector-actions">
      <Link className="tt-button-secondary" to={`${prefix}/tool/${toolKey(tool)}`}>{t("Voir la fiche complète", "View full profile")}<ArrowRight size={16} aria-hidden /></Link>
      <button className="ms-icon-action" onClick={onRemove} aria-label={t("Retirer de mes outils", "Remove from my tools")} title={t("Retirer de mes outils", "Remove from my tools")}><Trash2 size={18} aria-hidden /></button>
    </footer>
  </article>;
}
