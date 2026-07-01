import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import ToolLogo from "@/components/ToolLogo";
import { useMemo } from "react";

/* Two columns of brand logos fading into the gradient, right side */
const LOGO_COL_1 = ["slack", "spline", "adobe", "loom"];
const LOGO_COL_2 = ["notion", "github", "figma", "webflow"];

const HeroSectionV2 = () => {
  const { lang, t, prefix } = useLang();
  const { tools } = useToolSummaries();

  const bySlug = useMemo(() => new Map(tools.map((tl) => [tl.slug, tl])), [tools]);
  const col1 = LOGO_COL_1.flatMap((slug) => { const tl = bySlug.get(slug); return tl ? [tl] : []; });
  const col2 = LOGO_COL_2.flatMap((slug) => { const tl = bySlug.get(slug); return tl ? [tl] : []; });

  return (
    <section className="hv2-root">
      <div
        className="hv2-container"
        style={{ maxWidth: "var(--layout-content, 1280px)", margin: "0 auto", padding: "0 var(--layout-gutter, 48px)" }}
      >
        <div className="hv2-band">
          <div className="hv2-grain" aria-hidden="true" />

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

          <div className="hv2-logos" aria-hidden="true">
            <div className="hv2-logo-col">
              {col1.map((tl) => (
                <span key={tl.id} className="hv2-logo-chip">
                  <ToolLogo tool={tl as any} size={28} />
                </span>
              ))}
            </div>
            <div className="hv2-logo-col hv2-logo-col--offset">
              {col2.map((tl) => (
                <span key={tl.id} className="hv2-logo-chip">
                  <ToolLogo tool={tl as any} size={28} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSectionV2;
