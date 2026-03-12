import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tool, Category, BlogPost } from "@/data/types";
import contentJson from "@/data/content.json";

// Static fallback data from content.json
const staticCategories: Category[] = (contentJson as any).categories.map((c: any) => ({
  id: c.id,
  slug: c.slug,
  name: c.name,
  description: c.description,
  tools: c.tools,
}));

const staticTools: Tool[] = (contentJson as any).tools.map((t: any) => ({
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
  affiliateLink: t.affiliateLink || "",
  websiteUrl: t.websiteUrl || t.affiliateLink || "",
  logo: t.logo || "",
  soloRelevance: t.soloRelevance || "",
  teamRelevance: t.teamRelevance || "",
  alternatives: t.alternatives || [],
  seo: t.seo || null,
  articles: t.articles || [],
}));

function mapSupabaseCat(c: any): Category {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description || "",
  };
}

function mapSupabaseTool(t: any): Tool {
  return {
    id: t.id,
    slug: t.slug || t.id,
    name: t.name,
    categoryId: t.category || "",
    shortDescription: t.short_description || "",
    longDescription: t.long_description || "",
    pricing: t.pricing || { free: "", paid: "" },
    defaultMonthlyPrice: t.default_monthly_price || 0,
    verdict: t.verdict || { keepIf: [], avoidIf: [], threshold: "" },
    pros: t.pros || [],
    cons: t.cons || [],
    useCases: t.use_cases || [],
    covers: t.covers || [],
    relevantFor: t.relevant_for || [],
    affiliateLink: t.affiliate_link || "",
    websiteUrl: t.website_url || t.affiliate_link || "",
    logo: t.logo || "",
    soloRelevance: t.solo_relevance || "",
    teamRelevance: t.team_relevance || "",
    alternatives: t.alternatives || [],
    seo: t.seo || null,
    articles: t.articles || [],
  };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(staticCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (!error && data && data.length > 0) {
        setCategories(data.map(mapSupabaseCat));
      }
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
      if (!error && data && data.length > 0) {
        setTools(data.map(mapSupabaseTool));
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
    (async () => {
      let { data } = await supabase
        .from("tools")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      
      if (!data) {
        ({ data } = await supabase
          .from("tools")
          .select("*")
          .eq("id", slug)
          .maybeSingle());
      }

      if (data) {
        setTool(mapSupabaseTool(data));
      } else {
        const found = staticTools.find((t) => t.slug === slug || t.id === slug);
        setTool(found || null);
      }
      setLoading(false);
    })();
  }, [slug]);

  return { tool, loading };
}

export interface Post {
  id: number;
  slug: string;
  lang: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  toolId: string | null;
  content: string;
  tags: string[];
  readTime: string;
  seo: { metaTitle?: string; metaDescription?: string; keywords?: string } | null;
}

function mapPost(p: any): Post {
  return {
    id: p.id,
    slug: p.slug,
    lang: p.lang,
    title: p.title,
    excerpt: p.excerpt || "",
    date: p.date,
    category: p.category || "",
    toolId: p.tool_id || null,
    content: p.content || "",
    tags: p.tags || [],
    readTime: p.read_time || "",
    seo: p.seo || null,
  };
}

export function usePosts(lang: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("lang", lang)
        .order("date", { ascending: false });
      if (!error && data) {
        setPosts(data.map(mapPost));
      }
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
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", slug)
        .eq("lang", lang)
        .maybeSingle();
      if (data) {
        setPost(mapPost(data));
      }
      setLoading(false);
    })();
  }, [slug, lang]);

  return { post, loading };
}

/** Extract domain from a URL for Clearbit logo */
export function getToolLogoUrl(tool: Tool): string | null {
  const url = tool.websiteUrl || tool.affiliateLink;
  if (!url) return null;
  try {
    const domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
    return `https://logo.clearbit.com/${domain}`;
  } catch {
    return null;
  }
}
