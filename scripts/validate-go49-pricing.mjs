import { readFileSync } from "node:fs";

const PRICING = "src/utils/diagnosticPricing.ts";
const STACK_SCAN = "src/components/diagnostic/DiagStepStackScan.tsx";
const PRE_VERDICT = "src/components/diagnostic/DiagStepPreVerdict.tsx";
const ROUTER = "src/components/DiagnosticRouter.tsx";

const pricing = readFileSync(PRICING, "utf8");
const stackScan = readFileSync(STACK_SCAN, "utf8");
const preVerdict = readFileSync(PRE_VERDICT, "utf8");
const router = readFileSync(ROUTER, "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "pricing audit helper exists",
  pricing.includes("export function getPricingAudit") && pricing.includes("needsVerification"),
  "missing getPricingAudit / needsVerification"
);
ok(
  "pricing capture summary exists",
  pricing.includes("export function getPricingCaptureSummary") && pricing.includes("missingCurrencyCount"),
  "missing pricing capture summary"
);
ok(
  "custom tool captures monthly budget in EUR",
  stackScan.includes('currency: "EUR"') &&
    stackScan.includes('makeCustomTool(name, price, activeMoment, "EUR")') &&
    !stackScan.includes("customCurrency") &&
    !stackScan.includes("Devise ?"),
  "custom tool manual add should keep the capture flow in EUR"
);
ok(
  "tool cards keep plan selector in-place",
  stackScan.includes("h-[118px]") && stackScan.includes("OfferSelector") && stackScan.includes("Choisir le plan"),
  "selected tool cards should keep stable height and in-card offer selector"
);
ok(
  "review rows avoid visible currency switching",
  stackScan.includes('priceCurrency: "EUR"') &&
    !stackScan.includes('<option value="USD">USD</option>') &&
    !stackScan.includes('<option value="EUR">EUR</option>'),
  "review row should keep user-facing amounts in EUR"
);
ok(
  "pricing formatter uses pricing_v5 EUR first",
  pricing.includes("source: \"pricing_v5_eur\"") &&
    pricing.includes("compare_price_monthly_eur") &&
    pricing.includes("USD_TO_EUR_RATE"),
  "pricing display should use pricing_v5 EUR when available, then fixed conversion"
);
ok(
  "pre-verdict uses captured monthly total",
  preVerdict.includes("formatMonthlyTotal(session.selectedTools") && preVerdict.includes("Budget capté"),
  "pre-verdict should display captured budget"
);
ok(
  "pricing reliability is persisted",
  router.includes("selectedPriceIsEstimate") && router.includes("pricing_capture"),
  "router should persist selectedPriceIsEstimate and pricing_capture"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO49 pricing reliability verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
