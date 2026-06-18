import { readFileSync } from "node:fs";

const DISCOVERY = "src/components/diagnostic/DiagStep6Discovery.tsx";
const INSIGHTS = "src/utils/diagnosticInsights.ts";

const discovery = readFileSync(DISCOVERY, "utf8");
const insights = readFileSync(INSIGHTS, "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "creative discovery covers specialty-specific peripheral chains",
  discovery.includes("adaptive_creative_ui_handoff") &&
    discovery.includes("adaptive_creative_content_distribution") &&
    discovery.includes("adaptive_creative_studio_ops") &&
    discovery.includes("adaptive_creative_brand_system") &&
    discovery.includes("adaptive_creative_illustration_pipeline"),
  "GO65 should inspect the hidden workflow around each creative specialty"
);

ok(
  "creative discovery maps real peripheral tool families",
  discovery.includes("CREATIVE_UI_HANDOFF_IDS") &&
    discovery.includes("CREATIVE_CONTENT_DISTRIBUTION_IDS") &&
    discovery.includes("CREATIVE_STUDIO_OPS_IDS") &&
    discovery.includes("CREATIVE_BRAND_SYSTEM_IDS") &&
    discovery.includes("CREATIVE_ILLUSTRATION_PIPELINE_IDS") &&
    discovery.includes("webflow-framer") &&
    discovery.includes("metricool") &&
    discovery.includes("brandpad") &&
    discovery.includes("adobe-substance-3d"),
  "questions should reference actual plugin/add-on/distribution/ops ecosystems"
);

ok(
  "creative questions stay tied to the selected specialty",
  discovery.includes('session.primarySpecialty === "ui_product"') &&
    discovery.includes('session.primarySpecialty === "content_social"') &&
    discovery.includes('session.primarySpecialty === "creative_ops"') &&
    discovery.includes('session.primarySpecialty === "brand_identity"') &&
    discovery.includes('session.primarySpecialty === "illustration_3d"'),
  "we should not ask every creative the same peripheral questions"
);

ok(
  "insights translate creative discovery into concrete focus areas",
  insights.includes("buildCreativeFocusArea") &&
    insights.includes("adaptive_creative_figma_plugins") &&
    insights.includes("adaptive_creative_motion_plugins") &&
    insights.includes("adaptive_creative_photo_delivery") &&
    insights.includes("adaptive_creative_ui_handoff") &&
    insights.includes("adaptive_creative_content_distribution") &&
    insights.includes("adaptive_creative_studio_ops"),
  "the final report should reuse creative discovery signals instead of forgetting them"
);

ok(
  "creative focus areas talk about plugins, handoff, distribution and ops",
  insights.includes("Structurer Figma autour des plugins") &&
    insights.includes("Fiabiliser le handoff UI") &&
    insights.includes("Relier production et diffusion") &&
    insights.includes("Structurer l'operationnel creatif") &&
    insights.includes("Securiser le pipeline illustration / 3D"),
  "GO65 should turn specialty answers into actionable workflow reads"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO65 creative peripheral workflow verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
