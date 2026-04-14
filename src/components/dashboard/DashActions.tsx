import { useState, useMemo, useCallback } from "react";
import type { DiagnosticResult, Prescription, Tool } from "@/types/diagnostic";
import { Check, ChevronRight } from "lucide-react";
import DashPdfExport from "./DashPdfExport";
import ToolLogo from "@/components/ToolLogo";

type Tab = "overview" | "gaspillage" | "stack" | "optimiser" | "actions";

interface Props {
  result: DiagnosticResult;
  allTools: Tool[];
  t: (fr: string, en: string) => string;
  onNavigate?: (tab: Tab) => void;
}

interface ActionItem {
  id: string;
  prescription?: Prescription;
  tool?: Tool;
  label: string;
  savings: number;
  timeMinutes: number;
  urgency: "now" | "week" | "month";
}

function buildActions(result: DiagnosticResult, allTools: Tool[], t: Props["t"]): ActionItem[] {
  const { prescriptions, recommendations, sessionState } = result;
  const toolMap = new Map(sessionState.selectedTools.map((tl) => [tl.id, tl]));
  const items: ActionItem[] = [];

  // NOW — phase 1 certified + phase 3 doublons
  for (const p of prescriptions.phase1) {
    const tool = toolMap.get(p.toolId);
    items.push({
      id: `now-${p.toolId}`,
      prescription: p, tool,
      label: p.verdict === "downgrade"
        ? t(`Downgrade ${tool?.name ?? p.toolId}`, `Downgrade ${tool?.name ?? p.toolId}`)
        : t(`Annuler ${tool?.name ?? p.toolId}`, `Cancel ${tool?.name ?? p.toolId}`),
      savings: p.savingsEstimate, timeMinutes: 5, urgency: "now",
    });
  }
  for (const p of prescriptions.phase3.filter((pr) => pr.type === "doublon" || pr.type === "doublon-ia")) {
    const tool = toolMap.get(p.toolId);
    items.push({
      id: `now-dbl-${p.toolId}`,
      prescription: p, tool,
      label: t(`Résoudre doublon : ${tool?.name ?? p.toolId}`, `Fix duplicate: ${tool?.name ?? p.toolId}`),
      savings: p.savingsEstimate, timeMinutes: 5, urgency: "now",
    });
  }

  // WEEK — phase 2 reviews + dormants
  for (const p of prescriptions.phase2) {
    const tool = toolMap.get(p.toolId);
    items.push({
      id: `week-${p.toolId}`,
      prescription: p, tool,
      label: t(`Vérifier ${tool?.name ?? p.toolId}`, `Review ${tool?.name ?? p.toolId}`),
      savings: p.savingsEstimate, timeMinutes: 30, urgency: "week",
    });
  }
  for (const p of prescriptions.phase3.filter((pr) => pr.type === "dormant")) {
    const tool = toolMap.get(p.toolId);
    items.push({
      id: `week-dorm-${p.toolId}`,
      prescription: p, tool,
      label: t(`Auditer ${tool?.name ?? p.toolId} (fantôme)`, `Audit ${tool?.name ?? p.toolId} (ghost)`),
      savings: p.savingsEstimate, timeMinutes: 15, urgency: "week",
    });
  }

  // MONTH — recommendations
  for (const rec of recommendations.slice(0, 3)) {
    items.push({
      id: `month-rec-${rec.id}`,
      tool: rec,
      label: t(`Explorer ${rec.name}`, `Explore ${rec.name}`),
      savings: 0, timeMinutes: 120, urgency: "month",
    });
  }

  return items;
}

const URGENCY_CONFIG = {
  now: {
    labelFr: "MAINTENANT", labelEn: "NOW",
    subtitleFr: "Moins de 5 min par action", subtitleEn: "Less than 5 min per action",
    pillCls: "bg-destructive text-white",
    borderCls: "border-l-destructive",
  },
  week: {
    labelFr: "CETTE SEMAINE", labelEn: "THIS WEEK",
    subtitleFr: "À traiter dans les 7 jours", subtitleEn: "Handle within 7 days",
    pillCls: "bg-orange-500 text-white",
    borderCls: "border-l-orange-500",
  },
  month: {
    labelFr: "CE MOIS", labelEn: "THIS MONTH",
    subtitleFr: "Non-urgent mais impactant", subtitleEn: "Non-urgent but impactful",
    pillCls: "bg-primary text-primary-foreground",
    borderCls: "border-l-primary",
  },
} as const;

