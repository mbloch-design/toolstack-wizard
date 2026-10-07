import type { ToolSummary } from "@/hooks/useSupabaseData";

/**
 * Domaines de Ma stack : leur forme (issue de stackMapTerritories) et leurs
 * couleurs, partagées par l'anneau du budget et les micro-barres du hero.
 */
export type Territory = { id: string; label: string; tools: ToolSummary[]; groups: { id: string; label: string; tools: ToolSummary[] }[] };

export const AREA_COLORS = ["#2F6FED", "#7C3AED", "#0E9F6E", "#E8590C", "#D6336C", "#0C8599", "#B08800", "#5F3DC4"];
