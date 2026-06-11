import { readFileSync } from "node:fs";

const ACTIONS = "src/components/dashboard/DashActions.tsx";

const actions = readFileSync(ACTIONS, "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "action plan has a clear next-action card",
  actions.includes("NextActionCard") &&
    actions.includes("Prochaine action utile") &&
    actions.includes("Marquer comme fait"),
  "missing guided next action affordance"
);
ok(
  "actions explain why they exist",
  actions.includes("detail: p.message") &&
    actions.includes("Voir la preuve") &&
    actions.includes("evidenceTab"),
  "action rows should expose reasoning and proof navigation"
);
ok(
  "progress is based on completed actions",
  actions.includes("Avancement du plan") &&
    actions.includes("completedCount / actions.length") &&
    !actions.includes("Potentiel sécurisé"),
  "progress should not claim secured financial potential"
);
ok(
  "action state persists v2 without mixed-currency totals",
  actions.includes('version: "v2"') &&
    actions.includes('pricing_policy: "source_currency_or_verify"') &&
    actions.includes("completed_action_count") &&
    !actions.includes("recovered_savings") &&
    !actions.includes("total_savings"),
  "action persistence should avoid mixed-currency savings totals"
);
ok(
  "uncertain prices are labelled as verification work",
  actions.includes("getPricingAudit") &&
    actions.includes("audit?.needsVerification") &&
    actions.includes("gain à vérifier"),
  "action savings should defer when plan/currency is uncertain"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO54 action plan continuity verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
