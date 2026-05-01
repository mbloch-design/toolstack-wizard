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

function prettifyId(id: string): string {
  return id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function createFallbackTool(id: string): Tool {
  return {
    id, name: prettifyId(id), price: 0, category: "", functional_needs: [],
    tool_type: "satellite", usage: "medium", prescription_quality: "oui", force_silence: false,
  };
}

// ─── Bundle metadata for display ──────────────────────────────────
const BUNDLE_DISPLAY: Record<string, { emoji: string; subtitle_fr: string; subtitle_en: string }> = {
  "adobe-cc": { emoji: "📦", subtitle_fr: "Suite complète Adobe", subtitle_en: "Full Adobe Suite" },
  "canva-pro": { emoji: "📦", subtitle_fr: "Inclut le générateur IA intégré", subtitle_en: "Includes built-in AI generator" },
  "microsoft-365": { emoji: "📦", subtitle_fr: "Inclut Teams, Word, Excel, PowerPoint, OneDrive", subtitle_en: "Includes Teams, Word, Excel, PowerPoint, OneDrive" },
  "zoom-pro": { emoji: "📦", subtitle_fr: "Inclut l'assistant IA de réunion", subtitle_en: "Includes AI meeting assistant" },
  "adobe-photoshop": { emoji: "📦", subtitle_fr: "Inclut Remove.bg", subtitle_en: "Includes Remove.bg" },
};

export default function DiagStep4Clusters({ session, onUpdate, onNext, onPrev, clusters, tools, doublonRules, t }: Props) {
  // ─── Tool lookup map ──────────────────────────────────────────
  const toolMap = useMemo(() => {
    const map = new Map<string, Tool>();
    tools.forEach((tool) => map.set(tool.id, tool));
    return map;
  }, [tools]);

  const resolveTool = useCallback(
    (id: string): Tool => toolMap.get(id) || createFallbackTool(id),
    [toolMap]
  );

  // ─── Bundle maps ──────────────────────────────────────────────
  const bundleChildrenMap = useMemo(() => {
    const map = new Map<string, string[]>();
    tools.forEach((tool) => {
      if (tool.bundle_parent) {
        const children = map.get(tool.bundle_parent) || [];
        children.push(tool.id);
        map.set(tool.bundle_parent, children);
      }
    });
    return map;
  }, [tools]);

  const childToParentMap = useMemo(() => {
    const map = new Map<string, string>();
    tools.forEach((tool) => {
      if (tool.bundle_parent) map.set(tool.id, tool.bundle_parent);
    });
    return map;
  }, [tools]);

  // ─── Clusters for current persona ────────────────────────────
  const personaClusters = useMemo(
    () => clusters.filter((c) => c.persona === session.persona).sort((a, b) => a.order - b.order),
    [clusters, session.persona]
  );

  const [clusterIdx, setClusterIdx] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEY);
      if (saved) return new Set(JSON.parse(saved));
    } catch {
      // Restore is best-effort; malformed storage falls back to the session tools.
    }
    return new Set(session.selectedTools.map((t) => t.id));
  });

  const [customTools, setCustomTools] = useState<{ name: string; price: number }[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const [hasInteracted, setHasInteracted] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const currentCluster = personaClusters[clusterIdx];

  useEffect(() => {
    setHasInteracted(false);
    setTimerDone(false);
    timerRef.current = setTimeout(() => setTimerDone(true), 3000);
    return () => clearTimeout(timerRef.current);
  }, [clusterIdx]);

  const canProceed = hasInteracted || timerDone;

  // ─── Bundle-aware derived state ──────────────────────────────
  const includedByBundle = useMemo(() => {
    const included = new Set<string>();
    for (const parentId of selectedIds) {
      const children = bundleChildrenMap.get(parentId);
      if (children) children.forEach((childId) => included.add(childId));
    }
    return included;
  }, [selectedIds, bundleChildrenMap]);

  // ─── Split cluster tools into bundles vs individual ──────────
  const { bundleTools, individualTools, relevantBundleParents } = useMemo(() => {
    if (!currentCluster) return { bundleTools: [] as Tool[], individualTools: [] as Tool[], relevantBundleParents: new Map<string, Tool[]>() };

    const clusterToolIds = new Set(currentCluster.tool_ids);
    const bundles: Tool[] = [];
    const individuals: Tool[] = [];
    // Map: parentId → children that appear in this cluster
    const parentChildrenInCluster = new Map<string, Tool[]>();

    for (const id of currentCluster.tool_ids) {
      const tool = resolveTool(id);
      const isParent = bundleChildrenMap.has(id);
      const parentId = childToParentMap.get(id);

      if (isParent) {
        bundles.push(tool);
      } else if (parentId && clusterToolIds.has(parentId)) {
        // Child whose parent is also in this cluster — skip from individuals, listed under bundle
        const arr = parentChildrenInCluster.get(parentId) || [];
        arr.push(tool);
        parentChildrenInCluster.set(parentId, arr);
      } else if (parentId && !clusterToolIds.has(parentId)) {
        // Child whose parent is NOT in this cluster — also track the parent as a "virtual bundle" to show
        // but display this tool as individual with a hint
        individuals.push(tool);
      } else {
        individuals.push(tool);
      }
    }

    // For bundles in the cluster, also gather ALL children (even those not in cluster tool_ids)
    const relevantParents = new Map<string, Tool[]>();
    for (const bundle of bundles) {
      const allChildren = bundleChildrenMap.get(bundle.id) || [];
      const childTools = allChildren.map((cid) => resolveTool(cid));
      // Merge with cluster-specific children
      const clusterChildren = parentChildrenInCluster.get(bundle.id) || [];
      const merged = new Map<string, Tool>();
      for (const ct of [...childTools, ...clusterChildren]) merged.set(ct.id, ct);
      relevantParents.set(bundle.id, Array.from(merged.values()));
    }

    return { bundleTools: bundles, individualTools: individuals, relevantBundleParents: relevantParents };
  }, [currentCluster, resolveTool, bundleChildrenMap, childToParentMap]);

  // ─── Upsell callout state ───────────────────────────────────
  const upsellInfo = useMemo(() => {
    if (!currentCluster) return null;
    // Check if there are children selected without their parent in this cluster
    const clusterToolIds = new Set(currentCluster.tool_ids);
    const byParent = new Map<string, string[]>();

    for (const id of clusterToolIds) {
      if (!selectedIds.has(id)) continue;
      const parentId = childToParentMap.get(id);
      if (parentId && !selectedIds.has(parentId)) {
        const arr = byParent.get(parentId) || [];
        arr.push(id);
        byParent.set(parentId, arr);
      }
    }

    for (const [parentId, childIds] of byParent) {
      if (childIds.length >= 2) {
        const parent = resolveTool(parentId);
        const childCost = childIds.reduce((s, cid) => s + resolveTool(cid).price, 0);
        const childNames = childIds.map((cid) => resolveTool(cid).name);
        const allChildren = bundleChildrenMap.get(parentId) || [];
        const otherCount = allChildren.length - childIds.length;
        return { parentId, parent, childIds, childNames, childCost, otherCount };
      }
    }
    return null;
  }, [currentCluster, selectedIds, childToParentMap, resolveTool, bundleChildrenMap]);

  // ─── Persist ────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(Array.from(selectedIds)));
    } catch {
      // Persistence is best-effort and should not block the diagnostic flow.
    }
  }, [selectedIds]);

  // ─── Doublon check ──────────────────────────────────────────
  const checkDoublons = useCallback(
    (newIds: Set<string>) => {
      doublonRules.forEach((rule) => {
        if (rule.ids.every((id) => newIds.has(id))) {
          const toolNames = rule.ids.map((id) => resolveTool(id).name).join(" + ");
          toast.error(
            `🔴 ${toolNames} — ${rule.message} (${t("économie potentielle", "potential savings")}: ${rule.savings}€/${t("mois", "mo")})`,
            { duration: 6000 }
          );
        }
      });
    },
    [doublonRules, t, resolveTool]
  );

  // ─── Bundle inverse doublon ─────────────────────────────────
  const checkBundleConflict = useCallback(
    (toolId: string, newIds: Set<string>) => {
      const parentId = childToParentMap.get(toolId);
      if (parentId && newIds.has(parentId)) {
        const parent = resolveTool(parentId);
        const child = resolveTool(toolId);
        toast.error(
          `🔴 ${child.name} ${t("est inclus dans", "is included in")} ${parent.name} — ${t("tu payes", "you're paying")} ${child.price}€ ${t("de trop", "too much")}`,
          { duration: 6000 }
        );
        return true;
      }
      const children = bundleChildrenMap.get(toolId);
      if (children) {
        const alreadySelected = children.filter((cid) => newIds.has(cid));
        if (alreadySelected.length > 0) {
          const parent = resolveTool(toolId);
          const savings = alreadySelected.reduce((s, cid) => s + resolveTool(cid).price, 0);
          const names = alreadySelected.map((cid) => resolveTool(cid).name).join(", ");
          toast.info(
            `💡 ${names} ${t("inclus dans", "included in")} ${parent.name} — ${savings}€/${t("mois", "mo")} ${t("d'économie potentielle", "potential savings")}`,
            { duration: 6000 }
          );
        }
      }
      return false;
    },
    [childToParentMap, bundleChildrenMap, resolveTool, t]
  );

  const toggleTool = (toolId: string) => {
    setHasInteracted(true);
    setAnimatingId(toolId);
    setTimeout(() => setAnimatingId(null), 200);

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
        checkBundleConflict(toolId, next);
        checkDoublons(next);
      }
      return next;
    });
  };

  const selectBundle = (parentId: string) => {
    setHasInteracted(true);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        // Deselect bundle
        next.delete(parentId);
      } else {
        // Select bundle — also remove individually-selected children (they're now included)
        next.add(parentId);
        const children = bundleChildrenMap.get(parentId) || [];
        for (const cid of children) {
          if (next.has(cid)) next.delete(cid); // remove child — now included via bundle
        }
      }
      return next;
    });
  };

  const addCustomTool = () => {
    const name = customName.trim();
    if (name.length < 2 || name.length > 100) return;
    const price = parseFloat(customPrice) || 0;
    setCustomTools((prev) => [...prev, { name, price }]);
    setCustomName(""); setCustomPrice(""); setShowCustomInput(false);
    setHasInteracted(true);
  };

  // ─── Sync to session with bundle awareness ──────────────────
  const syncSession = useCallback(() => {
    const selected: Tool[] = [];
    for (const id of selectedIds) {
      const tool = resolveTool(id);
      selected.push(tool);
    }
    // Add included-by-bundle children
    for (const id of includedByBundle) {
      if (!selectedIds.has(id)) {
        const tool = { ...resolveTool(id), includedInBundle: true, includedVia: childToParentMap.get(id) };
        selected.push({ ...tool, price: 0 });
      }
    }
    onUpdate({ selectedTools: selected });
  }, [selectedIds, includedByBundle, resolveTool, childToParentMap, onUpdate]);

  const handleNext = () => {
    syncSession();
    if (clusterIdx < personaClusters.length - 1) setClusterIdx((i) => i + 1);
    else onNext();
  };

  const handlePrev = () => {
    syncSession();
    if (clusterIdx > 0) setClusterIdx((i) => i - 1);
    else onPrev();
  };

  // ─── Right panel: grouped by bundle ─────────────────────────
  const rightPanelGroups = useMemo(() => {
    type PanelItem = { tool: Tool; bundled: boolean; bundleParentName?: string };
    type PanelGroup = { parentTool: Tool; children: Tool[]; type: "bundle" } | { tool: Tool; type: "standalone" };

    const groups: PanelGroup[] = [];
    const handledIds = new Set<string>();

    // First: bundles
    for (const id of selectedIds) {
      const children = bundleChildrenMap.get(id);
      if (children && children.length > 0) {
        const parentTool = resolveTool(id);
        const includedChildren = children.map((cid) => resolveTool(cid));
        groups.push({ parentTool, children: includedChildren, type: "bundle" });
        handledIds.add(id);
        children.forEach((cid) => handledIds.add(cid));
      }
    }

    // Then: standalone tools
    for (const id of selectedIds) {
      if (handledIds.has(id)) continue;
      // Skip children whose parent is selected (already handled)
      const parentId = childToParentMap.get(id);
      if (parentId && selectedIds.has(parentId)) continue;
      groups.push({ tool: resolveTool(id), type: "standalone" });
    }

    return groups;
  }, [selectedIds, bundleChildrenMap, childToParentMap, resolveTool]);

  const totalCost = useMemo(() => {
    let total = 0;
    for (const group of rightPanelGroups) {
      if (group.type === "bundle") total += group.parentTool.price;
      else total += group.tool.price;
    }
    return Math.round(total * 100) / 100;
  }, [rightPanelGroups]);

  const bundledCount = useMemo(() => {
    let count = 0;
    for (const group of rightPanelGroups) {
      if (group.type === "bundle") count += group.children.length;
    }
    return count;
  }, [rightPanelGroups]);

  // ─── Time estimate ──────────────────────────────────────────
  const clustersLeft = personaClusters.length - clusterIdx;
  const baseMinutes = Math.max(1, Math.ceil(clustersLeft * 0.5));
  const dynamicMinutes = selectedIds.size > 15 ? baseMinutes + 2 : selectedIds.size < 5 ? Math.max(1, baseMinutes - 1) : baseMinutes;

  if (!currentCluster || personaClusters.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        {t("Aucun cluster disponible pour ton profil.", "No clusters available for your profile.")}
      </div>
    );
  }

  const hasBundles = bundleTools.length > 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[50vh]">
      {/* Main area */}
      <div className="flex-1 space-y-5">
        <DiagClusterRoadmap
          clusters={personaClusters}
          currentIdx={clusterIdx}
          tools={tools}
          onGoTo={(i) => { syncSession(); setClusterIdx(i); }}
          t={t}
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{clusterIdx + 1}/{personaClusters.length}</span>
          <span>~{dynamicMinutes} min {t("restantes", "remaining")}</span>
        </div>

        {/* Question */}
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-bold text-foreground leading-snug">
            {session.language === "en" && currentCluster.question_en
              ? currentCluster.question_en
              : currentCluster.question}
          </h2>
          {currentCluster.why && session.language !== "en" && (
            <p className="text-sm text-muted-foreground">{currentCluster.why}</p>
          )}
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            {t(
              "Sélectionne uniquement ce que tu utilises vraiment — même occasionnellement.",
              "Only select tools you actually use — even occasionally."
            )}
          </p>
        </div>

        {/* ═══════════════ SECTION 1: BUNDLES ═══════════════ */}
        {hasBundles && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("Tu as une suite complète ?", "Do you have a full suite?")}
            </p>

            {bundleTools.map((bundle) => {
              const isSelected = selectedIds.has(bundle.id);
              const children = relevantBundleParents.get(bundle.id) || [];
              const displayMeta = BUNDLE_DISPLAY[bundle.id];

              return (
                <div key={bundle.id} className="space-y-2">
                  <button
                    onClick={() => selectBundle(bundle.id)}
                    className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-200
                      ${isSelected
                        ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                        : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{displayMeta?.emoji || "📦"}</span>
                          <span className="font-bold text-lg text-foreground">{bundle.name}</span>
                          <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-accent-foreground uppercase tracking-wide">
                            {t("Suite complète", "Full suite")}
                          </span>
                        </div>

                        {/* Children list */}
                        <div className="flex flex-wrap gap-1.5">
                          {children.map((child) => (
                            <span key={child.id} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-foreground/80">
                              {child.name}
                            </span>
                          ))}
                        </div>

                        {displayMeta && (
                          <p className="text-xs text-muted-foreground">
                            {session.language === "en" ? displayMeta.subtitle_en : displayMeta.subtitle_fr}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="font-mono font-bold text-lg text-foreground">
                          {bundle.price}€<span className="text-xs font-normal text-muted-foreground">/{t("mois", "mo")}</span>
                        </span>
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors
                          ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                          {isSelected && (
                            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CTA label */}
                    <div className={`mt-3 text-sm font-medium ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                      {isSelected
                        ? `✓ ${t("Abonné", "Subscribed")}`
                        : t("Je suis abonné", "I'm subscribed")}
                    </div>
                  </button>

                  {/* Confirmation message after selecting bundle */}
                  {isSelected && children.length > 0 && (
                    <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400 animate-fade-in">
                      ✓ {children.map((c) => c.name).join(", ")} {t(
                        "sont automatiquement inclus dans ta stack.",
                        "are automatically included in your stack."
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════════════ UPSELL CALLOUT ═══════════════ */}
        {upsellInfo && (
          <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-2 animate-fade-in">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              💡 {t("Tu as", "You have")} {upsellInfo.childNames.join(` + `)} ({upsellInfo.childCost}€/{t("mois", "mo")})
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {upsellInfo.parent.name} {t("à", "at")} {upsellInfo.parent.price}€/{t("mois", "mo")} {t(
                `inclut ces ${upsellInfo.childNames.length} apps`,
                `includes these ${upsellInfo.childNames.length} apps`
              )}{upsellInfo.otherCount > 0 && ` + ${upsellInfo.otherCount} ${t("autres", "more")}`}.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => selectBundle(upsellInfo.parentId)}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {t(`Passer à ${upsellInfo.parent.name}`, `Switch to ${upsellInfo.parent.name}`)}
              </button>
              <button
                onClick={() => setHasInteracted(true)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                {t("Garder à la carte", "Keep individual")}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ SECTION 2: INDIVIDUAL TOOLS ═══════════════ */}
        {individualTools.length > 0 && (
          <div className="space-y-3">
            {hasBundles && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("Ou des outils à la carte :", "Or individual tools:")}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {individualTools.map((tool) => {
                const isSelected = selectedIds.has(tool.id);
                const isAnimating = animatingId === tool.id;
                const isIncluded = includedByBundle.has(tool.id);
                const parentId = childToParentMap.get(tool.id);
                const parentSelected = parentId ? selectedIds.has(parentId) : false;
                const parentName = parentId ? resolveTool(parentId).name : "";

                // Included via bundle — non-clickable green badge
                if (isIncluded) {
                  return (
                    <div
                      key={tool.id}
                      className="relative flex flex-col items-center gap-2 rounded-xl border-2 border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20 p-4 text-center opacity-90"
                    >
                      <span className="absolute top-2 right-2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {t("Inclus", "Included")} ✓
                      </span>
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg font-bold text-foreground shrink-0">
                        {tool.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm text-foreground leading-tight">{tool.name}</span>
                      <span className="text-xs text-muted-foreground">
                        <span className="line-through">{tool.price}€</span>{" "}
                        <span className="text-green-600 font-semibold">{t("Inclus", "Included")}</span>
                      </span>
                      <span className="text-[10px] text-green-600/80">{parentName}</span>
                    </div>
                  );
                }

                // Normal selectable card
                return (
                  <button
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-150 text-center
                      ${isAnimating ? "scale-[0.97]" : "scale-100"}
                      ${isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/40"
                      }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg font-bold text-foreground shrink-0">
                      {tool.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm text-foreground leading-tight">{tool.name}</span>
                    <span className={`text-xs font-mono ${tool.price === 0 ? "text-green-600 font-semibold" : "text-muted-foreground"}`}>
                      {tool.price === 0 ? t("Gratuit", "Free") : `${tool.price}€/${t("mois", "mo")}`}
                    </span>
                    {parentId && !parentSelected && (
                      <span className="text-[10px] text-muted-foreground/60 leading-tight">
                        {t("Ou inclus dans", "Or included in")} {parentName} ({resolveTool(parentId).price}€)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom tool */}
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
              <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)}
                placeholder={t("Nom de l'outil", "Tool name")} maxLength={100}
                className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <input type="number" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="€/mois" min={0} max={9999}
                className="w-24 rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <button onClick={addCustomTool} disabled={customName.trim().length < 2}
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm font-medium disabled:opacity-40">
                {t("Ajouter", "Add")}
              </button>
            </div>
          )}
        </div>

        {customTools.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customTools.map((ct, i) => (
              <span key={i} className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                {ct.name} — {ct.price}€
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground/60 text-center">
          {t(
            "Tu n'utilises aucun de ces outils ? C'est normal — passe à l'étape suivante.",
            "Don't use any of these tools? That's fine — skip to the next step."
          )}
        </p>

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <button onClick={handlePrev}
            className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            ← {t("Précédent", "Previous")}
          </button>
          <button onClick={handleNext} disabled={!canProceed}
            className={`rounded-xl px-6 py-3 text-sm font-semibold transition-all
              ${canProceed ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
            {clusterIdx < personaClusters.length - 1 ? t("Suivant →", "Next →") : t("Terminer →", "Finish →")}
          </button>
        </div>
      </div>

      {/* ═══════════════ RIGHT PANEL ═══════════════ */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-24 rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-bold text-foreground text-sm">
            {t("Ta stack", "Your stack")} ({selectedIds.size}{bundledCount > 0 ? ` + ${bundledCount} ${t("inclus", "incl.")}` : ""})
          </h3>

          <div className="max-h-[45vh] overflow-y-auto space-y-1 -mx-1 px-1">
            {rightPanelGroups.length === 0 && (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                {t("Aucun outil sélectionné", "No tools selected")}
              </p>
            )}

            {rightPanelGroups.map((group) => {
              if (group.type === "bundle") {
                return (
                  <div key={group.parentTool.id} className="space-y-0.5">
                    <button
                      onClick={() => selectBundle(group.parentTool.id)}
                      className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors group hover:bg-muted/50 animate-fade-in"
                    >
                      <span className="text-sm">📦</span>
                      <span className="flex-1 text-xs font-semibold text-foreground truncate">{group.parentTool.name}</span>
                      <span className="text-[10px] font-mono text-foreground font-semibold">{group.parentTool.price}€</span>
                      <span className="text-muted-foreground/0 group-hover:text-destructive text-xs transition-colors">×</span>
                    </button>
                    {/* Bundled children — collapsed display */}
                    <div className="pl-7 pb-1">
                      <span className="text-[10px] text-green-600 dark:text-green-400 leading-tight">
                        {group.children.length} {t("apps incluses", "apps included")}
                      </span>
                    </div>
                  </div>
                );
              }

              // Standalone tool
              return (
                <button
                  key={group.tool.id}
                  onClick={() => toggleTool(group.tool.id)}
                  className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors group hover:bg-muted/50 animate-fade-in"
                >
                  <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                    {group.tool.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-xs text-foreground truncate">{group.tool.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {group.tool.price === 0 ? t("Gratuit", "Free") : `${group.tool.price}€`}
                  </span>
                  <span className="text-muted-foreground/0 group-hover:text-destructive text-xs transition-colors">×</span>
                </button>
              );
            })}
          </div>

          {rightPanelGroups.length > 0 && (
            <div className="pt-3 border-t border-border space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">Total</span>
                <span className="font-mono font-bold text-foreground">{totalCost}€/{t("mois", "mo")}</span>
              </div>
              {bundledCount > 0 && (
                <p className="text-[10px] text-green-600">
                  {bundledCount} {t("outils inclus dans un bundle", "tools included in a bundle")}
                </p>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
