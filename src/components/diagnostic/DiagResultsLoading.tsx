import { useEffect } from "react";
import { CheckCircle2, Layers3, ShieldCheck, Sparkles } from "lucide-react";

interface Props {
  toolCount: number;
  t: (fr: string, en: string) => string;
  onComplete?: () => void;
}

export default function DiagResultsLoading({ toolCount, t, onComplete }: Props) {
  useEffect(() => {
    if (!onComplete) return;
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="diagnostic-card mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-7 p-7 text-center">
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[hsl(var(--diag-yellow))] text-[hsl(var(--diag-ink))]">
          <Sparkles className="h-9 w-9 animate-pulse" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent bg-background" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">
          {t("Je prépare ta restitution.", "Preparing your restitution.")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t(
            `J’analyse tes ${toolCount} outils, les doublons, les risques et les actions à prioriser.`,
            `Analyzing your ${toolCount} tools, duplicates, risks and priority actions.`
          )}
        </p>
      </div>

      <div className="grid w-full gap-2 text-left">
        <LoadingLine Icon={Layers3} label={t("Regroupement des outils", "Grouping tools")} />
        <LoadingLine Icon={ShieldCheck} label={t("Détection des angles morts", "Detecting blind spots")} />
        <LoadingLine Icon={CheckCircle2} label={t("Préparation du plan d’action", "Preparing action plan")} />
      </div>
    </div>
  );
}

function LoadingLine({ Icon, label }: { Icon: typeof Layers3; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  );
}
