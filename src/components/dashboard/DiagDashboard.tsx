import { useState, useCallback } from "react";
import type { DiagnosticResult, Tool } from "@/types/diagnostic";
import DashOverview from "./DashOverview";
import DashGaspillage from "./DashGaspillage";
import DashStackUtile from "./DashStackUtile";
import DashOptimisations from "./DashOptimisations";
import DashActions from "./DashActions";
import DashShareModal from "./DashShareModal";
import { Eye, Flame, CheckCircle, Rocket, ListChecks, Menu, X } from "lucide-react";

type Tab = "overview" | "gaspillage" | "stack" | "optimiser" | "actions";

interface Props {
  result: DiagnosticResult;
  allTools: Tool[];
  t: (fr: string, en: string) => string;
  dbSessionId?: string | null;
}

const TABS: { id: Tab; icon: typeof Eye; labelFr: string; labelEn: string }[] = [
  { id: "overview", icon: Eye, labelFr: "Aperçu", labelEn: "Overview" },
  { id: "gaspillage", icon: Flame, labelFr: "Gaspillage", labelEn: "Waste" },
  { id: "stack", icon: CheckCircle, labelFr: "Stack utile", labelEn: "Useful Stack" },
  { id: "optimiser", icon: Rocket, labelFr: "Optimiser", labelEn: "Optimize" },
  { id: "actions", icon: ListChecks, labelFr: "Mes actions", labelEn: "My Actions" },
];

export default function DiagDashboard({ result, allTools, t, dbSessionId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const navigate = useCallback((tab: Tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const renderPage = () => {
    switch (activeTab) {
      case "overview":
        return (
          <DashOverview
            result={result}
            t={t}
            onShare={() => setShowShare(true)}
            onNavigate={navigate}
          />
        );
      case "gaspillage":
        return <DashGaspillage result={result} allTools={allTools} t={t} />;
      case "stack":
        return <DashStackUtile result={result} t={t} />;
      case "optimiser":
        return <DashOptimisations result={result} allTools={allTools} t={t} onNavigate={navigate} />;
      case "actions":
        return <DashActions result={result} allTools={allTools} t={t} onNavigate={navigate} dbSessionId={dbSessionId} />;
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <span className="font-semibold text-sm text-foreground font-['DM_Mono']">
          {t("Résultats", "Results")}
        </span>
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
              {t(tab.labelFr, tab.labelEn)}
            </button>
          ))}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[200px] min-h-screen border-r border-border bg-card p-3 gap-1 shrink-0 sticky top-0 h-screen">
        <div className="mb-4 px-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("Diagnostic", "Diagnostic")}
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
            {t(tab.labelFr, tab.labelEn)}
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
            <p className="font-['DM_Mono']">{result.stackTotalCost}€/{t("mois", "mo")}</p>
            {result.estimatedWaste > 0 && (
              <p className="text-destructive font-medium font-['DM_Mono']">
                -{result.estimatedWaste}€ {t("gaspillé", "wasted")}
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
          {renderPage()}
        </div>
      </main>

      {/* Share modal */}
      {showShare && <DashShareModal result={result} t={t} onClose={() => setShowShare(false)} />}
    </div>
  );
}
