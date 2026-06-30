#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const withBuild = args.has("--with-build");
const withUi = args.has("--with-ui");

const checks = [
  {
    label: "TypeScript",
    command: "npx",
    args: ["tsc", "--noEmit"],
    timeoutMs: 120_000,
  },
  {
    label: "Tests métier ciblés du diagnostic Créatif",
    command: "npx",
    args: [
      "vitest",
      "run",
      "--config",
      "vitest.diagnostic.config.ts",
      "src/test/diagnostic/creativeAdaptiveEngine.spec.ts",
      "src/test/diagnostic/creativeJourneyMatrix.spec.ts",
      "src/test/diagnostic/workflowUsageContracts.spec.ts",
      "src/test/diagnostic/diagnosticRecovery.spec.ts",
      "src/test/diagnostic/diagnosticRender.spec.tsx",
      "src/test/diagnostic/phase4BetaReadiness.spec.tsx",
      "src/test/diagnostic/preVerdictContracts.spec.ts",
    ],
    timeoutMs: 120_000,
  },
  {
    label: "Garde-fou parcours Créatif",
    command: "node",
    args: ["scripts/validate-go58-creative-persona-engine.mjs"],
    timeoutMs: 60_000,
  },
  {
    label: "Garde-fou restitution Créatif",
    command: "node",
    args: ["scripts/validate-go59-creative-restitution.mjs"],
    timeoutMs: 60_000,
  },
  {
    label: "Garde-fou catalogue Créatif",
    command: "node",
    args: ["scripts/validate-go60-creative-tool-catalog.mjs"],
    timeoutMs: 60_000,
  },
  {
    label: "Garde-fou modèles commerciaux",
    command: "node",
    args: ["scripts/validate-go61-billing-model.mjs"],
    timeoutMs: 60_000,
  },
  {
    label: "Garde-fou readiness produit G0",
    command: "node",
    args: ["scripts/validate-g0-product-readiness.mjs"],
    timeoutMs: 60_000,
  },
  {
    label: "Garde-fou readiness Phase 2",
    command: "node",
    args: ["scripts/validate-phase2-readiness.mjs"],
    timeoutMs: 60_000,
  },
  {
    label: "Garde-fou readiness Phase 3",
    command: "node",
    args: ["scripts/validate-phase3-readiness.mjs"],
    timeoutMs: 60_000,
  },
  {
    label: "Garde-fou préparation Phase 4",
    command: "node",
    args: ["scripts/validate-phase4-readiness.mjs"],
    timeoutMs: 60_000,
  },
];

if (withUi) {
  checks.push({
    label: "Tests UI diagnostiques expérimentaux",
    command: "npx",
    args: [
      "vitest",
      "run",
      "--config",
      "vitest.diagnostic.config.ts",
      "src/test/diagnostic/profileGoalUx.spec.tsx",
      "src/test/diagnostic/topBarPricingUx.spec.tsx",
    ],
    timeoutMs: 60_000,
  });
}

if (withBuild) {
  checks.push({
    label: "Build production",
    command: "npm",
    args: ["run", "build"],
    timeoutMs: 360_000,
  });
}

const skipped = [];

if (!withUi) {
  skipped.push(
    "Tests UI jsdom non lancés par défaut. Ils sont isolés avec : npm run validate:diagnostic:ui"
  );
}

if (!withBuild) {
  skipped.push("Build production non lancé. Pour la porte G0 complète, lancer : npm run validate:g0");
}

const failures = [];
const startedAt = new Date();

console.log("Tooltrim — validation diagnostic Créatif");
console.log(`Mode : ${withBuild ? "porte G0 complète" : "socle Phase 0 reproductible"}`);
console.log(`Début : ${startedAt.toISOString()}`);
console.log("");

for (const check of checks) {
  const prettyCommand = [check.command, ...check.args].join(" ");
  console.log(`\n▶ ${check.label}`);
  console.log(`  ${prettyCommand}`);

  const result = spawnSync(check.command, check.args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    timeout: check.timeoutMs,
  });

  if (result.error) {
    failures.push({ label: check.label, reason: result.error.message });
    console.log(`✖ ${check.label} — ${result.error.message}`);
    continue;
  }

  if (result.signal) {
    failures.push({ label: check.label, reason: `signal ${result.signal}` });
    console.log(`✖ ${check.label} — arrêté par ${result.signal}`);
    continue;
  }

  if (result.status !== 0) {
    failures.push({ label: check.label, reason: `exit ${result.status ?? "unknown"}` });
    console.log(`✖ ${check.label} — échec`);
    continue;
  }

  console.log(`✓ ${check.label}`);
}

const finishedAt = new Date();
const durationSeconds = ((finishedAt.getTime() - startedAt.getTime()) / 1000).toFixed(1);

console.log("\nRésumé validation diagnostic Créatif");
console.log(`Durée : ${durationSeconds}s`);
console.log(`Checks exécutés : ${checks.length}`);
console.log(`Checks échoués : ${failures.length}`);

for (const item of skipped) {
  console.log(`Info : ${item}`);
}

if (failures.length > 0) {
  console.log("\nÉchecs :");
  for (const failure of failures) {
    console.log(`- ${failure.label} (${failure.reason})`);
  }
  process.exit(1);
}

console.log("\nVerdict : PASS");
