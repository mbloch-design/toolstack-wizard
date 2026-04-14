import { useState, useMemo } from "react";
import type { DiagnosticResult, Tool } from "@/types/diagnostic";
import type { ToolScore } from "@/utils/scoring";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";

interface Props {
  result: DiagnosticResult;
  t: (fr: string, en: string) => string;
}

type FilterTab = "all" | "keep" | "review";

function ToolCard({ tool, score, result, t }: { tool: Tool; score: ToolScore; result: DiagnosticResult; t: Props["t"] }) {
  const [expanded, setExpanded] = useState(false);

  const allP = [...result.prescriptions.phase1, ...result.prescriptions.phase2, ...result.prescriptions.phase3];
  const prescription = allP.find((p) => p.toolId === tool.id);
  const isReview = prescription?.verdict === "review" || prescription?.verdict === "downgrade";
  const verdictLabel = isReview ? t("À revoir", "Review") : t("Garder", "Keep");
  const verdictCls = isReview
    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
    : "bg-[hsl(var(--keep))]/10 text-[hsl(var(--keep))]";
  const borderCls = isReview ? "border-l-orange-500" : "border-l-[hsl(var(--keep))]";

  const roiRatio = tool.price > 0 ? Math.min(100, Math.round((score.valueIndex / 100) * 100)) : 100;
  const barColor = score.scoreFinal > 70 ? "bg-[hsl(var(--keep))]" : score.scoreFinal > 50 ? "bg-yellow-500" : "bg-orange-500";

  return (
    <div className={`border border-border rounded-xl overflow-hidden border-l-4 ${borderCls} transition-all`}>
      {/* Collapsed row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <ToolLogo toolName={tool.name} toolSlug={tool.id} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{tool.name}</p>
          <p className="text-xs text-muted-foreground capitalize truncate">{tool.category}</p>
        </div>
        {/* Mini ROI bar */}
        <div className="hidden md:flex items-center gap-2 w-24">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${roiRatio}%` }} />
          </div>
          <span className="text-xs font-['DM_Mono'] text-muted-foreground w-8 text-right">{score.scoreFinal}</span>
        </div>
        <span className="text-xs font-['DM_Mono'] text-foreground shrink-0">
          {tool.price > 0 ? `${tool.price}€` : t("Gratuit", "Free")}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${verdictCls}`}>
          {verdictLabel}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border bg-muted/10">
          {/* Verdict reason */}
          {prescription && (
            <p className="text-sm text-foreground">{prescription.message}</p>
          )}
          {!prescription && (
            <p className="text-sm text-muted-foreground">
              {t("Cet outil est bien adapté à ton profil et correctement utilisé.", "This tool is well-suited to your profile and properly used.")}
            </p>
          )}

          {/* Downgrade */}
          {tool.downgrade_plan?.available && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
              <div className="flex-1">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {t("Plan", "Plan")} <strong>{tool.downgrade_plan.plan}</strong> → {tool.downgrade_plan.toPrice}€/{t("mois", "mo")}
                  <span className="ml-1 font-['DM_Mono']">
                    ({t("économie", "saves")} {tool.downgrade_plan.fromPrice - tool.downgrade_plan.toPrice}€)
                  </span>
                </p>
              </div>
              <button className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
                {t("Voir", "View")} <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Free alternative */}
          {tool.freeAlternative && !tool.downgrade_plan?.available && (
            <div className="flex items-center gap-2 bg-[hsl(var(--keep))]/5 border border-[hsl(var(--keep))]/20 rounded-lg px-3 py-2">
              <p className="flex-1 text-xs text-foreground">
                <strong>{tool.freeAlternative}</strong> {t("fait la même chose gratuitement", "does the same thing for free")}
              </p>
              <button className="text-xs text-[hsl(var(--keep))] font-medium hover:underline flex items-center gap-1">
                {t("Voir", "View")} <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashStackUtile({ result, t }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const allP = useMemo(
    () => [...result.prescriptions.phase1, ...result.prescriptions.phase2, ...result.prescriptions.phase3],
    [result.prescriptions]
  );

  const toolsWithScores = useMemo(() => {
    return result.sessionState.selectedTools
      .filter((tool) => {
        const p = allP.find((pr) => pr.toolId === tool.id);
        return !p || p.verdict !== "cancel";
      })
      .map((tool) => {
        const score = result.toolScores.get(tool.id) || { pertinence: 50, valueIndex: 50, scoreFinal: 50 };
        const p = allP.find((pr) => pr.toolId === tool.id);
        const isReview = p?.verdict === "review" || p?.verdict === "downgrade";
        return { tool, score, isReview };
      })
      .sort((a, b) => b.score.scoreFinal - a.score.scoreFinal);
  }, [result, allP]);

  const keepCount = toolsWithScores.filter((t) => !t.isReview).length;
  const reviewCount = toolsWithScores.filter((t) => t.isReview).length;

  const filtered = useMemo(() => {
    if (activeFilter === "keep") return toolsWithScores.filter((t) => !t.isReview);
    if (activeFilter === "review") return toolsWithScores.filter((t) => t.isReview);
    return toolsWithScores;
  }, [toolsWithScores, activeFilter]);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: t("Tous", "All"), count: toolsWithScores.length },
    { key: "keep", label: `✓ ${t("À garder", "Keep")}`, count: keepCount },
    { key: "review", label: `⚠ ${t("À revoir", "Review")}`, count: reviewCount },
  ];

  return (
    <div className="space-y-5">
      {/* ─── Filter tabs ─── */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeFilter === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label} <span className="text-xs font-['DM_Mono'] ml-1">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* ─── Tool cards ─── */}
      <div className="space-y-2">
        {filtered.map(({ tool, score }) => (
          <ToolCard key={tool.id} tool={tool} score={score} result={result} t={t} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t("Aucun outil dans cette catégorie.", "No tools in this category.")}
        </p>
      )}

      {/* ─── Total footer ─── */}
      <div className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-3 border border-border">
        <p className="text-sm text-foreground">
          {t("Stack optimisée", "Optimized stack")}: <strong className="font-['DM_Mono']">{result.optimizedCost}€/{t("mois", "mo")}</strong>
        </p>
        <p className="text-xs text-muted-foreground">
          {t("Tu gardes", "You keep")} <strong>{toolsWithScores.length}</strong> {t("outils", "tools")}
        </p>
      </div>
    </div>
  );
}
