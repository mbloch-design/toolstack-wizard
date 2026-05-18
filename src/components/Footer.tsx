import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useCategories, useToolSummaries } from "@/hooks/useSupabaseData";
import { stripLeadingEmoji } from "@/lib/text";
import { useMemo } from "react";

const Footer = () => {
  const { t, prefix } = useLang();
  const { categories } = useCategories();
  const { tools } = useToolSummaries();

  const topCategories = useMemo(() => {
    return categories
      .map(cat => ({ ...cat, count: tools.filter(t => t.categoryId === cat.id).length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [categories, tools]);

  const topTools = useMemo(() => tools.slice(0, 8), [tools]);

  return (
    <footer className="border-t border-border" style={{ background: "hsl(var(--card))" }}>

      {/* ── Link columns ── */}
      <div className="border-t border-border" style={{ background: "hsl(var(--background))" }}>
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">

            {/* Product */}
            <div>
              <p className="label-section mb-4">{t("Produit", "Product")}</p>
              <nav className="flex flex-col gap-2.5">
                {[
                  { to: `${prefix}/selector`, label: t("Audit de stack", "Stack audit") },
                  { to: `${prefix}/tools`, label: t("Catalogue d'outils", "Tool catalog") },
                  { to: `${prefix}/category`, label: t("Catégories", "Categories") },
                  { to: `${prefix}/guides`, label: t("Guides", "Guides") },
                  { to: `${prefix}/stacks`, label: t("Stacks types", "Stack templates") },
                  { to: `${prefix}/comparatifs`, label: t("Comparatifs", "Comparisons") },
                ].map(item => (
                  <Link key={item.to} to={item.to}
                    className="text-sm transition-colors duration-150 hover:text-foreground"
                    style={{ color: "hsl(var(--muted-foreground))" }}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Categories */}
            <div>
              <p className="label-section mb-4">{t("Catégories", "Categories")}</p>
              <nav className="flex flex-col gap-2.5">
                {topCategories.map(cat => {
                  const catName = stripLeadingEmoji(cat.name, cat.id);
                  const catNameEn = stripLeadingEmoji(cat.nameEn, catName);
                  return (
                    <Link key={cat.id} to={`${prefix}/category/${cat.slug}`}
                      className="text-sm transition-colors duration-150 hover:text-foreground"
                      style={{ color: "hsl(var(--muted-foreground))" }}>
                      {t(catName, catNameEn)}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Tools */}
            <div>
              <p className="label-section mb-4">{t("Outils", "Tools")}</p>
              <nav className="flex flex-col gap-2.5">
                {topTools.map(tool => (
                  <Link key={tool.id} to={`${prefix}/tool/${tool.slug}`}
                    className="text-sm transition-colors duration-150 hover:text-foreground"
                    style={{ color: "hsl(var(--muted-foreground))" }}>
                    {tool.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Company + Legal */}
            <div>
              <p className="label-section mb-4">{t("Entreprise", "Company")}</p>
              <nav className="flex flex-col gap-2.5">
                {[
                  { to: `${prefix}/about`, label: t("À propos", "About") },
                  { to: `${prefix}/transparency`, label: t("Transparence", "Transparency") },
                  { to: `${prefix}/contact`, label: "Contact" },
                ].map(item => (
                  <Link key={item.to} to={item.to}
                    className="text-sm transition-colors duration-150 hover:text-foreground"
                    style={{ color: "hsl(var(--muted-foreground))" }}>
                    {item.label}
                  </Link>
                ))}
              </nav>

              <p className="label-section mb-3 mt-7">{t("Légal", "Legal")}</p>
              <nav className="flex flex-col gap-2.5">
                {[
                  { to: `${prefix}/legal-notice`, label: t("Mentions légales", "Legal notice") },
                  { to: `${prefix}/privacy-policy`, label: t("Confidentialité", "Privacy") },
                  { to: `${prefix}/terms`, label: t("CGV", "Terms") },
                ].map(item => (
                  <Link key={item.to} to={item.to}
                    className="text-sm transition-colors duration-150 hover:text-foreground"
                    style={{ color: "hsl(var(--muted-foreground))" }}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-border" style={{ background: "hsl(var(--card))" }}>
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.05em",
              color: "hsl(var(--muted-foreground) / 0.4)",
            }}>
              © {new Date().getFullYear()} ToolTrim
            </p>
            <a href="https://marketingdb.live" target="_blank" rel="noopener noreferrer" style={{ opacity: 0.3, lineHeight: 0 }}>
              <img src="https://marketingdb.live/badge.svg" alt="Listed on MarketingDB" width="95" height="22" />
            </a>
          </div>
          <div className="flex items-center gap-4">
            {[
              { to: `${prefix}/privacy-policy`, label: t("Confidentialité", "Privacy") },
              { to: `${prefix}/terms`, label: t("CGV", "Terms") },
              { to: `${prefix}/legal-notice`, label: t("Mentions légales", "Legal") },
            ].map((item, i, arr) => (
              <span key={item.to} className="flex items-center gap-4">
                <Link to={item.to}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.65rem",
                    letterSpacing: "0.05em",
                    color: "hsl(var(--muted-foreground) / 0.4)",
                    transition: "color 150ms",
                  }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = "hsl(var(--muted-foreground))")}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = "hsl(var(--muted-foreground) / 0.4)")}
                >
                  {item.label}
                </Link>
                {i < arr.length - 1 && (
                  <span style={{ color: "hsl(var(--border))" }}>·</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
