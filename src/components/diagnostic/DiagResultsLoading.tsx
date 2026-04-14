import { useEffect } from "react";

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
          <span className="text-4xl">⚡</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary animate-spin
                        border-2 border-primary-foreground" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">
          {t("Calcul en cours…", "Calculating…")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t(
            `On analyse tes ${toolCount} outils pour trouver les économies.`,
            `Analyzing your ${toolCount} tools to find savings.`
          )}
        </p>
      </div>

      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
