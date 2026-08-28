import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";

const HeroSectionV2 = () => {
  const { t, lang, prefix } = useLang();
  const auditLabel = t("Auditer ma stack", "Audit my stack");

  return (
    <section className="hv2-root">
      <div className="hv2-container">
        <div className="hv2-band">
          <picture>
            <source
              type="image/webp"
              srcSet="/hero/hero-gradient-960.webp 960w, /hero/hero-gradient-1800.webp 1800w"
              sizes="(max-width: 960px) 100vw, 1280px"
            />
            <img
              src="/hero/hero-gradient-1800.webp"
              alt=""
              className="hv2-bg"
              width="1800"
              height="418"
              fetchPriority="high"
              decoding="async"
              aria-hidden="true"
            />
          </picture>

          <div className="hv2-content">
            <span className="hv2-eyebrow">
              {t("Pour les indépendants et petites équipes", "For freelancers and small teams")}
            </span>

            <h1 className="hv2-title">
              {lang === "fr"
                ? <>Décidez quels logiciels garder,<br />remplacer ou ajouter.</>
                : <>Decide which software to keep,<br />replace, or add.</>}
            </h1>

            <p className="hv2-description">
              {t(
                "Analysez vos abonnements, repérez les doublons et obtenez une prochaine décision claire en 3 minutes.",
                "Review your subscriptions, spot overlapping tools, and get one clear next decision in 3 minutes.",
              )}
            </p>

            <Link to={`${prefix}/selector`} className="hv2-cta" aria-label={auditLabel}>
              <span>{auditLabel}</span>
            </Link>
            <span className="hv2-reassurance">
              {t("Sans inscription · Sans carte bancaire", "No signup · No credit card")}
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSectionV2;
