import { readFileSync } from "node:fs";

const PRE_VERDICT = "src/components/diagnostic/DiagStepPreVerdict.tsx";
const DASHBOARD = "src/components/dashboard/DiagDashboard.tsx";
const OVERVIEW = "src/components/dashboard/DashOverview.tsx";

const preVerdict = readFileSync(PRE_VERDICT, "utf8");
const dashboard = readFileSync(DASHBOARD, "utf8");
const overview = readFileSync(OVERVIEW, "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "pre-verdict has a creative-specific final step",
  preVerdict.includes('session.persona === "SOFIA"') &&
    preVerdict.includes("Ta chaîne créative est prête à lire") &&
    preVerdict.includes("Lecture créative retenue") &&
    preVerdict.includes("Production") &&
    preVerdict.includes("Satellites") &&
    preVerdict.includes("Validation"),
  "the last step should prepare creative users for a workflow read, not a generic score"
);

ok(
  "pre-verdict counts creative production, satellites and delivery",
  preVerdict.includes("classifyCreativeWorkflowTools") &&
    preVerdict.includes("creativeWorkflow.produce.length") &&
    preVerdict.includes("creativeWorkflow.accelerate.length") &&
    preVerdict.includes("creativeWorkflow.publish.length") &&
    preVerdict.includes("creativeWorkflow.review.length") &&
    preVerdict.includes("aiAnalysis.capabilityCount"),
  "creative pre-verdict should surface the key workflow dimensions"
);

ok(
  "overview thesis adapts to creative persona",
  overview.includes('result.sessionState.persona === "SOFIA"') &&
    overview.includes("fluidité de ta chaîne créative") &&
    overview.includes("ressources, la diffusion, les validations"),
  "the final report should not tell the same story to every persona"
);

ok(
  "overview has a creative workflow map",
  overview.includes("CREATIVE_STAGE_DEFS") &&
    overview.includes("getCreativeWorkflowStages") &&
    overview.includes("CreativeWorkflowCard") &&
    overview.includes("Ta stack comme une chaîne de production") &&
    overview.includes("plugins, assets, diffusion, archives, validation et licences"),
  "restitution should explain the creative stack as a production chain"
);

ok(
  "creative workflow covers production, acceleration, review and rights",
  overview.includes('id: "produce"') &&
    overview.includes('id: "accelerate"') &&
    overview.includes('id: "review"') &&
    overview.includes('id: "publish"') &&
    overview.includes('id: "secure"') &&
    overview.includes("classifyCreativeWorkflowTools") &&
    overview.includes("Licences, droits d’usage, plans payés et coûts à préciser"),
  "workflow stages should include obvious tools and hidden peripheral tools"
);

ok(
  "dashboard sidebar carries the persona angle",
  dashboard.includes("getPersonaSidebarCopy") &&
    dashboard.includes("Angle créatif") &&
    dashboard.includes("Production, plugins, ressources, validation, licences.") &&
    dashboard.includes("sidebarPersona.detail"),
  "the restitution shell should remind users which lens is applied"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO59 creative restitution verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
