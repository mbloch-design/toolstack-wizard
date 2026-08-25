export const STACK_STATE_VERSION = 3 as const;
export const STACK_STATE_STORAGE_KEY = "tooltrim-ma-stack-mvp-v3";
export const STACK_STATE_BACKUP_STORAGE_KEY = `${STACK_STATE_STORAGE_KEY}-backup`;

export const LEGACY_STACK_STATE_STORAGE_KEYS = [
  "tooltrim-ma-stack-mvp-v2",
  "tooltrim-ma-stack-mvp-v2-backup",
  "tooltrim-tool-cart-mvp-v1",
  "tooltrim-tool-cart-v1",
  "tooltrim-stack-builder-preprod",
  "tooltrim-stack-pins-preprod",
  "tooltrim-stack-pins-preprod-v2",
  "tooltrim-stack-pins-preprod-v3",
] as const;

export type StackNeedSource = "suggested" | "custom";
export type StackToolIntent = "stack" | "wishlist";

export interface StackNeed {
  id: string;
  labelFr: string;
  labelEn: string;
  order: number;
  source: StackNeedSource;
}

export interface StackToolEntry {
  toolSlug: string;
  needIds: string[];
  addedAt: string;
  assignmentMode: "pending" | "auto" | "manual";
  intent: StackToolIntent;
}

export interface ToolCartState {
  version: typeof STACK_STATE_VERSION;
  needs: StackNeed[];
  toolEntries: StackToolEntry[];
  /** Compatibility view for existing consumers. `toolEntries` is canonical. */
  pinnedToolSlugs: string[];
}

export type StackStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type StackPersistenceSource = "current" | "backup" | "legacy" | "default" | "memory";
export type StackPersistenceIssue =
  | "current-corrupt"
  | "backup-corrupt"
  | "storage-read-failed"
  | "storage-write-failed"
  | "backup-write-failed"
  | "migration-write-failed";

export interface StackPersistenceStatus {
  state: "ok" | "recovered" | "degraded";
  source: StackPersistenceSource;
  issue?: StackPersistenceIssue;
  message?: string;
}

export interface StackStateLoadResult {
  state: ToolCartState;
  status: StackPersistenceStatus;
}

export interface StackStateSaveResult {
  state: ToolCartState;
  status: StackPersistenceStatus;
}

export const DEFAULT_STACK_NEEDS: StackNeed[] = [
  { id: "ia", labelFr: "Travailler avec l'IA", labelEn: "Work with AI", order: 10, source: "suggested" },
  { id: "organisation", labelFr: "Organiser mon travail", labelEn: "Organize my work", order: 20, source: "suggested" },
  { id: "design", labelFr: "Créer des visuels", labelEn: "Create visuals", order: 30, source: "suggested" },
  { id: "automation", labelFr: "Automatiser mes tâches", labelEn: "Automate my tasks", order: 40, source: "suggested" },
  { id: "marketing", labelFr: "Faire connaître mon activité", labelEn: "Promote my business", order: 50, source: "suggested" },
  { id: "vente", labelFr: "Vendre et suivre mes clients", labelEn: "Sell and manage clients", order: 60, source: "suggested" },
  { id: "finance", labelFr: "Gérer mes finances", labelEn: "Manage my finances", order: 70, source: "suggested" },
  { id: "dev", labelFr: "Développer mes produits", labelEn: "Build my products", order: 80, source: "suggested" },
];

export const LEGACY_STACK_ENTRY_ADDED_AT = "1970-01-01T00:00:00.000Z";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)));
}

function normalizeNeed(value: unknown): StackNeed | null {
  const record = asRecord(value);
  if (!record || typeof record.id !== "string" || !record.id.trim()) return null;

  const fallback = DEFAULT_STACK_NEEDS.find((need) => need.id === record.id);
  const labelFr = typeof record.labelFr === "string" && record.labelFr.trim()
    ? record.labelFr.trim()
    : fallback?.labelFr || record.id;
  const labelEn = typeof record.labelEn === "string" && record.labelEn.trim()
    ? record.labelEn.trim()
    : fallback?.labelEn || labelFr;
  const order = Number.isFinite(Number(record.order)) ? Number(record.order) : fallback?.order || 999;

  return {
    id: record.id,
    labelFr,
    labelEn,
    order,
    source: record.source === "custom" ? "custom" : "suggested",
  };
}

