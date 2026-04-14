import { useMemo } from "react";
import type { DiagnosticResult, Prescription } from "@/types/diagnostic";
import { ArrowRight, Share2, ChevronRight } from "lucide-react";
import DashPdfExport from "./DashPdfExport";


type Tab = "overview" | "gaspillage" | "stack" | "optimiser" | "actions";

interface Props {
  result: DiagnosticResult;
  t: (fr: string, en: string) => string;
  onShare?: () => void;
  onNavigate?: (tab: Tab) => void;
}

function buildSparringLine(result: DiagnosticResult, t: Props["t"]): string {
  const { firstName, persona } = result.sessionState;
  const allP = [...result.prescriptions.phase1, ...result.prescriptions.phase3];
  const doublons = allP.filter((p) => p.type === "doublon" || p.type === "doublon-ia");

  if (result.healthScore >= 80) {
    return t(
      `${firstName}, ta stack est solide. Quelques ajustements et tu es au top.`,
      `${firstName}, your stack is solid. A few tweaks and you're at the top.`
    );
  }
  if (doublons.length >= 2) {
    return t(
      `${firstName}, ${doublons.length} doublons dans ta stack. On commence par là.`,
      `${firstName}, ${doublons.length} duplicates in your stack. Let's start there.`
    );
  }
  return t(
    `${firstName}, il y a du potentiel. Voici par où commencer.`,
    `${firstName}, there's potential here. Here's where to start.`
  );
}

// Build top 2-3 biggest problems
function getTopProblems(result: DiagnosticResult) {
  const allP = [
    ...result.prescriptions.phase1,
    ...result.prescriptions.phase2,
    ...result.prescriptions.phase3,
  ];
  const toolMap = new Map(result.sessionState.selectedTools.map((t) => [t.id, t]));

  // Doublons grouped
  const doublonPairs = allP
    .filter((p) => p.type === "doublon" || p.type === "doublon-ia")
    .sort((a, b) => b.savingsEstimate - a.savingsEstimate);

  // Dormants
  const dormants = allP
    .filter((p) => p.type === "dormant")
    .sort((a, b) => b.savingsEstimate - a.savingsEstimate);

  // Inadaptés
  const inadaptes = allP
    .filter((p) => p.type === "inadapté")
    .sort((a, b) => b.savingsEstimate - a.savingsEstimate);

  const problems: { toolIds: string[]; message: string; savings: number; type: string }[] = [];

  // Add top doublon
  if (doublonPairs.length > 0) {
    const top = doublonPairs[0];
    const tool = toolMap.get(top.toolId);
    problems.push({
      toolIds: [top.toolId],
      message: top.message,
      savings: top.savingsEstimate,
      type: "doublon",
    });
  }
  // Add second doublon or first dormant
  if (doublonPairs.length > 1) {
    const p = doublonPairs[1];
    problems.push({ toolIds: [p.toolId], message: p.message, savings: p.savingsEstimate, type: "doublon" });
  } else if (dormants.length > 0) {
    const p = dormants[0];
    const tool = toolMap.get(p.toolId);
    problems.push({
      toolIds: [p.toolId],
      message: p.message,
      savings: p.savingsEstimate,
      type: "dormant",
    });
  } else if (inadaptes.length > 0) {
    const p = inadaptes[0];
    problems.push({ toolIds: [p.toolId], message: p.message, savings: p.savingsEstimate, type: "inadapté" });
  }

  // Third if available
  if (problems.length < 3 && dormants.length > (problems.some(p => p.type === "dormant") ? 1 : 0)) {
    const idx = problems.some(p => p.type === "dormant") ? 1 : 0;
    if (dormants[idx]) {
      const p = dormants[idx];
      problems.push({ toolIds: [p.toolId], message: p.message, savings: p.savingsEstimate, type: "dormant" });
    }
  }

  return problems.slice(0, 3);
}

