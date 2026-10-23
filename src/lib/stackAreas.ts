import type { ToolSummary } from "@/hooks/useSupabaseData";

/**
 * Domaines de Ma stack : leur forme (issue de stackMapTerritories) et leurs
 * couleurs, partagées par l'anneau du budget et les micro-barres du hero.
 */
export type Territory = { id: string; label: string; tools: ToolSummary[]; groups: { id: string; label: string; tools: ToolSummary[] }[] };

// Six categorical hues in a fixed order, checked with the dataviz validator
// on the #F5F5F7 surface (21 Oct 2026). No orange or red: those mean "to
// review" on Ma stack. A 7th area and beyond take the neutral, never a cycled
// hue; every area is always labelled by name.
export const AREA_COLORS = ["#2A78D6", "#EDA100", "#6250D6", "#1BAF7A", "#E87BA4", "#008300"];
export const AREA_OTHER = "#8E8E93";