function normalizeEntry(value: unknown): StackToolEntry | null {
  const record = asRecord(value);
  if (!record || typeof record.toolSlug !== "string" || !record.toolSlug.trim()) return null;

  const needIds = uniqueStrings(record.needIds);
  const addedAt = typeof record.addedAt === "string" && record.addedAt ? record.addedAt : LEGACY_STACK_ENTRY_ADDED_AT;
  return {
    toolSlug: record.toolSlug.trim(),
    needIds,
    addedAt,
    assignmentMode: record.assignmentMode === "manual"
      ? "manual"
      : record.assignmentMode === "auto"
        ? "auto"
        : addedAt === LEGACY_STACK_ENTRY_ADDED_AT || needIds.length === 0
          ? "pending"
          : "manual",
    intent: record.intent === "wishlist" ? "wishlist" : "stack",
  };
}

export function createDefaultToolCartState(): ToolCartState {
  return {
    version: STACK_STATE_VERSION,
    needs: DEFAULT_STACK_NEEDS.map((need) => ({ ...need })),
    toolEntries: [],
    pinnedToolSlugs: [],
  };
}

export function normalizeToolCartState(value: unknown): ToolCartState {
  const record = asRecord(value);
  if (!record) return createDefaultToolCartState();

  const legacySlugs = uniqueStrings(record.pinnedToolSlugs);
  const rawEntries = Array.isArray(record.toolEntries)
    ? record.toolEntries.map(normalizeEntry).filter((entry): entry is StackToolEntry => !!entry)
    : [];
  const entryBySlug = new Map<string, StackToolEntry>();

  rawEntries.forEach((entry) => {
    if (!entryBySlug.has(entry.toolSlug)) entryBySlug.set(entry.toolSlug, entry);
  });
  legacySlugs.forEach((toolSlug) => {
    if (!entryBySlug.has(toolSlug)) {
      entryBySlug.set(toolSlug, { toolSlug, needIds: [], addedAt: LEGACY_STACK_ENTRY_ADDED_AT, assignmentMode: "pending", intent: "stack" });
    }
  });

  const orderedSlugs = [
    ...legacySlugs,
    ...Array.from(entryBySlug.keys()).filter((toolSlug) => !legacySlugs.includes(toolSlug)),
  ];
  const toolEntries = orderedSlugs.map((toolSlug) => entryBySlug.get(toolSlug) as StackToolEntry);

  const needById = new Map<string, StackNeed>();
  DEFAULT_STACK_NEEDS.forEach((need) => needById.set(need.id, { ...need }));
  if (Array.isArray(record.needs)) {
    record.needs.map(normalizeNeed).filter((need): need is StackNeed => !!need).forEach((need) => {
      needById.set(need.id, need);
    });
  }

  const needs = Array.from(needById.values()).sort((a, b) => a.order - b.order || a.labelFr.localeCompare(b.labelFr));
  const knownNeedIds = new Set(needs.map((need) => need.id));
  const sanitizedEntries = toolEntries.map((entry) => ({
    ...entry,
    needIds: entry.needIds.filter((needId) => knownNeedIds.has(needId)),
  }));

  return {
    version: STACK_STATE_VERSION,
    needs,
    toolEntries: sanitizedEntries,
    pinnedToolSlugs: sanitizedEntries.map((entry) => entry.toolSlug),
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isStoredCurrentState(value: unknown): value is Record<string, unknown> {
  const record = asRecord(value);
  if (!record || record.version !== STACK_STATE_VERSION) return false;
  if (!Array.isArray(record.needs) || !Array.isArray(record.toolEntries) || !Array.isArray(record.pinnedToolSlugs)) return false;
  if (!record.pinnedToolSlugs.every((item) => typeof item === "string")) return false;
  if (!record.needs.every((item) => {
    const need = asRecord(item);
    return !!need && typeof need.id === "string" && need.id.trim().length > 0;
  })) return false;
  return record.toolEntries.every((item) => {
    const entry = asRecord(item);
    return !!entry
      && typeof entry.toolSlug === "string"
      && entry.toolSlug.trim().length > 0
      && Array.isArray(entry.needIds)
      && entry.needIds.every((needId) => typeof needId === "string");
  });
}

export function parseToolCartStateSnapshot(raw: string | null): ToolCartState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return isStoredCurrentState(parsed) ? normalizeToolCartState(parsed) : null;
  } catch {
    return null;
  }
}

function parseLegacyStoredState(raw: string | null): ToolCartState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const record = asRecord(parsed);
    if (!record || (!Array.isArray(record.pinnedToolSlugs) && !Array.isArray(record.toolEntries))) return null;
    return normalizeToolCartState(parsed);
  } catch {
    return null;
  }
}

