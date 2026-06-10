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

function detectDoublons(tools: Tool[], rules: DoubleRule[]): Prescription[] {
  const out: Prescription[] = [];
  const seen = new Set<string>();

  for (const rule of rules) {
    const matchIds = rule.ids.filter((id) => tools.some((t) => t.id === id));
    if (matchIds.length >= 2) {
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

function detectDoublonsIA(tools: Tool[]): Prescription[] {
  const out: Prescription[] = [];
  const byUseCase = new Map<string, Tool[]>();
  for (const t of tools) {
    if (t.tool_type !== "ia" || !t.ia_use_case) continue;
    const group = byUseCase.get(t.ia_use_case) ?? [];
    group.push(t);
    byUseCase.set(t.ia_use_case, group);
  }
  for (const [useCase, group] of byUseCase) {
    if (group.length < 2) continue;
    group.sort((a, b) => b.price - a.price);
    for (let i = 1; i < group.length; i++) {
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

export function computePrescriptions(
  selectedTools: Tool[],
  toolScores: Map<string, ToolScore>,
  doublonRules: DoubleRule[],
  _persona: Persona
): { phase1: Prescription[]; phase2: Prescription[]; phase3: Prescription[] } {
  const p1 = phase1Certified(selectedTools);
  const p1ToolIds = new Set(p1.map((p) => p.toolId));
  const p2 = [...phase2Questions(selectedTools), ...detectPricingTierReviews(selectedTools)]
    .filter((p) => !p1ToolIds.has(p.toolId));

  const p3doublons = detectDoublons(selectedTools, doublonRules);
  const p3ia = detectDoublonsIA(selectedTools);
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

  return { phase1: filterSilence(p1), phase2: filterSilence(p2), phase3: filterSilence(phase3) };
}

// ─── 6. Stack Health Score ─────────────────────────────────────────
type HealthLabel = "Optimisée" | "Correcte" | "À revoir" | "Critique";

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

  const label: HealthLabel =
    score >= 80 ? "Optimisée" : score >= 60 ? "Correcte" : score >= 40 ? "À revoir" : "Critique";

  return { score, label };
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
      detailEn: `${option.label} · ${toolNames}`,
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
  const { persona, complementarySkills, tjm, selectedTools } = sessionState;

  const toolScores = new Map<string, ToolScore>();
  for (const tool of selectedTools) {
    toolScores.set(tool.id, computeScoreFinal(tool, persona, complementarySkills, tjm));
  }

  const discoverySignals = collectDiscoverySignals(sessionState, data.discoveryQuestions);
  const answerSignals = [
    ...collectOnboardingSignals(sessionState),
    ...discoverySignals,
    ...collectClosingSignals(sessionState),
  ];
  const signalSummary = buildSignalSummary(sessionState, data.discoveryQuestions, discoverySignals);
  const basePrescriptions = computePrescriptions(selectedTools, toolScores, data.doublonRules, persona);
  const prescriptions = applyDiscoverySignalsToPrescriptions(basePrescriptions, selectedTools, discoverySignals);
  const { score: healthScore, label: healthLabel } = computeStackHealth(prescriptions);
  const recommendations = computeRecommendations(
    data.allTools, selectedTools, persona, complementarySkills, tjm
  );

  // Bundle-aware cost: don't count tools marked as included in a bundle
  const stackTotalCost = selectedTools.reduce((sum, t) => sum + (t.includedInBundle ? 0 : t.price), 0);
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
    sessionState,
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
  });

  return {
    sessionId: crypto.randomUUID(),
    sessionState,
    toolScores,
    doublons: data.doublonRules.filter((r) =>
      r.ids.filter((id) => selectedTools.some((t) => t.id === id)).length >= 2
    ),
    prescriptions,
    recommendations,
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
