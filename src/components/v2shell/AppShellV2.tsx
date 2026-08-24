import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Home,
  Wrench,
  Layers,
  Scale,
  BookOpen,
  Search,
  Bookmark,
  Languages,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Sun,
  CircleDollarSign,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useCurrency } from "@/hooks/useCurrency";
import { useTheme } from "@/hooks/useTheme";
import { useStackPins } from "@/hooks/useStackPins";
import logoToolTrim from "@/assets/logo-tooltrim.svg";
import pictoToolTrim from "@/assets/picto-logo.svg";
import { SearchModal } from "@/components/SearchModal";
import Footer from "@/components/Footer";

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
  { id: "tools",      labelFr: "Outils",      labelEn: "Tools",      Icon: Wrench,   to: "/tools",       match: ["/tools", "/tool/"] },
  { id: "stacks",     labelFr: "Stacks",      labelEn: "Stacks",     Icon: Layers,   to: "/stacks",      match: ["/stacks"] },
  { id: "compare",    labelFr: "Comparatifs", labelEn: "Compare",    Icon: Scale,    to: "/comparatifs", match: ["/comparatifs", "/comparatif/"] },
  { id: "guides",     labelFr: "Guides",      labelEn: "Guides",     Icon: BookOpen, to: "/guides",      match: ["/guides", "/guide/"] },
];

