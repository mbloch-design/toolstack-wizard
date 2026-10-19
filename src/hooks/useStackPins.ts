import { useCallback, useSyncExternalStore } from "react";
import { trackEvent } from "@/lib/analytics";
import {
  STACK_STATE_STORAGE_KEY,
  assignToolNeedsBatchInState,
  assignToolNeedsAutomaticallyInState,
  assignToolNeedsInState,
  createCustomNeedInState,
  deleteCustomNeedInState,
  normalizeToolCartState,
  pinToolInState,
  moveNeedInState,
  renameCustomNeedInState,
  reorderToolsInState,
  saveToolSelectionInState,
  unpinToolInState,
  type StackToolIntent,
  type ToolCartState,
} from "@/lib/stackState";

export const STACK_PINS_STORAGE_KEY = STACK_STATE_STORAGE_KEY;
export type { StackNeed, StackPersistenceStatus, StackToolEntry, StackToolIntent, ToolCartState } from "@/lib/stackState";

import {
  readPersonalStack, updatePersonalStack, subscribePersonalStack,
  getPersonalStackPersistenceStatus, getServerPersonalStack, getServerPersonalStackPersistenceStatus,
} from "@/lib/personalStackStore";

const getSelection = () => readPersonalStack().selection;
const getServerSelection = () => getServerPersonalStack().selection;
function commitToolCartState(selection: ToolCartState) {
  updatePersonalStack(current => ({ ...current, selection }));
}
function updateToolCartState(updater: (current: ToolCartState) => ToolCartState) {
  updatePersonalStack(current => {
    const selection = updater(current.selection);
    return selection === current.selection ? current : { ...current, selection };
  });
}

export function useStackPins() {
  const state = useSyncExternalStore(subscribePersonalStack, getSelection, getServerSelection);
  const persistenceStatus = useSyncExternalStore(subscribePersonalStack, getPersonalStackPersistenceStatus, getServerPersonalStackPersistenceStatus);

  const pinTool = useCallback((slug: string, needIds: string[] = []) => {
    // Deliberate "Ajouter à Ma Stack" click — the closest thing this site has
    // to a conversion event, and previously invisible in Analytics entirely.
    trackEvent("add_to_stack", { tool_slug: slug });
    updateToolCartState((current) => pinToolInState(current, slug, needIds));
  }, []);

  const pinToolAutomatically = useCallback((slug: string, needIds: string[] = []) => {
    updateToolCartState((current) => pinToolInState(current, slug, needIds, new Date().toISOString(), "auto"));
  }, []);

  const unpinTool = useCallback((slug: string) => {
    updateToolCartState((current) => unpinToolInState(current, slug));
  }, []);

  const restoreTool = useCallback((entry: ToolCartState["toolEntries"][number], index: number) => {
    updateToolCartState((current) => {
      if (current.toolEntries.some((item) => item.toolSlug === entry.toolSlug)) return current;
      const toolEntries = [...current.toolEntries];
      toolEntries.splice(Math.min(index, toolEntries.length), 0, entry);
      return { ...current, toolEntries, pinnedToolSlugs: toolEntries.map((item) => item.toolSlug) };
    });
  }, []);

  const saveToolSelection = useCallback((slug: string, needIds: string[], intent: StackToolIntent) => {
    // The confirm step of the "Enregistrer l'outil" dialog — the actual path
    // the main "Ajouter [Tool]" button on a tool page goes through, distinct
    // from the simpler one-click pinTool() used elsewhere (e.g. tool cards).
    trackEvent("add_to_stack", { tool_slug: slug, intent });
    updateToolCartState((current) => saveToolSelectionInState(current, slug, needIds, intent));
  }, []);

  const assignToolNeeds = useCallback((slug: string, needIds: string[]) => {
    updateToolCartState((current) => assignToolNeedsInState(current, slug, needIds));
  }, []);

  const assignToolNeedsBatch = useCallback((assignments: Record<string, string[]>) => {
    updateToolCartState((current) => assignToolNeedsBatchInState(current, assignments));
  }, []);

  const assignToolNeedsAutomatically = useCallback((assignments: Record<string, string[]>) => {
    updateToolCartState((current) => assignToolNeedsAutomaticallyInState(current, assignments));
  }, []);

  const createNeed = useCallback((label: string) => {
    let createdNeedId: string | null = null;
    updateToolCartState((current) => {
      const result = createCustomNeedInState(current, label);
      createdNeedId = result.needId;
      return result.state;
    });
    return createdNeedId;
  }, []);

  const renameNeed = useCallback((needId: string, label: string) => {
    updateToolCartState((current) => renameCustomNeedInState(current, needId, label));
  }, []);

  const deleteNeed = useCallback((needId: string) => {
    updateToolCartState((current) => deleteCustomNeedInState(current, needId));
  }, []);

  const moveNeed = useCallback((needId: string, direction: -1 | 1) => {
    updateToolCartState((current) => moveNeedInState(current, needId, direction));
  }, []);

  const moveTool = useCallback((slug: string, direction: -1 | 1) => {
    updateToolCartState((current) => {
      const currentIndex = current.pinnedToolSlugs.indexOf(slug);
      if (currentIndex === -1) return current;
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= current.pinnedToolSlugs.length) return current;
      const pinnedToolSlugs = [...current.pinnedToolSlugs];
      const [item] = pinnedToolSlugs.splice(currentIndex, 1);
      pinnedToolSlugs.splice(nextIndex, 0, item);
      return reorderToolsInState(current, pinnedToolSlugs);
    });
  }, []);

  const setToolOrder = useCallback((slugs: string[]) => {
    updateToolCartState((current) => {
      return reorderToolsInState(current, slugs);
    });
  }, []);

  const clearTools = useCallback(() => {
    updateToolCartState((current) => normalizeToolCartState({ ...current, toolEntries: [], pinnedToolSlugs: [] }));
  }, []);

  const replaceState = useCallback((nextState: ToolCartState) => {
    commitToolCartState(nextState);
  }, []);

  return {
    state,
    persistenceStatus,
    pinTool,
    pinToolAutomatically,
    unpinTool,
    restoreTool,
    saveToolSelection,
    assignToolNeeds,
    assignToolNeedsBatch,
    assignToolNeedsAutomatically,
    createNeed,
    renameNeed,
    deleteNeed,
    moveNeed,
    moveTool,
    setToolOrder,
    clearTools,
    replaceState,
  };
}
