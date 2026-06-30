import { useState, useCallback } from "react";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { DiagnosticResult } from "@/types/diagnostic";
import { translateHealthLabel } from "@/utils/diagnosticLabels";
import {
  buildDiagnosticDecisionPlan,
  getProvenRecommendations,
} from "@/utils/diagnosticDecisionPlan";

interface Props {
  result: DiagnosticResult;
  t: (fr: string, en: string) => string;
  variant?: "primary" | "outline";
  onExport?: () => void;
}

export function serializeDiagnosticResultForPdf(result: DiagnosticResult, t: Props["t"]) {
  const toolScoresObj: Record<string, { pertinence: number; valueIndex: number; scoreFinal: number }> = {};
  result.toolScores.forEach((v, k) => { toolScoresObj[k] = v; });
  const primaryDecisions = buildDiagnosticDecisionPlan(result);
  const provenRecommendations = getProvenRecommendations(result);

  return {
    lang: result.sessionState.language,
    firstName: result.sessionState.firstName,
    persona: result.sessionState.persona,
    healthScore: result.healthScore,
    healthLabel: translateHealthLabel(result.healthLabel, t),
    healthLabelRaw: result.healthLabel,
    stackTotalCost: result.stackTotalCost,
    estimatedWaste: Math.round(result.estimatedWaste),
    optimizedCost: result.optimizedCost,
    annualSavings: result.annualSavings,
    hoursRecoverable: result.hoursRecoverable,
    workflowUsages: result.sessionState.workflowUsages || [],
    commercialContracts: result.sessionState.commercialContracts || [],
    selectedTools: result.sessionState.selectedTools.map((tool) => ({
      id: tool.id, name: tool.name, price: tool.price, priceCurrency: tool.priceCurrency,
      catalogMonthlyPrice: tool.catalogMonthlyPrice, catalogMonthlyPriceCurrency: tool.catalogMonthlyPriceCurrency,
      commercialContractId: tool.commercialContractId,
      category: tool.category, tool_type: tool.tool_type, usage: tool.usage,
    })),
    toolScores: toolScoresObj,
    prescriptions: result.prescriptions,
    insights: result.insights,
    primaryDecisions: primaryDecisions.map((decision) => ({
      id: decision.id,
      kind: decision.kind,
      label: t(decision.labelFr, decision.labelEn),
      detail: t(decision.detailFr, decision.detailEn),
      evidence: t(decision.evidenceFr, decision.evidenceEn),
      evidenceTab: decision.evidenceTab,
      toolId: decision.toolId,
      savings: decision.savings,
      urgency: decision.urgency,
      confidence: decision.confidence,
    })),
    recommendationEvidence: result.recommendationEvidence,
    recommendations: provenRecommendations.map(({ tool, evidence }) => ({
      id: tool.id, name: tool.name, price: tool.price, priceCurrency: tool.priceCurrency,
      catalogMonthlyPrice: tool.catalogMonthlyPrice, catalogMonthlyPriceCurrency: tool.catalogMonthlyPriceCurrency,
      category: tool.category,
      evidence,
    })),
  };
}

export default function DashPdfExport({ result, t, variant = "outline", onExport }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = useCallback(async () => {
    onExport?.();
    setLoading(true);
    try {
      const payload = serializeDiagnosticResultForPdf(result, t);
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
      const name = result.sessionState.firstName?.trim().toLowerCase();
      a.download = `tooltrim-restitution-${name || "stack"}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error("PDF export failed:", e);
    } finally {
      setLoading(false);
    }
  }, [onExport, result, t]);

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
      {loading ? t("Préparation…", "Preparing…") : t("Exporter la restitution", "Export restitution")}
    </button>
  );
}
