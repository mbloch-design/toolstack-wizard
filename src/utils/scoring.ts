import type {
  Tool,
  Persona,
  SessionState,
  DoubleRule,
  DiscoveryQuestion,
  DiagnosticAnswerSignal,
  Prescription,
  DiagnosticResult,
} from "@/types/diagnostic";
import { computePertinenceFallback } from "@/utils/pertinenceFallback";
import { buildDiagnosticInsights } from "@/utils/diagnosticInsights";
import {
  buildCreativeQuestions,
  rankToolsForCreativeQuestion,
} from "@/lib/creativeAdaptiveEngine";
import { areToolsDirectlyRelated } from "@/lib/toolRelations";
import {
  contractCoveredProductIds,
  contractMonthlyTotal,
} from "@/lib/commercialAccess";
import { getPricingCaptureSummary } from "@/utils/diagnosticPricing";
import {
  buildAiDiagnosticAnalysis,
  buildPreciseAiOverlapPrescriptions,
} from "@/lib/aiDiagnostic";

// ─── Force-silence list ───────────────────────────────────────────
const FORCE_SILENCE = ["stripe", "google-drive", "paypal", "google-analytics"];

export function canPrescribe(tool: Tool): boolean {
  if (tool.force_silence) return false;
  if (FORCE_SILENCE.includes(tool.id)) return false;
  if (tool.price > 0 && tool.price < 2) return false;
  if (tool.includedInBundle) return false; // Can't prescribe cancellation on bundled tools
  return true;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasUsableFreeTier(tool: Tool): boolean {
  if (tool.price <= 0 || tool.includedInBundle) return false;
  if (tool.downgrade_plan?.available && tool.downgrade_plan.toPrice === 0) return true;
  const freeCopy = normalizeText([
    tool.pricing?.free,
    tool.pricingEn?.free,
    tool.freeAlternative,
    ...(tool.pricing_v5?.cautions || []),
  ].filter(Boolean).join(" "));
  const freeAlternativeSameTool = Boolean(
    tool.freeAlternative &&
    (normalizeText(tool.freeAlternative) === normalizeText(tool.id) ||
      normalizeText(tool.freeAlternative) === normalizeText(tool.name))
  );
  return freeAlternativeSameTool || /\bfree\b|gratuit|forfait de base|plan gratuit/.test(freeCopy);
}

function pricingPlanName(tool: Tool) {
  return tool.pricing_v5?.compare_plan_name || tool.downgrade_plan?.plan || undefined;
}

function buildPricingContext(tool: Tool, reason: NonNullable<Prescription["pricingContext"]>["reason"]) {
  return {
    currentPlan: pricingPlanName(tool),
    targetPlan: tool.downgrade_plan?.available
      ? tool.downgrade_plan.freeTier || tool.downgrade_plan.plan || "Plan inférieur"
      : hasUsableFreeTier(tool)
        ? "Plan gratuit"
        : undefined,
    hasFreeTier: hasUsableFreeTier(tool),
    reliability: tool.pricing_v5?.price_reliability,
    sourceDomain: tool.pricing_v5?.source_domain,
    reason,
  } satisfies NonNullable<Prescription["pricingContext"]>;
}

function getDowngradeSavings(tool: Tool) {
  if (tool.downgrade_plan?.available) {
    const from = tool.downgrade_plan.fromPrice || tool.price;
    return Math.max(0, from - tool.downgrade_plan.toPrice);
  }
  if (hasUsableFreeTier(tool)) return Math.max(0, tool.price);
  return 0;
}

// ─── 1. Pertinence ────────────────────────────────────────────────
export function computePertinence(
  tool: Tool,
  persona: Persona,
  complementarySkills: Persona[]
): number {
  let base = tool.pertinence_by_persona?.[persona] ?? computePertinenceFallback(tool, persona);
  for (const skill of complementarySkills) {
    const skillScore = tool.pertinence_by_persona?.[skill] ?? computePertinenceFallback(tool, skill);
    base += skillScore * 0.1;
  }
  return Math.min(100, Math.round(base));
}

// ─── 2. Value Index ───────────────────────────────────────────────
export function computeValueIndex(tool: Tool, tjm: number): number {
  if (tjm === 0) return 0;
  // Bundled tools have no extra cost → perfect value
  if (tool.includedInBundle) return 100;
  const tjmHoraire = tjm / 5;
  const hoursSaved = 2;
  const monthlyValue = hoursSaved * tjmHoraire;
  const raw = (monthlyValue / (tool.price + 1)) * 100;
  if (raw > 100) return Math.min(100, Math.round(50 + 50 * (Math.log(raw) / Math.log(1000))));
  return Math.round(Math.min(100, raw));
}

// ─── 3. Score Final ───────────────────────────────────────────────
export interface ToolScore {
  pertinence: number;
  valueIndex: number;
  scoreFinal: number;
}

export function computeScoreFinal(
  tool: Tool,
  persona: Persona,
  complementarySkills: Persona[],
  tjm: number
): ToolScore {
  const pertinence = computePertinence(tool, persona, complementarySkills);
  const valueIndex = computeValueIndex(tool, tjm);
  const scoreFinal =
    tjm === 0 ? pertinence : Math.round(pertinence * 0.6 + valueIndex * 0.4);
  return { pertinence, valueIndex, scoreFinal };
}

// ─── 4. Jaccard helper ────────────────────────────────────────────
function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  for (const v of setA) if (setB.has(v)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

// ─── 5. Prescription pipeline ─────────────────────────────────────

function phase1Certified(tools: Tool[]): Prescription[] {
  const out: Prescription[] = [];
  for (const t of tools) {
    if (t.prescription_quality !== "ferme") continue;
    const hasDowngrade = t.downgrade_plan?.available || hasUsableFreeTier(t);
    const downgradeSavings = getDowngradeSavings(t);
    const targetPlan = t.downgrade_plan?.plan || (hasUsableFreeTier(t) ? "gratuit" : "");
    const p: Prescription = {
      toolId: t.id,
      type: hasDowngrade ? "pricing-tier" : "dormant",
      verdict: hasDowngrade ? "downgrade" : "cancel",
      message: hasDowngrade
        ? `Vérifie si le plan ${targetPlan} de ${t.name} suffit à ton usage`
        : `${t.name} peut être annulé`,
      savingsEstimate: hasDowngrade
        ? downgradeSavings
        : t.price,
      pricingContext: hasDowngrade
        ? buildPricingContext(t, t.downgrade_plan?.available ? "downgrade_plan" : "free_tier")
        : undefined,
    };
    out.push(p);
  }
  return out;
}

function phase2Questions(tools: Tool[]): Prescription[] {
  const out: Prescription[] = [];
  for (const t of tools) {
    if (t.prescription_quality !== "question") continue;
    if (t.freeAlternative && t.price > 5 && !hasUsableFreeTier(t)) {
      const p: Prescription = {
        toolId: t.id,
        type: "doublon",
        verdict: "review",
        message: `Alternative gratuite disponible : ${t.freeAlternative}`,
        savingsEstimate: t.price,
        pricingContext: buildPricingContext(t, "free_alternative"),
      };
      out.push(p);
    }
  }
  return out;
}

function detectPricingTierReviews(tools: Tool[]): Prescription[] {
  const out: Prescription[] = [];
  for (const t of tools) {
    if (!canPrescribe(t)) continue;
    if (t.price <= 5) continue;
    const hasFreeTier = hasUsableFreeTier(t);
    const hasDowngrade = t.downgrade_plan?.available;
    const usageSensitive = t.pricing_v5?.usage_sensitive === true;
    if (!hasFreeTier && !hasDowngrade && !usageSensitive) continue;
    if (t.usage === "high" && !usageSensitive) continue;

    const savings = getDowngradeSavings(t);
    const reason: NonNullable<Prescription["pricingContext"]>["reason"] = hasDowngrade
      ? "downgrade_plan"
      : hasFreeTier
        ? "free_tier"
        : "usage_sensitive_price";

    out.push({
      toolId: t.id,
      type: "pricing-tier",
      verdict: "downgrade",
      message: hasFreeTier
        ? `${t.name}: tester si le plan gratuit suffit avant de garder le plan payant`
        : hasDowngrade
          ? `${t.name}: vérifier si un palier inférieur couvre l'usage réel`
          : `${t.name}: prix dépendant de l'usage, vérifier le palier payé`,
      savingsEstimate: savings,
      pricingContext: buildPricingContext(t, reason),
    });
  }
  return out;
}

function areStructurallyComplementary(a: Tool, b: Tool) {
  const normalizeId = (value: string | null | undefined) => (value || "").toLowerCase().trim();
  const aId = normalizeId(a.id);
  const bId = normalizeId(b.id);
  const aHost = normalizeId(a.host_app);
  const bHost = normalizeId(b.host_app);
  const aBundle = normalizeId(a.bundle_parent);
  const bBundle = normalizeId(b.bundle_parent);

  if (areToolsDirectlyRelated(a, b)) return true;
  if (aHost === bId || bHost === aId || aBundle === bId || bBundle === aId) return true;
  if (normalizeId(a.includedVia) === bId || normalizeId(b.includedVia) === aId) return true;
  return false;
}

function toolsShareDeclaredUsage(
  a: Tool,
  b: Tool,
  toolUsageMap: SessionState["toolUsageMap"]
) {
  const aUsages = new Set(toolUsageMap?.[a.id] || []);
  const bUsages = toolUsageMap?.[b.id] || [];
  if (aUsages.size === 0 || bUsages.length === 0) return true;
  return bUsages.some((usage) => aUsages.has(usage));
}

function detectDoublons(
  tools: Tool[],
  rules: DoubleRule[],
  toolUsageMap?: SessionState["toolUsageMap"]
): Prescription[] {
  const out: Prescription[] = [];
  const seen = new Set<string>();

  for (const rule of rules) {
    const matchIds = rule.ids.filter((id) => tools.some((t) => t.id === id));
    if (matchIds.length >= 2) {
      const matchedTools = matchIds
        .map((id) => tools.find((tool) => tool.id === id))
        .filter((tool): tool is Tool => Boolean(tool));
      const hasRelevantOverlap = matchedTools.some((tool, index) =>
        matchedTools.slice(index + 1).some((other) =>
          !areStructurallyComplementary(tool, other) &&
          toolsShareDeclaredUsage(tool, other, toolUsageMap)
        )
      );
      if (!hasRelevantOverlap) continue;
      const key = matchIds.sort().join("+");
      if (seen.has(key)) continue;
      seen.add(key);
      const p: Prescription = {
        toolId: matchIds[1],
        type: "doublon",
        verdict: "cancel",
        message: rule.message,
        savingsEstimate: rule.savings,
      };
      out.push(p);
    }
  }

  for (let i = 0; i < tools.length; i++) {
    for (let j = i + 1; j < tools.length; j++) {
      const a = tools[i], b = tools[j];
      const key = [a.id, b.id].sort().join("+");
      if (seen.has(key)) continue;
      if (areStructurallyComplementary(a, b)) continue;
      if (!toolsShareDeclaredUsage(a, b, toolUsageMap)) continue;
      if (a.functional_needs.length === 0 || b.functional_needs.length === 0) continue;
      if (jaccard(a.functional_needs, b.functional_needs) >= 0.7) {
        seen.add(key);
        const cheaper = a.price <= b.price ? a : b;
        const pricier = a.price <= b.price ? b : a;
        const p: Prescription = {
          toolId: pricier.id,
          type: "doublon",
          verdict: "review",
          message: `${pricier.name} fait doublon avec ${cheaper.name}`,
          savingsEstimate: pricier.price,
        };
        out.push(p);
      }
    }
  }
  return out;
}

function detectDoublonsIA(
  tools: Tool[],
  toolUsageMap?: SessionState["toolUsageMap"]
): Prescription[] {
  const out: Prescription[] = [];
  const usagePriority: Record<Tool["usage"], number> = {
    high: 4,
    medium: 3,
    low: 2,
    dormant: 1,
  };
  const byUseCase = new Map<string, Tool[]>();
  for (const t of tools) {
    if (t.tool_type !== "ia" || !t.ia_use_case) continue;
    const group = byUseCase.get(t.ia_use_case) ?? [];
    group.push(t);
    byUseCase.set(t.ia_use_case, group);
  }
  for (const [useCase, group] of byUseCase) {
    if (group.length < 2) continue;
    group.sort((a, b) =>
      usagePriority[b.usage] - usagePriority[a.usage] ||
      a.price - b.price
    );
    for (let i = 1; i < group.length; i++) {
      if (!toolsShareDeclaredUsage(group[0], group[i], toolUsageMap)) continue;
      const p: Prescription = {
        toolId: group[i].id,
        type: "doublon-ia",
        verdict: "review",
        message: `Doublon IA (${useCase}) avec ${group[0].name}`,
        savingsEstimate: group[i].price,
      };
      out.push(p);
    }
  }
  return out;
}

function detectDormants(tools: Tool[]): Prescription[] {
  const out: Prescription[] = [];
  for (const t of tools) {
    if ((t.usage !== "low" && t.usage !== "dormant") || t.price === 0) continue;
    const covered = tools.some(
      (other) =>
        other.id !== t.id &&
        other.usage !== "dormant" &&
        t.functional_needs.length > 0 &&
        jaccard(t.functional_needs, other.functional_needs) >= 0.5
    );
    if (covered) {
      const p: Prescription = {
        toolId: t.id,
        type: "dormant",
        verdict: "cancel",
        message: `${t.name} semble inutilisé (outil fantôme)`,
        savingsEstimate: t.price,
      };
      out.push(p);
    }
  }
  return out;
}

function detectInadapted(tools: Tool[], scores: Map<string, ToolScore>): Prescription[] {
  const out: Prescription[] = [];
  for (const t of tools) {
    const s = scores.get(t.id);
    if (s && s.scoreFinal < 40) {
      const p: Prescription = {
        toolId: t.id,
        type: "inadapté",
        verdict: "review",
        message: `${t.name} peu adapté à ton profil (score ${s.scoreFinal}/100)`,
        savingsEstimate: 0,
      };
      out.push(p);
    }
  }
  return out;
}

function goalPriority(prescription: Prescription, goal: SessionState["stackGoal"]): number {
  const savings = Number(prescription.savingsEstimate || 0);
  const directness =
    prescription.verdict === "cancel" ? 30 :
    prescription.verdict === "downgrade" ? 24 :
    12;

  if (goal === "simplify") {
    const typeScore =
      prescription.type === "doublon" || prescription.type === "doublon-ia" ? 80 :
      prescription.type === "dormant" ? 60 :
      prescription.type === "pricing-tier" ? 35 :
      25;
    return typeScore + directness + Math.min(30, savings);
  }

  if (goal === "save_time") {
    const typeScore =
      prescription.type === "inadapté" ? 75 :
      prescription.type === "doublon" || prescription.type === "doublon-ia" ? 55 :
      prescription.type === "dormant" ? 40 :
      prescription.type === "pricing-tier" ? 30 :
      20;
    return typeScore + directness + Math.min(16, savings / 2);
  }

  if (goal === "quality") {
    const typeScore =
      prescription.type === "inadapté" ? 85 :
      prescription.type === "pricing-tier" ? 70 :
      prescription.type === "doublon" || prescription.type === "doublon-ia" ? 55 :
      prescription.type === "dormant" ? 35 :
      20;
    return typeScore + directness + Math.min(20, savings / 2);
  }

  const typeScore =
    prescription.type === "pricing-tier" ? 65 :
    prescription.type === "dormant" ? 60 :
    prescription.type === "doublon" || prescription.type === "doublon-ia" ? 55 :
    25;
  return typeScore + directness + Math.min(80, savings * 2);
}

function prioritizePrescriptions(
  prescriptions: Prescription[],
  goal: SessionState["stackGoal"]
): Prescription[] {
  return [...prescriptions].sort((a, b) =>
    goalPriority(b, goal) - goalPriority(a, goal) ||
    Number(b.savingsEstimate || 0) - Number(a.savingsEstimate || 0)
  );
}

export function computePrescriptions(
  selectedTools: Tool[],
  toolScores: Map<string, ToolScore>,
  doublonRules: DoubleRule[],
  _persona: Persona,
  stackGoal?: SessionState["stackGoal"],
  toolUsageMap?: SessionState["toolUsageMap"],
  workflowUsages?: SessionState["workflowUsages"]
): { phase1: Prescription[]; phase2: Prescription[]; phase3: Prescription[] } {
  const p1 = phase1Certified(selectedTools);
  const p1ToolIds = new Set(p1.map((p) => p.toolId));
  const p2ByTool = new Map<string, Prescription>();
  [
    ...detectPricingTierReviews(selectedTools),
    ...phase2Questions(selectedTools),
  ]
    .filter((p) => !p1ToolIds.has(p.toolId))
    .forEach((prescription) => {
      if (!p2ByTool.has(prescription.toolId)) {
        p2ByTool.set(prescription.toolId, prescription);
      }
    });
  const p2 = Array.from(p2ByTool.values());

  const p3doublons = detectDoublons(selectedTools, doublonRules, toolUsageMap);
  const hasPreciseAiMapping = (workflowUsages || []).some((usage) =>
    (usage.aiActors || []).some((actor) => actor.capabilityIds.length > 0)
  );
  const p3ia = hasPreciseAiMapping
    ? buildPreciseAiOverlapPrescriptions({
        selectedTools,
        workflowUsages,
      })
    : detectDoublonsIA(selectedTools, toolUsageMap);
  const p3dormants = detectDormants(selectedTools);
  const p3inadapted = detectInadapted(selectedTools, toolScores);

  const seenIds = new Set<string>([...p1, ...p2].map((p) => p.toolId));
  const phase3: Prescription[] = [];
  for (const p of [...p3doublons, ...p3ia, ...p3dormants, ...p3inadapted]) {
    if (seenIds.has(p.toolId)) continue;
    seenIds.add(p.toolId);
    phase3.push(p);
  }

  const filterSilence = (arr: Prescription[]) =>
    arr.filter((pr) => {
      const tool = selectedTools.find((t) => t.id === pr.toolId);
      return tool ? canPrescribe(tool) : true;
    });

  return {
    phase1: prioritizePrescriptions(filterSilence(p1), stackGoal),
    phase2: prioritizePrescriptions(filterSilence(p2), stackGoal),
    phase3: prioritizePrescriptions(filterSilence(phase3), stackGoal),
  };
}

// ─── 6. Stack Health Score ─────────────────────────────────────────
type HealthLabel = "Optimisée" | "Correcte" | "À revoir" | "Critique";

function healthLabelForScore(score: number): HealthLabel {
  return score >= 80
    ? "Optimisée"
    : score >= 60
      ? "Correcte"
      : score >= 40
        ? "À revoir"
        : "Critique";
}

export function computeStackHealth(prescriptions: {
  phase1: Prescription[];
  phase2: Prescription[];
  phase3: Prescription[];
}): { score: number; label: HealthLabel } {
  const p1p3 = prescriptions.phase1.length + prescriptions.phase3.filter((p) => p.type === "doublon" || p.type === "dormant").length;
  const questions = prescriptions.phase2.length;
  const doublonsIA = prescriptions.phase3.filter((p) => p.type === "doublon-ia").length;
  const dormants = prescriptions.phase3.filter((p) => p.type === "dormant").length;
  const inadapted = prescriptions.phase3.filter((p) => p.type === "inadapté").length;

  let score = 100;
  score -= Math.min(30, p1p3 * 10);
  score -= Math.min(20, questions * 5);
  score -= Math.min(24, doublonsIA * 8);
  score -= Math.min(12, dormants * 3);
  score -= Math.min(14, inadapted * 2);
  score = Math.max(0, Math.min(100, score));

  return { score, label: healthLabelForScore(score) };
}

// ─── 7. Recommendations ───────────────────────────────────────────
export function computeRecommendations(
  allTools: Tool[],
  selectedTools: Tool[],
  persona: Persona,
  complementarySkills: Persona[],
  tjm: number
): Tool[] {
  const selectedIds = new Set(selectedTools.map((t) => t.id));
  const eligible = allTools.filter(
    (t) =>
      !selectedIds.has(t.id) &&
      ["satellite", "gestion", "ia"].includes(t.tool_type)
  );

  const scored = eligible
    .map((t) => ({ tool: t, score: computeScoreFinal(t, persona, complementarySkills, tjm) }))
    .sort((a, b) => b.score.scoreFinal - a.score.scoreFinal);

  let results = scored.filter((s) => s.score.scoreFinal > 60).map((s) => s.tool);
  if (results.length < 3) {
    results = scored.filter((s) => s.score.scoreFinal > 45).map((s) => s.tool);
  }
  return results.slice(0, 6);
}

type RecommendationEvidence = NonNullable<DiagnosticResult["recommendationEvidence"]>;

function computeCreativeRecommendationResult(
  allTools: Tool[],
  sessionState: SessionState
): { tools: Tool[]; evidence: RecommendationEvidence } {
  const skippedIds = new Set(sessionState.selectionCoverage?.skipped || []);
  const frictionIds = new Set(
    (sessionState.workflowUsages || [])
      .filter((usage) => usage.satisfaction === "friction" || usage.satisfaction === "blocked")
      .map((usage) => usage.objectiveId)
  );
  const skippedAreasAnswer = sessionState.discoveryAnswers.get("adaptive_skipped_areas");

  // The user either said those areas do not apply, or indicated the capture is
  // incomplete. In both cases, recommending a tool would be premature.
  if (
    frictionIds.size === 0 &&
    (skippedAreasAnswer === 1 || skippedAreasAnswer === 2 || skippedIds.size === 0)
  ) {
    return { tools: [], evidence: {} };
  }

  const outputIds = [
    sessionState.primarySpecialty,
    ...(sessionState.complementarySpecialties || []),
  ].filter((id): id is string => Boolean(id));
  const selectedIds = new Set(sessionState.selectedTools.map((tool) => tool.id));
  const missingQuestions = buildCreativeQuestions(
    outputIds,
    sessionState.selectedTools,
    allTools
  ).filter(
    (question) =>
      (skippedIds.has(question.id) || frictionIds.has(question.id)) &&
      question.kind !== "ecosystem" &&
      question.priority >= 80
  );

  const recommendations: Tool[] = [];
  const needsByTool = new Map<string, typeof missingQuestions>();

  for (const question of missingQuestions) {
    const existingCoverage = rankToolsForCreativeQuestion(
      question,
      sessionState.selectedTools,
      outputIds,
      selectedIds
    );
    if (existingCoverage.length > 0 && !frictionIds.has(question.id)) continue;

    const candidate = rankToolsForCreativeQuestion(
      question,
      allTools,
      outputIds,
      selectedIds
    ).find(
      ({ tool }) =>
        !selectedIds.has(tool.id) &&
        !tool.force_silence &&
        tool.tool_type !== "bundle" &&
        !(tool.bundle_parent && selectedIds.has(tool.bundle_parent))
    )?.tool;
    if (!candidate) continue;
    if (!needsByTool.has(candidate.id)) {
      needsByTool.set(candidate.id, []);
      recommendations.push(candidate);
    }
    needsByTool.get(candidate.id)!.push(question);
  }

  const evidence: RecommendationEvidence = {};
  for (const tool of recommendations) {
    const needs = needsByTool.get(tool.id) || [];
    const labelsFr = needs.map((question) => question.labelFr);
    const labelsEn = needs.map((question) => question.labelEn);
    const confidence = skippedAreasAnswer === 0 ? "high" : "medium";
    const hasDeclaredFriction = needs.some((question) => frictionIds.has(question.id));
    evidence[tool.id] = {
      needId: needs.map((question) => question.id).join(","),
      labelFr: labelsFr.join(" + "),
      labelEn: labelsEn.join(" + "),
      reasonFr: hasDeclaredFriction
        ? `Tu as signalé une friction sur : ${labelsFr.join(", ")}. ${tool.name} est une piste à tester, pas un remplacement automatique.`
        : `Tu as déclaré cette zone sans outil : ${labelsFr.join(", ")}. ${tool.name} correspond directement à ce besoin.`,
      reasonEn: hasDeclaredFriction
        ? `You reported friction with: ${labelsEn.join(", ")}. ${tool.name} is an option to test, not an automatic replacement.`
        : `You declared this area without a tool: ${labelsEn.join(", ")}. ${tool.name} directly matches this need.`,
      confidence,
    };
  }

  return { tools: recommendations.slice(0, 3), evidence };
}

function computeRecommendationResult(
  allTools: Tool[],
  sessionState: SessionState
): { tools: Tool[]; evidence: RecommendationEvidence } {
  if (sessionState.persona === "SOFIA") {
    return computeCreativeRecommendationResult(allTools, sessionState);
  }

  const tools = computeRecommendations(
    allTools,
    sessionState.selectedTools,
    sessionState.persona,
    sessionState.complementarySkills,
    sessionState.tjm
  );
  const evidence = Object.fromEntries(
    tools.map((tool) => [
      tool.id,
      {
        labelFr: "Compatibilité avec ton profil",
        labelEn: "Fit with your profile",
        reasonFr: `${tool.name} couvre des besoins fréquents de ton profil et n’est pas déjà dans ta stack.`,
        reasonEn: `${tool.name} covers common needs for your profile and is not already in your stack.`,
        confidence: "low" as const,
      },
    ])
  );
  return { tools, evidence };
}

// ─── 8. Main entry point ──────────────────────────────────────────
export interface DiagnosticData {
  allTools: Tool[];
  doublonRules: DoubleRule[];
  discoveryQuestions?: DiscoveryQuestion[];
}

type DiscoveryToolSignal = DiagnosticAnswerSignal & {
  source: "discovery";
  impact: "keep" | "review" | "cancel";
  toolIds: string[];
};

type SignalSummary = {
  activeDiscoveryCount: number;
  answeredDiscoveryCount: number;
  answeredClosingCount: number;
  protectedToolCount: number;
  challengedToolCount: number;
};

function collectOnboardingSignals(sessionState: SessionState): DiagnosticAnswerSignal[] {
  const signals: DiagnosticAnswerSignal[] = [];

  if (sessionState.personaConfidence === "hybrid") {
    signals.push({
      id: "onboarding_persona_hybrid",
      source: "onboarding",
      severity: "medium",
      labelFr: "Profil hybride",
      labelEn: "Hybrid profile",
      detailFr: "Le diagnostic doit tenir compte d'un métier principal et d'usages secondaires.",
      detailEn: "The diagnostic should account for one main role and secondary use cases.",
      actionFr: "Croiser le persona principal avec les compétences complémentaires avant de trancher.",
      actionEn: "Cross-check the main persona with complementary skills before making hard calls.",
    });
  }

  if (sessionState.personaConfidence === "unsure") {
    signals.push({
      id: "onboarding_persona_uncertain",
      source: "onboarding",
      severity: "high",
      labelFr: "Profil à confirmer",
      labelEn: "Profile to confirm",
      detailFr: "L'utilisateur hésite sur son persona: les recommandations doivent rester prudentes.",
      detailEn: "The user is unsure about their persona: recommendations should stay cautious.",
      actionFr: "Utiliser les réponses stack et discovery pour confirmer le bon angle de restitution.",
      actionEn: "Use stack and discovery answers to confirm the right restitution angle.",
    });
  }

  if (sessionState.stackGoal) {
    const copy = {
      reduce_costs: {
        labelFr: "Objectif économies",
        labelEn: "Cost reduction goal",
        actionFr: "Prioriser les doublons, outils dormants et renouvellements.",
        actionEn: "Prioritize duplicates, dormant tools, and renewals.",
      },
      save_time: {
        labelFr: "Objectif temps",
        labelEn: "Time-saving goal",
        actionFr: "Ne pas couper un outil utile uniquement pour une petite économie.",
        actionEn: "Do not cut a useful tool only for a small saving.",
      },
      simplify: {
        labelFr: "Objectif simplification",
        labelEn: "Simplification goal",
        actionFr: "Favoriser les arbitrages qui réduisent la dispersion.",
        actionEn: "Favor decisions that reduce fragmentation.",
      },
      quality: {
        labelFr: "Objectif meilleur choix",
        labelEn: "Better-choice goal",
        actionFr: "Comparer fit métier, coût et alternatives avant économie brute.",
        actionEn: "Compare business fit, cost, and alternatives before raw savings.",
      },
    }[sessionState.stackGoal];

    signals.push({
      id: `onboarding_goal_${sessionState.stackGoal}`,
      source: "onboarding",
      severity: "low",
      labelFr: copy.labelFr,
      labelEn: copy.labelEn,
      detailFr: "Objectif principal déclaré au début du tunnel.",
      detailEn: "Main goal declared at the start of the funnel.",
      actionFr: copy.actionFr,
      actionEn: copy.actionEn,
    });
  }

  return signals;
}

function isDiscoveryQuestionActive(question: DiscoveryQuestion, sessionState: SessionState) {
  if (question.persona !== "ALL" && question.persona !== sessionState.persona) return false;
  const selectedToolIds = new Set(sessionState.selectedTools.map((tool) => tool.id));
  if (question.condition_tool_ids.length === 0) return true;
  if (question.condition_type === "all") {
    return question.condition_tool_ids.every((id) => selectedToolIds.has(id));
  }
  return question.condition_tool_ids.some((id) => selectedToolIds.has(id));
}

function collectDiscoverySignals(sessionState: SessionState, questions: DiscoveryQuestion[] = []): DiscoveryToolSignal[] {
  const selectedToolIds = new Set(sessionState.selectedTools.map((tool) => tool.id));
  const signals: DiscoveryToolSignal[] = [];

  for (const question of questions) {
    if (!isDiscoveryQuestionActive(question, sessionState)) continue;
    const answerIndex = sessionState.discoveryAnswers.get(question.id);
    if (answerIndex == null) continue;
    const option = question.options[answerIndex];
    if (!option) continue;

    const affectedIds = (option.affectedTools?.length ? option.affectedTools : question.condition_tool_ids)
      .filter((id) => selectedToolIds.has(id));
    if (affectedIds.length === 0) continue;

    const impact = option.impact;
    const severity = impact === "cancel" ? "high" : impact === "review" ? "medium" : "low";
    const toolNames = affectedIds
      .map((id) => sessionState.selectedTools.find((tool) => tool.id === id)?.name || id)
      .join(", ");

    signals.push({
      id: `discovery_${question.id}_${impact}`,
      source: "discovery",
      severity,
      impact,
      toolIds: affectedIds,
      labelFr: impact === "keep" ? "Usage confirmé" : impact === "cancel" ? "Usage à couper" : "Usage à vérifier",
      labelEn: impact === "keep" ? "Confirmed use" : impact === "cancel" ? "Use to cut" : "Use to review",
      detailFr: `${option.label} · ${toolNames}`,
      detailEn: `${option.labelEn || option.label} · ${toolNames}`,
      actionFr: impact === "keep"
        ? "Ne pas prescrire de suppression sur ces outils sans autre signal fort."
        : impact === "cancel"
          ? "Traiter ces outils comme candidats directs à suppression ou downgrade."
          : "Vérifier usage réel, propriétaire et coût avant de décider.",
      actionEn: impact === "keep"
        ? "Do not prescribe removal on these tools without another strong signal."
        : impact === "cancel"
          ? "Treat these tools as direct candidates for cancellation or downgrade."
          : "Check real usage, owner, and cost before deciding.",
    });
  }

  return signals;
}

function collectClosingSignals(sessionState: SessionState): DiagnosticAnswerSignal[] {
  const [bankAnswer, annualAnswer, passwordAnswer] = sessionState.closingAnswers;
  const normalized = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const signals: DiagnosticAnswerSignal[] = [];

  if (["oui absolument", "maybe", "peut etre", "peut-être", "je ne regarde jamais", "i never check"].some((token) => normalized(bankAnswer).includes(token))) {
    signals.push({
      id: "closing_billing_blind_spot",
      source: "closing",
      severity: normalized(bankAnswer).includes("jamais") || normalized(bankAnswer).includes("never") ? "high" : "medium",
      labelFr: "Angle mort facturation",
      labelEn: "Billing blind spot",
      detailFr: "Un prélèvement non reconnu ou non vérifié peut masquer un abonnement dormant.",
      detailEn: "An unrecognized or unchecked charge can hide a dormant subscription.",
      actionFr: "Faire une revue bancaire courte avant la prochaine date de renouvellement.",
      actionEn: "Run a short bank statement review before the next renewal date.",
    });
  }

  if (["oui", "probably", "probablement"].some((token) => normalized(annualAnswer).includes(token))) {
    signals.push({
      id: "closing_annual_lock_in",
      source: "closing",
      severity: "medium",
      labelFr: "Renouvellement annuel à surveiller",
      labelEn: "Annual renewal to watch",
      detailFr: "Un abonnement annuel inutilisé crée un faux sentiment de coût déjà absorbé.",
      detailEn: "An unused annual plan creates a false sense that the cost is already absorbed.",
      actionFr: "Lister les dates de renouvellement et décider 30 jours avant chacune.",
      actionEn: "List renewal dates and decide 30 days before each one.",
    });
  }

  if (["gratuit", "je n'en ai pas", "free", "don't have", "dont have"].some((token) => normalized(passwordAnswer).includes(token))) {
    signals.push({
      id: "closing_password_foundation",
      source: "closing",
      severity: "low",
      labelFr: "Socle sécurité léger",
      labelEn: "Light security foundation",
      detailFr: "Le gestionnaire de mots de passe n'est pas forcément un coût à optimiser, mais c'est un socle à clarifier.",
      detailEn: "A password manager is not necessarily a cost optimization topic, but it is a foundation to clarify.",
      actionFr: "Vérifier que le socle accès et mots de passe est volontaire, pas subi.",
      actionEn: "Check that access and password management is intentional, not accidental.",
    });
  }

  return signals;
}

function collectWorkflowSignals(sessionState: SessionState): DiagnosticAnswerSignal[] {
  const usageSignals = (sessionState.workflowUsages || []).flatMap((usage) => {
    const signals: DiagnosticAnswerSignal[] = [];
    if (usage.satisfaction === "friction" || usage.satisfaction === "blocked") {
      signals.push({
        id: `workflow_friction_${usage.objectiveId}`,
        source: "workflow",
        severity: usage.satisfaction === "blocked" ? "high" : "medium",
        labelFr: "Friction déclarée dans le workflow",
        labelEn: "Declared workflow friction",
        detailFr: `${usage.objectiveLabelFr} : ${usage.customMethod || "méthode actuelle à améliorer"}`,
        detailEn: `${usage.objectiveLabelEn}: ${usage.customMethod || "current method needs improvement"}`,
        actionFr: "Tester une amélioration sur cette étape sans supprimer automatiquement l’outil actuel.",
        actionEn: "Test an improvement on this step without automatically removing the current tool.",
        toolIds: usage.toolIds,
        impact: "review",
      });
    }
    if (usage.aiMode !== "unknown" && usage.aiMode !== "none") {
      const capabilityCount = (usage.aiActors || []).reduce(
        (count, actor) => count + actor.capabilityIds.length,
        0
      );
      signals.push({
        id: `workflow_ai_${usage.objectiveId}`,
        source: "workflow",
        severity: "low",
        labelFr: "IA intégrée au workflow",
        labelEn: "AI mapped in the workflow",
        detailFr: `${usage.objectiveLabelFr} : ${capabilityCount || "fonction"} IA cartographiée${capabilityCount > 1 ? "s" : ""}`,
        detailEn: `${usage.objectiveLabelEn}: ${
          capabilityCount > 0
            ? `${capabilityCount} mapped AI ${capabilityCount === 1 ? "capability" : "capabilities"}`
            : "AI contribution mapped"
        }`,
        actionFr: "Vérifier que cette capacité IA est utile, correctement financée et non redondante.",
        actionEn: "Check that this AI capability is useful, correctly funded, and not redundant.",
        toolIds: [
          ...new Set([
            ...usage.aiToolIds,
            ...(usage.aiActors || []).flatMap((actor) => actor.toolId ? [actor.toolId] : []),
          ]),
        ],
        impact: "keep",
      });
    }
    return signals;
  });
  const aiFindingSignals = buildAiDiagnosticAnalysis(sessionState).findings.map(
    (finding): DiagnosticAnswerSignal => ({
      id: finding.id,
      source: "workflow",
      severity: finding.severity,
      labelFr: finding.labelFr,
      labelEn: finding.labelEn,
      detailFr: finding.detailFr,
      detailEn: finding.detailEn,
      actionFr: finding.actionFr,
      actionEn: finding.actionEn,
      toolIds: finding.toolIds,
      impact: finding.reviewRecommended ? "review" : "keep",
    })
  );
  return [...usageSignals, ...aiFindingSignals];
}

function buildSignalSummary(
  sessionState: SessionState,
  discoveryQuestions: DiscoveryQuestion[] = [],
  discoverySignals: DiscoveryToolSignal[]
): SignalSummary {
  const activeDiscoveryQuestions = discoveryQuestions.filter((question) => isDiscoveryQuestionActive(question, sessionState));
  const answeredDiscoveryCount = activeDiscoveryQuestions.filter((question) => sessionState.discoveryAnswers.has(question.id)).length;
  const answeredClosingCount = sessionState.closingAnswers.filter((answer) => answer.trim().length > 0).length;
  const protectedToolCount = new Set(
    discoverySignals
      .filter((signal) => signal.impact === "keep")
      .flatMap((signal) => signal.toolIds)
  ).size;
  const challengedToolCount = new Set(
    discoverySignals
      .filter((signal) => signal.impact === "review" || signal.impact === "cancel")
      .flatMap((signal) => signal.toolIds)
  ).size;

  return {
    activeDiscoveryCount: activeDiscoveryQuestions.length,
    answeredDiscoveryCount,
    answeredClosingCount,
    protectedToolCount,
    challengedToolCount,
  };
}

function applyDiscoverySignalsToPrescriptions(
  prescriptions: { phase1: Prescription[]; phase2: Prescription[]; phase3: Prescription[] },
  selectedTools: Tool[],
  discoverySignals: DiscoveryToolSignal[]
) {
  if (discoverySignals.length === 0) return prescriptions;

  const selectedToolMap = new Map(selectedTools.map((tool) => [tool.id, tool]));
  const dominant = new Map<string, DiscoveryToolSignal>();
  const rank = { keep: 3, cancel: 2, review: 1 };

  for (const signal of discoverySignals) {
    for (const toolId of signal.toolIds) {
      const current = dominant.get(toolId);
      if (!current || rank[signal.impact] > rank[current.impact]) {
        dominant.set(toolId, signal);
      }
    }
  }

  const shouldRemove = (prescription: Prescription) => {
    const signal = dominant.get(prescription.toolId);
    return signal?.impact === "keep" || signal?.impact === "cancel";
  };

  const next = {
    phase1: prescriptions.phase1.filter((p) => !shouldRemove(p)),
    phase2: prescriptions.phase2.filter((p) => !shouldRemove(p)),
    phase3: prescriptions.phase3.filter((p) => !shouldRemove(p)),
  };

  const existingIds = new Set([
    ...next.phase1,
    ...next.phase2,
    ...next.phase3,
  ].map((prescription) => prescription.toolId));

  for (const [toolId, signal] of dominant) {
    if (signal.impact === "keep" || existingIds.has(toolId)) continue;
    const tool = selectedToolMap.get(toolId);
    if (!tool || !canPrescribe(tool)) continue;

    next.phase3.push({
      toolId,
      type: signal.impact === "cancel" ? "dormant" : "inadapté",
      verdict: signal.impact === "cancel" ? "cancel" : "review",
      message: signal.impact === "cancel"
        ? `${tool.name}: usage déclaré trop faible`
        : `${tool.name}: usage à vérifier (${signal.detailFr})`,
      savingsEstimate: signal.impact === "cancel" ? tool.price : 0,
    });
    existingIds.add(toolId);
  }

  return next;
}

export function runDiagnostic(
  sessionState: SessionState,
  data: DiagnosticData
): DiagnosticResult {
  const { persona, complementarySkills, tjm } = sessionState;
  const contractsByProductId = new Map<string, NonNullable<SessionState["commercialContracts"]>[number]>();
  (sessionState.commercialContracts || [])
    .filter((contract) => contract.confirmed)
    .forEach((contract) => {
      contract.productIds.forEach((productId) => contractsByProductId.set(productId, contract));
    });
  const selectedTools = sessionState.selectedTools.map((tool) => {
    const contract = contractsByProductId.get(tool.id);
    if (!contract) return tool;
    return {
      ...tool,
      selectedOffer: "included" as const,
      price: 0,
      selectedPriceIsEstimate: false,
      includedInBundle: true,
      includedVia: contract.familyName,
      commercialContractId: contract.id,
    };
  });
  const effectiveSessionState = {
    ...sessionState,
    selectedTools,
  };

  const toolScores = new Map<string, ToolScore>();
  for (const tool of selectedTools) {
    toolScores.set(tool.id, computeScoreFinal(tool, persona, complementarySkills, tjm));
  }

  const discoverySignals = collectDiscoverySignals(effectiveSessionState, data.discoveryQuestions);
  const answerSignals = [
    ...collectOnboardingSignals(effectiveSessionState),
    ...collectWorkflowSignals(effectiveSessionState),
    ...discoverySignals,
    ...collectClosingSignals(effectiveSessionState),
  ];
  const signalSummary = buildSignalSummary(effectiveSessionState, data.discoveryQuestions, discoverySignals);
  const basePrescriptions = computePrescriptions(
    selectedTools,
    toolScores,
    data.doublonRules,
    persona,
    effectiveSessionState.stackGoal,
    effectiveSessionState.toolUsageMap,
    effectiveSessionState.workflowUsages
  );
  const prescriptions = applyDiscoverySignalsToPrescriptions(basePrescriptions, selectedTools, discoverySignals);
  const baseHealth = computeStackHealth(prescriptions);
  const aiAnalysis = buildAiDiagnosticAnalysis(effectiveSessionState);
  const highAiRiskCount = aiAnalysis.findings.filter(
    (finding) => finding.kind === "risk" && finding.severity === "high"
  ).length;
  const mediumAiRiskCount = aiAnalysis.findings.filter(
    (finding) => finding.kind === "risk" && finding.severity === "medium"
  ).length;
  const riskAdjustedScore = Math.max(
    0,
    baseHealth.score - highAiRiskCount * 15 - mediumAiRiskCount * 5
  );
  const foundationAdjustedScore = selectedTools.length <= 3
    ? Math.min(74, riskAdjustedScore)
    : riskAdjustedScore;
  const aiAdjustedScore = highAiRiskCount > 0
    ? Math.min(69, foundationAdjustedScore)
    : mediumAiRiskCount > 0
      ? Math.min(79, foundationAdjustedScore)
      : foundationAdjustedScore;
  const pricingSummary = getPricingCaptureSummary(
    selectedTools,
    effectiveSessionState.commercialContracts
  );
  const healthScore = pricingSummary.needsVerificationCount > 0
    ? Math.min(79, aiAdjustedScore)
    : aiAdjustedScore;
  const healthLabel = healthLabelForScore(healthScore);
  const recommendationResult = computeRecommendationResult(data.allTools, effectiveSessionState);
  const recommendations = recommendationResult.tools;

  const contractCoveredIds = contractCoveredProductIds(effectiveSessionState.commercialContracts);
  const stackTotalCost =
    contractMonthlyTotal(effectiveSessionState.commercialContracts) +
    selectedTools.reduce(
      (sum, tool) =>
        sum + (
          tool.includedInBundle || contractCoveredIds.has(tool.id)
            ? 0
            : tool.price
        ),
      0
    );
  const allPrescriptions = [...prescriptions.phase1, ...prescriptions.phase2, ...prescriptions.phase3];
  const estimatedWaste = allPrescriptions.reduce((sum, p) => sum + p.savingsEstimate, 0);
  const optimizedCost = Math.max(0, stackTotalCost - estimatedWaste);
  const annualSavings = estimatedWaste * 12;

  const hoursRecoverable =
    allPrescriptions.filter((p) => p.type === "doublon" || p.type === "doublon-ia").length * 1 +
    allPrescriptions.filter((p) => p.type === "dormant").length * 0.5;

  const roundedStackTotalCost = Math.round(stackTotalCost * 100) / 100;
  const roundedEstimatedWaste = Math.round(estimatedWaste * 100) / 100;
  const roundedOptimizedCost = Math.round(optimizedCost * 100) / 100;
  const roundedAnnualSavings = Math.round(annualSavings * 100) / 100;
  const insights = buildDiagnosticInsights({
    sessionState: effectiveSessionState,
    toolScores,
    prescriptions,
    recommendations,
    healthScore,
    stackTotalCost: roundedStackTotalCost,
    estimatedWaste: roundedEstimatedWaste,
    optimizedCost: roundedOptimizedCost,
    annualSavings: roundedAnnualSavings,
    answerSignals,
    signalSummary,
    recommendationEvidence: recommendationResult.evidence,
  });

  return {
    sessionId: crypto.randomUUID(),
    sessionState: effectiveSessionState,
    toolScores,
    doublons: data.doublonRules.filter((r) =>
      r.ids.filter((id) => selectedTools.some((t) => t.id === id)).length >= 2
    ),
    prescriptions,
    recommendations,
    recommendationEvidence: recommendationResult.evidence,
    insights,
    healthScore,
    healthLabel,
    stackTotalCost: roundedStackTotalCost,
    estimatedWaste: roundedEstimatedWaste,
    optimizedCost: roundedOptimizedCost,
    hoursRecoverable: Math.round(hoursRecoverable * 10) / 10,
    annualSavings: roundedAnnualSavings,
  };
}
