import type {
  AiContributionMode,
  WorkflowMethod,
  WorkflowUsage,
} from "@/types/diagnostic";
import { normalizeAiActors } from "@/lib/aiWorkflow";

type ObjectiveLike = {
  id: string;
  fr: string;
  en: string;
};

export function workflowUsageId(objectiveId: string) {
  return `usage-${objectiveId}`;
}

export function deriveWorkflowUsages(
  toolUsageMap: Record<string, string[]> = {},
  objectives: readonly ObjectiveLike[] = []
): WorkflowUsage[] {
  const objectiveMap = new Map(objectives.map((objective) => [objective.id, objective]));
  const toolIdsByObjective = new Map<string, string[]>();

  Object.entries(toolUsageMap).forEach(([toolId, objectiveIds]) => {
    objectiveIds.forEach((objectiveId) => {
      const toolIds = toolIdsByObjective.get(objectiveId) || [];
      toolIds.push(toolId);
      toolIdsByObjective.set(objectiveId, toolIds);
    });
  });

  return [...toolIdsByObjective.entries()].map(([objectiveId, toolIds]) => {
    const objective = objectiveMap.get(objectiveId);
    return {
      id: workflowUsageId(objectiveId),
      objectiveId,
      objectiveLabelFr: objective?.fr || objectiveId,
      objectiveLabelEn: objective?.en || objectiveId,
      method: "tool",
      toolIds: [...new Set(toolIds)],
      aiMode: "unknown",
      aiToolIds: [],
      aiActors: [],
    };
  });
}

export function getWorkflowUsage(
  usages: WorkflowUsage[],
  objective: ObjectiveLike
): WorkflowUsage {
  return usages.find((usage) => usage.objectiveId === objective.id) || {
    id: workflowUsageId(objective.id),
    objectiveId: objective.id,
    objectiveLabelFr: objective.fr,
    objectiveLabelEn: objective.en,
    method: "unknown",
    toolIds: [],
    aiMode: "unknown",
    aiToolIds: [],
    aiActors: [],
  };
}

export function upsertWorkflowUsage(
  usages: WorkflowUsage[],
  objective: ObjectiveLike,
  patch: Partial<WorkflowUsage>
) {
  const current = getWorkflowUsage(usages, objective);
  const next: WorkflowUsage = {
    ...current,
    ...patch,
    id: current.id || workflowUsageId(objective.id),
    objectiveId: objective.id,
    objectiveLabelFr: objective.fr,
    objectiveLabelEn: objective.en,
    toolIds: [...new Set(patch.toolIds ?? current.toolIds)],
    aiToolIds: [...new Set(patch.aiToolIds ?? current.aiToolIds)],
    aiActors: normalizeAiActors(patch.aiActors ?? current.aiActors),
  };
  const existingIndex = usages.findIndex((usage) => usage.objectiveId === objective.id);
  if (existingIndex < 0) return [...usages, next];
  return usages.map((usage, index) => index === existingIndex ? next : usage);
}

export function inferWorkflowMethod(toolIds: string[], customMethod?: string): WorkflowMethod {
  if (toolIds.length > 0 && customMethod?.trim()) return "mixed";
  if (toolIds.length > 0) return "tool";
  if (customMethod?.trim()) return "manual";
  return "unknown";
}

export function normalizeAiMode(value: unknown): AiContributionMode {
  return ["none", "integrated", "external", "mixed", "automated", "unknown"].includes(String(value))
    ? value as AiContributionMode
    : "unknown";
}

export function usageMapFromWorkflowUsages(usages: WorkflowUsage[]) {
  const result: Record<string, string[]> = {};
  usages.forEach((usage) => {
    usage.toolIds.forEach((toolId) => {
      const objectiveIds = new Set(result[toolId] || []);
      objectiveIds.add(usage.objectiveId);
      result[toolId] = [...objectiveIds];
    });
  });
  return result;
}

export function mergeWorkflowUsages(
  derived: WorkflowUsage[],
  existing: WorkflowUsage[] = []
) {
  const existingByObjective = new Map(
    existing.map((usage) => [usage.objectiveId, usage])
  );
  const merged = derived.map((usage) => {
    const saved = existingByObjective.get(usage.objectiveId);
    if (!saved) return usage;
    existingByObjective.delete(usage.objectiveId);
    return {
      ...usage,
      ...saved,
      toolIds: [...new Set([...usage.toolIds, ...saved.toolIds])],
      aiToolIds: [...new Set(saved.aiToolIds || [])],
      aiActors: normalizeAiActors(saved.aiActors),
    };
  });
  return [...merged, ...existingByObjective.values()];
}
