import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Inline the categories and tool IDs from content.json
const CATEGORIES = [
  { id: "ai-general", name: "🤖 IA Généraliste", slug: "ia-generaliste", description: "Les cerveaux numériques pour rédiger, chercher et brainstormer." },
  { id: "organization", name: "✂️ Organisation", slug: "organisation", description: "Mettre de l'ordre dans le chaos sans passer sa vie à configurer." },
  { id: "communication", name: "💬 Communication", slug: "communication", description: "Gérer les clients et les réunions sans perdre son âme." },
  { id: "creation", name: "🎨 Création de contenu", slug: "creation-design", description: "Produire des visuels et des textes pros sans être graphiste." },
  { id: "finance", name: "💰 Finance & Facturation", slug: "finance-facturation", description: "Se faire payer vite et rester en règle avec le fisc." },
  { id: "storage", name: "Stockage", slug: "stockage", description: "Garder ses fichiers en sécurité et accessibles partout." },
  { id: "automation", name: "Automatisation", slug: "automatisation", description: "Faire travailler les robots à votre place." },
  { id: "project-management", name: "📋 Gestion de Projet", slug: "gestion-projet", description: "Organiser les tâches et collaborer efficacement." },
  { id: "email-productivity", name: "📧 Email & Marketing", slug: "email-marketing", description: "Maîtriser sa boîte mail et automatiser le marketing." },
  { id: "communication-team", name: "💬 Communication Équipe", slug: "communication-equipe", description: "Collaborer et échanger efficacement avec clients et partenaires." },
  { id: "design-tools", name: "🎨 Design & Prototypage", slug: "design-prototypage", description: "Créer des interfaces et maquettes professionnelles." },
  { id: "security", name: "🔐 Sécurité", slug: "securite", description: "Protéger ses données et gérer ses mots de passe en toute sécurité." },
  { id: "productivity-tracking", name: "⏱️ Suivi du Temps", slug: "suivi-temps", description: "Tracker son temps pour facturer au juste prix." },
  { id: "nocode-web", name: "🚀 No-Code & Web", slug: "nocode-web", description: "Créer des sites web sans coder." },
  { id: "analytics", name: "📈 Analytics", slug: "analytics", description: "Analyser le trafic de son site en respectant la vie privée." },
  { id: "formation-education", name: "📚 Formation & Éducation", slug: "formation-education", description: "Plateformes pour créer et vendre des cours en ligne, former vos clients ou monétiser votre expertise." },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse request body for tools data
    const { tools } = await req.json();

    // Delete existing data (tools first due to FK)
    await supabase.from("tools").delete().neq("id", "___none___");
    await supabase.from("categories").delete().neq("id", "___none___");

    // Insert categories
    const { error: catError } = await supabase.from("categories").insert(CATEGORIES);
    if (catError) {
      return new Response(JSON.stringify({ error: "categories insert failed", detail: catError }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        return new Response(JSON.stringify({ error: `tools batch ${i} failed`, detail: error }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      insertedTools += batch.length;
    }

    return new Response(JSON.stringify({
      success: true,
      categoriesInserted: CATEGORIES.length,
      toolsInserted: insertedTools,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
