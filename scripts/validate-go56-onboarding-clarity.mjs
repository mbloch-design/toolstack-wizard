import { readFileSync } from "node:fs";

const PROFILE = "src/components/diagnostic/DiagStepProfileGoal.tsx";
const TOPBAR = "src/components/diagnostic/DiagTopBar.tsx";
const APP = "src/App.tsx";

const profile = readFileSync(PROFILE, "utf8");
const topbar = readFileSync(TOPBAR, "utf8");
const app = readFileSync(APP, "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "onboarding asks one plain question first",
  profile.includes("Tu fais surtout quoi au quotidien ?") &&
    profile.includes("Tu veux améliorer quoi en priorité ?") &&
    profile.includes("Deux détails utiles, mais optionnels."),
  "first screen should read like a guided conversation, not a setup dashboard"
);

ok(
  "profile choices are compact single-column rows",
  profile.includes("max-w-3xl gap-2") &&
    profile.includes("grid-cols-[40px_1fr_24px]") &&
    profile.includes("min-h-[72px]"),
  "persona selection should be scan-friendly and avoid oversized cards"
);

ok(
  "repetitive side explanation panel is removed",
  !profile.includes("ProfileContextPanel") &&
    !profile.includes("Promesse de cette étape") &&
    !profile.includes("Pourquoi maintenant"),
  "the first step should not repeat the selected answer in a sticky side panel"
);

ok(
  "onboarding keeps a small local progress affordance",
  profile.includes("[0, 1, 2].map") && profile.includes("stepIndex + 1}/3"),
  "the user should know this calibration has only three short parts"
);

ok(
  "audit topbar is not a second navigation",
  !topbar.includes("stages.map") &&
    !topbar.includes("On calibre, on capte, on vérifie") &&
    !topbar.includes("font-bold text-foreground text-sm\">tooltrim"),
  "global navigation already exists; the audit bar should stay quiet"
);

ok(
  "audit topbar preserves progress and stack context",
  topbar.includes("stageLabel") &&
    topbar.includes("progressPercent") &&
    topbar.includes("session.selectedTools.length") &&
    topbar.includes("totalCostLabel"),
  "simplifying the bar must not remove orientation or stack context"
);

ok(
  "diagnostic route uses focused shell",
  app.includes("isDiagnosticFocusRoute") &&
    app.includes("!isDiagnosticFocusRoute && <Navbar />") &&
    app.includes("!isDiagnosticFocusRoute && <Footer />") &&
    app.includes('isDiagnosticFocusRoute ? "" : "pt-[68px]"'),
  "the guided audit should not inherit the full editorial site chrome"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO56 onboarding clarity verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
