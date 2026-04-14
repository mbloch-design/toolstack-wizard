import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tool, Cluster, DoubleRule, DiscoveryQuestion, Persona } from "@/types/diagnostic";

function mapTool(t: any): Tool {
  return {
    id: t.id,
    name: t.name,
    name_en: t.short_description_en ? t.name : undefined,
    price: Number(t.default_monthly_price) || 0,
    category: t.category || "",
    functional_needs: Array.isArray(t.functional_needs) ? t.functional_needs : [],
    pertinence_by_persona: t.pertinence_by_persona || undefined,
    tool_type: (t.tool_type as Tool["tool_type"]) || "satellite",
    ia_use_case: typeof t.ia_use_case === "object" && t.ia_use_case ? JSON.stringify(t.ia_use_case) : t.ia_use_case || undefined,
    usage: "medium",
    prescription_quality: (t.prescription_quality as Tool["prescription_quality"]) || "oui",
    freeAlternative: t.free_alternative || undefined,
    downgrade_plan: t.downgrade_plan && typeof t.downgrade_plan === "object"
      ? {
          available: t.downgrade_plan.available ?? false,
          fromPrice: t.downgrade_plan.fromPrice ?? 0,
          toPrice: t.downgrade_plan.toPrice ?? 0,
          plan: t.downgrade_plan.plan ?? "",
        }
      : undefined,
    better_alternative: t.better_alternative && typeof t.better_alternative === "object"
      ? JSON.stringify(t.better_alternative)
      : t.better_alternative || undefined,
    force_silence: t.force_silence === true || t.prescription_quality === "silence",
    bundle_parent: t.bundle_parent || undefined,
  };
}

function mapCluster(c: any): Cluster {
  return {
    persona: c.persona as Persona,
    order: c.order,
    question: c.question,
    question_en: c.question_en || undefined,
    why: c.why || "",
    cols: c.cols || 2,
    tool_ids: Array.isArray(c.tool_ids) ? c.tool_ids : [],
  };
}

function mapDoubleRule(r: any): DoubleRule {
  return {
    ids: Array.isArray(r.ids) ? r.ids : [],
    message: r.message,
    savings: Number(r.savings) || 0,
    category: r.category || "",
  };
}

function mapDiscoveryQuestion(q: any): DiscoveryQuestion {
  return {
    id: q.id,
    persona: q.persona as Persona | "ALL",
    question: q.question,
    subtitle: q.subtitle || "",
    options: Array.isArray(q.options) ? q.options : [],
    condition_tool_ids: Array.isArray(q.condition_tool_ids) ? q.condition_tool_ids : [],
    condition_type: (q.condition_type as "any" | "all") || "any",
  };
}

export function useDiagnosticData() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [doublonRules, setDoublonRules] = useState<DoubleRule[]>([]);
  const [discoveryQuestions, setDiscoveryQuestions] = useState<DiscoveryQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [toolsRes, clustersRes, doublesRes, questionsRes] = await Promise.all([
          supabase.from("tools").select("*").limit(500),
          supabase.from("clusters").select("*").order("order", { ascending: true }),
          supabase.from("doublon_rules").select("*"),
          supabase.from("discovery_questions").select("*"),
        ]);

        if (toolsRes.error) throw new Error(toolsRes.error.message);
        setTools((toolsRes.data || []).map(mapTool));
        setClusters((clustersRes.data || []).map(mapCluster));
        setDoublonRules((doublesRes.data || []).map(mapDoubleRule));
        setDiscoveryQuestions((questionsRes.data || []).map(mapDiscoveryQuestion));
      } catch (e: any) {
        setError(e.message || "Failed to load diagnostic data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { tools, clusters, doublonRules, discoveryQuestions, loading, error };
}
