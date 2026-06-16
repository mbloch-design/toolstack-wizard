import { readFile } from "node:fs/promises";

const tools = JSON.parse(await readFile("src/data/tools_v4.json", "utf8"));
const stackScan = await readFile("src/components/diagnostic/DiagStepStackScan.tsx", "utf8");
const pricing = await readFile("src/utils/diagnosticPricing.ts", "utf8");
const types = await readFile("src/types/diagnostic.ts", "utf8");
const byId = new Map(tools.map((tool) => [tool.id, tool]));

const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`[OK] ${name}${detail ? `\n     ${detail}` : ""}`);
  } else {
    console.log(`[FAIL] ${name}${detail ? `\n     ${detail}` : ""}`);
    failures.push(name);
  }
}

function optionValues(id) {
  const options = byId.get(id)?.pricing_v5?.billing_options;
  return Array.isArray(options) ? options.map((option) => option.value) : [];
}

function hasOptions(id, expected) {
  const values = optionValues(id);
  return expected.every((value) => values.includes(value));
}

check(
  "types model real billing choices",
  types.includes("export type ToolBillingChoice") &&
    types.includes('"one_time"') &&
    types.includes('"included"') &&
    types.includes('"usage"') &&
    types.includes("ToolBillingOption"),
  "selectedOffer should not be limited to free/paid/team"
);

check(
  "pricing logic treats zero-monthly modes differently from free",
  pricing.includes("ZERO_MONTHLY_OFFERS") &&
    pricing.includes('"one_time"') &&
    pricing.includes('"included"') &&
    pricing.includes("Achat unique") &&
    pricing.includes("Déjà inclus") &&
    pricing.includes("VARIABLE_OFFERS"),
  "one-time and included tools need distinct labels and budget behavior"
);

check(
  "selector uses dynamic billing options per tool",
  stackScan.includes("getToolBillingOptions") &&
    stackScan.includes("billing_options") &&
    stackScan.includes("Mode utilisé ?") &&
    stackScan.includes("Préciser l’usage") &&
    !stackScan.includes("const OFFER_OPTIONS"),
  "the selector must not use one universal four-button plan grid"
);

check(
  "Adobe Lightroom exposes its real payment modes",
  byId.get("adobe-lightroom")?.pricing_v5?.billing_model === "subscription" &&
    hasOptions("adobe-lightroom", ["single_app", "bundle", "included", "team", "unknown"]),
  optionValues("adobe-lightroom").join(", ")
);

check(
  "Adobe suite tools support bundle and included modes",
  byId.get("adobe-cc")?.pricing_v5?.billing_model === "bundle" &&
    hasOptions("adobe-cc", ["bundle", "included", "team", "unknown"]) &&
    hasOptions("adobe-photoshop", ["single_app", "bundle", "included", "team", "unknown"]) &&
    hasOptions("adobe-after-effects", ["single_app", "included", "team", "unknown"]),
  `adobe-cc=${optionValues("adobe-cc").join(", ")}`
);

check(
  "one-time tools are not forced into monthly plans",
  ["affinity-photo", "procreate", "topaz-video-ai", "nik-collection", "ae-overlord", "ae-gifgun", "rightfont"].every((id) =>
    byId.get(id)?.pricing_v5?.billing_model === "one_time" && hasOptions(id, ["one_time", "included", "unknown"])
  ),
  "one-time purchases should offer one-time / already bought / unknown"
);

check(
  "credit or usage based tools expose variable modes",
  byId.get("remove-bg")?.pricing_v5?.billing_model === "credits" &&
    hasOptions("remove-bg", ["free", "credits", "unknown"]) &&
    byId.get("firefly")?.pricing_v5?.billing_model === "credits" &&
    hasOptions("firefly", ["free", "included", "credits", "unknown"]),
  `remove-bg=${optionValues("remove-bg").join(", ")} firefly=${optionValues("firefly").join(", ")}`
);

check(
  "subscription tools keep free/paid/team/unknown when relevant",
  hasOptions("figma", ["free", "paid", "team", "unknown"]) &&
    hasOptions("canva", ["free", "paid", "team", "included", "unknown"]) &&
    hasOptions("envato-elements", ["paid", "team", "marketplace", "unknown"]),
  `figma=${optionValues("figma").join(", ")} canva=${optionValues("canva").join(", ")}`
);

console.log(`\nGO61 billing model verdict: ${failures.length ? "FAIL" : "PASS"}`);
console.log(`Checks: 8, failed: ${failures.length}`);

if (failures.length) process.exit(1);
