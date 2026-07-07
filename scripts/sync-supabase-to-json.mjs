import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";

const clientSource = await readFile("src/integrations/supabase/client.ts", "utf8");
const SUPABASE_URL = clientSource.match(/SUPABASE_URL = "([^"]+)"/)?.[1];
const SUPABASE_PUBLISHABLE_KEY = clientSource.match(/SUPABASE_PUBLISHABLE_KEY = "([^"]+)"/)?.[1];

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Unable to read Supabase config from src/integrations/supabase/client.ts");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const isEmpty = (value) => {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

const pick = (remote, local) => (isEmpty(remote) && !isEmpty(local) ? local : remote);

async function fetchAll(table) {
  const pageSize = 1000;
  const rows = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
  }
}

function mapTool(row, local = {}) {
  return {
    ...local,
    id: row.id,
    slug: row.slug || row.id,
    name: row.name,
    category: row.category || "",
    shortDescription: pick(row.short_description, local.shortDescription),
    shortDescriptionEn: pick(row.short_description_en, local.shortDescriptionEn),
    description: pick(row.long_description, local.description),
    longDescription: pick(row.long_description, local.longDescription),
    longDescriptionEn: pick(row.long_description_en, local.longDescriptionEn),
    pricing: pick(row.pricing, local.pricing),
    pricingEn: pick(row.pricing_en, local.pricingEn),
    defaultMonthlyPrice: Number(row.default_monthly_price) || local.defaultMonthlyPrice || 0,
    pricing_v5: pick(row.pricing_v5, local.pricing_v5),
    affiliateLink: pick(row.affiliate_link, local.affiliateLink),
    websiteUrl: pick(row.website_url, local.websiteUrl),
    logo: pick(row.logo, local.logo),
    seo: pick(row.seo, local.seo),
    articles: pick(row.articles, local.articles) || [],
    covers: pick(row.covers, local.covers) || [],
    freeAlternative: pick(row.free_alternative, local.freeAlternative),
    soloRelevance: pick(row.solo_relevance, local.soloRelevance),
    teamRelevance: pick(row.team_relevance, local.teamRelevance),
    relevantFor: pick(row.relevant_for, local.relevantFor) || [],
    alternatives: pick(row.alternatives, local.alternatives) || [],
    verdict: pick(row.verdict, local.verdict),
    verdictEn: pick(row.verdict_en, local.verdictEn),
    pros: pick(row.pros, local.pros) || [],
    prosEn: pick(row.pros_en, local.prosEn),
    cons: pick(row.cons, local.cons) || [],
    consEn: pick(row.cons_en, local.consEn),
    useCases: pick(row.use_cases, local.useCases) || [],
    useCasesEn: pick(row.use_cases_en, local.useCasesEn),
    personas: pick(row.personas, local.personas) || [],
    timeGainedHoursPerMonth: row.time_gained_hours_per_month ?? local.timeGainedHoursPerMonth,
    tool_type: pick(row.tool_type, local.tool_type) || "satellite",
    substitutable: row.substitutable ?? local.substitutable ?? true,
    host_app: pick(row.host_app, local.host_app),
    bundle_parent: pick(row.bundle_parent, local.bundle_parent),
    verticals: pick(row.verticals, local.verticals) || [],
    functional_needs: pick(row.functional_needs, local.functional_needs) || [],
    ia_use_case: pick(row.ia_use_case, local.ia_use_case),
    betterAlternative: pick(row.better_alternative, local.betterAlternative),
    migrationGuide: pick(row.migration_guide, local.migrationGuide),
    downgradePlan: pick(row.downgrade_plan, local.downgradePlan),
    prescription_quality: pick(row.prescription_quality, local.prescription_quality) || "silence",
    prescription_output: pick(row.prescription_output, local.prescription_output),
    prescription_block_reasons:
      pick(row.prescription_block_reasons, local.prescription_block_reasons) || [],
    prescription_context_questions:
      pick(row.prescription_context_questions, local.prescription_context_questions) || [],
    substitution_cluster_v2: pick(row.substitution_cluster_v2, local.substitution_cluster_v2),
    decision_policy_v3: pick(row.decision_policy_v3, local.decision_policy_v3),
    force_silence: row.force_silence ?? local.force_silence,
  };
}

function mapCategory(row, tools) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || "",
    tools: tools.filter((tool) => tool.category === row.id).map((tool) => tool.id),
  };
}

const [localToolsRaw, localCategoriesRaw, remoteTools, remoteCategories] = await Promise.all([
  readFile("src/data/tools_v4.json", "utf8"),
  readFile("src/data/categories_index.json", "utf8"),
  fetchAll("tools"),
  fetchAll("categories"),
]);

const localTools = JSON.parse(localToolsRaw);
const localCategories = JSON.parse(localCategoriesRaw);
const localById = new Map(localTools.map((tool) => [tool.id, tool]));
const localCategoryById = new Map(localCategories.map((category) => [category.id, category]));

const tools = remoteTools
  .map((row) => mapTool(row, localById.get(row.id) || {}))
  .sort((a, b) => a.name.localeCompare(b.name, "fr"));

const categories = remoteCategories
  .map((row) => ({
    ...localCategoryById.get(row.id),
    ...mapCategory(row, tools),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "fr"));

const toolSummaries = tools.map((tool) => ({
  id: tool.id,
  slug: tool.slug,
  name: tool.name,
  categoryId: tool.category,
  shortDescription: tool.shortDescription || "",
  shortDescriptionEn: tool.shortDescriptionEn || "",
  pricing: tool.pricing || { free: "", paid: "" },
  defaultMonthlyPrice: tool.defaultMonthlyPrice || 0,
  affiliateLink: tool.affiliateLink || "",
  websiteUrl: tool.websiteUrl || tool.affiliateLink || "",
  logo: tool.logo || "",
  tool_type: tool.tool_type || "satellite",
  host_app: tool.host_app || null,
  bundle_parent: tool.bundle_parent || null,
  substitution_cluster_v2: tool.substitution_cluster_v2 || null,
  functional_needs: tool.functional_needs || [],
  verticals: tool.verticals || [],
}));

await Promise.all([
  writeFile("src/data/tools_v4.json", `${JSON.stringify(tools, null, 2)}\n`),
  writeFile("src/data/tools_index.json", `${JSON.stringify(toolSummaries, null, 2)}\n`),
  writeFile("src/data/categories_index.json", `${JSON.stringify(categories, null, 2)}\n`),
]);

console.log(
  JSON.stringify(
    {
      tools: tools.length,
      categories: categories.length,
      toolSummaries: toolSummaries.length,
    },
    null,
    2,
  ),
);
