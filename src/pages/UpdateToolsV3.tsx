import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import contentJson from "@/data/content.json";

const UpdateToolsV3 = () => {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    setStatus("Mise à jour en cours...");

    const tools = (contentJson as any).tools || [];
    let updated = 0;
    let errors = 0;

    for (const t of tools) {
      const { error } = await supabase
        .from("tools")
        .update({ personas: t.personas || [] } as any)
        .eq("id", t.id);

      if (error) {
        console.error(`Error updating ${t.id}:`, error);
        errors++;
      } else {
        updated++;
      }
    }

    setStatus(`Terminé : ${updated} outils mis à jour, ${errors} erreurs.`);
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-xl py-20 px-6">
      <h1 className="text-2xl font-bold mb-4">Mise à jour Tools v3 — Personas</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Met à jour le champ <code>personas</code> pour chaque outil depuis content.json.
      </p>
      <button
        onClick={handleUpdate}
        disabled={loading}
        className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading ? "En cours..." : "Lancer la mise à jour"}
      </button>
      {status && <p className="mt-4 text-sm font-medium">{status}</p>}
    </div>
  );
};

export default UpdateToolsV3;
