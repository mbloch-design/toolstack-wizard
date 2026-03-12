import { useState } from "react";
import { categories, tools } from "@/data/content";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const UpdateToolsPage = () => {
  const [status, setStatus] = useState<string>("idle");
  const [log, setLog] = useState<string[]>([]);
  const [adminKey, setAdminKey] = useState("");

  const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

  const callSeed = async (body: any) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/seed-content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "x-admin-key": adminKey,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  };

  const handleReseed = async () => {
    if (!adminKey) { addLog("❌ Entrez la clé admin"); return; }
    setStatus("running");
    setLog([]);

    try {
      // 1. Cleanup + insert categories
      addLog("Nettoyage + insertion catégories…");
      const catsPayload = categories.map((c) => ({
        id: c.id, slug: c.slug, name: c.name, description: c.description,
      }));
      const r1 = await callSeed({ action: "cleanup", categories: catsPayload });
      addLog(`  ✓ ${r1.categoriesInserted} catégories`);

      // 2. Insert tools in batches of 20
      addLog(`Insertion de ${tools.length} outils…`);
      for (let i = 0; i < tools.length; i += 20) {
        const batch = tools.slice(i, i + 20).map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug || t.id,
          category: t.categoryId || null,
          shortDescription: t.shortDescription || "",
          longDescription: t.longDescription || "",
          affiliateLink: t.affiliateLink || "",
          websiteUrl: (t as any).websiteUrl || t.affiliateLink || "",
          defaultMonthlyPrice: t.defaultMonthlyPrice || 0,
          pricing: t.pricing || null,
          soloRelevance: t.soloRelevance || null,
          teamRelevance: t.teamRelevance || null,
          timeGainedHoursPerMonth: t.timeGainedHoursPerMonth ?? null,
          freeAlternative: t.freeAlternative || null,
          verdict: t.verdict || null,
          pros: t.pros || null,
          cons: t.cons || null,
          useCases: t.useCases || null,
          covers: t.covers || null,
          relevantFor: t.relevantFor || null,
          alternatives: t.alternatives || null,
          seo: t.seo || null,
          articles: t.articles || null,
        }));
        const r = await callSeed({ action: "insert_tools", tools: batch });
        addLog(`  Batch ${i}-${i + batch.length}: ${r.toolsInserted} outils`);
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
        Vide tools + categories puis re-remplit depuis content.json via la edge function.
      </p>
      <input
        type="password"
        placeholder="SEED_ADMIN_KEY"
        value={adminKey}
        onChange={(e) => setAdminKey(e.target.value)}
        className="w-full mb-4 p-2 border rounded bg-background text-foreground"
      />
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
