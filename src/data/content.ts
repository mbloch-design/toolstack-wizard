import type { Vertical } from "./types";
import verticalsJson from "./verticals.json";

export const verticals: Record<string, Vertical> = Object.fromEntries(
  Object.entries(verticalsJson as Record<string, any>).map(([id, v]) => [
    id,
    { id, family: v.family, label: v.label, functional_needs: v.functional_needs },
  ])
);
