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
  const stages = [
    t("Profil", "Profile"),
    t("Outils", "Tools"),
    t("Vérification", "Check"),
    t("Verdict", "Verdict"),
    t("Restitution", "Restitution"),
  ];
  const stageLabel = useMemo(() => {
    if (step <= 0) return t("1. Profil", "1. Profile");
    if (step === 1) return t("2. Outils", "2. Tools");
    if (step === 2) return t("3. Vérification", "3. Check");
    if (step === 3) return t("4. Verdict", "4. Verdict");
    return t("5. Dashboard", "5. Dashboard");
  }, [step, t]);

  return (
    <div className="border-b border-border bg-background/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-3">
        <div className="min-w-0 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-sm">tooltrim</span>
            <span className="text-muted-foreground text-xs">
              {t("Diagnostic guidé", "Guided diagnostic")}
            </span>
          </div>
          <p className="mt-0.5 hidden text-xs text-muted-foreground md:block">
            {t("On calibre, on capte ta stack, puis on restitue.", "We calibrate, capture your stack, then restitute.")}
          </p>
        </div>

        <div className="hidden flex-1 items-center justify-center gap-2 lg:flex">
          {stages.map((label, index) => {
            const active = index === Math.min(step, stages.length - 1);
            const done = index < step;
            return (
              <div key={label} className="flex items-center gap-2">
                <span className={`flex h-7 items-center rounded-full border px-3 text-xs font-semibold ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : done
                      ? "border-primary/20 bg-primary/5 text-primary"
                      : "border-border bg-card text-muted-foreground"
                }`}>
                  {label}
                </span>
                {index < stages.length - 1 && <span className="h-px w-5 bg-border" />}
              </div>
            );
          })}
        </div>

        <div className="min-w-[170px] flex-1 max-w-xs lg:flex-none">
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

        {showCounter && session.selectedTools.length > 0 && (
          <div className="hidden items-center gap-3 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-mono shrink-0 md:flex">
            <span className="text-foreground">{session.selectedTools.length} {t("outils", "tools")}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-foreground">{totalCost}€/{t("mois", "mo")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