function readStorage(storage: StackStorage, key: string): { raw: string | null; error?: string } {
  try {
    return { raw: storage.getItem(key) };
  } catch (error) {
    return { raw: null, error: errorMessage(error) };
  }
}

function writeStorage(storage: StackStorage, key: string, value: string): string | null {
  try {
    storage.setItem(key, value);
    return null;
  } catch (error) {
    return errorMessage(error);
  }
}

export function loadToolCartStateWithStatus(storage: StackStorage): StackStateLoadResult {
  const currentRead = readStorage(storage, STACK_STATE_STORAGE_KEY);
  const current = parseToolCartStateSnapshot(currentRead.raw);
  if (current) {
    return {
      state: current,
      status: { state: "ok", source: "current" },
    };
  }

  const currentCorrupt = currentRead.raw !== null;
  const backupRead = readStorage(storage, STACK_STATE_BACKUP_STORAGE_KEY);
  const backup = parseToolCartStateSnapshot(backupRead.raw);
  if (backup) {
    const serialized = JSON.stringify(backup);
    const restoreError = writeStorage(storage, STACK_STATE_STORAGE_KEY, serialized);
    return {
      state: backup,
      status: {
        state: restoreError ? "degraded" : "recovered",
        source: "backup",
        issue: restoreError ? "storage-write-failed" : currentCorrupt ? "current-corrupt" : undefined,
        message: restoreError || undefined,
      },
    };
  }

  const backupCorrupt = backupRead.raw !== null;

  for (const legacyKey of LEGACY_STACK_STATE_STORAGE_KEYS) {
    const legacyRead = readStorage(storage, legacyKey);
    const migrated = parseLegacyStoredState(legacyRead.raw);
    if (!migrated) continue;

    const saved = saveToolCartStateWithStatus(storage, migrated);
    if (saved.status.issue !== "storage-write-failed") {
      LEGACY_STACK_STATE_STORAGE_KEYS.forEach((key) => {
        try {
          storage.removeItem(key);
        } catch {
          // The migrated current state is already durable; stale legacy data is harmless.
        }
      });
    }
    return {
      state: saved.state,
      status: saved.status.issue === "storage-write-failed"
        ? {
          state: "degraded",
          source: "legacy",
          issue: "migration-write-failed",
          message: saved.status.message,
        }
        : {
          state: currentCorrupt || backupCorrupt ? "recovered" : "ok",
          source: "legacy",
          issue: currentCorrupt ? "current-corrupt" : backupCorrupt ? "backup-corrupt" : undefined,
        },
    };
  }

  const readError = currentRead.error || backupRead.error;
  return {
    state: createDefaultToolCartState(),
    status: {
      state: readError || currentCorrupt || backupCorrupt ? "degraded" : "ok",
      source: "default",
      issue: readError
        ? "storage-read-failed"
        : currentCorrupt
          ? "current-corrupt"
          : backupCorrupt
            ? "backup-corrupt"
            : undefined,
      message: readError,
    },
  };
}

export function loadToolCartState(storage: StackStorage): ToolCartState {
  return loadToolCartStateWithStatus(storage).state;
}

export function saveToolCartStateWithStatus(storage: StackStorage, state: ToolCartState): StackStateSaveResult {
  const normalized = normalizeToolCartState(state);
  const serialized = JSON.stringify(normalized);
  const currentRead = readStorage(storage, STACK_STATE_STORAGE_KEY);
  const previous = parseToolCartStateSnapshot(currentRead.raw);
  let backupError: string | null = null;

  if (previous) {
    backupError = writeStorage(storage, STACK_STATE_BACKUP_STORAGE_KEY, JSON.stringify(previous));
  }

  const writeError = writeStorage(storage, STACK_STATE_STORAGE_KEY, serialized);
  if (writeError) {
    return {
      state: normalized,
      status: {
        state: "degraded",
        source: "memory",
        issue: "storage-write-failed",
        message: writeError,
      },
    };
  }

  if (!previous) {
    backupError = writeStorage(storage, STACK_STATE_BACKUP_STORAGE_KEY, serialized);
  }

  return {
    state: normalized,
    status: backupError
      ? { state: "degraded", source: "current", issue: "backup-write-failed", message: backupError }
      : { state: "ok", source: "current" },
  };
}

export function saveToolCartState(storage: StackStorage, state: ToolCartState): ToolCartState {
  return saveToolCartStateWithStatus(storage, state).state;
}

