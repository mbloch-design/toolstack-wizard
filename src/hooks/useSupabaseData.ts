import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tool, Category } from "@/data/types";

// ---------- type & mapper ----------

export interface Post {
  id: number; slug: string; lang: string; title: string; excerpt: string;
  date: string; category: string; toolId: string | null; content: string;
  tags: string[]; readTime: string;
  seo: { metaTitle?: string; metaDescription?: string; keywords?: string } | null;
}

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

function mapPost(p: any): Post {
  return {
    id: p.id, slug: p.slug, lang: p.lang, title: p.title, excerpt: p.excerpt || "",
    date: p.date, category: p.category || "", toolId: p.tool_id || null,
    content: p.content || "", tags: p.tags || [], readTime: p.read_time || p.readTime || "",
    seo: p.seo || null,
  };
}

function mapSupabaseCat(c: any): Category {
  return { id: c.id, slug: c.slug, name: c.name, description: c.description || "" };
}

// ---------- async loaders with module-level cache ----------

let _toolsCache: Tool[] | null = null;
async function loadStaticTools(): Promise<Tool[]> {
  if (_toolsCache) return _toolsCache;
  try {
    const r = await fetch("/data/tools_v4.json");
    const json = await r.json();
    _toolsCache = (json as any[]).map(mapToolFromJson);
    return _toolsCache;
  } catch { return []; }
}

let _categoriesCache: Category[] | null = null;
async function loadStaticCategories(): Promise<Category[]> {
  if (_categoriesCache) return _categoriesCache;
  try {
    const r = await fetch("/data/content.json");
    const json = await r.json();
    _categoriesCache = (json.categories || []).map((c: any) => ({
      id: c.id, slug: c.slug, name: c.name, description: c.description, tools: c.tools,
    }));
    return _categoriesCache;
  } catch { return []; }
}

const _postsCache: Record<string, Post[]> = {};
async function loadStaticPosts(lang: string): Promise<Post[]> {
  if (_postsCache[lang]) return _postsCache[lang];
  try {
    const r = await fetch(`/data/posts-${lang}.json`);
    const json = await r.json();
    _postsCache[lang] = (json as any[]).map(mapPost);
    return _postsCache[lang];
  } catch { return []; }
}

// ---------- hooks ----------

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadStaticCategories().then(data => { if (mounted && data.length) setCategories(data); });
    supabase.from("categories").select("*").then(({ data, error }) => {
      if (mounted) {
        if (!error && data?.length) setCategories(data.map(mapSupabaseCat));
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  return { categories, loading };
}

export function useTools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadStaticTools().then(data => { if (mounted && data.length) setTools(data); });
    supabase.from("tools").select("*").limit(500).then(({ data, error }) => {
      if (mounted) {
        if (!error && data?.length) setTools(data.map(mapToolFromJson));
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  return { tools, loading };
}

export function useToolBySlug(slug: string | undefined) {
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      let { data } = await supabase.from("tools").select("*").eq("slug", slug).maybeSingle();
      if (!data) ({ data } = await supabase.from("tools").select("*").eq("id", slug).maybeSingle());
      if (mounted) {
        if (data) {
          setTool(mapToolFromJson(data));
        } else {
          const staticTools = await loadStaticTools();
          const found = staticTools.find((t) => t.slug === slug || t.id === slug);
          setTool(found || null);
        }
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  return { tool, loading };
}

export function usePosts(lang: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadStaticPosts(lang).then(localPosts => {
      if (mounted && localPosts.length) setPosts(localPosts);
    });
    supabase.from("posts").select("*").eq("lang", lang).order("date", { ascending: false }).then(({ data, error }) => {
      if (mounted) {
        if (!error && data?.length) {
          loadStaticPosts(lang).then(localPosts => {
            if (!mounted) return;
            const supabasePosts = data.map(mapPost);
            const supabaseSlugs = new Set(supabasePosts.map(p => p.slug));
            const merged = [...supabasePosts, ...localPosts.filter(p => !supabaseSlugs.has(p.slug))];
            merged.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
            setPosts(merged);
          });
        }
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [lang]);

  return { posts, loading };
}

export function usePostBySlug(slug: string | undefined, lang: string) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      const { data } = await supabase.from("posts").select("*").eq("slug", slug).eq("lang", lang).maybeSingle();
      if (mounted) {
        if (data) {
          setPost(mapPost(data));
        } else {
          const localPosts = await loadStaticPosts(lang);
          const found = localPosts.find((p: any) => p.slug === slug);
          setPost(found ? mapPost(found) : null);
        }
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug, lang]);

  return { post, loading };
}

export function getToolLogoUrl(tool: Tool): string | null {
  if (tool.logo && tool.logo.startsWith("http")) return tool.logo;
  const url = tool.websiteUrl || tool.affiliateLink;
  if (!url) return null;
  try {
    const domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
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
