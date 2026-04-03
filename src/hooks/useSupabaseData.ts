import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tool, Category, BlogPost } from "@/data/types";
import contentJson from "@/data/content.json";
import toolsV4Json from "@/data/tools_v4.json";
import postsFrJson from "@/data/posts-fr.json";
import postsEnJson from "@/data/posts-en.json";

// Static fallback data
const staticCategories: Category[] = (contentJson as any).categories.map((c: any) => ({
  id: c.id, slug: c.slug, name: c.name, description: c.description, tools: c.tools,
}));

function mapToolFromJson(t: any): Tool {
  return {
    id: t.id,
    slug: t.slug || t.id,
    name: t.name,
    categoryId: t.category || "",
    shortDescription: t.shortDescription || t.short_description || "",
    longDescription: t.longDescription || t.long_description || "",
    pricing: t.pricing || t.pricingTiers || { free: "", paid: "" },
    defaultMonthlyPrice: t.defaultMonthlyPrice || t.default_monthly_price || 0,
    verdict: t.verdict || { keepIf: [], avoidIf: [], threshold: "" },
    pros: t.pros || [],
    cons: t.cons || [],
    useCases: t.useCases || t.use_cases || [],
    covers: t.covers || [],
    relevantFor: t.relevantFor || t.relevant_for || [],
    personas: t.personas || [],
    affiliateLink: t.affiliateLink || t.affiliate_link || "",
    websiteUrl: t.websiteUrl || t.website_url || t.affiliateLink || t.affiliate_link || "",
    logo: t.logo || "",
    soloRelevance: t.soloRelevance || t.solo_relevance || "",
    teamRelevance: t.teamRelevance || t.team_relevance || "",
    alternatives: t.alternatives || [],
    seo: t.seo || null,
    articles: t.articles || [],
    timeGainedHoursPerMonth: t.timeGainedHoursPerMonth ?? t.time_gained_hours_per_month ?? undefined,
    freeAlternative: t.freeAlternative || t.free_alternative || null,
    // v4 fields
    tool_type: t.tool_type || "satellite",
    substitutable: t.substitutable ?? true,
    host_app: t.host_app || null,
    bundle_parent: t.bundle_parent || null,
    verticals: t.verticals || [],
    functional_needs: t.functional_needs || t.covers || [],
    ia_use_case: t.ia_use_case || null,
    betterAlternative: t.betterAlternative || t.better_alternative || null,
    migrationGuide: t.migrationGuide || t.migration_guide || null,
    downgradePlan: t.downgradePlan || t.downgrade_plan || null,
    // v10 prescription fields
    prescription_quality: t.prescription_quality || "silence",
    prescription_output: t.prescription_output || null,
    prescription_block_reasons: t.prescription_block_reasons || [],
    prescription_context_questions: t.prescription_context_questions || [],
    substitution_cluster_v2: t.substitution_cluster_v2 || null,
    pricing_v5: t.pricing_v5 || null,
    decision_policy_v3: t.decision_policy_v3 || null,
  };
}

const staticTools: Tool[] = (toolsV4Json as any[]).map(mapToolFromJson);

function mapSupabaseCat(c: any): Category {
  return { id: c.id, slug: c.slug, name: c.name, description: c.description || "" };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(staticCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (!error && data && data.length > 0) setCategories(data.map(mapSupabaseCat));
      setLoading(false);
    })();
  }, []);

  return { categories, loading };
}

export function useTools() {
  const [tools, setTools] = useState<Tool[]>(staticTools);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("tools").select("*").limit(500);
      if (!error && data && data.length > 0) setTools(data.map(mapToolFromJson));
      setLoading(false);
    })();
  }, []);

  return { tools, loading };
}

export function useToolBySlug(slug: string | undefined) {
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    (async () => {
      let { data } = await supabase.from("tools").select("*").eq("slug", slug).maybeSingle();
      if (!data) ({ data } = await supabase.from("tools").select("*").eq("id", slug).maybeSingle());
      if (data) setTool(mapToolFromJson(data));
      else {
        const found = staticTools.find((t) => t.slug === slug || t.id === slug);
        setTool(found || null);
      }
      setLoading(false);
    })();
  }, [slug]);

  return { tool, loading };
}

export interface Post {
  id: number; slug: string; lang: string; title: string; excerpt: string;
  date: string; category: string; toolId: string | null; content: string;
  tags: string[]; readTime: string;
  seo: { metaTitle?: string; metaDescription?: string; keywords?: string } | null;
}

function mapPost(p: any): Post {
  return {
    id: p.id, slug: p.slug, lang: p.lang, title: p.title, excerpt: p.excerpt || "",
    date: p.date, category: p.category || "", toolId: p.tool_id || null,
    content: p.content || "", tags: p.tags || [], readTime: p.read_time || "", seo: p.seo || null,
  };
}

export function usePosts(lang: string) {
  const localPosts: Post[] = (lang === "en" ? postsEnJson : postsFrJson).map(mapPost);
  const [posts, setPosts] = useState<Post[]>(localPosts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("posts").select("*").eq("lang", lang).order("date", { ascending: false });
      if (!error && data && data.length > 0) setPosts(data.map(mapPost));
      setLoading(false);
    })();
  }, [lang]);

  return { posts, loading };
}

export function usePostBySlug(slug: string | undefined, lang: string) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from("posts").select("*").eq("slug", slug).eq("lang", lang).maybeSingle();
      if (data) {
        setPost(mapPost(data));
      } else {
        const localPosts = lang === "en" ? postsEnJson : postsFrJson;
        const found = localPosts.find((p: any) => p.slug === slug);
        setPost(found ? mapPost(found) : null);
      }
      setLoading(false);
    })();
  }, [slug, lang]);

  return { post, loading };
}

export function getToolLogoUrl(tool: Tool): string | null {
  // 1. Use logo field from DB if populated
  if (tool.logo && tool.logo.startsWith("http")) return tool.logo;

  // 2. Extract domain for favicon services
  const url = tool.websiteUrl || tool.affiliateLink;
  if (!url) return null;
  try {
    const domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
    // Google Favicon service (more reliable than Clearbit)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch { return null; }
}

export function getToolLogoUrlHD(tool: Tool): string | null {
  if (tool.logo && tool.logo.startsWith("http")) return tool.logo;
  const url = tool.websiteUrl || tool.affiliateLink;
  if (!url) return null;
  try {
    const domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
    return `https://logo.clearbit.com/${domain}`;
  } catch { return null; }
}
