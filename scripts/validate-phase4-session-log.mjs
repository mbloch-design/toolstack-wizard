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

const enums = {
  participantType: ["solo", "small_team"],
  stackType: ["adobe_strong", "non_adobe", "mixed"],
  aiUsage: ["none", "occasional", "regular", "intensive"],
  contractKnowledge: ["known", "partial", "unknown"],
  device: ["desktop", "laptop", "tablet", "mobile"],
  language: ["fr", "en"],
  severity: ["P0", "P1", "P2", "P3"],
  issueStatus: ["open", "closed", "monitoring", "backlog"],
};

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isBoolean(value) {
  return typeof value === "boolean";
}

function isNullableBoolean(value) {
  return value === null || typeof value === "boolean";
}

function isScore(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

function isPositiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && value !== "YYYY-MM-DD";
}

ok("session log declares Phase 4 creative scope", log.phase === "4" && log.scope === "creative");
ok("session log keeps G4 refusal explicit before real proof", typeof log.decision === "string" && log.decision.includes("G4 non accepté"));
ok("realSessions is an array", Array.isArray(log.realSessions));
ok("internal dry-runs stay separate from realSessions", Array.isArray(log.internalDryRuns));

const ids = new Set();

for (const [index, session] of sessions.entries()) {
  const label = session?.id || `session[${index}]`;
  ok(`${label}: entry is an object`, isObject(session));
  if (!isObject(session)) continue;

  ok(`${label}: id is a real beta id`, /^B4-\d{2}$/.test(session.id || ""), "Use B4-01, B4-02… for real sessions; keep D4-* for dry-runs.");
  ok(`${label}: id is unique`, !ids.has(session.id));
  ids.add(session.id);

  ok(`${label}: date is filled`, isDate(session.date));
  ok(`${label}: segment is one of six creative families`, requiredSegments.includes(session.segment));
  ok(`${label}: participantType is valid`, enums.participantType.includes(session.participantType));
  ok(`${label}: stackType is valid`, enums.stackType.includes(session.stackType));
  ok(`${label}: aiUsage is valid`, enums.aiUsage.includes(session.aiUsage));
  ok(`${label}: contractKnowledge is valid`, enums.contractKnowledge.includes(session.contractKnowledge));
  ok(`${label}: hasAtypicalUsage is boolean`, isBoolean(session.hasAtypicalUsage));
  ok(`${label}: device is valid`, enums.device.includes(session.device));
  ok(`${label}: language is valid`, enums.language.includes(session.language));
  ok(`${label}: completed is boolean`, isBoolean(session.completed));
  ok(`${label}: includeInG4Score is boolean`, isBoolean(session.includeInG4Score));

  if (session.includeInG4Score === false) {
    ok(`${label}: excluded session explains why`, typeof session.exclusionReason === "string" && session.exclusionReason.trim().length > 0);
  }

  if (session.completed === true && session.includeInG4Score !== false) {
    ok(`${label}: preVerdictMinutes is measured`, isPositiveNumber(session.preVerdictMinutes));
    ok(`${label}: totalProductMinutes is measured`, isPositiveNumber(session.totalProductMinutes));
    ok(
      `${label}: totalProductMinutes is not shorter than preVerdictMinutes`,
      isPositiveNumber(session.preVerdictMinutes) &&
        isPositiveNumber(session.totalProductMinutes) &&
        session.totalProductMinutes >= session.preVerdictMinutes,
    );
    ok(`${label}: mappingFidelityScore is 1-5`, isScore(session.mappingFidelityScore));
    ok(`${label}: trustScore is 1-5`, isScore(session.trustScore));
  }

  ok(`${label}: actionableDiagnostic is boolean`, isBoolean(session.actionableDiagnostic));
  if (session.actionableDiagnostic === true) {
    ok(`${label}: firstDecisionQuoted is filled when action is claimed`, typeof session.firstDecisionQuoted === "string" && session.firstDecisionQuoted.trim().length > 0);
  }
  ok(`${label}: repetitiveQuestionReported is boolean`, isBoolean(session.repetitiveQuestionReported));
  ok(`${label}: recommendationPerceivedDuringCapture is boolean`, isBoolean(session.recommendationPerceivedDuringCapture));

  ok(`${label}: manualVerification exists`, isObject(session.manualVerification));
  if (isObject(session.manualVerification)) {
    for (const key of ["toolsCorrect", "usagesCorrect", "aiCorrect", "contractsCorrect", "costsCorrect", "decisionsReasonable"]) {
      ok(`${label}: manualVerification.${key} is boolean or null`, isNullableBoolean(session.manualVerification[key]));
    }
  }

  ok(`${label}: issues is an array`, Array.isArray(session.issues));
  if (Array.isArray(session.issues)) {
    for (const [issueIndex, issue] of session.issues.entries()) {
      const issueLabel = `${label}: issue[${issueIndex}]`;
      ok(`${issueLabel}: entry is an object`, isObject(issue));
      if (!isObject(issue)) continue;
      ok(`${issueLabel}: id is filled`, typeof issue.id === "string" && issue.id.trim().length > 0);
      ok(`${issueLabel}: severity is valid`, enums.severity.includes(issue.severity));
      ok(`${issueLabel}: status is valid`, enums.issueStatus.includes(issue.status));
      ok(`${issueLabel}: description is filled`, typeof issue.description === "string" && issue.description.trim().length > 0);
      ok(`${issueLabel}: reproducible is boolean`, isBoolean(issue.reproducible));
      ok(`${issueLabel}: candidateFix is present`, typeof issue.candidateFix === "string");
    }
  }

  ok(`${label}: notes field is present`, typeof session.notes === "string");
  ok(`${label}: no dry-run id in realSessions`, !String(session.id || "").startsWith("D4-"));
  ok(`${label}: no template date left in realSessions`, session.date !== "YYYY-MM-DD");
}

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

console.log("");
if (sessions.length === 0) {
  console.log("No real beta sessions recorded yet. Session log is ready and empty.");
} else {
  console.log(`Real beta sessions checked: ${sessions.length}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log(`Phase 4 session log quality verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