export default function DashOverview({ result, t, onShare, onNavigate }: Props) {
  const sparringLine = useMemo(() => buildSparringLine(result, t), [result, t]);
  const topProblems = useMemo(() => getTopProblems(result), [result]);
  const toolMap = useMemo(
    () => new Map(result.sessionState.selectedTools.map((tl) => [tl.id, tl])),
    [result.sessionState.selectedTools]
  );

  const healthColor =
    result.healthScore >= 80 ? "bg-[hsl(var(--keep))]" :
    result.healthScore >= 60 ? "bg-yellow-500" :
    result.healthScore >= 40 ? "bg-orange-500" :
    "bg-destructive";

  const healthColorText =
    result.healthScore >= 80 ? "text-[hsl(var(--keep))]" :
    result.healthScore >= 60 ? "text-yellow-500" :
    result.healthScore >= 40 ? "text-orange-500" :
    "text-destructive";

  return (
    <div className="space-y-8">
      {/* ─── 1. HERO — Full width dark section ─── */}
      <div className="bg-[hsl(var(--navy,222_44%_17%))] rounded-2xl p-6 md:p-10 text-white space-y-4">
        <p className="text-4xl md:text-6xl font-bold font-['DM_Mono'] tracking-tight">
          {Math.round(result.estimatedWaste)}€
          <span className="text-lg md:text-xl font-normal text-white/60 ml-1">/{t("mois", "mo")}</span>
        </p>
        <p className="text-sm md:text-base text-white/70">
          {t("Soit", "That's")} <strong className="text-white font-['DM_Mono']">{Math.round(result.annualSavings)}€/{t("an", "yr")}</strong>
          {" — "}{t("voilà comment les récupérer", "here's how to get them back")}
        </p>
        <p className="text-sm text-white/50 leading-relaxed max-w-xl">
          {sparringLine} <span className="italic">— {t("Ton sparring partner", "Your sparring partner")}</span>
        </p>
        <button
          onClick={() => onNavigate?.("actions")}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-[hsl(222,44%,17%)] text-sm font-semibold hover:bg-white/90 transition-colors"
        >
          {t("Voir mon plan d'action", "View my action plan")}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ─── 2. TOP 2-3 BIGGEST PROBLEMS ─── */}
      {topProblems.length > 0 && (
        <div className="space-y-3">
          {topProblems.map((problem, i) => {
            const tool = toolMap.get(problem.toolIds[0]);
            return (
              <div key={i} className="flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-3 hover:border-destructive/30 transition-colors">
                <div className="shrink-0">
                  {tool ? (
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{tool.name.charAt(0)}</div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive">!</div>
                  )}
                </div>
                <p className="flex-1 text-sm text-foreground leading-snug">{problem.message}</p>
                {problem.savings > 0 && (
                  <span className="shrink-0 text-sm font-bold font-['DM_Mono'] text-[hsl(var(--keep))]">
                    {problem.savings}€
                  </span>
                )}
              </div>
            );
          })}
          <button
            onClick={() => onNavigate?.("gaspillage")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            {t("Voir tous les problèmes", "See all issues")}
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ─── 3. STACK HEALTH — One-line context ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground">
            {t("Ta stack globale", "Your overall stack")}:{" "}
            <span className={`font-semibold ${healthColorText}`}>{result.healthLabel}</span>
            <span className="text-muted-foreground font-['DM_Mono'] ml-1">({result.healthScore}/100)</span>
          </p>
          <button
            onClick={() => onNavigate?.("stack")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            {t("Analyse complète", "Full analysis")}
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${healthColor} transition-all duration-1000`}
            style={{ width: `${result.healthScore}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground font-['DM_Mono']">
          <span>{result.stackTotalCost}€/{t("mois", "mo")}</span>
          <span>→ {result.optimizedCost}€/{t("mois", "mo")}</span>
        </div>
      </div>

      {/* ─── 4. QUICK ACTIONS ─── */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={onShare}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
        >
          <Share2 className="w-4 h-4" />
          {t("Partager mon audit", "Share my audit")}
        </button>
        <DashPdfExport result={result} t={t} variant="outline" />
      </div>
    </div>
  );
}
