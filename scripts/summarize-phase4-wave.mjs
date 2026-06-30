#!/usr/bin/env node
import { readFileSync } from "node:fs";

const logPath = "docs/diagnostic/PHASE4_BETA_SESSIONS.json";
const log = JSON.parse(readFileSync(logPath, "utf8"));
const sessions = Array.isArray(log.realSessions) ? log.realSessions : [];
const scoredSessions = sessions.filter((session) => session.includeInG4Score !== false);

const requiredSegments = [
  "UI / produit numérique",
  "Identité / illustration / édition",
  "Photo / retouche",
  "Vidéo / motion",
  "3D / espaces",
  "Social / audio / contenu court",
];

function pct(count, total) {
  if (total === 0) return "non mesuré";
  return `${Math.round((count / total) * 100)}%`;
}

function median(values) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return "non mesuré";
  const middle = Math.floor((sorted.length - 1) / 2);
  return `${sorted[middle]} min`;
}

const completed = scoredSessions.filter((session) => session.completed === true);
const actionable = scoredSessions.filter((session) => session.actionableDiagnostic === true);
const faithful = scoredSessions.filter((session) => Number(session.mappingFidelityScore || 0) >= 4);
const trusted = scoredSessions.filter((session) => Number(session.trustScore || 0) >= 4);
const repetitive = scoredSessions.filter((session) => session.repetitiveQuestionReported === true);
const captureConfusion = scoredSessions.filter((session) => session.recommendationPerceivedDuringCapture === true);
const openIssues = scoredSessions.flatMap((session) => session.issues || []).filter((issue) => issue.status !== "closed");
const openP0 = openIssues.filter((issue) => issue.severity === "P0");
const openP1 = openIssues.filter((issue) => issue.severity === "P1");
const coveredSegments = new Set(scoredSessions.map((session) => session.segment).filter(Boolean));
const missingSegments = requiredSegments.filter((segment) => !coveredSegments.has(segment));
const preVerdictMinutes = scoredSessions.map((session) => Number(session.preVerdictMinutes));

console.log("Tooltrim — synthèse Phase 4");
console.log(`Journal : ${logPath}`);
console.log("");

if (sessions.length === 0) {
  console.log("Aucune session réelle enregistrée.");
  console.log("Décision : poursuivre le recrutement, ne pas accepter G4.");
  console.log("Prochaine action : remplir le pipeline candidat puis jouer B4-01 à B4-06.");
  process.exit(0);
}

console.log(`Sessions réelles enregistrées : ${sessions.length}`);
console.log(`Sessions incluses dans les métriques : ${scoredSessions.length}`);
console.log(`Segments couverts : ${coveredSegments.size ? Array.from(coveredSegments).join(", ") : "aucun"}`);
console.log(`Segments manquants : ${missingSegments.length ? missingSegments.join(", ") : "aucun"}`);
console.log("");
console.log("Métriques rapides");
console.log(`- Complétion : ${pct(completed.length, scoredSessions.length)}`);
console.log(`- Temps médian pré-verdict : ${median(preVerdictMinutes)}`);
console.log(`- Diagnostic actionnable : ${pct(actionable.length, scoredSessions.length)}`);
console.log(`- Fidélité cartographie ≥ 4/5 : ${pct(faithful.length, scoredSessions.length)}`);
console.log(`- Confiance restitution ≥ 4/5 : ${pct(trusted.length, scoredSessions.length)}`);
console.log(`- Question répétitive signalée : ${pct(repetitive.length, scoredSessions.length)}`);
console.log(`- Confusion capture/recommandation : ${captureConfusion.length}`);
console.log(`- P0 ouverts : ${openP0.length}`);
console.log(`- P1 ouverts : ${openP1.length}`);
console.log("");

if (openP0.length > 0) {
  console.log("Décision recommandée : suspendre la prochaine session et corriger les P0 reproductibles.");
} else if (openP1.length >= 3) {
  console.log("Décision recommandée : corriger les P1 reproductibles avant d'élargir la vague.");
} else if (scoredSessions.length < 6) {
  console.log("Décision recommandée : continuer la vague 1 avant d'arbitrer.");
} else {
  console.log("Décision recommandée : produire la synthèse vague 1 et décider vague 2.");
}

console.log("");
console.log("Rappel : G4 reste non accepté avant 12 sessions réelles, 6 familles couvertes et seuils atteints.");
