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
// CSS tokens (src/index.css), so they get their Display P3 twin (29 Oct 2026).
// They work in style props; in SVG pass them as style, not as attributes.
export const AREA_COLORS = ["var(--color-area-1)", "var(--color-area-2)", "var(--color-area-3)", "var(--color-area-4)", "var(--color-area-5)", "var(--color-area-6)"];
export const AREA_OTHER = "var(--color-area-other)";
