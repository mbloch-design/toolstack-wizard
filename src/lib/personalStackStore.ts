import { normalizePersonalStack, type PersonalStackV4 } from "./personalStack";
import { LEGACY_STACK_STATE_STORAGE_KEYS, STACK_STATE_BACKUP_STORAGE_KEY, STACK_STATE_STORAGE_KEY, loadToolCartStateWithStatus, type StackPersistenceStatus } from "./stackState";

export type PersonalStackScope = "anonymous" | string;
const MIGRATED_KEY = "tooltrim-personal-stack-v4:anonymous-migrated";
/** Account scopes are encoded separately so no account identifier can alias anonymous. */
export function personalStackStorageKey(scope: PersonalStackScope): string {
  return scope === "anonymous" ? "tooltrim-personal-stack-v4:anonymous" : `tooltrim-personal-stack-v4:account:${encodeURIComponent(scope)}`;
}
const backupKey = (scope: PersonalStackScope) => `${personalStackStorageKey(scope)}:backup`;
type StackUpdater = (current: PersonalStackV4) => PersonalStackV4;
type Snapshot = {
  state: PersonalStackV4;
  raw: string | null | undefined;
  status: StackPersistenceStatus;
  dirty?: boolean;
  purged?: boolean;
  // Undefined means the legacy base is known. An empty queue is still pending.
  pendingMigration?: StackUpdater[];
};
const memories = new Map<string, Snapshot>();
const scopeEpochs = new Map<string, number>();
const listeners = new Set<() => void>();
let activeScope: PersonalStackScope = "anonymous";
const serverState = normalizePersonalStack(null);
const serverStatus: StackPersistenceStatus = { state: "ok", source: "default" };
export const getServerPersonalStack = () => serverState;
export const getServerPersonalStackPersistenceStatus = () => serverStatus;
export const getPersonalStackScope = () => activeScope;
export const getPersonalStackScopeEpoch = (scope = activeScope) => scopeEpochs.get(scope) ?? 0;
const notify = () => listeners.forEach(listener => listener());
const failed = (issue: "storage-read-failed" | "storage-write-failed"): StackPersistenceStatus => ({ state: "degraded", source: "memory", issue });

function parse(raw: string | null): PersonalStackV4 | null {
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw);
    return value && value.version === 4 && value.selection && typeof value.selection === "object"
      ? normalizePersonalStack(value) : null;
  } catch { return null; }
}
function parseLegacy(storage: Storage, key: string): unknown {
  const raw = storage.getItem(key);
  try { return JSON.parse(raw || "null"); } catch { return null; }
}
function migrateAnonymous(storage: Storage, pending: StackUpdater[] = []): Snapshot {
  const loaded = loadToolCartStateWithStatus(storage);
  if (loaded.status.issue === "storage-read-failed") throw new Error("Legacy stack unreadable");
  const state = normalizePersonalStack({
    version: 4, selection: loaded.state,
    billing: {
      paid: parseLegacy(storage, "tooltrim-ma-stack-paid-plans-v1"),
      reviewed: parseLegacy(storage, "tooltrim-ma-stack-freemium-reviewed-v1"),
      choices: parseLegacy(storage, "tooltrim-ma-stack-plan-choices-v1"),
    },
    decisions: parseLegacy(storage, "tooltrim-ma-stack-decisions-v1"),
  });
  const recovered = pending.reduce((current, update) => normalizePersonalStack(update(current)), state);
  const entry = persistScope("anonymous", recovered, { state, raw: null, status: loaded.status });
  if (entry.status.state === "ok") entry.status = loaded.status;
  if (!entry.dirty) {
    try { storage.setItem(MIGRATED_KEY, "1"); } catch { entry.status = failed("storage-write-failed"); }
  }
  return entry;
}

function persistScope(scope: PersonalStackScope, state: PersonalStackV4, previous: Snapshot): Snapshot {
  const entry: Snapshot = { state: normalizePersonalStack(state), raw: previous.raw, status: { state: "ok", source: "current" }, dirty: true };
  try {
    const storage = window.localStorage;
    const currentRaw = storage.getItem(personalStackStorageKey(scope));
    const raw = JSON.stringify(entry.state);
    let backupFailed = false;
    try { storage.setItem(backupKey(scope), parse(currentRaw) ? currentRaw! : raw); } catch { backupFailed = true; }
    storage.setItem(personalStackStorageKey(scope), raw);
    entry.raw = raw;
    entry.dirty = false;
    if (backupFailed) entry.status = { state: "degraded", source: "current", issue: "backup-write-failed" };
  } catch { entry.status = failed("storage-write-failed"); }
  return entry;
}

