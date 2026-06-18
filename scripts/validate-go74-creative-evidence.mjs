import { readFileSync } from "node:fs";

const narrative = readFileSync("src/utils/creativeRecommendationNarrative.ts", "utf8");
const options = readFileSync("src/components/dashboard/DashOptimisations.tsx", "utf8");
const actions = readFileSync("src/components/dashboard/DashActions.tsx", "utf8");
const checks = [];

function check(name, condition, detail) {
  checks.push({ name, condition, detail });
}

check(
  "recommendations expose an evidence field",
  narrative.includes("evidenceFr") && narrative.includes("evidenceEn"),
  "recommendations must explain which observed signal triggered them"
);
check(
  "creative evidence links selected and suggested tools",
  narrative.includes("complète son usage au lieu de le remplacer") &&
    narrative.includes("extends its use instead of replacing it"),
  "the user must know whether a recommendation complements or replaces"
);
check(
  "optional ideas display their trigger",
  options.includes("narrative.evidenceFr") && options.includes("narrative.evidenceEn"),
  "the evidence should be visible where the recommendation is read"
);
check(
  "action plan keeps the recommendation evidence",
  actions.includes("narrative.evidenceFr") && actions.includes("narrative.evidenceEn"),
  "the rationale must survive when the idea becomes an action"
);

for (const item of checks) {
  console.log(`[${item.condition ? "OK" : "FAIL"}] ${item.name}`);
  if (!item.condition) console.log(`     ${item.detail}`);
}

const failed = checks.filter((item) => !item.condition).length;
console.log("");
console.log(`GO74 creative evidence verdict: ${failed ? "FAIL" : "PASS"}`);
console.log(`Checks: ${checks.length}, failed: ${failed}`);
if (failed) process.exit(1);
