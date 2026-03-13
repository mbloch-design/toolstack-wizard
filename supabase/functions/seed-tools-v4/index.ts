import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify admin key
  const adminKey = req.headers.get("x-admin-key");
  const expectedKey = Deno.env.get("SEED_ADMIN_KEY");
  if (!adminKey || adminKey !== expectedKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { tools, verticals } = await req.json();

    // 1. Delete all existing tools
    const { error: delToolsErr } = await supabaseAdmin
      .from("tools")
      .delete()
      .neq("id", "__impossible__");
    if (delToolsErr) throw new Error(`Delete tools: ${delToolsErr.message}`);

    // 2. Insert tools in batches of 20
    let toolsInserted = 0;
    let toolsErrors: string[] = [];

    for (let i = 0; i < tools.length; i += 20) {
      const batch = tools.slice(i, i + 20).map((t: any) => ({
        id: t.id,
        slug: t.slug || t.id,
        name: t.name,
        category: t.category || null,
        short_description: t.shortDescription || "",
        long_description: t.longDescription || "",
        pricing: t.pricing || { free: "", paid: "" },
        default_monthly_price: Math.round(t.defaultMonthlyPrice || 0),
        verdict: t.verdict || null,
        pros: t.pros || [],
        cons: t.cons || [],
        use_cases: t.useCases || [],
        covers: t.covers || [],
        relevant_for: t.relevantFor || [],
        personas: t.personas || [],
        affiliate_link: t.affiliateLink || "",
        website_url: t.websiteUrl || t.affiliateLink || "",
        logo: t.logo || "",
        solo_relevance: t.soloRelevance || null,
        team_relevance: t.teamRelevance || null,
        alternatives: t.alternatives || [],
        seo: t.seo || null,
        articles: t.articles || [],
        time_gained_hours_per_month: t.timeGainedHoursPerMonth != null ? Math.round(t.timeGainedHoursPerMonth) : null,
        free_alternative: t.freeAlternative || null,
        tool_type: t.tool_type || "satellite",
        substitutable: t.substitutable ?? true,
        host_app: t.host_app || null,
        bundle_parent: t.bundle_parent || null,
        verticals: t.verticals || [],
        functional_needs: t.functional_needs || t.covers || [],
        ia_use_case: t.ia_use_case || null,
        better_alternative: t.betterAlternative || null,
        migration_guide: t.migrationGuide || null,
        downgrade_plan: t.downgradePlan || null,
      }));

      const { error } = await supabaseAdmin.from("tools").insert(batch);
      if (error) {
        toolsErrors.push(`Batch ${i}: ${error.message}`);
      } else {
        toolsInserted += batch.length;
      }
    }

    // 3. Seed verticals
    const { error: delVertErr } = await supabaseAdmin
      .from("verticals")
      .delete()
      .neq("id", "__impossible__");
    if (delVertErr) throw new Error(`Delete verticals: ${delVertErr.message}`);

    const verticalRows = Object.entries(verticals).map(([id, v]: [string, any]) => ({
      id,
      family: v.family,
      label: v.label,
      functional_needs: v.functional_needs,
    }));

    const { error: vertErr } = await supabaseAdmin.from("verticals").insert(verticalRows);
    const verticalsInserted = vertErr ? 0 : verticalRows.length;

    return new Response(
      JSON.stringify({
        toolsInserted,
        toolsErrors,
        verticalsInserted,
        verticalsError: vertErr?.message || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
