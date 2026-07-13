import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { computeToolTrimScore } from "@/lib/toolTrimScore";
import { formatPriceLabel, resolveVerdict } from "@/lib/toolUtils";
import type { Tool } from "@/data/types";

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
    <div style={{
      background: "var(--color-surface-soft)",
      border: "1px solid var(--color-border)",
      borderRadius: 16,
      padding: "20px 22px 22px",
      display: "grid",
      gap: 16,
    }}>

      {/* ── Identity: logo + name (the logo lives nowhere else on the page) ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 9,
          border: "1px solid var(--color-border)", background: "var(--color-bg)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <ToolLogo tool={tool as any} size={24} />
        </div>
        <p style={{
          fontFamily: "var(--font-brand)", fontSize: 15, fontWeight: 600,
          letterSpacing: "-0.02em", color: "var(--color-text)", lineHeight: 1.2,
          margin: 0, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {tool.name}
        </p>
      </div>

      {/* ── Score + verdict at a glance ── */}
      <div>
        <span style={{
          display: "block",
          fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600,
          letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-muted)",
          marginBottom: 12,
        }}>
          {t("Verdict ToolTrim", "ToolTrim Verdict")}
        </span>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={{ fontFamily: "var(--font-brand)", fontSize: 52, fontWeight: 600, lineHeight: 0.9, letterSpacing: "-0.06em", color: "var(--color-text)" }}>
              {ts.score.toFixed(1)}
            </span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 17, fontWeight: 400, color: "var(--color-muted-light)", paddingBottom: 5 }}>/5</span>
          </div>
          <span style={{ fontFamily: "var(--font-ui)", fontSize: 16, fontWeight: 600, color: "var(--color-text-strong)", textAlign: "right" }}>
            {t(ts.labelFr, ts.labelEn)}
          </span>
        </div>
        {verdictText && (
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 14.5, lineHeight: 1.5, color: "var(--color-text)", margin: "12px 0 0" }}>
            {verdictText}
          </p>
        )}
      </div>

      {/* ── Ecosystem tags — what the tool covers, at a glance ── */}
      {ecosystemTags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ecosystemTags.map((tag) => (
            <span key={tag} style={{
              display: "inline-flex", alignItems: "center",
              height: 24, padding: "0 10px",
              background: "var(--color-surface)", border: "1px solid var(--color-border)",
              borderRadius: 999, fontFamily: "var(--font-ui)", fontSize: 12,
              color: "var(--color-muted)", whiteSpace: "nowrap",
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ── 3 functional facts ── */}
      <div style={{ display: "grid", gap: 0, borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
        {metaRows.map(({ label, value }, i) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            padding: "10px 0",
            borderTop: i > 0 ? "1px solid var(--color-border-soft)" : "none",
          }}>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--color-muted)", flexShrink: 0 }}>{label}</span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 600, color: "var(--color-text)", textAlign: "right" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Actions ── */}
      <div style={{ display: "grid", gap: 8 }}>
        <a
          href={primaryCtaUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            height: 46, background: "var(--color-text)", color: "var(--color-surface)",
            borderRadius: 8, fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 500,
            textDecoration: "none",
          }}
        >
          {hasAffiliateOffer ? t("Voir l'offre", "View offer") : isFree ? t("Essayer gratuitement", "Try for free") : t("Visiter le site", "Visit website")}
          <ExternalLink style={{ width: 14, height: 14 }} />
        </a>
        {/* Only when there are real alternatives to compare — otherwise the
            /alternatives sub-page is empty, so the button led nowhere. */}
        {hasAlternatives && (
          <Link
            to={`${prefix}/tool/${(tool as any).slug || tool.id}/alternatives`}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 42, background: "transparent", color: "var(--color-text)",
              border: "1px solid var(--color-border)", borderRadius: 8,
              fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 500, textDecoration: "none",
            }}
          >
            {t("Comparer les alternatives", "Compare alternatives")}
          </Link>
        )}
      </div>
    </div>
  );
}

