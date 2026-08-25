import { useCallback, useEffect, useState } from "react";
import {
  STACK_STATE_STORAGE_KEY,
  assignToolNeedsBatchInState,
  assignToolNeedsAutomaticallyInState,
  assignToolNeedsInState,
  createCustomNeedInState,
  createDefaultToolCartState,
  deleteCustomNeedInState,
  loadToolCartStateWithStatus,
  normalizeToolCartState,
  pinToolInState,
  moveNeedInState,
  renameCustomNeedInState,
  reorderToolsInState,
  saveToolSelectionInState,
  saveToolCartStateWithStatus,
  unpinToolInState,
  type StackPersistenceStatus,
  type StackToolIntent,
  type ToolCartState,
} from "@/lib/stackState";

export const STACK_PINS_STORAGE_KEY = STACK_STATE_STORAGE_KEY;
export type { StackNeed, StackPersistenceStatus, StackToolEntry, StackToolIntent, ToolCartState } from "@/lib/stackState";

function readToolCartState(): { state: ToolCartState; status: StackPersistenceStatus } {
  if (typeof window === "undefined") {
    return {
      state: createDefaultToolCartState(),
      status: { state: "ok", source: "default" },
    };
  }
  return loadToolCartStateWithStatus(window.localStorage);
}

let currentToolCartState: ToolCartState | null = null;
let currentPersistenceStatus: StackPersistenceStatus | null = null;
const subscribers = new Set<(state: ToolCartState) => void>();
const statusSubscribers = new Set<(status: StackPersistenceStatus) => void>();

function initializeToolCartState() {
  if (currentToolCartState && currentPersistenceStatus) return;
  const loaded = readToolCartState();
  currentToolCartState = loaded.state;
  currentPersistenceStatus = loaded.status;
}

function getCurrentToolCartState() {
  initializeToolCartState();
  return currentToolCartState as ToolCartState;
}

function getCurrentPersistenceStatus() {
  initializeToolCartState();
  return currentPersistenceStatus as StackPersistenceStatus;
}

function publishToolCartState() {
  subscribers.forEach((subscriber) => subscriber(currentToolCartState as ToolCartState));
  statusSubscribers.forEach((subscriber) => subscriber(currentPersistenceStatus as StackPersistenceStatus));
}

function commitToolCartState(nextState: ToolCartState) {
  currentToolCartState = normalizeToolCartState(nextState);
  if (typeof window !== "undefined") {
    const saved = saveToolCartStateWithStatus(window.localStorage, currentToolCartState);
    currentToolCartState = saved.state;
    currentPersistenceStatus = saved.status;
  } else {
    currentPersistenceStatus = { state: "ok", source: "memory" };
  }
  publishToolCartState();
}

function updateToolCartState(updater: (current: ToolCartState) => ToolCartState) {
  commitToolCartState(updater(getCurrentToolCartState()));
}

export function useStackPins() {
  const [state, setState] = useState<ToolCartState>(() => getCurrentToolCartState());
  const [persistenceStatus, setPersistenceStatus] = useState<StackPersistenceStatus>(() => getCurrentPersistenceStatus());

  useEffect(() => {
    subscribers.add(setState);
    statusSubscribers.add(setPersistenceStatus);
    setState(getCurrentToolCartState());
    setPersistenceStatus(getCurrentPersistenceStatus());

    function handleStorage(event: StorageEvent) {
      if (event.key !== STACK_PINS_STORAGE_KEY) return;
      const loaded = readToolCartState();
      currentToolCartState = loaded.state;
      currentPersistenceStatus = loaded.status;
      publishToolCartState();
    }

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
    }

    return () => {
      subscribers.delete(setState);
      statusSubscribers.delete(setPersistenceStatus);
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
      }
    };
  }, []);

  const pinTool = useCallback((slug: string, needIds: string[] = []) => {
    updateToolCartState((current) => pinToolInState(current, slug, needIds));
  }, []);

  const pinToolAutomatically = useCallback((slug: string, needIds: string[] = []) => {
    updateToolCartState((current) => pinToolInState(current, slug, needIds, new Date().toISOString(), "auto"));
  }, []);

  const unpinTool = useCallback((slug: string) => {
    updateToolCartState((current) => unpinToolInState(current, slug));
  }, []);

  const saveToolSelection = useCallback((slug: string, needIds: string[], intent: StackToolIntent) => {
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

  return {
    state,
    persistenceStatus,
    pinTool,
    pinToolAutomatically,
    unpinTool,
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
  };
}
