import { Link } from "react-router-dom";
import { ArrowRight } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import logoToolTrim from "@/assets/logo-tooltrim.svg";

/**
 * Editorial footer: restrained utility layout:
 *   1. Brand promise + two clear continuations
 *   2. Compact navigation organised by intent
 *   3. Quiet legal rail
 *
 * Uses ToolTrim design tokens only (no shadcn hsl vars, no Tailwind utility
 * styling). Inherits the page's editorial voice and signature set.
 */
const Footer = () => {
  const { t, prefix } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="tt-footer" role="contentinfo">

      {/* 1. Baseline: editorial tagline + brand intro */}
      <section className="tt-footer-baseline">
        <div className="tt-footer-container">
          <div className="tt-footer-baseline-grid">
            <div className="tt-footer-baseline-copy">
              <p className="tt-footer-tagline">
                {t("Choisir, pas empiler.", "Choose, don't stack.")}
              </p>
              <p className="tt-footer-intro">
                {t(
                  "ToolTrim aide les freelances à choisir, comparer et rationaliser leurs outils SaaS, sans empiler les abonnements.",
                  "ToolTrim helps freelancers choose, compare and streamline their SaaS tools without piling up subscriptions.",
                )}
              </p>
            </div>
            <div className="tt-footer-actions" aria-label={t("Continuer avec ToolTrim", "Continue with ToolTrim")}>
              <Link className="tt-footer-action tt-footer-action--primary" to={`${prefix}/ma-stack`}>
                <span>{t("Composer ma stack", "Build my stack")}</span>
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link className="tt-footer-action tt-footer-action--secondary" to={`${prefix}/tools`}>
                <span>{t("Explorer les outils", "Explore tools")}</span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Links: three asymmetric editorial columns */}
      <section className="tt-footer-links">
        <div className="tt-footer-container">
          <div className="tt-footer-grid">

            <div className="tt-footer-brand" aria-label="ToolTrim">
              <img
                src={logoToolTrim}
                alt="ToolTrim"
                className="tt-footer-logo"
                width={1362}
                height={300}
              />
              <p>{t("Les bons outils, sans les abonnements inutiles.", "The right tools, without unnecessary subscriptions.")}</p>
            </div>

            <nav aria-label={t("Décider", "Decide")} className="tt-footer-col">
              <span className="tt-footer-col-label">{t("Décider", "Decide")}</span>
              <Link to={`${prefix}/comparatifs`}>{t("Comparatifs", "Comparisons")}</Link>
              <Link to={`${prefix}/guides`}>{t("Guides", "Guides")}</Link>
              <Link to={`${prefix}/methodology`}>{t("Méthodologie éditoriale", "Editorial methodology")}</Link>
              <Link to={`${prefix}/transparency`}>{t("Transparence", "Transparency")}</Link>
            </nav>

            <nav aria-label={t("Explorer", "Explore")} className="tt-footer-col">
              <span className="tt-footer-col-label">{t("Explorer", "Explore")}</span>
              <Link to={`${prefix}/tools`}>{t("Catalogue des outils", "Tool catalog")}</Link>
              <Link to={`${prefix}/stacks`}>{t("Stacks", "Stacks")}</Link>
              <Link to={`${prefix}/category`}>{t("Toutes les catégories", "All categories")}</Link>
            </nav>

            <nav aria-label="ToolTrim" className="tt-footer-col tt-footer-col--wide">
              <span className="tt-footer-col-label">ToolTrim</span>
              <Link to={`${prefix}/about`}>{t("Qui est ToolTrim", "Who is ToolTrim")}</Link>
              <Link to={`${prefix}/contact`}>{t("Contact", "Contact")}</Link>
              <Link to={`${prefix}/contact?subject=submit-tool`}>{t("Soumettre un outil", "Submit a tool")}</Link>
            </nav>

          </div>
        </div>
      </section>

      {/* ── 3. Quiet legal rail ────────────────────────────────────── */}
      <section className="tt-footer-signature">
        <div className="tt-footer-container">
          <div className="tt-footer-meta">
            <div className="tt-footer-legal">
              <span className="tt-footer-copyright">© {year} ToolTrim</span>
              <Link to={`${prefix}/legal-notice`}>{t("Mentions légales", "Legal notice")}</Link>
              <Link to={`${prefix}/privacy-policy`}>{t("Confidentialité", "Privacy")}</Link>
              <Link to={`${prefix}/terms`}>{t("CGV", "Terms")}</Link>
            </div>
            <div className="tt-footer-badges">
              <a
                href="https://dang.ai"
                target="_blank"
                rel="dofollow noopener"
                className="tt-footer-badge"
                aria-label="Verified on DANG!"
              >
                <img
                  className="tt-footer-badge-light"
                  src="https://assets.dang.ai/badges/dang-verified-dark.png"
                  alt="Verified on DANG!"
                  width={260}
                  height={94}
                  loading="lazy"
                />
                <img
                  className="tt-footer-badge-dark"
                  src="https://assets.dang.ai/badges/dang-verified-light.png"
                  alt="Verified on DANG!"
                  width={260}
                  height={94}
                  loading="lazy"
                />
              </a>
              <a
                href="https://neeed.directory"
                target="_blank"
                rel="noopener"
                className="tt-footer-badge"
                aria-label="Featured on neeed.directory"
              >
                <img
                  className="tt-footer-badge-light"
                  src="https://neeed.directory/badges/neeed-badge-light.svg"
                  alt="Featured on neeed.directory"
                  width={139}
                  loading="lazy"
                />
                <img
                  className="tt-footer-badge-dark"
                  src="https://neeed.directory/badges/neeed-badge-dark.svg"
                  alt="Featured on neeed.directory"
                  width={139}
                  loading="lazy"
                />
              </a>
            </div>
          </div>
        </div>
      </section>

    </footer>
  );
};

export default Footer;
