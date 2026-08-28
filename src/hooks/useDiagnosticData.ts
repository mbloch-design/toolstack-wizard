import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  Tool,
  ToolRelationKind,
  Cluster,
  DoubleRule,
  DiscoveryQuestion,
  Persona,
} from "@/types/diagnostic";
import { inferCatalogMonthlyPrice } from "@/utils/diagnosticPricing";

function textValue(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return textValue(record.fr ?? record.en ?? record.name ?? record.label, fallback);
  }
  return fallback;
}

function toolIdValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return toolIdValue(
      record.targetToolId ??
      record.target_tool_id ??
      record.id ??
      record.tool ??
      record.slug
    );
  }
  return "";
}

function toolIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(toolIdValue).filter(Boolean))];
}

function mapTool(t: any): Tool {
  const catalogPrice = inferCatalogMonthlyPrice({
    defaultMonthlyPrice: Number(t.default_monthly_price ?? t.defaultMonthlyPrice) || 0,
    pricing: t.pricing && typeof t.pricing === "object" ? t.pricing : undefined,
    pricingEn: (t.pricing_en || t.pricingEn) && typeof (t.pricing_en || t.pricingEn) === "object"
      ? t.pricing_en || t.pricingEn
      : undefined,
    pricing_v5: t.pricing_v5 && typeof t.pricing_v5 === "object" ? t.pricing_v5 : undefined,
  });

  return {
    id: textValue(t.id),
    slug: t.slug || undefined,
    name: textValue(t.name, textValue(t.id, "Outil")),
    name_en: t.short_description_en ? t.name : undefined,
    logo: t.logo || undefined,
    websiteUrl: t.website_url || t.websiteUrl || undefined,
    affiliateLink: t.affiliate_link || t.affiliateLink || undefined,
    price: catalogPrice.amount,
    priceCurrency: catalogPrice.currency,
    category: textValue(t.category || t.categoryId),
    functional_needs: Array.isArray(t.functional_needs) ? t.functional_needs : [],
    verticals: Array.isArray(t.verticals) ? t.verticals : [],
    host_app: t.host_app || undefined,
    provider_id: t.provider_id || t.providerId || undefined,
    commercial_family: t.commercial_family || t.commercialFamily || undefined,
    alternatives: toolIdArray(t.alternatives),
    complements: toolIdArray(t.complements),
    integrates_with: toolIdArray(t.integrates_with),
    relations: Array.isArray(t.relations)
      ? t.relations
          .filter((relation: any) =>
            ["plugin_of", "included_in", "complements", "alternative_to", "integrates_with"]
              .includes(relation?.kind) &&
            toolIdValue(relation.targetToolId || relation.target_tool_id)
          )
          .map((relation: any) => ({
            kind: relation.kind as ToolRelationKind,
            targetToolId: toolIdValue(relation.targetToolId || relation.target_tool_id),
            needKeys: Array.isArray(relation.needKeys || relation.need_keys)
              ? relation.needKeys || relation.need_keys
              : undefined,
            confidence: relation.confidence,
          }))
      : [],
    substitution_cluster_v2: t.substitution_cluster_v2 || undefined,
    pertinence_by_persona: t.pertinence_by_persona || undefined,
    tool_type: (t.tool_type as Tool["tool_type"]) || "satellite",
    ia_use_case: typeof t.ia_use_case === "object" && t.ia_use_case ? JSON.stringify(t.ia_use_case) : t.ia_use_case || undefined,
    usage: "medium",
    prescription_quality: (t.prescription_quality as Tool["prescription_quality"]) || "oui",
    pricing: t.pricing && typeof t.pricing === "object" ? t.pricing : undefined,
    pricingEn: (t.pricing_en || t.pricingEn) && typeof (t.pricing_en || t.pricingEn) === "object"
      ? t.pricing_en || t.pricingEn
      : undefined,
    freeAlternative: t.free_alternative || t.freeAlternative || undefined,
    downgrade_plan: (t.downgrade_plan || t.downgradePlan) && typeof (t.downgrade_plan || t.downgradePlan) === "object"
      ? {
          available: (t.downgrade_plan || t.downgradePlan).available ?? false,
          fromPrice: (t.downgrade_plan || t.downgradePlan).fromPrice ?? 0,
          toPrice: (t.downgrade_plan || t.downgradePlan).toPrice ?? 0,
          plan: (t.downgrade_plan || t.downgradePlan).plan ?? "",
          freeTier: (t.downgrade_plan || t.downgradePlan).freeTier ?? null,
        }
      : undefined,
    better_alternative: (t.better_alternative || t.betterAlternative) && typeof (t.better_alternative || t.betterAlternative) === "object"
      ? JSON.stringify(t.better_alternative || t.betterAlternative)
      : t.better_alternative || t.betterAlternative || undefined,
    pricing_v5: t.pricing_v5 && typeof t.pricing_v5 === "object" ? t.pricing_v5 : undefined,
    catalogMonthlyPrice: catalogPrice.amount,
    catalogMonthlyPriceCurrency: catalogPrice.currency,
    force_silence: t.force_silence === true || t.prescription_quality === "silence",
    bundle_parent: t.bundle_parent || undefined,
  };
}

