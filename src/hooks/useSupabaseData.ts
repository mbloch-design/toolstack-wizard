import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tool, Category } from "@/data/types";
import contentJson from "@/data/content.json";

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
    soloRelevance: t.solo_relevance || "",
    teamRelevance: t.team_relevance || "",
    alternatives: t.alternatives || [],
    seo: t.seo || null,
    articles: t.articles || [],
  };
}

let seedPromise: Promise<void> | null = null;

async function seedIfEmpty() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    // Check if we have the right number of tools
    const { count } = await supabase
      .from("tools")
      .select("*", { count: "exact", head: true });

    // If we already have 200+ tools, skip seeding
    if (count && count >= 200) return;

    // Call edge function with service role to seed data
    console.log("Seeding data via edge function...");
    const { data, error } = await supabase.functions.invoke("seed-content", {
      body: { tools: (contentJson as any).tools },
    });

    if (error) {
      console.error("Seed edge function error:", error);
    } else {
      console.log("Seed result:", data);
    }
  })();
  return seedPromise;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(staticCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await seedIfEmpty();
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
      await seedIfEmpty();
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
      await seedIfEmpty();
      const { data, error } = await supabase
        .from("tools")
        .select("*")
        .eq("slug", slug)
        .single();
      if (!error && data) {
        setTool(mapSupabaseTool(data));
      } else {
        // Try by ID as fallback
        const { data: data2, error: error2 } = await supabase
          .from("tools")
          .select("*")
          .eq("id", slug)
          .single();
        if (!error2 && data2) {
          setTool(mapSupabaseTool(data2));
        } else {
          const found = staticTools.find((t) => t.slug === slug || t.id === slug);
          setTool(found || null);
        }
      }
      setLoading(false);
    })();
  }, [slug]);

  return { tool, loading };
}
