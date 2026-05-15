import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface Props {
  tool: { name: string; slug?: string; id: string; [key: string]: any };
  prefix: string;
  lang: string;
  t: (fr: string, en: string) => string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   ToolDiagCta — editorial audit band
   Full-width band, no rounded card, no blue gradient.
   Used as a standalone section outside the body-grid in ToolDetailPage.
───────────────────────────────────────────────────────────────────────────── */
export default function ToolDiagCta({ tool, prefix, lang, t }: Props) {
  const slug = tool.slug || tool.id;

  return (
    <div style={{
      borderTop: "1px solid #DADAD4",
      borderBottom: "1px solid #DADAD4",
      background: "#F8F8F4",
      padding: "56px 0",
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 48,
        alignItems: "center",
      }}>
        <div>
          <span style={{
            display: "block",
            fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F68",
            marginBottom: 14,
          }}>
            {t("AUDIT DE STACK", "STACK AUDIT")}
          </span>
          <h2 style={{
            fontFamily: "var(--font-brand)",
            fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
            fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.045em",
            color: "#222222", margin: "0 0 16px",
          }}>
            {t(
              `${tool.name} fait partie de ta stack ?`,
              `Is ${tool.name} part of your stack?`,
            )}
          </h2>
          <p style={{
            fontFamily: "var(--font-ui)", fontSize: 17, lineHeight: 1.5,
            color: "#6F6F68", maxWidth: 560, margin: 0,
          }}>
            {t(
              "Vérifie en quelques minutes si tu l'utilises vraiment, si tu le paies au bon prix, et quels outils peuvent être challengés autour de lui.",
              "Find out in a few minutes if you're actually using it, paying the right price, and which tools around it can be challenged.",
            )}
          </p>
          <p style={{
            fontFamily: "var(--font-ui)", fontSize: 13, color: "#9A9A92",
            marginTop: 14, letterSpacing: "-0.01em",
          }}>
            {t("Gratuit · 5 minutes · Résultat personnalisé", "Free · 5 minutes · Personalised result")}
          </p>
        </div>

        <Link
          to={`${prefix}/selector?from=${slug}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            height: 48, padding: "0 22px",
            background: "#222222", color: "#FFFFFF",
            borderRadius: 8, border: "none",
            fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 500,
            textDecoration: "none", letterSpacing: "-0.01em",
            transition: "background 160ms ease-out", flexShrink: 0, whiteSpace: "nowrap",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#000000"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#222222"; }}
        >
          {t("Auditer ma stack", "Audit my stack")}
          <ArrowRight style={{ width: 14, height: 14 }} />
        </Link>
      </div>
    </div>
  );
}
