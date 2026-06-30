#!/usr/bin/env node
import { readFileSync } from "node:fs";

const files = {
  roadmap: "ROADMAP_DIAGNOSTIC.md",
  handoff: "AI_HANDOFF.md",
  protocol: "docs/diagnostic/PHASE0_G0_PROTOCOL.md",
  scenarios: "docs/diagnostic/CREATIVE_REFERENCE_SCENARIOS.md",
  recipe: "docs/diagnostic/G0_PRODUCT_RECIPE.md",
  decision: "docs/diagnostic/G0_PRODUCT_DECISION.md",
  run: "docs/diagnostic/G0_PRODUCT_RUN_2026-06-29.md",
  baseline: "docs/diagnostic/G0_BASELINE_REPORT.md",
};

const content = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readFileSync(file, "utf8")])
);
const lower = Object.fromEntries(
  Object.entries(content).map(([key, value]) => [key, value.toLowerCase()])
);

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

const scenarioIds = Array.from({ length: 18 }, (_, index) =>
  `CR-${String(index + 1).padStart(2, "0")}`
);
const recipeIds = Array.from({ length: 8 }, (_, index) => `G0-R${index + 1}`);
const eventSignals = [
  "step_viewed",
  "step_completed",
  "step_back",
  "session_resumed",
  "abandoned_at",
  "session_completed",
  "report_requested",
  "restitution_tab_viewed",
  "restitution_share_opened",
  "restitution_pdf_export_clicked",
];

ok(
  "roadmap links active G0 documents",
  content.roadmap.includes("PHASE0_G0_PROTOCOL.md") &&
    content.roadmap.includes("CREATIVE_REFERENCE_SCENARIOS.md") &&
    content.roadmap.includes("G0_BASELINE_REPORT.md"),
  "roadmap must remain the document authority"
);

ok(
  "protocol defines validation commands and G0 criteria",
  content.protocol.includes("npm run validate:diagnostic") &&
    content.protocol.includes("npm run validate:g0") &&
    content.protocol.includes("Critères G0") &&
    content.protocol.includes("Règle de décision"),
  "G0 must be executable, not only described"
);

ok(
  "protocol lists measurement events",
  eventSignals.every((signal) => content.protocol.includes(signal)),
  "start, progress, recovery, abandonment, completion and restitution signals must be identified"
);

ok(
  "creative reference scenarios cover CR-01 to CR-18",
  scenarioIds.every((id) => content.scenarios.includes(id)),
  scenarioIds.filter((id) => !content.scenarios.includes(id)).join(", ")
);

ok(
  "reference scenarios protect core creative edge cases",
  [
    "figma",
    "sketch",
    "indesign",
    "illustrator",
    "adobe",
    "blender",
    "cinema 4d",
    "redshift",
    "canva",
    "capcut",
    "chatgpt",
    "firefly",
    "outil inconnu",
    "reprise",
  ].every((term) => lower.scenarios.includes(term)),
  "UI, Adobe, atypical uses, 3D, social, AI, unknown tool and recovery must be present"
);

ok(
  "G0 recipe covers the eight decision sessions",
  recipeIds.every((id) => content.recipe.includes(id)) &&
    content.recipe.includes("Score maximum par session") &&
    content.recipe.includes("Seuils G0") &&
    content.recipe.includes("P0") &&
    content.recipe.includes("P1"),
  recipeIds.filter((id) => !content.recipe.includes(id)).join(", ")
);

ok(
  "baseline records technical validation without overclaiming product validation",
  content.baseline.includes("baseline technique validée") &&
    content.baseline.includes("décision produit G0 encore à confirmer") &&
    content.baseline.includes("npm run validate:g0") &&
    content.baseline.includes("110 tests passés"),
  "technical pass must stay distinct from product acceptance"
);

ok(
  "product decision artifact records G0 acceptance with reserves",
  content.decision.includes("G0 produit est accepté avec réserves") &&
    content.decision.includes("Statut : accepté avec réserves") &&
    content.decision.includes("G0_PRODUCT_RECIPE.md") &&
    content.decision.includes("G0-R8") &&
    content.decision.includes("13,5/16") &&
    lower.decision.includes("aucun p1 ouvert") &&
    lower.decision.includes("réserves"),
  "G0 acceptance must be written, reserve-based, and backed by the full played recipe"
);

ok(
  "product run records initial risks and post-correction replays",
  content.run.includes("G0-R1") &&
    content.run.includes("G0-R2") &&
    content.run.includes("PASS avec réserve forte") &&
    content.run.includes("FAIL") &&
    content.run.includes("mélange FR/EN") &&
    content.run.includes("Restitution contradictoire") &&
    content.run.includes("Adobe Creative Cloud") &&
    content.run.includes("70 €/mo") &&
    content.run.includes("0 €/mo") &&
    content.run.includes("13/16") &&
    content.run.includes("10/16") &&
    content.run.includes("Replay post-correction — G0-R1 Figma") &&
    content.run.includes("Replay post-correction — G0-R2 Adobe") &&
    content.run.includes("Replay post-correction — G0-R8 reprise") &&
    content.run.includes("G0 accepté avec réserves") &&
    content.run.includes("Budget to confirm"),
  "played recipe sessions must document initial risks and the targeted post-correction replay evidence"
);

ok(
  "handoff keeps creative-only continuation after G0",
  content.handoff.includes("G0_PRODUCT_RECIPE.md") &&
    content.handoff.includes("G0 produit accepté avec réserves") &&
    content.handoff.includes("lot court de correction P1") &&
    content.handoff.includes("G0-R3 à G0-R8 ont été repris") &&
    content.handoff.includes("La Phase 1 est ouverte comme **parcours Créatif candidat observé**") &&
    content.handoff.includes("G1 autonome est accepté avec réserves fortes") &&
    content.handoff.includes("G1 terrain n’est pas accepté") &&
    content.handoff.includes("ne pas ouvrir Tech, Conseil, Content ou Ops"),
  "future work must not skip from reserved G0 acceptance to unrelated feature work or new verticals"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`G0 product readiness verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
