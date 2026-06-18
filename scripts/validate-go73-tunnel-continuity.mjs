import { readFileSync } from "node:fs";

const router = readFileSync("src/components/DiagnosticRouter.tsx", "utf8");
const topBar = readFileSync("src/components/diagnostic/DiagTopBar.tsx", "utf8");
const checks = [];

function check(name, condition, detail) {
  checks.push({ name, condition, detail });
}

check(
  "step changes restore reading position",
  router.includes("window.scrollTo({ top: 0") && router.includes("stepContentRef.current?.focus"),
  "each screen should begin from a stable reading position"
);
check(
  "new stages are announced accessibly",
  router.includes('aria-live="polite"') && router.includes("currentStageLabel"),
  "screen-reader and keyboard users need the same context change"
);
check(
  "exit action explains recovery",
  topBar.includes("ta progression est conservée") && topBar.includes("resume later"),
  "leaving the flow should not feel like data loss"
);

for (const item of checks) {
  console.log(`[${item.condition ? "OK" : "FAIL"}] ${item.name}`);
  if (!item.condition) console.log(`     ${item.detail}`);
}

const failed = checks.filter((item) => !item.condition).length;
console.log("");
console.log(`GO73 tunnel continuity verdict: ${failed ? "FAIL" : "PASS"}`);
console.log(`Checks: ${checks.length}, failed: ${failed}`);
if (failed) process.exit(1);
