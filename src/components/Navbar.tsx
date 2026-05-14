import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Boxes,
  CheckCircle2,
  ChevronDown,
  FlaskConical,
  HelpCircle,
  Layers,
  Mail,
  Menu,
  Moon,
  Scale,
  Shield,
  Sparkles,
  Sun,
  Wrench,
  X,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "@/hooks/useTheme";
import { useCategories, useToolSummaries } from "@/hooks/useSupabaseData";
import { stripLeadingEmoji } from "@/lib/text";
import { getCategoryIcon } from "@/lib/categoryIcons";
import ToolLogo from "@/components/ToolLogo";
import pictoLogo from "@/assets/picto-logo.svg";

type MegaMenu = "explore" | "method" | null;

const POPULAR_TOOL_SLUGS = ["chatgpt", "notion", "figma", "slack", "zapier"];

const Navbar = () => {
  const { t, prefix, lang } = useLang();
  const location = useLocation();
  const otherLang = lang === "fr" ? "en" : "fr";
  const { theme, toggle } = useTheme();
  const [activeMega, setActiveMega] = useState<MegaMenu>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
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
      .map((cat) => ({ ...cat, count: tools.filter((tool) => tool.categoryId === cat.id).length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [categories, tools]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setActiveMega(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setActiveMega(null);
    setMobileOpen(false);
    setMobileExpanded(null);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname.startsWith(path);
  const closeMega = () => setActiveMega(null);
  const closeMobile = () => {
    setMobileOpen(false);
    setMobileExpanded(null);
  };

  const handleMegaEnter = (menu: MegaMenu) => {
    clearTimeout(closeTimer.current);
    setActiveMega(menu);
  };

  const handleMegaLeave = () => {
    closeTimer.current = setTimeout(() => setActiveMega(null), 160);
  };

  const languageHref = `/${otherLang}${location.pathname.replace(/^\/(fr|en)/, "")}${location.search}`;

  const exploreLinks = [
    {
      icon: Wrench,
      label: t("Catalogue d'outils", "Tool catalog"),
      description: t("Prix, alternatives, verdicts", "Pricing, alternatives, verdicts"),
      to: `${prefix}/tools`,
    },
    {
      icon: BarChart3,
      label: t("Catégories", "Categories"),
      description: t("Explorer par usage métier", "Browse by work use case"),
      to: `${prefix}/category`,
    },
    {
      icon: Boxes,
      label: t("Stacks types", "Stack templates"),
      description: t("Partir d'un profil concret", "Start from a concrete profile"),
      to: `${prefix}/stacks`,
    },
    {
      icon: Scale,
      label: t("Comparatifs", "Comparisons"),
      description: t("Décider entre deux outils", "Decide between two tools"),
      to: `${prefix}/comparatifs`,
    },
    {
      icon: Layers,
      label: t("Audit de stack", "Stack audit"),
      description: t("Voir les doublons et économies", "Find overlap and savings"),
      to: `${prefix}/selector`,
    },
  ];

  const methodLinks = [
    {
      icon: FlaskConical,
      label: t("Méthodologie", "Methodology"),
      description: t("Comment les verdicts sont construits", "How verdicts are built"),
      to: `${prefix}/${lang === "fr" ? "methodologie" : "methodology"}`,
    },
    {
      icon: Shield,
      label: t("Transparence", "Transparency"),
      description: t("Indépendance, sources, limites", "Independence, sources, limits"),
      to: `${prefix}/transparency`,
    },
    {
      icon: HelpCircle,
      label: t("À propos", "About"),
      description: t("Pourquoi ToolTrim existe", "Why ToolTrim exists"),
      to: `${prefix}/about`,
    },
    {
      icon: Mail,
      label: "Contact",
      description: t("Une erreur, une idée, un échange", "Report, suggest, or talk"),
      to: `${prefix}/contact`,
    },
  ];

  return (
    <nav ref={navRef} className="fixed inset-x-0 top-3 z-50 px-3 sm:px-4">
      <div
        className="mx-auto flex h-14 max-w-7xl items-center justify-between rounded-2xl border border-border bg-background/97 px-4 sm:px-5 backdrop-blur-xl"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.07)" }}
      >
        <Link to={prefix} className="group flex items-center gap-2.5 shrink-0" onClick={closeMega}>
          <img src={pictoLogo} alt="ToolTrim" className="h-6 w-6 transition-opacity duration-150 group-hover:opacity-80" />
          <div className="leading-none">
            <span className="font-display text-[1.08rem] font-semibold tracking-[-0.03em] text-foreground">
              ToolTrim
            </span>
            <span className="ml-2 hidden rounded-full border border-border px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground xl:inline-flex">
              {tools.length || 314} {t("outils vérifiés", "verified tools")}
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <DesktopMegaButton
            active={activeMega === "explore" || isActive(`${prefix}/tools`) || isActive(`${prefix}/category`) || isActive(`${prefix}/comparatifs`)}
            label={t("Explorer", "Explore")}
            onEnter={() => handleMegaEnter("explore")}
            onLeave={handleMegaLeave}
          />
          <Link
            to={`${prefix}/stacks`}
            className={`rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
              isActive(`${prefix}/stacks`) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("Stacks types", "Stack templates")}
          </Link>
          <Link
            to={`${prefix}/guides`}
            className={`rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
              isActive(`${prefix}/guides`) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("Guides", "Guides")}
          </Link>
          <DesktopMegaButton
            active={activeMega === "method" || isActive(`${prefix}/method`) || isActive(`${prefix}/methodologie`) || isActive(`${prefix}/transparency`) || isActive(`${prefix}/about`)}
            label={t("Méthode", "Method")}
            onEnter={() => handleMegaEnter("method")}
            onLeave={handleMegaLeave}
          />
        </div>

        {activeMega === "explore" && (
          <MegaPanel align="center" onEnter={() => handleMegaEnter("explore")} onLeave={handleMegaLeave}>
            <div className="grid w-[720px] grid-cols-[1.1fr_1px_0.9fr]">
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="label-section">{t("Décider vite", "Decide faster")}</p>
                  <span className="text-[11px] text-muted-foreground">{t("Sans affiliation forcée", "No forced affiliation")}</span>
                </div>
                <div className="grid gap-1.5">
                  {exploreLinks.map((item) => (
                    <MegaLink key={item.to} {...item} onClick={closeMega} />
                  ))}
                </div>
              </div>

              <div className="bg-border" />

              <div className="p-5">
                <p className="label-section mb-4">{t("Repères populaires", "Popular starting points")}</p>
                <div className="grid gap-1.5">
                  {topCategories.slice(0, 3).map((cat) => {
                    const Icon = getCategoryIcon(cat.id);
                    const catName = stripLeadingEmoji(cat.name, cat.id);
                    const catNameEn = stripLeadingEmoji(cat.nameEn, catName);
                    return (
                      <Link
                        key={cat.id}
                        to={`${prefix}/category/${cat.slug}`}
                        onClick={closeMega}
                        className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-primary/5"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 text-primary group-hover:bg-primary/15">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-foreground">{t(catName, catNameEn)}</p>
                          <p className="text-[11px] text-muted-foreground">{cat.count} {t("outils", "tools")}</p>
                        </div>
                      </Link>
                    );
                  })}
                  <div className="mt-2 border-t border-border pt-3">
                    {topTools.slice(0, 3).map((tool) => (
                      <Link
                        key={tool.id}
                        to={`${prefix}/tool/${tool.slug || tool.id}`}
                        onClick={closeMega}
                        className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-primary/5"
                      >
                        <ToolLogo tool={tool} size={24} />
                        <span className="truncate text-[13px] font-medium text-foreground">{tool.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </MegaPanel>
        )}

        {activeMega === "method" && (
          <MegaPanel align="right" onEnter={() => handleMegaEnter("method")} onLeave={handleMegaLeave}>
            <div className="grid w-[620px] grid-cols-[1fr_1px_0.9fr]">
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="label-section">{t("Comprendre", "Understand")}</p>
                  <span className="text-[11px] text-muted-foreground">{t("Sources et limites visibles", "Visible sources and limits")}</span>
                </div>
                <div className="grid gap-1.5">
                  {methodLinks.map((item) => (
                    <MegaLink key={item.to} {...item} onClick={closeMega} />
                  ))}
                </div>
              </div>

              <div className="bg-border" />

              <div className="p-5">
                <p className="label-section mb-4">{t("Preuves rapides", "Quick proof")}</p>
                <div className="grid gap-2">
                  {[
                    t("Prix vérifiés manuellement", "Manually checked pricing"),
                    t("Verdicts sans affiliation forcée", "Verdicts without forced affiliation"),
                    t("Doublons et alternatives comparés", "Overlap and alternatives compared"),
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 rounded-xl border border-border bg-card px-3 py-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p className="text-[12px] leading-relaxed text-foreground">{item}</p>
                    </div>
                  ))}
                </div>
                <Link
                  to={`${prefix}/${lang === "fr" ? "methodologie" : "methodology"}`}
                  onClick={closeMega}
                  className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:text-primary/80"
                >
                  {t("Voir la méthode complète", "See the full method")}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </MegaPanel>
        )}

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle theme={theme} onClick={toggle} />
          <LanguageToggle href={languageHref} lang={lang} otherLang={otherLang} />
          <Link
            to={`${prefix}/selector`}
            className="ml-1 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("Analyser ma stack", "Analyze my stack")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-1.5 lg:hidden">
          <Link
            to={`${prefix}/selector`}
            className="hidden rounded-lg bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground xs:inline-flex"
          >
            {t("Analyser", "Analyze")}
          </Link>
          <button
            onClick={() => {
              setMobileOpen((open) => !open);
              setMobileExpanded(null);
            }}
            className="rounded-lg border border-border p-2 text-muted-foreground"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-full z-50 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-border bg-background shadow-2xl shadow-black/20 lg:hidden">
          <div className="space-y-5 px-4 py-5">
            <Link
              to={`${prefix}/selector`}
              onClick={closeMobile}
              className="flex items-center justify-between rounded-2xl bg-primary p-4 text-primary-foreground"
            >
              <div>
                <p className="text-sm font-bold">{t("Analyser ma stack", "Analyze my stack")}</p>
                <p className="mt-1 text-xs opacity-80">{t("Réduire les doublons en quelques minutes", "Reduce overlap in a few minutes")}</p>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <MobileQuickLink icon={Wrench} label={t("Outils", "Tools")} to={`${prefix}/tools`} onClick={closeMobile} />
              <MobileQuickLink icon={Scale} label={t("Comparer", "Compare")} to={`${prefix}/comparatifs`} onClick={closeMobile} />
              <MobileQuickLink icon={Boxes} label={t("Stacks", "Stacks")} to={`${prefix}/stacks`} onClick={closeMobile} />
              <MobileQuickLink icon={BookOpen} label={t("Guides", "Guides")} to={`${prefix}/guides`} onClick={closeMobile} />
            </div>

            <MobileSection
              label={t("Explorer", "Explore")}
              open={mobileExpanded === "explore"}
              onClick={() => setMobileExpanded(mobileExpanded === "explore" ? null : "explore")}
            />
            {mobileExpanded === "explore" && (
              <div className="space-y-1 border-l border-border pl-3">
                {exploreLinks.map((item) => (
                  <MobileTextLink key={item.to} {...item} onClick={closeMobile} />
                ))}
                {topCategories.slice(0, 4).map((cat) => {
                  const Icon = getCategoryIcon(cat.id);
                  const catName = stripLeadingEmoji(cat.name, cat.id);
                  const catNameEn = stripLeadingEmoji(cat.nameEn, catName);
                  return (
                    <MobileTextLink
                      key={cat.id}
                      icon={Icon}
                      label={t(catName, catNameEn)}
                      description={`${cat.count} ${t("outils", "tools")}`}
                      to={`${prefix}/category/${cat.slug}`}
                      onClick={closeMobile}
                    />
                  );
                })}
              </div>
            )}

            <MobileSection
              label={t("Méthode & confiance", "Method & trust")}
              open={mobileExpanded === "method"}
              onClick={() => setMobileExpanded(mobileExpanded === "method" ? null : "method")}
            />
            {mobileExpanded === "method" && (
              <div className="space-y-1 border-l border-border pl-3">
                {methodLinks.map((item) => (
                  <MobileTextLink key={item.to} {...item} onClick={closeMobile} />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-3 py-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {tools.length || 314} {t("outils vérifiés", "verified tools")}
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle theme={theme} onClick={toggle} compact />
                <LanguageToggle href={languageHref} lang={lang} otherLang={otherLang} compact />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

function DesktopMegaButton({
  active,
  label,
  onEnter,
  onLeave,
}: {
  active: boolean;
  label: string;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <div onMouseEnter={onEnter} onMouseLeave={onLeave} className="relative">
      <button
        className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform ${active ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}

function MegaPanel({
  align,
  children,
  onEnter,
  onLeave,
}: {
  align: "center" | "right";
  children: React.ReactNode;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      className={`absolute top-full hidden pt-3 lg:block ${align === "center" ? "left-1/2 -translate-x-1/2" : "right-6"}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-2xl shadow-black/20">
        {children}
      </div>
    </div>
  );
}

function MegaLink({
  icon: Icon,
  label,
  description,
  to,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  to: string;
  onClick: () => void;
}) {
  return (
    <Link to={to} onClick={onClick} className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-primary/5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary group-hover:bg-primary/15">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

function MobileQuickLink({
  icon: Icon,
  label,
  to,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  to: string;
  onClick: () => void;
}) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-sm font-semibold text-foreground">
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </Link>
  );
}

function MobileSection({ label, open, onClick }: { label: string; open: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-sm font-bold text-foreground">
      {label}
      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
  );
}

function MobileTextLink({
  icon: Icon,
  label,
  description,
  to,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  to: string;
  onClick: () => void;
}) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-primary/5">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

function ThemeToggle({ theme, onClick, compact = false }: { theme: string; onClick: () => void; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label="Toggle theme"
      className="relative cursor-pointer rounded-full border border-border transition-colors hover:border-primary/40"
      style={{
        width: compact ? 44 : 50,
        height: compact ? 24 : 26,
        padding: 3,
        background: theme === "dark" ? "hsl(var(--primary) / 0.12)" : "hsl(var(--muted) / 0.6)",
      }}
    >
      <Sun
        className="absolute"
        style={{
          left: compact ? 5 : 6,
          top: "50%",
          transform: "translateY(-50%)",
          width: compact ? 10 : 11,
          height: compact ? 10 : 11,
          color: theme === "dark" ? "hsl(var(--muted-foreground) / 0.3)" : "hsl(var(--foreground) / 0.5)",
        }}
      />
      <Moon
        className="absolute"
        style={{
          right: compact ? 5 : 6,
          top: "50%",
          transform: "translateY(-50%)",
          width: compact ? 10 : 11,
          height: compact ? 10 : 11,
          color: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
        }}
      />
      <div
        className="absolute top-[3px] rounded-full bg-background shadow-sm"
        style={{
          width: compact ? 18 : 20,
          height: compact ? 18 : 20,
          left: theme === "dark" ? (compact ? 23 : 27) : 3,
          transition: "left 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 1px 3px hsl(0 0% 0% / 0.2)",
        }}
      />
    </button>
  );
}

function LanguageToggle({
  href,
  lang,
  otherLang,
  compact = false,
}: {
  href: string;
  lang: string;
  otherLang: string;
  compact?: boolean;
}) {
  return (
    <a
      href={href}
      hrefLang={otherLang}
      rel="alternate"
      aria-label={`Switch to ${otherLang === "en" ? "English" : "Français"}`}
      className="flex items-center rounded-full border border-border transition-colors hover:border-primary/40"
      style={{ padding: compact ? "2px" : "3px" }}
    >
      {(["fr", "en"] as const).map((item) => (
        <span
          key={item}
          className="rounded-full transition-all"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: compact ? "0.58rem" : "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: compact ? "2px 7px" : "3px 8px",
            background: lang === item ? "hsl(var(--foreground))" : "transparent",
            color: lang === item ? "hsl(var(--background))" : "hsl(var(--muted-foreground) / 0.5)",
          }}
        >
          {item}
        </span>
      ))}
    </a>
  );
}

export default Navbar;
