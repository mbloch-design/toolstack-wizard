import { Link, useLocation } from "react-router-dom";
import { useState, type ReactNode } from "react";
import {
  Home,
  Wrench,
  Layers,
  Scale,
  BookOpen,
  Search,
  Bookmark,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import logoToolTrim from "@/assets/logo-tooltrim.svg";
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
  const { t, prefix } = useLang();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const { state: cartState } = useStackPins();
  const cartCount = cartState.pinnedToolSlugs.length;
  const cartLabel = cartCount > 0
    ? `${t("Ma stack", "My stack")} · ${cartCount}`
    : t("Ma stack", "My stack");

  // Path relative to the /:lang prefix, e.g. "/tool/notion" or "" for the homepage.
  const relPath = location.pathname.startsWith(prefix)
    ? location.pathname.slice(prefix.length).replace(/\/$/, "")
    : location.pathname;

  return (
    <div className="asv2-root">
      {/* ── Top bar (spans full width, flush with sidebar below) ── */}
      <header className="asv2-topbar">
        <Link to={prefix} className="asv2-logo">
          <img src={logoToolTrim} alt="ToolTrim" width={127} height={28} style={{ height: 28, width: 127 }} />
        </Link>

        <button className="asv2-search" onClick={() => setSearchOpen(true)}>
          <Search style={{ width: 15, height: 15 }} />
          <span>{t("Rechercher un outil...", "Search a tool...")}</span>
          <kbd className="asv2-kbd">⌘K</kbd>
        </button>

        <div className="asv2-topbar-right">
          <Link to={`${prefix}/ma-stack`} className="asv2-topbar-cta" aria-label={cartLabel}>
            <Bookmark style={{ width: 15, height: 15 }} aria-hidden />
            <span>{cartLabel}</span>
          </Link>
        </div>
      </header>

      {/* ── Body: sidebar + content ── */}
      <div className="asv2-body">
        <aside className="asv2-sidebar">
          <nav className="asv2-nav">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === "home"
                ? relPath === ""
                : item.match.some((m) => relPath === m || relPath.startsWith(m));
              return (
                <Link
                  key={item.id}
                  to={`${prefix}${item.to}`}
                  className={`asv2-nav-item${isActive ? " asv2-nav-item--active" : ""}`}
                >
                  <span className="asv2-nav-icon">
                    <item.Icon style={{ width: 20, height: 20 }} />
                  </span>
                  <span className="asv2-nav-label">{t(item.labelFr, item.labelEn)}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div id="main-content" className="asv2-content">
          {children}
          <Footer />
        </div>
      </div>

      {/* ── Mobile app-style bottom navigation (hidden on desktop via CSS) ──
          Two nav items each side of a raised circular "Ma stack" CTA, like a
          native app's center action button. */}
      <nav className="asv2-bottomnav" aria-label={t("Navigation", "Navigation")}>
        {NAV_ITEMS.filter((i) => i.id === "home" || i.id === "tools").map((item) => {
          const isActive = item.id === "home"
            ? relPath === ""
            : item.match.some((m) => relPath === m || relPath.startsWith(m));
          return (
            <Link key={item.id} to={`${prefix}${item.to}`} className={`asv2-bn-item${isActive ? " asv2-bn-item--active" : ""}`}>
              <item.Icon style={{ width: 22, height: 22 }} />
              <span className="asv2-bn-label">{t(item.labelFr, item.labelEn)}</span>
            </Link>
          );
        })}

        <Link to={`${prefix}/ma-stack`} className="asv2-bn-cta" aria-label={cartLabel}>
          <span className="asv2-bn-cta-btn">
            <Bookmark style={{ width: 24, height: 24 }} aria-hidden />
            {cartCount > 0 && <span className="asv2-bn-badge">{cartCount}</span>}
          </span>
          <span className="asv2-bn-label">{t("Ma stack", "My stack")}</span>
        </Link>

        {NAV_ITEMS.filter((i) => i.id === "compare" || i.id === "guides").map((item) => {
          const isActive = item.match.some((m) => relPath === m || relPath.startsWith(m));
          return (
            <Link key={item.id} to={`${prefix}${item.to}`} className={`asv2-bn-item${isActive ? " asv2-bn-item--active" : ""}`}>
              <item.Icon style={{ width: 22, height: 22 }} />
              <span className="asv2-bn-label">{t(item.labelFr, item.labelEn)}</span>
            </Link>
          );
        })}
      </nav>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
