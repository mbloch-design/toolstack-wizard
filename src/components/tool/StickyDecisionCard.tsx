import { Link } from "react-router-dom";
import ToolLogo from "@/components/ToolLogo";
import { ExternalLink, ArrowRight } from "lucide-react";
import { computeToolTrimScore } from "@/lib/toolTrimScore";
import { asText } from "@/lib/text";
import type { Tool } from "@/data/types";

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
  const verdict = lang === "en" && (tool as any).verdictEn ? (tool as any).verdictEn : tool.verdict;
  const keepItems: string[] = (Array.isArray(verdict?.keepIf) ? verdict.keepIf : [verdict?.keepIf]).filter(Boolean);
  const avoidItems: string[] = (Array.isArray(verdict?.avoidIf) ? verdict.avoidIf : [verdict?.avoidIf]).filter(Boolean);

  const verdictText = (() => {
    const threshold = verdict?.threshold as string | undefined;
    if (threshold && threshold.length > 0) return threshold;
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

  /* ── Alternative ── */
  const freeAlt = (tool as any).freeAlternative as string | null;
  const betterAlt = (tool as any).betterAlternative as { tool: string; saving?: number; reason?: string } | null;
  const rawAltId = betterAlt?.tool || freeAlt;
  const altName = rawAltId ? asText(rawAltId).split(/[\s([/]/)[0] : null;
  const altTool = rawAltId
    ? alternatives.find(a => a.id === rawAltId || a.slug === rawAltId || (a.name ?? "").toLowerCase() === (altName ?? "").toLowerCase())
    : null;
  const altReason = betterAlt?.reason
    || (lang === "fr"
      ? "Alternative moins chère pour des usages similaires."
      : "Cheaper alternative for similar needs.");

  /* ── Labels ── */
  const priceLabel = isFree
    ? t("Gratuit", "Free")
    : isFreemium
    ? "Freemium"
    : displayPrice > 0
    ? `${displayPrice}€/${t("mois", "mo")}`
    : t("Sur devis", "On request");

  const modelLabel = isFree
    ? t("Gratuit", "Free")
    : isFreemium
    ? "Freemium"
    : t("Payant", "Paid");

  /* ── Key facts: 4 rows ── */
  const metaRows = [
    { label: t("Plan gratuit", "Free plan"), value: hasFreeplan ? t("Oui", "Yes") : t("Non", "No") },
    { label: t("Modèle",       "Model"),     value: modelLabel },
    {
      label: displayPrice > 0
        ? t("Prix à partir de", "From")
        : t("Prix", "Price"),
      value: priceLabel,
    },
    { label: t("Vérifié le",   "Verified"),  value: verifiedOn },
  ];

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: 10,
      overflow: "hidden",
    }}>

      {/* ── 1. Header ── */}
      <div style={{ padding: "24px 24px 20px" }}>
        <span style={{
          display: "block",
          fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600,
          letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-muted)",
          marginBottom: 14,
        }}>
          {t("Verdict ToolTrim", "ToolTrim Verdict")}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            border: "1px solid var(--color-border)", background: "var(--color-bg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <ToolLogo tool={tool as any} size={26} />
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-brand)", fontSize: 15, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--color-text)", lineHeight: 1.2 }}>
              {tool.name}
            </p>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
              {t(catName, catNameEn)}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Score ── */}
      <div style={{ borderTop: "1px solid var(--color-border-soft)", padding: "20px 24px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3, flexShrink: 0 }}>
            <span style={{
              fontFamily: "var(--font-brand)",
              fontSize: 64, fontWeight: 600, lineHeight: 0.9,
              letterSpacing: "-0.07em", color: "var(--color-text)",
            }}>
              {ts.score.toFixed(1)}
            </span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 20, fontWeight: 400, color: "var(--color-muted-light)", lineHeight: 1, paddingBottom: 6 }}>
              /5
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{
              display: "block",
              fontFamily: "var(--font-ui)", fontSize: 17, fontWeight: 600,
              color: "var(--color-text-strong)", lineHeight: 1.15,
            }}>
              {t(ts.labelFr, ts.labelEn)}
            </span>
            <span style={{ display: "block", fontFamily: "var(--font-ui)", fontSize: 11, color: "var(--color-muted-light)", marginTop: 4, letterSpacing: "0.03em" }}>
              {t("Score éditorial", "Editorial score")}
            </span>
          </div>
        </div>

        {/* ── 3. Decision sentence — sits tight under the score ── */}
        {verdictText && (
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 16, lineHeight: 1.55, color: "var(--color-text)", marginTop: 16 }}>
            {verdictText}
          </p>
        )}
      </div>

      {/* ── 4. CTAs ── */}
      <div style={{ borderTop: "1px solid var(--color-border-soft)", padding: "20px 24px" }}>
        <a
          href={primaryCtaUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", height: 48,
            background: "var(--color-text)", color: "var(--color-surface)",
            borderRadius: 8, border: "none",
            fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 500,
            textDecoration: "none", cursor: "pointer",
            transition: "background 160ms ease-out",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-hover, #1a1a18)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-text)"; }}
        >
          {hasAffiliateOffer
            ? t("Voir l'offre", "View offer")
            : isFree
            ? t("Essayer gratuitement", "Try for free")
            : t("Visiter le site", "Visit website")}
          <ExternalLink style={{ width: 14, height: 14 }} />
        </a>

        <Link
          to={`${prefix}/tool/${(tool as any).slug || tool.id}/alternatives`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", height: 44,
            background: "transparent", color: "var(--color-text)",
            borderRadius: 8, border: "1px solid var(--color-border)",
            fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 500,
            textDecoration: "none", marginTop: 10,
            transition: "all 160ms ease-out",
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--color-text)"; el.style.background = "var(--color-bg)"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--color-border)"; el.style.background = "transparent"; }}
        >
          {t("Comparer les alternatives", "Compare alternatives")}
        </Link>
      </div>

      {/* ── 5. Key facts (4 rows) ── */}
      <div style={{ borderTop: "1px solid var(--color-border-soft)", padding: "12px 24px 16px" }}>
        {metaRows.map(({ label, value }, i) => (
          <div
            key={label}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: i < metaRows.length - 1 ? "1px solid var(--color-border-soft)" : "none",
            }}
          >
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--color-muted)" }}>{label}</span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── 6. Alternative recommandée ── */}
      {altName && (
        <div style={{ borderTop: "1px solid var(--color-border-soft)", background: "var(--color-bg)", padding: "18px 24px" }}>
          <p style={{
            fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 10,
          }}>
            {t("Alternative recommandée", "Recommended alternative")}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            {altTool && (
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                border: "1px solid var(--color-border)", background: "var(--color-surface)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <ToolLogo tool={altTool as any} size={18} />
              </div>
            )}
            <span style={{ fontFamily: "var(--font-brand)", fontSize: 15, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--color-text)" }}>
              {altName}
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--color-muted)", lineHeight: 1.5, marginBottom: 10 }}>
            {altReason}
          </p>
          {altTool && (
            <Link
              to={`${prefix}/tool/${(altTool as any).slug || altTool.id}`}
              className="td-cardlink"
              style={{
                fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500,
                color: "var(--color-text-strong)", textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}
            >
              {t("Voir la fiche", "See review")}
              <ArrowRight style={{ width: 12, height: 12 }} className="td-cardlink-arrow" />
            </Link>
          )}
        </div>
      )}

    </div>
  );
}
