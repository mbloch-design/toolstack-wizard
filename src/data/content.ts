import type { Vertical } from "./types";
import verticalsJson from "./verticals.json";

// Verticals — the only consumed export here.
// Tools are loaded lazily via useSupabaseData's dynamic import.
// Categories live in their own data layer; this module no longer
// re-derives them from content.json.
export const verticals: Record<string, Vertical> = Object.fromEntries(
  Object.entries(verticalsJson as Record<string, { family: string; label: string; functional_needs: string[] }>).map(([id, v]) => [
    id,
    { id, family: v.family as VerticalFamily, label: v.label, functional_needs: v.functional_needs },
  ])
);
