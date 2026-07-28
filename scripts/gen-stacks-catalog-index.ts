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

const toolNames = new Map(
  toolsIndex.map((tool) => [tool.slug || tool.id, tool.name]),
);
const personaLabels = new Map(STACK_PERSONAS.map((item) => [item.value, `${item.label} ${item.labelEn}`]));
const subProfileLabels = new Map(STACK_SUB_PROFILES.map((item) => [item.value, `${item.label} ${item.labelEn}`]));

const stacks = STACKS.map((stack) => {
  const derived = getStackDerivedFields(stack);
  const compactTools = stack.tools.slice(0, 6).map((tool) => ({
    slug: tool.slug,
    role: tool.role,
    roleEn: tool.roleEn,
  }));
  const searchText = [
    stack.title,
    stack.titleEn,
    stack.subtitle,
    stack.subtitleEn,
    stack.bestFor,
    stack.bestForEn,
    stack.avoidIf,
    stack.avoidIfEn,
    stack.risk,
    stack.riskEn,
    personaLabels.get(stack.persona),
    ...stack.subProfiles.map((subProfile) => `${subProfile} ${subProfileLabels.get(subProfile) || ""}`),
    ...derived.objectives,
    ...stack.tools.map((tool) => `${tool.slug} ${tool.role} ${tool.roleEn} ${toolNames.get(tool.slug) || ""}`),
  ].join(" ").toLocaleLowerCase("fr");

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
    risk: stack.risk,
    riskEn: stack.riskEn,
    bestFor: stack.bestFor,
    bestForEn: stack.bestForEn,
    avoidIf: stack.avoidIf,
    avoidIfEn: stack.avoidIfEn,
    tools: compactTools,
    derived: {
      profile: derived.profile,
      objectives: derived.objectives,
      budgetRange: derived.budgetRange,
      level: derived.level,
      complexity: derived.complexity,
      stackType: derived.stackType,
      toolCount: derived.toolCount,
    },
    searchText,
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
