import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { categories as staticCategories, tools as staticTools } from "@/data/content";
import type { Tool, Category } from "@/data/types";

interface SupabaseCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface SupabaseTool {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  short_description: string | null;
  long_description: string | null;
  affiliate_link: string | null;
  website_url: string | null;
  default_monthly_price: number | null;
  pricing: string | null;
  logo: string | null;
  verdict: any;
  pros: any;
  cons: any;
  relevant_for: any;
}

function mapCategory(c: SupabaseCategory): Category {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    nameEn: c.name,
    description: c.description || "",
    descriptionEn: c.description || "",
  };
}

function mapTool(t: SupabaseTool): Tool {
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    categoryId: t.category || "",
    shortDescription: t.short_description || "",
    description: t.long_description || "",
    pricing: (t.pricing as Tool["pricing"]) || "free",
    defaultMonthlyPrice: t.default_monthly_price || 0,
    verdict: t.verdict || { keepIf: "", avoidIf: "", threshold: "" },
    pros: t.pros || [],
    cons: t.cons || [],
    relevantFor: t.relevant_for || [],
    websiteUrl: t.website_url || "",
    affiliateLink: t.affiliate_link || "",
    logo: t.logo || "",
  };
}

async function seedIfEmpty() {
  // Check if categories exist
  const { data: existingCats } = await supabase
    .from("categories")
    .select("id")
    .limit(1);

  if (!existingCats || existingCats.length === 0) {
    const catRows = staticCategories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
    }));
    await supabase.from("categories").insert(catRows as any);
  }

  // Check if tools exist
  const { data: existingTools } = await supabase
    .from("tools")
    .select("id")
    .limit(1);

  if (!existingTools || existingTools.length === 0) {
    const toolRows = staticTools.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      category: t.categoryId,
      short_description: t.shortDescription,
      long_description: t.description,
      affiliate_link: t.affiliateLink,
      website_url: t.websiteUrl,
      default_monthly_price: t.defaultMonthlyPrice,
      pricing: t.pricing,
      logo: t.logo,
      verdict: t.verdict,
      pros: t.pros,
      cons: t.cons,
      relevant_for: t.relevantFor,
    }));
    await supabase.from("tools").insert(toolRows as any);
  }
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(staticCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await seedIfEmpty();
      const { data, error } = await supabase
        .from("categories")
        .select("*");
      if (!error && data && data.length > 0) {
        setCategories((data as SupabaseCategory[]).map(mapCategory));
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
      const { data, error } = await supabase
        .from("tools")
        .select("*");
      if (!error && data && data.length > 0) {
        setTools((data as SupabaseTool[]).map(mapTool));
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
      const { data, error } = await supabase
        .from("tools")
        .select("*")
        .eq("slug", slug)
        .single();
      if (!error && data) {
        setTool(mapTool(data as SupabaseTool));
      } else {
        // Fallback to static
        const found = staticTools.find((t) => t.slug === slug);
        setTool(found || null);
      }
      setLoading(false);
    })();
  }, [slug]);

  return { tool, loading };
}
