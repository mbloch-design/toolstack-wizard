import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";

const HeroSectionV2 = () => {
  const { t, lang, prefix } = useLang();

  return (
    <section className="hv2-root">
      <div
        className="hv2-container"
        style={{ maxWidth: "var(--layout-content, 1280px)", margin: "0 auto", padding: "0 var(--layout-gutter, 48px)" }}
      >
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

            <Link to={`${prefix}/selector`} className="hv2-cta">
              {t("Auditer ma stack", "Audit my stack")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSectionV2;
