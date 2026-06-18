import { readFileSync } from "node:fs";

const PACKAGE = "package.json";
const NARRATIVE = "src/utils/creativeRecommendationNarrative.ts";
const OPTIMISATIONS = "src/components/dashboard/DashOptimisations.tsx";
const ACTIONS = "src/components/dashboard/DashActions.tsx";
const SCORING = "src/utils/scoring.ts";

const pkg = readFileSync(PACKAGE, "utf8");
const narrative = readFileSync(NARRATIVE, "utf8");
const optimisations = readFileSync(OPTIMISATIONS, "utf8");
const actions = readFileSync(ACTIONS, "utf8");
const scoring = readFileSync(SCORING, "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "package exposes GO67 validation",
  pkg.includes("\"validate:go67\""),
  "GO67 needs its own validation entry"
);

ok(
  "creative narrative helper maps workflow gaps",
  narrative.includes("buildCreativeRecommendationNarrative") &&
    narrative.includes("fluidifier le handoff produit") &&
    narrative.includes("tenir la cadence de publication") &&
    narrative.includes("piloter la rentabilité créative"),
  "recommendations should explain the missing workflow link, not only the tool name"
);

ok(
  "scoring shares the creative recommendation families",
  scoring.includes("export const CREATIVE_RECOMMENDATION_FAMILIES"),
  "GO67 should reuse the same family map as GO66"
);

ok(
  "optimisations use the creative narrative instead of a generic persona reason",
  optimisations.includes("buildCreativeRecommendationNarrative") &&
    optimisations.includes("narrative.badgeFr") &&
    optimisations.includes("narrative.reasonFr") &&
    !optimisations.includes("const PERSONA_REASONS"),
  "the optional recommendation cards should tell users why the tool appears now"
);

ok(
  "actions use the same narrative for month recommendations",
  actions.includes("buildCreativeRecommendationNarrative") &&
    actions.includes("narrative.actionTitleFr") &&
    actions.includes("narrative.detailFr"),
  "the action plan should keep the same story as the recommendation cards"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO67 creative recommendation narrative verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
