import fs from "node:fs";

const checks = [];
function check(name, condition, detail = "") {
  checks.push({ name, ok: Boolean(condition), detail });
}

const specialty = fs.readFileSync("src/utils/creativeSpecialty.ts", "utf8");
const scoring = fs.readFileSync("src/utils/scoring.ts", "utf8");
const dashboard = fs.readFileSync("src/components/dashboard/DashOptimisations.tsx", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

check(
  "creative specialties expose scoring tool ids",
  /scoringToolIds: readonly string\[\]/.test(specialty) &&
    (specialty.match(/scoringToolIds:/g) || []).length >= 8
);
check(
  "creative specialties expose scoring keywords",
  /scoringKeywords: readonly string\[\]/.test(specialty) &&
    (specialty.match(/scoringKeywords:/g) || []).length >= 8
);
check(
  "affinity helper exists",
  /export function getCreativeSpecialtyToolAffinity\(tool: Tool, value\?: string\): number/.test(specialty)
);
check(
  "plugins and specialised creative tools get protected affinity",
  /tool\.tool_type === "plugin"/.test(specialty) && /tool\.tool_type === "specialise"/.test(specialty)
);
check(
  "pertinence receives primary specialty",
  /computePertinence\([\s\S]*primarySpecialty\?: SessionState\["primarySpecialty"\]/.test(scoring) &&
    /getCreativeSpecialtyToolAffinity\(tool, primarySpecialty\)/.test(scoring)
);
check(
  "score final receives primary specialty",
  /computeScoreFinal\([\s\S]*primarySpecialty\?: SessionState\["primarySpecialty"\]/.test(scoring) &&
    /computePertinence\(tool, persona, complementarySkills, primarySpecialty\)/.test(scoring)
);
check(
  "recommendations include creative plugin/specialised candidates",
  /\["plugin", "specialise", "metier"\]\.includes\(t\.tool_type\)/.test(scoring) &&
    /return getCreativeSpecialtyToolAffinity\(t, primarySpecialty\) > 0/.test(scoring)
);
check(
  "runDiagnostic forwards primary specialty",
  /computeScoreFinal\(tool, persona, complementarySkills, tjm, sessionState\.primarySpecialty\)/.test(scoring) &&
    /data\.allTools, selectedTools, persona, complementarySkills, tjm, sessionState\.primarySpecialty/.test(scoring)
);
check(
  "onboarding signal captures creative specialty",
  /onboarding_creative_specialty_/.test(scoring) && /Read the stack through/.test(scoring)
);
check(
  "dashboard swaps use same specialty scoring",
  /computeScoreFinal\(alt, sessionState\.persona, sessionState\.complementarySkills, sessionState\.tjm, sessionState\.primarySpecialty\)/.test(dashboard)
);
check(
  "npm validation script is registered",
  pkg.scripts?.["validate:go64"] === "node scripts/validate-go64-creative-specialty-scoring.mjs"
);

const failed = checks.filter((item) => !item.ok);
for (const item of checks) {
  console.log(`${item.ok ? "[OK]" : "[FAIL]"} ${item.name}${item.detail ? `\n     ${item.detail}` : ""}`);
}

if (failed.length > 0) {
  console.error(`\nGO64 creative specialty scoring verdict: FAIL (${failed.length}/${checks.length})`);
  process.exit(1);
}

console.log("\nGO64 creative specialty scoring verdict: PASS");
