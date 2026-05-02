import { Link, useLocation } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "@/hooks/useTheme";
import { useToolSummaries, useCategories } from "@/hooks/useSupabaseData";
import { Sun, Moon, Menu, X, ArrowRight, ChevronDown, BookOpen, Wrench, BarChart3, HelpCircle, Shield, Mail, Layers, Scale, FlaskConical, Boxes } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { getCategoryIcon } from "@/lib/categoryIcons";
import pictoLogo from "@/assets/picto-logo.svg";
import ToolLogo from "@/components/ToolLogo";

type MegaMenu = "tools" | "resources" | null;

const POPULAR_TOOL_SLUGS = ["chatgpt", "notion", "figma", "slack", "zapier"];

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

  const { tools } = useToolSummaries();
  const { categories } = useCategories();

  const topTools = useMemo(() => {
    const bySlug = new Map(tools.map((tool) => [tool.slug || tool.id, tool]));
    return POPULAR_TOOL_SLUGS.flatMap((slug) => {
      const tool = bySlug.get(slug);
      return tool ? [tool] : [];
    });
  }, [tools]);

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
    <nav ref={navRef} className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-between">

        {/* ─── Logo ─── */}
        <Link to={prefix} className="flex items-center gap-2 shrink-0 group" onClick={closeMega}>
          <img src={pictoLogo} alt="ToolTrim" className="h-5 w-5 transition-opacity duration-150 group-hover:opacity-80" />
          <span
            className="font-display select-none text-foreground transition-opacity duration-150 group-hover:opacity-80"
            style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.03em" }}
          >
            ToolTrim
          </span>
        </Link>

        {/* ─── Desktop nav ─── */}
        <div className="hidden items-center lg:flex">

          {/* Tools */}
          <div onMouseEnter={() => handleMegaEnter("tools")} onMouseLeave={handleMegaLeave} className="relative">
            <button className={`inline-flex items-center gap-1 px-3 py-2 text-[13px] font-medium transition-colors duration-150
              ${activeMega === "tools" || isActive(`${prefix}/tool`) || isActive(`${prefix}/category`)
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"}`}>
              {t("Outils", "Tools")}
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${activeMega === "tools" ? "rotate-180" : ""}`} />
            </button>

            {activeMega === "tools" && (
              <div className="absolute left-1/2 top-full pt-2.5 -translate-x-1/2"
                onMouseEnter={() => handleMegaEnter("tools")} onMouseLeave={handleMegaLeave}>
                <div className="w-[480px] rounded-xl border border-border bg-background shadow-xl shadow-black/20 overflow-hidden">
                  <div className="grid grid-cols-[1fr_1px_1fr]">
                    {/* Categories col */}
                    <div className="p-4">
                      <p className="label-section mb-3">{t("Catégories", "Categories")}</p>
                      <div className="space-y-0.5">
                        {topCategories.map(cat => {
                          const Icon = getCategoryIcon(cat.id);
                          const catName = cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
                          return (
                            <Link key={cat.id} to={`${prefix}/category/${cat.slug}`} onClick={closeMega}
                              className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors duration-100 hover:bg-primary/5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary transition-colors duration-100 group-hover:bg-primary/15">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium leading-tight text-foreground truncate">{t(catName, cat.nameEn || catName)}</p>
                                <p className="text-[11px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Mono', monospace" }}>{cat.count} {t("outils", "tools")}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      <Link to={`${prefix}/category`} onClick={closeMega}
                        className="mt-3 inline-flex items-center gap-1 px-2 text-[12px] font-medium text-primary hover:text-primary/80 transition-colors duration-100">
                        {t("Toutes les catégories", "All categories")} <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>

                    {/* Divider */}
                    <div className="bg-border" />

                    {/* Popular col */}
                    <div className="p-4">
                      <p className="label-section mb-3">{t("Populaires", "Popular")}</p>
                      <div className="space-y-0.5">
                        {topTools.map(tool => (
                          <Link key={tool.id} to={`${prefix}/tool/${tool.slug}`} onClick={closeMega}
                            className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors duration-100 hover:bg-primary/5">
                            <ToolLogo tool={tool} size={28} className="rounded-md" />
                            <p className="text-[13px] font-medium truncate text-foreground">{tool.name}</p>
                          </Link>
                        ))}
                      </div>
                      <Link to={`${prefix}/tools`} onClick={closeMega}
                        className="mt-3 inline-flex items-center gap-1 px-2 text-[12px] font-medium text-primary hover:text-primary/80 transition-colors duration-100">
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
            <button className={`inline-flex items-center gap-1 px-3 py-2 text-[13px] font-medium transition-colors duration-150
              ${activeMega === "resources" || isActive(`${prefix}/guides`) || isActive(`${prefix}/stacks`) || isActive(`${prefix}/about`)
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"}`}>
              {t("Ressources", "Resources")}
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${activeMega === "resources" ? "rotate-180" : ""}`} />
            </button>

            {activeMega === "resources" && (
              <div className="absolute left-1/2 top-full pt-2.5 -translate-x-1/2"
                onMouseEnter={() => handleMegaEnter("resources")} onMouseLeave={handleMegaLeave}>
                <div className="w-[260px] rounded-xl border border-border bg-background shadow-xl shadow-black/20 overflow-hidden p-1.5">
                  {[
                    { icon: BookOpen, label: t("Guides", "Guides"), to: `${prefix}/guides` },
                    { icon: Boxes, label: t("Stacks types", "Stack templates"), to: `${prefix}/stacks` },
                    { icon: Scale, label: t("Comparatifs", "Comparisons"), to: `${prefix}/comparatifs` },
                    { icon: Layers, label: t("Audit de stack", "Stack audit"), to: `${prefix}/selector` },
                    { icon: FlaskConical, label: t("Méthodologie", "Methodology"), to: `${prefix}/${lang === "fr" ? "methodologie" : "methodology"}` },
                    { icon: Shield, label: t("Transparence", "Transparency"), to: `${prefix}/transparency` },
                    { icon: HelpCircle, label: t("À propos", "About"), to: `${prefix}/about` },
                  ].map(item => (
                    <Link key={item.to} to={item.to} onClick={closeMega}
                      className="group flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors duration-100 hover:bg-primary/5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary transition-colors duration-100 group-hover:bg-primary/15">
                        <item.icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-[13px] font-medium text-foreground">{item.label}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Diagnostic link */}
          <Link to={`${prefix}/selector`}
            className={`px-3 py-2 text-[13px] font-medium transition-colors duration-150
              ${isActive(`${prefix}/selector`) ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t("Diagnostic", "Diagnostic")}
          </Link>
        </div>

        {/* ─── Desktop right actions ─── */}
        <div className="hidden items-center gap-1 lg:flex">
          {/* Theme toggle — pill */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="relative cursor-pointer rounded-full border border-border transition-colors duration-200 hover:border-primary/40"
            style={{
              width: 50,
              height: 26,
              padding: 3,
              background: theme === "dark"
                ? "hsl(var(--primary) / 0.12)"
                : "hsl(var(--muted) / 0.6)",
            }}
          >
            {/* Track icons */}
            <Sun
              className="absolute"
              style={{
                left: 6,
                top: "50%",
                transform: "translateY(-50%)",
                width: 11,
                height: 11,
                color: theme === "dark"
                  ? "hsl(var(--muted-foreground) / 0.3)"
                  : "hsl(var(--foreground) / 0.5)",
                transition: "color 200ms",
              }}
            />
            <Moon
              className="absolute"
              style={{
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                width: 11,
                height: 11,
                color: theme === "dark"
                  ? "hsl(var(--primary))"
                  : "hsl(var(--muted-foreground) / 0.3)",
                transition: "color 200ms",
              }}
            />
            {/* Sliding thumb */}
            <div
              className="absolute top-[3px] flex items-center justify-center rounded-full bg-background shadow-sm"
              style={{
                width: 20,
                height: 20,
                left: theme === "dark" ? 27 : 3,
                transition: "left 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 1px 3px hsl(0 0% 0% / 0.2)",
              }}
            />
          </button>
          {/* Lang toggle pill */}
          <a
            href={`/${otherLang}${location.pathname.replace(/^\/(fr|en)/, "")}${location.search}`}
            hrefLang={otherLang}
            rel="alternate"
            aria-label={`Switch to ${otherLang === "en" ? "English" : "Français"}`}
            className="group flex items-center rounded-full border border-border transition-colors duration-150 hover:border-primary/40 cursor-pointer"
            style={{ padding: "3px 3px" }}
          >
            {(["fr", "en"] as const).map((l) => (
              <span
                key={l}
                className="rounded-full transition-all duration-150"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  background: lang === l ? "hsl(var(--foreground))" : "transparent",
                  color: lang === l
                    ? "hsl(var(--background))"
                    : "hsl(var(--muted-foreground) / 0.5)",
                }}
              >
                {l}
              </span>
            ))}
          </a>
          <Link to={`${prefix}/selector`}
            className="ml-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90">
            {t("Analyser ma stack", "Analyze my stack")}
          </Link>
        </div>

        {/* ─── Mobile controls ─── */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="relative cursor-pointer rounded-full border border-border"
            style={{
              width: 46,
              height: 24,
              padding: 3,
              background: theme === "dark"
                ? "hsl(var(--primary) / 0.12)"
                : "hsl(var(--muted) / 0.6)",
            }}
          >
            <Sun
              className="absolute"
              style={{
                left: 5,
                top: "50%",
                transform: "translateY(-50%)",
                width: 10,
                height: 10,
                color: theme === "dark" ? "hsl(var(--muted-foreground) / 0.3)" : "hsl(var(--foreground) / 0.5)",
                transition: "color 200ms",
              }}
            />
            <Moon
              className="absolute"
              style={{
                right: 5,
                top: "50%",
                transform: "translateY(-50%)",
                width: 10,
                height: 10,
                color: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
                transition: "color 200ms",
              }}
            />
            <div
              className="absolute top-[3px] rounded-full bg-background"
              style={{
                width: 18,
                height: 18,
                left: theme === "dark" ? 25 : 3,
                transition: "left 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 1px 3px hsl(0 0% 0% / 0.2)",
              }}
            />
          </button>
          {/* Lang toggle pill — mobile */}
          <a
            href={`/${otherLang}${location.pathname.replace(/^\/(fr|en)/, "")}${location.search}`}
            hrefLang={otherLang}
            rel="alternate"
            aria-label={`Switch to ${otherLang === "en" ? "English" : "Français"}`}
            className="flex items-center rounded-full border border-border transition-colors duration-150 hover:border-primary/40 cursor-pointer"
            style={{ padding: "2px 2px" }}
          >
            {(["fr", "en"] as const).map((l) => (
              <span
                key={l}
                className="rounded-full transition-all duration-150"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "2px 7px",
                  background: lang === l ? "hsl(var(--foreground))" : "transparent",
                  color: lang === l
                    ? "hsl(var(--background))"
                    : "hsl(var(--muted-foreground) / 0.5)",
                }}
              >
                {l}
              </span>
            ))}
          </a>
          <button onClick={() => { setMobileOpen(!mobileOpen); setMobileExpanded(null); }}
            className="rounded-lg p-2 text-muted-foreground cursor-pointer">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ─── Mobile menu ─── */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-full z-50 max-h-[calc(100vh-3.5rem)] overflow-y-auto border-b border-border bg-background lg:hidden">
          <div className="px-4 py-3 space-y-0.5">
            {/* Tools */}
            <button onClick={() => setMobileExpanded(mobileExpanded === "tools" ? null : "tools")}
              className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-[13px] font-medium hover:bg-primary/5 transition-colors duration-100 cursor-pointer">
              {t("Outils", "Tools")}
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${mobileExpanded === "tools" ? "rotate-180" : ""}`} />
            </button>
            {mobileExpanded === "tools" && (
              <div className="ml-2 space-y-0.5 border-l border-border pl-3 pb-2">
                <Link to={`${prefix}/tools`} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors duration-100">
                  <Wrench className="h-3.5 w-3.5" /> {t("Tous les outils", "All tools")}
                </Link>
                <Link to={`${prefix}/category`} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors duration-100">
                  <BarChart3 className="h-3.5 w-3.5" /> {t("Catégories", "Categories")}
                </Link>
                {topCategories.slice(0, 4).map(cat => {
                  const Icon = getCategoryIcon(cat.id);
                  const catName = cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
                  return (
                    <Link key={cat.id} to={`${prefix}/category/${cat.slug}`} onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors duration-100">
                      <Icon className="h-3.5 w-3.5" /> {t(catName, cat.nameEn || catName)}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Resources */}
            <button onClick={() => setMobileExpanded(mobileExpanded === "resources" ? null : "resources")}
              className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-[13px] font-medium hover:bg-primary/5 transition-colors duration-100 cursor-pointer">
              {t("Ressources", "Resources")}
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${mobileExpanded === "resources" ? "rotate-180" : ""}`} />
            </button>
            {mobileExpanded === "resources" && (
              <div className="ml-2 space-y-0.5 border-l border-border pl-3 pb-2">
                <Link to={`${prefix}/guides`} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors duration-100">
                  <BookOpen className="h-3.5 w-3.5" /> {t("Guides", "Guides")}
                </Link>
                <Link to={`${prefix}/stacks`} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors duration-100">
                  <Boxes className="h-3.5 w-3.5" /> {t("Stacks types", "Stack templates")}
                </Link>
                <Link to={`${prefix}/about`} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors duration-100">
                  <HelpCircle className="h-3.5 w-3.5" /> {t("À propos", "About")}
                </Link>
                <Link to={`${prefix}/transparency`} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors duration-100">
                  <Shield className="h-3.5 w-3.5" /> {t("Transparence", "Transparency")}
                </Link>
                <Link to={`${prefix}/contact`} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors duration-100">
                  <Mail className="h-3.5 w-3.5" /> Contact
                </Link>
              </div>
            )}

            <Link to={`${prefix}/selector`} onClick={() => setMobileOpen(false)}
              className="flex items-center rounded-lg px-3 py-3 text-[13px] font-medium hover:bg-primary/5 transition-colors duration-100">
              {t("Diagnostic gratuit", "Free diagnostic")}
            </Link>

            {/* CTA */}
            <div className="pt-3 mt-1 border-t border-border">
              <Link to={`${prefix}/selector`} onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90">
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
