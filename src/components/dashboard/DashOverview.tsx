import { useMemo } from "react";
import type { DiagnosticResult, Prescription } from "@/types/diagnostic";
import { ArrowRight, Share2, ChevronRight, CheckCircle2, Gauge, Layers3, ShieldAlert } from "lucide-react";
import DashPdfExport from "./DashPdfExport";
import ToolLogo from "@/components/ToolLogo";


type Tab = "overview" | "gaspillage" | "stack" | "optimiser" | "actions";

interface Props {
  result: DiagnosticResult;
  t: (fr: string, en: string) => string;
  onShare?: () => void;
  onNavigate?: (tab: Tab) => void;
}

function buildSparringLine(result: DiagnosticResult, t: Props["t"]): string {
  const { firstName } = result.sessionState;
  const name = firstName?.trim();
  const subjectFr = name || "Ta stack";
  const subjectEn = name || "Your stack";
  const allP = [...result.prescriptions.phase1, ...result.prescriptions.phase3];
  const doublons = allP.filter((p) => p.type === "doublon" || p.type === "doublon-ia");

  if (result.healthScore >= 80) {
    return t(
      name
        ? `${name}, ta stack est solide. Quelques ajustements et tu es au top.`
        : "Ta stack est solide. Quelques ajustements et elle sera encore plus nette.",
      name
        ? `${name}, your stack is solid. A few tweaks and you're at the top.`
        : "Your stack is solid. A few tweaks will make it even sharper."
    );
  }
  if (doublons.length >= 2) {
    return t(
      `${subjectFr} montre ${doublons.length} doublons. On commence par là.`,
      `${subjectEn} shows ${doublons.length} duplicates. Let's start there.`
    );
  }
  return t(
    name
      ? `${name}, il y a du potentiel. Voici par où commencer.`
      : "Il y a du potentiel. Voici par où commencer.",
    name
      ? `${name}, there's potential here. Here's where to start.`
      : "There is potential here. Here's where to start."
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
  const primaryRisk = result.insights.primaryRisk;
  const profile = result.insights.profile;
  const maturity = result.insights.maturity;
  const confidence = result.insights.confidence;
  const personaContext = result.insights.personaContext;
  const riskTone =
    primaryRisk?.severity === "high"
      ? "border-destructive/30 bg-destructive/5 text-destructive"
      : primaryRisk?.severity === "medium"
        ? "border-orange-300 bg-orange-50 text-orange-700"
        : "border-border bg-card text-foreground";

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-primary">
          {t("Lecture en 30 secondes", "30-second read")}
        </p>
        <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
          {t("Voici ce que ton diagnostic raconte.", "Here is what your diagnostic says.")}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t(
            "Je commence par la décision la plus utile, puis tu peux explorer les détails si tu veux comprendre le pourquoi.",
            "I start with the most useful decision, then you can explore details if you want the why."
          )}
        </p>
      </div>

      {/* ─── 1. HERO — Full width dark section ─── */}
      <div className="rounded-2xl bg-[hsl(var(--navy,222_44%_17%))] p-6 text-white md:p-8">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            {result.estimatedWaste > 0
              ? t("Potentiel récupérable", "Recoverable potential")
              : t("Stack plutôt saine", "Mostly healthy stack")}
          </p>
        <p className="text-4xl md:text-6xl font-bold font-['DM_Mono'] tracking-tight">
          {Math.round(result.estimatedWaste)}€
          <span className="text-lg md:text-xl font-normal text-white/60 ml-1">/{t("mois", "mo")}</span>
        </p>
        <p className="text-sm md:text-base text-white/70">
          {result.estimatedWaste > 0 ? (
            <>
              {t("Soit", "That's")} <strong className="text-white font-['DM_Mono']">{Math.round(result.annualSavings)}€/{t("an", "yr")}</strong>
              {" · "}{t("on priorise les actions les plus simples d’abord", "we prioritize the simplest actions first")}
            </>
          ) : (
            t("Pas de gaspillage évident. Le plan sert surtout à sécuriser et simplifier.", "No obvious waste. The plan mostly helps secure and simplify.")
          )}
        </p>
        <p className="text-sm text-white/50 leading-relaxed max-w-xl">
          {sparringLine}
        </p>
        <button
          onClick={() => onNavigate?.("actions")}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-[hsl(222,44%,17%)] text-sm font-semibold hover:bg-white/90 transition-colors"
        >
          {t("Commencer par mes actions", "Start with my actions")}
          <ArrowRight className="w-4 h-4" />
        </button>
        </div>
      </div>

      {/* ─── 1b. GO7 INTELLIGENCE READ ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="border border-border bg-card rounded-xl p-4 space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Layers3 className="w-4 h-4" />
            {t("Profil stack", "Stack profile")}
          </div>
          <p className="text-sm font-semibold text-foreground">{t(profile.labelFr, profile.labelEn)}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t(profile.summaryFr, profile.summaryEn)}</p>
        </div>
        <div className="border border-border bg-card rounded-xl p-4 space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Gauge className="w-4 h-4" />
            {t("Maturité", "Maturity")}
          </div>
          <p className="text-sm font-semibold text-foreground">{t(maturity.labelFr, maturity.labelEn)}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t(maturity.summaryFr, maturity.summaryEn)}</p>
        </div>
        <div className="border border-border bg-card rounded-xl p-4 space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CheckCircle2 className="w-4 h-4" />
            {t("Qualité diagnostic", "Diagnostic quality")}
          </div>
          <p className="text-sm font-semibold text-foreground">
            {t(confidence.labelFr, confidence.labelEn)}
            <span className="text-muted-foreground font-['DM_Mono'] ml-1">({confidence.score}/100)</span>
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t(confidence.summaryFr, confidence.summaryEn)}</p>
        </div>
        <div className={`border rounded-xl p-4 space-y-2 ${riskTone}`}>
          <div className="inline-flex items-center gap-2 text-xs font-medium">
            <ShieldAlert className="w-4 h-4" />
            {t("Risque principal", "Primary risk")}
          </div>
          <p className="text-sm font-semibold">
            {primaryRisk ? t(primaryRisk.labelFr, primaryRisk.labelEn) : t("Rien de bloquant", "Nothing blocking")}
          </p>
          <p className="text-xs leading-relaxed opacity-80">
            {primaryRisk
              ? t(primaryRisk.detailFr, primaryRisk.detailEn)
              : t("La stack ne montre pas de signal rouge majeur.", "The stack shows no major red flag.")}
          </p>
        </div>
      </div>

      <div className="border border-border rounded-xl bg-muted/30 px-4 py-3">
        <p className="text-sm text-foreground leading-relaxed">
          <span className="font-medium">{t(personaContext.labelFr, personaContext.labelEn)}</span>
          {" · "}
          <span className="text-muted-foreground">{t(personaContext.angleFr, personaContext.angleEn)}</span>
        </p>
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
                    <ToolLogo tool={tool} size={32} className="rounded-lg" />
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
