import { useState, useCallback } from "react";
import type { DiagnosticResult, Tool } from "@/types/diagnostic";
import DashOverview from "./DashOverview";
import DashGaspillage from "./DashGaspillage";
import DashStackUtile from "./DashStackUtile";
import DashOptimisations from "./DashOptimisations";
import DashActions from "./DashActions";
import DashShareModal from "./DashShareModal";
import { insertDiagnosticStepEvent } from "@/lib/diagnosticPersistence";
import { formatMonthlyTotal } from "@/utils/diagnosticPricing";
import { ArrowLeft, BookOpenText, CheckCircle, ChevronRight, Flame, ListChecks, Menu, Rocket, X } from "lucide-react";

type Tab = "overview" | "gaspillage" | "stack" | "optimiser" | "actions";

interface Props {
  result: DiagnosticResult;
  allTools: Tool[];
  t: (fr: string, en: string) => string;
  dbSessionId?: string | null;
  dbSessionToken?: string | null;
}

const TABS: {
  id: Tab;
  icon: typeof BookOpenText;
  labelFr: string;
  labelEn: string;
  descriptionFr: string;
  descriptionEn: string;
}[] = [
  {
    id: "overview",
    icon: BookOpenText,
    labelFr: "Rapport",
    labelEn: "Report",
    descriptionFr: "La lecture guidée : contexte, verdict, priorités.",
    descriptionEn: "The guided read: context, verdict, priorities.",
  },
  {
    id: "actions",
    icon: ListChecks,
    labelFr: "Plan d’action",
    labelEn: "Action plan",
    descriptionFr: "Les décisions à prendre dans le bon ordre.",
    descriptionEn: "The decisions to make in the right order.",
  },
  {
    id: "stack",
    icon: CheckCircle,
    labelFr: "Preuves stack",
    labelEn: "Stack evidence",
    descriptionFr: "Ce qui compose le socle utile et ce qui mérite d’être clarifié.",
    descriptionEn: "What makes up the useful core and what deserves clarification.",
  },
  {
    id: "gaspillage",
    icon: Flame,
    labelFr: "Points à revoir",
    labelEn: "Review points",
    descriptionFr: "Les chevauchements, abonnements peu utilisés et signaux faibles.",
    descriptionEn: "Overlaps, low-usage subscriptions and weak signals.",
  },
  {
    id: "optimiser",
    icon: Rocket,
    labelFr: "Options prudentes",
    labelEn: "Careful options",
    descriptionFr: "Des pistes prudentes, seulement après les priorités.",
    descriptionEn: "Careful options, only after priorities.",
  },
];

