import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const app = readFileSync("src/App.tsx", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const required = ["validate:go73", "validate:go74", "validate:go75"];
const checks = [];

function check(name, condition, detail) {
  checks.push({ name, condition, detail });
}

check(
  "legacy root routes converge on the selector",
  app.includes('path="/selector"') &&
    app.includes('path="/diagnostic"') &&
    app.includes('path="/audit"'),
  "non-localized legacy entry points should reach the V2 selector"
);
check(
  "localized legacy routes converge on the selector",
  app.includes('path="diagnostic" element={<RedirectLegacyDiagnostic />}') &&
    app.includes('path="audit" element={<RedirectLegacyDiagnostic />}'),
  "FR and EN calls to action should share the same guided flow"
);
check(
  "GO73-GO75 scripts are registered",
  required.every((script) => Boolean(pkg.scripts?.[script])),
  required.filter((script) => !pkg.scripts?.[script]).join(", ")
);

if (checks.some((item) => !item.condition)) {
  for (const item of checks) {
    console.log(`[${item.condition ? "OK" : "FAIL"}] ${item.name}`);
    if (!item.condition) console.log(`     ${item.detail}`);
  }
  process.exit(1);
}

for (const script of required) {
  console.log(`\n> npm run ${script}\n`);
  execSync(`npm run ${script}`, { stdio: "inherit" });
}

for (const item of checks) console.log(`[OK] ${item.name}`);
console.log("");
console.log("GO76 production hardening verdict: PASS");
console.log(`Checks: ${checks.length}, failed: 0`);
