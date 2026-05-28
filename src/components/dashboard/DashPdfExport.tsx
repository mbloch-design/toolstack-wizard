import { useState, useCallback } from "react";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { DiagnosticResult } from "@/types/diagnostic";

interface Props {
  result: DiagnosticResult;
  t: (fr: string, en: string) => string;
  variant?: "primary" | "outline";
}

function serializeResult(result: DiagnosticResult) {
  const toolScoresObj: Record<string, { pertinence: number; valueIndex: number; scoreFinal: number }> = {};
  result.toolScores.forEach((v, k) => { toolScoresObj[k] = v; });

  return {
    lang: result.sessionState.language,
    firstName: result.sessionState.firstName,
    persona: result.sessionState.persona,
    healthScore: result.healthScore,
    healthLabel: result.healthLabel,
    stackTotalCost: result.stackTotalCost,
    estimatedWaste: Math.round(result.estimatedWaste),
    optimizedCost: result.optimizedCost,
    annualSavings: result.annualSavings,
    hoursRecoverable: result.hoursRecoverable,
    selectedTools: result.sessionState.selectedTools.map((t) => ({
      id: t.id, name: t.name, price: t.price,
      category: t.category, tool_type: t.tool_type, usage: t.usage,
    })),
    toolScores: toolScoresObj,
    prescriptions: result.prescriptions,
    insights: result.insights,
    recommendations: result.recommendations.slice(0, 6).map((r) => ({
      id: r.id, name: r.name, price: r.price, category: r.category,
    })),
  };
}

export default function DashPdfExport({ result, t, variant = "outline" }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = useCallback(async () => {
    setLoading(true);
    try {
      const payload = serializeResult(result);
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const url = `https://${projectId}.supabase.co/functions/v1/generate-report`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey,
          "Authorization": `Bearer ${anonKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `tooltrim-diagnostic-${result.sessionState.firstName.toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error("PDF export failed:", e);
    } finally {
      setLoading(false);
    }
  }, [result]);

  const cls = variant === "primary"
    ? "bg-primary text-primary-foreground hover:opacity-90"
    : "border border-border text-foreground hover:bg-muted";

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${cls} disabled:opacity-50`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {loading ? t("Génération…", "Generating…") : t("Télécharger rapport", "Download report")}
    </button>
  );
}
