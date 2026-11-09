import { useEffect, useState, type ReactNode } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import Page from "@/ds/Page/Page";
import PageLoading from "@/ds/PageLoading/PageLoading";
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
  return <Page>
    <Breadcrumb items={[{ label: t("Ma stack", "My stack") }]} includeSchema={false} />
    <PageLoading pending={pending} title={t("Ma stack", "My stack")} mark={<img src={picto} alt="" width={40} height={40} />}
      message={t("On retrouve vos outils…", "Finding your tools…")}
      note={slow ? t("Ça prend un peu plus de temps que prévu.", "This is taking a little longer than expected.") : t("Votre espace se prépare.", "Making room for your stack.")}>
      {children}
    </PageLoading>
  </Page>;
}
