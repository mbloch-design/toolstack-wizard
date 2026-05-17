import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronDown,
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
const HEADER_H = 68;   // px

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
    id: "explorer",
    labelFr: "Explorer",
    labelEn: "Explore",
    Icon: Wrench,
    columns: [
      {
        labelFr: "OUTILS",
        labelEn: "TOOLS",
        links: [
          { fr: "Tous les outils", en: "All tools", path: "/tools" },
          { fr: "Nouveautés", en: "New tools", path: "/tools?sort=newest" },
          { fr: "Les mieux notés", en: "Highest rated", path: "/tools?sort=score" },
          { fr: "Outils gratuits", en: "Free tools", path: "/tools?filter=free" },
          { fr: "Outils IA", en: "AI tools", path: "/tools?filter=ai" },
        ],
      },
      {
        labelFr: "SÉLECTIONS",
        labelEn: "FEATURED",
        links: [
          { fr: "ToolTrim Picks", en: "ToolTrim Picks", path: "/tools?filter=picks" },
          { fr: "Meilleurs rapports qualité-prix", en: "Best value for money", path: "/tools?sort=value" },
          { fr: "Faciles à prendre en main", en: "Easy to adopt", path: "/tools?filter=easy" },
          { fr: "Pour solo / freelance", en: "For solo / freelancers", path: "/tools?role=freelance" },
          { fr: "À éviter de remplacer", en: "Worth keeping", path: "/tools?filter=keep" },
        ],
      },
      {
        labelFr: "RACCOURCIS",
        labelEn: "SHORTCUTS",
        links: [
          { fr: "Comparer deux outils", en: "Compare two tools", path: "/comparatifs" },
          { fr: "Trouver une alternative", en: "Find an alternative", path: "/comparatifs" },
          { fr: "Construire une stack", en: "Build a stack", path: "/stacks" },
          { fr: "Analyser ma stack", en: "Analyze my stack", path: "/selector" },
        ],
      },
    ],
  },
  {
    id: "categories",
    labelFr: "Catégories",
    labelEn: "Categories",
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
      {
        labelFr: "CRÉATION",
        labelEn: "CREATION",
        links: [
          { fr: "Contenu", en: "Content", path: "/category/contenu" },
          { fr: "Vidéo", en: "Video", path: "/category/video" },
          { fr: "Image", en: "Image", path: "/category/image" },
          { fr: "Présentation", en: "Presentation", path: "/category/presentation" },
          { fr: "Réseaux sociaux", en: "Social media", path: "/category/reseaux-sociaux" },
        ],
      },
    ],
  },
  {
    id: "profiles",
    labelFr: "Profils",
    labelEn: "Profiles",
    Icon: User,
    columns: [
      {
        labelFr: "CRÉATIFS",
        labelEn: "CREATIVES",
        links: [
          { fr: "Designer", en: "Designer", path: "/tools?role=designer" },
          { fr: "Directeur artistique", en: "Art director", path: "/tools?role=art-director" },
          { fr: "Créateur de contenu", en: "Content creator", path: "/tools?role=creator" },
          { fr: "Architecte d'intérieur", en: "Interior designer", path: "/tools?role=interior" },
        ],
      },
      {
        labelFr: "TECH",
        labelEn: "TECH",
        links: [
          { fr: "Développeur freelance", en: "Freelance developer", path: "/tools?role=developer" },
          { fr: "No-code builder", en: "No-code builder", path: "/tools?role=nocode" },
          { fr: "Product manager", en: "Product manager", path: "/tools?role=product" },
          { fr: "Growth", en: "Growth", path: "/tools?role=growth" },
        ],
      },
      {
        labelFr: "BUSINESS",
        labelEn: "BUSINESS",
        links: [
          { fr: "Consultant", en: "Consultant", path: "/tools?role=consultant" },
          { fr: "Coach", en: "Coach", path: "/tools?role=coach" },
          { fr: "Indépendant", en: "Independent", path: "/tools?role=freelance" },
          { fr: "Ops / COO", en: "Ops / COO", path: "/tools?role=ops" },
        ],
      },
      {
        labelFr: "SOLO",
        labelEn: "SOLO",
        links: [
          { fr: "Solo généraliste", en: "Solo generalist", path: "/tools?role=solo" },
          { fr: "Freelance", en: "Freelancer", path: "/tools?role=freelance" },
          { fr: "Petite agence", en: "Small agency", path: "/tools?role=agency" },
          { fr: "Fondateur", en: "Founder", path: "/tools?role=founder" },
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
        labelFr: "PAR MÉTIER",
        labelEn: "BY ROLE",
        links: [
          { fr: "Stack designer", en: "Designer stack", path: "/stacks" },
          { fr: "Stack développeur", en: "Developer stack", path: "/stacks" },
          { fr: "Stack consultant", en: "Consultant stack", path: "/stacks" },
          { fr: "Stack créateur", en: "Creator stack", path: "/stacks" },
          { fr: "Stack ops / COO", en: "Ops / COO stack", path: "/stacks" },
        ],
      },
      {
        labelFr: "PAR BESOIN",
        labelEn: "BY NEED",
        links: [
          { fr: "Lancer un projet", en: "Launch a project", path: "/stacks" },
          { fr: "Gérer ses clients", en: "Manage clients", path: "/stacks" },
          { fr: "Créer du contenu", en: "Create content", path: "/stacks" },
          { fr: "Automatiser", en: "Automate", path: "/stacks" },
          { fr: "Vendre", en: "Sell", path: "/stacks" },
        ],
      },
      {
        labelFr: "POPULAIRES",
        labelEn: "POPULAR",
        links: [
          { fr: "Stack freelance", en: "Freelance stack", path: "/stacks" },
          { fr: "Stack IA", en: "AI stack", path: "/stacks" },
          { fr: "Stack no-code", en: "No-code stack", path: "/stacks" },
          { fr: "Stack productivité", en: "Productivity stack", path: "/stacks" },
        ],
      },
    ],
  },
  {
    id: "alternatives",
    labelFr: "Comparatifs",
    labelEn: "Comparisons",
    Icon: Scale,
    columns: [
      {
        labelFr: "ALTERNATIVES POPULAIRES",
        labelEn: "POPULAR ALTERNATIVES",
        links: [
          { fr: "Alternative à Notion", en: "Notion alternative", path: "/comparatifs" },
          { fr: "Alternative à Framer", en: "Framer alternative", path: "/comparatifs" },
          { fr: "Alternative à Webflow", en: "Webflow alternative", path: "/comparatifs" },
          { fr: "Alternative à Airtable", en: "Airtable alternative", path: "/comparatifs" },
          { fr: "Alternative à Zapier", en: "Zapier alternative", path: "/comparatifs" },
        ],
      },
      {
        labelFr: "BUDGET",
        labelEn: "FREE",
        links: [
          { fr: "Comparer les plans gratuits", en: "Compare free plans", path: "/comparatifs" },
          { fr: "Open-source", en: "Open-source", path: "/comparatifs" },
          { fr: "Plans gratuits généreux", en: "Generous free plans", path: "/comparatifs" },
          { fr: "Outils moins chers", en: "Cheaper tools", path: "/comparatifs" },
        ],
      },
      {
        labelFr: "PAR USAGE",
        labelEn: "BY USE CASE",
        links: [
          { fr: "Remplacer un CRM", en: "Replace a CRM", path: "/comparatifs" },
          { fr: "Remplacer un outil design", en: "Replace a design tool", path: "/comparatifs" },
          { fr: "Remplacer un outil projet", en: "Replace a project tool", path: "/comparatifs" },
          { fr: "Remplacer un outil IA", en: "Replace an AI tool", path: "/comparatifs" },
        ],
      },
    ],
  },
  {
    id: "guides",
    labelFr: "Guides",
    labelEn: "Guides",
    Icon: BookOpen,
    columns: [
      {
        labelFr: "GUIDES D'ACHAT",
        labelEn: "BUYING GUIDES",
        links: [
          { fr: "Bien choisir son outil", en: "How to choose a tool", path: "/guides" },
          { fr: "Comparer deux solutions", en: "Compare two solutions", path: "/guides" },
          { fr: "Comprendre les prix", en: "Understanding pricing", path: "/guides" },
          { fr: "Éviter les mauvais choix", en: "Avoid bad choices", path: "/guides" },
        ],
      },
      {
        labelFr: "STACKS COMMENTÉES",
        labelEn: "STACK BREAKDOWNS",
        links: [
          { fr: "Stack freelance", en: "Freelance stack", path: "/stacks" },
          { fr: "Stack designer", en: "Designer stack", path: "/stacks" },
          { fr: "Stack développeur", en: "Developer stack", path: "/stacks" },
          { fr: "Stack consultant", en: "Consultant stack", path: "/stacks" },
          { fr: "Stack créateur", en: "Creator stack", path: "/stacks" },
        ],
      },
      {
        labelFr: "COMPARATIFS",
        labelEn: "COMPARISONS",
        links: [
          { fr: "Comparer les plans gratuits", en: "Compare free plans", path: "/comparatifs" },
          { fr: "Comparer les outils moins chers", en: "Compare cheaper tools", path: "/comparatifs" },
          { fr: "Comparer les options open-source", en: "Compare open-source options", path: "/comparatifs" },
          { fr: "Remplacer un outil trop cher", en: "Replace an expensive tool", path: "/comparatifs" },
        ],
      },
      {
        labelFr: "MÉTHODES",
        labelEn: "METHODS",
        links: [
          { fr: "Construire sa stack", en: "Build your stack", path: "/guides" },
          { fr: "Auditer ses outils", en: "Audit your tools", path: "/guides" },
          { fr: "Réduire ses abonnements", en: "Cut subscriptions", path: "/guides" },
          { fr: "Choisir selon son profil", en: "Choose by profile", path: "/guides" },
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
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelClosing, setPanelClosing] = useState(false);
  const [activeSection, setActiveSection] = useState("explorer");
  const [searchOpen, setSearchOpen] = useState(false);

  /* Mobile detection — panel renders full-screen below 1024px */
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
  const shortcutLabel = isMac ? "⌘K" : "Ctrl K";

  /* Manage mount/unmount with enter/exit animation timing */
  useEffect(() => {
    if (panelOpen) {
      setPanelClosing(false);
      setPanelMounted(true);
    } else if (panelMounted) {
      setPanelClosing(true);
      const timer = setTimeout(() => {
        setPanelMounted(false);
        setPanelClosing(false);
      }, 160); // matches exit animation duration
      return () => clearTimeout(timer);
    }
  }, [panelOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if (e.key === "Escape") {
        if (searchOpen) {
          setSearchOpen(false);
        } else {
          setPanelOpen(false);
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [searchOpen]);

  /* Close on route change */
  useEffect(() => {
    setPanelOpen(false);
  }, [location.pathname]);

  const languageHref = `/${otherLang}${location.pathname.replace(/^\/(fr|en)/, "")}${location.search}`;
  const isPath = (path: string) => location.pathname.startsWith(path);

  const secondaryNavItems = [
    { fr: "Stacks", en: "Stacks", path: `${prefix}/stacks` },
    { fr: "Comparatifs", en: "Comparisons", path: `${prefix}/comparatifs` },
    { fr: "Guides", en: "Guides", path: `${prefix}/guides` },
  ];

  return (
    <>
      {/* ── Header ── */}
      <header
        className="fixed inset-x-0 top-0 z-50 header-root"
        style={{ height: `${HEADER_H}px` }}
      >
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between header-inner">

          {/* ── Logo ── */}
          <Link
            to={prefix}
            aria-label="ToolTrim home"
            className="shrink-0 transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <img src={logoToolTrim} alt="ToolTrim" className="site-logo w-auto" style={{ height: 28 }} />
          </Link>

          {/* ── Desktop center nav ── */}
          <nav
            className="hidden items-center lg:flex"
            style={{ gap: 30 }}
            aria-label={t("Navigation principale", "Main navigation")}
          >
            {/* Explorer — panel trigger */}
            <button
              onClick={() => setPanelOpen((o) => !o)}
              className={`nav-explorer-btn${panelOpen ? " nav-explorer-btn--open" : ""}`}
              aria-expanded={panelOpen}
              aria-haspopup="dialog"
              aria-label={panelOpen ? t("Fermer Explorer", "Close Explorer") : t("Ouvrir Explorer", "Open Explorer")}
            >
              {t("Explorer", "Explorer")}
              <ChevronDown className={`nav-chevron${panelOpen ? " nav-chevron--open" : ""}`} strokeWidth={1.5} aria-hidden />
            </button>

            {/* Other nav items */}
            {secondaryNavItems.map((item) => (
              <Link
                key={item.fr}
                to={item.path}
                className={`nav-link${isPath(item.path) ? " nav-link--active" : ""}`}
              >
                {lang === "en" ? item.en : item.fr}
              </Link>
            ))}
          </nav>

          {/* ── Desktop right controls ── */}
          <div className="hidden items-center lg:flex" style={{ gap: 10 }}>
            {/* Inline search bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="nav-search-bar"
              aria-label={t("Rechercher", "Search")}
            >
              <Search className="nav-search-bar-icon" aria-hidden />
              <span className="nav-search-placeholder">
                {t("Rechercher…", "Search…")}
              </span>
              <kbd className="nav-kbd">{shortcutLabel}</kbd>
            </button>

            <Link to={`${prefix}/selector`} className="nav-audit-btn">
              {t("Auditer ma stack", "Audit my stack")}
            </Link>

            {/* Discreet submit link */}
            <Link to={`${prefix}/contact`} className="nav-submit-btn">
              {t("Soumettre un outil", "Submit Tool")}
            </Link>

            {/* Language toggle */}
            <LanguageToggle href={languageHref} lang={lang} otherLang={otherLang} />
          </div>

          {/* ── Mobile right ── */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={t("Rechercher", "Search")}
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPanelOpen((o) => !o)}
              className={`nav-menu-btn${panelOpen ? " nav-menu-btn--open" : ""}`}
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
      {panelMounted && (
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
          closing={panelClosing}
          isMobile={isMobile}
        />
      )}

      {/* Transparent click-catcher — closes panel on outside click, no overlay */}
      {panelMounted && (
        <div
          className="fixed inset-0 z-[45]"
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
  closing,
  isMobile = false,
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
  closing?: boolean;
  isMobile?: boolean;
}) {
  const section = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];

  /* Positioning differs between desktop panel and mobile full-screen menu */
  const panelStyle: React.CSSProperties = isMobile
    ? {
        /* Mobile: full-width, full-height below header, scrollable */
        top: `${headerHeight}px`,
        left: 0,
        right: 0,
        bottom: 0,
        height: "auto",
        maxWidth: "100vw",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }
    : {
        /* Desktop: floating card with side margins */
        top: `${headerHeight + 8}px`,
        left: "24px",
        right: "24px",
        height: "560px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      };

  return (
    <div
      className={`fixed z-[46] editorial-panel${closing ? " editorial-panel--closing" : " editorial-panel--opening"}`}
      style={panelStyle}
      role="dialog"
      aria-modal="true"
      aria-label={t("Menu exploration", "Exploration menu")}
    >
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

          {/* Footer controls — hidden on mobile via .panel-rail-footer */}
          <div className="mt-auto pt-6 flex flex-col gap-3 panel-rail-footer">
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
      className="flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{
        height: 32,
        border: "1px solid #DADAD4",
        background: "#F8F8F4",
        borderRadius: 9999,
        padding: "3px",
        gap: 2,
        flexShrink: 0,
      }}
    >
      {(["fr", "en"] as const).map((item) => (
        <span
          key={item}
          className="rounded-full transition-all duration-150"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.75rem",             /* 12px */
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            height: 26,
            minWidth: 30,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 8px",
            background: lang === item ? "#222222" : "transparent",
            color: lang === item ? "#FFFFFF" : "#9A9A92",
          }}
        >
          {item}
        </span>
      ))}
    </a>
  );
}

export default Navbar;
