#!/usr/bin/env node
import { readFileSync } from "node:fs";

const logPath = "docs/diagnostic/PHASE4_BETA_SESSIONS.json";
const log = JSON.parse(readFileSync(logPath, "utf8"));
const sessions = Array.isArray(log.realSessions) ? log.realSessions : [];

const requiredSegments = [
  "UI / produit numérique",
  "Identité / illustration / édition",
  "Photo / retouche",
  "Vidéo / motion",
  "3D / espaces",
  "Social / audio / contenu court",
];

function pct(count, total) {
  if (total === 0) return null;
  return Math.round((count / total) * 100);
}

const completed = sessions.filter((session) => session.completed === true);
const actionable = sessions.filter((session) => session.actionableDiagnostic === true);
const faithful = sessions.filter((session) => Number(session.mappingFidelityScore || 0) >= 4);
const repetitive = sessions.filter((session) => session.repetitiveQuestionReported === true);
const captureConfusion = sessions.filter((session) => session.recommendationPerceivedDuringCapture === true);
const preVerdictDurations = sessions
  .map((session) => Number(session.preVerdictMinutes))
  .filter((value) => Number.isFinite(value) && value >= 0)
  .sort((a, b) => a - b);
const openP0 = sessions.flatMap((session) => session.issues || []).filter((issue) => issue.severity === "P0" && issue.status !== "closed");
const openP1 = sessions.flatMap((session) => session.issues || []).filter((issue) => issue.severity === "P1" && issue.status !== "closed");
const coveredSegments = new Set(sessions.map((session) => session.segment).filter(Boolean));
const missingSegments = requiredSegments.filter((segment) => !coveredSegments.has(segment));
const medianPreVerdict = preVerdictDurations.length === 0
  ? null
  : preVerdictDurations[Math.floor((preVerdictDurations.length - 1) / 2)];

const metrics = {
  sessionCount: sessions.length,
  completedRate: pct(completed.length, sessions.length),
  actionableDiagnosticRate: pct(actionable.length, sessions.length),
  perceivedMappingFidelityRate: pct(faithful.length, sessions.length),
  repetitiveQuestionRate: pct(repetitive.length, sessions.length),
  captureRecommendationConfusionCount: captureConfusion.length,
  medianPreVerdictMinutes: medianPreVerdict,
  openP0Count: openP0.length,
  openP1Count: openP1.length,
  missingSegments,
};

const blockers = [];
if (metrics.sessionCount < 12) blockers.push(`12 sessions réelles requises, ${metrics.sessionCount} enregistrée(s)`);
if (missingSegments.length > 0) blockers.push(`segments manquants: ${missingSegments.join(", ")}`);
if ((metrics.actionableDiagnosticRate ?? 0) < 70) blockers.push("diagnostic actionnable < 70 % ou non mesuré");
if ((metrics.perceivedMappingFidelityRate ?? 0) < 85) blockers.push("fidélité perçue < 85 % ou non mesurée");
if ((metrics.completedRate ?? 0) < 70) blockers.push("complétion < 70 % ou non mesurée");
if (metrics.medianPreVerdictMinutes == null || metrics.medianPreVerdictMinutes > 8) blockers.push("temps médian pré-verdict > 8 min ou non mesuré");
if (metrics.captureRecommendationConfusionCount !== 0) blockers.push("au moins un utilisateur pense recevoir une recommandation pendant la capture");
if (metrics.openP0Count !== 0) blockers.push("P0 ouvert(s)");
if (metrics.openP1Count >= 3) blockers.push("trois P1 ou plus ouverts");

const accepted = blockers.length === 0;

console.log("Tooltrim — évaluation G4 Phase 4");
console.log(`Journal : ${logPath}`);
console.log("");
console.log(`Sessions réelles : ${metrics.sessionCount}`);
console.log(`Segments manquants : ${missingSegments.length ? missingSegments.join(", ") : "aucun"}`);
console.log(`Diagnostic actionnable : ${metrics.actionableDiagnosticRate ?? "non mesuré"}%`);
console.log(`Fidélité perçue : ${metrics.perceivedMappingFidelityRate ?? "non mesuré"}%`);
console.log(`Complétion : ${metrics.completedRate ?? "non mesuré"}%`);
console.log(`Temps médian pré-verdict : ${metrics.medianPreVerdictMinutes ?? "non mesuré"}`);
console.log(`Questions répétitives : ${metrics.repetitiveQuestionRate ?? "non mesuré"}%`);
console.log(`Confusion capture/recommandation : ${metrics.captureRecommendationConfusionCount}`);
console.log(`P0 ouverts : ${metrics.openP0Count}`);
console.log(`P1 ouverts : ${metrics.openP1Count}`);
console.log("");

if (!accepted) {
  console.log("Verdict G4 : NON ACCEPTÉ");
  console.log("Blockers :");
  for (const blocker of blockers) console.log(`- ${blocker}`);
  process.exit(0);
}

console.log("Verdict G4 : ACCEPTÉ");
