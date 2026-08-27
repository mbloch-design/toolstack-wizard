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
import { translateHealthLabel } from "@/utils/diagnosticLabels";
import { ArrowLeft, BookOpenText, CheckCircle, ChevronRight, Flame, ListChecks, Menu, RefreshCcw, Rocket, Search, X } from "@/lib/icons";

type Tab = "overview" | "gaspillage" | "stack" | "optimiser" | "actions";

interface Props {
  result: DiagnosticResult;
  allTools: Tool[];
  t: (fr: string, en: string) => string;
  dbSessionId?: string | null;
  dbSessionToken?: string | null;
  onRestart: () => void;
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

function getPersonaSidebarCopy(result: DiagnosticResult, t: Props["t"]) {
  if (result.sessionState.persona === "SOFIA") {
    return {
      label: t("Angle créatif", "Creative angle"),
      detail: t("Production, plugins, ressources, validation, licences.", "Production, plugins, resources, review, licenses."),
    };
  }
  if (result.sessionState.persona === "THEO") {
    return {
      label: t("Angle tech", "Tech angle"),
      detail: t("Livraison, automatisation, fiabilité, coût.", "Shipping, automation, reliability, cost."),
    };
  }
  if (result.sessionState.persona === "MARC") {
    return {
      label: t("Angle conseil", "Consulting angle"),
      detail: t("Clients, vente, livrables, suivi.", "Clients, sales, deliverables, follow-up."),
    };
  }
  if (result.sessionState.persona === "ALIX") {
    return {
      label: t("Angle contenu", "Content angle"),
      detail: t("Idée, production, publication, mesure.", "Idea, production, publishing, measurement."),
    };
  }
  return {
    label: t("Angle ops", "Ops angle"),
    detail: t("Process, pilotage, finance, transmission.", "Process, steering, finance, handoff."),
  };
}

export default function DiagDashboard({ result, allTools, t, dbSessionId, dbSessionToken, onRestart }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [sidebarQuery, setSidebarQuery] = useState("");

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

  const donutColor =
    result.healthScore >= 80 ? "hsl(var(--keep))" :
    result.healthScore >= 60 ? "hsl(45 93% 47%)" :
    result.healthScore >= 40 ? "hsl(25 95% 53%)" :
    "hsl(var(--destructive))";
  const activeTabMeta = TABS.find((tab) => tab.id === activeTab) || TABS[0];
  const activeTabIndex = TABS.findIndex((tab) => tab.id === activeTab);
  const nextTab = activeTabIndex >= 0 && activeTabIndex < TABS.length - 1 ? TABS[activeTabIndex + 1] : null;
  const ActiveIcon = activeTabMeta.icon;
  const monthlyCostLabel = formatMonthlyTotal(
    result.sessionState.selectedTools,
    t,
    result.sessionState.commercialContracts
  );
  const healthLabel = translateHealthLabel(result.healthLabel, t);
  const sidebarPersona = getPersonaSidebarCopy(result, t);
  const normalizedSidebarQuery = sidebarQuery.trim().toLowerCase();
  const sidebarTabs = normalizedSidebarQuery
    ? TABS.filter((tab) =>
        `${t(tab.labelFr, tab.labelEn)} ${t(tab.descriptionFr, tab.descriptionEn)}`
          .toLowerCase()
          .includes(normalizedSidebarQuery)
      )
    : TABS;
  const primarySidebarTabs = sidebarTabs.filter((tab) => tab.id === "overview" || tab.id === "actions" || tab.id === "stack");
  const reviewSidebarTabs = sidebarTabs.filter((tab) => tab.id === "gaspillage" || tab.id === "optimiser");

  return (
    <div className="flex min-h-[calc(100vh-32px)] flex-col bg-transparent md:flex-row">
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
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
        <div className="space-y-1 border-b border-border bg-background px-3 py-3 md:hidden">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { navigate(tab.id); setMobileOpen(false); }}
              className={`w-full grid grid-cols-[22px_1fr] items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="block min-w-0 truncate font-semibold">{t(tab.labelFr, tab.labelEn)}</span>
            </button>
          ))}
          <div className="mt-2 border-t border-border pt-2">
            <button
              type="button"
              onClick={onRestart}
              className="grid w-full grid-cols-[22px_1fr] items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RefreshCcw className="h-4 w-4" />
              <span className="font-semibold">{t("Nouveau diagnostic", "Start a new audit")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-[calc(100vh-32px)] w-[312px] shrink-0 flex-col overflow-y-auto border-r border-border bg-card/70 px-2 py-4 md:flex">
        <div className="px-3">
          <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-sm font-bold text-foreground shadow-sm">
              tt
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-tight text-foreground">tooltrim</p>
              <p className="truncate text-xs text-muted-foreground">{t("Restitution d’audit", "Audit restitution")}</p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-border bg-background px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {sidebarPersona.label}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">
              {sidebarPersona.detail}
            </p>
          </div>

          <label className="mt-4 flex h-11 items-center gap-2 rounded-2xl border border-border bg-background px-3 text-muted-foreground shadow-sm focus-within:border-foreground/30 focus-within:text-foreground">
            <Search className="h-4 w-4 shrink-0" />
            <input
              value={sidebarQuery}
              onChange={(event) => setSidebarQuery(event.target.value)}
              placeholder={t("Trouver une vue...", "Find a view...")}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>

        <nav className="mt-5 space-y-1 px-1.5" aria-label={t("Navigation de restitution", "Restitution navigation")}>
          {primarySidebarTabs.map((tab) => (
            <SidebarTab key={tab.id} tab={tab} activeTab={activeTab} navigate={navigate} t={t} />
          ))}

          {reviewSidebarTabs.length > 0 && primarySidebarTabs.length > 0 && (
            <div className="mx-3 my-3 h-px bg-border" />
          )}

          {reviewSidebarTabs.map((tab) => (
            <SidebarTab key={tab.id} tab={tab} activeTab={activeTab} navigate={navigate} t={t} />
          ))}

          {sidebarTabs.length === 0 && (
            <div className="mx-2 rounded-2xl border border-border bg-background px-3 py-4 text-sm text-muted-foreground">
              {t("Aucune vue trouvée.", "No view found.")}
            </div>
          )}
        </nav>

        <div className="mx-3 mt-auto border-t border-border pt-4">
          <div className="rounded-2xl bg-background p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {t("Score", "Score")}
              </span>
              <span className="font-['DM_Mono'] text-sm font-semibold text-foreground">{result.healthScore}/100</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(4, result.healthScore)}%`, backgroundColor: donutColor }}
              />
            </div>
            <p className="mt-2 truncate text-sm font-semibold text-foreground">{healthLabel}</p>
          </div>

