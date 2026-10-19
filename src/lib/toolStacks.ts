import index from "@/data/tool_stacks_index.json";

export interface StackFolderTool {
  slug: string;
  name: string;
  logo: string;
  websiteUrl: string;
}

export interface ToolStackRef {
  slug: string;
  title: string;
  toolCount: number;
  monthlyBudget: number;
  /** First tools of the stack, for the folder cover. */
  tools: StackFolderTool[];
}

type Index = {
  byTool: Record<string, string[]>;
  stacks: Record<string, { title: string; titleEn: string; toolCount: number; monthlyBudget: number; tools: string[] }>;
  tools: Record<string, { name: string; logo: string; websiteUrl: string }>;
};

const { byTool, stacks, tools } = index as Index;

/**
 * Stacks that use a tool, at most three. Generated at build time by
 * scripts/gen-stacks-catalog-index.ts, which spreads the links so a tool
 * found in dozens of stacks does not always point to the same ones.
 */
export function getStacksForTool(toolSlug: string | undefined, lang: string): ToolStackRef[] {
  if (!toolSlug) return [];
  return (byTool[toolSlug] ?? []).flatMap((slug) => {
    const stack = stacks[slug];
    if (!stack) return [];
    return [{
      slug,
      title: lang === "en" ? stack.titleEn : stack.title,
      toolCount: stack.toolCount,
      monthlyBudget: stack.monthlyBudget,
      tools: stack.tools.flatMap((toolSlug) => (tools[toolSlug] ? [{ slug: toolSlug, ...tools[toolSlug] }] : [])),
    }];
  });
}
