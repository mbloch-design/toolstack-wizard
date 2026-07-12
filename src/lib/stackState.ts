export const STACK_STATE_VERSION = 2 as const;
export const STACK_STATE_STORAGE_KEY = "tooltrim-ma-stack-mvp-v2";

export const LEGACY_STACK_STATE_STORAGE_KEYS = [
  "tooltrim-tool-cart-mvp-v1",
  "tooltrim-tool-cart-v1",
  "tooltrim-stack-builder-preprod",
  "tooltrim-stack-pins-preprod",
  "tooltrim-stack-pins-preprod-v2",
  "tooltrim-stack-pins-preprod-v3",
] as const;

export type StackNeedSource = "suggested" | "custom";

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
}

export interface ToolCartState {
  version: typeof STACK_STATE_VERSION;
  needs: StackNeed[];
  toolEntries: StackToolEntry[];
  /** Compatibility view for existing consumers. `toolEntries` is canonical. */
  pinnedToolSlugs: string[];
}

export type StackStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

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
  const useSuggestedLabel = fallback && record.source !== "custom";
  const labelFr = useSuggestedLabel
    ? fallback.labelFr
    : typeof record.labelFr === "string" && record.labelFr.trim()
    ? record.labelFr.trim()
    : fallback?.labelFr || record.id;
  const labelEn = useSuggestedLabel
    ? fallback.labelEn
    : typeof record.labelEn === "string" && record.labelEn.trim()
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
      entryBySlug.set(toolSlug, { toolSlug, needIds: [], addedAt: LEGACY_STACK_ENTRY_ADDED_AT, assignmentMode: "pending" });
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

function parseStoredState(raw: string | null): ToolCartState | null {
  if (!raw) return null;
  try {
    return normalizeToolCartState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function loadToolCartState(storage: StackStorage): ToolCartState {
  const current = parseStoredState(storage.getItem(STACK_STATE_STORAGE_KEY));
  if (current) return current;

  for (const legacyKey of LEGACY_STACK_STATE_STORAGE_KEYS) {
    const migrated = parseStoredState(storage.getItem(legacyKey));
    if (!migrated) continue;

    try {
      storage.setItem(STACK_STATE_STORAGE_KEY, JSON.stringify(migrated));
      LEGACY_STACK_STATE_STORAGE_KEYS.forEach((key) => storage.removeItem(key));
    } catch {
      // Keep the migrated state in memory and leave legacy data untouched.
    }
    return migrated;
  }

  return createDefaultToolCartState();
}

export function saveToolCartState(storage: StackStorage, state: ToolCartState): ToolCartState {
  const normalized = normalizeToolCartState(state);
  storage.setItem(STACK_STATE_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function pinToolInState(
  state: ToolCartState,
  toolSlug: string,
  needIds: string[] = [],
  addedAt = new Date().toISOString(),
  assignmentMode: StackToolEntry["assignmentMode"] = needIds.length > 0 ? "manual" : "pending",
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
      }
      : entry)
    : [...normalized.toolEntries, { toolSlug: slug, needIds: validNeedIds, addedAt, assignmentMode }];

  return normalizeToolCartState({ ...normalized, toolEntries, pinnedToolSlugs: toolEntries.map((entry) => entry.toolSlug) });
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

  const needs = normalized.needs.map((need) => need.id === needId && need.source === "custom"
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
