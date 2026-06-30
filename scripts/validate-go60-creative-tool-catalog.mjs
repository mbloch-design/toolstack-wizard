import { readFile } from "node:fs/promises";

const tools = JSON.parse(await readFile("src/data/tools_v4.json", "utf8"));
const stackScan = await readFile("src/components/diagnostic/DiagStepStackScan.tsx", "utf8");
const byId = new Map(tools.map((tool) => [tool.id, tool]));

const failures = [];
const warnings = [];

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`[OK] ${name}${detail ? `\n     ${detail}` : ""}`);
  } else {
    console.log(`[FAIL] ${name}${detail ? `\n     ${detail}` : ""}`);
    failures.push(name);
  }
}

function warn(name, condition, detail = "") {
  if (condition) {
    console.log(`[OK] ${name}${detail ? `\n     ${detail}` : ""}`);
  } else {
    console.log(`[WARN] ${name}${detail ? `\n     ${detail}` : ""}`);
    warnings.push(name);
  }
}

const creativeBlock = stackScan.match(/const CREATIVE_STACK_MOMENTS = \[(?<body>[\s\S]*?)\] as const;/)?.groups?.body || "";
const creativeRelations = stackScan.match(/const CREATIVE_PARENT_RELATIONS = \[(?<body>[\s\S]*?)\] as const;/)?.groups?.body || "";
const creativeIds = [
  ...new Set(
    [...creativeBlock.matchAll(/"([a-z0-9-]+)"/g)]
      .map((match) => match[1])
      .filter((id) => byId.has(id))
  ),
];
const relationIds = [
  ...new Set(
    [...creativeRelations.matchAll(/"([a-z0-9-]+)"/g)]
      .map((match) => match[1])
      .filter((id) => byId.has(id))
  ),
];
const suggestedIds = [...new Set([...creativeIds, ...relationIds])];
const suggestedTools = suggestedIds.map((id) => byId.get(id)).filter(Boolean);

const genericIds = [
  "mockup-plugins",
  "presets-lightroom",
  "lightroom-presets",
  "brand-kits",
  "canva-kits",
  "krea",
  "adobe-creative-cloud",
];
const forbiddenInSuggestions = genericIds.filter((id) => creativeBlock.includes(`"${id}"`) || creativeRelations.includes(`"${id}"`));

check(
  "creative suggestions resolve to real catalog tools",
  suggestedIds.length >= 50 && suggestedIds.every((id) => byId.has(id)),
  `${suggestedIds.length} referenced tools`
);

check(
  "creative suggestions exclude generic placeholders and duplicate aliases",
  forbiddenInSuggestions.length === 0,
  forbiddenInSuggestions.join(", ") || "no placeholder suggested"
);

const emptyNeeds = suggestedTools
  .filter((tool) => !Array.isArray(tool.functional_needs) || tool.functional_needs.length === 0)
  .map((tool) => tool.id);
check(
  "creative suggestions have functional needs",
  emptyNeeds.length === 0,
  emptyNeeds.join(", ") || "all suggested tools have functional_needs"
);

const wrongFreePricing = [
  "adobe-lightroom",
  "envato-elements",
  "nik-collection",
  "topaz-video-ai",
  "ae-overlord",
  "ae-gifgun",
].filter((id) => {
  const tool = byId.get(id);
  const plan = String(tool?.pricing_v5?.compare_plan_name || "").toLowerCase();
  return !tool?.pricing_v5 || plan === "free";
});
check(
  "known paid or non-monthly creative tools are not marked as Free",
  wrongFreePricing.length === 0,
  wrongFreePricing.join(", ") || "no false-free pricing"
);

const canonicalTypes = new Set(["core", "metier", "satellite", "gestion", "ia", "plugin", "specialise", "bundle"]);
const badTypes = tools
  .filter((tool) => tool.tool_type && !canonicalTypes.has(tool.tool_type))
  .map((tool) => `${tool.id}:${tool.tool_type}`);
check("catalog tool_type values are known", badTypes.length === 0, badTypes.slice(0, 20).join(", "));

const duplicateNames = [...tools.reduce((map, tool) => {
  const key = String(tool.name || "").trim().toLowerCase();
  if (!key) return map;
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(tool.id);
  return map;
}, new Map())]
  .filter(([, ids]) => ids.length > 1)
  .map(([name, ids]) => `${name}: ${ids.join(", ")}`);
warn(
  "duplicate display names are limited",
  duplicateNames.length <= 6,
  duplicateNames.slice(0, 12).join(" | ") || "no duplicate names"
);

const creativePricingNeedingSource = suggestedTools
  .filter((tool) => {
    const v5 = tool.pricing_v5;
    if (!v5) return false;
    return !v5.official_source_url || !v5.source_domain || !v5.verified_on;
  })
  .map((tool) => tool.id);
check(
  "priced creative suggestions have source metadata",
  creativePricingNeedingSource.length === 0,
  creativePricingNeedingSource.join(", ") || "all priced suggestions have source metadata"
);

console.log(`\nGO60 creative tool catalog verdict: ${failures.length ? "FAIL" : "PASS"}`);
console.log(`Checks: ${6 + 1}, failed: ${failures.length}, warnings: ${warnings.length}`);

if (failures.length) process.exit(1);
