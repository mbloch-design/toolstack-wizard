import type {
  Tool,
  Persona,
  SessionState,
  DoubleRule,
  Prescription,
  DiagnosticResult,
} from "@/types/diagnostic";
import { computePertinenceFallback } from "@/utils/pertinenceFallback";

// ─── Force-silence list ───────────────────────────────────────────
const FORCE_SILENCE = ["stripe", "google-drive", "paypal", "google-analytics"];

export function canPrescribe(tool: Tool): boolean {
  if (tool.force_silence) return false;
  if (FORCE_SILENCE.includes(tool.id)) return false;
  if (tool.price > 0 && tool.price < 2) return false;
  return true;
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
    const hasDowngrade = t.downgrade_plan?.available;
    const p: Prescription = {
      toolId: t.id,
      type: "dormant",
      verdict: hasDowngrade ? "downgrade" : "cancel",
      message: hasDowngrade
        ? `Passe au plan ${t.downgrade_plan!.plan} (${t.downgrade_plan!.toPrice}€/mois)`
        : `${t.name} peut être annulé`,
      savingsEstimate: hasDowngrade
        ? t.downgrade_plan!.fromPrice - t.downgrade_plan!.toPrice
        : t.price,
    };
    out.push(p);
  }
  return out;
}

function phase2Questions(tools: Tool[]): Prescription[] {
  const out: Prescription[] = [];
  for (const t of tools) {
    if (t.prescription_quality !== "question") continue;
    if (t.freeAlternative && t.price > 5) {
      const p: Prescription = {
        toolId: t.id,
        type: "doublon",
        verdict: "review",
        message: `Alternative gratuite disponible : ${t.freeAlternative}`,
        savingsEstimate: t.price,
      };
      out.push(p);
    }
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
  const p2 = phase2Questions(selectedTools);

  const p3doublons = detectDoublons(selectedTools, doublonRules);
  const p3ia = detectDoublonsIA(selectedTools);
  const p3dormants = detectDormants(selectedTools);
  const p3inadapted = detectInadapted(selectedTools, toolScores);

  const seenIds = new Set<string>();
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

  const prescriptions = computePrescriptions(selectedTools, toolScores, data.doublonRules, persona);
  const { score: healthScore, label: healthLabel } = computeStackHealth(prescriptions);
  const recommendations = computeRecommendations(
    data.allTools, selectedTools, persona, complementarySkills, tjm
  );

  const stackTotalCost = selectedTools.reduce((sum, t) => sum + t.price, 0);
  const allPrescriptions = [...prescriptions.phase1, ...prescriptions.phase2, ...prescriptions.phase3];
  const estimatedWaste = allPrescriptions.reduce((sum, p) => sum + p.savingsEstimate, 0);
  const optimizedCost = Math.max(0, stackTotalCost - estimatedWaste);
  const annualSavings = estimatedWaste * 12;

  const hoursRecoverable =
    allPrescriptions.filter((p) => p.type === "doublon" || p.type === "doublon-ia").length * 1 +
    allPrescriptions.filter((p) => p.type === "dormant").length * 0.5;

  return {
    sessionId: crypto.randomUUID(),
    sessionState,
    toolScores,
    doublons: data.doublonRules.filter((r) =>
      r.ids.filter((id) => selectedTools.some((t) => t.id === id)).length >= 2
    ),
    prescriptions,
    recommendations,
    healthScore,
    healthLabel,
    stackTotalCost: Math.round(stackTotalCost * 100) / 100,
    estimatedWaste: Math.round(estimatedWaste * 100) / 100,
    optimizedCost: Math.round(optimizedCost * 100) / 100,
    hoursRecoverable: Math.round(hoursRecoverable * 10) / 10,
    annualSavings: Math.round(annualSavings * 100) / 100,
  };
}
