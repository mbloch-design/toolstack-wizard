import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { SessionState, Tool, Cluster, DoubleRule } from "@/types/diagnostic";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  onPrev: () => void;
  clusters: Cluster[];
  tools: Tool[];
  doublonRules: DoubleRule[];
  t: (fr: string, en: string) => string;
}

const LOCALSTORAGE_KEY = "diag_selected_tools";

export default function DiagStep4Clusters({ session, onUpdate, onNext, onPrev, clusters, tools, doublonRules, t }: Props) {
  const personaClusters = useMemo(
    () => clusters.filter((c) => c.persona === session.persona).sort((a, b) => a.order - b.order),
    [clusters, session.persona]
  );

  const [clusterIdx, setClusterIdx] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    // Restore from localStorage or session
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEY);
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set(session.selectedTools.map((t) => t.id));
  });

  const [customTools, setCustomTools] = useState<{ name: string; price: number }[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const currentCluster = personaClusters[clusterIdx];

  // Tools available for current cluster
  const clusterTools = useMemo(() => {
    if (!currentCluster) return [];
    return currentCluster.tool_ids
      .map((id) => tools.find((t) => t.id === id))
      .filter(Boolean) as Tool[];
  }, [currentCluster, tools]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(Array.from(selectedIds)));
    } catch {}
  }, [selectedIds]);

  // Doublon detection
  const checkDoublons = useCallback(
    (newIds: Set<string>) => {
      doublonRules.forEach((rule) => {
        const match = rule.ids.every((id) => newIds.has(id));
        if (match) {
          toast.error(
            `🔴 ${t("DOUBLON DÉTECTÉ", "DUPLICATE DETECTED")} — ${rule.message} — ${t("Économies", "Savings")}: ${rule.savings}€/${t("mois", "mo")}`,
            { duration: 5000 }
          );
        }
      });
    },
    [doublonRules, t]
  );

  const toggleTool = (toolId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) next.delete(toolId);
      else next.add(toolId);
      checkDoublons(next);
      return next;
    });
  };

  const addCustomTool = () => {
    const name = customName.trim();
    if (name.length < 2 || name.length > 100) return;
    const price = parseFloat(customPrice) || 0;
    setCustomTools((prev) => [...prev, { name, price }]);
    setCustomName("");
    setCustomPrice("");
    setShowCustomInput(false);
  };

  // Sync back to session when moving forward
  const syncSession = () => {
    const selected = tools.filter((t) => selectedIds.has(t.id));
    onUpdate({ selectedTools: selected });
  };

  const handleNext = () => {
    syncSession();
    if (clusterIdx < personaClusters.length - 1) {
      setClusterIdx((i) => i + 1);
    } else {
      onNext();
    }
  };

  const handlePrev = () => {
    if (clusterIdx > 0) setClusterIdx((i) => i - 1);
    else onPrev();
  };

  // Stats
  const totalCost = useMemo(
    () => tools.filter((t) => selectedIds.has(t.id)).reduce((sum, t) => sum + t.price, 0),
    [tools, selectedIds]
  );

  const doublonSavings = useMemo(
    () => doublonRules.filter((r) => r.ids.every((id) => selectedIds.has(id))).reduce((sum, r) => sum + r.savings, 0),
    [doublonRules, selectedIds]
  );

  if (!currentCluster || personaClusters.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        {t("Aucun cluster disponible pour ton profil.", "No clusters available for your profile.")}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[50vh]">
      {/* Main area */}
      <div className="flex-1 space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("Cluster", "Cluster")} {clusterIdx + 1}/{personaClusters.length}
          </span>
          <span>
            ~{Math.ceil((personaClusters.length - clusterIdx) * 0.5)} min {t("restantes", "remaining")}
          </span>
        </div>
        <div className="flex gap-1">
          {personaClusters.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= clusterIdx ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Question */}
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            {session.language === "en" && currentCluster.question_en
              ? currentCluster.question_en
              : currentCluster.question}
          </h2>
          {currentCluster.why && (
            <p className="text-sm text-muted-foreground">{currentCluster.why}</p>
          )}
        </div>

        {/* Tool grid */}
        <div className={`grid gap-3 ${currentCluster.cols >= 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
          {clusterTools.map((tool) => {
            const isSelected = selectedIds.has(tool.id);
            return (
              <button
                key={tool.id}
                onClick={() => toggleTool(tool.id)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all text-center
                  ${isSelected
                    ? "border-primary bg-accent shadow-sm"
                    : "border-border bg-card hover:border-primary/40"
                  }`}
              >
                {/* Logo fallback */}
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg font-bold text-foreground shrink-0">
                  {tool.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-sm text-foreground leading-tight">{tool.name}</span>
                <span className={`text-xs font-mono ${tool.price === 0 ? "text-green-600" : "text-muted-foreground"}`}>
                  {tool.price === 0 ? t("Gratuit", "Free") : `${tool.price}€/${t("mois", "mo")}`}
                </span>
                {isSelected && (
                  <span className="text-xs text-primary font-bold">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom tool */}
        {!showCustomInput ? (
          <button
            onClick={() => setShowCustomInput(true)}
            className="text-sm text-primary hover:underline font-medium"
          >
            + {t("Outil non listé", "Unlisted tool")}
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={t("Nom de l'outil", "Tool name")}
              maxLength={100}
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="number"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="€/mois"
              min={0}
              max={9999}
              className="w-24 rounded-lg border border-border bg-card px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={addCustomTool}
              disabled={customName.trim().length < 2}
              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm font-medium
                         disabled:opacity-40"
            >
              {t("Ajouter", "Add")}
            </button>
          </div>
        )}

        {/* Custom tools list */}
        {customTools.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customTools.map((ct, i) => (
              <span key={i} className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                {ct.name} — {ct.price}€
              </span>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button
            onClick={handlePrev}
            className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground
                       hover:bg-muted transition-colors"
          >
            ← {t("Précédent", "Previous")}
          </button>
          <button
            onClick={handleNext}
            className="rounded-xl bg-primary px-6 py-3 text-primary-foreground text-sm font-semibold
                       hover:opacity-90 transition-opacity"
          >
            {clusterIdx < personaClusters.length - 1
              ? t("Suivant →", "Next →")
              : t("Terminer →", "Finish →")}
          </button>
        </div>
      </div>

      {/* Right panel — desktop only */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-24 rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-bold text-foreground text-sm">
            {t("Ta stack actuelle", "Your current stack")}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("Outils", "Tools")}</span>
              <span className="font-mono font-semibold text-foreground">{selectedIds.size}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("Coût mensuel", "Monthly cost")}</span>
              <span className="font-mono font-semibold text-foreground">{totalCost}€</span>
            </div>
            {doublonSavings > 0 && (
              <div className="flex justify-between text-destructive">
                <span>{t("Gaspillage doublons", "Duplicate waste")}</span>
                <span className="font-mono font-semibold">{doublonSavings}€</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
