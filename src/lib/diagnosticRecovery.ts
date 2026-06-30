import type {
  CommercialContract,
  DiscoveryQuestion,
  Persona,
  SessionState,
  Tool,
  WorkflowUsage,
} from "@/types/diagnostic";
import { normalizeAiMode } from "@/lib/workflowUsage";
import { normalizeAiActors } from "@/lib/aiWorkflow";

const RECOVERY_KEY = "tooltrim.diagnostic.recovery.v1";
const MAX_RECOVERY_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export type DiagnosticRecoveryState = {
  funnelVersion: string;
  step: number;
  session: SessionState;
  dbSessionId: string | null;
  dbSessionToken: string | null;
  finalSaveDone: boolean;
  reportEmailQueued: boolean;
  savedAt: string;
};

type RawRecoveryState = Omit<DiagnosticRecoveryState, "session"> & {
  session: Omit<SessionState, "discoveryAnswers"> & {
    discoveryAnswers?: Record<string, number>;
  };
};

const PERSONAS: Persona[] = ["THEO", "SOFIA", "MARC", "ALIX", "CLAIRE"];
const PERSONA_CONFIDENCE = ["clear", "hybrid", "unsure"] as const;
const STACK_GOALS = ["reduce_costs", "save_time", "simplify", "quality"] as const;
const COVERAGE_CONFIDENCE = ["low", "medium", "high"] as const;

function isPersona(value: unknown): value is Persona {
  return typeof value === "string" && PERSONAS.includes(value as Persona);
}

function isPersonaConfidence(value: unknown): value is NonNullable<SessionState["personaConfidence"]> {
  return typeof value === "string" && PERSONA_CONFIDENCE.includes(value as NonNullable<SessionState["personaConfidence"]>);
}

function isStackGoal(value: unknown): value is NonNullable<SessionState["stackGoal"]> {
  return typeof value === "string" && STACK_GOALS.includes(value as NonNullable<SessionState["stackGoal"]>);
}

function sanitizeSelectionCoverage(value: unknown): SessionState["selectionCoverage"] {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Partial<NonNullable<SessionState["selectionCoverage"]>>;
  const confidence = COVERAGE_CONFIDENCE.includes(raw.confidence as typeof COVERAGE_CONFIDENCE[number])
    ? raw.confidence as typeof COVERAGE_CONFIDENCE[number]
    : "low";
  return {
    covered: Array.isArray(raw.covered)
      ? raw.covered.filter((item): item is string => typeof item === "string")
      : [],
    skipped: Array.isArray(raw.skipped)
      ? raw.skipped.filter((item): item is string => typeof item === "string")
      : [],
    confidence,
  };
}

function sanitizeDiscoveryQuestions(value: unknown): DiscoveryQuestion[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const questions = value.flatMap((item): DiscoveryQuestion[] => {
    if (!item || typeof item !== "object") return [];
    const raw = item as Partial<DiscoveryQuestion>;
    if (
      typeof raw.id !== "string" ||
      typeof raw.question !== "string" ||
      !Array.isArray(raw.options) ||
      !Array.isArray(raw.condition_tool_ids)
    ) {
      return [];
    }
    const persona = raw.persona === "ALL" || isPersona(raw.persona) ? raw.persona : "ALL";
    const options = raw.options.flatMap((option): DiscoveryQuestion["options"] => {
      if (
        !option ||
        typeof option.label !== "string" ||
        !["keep", "review", "cancel"].includes(option.impact)
      ) {
        return [];
      }
      return [{
        label: option.label,
        labelEn: typeof option.labelEn === "string" ? option.labelEn : undefined,
        impact: option.impact,
        affectedTools: Array.isArray(option.affectedTools)
          ? option.affectedTools.filter((toolId): toolId is string => typeof toolId === "string")
          : undefined,
      }];
    });
    if (options.length === 0) return [];
    return [{
      id: raw.id,
      persona,
      question: raw.question,
      questionEn: typeof raw.questionEn === "string" ? raw.questionEn : undefined,
      subtitle: typeof raw.subtitle === "string" ? raw.subtitle : "",
      subtitleEn: typeof raw.subtitleEn === "string" ? raw.subtitleEn : undefined,
      options,
      condition_tool_ids: raw.condition_tool_ids.filter((toolId): toolId is string => typeof toolId === "string"),
      condition_type: raw.condition_type === "all" ? "all" : "any",
    }];
  });
  return questions.length > 0 ? questions : undefined;
}

