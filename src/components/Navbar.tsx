import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { Moon, Search, Sun, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "@/hooks/useTheme";
import logoToolTrim from "@/assets/logo-tooltrim.svg";
import { SearchModal } from "@/components/SearchModal";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type ActivePanel = "explore" | "fullscreen" | null;

const HEADER_H = 76; // px — desktop & tablet
const HEADER_H_MOBILE = 64; // px

/* ─────────────────────────────────────────────
   Data
───────────────────────────────────────────── */
const MEGA_COLUMNS = [
  {
    label: { fr: "EXPLORER", en: "EXPLORE" },
    links: [
      { fr: "Tous les outils", en: "All tools", path: "/tools" },
      { fr: "Derniers ajouts", en: "Latest tools", path: "/tools?sort=newest" },
      { fr: "Meilleurs scores", en: "Highest scores", path: "/tools?sort=score" },
      { fr: "Outils gratuits", en: "Free tools", path: "/tools?filter=free" },
      { fr: "Outils IA", en: "AI tools", path: "/tools?filter=ai" },
    ],
  },
  {
    label: { fr: "STACKS", en: "STACKS" },
    links: [
      { fr: "Stack freelance", en: "Freelance stack", path: "/stacks" },
      { fr: "Stack designer", en: "Designer stack", path: "/stacks" },
      { fr: "Stack développeur", en: "Developer stack", path: "/stacks" },
      { fr: "Stack consultant", en: "Consultant stack", path: "/stacks" },
      { fr: "Stack créateur", en: "Creator stack", path: "/stacks" },
    ],
  },
  {
    label: { fr: "CATÉGORIES", en: "CATEGORIES" },
    links: [
      { fr: "Design", en: "Design", path: "/category/design" },
      { fr: "Développement", en: "Development", path: "/category/developpement" },
      { fr: "Productivité", en: "Productivity", path: "/category/productivite" },
      { fr: "Marketing", en: "Marketing", path: "/category/marketing" },
      { fr: "Finance", en: "Finance", path: "/category/finance" },
      { fr: "No-code", en: "No-code", path: "/category/no-code" },
    ],
  },
  {
    label: { fr: "CLASSEMENTS", en: "RANKINGS" },
    links: [
      { fr: "Meilleurs gratuits", en: "Best free tools", path: "/tools?filter=free&sort=score" },
      { fr: "Meilleurs IA", en: "Best AI tools", path: "/tools?filter=ai&sort=score" },
      { fr: "Meilleures alternatives", en: "Best alternatives", path: "/comparatifs" },
      { fr: "Top du mois", en: "Top rated this month", path: "/tools?sort=trending" },
      { fr: "Choix ToolTrim", en: "ToolTrim picks", path: "/tools?filter=picks" },
    ],
  },
];

const FULLSCREEN_ITEMS = [
  {
    num: "01",
    fr: "Explorer",
    en: "Explore",
    descFr: "Découvrez des outils curatés et leurs classements.",
    descEn: "Discover curated tools and rankings.",
    path: "/tools",
  },
  {
    num: "02",
    fr: "Outils",
    en: "Tools",
    descFr: "Parcourez l'annuaire complet ToolTrim.",
    descEn: "Browse the full ToolTrim directory.",
    path: "/tools",
  },
  {
    num: "03",
    fr: "Stacks",
    en: "Stacks",
    descFr: "Trouvez des stacks complètes par profil.",
    descEn: "Find complete tool stacks by role.",
    path: "/stacks",
  },
  {
    num: "04",
    fr: "Alternatives",
    en: "Alternatives",
    descFr: "Remplacez vos outils par de meilleures options.",
    descEn: "Replace tools with smarter options.",
    path: "/comparatifs",
  },
  {
    num: "05",
    fr: "Classements",
    en: "Rankings",
    descFr: "Voyez ce qui obtient les meilleurs scores.",
    descEn: "See what scores highest.",
    path: "/tools",
  },
];

const SECONDARY_LINKS = [
  { fr: "Méthodologie", en: "Methodology", pathFn: (l: string) => (l === "fr" ? "/methodologie" : "/methodology") },
  { fr: "Transparence", en: "Transparency", path: "/transparency" },
  { fr: "À propos", en: "About", path: "/about" },
  { fr: "Guides", en: "Guides", path: "/guides" },
  { fr: "Contact", en: "Contact", path: "/contact" },
];

/* ─────────────────────────────────────────────
   Navbar
───────────────────────────────────────────── */
const Navbar = () => {
  const { t, prefix, lang } = useLang();
  const location = useLocation();
  const otherLang = lang === "fr" ? "en" : "fr";
  const { theme, toggle: toggleTheme } = useTheme();
  const [active, setActive] = useState<ActivePanel>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const megaLeaveTimer = useRef<ReturnType<typeof setTimeout>>();

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
        setActive(null);
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* Close everything on route change */
  useEffect(() => {
    setActive(null);
    setSearchOpen(false);
  }, [location.pathname]);

  /* Close mega on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActive((p) => (p === "explore" ? null : p));
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Body scroll lock for fullscreen menu */
  useEffect(() => {
    document.body.style.overflow = active === "fullscreen" ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);

  const languageHref = `/${otherLang}${location.pathname.replace(/^\/(fr|en)/, "")}${location.search}`;
  const isPath = (path: string) => location.pathname.startsWith(path);

  const openMega = useCallback(() => {
    clearTimeout(megaLeaveTimer.current);
    setActive("explore");
  }, []);

  const scheduleMegaClose = useCallback(() => {
    megaLeaveTimer.current = setTimeout(() => {
      setActive((p) => (p === "explore" ? null : p));
    }, 200);
  }, []);

  const closeMega = useCallback(() => {
    setActive((p) => (p === "explore" ? null : p));
  }, []);

  const toggleFullscreen = useCallback(() => {
    setActive((p) => (p === "fullscreen" ? null : "fullscreen"));
  }, []);

  /* Desktop nav links */
  const navItems = [
    { fr: "Outils", en: "Tools", path: `${prefix}/tools` },
    { fr: "Stacks", en: "Stacks", path: `${prefix}/stacks` },
    { fr: "Alternatives", en: "Alternatives", path: `${prefix}/comparatifs` },
    { fr: "Classements", en: "Rankings", path: `${prefix}/tools` },
    { fr: "Catégories", en: "Categories", path: `${prefix}/category` },
  ];

  const exploreActive =
    active === "explore" ||
    isPath(`${prefix}/tools`) ||
    isPath(`${prefix}/category`) ||
    isPath(`${prefix}/stacks`) ||
    isPath(`${prefix}/comparatifs`);

  return (
    <>
      {/* ── Header ── */}
      <header
        ref={navRef}
        className="fixed inset-x-0 top-0 z-50 header-root"
        style={{ height: `${HEADER_H}px` }}
      >
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between header-inner">
          {/* Logo */}
          <Link
            to={prefix}
            onClick={closeMega}
            aria-label="ToolTrim home"
            className="shrink-0 opacity-100 transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <img src={logoToolTrim} alt="ToolTrim" className="h-[27px] w-auto" />
          </Link>

          {/* ── Center nav — desktop ── */}
          <nav
            className="hidden items-center lg:flex"
            aria-label={t("Navigation principale", "Main navigation")}
          >
            {/* Explore — mega trigger */}
            <div
              onMouseEnter={openMega}
              onMouseLeave={scheduleMegaClose}
            >
              <button
                aria-expanded={active === "explore"}
                aria-haspopup="true"
                onClick={() => setActive((p) => p === "explore" ? null : "explore")}
                className={`nav-link ${exploreActive ? "nav-link--active" : ""}`}
              >
                {t("Explorer", "Explore")}
              </button>
            </div>

            {navItems.map((item) => (
              <Link
                key={item.fr}
                to={item.path}
                onClick={closeMega}
                className={`nav-link ${isPath(item.path) ? "nav-link--active" : ""}`}
              >
                {lang === "en" ? item.en : item.fr}
              </Link>
            ))}
          </nav>

          {/* ── Right controls — desktop ── */}
          <div className="hidden items-center gap-2 lg:flex">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="nav-search-btn group"
              aria-label={t("Ouvrir la recherche", "Open search")}
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xl:inline">{t("Rechercher", "Search")}</span>
              <kbd className="nav-kbd">{shortcutLabel}</kbd>
            </button>

            {/* Submit Tool */}
            <Link
              to={`${prefix}/contact`}
              onClick={closeMega}
              className="nav-action-btn"
            >
              {t("Soumettre un outil", "Submit Tool")}
            </Link>

            {/* Language toggle */}
            <LanguageToggle href={languageHref} lang={lang} otherLang={otherLang} />

            {/* Menu */}
            <button
              onClick={toggleFullscreen}
              className={`nav-menu-btn ${active === "fullscreen" ? "nav-menu-btn--open" : ""}`}
              aria-label={active === "fullscreen" ? t("Fermer le menu", "Close menu") : t("Ouvrir le menu", "Open menu")}
              aria-expanded={active === "fullscreen"}
            >
              {active === "fullscreen" ? (
                <X className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <MenuLines />
              )}
              <span>{t("Menu", "Menu")}</span>
            </button>
          </div>

          {/* ── Mobile right ── */}
          <div className="flex items-center gap-2 lg:hidden" style={{ height: `${HEADER_H_MOBILE}px` }}>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded border border-border text-muted-foreground transition-colors duration-[180ms] hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={t("Rechercher", "Search")}
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className={`flex h-9 items-center gap-2 rounded border px-3 text-[13px] font-medium transition-colors duration-[180ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                active === "fullscreen"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground hover:border-foreground"
              }`}
              aria-label={active === "fullscreen" ? t("Fermer le menu", "Close menu") : t("Ouvrir le menu", "Open menu")}
              aria-expanded={active === "fullscreen"}
            >
              {active === "fullscreen" ? <X className="h-3.5 w-3.5" /> : <MenuLines />}
              <span>{t("Menu", "Menu")}</span>
            </button>
          </div>
        </div>

        {/* ── Mega-menu: Explore ── */}
        {active === "explore" && (
          <div
            className="absolute inset-x-0 top-full z-40"
            onMouseEnter={openMega}
            onMouseLeave={scheduleMegaClose}
          >
            <ExploreMegaMenu prefix={prefix} lang={lang} t={t} onClose={closeMega} />
          </div>
        )}
      </header>

      {/* ── Fullscreen menu overlay ── */}
      {active === "fullscreen" && (
        <FullscreenMenu
          prefix={prefix}
          lang={lang}
          t={t}
          onClose={() => setActive(null)}
          theme={theme}
          onToggleTheme={toggleTheme}
          languageHref={languageHref}
          otherLang={otherLang}
          headerHeight={HEADER_H}
        />
      )}

      {/* ── Search modal ── */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
};

/* ─────────────────────────────────────────────
   Explore mega-menu
───────────────────────────────────────────── */
function ExploreMegaMenu({
  prefix,
  lang,
  t,
  onClose,
}: {
  prefix: string;
  lang: string;
  t: (fr: string, en: string) => string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        background: "hsl(var(--background))",
        borderTop: "1px solid hsl(var(--border))",
        borderBottom: "1px solid hsl(var(--foreground))",
      }}
    >
      <div
        className="mx-auto max-w-[1440px]"
        style={{ padding: "40px 48px" }}
      >
        <div className="grid grid-cols-4 gap-0">
          {MEGA_COLUMNS.map((col, i) => (
            <div key={i} className="relative" style={{ paddingRight: i < 3 ? "40px" : "0" }}>
              {/* Vertical separator */}
              {i < 3 && (
                <div
                  className="absolute right-0 top-0 h-full w-px"
                  style={{
                    background: "hsl(var(--border))",
                    marginRight: "0",
                  }}
                />
              )}
              {/* Column label */}
              <p
                className="mb-4"
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "hsl(var(--muted-foreground))",
                  paddingLeft: i > 0 ? "20px" : "0",
                }}
              >
                {lang === "en" ? col.label.en : col.label.fr}
              </p>
              {/* Links */}
              <div
                className="flex flex-col"
                style={{ paddingLeft: i > 0 ? "20px" : "0" }}
              >
                {col.links.map((link) => (
                  <Link
                    key={link.fr}
                    to={`${prefix}${link.path}`}
                    onClick={onClose}
                    className="mega-menu-link"
                  >
                    {lang === "en" ? link.en : link.fr}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Fullscreen menu overlay
───────────────────────────────────────────── */
function FullscreenMenu({
  prefix,
  lang,
  t,
  onClose,
  theme,
  onToggleTheme,
  languageHref,
  otherLang,
  headerHeight,
}: {
  prefix: string;
  lang: string;
  t: (fr: string, en: string) => string;
  onClose: () => void;
  theme: string;
  onToggleTheme: () => void;
  languageHref: string;
  otherLang: string;
  headerHeight: number;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
      style={{ background: "hsl(var(--background))" }}
      role="dialog"
      aria-modal="true"
      aria-label={t("Menu principal", "Main menu")}
    >
      {/* Header row — mirrors main header */}
      <div
        className="sticky top-0 flex items-center justify-between"
        style={{
          height: `${headerHeight}px`,
          borderBottom: "1px solid hsl(var(--border))",
          background: "hsl(var(--background))",
          zIndex: 1,
          paddingLeft: "40px",
          paddingRight: "40px",
        }}
      >
        <Link
          to={prefix}
          onClick={onClose}
          aria-label="ToolTrim home"
          className="shrink-0 opacity-100 transition-opacity duration-150 hover:opacity-70"
        >
          <img src={logoToolTrim} alt="ToolTrim" className="h-[27px] w-auto" />
        </Link>
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-[13px] font-medium text-foreground transition-opacity duration-150 hover:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          aria-label={t("Fermer le menu", "Close menu")}
        >
          <span className="hidden sm:inline">{t("Fermer", "Close")}</span>
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main items */}
      <div>
        {FULLSCREEN_ITEMS.map((item) => (
          <FullscreenMenuItem
            key={item.num}
            num={item.num}
            label={lang === "en" ? item.en : item.fr}
            description={lang === "en" ? item.descEn : item.descFr}
            to={`${prefix}${item.path}`}
            onClick={onClose}
          />
        ))}
      </div>

      {/* Footer — secondary links + controls */}
      <div
        className="flex flex-wrap items-center justify-between gap-6"
        style={{
          borderTop: "1px solid hsl(var(--border))",
          padding: "28px 40px 40px",
          marginTop: "8px",
        }}
      >
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {SECONDARY_LINKS.map((link) => {
            const path = "pathFn" in link ? link.pathFn!(lang) : link.path!;
            return (
              <Link
                key={link.fr}
                to={`${prefix}${path}`}
                onClick={onClose}
                className="text-[13px] font-medium text-muted-foreground transition-colors duration-[180ms] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              >
                {lang === "en" ? link.en : link.fr}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <ThemeToggle theme={theme} onClick={onToggleTheme} />
          {/* Language */}
          <a
            href={languageHref}
            hrefLang={otherLang}
            rel="alternate"
            className="flex items-center rounded border border-border px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground transition-colors duration-[180ms] hover:border-foreground hover:text-foreground"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {otherLang}
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Fullscreen menu item
───────────────────────────────────────────── */
function FullscreenMenuItem({
  num,
  label,
  description,
  to,
  onClick,
}: {
  num: string;
  label: string;
  description: string;
  to: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={to}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="block focus-visible:outline-none"
      style={{
        borderBottom: "1px solid hsl(var(--border))",
        background: hovered ? "hsl(var(--foreground))" : "transparent",
        transition: "background 160ms ease-out",
        padding: "18px 40px",
      }}
    >
      <div className="flex items-baseline gap-6 sm:gap-10">
        {/* Number */}
        <span
          aria-hidden="true"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: hovered ? "hsl(var(--background) / 0.55)" : "hsl(var(--muted-foreground))",
            minWidth: "1.75rem",
            transition: "color 160ms ease-out",
            flexShrink: 0,
          }}
        >
          {num}
        </span>

        <div className="min-w-0 flex-1">
          {/* Title */}
          <p
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(2.25rem, 5.5vw, 5.5rem)",
              fontWeight: 500,
              lineHeight: 0.95,
              letterSpacing: "-0.05em",
              color: hovered ? "hsl(var(--background))" : "hsl(var(--foreground))",
              transition: "color 160ms ease-out",
            }}
          >
            {label}
          </p>
          {/* Description */}
          <p
            className="mt-2 hidden sm:block"
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "14px",
              lineHeight: 1.5,
              color: hovered ? "hsl(var(--background) / 0.6)" : "hsl(var(--muted-foreground))",
              transition: "color 160ms ease-out",
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   Small reusable components
───────────────────────────────────────────── */
function MenuLines() {
  return (
    <svg
      width="15"
      height="10"
      viewBox="0 0 15 10"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
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
      className="relative rounded-full border border-border transition-colors duration-[180ms] hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{
        width: 48,
        height: 26,
        padding: 3,
        background:
          theme === "dark"
            ? "hsl(var(--primary) / 0.12)"
            : "hsl(var(--muted) / 0.6)",
      }}
    >
      <Sun
        className="absolute"
        style={{
          left: 6,
          top: "50%",
          transform: "translateY(-50%)",
          width: 11,
          height: 11,
          color:
            theme === "dark"
              ? "hsl(var(--muted-foreground) / 0.3)"
              : "hsl(var(--foreground) / 0.5)",
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
          color:
            theme === "dark"
              ? "hsl(var(--primary))"
              : "hsl(var(--muted-foreground) / 0.3)",
        }}
      />
      <div
        className="absolute top-[3px] rounded-full bg-background"
        style={{
          width: 20,
          height: 20,
          left: theme === "dark" ? 25 : 3,
          transition: "left 200ms cubic-bezier(0.4,0,0.2,1)",
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
}: {
  href: string;
  lang: string;
  otherLang: string;
}) {
  return (
    <a
      href={href}
      hrefLang={otherLang}
      rel="alternate"
      aria-label={`Switch to ${otherLang === "en" ? "English" : "Français"}`}
      className="flex items-center rounded-full border border-border transition-colors duration-[180ms] hover:border-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
            background:
              lang === item ? "hsl(var(--foreground))" : "transparent",
            color:
              lang === item
                ? "hsl(var(--background))"
                : "hsl(var(--muted-foreground) / 0.5)",
          }}
        >
          {item}
        </span>
      ))}
    </a>
  );
}

export default Navbar;
