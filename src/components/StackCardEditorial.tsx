import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { STACKS } from "@/data/stacks";

/* ─────────────────────────────────────────────────────────────────────────────
   StackCardEditorial — editorial card for StacksPage listings.
   Two variants:
     "row"     — horizontal card in the main stacks list (image + body + data panel)
     "compact" — small grid card for profile recommendations
   Renders with ec-* CSS for the shell; layout is inline-structured per ToolTrim
   editorial palette.
───────────────────────────────────────────────────────────────────────────── */

type StackListItem = (typeof STACKS)[number];

/* ── Props ───────────────────────────────────────────────────────────────── */

interface StackCardBaseProps {
  stack: StackListItem;
  prefix: string;
  t: (fr: string | React.ReactNode, en: string | React.ReactNode) => string | React.ReactNode;
  lang?: "fr" | "en";
  personaTag: string;   // pre-translated persona label
  stageTag?: string;    // pre-translated stage label (row variant)
  isBase?: boolean;     // show "Base" badge
}

interface StackCardRowProps extends StackCardBaseProps {
  variant: "row";
  stackTools?: ToolSummary[];
  imageUrl?: string;
}

interface StackCardCompactProps extends StackCardBaseProps {
  variant: "compact";
}

export type StackCardEditorialProps = StackCardRowProps | StackCardCompactProps;

/* ── Component ───────────────────────────────────────────────────────────── */

export function StackCardEditorial(props: StackCardEditorialProps) {
  const { stack, prefix, t, lang = "fr", personaTag, isBase } = props;

  /* ── Compact variant ───── */
  if (props.variant === "compact") {
    return (
      <Link
        to={`${prefix}/stacks/${stack.slug}`}
        className="ec-card"
        style={{ padding: "16px 18px" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{
            fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.06em", textTransform: "uppercase" as const,
            color: "#6F6F68", border: "1px solid #DADAD4", borderRadius: 4, padding: "3px 8px",
          }}>
            {personaTag}
          </span>
          <ArrowRight
            className="ec-cta-arrow"
            style={{ width: 13, height: 13, color: "#ADADAD", flexShrink: 0 }}
          />
        </div>
        <div style={{
          fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 600,
          letterSpacing: "-0.02em", color: "#222222", lineHeight: 1.3, marginBottom: 6,
        }}>
          {t(stack.title, stack.titleEn)}
        </div>
        <p style={{
          fontFamily: "var(--font-ui)", fontSize: 13, color: "#6F6F68", lineHeight: 1.4,
          display: "-webkit-box" as any, WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as any, overflow: "hidden",
        }}>
          {t(stack.bestFor, stack.bestForEn)}
        </p>
      </Link>
    );
  }

  /* ── Row variant ─────────── */
  const { stackTools = [], imageUrl } = props as StackCardRowProps;
  const { stageTag } = props;

  return (
    <Link
      to={`${prefix}/stacks/${stack.slug}`}
      className="ec-card group"
      style={{ flexDirection: "row", padding: 0, overflow: "hidden" }}
    >
      {/* Image thumbnail */}
      {imageUrl && (
        <div
          style={{ width: 140, flexShrink: 0, overflow: "hidden", background: "#EDEDE8" }}
          className="hidden md:block"
        >
          <img
            src={imageUrl}
            alt={t(stack.title, stack.titleEn) as string}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 500ms ease" }}
            className="group-hover:scale-[1.04] transition-transform"
            loading="lazy"
          />
        </div>
      )}

      {/* Body */}
      <div
        style={{ flex: 1, minWidth: 0, padding: "18px 20px", display: "grid", gridTemplateColumns: "minmax(0,1fr) 11rem", gap: 16, alignItems: "center" }}
        className="lg:grid grid-cols-1"
      >
        {/* Left: tags + title + description */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            <span style={{
              fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600,
              letterSpacing: "0.06em", textTransform: "uppercase" as const,
              color: "#6F6F68", border: "1px solid #DADAD4", borderRadius: 4, padding: "2px 8px",
            }}>
              {personaTag}
            </span>
            {stageTag && (
              <span style={{
                fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600,
                letterSpacing: "0.06em", textTransform: "uppercase" as const,
                color: "#6F6F68", border: "1px solid #DADAD4", borderRadius: 4, padding: "2px 8px",
              }}>
                {stageTag}
              </span>
            )}
            {isBase && (
              <span style={{
                fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600,
                letterSpacing: "0.06em", textTransform: "uppercase" as const,
                color: "#222222", border: "1px solid #222222", borderRadius: 4, padding: "2px 8px",
              }}>
                {t("Base", "Base")}
              </span>
            )}
          </div>
          <div style={{
            fontFamily: "var(--font-brand)", fontSize: "clamp(1.05rem, 1.8vw, 1.3rem)",
            fontWeight: 600, letterSpacing: "-0.03em", color: "#222222", lineHeight: 1.2, marginBottom: 6,
          }}>
            {t(stack.title, stack.titleEn)}
          </div>
          <p style={{
            fontFamily: "var(--font-ui)", fontSize: 13, color: "#6F6F68", lineHeight: 1.4,
            display: "-webkit-box" as any, WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as any, overflow: "hidden",
          }}>
            {t(stack.risk, stack.riskEn)}
          </p>
        </div>

        {/* Right: tool logos + metrics + cta */}
        <div
          style={{ borderLeft: "1px solid #E7E7E0", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 12 }}
          className="hidden lg:flex"
        >
          {/* Tool logo strip */}
          <div style={{ display: "flex", gap: 4 }}>
            {stackTools.slice(0, 4).map((tool) => (
              <span
                key={tool.id}
                title={tool.name}
                style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #DADAD4", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <ToolLogo tool={tool as any} size={18} className="rounded" />
              </span>
            ))}
          </div>

          {/* Cost + count */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <span className="ec-meta-label">{t("COÛT", "COST")}</span>
              <span className="ec-meta-value">{stack.monthlyBudget}€</span>
            </div>
            <div>
              <span className="ec-meta-label">{t("OUTILS", "TOOLS")}</span>
              <span className="ec-meta-value">{stack.tools.length}</span>
            </div>
          </div>

          {/* CTA */}
          <span className="ec-cta" style={{ marginTop: 0, fontSize: 13 }}>
            {t("Voir", "View")}
            <ArrowRight className="ec-cta-arrow" style={{ width: 13, height: 13 }} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default StackCardEditorial;
