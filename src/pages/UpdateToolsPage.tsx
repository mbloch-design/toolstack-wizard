import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tools, categories } from "@/data/content";
import { Button } from "@/components/ui/button";

const UpdateToolsPage = () => {
  const [status, setStatus] = useState<string>("idle");
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

  const handleReseed = async () => {
    setStatus("running");
    setLog([]);

    try {
      // 1. Delete all tools
      addLog("Suppression des outils…");
      const { error: delToolsErr } = await supabase.from("tools").delete().neq("id", "___none___");
      if (delToolsErr) throw new Error(`Delete tools: ${delToolsErr.message}`);

      // 2. Delete all categories
      addLog("Suppression des catégories…");
      const { error: delCatsErr } = await supabase.from("categories").delete().neq("id", "___none___");
      if (delCatsErr) throw new Error(`Delete categories: ${delCatsErr.message}`);

      // 3. Re-insert categories
      addLog(`Insertion de ${categories.length} catégories…`);
      const catsPayload = categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
      }));
      const { error: insCatsErr } = await supabase.from("categories").insert(catsPayload);
      if (insCatsErr) throw new Error(`Insert categories: ${insCatsErr.message}`);

      // 4. Re-insert tools in batches of 20
      addLog(`Insertion de ${tools.length} outils…`);
      for (let i = 0; i < tools.length; i += 20) {
        const batch = tools.slice(i, i + 20).map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug || t.id,
          category: t.categoryId || null,
          short_description: t.shortDescription || "",
          long_description: t.longDescription || "",
          affiliate_link: t.affiliateLink || "",
          website_url: (t as any).websiteUrl || t.affiliateLink || "",
          default_monthly_price: Math.round(t.defaultMonthlyPrice || 0),
          pricing: t.pricing as any,
          logo: "",
          solo_relevance: t.soloRelevance || null,
          team_relevance: t.teamRelevance || null,
          time_gained_hours_per_month: t.timeGainedHoursPerMonth ?? null,
          free_alternative: t.freeAlternative || null,
          verdict: t.verdict as any,
          pros: t.pros as any,
          cons: t.cons as any,
          use_cases: t.useCases as any,
          covers: t.covers as any,
          relevant_for: t.relevantFor as any,
          alternatives: t.alternatives as any,
          seo: t.seo as any,
          articles: t.articles as any,
        }));
        const { error } = await supabase.from("tools").insert(batch as any);
        if (error) throw new Error(`Insert tools batch ${i}: ${error.message}`);
        addLog(`  Batch ${i}-${i + batch.length} OK`);
      }

      addLog("✅ Re-seed terminé !");
      setStatus("done");
    } catch (err: any) {
      addLog(`❌ Erreur: ${err.message}`);
      setStatus("error");
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-16 px-4">
      <h1 className="text-2xl font-bold mb-6">Re-seed des outils</h1>
      <p className="text-muted-foreground mb-4">
        Cette page vide la table tools et categories puis les re-remplit depuis content.json.
      </p>
      <Button onClick={handleReseed} disabled={status === "running"} variant="destructive">
        {status === "running" ? "En cours…" : "Lancer le re-seed"}
      </Button>
      <pre className="mt-6 bg-muted p-4 rounded text-sm max-h-96 overflow-auto whitespace-pre-wrap">
        {log.length === 0 ? "En attente…" : log.join("\n")}
      </pre>
    </div>
  );
};

export default UpdateToolsPage;
