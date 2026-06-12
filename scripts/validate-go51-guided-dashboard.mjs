import { readFileSync } from "node:fs";

const OVERVIEW = "src/components/dashboard/DashOverview.tsx";
const DASHBOARD = "src/components/dashboard/DiagDashboard.tsx";

const overview = readFileSync(OVERVIEW, "utf8");
const dashboard = readFileSync(DASHBOARD, "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "overview exposes 3-minute guided read",
  overview.includes("ReadingPath") && overview.includes("Lecture en 3 minutes"),
  "missing guided reading path"
);
ok(
  "overview separates price uncertainty from verdict",
  overview.includes("Prix à confirmer") &&
    overview.includes("Je sépare le verdict du budget incertain") &&
    overview.includes("getPricingAudit"),
  "missing price uncertainty panel"
);
ok(
  "overview uses pricing capture summary",
  overview.includes("getPricingCaptureSummary") && overview.includes("pricingSummary.needsVerificationCount"),
  "missing pricing capture summary in report"
);
ok(
  "dashboard navigation is a compact product rail",
  dashboard.includes("SidebarTab") &&
    dashboard.includes("primarySidebarTabs") &&
    dashboard.includes("reviewSidebarTabs") &&
    dashboard.includes("Trouver une vue..."),
  "dashboard sidebar should organize restitution views without verbose appendices copy"
);
ok(
  "guided report avoids forced annual euro savings",
  !overview.includes("annualSavings") && !overview.includes("}€"),
  "overview should not force annual/euro savings"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO51 guided dashboard verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
