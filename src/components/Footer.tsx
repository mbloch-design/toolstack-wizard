import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useCategories, useTools } from "@/hooks/useSupabaseData";
import { useMemo } from "react";
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
    <footer className="border-t border-border">

      {/* ── Main grid ── */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[280px_1fr_1fr_1fr_1fr]">

          {/* Brand */}
          <div className="lg:pr-8">
            <Link to={prefix} className="inline-flex items-center gap-2 group">
              <img src={pictoLogo} alt="ToolTrim" className="h-5 w-5 transition-opacity duration-150 group-hover:opacity-80" />
              <span
                className="font-display select-none text-foreground transition-opacity duration-150 group-hover:opacity-80"
                style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.03em" }}
              >
                ToolTrim
              </span>
            </Link>

            <p
              className="mt-4 text-sm leading-relaxed"
              style={{ color: "hsl(var(--muted-foreground))", maxWidth: "220px" }}
            >
              {t(
                "Audit de stack SaaS indépendant pour freelances et petites équipes.",
                "Independent SaaS stack audit for freelancers and small teams."
              )}
            </p>

            {/* Independence badge */}
            <div
              className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "hsl(145 60% 36%)" }}
              />
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.6rem",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: "hsl(var(--muted-foreground) / 0.7)",
                }}
              >
                {t("100% indépendant", "100% independent")}
              </span>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="label-section mb-4">{t("Produit", "Product")}</p>
            <nav className="flex flex-col gap-2.5">
              {[
                { to: `${prefix}/selector`, label: t("Audit de stack", "Stack audit") },
                { to: `${prefix}/tools`, label: t("Catalogue d'outils", "Tool catalog") },
                { to: `${prefix}/category`, label: t("Catégories", "Categories") },
                { to: `${prefix}/guides`, label: t("Guides", "Guides") },
                { to: `${prefix}/comparatifs`, label: t("Comparatifs", "Comparisons") },
              ].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-sm transition-colors duration-150 hover:text-foreground"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
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
                const catName = cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
                return (
                  <Link
                    key={cat.id}
                    to={`${prefix}/category/${cat.slug}`}
                    className="text-sm transition-colors duration-150 hover:text-foreground"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {t(catName, cat.nameEn || catName)}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Popular tools */}
          <div>
            <p className="label-section mb-4">{t("Outils", "Tools")}</p>
            <nav className="flex flex-col gap-2.5">
              {topTools.map(tool => (
                <Link
                  key={tool.id}
                  to={`${prefix}/tool/${tool.slug}`}
                  className="text-sm transition-colors duration-150 hover:text-foreground"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
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
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-sm transition-colors duration-150 hover:text-foreground"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
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
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-sm transition-colors duration-150 hover:text-foreground"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.05em",
              color: "hsl(var(--muted-foreground) / 0.5)",
            }}
          >
            © {new Date().getFullYear()} ToolTrim
          </p>
          <div className="flex items-center gap-4">
            {[
              { to: `${prefix}/privacy-policy`, label: t("Confidentialité", "Privacy") },
              { to: `${prefix}/terms`, label: t("CGV", "Terms") },
              { to: `${prefix}/legal-notice`, label: t("Mentions légales", "Legal") },
            ].map((item, i, arr) => (
              <span key={item.to} className="flex items-center gap-4">
                <Link
                  to={item.to}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.65rem",
                    letterSpacing: "0.05em",
                    color: "hsl(var(--muted-foreground) / 0.5)",
                    transition: "color 150ms",
                  }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = "hsl(var(--muted-foreground))")}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = "hsl(var(--muted-foreground) / 0.5)")}
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
