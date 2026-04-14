import { useState, useMemo, useCallback } from "react";
import type { DiagnosticResult, Prescription, Tool } from "@/types/diagnostic";
import { Check } from "lucide-react";
import DashPdfExport from "./DashPdfExport";

interface Props {
  result: DiagnosticResult;
  allTools: Tool[];
  t: (fr: string, en: string) => string;
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

  // NOW — phase 1 certified
  for (const p of prescriptions.phase1) {
    const tool = toolMap.get(p.toolId);
    items.push({
      id: `now-${p.toolId}`,
      prescription: p,
      tool,
      label: p.verdict === "downgrade"
        ? t(`Downgrade ${tool?.name ?? p.toolId}`, `Downgrade ${tool?.name ?? p.toolId}`)
        : t(`Annuler ${tool?.name ?? p.toolId}`, `Cancel ${tool?.name ?? p.toolId}`),
      savings: p.savingsEstimate,
      timeMinutes: 5,
      urgency: "now",
    });
  }

  // NOW — doublons from phase 3
  for (const p of prescriptions.phase3.filter((pr) => pr.type === "doublon" || pr.type === "doublon-ia")) {
    const tool = toolMap.get(p.toolId);
    items.push({
      id: `now-dbl-${p.toolId}`,
      prescription: p,
      tool,
      label: t(`Résoudre doublon : ${tool?.name ?? p.toolId}`, `Fix duplicate: ${tool?.name ?? p.toolId}`),
      savings: p.savingsEstimate,
      timeMinutes: 5,
      urgency: "now",
    });
  }

  // WEEK — phase 2 reviews + dormants
  for (const p of prescriptions.phase2) {
    const tool = toolMap.get(p.toolId);
    items.push({
      id: `week-${p.toolId}`,
      prescription: p,
      tool,
      label: t(`Vérifier ${tool?.name ?? p.toolId} — alternative gratuite dispo`, `Review ${tool?.name ?? p.toolId} — free alternative available`),
      savings: p.savingsEstimate,
      timeMinutes: 30,
      urgency: "week",
    });
  }

  for (const p of prescriptions.phase3.filter((pr) => pr.type === "dormant")) {
    const tool = toolMap.get(p.toolId);
    items.push({
      id: `week-dorm-${p.toolId}`,
      prescription: p,
      tool,
      label: t(`Auditer ${tool?.name ?? p.toolId} (outil fantôme)`, `Audit ${tool?.name ?? p.toolId} (ghost tool)`),
      savings: p.savingsEstimate,
      timeMinutes: 15,
      urgency: "week",
    });
  }

  // MONTH — recommendations
  for (const rec of recommendations.slice(0, 3)) {
    items.push({
      id: `month-rec-${rec.id}`,
      tool: rec,
      label: t(`Explorer ${rec.name} pour optimiser ta stack`, `Explore ${rec.name} to optimize your stack`),
      savings: 0,
      timeMinutes: 120,
      urgency: "month",
    });
  }

  return items;
}

