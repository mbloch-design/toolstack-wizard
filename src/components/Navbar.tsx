import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback, type FormEvent } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Layers,
  Moon,
  Scale,
  Search,
  Sun,
  Tag,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "@/hooks/useTheme";
import logoToolTrim from "@/assets/logo-tooltrim.svg";
import { SearchModal } from "@/components/SearchModal";

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const HEADER_H = 72;   // px

/* ─────────────────────────────────────────────
   Panel section data
───────────────────────────────────────────── */
type PanelLink = {
  fr: string;
  en: string;
  path: string;
  count?: number;
};

type PanelCol = {
  labelFr: string;
  labelEn: string;
  links: PanelLink[];
};

type Section = {
  id: string;
  labelFr: string;
  labelEn: string;
  Icon: React.ComponentType<{ className?: string }>;
  columns: PanelCol[];
};

const SECTIONS: Section[] = [
  {
    id: "tools",
    labelFr: "Outils",
    labelEn: "Tools",
    Icon: Wrench,
    columns: [
      {
        labelFr: "DÉCOUVRIR",
        labelEn: "DISCOVER",
        links: [
          { fr: "Tous les outils", en: "All tools", path: "/tools" },
          { fr: "Derniers ajouts", en: "Latest tools", path: "/tools?sort=newest" },
          { fr: "Meilleurs scores", en: "Highest rated", path: "/tools?sort=score" },
          { fr: "Outils gratuits", en: "Free tools", path: "/tools?filter=free" },
          { fr: "Outils IA", en: "AI tools", path: "/tools?filter=ai" },
          { fr: "Nouveautés du mois", en: "New this month", path: "/tools?sort=new" },
        ],
      },
      {
        labelFr: "PAR CATÉGORIE",
        labelEn: "BY CATEGORY",
        links: [
          { fr: "Design", en: "Design tools", path: "/category/design" },
          { fr: "Développement", en: "Development tools", path: "/category/developpement" },
          { fr: "Marketing", en: "Marketing tools", path: "/category/marketing" },
          { fr: "Productivité", en: "Productivity tools", path: "/category/productivite" },
          { fr: "Finance", en: "Finance tools", path: "/category/finance" },
          { fr: "No-code", en: "No-code tools", path: "/category/no-code" },
        ],
      },
      {
        labelFr: "PAR PROFIL",
        labelEn: "BY ROLE",
        links: [
          { fr: "Pour les designers", en: "Best for designers", path: "/tools?role=designer", count: 128 },
          { fr: "Pour les développeurs", en: "Best for developers", path: "/tools?role=developer", count: 96 },
          { fr: "Pour les freelances", en: "Best for freelancers", path: "/tools?role=freelance", count: 84 },
          { fr: "Pour les consultants", en: "Best for consultants", path: "/tools?role=consultant", count: 42 },
          { fr: "Pour les créateurs", en: "Best for creators", path: "/tools?role=creator", count: 67 },
        ],
      },
      {
        labelFr: "SÉLECTION",
        labelEn: "FEATURED",
        links: [
          { fr: "Choix ToolTrim", en: "ToolTrim Picks", path: "/tools?filter=picks" },
          { fr: "Top du mois", en: "Top this month", path: "/tools?sort=trending" },
          { fr: "Plus comparés", en: "Most compared", path: "/tools?sort=compared" },
          { fr: "Récemment mis à jour", en: "Recently updated", path: "/tools?sort=updated" },
        ],
      },
    ],
  },
  {
    id: "categories",
    labelFr: "Catégories",
    labelEn: "By Category",
    Icon: Tag,
    columns: [
      {
        labelFr: "PRODUCTIVITÉ",
        labelEn: "PRODUCTIVITY",
        links: [
          { fr: "Gestion de projet", en: "Project management", path: "/category/gestion-projet" },
          { fr: "Collaboration", en: "Collaboration", path: "/category/collaboration" },
          { fr: "Notes & docs", en: "Notes & docs", path: "/category/notes-docs" },
          { fr: "Automatisation", en: "Automation", path: "/category/automatisation" },
          { fr: "Communication", en: "Communication", path: "/category/communication" },
        ],
      },
      {
        labelFr: "TECHNIQUE",
        labelEn: "TECHNICAL",
        links: [
          { fr: "Design & prototypage", en: "Design & prototyping", path: "/category/design" },
          { fr: "Développement", en: "Development", path: "/category/developpement" },
          { fr: "No-code", en: "No-code", path: "/category/no-code" },
          { fr: "Analytics", en: "Analytics", path: "/category/analytics" },
          { fr: "Sécurité", en: "Security", path: "/category/securite" },
        ],
      },
      {
        labelFr: "BUSINESS",
        labelEn: "BUSINESS",
        links: [
          { fr: "Marketing", en: "Marketing", path: "/category/marketing" },
          { fr: "CRM & ventes", en: "CRM & sales", path: "/category/crm-ventes" },
          { fr: "Finance & comptabilité", en: "Finance & accounting", path: "/category/finance" },
          { fr: "RH & recrutement", en: "HR & hiring", path: "/category/rh-recrutement" },
          { fr: "Juridique", en: "Legal", path: "/category/juridique" },
        ],
      },
    ],
  },
  {
    id: "roles",
    labelFr: "Par profil",
    labelEn: "By Role",
    Icon: User,
    columns: [
      {
        labelFr: "INDÉPENDANTS",
        labelEn: "FREELANCERS",
        links: [
          { fr: "Freelances design / dev", en: "Design / Dev freelancers", path: "/tools?role=freelance" },
          { fr: "Consultants", en: "Consultants", path: "/tools?role=consultant" },
          { fr: "Créateurs de contenu", en: "Content creators", path: "/tools?role=creator" },
          { fr: "Solopreneurs IA", en: "AI solopreneurs", path: "/tools?role=ai-solopreneur" },
        ],
      },
      {
        labelFr: "ÉQUIPES",
        labelEn: "TEAMS",
        links: [
          { fr: "Fondateurs early-stage", en: "Early-stage founders", path: "/tools?role=founder" },
          { fr: "Équipes produit", en: "Product teams", path: "/tools?role=product" },
          { fr: "PME & scale-up", en: "SMBs & scale-ups", path: "/tools?role=sme" },
          { fr: "DSI & Ops", en: "IT directors & Ops", path: "/tools?role=ops" },
        ],
      },
      {
        labelFr: "PAR OBJECTIF",
        labelEn: "BY GOAL",
        links: [
          { fr: "Réduire les coûts", en: "Reduce costs", path: "/tools?goal=reduce-costs" },
          { fr: "Remplacer des outils", en: "Replace tools", path: "/comparatifs" },
          { fr: "Auditer sa stack", en: "Audit stack", path: "/selector" },
          { fr: "Trouver des alternatives", en: "Find alternatives", path: "/comparatifs" },
        ],
      },
    ],
  },
  {
    id: "stacks",
    labelFr: "Stacks",
    labelEn: "Stacks",
    Icon: Layers,
    columns: [
      {
        labelFr: "PAR PROFIL",
        labelEn: "BY ROLE",
        links: [
          { fr: "Stack freelance", en: "Freelance stack", path: "/stacks" },
          { fr: "Stack designer", en: "Designer stack", path: "/stacks" },
          { fr: "Stack développeur", en: "Developer stack", path: "/stacks" },
          { fr: "Stack consultant", en: "Consultant stack", path: "/stacks" },
          { fr: "Stack créateur", en: "Creator stack", path: "/stacks" },
          { fr: "Stack fondateur", en: "Founder stack", path: "/stacks" },
        ],
      },
      {
        labelFr: "PAR TAILLE",
        labelEn: "BY SIZE",
        links: [
          { fr: "Solo (1 personne)", en: "Solo (1 person)", path: "/stacks" },
          { fr: "Petite équipe (2–10)", en: "Small team (2–10)", path: "/stacks" },
          { fr: "PME (10–50)", en: "SMB (10–50)", path: "/stacks" },
          { fr: "Stack IA / no-code", en: "AI / no-code stack", path: "/stacks" },
        ],
      },
      {
        labelFr: "POPULAIRES",
        labelEn: "POPULAR",
        links: [
          { fr: "Outils essentiels", en: "Essential tools", path: "/stacks", count: 12 },
          { fr: "Moins de 100€/mois", en: "Under €100/mo", path: "/stacks", count: 8 },
          { fr: "100% gratuit", en: "100% free", path: "/stacks", count: 6 },
          { fr: "Stack bootstrapped", en: "Bootstrapped stack", path: "/stacks", count: 9 },
        ],
      },
    ],
  },
  {
    id: "alternatives",
    labelFr: "Alternatives",
    labelEn: "Alternatives",
    Icon: Scale,
    columns: [
      {
        labelFr: "OUTILS POPULAIRES",
        labelEn: "POPULAR TOOLS",
        links: [
          { fr: "Alternatives à Notion", en: "Notion alternatives", path: "/comparatifs" },
          { fr: "Alternatives à Slack", en: "Slack alternatives", path: "/comparatifs" },
          { fr: "Alternatives à Figma", en: "Figma alternatives", path: "/comparatifs" },
          { fr: "Alternatives à HubSpot", en: "HubSpot alternatives", path: "/comparatifs" },
          { fr: "Alternatives à Zapier", en: "Zapier alternatives", path: "/comparatifs" },
        ],
      },
      {
        labelFr: "PAR CATÉGORIE",
        labelEn: "BY CATEGORY",
        links: [
          { fr: "CRM moins chers", en: "Cheaper CRMs", path: "/comparatifs" },
          { fr: "Gestion de projet", en: "Project management", path: "/comparatifs" },
          { fr: "Design collaboratif", en: "Collaborative design", path: "/comparatifs" },
          { fr: "Automatisation", en: "Automation", path: "/comparatifs" },
          { fr: "Facturation & compta", en: "Billing & accounting", path: "/comparatifs" },
        ],
      },
      {
        labelFr: "GUIDES",
        labelEn: "GUIDES",
        links: [
          { fr: "Comment choisir un CRM", en: "How to choose a CRM", path: "/guides" },
          { fr: "Remplacer Google Workspace", en: "Replace Google Workspace", path: "/guides" },
          { fr: "Outils IA : lequel choisir ?", en: "AI tools: which to pick?", path: "/guides" },
        ],
      },
    ],
  },
  {
    id: "rankings",
    labelFr: "Classements",
    labelEn: "Rankings",
    Icon: BarChart3,
    columns: [
      {
        labelFr: "PAR SCORE",
        labelEn: "BY SCORE",
        links: [
          { fr: "Les mieux notés", en: "Highest rated", path: "/tools?sort=score" },
          { fr: "Meilleur rapport qualité/prix", en: "Best value for money", path: "/tools?sort=value" },
          { fr: "Top outils gratuits", en: "Top free tools", path: "/tools?filter=free&sort=score" },
          { fr: "Top outils IA", en: "Top AI tools", path: "/tools?filter=ai&sort=score" },
        ],
      },
      {
        labelFr: "TENDANCES",
        labelEn: "TRENDING",
        links: [
          { fr: "Top du mois", en: "Top this month", path: "/tools?sort=trending" },
          { fr: "Plus comparés", en: "Most compared", path: "/tools?sort=compared" },
          { fr: "Récemment mis à jour", en: "Recently updated", path: "/tools?sort=updated" },
          { fr: "Choix ToolTrim", en: "ToolTrim Picks", path: "/tools?filter=picks" },
        ],
      },
      {
        labelFr: "PAR BUDGET",
        labelEn: "BY BUDGET",
        links: [
          { fr: "100% gratuits", en: "Completely free", path: "/tools?filter=free", count: 84 },
          { fr: "Moins de 10€/mois", en: "Under €10/mo", path: "/tools?filter=budget", count: 67 },
          { fr: "Moins de 50€/mois", en: "Under €50/mo", path: "/tools?filter=mid", count: 112 },
          { fr: "Tarifs entreprise", en: "Enterprise pricing", path: "/tools?filter=enterprise", count: 43 },
        ],
      },
    ],
  },
  {
    id: "blog",
    labelFr: "Blog",
    labelEn: "Blog",
    Icon: BookOpen,
    columns: [
      {
        labelFr: "LES PLUS LUS",
        labelEn: "MOST READ",
        links: [
          { fr: "Comment auditer sa stack", en: "How to audit your stack", path: "/guides" },
          { fr: "Réduire ses abonnements SaaS", en: "Reduce your SaaS subscriptions", path: "/guides" },
          { fr: "Outils IA pour freelances", en: "AI tools for freelancers", path: "/guides" },
          { fr: "CRM gratuits en 2025", en: "Free CRMs in 2025", path: "/guides" },
        ],
      },
      {
        labelFr: "PAR THÈME",
        labelEn: "BY TOPIC",
        links: [
          { fr: "Optimisation de coûts", en: "Cost optimisation", path: "/guides" },
          { fr: "Comparatifs d'outils", en: "Tool comparisons", path: "/guides" },
          { fr: "Guides par profil", en: "Role-based guides", path: "/guides" },
          { fr: "Tendances SaaS", en: "SaaS trends", path: "/guides" },
          { fr: "Automatisation", en: "Automation", path: "/guides" },
        ],
      },
      {
        labelFr: "DERNIERS ARTICLES",
        labelEn: "LATEST",
        links: [
          { fr: "Voir tous les guides →", en: "See all guides →", path: "/guides" },
        ],
      },
    ],
  },
];

