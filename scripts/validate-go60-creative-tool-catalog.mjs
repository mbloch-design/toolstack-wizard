import { readFile } from "node:fs/promises";

const tools = JSON.parse(await readFile("src/data/tools_v4.json", "utf8"));
const stackScan = await readFile("src/components/diagnostic/DiagStepStackScan.tsx", "utf8");
const creativeEngine = await readFile("src/lib/creativeAdaptiveEngine.ts", "utf8");
const byId = new Map(tools.map((tool) => [tool.id, tool]));

const failures = [];
const warnings = [];
const checks = [];

function idsFromStringArray(body) {
  return [...body.matchAll(/"([a-z0-9-]+)"/g)].map((match) => match[1]);
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function check(name, condition, detail = "") {
  checks.push(name);
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
const creativeAiSuggestions = stackScan.match(/const CREATIVE_AI_SUGGESTION_IDS_BY_MOMENT:[\s\S]*?= \{(?<body>[\s\S]*?)\n\};/)?.groups?.body || "";
const creativeIds = [
  ...new Set(
    idsFromStringArray(creativeBlock)
      .filter((id) => byId.has(id))
  ),
];
const relationIds = [
  ...new Set(
    idsFromStringArray(creativeRelations)
      .filter((id) => byId.has(id))
  ),
];

const engineExplicitGroups = [...creativeEngine.matchAll(/id:\s*"([^"]+)"[\s\S]*?explicitToolIds:\s*\[(?<body>[\s\S]*?)\]/g)]
  .map((match) => ({
    questionId: match[1],
    ids: [...new Set(idsFromStringArray(match.groups?.body || ""))],
  }))
  .filter((group) => group.ids.length > 0);
const baseQuestionsBlock = creativeEngine.slice(
  creativeEngine.indexOf("const BASE_QUESTIONS"),
  creativeEngine.indexOf("const COMMERCIAL_CONTAINER_TOOL_IDS")
);
const engineQuestionGroups = [...baseQuestionsBlock.matchAll(/id:\s*"([^"]+)"[\s\S]*?needKeys:\s*\[(?<needs>[\s\S]*?)\][\s\S]*?explicitToolIds:\s*\[(?<ids>[\s\S]*?)\][\s\S]*?allowedToolTypes:\s*\[(?<types>[\s\S]*?)\]/g)]
  .map((match) => ({
    questionId: match[1],
    needKeys: [...new Set(idsFromStringArray(match.groups?.needs || "").map(normalize))],
    ids: [...new Set(idsFromStringArray(match.groups?.ids || ""))],
    allowedTypes: [...new Set(idsFromStringArray(match.groups?.types || ""))],
  }))
  .filter((group) => group.ids.length > 0);
const engineExplicitIds = [
  ...new Set(engineExplicitGroups.flatMap((group) => group.ids)),
];
const aiContextualIds = [
  ...new Set(
    [...creativeAiSuggestions.matchAll(/:\s*\[(?<body>[\s\S]*?)\]/g)]
      .flatMap((match) => idsFromStringArray(match.groups?.body || ""))
  ),
];
const suggestedIds = [...new Set([...creativeIds, ...relationIds, ...engineExplicitIds, ...aiContextualIds])];
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
  suggestedIds.length >= 170 && suggestedIds.every((id) => byId.has(id)),
  `${suggestedIds.length} referenced tools`
);

const missingEngineIds = engineExplicitIds.filter((id) => !byId.has(id));
check(
  "creative engine explicit tools resolve to catalog entries",
  missingEngineIds.length === 0,
  missingEngineIds.join(", ") || `${engineExplicitIds.length} engine tools resolved`
);

const missingAiContextIds = aiContextualIds.filter((id) => !byId.has(id));
check(
  "creative AI contextual suggestions resolve to catalog entries",
  missingAiContextIds.length === 0,
  missingAiContextIds.join(", ") || `${aiContextualIds.length} contextual AI tools resolved`
);

const missingExplicitToolTypes = engineExplicitIds
  .map((id) => byId.get(id))
  .filter((tool) => tool && !tool.tool_type)
  .map((tool) => tool.id);
const missingExplicitNeeds = engineExplicitIds
  .map((id) => byId.get(id))
  .filter((tool) => tool && (!Array.isArray(tool.functional_needs) || tool.functional_needs.length === 0))
  .map((tool) => tool.id);
check(
  "creative engine explicit tools have typed functional metadata",
  missingExplicitToolTypes.length === 0 && missingExplicitNeeds.length === 0,
  [
    missingExplicitToolTypes.length ? `missing tool_type: ${missingExplicitToolTypes.join(", ")}` : "",
    missingExplicitNeeds.length ? `missing functional_needs: ${missingExplicitNeeds.join(", ")}` : "",
  ].filter(Boolean).join(" · ") || `${engineExplicitIds.length} explicit tools typed and need-mapped`
);

const explicitTypeMismatches = engineQuestionGroups.flatMap((group) =>
  group.ids
    .map((id) => byId.get(id))
    .filter((tool) => tool?.tool_type && !group.allowedTypes.includes(tool.tool_type))
    .map((tool) => `${group.questionId}:${tool.id}:${tool.tool_type}`)
);
check(
  "creative engine allowed types match explicit tool reality",
  explicitTypeMismatches.length === 0,
  explicitTypeMismatches.join(", ") || "every explicit option has an allowed type"
);

const explicitNeedMismatches = engineQuestionGroups.flatMap((group) =>
  group.ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .filter((tool) => {
      const toolNeeds = new Set((tool.functional_needs || []).map(normalize));
      return group.needKeys.every((need) => !toolNeeds.has(need));
    })
    .map((tool) => `${group.questionId}:${tool.id}`)
);
check(
  "creative engine explicit tools share at least one need with their question",
  explicitNeedMismatches.length === 0,
  explicitNeedMismatches.join(", ") || "every explicit option has a functional reason"
);

check(
  "creative AI suggestions do not confuse React Flux with FLUX AI",
  suggestedIds.includes("flux-ai") && !suggestedIds.includes("flux"),
  "image generation uses flux-ai; legacy React flux remains outside creative AI"
);

const shallowEngineQuestions = engineExplicitGroups
  .map((group) => ({
    ...group,
    resolvedCount: group.ids.filter((id) => byId.has(id)).length,
  }))
  .filter((group) => group.resolvedCount < 8)
  .map((group) => `${group.questionId}:${group.resolvedCount}`);
check(
  "creative engine questions expose a sufficiently broad option set",
  shallowEngineQuestions.length === 0,
  shallowEngineQuestions.join(", ") || `${engineExplicitGroups.length} questions have 8+ resolved options`
);

const audioPublishingGroup = engineExplicitGroups.find((group) => group.questionId === "audio-publishing");
const requiredAudioPublishingIds = [
  "spotify-for-podcasters",
  "buzzsprout",
  "ausha",
  "podbean",
  "acast",
  "headliner",
  "castmagic",
  "auphonic",
];
const forbiddenAudioPublishingIds = [
  "affiliate-tools",
  "photopea",
  "pixelmator-pro",
  "shotdeck",
  "capcut-templates",
  "riverside",
];
const audioPublishingIds = new Set(audioPublishingGroup?.ids || []);
const missingAudioPublishingIds = requiredAudioPublishingIds.filter((id) => !audioPublishingIds.has(id));
const leakedAudioPublishingIds = forbiddenAudioPublishingIds.filter((id) => audioPublishingIds.has(id));
check(
  "audio publishing stays inside podcast distribution and promotion",
  Boolean(audioPublishingGroup) &&
    (audioPublishingGroup?.ids.length || 0) >= 12 &&
    missingAudioPublishingIds.length === 0 &&
    leakedAudioPublishingIds.length === 0,
  [
    missingAudioPublishingIds.length ? `missing: ${missingAudioPublishingIds.join(", ")}` : "",
    leakedAudioPublishingIds.length ? `leaked: ${leakedAudioPublishingIds.join(", ")}` : "",
    audioPublishingGroup ? `${audioPublishingGroup.ids.length} explicit options` : "audio-publishing group missing",
  ].filter(Boolean).join(" · ")
);

const videoEditGroup = engineExplicitGroups.find((group) => group.questionId === "video-edit");
const requiredVideoEditIds = [
  "adobe-premiere-pro",
  "davinci-resolve",
  "final-cut-pro",
  "capcut",
  "descript",
  "opus-clip",
  "screen-studio",
];
const forbiddenVideoEditIds = [
  "photopea",
  "pixelmator-pro",
  "adobe-stock",
  "capcut-templates",
  "frame-io",
  "riverside",
];
const videoEditIds = new Set(videoEditGroup?.ids || []);
const missingVideoEditIds = requiredVideoEditIds.filter((id) => !videoEditIds.has(id));
const leakedVideoEditIds = forbiddenVideoEditIds.filter((id) => videoEditIds.has(id));
check(
  "video editing stays focused on editing and repurposing tools",
  Boolean(videoEditGroup) &&
    (videoEditGroup?.ids.length || 0) >= 12 &&
    missingVideoEditIds.length === 0 &&
    leakedVideoEditIds.length === 0,
  [
    missingVideoEditIds.length ? `missing: ${missingVideoEditIds.join(", ")}` : "",
    leakedVideoEditIds.length ? `leaked: ${leakedVideoEditIds.join(", ")}` : "",
    videoEditGroup ? `${videoEditGroup.ids.length} explicit options` : "video-edit group missing",
  ].filter(Boolean).join(" · ")
);

check(
  "creative selector keeps diversified suggestion limits",
  creativeEngine.includes("CREATIVE_VISIBLE_SUGGESTION_COUNT = 6") &&
    creativeEngine.includes("CREATIVE_MAX_SUGGESTION_COUNT = 12") &&
    creativeEngine.includes("diversifyRankedCreativeTools") &&
    stackScan.includes("diversifyRankedCreativeTools(") &&
    stackScan.includes("CREATIVE_VISIBLE_SUGGESTION_COUNT") &&
    stackScan.includes("CREATIVE_MAX_SUGGESTION_COUNT"),
  "6 visible examples, 12 max suggestions, diversified ranking wired in UI"
);

check(
  "silent or legacy tools are demoted in capture suggestions unless confirmed",
  creativeEngine.includes('tool.prescription_quality === "silence"') &&
    creativeEngine.includes("tool.force_silence") &&
    creativeEngine.includes("score -= 72"),
  "cartographiable does not mean primary example or recommendation"
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
console.log(`Checks: ${checks.length}, failed: ${failures.length}, warnings: ${warnings.length}`);

if (failures.length) process.exit(1);
