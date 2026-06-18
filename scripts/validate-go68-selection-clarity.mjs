import { readFileSync } from "node:fs";

const PACKAGE = "package.json";
const STACK_SCAN = "src/components/diagnostic/DiagStepStackScan.tsx";

const pkg = readFileSync(PACKAGE, "utf8");
const stackScan = readFileSync(STACK_SCAN, "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "package exposes GO68 validation",
  pkg.includes("\"validate:go68\""),
  "GO68 needs a dedicated validation entry"
);

ok(
  "selection flow cue exists",
  stackScan.includes("function SelectionFlowCue") &&
    stackScan.includes("Choisis un outil") &&
    stackScan.includes("Précise le mode") &&
    stackScan.includes("Il rejoint ta stack"),
  "the stack selector should make the 3-step interaction visible before the first click"
);

ok(
  "pending inline hint explains the next action",
  stackScan.includes("function PendingInlineHint") &&
    stackScan.includes("Étape 2 en cours") &&
    stackScan.includes("la carte en surbrillance"),
  "once a tool is clicked, the UI should explicitly explain what to do next"
);

ok(
  "tool cards clearly explain what the first click does",
  stackScan.includes("1. Choisir cet outil") &&
    stackScan.includes("le mode s’ouvre juste ici") &&
    stackScan.includes("Choisis maintenant le mode"),
  "the card itself should remove the ambiguity around the first click"
);

ok(
  "next area CTA waits for the pending tool to be completed",
  stackScan.includes("Termine cet ajout d’abord") &&
    stackScan.includes("disabled={selectedInActiveMoment === 0 || Boolean(pendingTool)}"),
  "users should not be pushed forward while one tool is half-selected"
);

ok(
  "pending tool scrolls back into focus",
  stackScan.includes("function scrollCardIntoView") &&
    stackScan.includes("scrollIntoView({ behavior: \"smooth\", block: \"center\""),
  "opening a plan chooser should keep the active card in view"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO68 selection clarity verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