export function pinToolInState(
  state: ToolCartState,
  toolSlug: string,
  needIds: string[] = [],
  addedAt = new Date().toISOString(),
  assignmentMode: StackToolEntry["assignmentMode"] = needIds.length > 0 ? "manual" : "pending",
  intent: StackToolIntent = "stack",
): ToolCartState {
  const normalized = normalizeToolCartState(state);
  const slug = toolSlug.trim();
  if (!slug) return normalized;

  const knownNeedIds = new Set(normalized.needs.map((need) => need.id));
  const validNeedIds = Array.from(new Set(needIds.filter((needId) => knownNeedIds.has(needId))));
  const existing = normalized.toolEntries.find((entry) => entry.toolSlug === slug);
  const toolEntries = existing
    ? normalized.toolEntries.map((entry) => entry.toolSlug === slug
      ? {
        ...entry,
        needIds: Array.from(new Set([...entry.needIds, ...validNeedIds])),
        assignmentMode: validNeedIds.length > 0 ? assignmentMode : entry.assignmentMode,
        intent,
      }
      : entry)
    : [...normalized.toolEntries, { toolSlug: slug, needIds: validNeedIds, addedAt, assignmentMode, intent }];

  return normalizeToolCartState({ ...normalized, toolEntries, pinnedToolSlugs: toolEntries.map((entry) => entry.toolSlug) });
}

export function saveToolSelectionInState(
  state: ToolCartState,
  toolSlug: string,
  needIds: string[],
  intent: StackToolIntent,
  addedAt = new Date().toISOString(),
): ToolCartState {
  const normalized = normalizeToolCartState(state);
  const slug = toolSlug.trim();
  if (!slug) return normalized;

  const knownNeedIds = new Set(normalized.needs.map((need) => need.id));
  const validNeedIds = Array.from(new Set(needIds.filter((needId) => knownNeedIds.has(needId))));
  const existing = normalized.toolEntries.find((entry) => entry.toolSlug === slug);
  const nextEntry: StackToolEntry = {
    toolSlug: slug,
    needIds: validNeedIds,
    addedAt: existing?.addedAt || addedAt,
    assignmentMode: "manual",
    intent,
  };
  const toolEntries = existing
    ? normalized.toolEntries.map((entry) => entry.toolSlug === slug ? nextEntry : entry)
    : [...normalized.toolEntries, nextEntry];

  return normalizeToolCartState({ ...normalized, toolEntries, pinnedToolSlugs: toolEntries.map((entry) => entry.toolSlug) });
}

export function getToolSlugsByIntent(state: ToolCartState, intent: StackToolIntent): string[] {
  return normalizeToolCartState(state).toolEntries
    .filter((entry) => entry.intent === intent)
    .map((entry) => entry.toolSlug);
}

export function unpinToolInState(state: ToolCartState, toolSlug: string): ToolCartState {
  const normalized = normalizeToolCartState(state);
  const toolEntries = normalized.toolEntries.filter((entry) => entry.toolSlug !== toolSlug);
  return normalizeToolCartState({ ...normalized, toolEntries, pinnedToolSlugs: toolEntries.map((entry) => entry.toolSlug) });
}

export function assignToolNeedsInState(state: ToolCartState, toolSlug: string, needIds: string[]): ToolCartState {
  const normalized = normalizeToolCartState(state);
  const knownNeedIds = new Set(normalized.needs.map((need) => need.id));
  const validNeedIds = Array.from(new Set(needIds.filter((needId) => knownNeedIds.has(needId))));
  const toolEntries = normalized.toolEntries.map((entry) => entry.toolSlug === toolSlug
    ? { ...entry, needIds: validNeedIds, assignmentMode: "manual" as const }
    : entry);
  return normalizeToolCartState({ ...normalized, toolEntries, pinnedToolSlugs: toolEntries.map((entry) => entry.toolSlug) });
}

export function assignToolNeedsBatchInState(
  state: ToolCartState,
  assignments: Record<string, string[]>,
): ToolCartState {
  const normalized = normalizeToolCartState(state);
  const knownNeedIds = new Set(normalized.needs.map((need) => need.id));
  const toolEntries = normalized.toolEntries.map((entry) => {
    const requestedNeedIds = assignments[entry.toolSlug];
    if (!requestedNeedIds) return entry;
    return {
      ...entry,
      needIds: Array.from(new Set(requestedNeedIds.filter((needId) => knownNeedIds.has(needId)))),
      assignmentMode: "manual" as const,
    };
  });
  return normalizeToolCartState({ ...normalized, toolEntries, pinnedToolSlugs: toolEntries.map((entry) => entry.toolSlug) });
}

