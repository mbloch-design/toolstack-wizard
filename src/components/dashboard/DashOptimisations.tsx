import { useMemo } from "react";
import type { DiagnosticResult, Tool } from "@/types/diagnostic";
import type { ToolScore } from "@/utils/scoring";
import { computeScoreFinal } from "@/utils/scoring";
import { ExternalLink, ArrowRight, Info } from "lucide-react";

interface Props {
  result: DiagnosticResult;
  allTools: Tool[];
  t: (fr: string, en: string) => string;
}

function RecommendationCard({ tool, t }: { tool: Tool; t: Props["t"] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
            {tool.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{tool.name}</p>
            <p className="text-xs font-['DM_Mono'] text-muted-foreground">
              {tool.price > 0 ? `${tool.price}€/${t("mois", "mo")}` : t("Gratuit", "Free")}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {t("Catégorie", "Category")}: <span className="capitalize">{tool.category}</span>
      </p>

      <div className="flex gap-2">
        {tool.freeAlternative && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--keep))]/10 text-[hsl(var(--keep))]">
            {t("Alt. gratuite dispo", "Free alt. available")}
          </span>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
          <ExternalLink className="w-3 h-3" />
          {t("Essayer", "Try it")}
        </button>
        <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-foreground text-xs font-medium hover:bg-muted transition-colors">
          <Info className="w-3 h-3" />
          {t("Détails", "Details")}
        </button>
      </div>
    </div>
  );
}

interface SwapData {
  current: Tool;
  alternative: Tool;
  savings: number;
  currentScore: number;
  altScore: number;
}

function SwapCard({ swap, t }: { swap: SwapData; t: Props["t"] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive">
            {swap.current.name.charAt(0)}
          </div>
          <span className="text-sm font-medium text-foreground">{swap.current.name}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--keep))]/10 flex items-center justify-center text-xs font-bold text-[hsl(var(--keep))]">
            {swap.alternative.name.charAt(0)}
          </div>
          <span className="text-sm font-medium text-foreground">{swap.alternative.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">{t("Économie", "Savings")}</p>
          <p className="text-sm font-bold font-['DM_Mono'] text-[hsl(var(--keep))]">
            {swap.savings > 0 ? `+${swap.savings}€` : `${swap.savings}€`}
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">{t("Score actuel", "Current")}</p>
          <p className="text-sm font-bold font-['DM_Mono'] text-foreground">{swap.currentScore}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">{t("Score swap", "New score")}</p>
          <p className="text-sm font-bold font-['DM_Mono'] text-[hsl(var(--keep))]">{swap.altScore}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
          {t("Voir plan migration", "View migration plan")}
        </button>
        <button className="px-3 py-2 rounded-lg border border-border text-muted-foreground text-xs hover:bg-muted transition-colors">
          {t("Non, merci", "No thanks")}
        </button>
      </div>
    </div>
  );
}

export default function DashOptimisations({ result, allTools, t }: Props) {
  const { sessionState } = result;

  const swaps = useMemo(() => {
    const out: SwapData[] = [];
    for (const tool of sessionState.selectedTools) {
      if (!tool.better_alternative) continue;
      let altId: string | undefined;
      try {
        const parsed = JSON.parse(tool.better_alternative);
        altId = typeof parsed === "string" ? parsed : parsed?.id;
      } catch {
        altId = tool.better_alternative;
      }
      if (!altId) continue;
      const alt = allTools.find((t) => t.id === altId);
      if (!alt) continue;

      const currentScore = result.toolScores.get(tool.id)?.scoreFinal ?? 50;
      const altScore = computeScoreFinal(alt, sessionState.persona, sessionState.complementarySkills, sessionState.tjm).scoreFinal;

      if (altScore > currentScore) {
        out.push({
          current: tool,
          alternative: alt,
          savings: Math.round(tool.price - alt.price),
          currentScore,
          altScore,
        });
      }
    }
    return out.sort((a, b) => b.savings - a.savings);
  }, [result, allTools, sessionState]);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-foreground">{t("Optimisations", "Optimizations")}</h2>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">🆕 {t("Outils recommandés", "Recommended tools")}</h3>
            <p className="text-xs text-muted-foreground">{t("Ces outils compléteraient bien ta stack", "These tools would complement your stack")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.recommendations.slice(0, 6).map((tool) => (
              <RecommendationCard key={tool.id} tool={tool} t={t} />
            ))}
          </div>
        </div>
      )}

      {/* Smart Swaps */}
      {swaps.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">🔄 {t("Smart Swaps", "Smart Swaps")}</h3>
            <p className="text-xs text-muted-foreground">{t("Remplace ces outils par de meilleures alternatives", "Replace these tools with better alternatives")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {swaps.map((swap) => (
              <SwapCard key={`${swap.current.id}-${swap.alternative.id}`} swap={swap} t={t} />
            ))}
          </div>
        </div>
      )}

      {result.recommendations.length === 0 && swaps.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">✨</p>
          <p className="text-sm">{t("Ta stack est déjà bien optimisée ! Pas de swap ou recommendation identifié.", "Your stack is already well optimized! No swaps or recommendations identified.")}</p>
        </div>
      )}
    </div>
  );
}
