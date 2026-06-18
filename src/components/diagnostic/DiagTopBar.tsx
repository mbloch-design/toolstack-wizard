import { useMemo } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import type { SessionState } from "@/types/diagnostic";
import { formatMonthlyTotal } from "@/utils/diagnosticPricing";
import logoToolTrim from "@/assets/logo-tooltrim.svg";

interface Props {
  session: SessionState;
  step: number;
  totalSteps: number;
  clusterInfo?: { current: number; total: number };
  t: (fr: string, en: string) => string;
}

export default function DiagTopBar({ session, step, totalSteps, clusterInfo, t }: Props) {
  const totalCostLabel = useMemo(
    () => formatMonthlyTotal(session.selectedTools, t),
    [session.selectedTools, t]
  );

  const showCounter = session.selectedTools.length > 0;

  const progressPercent = Math.round((step / Math.max(totalSteps - 1, 1)) * 100);
  const stageLabel = useMemo(() => {
    if (step <= 0) return t("1. Calibrage", "1. Calibration");
    if (step === 1) return t("2. Capture de stack", "2. Stack capture");
    if (step === 2) return t("3. Questions utiles", "3. Useful questions");
    if (step === 3) return t("4. Lecture", "4. Read");
    return t("5. Restitution", "5. Restitution");
  }, [step, t]);
  const homeHref = `/${session.language === "en" ? "en" : "fr"}`;

  return (
    <div className="diagnostic-topbar border-b">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3">
        <Link
          to={homeHref}
          aria-label={t("Retour à l’accueil ToolTrim", "Back to ToolTrim home")}
          className="flex min-w-0 items-center gap-3 rounded-sm transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img src={logoToolTrim} alt="ToolTrim" className="h-7 w-auto" />
          <span className="hidden text-sm font-semibold text-muted-foreground sm:inline">
            {t("Audit guidé", "Guided audit")}
          </span>
        </Link>

        <div className="mx-auto flex w-full max-w-xl items-center gap-4">
          <div className="min-w-[112px]">
            <p className="truncate text-sm font-semibold text-foreground">{stageLabel}</p>
          </div>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[hsl(var(--diag-yellow))] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="w-9 shrink-0 text-right font-mono text-xs text-muted-foreground">{progressPercent}%</span>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-3">
          {showCounter && session.selectedTools.length > 0 && (
            <div className="hidden items-center gap-3 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-mono shrink-0 shadow-sm lg:flex">
              <span className="text-foreground">{session.selectedTools.length} {t("outils", "tools")}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-foreground">{totalCostLabel}/{t("mois", "mo")}</span>
            </div>
          )}

          {clusterInfo && (
            <div className="hidden shrink-0 text-xs font-medium text-muted-foreground md:block">
              {t("Zone", "Area")} {clusterInfo.current}/{clusterInfo.total}
            </div>
          )}

          <Link
            to={homeHref}
            title={t("Quitter maintenant et reprendre plus tard", "Exit now and resume later")}
            aria-label={t("Quitter le diagnostic, ta progression est conservée", "Exit the diagnostic, your progress is saved")}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">{t("Quitter", "Exit")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