export function assignToolNeedsAutomaticallyInState(
  state: ToolCartState,
  assignments: Record<string, string[]>,
): ToolCartState {
  const normalized = normalizeToolCartState(state);
  const knownNeedIds = new Set(normalized.needs.map((need) => need.id));
  const toolEntries = normalized.toolEntries.map((entry) => {
    const requestedNeedIds = assignments[entry.toolSlug];
    if (!requestedNeedIds || entry.assignmentMode !== "pending") return entry;
    return {
      ...entry,
      needIds: Array.from(new Set(requestedNeedIds.filter((needId) => knownNeedIds.has(needId)))),
      assignmentMode: "auto" as const,
    };
  });
  return normalizeToolCartState({ ...normalized, toolEntries, pinnedToolSlugs: toolEntries.map((entry) => entry.toolSlug) });
}

function normalizeCustomNeedLabel(label: string) {
  return label.trim().replace(/\s+/g, " ").slice(0, 60);
}

function customNeedSlug(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "besoin";
}

function resequenceNeeds(needs: StackNeed[]) {
  return needs.map((need, index) => ({ ...need, order: (index + 1) * 10 }));
}

export function createCustomNeedInState(
  state: ToolCartState,
  label: string,
): { state: ToolCartState; needId: string | null } {
  const normalized = normalizeToolCartState(state);
  const cleanLabel = normalizeCustomNeedLabel(label);
  if (!cleanLabel) return { state: normalized, needId: null };

  const existingIds = new Set(normalized.needs.map((need) => need.id));
  const baseId = `custom-${customNeedSlug(cleanLabel)}`;
  let needId = baseId;
  let suffix = 2;
  while (existingIds.has(needId)) {
    needId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  const needs = resequenceNeeds([
    ...normalized.needs,
    {
      id: needId,
      labelFr: cleanLabel,
      labelEn: cleanLabel,
      order: normalized.needs.length * 10 + 10,
      source: "custom" as const,
    },
  ]);

  return {
    state: normalizeToolCartState({ ...normalized, needs }),
    needId,
  };
}

export function renameCustomNeedInState(state: ToolCartState, needId: string, label: string): ToolCartState {
  const normalized = normalizeToolCartState(state);
  const cleanLabel = normalizeCustomNeedLabel(label);
  if (!cleanLabel) return normalized;

  const needs = normalized.needs.map((need) => need.id === needId
    ? { ...need, labelFr: cleanLabel, labelEn: cleanLabel }
    : need);
  return normalizeToolCartState({ ...normalized, needs });
}

export function deleteCustomNeedInState(state: ToolCartState, needId: string): ToolCartState {
  const normalized = normalizeToolCartState(state);
  const target = normalized.needs.find((need) => need.id === needId);
  if (!target || target.source !== "custom") return normalized;

  const needs = resequenceNeeds(normalized.needs.filter((need) => need.id !== needId));
  const toolEntries = normalized.toolEntries.map((entry) => ({
    ...entry,
    needIds: entry.needIds.filter((id) => id !== needId),
  }));
  return normalizeToolCartState({ ...normalized, needs, toolEntries });
}

export function moveNeedInState(state: ToolCartState, needId: string, direction: -1 | 1): ToolCartState {
  const normalized = normalizeToolCartState(state);
  const currentIndex = normalized.needs.findIndex((need) => need.id === needId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= normalized.needs.length) return normalized;

  const needs = [...normalized.needs];
  const [need] = needs.splice(currentIndex, 1);
  needs.splice(nextIndex, 0, need);
  return normalizeToolCartState({ ...normalized, needs: resequenceNeeds(needs) });
}

export function reorderToolsInState(state: ToolCartState, orderedSlugs: string[]): ToolCartState {
  const normalized = normalizeToolCartState(state);
  const entryBySlug = new Map(normalized.toolEntries.map((entry) => [entry.toolSlug, entry]));
  const knownOrder = uniqueStrings(orderedSlugs).filter((toolSlug) => entryBySlug.has(toolSlug));
  const remaining = normalized.toolEntries
    .map((entry) => entry.toolSlug)
    .filter((toolSlug) => !knownOrder.includes(toolSlug));
  const toolEntries = [...knownOrder, ...remaining].map((toolSlug) => entryBySlug.get(toolSlug) as StackToolEntry);
  return normalizeToolCartState({ ...normalized, toolEntries, pinnedToolSlugs: toolEntries.map((entry) => entry.toolSlug) });
}
