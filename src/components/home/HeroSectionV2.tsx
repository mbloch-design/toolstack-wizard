import { Link } from "react-router-dom";
import { Bookmark } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";

const HeroSectionV2 = () => {
  const { t, lang, prefix } = useLang();
  const { state: cartState } = useStackPins();
  const cartCount = cartState.pinnedToolSlugs.length;
  const cartLabel = cartCount > 0
    ? `${t("Ma stack", "My stack")} · ${cartCount}`
    : t("Auditer ma stack", "Audit my stack");

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

            <p className="hv2-subtitle">
              {t(
                "Construisez votre stack et voyez où vous payez trop, où vous avez des doublons, ou où il vous manque le bon outil.",
                "Build your stack and see where you're overspending, overlapping, or missing the right tool.",
              )}
            </p>

            <div className="hv2-actions">
              <Link to={`${prefix}/ma-stack`} className="hv2-cta" aria-label={cartLabel}>
                <Bookmark style={{ width: 15, height: 15 }} aria-hidden />
                <span>{cartLabel}</span>
              </Link>
              <Link to={`${prefix}/tools`} className="hv2-cta-secondary">
                {t("Explorer les outils", "Explore tools")}
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSectionV2;
