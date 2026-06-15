import { readFileSync } from "node:fs";

const CSS = "src/index.css";
const ROUTER = "src/components/DiagnosticRouter.tsx";
const TOPBAR = "src/components/diagnostic/DiagTopBar.tsx";
const STACK = "src/components/diagnostic/DiagStepStackScan.tsx";
const PROFILE = "src/components/diagnostic/DiagStepProfileGoal.tsx";
const DISCOVERY = "src/components/diagnostic/DiagStep6Discovery.tsx";
const PRE_VERDICT = "src/components/diagnostic/DiagStepPreVerdict.tsx";
const LOADING = "src/components/diagnostic/DiagResultsLoading.tsx";
const DASHBOARD = "src/components/dashboard/DiagDashboard.tsx";

const css = readFileSync(CSS, "utf8");
const router = readFileSync(ROUTER, "utf8");
const topbar = readFileSync(TOPBAR, "utf8");
const stack = readFileSync(STACK, "utf8");
const profile = readFileSync(PROFILE, "utf8");
const discovery = readFileSync(DISCOVERY, "utf8");
const preVerdict = readFileSync(PRE_VERDICT, "utf8");
const loading = readFileSync(LOADING, "utf8");
const dashboard = readFileSync(DASHBOARD, "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "diagnostic mood is scoped and does not override the full site",
  css.includes(".diagnostic-mood") &&
    css.includes("--diag-bg") &&
    css.includes("--diag-yellow") &&
    css.includes(".diagnostic-shell") &&
    !css.includes(":root .diagnostic-mood"),
  "the warm dashboard mood must stay scoped to the audit tool"
);

ok(
  "router wraps funnel and restitution in the product shell",
  router.includes("diagnostic-mood p-3 md:p-4") &&
    router.includes("diagnostic-shell") &&
    router.includes("<DiagDashboard"),
  "the whole diagnostic journey should feel like one app capsule"
);

ok(
  "topbar uses the diagnostic product chrome",
  topbar.includes("diagnostic-topbar") &&
    topbar.includes("logoToolTrim") &&
    topbar.includes("Quitter") &&
    topbar.includes("bg-[hsl(var(--diag-yellow))]"),
  "the audit keeps brand, exit, and one clear progress indicator"
);

ok(
  "primary actions share the same premium affordance",
  router.includes("diagnostic-primary-action") &&
    profile.includes("diagnostic-primary-action") &&
    discovery.includes("diagnostic-primary-action") &&
    preVerdict.includes("diagnostic-primary-action"),
  "primary CTAs should not visually drift between steps"
);

ok(
  "stack capture keeps the satisfying selection motion",
  stack.includes("StackFeedMotion") &&
    stack.includes("tooltrim-stack-feed") &&
    stack.includes("stackDropRef") &&
    stack.includes("data-stack-tool-card-id"),
  "the add-to-stack micro animation must remain part of the capture flow"
);

ok(
  "stack capture uses warm card plus dark companion panel",
  stack.includes("diagnostic-card p-5 md:p-6") &&
    stack.includes("diagnostic-soft-card") &&
    stack.includes("diagnostic-dark-panel"),
  "the capture step should carry the new mood at the work surface and companion level"
);

ok(
  "result moments inherit the same visual language",
  loading.includes("diagnostic-card") &&
    preVerdict.includes("diagnostic-dark-panel") &&
    dashboard.includes("bg-card/70"),
  "loading, pre-verdict, and restitution should not fall back to generic chrome"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO57 diagnostic mood verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
