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
console.log(
  `stacks-catalog-index.json written: ${stacks.length} stacks, ${tools.length} tools`,
);
