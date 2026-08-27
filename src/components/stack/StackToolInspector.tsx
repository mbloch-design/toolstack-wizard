import { ArrowLeft, ArrowRight, Check, Compass, ExternalLink, Pencil } from "@/lib/icons";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import ToolCardImage from "@/components/tool/ToolCardImage";
import { useToolBySlug, type ToolSummary } from "@/hooks/useSupabaseData";
import { resolveToolOverview } from "@/lib/toolUtils";
import { relExterne } from "@/lib/externalLink";

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
  headerAside?: ReactNode;
  onClose: () => void;
  onEdit: () => void;
  onExploreIdeas: () => void;
  t: (fr: string, en: string) => string;
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
  headerAside,
  onClose,
  onEdit,
  onExploreIdeas,
  t,
}: StackToolInspectorProps) {
  const { tool: fullTool, loading } = useToolBySlug(tool.slug || tool.id);
  const resolvedTool = fullTool && (fullTool.slug === tool.slug || fullTool.id === tool.id) ? fullTool : null;
  const description = lang === "en"
    ? tool.shortDescriptionEn || tool.shortDescription
    : tool.shortDescription;
  // Same resolver as the tool page — the two sheets must describe the same
  // tool the same way. Here it is capped: this is a preview inside a board,
  // not the reference sheet.
  const { longDescription, pros, useCases, cons, coverage } = resolveToolOverview(
    resolvedTool || tool,
    lang,
    { pros: 3, useCases: 4, cons: 2, coverage: 4 }
  );
  const toolSlug = tool.slug || tool.id;
  const externalHref = tool.websiteUrl || tool.affiliateLink;
  const nextDepth = navigationDepth + 1;

  return (
    <article className="stack-tool-profile">
      <header className="stack-tool-profile-topbar">
        <div className="stack-tool-profile-topbar-context">
          <button
            type="button"
            className="stack-tool-profile-back"
            onClick={onClose}
            aria-label={t(`Retour à ${needLabel}`, `Back to ${needLabel}`) as string}
            title={t(`Retour à ${needLabel}`, `Back to ${needLabel}`) as string}
          >
            <ArrowLeft size={20} aria-hidden />
          </button>
          <div className="stack-tool-profile-topbar-copy">
            <h1>{tool.name}</h1>
            <p>
              <span>{t("Outil", "Tool")}</span>
              <i aria-hidden>·</i>
              <strong>{needLabel}</strong>
              <i aria-hidden>·</i>
              {sectionLabel}
            </p>
          </div>
        </div>

        {headerAside && <div className="stack-tool-profile-topbar-aside">{headerAside}</div>}

        <nav className="stack-tool-profile-nav" aria-label={t("Parcourir les outils de l’objectif", "Browse tools in this objective") as string}>
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
          <p>{description || t("Outil utilisé dans cet objectif.", "Tool used for this objective.")}</p>
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
          <button type="button" className="stack-tool-profile-ideas" onClick={onExploreIdeas}>
            <Compass size={15} aria-hidden />{t("Explorer autour de cet outil", "Explore around this tool")}
          </button>
          {externalHref ? (
            <a href={externalHref} target="_blank" rel={relExterne("source")}>
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
              <span>{t("Objectifs couverts", "Objectives covered")}</span>
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
