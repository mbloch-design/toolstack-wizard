import mcpIndex from "@/data/agents/mcp_index.json";

/** Tools that host an official server with a sheet (src/data/agents/mcp_index.json). */
const PLUGGED = new Set((mcpIndex as { host_tool: string }[]).map((server) => server.host_tool));

/**
 * For a tool that does not plug into an assistant (step 2, 17/11): among its own alternatives, as the tool page shows
 * them, those that do. No fallback by category: a category is too wide (Ahrefs is not an alternative to Hotjar), so
 * an empty intersection gives no list at all.
 */
export function pluggedAlternatives<T extends { slug?: string; id: string }>(alternatives: T[], limit = 3): T[] {
  return alternatives.filter((tool) => PLUGGED.has(tool.slug || tool.id)).slice(0, limit);
}