export default function DiagDashboard({ result, allTools, t, dbSessionId, dbSessionToken }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const trackRestitution = useCallback((eventName: string, eventPayload: Record<string, unknown> = {}) => {
    if (!dbSessionId || !dbSessionToken) return;
    void insertDiagnosticStepEvent(dbSessionId, dbSessionToken, {
      stepId: 12,
      eventName,
      eventPayload: {
        ...eventPayload,
        active_tab: activeTab,
        health_score: result.healthScore,
        selected_tool_count: result.sessionState.selectedTools.length,
      },
      source: "web",
      lang: result.sessionState.language,
      persona: result.sessionState.persona,
    });
  }, [activeTab, dbSessionId, dbSessionToken, result.healthScore, result.sessionState.language, result.sessionState.persona, result.sessionState.selectedTools.length]);

  const navigate = useCallback((tab: Tab) => {
    setActiveTab(tab);
    if (dbSessionId && dbSessionToken) {
      void insertDiagnosticStepEvent(dbSessionId, dbSessionToken, {
        stepId: 12,
        eventName: "restitution_tab_viewed",
        eventPayload: {
          from_tab: activeTab,
          to_tab: tab,
          health_score: result.healthScore,
          selected_tool_count: result.sessionState.selectedTools.length,
        },
        source: "web",
        lang: result.sessionState.language,
        persona: result.sessionState.persona,
      });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab, dbSessionId, dbSessionToken, result.healthScore, result.sessionState.language, result.sessionState.persona, result.sessionState.selectedTools.length]);

  const renderPage = () => {
    switch (activeTab) {
      case "overview":
        return (
          <DashOverview
            result={result}
            t={t}
            onShare={() => {
              trackRestitution("restitution_share_opened", { trigger: "overview" });
              setShowShare(true);
            }}
            onNavigate={navigate}
            onTrack={trackRestitution}
          />
        );
      case "gaspillage":
        return <DashGaspillage result={result} allTools={allTools} t={t} />;
      case "stack":
        return <DashStackUtile result={result} t={t} />;
      case "optimiser":
        return <DashOptimisations result={result} allTools={allTools} t={t} onNavigate={navigate} />;
      case "actions":
        return <DashActions result={result} allTools={allTools} t={t} onNavigate={navigate} dbSessionId={dbSessionId} dbSessionToken={dbSessionToken} />;
    }
  };

  // Mini donut for sidebar
  const miniDonutProgress = (result.healthScore / 100) * (2 * Math.PI * 16);
  const miniDonutCirc = 2 * Math.PI * 16;
  const donutColor =
    result.healthScore >= 80 ? "hsl(var(--keep))" :
    result.healthScore >= 60 ? "hsl(45 93% 47%)" :
    result.healthScore >= 40 ? "hsl(25 95% 53%)" :
    "hsl(var(--destructive))";
  const activeTabMeta = TABS.find((tab) => tab.id === activeTab) || TABS[0];
  const activeTabIndex = TABS.findIndex((tab) => tab.id === activeTab);
  const nextTab = activeTabIndex >= 0 && activeTabIndex < TABS.length - 1 ? TABS[activeTabIndex + 1] : null;
  const ActiveIcon = activeTabMeta.icon;
  const monthlyCostLabel = formatMonthlyTotal(result.sessionState.selectedTools, t);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div>
          <span className="block text-sm font-semibold text-foreground">
            {t("Restitution", "Restitution")}
          </span>
          <span className="text-xs text-muted-foreground">ToolTrim</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 rounded-lg hover:bg-muted">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-border bg-card px-2 py-2 space-y-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { navigate(tab.id); setMobileOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="min-w-0">
                <span className="block">{t(tab.labelFr, tab.labelEn)}</span>
                <span className="block truncate text-xs opacity-70">{t(tab.descriptionFr, tab.descriptionEn)}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] min-h-screen border-r border-border bg-card p-3 gap-1 shrink-0 sticky top-0 h-screen">
        <div className="mb-4 px-2">
          <p className="text-sm font-bold text-foreground">
            {t("Restitution", "Restitution")}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("Lis d’abord le rapport. Les autres vues servent de preuves.", "Read the report first. The other views are evidence.")}
          </p>
        </div>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
              activeTab === tab.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4 shrink-0" />
            <span className="min-w-0">
              <span className="block">{t(tab.labelFr, tab.labelEn)}</span>
              <span className="mt-0.5 block truncate text-[11px] font-normal opacity-70">
                {t(tab.descriptionFr, tab.descriptionEn)}
              </span>
            </span>
          </button>
        ))}

        {/* Mini health donut + summary */}
        <div className="mt-auto pt-4 px-2 border-t border-border space-y-3">
          <div className="flex items-center gap-2.5">
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
              <circle
                cx="20" cy="20" r="16" fill="none"
                stroke={donutColor} strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${miniDonutProgress} ${miniDonutCirc}`}
                transform="rotate(-90 20 20)"
              />
              <text x="20" y="23" textAnchor="middle" className="fill-foreground text-[10px] font-bold font-['DM_Mono']" fontSize="10">
                {result.healthScore}
              </text>
            </svg>
            <div className="text-xs">
              <p className="font-medium text-foreground">{result.healthLabel}</p>
              <p className="text-muted-foreground">{result.sessionState.selectedTools.length} {t("outils", "tools")}</p>
            </div>
          </div>
          <div className="text-xs space-y-0.5 text-muted-foreground">
            <p className="font-['DM_Mono']">{monthlyCostLabel}/{t("mois", "mo")}</p>
            {result.estimatedWaste > 0 && (
              <p className="text-destructive font-medium">
                {t("gains possibles à vérifier", "possible gains to verify")}
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
          {activeTab !== "overview" && (
            <div className="mb-6 rounded-xl border border-border bg-card p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => navigate("overview")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {t("Retour au rapport", "Back to report")}
                  </button>
                  <div className="mt-3 flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <ActiveIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-lg font-bold text-foreground">{t(activeTabMeta.labelFr, activeTabMeta.labelEn)}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {t(activeTabMeta.descriptionFr, activeTabMeta.descriptionEn)}
                      </p>
                    </div>
                  </div>
                </div>
                {nextTab && (
                  <button
                    type="button"
                    onClick={() => navigate(nextTab.id)}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    {t("Suite", "Next")} : {t(nextTab.labelFr, nextTab.labelEn)}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
          {renderPage()}
        </div>
      </main>

      {/* Share modal */}
      {showShare && (
        <DashShareModal
          result={result}
          t={t}
          onClose={() => setShowShare(false)}
          onTrack={trackRestitution}
        />
      )}
    </div>
  );
}
