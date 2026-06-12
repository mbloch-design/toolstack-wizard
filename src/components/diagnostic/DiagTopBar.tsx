import { useMemo } from "react";
import type { SessionState } from "@/types/diagnostic";
import { formatMonthlyTotal } from "@/utils/diagnosticPricing";

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

  return (
    <div className="border-b border-border bg-background/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t("Audit guidé", "Guided audit")}
          </p>
          <p className="truncate text-sm font-semibold text-foreground">{stageLabel}</p>
        </div>

        <div className="flex min-w-[170px] flex-1 max-w-sm items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="w-9 shrink-0 text-right font-mono text-xs text-muted-foreground">{progressPercent}%</span>
        </div>

        {showCounter && session.selectedTools.length > 0 && (
          <div className="hidden items-center gap-3 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-mono shrink-0 lg:flex">
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
      </div>
    </div>
  );
}
