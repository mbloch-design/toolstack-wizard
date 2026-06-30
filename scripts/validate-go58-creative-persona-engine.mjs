import { readFileSync } from "node:fs";

const STACK_SCAN = "src/components/diagnostic/DiagStepStackScan.tsx";
const DISCOVERY = "src/components/diagnostic/DiagStep6Discovery.tsx";
const ENGINE = "src/lib/creativeAdaptiveEngine.ts";
const SCORING = "src/utils/scoring.ts";

const stackScan = readFileSync(STACK_SCAN, "utf8");
const discovery = readFileSync(DISCOVERY, "utf8");
const engine = readFileSync(ENGINE, "utf8");
const scoring = readFileSync(SCORING, "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "creative persona has its own stack map",
  stackScan.includes("CREATIVE_STACK_MOMENTS") &&
    stackScan.includes("creative-brief-assets") &&
    stackScan.includes("creative-design-core") &&
    stackScan.includes("creative-plugins-resources") &&
    stackScan.includes("creative-client-review") &&
    stackScan.includes("creative-admin-rights"),
  "SOFIA should not reuse the generic selector map"
);

ok(
  "creative selector covers peripheral tools and plugins",
  stackScan.includes("figma-iconify") &&
    stackScan.includes("figma-tokens") &&
    stackScan.includes("figma-stark") &&
    stackScan.includes("ae-bodymovin") &&
    stackScan.includes("lottiefiles") &&
    stackScan.includes("dynamic-mockups") &&
    stackScan.includes("envato-elements") &&
    stackScan.includes("fontbase") &&
    stackScan.includes("rightfont") &&
    stackScan.includes("noun-project"),
  "the creative audit must surface satellites, templates, plugins, font managers, mockups and asset sources"
);

ok(
  "creative parent tools unlock contextual satellites",
  stackScan.includes("CREATIVE_PARENT_RELATIONS") &&
    stackScan.includes("getCreativeContextualToolIds") &&
    stackScan.includes('parentIds: ["figma"]') &&
    stackScan.includes('parentIds: ["adobe-after-effects"]') &&
    stackScan.includes('parentIds: ["adobe-lightroom", "capture-one"]') &&
    stackScan.includes("contextualToolIds.has(tool.id)"),
  "selecting a core creative tool should influence the next satellite suggestions"
);

ok(
  "creative selector is adaptive and fatigue-bounded",
  stackScan.includes("getStackMomentsForPersona") &&
    stackScan.includes("planCreativeQuestions") &&
    stackScan.includes("DEFAULT_CREATIVE_QUESTION_BUDGET") &&
    stackScan.includes("deferredMoments") &&
    engine.includes("scoreCreativeQuestion"),
  "creative profiles should get the highest-impact questions first, with secondary areas deferred"
);

ok(
  "capture and recommendation are separate",
  !discovery.includes("questions.push(...buildCreativeQuestions(session, t))") &&
    stackScan.includes("Cartographie de l’existant") &&
    scoring.includes("computeCreativeRecommendationResult") &&
    scoring.includes("recommendationEvidence"),
  "creative ecosystem capture should not be repeated in discovery, and recommendations need evidence"
);

ok(
  "creative ecosystems follow normalized host relations",
  engine.includes("getToolRelations") &&
    engine.includes("relationToHost") &&
    engine.includes("getEcosystemToolIds") &&
    stackScan.includes("ToolRelationKind") &&
    stackScan.includes("customRelationKind"),
  "plugins, bundles, complements and unknown tools should attach to the actual selected host"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO58 creative persona engine verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
