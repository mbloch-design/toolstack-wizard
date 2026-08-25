import { describe, expect, it } from "vitest";
import {
  DEFAULT_STACK_NEEDS,
  LEGACY_STACK_STATE_STORAGE_KEYS,
  STACK_STATE_BACKUP_STORAGE_KEY,
  STACK_STATE_STORAGE_KEY,
  STACK_STATE_VERSION,
  assignToolNeedsBatchInState,
  assignToolNeedsAutomaticallyInState,
  assignToolNeedsInState,
  createCustomNeedInState,
  createDefaultToolCartState,
  deleteCustomNeedInState,
  loadToolCartState,
  loadToolCartStateWithStatus,
  normalizeToolCartState,
  moveNeedInState,
  pinToolInState,
  reorderToolsInState,
  renameCustomNeedInState,
  saveToolCartState,
  saveToolSelectionInState,
  saveToolCartStateWithStatus,
  unpinToolInState,
  type StackStorage,
} from "@/lib/stackState";

class MemoryStorage implements StackStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("stackState", () => {
  it("creates an empty versioned stack with suggested needs", () => {
    const state = createDefaultToolCartState();

    expect(state.version).toBe(STACK_STATE_VERSION);
    expect(state.pinnedToolSlugs).toEqual([]);
    expect(state.toolEntries).toEqual([]);
    expect(state.needs).toEqual(DEFAULT_STACK_NEEDS);
  });

  it("migrates the legacy slug list without losing order", () => {
    const state = normalizeToolCartState({
      pinnedToolSlugs: ["notion", "figma", "notion", "chatgpt"],
    });

    expect(state.pinnedToolSlugs).toEqual(["notion", "figma", "chatgpt"]);
    expect(state.toolEntries).toEqual([
      { toolSlug: "notion", needIds: [], addedAt: "1970-01-01T00:00:00.000Z", assignmentMode: "pending", intent: "stack" },
      { toolSlug: "figma", needIds: [], addedAt: "1970-01-01T00:00:00.000Z", assignmentMode: "pending", intent: "stack" },
      { toolSlug: "chatgpt", needIds: [], addedAt: "1970-01-01T00:00:00.000Z", assignmentMode: "pending", intent: "stack" },
    ]);
  });

  it("migrates legacy local storage to the new key", () => {
    const storage = new MemoryStorage();
    const legacyKey = LEGACY_STACK_STATE_STORAGE_KEYS[0];
    storage.setItem(legacyKey, JSON.stringify({ pinnedToolSlugs: ["notion", "figma"] }));

    const state = loadToolCartState(storage);

    expect(state.pinnedToolSlugs).toEqual(["notion", "figma"]);
    expect(storage.getItem(STACK_STATE_STORAGE_KEY)).not.toBeNull();
    expect(storage.getItem(legacyKey)).toBeNull();
  });

  it("prefers an existing v2 state over legacy data", () => {
    const storage = new MemoryStorage();
    saveToolCartState(storage, pinToolInState(createDefaultToolCartState(), "chatgpt", ["ia"], "2026-07-10T00:00:00.000Z"));
    storage.setItem(LEGACY_STACK_STATE_STORAGE_KEYS[0], JSON.stringify({ pinnedToolSlugs: ["notion"] }));

    const state = loadToolCartState(storage);

    expect(state.pinnedToolSlugs).toEqual(["chatgpt"]);
    expect(state.toolEntries[0].needIds).toEqual(["ia"]);
  });

  it("recovers the last valid local copy when the current v2 payload is corrupted", () => {
    const storage = new MemoryStorage();
    const first = pinToolInState(createDefaultToolCartState(), "notion", ["organisation"]);
    const second = pinToolInState(first, "figma", ["design"]);
    saveToolCartState(storage, first);
    saveToolCartState(storage, second);
    expect(JSON.parse(storage.getItem(STACK_STATE_BACKUP_STORAGE_KEY) as string).pinnedToolSlugs).toEqual(["notion"]);
    storage.setItem(STACK_STATE_STORAGE_KEY, "{not-json");

    const loaded = loadToolCartStateWithStatus(storage);

    expect(loaded.state.pinnedToolSlugs).toEqual(["notion"]);
    expect(loaded.status).toMatchObject({ state: "recovered", source: "backup", issue: "current-corrupt" });
    expect(JSON.parse(storage.getItem(STACK_STATE_STORAGE_KEY) as string).pinnedToolSlugs).toEqual(["notion"]);
  });

  it("detects a structurally corrupted v2 payload instead of normalizing it into an empty stack", () => {
    const storage = new MemoryStorage();
    storage.setItem(STACK_STATE_STORAGE_KEY, JSON.stringify({ version: STACK_STATE_VERSION, needs: "invalid" }));

    const loaded = loadToolCartStateWithStatus(storage);

    expect(loaded.state.pinnedToolSlugs).toEqual([]);
    expect(loaded.status).toMatchObject({ state: "degraded", source: "default", issue: "current-corrupt" });
  });

  it("keeps the updated state in memory when local persistence runs out of quota", () => {
    const storage = new MemoryStorage();
    const initial = pinToolInState(createDefaultToolCartState(), "notion", ["organisation"]);
    saveToolCartState(storage, initial);
    const updated = pinToolInState(initial, "figma", ["design"]);
    const quotaStorage: StackStorage = {
      getItem: (key) => storage.getItem(key),
      removeItem: (key) => storage.removeItem(key),
      setItem: () => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      },
    };

    const saved = saveToolCartStateWithStatus(quotaStorage, updated);

    expect(saved.state.pinnedToolSlugs).toEqual(["notion", "figma"]);
    expect(saved.status).toMatchObject({ state: "degraded", source: "memory", issue: "storage-write-failed" });
    expect(loadToolCartState(storage).pinnedToolSlugs).toEqual(["notion"]);
  });

  it("reports an unreadable storage without throwing", () => {
    const unreadableStorage: StackStorage = {
      getItem: () => {
        throw new DOMException("Access denied", "SecurityError");
      },
      setItem: () => undefined,
      removeItem: () => undefined,
    };

    const loaded = loadToolCartStateWithStatus(unreadableStorage);

    expect(loaded.state).toEqual(createDefaultToolCartState());
    expect(loaded.status).toMatchObject({ state: "degraded", source: "default", issue: "storage-read-failed" });
  });

  it("keeps legacy data when migration cannot be persisted", () => {
    const storage = new MemoryStorage();
    const legacyKey = LEGACY_STACK_STATE_STORAGE_KEYS[0];
    storage.setItem(legacyKey, JSON.stringify({ pinnedToolSlugs: ["notion"] }));
    const migrationBlockedStorage: StackStorage = {
      getItem: (key) => storage.getItem(key),
      removeItem: (key) => storage.removeItem(key),
      setItem: () => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      },
    };

    const loaded = loadToolCartStateWithStatus(migrationBlockedStorage);

    expect(loaded.state.pinnedToolSlugs).toEqual(["notion"]);
    expect(loaded.status).toMatchObject({ state: "degraded", source: "legacy", issue: "migration-write-failed" });
    expect(storage.getItem(legacyKey)).not.toBeNull();
  });

  it("adds an unassigned tool to the stack", () => {
    const state = pinToolInState(createDefaultToolCartState(), "notion", [], "2026-07-10T10:00:00.000Z");

    expect(state.pinnedToolSlugs).toEqual(["notion"]);
    expect(state.toolEntries[0]).toEqual({
      toolSlug: "notion",
      needIds: [],
      addedAt: "2026-07-10T10:00:00.000Z",
      assignmentMode: "pending",
      intent: "stack",
    });
  });

  it("saves a wishlist tool and replaces its board selection when edited", () => {
    const first = saveToolSelectionInState(createDefaultToolCartState(), "rive", ["design"], "wishlist", "2026-08-25T10:00:00.000Z");
    const updated = saveToolSelectionInState(first, "rive", ["ia", "design"], "stack");

    expect(first.toolEntries[0]).toMatchObject({ intent: "wishlist", needIds: ["design"] });
    expect(updated.toolEntries[0]).toMatchObject({ intent: "stack", needIds: ["ia", "design"], addedAt: "2026-08-25T10:00:00.000Z" });
    expect(updated.toolEntries).toHaveLength(1);
  });

  it("keeps one tool entry while assigning it to several needs", () => {
    const initial = pinToolInState(createDefaultToolCartState(), "notion", ["organisation"], "2026-07-10T10:00:00.000Z");
    const state = pinToolInState(initial, "notion", ["marketing"]);

    expect(state.pinnedToolSlugs).toEqual(["notion"]);
    expect(state.toolEntries).toHaveLength(1);
    expect(state.toolEntries[0].needIds).toEqual(["organisation", "marketing"]);
  });

  it("replaces assignments and ignores unknown needs", () => {
    const initial = pinToolInState(createDefaultToolCartState(), "figma", ["design"]);
    const state = assignToolNeedsInState(initial, "figma", ["design", "marketing", "inconnu", "design"]);

    expect(state.toolEntries[0].needIds).toEqual(["design", "marketing"]);
  });

  it("assigns several migrated tools in one update", () => {
    let state = normalizeToolCartState({ pinnedToolSlugs: ["notion", "figma", "chatgpt"] });
    state = assignToolNeedsBatchInState(state, {
      notion: ["organisation"],
      figma: ["design"],
      chatgpt: ["ia", "marketing"],
    });

    expect(state.toolEntries.find((entry) => entry.toolSlug === "notion")?.needIds).toEqual(["organisation"]);
    expect(state.toolEntries.find((entry) => entry.toolSlug === "figma")?.needIds).toEqual(["design"]);
    expect(state.toolEntries.find((entry) => entry.toolSlug === "chatgpt")?.needIds).toEqual(["ia", "marketing"]);
  });

  it("automatically assigns a new tool while keeping the assignment editable", () => {
    const initial = pinToolInState(createDefaultToolCartState(), "notion", []);
    const state = assignToolNeedsAutomaticallyInState(initial, { notion: ["organisation"] });

    expect(state.toolEntries[0].needIds).toEqual(["organisation"]);
    expect(state.toolEntries[0].assignmentMode).toBe("auto");
  });

  it("never overwrites a manual correction with automatic classification", () => {
    let state = pinToolInState(createDefaultToolCartState(), "notion", []);
    state = assignToolNeedsInState(state, "notion", []);
    state = assignToolNeedsAutomaticallyInState(state, { notion: ["organisation"] });

    expect(state.toolEntries[0].needIds).toEqual([]);
    expect(state.toolEntries[0].assignmentMode).toBe("manual");
  });

  it("removes a tool and all of its assignments", () => {
    const initial = pinToolInState(createDefaultToolCartState(), "notion", ["organisation"]);
    const state = unpinToolInState(initial, "notion");

    expect(state.pinnedToolSlugs).toEqual([]);
    expect(state.toolEntries).toEqual([]);
  });

  it("reorders canonical entries without losing assignments", () => {
    let state = pinToolInState(createDefaultToolCartState(), "notion", ["organisation"]);
    state = pinToolInState(state, "figma", ["design"]);
    state = pinToolInState(state, "chatgpt", ["ia"]);

    const reordered = reorderToolsInState(state, ["chatgpt", "notion"]);

    expect(reordered.pinnedToolSlugs).toEqual(["chatgpt", "notion", "figma"]);
    expect(reordered.toolEntries.find((entry) => entry.toolSlug === "figma")?.needIds).toEqual(["design"]);
  });

  it("creates uniquely identified custom needs", () => {
    const first = createCustomNeedInState(createDefaultToolCartState(), "Relation client");
    const second = createCustomNeedInState(first.state, "Relation client");

    expect(first.needId).toBe("custom-relation-client");
    expect(second.needId).toBe("custom-relation-client-2");
    expect(second.state.needs.filter((need) => need.source === "custom")).toHaveLength(2);
  });

  it("renames only custom needs", () => {
    const created = createCustomNeedInState(createDefaultToolCartState(), "Relation client");
    const renamed = renameCustomNeedInState(created.state, created.needId as string, "Suivi client");
    const suggestedAttempt = renameCustomNeedInState(renamed, "design", "Création");

    expect(renamed.needs.find((need) => need.id === created.needId)?.labelFr).toBe("Suivi client");
    expect(suggestedAttempt.needs.find((need) => need.id === "design")?.labelFr).toBe("Créer des visuels");
  });

  it("deletes a custom need and sends orphaned tools back to unassigned", () => {
    const created = createCustomNeedInState(createDefaultToolCartState(), "Relation client");
    const withTool = pinToolInState(created.state, "front", [created.needId as string]);
    const deleted = deleteCustomNeedInState(withTool, created.needId as string);

    expect(deleted.needs.some((need) => need.id === created.needId)).toBe(false);
    expect(deleted.toolEntries[0].needIds).toEqual([]);
  });

  it("reorders needs while keeping stable identifiers", () => {
    const created = createCustomNeedInState(createDefaultToolCartState(), "Relation client");
    const moved = moveNeedInState(created.state, created.needId as string, -1);

    expect(moved.needs[moved.needs.length - 2].id).toBe(created.needId);
    expect(moved.needs.map((need) => need.order)).toEqual(moved.needs.map((_, index) => (index + 1) * 10));
  });
});
