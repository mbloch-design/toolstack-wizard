import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import type { DiagnosticResult, Prescription, Tool } from "@/types/diagnostic";
import { updateDiagnosticSession } from "@/lib/diagnosticPersistence";
import { Check, CheckCircle2, ChevronRight, ExternalLink, Target } from "lucide-react";
import DashPdfExport from "./DashPdfExport";
import ToolLogo from "@/components/ToolLogo";
import { formatMoney, getPricingAudit } from "@/utils/diagnosticPricing";



type Tab = "overview" | "gaspillage" | "stack" | "optimiser" | "actions";

interface Props {
  result: DiagnosticResult;
  allTools: Tool[];
  t: (fr: string, en: string) => string;
  onNavigate?: (tab: Tab) => void;
  dbSessionId?: string | null;
  dbSessionToken?: string | null;
}

interface ActionItem {
  id: string;
  prescription?: Prescription;
  tool?: Tool;
  label: string;
  detail: string;
  evidenceTab?: Tab;
  savings: number;
  timeMinutes: number;
  urgency: "now" | "week" | "month";
}

const ACTIONS_STORAGE_PREFIX = "tooltrim.diagnostic.actions.";

function getActionStorageKey(sessionId?: string | null) {
  return sessionId ? `${ACTIONS_STORAGE_PREFIX}${sessionId}` : null;
}

function readStoredActionIds(sessionId?: string | null) {
  const key = getActionStorageKey(sessionId);
  if (!key || typeof window === "undefined") return new Set<string>();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function writeStoredActionIds(sessionId: string | null | undefined, ids: string[]) {
  const key = getActionStorageKey(sessionId);
  if (!key || typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(ids));
}

function formatActionSavings(action: ActionItem, t: Props["t"]) {
  if (action.savings <= 0) return null;
  const audit = action.tool ? getPricingAudit(action.tool, t) : null;
  if (!action.tool || audit?.needsVerification) return t("gain à vérifier", "gain to verify");
  const currency = action.tool?.priceCurrency || action.tool?.catalogMonthlyPriceCurrency;
  const label = formatMoney(action.savings, currency);
  return currency ? label : `${label} ${t("à vérifier", "to verify")}`;
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
      label: p.type === "pricing-tier"
        ? t(`Vérifier le plan de ${tool?.name ?? p.toolId}`, `Review ${tool?.name ?? p.toolId} plan`)
        : p.verdict === "downgrade"
        ? t(`Passer ${tool?.name ?? p.toolId} sur un plan inférieur`, `Move ${tool?.name ?? p.toolId} to a lower plan`)
        : t(`Annuler ${tool?.name ?? p.toolId}`, `Cancel ${tool?.name ?? p.toolId}`),
      detail: p.message,
      evidenceTab: p.type === "pricing-tier" ? "stack" : "gaspillage",
      savings: p.savingsEstimate, timeMinutes: 5, urgency: "now",
    });
  }
  for (const p of prescriptions.phase3.filter((pr) => pr.type === "doublon" || pr.type === "doublon-ia")) {
    const tool = toolMap.get(p.toolId);
    items.push({
      id: `now-dbl-${p.toolId}`,
      prescription: p, tool,
      label: t(`Résoudre doublon : ${tool?.name ?? p.toolId}`, `Fix duplicate: ${tool?.name ?? p.toolId}`),
      detail: p.message,
      evidenceTab: "gaspillage",
      savings: p.savingsEstimate, timeMinutes: 5, urgency: "now",
    });
  }

  // WEEK — phase 2 reviews + dormants
  for (const p of prescriptions.phase2) {
    const tool = toolMap.get(p.toolId);
    items.push({
      id: `week-${p.toolId}`,
      prescription: p, tool,
      label: p.type === "pricing-tier"
        ? t(`Tester le bon palier pour ${tool?.name ?? p.toolId}`, `Test the right tier for ${tool?.name ?? p.toolId}`)
        : t(`Vérifier ${tool?.name ?? p.toolId}`, `Review ${tool?.name ?? p.toolId}`),
      detail: p.message,
      evidenceTab: p.type === "pricing-tier" ? "stack" : "gaspillage",
      savings: p.savingsEstimate, timeMinutes: 30, urgency: "week",
    });
  }
  for (const p of prescriptions.phase3.filter((pr) => pr.type === "dormant")) {
    const tool = toolMap.get(p.toolId);
    items.push({
      id: `week-dorm-${p.toolId}`,
      prescription: p, tool,
      label: t(`Auditer ${tool?.name ?? p.toolId} (peu utilisé)`, `Audit ${tool?.name ?? p.toolId} (low usage)`),
      detail: p.message,
      evidenceTab: "gaspillage",
      savings: p.savingsEstimate, timeMinutes: 15, urgency: "week",
    });
  }

  for (const signal of result.insights.answerSignals.filter((item) => item.source === "closing")) {
    items.push({
      id: `signal-${signal.id}`,
      label: t(signal.actionFr, signal.actionEn),
      detail: t(signal.detailFr, signal.detailEn),
      evidenceTab: "overview",
      savings: 0,
      timeMinutes: signal.severity === "high" ? 20 : 30,
      urgency: signal.severity === "low" ? "month" : "week",
    });
  }

  // MONTH — recommendations
  for (const rec of recommendations.slice(0, 3)) {
    items.push({
      id: `month-rec-${rec.id}`,
      tool: rec,
      label: t(`Explorer ${rec.name}`, `Explore ${rec.name}`),
      detail: t(
        "À considérer seulement si cela répond à un besoin réel identifié dans le diagnostic.",
        "Consider only if it answers a real need identified in the diagnostic."
      ),
      evidenceTab: "optimiser",
      savings: 0, timeMinutes: 120, urgency: "month",
    });
  }

  return items;
}

