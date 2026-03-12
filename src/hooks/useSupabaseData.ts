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
    const { count } = await supabase
      .from("tools")
      .select("*", { count: "exact", head: true });

    if (count && count >= 200) return;

    console.log(`Seeding: found ${count} tools, need 200+. Starting seed via edge function...`);

    // Step 1: Cleanup + insert categories
    const cats = (contentJson as any).categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug || c.id,
      description: c.description || "",
    }));

    const { data: cleanupResult, error: cleanupError } = await supabase.functions.invoke("seed-content", {
      body: { action: "cleanup", categories: cats },
    });
    console.log("Cleanup result:", cleanupResult, cleanupError);

    // Step 2: Insert tools in batches of 15
    const allTools = (contentJson as any).tools;
    const batchSize = 15;
    let totalInserted = 0;

    for (let i = 0; i < allTools.length; i += batchSize) {
      const batch = allTools.slice(i, i + batchSize);
      const { data, error } = await supabase.functions.invoke("seed-content", {
        body: { action: "insert_tools", tools: batch },
      });
      if (error) {
        console.error(`Batch ${i} error:`, error, data);
        break;
      }
      totalInserted += batch.length;
      console.log(`Inserted batch ${i}-${i + batch.length}: ${totalInserted}/${allTools.length}`);
    }

    console.log(`Seed complete: ${totalInserted} tools inserted`);
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
      // Try by slug first, then by id
      let { data, error } = await supabase
        .from("tools")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      
      if (!data) {
        ({ data, error } = await supabase
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
