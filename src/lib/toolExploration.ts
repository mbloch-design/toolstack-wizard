import type { ToolSummary } from "@/hooks/useSupabaseData";
import type { StackToolEntry } from "@/lib/stackState";

export type ExplorationDirection = "all" | "alternatives" | "extensions" | "adjacent";

export type ExplorationSource =
  | { type: "objectif"; id: string }
  | { type: "outil"; slug: string };

export type ExplorationStackState = "new" | "in-stack" | "in-destination";

export interface ObjectiveExplorationTheme {
  count: number;
  id: string;
  labelEn: string;
  labelFr: string;
}

export interface ExplorationCandidate {
  categoryLabel: string;
  direction: Exclude<ExplorationDirection, "all">;
  reasonEn: string;
  reasonFr: string;
  relatedSource: Pick<ToolSummary, "id" | "slug" | "name">;
  score: number;
  stackState: ExplorationStackState;
  tool: ToolSummary;
}

interface BuildExplorationCandidatesOptions {
  destinationId?: string | null;
  getCategoryLabel: (tool: ToolSummary) => string;
  sourceTools: ToolSummary[];
  stackEntries: StackToolEntry[];
  tools: ToolSummary[];
}

function normalizeKey(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type ObjectiveThemeRule = Omit<ObjectiveExplorationTheme, "count"> & { pattern: RegExp };

const OBJECTIVE_THEME_RULES: Record<string, ObjectiveThemeRule[]> = {
  design: [
    { id: "interfaces", labelFr: "Interfaces", labelEn: "Interfaces", pattern: /figma|prototype|prototyp|interface|wireframe|ux|ui|design-system|web-design|mockup/ },
    { id: "image-identite", labelFr: "Image & identité", labelEn: "Image & identity", pattern: /photo|image|illustr|logo|brand|identit|typograph|retouche|photoshop|lightroom|affinity|canva/ },
    { id: "video-mouvement", labelFr: "Vidéo & mouvement", labelEn: "Video & motion", pattern: /video|motion|animation|montage|after-effects|premiere|davinci|capcut|audio/ },
    { id: "3d-rendu", labelFr: "3D & rendu", labelEn: "3D & rendering", pattern: /\b3d\b|render|rendu|blender|cinema-4d|redshift|vfx|modelisation/ },
  ],
  ia: [
    { id: "ecriture", labelFr: "Écriture & contenu", labelEn: "Writing & content", pattern: /write|ecri|texte|content|copy|redact|transcri|resume/ },
    { id: "creation", labelFr: "Image & création", labelEn: "Image & creation", pattern: /image|visual|video|audio|music|design|generat|midjourney|firefly/ },
    { id: "recherche", labelFr: "Recherche & analyse", labelEn: "Research & analysis", pattern: /search|recherche|analyse|data|document|veille|insight/ },
    { id: "agents", labelFr: "Agents & automatisation", labelEn: "Agents & automation", pattern: /agent|automat|workflow|assistant|bot|integration/ },
  ],
  organisation: [
    { id: "projets", labelFr: "Projets & tâches", labelEn: "Projects & tasks", pattern: /project|projet|task|tache|kanban|todo|planning/ },
    { id: "connaissances", labelFr: "Notes & connaissances", labelEn: "Notes & knowledge", pattern: /note|knowledge|wiki|document|doc|second-brain/ },
    { id: "temps", labelFr: "Temps & réunions", labelEn: "Time & meetings", pattern: /calendar|agenda|meeting|reunion|time|temps|schedule/ },
    { id: "collaboration", labelFr: "Collaboration", labelEn: "Collaboration", pattern: /collab|team|equipe|chat|communication|workspace/ },
  ],
  automation: [
    { id: "workflows", labelFr: "Workflows", labelEn: "Workflows", pattern: /workflow|automat|trigger|zapier|make|n8n/ },
    { id: "integrations", labelFr: "Intégrations", labelEn: "Integrations", pattern: /integration|connector|connecteur|api|webhook/ },
    { id: "agents", labelFr: "Agents IA", labelEn: "AI agents", pattern: /agent|ai|ia|assistant|bot/ },
    { id: "donnees", labelFr: "Données", labelEn: "Data", pattern: /data|database|table|sheet|scrap|extract/ },
  ],
  marketing: [
    { id: "contenu", labelFr: "Contenu", labelEn: "Content", pattern: /content|contenu|copy|redact|blog|video|design/ },
    { id: "social", labelFr: "Réseaux sociaux", labelEn: "Social media", pattern: /social|instagram|linkedin|tiktok|community|communaute/ },
    { id: "email", labelFr: "Email & newsletter", labelEn: "Email & newsletters", pattern: /email|newsletter|mail|campaign|crm/ },
    { id: "audience", labelFr: "SEO & audience", labelEn: "SEO & audience", pattern: /seo|analytics|audience|traffic|keyword|search/ },
  ],
  vente: [
    { id: "prospection", labelFr: "Prospection", labelEn: "Prospecting", pattern: /lead|prospect|outreach|booking|sales/ },
    { id: "crm", labelFr: "CRM & suivi", labelEn: "CRM & tracking", pattern: /crm|pipeline|client|customer|support/ },
    { id: "commerce", labelFr: "E-commerce", labelEn: "E-commerce", pattern: /commerce|shop|store|checkout|product/ },
    { id: "paiement", labelFr: "Paiement", labelEn: "Payments", pattern: /payment|paiement|stripe|invoice|factur/ },
  ],
  finance: [
    { id: "facturation", labelFr: "Facturation", labelEn: "Invoicing", pattern: /invoice|factur|billing|devis/ },
    { id: "comptabilite", labelFr: "Comptabilité", labelEn: "Accounting", pattern: /account|compta|tax|fiscal|bookkeep/ },
    { id: "depenses", labelFr: "Banque & dépenses", labelEn: "Banking & expenses", pattern: /bank|banque|expense|depense|card|payment/ },
    { id: "pilotage", labelFr: "Budget & pilotage", labelEn: "Budget & reporting", pattern: /budget|forecast|report|cash|finance|dashboard/ },
  ],
  dev: [
    { id: "code", labelFr: "Code", labelEn: "Code", pattern: /code|developer|ide|github|git|copilot/ },
    { id: "frontend", labelFr: "Front-end & design", labelEn: "Front-end & design", pattern: /front|web|site|design|ui|css|react/ },
    { id: "backend", labelFr: "Données & back-end", labelEn: "Data & back-end", pattern: /back|database|data|api|server|supabase/ },
    { id: "deploiement", labelFr: "Déploiement", labelEn: "Deployment", pattern: /deploy|host|cloud|monitor|vercel|security/ },
  ],
};

function getToolThemeText(tool: ToolSummary) {
  return normalizeKey([
    tool.id,
    tool.slug,
    tool.name,
    tool.categoryId,
    tool.shortDescription,
    ...(tool.functional_needs || []),
    ...(tool.covers || []),
    ...(tool.verticals || []),
  ].filter(Boolean).join(" "));
}

export function getObjectiveExplorationThemeId(objectiveId: string, tool: ToolSummary) {
  const rules = OBJECTIVE_THEME_RULES[objectiveId];
  if (!rules?.length) return `categorie-${normalizeKey(tool.categoryId) || "autres"}`;
  const text = getToolThemeText(tool);
  return rules.find((rule) => rule.pattern.test(text))?.id || rules[0].id;
}

export function getObjectiveExplorationThemes(
  objectiveId: string,
  candidates: Array<Pick<ExplorationCandidate, "categoryLabel" | "tool">>,
): ObjectiveExplorationTheme[] {
  const rules = OBJECTIVE_THEME_RULES[objectiveId];
  if (!rules?.length) {
    const categories = new Map<string, ObjectiveExplorationTheme>();
    candidates.forEach(({ categoryLabel, tool }) => {
      const id = getObjectiveExplorationThemeId(objectiveId, tool);
      const current = categories.get(id);
      categories.set(id, current ? { ...current, count: current.count + 1 } : { id, labelFr: categoryLabel, labelEn: categoryLabel, count: 1 });
    });
    return Array.from(categories.values()).sort((a, b) => b.count - a.count).slice(0, 3);
  }
  return rules
    .map(({ id, labelEn, labelFr }) => ({ id, labelEn, labelFr, count: candidates.filter(({ tool }) => getObjectiveExplorationThemeId(objectiveId, tool) === id).length }))
    .filter((theme) => theme.count > 0);
}

export function getExplorationToolKey(tool: Pick<ToolSummary, "id" | "slug">) {
  return tool.slug || tool.id;
}

function getLookupKeys(tool: ToolSummary) {
  return [tool.id, tool.slug, getExplorationToolKey(tool)].map(normalizeKey).filter(Boolean);
}

function getFamilyKey(tool: ToolSummary) {
  const key = normalizeKey(getExplorationToolKey(tool));
  if (key.startsWith("adobe-") || ["indesign", "firefly"].includes(key)) return "adobe";
  if (key.startsWith("figma")) return "figma";
  if (key.startsWith("canva")) return "canva";
  if (key.startsWith("affinity")) return "affinity";
  if (key.startsWith("topaz")) return "topaz";
  if (["davinci-resolve", "fusion"].includes(key)) return "blackmagic";
  if (["cinema-4d", "redshift"].includes(key)) return "maxon";
  return normalizeKey(tool.bundle_parent || tool.host_app || tool.substitution_cluster_v2 || key.split("-")[0] || key);
}

function getSignalKeys(values: string[] | undefined) {
  return new Set((values || []).map(normalizeKey).filter(Boolean));
}

function countShared(values: string[] | undefined, sourceKeys: Set<string>) {
  return (values || []).map(normalizeKey).filter((value) => value && sourceKeys.has(value)).length;
}

function getQualityScore(tool: ToolSummary) {
  const quality = tool.prescription_quality === "ferme" ? 18 : tool.prescription_quality === "oui" ? 12 : tool.prescription_quality === "question" ? 4 : 0;
  return quality + Math.min(8, (tool.functional_needs?.length || 0) + (tool.verticals?.length || 0));
}

function getRelation(candidate: ToolSummary, source: ToolSummary) {
  const candidateKeys = getLookupKeys(candidate);
  const sourceKeys = getLookupKeys(source);
  const hostKey = normalizeKey(candidate.host_app || "");
  const candidateBundle = normalizeKey(candidate.bundle_parent || "");
  const sourceBundle = normalizeKey(source.bundle_parent || "");
  const sameBundle = (!!candidateBundle && sourceKeys.includes(candidateBundle)) ||
    (!!sourceBundle && candidateKeys.includes(sourceBundle)) ||
    (!!candidateBundle && candidateBundle === sourceBundle);
  const sameCluster = !!candidate.substitution_cluster_v2 &&
    normalizeKey(candidate.substitution_cluster_v2) === normalizeKey(source.substitution_cluster_v2 || "");
  const sourceNeeds = getSignalKeys([...(source.functional_needs || []), ...(source.covers || [])]);
  const sharedNeeds = countShared([...(candidate.functional_needs || []), ...(candidate.covers || [])], sourceNeeds);
  const sharedVerticals = countShared(candidate.verticals, getSignalKeys(source.verticals));
  const sameCategory = normalizeKey(candidate.categoryId) === normalizeKey(source.categoryId);
  const sameFamily = getFamilyKey(candidate) === getFamilyKey(source);

  if (hostKey && sourceKeys.includes(hostKey)) {
    return { direction: "extensions" as const, score: 150, reasonFr: `Extension de ${source.name}`, reasonEn: `Extension for ${source.name}` };
  }
  if (sameBundle || sameFamily) {
    return { direction: "extensions" as const, score: sameBundle ? 132 : 84, reasonFr: `Extension de ${source.name}`, reasonEn: `Extension for ${source.name}` };
  }
  if (sameCluster) {
    return { direction: "alternatives" as const, score: 118, reasonFr: `Alternative à ${source.name}`, reasonEn: `Alternative to ${source.name}` };
  }
  if (sameCategory && sharedNeeds > 0) {
    return { direction: "alternatives" as const, score: 98 + Math.min(2, sharedNeeds) * 8, reasonFr: `Alternative à ${source.name}`, reasonEn: `Alternative to ${source.name}` };
  }
  if (sharedNeeds > 0) {
    return { direction: "adjacent" as const, score: 82 + Math.min(3, sharedNeeds) * 10, reasonFr: `Même usage que ${source.name}`, reasonEn: `Same use as ${source.name}` };
  }
  if (sharedVerticals > 0 || sameCategory) {
    return { direction: "adjacent" as const, score: sharedVerticals > 0 ? 68 : 52, reasonFr: `Usage voisin de ${source.name}`, reasonEn: `Related use to ${source.name}` };
  }
  return null;
}

export function buildExplorationCandidates({
  destinationId,
  getCategoryLabel,
  sourceTools,
  stackEntries,
  tools,
}: BuildExplorationCandidatesOptions): ExplorationCandidate[] {
  if (sourceTools.length === 0) return [];
  const sourceKeys = new Set(sourceTools.map(getExplorationToolKey));
  const entryBySlug = new Map(stackEntries.map((entry) => [entry.toolSlug, entry]));

  const ranked = tools.flatMap((tool) => {
    const toolSlug = getExplorationToolKey(tool);
    if (sourceKeys.has(toolSlug)) return [];
    const relations = sourceTools.flatMap((source) => {
      const relation = getRelation(tool, source);
      return relation ? [{ ...relation, source }] : [];
    });
    if (relations.length === 0) return [];
    relations.sort((a, b) => b.score - a.score || a.source.name.localeCompare(b.source.name));
    const relation = relations[0];
    const entry = entryBySlug.get(toolSlug);
    const stackState: ExplorationStackState = destinationId && entry?.needIds.includes(destinationId)
      ? "in-destination"
      : entry ? "in-stack" : "new";
    return [{
      categoryLabel: getCategoryLabel(tool),
      direction: relation.direction,
      reasonEn: relation.reasonEn,
      reasonFr: relation.reasonFr,
      relatedSource: relation.source,
      score: relation.score + getQualityScore(tool),
      stackState,
      tool,
    } satisfies ExplorationCandidate];
  }).sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name));

  const diversified: ExplorationCandidate[] = [];
  const picked = new Set<string>();
  const familyCounts = new Map<string, number>();
  const sourceCounts = new Map<string, number>();
  const tryPick = (candidate: ExplorationCandidate, relaxed = false) => {
    const slug = getExplorationToolKey(candidate.tool);
    if (picked.has(slug)) return;
    const family = getFamilyKey(candidate.tool);
    const relatedSlug = getExplorationToolKey(candidate.relatedSource);
    if (!relaxed && ((familyCounts.get(family) || 0) >= 2 || (sourceCounts.get(relatedSlug) || 0) >= 3)) return;
    picked.add(slug);
    familyCounts.set(family, (familyCounts.get(family) || 0) + 1);
    sourceCounts.set(relatedSlug, (sourceCounts.get(relatedSlug) || 0) + 1);
    diversified.push(candidate);
  };
  ranked.forEach((candidate) => tryPick(candidate));
  ranked.forEach((candidate) => tryPick(candidate, true));
  return diversified.slice(0, 40);
}

export function parseExplorationSource(params: URLSearchParams): ExplorationSource | null {
  const type = params.get("type");
  const source = params.get("source")?.trim();
  if (!source) return null;
  if (type === "objectif") return { type: "objectif", id: source };
  if (type === "outil") return { type: "outil", slug: source };
  return null;
}

export function getExplorerHref(
  prefix: string,
  source: ExplorationSource,
  options: { angle?: ExplorationDirection; destination?: string | null } = {},
) {
  const params = new URLSearchParams();
  params.set("type", source.type);
  params.set("source", source.type === "objectif" ? source.id : source.slug);
  if (options.destination) params.set("destination", options.destination);
  if (options.angle && options.angle !== "all") params.set("angle", options.angle);
  return `${prefix}/explorer?${params.toString()}`;
}
