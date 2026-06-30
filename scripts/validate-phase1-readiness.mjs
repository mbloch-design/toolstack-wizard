#!/usr/bin/env node
import { readFileSync } from "node:fs";

const files = {
  roadmap: "ROADMAP_DIAGNOSTIC.md",
  handoff: "AI_HANDOFF.md",
  protocol: "docs/diagnostic/PHASE1_CREATIVE_CANDIDATE_PROTOCOL.md",
  grid: "docs/diagnostic/PHASE1_OBSERVATION_GRID.md",
  run: "docs/diagnostic/PHASE1_USER_RUN_2026-06-29.md",
  g1Decision: "docs/diagnostic/PHASE1_G1_DECISION.md",
  g0Decision: "docs/diagnostic/G0_PRODUCT_DECISION.md",
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

const phase1Risks = [
  "moment contrat",
  "ia hybride",
  "outil inconnu",
  "reprise",
  "zones sautées",
  "outil multi-usage",
];

const g1Metrics = [
  "≤ 8 minutes",
  "5 utilisateurs sur 6",
  "0 confusion persistante",
  "0",
  "≤ 1 par session",
  "100 %",
];

ok(
  "G0 is accepted before Phase 1 opens",
  content.g0Decision.includes("G0 produit est accepté avec réserves") &&
    content.g0Decision.includes("npm run validate:g0") &&
    content.g0Decision.includes("PASS"),
  "Phase 1 must not start without a written G0 decision and a green gate",
);

ok(
  "roadmap defines Phase 1 as the active candidate path",
  content.roadmap.includes("Phase 1 — Parcours Créatif candidat") &&
    content.roadmap.includes("Valider que l’utilisateur comprend le parcours") &&
    content.roadmap.includes("Porte G1"),
  "ROADMAP_DIAGNOSTIC.md must remain the authority for Phase 1",
);

ok(
  "handoff points to Phase 1 observation, not feature drift",
  content.handoff.includes("La Phase 1 est ouverte comme **parcours Créatif candidat observé**") &&
    content.handoff.includes("G1 autonome est accepté avec réserves fortes") &&
    content.handoff.includes("G1 terrain n’est pas accepté") &&
    content.handoff.includes("transformer les réserves P2 G0 en risques observables") &&
    content.handoff.includes("ne pas ouvrir Tech, Conseil, Content ou Ops"),
  "AI_HANDOFF.md must not reopen unrelated functional work",
);

ok(
  "Phase 1 protocol has a decision question and G1 outcomes",
  content.protocol.includes("Décision à prendre") &&
    content.protocol.includes("G1 accepté") &&
    content.protocol.includes("G1 refusé") &&
    content.protocol.includes("G1 accepté avec réserves"),
  "protocol must be decision-oriented, not a loose checklist",
);

ok(
  "Phase 1 protocol covers six creative sessions",
  [
    "P1-UI",
    "P1-Brand",
    "P1-Photo",
    "P1-Video",
    "P1-3D",
    "P1-SocialAudio",
  ].every((session) => content.protocol.includes(session)),
  "six observed sessions must cover the creative breadth",
);

ok(
  "Phase 1 protocol protects against coding before observation",
  lower.protocol.includes("ne pas ajouter de nouvelle verticale") &&
    lower.protocol.includes("ne pas enrichir le catalogue") &&
    lower.protocol.includes("ne pas recommander pendant la capture") &&
    lower.protocol.includes("exception : un p0 reproductible"),
  "Phase 1 must remain observational unless a P0 blocks the test",
);

ok(
  "Phase 1 protocol contains G1 metrics",
  g1Metrics.every((metric) => content.protocol.includes(metric)) &&
    content.protocol.includes("Temps médian jusqu’au pré-verdict") &&
    content.protocol.includes("Décision finale citée"),
  "G1 must have measurable thresholds",
);

ok(
  "observation grid covers G0 reserves",
  phase1Risks.every((risk) => lower.grid.includes(risk)),
  phase1Risks.filter((risk) => !lower.grid.includes(risk)).join(", "),
);

ok(
  "observation grid separates capture from recommendation",
  lower.grid.includes("capture vs recommandation") &&
    lower.grid.includes("décris ton existant") &&
    lower.grid.includes("stack idéale"),
  "grid must detect recommendation leakage during capture",
);

ok(
  "observation grid asks for evidence and severity",
  content.grid.includes("Preuve") &&
    content.grid.includes("Sévérité") &&
    content.grid.includes("P0") &&
    content.grid.includes("P1") &&
    content.grid.includes("P2") &&
    content.grid.includes("P3"),
  "observations must be classifiable",
);

ok(
  "Phase 1 run pack separates proxy results from real user validation",
  content.run.includes("replay autonome partiel terminé") &&
    content.run.includes("ne pas inventer de résultats") &&
    content.run.includes("replays proxy") &&
    content.run.includes("P1-SocialAudio n’a pas été rejoué en Phase 1 autonome") &&
    [
      "P1-UI",
      "P1-Brand",
      "P1-Photo",
      "P1-Video",
      "P1-3D",
      "P1-SocialAudio",
    ].every((session) => content.run.includes(session)) &&
    content.run.includes("Synthèse G1 provisoire") &&
    content.run.includes("Lots candidats"),
  "Phase 1 needs a concrete run artifact before sessions start",
);

ok(
  "G1 decision is explicit about autonomous versus field validation",
  content.g1Decision.includes("G1 autonome : accepté avec réserves fortes") &&
    content.g1Decision.includes("G1 terrain : non accepté") &&
    content.g1Decision.includes("pas test utilisateur externe") &&
    content.g1Decision.includes("P1-SocialAudio n’a pas été observé") &&
    content.g1Decision.includes("mobile n’a pas été validé"),
  "G1 decision must not claim real user validation from proxy replays",
);

ok(
  "G1 decision records the Phase 1 P1 fixes",
  content.g1Decision.includes("score santé est plafonné") &&
    content.g1Decision.includes("email vide ne bloque plus") &&
    content.g1Decision.includes("catalog pricing may be wrong") &&
    content.g1Decision.includes("mode commercial est déjà déclaré"),
  "Phase 1 decision must document the trust fixes applied during autonomous work",
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`Phase 1 readiness verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
