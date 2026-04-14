import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { SessionState, Tool, Cluster, DoubleRule } from "@/types/diagnostic";
import DiagClusterRoadmap from "./DiagClusterRoadmap";

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

/** Alias map for cluster tool_ids that don't match the tools table IDs */
const TOOL_ID_ALIASES: Record<string, string> = {
  "photoshop": "adobe-photoshop",
  "illustrator": "adobe-illustrator",
  "lightroom": "adobe-lightroom",
  "premiere-pro": "adobe-premiere-pro",
  "after-effects": "adobe-after-effects",
  "adobe-creative-cloud": "adobe-cc",
};

/** Pretty-print a tool ID into a display name */
function prettifyId(id: string): string {
  return id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Create a minimal fallback Tool for IDs not in the catalog */
function createFallbackTool(id: string): Tool {
  return {
    id,
    name: prettifyId(id),
    price: 0,
    category: "",
    functional_needs: [],
    tool_type: "satellite",
    usage: "medium",
    prescription_quality: "oui",
    force_silence: false,
  };
}

export default function DiagStep4Clusters({ session, onUpdate, onNext, onPrev, clusters, tools, doublonRules, t }: Props) {
  // Build fast lookup map: id → Tool, including aliases
  const toolMap = useMemo(() => {
    const map = new Map<string, Tool>();
    tools.forEach((t) => map.set(t.id, t));
    // Register aliases pointing to existing tools
    Object.entries(TOOL_ID_ALIASES).forEach(([alias, realId]) => {
      const tool = map.get(realId);
      if (tool) map.set(alias, tool);
    });
    return map;
  }, [tools]);

  /** Resolve a tool_id to a Tool — alias → exact → fallback */
  const resolveTool = useCallback(
    (id: string): Tool => {
      return toolMap.get(id) || createFallbackTool(id);
    },
    [toolMap]
  );

  const personaClusters = useMemo(
    () => clusters.filter((c) => c.persona === session.persona).sort((a, b) => a.order - b.order),
    [clusters, session.persona]
  );
  const [clusterIdx, setClusterIdx] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
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

  // Navigation guard: disable "Next" for 1.5s or until first interaction
  const [hasInteracted, setHasInteracted] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const currentCluster = personaClusters[clusterIdx];

  // Reset interaction state on cluster change
  useEffect(() => {
    setHasInteracted(false);
    setTimerDone(false);
    timerRef.current = setTimeout(() => setTimerDone(true), 3000);
    return () => clearTimeout(timerRef.current);
  }, [clusterIdx]);

  const canProceed = hasInteracted || timerDone;

  // Tools available for current cluster — uses alias resolution + fallback
  const clusterTools = useMemo(() => {
    if (!currentCluster) return [];
    return currentCluster.tool_ids.map((id) => resolveTool(id));
  }, [currentCluster, resolveTool]);

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
          const toolNames = rule.ids
            .map((id) => tools.find((t) => t.id === id)?.name)
            .filter(Boolean)
            .join(" + ");
          toast.error(
            `🔴 ${toolNames} — ${rule.message} (${t("économie potentielle", "potential savings")}: ${rule.savings}€/${t("mois", "mo")})`,
            { duration: 6000 }
          );
        }
      });
    },
    [doublonRules, t, tools]
  );

  // Animated card refs for micro bounce
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const toggleTool = (toolId: string) => {
    setHasInteracted(true);
    setAnimatingId(toolId);
    setTimeout(() => setAnimatingId(null), 200);

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) next.delete(toolId);
      else {
        next.add(toolId);
        checkDoublons(next);
      }
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
    setHasInteracted(true);
  };

  // Sync back to session when moving forward — resolve via alias map
  const syncSession = () => {
    const selected = Array.from(selectedIds).map((id) => resolveTool(id));
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
    syncSession();
    if (clusterIdx > 0) setClusterIdx((i) => i - 1);
    else onPrev();
  };

  // All selected tools for the right panel — resolve via alias map
  const selectedToolsList = useMemo(
    () => Array.from(selectedIds).map((id) => resolveTool(id)),
    [selectedIds, resolveTool]
  );

  const totalCost = useMemo(
    () => selectedToolsList.reduce((sum, t) => sum + t.price, 0),
    [selectedToolsList]
  );

  // Dynamic time estimate
  const clustersLeft = personaClusters.length - clusterIdx;
  const baseMinutes = Math.max(1, Math.ceil(clustersLeft * 0.5));
  const dynamicMinutes = selectedIds.size > 15
    ? baseMinutes + 2
    : selectedIds.size < 5
    ? Math.max(1, baseMinutes - 1)
    : baseMinutes;

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
      <div className="flex-1 space-y-5">
        {/* Cluster roadmap dots */}
        <DiagClusterRoadmap
          clusters={personaClusters}
          currentIdx={clusterIdx}
          tools={tools}
          onGoTo={(i) => { syncSession(); setClusterIdx(i); }}
          t={t}
        />

        {/* Time estimate */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {clusterIdx + 1}/{personaClusters.length}
          </span>
          <span>
            ~{dynamicMinutes} min {t("restantes", "remaining")}
          </span>
        </div>

        {/* Question (user-centric) */}
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-bold text-foreground leading-snug">
            {session.language === "en" && currentCluster.question_en
              ? currentCluster.question_en
              : currentCluster.question}
          </h2>
          {currentCluster.why && session.language !== "en" && (
            <p className="text-sm text-muted-foreground">{currentCluster.why}</p>
          )}
          {/* Reassuring microcopy */}
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            {t(
              "Sélectionne uniquement ce que tu utilises vraiment — même occasionnellement. Si un outil n'est pas là, il apparaîtra dans un prochain cluster ou tu pourras l'ajouter.",
              "Only select tools you actually use — even occasionally. If a tool isn't here, it'll appear in a later step or you can add it."
            )}
          </p>
        </div>

        {/* Tool grid — 3 cols desktop, 2 cols mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {clusterTools.map((tool) => {
            const isSelected = selectedIds.has(tool.id);
            const isAnimating = animatingId === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => toggleTool(tool.id)}
                className={`relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 transition-all duration-150 text-center
                  ${isAnimating ? "scale-[0.97]" : "scale-100"}
                  ${isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/40"
                  }`}
              >
                {/* Checkmark */}
                {isSelected && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
                {/* Logo */}
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-xl font-bold text-foreground shrink-0">
                  {tool.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-sm text-foreground leading-tight">{tool.name}</span>
                <span className={`text-xs font-mono ${tool.price === 0 ? "text-green-600 font-semibold" : "text-muted-foreground"}`}>
                  {tool.price === 0 ? t("Gratuit", "Free") : `${tool.price}€/${t("mois", "mo")}`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom tool — expandable */}
        <div>
          {!showCustomInput ? (
            <button
              onClick={() => { setShowCustomInput(true); setHasInteracted(true); }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {t("Tu ne vois pas ton outil ici ? Ajoute-le →", "Don't see your tool here? Add it →")}
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end p-3 rounded-lg border border-border bg-muted/30">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={t("Nom de l'outil", "Tool name")}
                maxLength={100}
                className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="€/mois"
                min={0}
                max={9999}
                className="w-24 rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={addCustomTool}
                disabled={customName.trim().length < 2}
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm font-medium disabled:opacity-40"
              >
                {t("Ajouter", "Add")}
              </button>
            </div>
          )}
        </div>

        {/* Custom tools chips */}
        {customTools.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customTools.map((ct, i) => (
              <span key={i} className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                {ct.name} — {ct.price}€
              </span>
            ))}
          </div>
        )}

        {/* Skip message */}
        <p className="text-xs text-muted-foreground/60 text-center">
          {t(
            "Tu n'utilises aucun de ces outils ? C'est normal — passe à l'étape suivante.",
            "Don't use any of these tools? That's fine — skip to the next step."
          )}
        </p>

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <button
            onClick={handlePrev}
            className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            ← {t("Précédent", "Previous")}
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`rounded-xl px-6 py-3 text-sm font-semibold transition-all
              ${canProceed
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
          >
            {clusterIdx < personaClusters.length - 1
              ? t("Suivant →", "Next →")
              : t("Terminer →", "Finish →")}
          </button>
        </div>
      </div>

      {/* Right panel — live stack list (desktop only) */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-24 rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-bold text-foreground text-sm">
            {t("Ta stack", "Your stack")} ({selectedIds.size})
          </h3>

          {/* Scrollable tool list */}
          <div className="max-h-[45vh] overflow-y-auto space-y-1 -mx-1 px-1">
            {selectedToolsList.length === 0 && (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                {t("Aucun outil sélectionné", "No tools selected")}
              </p>
            )}
            {selectedToolsList.map((tool) => (
              <button
                key={tool.id}
                onClick={() => toggleTool(tool.id)}
                className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted/50 transition-colors group animate-fade-in"
              >
                <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                  {tool.name.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 text-xs text-foreground truncate">{tool.name}</span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {tool.price === 0 ? t("Gratuit", "Free") : `${tool.price}€`}
                </span>
                <span className="text-muted-foreground/0 group-hover:text-destructive text-xs transition-colors">×</span>
              </button>
            ))}
          </div>

          {/* Total */}
          {selectedToolsList.length > 0 && (
            <div className="pt-3 border-t border-border flex justify-between text-sm">
              <span className="font-medium text-foreground">Total</span>
              <span className="font-mono font-bold text-foreground">{totalCost}€/{t("mois", "mo")}</span>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
