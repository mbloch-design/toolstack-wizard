import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight, Trash2 } from "@/lib/icons";
import ToolLogo from "@/components/ToolLogo";
import { useToolBySlug, type ToolSummary } from "@/hooks/useSupabaseData";
import { resolveToolOverview } from "@/lib/toolUtils";
import { knownStackAlternatives, stackCatalogPrice, stackPlanPrice, toolKey } from "@/lib/stackView";

interface StackToolInspectorProps {
  tool: ToolSummary;
  selectedTools: ToolSummary[];
  categoryLabel: string;
  prefix: string;
  lang: "fr" | "en";
  onClose: () => void;
  onSelect: (slug: string) => void;
  onRemove: () => void;
  t: (fr: string, en: string) => string;
}

export default function StackToolInspector({ tool, selectedTools, categoryLabel, prefix, lang, onClose, onSelect, onRemove, t }: StackToolInspectorProps) {
  const { tool: fullTool } = useToolBySlug(toolKey(tool));
  const resolved = fullTool || tool;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [tool.id]);
  const { useCases, coverage } = resolveToolOverview(resolved, lang, { useCases: 4, coverage: 6 });
  const nearby = knownStackAlternatives(resolved, selectedTools);
  const plans = (lang === "en" ? fullTool?.pricing_v5En || fullTool?.pricing_v5 : fullTool?.pricing_v5)?.plans || [];
  const price = stackCatalogPrice(resolved, lang);
  return (
    <article className="ms-inspector" aria-labelledby="ms-inspector-title" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
      <header className="ms-inspector-heading">
        <ToolLogo tool={tool} size={40} />
        <div><p>{categoryLabel}</p><h3 id="ms-inspector-title" tabIndex={-1} ref={heading}>{tool.name}</h3></div>
        <button className="ms-icon-action" onClick={onClose} aria-label={t("Fermer le contexte", "Close tool context")}><X size={20} aria-hidden /></button>
      </header>
      <div className="ms-inspector-content">
        <section>
          <h4>{t("Sa place dans votre environnement", "Its place in your environment")}</h4>
          <p>{lang === "en" ? resolved.shortDescriptionEn || resolved.shortDescription : resolved.shortDescription}</p>
          {useCases.length > 0 && <ul className="ms-usages">{useCases.map((item: string) => <li key={item}>{item}</li>)}</ul>}
          {coverage.length > 0 && <p className="ms-coverage">{coverage.join(" · ")}</p>}
        </section>
        {(price || plans.length > 0) && <section>
          <h4>{t("Tarifs catalogue", "Catalogue pricing")}</h4>
          {price && <p>{price}</p>}
          {plans.length > 0 && <dl className="ms-plans">{plans.map((plan) => {
            const planPrice = stackPlanPrice(plan, lang);
            return planPrice ? <div key={plan.planKey}><dt>{plan.displayName}{plan.comingSoon ? t(" (à venir)", " (coming soon)") : ""}</dt><dd>{planPrice}</dd></div> : null;
          })}</dl>}
        </section>}
        {nearby.length > 0 && <section>
          <h4>{t("Aussi dans votre stack", "Also in your stack")}</h4>
          <p>{t("Des alternatives connues ou des outils du même groupe fonctionnel.", "Known alternatives or tools in the same functional group.")}</p>
          <div className="ms-nearby">{nearby.map((item) => <button key={item.id} onClick={() => onSelect(toolKey(item))}><ToolLogo tool={item} size={28} />{item.name}<ArrowRight size={14} aria-hidden /></button>)}</div>
        </section>}
      </div>
      <footer className="ms-inspector-actions">
        <Link to={`${prefix}/tool/${toolKey(tool)}`}>{t("Voir la fiche ToolTrim", "Open ToolTrim profile")}<ArrowRight size={16} aria-hidden /></Link>
        <button onClick={onRemove}><Trash2 size={16} aria-hidden />{t("Retirer du stack", "Remove from stack")}</button>
      </footer>
    </article>
  );
}
