import { useOptionalStackAccount } from "@/contexts/StackAccountContext";
import { STACK_AUTH_REQUIRED_EVENT } from "@/lib/stackAuthAccess";
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
  getPersonalStackPersistenceStatus, getServerPersonalStack, getServerPersonalStackPersistenceStatus, getPersonalStackScope, getPersonalStackScopeEpoch,
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
  const account = useOptionalStackAccount();
  const requiresAccount = !!account?.enabled && (!account.user || account.syncStatus === "session-expired");
  const requestAddAccess = useCallback(() => {
    if (!requiresAccount) return true;
    window.dispatchEvent(new CustomEvent(STACK_AUTH_REQUIRED_EVENT, { detail: { mode: account?.syncStatus === "session-expired" ? "signin" : "signup" } }));
    return false;
  }, [requiresAccount, account?.syncStatus]);
  const state = useSyncExternalStore(subscribePersonalStack, getSelection, getServerSelection);
  const persistenceStatus = useSyncExternalStore(subscribePersonalStack, getPersonalStackPersistenceStatus, getServerPersonalStackPersistenceStatus);

  const pinTool = useCallback((slug: string, needIds: string[] = []) => {
    if (!requestAddAccess()) return false;
    // Deliberate "Ajouter à Ma Stack" click — the closest thing this site has
    // to a conversion event, and previously invisible in Analytics entirely.
    trackEvent("add_to_stack", { tool_slug: slug });
    updateToolCartState((current) => pinToolInState(current, slug, needIds));
    return true;
  }, [requestAddAccess]);

  const pinToolAutomatically = useCallback((slug: string, needIds: string[] = []) => {
    if (!requestAddAccess()) return false;
    updateToolCartState((current) => pinToolInState(current, slug, needIds, new Date().toISOString(), "auto"));
    return true;
  }, [requestAddAccess]);

  const unpinTool = useCallback((slug: string) => {
    updateToolCartState((current) => unpinToolInState(current, slug));
  }, []);

  const scope = getPersonalStackScope();
  const epoch = getPersonalStackScopeEpoch(scope);
  const restoreTool = useCallback((entry: ToolCartState["toolEntries"][number], index: number) => {
    // CartPage's removal toast retains this callback from its originating render.
    if (getPersonalStackScope() !== scope || getPersonalStackScopeEpoch(scope) !== epoch) return;
    updateToolCartState((current) => {
      if (current.toolEntries.some((item) => item.toolSlug === entry.toolSlug)) return current;
      const toolEntries = [...current.toolEntries];
      toolEntries.splice(Math.min(index, toolEntries.length), 0, entry);
      return { ...current, toolEntries, pinnedToolSlugs: toolEntries.map((item) => item.toolSlug) };
    });
  }, [scope, epoch]);

  const saveToolSelection = useCallback((slug: string, needIds: string[], intent: StackToolIntent) => {
    if (!requestAddAccess()) return false;
    // The confirm step of the "Enregistrer l'outil" dialog — the actual path
    // the main "Ajouter [Tool]" button on a tool page goes through, distinct
    // from the simpler one-click pinTool() used elsewhere (e.g. tool cards).
    trackEvent("add_to_stack", { tool_slug: slug, intent });
    updateToolCartState((current) => saveToolSelectionInState(current, slug, needIds, intent));
    return true;
  }, [requestAddAccess]);

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
    // Allocate once per user action: a queued reducer may run again after recovery.
    const token = typeof crypto.randomUUID === "function" ? crypto.randomUUID()
      : Array.from(crypto.getRandomValues(new Uint32Array(4)), part => part.toString(16)).join("-");
    const allocatedId = `custom-${token}`;
    let createdNeedId: string | null = null;
    updateToolCartState((current) => {
      const result = createCustomNeedInState(current, label, allocatedId);
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
    requiresAccount,
    requestAddAccess,
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
