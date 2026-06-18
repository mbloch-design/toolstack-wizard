import { readFileSync } from "node:fs";

const router = readFileSync("src/components/DiagnosticRouter.tsx", "utf8");
const backoffice = readFileSync("src/pages/BackOfficePage.tsx", "utf8");
const checks = [];

function check(name, condition, detail) {
  checks.push({ name, condition, detail });
}

check(
  "final context stores a decision summary",
  router.includes("decision_summary") &&
    router.includes("first_decision") &&
    router.includes("recommendation_names"),
  "back-office should not reconstruct the report conclusion manually"
);
check(
  "pricing uncertainty is visible to operations",
  router.includes("pricing_to_verify_count"),
  "uncertain prices must remain distinguishable from confirmed savings"
);
check(
  "session detail renders the decision summary",
  backoffice.includes("getSessionDecisionSummary") &&
    backoffice.includes("Résumé décisionnel") &&
    backoffice.includes("Première décision proposée"),
  "the operational view should expose the useful conclusion directly"
);

for (const item of checks) {
  console.log(`[${item.condition ? "OK" : "FAIL"}] ${item.name}`);
  if (!item.condition) console.log(`     ${item.detail}`);
}

const failed = checks.filter((item) => !item.condition).length;
console.log("");
console.log(`GO75 back-office summary verdict: ${failed ? "FAIL" : "PASS"}`);
console.log(`Checks: ${checks.length}, failed: ${failed}`);
if (failed) process.exit(1);
