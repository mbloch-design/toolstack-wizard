import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { ArrowRight } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   FinalCTA — editorial CTA band
   es-section--band (#EDEDE8). Black CTA. No blue gradient.
───────────────────────────────────────────────────────────────────────────── */

const FinalCTA = () => {
  const { t, prefix } = useLang();

  return (
    <section className="es-section es-section--band">
      <div className="es-container">
        <div style={{ maxWidth: 640 }}>
          <span className="es-eyebrow">{t("Maintenant", "Now")}</span>
          <h2 className="es-title" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
            {t("Ta stack a peut-être un trou de 30 à 50 € par mois. Tu le sauras en 3 minutes.", "Your stack may have a €30 to €50 monthly leak. You’ll know in 3 minutes.")}
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 36, flexWrap: "wrap" }}>
            <Link
              to={`${prefix}/selector`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 48,
                padding: "0 24px",
                background: "#222222",
                color: "#FFFFFF",
                borderRadius: "var(--radius)",
                fontFamily: "var(--font-ui)",
                fontSize: 15,
                fontWeight: 500,
                textDecoration: "none",
                transition: "opacity 160ms ease-out",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              {t("Auditer ma stack", "Audit my stack")}
              <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 12,
                color: "#6F6F68",
                letterSpacing: "0.04em",
              }}
            >
              {t("Sans inscription · Sans carte bancaire", "No signup · No credit card")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
