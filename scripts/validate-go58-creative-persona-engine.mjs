import { readFileSync } from "node:fs";

const STACK_SCAN = "src/components/diagnostic/DiagStepStackScan.tsx";
const DISCOVERY = "src/components/diagnostic/DiagStep6Discovery.tsx";

const stackScan = readFileSync(STACK_SCAN, "utf8");
const discovery = readFileSync(DISCOVERY, "utf8");

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
  "persona switch drives selector moments",
  stackScan.includes("getStackMomentsForPersona") &&
    stackScan.includes('persona === "SOFIA" ? CREATIVE_STACK_MOMENTS : STACK_MOMENTS') &&
    stackScan.includes("getStackMomentsForPersona(session.persona)") &&
    stackScan.includes('session.persona === "SOFIA" ? 8 : 6'),
  "creative profiles should see a richer but still bounded set of suggestions"
);

ok(
  "creative adaptive questions exist",
  discovery.includes("buildCreativeQuestions") &&
    discovery.includes('session.persona !== "SOFIA"') &&
    discovery.includes("adaptive_creative_figma_plugins") &&
    discovery.includes("adaptive_creative_ai_visual_overlap") &&
    discovery.includes("adaptive_creative_resources_rights") &&
    discovery.includes("adaptive_creative_motion_plugins") &&
    discovery.includes("adaptive_creative_photo_delivery"),
  "the verification step must ask creative-specific questions when the stack implies them"
);

ok(
  "creative questions reason about workflow satellites",
  discovery.includes("CREATIVE_FIGMA_PLUGIN_IDS") &&
    discovery.includes("CREATIVE_RESOURCE_IDS") &&
    discovery.includes("CREATIVE_MOTION_PLUGIN_IDS") &&
    discovery.includes("CREATIVE_PHOTO_DELIVERY_IDS") &&
    discovery.includes("tokens, icônes ou accessibilité") &&
    discovery.includes("templates, fonts, icônes, mockups et droits"),
  "questions should inspect the hidden workflow around the obvious tools"
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
