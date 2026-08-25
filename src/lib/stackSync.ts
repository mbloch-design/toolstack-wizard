import { normalizeToolCartState, type ToolCartState } from "@/lib/stackState";

export function mergeToolCartStates(localState: ToolCartState, remoteState: unknown): ToolCartState {
  const local = normalizeToolCartState(localState);
  const remote = normalizeToolCartState(remoteState);
  const needs = new Map(remote.needs.map((need) => [need.id, need]));
  local.needs.forEach((need) => needs.set(need.id, need));

  const entries = new Map(remote.toolEntries.map((entry) => [entry.toolSlug, entry]));
  local.toolEntries.forEach((entry) => entries.set(entry.toolSlug, entry));

  return normalizeToolCartState({
    ...local,
    needs: Array.from(needs.values()),
    toolEntries: Array.from(entries.values()),
    pinnedToolSlugs: Array.from(entries.keys()),
  });
}

export function stackStateFingerprint(state: ToolCartState) {
  return JSON.stringify(normalizeToolCartState(state));
}
