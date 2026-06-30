#!/usr/bin/env node
import { readFileSync } from "node:fs";

const files = {
  roadmap: "ROADMAP_DIAGNOSTIC.md",
  handoff: "AI_HANDOFF.md",
  protocol: "docs/diagnostic/PHASE3_TRUSTED_RESTITUTION_PROTOCOL.md",
  decision: "docs/diagnostic/PHASE3_G3_DECISION.md",
  decisionPlan: "src/utils/diagnosticDecisionPlan.ts",
  actions: "src/components/dashboard/DashActions.tsx",
  overview: "src/components/dashboard/DashOverview.tsx",
  optimisations: "src/components/dashboard/DashOptimisations.tsx",
  pdf: "src/components/dashboard/DashPdfExport.tsx",
  insights: "src/utils/diagnosticInsights.ts",
  renderTests: "src/test/diagnostic/diagnosticRender.spec.tsx",
};

const content = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readFileSync(file, "utf8")]),
);

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "Phase 3 protocol defines trusted restitution scope",
  content.protocol.includes("Trois décisions maximum") &&
    content.protocol.includes("preuve lisible") &&
    content.protocol.includes("Une étape existante à tester ou activer avant d’ajouter un outil") &&
    content.protocol.includes("Aucune recommandation outil sans preuve métier"),
  "Phase 3 must be about proof, restraint and non-duplicated decisions",
);

ok(
  "G3 decision is autonomous with reserves, not field validation",
  content.decision.includes("G3 autonome : accepté avec réserves") &&
    content.decision.includes("ne remplace pas une revue experte métier ni une validation terrain") &&
    content.decision.includes("trois décisions maximum") &&
    content.decision.includes("recommandations sans preuve"),
  "G3 must not overclaim expert or field review",
);

ok(
  "decision plan centralizes the three-decision contract",
  content.decisionPlan.includes("buildDiagnosticDecisionPlan") &&
    content.decisionPlan.includes("getProvenRecommendations") &&
    content.decisionPlan.includes("recommendationHasReadableEvidence") &&
    content.decisionPlan.includes("workflowFrictionNeedIds") &&
    content.decisionPlan.includes(".slice(0, 3)"),
  "The restitution must use one source of truth and cap primary decisions",
);

ok(
  "actions tab uses centralized decisions and explains the cap",
  content.actions.includes("buildDiagnosticDecisionPlan") &&
    content.actions.includes("trois décisions les plus utiles") &&
    content.actions.includes("Other signals stay in the evidence"),
  "DashActions must not rebuild its own unlimited checklist",
);

ok(
  "overview uses the same decision plan",
  content.overview.includes("buildDiagnosticDecisionPlan") &&
    content.overview.includes("getPriorityItems"),
  "DashOverview must not tell a different story from the action plan",
);

ok(
  "optional recommendations require proof",
  content.optimisations.includes("getProvenRecommendations") &&
    !content.optimisations.includes("PERSONA_REASONS") &&
    content.optimisations.includes("evidence.reasonFr"),
  "Optional ideas must not fall back to generic persona copy",
);

ok(
  "PDF export carries primary decisions and proven recommendations only",
  content.pdf.includes("primaryDecisions") &&
    content.pdf.includes("buildDiagnosticDecisionPlan") &&
    content.pdf.includes("getProvenRecommendations"),
  "Export must mirror the trusted restitution",
);

ok(
  "calibration flags recommendations without evidence",
  content.insights.includes("recommendation_without_evidence") &&
    content.insights.includes("Retirer ces pistes de la restitution principale"),
  "Scoring/calibration must surface proofless recommendations as a trust issue",
);

ok(
  "render tests protect Phase 3 trust rules",
  content.renderTests.includes("keeps the main restitution to three proven decisions") &&
    content.renderTests.includes("tests the existing workflow before turning a friction into a new primary tool decision"),
  "Tests must cover decision cap and atypical workflow prudence",
);

ok(
  "roadmap records Phase 3 autonomous status",
  content.roadmap.includes("Phase 3 — Diagnostic et restitution de confiance") &&
    content.roadmap.includes("G3 autonome") &&
    content.roadmap.includes("trois décisions maximum"),
  "ROADMAP_DIAGNOSTIC.md must reflect the Phase 3 decision",
);

ok(
  "handoff allows next work without opening other verticals",
  content.handoff.includes("Avancement Phase 3") &&
    content.handoff.includes("G3 autonome accepté avec réserves") &&
    content.handoff.includes("ne pas ouvrir Tech, Conseil, Content ou Ops") &&
    content.handoff.includes("Phase 4"),
  "AI_HANDOFF.md must preserve the creative-only roadmap handoff",
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`Phase 3 readiness verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
