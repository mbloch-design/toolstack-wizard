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

/** Pretty-print a tool ID into a display name */
function prettifyId(id: string): string {
  return id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/** Create a minimal fallback Tool for IDs not in the catalog */
function createFallbackTool(id: string): Tool {
  return {
    id, name: prettifyId(id), price: 0, category: "", functional_needs: [],
    tool_type: "satellite", usage: "medium", prescription_quality: "oui", force_silence: false,
  };
}

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
  // parentId → list of child tool IDs
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

  // childId → parentId
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
    } catch {}
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
  // Set of IDs that are "included" because their bundle parent is selected
  const includedByBundle = useMemo(() => {
    const included = new Set<string>();
    for (const parentId of selectedIds) {
      const children = bundleChildrenMap.get(parentId);
      if (children) children.forEach((childId) => included.add(childId));
    }
    return included;
  }, [selectedIds, bundleChildrenMap]);

  // ─── Cluster tools ──────────────────────────────────────────
  const clusterTools = useMemo(() => {
    if (!currentCluster) return [];
    return currentCluster.tool_ids.map((id) => resolveTool(id));
  }, [currentCluster, resolveTool]);

  // ─── Persist ────────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(Array.from(selectedIds))); } catch {}
  }, [selectedIds]);

  // ─── Bundle-aware doublon check ─────────────────────────────
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

  // ─── Bundle inverse doublon: child + parent selected ────────
  const checkBundleConflict = useCallback(
    (toolId: string, newIds: Set<string>) => {
      // Selected a child whose parent is already selected?
      const parentId = childToParentMap.get(toolId);
      if (parentId && newIds.has(parentId)) {
        const parent = resolveTool(parentId);
        const child = resolveTool(toolId);
        toast.error(
          `🔴 ${child.name} ${t("est inclus dans", "is included in")} ${parent.name} — ${t("tu payes", "you're paying")} ${child.price}€ ${t("de trop", "too much")}`,
          { duration: 6000 }
        );
        return true; // conflict
      }
      // Selected a parent → check if children are already selected individually
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

  // ─── Bundle upsell: multiple children without parent ────────
  const checkBundleUpsell = useCallback(
    (newIds: Set<string>) => {
      // Group selected tools by their bundle parent
      const byParent = new Map<string, string[]>();
      for (const id of newIds) {
        const parentId = childToParentMap.get(id);
        if (parentId && !newIds.has(parentId)) {
          const arr = byParent.get(parentId) || [];
          arr.push(id);
          byParent.set(parentId, arr);
        }
      }
      for (const [parentId, childIds] of byParent) {
        if (childIds.length >= 2) {
          const parent = resolveTool(parentId);
          const childCost = childIds.reduce((s, cid) => s + resolveTool(cid).price, 0);
          const childNames = childIds.map((cid) => resolveTool(cid).name).join(" + ");
          if (childCost > parent.price * 0.7) {
            toast.info(
              `💡 ${childNames} = ${childCost}€. ${parent.name} ${t("à", "at")} ${parent.price}€ ${t("les inclut tous + d'autres apps", "includes them all + more apps")}.`,
              { duration: 8000 }
            );
          }
        }
      }
    },
    [childToParentMap, resolveTool, t]
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
        // Defer upsell check so it doesn't fire on first child
        setTimeout(() => checkBundleUpsell(next), 300);
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
      const isIncludedByParent = includedByBundle.has(id) && !selectedIds.has(id);
      if (isIncludedByParent) continue; // don't double-add
      selected.push(tool);
    }
    // Also add included-by-bundle children that aren't explicitly selected
    for (const id of includedByBundle) {
      if (!selectedIds.has(id)) {
        const tool = { ...resolveTool(id), includedInBundle: true, includedVia: childToParentMap.get(id) };
        selected.push({ ...tool, price: 0 }); // price = 0 since bundled
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

  // ─── Right panel list with bundle cost logic ────────────────
  const selectedToolsList = useMemo(() => {
    const list: (Tool & { _bundled?: boolean; _bundleParentName?: string })[] = [];
    for (const id of selectedIds) {
      const tool = resolveTool(id);
      const isChildOfSelectedParent = !!childToParentMap.get(id) && selectedIds.has(childToParentMap.get(id)!);
      list.push({
        ...tool,
        _bundled: isChildOfSelectedParent,
        _bundleParentName: isChildOfSelectedParent ? resolveTool(childToParentMap.get(id)!).name : undefined,
      });
    }
    return list;
  }, [selectedIds, resolveTool, childToParentMap]);

  const totalCost = useMemo(() => {
    let total = 0;
    for (const tool of selectedToolsList) {
      if (tool._bundled) continue; // don't count bundled children
      total += tool.price;
    }
    return Math.round(total * 100) / 100;
  }, [selectedToolsList]);

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
            const isIncluded = includedByBundle.has(tool.id) && !isSelected;
            const parentId = childToParentMap.get(tool.id);
            const parentSelected = parentId ? selectedIds.has(parentId) : false;
            const parentName = parentId ? resolveTool(parentId).name : "";

            // Included via bundle — show as non-clickable with badge
            if (isIncluded || (isSelected && parentSelected)) {
              return (
                <div
                  key={tool.id}
                  className="relative flex flex-col items-center gap-2.5 rounded-xl border-2 border-green-300 bg-green-50/50 dark:bg-green-950/20 p-4 text-center opacity-90"
                >
                  {/* Included badge */}
                  <span className="absolute top-2 right-2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {t("Inclus", "Included")} ✓
                  </span>
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-xl font-bold text-foreground shrink-0">
                    {tool.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm text-foreground leading-tight">{tool.name}</span>
                  <span className="text-xs text-muted-foreground">
                    <span className="line-through">{tool.price}€</span>{" "}
                    <span className="text-green-600 font-semibold">{t("Inclus", "Included")}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground/70">{parentName}</span>
                </div>
              );
            }

            // Normal tool card (selectable)
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
                {isSelected && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-xl font-bold text-foreground shrink-0">
                  {tool.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-sm text-foreground leading-tight">{tool.name}</span>
                <span className={`text-xs font-mono ${tool.price === 0 ? "text-green-600 font-semibold" : "text-muted-foreground"}`}>
                  {tool.price === 0 ? t("Gratuit", "Free") : `${tool.price}€/${t("mois", "mo")}`}
                </span>
                {/* Bundle hint: if this tool has a parent bundle not yet selected */}
                {parentId && !parentSelected && (
                  <span className="text-[10px] text-muted-foreground/60 leading-tight">
                    {t("Ou inclus dans", "Or included in")} {parentName} ({resolveTool(parentId).price}€)
                  </span>
                )}
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

      {/* Right panel — live stack list (desktop only) */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-24 rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-bold text-foreground text-sm">
            {t("Ta stack", "Your stack")} ({selectedIds.size})
          </h3>

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
                className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors group animate-fade-in
                  ${tool._bundled ? "opacity-60" : "hover:bg-muted/50"}`}
              >
                <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                  {tool.name.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 text-xs text-foreground truncate">{tool.name}</span>
                {tool._bundled ? (
                  <span className="text-[10px] text-green-600 font-medium whitespace-nowrap">
                    {t("Inclus", "Incl.")}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {tool.price === 0 ? t("Gratuit", "Free") : `${tool.price}€`}
                  </span>
                )}
                {!tool._bundled && (
                  <span className="text-muted-foreground/0 group-hover:text-destructive text-xs transition-colors">×</span>
                )}
              </button>
            ))}
          </div>

          {selectedToolsList.length > 0 && (
            <div className="pt-3 border-t border-border space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">Total</span>
                <span className="font-mono font-bold text-foreground">{totalCost}€/{t("mois", "mo")}</span>
              </div>
              {selectedToolsList.some((t) => t._bundled) && (
                <p className="text-[10px] text-green-600">
                  {selectedToolsList.filter((t) => t._bundled).length} {t("outils inclus dans un bundle", "tools included in a bundle")}
                </p>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