export default function AppShellV2({ children }: { children: ReactNode }) {
  const { t, prefix, lang } = useLang();
  const { currency, toggleCurrency } = useCurrency();
  const { theme, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const contentRef = useRef<HTMLElement>(null);
  const { state: cartState } = useStackPins();
  const cartCount = cartState.pinnedToolSlugs.length;
  const cartLabel = cartCount > 0
    ? `${t("Ma stack", "My stack")} · ${cartCount}`
    : t("Ma stack", "My stack");
  const otherLang = lang === "fr" ? "en" : "fr";
  const languageHref = `/${otherLang}${location.pathname.replace(/^\/(fr|en)/, "")}${location.search}${location.hash}`;

  // Path relative to the /:lang prefix, e.g. "/tool/notion" or "" for the homepage.
  const relPath = location.pathname.startsWith(prefix)
    ? location.pathname.slice(prefix.length).replace(/\/$/, "")
    : location.pathname;

  // Ma stack changes view through query parameters while keeping the same
  // pathname. Always return the shared content rail to its canonical
  // horizontal origin so a focused/oversized child cannot make the whole
  // shell jump sideways between the board and a tool profile.
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollLeft = 0;
  }, [location.pathname, location.search]);

  useEffect(() => {
    setSidebarExpanded(localStorage.getItem("tooltrim:sidebar-expanded") === "true");
  }, []);

  const toggleSidebar = () => {
    setSidebarExpanded((current) => {
      const next = !current;
      localStorage.setItem("tooltrim:sidebar-expanded", String(next));
      return next;
    });
  };

  return (
    <div className={`asv2-root${sidebarExpanded ? " asv2-root--sidebar-expanded" : ""}`}>
      <aside className="asv2-sidebar" data-expanded={sidebarExpanded}>
        <Link to={prefix} className="asv2-logo" aria-label="ToolTrim">
          <img className="asv2-logo-mark" src={pictoToolTrim} alt="" width={32} height={32} aria-hidden />
          <img className="asv2-logo-full" src={logoToolTrim} alt="" width={127} height={28} aria-hidden />
        </Link>

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
                aria-label={t(item.labelFr, item.labelEn)}
                title={!sidebarExpanded ? t(item.labelFr, item.labelEn) : undefined}
              >
                <span className="asv2-nav-icon">
                  <item.Icon style={{ width: 20, height: 20 }} />
                </span>
                <span className="asv2-nav-label">{t(item.labelFr, item.labelEn)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="asv2-sidebar-utility">
          <div className="asv2-utility-heading" aria-hidden="true">
            <Settings2 />
            <span>{t("Préférences", "Preferences")}</span>
          </div>

          <a
            href={languageHref}
            className="asv2-utility-item"
            aria-label={t("Passer le site en anglais", "Switch the site to French")}
            title={!sidebarExpanded ? t("Changer de langue", "Change language") : undefined}
          >
            <Languages />
            <span className="asv2-utility-text">
              {t("English", "Français")}
            </span>
            <span className="asv2-utility-value">{otherLang.toUpperCase()}</span>
          </a>

          <button
            type="button"
            className="asv2-utility-item asv2-currency-toggle"
            onClick={toggleCurrency}
            aria-label={currency === "EUR"
              ? t("Afficher les prix en dollars", "Show prices in US dollars")
              : t("Afficher les prix en euros", "Show prices in euros")}
            title={!sidebarExpanded ? t("Changer de devise", "Change currency") : undefined}
          >
            <CircleDollarSign />
            <span className="asv2-utility-text">{t("Devise", "Currency")}</span>
            <span className="asv2-utility-value">{currency}</span>
          </button>

          <button
            type="button"
            className="asv2-utility-item asv2-theme-toggle"
            onClick={toggleTheme}
            aria-pressed={theme === "dark"}
            aria-label={theme === "dark"
              ? t("Passer en mode clair", "Switch to light mode")
              : t("Passer en mode sombre", "Switch to dark mode")}
            title={!sidebarExpanded ? t("Changer de thème", "Change theme") : undefined}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
            <span className="asv2-utility-text">
              {theme === "dark" ? t("Mode clair", "Light mode") : t("Mode sombre", "Dark mode")}
            </span>
            <span className="asv2-utility-value">{theme === "dark" ? t("Clair", "Light") : t("Sombre", "Dark")}</span>
          </button>

          <button
            type="button"
            className="asv2-utility-item asv2-sidebar-toggle"
            onClick={toggleSidebar}
            aria-expanded={sidebarExpanded}
            aria-label={sidebarExpanded
              ? t("Réduire la barre latérale", "Collapse sidebar")
              : t("Déployer la barre latérale", "Expand sidebar")}
            title={!sidebarExpanded ? t("Déployer la navigation", "Expand navigation") : undefined}
          >
            {sidebarExpanded ? <PanelLeftClose /> : <PanelLeftOpen />}
            <span className="asv2-utility-text">
              {sidebarExpanded ? t("Réduire", "Collapse") : t("Déployer", "Expand")}
            </span>
          </button>
        </div>
      </aside>

      <div className="asv2-workspace">
        <header className="asv2-topbar">
          <Link to={prefix} className="asv2-mobile-logo">
            <img src={logoToolTrim} alt="ToolTrim" width={127} height={28} />
          </Link>

          <button
            type="button"
            className="asv2-search"
            onClick={() => setSearchOpen(true)}
            aria-label={t("Rechercher un outil", "Search for a tool")}
          >
            <Search style={{ width: 15, height: 15 }} aria-hidden />
            <span>{t("Rechercher un outil...", "Search a tool...")}</span>
            <kbd className="asv2-kbd">⌘K</kbd>
          </button>

          <div className="asv2-topbar-right">
            <button
              type="button"
              className="asv2-topbar-currency"
              onClick={toggleCurrency}
              aria-label={currency === "EUR"
                ? t("Afficher les prix en dollars", "Show prices in US dollars")
                : t("Afficher les prix en euros", "Show prices in euros")}
            >
              <span aria-hidden>{currency === "EUR" ? "€" : "$"}</span>
              <span>{currency}</span>
            </button>
            <Link to={`${prefix}/ma-stack`} className="asv2-topbar-cta" aria-label={cartLabel}>
              <Bookmark style={{ width: 15, height: 15 }} aria-hidden />
              <span>{cartLabel}</span>
            </Link>
          </div>
        </header>

        <main ref={contentRef} id="main-content" className="asv2-content">
          {children}
          <Footer />
        </main>
      </div>

      {/* ── Mobile bottom navigation (hidden on desktop via CSS) ──
          Minimal flat tab row with a small top indicator on the active item,
          plus a subtle "Ma stack" pill floating just above the row. */}
      <nav className="asv2-bottomnav" aria-label={t("Navigation", "Navigation")}>
        <Link to={`${prefix}/ma-stack`} className="asv2-bn-cta" aria-label={cartLabel}>
          <Bookmark style={{ width: 16, height: 16 }} aria-hidden />
          <span>{cartLabel}</span>
        </Link>

        <div className="asv2-bn-row">
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === "home"
              ? relPath === ""
              : item.match.some((m) => relPath === m || relPath.startsWith(m));
            return (
              <Link key={item.id} to={`${prefix}${item.to}`} className={`asv2-bn-item${isActive ? " asv2-bn-item--active" : ""}`}>
                <span className="asv2-bn-indicator" aria-hidden />
                <item.Icon style={{ width: 21, height: 21 }} />
                <span className="asv2-bn-label">{t(item.labelFr, item.labelEn)}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
