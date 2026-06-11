import { readFileSync } from "node:fs";

const DASHBOARD = "src/components/dashboard/DiagDashboard.tsx";

const dashboard = readFileSync(DASHBOARD, "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "desktop sidebar follows editorial rail dimensions",
  dashboard.includes("w-[288px]") &&
    dashboard.includes("bg-background") &&
    dashboard.includes("overflow-hidden"),
  "sidebar should be compact, background-aligned, and prevent overflow"
);
ok(
  "sidebar has semantic restitution navigation",
  dashboard.includes('aria-label={t("Navigation de restitution"') &&
    dashboard.includes("<nav") &&
    dashboard.includes("Rapport d’audit"),
  "sidebar should expose a clear navigation landmark and audit label"
);
ok(
  "sidebar tab labels cannot bleed into content",
  dashboard.includes("grid w-full grid-cols-[28px_1fr]") &&
    dashboard.includes("min-w-0 overflow-hidden") &&
    dashboard.includes("max-h-[2.6em] overflow-hidden"),
  "tab content should be constrained inside the rail"
);
ok(
  "active state is restrained, not a large blue block",
  dashboard.includes("border-border bg-card text-foreground shadow-sm") &&
    !dashboard.includes("bg-primary/10 text-primary font-medium"),
  "active tab should use a sober editorial card state"
);
ok(
  "mobile drawer uses the same compact item pattern",
  dashboard.includes("grid grid-cols-[24px_1fr]") &&
    dashboard.includes("block truncate font-semibold"),
  "mobile navigation should match the compact sidebar rhythm"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO55 dashboard sidebar verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
