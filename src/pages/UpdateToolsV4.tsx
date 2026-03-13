import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import toolsV4Json from "@/data/tools_v4.json";
import verticalsJson from "@/data/verticals.json";

const UpdateToolsV4 = () => {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    setStatus("Étape 1/3 — Suppression des anciens outils...");

    try {
      // 1. Delete all existing tools
      const { error: delErr } = await supabase.from("tools").delete().neq("id", "__impossible__");
      if (delErr) throw new Error(`Delete tools: ${delErr.message}`);

      // 2. Insert new tools from v4 JSON
      setStatus("Étape 2/3 — Insertion des outils v4...");
      const tools = toolsV4Json as any[];
      let toolsInserted = 0;
      let toolsErrors = 0;

      // Batch insert in chunks of 20
      for (let i = 0; i < tools.length; i += 20) {
        const batch = tools.slice(i, i + 20).map((t: any) => ({
          id: t.id,
          slug: t.slug || t.id,
          name: t.name,
          category: t.category || null,
          short_description: t.shortDescription || "",
          long_description: t.longDescription || "",
          pricing: t.pricing || { free: "", paid: "" },
          default_monthly_price: t.defaultMonthlyPrice || 0,
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
          time_gained_hours_per_month: t.timeGainedHoursPerMonth || null,
          free_alternative: t.freeAlternative || null,
          // v4 fields
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

        const { error } = await supabase.from("tools").insert(batch as any);
        if (error) {
          console.error(`Batch error at ${i}:`, error);
          toolsErrors += batch.length;
        } else {
          toolsInserted += batch.length;
        }
      }

      // 3. Seed verticals
      setStatus("Étape 3/3 — Insertion des verticals...");
      const { error: delVertErr } = await supabase.from("verticals").delete().neq("id", "__impossible__");
      if (delVertErr) console.error("Delete verticals:", delVertErr);

      const verticals = Object.entries(verticalsJson as Record<string, any>).map(([id, v]) => ({
        id,
        family: v.family,
        label: v.label,
        functional_needs: v.functional_needs,
      }));

      const { error: vertErr } = await supabase.from("verticals").insert(verticals as any);
      const verticalsInserted = vertErr ? 0 : verticals.length;

      setStatus(
        `✅ Terminé : ${toolsInserted} outils importés (${toolsErrors} erreurs), ${verticalsInserted} verticals importés.`
      );
    } catch (err: any) {
      setStatus(`❌ Erreur : ${err.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-xl py-20 px-6">
      <h1 className="text-2xl font-bold mb-4">Mise à jour Tools v4 — Full Seed</h1>
      <p className="text-sm text-muted-foreground mb-2">
        ⚠️ Cette action <strong>supprime tous les outils existants</strong> et les remplace par le contenu de <code>content_v4_complete.json</code>.
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        Elle seede aussi la table <code>verticals</code> depuis <code>verticals.json</code>.
      </p>
      <button
        onClick={handleUpdate}
        disabled={loading}
        className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading ? "En cours..." : "🚀 Lancer le seed v4"}
      </button>
      {status && (
        <p className="mt-4 text-sm font-medium whitespace-pre-line">{status}</p>
      )}
    </div>
  );
};

export default UpdateToolsV4;
