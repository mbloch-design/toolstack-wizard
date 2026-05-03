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

  const showCounter = step >= 6; // visible from clusters onward (internal step 6+)

  const progressPercent = Math.round((step / Math.max(totalSteps - 1, 1)) * 100);

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
        <div className="flex-1 max-w-xs hidden sm:block">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono shrink-0">{progressPercent}%</span>
          </div>
          {clusterInfo && (
            <p className="text-[10px] text-muted-foreground mt-0.5 text-center">
              Cluster {clusterInfo.current}/{clusterInfo.total}
            </p>
          )}
        </div>

        {/* Right: Ambient counter */}
        {showCounter && session.selectedTools.length > 0 && (
          <div className="flex items-center gap-3 text-xs font-mono shrink-0">
            <span className="text-foreground">{session.selectedTools.length} {t("outils", "tools")}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-foreground">{totalCost}€/{t("mois", "mo")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
