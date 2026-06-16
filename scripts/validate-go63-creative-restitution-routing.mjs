import { readFileSync } from "node:fs";

const COPY = "src/utils/creativeSpecialty.ts";
const DISCOVERY = "src/components/diagnostic/DiagStep6Discovery.tsx";
const PRE_VERDICT = "src/components/diagnostic/DiagStepPreVerdict.tsx";
const DASHBOARD = "src/components/dashboard/DiagDashboard.tsx";
const OVERVIEW = "src/components/dashboard/DashOverview.tsx";

const copy = readFileSync(COPY, "utf8");
const discovery = readFileSync(DISCOVERY, "utf8");
const preVerdict = readFileSync(PRE_VERDICT, "utf8");
const dashboard = readFileSync(DASHBOARD, "utf8");
const overview = readFileSync(OVERVIEW, "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "creative specialty copy covers every craft",
  copy.includes("CREATIVE_SPECIALTY_READS") &&
    copy.includes("brand_identity") &&
    copy.includes("ui_product") &&
    copy.includes("motion_video") &&
    copy.includes("photo_retouch") &&
    copy.includes("content_social") &&
    copy.includes("illustration_3d") &&
    copy.includes("creative_ops") &&
    copy.includes("getCreativeSpecialtyCopy"),
  "one shared copy map should drive the UX language"
);

ok(
  "discovery asks a specialty-aware clarification",
  discovery.includes("getCreativeSpecialtyCopy(session.primarySpecialty)") &&
    discovery.includes("adaptive_creative_") &&
    discovery.includes("_focus") &&
    discovery.includes("specialty.discoveryQuestionFr") &&
    discovery.includes("specialty.discoveryOptions.map"),
  "useful questions should not stay generic for every creative profile"
);

ok(
  "pre-verdict reads the selected creative craft",
  preVerdict.includes("getCreativeSpecialtyCopy(session.primarySpecialty)") &&
    preVerdict.includes("creativeSpecialty.preVerdictTitleFr") &&
    preVerdict.includes("creativeSpecialty.preVerdictDescriptionFr") &&
    preVerdict.includes("creativeSpecialty.preVerdictCards.map"),
  "the page before restitution must explain the right craft lens"
);

ok(
  "dashboard sidebar uses craft-specific language",
  dashboard.includes("getCreativeSpecialtyCopy(result.sessionState.primarySpecialty)") &&
    dashboard.includes("specialty.sidebarLabelFr") &&
    dashboard.includes("specialty.sidebarDetailFr"),
  "the restitution sidebar should not say only Angle creatif"
);

ok(
  "overview thesis and reading path use craft-specific story",
  overview.includes("getCreativeSpecialtyCopy(result.sessionState.primarySpecialty)") &&
    overview.includes("specialty.thesisFluidFr") &&
    overview.includes("specialty.thesisCoreFr") &&
    overview.includes("creativeSpecialty.readingSteps.map") &&
    overview.includes("creativeSpecialty.chainTitleFr") &&
    overview.includes("creativeSpecialty.labelFr"),
  "the final report should preserve the same story from onboarding to restitution"
);

for (const item of checks) {
  console.log("[" + item.status + "] " + item.name);
  if (item.details && item.status !== "OK") console.log("     " + item.details);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log("GO63 creative restitution routing verdict: " + (failed.length === 0 ? "PASS" : "FAIL"));
console.log("Checks: " + checks.length + ", failed: " + failed.length);

if (failed.length > 0) process.exit(1);
