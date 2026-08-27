import { Link, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Layers,
  Scale,
  Search,
  Bookmark,
  Tag,
  User,
  Wrench,
  X,
} from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
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
          { fr: "Nouveautés", en: "New tools", path: "/tools" },
          { fr: "Les mieux notés", en: "Highest rated", path: "/tools" },
          { fr: "Outils gratuits", en: "Free tools", path: "/comparatifs?cat=ia&q=gratuit" },
          { fr: "Outils IA", en: "AI tools", path: "/category/ia-generaliste" },
        ],
      },
      {
        labelFr: "SÉLECTIONS",
        labelEn: "FEATURED",
        links: [
          { fr: "ToolTrim Picks", en: "ToolTrim Picks", path: "/tools" },
          { fr: "Meilleurs rapports qualité-prix", en: "Best value for money", path: "/comparatifs?q=prix" },
          { fr: "Faciles à prendre en main", en: "Easy to adopt", path: "/tools" },
          { fr: "Pour solo / freelance", en: "For solo / freelancers", path: "/stacks?profile=solo" },
          { fr: "À éviter de remplacer", en: "Worth keeping", path: "/guides" },
        ],
      },
      {
        labelFr: "RACCOURCIS",
        labelEn: "SHORTCUTS",
        links: [
          { fr: "Comparer deux outils", en: "Compare two tools", path: "/comparatifs" },
          { fr: "Trouver une alternative", en: "Find an alternative", path: "/comparatifs" },
          { fr: "Construire une stack", en: "Build a stack", path: "/stacks" },
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
          { fr: "Collaboration", en: "Collaboration", path: "/category/communication-equipe" },
          { fr: "Notes & docs", en: "Notes & docs", path: "/category/organisation" },
          { fr: "Automatisation", en: "Automation", path: "/category/automatisation" },
          { fr: "Communication", en: "Communication", path: "/category/communication" },
        ],
      },
      {
        labelFr: "TECHNIQUE",
        labelEn: "TECHNICAL",
        links: [
          { fr: "Design & prototypage", en: "Design & prototyping", path: "/category/design-prototypage" },
          { fr: "Développement", en: "Development", path: "/category/nocode-web" },
          { fr: "No-code", en: "No-code", path: "/category/nocode-web" },
          { fr: "Analytics", en: "Analytics", path: "/category/analytics" },
          { fr: "Sécurité", en: "Security", path: "/category/securite" },
        ],
      },
      {
        labelFr: "BUSINESS",
        labelEn: "BUSINESS",
        links: [
          { fr: "Marketing", en: "Marketing", path: "/category/email-marketing" },
          { fr: "CRM & ventes", en: "CRM & sales", path: "/comparatifs?cat=crm" },
          { fr: "Finance & comptabilité", en: "Finance & accounting", path: "/category/finance-facturation" },
          { fr: "RH & recrutement", en: "HR & hiring", path: "/category/sirh-paie" },
          { fr: "Juridique", en: "Legal", path: "/category/legal-contracts" },
        ],
      },
      {
        labelFr: "CRÉATION",
        labelEn: "CREATION",
        links: [
          { fr: "Contenu", en: "Content", path: "/category/creation-design" },
          { fr: "Vidéo", en: "Video", path: "/category/creation-design" },
          { fr: "Image", en: "Image", path: "/category/creation-design" },
          { fr: "Présentation", en: "Presentation", path: "/category/creation-design" },
          { fr: "Réseaux sociaux", en: "Social media", path: "/category/email-marketing" },
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
          { fr: "Designer", en: "Designer", path: "/stacks?profile=designer" },
          { fr: "Directeur artistique", en: "Art director", path: "/stacks?profile=designer" },
          { fr: "Créateur de contenu", en: "Content creator", path: "/stacks?profile=content" },
          { fr: "Architecte d'intérieur", en: "Interior designer", path: "/stacks/architecte-interieur" },
        ],
      },
      {
        labelFr: "TECH",
        labelEn: "TECH",
        links: [
          { fr: "Développeur freelance", en: "Freelance developer", path: "/stacks?profile=dev" },
          { fr: "No-code builder", en: "No-code builder", path: "/stacks/constructeur-app-nocode-ia" },
          { fr: "Product manager", en: "Product manager", path: "/stacks?profile=ops" },
          { fr: "Growth", en: "Growth", path: "/stacks?profile=ops" },
        ],
      },
      {
        labelFr: "BUSINESS",
        labelEn: "BUSINESS",
        links: [
          { fr: "Consultant", en: "Consultant", path: "/stacks?profile=consultant" },
          { fr: "Coach", en: "Coach", path: "/stacks?profile=consultant" },
          { fr: "Indépendant", en: "Independent", path: "/stacks?profile=solo" },
          { fr: "Ops / COO", en: "Ops / COO", path: "/stacks?profile=ops" },
        ],
      },
      {
        labelFr: "SOLO",
        labelEn: "SOLO",
        links: [
          { fr: "Solo généraliste", en: "Solo generalist", path: "/stacks/freelance-solo-zero-bloat" },
          { fr: "Freelance", en: "Freelancer", path: "/stacks/freelance" },
          { fr: "Petite agence", en: "Small agency", path: "/stacks/agence-marketing" },
          { fr: "Fondateur", en: "Founder", path: "/stacks/solopreneur" },
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
          { fr: "Stack designer", en: "Designer stack", path: "/stacks/designer-freelance-solo" },
          { fr: "Stack développeur", en: "Developer stack", path: "/stacks/developpeur-freelance-shipper" },
          { fr: "Stack consultant", en: "Consultant stack", path: "/stacks/consultant-b2b-propre" },
          { fr: "Stack créateur", en: "Creator stack", path: "/stacks/createur-contenu-operateur" },
          { fr: "Stack ops / COO", en: "Ops / COO stack", path: "/stacks/ops-manager-fractional-coo" },
        ],
      },
      {
        labelFr: "PAR BESOIN",
        labelEn: "BY NEED",
        links: [
          { fr: "Lancer un projet", en: "Launch a project", path: "/stacks?objective=produce" },
          { fr: "Gérer ses clients", en: "Manage clients", path: "/stacks?objective=clients" },
          { fr: "Créer du contenu", en: "Create content", path: "/stacks?objective=content" },
          { fr: "Automatiser", en: "Automate", path: "/stacks?objective=automate" },
          { fr: "Vendre", en: "Sell", path: "/stacks?objective=sell" },
        ],
      },
      {
        labelFr: "POPULAIRES",
        labelEn: "POPULAR",
        links: [
          { fr: "Stack freelance", en: "Freelance stack", path: "/stacks/freelance" },
          { fr: "Stack IA", en: "AI stack", path: "/stacks/productivite-ia-personnelle" },
          { fr: "Stack no-code", en: "No-code stack", path: "/stacks/constructeur-app-nocode-ia" },
          { fr: "Stack productivité", en: "Productivity stack", path: "/stacks/freelance-solo-zero-bloat" },
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
          { fr: "Alternative à Notion", en: "Notion alternative", path: "/comparatifs?q=notion" },
          { fr: "Alternative à Framer", en: "Framer alternative", path: "/comparatifs?q=framer" },
          { fr: "Alternative à Webflow", en: "Webflow alternative", path: "/comparatifs?q=webflow" },
          { fr: "Alternative à Airtable", en: "Airtable alternative", path: "/comparatifs?q=airtable" },
          { fr: "Alternative à Zapier", en: "Zapier alternative", path: "/comparatifs?q=zapier" },
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
          { fr: "Remplacer un CRM", en: "Replace a CRM", path: "/comparatifs?cat=crm" },
          { fr: "Remplacer un outil design", en: "Replace a design tool", path: "/comparatifs?cat=design" },
          { fr: "Remplacer un outil projet", en: "Replace a project tool", path: "/comparatifs?cat=productivite" },
          { fr: "Remplacer un outil IA", en: "Replace an AI tool", path: "/comparatifs?cat=ia" },
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
          { fr: "Stack freelance", en: "Freelance stack", path: "/stacks/freelance" },
          { fr: "Stack designer", en: "Designer stack", path: "/stacks/designer-freelance-solo" },
          { fr: "Stack développeur", en: "Developer stack", path: "/stacks/developpeur-freelance-shipper" },
          { fr: "Stack consultant", en: "Consultant stack", path: "/stacks/consultant-b2b-propre" },
          { fr: "Stack créateur", en: "Creator stack", path: "/stacks/createur-contenu-operateur" },
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
  const { state: cartState } = useStackPins();
  const cartCount = cartState.pinnedToolSlugs.length;
  const cartLabel = cartCount > 0
    ? `${t("Ma stack", "My stack")} · ${cartCount}`
    : t("Ma stack", "My stack");
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelClosing, setPanelClosing] = useState(false);
  const [activeSection, setActiveSection] = useState("explorer");
  const [searchOpen, setSearchOpen] = useState(false);

  /* Mobile detection — panel renders full-screen below 1024px.
     Starts false on both server and client (SSR has no window) so the
     first client render matches the server markup exactly — useLayoutEffect
     corrects it synchronously before paint, avoiding both a hydration
     mismatch and a visible flash on real mobile devices. */
  const [isMobile, setIsMobile] = useState(false);
  useLayoutEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
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
            <img src={logoToolTrim} alt="ToolTrim" className="site-logo" width={127} height={28} style={{ height: 28, width: 127 }} />
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

          {/* ── Desktop right controls — search · lang · primary CTA ── */}
          <div className="hidden items-center lg:flex" style={{ gap: 10 }}>
            {/* Inline search bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="nav-search-bar"
              aria-label={t("Rechercher", "Search")}
            >
              <span className="nav-search-placeholder">
                {t("Rechercher…", "Search…")}
              </span>
              <kbd className="nav-kbd">{shortcutLabel}</kbd>
              <span className="nav-search-bar-action" aria-hidden>
                <Search className="nav-search-bar-icon" aria-hidden />
              </span>
            </button>

            {/* Language toggle */}
            <LanguageToggle href={languageHref} lang={lang} otherLang={otherLang} />

            {/* Primary CTA sits last — anchored to the right edge */}
            <Link to={`${prefix}/ma-stack`} className="nav-audit-btn" aria-label={cartLabel}>
              <Bookmark className="h-4 w-4" aria-hidden />
              <span>{cartLabel}</span>
            </Link>
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
  languageHref: string;
  otherLang: string;
  headerHeight: number;
  closing?: boolean;
  isMobile?: boolean;
}) {
  const section = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFrame = window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>("button, a[href]")?.focus();
    });

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", trapFocus);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", trapFocus);
      previousFocusRef.current?.focus();
    };
  }, []);

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
      ref={panelRef}
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
        background: "#FDFCFC",
        borderRadius: "var(--radius-pill)",
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
            color: lang === item ? "#FFFFFF" : "#5F5F59",
          }}
        >
          {item}
        </span>
      ))}
    </a>
  );
}

export default Navbar;
