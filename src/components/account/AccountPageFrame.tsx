import { useEffect, type ReactNode } from "react";
import { useLang } from "@/hooks/useLang";
import { useTopbarBreadcrumb } from "@/contexts/TopbarBreadcrumbContext";
import { removeNoindex, setMeta, setNoindex } from "@/lib/seo";
export default function AccountPageFrame({
  title,
  intro,
  children,
  narrow = false,
  wide = false,
  headerExtra,
  icon,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
  narrow?: boolean;
  wide?: boolean;
  headerExtra?: ReactNode;
  icon?: ReactNode;
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
    <div className={`ac-page${narrow ? " ac-page--narrow" : ""}${wide ? " ac-page--wide" : ""}`}>
      <header className="ac-page-header">
        <div className="ac-page-heading">
          {icon && <span className="ac-hero-icon" aria-hidden>{icon}</span>}
          <div><h1>{title}</h1>{intro && <p>{intro}</p>}</div>
        </div>
        {headerExtra}
      </header>
      {children}
    </div>
  );
}
