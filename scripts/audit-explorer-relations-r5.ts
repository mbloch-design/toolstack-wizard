// Run from the repository root: node_modules/.bin/tsx scripts/audit-explorer-relations-r5.ts
// Read-only snapshot of the same 30 sources and the visible light catalogue.
import fs from "node:fs";
import { buildExplorationCandidates, R5_AUDITED_SOURCE_SLUGS } from "../src/lib/toolExploration";
import { DEPRECATED_TOOL_SLUGS } from "../src/lib/toolVisibility";
import type { ToolSummary } from "../src/hooks/useSupabaseData";

const tools: ToolSummary[] = JSON.parse(fs.readFileSync("src/data/tools_index.json", "utf8"))
  .filter((tool: ToolSummary) => !DEPRECATED_TOOL_SLUGS.has(tool.slug || tool.id));
const signals = (tool: ToolSummary) => [
  tool.categoryId, tool.substitution_cluster_v2, tool.bundle_parent, tool.host_app,
];
const rows = R5_AUDITED_SOURCE_SLUGS.map(slug => {
  const source = tools.find(tool => tool.slug === slug);
  if (!source) return { slug, missing: true };
  return {
    slug,
    name: source.name,
    description: source.shortDescription,
    signals: signals(source),
    top: buildExplorationCandidates({
      sourceTools: [source], tools, stackEntries: [], getCategoryLabel: () => "",
    }).slice(0, 10).map(candidate => ({
      slug: candidate.tool.slug,
      direction: candidate.direction,
      reason: candidate.reasonFr,
      description: candidate.tool.shortDescription,
      signals: signals(candidate.tool),
    })),
  };
});
console.log(JSON.stringify(rows, null, 2));
