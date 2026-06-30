import type {
  AiContributionMode,
  AiActorSource,
  AiCapabilityId,
  AiUsageConstraint,
  AiUsageFrequency,
  AiWorkflowActor,
  Tool,
} from "@/types/diagnostic";

export interface AiCapabilityOption {
  id: AiCapabilityId;
  labelFr: string;
  labelEn: string;
}

const CAPABILITIES: Record<AiCapabilityId, AiCapabilityOption> = {
  research_ideation: { id: "research_ideation", labelFr: "Recherche et idéation", labelEn: "Research and ideation" },
  generate_text: { id: "generate_text", labelFr: "Générer ou reformuler du texte", labelEn: "Generate or rewrite text" },
  generate_visual: { id: "generate_visual", labelFr: "Générer des pistes visuelles", labelEn: "Generate visual directions" },
  generate_layout: { id: "generate_layout", labelFr: "Générer une composition ou interface", labelEn: "Generate a layout or interface" },
  generate_code: { id: "generate_code", labelFr: "Produire du code ou du handoff", labelEn: "Produce code or handoff" },
  generate_3d: { id: "generate_3d", labelFr: "Générer modèles, matières ou textures", labelEn: "Generate models, materials, or textures" },
  organize_classify: { id: "organize_classify", labelFr: "Trier, classer ou sélectionner", labelEn: "Sort, classify, or select" },
  transcribe_translate: { id: "transcribe_translate", labelFr: "Transcrire, sous-titrer ou traduire", labelEn: "Transcribe, subtitle, or translate" },
  edit_enhance: { id: "edit_enhance", labelFr: "Corriger, améliorer ou décliner", labelEn: "Correct, enhance, or create variants" },
  remove_extend: { id: "remove_extend", labelFr: "Supprimer, détourer ou étendre", labelEn: "Remove, cut out, or extend" },
  animate: { id: "animate", labelFr: "Animer ou interpoler", labelEn: "Animate or interpolate" },
  render_upscale: { id: "render_upscale", labelFr: "Rendre, agrandir ou nettoyer", labelEn: "Render, upscale, or clean up" },
  analyze_validate: { id: "analyze_validate", labelFr: "Analyser ou contrôler la qualité", labelEn: "Analyze or check quality" },
  automate_workflow: { id: "automate_workflow", labelFr: "Enchaîner ou automatiser des tâches", labelEn: "Chain or automate tasks" },
  other: { id: "other", labelFr: "Autre usage IA", labelEn: "Another AI use" },
};

const DEFAULT_CAPABILITIES: AiCapabilityId[] = [
  "research_ideation",
  "generate_text",
  "generate_visual",
  "edit_enhance",
  "analyze_validate",
  "automate_workflow",
];

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function aiCapabilityOptionsForObjective(
  objectiveId: string,
  needKeys: readonly string[] = []
): AiCapabilityOption[] {
  const text = `${objectiveId} ${needKeys.join(" ")}`.toLowerCase();
  const ids: AiCapabilityId[] = [];

  if (/brief|reference|moodboard|research|identity|visual|illustration|social/.test(text)) {
    ids.push("research_ideation", "generate_visual", "generate_text");
  }
  if (/ui|interface|prototype|design-system|handoff/.test(text)) {
    ids.push("generate_layout", "generate_text", "generate_code", "analyze_validate");
  }
  if (/photo|raw|retouch|image|color|asset/.test(text)) {
    ids.push("organize_classify", "edit_enhance", "remove_extend", "render_upscale");
  }
  if (/video|motion|audio|podcast|subtitle|transcript/.test(text)) {
    ids.push("transcribe_translate", "edit_enhance", "animate", "analyze_validate");
  }
  if (/three-d|3d|render|space|architecture|bim/.test(text)) {
    ids.push("research_ideation", "generate_3d", "animate", "render_upscale");
  }
  if (/review|delivery|archive|publish|validation/.test(text)) {
    ids.push("analyze_validate", "organize_classify", "automate_workflow");
  }

  return unique([...ids, ...DEFAULT_CAPABILITIES])
    .slice(0, 6)
    .map((id) => CAPABILITIES[id]);
}

