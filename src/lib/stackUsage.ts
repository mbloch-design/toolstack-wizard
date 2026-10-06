import type { Category, Tool } from "@/data/types";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { getCategoryLabel } from "@/lib/categoryLabel";

type Label = readonly [string, string];
type UsageRule = { id: string; territory: string; label: Label; clusters: string[]; signals: string[] };
const territories: Record<string, Label> = {
  create: ["Créer", "Create"], communicate: ["Communiquer", "Communicate"],
  automate: ["Automatiser", "Automate"], build: ["Construire", "Build"],
  organize: ["Organiser", "Organize"], manage: ["Gérer", "Manage"],
  analyze: ["Analyser", "Analyze"], assist: ["S’appuyer sur l’IA", "Work with AI"],
  other: ["Autres usages", "Other uses"],
};
const label = (value: Label, lang: string) => value[lang === "en" ? 1 : 0];

// Audited catalogue vocabulary, not product-name guesses or description matching.
// Specific substitution clusters disambiguate broad/contradictory needs (Cinema 4D,
// ZBrush). Broad clusters such as content-creation/design-support are excluded.
const rules: UsageRule[] = [
  { id: "3d", territory: "create", label: ["3D", "3D"], clusters: ["3d-software", "render-engine", "plugin-sketchup"], signals: ["3d", "sculpture-3d", "modelisation-3d", "rendu-3d", "plugin-sketchup"] },
  { id: "video", territory: "create", label: ["Vidéo & Motion", "Video & Motion"], clusters: ["plugin-after-effects", "motion-compositing", "video-repurposing"], signals: ["motion-design", "motion-assets", "stock-video", "video-templates", "montage-video", "compositing", "after-effects-plugin", "color-grading", "effets-visuels"] },
  { id: "audio", territory: "create", label: ["Audio", "Audio"], clusters: ["audio-daw"], signals: ["montage-audio", "enregistrement-multipistes", "music-sfx", "audio-mastering", "podcast"] },
  { id: "interface", territory: "create", label: ["Interfaces & Prototypage", "Interfaces & Prototyping"], clusters: ["design-interface", "design-prototyping", "design-system-tooling", "figma-feature-suite"], signals: ["ui-design", "prototyping", "wireframing", "design-system"] },
  { id: "photo", territory: "create", label: ["Photo & Image", "Photo & Image"], clusters: ["photo-editor", "ai-image-enhancement", "ai-image-generation"], signals: ["retouche-photo", "photo-enhancement", "generation-image", "concept-art"] },
  { id: "design", territory: "create", label: ["Design visuel", "Visual design"], clusters: [], signals: ["design-visuel", "quick-design", "branding", "logos", "illustration-vectorielle", "social-assets", "brand-kit"] },
  { id: "writing", territory: "communicate", label: ["Écriture", "Writing"], clusters: ["writing-assistant"], signals: ["redaction", "correction-texte", "amelioration-style", "anglais-professionnel", "generation-texte"] },
  { id: "audience", territory: "communicate", label: ["Contenu & Audience", "Content & Audience"], clusters: ["seo-tools", "social-media-scheduler", "social-network"], signals: ["seo-video", "analytics-contenu", "idees-contenus", "seo", "social-media-management", "social-media"] },
  { id: "email", territory: "communicate", label: ["Email & Prospection", "Email & Outreach"], clusters: ["email-outreach", "newsletter-platform", "crm-prospection"], signals: ["email-marketing", "newsletter", "prospection", "lead-generation", "crm"] },
  { id: "team", territory: "communicate", label: ["Échanges & Support", "Conversations & Support"], clusters: ["team-communication", "communication-ops"], signals: ["chat-equipe", "team-chat", "customer-support", "video-async"] },
  { id: "workflows", territory: "automate", label: ["Workflows", "Workflows"], clusters: ["automation-orchestration"], signals: ["workflow-automation", "automatisation", "automation", "workflows", "api-integration"] },
  { id: "sites", territory: "build", label: ["Sites & Applications", "Sites & Applications"], clusters: ["nocode-web", "website-app-builder", "website-builder", "ai-app-builder"], signals: ["website-builder", "app-builder", "nocode-web", "ecommerce"] },
  { id: "hosting", territory: "build", label: ["Infrastructure & Déploiement", "Infrastructure & Deployment"], clusters: ["cloud-hosting-paas", "devops"], signals: ["devops", "deploiement", "hosting", "database", "ci-cd"] },
  { id: "code", territory: "build", label: ["Code & Composants", "Code & Components"], clusters: ["react-component-library", "ui-framework", "ui-components"], signals: ["coding", "code-review", "ui-components", "versioning-code"] },
  { id: "forms", territory: "build", label: ["Formulaires", "Forms"], clusters: ["form-builder"], signals: ["form-builder"] },
  { id: "projects", territory: "organize", label: ["Projets & Tâches", "Projects & Tasks"], clusters: ["project-management-general"], signals: ["project-management", "task-management", "gestion-projet", "gestion-taches", "time-tracking"] },
  { id: "knowledge", territory: "organize", label: ["Notes & Documents", "Notes & Documents"], clusters: ["knowledge-workspace", "ai-note-taking", "pdf-tools"], signals: ["notes", "knowledge-management", "documentation", "stockage-fichiers", "pdf-review", "document-delivery"] },
  { id: "storage", territory: "organize", label: ["Fichiers & Stockage", "Files & Storage"], clusters: ["cloud-storage"], signals: ["cloud-storage"] },
  { id: "planning", territory: "organize", label: ["Agenda & Rendez-vous", "Calendar & Scheduling"], clusters: [], signals: ["calendar", "planification", "booking", "scheduling"] },
  { id: "finance", territory: "manage", label: ["Finance & Paiements", "Finance & Payments"], clusters: ["finance-ops", "checkout-platforms"], signals: ["finance", "paiements", "facturation", "comptabilite", "paie"] },
  { id: "legal", territory: "manage", label: ["Contrats & Signatures", "Contracts & Signatures"], clusters: ["legal-contracts"], signals: ["legal-contracts", "signature"] },
  { id: "security", territory: "manage", label: ["Sécurité", "Security"], clusters: ["security", "password-manager"], signals: ["security", "password-management"] },
  { id: "data", territory: "analyze", label: ["Données & Mesure", "Data & Measurement"], clusters: ["analytics", "charting-library"], signals: ["analytics", "analytics-produit", "data-visualization", "charting"] },
  { id: "ai", territory: "assist", label: ["Assistants généralistes", "General assistants"], clusters: ["ai-general", "ai-text-generalist"], signals: ["ai-general", "assistant-generaliste", "ai-general-assistant"] },
];