function mergeTools(local: Tool, remote: Tool): Tool {
  const unique = (values: string[]) => [...new Set(values.filter(Boolean))];
  const relationMap = new Map(
    [...(local.relations || []), ...(remote.relations || [])]
      .map((relation) => [`${relation.kind}:${relation.targetToolId}`, relation] as const)
  );

  return {
    ...local,
    ...remote,
    functional_needs: unique([
      ...(local.functional_needs || []),
      ...(remote.functional_needs || []),
    ]),
    verticals: unique([...(local.verticals || []), ...(remote.verticals || [])]),
    alternatives: unique([...(local.alternatives || []), ...(remote.alternatives || [])]),
    complements: unique([...(local.complements || []), ...(remote.complements || [])]),
    integrates_with: unique([...(local.integrates_with || []), ...(remote.integrates_with || [])]),
    relations: [...relationMap.values()],
    host_app: remote.host_app || local.host_app,
    provider_id: remote.provider_id || local.provider_id,
    commercial_family: remote.commercial_family || local.commercial_family,
    bundle_parent: remote.bundle_parent || local.bundle_parent,
    substitution_cluster_v2: remote.substitution_cluster_v2 || local.substitution_cluster_v2,
    pricing_v5: {
      ...(local.pricing_v5 || {}),
      ...(remote.pricing_v5 || {}),
    },
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

const DISCOVERY_QUESTION_I18N: Record<string, {
  questionEn: string;
  subtitleEn: string;
  optionLabelsEn: string[];
}> = {
  "dq-adobe-usage": {
    questionEn: "How many Adobe apps do you use regularly?",
    subtitleEn: "If you use 3+ apps, the full suite may be more cost-effective.",
    optionLabelsEn: [
      "Only 1–2 apps",
      "3–4 apps",
      "5+ apps",
    ],
  },
  "dq-design-collab": {
    questionEn: "Do you collaborate with clients or a team in Figma?",
    subtitleEn: "The free plan may be enough for solo work.",
    optionLabelsEn: [
      "Yes, daily collaboration",
      "Sometimes, with a few clients",
      "No, I work solo",
    ],
  },
  "dq-design-tool-pro": {
    questionEn: "Do you use the pro features of your design tool?",
    subtitleEn: "Variables, components, dev mode, etc.",
    optionLabelsEn: [
      "Yes, daily",
      "Sometimes",
      "No, just the basics",
    ],
  },
  "dq-ai-llm-usage": {
    questionEn: "How do you use your LLMs day to day?",
    subtitleEn: "This helps us know whether you really need several subscriptions.",
    optionLabelsEn: [
      "Mostly chat and questions",
      "Content generation (articles, emails)",
      "Code and technical work",
      "I test, but rarely use them",
    ],
  },
};

function normalizeDiscoveryText(value: unknown) {
  return textValue(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function getDiscoveryQuestionI18n(q: any) {
  const knownById = DISCOVERY_QUESTION_I18N[q.id];
  if (knownById) return knownById;

  const normalizedQuestion = normalizeDiscoveryText(q.question);
  if (
    normalizedQuestion.includes("comment utilises-tu tes llms") ||
    normalizedQuestion.includes("comment utilises tu tes llms")
  ) {
    return DISCOVERY_QUESTION_I18N["dq-ai-llm-usage"];
  }

  return undefined;
}

export function mapDiscoveryQuestion(q: any): DiscoveryQuestion {
  const knownI18n = getDiscoveryQuestionI18n(q);
  return {
    id: q.id,
    persona: q.persona as Persona | "ALL",
    question: q.question,
    questionEn: q.question_en || q.questionEn || knownI18n?.questionEn,
    subtitle: q.subtitle || "",
    subtitleEn: q.subtitle_en || q.subtitleEn || knownI18n?.subtitleEn,
    options: Array.isArray(q.options)
      ? q.options.map((option: any, index: number) => ({
          ...option,
          labelEn: option?.label_en || option?.labelEn || knownI18n?.optionLabelsEn[index],
        }))
      : [],
    condition_tool_ids: Array.isArray(q.condition_tool_ids) ? q.condition_tool_ids : [],
    condition_type: (q.condition_type as "any" | "all") || "any",
  };
}

async function fetchAllDiagnosticTools() {
  const pageSize = 500;
  const rows: any[] = [];
  for (let from = 0; ; from += pageSize) {
    const response = await supabase
      .from("tools")
      .select("*")
      .range(from, from + pageSize - 1);
    if (response.error) throw new Error(response.error.message);
    const page = response.data || [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
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
        const [localToolsModule, remoteResults] = await Promise.all([
          import("@/data/tools_v4.json"),
          Promise.allSettled([
          fetchAllDiagnosticTools(),
          supabase.from("clusters").select("*").order("order", { ascending: true }),
          supabase.from("doublon_rules").select("*"),
          supabase.from("discovery_questions").select("*"),
          ]),
        ]);

        const [toolsResult, clustersResult, doublesResult, questionsResult] = remoteResults;
        const toolRows = toolsResult.status === "fulfilled" ? toolsResult.value : [];
        const clustersRes = clustersResult.status === "fulfilled" && !clustersResult.value.error
          ? clustersResult.value
          : { data: [] };
        const doublesRes = doublesResult.status === "fulfilled" && !doublesResult.value.error
          ? doublesResult.value
          : { data: [] };
        const questionsRes = questionsResult.status === "fulfilled" && !questionsResult.value.error
          ? questionsResult.value
          : { data: [] };

        if (remoteResults.some((result) => result.status === "rejected")) {
          console.warn("Diagnostic: remote data unavailable, using the local catalogue fallback");
        }

        const mergedTools = new Map<string, Tool>();
        (localToolsModule.default as unknown[])
          .map(mapTool)
          .filter((tool) => tool.id && tool.name)
          .forEach((tool) => mergedTools.set(tool.id, tool));
        toolRows
          .map(mapTool)
          .filter((tool) => tool.id && tool.name)
          .forEach((tool) => {
            const local = mergedTools.get(tool.id);
            mergedTools.set(tool.id, local ? mergeTools(local, tool) : tool);
          });
        setTools([...mergedTools.values()]);
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
