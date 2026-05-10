import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tool, Category } from "@/data/types";
import categoriesIndexJson from "@/data/categories_index.json";
import toolsIndexJson from "@/data/tools_index.json";
import { getToolLogoUrl as resolveToolLogoUrl } from "@/lib/toolLogos";

// Static fallback data (synchronous — available on first render)
const staticCategories: Category[] = (categoriesIndexJson as any[]).map((c: any) => ({
  id: c.id,
  slug: c.slug,
  name: c.name,
  nameEn: c.nameEn,
  description: c.description,
  descriptionEn: c.descriptionEn,
  tools: c.tools,
}));

function mapToolFromJson(t: any): Tool {
  return {
    id: t.id,
    slug: t.slug || t.id,
    name: t.name,
    categoryId: t.category || "",
    shortDescription: t.shortDescription || t.short_description || "",
    shortDescriptionEn: t.shortDescriptionEn || t.short_description_en || "",
    longDescription: t.longDescription || t.long_description || "",
    longDescriptionEn: t.longDescriptionEn || t.long_description_en || "",
    pricing: t.pricing || t.pricingTiers || { free: "", paid: "" },
    pricingEn: t.pricingEn || t.pricing_en || null,
    defaultMonthlyPrice: t.defaultMonthlyPrice || t.default_monthly_price || 0,
    verdict: t.verdict || { keepIf: [], avoidIf: [], threshold: "" },
    verdictEn: t.verdictEn || t.verdict_en || null,
    pros: t.pros || [],
    prosEn: t.prosEn || t.pros_en || null,
    cons: t.cons || [],
    consEn: t.consEn || t.cons_en || null,
    useCases: t.useCases || t.use_cases || [],
    useCasesEn: t.useCasesEn || t.use_cases_en || null,
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
    prescription_quality: t.prescription_quality || "silence",
    prescription_output: t.prescription_output || null,
    prescription_block_reasons: t.prescription_block_reasons || [],
    prescription_context_questions: t.prescription_context_questions || [],
    substitution_cluster_v2: t.substitution_cluster_v2 || null,
    pricing_v5: t.pricing_v5 || null,
    decision_policy_v3: t.decision_policy_v3 || null,
  };
}

async function loadLocalTools(): Promise<Tool[]> {
  const module = await import("@/data/tools_v4.json");
  return (module.default as unknown[]).map(mapToolFromJson);
}

export type ToolSummary = Pick<
  Tool,
  | "id"
  | "slug"
  | "name"
  | "categoryId"
  | "shortDescription"
  | "shortDescriptionEn"
  | "pricing"
  | "defaultMonthlyPrice"
  | "affiliateLink"
  | "websiteUrl"
  | "logo"
>;

const staticToolSummaries: ToolSummary[] = toolsIndexJson as ToolSummary[];

function mapSupabaseCat(c: any): Category {
  return { id: c.id, slug: c.slug, name: c.name, description: c.description || "" };
}

function mergeById<T extends { id: string }>(localItems: T[], remoteItems: T[]): T[] {
  const merged = new Map<string, T>();
  localItems.forEach((item) => merged.set(item.id, item));
  remoteItems.forEach((item) => merged.set(item.id, item));
  return Array.from(merged.values());
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
    content: p.content || "", tags: p.tags || [], readTime: p.read_time || p.readTime || "",
    seo: p.seo || null,
  };
}

async function loadLocalPosts(lang: string): Promise<Post[]> {
  const module = lang === "en"
    ? await import("@/data/posts-en.json")
    : await import("@/data/posts-fr.json");
  return (module.default as unknown[]).map(mapPost);
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(staticCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (!error && data && data.length > 0) setCategories(mergeById(staticCategories, data.map(mapSupabaseCat)));
      setLoading(false);
    })();
  }, []);

  return { categories, loading };
}

export function useTools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const localTools = await loadLocalTools();
      if (cancelled) return;
      setTools(localTools);

      const { data, error } = await supabase.from("tools").select("*").limit(1000);
      if (cancelled) return;
      if (!error && data && data.length > 0) setTools(mergeById(localTools, data.map(mapToolFromJson)));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { tools, loading };
}

export function useToolSummaries() {
  const [tools, setTools] = useState<ToolSummary[]>(staticToolSummaries);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("tools")
        .select("id, slug, name, category, short_description, short_description_en, pricing, default_monthly_price, affiliate_link, website_url, logo")
        .limit(1000);

      if (!error && data && data.length > 0) {
        const remoteTools = data.map((t: any) => ({
          id: t.id,
          slug: t.slug || t.id,
          name: t.name,
          categoryId: t.category || "",
          shortDescription: t.short_description || "",
          shortDescriptionEn: t.short_description_en || "",
          pricing: t.pricing || { free: "", paid: "" },
          defaultMonthlyPrice: t.default_monthly_price || 0,
          affiliateLink: t.affiliate_link || "",
          websiteUrl: t.website_url || t.affiliate_link || "",
          logo: t.logo || "",
        }));
        setTools(mergeById(staticToolSummaries, remoteTools));
      }
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
    let cancelled = false;

    (async () => {
      setLoading(true);
      let { data } = await supabase.from("tools").select("*").eq("slug", slug).maybeSingle();
      if (!data) ({ data } = await supabase.from("tools").select("*").eq("id", slug).maybeSingle());
      if (cancelled) return;
      if (data) setTool(mapToolFromJson(data));
      else {
        const localTools = await loadLocalTools();
        if (cancelled) return;
        const found = localTools.find((t) => t.slug === slug || t.id === slug);
        setTool(found || null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { tool, loading };
}

export function usePosts(lang: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      const [localPosts, { data, error }] = await Promise.all([
        loadLocalPosts(lang),
        supabase.from("posts").select("*").eq("lang", lang).order("date", { ascending: false }),
      ]);

      if (cancelled) return;

      if (!error && data && data.length > 0) {
        const supabasePosts = data.map(mapPost);
        const supabaseSlugs = new Set(supabasePosts.map(p => p.slug));
        const merged = [...supabasePosts, ...localPosts.filter(p => !supabaseSlugs.has(p.slug))];
        merged.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        setPosts(merged);
      } else {
        setPosts(localPosts);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  return { posts, loading };
}

export function usePostBySlug(slug: string | undefined, lang: string) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data } = await supabase.from("posts").select("*").eq("slug", slug).eq("lang", lang).maybeSingle();
      if (cancelled) return;

      if (data) {
        setPost(mapPost(data));
      } else {
        const localPosts = await loadLocalPosts(lang);
        if (cancelled) return;
        const found = localPosts.find((p) => p.slug === slug);
        setPost(found || null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, lang]);

  return { post, loading };
}

export function getToolLogoUrl(tool: Tool): string | null {
  return resolveToolLogoUrl(tool, 64);
}

export function getToolLogoUrlHD(tool: Tool): string | null {
  return resolveToolLogoUrl(tool, 128);
}