export type StackPlacement = { territoryId: string; territory: string; id: string; label: string; evidence: "cluster" | "functional-needs" | "covers" | "category" };
type UsageTool = Pick<ToolSummary, "categoryId" | "functional_needs" | "covers" | "substitution_cluster_v2">;
export function stackPlacement(tool: UsageTool, categories: Category[], lang: string): StackPlacement {
  let evidence: StackPlacement["evidence"] = "cluster";
  let rule = rules.find((item) => item.clusters.includes(tool.substitution_cluster_v2 || ""));
  for (const field of ["functional_needs", "covers"] as const) {
    if (rule) break;
    const signals = new Set(tool[field] || []);
    const scored = rules.map((item) => ({ rule: item, score: item.signals.filter((signal) => signals.has(signal)).length }));
    const best = scored.reduce((a, b) => b.score > a.score ? b : a);
    if (best.score > 0) { rule = best.rule; evidence = field === "covers" ? "covers" : "functional-needs"; }
  }
  if (rule) return { territoryId: rule.territory, territory: label(territories[rule.territory], lang), id: rule.id, label: label(rule.label, lang), evidence };
  // Unknown vocabulary remains visible under its catalogue label. It does not
  // create a claimed semantic relationship or expose internal slugs in Focus.
  return { territoryId: "other", territory: label(territories.other, lang), id: `catalogue-${tool.categoryId || "unknown"}`, label: getCategoryLabel(categories.find((item) => item.id === tool.categoryId), lang) || (lang === "en" ? "Tools" : "Outils"), evidence: "category" };
}

