#!/usr/bin/env node
import { readFileSync } from "node:fs";

const files = {
  roadmap: "ROADMAP_DIAGNOSTIC.md",
  handoff: "AI_HANDOFF.md",
  protocol: "docs/diagnostic/PHASE4_PRIVATE_BETA_PROTOCOL.md",
  panel: "docs/diagnostic/PHASE4_RECRUITMENT_PANEL.md",
  grid: "docs/diagnostic/PHASE4_OBSERVATION_GRID.md",
  decision: "docs/diagnostic/PHASE4_G4_PREP_DECISION.md",
  sessionLog: "docs/diagnostic/PHASE4_BETA_SESSIONS.json",
  g4Decision: "docs/diagnostic/PHASE4_G4_DECISION.md",
  recruitmentKit: "docs/diagnostic/PHASE4B_RECRUITMENT_KIT.md",
  sessionScript: "docs/diagnostic/PHASE4B_SESSION_SCRIPT.md",
  waveTracker: "docs/diagnostic/PHASE4B_WAVE1_TRACKER.md",
  sessionTemplate: "docs/diagnostic/PHASE4B_SESSION_LOG_TEMPLATE.json",
  consentBrief: "docs/diagnostic/PHASE4B_CONSENT_AND_PRIVACY_BRIEF.md",
  followups: "docs/diagnostic/PHASE4B_FOLLOWUP_MESSAGES.md",
  operationsProtocol: "docs/diagnostic/PHASE4C_BETA_OPERATIONS_PROTOCOL.md",
  candidatePipeline: "docs/diagnostic/PHASE4B_CANDIDATE_PIPELINE.json",
  waveSynthesis: "docs/diagnostic/PHASE4C_WAVE1_SYNTHESIS_TEMPLATE.md",
  sessionLogValidator: "scripts/validate-phase4-session-log.mjs",
  waveSummarizer: "scripts/summarize-phase4-wave.mjs",
  dryRunTests: "src/test/diagnostic/phase4BetaReadiness.spec.tsx",
  g4Assessment: "scripts/assess-phase4-g4.mjs",
  packageJson: "package.json",
};

const content = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readFileSync(file, "utf8")]),
);

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "Phase 4 protocol defines real-user beta scope",
  content.protocol.includes("stacks réelles") &&
    content.protocol.includes("12 sessions minimum") &&
    content.protocol.includes("Phase 4 préparée, G4 non accepté") &&
    content.protocol.includes("ne pas ouvrir Tech, Conseil, Content ou Ops"),
  "Phase 4 must be a field beta, not an internal validation",
);

ok(
  "G4 metrics are measurable and thresholded",
  content.protocol.includes("Diagnostic actionnable") &&
    content.protocol.includes("≥ 70 %") &&
    content.protocol.includes("Fidélité perçue") &&
    content.protocol.includes("≤ 8 minutes") &&
    content.protocol.includes("P0 ouverts"),
  "Protocol must carry the G4 thresholds",
);

ok(
  "recruitment panel covers six creative families",
  [
    "UI / produit numérique",
    "Identité / illustration / édition",
    "Photo / retouche",
    "Vidéo / motion",
    "3D / espaces",
    "Social / audio / contenu court",
  ].every((segment) => content.panel.includes(segment)),
  "Panel must cover the whole creative pilot perimeter",
);

ok(
  "recruitment mix covers Adobe, non-Adobe, AI and contract uncertainty",
  content.panel.includes("stacks Adobe fortes") &&
    content.panel.includes("stacks non-Adobe") &&
    content.panel.includes("utilisateurs IA intensifs") &&
    content.panel.includes("incertaines sur leurs contrats") &&
    content.panel.includes("usages atypiques"),
  "Panel must force the hard cases already seen in phases 1-3",
);

ok(
  "observation grid captures journey, restitution, trust and costs",
  content.grid.includes("Chronométrage") &&
    content.grid.includes("Fidélité de cartographie") &&
    content.grid.includes("Lecture de la restitution") &&
    content.grid.includes("Confiance et preuves") &&
    content.grid.includes("Vérification manuelle stack/coûts"),
  "Grid must be useful in live moderated sessions",
);

