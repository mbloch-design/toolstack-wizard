import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTopbarBreadcrumb } from "@/contexts/TopbarBreadcrumbContext";
import { removeNoindex, setMeta, setNoindex } from "@/lib/seo";
export default function AccountPageFrame({
  title,
  intro,
  children,
  narrow = false,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
  narrow?: boolean;
}) {
  const { t, prefix } = useLang();
  useTopbarBreadcrumb([
    { label: t("Accueil", "Home"), href: prefix },
    { label: title },
  ]);
  useEffect(() => {
    document.title = `${title} · ToolTrim`;
    setNoindex();
    setMeta(
      "description",
      t(
        "Gérez votre compte et votre stack ToolTrim.",
        "Manage your ToolTrim account and stack.",
      ),
    );
    return removeNoindex;
  }, [title, t]);
  return (
    <div className={`ac-page${narrow ? " ac-page--narrow" : ""}`}>
      <nav
        className="ac-breadcrumb"
        aria-label={t("Fil d’Ariane", "Breadcrumb")}
      >
        <Link to={prefix}>{t("Accueil", "Home")}</Link>
        <span aria-hidden>/</span>
        <span aria-current="page">{title}</span>
      </nav>
      <header className="ac-page-header">
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </header>
      {children}
    </div>
  );
}
