import { Link } from "react-router-dom";
import ToolLogo from "@/components/ToolLogo";
import { ExternalLink, Check, X, ArrowRight } from "lucide-react";
import { computeToolTrimScore } from "@/lib/toolTrimScore";
import { asText } from "@/lib/text";
import type { Tool } from "@/data/types";

/* ─────────────────────────────────────────────────────────────────────────────
   StickyDecisionCard
   Right sidebar: editorial score + verdict + best-for/limits + CTAs + metadata
   No stars. No gradients. No colored badges.
   Feels like a curated editorial card, not a SaaS dashboard widget.
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

const SEP_TOP = { borderTop: "1px solid #E7E7E0" } as const;

const TYPE_LABEL: Record<string, { fr: string; en: string }> = {
  ia:        { fr: "Intelligence artificielle", en: "AI tool"    },
  metier:    { fr: "Outil métier",               en: "Core tool"  },
  gestion:   { fr: "Gestion",                    en: "Management" },
  satellite: { fr: "Satellite",                  en: "Satellite"  },
  plugin:    { fr: "Plugin / Extension",          en: "Plugin"     },
};

export default function StickyDecisionCard({
  tool, displayPrice, verifiedOn,
  isFree, isFreemium, hasFreeplan, prefix, lang, t,
  primaryCtaUrl, hasAffiliateOffer, alternatives,
  catName, catNameEn,
}: Props) {

  const ts = computeToolTrimScore(tool);

  /* ── Verdict data ── */
  const verdict = lang === "en" && (tool as any).verdictEn ? (tool as any).verdictEn : tool.verdict;
  const keepItems: string[] = (Array.isArray(verdict?.keepIf)
    ? verdict.keepIf
    : [verdict?.keepIf]
  ).filter(Boolean).slice(0, 4);
  const avoidItems: string[] = (Array.isArray(verdict?.avoidIf)
    ? verdict.avoidIf
    : [verdict?.avoidIf]
  ).filter(Boolean).slice(0, 3);

  /* ── Verdict sentence — prefer verdict.threshold (editorial), then auto-generate ── */
  const verdictText = (() => {
    // Use the editorial threshold sentence when it exists
    const threshold = verdict?.threshold as string | undefined;
    if (threshold && threshold.length > 0) return threshold;
    // Fallback: build from keepIf + avoidIf
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

  const isAI = !!(tool as any).ia_use_case || (tool as any).tool_type === "ia";
  const toolType = (tool as any).tool_type as string;
  const typeLabel = toolType && TYPE_LABEL[toolType]
    ? t(TYPE_LABEL[toolType].fr, TYPE_LABEL[toolType].en)
    : t("Outil métier", "Business tool");

  const metaRows = [
    { label: t("Plan gratuit", "Free plan"),   value: hasFreeplan ? t("Oui", "Yes") : t("Non", "No") },
    { label: t("Modèle",       "Model"),        value: modelLabel },
    { label: t("IA intégrée",  "Built-in AI"),  value: isAI ? t("Oui", "Yes") : t("Non", "No") },
    { label: t("Type",         "Type"),          value: typeLabel },
    { label: t("Prix vérifié", "Price verified"), value: verifiedOn },
  ];

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #DADAD4",
      borderRadius: 10,
      overflow: "hidden",
    }}>

      {/* ── 1. Header ── */}
      <div style={{ padding: "24px 24px 20px" }}>
        <span style={{
          display: "block",
          fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600,
          letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F68",
          marginBottom: 14,
        }}>
          {t("Verdict ToolTrim", "ToolTrim Verdict")}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            border: "1px solid #DADAD4", background: "#F8F8F4",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <ToolLogo tool={tool as any} size={26} />
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-brand)", fontSize: 15, fontWeight: 600, letterSpacing: "-0.03em", color: "#222222", lineHeight: 1.2 }}>
              {tool.name}
            </p>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "#6F6F68", marginTop: 2 }}>
              {t(catName, catNameEn)}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Score ── */}
      <div style={{ ...SEP_TOP, borderBottom: "1px solid #E7E7E0", padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          {/* Large number */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 3, flexShrink: 0 }}>
            <span style={{
              fontFamily: "var(--font-brand)",
              fontSize: 72, fontWeight: 600, lineHeight: 0.9,
              letterSpacing: "-0.07em", color: "#222222",
            }}>
              {ts.score.toFixed(1)}
            </span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 22, fontWeight: 400, color: "#9A9A92", lineHeight: 1, paddingBottom: 8 }}>
              /5
            </span>
          </div>
          {/* Grade */}
          <div style={{ textAlign: "right" }}>
            <span style={{
              display: "block",
              fontFamily: "var(--font-ui)", fontSize: 17, fontWeight: 600,
              color: "hsl(var(--primary))", lineHeight: 1.15,
            }}>
              {t(ts.labelFr, ts.labelEn)}
            </span>
            <span style={{ display: "block", fontFamily: "var(--font-ui)", fontSize: 11, color: "#9A9A92", marginTop: 5, letterSpacing: "0.03em" }}>
              {t("Score éditorial", "Editorial score")}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Verdict text ── */}
      {verdictText && (
        <div style={{ padding: "20px 24px" }}>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, lineHeight: 1.6, color: "#222222" }}>
            {verdictText}
          </p>
        </div>
      )}

      {/* ── 4. Best for / Not ideal for ── */}
      {(keepItems.length > 0 || avoidItems.length > 0) && (
        <div style={{ ...SEP_TOP, padding: "20px 24px" }}>
          {keepItems.length > 0 && (
            <div style={{ marginBottom: avoidItems.length > 0 ? 16 : 0 }}>
              <p style={{
                fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600,
                letterSpacing: "0.06em", textTransform: "uppercase", color: "#6F6F68", marginBottom: 8,
              }}>
                {t("Idéal pour", "Best for")}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                {keepItems.map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontFamily: "var(--font-ui)", fontSize: 13, color: "#222222", lineHeight: 1.45 }}>
                    <Check style={{ width: 12, height: 12, flexShrink: 0, marginTop: 2, color: "#4A9B6F" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {avoidItems.length > 0 && (
            <div>
              <p style={{
                fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600,
                letterSpacing: "0.06em", textTransform: "uppercase", color: "#6F6F68", marginBottom: 8,
              }}>
                {t("Moins adapté si", "Not ideal if")}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                {avoidItems.map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontFamily: "var(--font-ui)", fontSize: 13, color: "#6F6F68", lineHeight: 1.45 }}>
                    <X style={{ width: 12, height: 12, flexShrink: 0, marginTop: 2, color: "#ADADAD" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── 5. CTAs ── */}
      <div style={{ ...SEP_TOP, padding: "20px 24px" }}>
        <a
          href={primaryCtaUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", height: 48,
            background: "#222222", color: "#FFFFFF",
            borderRadius: 8, border: "none",
            fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 500,
            textDecoration: "none", cursor: "pointer",
            transition: "background 160ms ease-out",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#000000"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#222222"; }}
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
            background: "transparent", color: "#222222",
            borderRadius: 8, border: "1px solid #DADAD4",
            fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 500,
            textDecoration: "none", marginTop: 10,
            transition: "all 160ms ease-out",
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#222222"; el.style.background = "#F8F8F4"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#DADAD4"; el.style.background = "transparent"; }}
        >
          {t("Comparer les alternatives", "Compare alternatives")}
        </Link>
      </div>

      {/* ── 6. Alternative recommandée ── */}
      {altName && (
        <div style={{ ...SEP_TOP, background: "#F8F8F4", padding: "20px 24px" }}>
          <p style={{
            fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F68", marginBottom: 10,
          }}>
            {t("Alternative recommandée", "Recommended alternative")}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            {altTool && (
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                border: "1px solid #DADAD4", background: "#FFFFFF",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <ToolLogo tool={altTool as any} size={18} />
              </div>
            )}
            <span style={{ fontFamily: "var(--font-brand)", fontSize: 15, fontWeight: 600, letterSpacing: "-0.03em", color: "#222222" }}>
              {altName}
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "#6F6F68", lineHeight: 1.5, marginBottom: 10 }}>
            {altReason}
          </p>
          {altTool && (
            <Link
              to={`${prefix}/tool/${(altTool as any).slug || altTool.id}`}
              style={{
                fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500,
                color: "hsl(var(--primary))", textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}
            >
              {t("Voir la fiche", "See review")}
              <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          )}
        </div>
      )}

      {/* ── 7. Metadata ── */}
      <div style={{ ...SEP_TOP, padding: "16px 24px" }}>
        {metaRows.map(({ label, value }, i) => (
          <div
            key={label}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 0",
              borderBottom: i < metaRows.length - 1 ? "1px solid #E7E7E0" : "none",
            }}
          >
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "#6F6F68" }}>{label}</span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500, color: "#222222" }}>{value}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
