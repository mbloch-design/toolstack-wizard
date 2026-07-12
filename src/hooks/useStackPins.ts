import { useCallback, useEffect, useState } from "react";
import {
  STACK_STATE_STORAGE_KEY,
  assignToolNeedsBatchInState,
  assignToolNeedsAutomaticallyInState,
  assignToolNeedsInState,
  createCustomNeedInState,
  createDefaultToolCartState,
  deleteCustomNeedInState,
  loadToolCartState,
  normalizeToolCartState,
  pinToolInState,
  moveNeedInState,
  renameCustomNeedInState,
  reorderToolsInState,
  saveToolCartState,
  unpinToolInState,
  type ToolCartState,
} from "@/lib/stackState";

export const STACK_PINS_STORAGE_KEY = STACK_STATE_STORAGE_KEY;
export type { StackNeed, StackToolEntry, ToolCartState } from "@/lib/stackState";

function readToolCartState(): ToolCartState {
  if (typeof window === "undefined") return createDefaultToolCartState();
  return loadToolCartState(window.localStorage);
}

let currentToolCartState: ToolCartState | null = null;
const subscribers = new Set<(state: ToolCartState) => void>();

function getCurrentToolCartState() {
  if (!currentToolCartState) currentToolCartState = readToolCartState();
  return currentToolCartState;
}

function commitToolCartState(nextState: ToolCartState) {
  currentToolCartState = normalizeToolCartState(nextState);
  if (typeof window !== "undefined") {
    currentToolCartState = saveToolCartState(window.localStorage, currentToolCartState);
  }
  subscribers.forEach((subscriber) => subscriber(currentToolCartState as ToolCartState));
}

function updateToolCartState(updater: (current: ToolCartState) => ToolCartState) {
  commitToolCartState(updater(getCurrentToolCartState()));
}

export function useStackPins() {
  const [state, setState] = useState<ToolCartState>(() => getCurrentToolCartState());

  useEffect(() => {
    subscribers.add(setState);
    setState(getCurrentToolCartState());

    function handleStorage(event: StorageEvent) {
      if (event.key !== STACK_PINS_STORAGE_KEY) return;
      try {
        currentToolCartState = normalizeToolCartState(event.newValue ? JSON.parse(event.newValue) : null);
      } catch {
        currentToolCartState = createDefaultToolCartState();
      }
      subscribers.forEach((subscriber) => subscriber(currentToolCartState as ToolCartState));
    }

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
    }

    return () => {
      subscribers.delete(setState);
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
      }
    };
  }, []);

  const pinTool = useCallback((slug: string, needIds: string[] = []) => {
    updateToolCartState((current) => pinToolInState(current, slug, needIds));
  }, []);

  const unpinTool = useCallback((slug: string) => {
    updateToolCartState((current) => unpinToolInState(current, slug));
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

  return {
    state,
    pinTool,
    unpinTool,
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
  };
}
