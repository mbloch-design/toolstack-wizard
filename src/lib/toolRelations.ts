import type { Tool, ToolRelation, ToolRelationKind } from "@/types/diagnostic";

function relationTargetId(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return relationTargetId(
      record.targetToolId ??
      record.target_tool_id ??
      record.id ??
      record.tool ??
      record.slug
    );
  }
  return "";
}

function normalizeId(value: unknown) {
  return relationTargetId(value).toLowerCase();
}

function uniqueRelations(relations: ToolRelation[]) {
  const seen = new Set<string>();
  const normalized: ToolRelation[] = [];
  for (const relation of relations) {
    const targetToolId = relationTargetId(relation.targetToolId);
    const key = `${relation.kind}:${normalizeId(targetToolId)}`;
    if (!targetToolId || seen.has(key)) continue;
    seen.add(key);
    normalized.push({ ...relation, targetToolId });
  }
  return normalized;
}

export function getToolRelations(tool: Tool): ToolRelation[] {
  const relations: ToolRelation[] = [...(tool.relations || [])];

  if (tool.host_app) {
    relations.push({
      kind: "plugin_of",
      targetToolId: tool.host_app,
      confidence: "catalog",
    });
  }
  if (tool.bundle_parent) {
    relations.push({
      kind: "included_in",
      targetToolId: tool.bundle_parent,
      confidence: "catalog",
    });
  }
  for (const rawTargetToolId of tool.complements || []) {
    const targetToolId = relationTargetId(rawTargetToolId);
    if (targetToolId) relations.push({ kind: "complements", targetToolId, confidence: "catalog" });
  }
  for (const rawTargetToolId of tool.integrates_with || []) {
    const targetToolId = relationTargetId(rawTargetToolId);
    if (targetToolId) relations.push({ kind: "integrates_with", targetToolId, confidence: "catalog" });
  }
  for (const rawTargetToolId of tool.alternatives || []) {
    const targetToolId = relationTargetId(rawTargetToolId);
    if (targetToolId) relations.push({ kind: "alternative_to", targetToolId, confidence: "catalog" });
  }

  return uniqueRelations(relations);
}

export function relationTargets(
  tool: Tool,
  kinds: readonly ToolRelationKind[]
) {
  const allowed = new Set(kinds);
  return getToolRelations(tool)
    .filter((relation) => allowed.has(relation.kind))
    .map((relation) => relation.targetToolId);
}

export function relationToHost(candidate: Tool, host: Tool) {
  const hostId = normalizeId(host.id);
  return getToolRelations(candidate).find(
    (relation) =>
      normalizeId(relation.targetToolId) === hostId &&
      ["plugin_of", "included_in", "complements", "integrates_with"].includes(relation.kind)
  );
}

export function areToolsDirectlyRelated(a: Tool, b: Tool) {
  const aId = normalizeId(a.id);
  const bId = normalizeId(b.id);
  return (
    getToolRelations(a).some((relation) => normalizeId(relation.targetToolId) === bId) ||
    getToolRelations(b).some((relation) => normalizeId(relation.targetToolId) === aId)
  );
}
