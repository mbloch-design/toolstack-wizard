import { readFileSync } from "node:fs";

const PROFILE = "src/components/diagnostic/DiagStepProfileGoal.tsx";
const STACK_SCAN = "src/components/diagnostic/DiagStepStackScan.tsx";
const TYPES = "src/types/diagnostic.ts";

const profile = readFileSync(PROFILE, "utf8");
const stackScan = readFileSync(STACK_SCAN, "utf8");
const types = readFileSync(TYPES, "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "creative specialty is persisted on the diagnostic session",
  types.includes("export type CreativeSpecialty") &&
    types.includes('"brand_identity"') &&
    types.includes('"ui_product"') &&
    types.includes('"motion_video"') &&
    types.includes('primarySpecialty?: CreativeSpecialty | string'),
  "the selected craft must survive resume, preprod capture and restitution"
);

ok(
  "creative onboarding asks the craft only for creative users",
  profile.includes("CREATIVE_SPECIALTIES") &&
    profile.includes('profileStep === "specialty"') &&
    profile.includes('persona === "SOFIA"') &&
    profile.includes('primarySpecialty: persona === "SOFIA" ? primarySpecialty : undefined') &&
    profile.includes('"motion_video"') &&
    profile.includes('"photo_retouch"') &&
    profile.includes('"creative_ops"'),
  "SOFIA needs a second layer; other personas should not pay that extra question"
);

ok(
  "creative specialty reorders the capture path",
  stackScan.includes("CREATIVE_SPECIALTY_CONFIG") &&
    stackScan.includes("orderMomentsForCreativeSpecialty") &&
    stackScan.includes("getCreativeSpecialty(primarySpecialty)") &&
    stackScan.includes("getStackMomentsForPersona(session.persona, session.primarySpecialty)") &&
    stackScan.indexOf('motion_video: {') < stackScan.indexOf('photo_retouch: {'),
  "motion, photo, UI and creative ops should not all start with the same priorities"
);

ok(
  "specialties boost peripheral and plugin suggestions",
  stackScan.includes("getCreativeSpecialtyToolIds") &&
    stackScan.includes("specialtyToolIds.has(tool.id)") &&
    stackScan.includes('"figma-iconify"') &&
    stackScan.includes('"figma-tokens"') &&
    stackScan.includes('"ae-animation-composer"') &&
    stackScan.includes('"motion-bro"') &&
    stackScan.includes('"pixieset"') &&
    stackScan.includes('"rightfont"') &&
    stackScan.includes('"fontbase"'),
  "the value is in the less obvious satellites, add-ons, licenses and delivery tools"
);

ok(
  "generic users keep the simpler selector",
  stackScan.includes('if (persona !== "SOFIA") return STACK_MOMENTS') &&
    stackScan.includes('session.persona === "SOFIA" ? 8 : 6'),
  "the specialist depth should not make non-creative users work harder"
);

for (const item of checks) {
  console.log("[" + item.status + "] " + item.name);
  if (item.details && item.status !== "OK") console.log("     " + item.details);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log("GO62 creative specialty routing verdict: " + (failed.length === 0 ? "PASS" : "FAIL"));
console.log("Checks: " + checks.length + ", failed: " + failed.length);

if (failed.length > 0) process.exit(1);
