import type { Tool, Category, BlogPost } from "./types";
import contentJson from "./content.json";

// Re-export data from content.json
export const categories: Category[] = (contentJson as any).categories.map((c: any) => ({
  id: c.id,
  slug: c.slug,
  name: c.name,
  description: c.description,
  tools: c.tools,
}));

export const tools: Tool[] = (contentJson as any).tools.map((t: any) => ({
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
}));

export const blogPosts: BlogPost[] = ((contentJson as any).articles || []).map((a: any) => ({
  slug: a.slug,
  title: a.title,
  excerpt: a.excerpt,
  date: a.date,
  category: a.category,
  readingTime: parseInt(a.readTime) || 5,
  readTime: a.readTime,
}));
