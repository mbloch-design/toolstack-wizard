import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import type { DiagnosticResult, Tool } from "@/types/diagnostic";
import { computeScoreFinal } from "@/utils/scoring";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";


type Tab = "overview" | "gaspillage" | "stack" | "optimiser" | "actions";

interface Props {
  result: DiagnosticResult;
  allTools: Tool[];
  t: (fr: string, en: string) => string;
  onNavigate?: (tab: Tab) => void;
}

interface SwapData {
  current: Tool;
  alternative: Tool;
  savings: number;
  currentScore: number;
  altScore: number;
}

const PERSONA_REASONS: Record<string, { fr: string; en: string }> = {
  THEO: { fr: "Idéal pour les devs qui veulent automatiser", en: "Ideal for devs who want to automate" },
  SOFIA: { fr: "Conçu pour les workflows créatifs", en: "Built for creative workflows" },
  MARC: { fr: "Parfait pour structurer ta prospection", en: "Perfect for structuring your pipeline" },
  ALIX: { fr: "Booste ta création de contenu", en: "Boosts your content creation" },
  CLAIRE: { fr: "Simplifie ta gestion quotidienne", en: "Simplifies your daily operations" },
};

function SwapCard({ swap, t, onAccept, prefix }: { swap: SwapData; t: Props["t"]; onAccept: () => void; prefix: string }) {
  const [showSteps, setShowSteps] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 space-y-3">
        {/* A → B */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive">{swap.current.name.charAt(0)}</div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{swap.alternative.name.charAt(0)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              <Link to={`${prefix}/tool/${swap.current.id}`} className="text-muted-foreground line-through hover:text-foreground transition-colors">{swap.current.name}</Link>
              {" → "}
              <Link to={`${prefix}/tool/${swap.alternative.id}`} className="font-semibold text-primary hover:underline">{swap.alternative.name}</Link>
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 text-xs">
          {swap.savings > 0 && (
            <span className="font-['DM_Mono'] font-bold text-[hsl(var(--keep))]">+{swap.savings}€/{t("mois", "mo")}</span>
          )}
          <span className="text-muted-foreground">
            {t("Score", "Score")}: {swap.currentScore} → <span className="text-[hsl(var(--keep))] font-medium">{swap.altScore}</span>
          </span>
          <span className="text-muted-foreground">~2h {t("de migration", "migration")}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
          >
            {t("Je veux faire ce swap", "I want this swap")}
          </button>
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            {t("Étapes", "Steps")}
            {showSteps ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Migration steps accordion */}
      {showSteps && (
        <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-2 text-xs text-foreground">
          <p>1. {t("Crée un compte sur", "Create an account on")} {swap.alternative.name}</p>
          <p>2. {t("Exporte tes données de", "Export your data from")} {swap.current.name}</p>
          <p>3. {t("Importe dans", "Import into")} {swap.alternative.name}</p>
          <p>4. {t("Teste pendant 1 semaine avant d'annuler", "Test for 1 week before cancelling")} {swap.current.name}</p>
        </div>
      )}
    </div>
  );
}

export default function DashOptimisations({ result, allTools, t, onNavigate }: Props) {
  const { prefix } = useLang();
  const { sessionState } = result;

  const swaps = useMemo(() => {
    const out: SwapData[] = [];
    for (const tool of sessionState.selectedTools) {
      if (!tool.better_alternative) continue;
      let altId: string | undefined;
      try {
        const parsed = JSON.parse(tool.better_alternative);
        altId = typeof parsed === "string" ? parsed : parsed?.id || parsed?.tool;
      } catch {
        altId = tool.better_alternative;
      }
      if (!altId) continue;
      const alt = allTools.find((t) => t.id === altId);
      if (!alt) continue;

      const currentScore = result.toolScores.get(tool.id)?.scoreFinal ?? 50;
      const altScore = computeScoreFinal(alt, sessionState.persona, sessionState.complementarySkills, sessionState.tjm).scoreFinal;

      if (altScore > currentScore) {
        out.push({ current: tool, alternative: alt, savings: Math.round(tool.price - alt.price), currentScore, altScore });
      }
    }
    return out.sort((a, b) => b.savings - a.savings);
  }, [result, allTools, sessionState]);

  const personaReason = PERSONA_REASONS[sessionState.persona] || PERSONA_REASONS.THEO;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t("Ce que je ferais à ta place", "What I'd do in your shoes")}</h2>
        <p className="text-sm text-muted-foreground mt-1">— {t("Ton sparring partner", "Your sparring partner")}</p>
      </div>

      {/* ─── 1. SWAPS FIRST ─── */}
      {swaps.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">🔄 {t("Remplace, ne dépense pas plus", "Replace, don't spend more")}</h3>
          </div>
          <div className="space-y-3">
            {swaps.map((swap) => (
              <SwapCard
                key={`${swap.current.id}-${swap.alternative.id}`}
                swap={swap}
                t={t}
                onAccept={() => onNavigate?.("actions")}
                prefix={prefix}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── 2. NEW TOOLS (optional, max 3) ─── */}
      {result.recommendations.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">💡 {t("Si tu veux aller plus loin", "If you want to go further")}</h3>
            <p className="text-xs text-muted-foreground">{t("Optionnel — ces outils pourraient t'intéresser", "Optional — these tools might interest you")}</p>
          </div>
          <div className="space-y-2">
            {result.recommendations.slice(0, 3).map((tool) => (
              <div key={tool.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{tool.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">{t(personaReason.fr, personaReason.en)}</p>
                </div>
                <span className="text-xs font-['DM_Mono'] text-muted-foreground shrink-0">
                  {tool.price > 0 ? `${tool.price}€` : t("Gratuit", "Free")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.recommendations.length === 0 && swaps.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">✨</p>
          <p className="text-sm">{t("Ta stack est déjà bien optimisée !", "Your stack is already well optimized!")}</p>
        </div>
      )}
    </div>
  );
}
