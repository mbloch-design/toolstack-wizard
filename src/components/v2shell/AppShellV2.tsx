import { Link, useLocation } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Home,
  Lightbulb,
  ChevronLeft,
  Search,
  Bookmark,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Check,
  Menu,
  LayoutGrid,
  Boxes,
  Columns2,
  CirclePlus,
} from "@/lib/icons";
import MobileMenu from "@/components/v2shell/MobileMenu";
import { useLang } from "@/hooks/useLang";
import { useCurrency, type Currency } from "@/hooks/useCurrency";
import { useTheme } from "@/hooks/useTheme";
import { useStackPins } from "@/hooks/useStackPins";
import logoToolTrim from "@/assets/logo-tooltrim.svg";
import pictoToolTrim from "@/assets/picto-logo.svg";
import { SearchModal } from "@/components/SearchModal";
import Footer from "@/components/Footer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trackEvent } from "@/lib/analytics";
import { getLanguageSwitchPath } from "@/lib/seo";
import { TopbarBreadcrumbContext, type TopbarBreadcrumbItem } from "@/contexts/TopbarBreadcrumbContext";

type NavItem = {
  id: string;
  labelFr: string;
  labelEn: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  to: string;
  /** Path segments (relative to /:lang) that mark this item active — covers index + detail routes. */
  match: string[];
};

const NAV_ITEMS: NavItem[] = [
  { id: "home",       labelFr: "Accueil",     labelEn: "Home",       Icon: Home,     to: "",             match: [""] },
  // Pictos choisis pour l'affordance (US-NAV-01) : une grille pour un
  // catalogue (la clé à molette évoquait des réglages), des paquets pour une
  // stack d'outils (l'ancien glyphe montrait une pile de documents), deux
  // colonnes côte à côte pour un comparatif (« Scale » rendait un poids).
  { id: "tools",      labelFr: "Outils",      labelEn: "Tools",      Icon: LayoutGrid, to: "/tools",       match: ["/tools", "/tool/"] },
  { id: "stacks",     labelFr: "Stacks",      labelEn: "Stacks",     Icon: Boxes,      to: "/stacks",      match: ["/stacks"] },
  { id: "compare",    labelFr: "Comparatifs", labelEn: "Compare",    Icon: Columns2,   to: "/comparatifs", match: ["/comparatifs", "/comparatif/"] },
  // Une ampoule pour des guides de conseil : le livre ouvert avait la même
  // silhouette que les deux colonnes des comparatifs.
  { id: "guides",     labelFr: "Guides",      labelEn: "Guides",     Icon: Lightbulb, to: "/guides",      match: ["/guides", "/guide/"] },
];

type HomeTab = {
  id: string;
  labelFr: string;
  labelEn: string;
  path: string;
  query?: string;
};

// Quick, tool-focused launch points shown in the topbar on the homepage only —
// distinct from the sidebar's page-level nav, these jump straight into a
// pre-filtered tools view.
const HOME_TABS: HomeTab[] = [
  { id: "all",  labelFr: "Tous les outils", labelEn: "All tools", path: "/tools" },
  { id: "free", labelFr: "Gratuits",        labelEn: "Free",      path: "/tools", query: "pricing=free" },
  { id: "paid", labelFr: "Payants",         labelEn: "Paid",      path: "/tools", query: "pricing=paid" },
];

const CURRENCIES: Array<{ code: Currency; symbol: string; labelFr: string; labelEn: string }> = [
  { code: "EUR", symbol: "€", labelFr: "Euro", labelEn: "Euro" },
  { code: "USD", symbol: "$", labelFr: "Dollar américain", labelEn: "US dollar" },
  { code: "GBP", symbol: "£", labelFr: "Livre sterling", labelEn: "Pound sterling" },
];

