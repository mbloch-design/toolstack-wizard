import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useCategories, useTools } from "@/hooks/useSupabaseData";
import { useMemo } from "react";
import { getCategoryIcon } from "@/lib/categoryIcons";
import pictoLogo from "@/assets/picto-logo.svg";

const Footer = () => {
  const { t, prefix, lang } = useLang();
  const { categories } = useCategories();
  const { tools } = useTools();

  const topCategories = useMemo(() => {
    return categories
      .map(cat => ({ ...cat, count: tools.filter(t => t.categoryId === cat.id).length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [categories, tools]);

  const topTools = useMemo(() =>
    [...tools].sort((a, b) => (b.pros?.length || 0) - (a.pros?.length || 0)).slice(0, 8),
    [tools]
  );

  return (
    <footer className="border-t border-border bg-card">
      {/* Main footer */}
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to={prefix} className="flex items-center gap-2">
              <img src={pictoLogo} alt="ToolTrim" className="h-7 w-7" style={{ borderRadius: "2px" }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.82rem", fontWeight: 500, letterSpacing: "0.04em" }}>
                <span className="text-foreground/50">TOOL</span><span className="text-primary">TRIM</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-xs">
              {t(
                "Le comparateur SaaS indépendant pour freelances et petites équipes. Analysez, comparez et optimisez votre stack d'outils.",
                "The independent SaaS comparator for freelancers and small teams. Analyze, compare and optimize your tool stack."
              )}
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t("Produit", "Product")}</h3>
            <nav className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <Link to={`${prefix}/tools`} className="hover:text-foreground transition-colors">{t("Catalogue d'outils", "Tool catalog")}</Link>
              <Link to={`${prefix}/category`} className="hover:text-foreground transition-colors">{t("Catégories", "Categories")}</Link>
              <Link to={`${prefix}/selector`} className="hover:text-foreground transition-colors">{t("Sélecteur de stack", "Stack selector")}</Link>
              <Link to={`${prefix}/guides`} className="hover:text-foreground transition-colors">{t("Guides & comparatifs", "Guides & comparisons")}</Link>
            </nav>
          </div>

          {/* Categories (SEO links) */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t("Catégories populaires", "Popular categories")}</h3>
            <nav className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              {topCategories.map(cat => {
                const catName = cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
                return (
                  <Link key={cat.id} to={`${prefix}/category/${cat.slug}`} className="hover:text-foreground transition-colors">
                    {t(catName, cat.nameEn || catName)}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Popular tools (SEO links) */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t("Outils populaires", "Popular tools")}</h3>
            <nav className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              {topTools.map(tool => (
                <Link key={tool.id} to={`${prefix}/tool/${tool.slug}`} className="hover:text-foreground transition-colors">
                  {tool.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t("Entreprise", "Company")}</h3>
            <nav className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <Link to={`${prefix}/about`} className="hover:text-foreground transition-colors">{t("À propos", "About")}</Link>
              <Link to={`${prefix}/transparency`} className="hover:text-foreground transition-colors">{t("Transparence", "Transparency")}</Link>
              <Link to={`${prefix}/contact`} className="hover:text-foreground transition-colors">Contact</Link>
            </nav>
            <h3 className="mb-3 mt-6 text-sm font-semibold">{t("Légal", "Legal")}</h3>
            <nav className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <Link to={`${prefix}/legal-notice`} className="hover:text-foreground transition-colors">{t("Mentions légales", "Legal notice")}</Link>
              <Link to={`${prefix}/privacy-policy`} className="hover:text-foreground transition-colors">{t("Confidentialité", "Privacy")}</Link>
              <Link to={`${prefix}/terms`} className="hover:text-foreground transition-colors">{t("CGV", "Terms")}</Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ToolTrim. {t("Tous droits réservés.", "All rights reserved.")}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to={`/${lang === "fr" ? "en" : "fr"}`} className="hover:text-foreground transition-colors">
              {lang === "fr" ? "English" : "Français"}
            </Link>
            <span className="text-border">·</span>
            <span>{t("Fait avec ♥ pour les indépendants", "Made with ♥ for independents")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
