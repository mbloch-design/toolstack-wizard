import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const action = body.action || "insert_tools";

    if (action === "cleanup") {
      // Delete all existing tools and categories
      await supabase.from("tools").delete().neq("id", "___none___");
      await supabase.from("categories").delete().neq("id", "___none___");

      // Insert categories
      const categories = body.categories || [];
      if (categories.length > 0) {
        const { error } = await supabase.from("categories").insert(categories);
        if (error) {
          return new Response(JSON.stringify({ error: "categories failed", detail: error }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      return new Response(JSON.stringify({ success: true, action: "cleanup", categoriesInserted: categories.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "insert_tools") {
      const tools = (body.tools || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        slug: t.slug || t.id,
        category: t.category || null,
        short_description: t.shortDescription || "",
        long_description: t.longDescription || "",
        affiliate_link: t.affiliateLink || "",
        website_url: t.websiteUrl || t.affiliateLink || "",
        default_monthly_price: Math.round(t.defaultMonthlyPrice || 0),
        pricing: t.pricing || null,
        logo: "",
        solo_relevance: t.soloRelevance || null,
        team_relevance: t.teamRelevance || null,
        verdict: t.verdict || null,
        pros: t.pros || null,
        cons: t.cons || null,
        use_cases: t.useCases || null,
        covers: t.covers || null,
        relevant_for: t.relevantFor || null,
        alternatives: t.alternatives || null,
        seo: t.seo || null,
        articles: t.articles || null,
      }));

      const { error } = await supabase.from("tools").insert(tools);
      if (error) {
        return new Response(JSON.stringify({ error: "tools insert failed", detail: error, ids: tools.map((t: any) => t.id) }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, action: "insert_tools", toolsInserted: tools.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