function readScope(scope: PersonalStackScope): Snapshot {
  let entry = memories.get(scope);
  // A failed durable purge must never repopulate its cleared in-session view.
  if (entry?.purged) return entry;
  if (typeof window === "undefined") return { state: serverState, raw: undefined, status: serverStatus };
  try {
    const storage = window.localStorage;
    const raw = storage.getItem(personalStackStorageKey(scope));
    // A failed local write leaves raw unchanged. Preserve its session snapshot.
    if (entry && !entry.pendingMigration && raw === entry.raw) return entry;
    if (entry?.dirty && !entry.pendingMigration && entry.raw === undefined && raw === null) {
      entry.raw = null;
      return entry;
    }
    const state = parse(raw);
    if (state) {
      const current: Snapshot = { state, raw, status: { state: "ok", source: "current" } };
      entry = entry?.pendingMigration
        ? persistScope(scope, entry.pendingMigration.reduce((next, update) => normalizePersonalStack(update(next)), state), current)
        : current;
    } else {
      const backup = parse(storage.getItem(backupKey(scope)));
      if (backup) {
        const pending = entry?.pendingMigration;
        entry = { state: pending ? pending.reduce((next, update) => normalizePersonalStack(update(next)), backup) : backup, raw,
          status: { state: "recovered", source: "backup", issue: "current-corrupt" } };
        try {
          const restored = JSON.stringify(entry.state);
          storage.setItem(personalStackStorageKey(scope), restored); entry.raw = restored;
        } catch { entry.status = failed("storage-write-failed"); }
      } else if ((!entry || entry.pendingMigration || (entry.raw === undefined && !entry.dirty)) && raw === null && scope === "anonymous" && storage.getItem(MIGRATED_KEY) !== "1") {
        entry = migrateAnonymous(storage, entry?.pendingMigration);
      } else {
        // A corrupt remote write must not destroy a valid in-session draft.
        entry = { state: raw !== null && entry ? entry.state : normalizePersonalStack(null), raw,
          status: raw !== null ? { state: "degraded", source: entry ? "memory" : "default", issue: "current-corrupt" } : { state: "ok", source: "default" } };
      }
    }
  } catch {
    if (!entry) entry = { state: normalizePersonalStack(null), raw: undefined, status: failed("storage-read-failed"),
      ...(scope === "anonymous" ? { pendingMigration: [] } : {}) };
    else if (entry.status.issue !== "storage-read-failed" && entry.status.issue !== "storage-write-failed") {
      entry = { ...entry, status: failed("storage-read-failed") };
    }
  }
  memories.set(scope, entry);
  return entry;
}

export function readPersonalStack(): PersonalStackV4 { return readScope(activeScope).state; }
export function isAnonymousPersonalStackMigrationPending(): boolean { return readScope("anonymous").pendingMigration !== undefined; }
export function getPersonalStackPersistenceStatus(): StackPersistenceStatus { return readScope(activeScope).status; }

/** The future account coordinator owns this global lifecycle, independent of any page. */
export function setPersonalStackScope(scope: PersonalStackScope): void {
  if (scope === activeScope) return;
  activeScope = scope;
  readScope(scope);
  notify();
}

function commitUpdate(updater: StackUpdater): void {
  if (typeof window === "undefined") return;
  const scope = activeScope;
  const previous = readScope(scope);
  const next = updater(previous.state);
  if (previous.pendingMigration) {
    // Record the operation even when it is currently a no-op (e.g. setPaid(false)).
    // Replaying intent after recovery preserves removals rather than unioning data.
    memories.set(scope, { ...previous,
      state: next === previous.state ? previous.state : normalizePersonalStack(next),
      pendingMigration: [...previous.pendingMigration, updater],
    });
    if (next !== previous.state) notify();
    return;
  }
  if (next === previous.state) return;
  memories.set(scope, persistScope(scope, next, previous));
  notify();
}

export function replacePersonalStack(state: PersonalStackV4): void {
  const normalized = normalizePersonalStack(state);
  commitUpdate(() => normalized);
}

export function updatePersonalStack(updater: StackUpdater): void {
  commitUpdate(updater);
}

export function clearPersonalStackScope(scope: PersonalStackScope): void {
  scopeEpochs.set(scope, getPersonalStackScopeEpoch(scope) + 1);
  const entry: Snapshot = { state: normalizePersonalStack(null), raw: null, status: { state: "ok", source: "default" } };
  if (typeof window !== "undefined") {
    try {
      const storage = window.localStorage;
      // An empty envelope is a durable tombstone: stale legacy keys cannot resurrect.
      const raw = JSON.stringify(entry.state);
      storage.setItem(personalStackStorageKey(scope), raw); entry.raw = raw;
      storage.removeItem(backupKey(scope));
    } catch { entry.raw = undefined; entry.purged = true; entry.status = failed("storage-write-failed"); }
  }
  memories.set(scope, entry);
  if (scope === activeScope) notify();
}

/** Called only once anonymous work has explicitly been consumed by an account. */
export function purgeLegacyPersonalStackSources(): boolean {
  if (typeof window === "undefined") return false;
  let complete = true;
  const keys = [STACK_STATE_STORAGE_KEY, STACK_STATE_BACKUP_STORAGE_KEY, ...LEGACY_STACK_STATE_STORAGE_KEYS,
    "tooltrim-ma-stack-paid-plans-v1", "tooltrim-ma-stack-freemium-reviewed-v1", "tooltrim-ma-stack-plan-choices-v1", "tooltrim-ma-stack-decisions-v1"];
  for (const key of keys) { try { window.localStorage.removeItem(key); } catch { complete = false; } }
  try { window.localStorage.setItem(MIGRATED_KEY, "1"); } catch { complete = false; }
  return complete;
}

function handleStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== personalStackStorageKey(activeScope)) return;
  try { if (event.storageArea && event.storageArea !== window.localStorage) return; } catch { return; }
  // Never trust queued payloads; only reread the active namespace.
  readPersonalStack();
  // Notify even if an earlier subscriber refreshed the cached snapshot in render.
  notify();
}
export function subscribePersonalStack(listener: () => void): () => void {
  if (listeners.size === 0 && typeof window !== "undefined") window.addEventListener("storage", handleStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") window.removeEventListener("storage", handleStorage);
  };
}
