import { readFileSync } from "node:fs";

const STACK_SCAN = "src/components/diagnostic/DiagStepStackScan.tsx";
const DISCOVERY = "src/components/diagnostic/DiagStep6Discovery.tsx";
const SAVE_INDICATOR = "src/components/diagnostic/DiagSaveIndicator.tsx";
const TRANSITION = "src/components/diagnostic/DiagTransitionOverlay.tsx";
const LOGOS = "src/lib/toolLogos.ts";

const stackScan = readFileSync(STACK_SCAN, "utf8");
const discovery = readFileSync(DISCOVERY, "utf8");
const saveIndicator = readFileSync(SAVE_INDICATOR, "utf8");
const transition = readFileSync(TRANSITION, "utf8");
const logos = readFileSync(LOGOS, "utf8");

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

ok(
  "search and manual state reset on each zone",
  stackScan.includes("setSearch(\"\")") &&
    stackScan.includes("setShowCatalog(false)") &&
    stackScan.includes("setCustomName(\"\")") &&
    stackScan.includes("setCustomPrice(\"\")"),
  "zone change should reset search/manual add state"
);
ok(
  "question area remounts per zone",
  stackScan.includes("key={activeMoment.id}") && stackScan.includes("slide-in-from-bottom-2"),
  "active zone should visually feel like a new request"
);
ok(
  "stack zones use visual stepper",
  stackScan.includes("StackMomentStepper") &&
    stackScan.includes("Étapes de capture de stack") &&
    stackScan.includes("h-11 w-11 shrink-0") &&
    stackScan.includes("overflow-x-auto") &&
    stackScan.includes("selector_moment_stepper_clicked"),
  "the 10 stack areas should be a compact icon rail, not text-heavy cards"
);
ok(
  "stack progress and stack count are not duplicated",
  !stackScan.includes("coveredOrSkippedCount") &&
    !stackScan.includes("StackStat") &&
    !stackScan.includes("Couverture") &&
    !stackScan.includes("Zone en cours"),
  "zone progress belongs to the icon rail; confirmed stack belongs to the side recap"
);
ok(
  "search field is not redundant with the active zone",
  stackScan.includes("Chercher un outil…") &&
    !stackScan.includes("Chercher pour ${activeMoment.fr.toLowerCase()}") &&
    !stackScan.includes("Search for ${activeMoment.en.toLowerCase()}"),
  "the question and stepper already carry the current area"
);
ok(
  "new question receives focus",
  stackScan.includes("questionRef.current?.focus()"),
  "new zone heading should receive focus for continuity"
);
ok(
  "skip path is explicit and records the empty zone",
  stackScan.includes("Je n’utilise rien pour ça") &&
    stackScan.includes("onClick={skipActiveMoment}") &&
    !stackScan.includes("Passer cette zone"),
  "empty zone CTA should mark the area as intentionally empty"
);
ok(
  "tool click opens plan choice before adding",
  stackScan.includes("pendingToolId") &&
    stackScan.includes("selector_tool_plan_opened") &&
    stackScan.includes("confirmToolWithOffer") &&
    stackScan.includes("Plan utilisé ?") &&
    stackScan.includes("Choisir le plan"),
  "clicking a suggestion should not immediately count it in the stack"
);
ok(
  "selected suggestion keeps its visual position",
  !stackScan.includes("aSelected") &&
    !stackScan.includes("bSelected") &&
    !stackScan.includes("return aSelected ? -1 : 1"),
  "confirming a tool should not reorder the suggestion grid"
);
ok(
  "confirmed tool has side recap micro-feedback",
  stackScan.includes("lastConfirmedToolId") &&
    stackScan.includes("aria-live=\"polite\"") &&
    stackScan.includes("ring-primary/40"),
  "confirming a plan should create a visible but non-layout-shifting recap feedback"
);
ok(
  "confirmed tool feeds the sidebar and leaves left suggestions",
  stackScan.includes("StackFeedMotion") &&
    stackScan.includes("tooltrim-stack-feed") &&
    stackScan.includes("stackDropRef") &&
    stackScan.includes("data-stack-tool-card-id") &&
    stackScan.includes("!selectedIds.has(tool.id)"),
  "confirmed tools should visibly transfer to the right recap, then disappear from left-side choices"
);
ok(
  "tool cards expose clear plan CTA",
  stackScan.includes("Choisir le plan") &&
    stackScan.includes("Plan utilisé ?") &&
    stackScan.includes("Choisis un plan pour l’ajouter") &&
    stackScan.includes("puis ajout automatique") &&
    stackScan.includes("h-[146px]") &&
    stackScan.includes("aria-label={t(") &&
    !stackScan.includes("Clique pour choisir le plan"),
  "user should see the next action without guessing where to click"
);
ok(
  "central stack strip removed to avoid duplicate summary",
  !stackScan.includes("LiveStackStrip") &&
    !stackScan.includes("Stack captée en direct"),
  "the right companion should be the only persistent stack recap on desktop"
);
ok(
  "budget hierarchy separates confirmed and to-clarify amounts",
  stackScan.includes("getMonthlyBudgetBreakdown") &&
    stackScan.includes("budgetBreakdown.confirmedEur") &&
    stackScan.includes("budgetBreakdown.toVerifyEur") &&
    stackScan.includes("à préciser"),
  "budget number should not mix prose and amount in the same line"
);
ok(
  "stack capture has no visible USD selector",
  !stackScan.includes("USD") &&
    !stackScan.includes("Devise ?") &&
    !stackScan.includes("devise à vérifier"),
  "user-facing stack capture should stay in EUR"
);
ok(
  "Claude and Copilot logo fallbacks exist",
  logos.includes('claude: "claude"') &&
    logos.includes('"github-copilot": "githubcopilot"') &&
    logos.includes('"github-copilot": { label: "Co"') &&
    logos.includes('claude: { label: "C"'),
  "broken remote logos should fall back to local brand badges"
);
ok(
  "plan selector uses real plan labels when possible",
  stackScan.includes("getPlanLabel") &&
    stackScan.includes("compare_plan_name") &&
    stackScan.includes("Je ne sais pas"),
  "offer selector should avoid generic paid/team labels when plan names exist"
);
ok(
  "zone copy avoids repeated kicker labels",
  !stackScan.includes("Nouvelle zone à vérifier") &&
    !stackScan.includes("New area to check"),
  "the stepper and H1 already explain the current zone"
);
ok(
  "useful questions focus the heading, not an answer option",
  discovery.includes("headingRef.current?.focus()") &&
    discovery.includes("tabIndex={-1}") &&
    discovery.includes("outline-none"),
  "question changes should not leave focus on an answer that looks selected"
);
ok(
  "autosave copy is localized",
  saveIndicator.includes("Enregistré") && !saveIndicator.includes("Auto-saved"),
  "autosave indicator should not show English copy in FR"
);
ok(
  "transition overlay uses design-system icon",
  transition.includes("import { Search }") && transition.includes("<Search") && !transition.includes("🔍"),
  "transition overlay should use lucide icon instead of emoji"
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO50 funnel fluidity verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