function CurrencyPicker({
  currency,
  setCurrency,
  t,
  compact = false,
  sidebarExpanded = true,
}: {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  t: (fr: string, en: string) => string;
  compact?: boolean;
  sidebarExpanded?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = CURRENCIES.find((item) => item.code === currency) || CURRENCIES[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={compact ? "asv2-topbar-currency" : "asv2-utility-item asv2-currency-toggle"}
          aria-label={t(`Choisir la devise, ${selected.labelFr} sélectionné`, `Choose currency, ${selected.labelEn} selected`)}
          title={!compact && !sidebarExpanded ? t("Changer de devise", "Change currency") : undefined}
          data-tooltip={!compact ? t("Devise", "Currency") : undefined}
        >
          {compact ? (
            <>
              <span aria-hidden>{selected.symbol}</span>
              <span>{selected.code}</span>
            </>
          ) : (
            <>
              {/* Le symbole de la devise choisie, pas un « $ » fixe. */}
              <span className="asv2-currency-glyph" aria-hidden>{selected.symbol}</span>
              <span className="asv2-utility-text">{t("Devise", "Currency")}</span>
              <span className="asv2-utility-value">{selected.code}</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="asv2-currency-popover"
        side={compact ? "bottom" : "right"}
        align={compact ? "end" : "start"}
        sideOffset={10}
      >
        <p className="asv2-currency-popover-title">{t("Choisir une devise", "Choose a currency")}</p>
        <div className="asv2-currency-options" role="radiogroup" aria-label={t("Devise", "Currency")}>
          {CURRENCIES.map((item) => (
            <button
              key={item.code}
              type="button"
              role="radio"
              aria-checked={currency === item.code}
              className={`asv2-currency-option${currency === item.code ? " is-selected" : ""}`}
              onClick={() => {
                if (item.code !== currency) trackEvent("currency_switch", { from: currency, to: item.code });
                setCurrency(item.code);
                setOpen(false);
              }}
            >
              <span className="asv2-currency-symbol" aria-hidden>{item.symbol}</span>
              <span className="asv2-currency-name">
                <strong>{item.code}</strong>
                <small>{t(item.labelFr, item.labelEn)}</small>
              </span>
              {currency === item.code && <Check aria-hidden />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function AppShellV2({ children }: { children: ReactNode }) {
  const { t, prefix, lang } = useLang();
  const { currency, setCurrency } = useCurrency();
  const { theme, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  // The labelled navigation is the canonical desktop state. The compact rail
  // remains available as a deliberate choice and is remembered per browser.
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const contentRef = useRef<HTMLElement>(null);
  const { state: cartState } = useStackPins();
  const cartCount = cartState.pinnedToolSlugs.length;
  const cartLabel = t("Ma stack", "My stack");
  const otherLang = lang === "fr" ? "en" : "fr";
  const languageHref = `${getLanguageSwitchPath(location.pathname, otherLang)}${location.search}${location.hash}`;
  const [breadcrumb, setBreadcrumb] = useState<TopbarBreadcrumbItem[] | null>(null);
  // US-NAV-01 : la barre du haut cède la place au contenu quand on descend,
  // revient dès qu'on remonte, et reprend son état complet en haut de page.
  const [chromeHidden, setChromeHidden] = useState(false);
  const topbarRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    // La fermeture rend la main exactement là où on l'avait prise.
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);
  const breadcrumbCtx = useMemo(() => ({ setBreadcrumb }), []);
  // Niveau supérieur de la page courante : avant-dernier maillon du fil
  // d'Ariane qui porte un lien, hors accueil (l'onglet du bas y mène déjà).
  const mobileParent = breadcrumb && breadcrumb.length >= 3
    ? [...breadcrumb.slice(1, -1)].reverse().find((item) => item.href) || null
    : null;

  // Path relative to the /:lang prefix, e.g. "/tool/notion" or "" for the homepage.
  const relPath = location.pathname.startsWith(prefix)
    ? location.pathname.slice(prefix.length).replace(/\/$/, "")
    : location.pathname;
  const isHome = relPath === "";
  // A handful of routes intentionally have no breadcrumb and should keep
  // showing the search bar by default, rather than the blank placeholder
  // used everywhere else while a page's breadcrumb is still registering
  // (avoids flashing the search bar for a frame on pages that do have one).
  const showsSearchByDefault = relPath === "/search";

  // Ma stack changes view through query parameters while keeping the same
  // pathname. Always return the shared content rail to its canonical
  // horizontal origin so a focused/oversized child cannot make the whole
  // shell jump sideways between the board and a tool profile.
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollLeft = 0;
  }, [location.pathname, location.search]);

  // Le défilement vit dans .asv2-content sur ordinateur et sur la fenêtre en
  // mobile (voir index.css, max-width: 640px) : on écoute le bon conteneur.
  useEffect(() => {
    setChromeHidden(false);
    const mobile = window.matchMedia("(max-width: 640px)");
    let lastY = 0;
    let frame = 0;
    const scroller = () => (mobile.matches ? null : contentRef.current);
    const readY = () => scroller()?.scrollTop ?? window.scrollY;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = readY();
        const delta = y - lastY;
        // Le clavier dans la barre du haut ou la recherche ouverte la gardent visible.
        const focusInTopbar = !!topbarRef.current?.contains(document.activeElement);
        if (y < 64 || focusInTopbar) setChromeHidden(false);
        else if (delta > 6 && y > 120) setChromeHidden(true);
        else if (delta < -6) setChromeHidden(false);
        if (Math.abs(delta) > 6 || y < 64) lastY = y;
      });
    };
    lastY = readY();
    const content = contentRef.current;
    content?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      content?.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (searchOpen || menuOpen) setChromeHidden(false);
  }, [searchOpen, menuOpen]);

  // ⌘K / Ctrl+K ouvre la recherche depuis n'importe quelle page : le raccourci
  // était affiché dans la barre sans être branché.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let storedPreference: string | null = null;
    try { storedPreference = localStorage.getItem("tooltrim:sidebar-expanded"); } catch { /* Use default navigation. */ }
    setSidebarExpanded(storedPreference === null ? true : storedPreference === "true");
  }, []);

  // De 641 à 1 180 px, la barre est une colonne imposée pour laisser la place
  // au contenu. Elle peut quand même se déplier : par-dessus le contenu, sans
  // le décaler, et sans toucher à la préférence enregistrée (US-NAV-01).
  const [forcedRail, setForcedRail] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 641px) and (max-width: 1180px)");
    const sync = () => { setForcedRail(query.matches); if (!query.matches) setRailOpen(false); };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  const closedByNavigation = useRef(false);
  useEffect(() => { closedByNavigation.current = true; setRailOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!railOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setRailOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [railOpen]);
  const railIsOpen = forcedRail && railOpen;
  // Focus : il entre dans la barre dépliée sur sa première entrée et revient
  // sur le bouton « déplier » quand elle se referme (Échap, clic à côté).
  const sidebarRef = useRef<HTMLElement>(null);
  const resizerRef = useRef<HTMLButtonElement>(null);
  const railWasOpen = useRef(false);
  useEffect(() => {
    if (railIsOpen) {
      requestAnimationFrame(() => sidebarRef.current?.querySelector<HTMLElement>(".asv2-nav-item")?.focus());
    } else if (railWasOpen.current && !closedByNavigation.current) {
      requestAnimationFrame(() => resizerRef.current?.focus());
    }
    closedByNavigation.current = false;
    railWasOpen.current = railIsOpen;
  }, [railIsOpen]);
  // Ce que l'utilisateur voit : dépliée ou non, quelle que soit la largeur.
  const shownExpanded = forcedRail ? railIsOpen : sidebarExpanded;
  const onSidebarToggle = () => (forcedRail ? setRailOpen((open) => !open) : toggleSidebar());

  const toggleSidebar = () => {
    setSidebarExpanded((current) => {
      const next = !current;
      try { localStorage.setItem("tooltrim:sidebar-expanded", String(next)); } catch { /* Keep session navigation. */ }
      return next;
    });
  };

  return (
    <TopbarBreadcrumbContext.Provider value={breadcrumbCtx}>
    <div className={`asv2-root${sidebarExpanded || railIsOpen ? " asv2-root--sidebar-expanded" : ""}${railIsOpen ? " asv2-root--rail-open" : ""}`} data-chrome={chromeHidden ? "hidden" : "shown"}>
      {railIsOpen && <button type="button" className="asv2-rail-backdrop" tabIndex={-1} aria-label={t("Réduire la barre latérale", "Collapse sidebar")} onClick={() => setRailOpen(false)} />}
      <aside ref={sidebarRef} className="asv2-sidebar" data-expanded={shownExpanded}>
        <div className="asv2-sidebar-top">
          <Link to={prefix} className="asv2-logo" aria-label="ToolTrim">
            <img className="asv2-logo-mark" src={pictoToolTrim} alt="" width={24} height={24} aria-hidden />
            <img className="asv2-logo-full" src={logoToolTrim} alt="" width={96} height={21} aria-hidden />
          </Link>

          <div className="asv2-sidebar-top-actions">
            <button
              type="button"
              className="asv2-sidebar-search-btn"
              onClick={() => setSearchOpen(true)}
              aria-label={t("Rechercher un outil", "Search for a tool")}
              data-tooltip={t("Rechercher", "Search")}
            >
              <Search style={{ width: 16, height: 16 }} aria-hidden />
            </button>

            <button
              type="button"
              className="asv2-sidebar-resizer"
              ref={resizerRef}
              onClick={onSidebarToggle}
              aria-expanded={shownExpanded}
              aria-label={shownExpanded
                ? t("Réduire la barre latérale", "Collapse sidebar")
                : t("Déployer la barre latérale", "Expand sidebar")}
            >
              <span aria-hidden>
                {shownExpanded ? <PanelLeftClose style={{ width: 16, height: 16 }} /> : <PanelLeftOpen style={{ width: 16, height: 16 }} />}
              </span>
              <b aria-hidden>{shownExpanded ? t("Réduire la barre", "Close sidebar") : t("Ouvrir la barre", "Open sidebar")}</b>
            </button>
          </div>
        </div>

        <nav className="asv2-nav" aria-label={t("Navigation principale", "Main navigation")}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === "home"
              ? relPath === ""
              : item.match.some((m) => relPath === m || relPath.startsWith(m));
            return (
              <Link
                key={item.id}
                to={`${prefix}${item.to}`}
                className={`asv2-nav-item${isActive ? " asv2-nav-item--active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                aria-label={t(item.labelFr, item.labelEn)}
                data-tooltip={t(item.labelFr, item.labelEn)}
              >
                <span className="asv2-nav-icon">
                  <item.Icon style={{ width: 18, height: 18 }} />
                </span>
                <span className="asv2-nav-label">{t(item.labelFr, item.labelEn)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="asv2-sidebar-utility">
          <div className="asv2-utility-actions">
          <a
            href={languageHref}
            className="asv2-utility-item"
            aria-label={t("Site en français. Passer en anglais", "Site in English. Switch to French")}
            title={!sidebarExpanded ? t("Passer en English", "Passer en français") : undefined}
            data-tooltip={t("Passer en English", "Passer en français")}
          >
            {/* Les réglages montrent leur état actuel (comme le « € ») ;
                l'infobulle décrit l'action. Le code de langue est plus
                explicite que le picto de traduction. */}
            <span className="asv2-lang-glyph" aria-hidden>{lang.toUpperCase()}</span>
            <span className="asv2-utility-text">{t("Français", "English")}</span>
            <span className="asv2-utility-value">{otherLang.toUpperCase()}</span>
          </a>

          <CurrencyPicker
            currency={currency}
            setCurrency={setCurrency}
            t={t}
            sidebarExpanded={sidebarExpanded}
          />

          <button
            type="button"
            className="asv2-utility-item asv2-theme-toggle"
            onClick={toggleTheme}
            aria-pressed={theme === "dark"}
            aria-label={theme === "dark"
              ? t("Passer en mode clair", "Switch to light mode")
              : t("Passer en mode sombre", "Switch to dark mode")}
            title={!sidebarExpanded ? t("Changer de thème", "Change theme") : undefined}
            data-tooltip={theme === "dark" ? t("Passer en clair", "Switch to light") : t("Passer en sombre", "Switch to dark")}
          >
            {/* État actuel, comme la langue et la devise : soleil en clair, lune en sombre. */}
            {theme === "dark" ? <Moon /> : <Sun />}
            <span className="asv2-utility-text">
              {theme === "dark" ? t("Mode sombre", "Dark mode") : t("Mode clair", "Light mode")}
            </span>
            <span className="asv2-utility-value">{theme === "dark" ? t("Clair", "Light") : t("Sombre", "Dark")}</span>
          </button>
          </div>
        </div>

        <Link
          to={`${prefix}/submit`}
          className="asv2-sidebar-submit"
          aria-label={t("Soumettre un outil", "Submit a tool")}
          data-tooltip={t("Soumettre un outil", "Submit a tool")}
        >
          <span className="asv2-nav-icon">
            <CirclePlus style={{ width: 18, height: 18 }} />
          </span>
          <span className="asv2-nav-label">
            <span className="asv2-submit-long">{t("Soumettre un outil", "Submit a tool")}</span>
            <span className="asv2-submit-short">{t("Soumettre", "Submit")}</span>
          </span>
        </Link>

      </aside>

      <div className="asv2-workspace">
        <header
          ref={topbarRef}
          className="asv2-topbar"
          data-topbar-mode={isHome ? "home" : breadcrumb ? "breadcrumb" : showsSearchByDefault ? "search" : "pending"}
          data-has-parent={mobileParent ? "true" : undefined}
        >
          {/* Mobile, page profonde : le lien vers le niveau supérieur prend la
              place du logo, dans la même hauteur (pas de saut de page, le fil
              d'Ariane n'existant qu'après chargement). L'accueil reste dans la
              barre d'onglets du bas. */}
          {mobileParent && (
            <Link to={mobileParent.href!} className="asv2-mobile-back" aria-label={t(`Retour à ${mobileParent.label}`, `Back to ${mobileParent.label}`)}>
              <ChevronLeft aria-hidden />
              <span>{mobileParent.label}</span>
            </Link>
          )}
          <Link to={prefix} className="asv2-mobile-logo" aria-label="ToolTrim">
            <img className="asv2-mobile-logo-full" src={logoToolTrim} alt="" width={127} height={28} />
            {/* Sous 360 px, le logo complet ne laisse plus de place aux actions. */}
            <img className="asv2-mobile-logo-mark" src={pictoToolTrim} alt="" width={28} height={28} />
          </Link>

          {/* Desktop/tablet: exactly one of these three is visible, picked by
              data-topbar-mode above. Mobile always forces the search bar
              (see the max-width: 640px rules) regardless of that mode. */}
          <nav className="asv2-topbar-tabs" aria-label={t("Raccourcis", "Shortcuts")}>
            {HOME_TABS.map((tabItem) => {
              const target = `${prefix}${tabItem.path}${tabItem.query ? `?${tabItem.query}` : ""}`;
              const isActive = relPath === tabItem.path
                && location.search.replace(/^\?/, "") === (tabItem.query || "");
              return (
                <Link
                  key={tabItem.id}
                  to={target}
                  className={`asv2-topbar-tab${isActive ? " asv2-topbar-tab--active" : ""}`}
                >
                  {t(tabItem.labelFr, tabItem.labelEn)}
                </Link>
              );
            })}
          </nav>

          {breadcrumb && (
            <nav className="asv2-topbar-breadcrumb" aria-label={t("Fil d’Ariane", "Breadcrumb")}>
              {breadcrumb.flatMap((item, i) => {
                const isLast = i === breadcrumb.length - 1;
                const sep = i > 0 ? [<span key={`sep-${i}`}>/</span>] : [];
                const node = item.href && !isLast
                  ? <Link key={`l-${i}`} to={item.href}>{item.label}</Link>
                  : <span key={`s-${i}`}>{item.label}</span>;
                return [...sep, node];
              })}
            </nav>
          )}

          <button
            type="button"
            className="asv2-search"
            onClick={() => setSearchOpen(true)}
            aria-label={t("Rechercher un outil", "Search for a tool")}
          >
            <span className="asv2-search-text">
              <span className="asv2-search-long">{t("Rechercher un outil…", "Search a tool…")}</span>
              <span className="asv2-search-short">{t("Rechercher", "Search")}</span>
            </span>
            <kbd className="asv2-kbd">⌘K</kbd>
            <span className="asv2-search-action" aria-hidden>
              <Search style={{ width: 15, height: 15 }} aria-hidden />
            </span>
          </button>

          <div className="asv2-topbar-right">
            {/* Recherche toujours atteignable depuis la barre du haut, même
                quand le fil d'Ariane occupe la place du champ. */}
            <button
              type="button"
              className="asv2-topbar-search"
              onClick={() => setSearchOpen(true)}
              aria-label={t("Rechercher (⌘K)", "Search (⌘K)")}
            >
              <Search style={{ width: 15, height: 15 }} aria-hidden />
              <span className="asv2-topbar-search-label">{t("Rechercher", "Search")}</span>
              <kbd className="asv2-kbd">⌘K</kbd>
            </button>
            <Link
              to={`${prefix}/ma-stack`}
              className="asv2-topbar-cta"
              aria-label={cartCount > 0 ? `${cartLabel} · ${cartCount}` : cartLabel}
            >
              <span className="asv2-topbar-cta-icon">
                <Bookmark style={{ width: 15, height: 15 }} aria-hidden />
                {cartCount > 0 && (
                  <span className="asv2-topbar-cta-badge" aria-hidden>
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </span>
              <span>{cartLabel}</span>
            </Link>
            <button
              ref={menuButtonRef}
              type="button"
              className="asv2-topbar-menu"
              onClick={() => setMenuOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-label={t("Ouvrir le menu", "Open menu")}
            >
              <Menu style={{ width: 18, height: 18 }} aria-hidden />
            </button>
          </div>
        </header>

        <main ref={contentRef} id="main-content" className="asv2-content">
          {children}
          <Footer />
        </main>
      </div>

      {/* ── Mobile bottom navigation (hidden on desktop via CSS) ── */}
      <nav className="asv2-bottomnav" aria-label={t("Navigation", "Navigation")}>
        <div className="asv2-bn-row">
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === "home"
              ? relPath === ""
              : item.match.some((m) => relPath === m || relPath.startsWith(m));
            return (
              <Link
                key={item.id}
                to={`${prefix}${item.to}`}
                className={`asv2-bn-item${isActive ? " asv2-bn-item--active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="asv2-bn-indicator" aria-hidden />
                <item.Icon style={{ width: 21, height: 21 }} />
                <span className="asv2-bn-label">{t(item.labelFr, item.labelEn)}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      <MobileMenu
        open={menuOpen}
        onClose={closeMenu}
        prefix={prefix}
        lang={lang === "en" ? "en" : "fr"}
        t={t}
        items={NAV_ITEMS}
        activeId={NAV_ITEMS.find((item) => (item.id === "home" ? relPath === "" : item.match.some((m) => relPath === m || relPath.startsWith(m))))?.id ?? null}
        languageHref={languageHref}
        currency={currency}
        setCurrency={setCurrency}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    </div>
    </TopbarBreadcrumbContext.Provider>
  );
}
