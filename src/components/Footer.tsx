import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import logoToolTrim from "@/assets/logo-tooltrim.svg";

/**
 * Editorial footer — three strata:
 *   1. Baseline: brand tagline + one-sentence intro
 *   2. Links: three asymmetric columns
 *   3. Signature: brand mark XL + monospace meta bar (date, legal, copyright)
 *
 * Uses ToolTrim design tokens only (no shadcn hsl vars, no Tailwind utility
 * styling). Inherits the page's editorial voice and signature set.
 */
const Footer = () => {
  const { t, prefix, lang } = useLang();
  const year = new Date().getFullYear();
  const monthFr = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const monthEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const updatedStamp = lang === "fr"
    ? `Mis à jour · ${monthFr[now.getMonth()]} ${now.getFullYear()}`
    : `Updated · ${monthEn[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <footer className="tt-footer" role="contentinfo">

      {/* ── 1. Baseline — editorial tagline + brand intro ───────────── */}
      <section className="tt-footer-baseline">
        <div className="tt-footer-container">
          <p className="tt-footer-tagline">
            {t("Choisir, pas empiler.", "Choose, don't stack.")}
          </p>
          <p className="tt-footer-intro">
            {t(
              "ToolTrim aide les freelances et fondateurs solo à choisir les bons outils SaaS — pas à en découvrir de nouveaux.",
              "ToolTrim helps freelancers and solo founders choose the right SaaS tools — not discover new ones.",
            )}
          </p>
        </div>
      </section>

      {/* ── 2. Links — three asymmetric editorial columns ──────────── */}
      <section className="tt-footer-links">
        <div className="tt-footer-container">
          <div className="tt-footer-grid">

            <nav aria-label={t("Produit", "Product")} className="tt-footer-col">
              <span className="tt-footer-col-label">{t("Produit", "Product")}</span>
              <Link to={`${prefix}/selector`}>{t("Audit de stack", "Stack audit")}</Link>
              <Link to={`${prefix}/tools`}>{t("Catalogue", "Catalog")}</Link>
              <Link to={`${prefix}/comparatifs`}>{t("Comparatifs", "Comparisons")}</Link>
              <Link to={`${prefix}/guides`}>{t("Guides", "Guides")}</Link>
              <Link to={`${prefix}/stacks`}>{t("Stacks", "Stacks")}</Link>
            </nav>

            <nav aria-label={t("Catégories", "Categories")} className="tt-footer-col">
              <span className="tt-footer-col-label">{t("Catégories", "Categories")}</span>
              <Link to={`${prefix}/category/ia-generaliste`}>{t("IA", "AI")}</Link>
              <Link to={`${prefix}/category/organisation`}>{t("Organisation", "Organization")}</Link>
              <Link to={`${prefix}/category/creation-design`}>{t("Design", "Design")}</Link>
              <Link to={`${prefix}/category/automatisation`}>{t("Automatisation", "Automation")}</Link>
              <Link to={`${prefix}/category`}>{t("Toutes les catégories", "All categories")}</Link>
            </nav>

            <nav aria-label={t("À propos", "About")} className="tt-footer-col tt-footer-col--wide">
              <span className="tt-footer-col-label">{t("À propos", "About")}</span>
              <Link to={`${prefix}/about`}>{t("Qui est ToolTrim", "Who is ToolTrim")}</Link>
              <Link to={`${prefix}/methodology`}>{t("Méthodologie éditoriale", "Editorial methodology")}</Link>
              <Link to={`${prefix}/transparency`}>{t("Transparence", "Transparency")}</Link>
              <Link to={`${prefix}/contact`}>{t("Contact", "Contact")}</Link>
              <Link to={`${prefix}/contact?subject=submit-tool`}>{t("Soumettre un outil", "Submit a tool")}</Link>
            </nav>

          </div>
        </div>
      </section>

      {/* ── 3. Signature — brand logo XL + meta bar ────────────────── */}
      <section className="tt-footer-signature">
        <div className="tt-footer-container">
          <img
            src={logoToolTrim}
            alt="ToolTrim"
            className="tt-footer-logo"
            width={1362}
            height={300}
          />

          <div className="tt-footer-meta">
            <time className="tt-footer-stamp">{updatedStamp}</time>
            <div className="tt-footer-legal">
              <span className="tt-footer-copyright">© {year} ToolTrim</span>
              <span className="tt-footer-sep" aria-hidden="true">·</span>
              <Link to={`${prefix}/legal-notice`}>{t("Mentions", "Legal")}</Link>
              <span className="tt-footer-sep" aria-hidden="true">·</span>
              <Link to={`${prefix}/privacy-policy`}>{t("Confidentialité", "Privacy")}</Link>
              <span className="tt-footer-sep" aria-hidden="true">·</span>
              <Link to={`${prefix}/terms`}>{t("CGV", "Terms")}</Link>
            </div>
          </div>
        </div>
      </section>

    </footer>
  );
};

export default Footer;
