import { readFileSync } from "node:fs";

const STACK_SCAN = "src/components/diagnostic/DiagStepStackScan.tsx";
const SAVE_INDICATOR = "src/components/diagnostic/DiagSaveIndicator.tsx";
const TRANSITION = "src/components/diagnostic/DiagTransitionOverlay.tsx";

const stackScan = readFileSync(STACK_SCAN, "utf8");
const saveIndicator = readFileSync(SAVE_INDICATOR, "utf8");
const transition = readFileSync(TRANSITION, "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "search and manual state reset on each zone",
  stackScan.includes("setSearch(\"\")") &&
    stackScan.includes("setShowCatalog(false)") &&
    stackScan.includes("setCustomName(\"\")") &&
    stackScan.includes("setCustomPrice(\"\")") &&
    stackScan.includes("setCustomCurrency(\"\")"),
  "zone change should reset search/manual add state"
);
ok(
  "question area remounts per zone",
  stackScan.includes("key={activeMoment.id}") && stackScan.includes("slide-in-from-bottom-2"),
  "active zone should visually feel like a new request"
);
ok(
  "search label is contextual",
  stackScan.includes("Chercher pour ${activeMoment.fr.toLowerCase()}") &&
    stackScan.includes("Search for ${activeMoment.en.toLowerCase()}"),
  "search label should be tied to the current area"
);
ok(
  "new question receives focus",
  stackScan.includes("questionRef.current?.focus()"),
  "new zone heading should receive focus for continuity"
);
ok(
  "autosave copy is localized",
  saveIndicator.includes("Enregistré") && !saveIndicator.includes("Auto-saved"),
  "autosave indicator should not show English copy in FR"
);
ok(
  "transition overlay uses design-system icon",
  transition.includes("import { Search }") && transition.includes("<Search") && !transition.includes("🔍"),
  "transition overlay should use lucide icon instead of emoji"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO50 funnel fluidity verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
