import { Link, useLocation } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "@/hooks/useTheme";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { Sun, Moon, Menu, X, ArrowRight, ChevronDown, BookOpen, Wrench, BarChart3, HelpCircle, Shield, Mail, Layers } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { getCategoryIcon } from "@/lib/categoryIcons";
import pictoLogo from "@/assets/picto-logo.svg";
import ToolLogo from "@/components/ToolLogo";

type MegaMenu = "tools" | "resources" | null;

const Navbar = () => {
  const { t, prefix, lang } = useLang();
  const location = useLocation();
  const otherLang = lang === "fr" ? "en" : "fr";
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMega, setActiveMega] = useState<MegaMenu>(null);
  const [mobileExpanded, setMobileExpanded] = useState<MegaMenu>(null);
  const navRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  const { tools } = useTools();
  const { categories } = useCategories();

  const topTools = useMemo(() =>
    [...tools].sort((a, b) => (b.pros?.length || 0) - (a.pros?.length || 0)).slice(0, 5),
    [tools]
  );

  const topCategories = useMemo(() => {
    return categories
      .map(cat => ({ ...cat, count: tools.filter(t => t.categoryId === cat.id).length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [categories, tools]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setActiveMega(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setActiveMega(null);
    setMobileOpen(false);
  }, [location.pathname]);

  const handleMegaEnter = (menu: MegaMenu) => {
    clearTimeout(closeTimer.current);
    setActiveMega(menu);
  };
  const handleMegaLeave = () => {
    closeTimer.current = setTimeout(() => setActiveMega(null), 180);
  };
  const closeMega = () => setActiveMega(null);

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav ref={navRef} className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">

        {/* ─── Logo ─── */}
        <Link to={prefix} className="flex items-center gap-2 shrink-0" onClick={closeMega}>
          <img src={pictoLogo} alt="ToolTrim" className="h-7 w-7" />
          <span className="font-heading text-[17px] font-bold tracking-tight text-foreground">
            Tooltrim
          </span>
        </Link>

        {/* ─── Desktop nav ─── */}
        <div className="hidden items-center lg:flex">

          {/* Tools */}
          <div onMouseEnter={() => handleMegaEnter("tools")} onMouseLeave={handleMegaLeave} className="relative">
            <button className={`inline-flex items-center gap-1 px-3 py-2 text-[13px] font-medium transition-colors
              ${activeMega === "tools" || isActive(`${prefix}/tool`) || isActive(`${prefix}/category`)
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"}`}>
              {t("Outils", "Tools")}
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${activeMega === "tools" ? "rotate-180" : ""}`} />
            </button>

            {activeMega === "tools" && (
              <div className="absolute left-1/2 top-full pt-2.5 -translate-x-1/2"
                onMouseEnter={() => handleMegaEnter("tools")} onMouseLeave={handleMegaLeave}>
                <div className="w-[480px] rounded-xl border border-border/60 bg-background shadow-lg shadow-foreground/[0.04] overflow-hidden">
                  <div className="grid grid-cols-[1fr,1px,1fr]">
                    {/* Categories col */}
                    <div className="p-4">
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                        {t("Catégories", "Categories")}
                      </p>
                      <div className="space-y-0.5">
                        {topCategories.map(cat => {
                          const Icon = getCategoryIcon(cat.id);
                          const catName = cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
                          return (
                            <Link key={cat.id} to={`${prefix}/category/${cat.slug}`} onClick={closeMega}
                              className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/60 text-accent-foreground transition-colors group-hover:bg-accent">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium leading-tight text-foreground">{t(catName, cat.nameEn || catName)}</p>
                                <p className="text-[11px] text-muted-foreground font-mono tabular-nums">{cat.count} {t("outils", "tools")}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      <Link to={`${prefix}/category`} onClick={closeMega}
                        className="mt-3 inline-flex items-center gap-1 px-2 text-[12px] font-medium text-primary hover:text-primary/80 transition-colors">
                        {t("Toutes les catégories", "All categories")} <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>

                    {/* Divider */}
                    <div className="bg-border/60" />

                    {/* Popular col */}
                    <div className="p-4">
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                        {t("Populaires", "Popular")}
                      </p>
                      <div className="space-y-0.5">
                        {topTools.map(tool => (
                          <Link key={tool.id} to={`${prefix}/tool/${tool.slug}`} onClick={closeMega}
                            className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50">
                            <ToolLogo tool={tool} size={28} className="rounded-md" />
                            <p className="text-[13px] font-medium truncate text-foreground">{tool.name}</p>
                          </Link>
                        ))}
                      </div>
                      <Link to={`${prefix}/tools`} onClick={closeMega}
                        className="mt-3 inline-flex items-center gap-1 px-2 text-[12px] font-medium text-primary hover:text-primary/80 transition-colors">
                        {t("Tous les outils", "All tools")} <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resources */}
          <div onMouseEnter={() => handleMegaEnter("resources")} onMouseLeave={handleMegaLeave} className="relative">
            <button className={`inline-flex items-center gap-1 px-3 py-2 text-[13px] font-medium transition-colors
              ${activeMega === "resources" || isActive(`${prefix}/guides`) || isActive(`${prefix}/about`)
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"}`}>
              {t("Ressources", "Resources")}
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${activeMega === "resources" ? "rotate-180" : ""}`} />
            </button>

            {activeMega === "resources" && (
              <div className="absolute left-1/2 top-full pt-2.5 -translate-x-1/2"
                onMouseEnter={() => handleMegaEnter("resources")} onMouseLeave={handleMegaLeave}>
                <div className="w-[280px] rounded-xl border border-border/60 bg-background shadow-lg shadow-foreground/[0.04] overflow-hidden p-2">
                  {[
                    { icon: BookOpen, label: t("Guides & comparatifs", "Guides & comparisons"), to: `${prefix}/guides` },
                    { icon: Layers, label: t("Sélecteur de stack", "Stack selector"), to: `${prefix}/selector` },
                    { icon: Shield, label: t("Transparence", "Transparency"), to: `${prefix}/transparency` },
                    { icon: HelpCircle, label: t("À propos", "About"), to: `${prefix}/about` },
                  ].map(item => (
                    <Link key={item.to} to={item.to} onClick={closeMega}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/60 text-accent-foreground">
                        <item.icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-[13px] font-medium text-foreground">{item.label}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selector link */}
          <Link to={`${prefix}/selector`}
            className={`px-3 py-2 text-[13px] font-medium transition-colors
              ${isActive(`${prefix}/selector`) ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t("Sélecteur", "Selector")}
          </Link>
        </div>

        {/* ─── Desktop right actions ─── */}
        <div className="hidden items-center gap-1.5 lg:flex">
          <button onClick={toggle} aria-label="Toggle theme"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to={`/${otherLang}`}
            className="rounded-lg px-2 py-1.5 text-[11px] font-semibold uppercase text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground tracking-wide">
            {otherLang}
          </Link>
          <Link to={`${prefix}/selector`}
            className="ml-1 rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background transition-all hover:bg-foreground/85 hover:shadow-md">
            {t("Analyser ma stack", "Analyze my stack")}
          </Link>
        </div>

        {/* ─── Mobile controls ─── */}
        <div className="flex items-center gap-1 lg:hidden">
          <button onClick={toggle} className="rounded-lg p-2 text-muted-foreground" aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to={`/${otherLang}`} className="rounded-lg px-2 py-1 text-[11px] font-semibold uppercase text-muted-foreground tracking-wide">
            {otherLang}
          </Link>
          <button onClick={() => { setMobileOpen(!mobileOpen); setMobileExpanded(null); }}
            className="rounded-lg p-2 text-muted-foreground">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ─── Mobile menu ─── */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-full z-50 max-h-[calc(100vh-3.5rem)] overflow-y-auto border-b border-border/60 bg-background lg:hidden">
          <div className="px-4 py-3 space-y-0.5">
            {/* Tools */}
            <button onClick={() => setMobileExpanded(mobileExpanded === "tools" ? null : "tools")}
              className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-[13px] font-medium hover:bg-accent/40 transition-colors">
              {t("Outils", "Tools")}
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${mobileExpanded === "tools" ? "rotate-180" : ""}`} />
            </button>
            {mobileExpanded === "tools" && (
              <div className="ml-2 space-y-0.5 border-l border-border/50 pl-3 pb-2">
                <Link to={`${prefix}/tools`} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors">
                  <Wrench className="h-3.5 w-3.5" /> {t("Tous les outils", "All tools")}
                </Link>
                <Link to={`${prefix}/category`} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors">
                  <BarChart3 className="h-3.5 w-3.5" /> {t("Catégories", "Categories")}
                </Link>
                {topCategories.slice(0, 4).map(cat => {
                  const Icon = getCategoryIcon(cat.id);
                  const catName = cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
                  return (
                    <Link key={cat.id} to={`${prefix}/category/${cat.slug}`} onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors">
                      <Icon className="h-3.5 w-3.5" /> {t(catName, cat.nameEn || catName)}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Resources */}
            <button onClick={() => setMobileExpanded(mobileExpanded === "resources" ? null : "resources")}
              className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-[13px] font-medium hover:bg-accent/40 transition-colors">
              {t("Ressources", "Resources")}
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${mobileExpanded === "resources" ? "rotate-180" : ""}`} />
            </button>
            {mobileExpanded === "resources" && (
              <div className="ml-2 space-y-0.5 border-l border-border/50 pl-3 pb-2">
                <Link to={`${prefix}/guides`} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors">
                  <BookOpen className="h-3.5 w-3.5" /> {t("Guides", "Guides")}
                </Link>
                <Link to={`${prefix}/about`} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors">
                  <HelpCircle className="h-3.5 w-3.5" /> {t("À propos", "About")}
                </Link>
                <Link to={`${prefix}/transparency`} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors">
                  <Shield className="h-3.5 w-3.5" /> {t("Transparence", "Transparency")}
                </Link>
                <Link to={`${prefix}/contact`} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors">
                  <Mail className="h-3.5 w-3.5" /> Contact
                </Link>
              </div>
            )}

            <Link to={`${prefix}/selector`} onClick={() => setMobileOpen(false)}
              className="flex items-center rounded-lg px-3 py-3 text-[13px] font-medium hover:bg-accent/40 transition-colors">
              {t("Sélecteur", "Selector")}
            </Link>

            {/* CTA */}
            <div className="pt-3 mt-1 border-t border-border/50">
              <Link to={`${prefix}/selector`} onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-3 text-[13px] font-semibold text-background transition-colors hover:bg-foreground/85">
                {t("Analyser ma stack", "Analyze my stack")} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