function sanitizeWorkflowUsages(value: unknown): WorkflowUsage[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const usages = value.flatMap((item): WorkflowUsage[] => {
    if (!item || typeof item !== "object") return [];
    const raw = item as Partial<WorkflowUsage>;
    if (typeof raw.objectiveId !== "string") return [];
    const method = ["tool", "manual", "mixed", "outsourced", "unknown"].includes(String(raw.method))
      ? raw.method as WorkflowUsage["method"]
      : "unknown";
    return [{
      id: typeof raw.id === "string" ? raw.id : `usage-${raw.objectiveId}`,
      objectiveId: raw.objectiveId,
      objectiveLabelFr: typeof raw.objectiveLabelFr === "string" ? raw.objectiveLabelFr : raw.objectiveId,
      objectiveLabelEn: typeof raw.objectiveLabelEn === "string" ? raw.objectiveLabelEn : raw.objectiveId,
      method,
      toolIds: Array.isArray(raw.toolIds)
        ? raw.toolIds.filter((item): item is string => typeof item === "string")
        : [],
      customMethod: typeof raw.customMethod === "string" ? raw.customMethod : undefined,
      aiMode: normalizeAiMode(raw.aiMode),
      aiToolIds: Array.isArray(raw.aiToolIds)
        ? raw.aiToolIds.filter((item): item is string => typeof item === "string")
        : [],
      aiActors: normalizeAiActors(raw.aiActors),
      aiNotes: typeof raw.aiNotes === "string" ? raw.aiNotes : undefined,
      importance: raw.importance,
      frequency: raw.frequency,
      satisfaction: raw.satisfaction,
    }];
  });
  return usages.length > 0 ? usages : undefined;
}

function sanitizeCommercialContracts(value: unknown): CommercialContract[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const contracts = value.flatMap((item): CommercialContract[] => {
    if (!item || typeof item !== "object") return [];
    const raw = item as Partial<CommercialContract>;
    if (typeof raw.familyId !== "string") return [];
    const accessMode = [
      "suite", "mixed", "single_products", "team_employer", "client_paid",
      "included_elsewhere", "free", "usage_based", "one_time", "unknown",
    ].includes(String(raw.accessMode))
      ? raw.accessMode as CommercialContract["accessMode"]
      : "unknown";
    const payer = ["self", "employer", "client", "shared", "unknown"].includes(String(raw.payer))
      ? raw.payer as CommercialContract["payer"]
      : "unknown";
    return [{
      id: typeof raw.id === "string" ? raw.id : `contract-${raw.familyId}`,
      familyId: raw.familyId,
      familyName: typeof raw.familyName === "string" ? raw.familyName : raw.familyId,
      accessMode,
      planId: typeof raw.planId === "string" ? raw.planId : undefined,
      planLabel: typeof raw.planLabel === "string" ? raw.planLabel : undefined,
      payer,
      productIds: Array.isArray(raw.productIds)
        ? raw.productIds.filter((item): item is string => typeof item === "string")
        : [],
      monthlyPrice: typeof raw.monthlyPrice === "number" ? raw.monthlyPrice : undefined,
      aiAllowanceStatus: [
        "enough",
        "sometimes_limited",
        "frequently_limited",
        "extra_purchases",
        "unknown",
      ].includes(String(raw.aiAllowanceStatus))
        ? raw.aiAllowanceStatus as CommercialContract["aiAllowanceStatus"]
        : undefined,
      variableMonthlyPrice: typeof raw.variableMonthlyPrice === "number"
        ? Math.max(0, raw.variableMonthlyPrice)
        : undefined,
      currency: typeof raw.currency === "string" ? raw.currency : undefined,
      confirmed: raw.confirmed === true,
    }];
  });
  return contracts.length > 0 ? contracts : undefined;
}

function sanitizeTool(tool: unknown): Tool | null {
  if (!tool || typeof tool !== "object") return null;
  const raw = tool as Partial<Tool>;
  if (typeof raw.id !== "string" || typeof raw.name !== "string") return null;
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    name_en: raw.name_en,
    logo: raw.logo,
    websiteUrl: raw.websiteUrl,
    affiliateLink: raw.affiliateLink,
    price: Number(raw.price) || 0,
    priceCurrency: raw.priceCurrency,
    category: typeof raw.category === "string" ? raw.category : "",
    functional_needs: Array.isArray(raw.functional_needs)
      ? raw.functional_needs.filter((item): item is string => typeof item === "string")
      : [],
    verticals: Array.isArray(raw.verticals)
      ? raw.verticals.filter((item): item is string => typeof item === "string")
      : [],
    host_app: typeof raw.host_app === "string" ? raw.host_app : undefined,
    provider_id: typeof raw.provider_id === "string" ? raw.provider_id : undefined,
    commercial_family: typeof raw.commercial_family === "string" ? raw.commercial_family : undefined,
    alternatives: Array.isArray(raw.alternatives)
      ? raw.alternatives.filter((item): item is string => typeof item === "string")
      : [],
    substitution_cluster_v2: typeof raw.substitution_cluster_v2 === "string" ? raw.substitution_cluster_v2 : undefined,
    pertinence_by_persona: raw.pertinence_by_persona,
    tool_type: raw.tool_type || "satellite",
    ia_use_case: raw.ia_use_case,
    usage: raw.usage || "medium",
    prescription_quality: raw.prescription_quality || "oui",
    pricing: raw.pricing,
    pricingEn: raw.pricingEn,
    freeAlternative: raw.freeAlternative,
    downgrade_plan: raw.downgrade_plan,
    better_alternative: raw.better_alternative,
    pricing_v5: raw.pricing_v5,
    selectedOffer: raw.selectedOffer,
    catalogMonthlyPrice: Number(raw.catalogMonthlyPrice) || 0,
    catalogMonthlyPriceCurrency: raw.catalogMonthlyPriceCurrency,
    selectedPriceIsEstimate: raw.selectedPriceIsEstimate,
    force_silence: raw.force_silence === true,
    bundle_parent: raw.bundle_parent,
    includedInBundle: raw.includedInBundle,
    includedVia: raw.includedVia,
    commercialContractId: raw.commercialContractId,
  };
}

