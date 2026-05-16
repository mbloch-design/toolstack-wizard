import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { ArrowRight } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   HeroSection — repositionnement home ToolTrim.
   Centré sur l'audit de stack, pas sur le catalogue d'outils.
   Suppression : barre de recherche, chips d'outils, stat "X outils couverts".
   Ton : direct, tutoiement, pas de superlatifs.
───────────────────────────────────────────────────────────────────────────── */

const HeroSection = () => {
  const { t, prefix } = useLang();

  return (
    <section
      className="eh-root eh-root--centered"
      style={{ minHeight: "clamp(480px, 72vh, 760px)", display: "flex", alignItems: "center" }}
    >
      <div className="eh-container w-full" style={{ paddingTop: 80, paddingBottom: 72 }}>

        {/* Eyebrow */}
        <span className="eh-eyebrow" style={{ marginBottom: 28 }}>
          {t(
            "pour les freelances et solopreneurs",
            "for freelancers and solopreneurs",
          )}
        </span>

        {/* Title */}
        <h1 className="eh-title">
          {t(
            <>Arrête d'empiler les outils.<br />Construis une stack qui travaille<br />vraiment pour toi.</>,
            <>Stop stacking tools.<br />Build a stack that actually<br />works for you.</>,
          )}
        </h1>

        {/* Description */}
        <p className="eh-description" style={{ maxWidth: 580 }}>
          {t(
            "ToolTrim aide les freelances et solopreneurs à auditer leurs abonnements, repérer les doublons et choisir les outils qui valent vraiment le coût.",
            "ToolTrim helps freelancers and solopreneurs audit their subscriptions, spot duplicates and pick tools that are actually worth the cost.",
          )}
        </p>

        {/* CTA group */}
        <div className="eh-cta-group" style={{ justifyContent: "center", marginTop: 40 }}>
          <Link to={`${prefix}/selector`} className="eh-cta-primary">
            {t("Auditer ma stack", "Audit my stack")}
            <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
          <Link to={`${prefix}/stacks`} className="eh-cta-secondary">
            {t("Explorer les stacks types", "Browse stack templates")}
          </Link>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
