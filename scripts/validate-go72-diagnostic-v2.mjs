import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));

const requiredScripts = [
  "validate:go58",
  "validate:go59",
  "validate:go63",
  "validate:go64",
  "validate:go65",
  "validate:go66",
  "validate:go67",
  "validate:go68",
  "validate:go69",
  "validate:go70",
  "validate:go71",
];

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "package exposes the full GO58-GO71 chain",
  requiredScripts.every((script) => Boolean(pkg.scripts?.[script])),
  requiredScripts.filter((script) => !pkg.scripts?.[script]).join(", ")
);

ok(
  "GO71 patch script exists",
  existsSync("scripts/patch-go71-pricing-data.mjs"),
  "the final run should be able to normalize billing data before validating"
);

ok(
  "GO72 validation script runs the new checks",
  readFileSync("scripts/validate-go72-diagnostic-v2.mjs", "utf8").includes("validate:go71"),
  "the aggregate validation should include the pricing coverage pass"
);

if (checks.some((item) => item.status === "FAIL")) {
  for (const item of checks) {
    console.log(`[${item.status}] ${item.name}`);
    if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
  }
  console.log("");
  console.log("GO72 diagnostic V2 verdict: FAIL");
  console.log(`Checks: ${checks.length}, failed: ${checks.filter((item) => item.status === "FAIL").length}`);
  process.exit(1);
}

for (const script of [
  "validate:go58",
  "validate:go59",
  "validate:go63",
  "validate:go64",
  "validate:go65",
  "validate:go66",
  "validate:go67",
  "validate:go68",
  "validate:go69",
  "validate:go70",
  "validate:go71",
]) {
  console.log(`\n> npm run ${script}\n`);
  execSync(`npm run ${script}`, { stdio: "inherit" });
}

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
}

console.log("");
console.log("GO72 diagnostic V2 verdict: PASS");
console.log(`Checks: ${checks.length}, failed: 0`);
