import { ArrowLeft, ArrowRight, ExternalLink, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import ToolCardImage from "@/components/tool/ToolCardImage";
import { SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { ToolSummary } from "@/hooks/useSupabaseData";

interface StackToolInspectorProps {
  tool: ToolSummary;
  needLabel: string;
  sectionLabel: string;
  categoryLabel: string;
  typeLabel: string;
  priceLabel: string;
  prefix: string;
  lang: "fr" | "en";
  previousHref?: string;
  nextHref?: string;
  onEdit: () => void;
  t: (fr: string, en: string) => string;
}

export default function StackToolInspector({
  tool,
  needLabel,
  sectionLabel,
  categoryLabel,
  typeLabel,
  priceLabel,
  prefix,
  lang,
  previousHref,
  nextHref,
  onEdit,
  t,
}: StackToolInspectorProps) {
  const description = lang === "en"
    ? tool.shortDescriptionEn || tool.shortDescription
    : tool.shortDescription;
  const pros = (lang === "en" ? tool.prosEn || tool.pros : tool.pros || []).filter(Boolean).slice(0, 3);
  const toolSlug = tool.slug || tool.id;

  return (
    <div className="stack-tool-inspector">
      <ToolCardImage tool={tool} logoSize={64} className="stack-tool-inspector-cover" />

      <div className="stack-tool-inspector-nav" aria-label={t("Parcourir les outils du besoin", "Browse tools in this need") as string}>
        {previousHref ? (
          <Link to={previousHref} aria-label={t("Outil précédent", "Previous tool") as string}><ArrowLeft size={17} aria-hidden /></Link>
        ) : <span />}
        <span>{t("Dans Ma stack", "In My stack")}</span>
        {nextHref ? (
          <Link to={nextHref} aria-label={t("Outil suivant", "Next tool") as string}><ArrowRight size={17} aria-hidden /></Link>
        ) : <span />}
      </div>

      <div className="stack-tool-inspector-body">
        <header className="stack-tool-inspector-head">
          <span>{categoryLabel}</span>
          <SheetTitle>{tool.name}</SheetTitle>
          <SheetDescription>{description || t("Outil utilisé dans ce besoin.", "Tool used for this need.")}</SheetDescription>
        </header>

        <div className="stack-tool-inspector-facts">
          <div><span>{t("Prix indicatif", "Indicative price")}</span><strong>{priceLabel}</strong></div>
          <div><span>{t("Type", "Type")}</span><strong>{typeLabel}</strong></div>
        </div>

        <section className="stack-tool-inspector-context">
          <span>{t("Rôle dans votre stack", "Role in your stack")}</span>
          <strong>{needLabel}</strong>
          <p>{sectionLabel}</p>
        </section>

        {pros.length > 0 && (
          <section className="stack-tool-inspector-pros">
            <span>{t("Utile pour", "Useful for")}</span>
            <ul>{pros.map((pro) => <li key={pro}>{pro}</li>)}</ul>
          </section>
        )}
      </div>

      <footer className="stack-tool-inspector-actions">
        <button type="button" onClick={onEdit}><Pencil size={15} aria-hidden />{t("Modifier le rangement", "Edit organization")}</button>
        <Link to={`${prefix}/tool/${toolSlug}`}>{t("Voir la fiche complète", "Open full profile")}<ExternalLink size={14} aria-hidden /></Link>
      </footer>
    </div>
  );
}
