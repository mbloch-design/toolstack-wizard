import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import type { DiagnosticResult, Tool } from "@/types/diagnostic";
import { computeScoreFinal } from "@/utils/scoring";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { formatMoney, formatToolMonthlyPrice } from "@/utils/diagnosticPricing";


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

function formatSwapSavings(swap: SwapData, t: Props["t"]) {
  const currency = swap.current.priceCurrency || swap.current.catalogMonthlyPriceCurrency;
  const label = `${formatMoney(swap.savings, currency)}/${t("mois", "mo")}`;
  return currency ? label : `${label} · ${t("montant à préciser", "amount to clarify")}`;
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
          <ToolLogo tool={swap.current} size={32} className="rounded-lg ring-destructive/20" />
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          <ToolLogo tool={swap.alternative} size={32} className="rounded-lg ring-primary/20" />
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
            <span className="font-['DM_Mono'] font-bold text-[hsl(var(--keep))]">+{formatSwapSavings(swap, t)}</span>
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
      const altScore = computeScoreFinal(alt, sessionState.persona, sessionState.complementarySkills, sessionState.tjm, sessionState.primarySpecialty).scoreFinal;

      if (altScore > currentScore) {
        out.push({ current: tool, alternative: alt, savings: Math.round(tool.price - alt.price), currentScore, altScore });
      }
    }
    return out.sort((a, b) => b.savings - a.savings);
  }, [result, allTools, sessionState]);

  const personaReason = PERSONA_REASONS[sessionState.persona] || PERSONA_REASONS.THEO;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase text-primary">{t("Options prudentes", "Careful options")}</p>
        <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
          {t("Seulement si tu veux aller plus loin.", "Only if you want to go further.")}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t(
            "Cette page n’est pas une invitation à empiler des outils. Elle liste les remplacements possibles et les pistes à tester après les actions prioritaires.",
            "This page is not an invitation to pile up tools. It lists possible replacements and ideas to test after priority actions."
          )}
        </p>
      </header>

      {swaps.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t("Remplacer avant d’ajouter", "Replace before adding")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Ces pistes ont du sens seulement si elles simplifient vraiment ton usage.", "These options make sense only if they truly simplify your usage.")}
            </p>
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

      {result.recommendations.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t("Pistes optionnelles", "Optional ideas")}</h2>
            <p className="text-xs text-muted-foreground">{t("À tester seulement si le besoin est réel.", "Test only if the need is real.")}</p>
          </div>
          <div className="space-y-2">
            {result.recommendations.slice(0, 3).map((tool) => (
              <div key={tool.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                <ToolLogo tool={tool} size={32} className="rounded-lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">{t(personaReason.fr, personaReason.en)}</p>
                </div>
                <span className="text-xs font-['DM_Mono'] text-muted-foreground shrink-0">
                  {formatToolMonthlyPrice(tool, t)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.recommendations.length === 0 && swaps.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">{t("Aucune piste optionnelle forte. C’est plutôt bon signe.", "No strong optional idea. That is a good sign.")}</p>
        </div>
      )}
    </div>
  );
}