/* ─────────────────────────────────────────────
   Navbar
───────────────────────────────────────────── */
const Navbar = () => {
  const { t, prefix, lang } = useLang();
  const location = useLocation();
  const otherLang = lang === "fr" ? "en" : "fr";
  const { theme, toggle: toggleTheme } = useTheme();
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("tools");
  const [searchOpen, setSearchOpen] = useState(false);

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
  const shortcutLabel = isMac ? "⌘K" : "Ctrl K";

  /* Keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setPanelOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* Close on route change */
  useEffect(() => {
    setPanelOpen(false);
  }, [location.pathname]);

  /* Body scroll lock when panel is open */
  useEffect(() => {
    document.body.style.overflow = panelOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [panelOpen]);

  const languageHref = `/${otherLang}${location.pathname.replace(/^\/(fr|en)/, "")}${location.search}`;
  const isPath = (path: string) => location.pathname.startsWith(path);

  const navItems = [
    { fr: "Outils", en: "Tools", path: `${prefix}/tools` },
    { fr: "Stacks", en: "Stacks", path: `${prefix}/stacks` },
    { fr: "Alternatives", en: "Alternatives", path: `${prefix}/comparatifs` },
    { fr: "Catégories", en: "Categories", path: `${prefix}/category` },
  ];

  return (
    <>
      {/* ── Header ── */}
      <header
        className="fixed inset-x-0 top-0 z-50 header-root"
        style={{ height: `${HEADER_H}px` }}
      >
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between header-inner">
          {/* Logo */}
          <Link
            to={prefix}
            aria-label="ToolTrim home"
            className="shrink-0 transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <img src={logoToolTrim} alt="ToolTrim" className="h-[26px] w-auto" />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden items-center lg:flex" aria-label={t("Navigation", "Main navigation")}>
            {navItems.map((item) => (
              <Link
                key={item.fr}
                to={item.path}
                className={`nav-link ${isPath(item.path) ? "nav-link--active" : ""}`}
              >
                {lang === "en" ? item.en : item.fr}
              </Link>
            ))}
          </nav>

          {/* Right controls — desktop */}
          <div className="hidden items-center gap-2 lg:flex">
            <button
              onClick={() => setSearchOpen(true)}
              className="nav-search-btn"
              aria-label={t("Ouvrir la recherche", "Open search")}
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xl:inline">{t("Rechercher", "Search")}</span>
              <kbd className="nav-kbd">{shortcutLabel}</kbd>
            </button>

            <Link to={`${prefix}/contact`} className="nav-action-btn">
              {t("Soumettre un outil", "Submit Tool")}
            </Link>

            <LanguageToggle href={languageHref} lang={lang} otherLang={otherLang} />

            <button
              onClick={() => setPanelOpen((o) => !o)}
              className={`nav-menu-btn ${panelOpen ? "nav-menu-btn--open" : ""}`}
              aria-expanded={panelOpen}
              aria-label={panelOpen ? t("Fermer le menu", "Close menu") : t("Ouvrir le menu", "Open menu")}
            >
              {panelOpen ? <X className="h-3.5 w-3.5 shrink-0" /> : <MenuLines />}
              <span>{t("Menu", "Menu")}</span>
            </button>
          </div>

          {/* Mobile right */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={t("Rechercher", "Search")}
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPanelOpen((o) => !o)}
              className={`flex h-9 items-center gap-2 rounded border px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                panelOpen
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground hover:border-foreground"
              }`}
              aria-expanded={panelOpen}
              aria-label={panelOpen ? t("Fermer", "Close") : t("Menu", "Menu")}
            >
              {panelOpen ? <X className="h-3.5 w-3.5" /> : <MenuLines />}
              <span>{t("Menu", "Menu")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Editorial panel ── */}
      {panelOpen && (
        <EditoralPanel
          prefix={prefix}
          lang={lang}
          t={t}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onClose={() => setPanelOpen(false)}
          theme={theme}
          onToggleTheme={toggleTheme}
          languageHref={languageHref}
          otherLang={otherLang}
          headerHeight={HEADER_H}
          shortcutLabel={shortcutLabel}
        />
      )}

      {/* Backdrop — closes panel on outside click */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={() => setPanelOpen(false)}
          aria-hidden
        />
      )}

      {/* Search modal */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
};

/* ─────────────────────────────────────────────
   Editorial exploration panel
───────────────────────────────────────────── */
function EditoralPanel({
  prefix,
  lang,
  t,
  activeSection,
  onSectionChange,
  onClose,
  theme,
  onToggleTheme,
  languageHref,
  otherLang,
  headerHeight,
  shortcutLabel,
}: {
  prefix: string;
  lang: string;
  t: (fr: string, en: string) => string;
  activeSection: string;
  onSectionChange: (s: string) => void;
  onClose: () => void;
  theme: string;
  onToggleTheme: () => void;
  languageHref: string;
  otherLang: string;
  headerHeight: number;
  shortcutLabel: string;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  /* Focus search on open */
  useEffect(() => {
    const id = setTimeout(() => searchRef.current?.focus(), 60);
    return () => clearTimeout(id);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      navigate(`${prefix}/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const section = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];

  return (
    <div
      className="fixed z-[60] editorial-panel"
      style={{
        top: `${headerHeight + 8}px`,
        left: "12px",
        right: "12px",
        maxHeight: `calc(100vh - ${headerHeight + 20}px)`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t("Menu exploration", "Exploration menu")}
    >
      {/* ── Top row ── */}
      <div className="panel-toprow">
        {/* Logo */}
        <Link
          to={prefix}
          onClick={onClose}
          aria-label="ToolTrim"
          className="shrink-0 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        >
          <img src={logoToolTrim} alt="ToolTrim" className="h-[24px] w-auto" />
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 min-w-0 mx-4 lg:mx-6">
          <div className="panel-search-wrap">
            <Search className="panel-search-icon" aria-hidden />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(
                "Rechercher des outils, stacks ou alternatives…",
                "Search tools, stacks or alternatives…"
              )}
              className="panel-search-input"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); searchRef.current?.focus(); }}
                className="flex items-center justify-center w-7 h-7 rounded text-muted-foreground transition-colors hover:text-foreground shrink-0"
                aria-label={t("Effacer", "Clear")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <kbd
              className="hidden xl:flex items-center gap-0.5 shrink-0 px-2 py-1 rounded text-[10px] font-medium text-muted-foreground"
              style={{ background: "hsl(var(--secondary))", fontFamily: "var(--font-ui)" }}
            >
              {shortcutLabel}
            </kbd>
          </div>
        </form>

        {/* Actions */}
        <div className="hidden items-center gap-2 sm:flex shrink-0">
          <Link
            to={`${prefix}/contact`}
            onClick={onClose}
            className="panel-btn-secondary"
          >
            {t("Soumettre un outil", "Submit Tool")}
          </Link>
          <Link
            to={`${prefix}/selector`}
            onClick={onClose}
            className="panel-btn-primary"
          >
            {t("Analyser ma stack", "Analyze my stack")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Body: left rail + content ── */}
      <div className="panel-body">
        {/* Left nav rail */}
        <nav
          className="panel-rail"
          aria-label={t("Sections", "Sections")}
        >
          {SECTIONS.map((s) => {
            const isActive = s.id === activeSection;
            return (
              <button
                key={s.id}
                onClick={() => onSectionChange(s.id)}
                className={`panel-rail-item ${isActive ? "panel-rail-item--active" : ""}`}
                aria-current={isActive ? "true" : undefined}
              >
                <s.Icon className="h-[15px] w-[15px] shrink-0" />
                <span>{lang === "en" ? s.labelEn : s.labelFr}</span>
              </button>
            );
          })}

          {/* Footer controls */}
          <div className="mt-auto pt-6 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ThemeToggle theme={theme} onClick={onToggleTheme} />
              <a
                href={languageHref}
                hrefLang={otherLang}
                rel="alternate"
                className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:text-foreground"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {otherLang}
              </a>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {[
                { fr: "À propos", en: "About", path: "/about" },
                { fr: "Contact", en: "Contact", path: "/contact" },
              ].map((link) => (
                <Link
                  key={link.fr}
                  to={`${prefix}${link.path}`}
                  onClick={onClose}
                  className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {lang === "en" ? link.en : link.fr}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Main content columns */}
        <div className="panel-content">
          <div className="panel-columns">
            {section.columns.map((col, i) => (
              <div key={i} className="panel-col">
                <p className="panel-col-label">{lang === "en" ? col.labelEn : col.labelFr}</p>
                <div className="panel-col-links">
                  {col.links.map((link) => (
                    <Link
                      key={link.fr}
                      to={`${prefix}${link.path}`}
                      onClick={onClose}
                      className="panel-link group"
                    >
                      <span className="panel-link-text">
                        {lang === "en" ? link.en : link.fr}
                      </span>
                      {link.count !== undefined && (
                        <span className="panel-link-count">{link.count}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Small components
───────────────────────────────────────────── */
function MenuLines() {
  return (
    <svg width="15" height="10" viewBox="0 0 15 10" fill="none" aria-hidden>
      <line x1="0" y1="1" x2="15" y2="1" stroke="currentColor" strokeWidth="1.4" />
      <line x1="0" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function ThemeToggle({ theme, onClick }: { theme: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Toggle theme"
      className="relative rounded-full border border-border transition-colors hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{
        width: 44,
        height: 24,
        padding: 3,
        background: theme === "dark" ? "hsl(var(--primary) / 0.12)" : "hsl(var(--muted) / 0.6)",
      }}
    >
      <Sun
        className="absolute"
        style={{ left: 5, top: "50%", transform: "translateY(-50%)", width: 10, height: 10,
          color: theme === "dark" ? "hsl(var(--muted-foreground) / 0.3)" : "hsl(var(--foreground) / 0.5)" }}
      />
      <Moon
        className="absolute"
        style={{ right: 5, top: "50%", transform: "translateY(-50%)", width: 10, height: 10,
          color: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)" }}
      />
      <div
        className="absolute top-[3px] rounded-full bg-background"
        style={{
          width: 18, height: 18,
          left: theme === "dark" ? 23 : 3,
          transition: "left 200ms cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "0 1px 3px hsl(0 0% 0% / 0.15)",
        }}
      />
    </button>
  );
}

function LanguageToggle({ href, lang, otherLang }: { href: string; lang: string; otherLang: string }) {
  return (
    <a
      href={href}
      hrefLang={otherLang}
      rel="alternate"
      aria-label={`Switch to ${otherLang === "en" ? "English" : "Français"}`}
      className="flex items-center rounded-full border border-border transition-colors hover:border-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ padding: "3px" }}
    >
      {(["fr", "en"] as const).map((item) => (
        <span
          key={item}
          className="rounded-full transition-all duration-[180ms]"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.625rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "3px 8px",
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