          <div className="mt-3 space-y-2 px-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-3">
              <span>{t("Stack captée", "Captured stack")}</span>
              <span className="shrink-0 text-foreground">{result.sessionState.selectedTools.length} {t("outils", "tools")}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>{t("Budget", "Budget")}</span>
              <span className="shrink-0 font-['DM_Mono'] text-foreground">{monthlyCostLabel}/{t("mois", "mo")}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onRestart}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <RefreshCcw className="h-4 w-4" />
            {t("Nouveau diagnostic", "Start a new audit")}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
          {activeTab !== "overview" && (
            <div className="diagnostic-card mb-6 p-4">
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
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
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

function SidebarTab({
  tab,
  activeTab,
  navigate,
  t,
}: {
  tab: (typeof TABS)[number];
  activeTab: Tab;
  navigate: (tab: Tab) => void;
  t: Props["t"];
}) {
  return (
    <button
      onClick={() => navigate(tab.id)}
      className={`group grid h-11 w-full grid-cols-[22px_1fr] items-center gap-3 rounded-2xl px-3 text-left text-sm transition-colors ${
        activeTab === tab.id
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
      }`}
    >
      <span className="flex h-5 w-5 items-center justify-center">
        <tab.icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 overflow-hidden text-[15px]">
        <span className={`block truncate ${activeTab === tab.id ? "font-semibold" : "font-medium"}`}>
          {t(tab.labelFr, tab.labelEn)}
        </span>
      </span>
    </button>
  );
}