export function aiCapabilityOptionsForTool(
  objectiveOptions: AiCapabilityOption[],
  tool: Tool | undefined,
  existingIds: AiCapabilityId[] = []
) {
  if (!tool) return objectiveOptions;
  const rawUseCases = Array.isArray(tool.ia_use_case)
    ? tool.ia_use_case
    : [tool.ia_use_case || ""];
  const text = [
    tool.name,
    tool.category,
    ...(tool.functional_needs || []),
    ...rawUseCases,
  ].join(" ").toLowerCase();
  const inferred: AiCapabilityId[] = [];

  if (/research|brainstorm|assistant|ideation|recherche|analyse/.test(text)) {
    inferred.push("research_ideation", "analyze_validate");
  }
  if (/text|copy|writing|redaction|generation-texte/.test(text)) inferred.push("generate_text");
  if (/image|visual|generation-image|illustration/.test(text)) inferred.push("generate_visual");
  if (/layout|interface|ui-design|wireframe/.test(text)) inferred.push("generate_layout");
  if (/code|developer|handoff/.test(text)) inferred.push("generate_code");
  if (/3d|model|texture|material/.test(text)) inferred.push("generate_3d");
  if (/sort|classif|catalog|select|organis/.test(text)) inferred.push("organize_classify");
  if (/transcri|subtitle|caption|translate/.test(text)) inferred.push("transcribe_translate");
  if (/retouch|edit|enhance|correction|color/.test(text)) inferred.push("edit_enhance");
  if (/remove|background|mask|detour|extend/.test(text)) inferred.push("remove_extend");
  if (/animat|motion|interpol/.test(text)) inferred.push("animate");
  if (/render|upscale|resolution|clean/.test(text)) inferred.push("render_upscale");
  if (/automat|workflow|agent/.test(text)) inferred.push("automate_workflow");

  const allowed = new Set([...inferred, ...existingIds, "other"]);
  const filtered = objectiveOptions.filter((option) => allowed.has(option.id));
  const existingMissing = existingIds
    .filter((id) => !filtered.some((option) => option.id === id))
    .map((id) => CAPABILITIES[id]);
  const other = CAPABILITIES.other;
  return unique([...filtered, ...existingMissing, other]).slice(0, 6);
}

export function aiActorId(source: AiActorSource, toolId?: string) {
  return `ai-${source}-${toolId || "workflow"}`;
}

export function createAiActor(
  source: AiActorSource,
  toolId?: string
): AiWorkflowActor {
  return {
    id: aiActorId(source, toolId),
    source,
    toolId,
    capabilityIds: [],
  };
}

export function upsertAiActor(
  actors: AiWorkflowActor[] = [],
  actor: AiWorkflowActor
) {
  const existingIndex = actors.findIndex((candidate) => candidate.id === actor.id);
  if (existingIndex < 0) return [...actors, actor];
  return actors.map((candidate, index) => index === existingIndex ? actor : candidate);
}

export function removeAiActor(
  actors: AiWorkflowActor[] = [],
  actorId: string
) {
  return actors.filter((actor) => actor.id !== actorId);
}

export function deriveAiModeFromActors(
  actors: AiWorkflowActor[] = []
): AiContributionMode {
  if (actors.length === 0) return "unknown";
  const sources = new Set(actors.map((actor) => actor.source));
  if (sources.size > 1) return "mixed";
  if (sources.has("integrated")) return "integrated";
  if (sources.has("external")) return "external";
  if (sources.has("automation")) return "automated";
  return "unknown";
}

export function resolveAiCaptureMode(
  selectedMode: AiContributionMode,
  actors: AiWorkflowActor[] = []
): AiContributionMode {
  if (["integrated", "external", "mixed", "automated"].includes(selectedMode)) {
    return selectedMode;
  }
  return deriveAiModeFromActors(actors);
}

function actorWithSource(
  actor: AiWorkflowActor,
  source: AiActorSource
): AiWorkflowActor {
  return {
    ...actor,
    id: aiActorId(source, actor.toolId),
    source,
  };
}

export function reconcileAiActorsForMode(
  mode: AiContributionMode,
  actors: AiWorkflowActor[] = [],
  aiToolIds: string[] = [],
  defaultIntegratedToolId?: string
): AiWorkflowActor[] {
  if (mode === "none") return [];

  const integratedActors = actors.filter((actor) => actor.source === "integrated");
  if (
    integratedActors.length === 0 &&
    defaultIntegratedToolId &&
    ["integrated", "mixed"].includes(mode)
  ) {
    integratedActors.push(createAiActor("integrated", defaultIntegratedToolId));
  }

  const toolActors = aiToolIds.map((toolId) => {
    const existing = actors.find((actor) => actor.toolId === toolId);
    return existing || createAiActor("external", toolId);
  });

  if (mode === "integrated") return integratedActors;
  if (mode === "external") {
    return toolActors.map((actor) => actorWithSource(actor, "external"));
  }
  if (mode === "mixed") {
    return [
      ...integratedActors,
      ...toolActors.map((actor) => actorWithSource(actor, "external")),
    ];
  }
  if (mode === "automated") {
    if (toolActors.length > 0) {
      return toolActors.map((actor) => actorWithSource(actor, "automation"));
    }
    const workflowActor = actors.find(
      (actor) => actor.source === "automation" && !actor.toolId
    );
    return [workflowActor || createAiActor("automation")];
  }
  return actors;
}

export function toggleAiCapability(
  actor: AiWorkflowActor,
  capabilityId: AiCapabilityId
): AiWorkflowActor {
  const capabilityIds = actor.capabilityIds.includes(capabilityId)
    ? actor.capabilityIds.filter((id) => id !== capabilityId)
    : [...actor.capabilityIds, capabilityId];
  return { ...actor, capabilityIds };
}

