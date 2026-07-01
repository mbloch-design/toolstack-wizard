/** fix-asana-v5-dedupe.mjs
 * Round 5: keepIf/avoidIf ("Décision rapide") still semantically overlapped
 * profitableIf/tooExpensiveIf ("rentable si / trop cher si") after the
 * previous pass: "Tu travailles seul, sans client..." (avoidIf) basically
 * restated "Tu es solo sans sous-traitants" (tooExpensiveIf), and "simple
 * liste de tâches" appeared in both. Re-axis keepIf/avoidIf around feature
 * fit (views, dependencies, built-in chat/docs) instead of team-size/solo,
 * which is now exclusively profitableIf/tooExpensiveIf's territory.
 *
 * Also: ToolSummaryBlock's "À éviter si" row directly restates
 * verdict.avoidIf right after the "Décision rapide" cards show the same
 * array as separate blocks. That's a deliberate, documented pattern (the
 * summary block is a machine-readable GEO/AEO digest, not meant for
 * sequential human reading) so it's left as-is, but rewriting avoidIf below
 * still benefits it since the wording changes there too.
 */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const tool = tools.find((x) => (x.slug || x.id) === "asana");
if (!tool) throw new Error("asana not found");

tool.verdict.keepIf = [
  "Tu as besoin de plusieurs vues sur le même projet (liste, Kanban, timeline) selon le contexte ou l'interlocuteur",
  "Tes tâches dépendent les unes des autres et tu veux que les retards se répercutent automatiquement",
];
tool.verdict.avoidIf = [
  "Tes tâches sont indépendantes les unes des autres, sans suite ni dépendance à suivre",
  "Tu cherches un outil avec chat ou documents intégrés, pas une todo-list à connecter à Slack et Notion",
];
tool.verdictEn.keepIf = [
  "You need several views of the same project (list, Kanban, timeline) depending on context or audience",
  "Your tasks depend on each other and you want delays to cascade automatically",
];
tool.verdictEn.avoidIf = [
  "Your tasks are independent of each other, with no sequence or dependency to track",
  "You want built-in chat or docs, not a to-do list you connect to Slack and Notion",
];

writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log("Asana v5 (dédoublonnage Décision rapide / rentable-si) mise à jour.");
