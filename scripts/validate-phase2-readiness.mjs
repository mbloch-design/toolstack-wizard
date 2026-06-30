#!/usr/bin/env node
import { readFileSync } from "node:fs";

const files = {
  roadmap: "ROADMAP_DIAGNOSTIC.md",
  handoff: "AI_HANDOFF.md",
  protocol: "docs/diagnostic/PHASE2_COMMERCIAL_TRUTH_PROTOCOL.md",
  decision: "docs/diagnostic/PHASE2_G2_DECISION.md",
  commercialAccess: "src/lib/commercialAccess.ts",
  commercialReview: "src/components/diagnostic/CommercialAccessReview.tsx",
  workflowTests: "src/test/diagnostic/workflowUsageContracts.spec.ts",
  renderTests: "src/test/diagnostic/diagnosticRender.spec.tsx",
};

const content = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readFileSync(file, "utf8")]),
);
const lower = Object.fromEntries(
  Object.entries(content).map(([key, value]) => [key, value.toLowerCase()]),
);

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

const mandatoryScenarios = [
  "Adobe Photography",
  "Creative Cloud employeur",
  "Figma payé par l’équipe",
  "Canva Pro + Canva AI",
  "Maxon One + Octane",
  "outil gratuit avec crédits",
];

ok(
  "Phase 2 protocol defines commercial truth scope",
  content.protocol.includes("Objectif Phase 2") &&
    content.protocol.includes("plusieurs lignes d’accès") &&
    content.protocol.includes("coût marginal nul") &&
    content.protocol.includes("fonction IA intégrée"),
  "Phase 2 must be about truth of tools, functions, contracts and costs",
);

ok(
  "Phase 2 protocol lists mandatory G2 scenarios",
  mandatoryScenarios.every((scenario) => content.protocol.includes(scenario)),
  mandatoryScenarios.filter((scenario) => !content.protocol.includes(scenario)).join(", "),
);

ok(
  "G2 decision is autonomous with reserves, not overclaimed",
  content.decision.includes("G2 autonome : accepté avec réserves") &&
    content.decision.includes("ne remplace pas une validation terrain") &&
    content.decision.includes("G1 terrain reste non validé") &&
    content.decision.includes("Phase 3"),
  "G2 must not claim field validation",
);

ok(
  "commercial engine supports several contracts per family",
  content.commercialAccess.includes("contractsForFamily") &&
    content.commercialAccess.includes("contractsCoveringProduct") &&
    content.commercialAccess.includes("contractCoversProduct") &&
    content.commercialAccess.includes("client_paid") &&
    content.commercialAccess.includes("included_elsewhere"),
  "commercialAccess.ts must expose multi-contract helpers and real access modes",
);

ok(
  "commercial review renders several access lines inside one family",
  content.commercialReview.includes("plusieurs accès") &&
    content.commercialReview.includes("ContractEditor") &&
    content.commercialReview.includes("Nouvel accès") &&
    content.commercialReview.includes("Retirer") &&
    content.commercialReview.includes("unscopedTools"),
  "CommercialAccessReview must not collapse a family to one contract",
);

ok(
  "workflow tests cover mandatory commercial scenarios",
  [
    "Adobe Photography personal plus another Adobe app paid by a client",
    "employer Creative Cloud contract separate from a personal plugin",
    "team-paid Figma and a personal Midjourney",
    "Canva Pro and included Canva AI",
    "Maxon One and Octane",
    "free tool with paid credits",
  ].every((snippet) => content.workflowTests.includes(snippet)),
  "workflow tests must protect all G2 mandatory scenarios",
);

ok(
  "render tests show multiple access lines in one family",
  content.renderTests.includes("renders several access lines inside one commercial family") &&
    content.renderTests.includes("2 accès déclarés") &&
    content.renderTests.includes("Paid by a client"),
  "UI-level rendering must show the multi-line family model",
);

ok(
  "roadmap records Phase 2 autonomous status",
  content.roadmap.includes("Phase 2 — Vérité catalogue et commerciale") &&
    content.roadmap.includes("G2 autonome") &&
    content.roadmap.includes("plusieurs contrats dans une même famille"),
  "ROADMAP_DIAGNOSTIC.md must reflect the active Phase 2 decision",
);

ok(
  "handoff allows Phase 3 only after Phase 2 validations",
  content.handoff.includes("Avancement Phase 2") &&
    content.handoff.includes("G2 autonome accepté avec réserves") &&
    content.handoff.includes("ne pas ouvrir Tech, Conseil, Content ou Ops") &&
    content.handoff.includes("Phase 3"),
  "AI_HANDOFF.md must preserve the creative-only roadmap handoff",
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`Phase 2 readiness verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