const URGENCY_CONFIG = {
  now: {
    labelFr: "À faire d’abord", labelEn: "Do first",
    subtitleFr: "Les décisions les plus simples à traiter", subtitleEn: "The simplest decisions to handle",
    pillCls: "bg-destructive text-white",
    borderCls: "border-l-destructive",
  },
  week: {
    labelFr: "À vérifier", labelEn: "Check",
    subtitleFr: "À clarifier quand tu as un peu de temps", subtitleEn: "Clarify when you have a little time",
    pillCls: "bg-orange-500 text-white",
    borderCls: "border-l-orange-500",
  },
  month: {
    labelFr: "Plus tard", labelEn: "Later",
    subtitleFr: "Pas urgent, mais utile pour progresser", subtitleEn: "Not urgent, but useful to improve",
    pillCls: "bg-primary text-primary-foreground",
    borderCls: "border-l-primary",
  },
} as const;

export default function DashActions({ result, allTools, t, onNavigate, dbSessionId, dbSessionToken }: Props) {
  const { prefix } = useLang();
  const actions = useMemo(() => buildActions(result, allTools, t), [result, allTools, t]);
  const [checked, setChecked] = useState<Set<string>>(() => readStoredActionIds(dbSessionId));
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const updateTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setChecked(readStoredActionIds(dbSessionId));
  }, [dbSessionId]);

  useEffect(() => {
    return () => {
      if (updateTimer.current) clearTimeout(updateTimer.current);
    };
  }, []);

  const persistActions = useCallback((next: Set<string>) => {
    const completedIds = Array.from(next);
    const completedActions = actions.filter((action) => next.has(action.id));
    writeStoredActionIds(dbSessionId, completedIds);
    if (!dbSessionId || !dbSessionToken) return;
    if (updateTimer.current) clearTimeout(updateTimer.current);
    updateTimer.current = setTimeout(async () => {
      try {
        await updateDiagnosticSession(dbSessionId, dbSessionToken, {
          actions_completed: completedIds.length,
          action_state: {
            completed_action_ids: completedIds,
            completed_action_count: completedIds.length,
            total_action_count: actions.length,
            completed_action_labels: completedActions.map((action) => action.label),
            pricing_policy: "source_currency_or_verify",
            updated_at: new Date().toISOString(),
            version: "v2",
          },
        });
      } catch (err) {
        console.error("[DiagActions] Update failed:", err);
      }
    }, 1000);
  }, [actions, dbSessionId, dbSessionToken]);

  const toggle = useCallback((action: ActionItem) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(action.id)) { next.delete(action.id); setLastChecked(null); }
      else { next.add(action.id); setLastChecked(action.label); }
      persistActions(next);
      return next;
    });
  }, [persistActions, t]);

  const completedCount = checked.size;
  const progressPct = actions.length > 0 ? Math.round((completedCount / actions.length) * 100) : 0;
  const nextAction = actions.find((action) => !checked.has(action.id)) || actions[0] || null;

  const grouped = {
    now: actions.filter((a) => a.urgency === "now"),
    week: actions.filter((a) => a.urgency === "week"),
    month: actions.filter((a) => a.urgency === "month"),
  };

  // Progress-aware sparring message
  const sparringMessage = useMemo(() => {
    const firstName = result.sessionState.firstName?.trim();
    const nameFr = firstName ? `${firstName}, ` : "";
    const nameEn = firstName ? `${firstName}, ` : "";
    if (completedCount === 0 && grouped.now.length > 0) {
      return t(
        `${nameFr}commence par la première section. Elle rassemble les décisions les plus faciles à prendre.`,
        `${nameEn}start with the first section. It contains the easiest decisions to make.`
      );
    }
    if (progressPct < 50) {
      return t(
        `${nameFr}bon début. Continue avec les actions qui ont le plus d’impact.`,
        `${nameEn}good start. Continue with the highest-impact actions.`
      );
    }
    if (progressPct < 100) {
      return t(
        `${nameFr}il reste seulement quelques points à verrouiller.`,
        `${nameEn}only a few points left to lock in.`
      );
    }
    return t(
      `${nameFr}ta première passe est terminée. Reviens quand ta stack évolue.`,
      `${nameEn}your first pass is complete. Come back when your stack evolves.`
    );
  }, [result.sessionState, completedCount, progressPct, grouped.now.length, t]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase text-primary">{t("Plan guidé", "Guided plan")}</p>
        <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
          {t("Les décisions à prendre, dans le bon ordre.", "The decisions to make, in the right order.")}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t(
            "Le but n’est pas de tout faire maintenant. Commence par les actions les plus évidentes, puis garde le reste comme checklist.",
            "The goal is not to do everything now. Start with the clearest actions, then keep the rest as a checklist."
          )}
        </p>
      </header>

      {nextAction && (
        <NextActionCard
          action={nextAction}
          isDone={checked.has(nextAction.id)}
          onToggle={() => toggle(nextAction)}
          onNavigate={onNavigate}
          prefix={prefix}
          t={t}
        />
      )}

      <div className="bg-[hsl(var(--navy,222_44%_17%))] rounded-2xl p-6 text-white space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-white/60">{t("Avancement du plan", "Plan progress")}</p>
            <p className="text-3xl md:text-4xl font-bold font-['DM_Mono']">
              {completedCount}<span className="text-lg text-white/40"> / {actions.length}</span>
            </p>
          </div>
          {lastChecked && (
            <span className="text-sm font-['DM_Mono'] text-[hsl(var(--keep))] animate-in fade-in duration-300">
              {t("Action traitée", "Action handled")}
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
            {t("Commence par la première section. Elle contient les arbitrages les plus rapides.", "Start with the first section. It contains the fastest decisions.")}
          </p>
        )}
        {completedCount > 0 && (
          <p className="text-xs text-white/50">
            {completedCount}/{actions.length} {t("actions complétées", "actions completed")}
          </p>
        )}
      </div>

      {result.insights.focusAreas.length > 0 && (
        <div className="border border-border rounded-xl bg-card p-4 space-y-3">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Target className="w-4 h-4" />
            {t("Pourquoi cet ordre ?", "Why this order?")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {result.insights.focusAreas.slice(0, 4).map((focus) => (
              <div key={focus.id} className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{t(focus.labelFr, focus.labelEn)}</p>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{focus.priority}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{t(focus.actionFr, focus.actionEn)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
                {t(cfg.labelFr, cfg.labelEn)}
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
                      onClick={() => toggle(action)}
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
                      <ToolLogo tool={action.tool} size={32} className="rounded-lg" />
                    )}

                    {/* Label */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium text-foreground ${isDone ? "line-through text-muted-foreground" : ""}`}>
                        {action.label}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {action.detail}
                      </p>
                    </div>

                    {/* Savings & time */}
                    <div className="flex items-center gap-3 shrink-0">
                      {action.savings > 0 && (
                        <span className={`text-sm font-bold font-['DM_Mono'] ${isDone ? "text-[hsl(var(--keep))]" : "text-[hsl(var(--keep))]"}`}>
                          {formatActionSavings(action, t)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {action.timeMinutes < 60 ? `${action.timeMinutes}min` : `${Math.round(action.timeMinutes / 60)}h`}
                      </span>
                      {/* Link to tool page */}
                      {action.tool && (
                        <Link
                          to={`${prefix}/tool/${action.tool.id}`}
                          className="p-1 rounded hover:bg-muted"
                          title={t("Voir la fiche outil", "View tool page")}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
                        </Link>
                      )}
                      {/* Link to waste detail */}
                      {action.evidenceTab && (
                        <button
                          onClick={() => onNavigate?.(action.evidenceTab)}
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
          <p className="text-sm">{t("Aucune action requise — ta stack est clean !", "No actions required — your stack is clean!")}</p>
        </div>
      )}

      {/* ─── 5. SPARRING PARTNER ─── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm text-foreground leading-relaxed">{sparringMessage}</p>
        <p className="text-xs text-muted-foreground mt-2">{t("Lecture ToolTrim", "ToolTrim read")}</p>
      </div>

      {/* Export */}
      <DashPdfExport result={result} t={t} variant="outline" />
    </div>
  );
}

interface NextActionCardProps {
  action: ActionItem;
  isDone: boolean;
  onToggle: () => void;
  onNavigate?: (tab: Tab) => void;
  prefix: string;
  t: Props["t"];
}

function NextActionCard({ action, isDone, onToggle, onNavigate, prefix, t }: NextActionCardProps) {
  const savingsLabel = formatActionSavings(action, t);

  return (
    <section className="rounded-xl border border-primary/20 bg-primary/5 p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-3">
          {action.tool ? (
            <ToolLogo tool={action.tool} size={40} className="rounded-lg" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Target className="h-4 w-4" />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              {t("Prochaine action utile", "Next useful action")}
            </p>
            <h2 className="mt-1 text-lg font-semibold leading-tight text-foreground">{action.label}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{action.detail}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-background px-2.5 py-1">
                {action.timeMinutes < 60 ? `${action.timeMinutes}min` : `${Math.round(action.timeMinutes / 60)}h`}
              </span>
              {savingsLabel && (
                <span className="rounded-full border border-border bg-background px-2.5 py-1 font-['DM_Mono']">
                  {savingsLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
          <button
            onClick={onToggle}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              isDone
                ? "bg-[hsl(var(--keep))] text-white"
                : "bg-foreground text-background hover:bg-foreground/90"
            }`}
          >
            {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            {isDone ? t("Déjà fait", "Done") : t("Marquer comme fait", "Mark as done")}
          </button>
          {action.evidenceTab && (
            <button
              onClick={() => onNavigate?.(action.evidenceTab)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              {t("Voir la preuve", "See evidence")}
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {action.tool && (
            <Link
              to={`${prefix}/tool/${action.tool.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              {t("Fiche outil", "Tool page")}
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