function deserializeSession(raw: RawRecoveryState["session"], language: "fr" | "en"): SessionState | null {
  if (!raw || typeof raw !== "object") return null;
  if (raw.language !== language) return null;
  if (!isPersona(raw.persona)) return null;

  const discoveryAnswers = new Map<string, number>();
  Object.entries(raw.discoveryAnswers || {}).forEach(([key, value]) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) discoveryAnswers.set(key, parsed);
  });

  return {
    firstName: typeof raw.firstName === "string" ? raw.firstName : "",
    tjm: Number(raw.tjm) || 0,
    language,
    persona: raw.persona,
    personaConfidence: isPersonaConfidence(raw.personaConfidence) ? raw.personaConfidence : "clear",
    stackGoal: isStackGoal(raw.stackGoal) ? raw.stackGoal : undefined,
    complementarySkills: Array.isArray(raw.complementarySkills)
      ? raw.complementarySkills.filter(isPersona)
      : [],
    primarySpecialty: typeof raw.primarySpecialty === "string" ? raw.primarySpecialty : undefined,
    complementarySpecialties: Array.isArray(raw.complementarySpecialties)
      ? raw.complementarySpecialties.filter((item): item is string => typeof item === "string")
      : undefined,
    toolUsageMap: raw.toolUsageMap && typeof raw.toolUsageMap === "object"
      ? Object.fromEntries(
          Object.entries(raw.toolUsageMap)
            .filter(([, value]) => Array.isArray(value))
            .map(([key, value]) => [key, (value as unknown[]).filter((item): item is string => typeof item === "string")])
        )
      : undefined,
    workflowUsages: sanitizeWorkflowUsages(raw.workflowUsages),
    commercialContracts: sanitizeCommercialContracts(raw.commercialContracts),
    selectionCoverage: sanitizeSelectionCoverage(raw.selectionCoverage),
    adaptiveDiscoveryQuestions: sanitizeDiscoveryQuestions(raw.adaptiveDiscoveryQuestions),
    email: typeof raw.email === "string" ? raw.email : undefined,
    emailPreferences: raw.emailPreferences,
    apiSpendTranche: raw.apiSpendTranche,
    selectedTools: Array.isArray(raw.selectedTools)
      ? raw.selectedTools.map(sanitizeTool).filter((item): item is Tool => !!item)
      : [],
    discoveryAnswers,
    closingAnswers: Array.isArray(raw.closingAnswers) && raw.closingAnswers.length === 3
      ? [String(raw.closingAnswers[0] || ""), String(raw.closingAnswers[1] || ""), String(raw.closingAnswers[2] || "")]
      : ["", "", ""],
  };
}

function serializeSession(session: SessionState): RawRecoveryState["session"] {
  const discoveryAnswers: Record<string, number> = {};
  session.discoveryAnswers.forEach((value, key) => {
    discoveryAnswers[key] = value;
  });
  return {
    ...session,
    discoveryAnswers,
  };
}

export function loadDiagnosticRecovery(language: "fr" | "en", funnelVersion: string): DiagnosticRecoveryState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RECOVERY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RawRecoveryState;
    if (parsed.funnelVersion !== funnelVersion) return null;
    const savedAt = new Date(parsed.savedAt);
    if (Number.isNaN(savedAt.getTime())) return null;
    if (Date.now() - savedAt.getTime() > MAX_RECOVERY_AGE_MS) {
      window.localStorage.removeItem(RECOVERY_KEY);
      return null;
    }
    const session = deserializeSession(parsed.session, language);
    if (!session) return null;
    return {
      ...parsed,
      session,
      dbSessionId: parsed.dbSessionId || null,
      dbSessionToken: parsed.dbSessionToken || null,
      finalSaveDone: parsed.finalSaveDone === true,
      reportEmailQueued: parsed.reportEmailQueued === true,
    };
  } catch {
    return null;
  }
}

export function saveDiagnosticRecovery(state: Omit<DiagnosticRecoveryState, "savedAt">) {
  if (typeof window === "undefined") return;
  const payload: RawRecoveryState = {
    ...state,
    session: serializeSession(state.session),
    savedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(RECOVERY_KEY, JSON.stringify(payload));
}

export function clearDiagnosticRecovery() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RECOVERY_KEY);
}
