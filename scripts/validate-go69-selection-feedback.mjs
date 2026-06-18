import { readFileSync } from "node:fs";

const pkg = readFileSync("package.json", "utf8");
const stackScan = readFileSync("src/components/diagnostic/DiagStepStackScan.tsx", "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "package exposes GO69 validation",
  pkg.includes("\"validate:go69\""),
  "GO69 needs a dedicated validation entry"
);

ok(
  "selector keeps a recent confirmation state",
  stackScan.includes("type RecentConfirmation") &&
    stackScan.includes("recentConfirmation") &&
    stackScan.includes("setRecentConfirmation"),
  "the selector should keep a short-lived memory of the last confirmed tool"
);

ok(
  "confirmation banner makes the add explicit",
  stackScan.includes("function SelectionConfirmedBanner") &&
    stackScan.includes("rejoint ta stack") &&
    stackScan.includes("role=\"status\""),
  "after choosing the plan, the UI should explicitly confirm the add"
);

ok(
  "selected cards expose a stable added state",
  stackScan.includes("Ajouté") &&
    stackScan.includes("offerLabel(displayTool, t)") &&
    stackScan.includes("formatToolMonthlyPrice(displayTool, t)"),
  "once selected, a card should look confirmed rather than still ambiguous"
);

ok(
  "sidebar highlights the latest add",
  stackScan.includes("Dernier ajout") &&
    stackScan.includes("recentConfirmation?: RecentConfirmation | null") &&
    stackScan.includes("formatToolMonthlyBudget(recentConfirmation.tool, t)"),
  "the sidebar should echo the latest confirmed tool"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO69 selection feedback verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