ok(
  "observation grid preserves capture versus recommendation distinction",
  content.grid.includes("Recommandation perçue pendant capture") &&
    content.grid.includes("outil déjà sélectionné redemandé") &&
    content.grid.includes("IA oubliée ou mal rattachée"),
  "Grid must observe the product risks raised by the user",
);

ok(
  "prep decision refuses to overclaim G4",
  content.decision.includes("Phase 4A prête pour recrutement. G4 non accepté.") &&
    content.decision.includes("Aucun participant réel Phase 4") &&
    content.decision.includes("La prochaine action produit n’est pas d’ajouter du code par défaut"),
  "Decision must authorize recruitment, not claim beta success",
);

ok(
  "roadmap records Phase 4 preparation status",
  content.roadmap.includes("Phase 4A prête pour recrutement") &&
    content.roadmap.includes("G4 non accepté") &&
    content.roadmap.includes("PHASE4_PRIVATE_BETA_PROTOCOL.md"),
  "Roadmap must point to active Phase 4 artifacts",
);

ok(
  "handoff preserves the next action and reserves",
  content.handoff.includes("Avancement Phase 4A") &&
    content.handoff.includes("G4 non accepté") &&
    content.handoff.includes("ne pas ouvrir Tech, Conseil, Content ou Ops") &&
    content.handoff.includes("premières sessions bêta"),
  "AI_HANDOFF.md must be sufficient after context loss",
);

ok(
  "package exposes validate:phase4",
  content.packageJson.includes('"validate:phase4": "node scripts/validate-phase4-readiness.mjs"'),
  "The readiness gate must be runnable",
);

ok(
  "Phase 4 dry-runs cover Social/Audio, restored rendering and PDF payload",
  content.dryRunTests.includes("Social/Audio dry-run") &&
    content.dryRunTests.includes("restored Social/Audio session") &&
    content.dryRunTests.includes("serializeDiagnosticResultForPdf") &&
    content.dryRunTests.includes("primaryDecisions.length"),
  "Dry-runs must protect the known Phase 4 reserves before real beta sessions",
);

ok(
  "G4 session log refuses to confuse dry-runs with real users",
  content.sessionLog.includes('"realSessions": []') &&
    content.sessionLog.includes('"internalDryRuns"') &&
    content.sessionLog.includes('"decision": "G4 non accepté"') &&
    content.sessionLog.includes("12 sessions réelles minimum non jouées"),
  "The beta log must make the absence of real users explicit",
);

ok(
  "G4 decision records the autonomous gate refusal",
  content.g4Decision.includes("G4 non accepté") &&
    content.g4Decision.includes("aucune session réelle Phase 4") &&
    content.g4Decision.includes("serializeDiagnosticResultForPdf") &&
    content.g4Decision.includes("La porte G4 reste **non acceptée**"),
  "The G4 decision must refuse overclaiming while documenting the work done",
);

ok(
  "G4 assessment script checks sessions, segments, metrics and open P0/P1",
  content.g4Assessment.includes("12 sessions réelles requises") &&
    content.g4Assessment.includes("missingSegments") &&
    content.g4Assessment.includes("actionableDiagnosticRate") &&
    content.g4Assessment.includes("openP0Count") &&
    content.g4Assessment.includes("Verdict G4 : NON ACCEPTÉ") &&
    content.packageJson.includes('"assess:g4": "node scripts/assess-phase4-g4.mjs"'),
  "The G4 gate must be assessable without pretending it has passed",
);

ok(
  "Phase 4B recruitment kit is ready to send",
  content.recruitmentKit.includes("Message d’invitation court") &&
    content.recruitmentKit.includes("Screener prêt à envoyer") &&
    content.recruitmentKit.includes("Social / audio / contenu court") &&
    content.recruitmentKit.includes("Message de confirmation") &&
    content.recruitmentKit.includes("Message de relance"),
  "Recruitment must be operational, not only strategic",
);

