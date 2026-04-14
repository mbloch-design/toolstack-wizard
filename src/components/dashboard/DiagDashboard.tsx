import { useState } from "react";
import type { DiagnosticResult, Tool } from "@/types/diagnostic";
import DashOverview from "./DashOverview";
import DashGaspillage from "./DashGaspillage";
import DashStackUtile from "./DashStackUtile";
import { Eye, Flame, CheckCircle, Rocket, ListChecks, Menu, X } from "lucide-react";

type Tab = "overview" | "gaspillage" | "stack" | "optimiser" | "actions";

interface Props {
  result: DiagnosticResult;
  allTools: Tool[];
  t: (fr: string, en: string) => string;
}

const TABS: { id: Tab; icon: typeof Eye; labelFr: string; labelEn: string }[] = [
  { id: "overview", icon: Eye, labelFr: "Aperçu", labelEn: "Overview" },
  { id: "gaspillage", icon: Flame, labelFr: "Gaspillage", labelEn: "Waste" },
  { id: "stack", icon: CheckCircle, labelFr: "Stack utile", labelEn: "Useful Stack" },
  { id: "optimiser", icon: Rocket, labelFr: "Optimiser", labelEn: "Optimize" },
  { id: "actions", icon: ListChecks, labelFr: "Mes actions", labelEn: "My Actions" },
];

export default function DiagDashboard({ result, allTools, t }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderPage = () => {
    switch (activeTab) {
      case "overview":
        return <DashOverview result={result} t={t} />;
      case "gaspillage":
        return <DashGaspillage result={result} allTools={allTools} t={t} />;
      case "stack":
        return <DashStackUtile result={result} t={t} />;
      case "optimiser":
        return (
          <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
            <p>{t("À venir — Prompt 6", "Coming soon — Prompt 6")}</p>
          </div>
        );
      case "actions":
        return (
          <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
            <p>{t("À venir — Prompt 6", "Coming soon — Prompt 6")}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
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
              onClick={() => { setActiveTab(tab.id); setMobileOpen(false); }}
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
      <aside className="hidden md:flex flex-col w-[200px] min-h-screen border-r border-border bg-card p-3 gap-1">
        <div className="mb-4 px-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("Diagnostic", "Diagnostic")}
          </p>
          <p className="text-lg font-bold text-foreground font-['DM_Mono'] mt-0.5">
            {result.healthScore}<span className="text-xs text-muted-foreground">/100</span>
          </p>
        </div>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

        {/* Summary card */}
        <div className="mt-auto pt-4 px-2 border-t border-border">
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>{result.sessionState.selectedTools.length} {t("outils", "tools")}</p>
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
    </div>
  );
}
