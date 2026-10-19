import { writeFileSync } from "node:fs";
import toolsIndex from "../src/data/tools_index.json";
import {
  STACK_PERSONAS,
  STACK_SUB_PROFILES,
  STACKS,
  STACKS_VERSION,
  getStackDerivedFields,
} from "../src/data/stacks";

const toolsBySlug = new Map(
  toolsIndex.map((tool) => [tool.slug || tool.id, tool]),
);
const toolNames = new Map(
  toolsIndex.map((tool) => [tool.slug || tool.id, tool.name]),
);

const referencedToolSlugs = new Set(
  STACKS.flatMap((stack) => stack.tools.slice(0, 6).map((tool) => tool.slug)),
);

const tools = [...referencedToolSlugs]
  .map((slug) => toolsBySlug.get(slug))
  .filter((tool): tool is (typeof toolsIndex)[number] => Boolean(tool))
  .map((tool) => ({
    id: tool.id,
    slug: tool.slug || tool.id,
    name: tool.name,
    websiteUrl: tool.websiteUrl || "",
    affiliateLink: tool.affiliateLink || "",
    logo: tool.logo || "",
    ogImageUrl: tool.ogImageUrl || null,
  }));

const stacks = STACKS.map((stack) => {
  const derived = getStackDerivedFields(stack);
  const compactTools = stack.tools.slice(0, 6).map((tool) => ({
    slug: tool.slug,
    role: tool.role,
    roleEn: tool.roleEn,
  }));
  return {
    id: stack.id,
    slug: stack.slug,
    title: stack.title,
    titleEn: stack.titleEn,
    subtitle: stack.subtitle,
    subtitleEn: stack.subtitleEn,
    persona: stack.persona,
    subProfiles: stack.subProfiles,
    monthlyBudget: stack.monthlyBudget,
    savings: stack.savings,
    risk: stack.risk,
    riskEn: stack.riskEn,
    bestFor: stack.bestFor,
    bestForEn: stack.bestForEn,
    avoidIf: stack.avoidIf,
    avoidIfEn: stack.avoidIfEn,
    tools: compactTools,
    // Only terms not reconstructible from the six displayed tools are kept.
    // This preserves searches for tools deeper in a stack without duplicating
    // every title, description and label in a precomputed searchText field.
    searchTerms: stack.tools.slice(6)
      .map((tool) => `${tool.slug} ${tool.role} ${tool.roleEn} ${toolNames.get(tool.slug) || ""}`)
      .join(" ")
      .toLocaleLowerCase("fr"),
    derived: {
      profile: derived.profile,
      objectives: derived.objectives,
      budgetRange: derived.budgetRange,
      level: derived.level,
      complexity: derived.complexity,
      stackType: derived.stackType,
      toolCount: derived.toolCount,
    },
  };
});

const missingTools = [...referencedToolSlugs].filter((slug) => !toolsBySlug.has(slug));
if (missingTools.length > 0) {
  console.warn(`Missing ${missingTools.length} tool summaries: ${missingTools.slice(0, 10).join(", ")}`);
}

const output = {
  version: STACKS_VERSION,
  personas: STACK_PERSONAS,
  subProfiles: STACK_SUB_PROFILES,
  tools,
  stacks,
};

writeFileSync("src/data/stacks-catalog-index.json", `${JSON.stringify(output)}\n`);

// Fiche outil → stacks qui l'utilisent (3 au plus). Sans ce lien, les stacks
// ne recevaient du jus que du hub /stacks. Un outil présent dans des dizaines
// de stacks (Notion, ChatGPT) les répartit : on préfère les stacks où il est
// au socle, puis celles qui ont encore reçu le moins de liens, pour étaler le
// maillage au lieu de le concentrer sur les mêmes pages.
const STACKS_PER_TOOL = 3;
const received = new Map<string, number>(STACKS.map((stack) => [stack.slug, 0]));
const byTool: Record<string, string[]> = {};
const toolSlugs = [...new Set(STACKS.flatMap((stack) => stack.tools.map((tool) => tool.slug)))].sort();
for (const toolSlug of toolSlugs) {
  const candidates = STACKS.flatMap((stack) => {
    const position = stack.tools.findIndex((tool) => tool.slug === toolSlug);
    if (position < 0) return [];
    const core = stack.tools[position].decision !== "conditional";
    return [{ slug: stack.slug, core, position }];
  }).sort((a, b) =>
    Number(b.core) - Number(a.core) ||
    (received.get(a.slug) ?? 0) - (received.get(b.slug) ?? 0) ||
    a.position - b.position ||
    a.slug.localeCompare(b.slug),
  ).slice(0, STACKS_PER_TOOL);
  for (const c of candidates) received.set(c.slug, (received.get(c.slug) ?? 0) + 1);
  byTool[toolSlug] = candidates.map((c) => c.slug);
}
const linkedStacks = new Set(Object.values(byTool).flat());
// The four first tools of each stack draw the card's folder cover, the same
// visual as the homepage stacks; only those tools' logo fields are shipped.
const FOLDER_TOOLS = 4;
const folderTools = (stack: (typeof STACKS)[number]) =>
  stack.tools.map((tool) => tool.slug).filter((slug) => toolsBySlug.has(slug)).slice(0, FOLDER_TOOLS);
const linkedStackList = STACKS.filter((stack) => linkedStacks.has(stack.slug));
const toolStacksIndex = {
  byTool,
  stacks: Object.fromEntries(
    linkedStackList.map((stack) => [stack.slug, {
      title: stack.title,
      titleEn: stack.titleEn,
      toolCount: stack.tools.length,
      monthlyBudget: stack.monthlyBudget,
      tools: folderTools(stack),
    }]),
  ),
  tools: Object.fromEntries(
    [...new Set(linkedStackList.flatMap(folderTools))].sort().map((slug) => {
      const tool = toolsBySlug.get(slug)!;
      return [slug, { name: tool.name, logo: tool.logo || "", websiteUrl: tool.websiteUrl || "" }];
    }),
  ),
};
writeFileSync("src/data/tool_stacks_index.json", `${JSON.stringify(toolStacksIndex)}\n`);
console.log(
  `tool_stacks_index.json written: ${toolSlugs.length} tools, ${linkedStacks.size}/${STACKS.length} stacks linked from a tool page`,
);
console.log(
  `stacks-catalog-index.json written: ${stacks.length} stacks, ${tools.length} tools`,
);