ok(
  "Phase 4B moderation script preserves observation discipline",
  content.sessionScript.includes("observer avant d’expliquer") &&
    content.sessionScript.includes("Le modérateur ne doit pas") &&
    content.sessionScript.includes("Lecture de la restitution") &&
    content.sessionScript.includes("Classification à chaud"),
  "The moderator script must prevent coaching the participant",
);

ok(
  "Phase 4B wave tracker defines first six sessions and quotas",
  content.waveTracker.includes("B4-01") &&
    content.waveTracker.includes("B4-06") &&
    content.waveTracker.includes("Segments couverts") &&
    content.waveTracker.includes("Mobile/petit écran") &&
    content.waveTracker.includes("Règle de correction vague 1"),
  "Wave 1 must be schedulable and measurable",
);

ok(
  "Phase 4B session log template can feed assess:g4",
  content.sessionTemplate.includes('"completed"') &&
    content.sessionTemplate.includes('"preVerdictMinutes"') &&
    content.sessionTemplate.includes('"mappingFidelityScore"') &&
    content.sessionTemplate.includes('"actionableDiagnostic"') &&
    content.sessionTemplate.includes('"recommendationPerceivedDuringCapture"') &&
    content.sessionTemplate.includes('"issues"'),
  "Session entries must carry the fields used by the G4 assessor",
);

ok(
  "Phase 4B consent and follow-up messages are prepared",
  content.consentBrief.includes("tu peux arrêter à tout moment") &&
    content.consentBrief.includes("Ne pas demander") &&
    content.followups.includes("Remerciement après session") &&
    content.followups.includes("Recontact après correction"),
  "Real sessions need consent and post-session operations",
);

ok(
  "Phase 4C operations protocol protects beta data quality",
  content.operationsProtocol.includes("Phase 4C rend la bêta exploitable") &&
    content.operationsProtocol.includes("Ce qui compte comme session réelle") &&
    content.operationsProtocol.includes("Ne sont pas des sessions réelles") &&
    content.operationsProtocol.includes("Aucune métrique ne doit être inventée") &&
    content.operationsProtocol.includes("G4 reste non accepté"),
  "Operations must prevent confusing recruitment, dry-runs and real beta evidence",
);

ok(
  "Phase 4C candidate pipeline is empty, private and quota-driven",
  content.candidatePipeline.includes('"noPersonalDataInRepository": true') &&
    content.candidatePipeline.includes('"candidates": []') &&
    ["B4-01", "B4-02", "B4-03", "B4-04", "B4-05", "B4-06"].every((slot) => content.candidatePipeline.includes(slot)) &&
    content.candidatePipeline.includes('"regularOrIntensiveAi": 2') &&
    content.candidatePipeline.includes('"atypicalUsage": 1'),
  "The candidate pipeline must organize recruitment without fake participants or personal data",
);

ok(
  "Phase 4C wave synthesis template supports post-session arbitration",
  content.waveSynthesis.includes("aucune métrique ne doit être inventée") &&
    content.waveSynthesis.includes("Confusion capture / recommandation") &&
    content.waveSynthesis.includes("Problèmes P0/P1 à traiter avant vague 2") &&
    content.waveSynthesis.includes("Décision vague 2"),
  "Wave 1 needs a comparable synthesis before corrections or expansion",
);

ok(
  "Phase 4C session log validator and summarizer are exposed",
  content.sessionLogValidator.includes("No real beta sessions recorded yet") &&
    content.sessionLogValidator.includes("recommendationPerceivedDuringCapture") &&
    content.sessionLogValidator.includes("manualVerification") &&
    content.waveSummarizer.includes("Aucune session réelle enregistrée") &&
    content.waveSummarizer.includes("G4 reste non accepté") &&
    content.packageJson.includes('"validate:phase4:sessions": "node scripts/validate-phase4-session-log.mjs"') &&
    content.packageJson.includes('"summarize:phase4": "node scripts/summarize-phase4-wave.mjs"'),
  "Session operations must be runnable without manually inspecting JSON",
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`Phase 4 readiness verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
