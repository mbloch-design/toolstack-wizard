import { useEffect, useState, type ReactNode } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import { useLang } from "@/hooks/useLang";
import picto from "@/assets/picto-logo.svg";

/** A neutral outline of the destination: no invented tools, prices or progress. */
export default function StackArrival({ pending = true, children }: { pending?: boolean; children?: ReactNode }) {
  const { t } = useLang();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, [pending]);
  return <div className="ms-page ms-arrival" aria-busy={pending}>
    <Breadcrumb items={[{ label: t("Ma stack", "My stack") }]} includeSchema={false} />
    <header className="ms-arrival-heading"><h1>{t("Ma stack", "My stack")}</h1></header>
    {pending && <>
      <div className="ms-arrival-welcome" role="status">
        <img className="ms-arrival-mark" src={picto} alt="" width={40} height={40} />
        <div><p>{t("On retrouve vos outils…", "Finding your tools…")}</p>
          <span>{slow ? t("Ça prend un peu plus de temps que prévu.", "This is taking a little longer than expected.") : t("Votre espace se prépare.", "Making room for your stack.")}</span></div>
      </div>
      <div className="ms-arrival-outline" aria-hidden="true"><span /><span /><span /></div>
    </>}
    {children}
  </div>;
}
