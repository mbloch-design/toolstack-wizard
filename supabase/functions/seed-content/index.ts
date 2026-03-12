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

    const content = await req.json();
    const categories = content.categories || [];
    const tools = content.tools || [];

    // Delete existing data (tools first due to FK)
    await supabase.from("tools").delete().neq("id", "___none___");
    await supabase.from("categories").delete().neq("id", "___none___");

    // Insert categories
    const catRows = categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug || c.id,
      description: c.description || "",
    }));
    const { error: catError } = await supabase.from("categories").insert(catRows);
    if (catError) {
      return new Response(JSON.stringify({ error: "categories insert failed", detail: catError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert tools in batches
    let insertedTools = 0;
    const batchSize = 20;
    for (let i = 0; i < tools.length; i += batchSize) {
      const batch = tools.slice(i, i + batchSize).map((t: any) => ({
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
      const { error } = await supabase.from("tools").insert(batch);
      if (error) {
        return new Response(JSON.stringify({ error: `tools batch ${i} failed`, detail: error, batchSample: batch[0] }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      insertedTools += batch.length;
    }

    return new Response(JSON.stringify({
      success: true,
      categoriesInserted: catRows.length,
      toolsInserted: insertedTools,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
