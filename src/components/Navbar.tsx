import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useState } from "react";
import pictoLogo from "@/assets/picto-logo.svg";

const Navbar = () => {
  const { t, prefix, lang } = useLang();
  const otherLang = lang === "fr" ? "en" : "fr";
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to={prefix} className="flex items-center gap-2 text-xl font-extrabold tracking-tighter">
          <img src={pictoLogo} alt="ToolTrim" className="h-8 w-8 rounded-lg" />
          Tool<span className="text-primary">trim</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-8 md:flex">
          <Link to={`${prefix}/tools`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t("Outils", "Tools")}
          </Link>
          <Link to={`${prefix}/guides`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t("Guides", "Guides")}
          </Link>
          <Link to={`${prefix}/about`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t("À propos", "About")}
          </Link>
          <button
            onClick={toggle}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to={`/${otherLang}`} className="rounded-md border border-border px-2.5 py-1 text-xs font-medium uppercase text-muted-foreground transition-colors hover:bg-secondary">
            {otherLang}
          </Link>
          <Link
            to={`${prefix}/selector`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("Optimiser ma stack", "Optimize my stack")}
          </Link>
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggle}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to={`/${otherLang}`} className="rounded-md border border-border px-2 py-1 text-xs font-medium uppercase text-muted-foreground">
            {otherLang}
          </Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-md p-2 text-muted-foreground">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to={`${prefix}/tools`} onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">
              {t("Outils", "Tools")}
            </Link>
            <Link to={`${prefix}/guides`} onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">
              {t("Guides", "Guides")}
            </Link>
            <Link to={`${prefix}/about`} onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">
              {t("À propos", "About")}
            </Link>
            <Link
              to={`${prefix}/selector`}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground"
            >
              {t("Optimiser ma stack", "Optimize my stack")}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
