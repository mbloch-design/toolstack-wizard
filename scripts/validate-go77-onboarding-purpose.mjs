import { readFileSync } from "node:fs";

const profile = readFileSync("src/components/diagnostic/DiagStepProfileGoal.tsx", "utf8");
const preVerdict = readFileSync("src/components/diagnostic/DiagStepPreVerdict.tsx", "utf8");
const checks = [];

function check(name, condition, detail) {
  checks.push({ name, condition, detail });
}

check(
  "personalization is not a standalone onboarding step",
  !profile.includes('"details"') &&
    !profile.includes("Deux détails utiles, mais optionnels."),
  "optional identity and financial data should not block the core task"
);
check(
  "early contact capture is removed",
  !profile.includes("diagnostic-email-early") &&
    !profile.includes("Ton prénom"),
  "the user has not received enough value yet to justify contact collection"
);
check(
  "day-rate scoring is not requested before stack capture",
  !profile.includes("TJM_OPTIONS") &&
    !profile.includes("Ton tarif jour"),
  "a secondary financial estimate should not delay tool selection"
);
check(
  "the goal leads directly to stack capture",
  profile.includes('profileStep === "goal" ? t("Ajouter mes outils", "Add my tools")'),
  "the CTA should make the next task explicit"
);
check(
  "email remains available when the report is ready",
  preVerdict.includes("diagnostic-report-email-inline") &&
    preVerdict.includes("M’envoyer une copie du rapport"),
  "email capture should remain available at the moment of clear value"
);

for (const item of checks) {
  console.log(`[${item.condition ? "OK" : "FAIL"}] ${item.name}`);
  if (!item.condition) console.log(`     ${item.detail}`);
}

const failed = checks.filter((item) => !item.condition).length;
console.log("");
console.log(`GO77 onboarding purpose verdict: ${failed ? "FAIL" : "PASS"}`);
console.log(`Checks: ${checks.length}, failed: ${failed}`);
if (failed) process.exit(1);
