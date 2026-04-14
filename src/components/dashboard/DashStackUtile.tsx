import { useMemo } from "react";
import type { DiagnosticResult, Tool } from "@/types/diagnostic";
import type { ToolScore } from "@/utils/scoring";

interface Props {
  result: DiagnosticResult;
  t: (fr: string, en: string) => string;
}

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score > 70 ? "bg-[hsl(var(--keep))]/15 text-[hsl(var(--keep))]" :
    score > 50 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
    "bg-destructive/10 text-destructive";
  return (
    <span className={`text-xs font-['DM_Mono'] font-bold px-2 py-0.5 rounded-full ${cls}`}>
      {score}
    </span>
  );
}

function ToolCard({ tool, score, result, t }: { tool: Tool; score: ToolScore; result: DiagnosticResult; t: Props["t"] }) {
  const allP = [...result.prescriptions.phase1, ...result.prescriptions.phase2, ...result.prescriptions.phase3];
  const prescription = allP.find((p) => p.toolId === tool.id);
  const isReview = prescription?.verdict === "review";
  const isDowngrade = prescription?.verdict === "downgrade";
  const isKeep = !prescription || prescription.verdict !== "cancel";

  // ROI bar
  const roiRatio = tool.price > 0 ? Math.min(100, Math.round((score.valueIndex / 100) * 100)) : 100;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
            {tool.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{tool.name}</p>
            <p className="text-xs font-['DM_Mono'] text-muted-foreground">
              {tool.price > 0 ? `${tool.price}€/${t("mois", "mo")}` : t("Gratuit", "Free")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ScoreBadge score={score.scoreFinal} />
          {isKeep && !isReview && !isDowngrade && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--keep))]/10 text-[hsl(var(--keep))] font-medium">
              ✓ {t("GARDER", "KEEP")}
            </span>
          )}
          {isReview && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">
              ⚠️ {t("À REVOIR", "REVIEW")}
            </span>
          )}
          {isDowngrade && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
              ↓ {t("DOWNGRADE", "DOWNGRADE")}
            </span>
          )}
        </div>
      </div>

      {/* ROI bar */}
      {tool.price > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("Ratio valeur/coût", "Value/cost ratio")}</span>
            <span className="font-['DM_Mono']">{roiRatio}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${roiRatio}%` }}
            />
          </div>
        </div>
      )}

      {/* Downgrade option */}
      {tool.downgrade_plan?.available && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
          {t("Plan alternatif", "Alternative plan")}: <strong>{tool.downgrade_plan.plan}</strong> → {tool.downgrade_plan.toPrice}€
          <span className="ml-1 font-['DM_Mono']">
            ({t("économie", "saves")} {tool.downgrade_plan.fromPrice - tool.downgrade_plan.toPrice}€)
          </span>
        </div>
      )}
    </div>
  );
}

function Section({ title, subtitle, tools, result, t }: { title: string; subtitle: string; tools: { tool: Tool; score: ToolScore }[]; result: DiagnosticResult; t: Props["t"] }) {
  if (tools.length === 0) return null;
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tools.map(({ tool, score }) => (
          <ToolCard key={tool.id} tool={tool} score={score} result={result} t={t} />
        ))}
      </div>
    </div>
  );
}

export default function DashStackUtile({ result, t }: Props) {
  const toolsWithScores = useMemo(() => {
    return result.sessionState.selectedTools
      .filter((tool) => {
        const allP = [...result.prescriptions.phase1, ...result.prescriptions.phase3];
        const p = allP.find((pr) => pr.toolId === tool.id);
        return !p || p.verdict !== "cancel";
      })
      .map((tool) => ({
        tool,
        score: result.toolScores.get(tool.id) || { pertinence: 50, valueIndex: 50, scoreFinal: 50 },
      }))
      .sort((a, b) => b.score.scoreFinal - a.score.scoreFinal);
  }, [result]);

  const core = toolsWithScores.filter(({ tool, score }) => tool.tool_type === "core" && score.scoreFinal > 70);
  const satellites = toolsWithScores.filter(
    ({ tool, score }) => ["satellite", "gestion", "ia"].includes(tool.tool_type) && score.scoreFinal > 50
  );
  const watch = toolsWithScores.filter(({ score }) => score.scoreFinal >= 40 && score.scoreFinal <= 50);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-foreground">{t("Ta stack utile", "Your useful stack")}</h2>

      <Section
        title={t("🏗️ Outils essentiels", "🏗️ Essential tools")}
        subtitle={t("Au cœur de ton activité", "Core to your work")}
        tools={core}
        result={result}
        t={t}
      />

      <Section
        title={t("🛰️ Satellites utiles", "🛰️ Useful satellites")}
        subtitle={t("Complètent bien ta stack", "Good stack additions")}
        tools={satellites}
        result={result}
        t={t}
      />

      <Section
        title={t("👁️ À surveiller", "👁️ Watch list")}
        subtitle={t("Usage correct mais valeur à vérifier", "OK usage but verify value")}
        tools={watch}
        result={result}
        t={t}
      />

      {toolsWithScores.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t("Aucun outil à garder identifié.", "No tools to keep identified.")}
        </p>
      )}
    </div>
  );
}
