import type {
  DiagnosticAnswerSignal,
  DiagnosticResult,
  Prescription,
  Tool,
} from "@/types/diagnostic";

export type DecisionEvidenceTab = "overview" | "gaspillage" | "stack" | "optimiser" | "actions";

export type DecisionKind =
  | "remove"
  | "downgrade"
  | "resolve_overlap"
  | "verify"
  | "test"
  | "monitor";

export interface ProvenRecommendation {
  tool: Tool;
  evidence: NonNullable<DiagnosticResult["recommendationEvidence"]>[string];
}

export interface DiagnosticDecision {
  id: string;
  kind: DecisionKind;
  prescription?: Prescription;
  tool?: Tool;
  toolId?: string;
  labelFr: string;
  labelEn: string;
  detailFr: string;
  detailEn: string;
  evidenceFr: string;
  evidenceEn: string;
  evidenceTab: DecisionEvidenceTab;
  savings: number;
  timeMinutes: number;
  urgency: "now" | "week" | "month";
  confidence: "low" | "medium" | "high";
  priorityScore: number;
  problemKey: string;
}

function normalizeForDedupe(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function severityScore(severity?: "low" | "medium" | "high") {
  if (severity === "high") return 30;
  if (severity === "medium") return 18;
  return 8;
}

function confidenceScore(confidence?: "low" | "medium" | "high") {
  if (confidence === "high") return 18;
  if (confidence === "medium") return 10;
  return 4;
}

function confidenceFromSignal(signal: DiagnosticAnswerSignal): DiagnosticDecision["confidence"] {
  if (signal.severity === "high") return "high";
  if (signal.severity === "medium") return "medium";
  return "low";
}

function urgencyFromSignal(signal: DiagnosticAnswerSignal): DiagnosticDecision["urgency"] {
  if (signal.severity === "high") return "now";
  if (signal.severity === "medium") return "week";
  return "month";
}

function prescriptionKind(prescription: Prescription): DecisionKind {
  if (prescription.type === "doublon" || prescription.type === "doublon-ia") return "resolve_overlap";
  if (prescription.verdict === "cancel") return "remove";
  if (prescription.verdict === "downgrade") return "downgrade";
  return "verify";
}

function prescriptionLabel(
  prescription: Prescription,
  toolName: string
): Pick<DiagnosticDecision, "labelFr" | "labelEn" | "urgency" | "timeMinutes" | "evidenceTab" | "priorityScore"> {
  if (prescription.type === "doublon" || prescription.type === "doublon-ia") {
    return {
      labelFr: `Résoudre doublon : ${toolName}`,
      labelEn: `Fix duplicate: ${toolName}`,
      urgency: "now",
      timeMinutes: 5,
      evidenceTab: "gaspillage",
      priorityScore: 92 + Math.min(20, Math.round(prescription.savingsEstimate || 0)),
    };
  }

  if (prescription.type === "pricing-tier") {
    return {
      labelFr: `Vérifier le plan de ${toolName}`,
      labelEn: `Review ${toolName} plan`,
      urgency: prescription.verdict === "downgrade" ? "now" : "week",
      timeMinutes: prescription.verdict === "downgrade" ? 5 : 30,
      evidenceTab: "stack",
      priorityScore: 78 + Math.min(18, Math.round(prescription.savingsEstimate || 0)),
    };
  }

  if (prescription.verdict === "cancel") {
    return {
      labelFr: `Décider si ${toolName} doit rester`,
      labelEn: `Decide whether ${toolName} should stay`,
      urgency: "now",
      timeMinutes: 10,
      evidenceTab: "gaspillage",
      priorityScore: 86 + Math.min(18, Math.round(prescription.savingsEstimate || 0)),
    };
  }

  if (prescription.verdict === "downgrade") {
    return {
      labelFr: `Tester un plan inférieur pour ${toolName}`,
      labelEn: `Test a lower plan for ${toolName}`,
      urgency: "week",
      timeMinutes: 30,
      evidenceTab: "stack",
      priorityScore: 76 + Math.min(16, Math.round(prescription.savingsEstimate || 0)),
    };
  }

  return {
    labelFr: `Vérifier ${toolName}`,
    labelEn: `Review ${toolName}`,
    urgency: "week",
    timeMinutes: 30,
    evidenceTab: "gaspillage",
    priorityScore: 68 + Math.min(12, Math.round(prescription.savingsEstimate || 0)),
  };
}

function prescriptionProblemKey(prescription: Prescription) {
  if (prescription.type === "doublon-ia") return "ai-overlap";
  if (prescription.type === "doublon") return `overlap:${prescription.toolId}`;
  if (prescription.type === "pricing-tier") return `contract:${prescription.toolId}`;
  if (prescription.type === "dormant") return `usage:${prescription.toolId}`;
  return `${prescription.type}:${prescription.toolId}`;
}

function workflowNeedFromSignal(signal: DiagnosticAnswerSignal) {
  return signal.id.startsWith("workflow_friction_")
    ? signal.id.replace("workflow_friction_", "")
    : null;
}

function recommendationNeedIds(recommendation: ProvenRecommendation) {
  return (recommendation.evidence.needId || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function recommendationHasReadableEvidence(
  evidence: NonNullable<DiagnosticResult["recommendationEvidence"]>[string] | undefined
) {
  return Boolean(
    evidence &&
      evidence.labelFr?.trim() &&
      evidence.labelEn?.trim() &&
      evidence.reasonFr?.trim() &&
      evidence.reasonEn?.trim()
  );
}

export function getProvenRecommendations(result: DiagnosticResult): ProvenRecommendation[] {
  return result.recommendations
    .map((tool) => {
      const evidence = result.recommendationEvidence?.[tool.id];
      return recommendationHasReadableEvidence(evidence)
        ? { tool, evidence: evidence! }
        : null;
    })
    .filter((item): item is ProvenRecommendation => Boolean(item))
    .slice(0, 3);
}

function dedupeDecisions(items: DiagnosticDecision[]) {
  const seenProblems = new Set<string>();
  const seenCopy = new Set<string>();
  const out: DiagnosticDecision[] = [];

  for (const item of items) {
    const copyKey = normalizeForDedupe(`${item.labelFr} ${item.detailFr}`);
    if (seenProblems.has(item.problemKey) || seenCopy.has(copyKey)) continue;
    seenProblems.add(item.problemKey);
    seenCopy.add(copyKey);
    out.push(item);
  }

  return out;
}

export function buildDiagnosticDecisionPlan(result: DiagnosticResult): DiagnosticDecision[] {
  const toolMap = new Map(result.sessionState.selectedTools.map((tool) => [tool.id, tool]));
  const decisions: DiagnosticDecision[] = [];
  const prescribedToolIds = new Set<string>();
  const workflowFrictionNeedIds = new Set<string>();
  const aiOverlapFindingIds = new Set(
    result.insights.aiAnalysis.findings
      .filter((finding) => finding.kind === "overlap")
      .map((finding) => finding.id)
  );
  const hasAiOverlapPrescription = result.prescriptions.phase3.some(
    (prescription) => prescription.type === "doublon-ia"
  );

  const prescriptions = [
    ...result.prescriptions.phase1,
    ...result.prescriptions.phase3.filter(
      (prescription) => prescription.type === "doublon" || prescription.type === "doublon-ia"
    ),
    ...result.prescriptions.phase2,
    ...result.prescriptions.phase3.filter((prescription) => prescription.type === "dormant"),
  ];

  for (const prescription of prescriptions) {
    prescribedToolIds.add(prescription.toolId);
    const tool = toolMap.get(prescription.toolId);
    const toolName = tool?.name || prescription.toolId;
    const label = prescriptionLabel(prescription, toolName);
    decisions.push({
      id: `prescription-${prescription.type}-${prescription.toolId}`,
      kind: prescriptionKind(prescription),
      prescription,
      tool,
      toolId: prescription.toolId,
      labelFr: label.labelFr,
      labelEn: label.labelEn,
      detailFr: prescription.message,
      detailEn: prescription.message,
      evidenceFr: prescription.message,
      evidenceEn: prescription.message,
      evidenceTab: label.evidenceTab,
      savings: prescription.savingsEstimate,
      timeMinutes: label.timeMinutes,
      urgency: label.urgency,
      confidence: prescription.verdict === "review" ? "medium" : "high",
      priorityScore: label.priorityScore,
      problemKey: prescriptionProblemKey(prescription),
    });
  }

  for (const signal of result.insights.answerSignals.filter((item) =>
    item.source === "closing" ||
    (
      item.source === "workflow" &&
      item.impact === "review" &&
      item.severity !== "low"
    )
  )) {
    if (hasAiOverlapPrescription && aiOverlapFindingIds.has(signal.id)) continue;
    const needId = workflowNeedFromSignal(signal);
    if (needId) workflowFrictionNeedIds.add(needId);
    const signalToolIds = signal.toolIds || [];
    const overlapsPrescribedTool = signalToolIds.some((toolId) => prescribedToolIds.has(toolId));
    if (overlapsPrescribedTool && signal.source === "workflow") continue;
    decisions.push({
      id: `signal-${signal.id}`,
      kind: signal.source === "closing" ? "verify" : "test",
      toolId: signalToolIds[0],
      tool: signalToolIds[0] ? toolMap.get(signalToolIds[0]) : undefined,
      labelFr: signal.actionFr,
      labelEn: signal.actionEn,
      detailFr: signal.detailFr,
      detailEn: signal.detailEn,
      evidenceFr: signal.detailFr,
      evidenceEn: signal.detailEn,
      evidenceTab: "overview",
      savings: 0,
      timeMinutes: signal.severity === "high" ? 20 : 30,
      urgency: urgencyFromSignal(signal),
      confidence: confidenceFromSignal(signal),
      priorityScore: 58 + severityScore(signal.severity),
      problemKey: needId ? `need:${needId}` : `signal:${signal.id}`,
    });
  }

  for (const recommendation of getProvenRecommendations(result)) {
    const needIds = recommendationNeedIds(recommendation);
    if (needIds.some((needId) => workflowFrictionNeedIds.has(needId))) continue;
    decisions.push({
      id: `recommendation-${recommendation.tool.id}`,
      kind: "test",
      tool: recommendation.tool,
      toolId: recommendation.tool.id,
      labelFr: `Tester ${recommendation.tool.name}`,
      labelEn: `Test ${recommendation.tool.name}`,
      detailFr: recommendation.evidence.reasonFr,
      detailEn: recommendation.evidence.reasonEn,
      evidenceFr: recommendation.evidence.reasonFr,
      evidenceEn: recommendation.evidence.reasonEn,
      evidenceTab: "optimiser",
      savings: 0,
      timeMinutes: 120,
      urgency: "month",
      confidence: recommendation.evidence.confidence,
      priorityScore: 34 + confidenceScore(recommendation.evidence.confidence),
      problemKey: needIds.length > 0
        ? `need:${needIds.join("+")}`
        : `recommendation:${recommendation.tool.id}`,
    });
  }

  for (const focus of result.insights.focusAreas) {
    if (decisions.length >= 3) break;
    decisions.push({
      id: `focus-${focus.id}`,
      kind: focus.priority === "low" ? "monitor" : "verify",
      labelFr: focus.actionFr,
      labelEn: focus.actionEn,
      detailFr: focus.labelFr,
      detailEn: focus.labelEn,
      evidenceFr: focus.labelFr,
      evidenceEn: focus.labelEn,
      evidenceTab: "overview",
      savings: 0,
      timeMinutes: focus.priority === "high" ? 20 : 30,
      urgency: focus.priority === "high" ? "now" : focus.priority === "medium" ? "week" : "month",
      confidence: focus.priority === "high" ? "high" : focus.priority === "medium" ? "medium" : "low",
      priorityScore: 32 + severityScore(focus.priority),
      problemKey: `focus:${focus.id}`,
    });
  }

  return dedupeDecisions(decisions)
    .sort((a, b) =>
      b.priorityScore - a.priorityScore ||
      b.savings - a.savings ||
      a.id.localeCompare(b.id)
    )
    .slice(0, 3);
}
