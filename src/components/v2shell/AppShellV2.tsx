import { Link, useLocation } from "react-router-dom";
import { useState, type ReactNode } from "react";
import {
  Home,
  Wrench,
  Layers,
  Scale,
  BookOpen,
  Tag,
  Search,
  ArrowRight,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import logoToolTrim from "@/assets/logo-tooltrim.svg";
import { SearchModal } from "@/components/SearchModal";

type NavItem = {
  id: string;
  labelFr: string;
  labelEn: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  to: string;
  matchV2?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { id: "home",       labelFr: "Accueil",     labelEn: "Home",       Icon: Home,     to: "/v2", matchV2: true },
  { id: "tools",      labelFr: "Outils",      labelEn: "Tools",      Icon: Wrench,   to: "/tools" },
  { id: "categories", labelFr: "Catégories",  labelEn: "Categories", Icon: Tag,      to: "/category" },
  { id: "stacks",     labelFr: "Stacks",      labelEn: "Stacks",     Icon: Layers,   to: "/stacks" },
  { id: "compare",    labelFr: "Comparatifs", labelEn: "Compare",    Icon: Scale,    to: "/comparatifs" },
  { id: "guides",     labelFr: "Guides",      labelEn: "Guides",     Icon: BookOpen, to: "/guides" },
];

export default function AppShellV2({ children }: { children: ReactNode }) {
  const { t, prefix } = useLang();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="asv2-root">
      {/* ── Sidebar ── */}
      <aside className="asv2-sidebar">
        <Link to={`${prefix}/v2`} className="asv2-logo">
          <img src={logoToolTrim} alt="ToolTrim" width={110} height={24} />
        </Link>

        <nav className="asv2-nav">
          {NAV_ITEMS.map((item) => {
            const href = `${prefix}${item.to}`;
            const isActive = item.matchV2
              ? /\/v2\/?$/.test(location.pathname)
              : location.pathname.startsWith(href);
            return (
              <Link
                key={item.id}
                to={href}
                className={`asv2-nav-item${isActive ? " asv2-nav-item--active" : ""}`}
              >
                <item.Icon style={{ width: 19, height: 19 }} />
                <span>{t(item.labelFr, item.labelEn)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="asv2-sidebar-footer">
          <Link to={`${prefix}/selector`} className="asv2-audit-cta">
            {t("Auditer ma stack", "Audit my stack")}
            <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="asv2-main">
        <header className="asv2-topbar">
          <button className="asv2-search" onClick={() => setSearchOpen(true)}>
            <Search style={{ width: 15, height: 15 }} />
            <span>{t("Rechercher un outil...", "Search a tool...")}</span>
            <kbd className="asv2-kbd">⌘K</kbd>
          </button>

          <div className="asv2-topbar-right">
            <Link to={`${prefix}/selector`} className="asv2-topbar-cta">
              {t("Auditer ma stack", "Audit my stack")}
            </Link>
          </div>
        </header>

        <div className="asv2-content">
          {children}
        </div>
      </div>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
