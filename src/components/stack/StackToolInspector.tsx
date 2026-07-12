import { ArrowLeft, ArrowRight, Check, ExternalLink, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import ToolCardImage from "@/components/tool/ToolCardImage";
import { useToolBySlug, type ToolSummary } from "@/hooks/useSupabaseData";

interface StackToolInspectorProps {
  tool: ToolSummary;
  needLabel: string;
  sectionLabel: string;
  categoryLabel: string;
  typeLabel: string;
  priceLabel: string;
  stackCostLabel: string;
  prefix: string;
  lang: "fr" | "en";
  previousHref?: string;
  previousLabel?: string;
  nextHref?: string;
  nextLabel?: string;
  navigationDepth?: number;
  onClose: () => void;
  onEdit: () => void;
  t: (fr: string, en: string) => string;
}

function humanizeValue(value: string) {
  const cleaned = value.replace(/[-_]+/g, " ").trim();
  return cleaned ? `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}` : "";
}

export default function StackToolInspector({
  tool,
  needLabel,
  sectionLabel,
  categoryLabel,
  typeLabel,
  priceLabel,
  stackCostLabel,
  prefix,
  lang,
  previousHref,
  previousLabel,
  nextHref,
  nextLabel,
  navigationDepth = 0,
  onClose,
  onEdit,
  t,
}: StackToolInspectorProps) {
  const { tool: fullTool, loading } = useToolBySlug(tool.slug || tool.id);
  const resolvedTool = fullTool && (fullTool.slug === tool.slug || fullTool.id === tool.id) ? fullTool : null;
  const description = lang === "en"
    ? tool.shortDescriptionEn || tool.shortDescription
    : tool.shortDescription;
  const longDescription = lang === "en"
    ? resolvedTool?.longDescriptionEn || resolvedTool?.longDescription
    : resolvedTool?.longDescription;
  const pros = (lang === "en"
    ? resolvedTool?.prosEn || resolvedTool?.pros || tool.prosEn || tool.pros
    : resolvedTool?.pros || tool.pros || []).filter(Boolean).slice(0, 3);
  const useCases = (lang === "en"
    ? resolvedTool?.useCasesEn || resolvedTool?.useCases
    : resolvedTool?.useCases || []).filter(Boolean).slice(0, 4);
  const cons = (lang === "en"
    ? resolvedTool?.consEn || resolvedTool?.cons
    : resolvedTool?.cons || []).filter(Boolean).slice(0, 2);
  const coverage = Array.from(new Set([
    ...(resolvedTool?.functional_needs || tool.functional_needs || []),
    ...(resolvedTool?.covers || tool.covers || []),
  ])).map(humanizeValue).filter(Boolean).slice(0, 4);
  const toolSlug = tool.slug || tool.id;
  const externalHref = tool.websiteUrl || tool.affiliateLink;
  const nextDepth = navigationDepth + 1;

  return (
    <article className="stack-tool-profile">
      <header className="stack-tool-profile-topbar">
        <button type="button" className="stack-tool-profile-back" onClick={onClose}>
          <ArrowLeft size={18} aria-hidden />
          <span>{t(`Retour à ${needLabel}`, `Back to ${needLabel}`)}</span>
        </button>

        <nav className="stack-tool-profile-nav" aria-label={t("Parcourir les outils du besoin", "Browse tools in this need") as string}>
          {previousHref ? (
            <Link to={previousHref} state={{ stackToolInspectorDepth: nextDepth }} aria-label={t(`Outil précédent : ${previousLabel}`, `Previous tool: ${previousLabel}`) as string}>
              <ArrowLeft size={16} aria-hidden />
              <span><small>{t("Précédent", "Previous")}</small>{previousLabel}</span>
            </Link>
          ) : <span />}
          {nextHref ? (
            <Link to={nextHref} state={{ stackToolInspectorDepth: nextDepth }} aria-label={t(`Outil suivant : ${nextLabel}`, `Next tool: ${nextLabel}`) as string}>
              <span><small>{t("Suivant", "Next")}</small>{nextLabel}</span>
              <ArrowRight size={16} aria-hidden />
            </Link>
          ) : <span />}
        </nav>
      </header>

      <section className="stack-tool-profile-hero">
        <ToolCardImage tool={tool} logoSize={88} className="stack-tool-profile-cover" />
        <div className="stack-tool-profile-heading">
          <span>{categoryLabel}</span>
          <h1>{tool.name}</h1>
          <p>{description || t("Outil utilisé dans ce besoin.", "Tool used for this need.")}</p>
        </div>
      </section>

      <aside className="stack-tool-profile-sidebar" aria-label={t("Contexte dans Ma stack", "My stack context") as string}>
        <section className="stack-tool-inspector-context">
          <span>{t("Dans Ma stack", "In My stack")}</span>
          <strong>{needLabel}</strong>
          <p>{sectionLabel}</p>
        </section>

        <div className="stack-tool-profile-facts">
          <div><span>{t("Coût de Ma stack", "My stack cost")}</span><strong>{stackCostLabel}</strong></div>
          <div><span>{t("Cet outil", "This tool")}</span><strong>{priceLabel}</strong></div>
          <div><span>{t("Type", "Type")}</span><strong>{typeLabel}</strong></div>
        </div>

        <div className="stack-tool-profile-actions">
          {externalHref ? (
            <a href={externalHref} target="_blank" rel="noopener noreferrer">
              {t("Ouvrir l’outil", "Open tool")}<ExternalLink size={14} aria-hidden />
            </a>
          ) : (
            <Link to={`${prefix}/tool/${toolSlug}`}>{t("Ouvrir la fiche", "Open profile")}<ExternalLink size={14} aria-hidden /></Link>
          )}
          <button type="button" onClick={onEdit}><Pencil size={15} aria-hidden />{t("Rangement", "Organization")}</button>
          <Link className="stack-tool-profile-catalog-link" to={`${prefix}/tool/${toolSlug}`}>{t("Voir la fiche catalogue", "Open catalog profile")}</Link>
        </div>
      </aside>

      <div className="stack-tool-profile-content">
        {longDescription && (
          <section className="stack-tool-inspector-overview">
            <span>{t("En bref", "Overview")}</span>
            <p>{longDescription}</p>
          </section>
        )}

        <div className="stack-tool-inspector-grid">
          {(useCases.length > 0 || (!loading && coverage.length > 0)) && (
            <section className="stack-tool-inspector-detail">
              <span>{t("Ce que vous pouvez en faire", "What you can do with it")}</span>
              {useCases.length > 0 ? (
                <ul>{useCases.map((useCase) => <li key={useCase}><Check size={15} aria-hidden />{useCase}</li>)}</ul>
              ) : (
                <div className="stack-tool-inspector-chips">{coverage.map((item) => <span key={item}>{item}</span>)}</div>
              )}
            </section>
          )}

          {pros.length > 0 && (
            <section className="stack-tool-inspector-detail">
              <span>{t("Points forts", "Strengths")}</span>
              <ul>{pros.map((pro) => <li key={pro}><Check size={15} aria-hidden />{pro}</li>)}</ul>
            </section>
          )}

          {cons.length > 0 && (
            <section className="stack-tool-inspector-detail stack-tool-inspector-limitations">
              <span>{t("À garder en tête", "Worth keeping in mind")}</span>
              <ul>{cons.map((con) => <li key={con}>{con}</li>)}</ul>
            </section>
          )}

          {coverage.length > 0 && useCases.length > 0 && (
            <section className="stack-tool-inspector-detail">
              <span>{t("Besoins couverts", "Needs covered")}</span>
              <div className="stack-tool-inspector-chips">{coverage.map((item) => <span key={item}>{item}</span>)}</div>
            </section>
          )}
        </div>

        {loading && (
          <div className="stack-tool-inspector-loading" role="status">
            <span>{t("Chargement des détails…", "Loading details…")}</span>
            <i /><i /><i />
          </div>
        )}
      </div>
    </article>
  );
}