const URGENCY_CONFIG = {
  now: {
    labelFr: "🔴 MAINTENANT",
    labelEn: "🔴 NOW",
    subtitleFr: "Urgence critique — moins de 5 min par action",
    subtitleEn: "Critical — less than 5 min per action",
    borderCls: "border-l-destructive",
    badgeCls: "bg-destructive/10 text-destructive",
  },
  week: {
    labelFr: "🟠 CETTE SEMAINE",
    labelEn: "🟠 THIS WEEK",
    subtitleFr: "À traiter dans les 7 jours",
    subtitleEn: "Handle within 7 days",
    borderCls: "border-l-orange-500",
    badgeCls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  month: {
    labelFr: "🔵 CE MOIS",
    labelEn: "🔵 THIS MONTH",
    subtitleFr: "Non-urgent mais impactant",
    subtitleEn: "Non-urgent but impactful",
    borderCls: "border-l-primary",
    badgeCls: "bg-primary/10 text-primary",
  },
} as const;

export default function DashActions({ result, allTools, t }: Props) {
  const actions = useMemo(() => buildActions(result, allTools, t), [result, allTools, t]);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const totalSavings = actions.reduce((s, a) => s + a.savings, 0);
  const recoveredSavings = actions.filter((a) => checked.has(a.id)).reduce((s, a) => s + a.savings, 0);
  const progress = actions.length > 0 ? Math.round((checked.size / actions.length) * 100) : 0;

  const grouped = {
    now: actions.filter((a) => a.urgency === "now"),
    week: actions.filter((a) => a.urgency === "week"),
    month: actions.filter((a) => a.urgency === "month"),
  };

  const sparringMessage = useMemo(() => {
    const { firstName } = result.sessionState;
    if (grouped.now.length > 0) {
      return t(
        `Les ${grouped.now.length} actions MAINTENANT, c'est un bon début ${firstName}. Après : cherche les swaps smart. Set une alerte pour revoir ta stack dans 3 mois.`,
        `The ${grouped.now.length} NOW actions are a great start ${firstName}. Next: check the smart swaps. Set a reminder to review your stack in 3 months.`
      );
    }
    return t(
      `Ta stack est déjà propre ${firstName} ! Garde un œil sur les outils À SURVEILLER ce mois-ci.`,
      `Your stack is already clean ${firstName}! Keep an eye on the WATCH items this month.`
    );
  }, [result, grouped.now.length, t]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">{t("Mes actions", "My Actions")}</h2>

      {/* Progress counter */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            💰 <span className="font-['DM_Mono']">{totalSavings}€</span> {t("à récupérer", "to recover")}
          </p>
          <p className="text-xs text-muted-foreground">
            {checked.size}/{actions.length} {t("actions", "actions")}
          </p>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[hsl(var(--keep))] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {recoveredSavings > 0 && (
          <p className="text-xs text-[hsl(var(--keep))] font-['DM_Mono']">
            ✓ {recoveredSavings}€/{t("mois", "mo")} {t("récupérés", "recovered")}
          </p>
        )}
      </div>

      {/* Timeline sections */}
      {(["now", "week", "month"] as const).map((urgency) => {
        const items = grouped[urgency];
        if (items.length === 0) return null;
        const cfg = URGENCY_CONFIG[urgency];
        return (
          <div key={urgency} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badgeCls}`}>
                {t(cfg.labelFr, cfg.labelEn)}
              </span>
              <span className="text-xs text-muted-foreground">{t(cfg.subtitleFr, cfg.subtitleEn)}</span>
            </div>
            <div className="space-y-1.5">
              {items.map((action) => (
                <button
                  key={action.id}
                  onClick={() => toggle(action.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 bg-card border border-border text-left transition-all ${cfg.borderCls} ${
                    checked.has(action.id) ? "opacity-50" : ""
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    checked.has(action.id)
                      ? "bg-[hsl(var(--keep))] border-[hsl(var(--keep))]"
                      : "border-border"
                  }`}>
                    {checked.has(action.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm text-foreground ${checked.has(action.id) ? "line-through" : ""}`}>
                      {action.tool && (
                        <span className="inline-flex items-center gap-1 mr-1.5">
                          <span className="w-4 h-4 rounded bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                            {action.tool.name.charAt(0)}
                          </span>
                        </span>
                      )}
                      {action.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                    {action.savings > 0 && (
                      <span className="font-['DM_Mono'] text-[hsl(var(--keep))]">{action.savings}€</span>
                    )}
                    <span>{action.timeMinutes < 60 ? `${action.timeMinutes} min` : `${Math.round(action.timeMinutes / 60)}h`}</span>
                  </div>
                </button>
              ))}
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

      {/* Sparring partner */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm text-foreground leading-relaxed">{sparringMessage}</p>
        <p className="text-xs text-muted-foreground mt-3 italic">— {t("Ton sparring partner", "Your sparring partner")}</p>
      </div>

      {/* Export button */}
      <DashPdfExport result={result} t={t} />
    </div>
  );
}
