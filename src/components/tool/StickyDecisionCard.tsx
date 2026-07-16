import { Link, useLocation } from "react-router-dom";
import { Compass, ExternalLink } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { computeToolTrimScore } from "@/lib/toolTrimScore";
import { formatPriceLabel, resolveVerdict } from "@/lib/toolUtils";
import type { Tool } from "@/data/types";
import { getExplorerHref } from "@/lib/toolExploration";

/* Slug → readable tag: "gestion-projet" → "Gestion projet" */
function tagLabel(slug: string) {
  const s = slug.replace(/[-_]+/g, " ").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

/* ─────────────────────────────────────────────────────────────────────────────
   StickyDecisionCard
   Right sidebar: editorial score + verdict sentence + CTAs + key facts + alt
   Order: header → score → decision sentence → CTAs → key facts → alternative
   No stars. No gradients. No colored badges.
───────────────────────────────────────────────────────────────────────────── */

interface Props {
  tool: Tool;
  displayPrice: number;
  verifiedOn: string;
  isFree: boolean;
  isFreemium: boolean;
  hasFreeplan: boolean;
  prefix: string;
  lang: string;
  t: (fr: string, en: string) => string;
  primaryCtaUrl: string;
  hasAffiliateOffer: boolean;
  alternatives: Tool[];
  catName: string;
  catNameEn: string;
}

export default function StickyDecisionCard({
  tool, displayPrice, verifiedOn,
  isFree, isFreemium, hasFreeplan, prefix, lang, t,
  primaryCtaUrl, hasAffiliateOffer, alternatives,
  catName, catNameEn,
}: Props) {
  const location = useLocation();

  const ts = computeToolTrimScore(tool);

  /* ── Verdict sentence ── */
  const { keepItems, avoidItems, threshold } = resolveVerdict(tool, lang);

  const verdictText = (() => {
    // Short synthesis only — the main content area already shows the full
    // threshold verbatim in "Décision rapide", so repeating all of it here
    // duplicates the same paragraph twice on the page. First sentence is
    // enough for an at-a-glance sidebar card.
    if (threshold && threshold.length > 0) {
      const firstSentence = threshold.split(/(?<=[.!?])\s+/)[0];
      return firstSentence || threshold;
    }
    if (keepItems.length && avoidItems.length) {
      const k = keepItems[0];
      const a = avoidItems[0];
      return lang === "fr"
        ? `Bon choix si ${k.charAt(0).toLowerCase() + k.slice(1)}. Moins adapté si ${a.charAt(0).toLowerCase() + a.slice(1)}.`
        : `Good fit if ${k.charAt(0).toLowerCase() + k.slice(1)}. Less suited if ${a.charAt(0).toLowerCase() + a.slice(1)}.`;
    }
    if (keepItems.length) {
      const k = keepItems[0];
      return lang === "fr"
        ? `Pertinent si ${k.charAt(0).toLowerCase() + k.slice(1)}.`
        : `Relevant if ${k.charAt(0).toLowerCase() + k.slice(1)}.`;
    }
    return "";
  })();

  /* ── One consolidated price line (the old card repeated "freemium" across a
       Plan gratuit / Modèle / Prix trio that all said the same thing) ── */
  const priceValue = isFree
    ? t("Gratuit", "Free")
    : isFreemium
    ? (displayPrice > 0
        ? `${t("Freemium · dès", "Freemium · from")} ${formatPriceLabel(tool, displayPrice, t)}`
        : t("Freemium", "Freemium"))
    : displayPrice > 0
    ? `${t("Dès", "From")} ${formatPriceLabel(tool, displayPrice, t)}`
    : t("Sur devis", "On request");

  /* ── Key facts: 3 genuinely distinct rows (no overlap) ── */
  const metaRows = [
    { label: t("Prix", "Price"), value: priceValue },
    { label: t("Catégorie", "Category"), value: t(catName, catNameEn) },
    { label: t("Vérifié le", "Verified"), value: verifiedOn },
  ];

  /* ── Ecosystem tags: what the tool covers, at a glance ── */
  const rawTags = (((tool as any).covers as string[] | null | undefined)?.length
    ? (tool as any).covers as string[]
    : ((tool as any).functional_needs as string[] | null | undefined) || []);
  const ecosystemTags = rawTags.slice(0, 5).map(tagLabel).filter(Boolean);

  const hasAlternatives = alternatives.length > 0;
  void hasFreeplan;

  return (
    <div className="td-decision-card">

      {/* ── Identity: logo + name (the logo lives nowhere else on the page) ── */}
      <div className="td-decision-identity">
        <div className="td-decision-logo">
          <ToolLogo tool={tool as any} size={24} />
        </div>
        <p className="td-decision-name">{tool.name}</p>
      </div>

      {/* ── Score + verdict at a glance ── */}
      <div className="td-decision-verdict">
        <span className="td-decision-kicker">
          {t("Verdict ToolTrim", "ToolTrim Verdict")}
        </span>
        <div className="td-decision-score-row">
          <div className="td-decision-score">
            <span className="td-decision-score-value">{ts.score.toFixed(1)}</span>
            <span className="td-decision-score-max">/5</span>
          </div>
          <span className="td-decision-score-label">{t(ts.labelFr, ts.labelEn)}</span>
        </div>
        {verdictText && (
          <p className="td-decision-copy">{verdictText}</p>
        )}
      </div>

      {/* ── Ecosystem tags — what the tool covers, at a glance ── */}
      {ecosystemTags.length > 0 && (
        <div className="td-decision-tags">
          {ecosystemTags.map((tag) => (
            <span key={tag} className="td-decision-tag">{tag}</span>
          ))}
        </div>
      )}

      {/* ── 3 functional facts ── */}
      <div className="td-decision-facts">
        {metaRows.map(({ label, value }) => (
          <div key={label} className="td-decision-fact">
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {/* ── Actions ── */}
      <div className="td-decision-actions">
        <a
          href={primaryCtaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="td-decision-primary"
        >
          {hasAffiliateOffer ? t("Voir l'offre", "View offer") : isFree ? t("Essayer gratuitement", "Try for free") : t("Visiter le site", "Visit website")}
          <ExternalLink aria-hidden />
        </a>
        <Link
          to={getExplorerHref(prefix, { type: "outil", slug: tool.slug || tool.id })}
          state={{ explorerCanGoBack: true, explorerReturnTo: `${location.pathname}${location.search}`, previousSourceLabel: tool.name }}
          className="td-explore-action"
        >
          <Compass size={16} aria-hidden />
          {t(`Explorer autour de ${tool.name}`, `Explore around ${tool.name}`)}
        </Link>
        {/* Only when there are real alternatives to compare — otherwise the
            /alternatives sub-page is empty, so the button led nowhere. */}
        {hasAlternatives && (
          <Link
            to={`${prefix}/tool/${tool.slug || tool.id}/alternatives`}
            className="td-decision-secondary"
          >
            {t("Comparer les alternatives", "Compare alternatives")}
          </Link>
        )}
      </div>
    </div>
  );
}
