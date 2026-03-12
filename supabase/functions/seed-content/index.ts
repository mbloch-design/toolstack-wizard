import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate via secret API key
    const adminKey = req.headers.get("x-admin-key");
    const expectedKey = Deno.env.get("SEED_ADMIN_KEY");
    if (!expectedKey || adminKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const action = body.action || "insert_tools";

    if (action === "cleanup") {
      await supabase.from("tools").delete().neq("id", "___none___");
      await supabase.from("categories").delete().neq("id", "___none___");

      const categories = body.categories || [];
      if (categories.length > 0) {
        const { error } = await supabase.from("categories").insert(categories);
        if (error) {
          console.error("categories insert error:", error);
          return new Response(JSON.stringify({ error: "Categories insert failed" }), {
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
        time_gained_hours_per_month: t.timeGainedHoursPerMonth ?? null,
        free_alternative: t.freeAlternative || null,
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
        console.error("tools insert error:", error);
        return new Response(JSON.stringify({ error: "Tools insert failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, action: "insert_tools", toolsInserted: tools.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "seed_posts") {
      await supabase.from("posts").delete().neq("id", 0);

      const posts = body.posts || [];
      if (posts.length === 0) {
        return new Response(JSON.stringify({ error: "No posts provided" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let inserted = 0;
      for (let i = 0; i < posts.length; i += 20) {
        const batch = posts.slice(i, i + 20).map((p: any) => ({
          slug: p.slug,
          lang: p.lang,
          title: p.title,
          excerpt: p.excerpt || "",
          date: p.date || null,
          category: p.category || null,
          tool_id: p.toolId || null,
          content: p.content || "",
          tags: p.tags || null,
          read_time: p.readTime || null,
          seo: p.seo || null,
        }));

        const { error } = await supabase.from("posts").insert(batch);
        if (error) {
          console.error("posts insert error:", error);
          return new Response(JSON.stringify({ error: "Posts insert failed" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        inserted += batch.length;
      }

      return new Response(JSON.stringify({ success: true, action: "seed_posts", postsInserted: inserted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("seed-content error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
