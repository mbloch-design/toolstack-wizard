import type { Tool, Category, BlogPost, Vertical } from "./types";
import contentJson from "./content.json";
import toolsV4Json from "./tools_v4.json";
import verticalsJson from "./verticals.json";

// Re-export categories from content.json
export const categories: Category[] = (contentJson as any).categories.map((c: any) => ({
  id: c.id,
  slug: c.slug,
  name: c.name,
  description: c.description,
  tools: c.tools,
}));

// Tools from v4 enriched data
export const tools: Tool[] = (toolsV4Json as any[]).map((t: any) => ({
  id: t.id,
  slug: t.slug || t.id,
  name: t.name,
  categoryId: t.category,
  shortDescription: t.shortDescription || "",
  longDescription: t.longDescription || "",
  pricing: t.pricing || { free: "", paid: "" },
  defaultMonthlyPrice: t.defaultMonthlyPrice || 0,
  verdict: t.verdict || { keepIf: [], avoidIf: [], threshold: "" },
  pros: t.pros || [],
  cons: t.cons || [],
  useCases: t.useCases || [],
  covers: t.covers || [],
  relevantFor: t.relevantFor || [],
  personas: t.personas || [],
  affiliateLink: t.affiliateLink || "",
  soloRelevance: t.soloRelevance || "",
  teamRelevance: t.teamRelevance || "",
  alternatives: t.alternatives || [],
  seo: t.seo || null,
  articles: t.articles || [],
  timeGainedHoursPerMonth: t.timeGainedHoursPerMonth ?? undefined,
  freeAlternative: t.freeAlternative || null,
  // v4 fields
  tool_type: t.tool_type || "satellite",
  substitutable: t.substitutable ?? true,
  host_app: t.host_app || null,
  bundle_parent: t.bundle_parent || null,
  verticals: t.verticals || [],
  functional_needs: t.functional_needs || t.covers || [],
  ia_use_case: t.ia_use_case || null,
  betterAlternative: t.betterAlternative || null,
  migrationGuide: t.migrationGuide || null,
  downgradePlan: t.downgradePlan || null,
  // v10 prescription fields
  prescription_quality: t.prescription_quality || "silence",
  prescription_output: t.prescription_output || null,
  prescription_block_reasons: t.prescription_block_reasons || [],
  prescription_context_questions: t.prescription_context_questions || [],
  substitution_cluster_v2: t.substitution_cluster_v2 || null,
}));

// Verticals
export const verticals: Record<string, Vertical> = Object.fromEntries(
  Object.entries(verticalsJson as Record<string, any>).map(([id, v]) => [
    id,
    { id, family: v.family, label: v.label, functional_needs: v.functional_needs },
  ])
);

export const blogPosts: BlogPost[] = ((contentJson as any).articles || []).map((a: any) => ({
  slug: a.slug,
  title: a.title,
  excerpt: a.excerpt,
  date: a.date,
  category: a.category,
  readingTime: parseInt(a.readTime) || 5,
  readTime: a.readTime,
}));