export function stackMapTerritories(tools: ToolSummary[], categories: Category[], lang: string) {
  const grouped = new Map<string, { id: string; label: string; groups: { id: string; label: string; tools: ToolSummary[] }[]; tools: ToolSummary[] }>();
  for (const tool of tools) {
    const place = stackPlacement(tool, categories, lang);
    const territory = grouped.get(place.territoryId) || { id: place.territoryId, label: place.territory, groups: [], tools: [] };
    let group = territory.groups.find((item) => item.id === place.id);
    if (!group) { group = { id: place.id, label: place.label, tools: [] }; territory.groups.push(group); }
    group.tools.push(tool); territory.tools.push(tool); grouped.set(place.territoryId, territory);
  }
  return Array.from(grouped.values()).sort((a, b) => Object.keys(territories).indexOf(a.id) - Object.keys(territories).indexOf(b.id)).map((territory) => ({ ...territory,
    groups: territory.groups.sort((a, b) => a.label.localeCompare(b.label, lang)).map((group) => ({ ...group, tools: group.tools.sort((a, b) => (a.substitution_cluster_v2 || "").localeCompare(b.substitution_cluster_v2 || "") || a.name.localeCompare(b.name, lang)) })),
  }));
}

const usageLabels: Record<string, Label> = {
  "sculpture-3d": ["Sculpture 3D", "3D sculpting"], "3d": ["Création 3D", "3D creation"], "modelisation-3d": ["Modélisation 3D", "3D modeling"], "rendu-3d": ["Rendu 3D", "3D rendering"],
  "motion-design": ["Motion design", "Motion design"], "motion-assets": ["Ressources motion", "Motion assets"], "stock-video": ["Stock vidéo", "Stock footage"], "video-templates": ["Templates vidéo", "Video templates"], "music-sfx": ["Musique & Effets sonores", "Music & Sound effects"], "montage-video": ["Montage vidéo", "Video editing"], "effets-visuels": ["Effets visuels", "Visual effects"], compositing: ["Compositing", "Compositing"], "after-effects-plugin": ["Plugins After Effects", "After Effects plugins"], "color-grading": ["Étalonnage", "Color grading"],
  "montage-audio": ["Montage audio", "Audio editing"], "enregistrement-multipistes": ["Enregistrement multipiste", "Multitrack recording"],
  "ui-design": ["Design d’interfaces", "Interface design"], prototyping: ["Prototypage", "Prototyping"], wireframing: ["Wireframes", "Wireframes"], "design-system": ["Design systems", "Design systems"], brainstorming: ["Brainstorming", "Brainstorming"], collaboration: ["Collaboration", "Collaboration"],
  "retouche-photo": ["Retouche photo", "Photo editing"], "generation-image": ["Génération d’images", "Image generation"], "design-visuel": ["Design visuel", "Visual design"], "quick-design": ["Création graphique rapide", "Quick graphic design"], branding: ["Identité de marque", "Brand identity"], logos: ["Logos", "Logos"], "brand-kit": ["Kits de marque", "Brand kits"], "social-assets": ["Visuels sociaux", "Social assets"], "video-short-form": ["Vidéos courtes", "Short videos"],
  "correction-texte": ["Correction de texte", "Text correction"], "amelioration-style": ["Amélioration du style", "Style improvement"], "anglais-professionnel": ["Anglais professionnel", "Professional English"], redaction: ["Rédaction", "Writing"], "generation-texte": ["Génération de texte", "Text generation"],
  "seo-video": ["SEO vidéo", "Video SEO"], "analytics-contenu": ["Analyse de contenu", "Content analytics"], "idees-contenus": ["Idées de contenus", "Content ideas"], seo: ["Référencement", "SEO"], "social-media": ["Réseaux sociaux", "Social media"], "social-media-management": ["Gestion des réseaux sociaux", "Social media management"],
  "workflow-automation": ["Automatisation de workflows", "Workflow automation"], automatisation: ["Automatisation", "Automation"], workflows: ["Workflows", "Workflows"], "no-code": ["No-code", "No-code"], "website-builder": ["Création de sites", "Website building"], "app-builder": ["Création d’applications", "App building"], devops: ["DevOps", "DevOps"], deploiement: ["Déploiement", "Deployment"], coding: ["Code", "Coding"], database: ["Bases de données", "Databases"],
  "form-builder": ["Création de formulaires", "Form building"], "cloud-storage": ["Stockage cloud", "Cloud storage"], "assistant-generaliste": ["Assistant généraliste", "General assistant"], analyse: ["Analyse", "Analysis"], "analyse-documents": ["Analyse de documents", "Document analysis"], code: ["Code", "Coding"],
  "project-management": ["Gestion de projet", "Project management"], "task-management": ["Gestion de tâches", "Task management"], notes: ["Notes", "Notes"], "knowledge-management": ["Base de connaissances", "Knowledge management"], documentation: ["Documentation", "Documentation"], "pdf-review": ["Révision PDF", "PDF review"], "document-delivery": ["Livraison de documents", "Document delivery"], signature: ["Signature", "Signing"], "client-validation": ["Validation client", "Client approval"],
  "email-marketing": ["Email marketing", "Email marketing"], newsletter: ["Newsletter", "Newsletter"], prospection: ["Prospection", "Outreach"], crm: ["CRM", "CRM"], finance: ["Finance", "Finance"], paiements: ["Paiements", "Payments"], facturation: ["Facturation", "Invoicing"], comptabilite: ["Comptabilité", "Accounting"], analytics: ["Analyse de données", "Analytics"], "data-visualization": ["Visualisation de données", "Data visualization"], security: ["Sécurité", "Security"], "legal-contracts": ["Contrats", "Contracts"],
};
export function stackUsageLabels(tool: UsageTool, lang: string): string[] {
  const primary = rules.find((rule) => rule.id === stackPlacement(tool, [], lang).id);
  const keys = Array.from(new Set([...(tool.functional_needs || []), ...(tool.covers || [])]));
  const rank = (key: string) => primary?.signals.includes(key) ? primary.signals.indexOf(key) : 100;
  return Array.from(new Set(keys.sort((a, b) => rank(a) - rank(b)).flatMap((key) => usageLabels[key] ? [label(usageLabels[key], lang)] : []))).slice(0, 6);
}

