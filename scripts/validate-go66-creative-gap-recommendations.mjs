import { readFileSync } from "node:fs";

const SCORING = "src/utils/scoring.ts";

const scoring = readFileSync(SCORING, "utf8");
const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "creative recommendation families exist for each specialty",
  scoring.includes("CREATIVE_RECOMMENDATION_FAMILIES") &&
    scoring.includes("ui_product") &&
    scoring.includes("brand_identity") &&
    scoring.includes("motion_video") &&
    scoring.includes("photo_retouch") &&
    scoring.includes("content_social") &&
    scoring.includes("illustration_3d") &&
    scoring.includes("creative_ops"),
  "GO66 should map each creative specialty to missing adjacent tools"
);

ok(
  "gap recommendation ids are built from selected tools and specialty",
  scoring.includes("buildCreativeGapRecommendationIds") &&
    scoring.includes("triggerIds") &&
    scoring.includes("missingIds") &&
    scoring.includes("filter((id) => !selectedIds.has(id))"),
  "we should recommend only the missing satellite tools around the current stack"
);

ok(
  "recommendations prioritize missing creative workflow links",
  scoring.includes("creativeGapRecommendationIds.has(t.id)") &&
    scoring.includes("gapFit") &&
    scoring.includes("b.gapFit - a.gapFit") &&
    scoring.includes("s.gapFit === 1 || s.score.scoreFinal > 60"),
  "creative gap tools should outrank generic catalog suggestions"
);

ok(
  "real peripheral ecosystems are represented",
  scoring.includes("figma-tokens") &&
    scoring.includes("frame-io") &&
    scoring.includes("brevo") &&
    scoring.includes("brandpad") &&
    scoring.includes("adobe-substance-3d") &&
    scoring.includes("metricool"),
  "the recommendation engine should cover actual creative satellites, not just generic software"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO66 creative gap recommendations verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