export function setAiActorFrequency(
  actor: AiWorkflowActor,
  frequency: AiUsageFrequency
): AiWorkflowActor {
  return { ...actor, frequency };
}

function normalizedTokens(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

function toolsShareCommercialContext(host: Tool, feature: Tool) {
  if (feature.host_app === host.id) return true;
  if (feature.bundle_parent === host.id) return true;
  if (feature.bundle_parent && feature.bundle_parent === host.bundle_parent) return true;
  if (feature.commercial_family && feature.commercial_family === host.commercial_family) return true;
  if (feature.provider_id && feature.provider_id === host.provider_id) return true;
  return false;
}

export function integratedAiFeatureOptions(
  host: Tool,
  tools: Tool[],
  objectiveId: string,
  needKeys: readonly string[] = []
) {
  const candidates = tools.filter(
    (tool) =>
      tool.id !== host.id &&
      tool.tool_type === "ia" &&
      toolsShareCommercialContext(host, tool)
  );
  if (candidates.length <= 1) return candidates;

  const objectiveOptions = aiCapabilityOptionsForObjective(objectiveId, needKeys);
  const objectiveCapabilities = new Set(objectiveOptions.map((option) => option.id));
  const objectiveTokens = new Set(normalizedTokens(`${objectiveId} ${needKeys.join(" ")}`));

  return candidates
    .map((tool) => {
      const capabilityMatches = aiCapabilityOptionsForTool(objectiveOptions, tool)
        .filter((option) => option.id !== "other" && objectiveCapabilities.has(option.id))
        .length;
      const toolTokens = normalizedTokens([
        tool.name,
        tool.category,
        ...(tool.functional_needs || []),
        ...(Array.isArray(tool.ia_use_case) ? tool.ia_use_case : [tool.ia_use_case || ""]),
      ].join(" "));
      const tokenMatches = toolTokens.filter((token) => objectiveTokens.has(token)).length;
      const directHostMatch = tool.host_app === host.id ? 10 : 0;
      return { tool, score: directHostMatch + capabilityMatches * 3 + tokenMatches };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
    .slice(0, 3)
    .map((candidate) => candidate.tool);
}

export function setAiActorFeature(
  actor: AiWorkflowActor,
  feature?: Pick<Tool, "id" | "name">
): AiWorkflowActor {
  return {
    ...actor,
    featureToolId: feature?.id,
    featureName: feature?.name,
  };
}

export function toggleAiConstraint(
  actor: AiWorkflowActor,
  constraint: AiUsageConstraint
): AiWorkflowActor {
  if (constraint === "none") {
    return { ...actor, constraints: ["none"] };
  }
  const current = (actor.constraints || []).filter((value) => value !== "none");
  const constraints = current.includes(constraint)
    ? current.filter((value) => value !== constraint)
    : [...current, constraint];
  return { ...actor, constraints };
}

export function normalizeAiActors(value: unknown): AiWorkflowActor[] {
  if (!Array.isArray(value)) return [];
  const validSources: AiActorSource[] = ["integrated", "external", "automation"];
  const validCapabilities = new Set(Object.keys(CAPABILITIES));
  const validFrequencies: AiUsageFrequency[] = ["occasional", "regular", "systematic"];
  const validConstraints: AiUsageConstraint[] = [
    "none",
    "credits",
    "quota",
    "reliability",
    "privacy",
    "rights",
    "unknown",
  ];

  return value.flatMap((item): AiWorkflowActor[] => {
    if (!item || typeof item !== "object") return [];
    const raw = item as Partial<AiWorkflowActor>;
    const source = validSources.includes(raw.source as AiActorSource)
      ? raw.source as AiActorSource
      : null;
    if (!source) return [];
    const toolId = typeof raw.toolId === "string" ? raw.toolId : undefined;
    return [{
      id: typeof raw.id === "string" ? raw.id : aiActorId(source, toolId),
      source,
      toolId,
      featureToolId: typeof raw.featureToolId === "string" ? raw.featureToolId : undefined,
      featureName: typeof raw.featureName === "string" ? raw.featureName : undefined,
      capabilityIds: Array.isArray(raw.capabilityIds)
        ? raw.capabilityIds.filter(
            (id): id is AiCapabilityId =>
              typeof id === "string" && validCapabilities.has(id)
          )
        : [],
      frequency: validFrequencies.includes(raw.frequency as AiUsageFrequency)
        ? raw.frequency as AiUsageFrequency
        : undefined,
      constraints: Array.isArray(raw.constraints)
        ? raw.constraints.filter(
            (constraint): constraint is AiUsageConstraint =>
              validConstraints.includes(constraint as AiUsageConstraint)
          )
        : undefined,
      handlesSensitiveData: typeof raw.handlesSensitiveData === "boolean"
        ? raw.handlesSensitiveData
        : undefined,
      notes: typeof raw.notes === "string" ? raw.notes : undefined,
    }];
  });
}

export function aiCapabilityLabel(id: AiCapabilityId) {
  return CAPABILITIES[id];
}
