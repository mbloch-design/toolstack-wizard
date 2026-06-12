import { readFileSync } from "node:fs";

const DASHBOARD = "src/components/dashboard/DiagDashboard.tsx";

const dashboard = readFileSync(DASHBOARD, "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "desktop sidebar follows product rail dimensions",
  dashboard.includes("w-[304px]") &&
    dashboard.includes("bg-card/45") &&
    dashboard.includes("overflow-y-auto"),
  "sidebar should feel like a dense product navigation rail"
);
ok(
  "sidebar has semantic restitution navigation and product header",
  dashboard.includes('aria-label={t("Navigation de restitution"') &&
    dashboard.includes("<nav") &&
    dashboard.includes("Restitution d’audit") &&
    dashboard.includes("text-sm font-bold text-foreground"),
  "sidebar should expose a clear navigation landmark and compact product identity"
);
ok(
  "sidebar uses Vercel-like compact rows",
  dashboard.includes("grid h-11 w-full grid-cols-[22px_1fr]") &&
    dashboard.includes("text-[15px]") &&
    dashboard.includes("block truncate") &&
    !dashboard.includes("descriptionFr, tab.descriptionEn)}</span>"),
  "tab labels should be compact rows without long descriptions"
);
ok(
  "active state is neutral and restrained",
  dashboard.includes("? \"bg-muted text-foreground\"") &&
    !dashboard.includes("bg-primary/10 text-primary font-medium"),
  "active tab should use a neutral product-nav state"
);
ok(
  "sidebar includes useful search affordance",
  dashboard.includes("sidebarQuery") &&
    dashboard.includes("Trouver une vue...") &&
    dashboard.includes("Aucune vue trouvée."),
  "left rail should support quick navigation when the report grows"
);
ok(
  "mobile drawer uses the same compact item pattern",
  dashboard.includes("grid grid-cols-[22px_1fr]") &&
    dashboard.includes("block min-w-0 truncate font-semibold"),
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
