import { readFileSync } from "node:fs";

const EMAIL_FUNCTION = "supabase/functions/process-diagnostic-email-jobs/index.ts";
const DEPLOY_SCRIPT = "scripts/deploy-preprod-functions.mjs";

const source = readFileSync(EMAIL_FUNCTION, "utf8");
const deployScript = readFileSync(DEPLOY_SCRIPT, "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "guided email template version",
  source.includes("go48-guided-email-v2"),
  "missing go48-guided-email-v2"
);
ok(
  "guided email narrative metadata",
  source.includes("guided_report_email"),
  "missing guided_report_email"
);
ok(
  "main email has understood-context framing",
  source.includes("Ce que j'ai compris") && source.includes("What I understood"),
  "missing understood-context copy"
);
ok(
  "main email has first-decision framing",
  source.includes("Premiere decision") || source.includes("Première décision"),
  "missing first-decision copy"
);
ok(
  "main email CTA reads as report",
  source.includes("Lire mon rapport") && source.includes("Read my report"),
  "CTA should point to report, not only action plan"
);
ok(
  "email does not force euro amounts",
  !source.includes("€") && !source.includes("money("),
  "email function should not force euro formatting"
);
ok(
  "email worker deploys in preprod bundle",
  deployScript.includes("\"process-diagnostic-email-jobs\""),
  "process-diagnostic-email-jobs missing from deploy-preprod-functions"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO48 email template verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
