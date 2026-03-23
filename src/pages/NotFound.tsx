import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { setMeta } from "@/lib/seo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = "Page introuvable - ToolTrim";
    setMeta("robots", "noindex, nofollow");

    return () => {
      const el = document.querySelector<HTMLMetaElement>('meta[name="robots"][content*="noindex"]');
      el?.remove();
    };
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Page introuvable</p>
        <Link
          to="/fr"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Retourner à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
