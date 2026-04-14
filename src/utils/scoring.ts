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
const FORCE_SILENCE = ['stripe', 'google-drive', 'paypal', 'google-analytics'];

export function canPrescribe(tool: Tool): boolean {
  if (FORCE_SILENCE.includes(tool.id)) return false;
  if (tool.price > 0 && tool.price < 2) return false;  // quasi-gratuit = auto-silence
  return true;
}

// ─── 1. Pertinence ────────────────────────────────────────────────
export function computePertinence(
  tool: Tool,
  persona: Persona,
  complementarySkills: Persona[]
): number {
  let base = tool.pertinence_by_persona[persona] ?? computePertinenceFallback(tool, persona);
  for (const skill of complementarySkills) {
    const skillScore = tool.pertinence_by_persona[skill] ?? computePertinenceFallback(tool, skill);
    base += (skillScore * 0.1);
  }
  return Math.min(100, Math.round(base));
}

// ─── 2. Value Index ───────────────────────────────────────────────
export function computeValueIndex(tool: Tool, tjm: number): number {
  if (tjm === 0) return 0;
  const tjm_horaire = tjm / 5;
  const hours_saved_per_month = 2;
  const monthly_value = hours_saved_per_month * tjm_horaire;
  const valueIndex_raw = monthly_value / (tool.price + 1) * 100;
  
  if (valueIndex_raw > 100) {
    return Math.min(100, Math.round(50 + 50 * (Math.log(valueIndex_raw) / Math.log(1000))));
  }
  return Math.round(Math.min(100, valueIndex_raw));
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
  const scoreFinal = tjm === 0 ? pertinence : Math.round(pertinence * 0.6 + valueIndex * 0.4);
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
  return tools
    .filter(t => t.prescription_quality === "ferme")
    .map(t => ({
      toolId: t.id,
      type: "cancel",
      verdict: "cancel",
      message: "Prescription certifiée",
      savingsEstimate: t.price
    }));
}

function phase2Questions(tools: Tool[]): Prescription[] {
  return tools
    .filter(t => t.prescription_quality === "question" && t.freeAlternative && t.price > 5)
    .map(t => ({
      toolId: t.id,
      type: "review",
      verdict: "review",
      message: "À vérifier",
      savingsEstimate: t.price
    }));
}

function detectDoublons(tools: Tool[], rules: DoubleRule[]): Prescription[] {
  const out: Prescription[] = [];
  const seen = new Set<string>();

  for (const rule of rules) {
    const matchIds = rule.ids.filter((id) => tools.some((t) => t.id === id));
    if (matchIds.length >= 2) {
      out.push({
        toolId: matchIds[1],
        type: "doublon",
        verdict: "cancel",
        message: "Doublon détecté",
        savingsEstimate: 0
      });
    }
  }
  return out;
}

function detectDoublonsIA(tools: Tool[]): Prescription[] {
  const out: Prescription[] = [];
  const byUseCase = new Map<string, Tool[]>();
  for (const t of tools) {
    if (t.tool_type === "ia" && t.ia_use_case) {
      const group = byUseCase.get(t.ia_use_case) ?? [];
      group.push(t);
      byUseCase.set(t.ia_use_case, group);
    }
  }
  return out;
}

function detectDormants(tools: Tool[], selectedTools: Tool[]): Prescription[] {
  return tools
    .filter(t => (t.usage === "low" || t.usage === "dormant") && t.price > 0)
    .map(t => ({
      toolId: t.id,
      type: "cancel",
      verdict: "cancel",
      message: "outil fantôme",
      savingsEstimate: t.price
    }));
}

function detectInadapted(tool: Tool, score: ToolScore): Prescription | null {
  if (score.scoreFinal < 40) {
    return {
      toolId: tool.id,
      type: "inadapté",
      verdict: "review",
      message: "inadapté",
      savingsEstimate: 0
    };
  }
  return null;
}

export function computePrescriptions(
  selectedTools: Tool[],
  toolScores: Map<string, ToolScore>,
  doublonRules: DoubleRule[],
  persona: Persona
): { phase1: Prescription[]; phase2: Prescription[]; phase3: Prescription[] } {
  const phase1 = phase1Certified(selectedTools).filter(canPrescribe);
  const phase2 = phase2Questions(selectedTools).filter(canPrescribe);
  const phase3: Prescription[] = [];
  
  return { phase1, phase2, phase3 };
}

// ─── 6. Stack Health Score ─────────────────────────────────────────
export function computeStackHealth(prescriptions: {
  phase1: Prescription[];
  phase2: Prescription[];
  phase3: Prescription[];
}): { score: number; label: string } {
  let healthScore = 100;
  healthScore -= Math.min(30, (prescriptions.phase1.length + prescriptions.phase3.length) * 10);
  healthScore -= Math.min(20, prescriptions.phase2.length * 5);
  
  const score = Math.max(0, Math.min(100, healthScore));
  let label = "Optimisée";
  if (score < 40) label = "Critique";
  else if (score < 60) label = "À revoir";
  else if (score < 80) label = "Correcte";
  
  return { score, label };
}

// ─── 7. Recommendations ───────────────────────────────────────────
export function computeRecommendations(
  allTools: Tool[],
  selectedTools: Tool[],
  persona: Persona
): Tool[] {
  const selectedIds = new Set(selectedTools.map(t => t.id));
  return allTools
    .filter(t => !selectedIds.has(t.id) && ["satellite", "gestion", "ia"].includes(t.tool_type))
    .slice(0, 6);
}

// ─── 8. Main entry point ──────────────────────────────────────────
export function runDiagnostic(sessionState: SessionState, data: DiagnosticData): DiagnosticResult {
  const { selectedTools, persona, complementarySkills, tjm } = sessionState;
  const toolScores = new Map<string, ToolScore>();
  
  selectedTools.forEach(t => {
    toolScores.set(t.id, computeScoreFinal(t, persona, complementarySkills, tjm));
  });

  const prescriptions = computePrescriptions(selectedTools, toolScores, data.doublonRules, persona);
  const health = computeStackHealth(prescriptions);
  const recommendations = computeRecommendations(data.allTools, selectedTools, persona);

  return {
    sessionId: "temp",
    sessionState,
    toolScores,
    doublons: [],
    prescriptions,
    recommendations,
    healthScore: health.score,
    healthLabel: health.label,
    stackTotalCost: 0,
    estimatedWaste: 0,
    optimizedCost: 0,
    hoursRecoverable: 0,
    annualSavings: 0
  };
}

export interface DiagnosticData {
  allTools: Tool[];
  doublonRules: DoubleRule[];
}
