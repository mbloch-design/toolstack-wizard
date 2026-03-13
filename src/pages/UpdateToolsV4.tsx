import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import toolsV4Json from "@/data/tools_v4.json";
import verticalsJson from "@/data/verticals.json";

const UpdateToolsV4 = () => {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminKey, setAdminKey] = useState("");

  const handleUpdate = async () => {
    if (!adminKey.trim()) {
      setStatus("❌ Veuillez entrer la clé admin.");
      return;
    }

    setLoading(true);
    setStatus("Envoi des données à l'edge function...");

    try {
      const { data, error } = await supabase.functions.invoke("seed-tools-v4", {
        headers: { "x-admin-key": adminKey.trim() },
        body: { tools: toolsV4Json, verticals: verticalsJson },
      });

      if (error) throw new Error(error.message);

      const { toolsInserted, toolsErrors, verticalsInserted, verticalsError } = data;

      let msg = `✅ Terminé : ${toolsInserted} outils importés`;
      if (toolsErrors?.length > 0) {
        msg += ` (${toolsErrors.length} erreurs)`;
        console.error("Seed errors:", toolsErrors);
      }
      msg += `, ${verticalsInserted} verticals importés.`;
      if (verticalsError) msg += `\n⚠️ Verticals error: ${verticalsError}`;

      setStatus(msg);
    } catch (err: any) {
      setStatus(`❌ Erreur : ${err.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-xl py-20 px-6">
      <h1 className="text-2xl font-bold mb-4">Mise à jour Tools v4 — Full Seed</h1>
      <p className="text-sm text-muted-foreground mb-2">
        ⚠️ Cette action <strong>supprime tous les outils existants</strong> et les remplace par le contenu de <code>tools_v4.json</code>.
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        Elle seede aussi la table <code>verticals</code> depuis <code>verticals.json</code>.
      </p>
      <input
        type="password"
        placeholder="Clé admin (SEED_ADMIN_KEY)"
        value={adminKey}
        onChange={(e) => setAdminKey(e.target.value)}
        className="w-full mb-4 rounded-lg border border-border bg-background px-4 py-2 text-sm"
      />
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
