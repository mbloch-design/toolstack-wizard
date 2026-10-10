import { getFeatureLabel } from "./featureLabels";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import type { StackToolEntry } from "@/lib/stackState";

export type ExplorationDirection = "all" | "alternatives" | "extensions" | "adjacent";

export type ExplorationSource =
  | { type: "objectif"; id: string }
  | { type: "outil"; slug: string }
  | { type: "stack" };

export type ExplorationStackState = "new" | "in-stack" | "in-destination";

export interface ObjectiveExplorationTheme {
  count: number;
  id: string;
  labelEn: string;
  labelFr: string;
}

export interface ExplorationCandidate {
  categoryLabel: string;
  comparisonNeedsReview?: true;
  direction: Exclude<ExplorationDirection, "all">;
  reasonEn: string;
  reasonFr: string;
  relatedSource: Pick<ToolSummary, "id" | "slug" | "name">;
  score: number;
  stackState: ExplorationStackState;
  tool: ToolSummary;
}

interface BuildExplorationCandidatesOptions {
  relationPolicy?: "audited" | "legacy";
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

export const R5_AUDITED_SOURCE_SLUGS = ["figma", "adobe-photoshop", "adobe-after-effects", "blender", "cinema-4d", "davinci-resolve", "canva", "notion", "obsidian", "slack", "discord", "asana", "trello", "clickup", "chatgpt", "claude", "perplexity", "midjourney", "zapier", "make", "n8n", "webflow", "framer", "wordpress", "shopify", "supabase", "vercel", "google-drive", "dropbox", "typeform"] as const;

export function usesAuditedExplorationRelations(sourceTools: ToolSummary[]) {
  return sourceTools.length === 1 && (R5_AUDITED_SOURCE_SLUGS as readonly string[]).includes(getExplorationToolKey(sourceTools[0]));
}

function getFamilyKey(tool: ToolSummary) {
  // Only declared catalogue membership establishes a suite/host family.
  return normalizeKey(tool.bundle_parent || tool.host_app || getExplorationToolKey(tool));
}

// Broad tags do not establish a useful relationship on their own. These
// occur across unrelated roles/products in the audited catalogue pilot.
const BROAD_USE_SIGNALS = new Set([
  "collaboration", "no-code", "nocode-web", "design", "design-support",
  "content-creation", "productivity", "ai", "ai-general", "automation",
  "social-media", "sourcing", "assistant-generaliste", "automatisation", "brainstorming",
]);

function getSignalKeys(values: string[] | undefined) {
  return new Set((values || []).map(normalizeKey).filter(Boolean));
}

function getQualityScore(tool: ToolSummary) {
  const quality = tool.prescription_quality === "ferme" ? 18 : tool.prescription_quality === "oui" ? 12 : tool.prescription_quality === "question" ? 4 : 0;
  return quality + Math.min(8, (tool.functional_needs?.length || 0) + (tool.verticals?.length || 0));
}

// Temporary claim restrictions from the second R5 review, not catalogue facts.
// See docs/proofs/explorer-r5-second-2026-10-09/independent-review.json
// (including guarded_pairs_outside_top10 for the relocated comparisons).
// Reconcile product surfaces in the common catalogue before lifting them.
const R5_SCOPE_RESERVATIONS = [
  { source: "davinci-resolve", target: "adobe-creative-cloud", action: "verify" },
  { source: "cinema-4d", target: "cinema-4d-lite", action: "verify" },
  { source: "cinema-4d", target: "cinebench", action: "verify" },
  { source: "figma", target: "framer", action: "verify" },
  { source: "framer", target: "figma", action: "exclude" },
  { source: "chatgpt", target: "claude", action: "verify" },
  { source: "chatgpt", target: "deepseek", action: "verify" },
  { source: "chatgpt", target: "google-ai-studio", action: "verify" },
  { source: "claude", target: "chatgpt", action: "verify" },
] as const;

function getRelation(candidate: ToolSummary, source: ToolSummary) {
  const candidateKeys = getLookupKeys(candidate);
  const sourceKeys = getLookupKeys(source);
  const hostKey = normalizeKey(candidate.host_app || "");
  const sourceHost = normalizeKey(source.host_app || "");
  const candidateBundle = normalizeKey(candidate.bundle_parent || "");
  const sourceBundle = normalizeKey(source.bundle_parent || "");
  const sourceNeeds = getSignalKeys(source.functional_needs);
  const sharedNeeds = new Set((candidate.functional_needs || []).map(normalizeKey)
    .filter(key => key && sourceNeeds.has(key) && !BROAD_USE_SIGNALS.has(key)));
  const useNames = (lang: "fr" | "en") => [...sharedNeeds].slice(0, 2).map(key => getFeatureLabel(key, lang)).join(", ");
  const sameChatCluster = normalizeKey(source.substitution_cluster_v2) === "team-chat" &&
    normalizeKey(candidate.substitution_cluster_v2) === "team-chat";


  if (hostKey && sourceKeys.includes(hostKey)) {
    return { direction: "extensions" as const, score: 150,
      reasonFr: candidate.tool_type === "plugin" ? `Extension de ${source.name}` : `Rattaché à ${source.name}`,
      reasonEn: candidate.tool_type === "plugin" ? `Extension for ${source.name}` : `Attached to ${source.name}` };
  }
  if (sourceHost && candidateKeys.includes(sourceHost)) {
    return { direction: "adjacent" as const, score: 140, reasonFr: `Outil hôte de ${source.name}`, reasonEn: `Host application for ${source.name}` };
  }
  const sameBundle = (!!candidateBundle && sourceKeys.includes(candidateBundle)) ||
    (!!sourceBundle && candidateKeys.includes(sourceBundle)) ||
    (!!candidateBundle && candidateBundle === sourceBundle);
  if (sameBundle) {
    return { direction: "adjacent" as const, score: 84, reasonFr: `Même suite que ${source.name}`, reasonEn: `Same suite as ${source.name}` };
  }
  const reservation = R5_SCOPE_RESERVATIONS.find(item =>
    sourceKeys.includes(item.source) && candidateKeys.includes(item.target));
  if (reservation?.action === "exclude") return null;
  if (reservation?.action === "verify") {
    return { direction: "adjacent" as const, score: 76, comparisonNeedsReview: true as const,
      reasonFr: `Comparaison de périmètre à vérifier avec ${source.name}`,
      reasonEn: `Scope comparison to verify with ${source.name}` };
  }
  const forwardAlternative = (source.alternatives || []).some(key => candidateKeys.includes(normalizeKey(key)));
  const reverseAlternative = (candidate.alternatives || []).some(key => sourceKeys.includes(normalizeKey(key)));
  // A reverse link can target a broader product/workflow (e.g. a framework
  // naming its deployment platform). Require corroborating uses; team-chat
  // is the narrow audited cluster bridging chat-equipe/social-media tags.
  const explicitlyLinked = forwardAlternative || (reverseAlternative && (sharedNeeds.size > 0 || sameChatCluster));
  // An extension for another app is not a standalone replacement. Same-host
  // extensions can be compared when the catalogue explicitly relates them.
  const compatibleRole = ((!hostKey && !sourceHost) || (!!hostKey && hostKey === sourceHost)) &&
    (candidate.tool_type === "bundle") === (source.tool_type === "bundle");
  if (explicitlyLinked && compatibleRole && (sharedNeeds.size > 0 || sameChatCluster)) {
    const frUses = useNames("fr") || "Chat d’équipe";
    const enUses = useNames("en") || "Team chat";
    return { direction: "alternatives" as const, score: 134, reasonFr: `Alternative au catalogue à ${source.name} · ${frUses}`, reasonEn: `Catalogue alternative to ${source.name} · ${enUses}` };
  }
  if (hostKey && hostKey !== sourceHost) return null;
  if (forwardAlternative && compatibleRole && sharedNeeds.size === 0) {
    return { direction: "adjacent" as const, score: 76, comparisonNeedsReview: true as const, reasonFr: `Comparaison à vérifier avec ${source.name}`, reasonEn: `Comparison to verify with ${source.name}` };
  }
  if (sharedNeeds.size > 0) {
    return { direction: "adjacent" as const, score: 82 + Math.min(3, sharedNeeds.size) * 10, reasonFr: `Usage commun avec ${source.name} · ${useNames("fr")}`, reasonEn: `Shared use with ${source.name} · ${useNames("en")}` };
  }
  // Category, substitution cluster and profession tags are too coarse in
  // the current catalogue. Abstain instead of padding a result list.
  return null;
}

function getLegacyFamilyKey(tool: ToolSummary) {
  const key = normalizeKey(getExplorationToolKey(tool));
  if (key.startsWith("adobe-") || ["indesign", "firefly"].includes(key)) return "adobe";
  if (key.startsWith("figma")) return "figma";
  if (key.startsWith("canva")) return "canva";
  if (key.startsWith("affinity")) return "affinity";
  if (key.startsWith("topaz")) return "topaz";
  if (["davinci-resolve", "fusion"].includes(key)) return "blackmagic";
  if (["cinema-4d", "redshift"].includes(key)) return "maxon";
  // A substitution cluster identifies alternatives, not an ecosystem. A
  // shared first word in a slug likewise does not establish compatibility.
  return normalizeKey(tool.bundle_parent || tool.host_app || key);
}

function countShared(values: string[] | undefined, sourceKeys: Set<string>) {
  return (values || []).map(normalizeKey).filter((value) => value && sourceKeys.has(value)).length;
}

function getLegacyRelation(candidate: ToolSummary, source: ToolSummary) {
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
  const sameFamily = getLegacyFamilyKey(candidate) === getLegacyFamilyKey(source);

  if (hostKey && sourceKeys.includes(hostKey)) {
    return { direction: "extensions" as const, score: 150, reasonFr: `Extension de ${source.name}`, reasonEn: `Extension for ${source.name}` };
  }
  if (sameBundle) {
    return { direction: "extensions" as const, score: 132, reasonFr: `Extension de ${source.name}`, reasonEn: `Extension for ${source.name}` };
  }
  if (sameCluster) {
    return { direction: "alternatives" as const, score: 118, reasonFr: `Alternative à ${source.name}`, reasonEn: `Alternative to ${source.name}` };
  }
  if (sameFamily) {
    return { direction: "adjacent" as const, score: 84, reasonFr: `Même écosystème que ${source.name}`, reasonEn: `Same ecosystem as ${source.name}` };
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
  relationPolicy,
  destinationId,
  getCategoryLabel,
  sourceTools,
  stackEntries,
  tools,
}: BuildExplorationCandidatesOptions): ExplorationCandidate[] {
  if (sourceTools.length === 0) return [];
  const audited = relationPolicy ? relationPolicy === "audited" : usesAuditedExplorationRelations(sourceTools);
  const relationFor = audited ? getRelation : getLegacyRelation;
  const familyFor = audited ? getFamilyKey : getLegacyFamilyKey;
  const sourceKeys = new Set(sourceTools.map(getExplorationToolKey));
  const entryBySlug = new Map(stackEntries.map((entry) => [entry.toolSlug, entry]));

  const ranked = tools.flatMap((tool) => {
    const toolSlug = getExplorationToolKey(tool);
    if (sourceKeys.has(toolSlug)) return [];
    const relations = sourceTools.flatMap((source) => {
      const relation = relationFor(tool, source);
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
      ...("comparisonNeedsReview" in relation && relation.comparisonNeedsReview ? { comparisonNeedsReview: true as const } : {}),
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
    const family = familyFor(candidate.tool);
    const relatedSlug = getExplorationToolKey(candidate.relatedSource);
    if (!relaxed && ((familyCounts.get(family) || 0) >= 2 || (sourceCounts.get(relatedSlug) || 0) >= 3)) return;
    picked.add(slug);
    familyCounts.set(family, (familyCounts.get(family) || 0) + 1);
    sourceCounts.set(relatedSlug, (sourceCounts.get(relatedSlug) || 0) + 1);
    diversified.push(candidate);
  };
  ranked.forEach((candidate) => tryPick(candidate));
  ranked.forEach((candidate) => tryPick(candidate, true));
  // Family diversity must not promote an unverified comparison above the
  // stronger declared relationships. The legacy order remains untouched.
  const ordered = audited
    ? [...diversified.filter(item => !item.comparisonNeedsReview), ...diversified.filter(item => item.comparisonNeedsReview)]
    : diversified;
  return ordered.slice(0, 40);
}

export function parseExplorationSource(params: URLSearchParams): ExplorationSource | null {
  const type = params.get("type");
  const source = params.get("source")?.trim();
  if (!source) return null;
  if (type === "objectif") return { type: "objectif", id: source };
  if (type === "outil") return { type: "outil", slug: source };
  if (type === "stack") return { type: "stack" };
  return null;
}

export function getExplorerHref(
  prefix: string,
  source: ExplorationSource,
  options: { angle?: ExplorationDirection; destination?: string | null } = {},
) {
  const params = new URLSearchParams();
  if (options.destination) params.set("destination", options.destination);
  if (options.angle && options.angle !== "all") params.set("angle", options.angle);
  const query = params.toString();
  // "outil" sources ("explore around Notion") get a real path segment so
  // they can each have their own prerendered, indexable static page — a
  // query-string identity can't do that, since a static host serves the
  // same file regardless of the query string. "objectif"/"stack" sources
  // stay query-string based: they're derived from a user's own picks, not
  // evergreen content worth a standalone URL, and remain noindexed.
  if (source.type === "outil") {
    return `${prefix}/explorer/around/${encodeURIComponent(source.slug)}${query ? `?${query}` : ""}`;
  }
  params.set("type", source.type);
  params.set("source", source.type === "objectif" ? source.id : "ma-stack");
  return `${prefix}/explorer?${params.toString()}`;
}
