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
          <span className="es-eyebrow">{t("Prêt ?", "Ready?")}</span>
          <h2 className="es-title" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
            {t("Combien payez-vous de trop ?", "How much are you overpaying?")}
          </h2>
          <p className="es-description" style={{ marginTop: 20 }}>
            {t(
              "La moyenne est 847€/an. Pour certains profils, c'est le double. Découvrez le vôtre en moins de 3 minutes.",
              "The average is €847/yr. For some profiles, it's double. Discover yours in under 3 minutes."
            )}
          </p>

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
                borderRadius: 8,
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
              {t("Analyser ma stack gratuitement", "Analyze my stack for free")}
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