// Broad editorial labels describe a territory, not a specific functional link.
const broadRelationUses = new Set(["3d", "motion-design", "design-visuel", "collaboration", "brainstorming", "branding", "social-media", "assistant-generaliste", "analyse", "code", "coding", "workflows", "automatisation", "no-code", "devops", "finance", "security"]);

export function stackRelations(source: ToolSummary | Tool, selected: ToolSummary[], categories: Category[], lang: string) {
  const keys = (tool: ToolSummary | Tool) => [tool.id, tool.slug, tool.name].filter(Boolean).map((key) => key!.toLowerCase());
  const refs = (tool: ToolSummary | Tool) => [...("alternatives" in tool ? tool.alternatives || [] : []), tool.freeAlternative, tool.betterAlternative?.tool].filter(Boolean).map((key) => key!.toLowerCase());
  const place = stackPlacement(source, categories, lang);
  const sourceUses = new Set([...(source.functional_needs || []), ...(source.covers || [])]);
  return selected.flatMap((tool) => {
    if (tool.id === source.id) return [];
    const explicit = refs(source).some((ref) => keys(tool).includes(ref)) || refs(tool).some((ref) => keys(source).includes(ref));
    const other = stackPlacement(tool, categories, lang);
    const shared = place.evidence !== "category" && other.evidence !== "category" && place.id === other.id;
    // Match catalogue identifiers, never translated labels or inferred features.
    const commonUses = Array.from(new Set([...(tool.functional_needs || []), ...(tool.covers || [])]))
      .filter((key) => sourceUses.has(key) && usageLabels[key] && !broadRelationUses.has(key))
      .map((key) => label(usageLabels[key], lang));
    if (!explicit && !shared && commonUses.length === 0) return [];
    const relationLabel = explicit ? (lang === "en" ? "Known alternative in your stack" : "Alternative connue dans votre stack")
      : commonUses.length > 0 ? (lang === "en" ? "Shared catalogue uses" : "Usages communs au catalogue")
      : (lang === "en" ? `Also in ${place.label}` : `Également dans ${place.label}`);
    return [{ tool, label: relationLabel, commonUses: Array.from(new Set(commonUses)), explicit }];
  }).sort((a, b) => Number(b.explicit) - Number(a.explicit) || Number(b.commonUses.length > 0) - Number(a.commonUses.length > 0));
}

/** Plain display language; keeps catalogue signals and relationship rules unchanged. */
export function stackDisplayLabel(label: string, lang: "fr" | "en"): string {
  if (lang !== "fr") return label;
  const labels: Record<string, string> = {
    "Workflows": "Automatisation de tâches",
    "Vidéo & Motion": "Vidéo et animation",
    "Motion design": "Animation graphique",
    "Interfaces & Prototypage": "Interfaces et prototypes",
    "No-code": "Création sans code",
  };
  return labels[label] || label;
}
