import { Link } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";

const HeroSectionV2 = () => {
  const { t, lang, prefix } = useLang();
  const { state: cartState } = useStackPins();
  const cartCount = cartState.pinnedToolSlugs.length;
  const cartLabel = cartCount > 0
    ? `${t("Ma stack", "My stack")} · ${cartCount}`
    : t("Ma stack", "My stack");

  return (
    <section className="hv2-root">
      <div className="hv2-container">
        <div className="hv2-band">
          <img src="/hero/hero-gradient.png" alt="" className="hv2-bg" aria-hidden="true" />

          <div className="hv2-content">
            <span className="hv2-eyebrow">
              {t("Pour les freelances et solopreneurs", "For freelancers and solopreneurs")}
            </span>

            <h1 className="hv2-title">
              {lang === "fr"
                ? <>Tu paies des outils que tu n’utilises plus.<br />Il est temps de le savoir.</>
                : <>You pay for tools you no longer use.<br />It’s time to find out.</>}
            </h1>

            <Link to={`${prefix}/ma-stack`} className="hv2-cta" aria-label={cartLabel}>
              <Bookmark style={{ width: 15, height: 15 }} aria-hidden />
              <span>{cartLabel}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSectionV2;
