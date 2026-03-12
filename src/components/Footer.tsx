import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import pictoLogo from "@/assets/picto-logo.svg";

const Footer = () => {
  const { t, prefix } = useLang();

  return (
    <footer className="border-t border-border bg-secondary/50 py-12">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <img src={pictoLogo} alt="ToolTrim" className="h-7 w-7 rounded-md" />
              <p className="text-lg font-extrabold tracking-tighter">Tool<span className="text-primary">trim</span></p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("Arrêtez de payer trop cher pour vos outils.", "Stop overpaying for your tools.")}
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">{t("Produit", "Product")}</p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to={`${prefix}/selector`} className="hover:text-foreground">{t("Sélecteur", "Selector")}</Link>
              <Link to={`${prefix}/tools`} className="hover:text-foreground">{t("Catalogue", "Catalog")}</Link>
              <Link to={`${prefix}/guides`} className="hover:text-foreground">{t("Guides", "Guides")}</Link>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">{t("Entreprise", "Company")}</p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to={`${prefix}/about`} className="hover:text-foreground">{t("À propos", "About")}</Link>
              <Link to={`${prefix}/methodology`} className="hover:text-foreground">{t("Méthodologie", "Methodology")}</Link>
              <Link to={`${prefix}/transparency`} className="hover:text-foreground">{t("Transparence", "Transparency")}</Link>
              <Link to={`${prefix}/contact`} className="hover:text-foreground">Contact</Link>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">{t("Légal", "Legal")}</p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to={`${prefix}/legal-notice`} className="hover:text-foreground">{t("Mentions légales", "Legal notice")}</Link>
              <Link to={`${prefix}/privacy-policy`} className="hover:text-foreground">{t("Confidentialité", "Privacy")}</Link>
              <Link to={`${prefix}/terms`} className="hover:text-foreground">{t("CGV", "Terms")}</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Tooltrim. {t("Tous droits réservés.", "All rights reserved.")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
