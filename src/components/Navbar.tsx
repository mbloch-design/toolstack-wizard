import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "@/hooks/useTheme";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { Sun, Moon, Menu, X, ArrowRight, ChevronDown, BookOpen, Wrench, BarChart3, HelpCircle, Shield, Mail } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { getCategoryIcon } from "@/lib/categoryIcons";
import pictoLogo from "@/assets/picto-logo.svg";
import ToolLogo from "@/components/ToolLogo";

type MegaMenu = "tools" | "resources" | null;

const Navbar = () => {
  const { t, prefix, lang } = useLang();
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
    [...tools].sort((a, b) => (b.pros?.length || 0) - (a.pros?.length || 0)).slice(0, 4),
    [tools]
  );

  const topCategories = useMemo(() => {
    return categories
      .map(cat => ({ ...cat, count: tools.filter(t => t.categoryId === cat.id).length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [categories, tools]);

  // Close mega menu on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveMega(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on route change
  useEffect(() => {
    setActiveMega(null);
    setMobileOpen(false);
  }, [prefix]);

  const handleMegaEnter = (menu: MegaMenu) => {
    clearTimeout(closeTimer.current);
    setActiveMega(menu);
  };

  const handleMegaLeave = () => {
    closeTimer.current = setTimeout(() => setActiveMega(null), 200);
  };

  const closeMega = () => setActiveMega(null);

  return (
    <nav ref={navRef} className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo — Vercel style: picto + wordmark tight */}
        <Link to={prefix} className="flex items-center gap-2 shrink-0" onClick={closeMega}>
          <img src={pictoLogo} alt="ToolTrim" className="h-7 w-7 rounded-md" />
          <span className="text-lg font-extrabold tracking-tighter text-foreground">
            Tooltrim
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {/* Tools mega */}
          <div
            onMouseEnter={() => handleMegaEnter("tools")}
            onMouseLeave={handleMegaLeave}
            className="relative"
          >
            <button className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors ${activeMega === "tools" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t("Outils", "Tools")}
              <ChevronDown className={`h-3 w-3 transition-transform ${activeMega === "tools" ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown panel — compact, positioned under trigger */}
            {activeMega === "tools" && (
              <div className="absolute left-1/2 top-full pt-2 -translate-x-1/2">
                <div className="w-[520px] rounded-xl border border-border bg-background p-5 shadow-xl animate-in fade-in-0 slide-in-from-top-2 duration-150">
                  <div className="grid grid-cols-2 gap-5">
                    {/* Categories */}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Catégories", "Categories")}</p>
                      <div className="space-y-0.5">
                        {topCategories.map(cat => {
                          const Icon = getCategoryIcon(cat.id);
                          const catName = cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
                          return (
                            <Link key={cat.id} to={`${prefix}/category/${cat.slug}`} onClick={closeMega}
                              className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-secondary">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium leading-tight">{t(catName, cat.nameEn || catName)}</p>
                                <p className="text-[11px] text-muted-foreground">{cat.count} {t("outils", "tools")}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      <Link to={`${prefix}/category`} onClick={closeMega} className="mt-2 inline-flex items-center gap-1 px-2.5 text-xs font-medium text-primary hover:underline">
                        {t("Toutes les catégories →", "All categories →")}
                      </Link>
                    </div>

                    {/* Popular tools */}
                    <div className="border-l border-border pl-5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Populaires", "Popular")}</p>
                      <div className="space-y-0.5">
                        {topTools.map(tool => (
                          <Link key={tool.id} to={`${prefix}/tool/${tool.slug}`} onClick={closeMega}
                            className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-secondary">
                            <ToolLogo tool={tool} size={24} />
                            <p className="text-sm font-medium truncate">{tool.name}</p>
                          </Link>
                        ))}
                      </div>
                      <Link to={`${prefix}/tools`} onClick={closeMega} className="mt-2 inline-flex items-center gap-1 px-2.5 text-xs font-medium text-primary hover:underline">
                        {t("Tous les outils →", "All tools →")}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resources mega */}
          <div
            onMouseEnter={() => handleMegaEnter("resources")}
            onMouseLeave={handleMegaLeave}
            className="relative"
          >
            <button className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors ${activeMega === "resources" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t("Ressources", "Resources")}
              <ChevronDown className={`h-3 w-3 transition-transform ${activeMega === "resources" ? "rotate-180" : ""}`} />
            </button>

            {activeMega === "resources" && (
              <div className="absolute left-1/2 top-full pt-2 -translate-x-1/2">
                <div className="w-[320px] rounded-xl border border-border bg-background p-3 shadow-xl animate-in fade-in-0 slide-in-from-top-2 duration-150">
                  <div className="space-y-0.5">
                    {[
                      { icon: <BookOpen className="h-3.5 w-3.5" />, label: t("Guides & comparatifs", "Guides & comparisons"), desc: t("Articles pour choisir vos outils", "Articles to choose your tools"), to: `${prefix}/guides` },
                      { icon: <BarChart3 className="h-3.5 w-3.5" />, label: t("Sélecteur de stack", "Stack selector"), desc: t("Trouvez les outils faits pour vous", "Find the right tools for you"), to: `${prefix}/selector` },
                      { icon: <Shield className="h-3.5 w-3.5" />, label: t("Transparence", "Transparency"), desc: t("Notre méthodologie", "Our methodology"), to: `${prefix}/transparency` },
                      { icon: <HelpCircle className="h-3.5 w-3.5" />, label: t("À propos", "About"), desc: t("Qui sommes-nous ?", "Who are we?"), to: `${prefix}/about` },
                    ].map(item => (
                      <Link key={item.to} to={item.to} onClick={closeMega}
                        className="group flex items-start gap-2.5 rounded-lg p-2.5 transition-colors hover:bg-secondary">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground mt-0.5">
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-tight">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link to={`${prefix}/selector`} className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t("Sélecteur", "Selector")}
          </Link>
        </div>

        {/* Desktop right */}
        <div className="hidden items-center gap-2 lg:flex">
          <button
            onClick={toggle}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to={`/${otherLang}`} className="rounded-md px-2.5 py-1.5 text-xs font-medium uppercase text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            {otherLang}
          </Link>
          <Link
            to={`${prefix}/selector`}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/85"
          >
            {t("Analyser ma stack", "Analyze my stack")}
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <button onClick={toggle} className="rounded-md p-2 text-muted-foreground" aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to={`/${otherLang}`} className="rounded-md px-2 py-1 text-xs font-medium uppercase text-muted-foreground">
            {otherLang}
          </Link>
          <button onClick={() => { setMobileOpen(!mobileOpen); setMobileExpanded(null); }} className="rounded-md p-2 text-muted-foreground">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>




      {/* ========= MOBILE MENU ========= */}
      {mobileOpen && (
        <div className="absolute left-0 right-0 top-full z-50 max-h-[calc(100vh-3.5rem)] overflow-y-auto border-b border-border bg-background lg:hidden">
          <div className="px-4 py-4 space-y-1">
            {/* Tools section */}
            <button
              onClick={() => setMobileExpanded(mobileExpanded === "tools" ? null : "tools")}
              className="flex w-full items-center justify-between rounded-lg p-3 text-sm font-medium hover:bg-secondary"
            >
              {t("Outils", "Tools")}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${mobileExpanded === "tools" ? "rotate-180" : ""}`} />
            </button>
            {mobileExpanded === "tools" && (
              <div className="ml-3 space-y-0.5 border-l-2 border-border pl-3 pb-2">
                <Link to={`${prefix}/tools`} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md p-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary">
                  <Wrench className="h-3.5 w-3.5" /> {t("Tous les outils", "All tools")}
                </Link>
                <Link to={`${prefix}/category`} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md p-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary">
                  <BarChart3 className="h-3.5 w-3.5" /> {t("Catégories", "Categories")}
                </Link>
                {topCategories.slice(0, 4).map(cat => {
                  const Icon = getCategoryIcon(cat.id);
                  const catName = cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
                  return (
                    <Link key={cat.id} to={`${prefix}/category/${cat.slug}`} onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-md p-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary">
                      <Icon className="h-3.5 w-3.5" /> {t(catName, cat.nameEn || catName)}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Resources section */}
            <button
              onClick={() => setMobileExpanded(mobileExpanded === "resources" ? null : "resources")}
              className="flex w-full items-center justify-between rounded-lg p-3 text-sm font-medium hover:bg-secondary"
            >
              {t("Ressources", "Resources")}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${mobileExpanded === "resources" ? "rotate-180" : ""}`} />
            </button>
            {mobileExpanded === "resources" && (
              <div className="ml-3 space-y-0.5 border-l-2 border-border pl-3 pb-2">
                <Link to={`${prefix}/guides`} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md p-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary">
                  <BookOpen className="h-3.5 w-3.5" /> {t("Guides", "Guides")}
                </Link>
                <Link to={`${prefix}/about`} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md p-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary">
                  <HelpCircle className="h-3.5 w-3.5" /> {t("À propos", "About")}
                </Link>
                <Link to={`${prefix}/transparency`} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md p-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary">
                  <Shield className="h-3.5 w-3.5" /> {t("Transparence", "Transparency")}
                </Link>
                <Link to={`${prefix}/contact`} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md p-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary">
                  <Mail className="h-3.5 w-3.5" /> Contact
                </Link>
              </div>
            )}

            {/* Direct links */}
            <Link to={`${prefix}/selector`} onClick={() => setMobileOpen(false)}
              className="flex items-center rounded-lg p-3 text-sm font-medium hover:bg-secondary">
              {t("Sélecteur", "Selector")}
            </Link>

            {/* CTA */}
            <div className="pt-3 border-t border-border mt-2">
              <Link
                to={`${prefix}/selector`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-3 text-sm font-semibold text-background"
              >
                {t("Analyser ma stack", "Analyze my stack")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
