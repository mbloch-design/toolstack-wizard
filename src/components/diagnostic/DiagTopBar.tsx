import { useMemo } from "react";
import type { SessionState, DoubleRule } from "@/types/diagnostic";

interface Props {
  session: SessionState;
  step: number;
  totalSteps: number;
  clusterInfo?: { current: number; total: number };
  t: (fr: string, en: string) => string;
}

export default function DiagTopBar({ session, step, totalSteps, clusterInfo, t }: Props) {
  const totalCost = useMemo(
    () => session.selectedTools.reduce((sum, tool) => sum + tool.price, 0),
    [session.selectedTools]
  );

  const showCounter = session.selectedTools.length > 0;

  const progressPercent = Math.round((step / Math.max(totalSteps - 1, 1)) * 100);
  const stageLabel = useMemo(() => {
    if (step <= 0) return t("1. Stack", "1. Stack");
    if (step === 1) return t("2. Contexte", "2. Context");
    if (step === 2) return t("3. Vérification", "3. Check");
    if (step === 3) return t("4. Verdict", "4. Verdict");
    return t("5. Dashboard", "5. Dashboard");
  }, [step, t]);

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-foreground text-sm">tooltrim</span>
          <span className="text-muted-foreground text-xs hidden sm:inline">
            {t("Diagnostic", "Diagnostic")}
          </span>
        </div>

        {/* Center: Progress */}
        <div className="flex-1 max-w-sm">
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="truncate text-xs font-medium text-foreground">{stageLabel}</span>
            <span className="text-xs text-muted-foreground font-mono shrink-0">{progressPercent}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          {clusterInfo && (
            <p className="text-[10px] text-muted-foreground mt-0.5 text-center">
              Cluster {clusterInfo.current}/{clusterInfo.total}
            </p>
          )}
        </div>

        {/* Right: Ambient counter */}
        {showCounter && session.selectedTools.length > 0 && (
          <div className="hidden items-center gap-3 text-xs font-mono shrink-0 md:flex">
            <span className="text-foreground">{session.selectedTools.length} {t("outils", "tools")}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-foreground">{totalCost}€/{t("mois", "mo")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
