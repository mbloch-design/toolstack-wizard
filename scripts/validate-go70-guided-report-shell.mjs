import { readFileSync } from "node:fs";

const pkg = readFileSync("package.json", "utf8");
const overview = readFileSync("src/components/dashboard/DashOverview.tsx", "utf8");
const dashboard = readFileSync("src/components/dashboard/DiagDashboard.tsx", "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "package exposes GO70 validation",
  pkg.includes("\"validate:go70\""),
  "GO70 needs a dedicated validation entry"
);

ok(
  "overview frames restitution as business logic first",
  overview.includes("logique métier de la stack") &&
    overview.includes("Comment je lis cette stack") &&
    overview.includes("Fil directeur"),
  "the final read should feel like a report, not a generic dashboard"
);

ok(
  "overview surfaces a stable reading lens",
  overview.includes("function getReportLens") &&
    overview.includes("Production") &&
    overview.includes("Accélération") &&
    overview.includes("Décision"),
  "the report should explain which lens is applied before diving into evidence"
);

ok(
  "appendices are demoted behind the main reading path",
  overview.includes("Annexes utiles") &&
    overview.includes("Si tu veux vérifier plus loin"),
  "secondary views should feel like appendices, not the core of the page"
);

ok(
  "sidebar helps users read in the right order",
  dashboard.includes("Lis d’abord") &&
    dashboard.includes("Lecture guidée · Restitution d’audit") &&
    dashboard.includes("primarySidebarTabs.slice(0, 3)"),
  "the shell should make the reading order visible from the left rail"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO70 guided report shell verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
