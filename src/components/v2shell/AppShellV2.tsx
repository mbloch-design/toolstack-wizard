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
  Sun,
  CircleDollarSign,
  Check,
} from "@/lib/icons";
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
  { id: "tools",      labelFr: "Outils",      labelEn: "Tools",      Icon: Wrench,   to: "/tools",       match: ["/tools", "/tool/", "/explorer"] },
  { id: "stacks",     labelFr: "Stacks",      labelEn: "Stacks",     Icon: Layers,   to: "/stacks",      match: ["/stacks"] },
  { id: "compare",    labelFr: "Comparatifs", labelEn: "Compare",    Icon: Scale,    to: "/comparatifs", match: ["/comparatifs", "/comparatif/"] },
  { id: "guides",     labelFr: "Guides",      labelEn: "Guides",     Icon: BookOpen, to: "/guides",      match: ["/guides", "/guide/"] },
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
              <CircleDollarSign />
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
    const storedPreference = localStorage.getItem("tooltrim:sidebar-expanded");
    setSidebarExpanded(storedPreference === null ? true : storedPreference === "true");
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
          <div className="asv2-utility-actions">
          <a
            href={languageHref}
            className="asv2-utility-item"
            aria-label={t("Passer le site en anglais", "Switch the site to French")}
            title={!sidebarExpanded ? t("Changer de langue", "Change language") : undefined}
            data-tooltip={t("Langue", "Language")}
          >
            <Languages />
            <span className="asv2-utility-text">
              {t("English", "Français")}
            </span>
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
            data-tooltip={t("Thème", "Theme")}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
            <span className="asv2-utility-text">
              {theme === "dark" ? t("Mode clair", "Light mode") : t("Mode sombre", "Dark mode")}
            </span>
            <span className="asv2-utility-value">{theme === "dark" ? t("Clair", "Light") : t("Sombre", "Dark")}</span>
          </button>
          </div>
        </div>

        <button
          type="button"
          className="asv2-sidebar-resizer"
          onClick={toggleSidebar}
          aria-expanded={sidebarExpanded}
          aria-label={sidebarExpanded
            ? t("Réduire la barre latérale", "Collapse sidebar")
            : t("Déployer la barre latérale", "Expand sidebar")}
        >
          <span aria-hidden>
            {sidebarExpanded ? <PanelLeftClose /> : <PanelLeftOpen />}
          </span>
        </button>
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
            <span>{t("Rechercher un outil...", "Search a tool...")}</span>
            <kbd className="asv2-kbd">⌘K</kbd>
            <span className="asv2-search-action" aria-hidden>
              <Search style={{ width: 15, height: 15 }} aria-hidden />
            </span>
          </button>

          <div className="asv2-topbar-right">
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
