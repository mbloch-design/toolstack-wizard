import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";

const Navbar = () => {
  const { t, prefix, lang } = useLang();
  const otherLang = lang === "fr" ? "en" : "fr";

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to={prefix} className="font-heading text-xl font-bold tracking-tight">
          Tool<span className="text-primary">trim</span>
        </Link>

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
          <Link to={`/${otherLang}`} className="rounded-md border border-border px-2.5 py-1 text-xs font-medium uppercase text-muted-foreground transition-colors hover:bg-secondary">
            {otherLang}
          </Link>
          <Link
            to={`${prefix}/selector`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("Optimiser ma stack", "Optimize my stack")}
          </Link>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <Link to={`/${otherLang}`} className="rounded-md border border-border px-2 py-1 text-xs font-medium uppercase text-muted-foreground">
            {otherLang}
          </Link>
          <Link
            to={`${prefix}/selector`}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            {t("Optimiser", "Optimize")}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