export default function DashActions({ result, allTools, t, onNavigate }: Props) {
  const actions = useMemo(() => buildActions(result, allTools, t), [result, allTools, t]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const toggle = useCallback((id: string, savings: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); setLastChecked(null); }
      else { next.add(id); setLastChecked(`${savings}€`); }
      return next;
    });
  }, []);

  const totalSavings = actions.reduce((s, a) => s + a.savings, 0);
  const recoveredSavings = actions.filter((a) => checked.has(a.id)).reduce((s, a) => s + a.savings, 0);
  const progressPct = totalSavings > 0 ? Math.round((recoveredSavings / totalSavings) * 100) : 0;
  const completedCount = checked.size;

  const grouped = {
    now: actions.filter((a) => a.urgency === "now"),
    week: actions.filter((a) => a.urgency === "week"),
    month: actions.filter((a) => a.urgency === "month"),
  };

  // Progress-aware sparring message
  const sparringMessage = useMemo(() => {
    const { firstName } = result.sessionState;
    if (completedCount === 0 && grouped.now.length > 0) {
      return t(
        `Commence par MAINTENANT ${firstName} — ça prend 5 min et tu récupères tout de suite.`,
        `Start with NOW ${firstName} — it takes 5 min and you save immediately.`
      );
    }
    if (progressPct < 50) {
      return t(
        `Bon début ${firstName} ! Continue avec les actions restantes.`,
        `Good start ${firstName}! Keep going with the remaining actions.`
      );
    }
    if (progressPct < 100) {
      return t(
        `Plus que quelques actions ${firstName}. Tu y es presque.`,
        `Just a few more actions ${firstName}. You're almost there.`
      );
    }
    return t(
      `Bravo ${firstName} ! Ta stack est optimisée. Reviens dans 3 mois pour un nouveau check.`,
      `Well done ${firstName}! Your stack is optimized. Come back in 3 months for a new check.`
    );
  }, [result.sessionState, completedCount, progressPct, grouped.now.length, t]);

  return (
    <div className="space-y-6">
      {/* ─── 1. MOTIVATING COUNTER ─── */}
      <div className="bg-[hsl(var(--navy,222_44%_17%))] rounded-2xl p-6 text-white space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-white/60">{t("Tu as récupéré", "You've recovered")}</p>
            <p className="text-3xl md:text-4xl font-bold font-['DM_Mono']">
              {recoveredSavings}€ <span className="text-lg text-white/40">/ {totalSavings}€</span>
            </p>
          </div>
          {lastChecked && (
            <span className="text-sm font-['DM_Mono'] text-[hsl(var(--keep))] animate-in fade-in duration-300">
              ✓ {lastChecked} {t("récupérés", "recovered")} !
            </span>
          )}
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[hsl(var(--keep))] transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {completedCount === 0 && grouped.now.length > 0 && (
          <p className="text-xs text-white/50">
            {t("Commence par MAINTENANT — ça prend 5 min", "Start with NOW — it takes 5 min")}
          </p>
        )}
        {completedCount > 0 && (
          <p className="text-xs text-white/50">
            {completedCount}/{actions.length} {t("actions complétées", "actions completed")}
          </p>
        )}
      </div>

      {/* ─── 2-4. URGENCY SECTIONS ─── */}
      {(["now", "week", "month"] as const).map((urgency) => {
        const items = grouped[urgency];
        if (items.length === 0) return null;
        const cfg = URGENCY_CONFIG[urgency];

        return (
          <div key={urgency} className="space-y-2">
            {/* Section header */}
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${cfg.pillCls}`}>
                ● {t(cfg.labelFr, cfg.labelEn)}
              </span>
              <span className="text-xs text-muted-foreground">{t(cfg.subtitleFr, cfg.subtitleEn)}</span>
            </div>

            {/* Action items */}
            <div className="space-y-1.5">
              {items.map((action) => {
                const isDone = checked.has(action.id);
                return (
                  <div
                    key={action.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 border border-border transition-all ${cfg.borderCls} ${
                      isDone ? "bg-[hsl(var(--keep))]/5 opacity-70" : "bg-card hover:bg-muted/30"
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggle(action.id, action.savings)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                        isDone
                          ? "bg-[hsl(var(--keep))] border-[hsl(var(--keep))] scale-105"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>

                    {/* Logo */}
                    {action.tool && (
                      <ToolLogo toolName={action.tool.name} toolSlug={action.tool.id} size="sm" />
                    )}

                    {/* Label */}
                    <p className={`flex-1 text-sm text-foreground min-w-0 ${isDone ? "line-through text-muted-foreground" : ""}`}>
                      {action.label}
                    </p>

                    {/* Savings & time */}
                    <div className="flex items-center gap-3 shrink-0">
                      {action.savings > 0 && (
                        <span className={`text-sm font-bold font-['DM_Mono'] ${isDone ? "text-[hsl(var(--keep))]" : "text-[hsl(var(--keep))]"}`}>
                          {action.savings}€
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {action.timeMinutes < 60 ? `${action.timeMinutes}min` : `${Math.round(action.timeMinutes / 60)}h`}
                      </span>
                      {/* Link to detail */}
                      {action.prescription && (
                        <button
                          onClick={() => onNavigate?.("gaspillage")}
                          className="p-1 rounded hover:bg-muted"
                          title={t("Voir pourquoi", "See why")}
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {actions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-sm">{t("Aucune action requise — ta stack est clean !", "No actions required — your stack is clean!")}</p>
        </div>
      )}

      {/* ─── 5. SPARRING PARTNER ─── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm text-foreground leading-relaxed">{sparringMessage}</p>
        <p className="text-xs text-muted-foreground mt-2 italic">— {t("Ton sparring partner", "Your sparring partner")}</p>
      </div>

      {/* Export */}
      <DashPdfExport result={result} t={t} variant="outline" />
    </div>
  );
}
