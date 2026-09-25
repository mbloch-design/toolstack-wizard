/**
 * Catalogue filtering shared by /tools and the category pages: price facts,
 * search text, use facets and search-demand ranking. One definition, so a
 * "Free plan" filter or a "Popular" sort means the same thing everywhere.
 */
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { hasGenuineFreeTier } from "@/lib/pricing";
import toolDemand from "@/data/tool_demand.json";

/**
 * Price facts for filtering and sorting. A 0 comparison price is not "free":
 * on 183 tools it only means the vendor publishes no price. "Free plan" needs
 * positive evidence of a genuine free tier.
 */
export function hasFreePlan(tool: ToolSummary): boolean {
  const pricing = tool.pricing as { free?: string } | string | null | undefined;
  if (pricing && typeof pricing === "object") return hasGenuineFreeTier(pricing.free);
  if (typeof pricing === "string") return !tool.priceUndisclosed && /gratuit|free|open.?source/i.test(pricing);
  return false;
}
export function knownPrice(tool: ToolSummary): number | null {
  const price = Number(tool.compareMonthlyPrice || tool.defaultMonthlyPrice) || 0;
  if (price > 0) return price;
  return hasFreePlan(tool) ? 0 : null; // null: unknown, sorts last
}
export function isPaid(tool: ToolSummary): boolean {
  const pricing = tool.pricing as { paid?: string } | string | null | undefined;
  return (Number(tool.compareMonthlyPrice || tool.defaultMonthlyPrice) || 0) > 0
    || Boolean(pricing && typeof pricing === "object" && pricing.paid);
}

export function normalizeToolText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getToolSearchText(tool: ToolSummary, categoryLabel = "") {
  return normalizeToolText([
    tool.name,
    tool.categoryId,
    categoryLabel,
    tool.shortDescription,
    tool.shortDescriptionEn,
    ...(tool.verticals || []),
    ...(tool.covers || []),
    ...(tool.functional_needs || []),
  ].join(" "));
}

const FACET_LABELS_FR: Record<string, string> = {
  "ai-assistant": "Assistant IA",
  "ai-generation": "Génération IA",
  animation: "Animation",
  analytics: "Analytics",
  automation: "Automatisation",
  booking: "Prise de rendez-vous",
  branding: "Identité visuelle",
  calendar: "Calendrier",
  collaboration: "Collaboration",
  communication: "Communication",
  crm: "CRM",
  "design-collaboration": "Collaboration design",
  "email-marketing": "Email marketing",
  hosting: "Hébergement",
  invoicing: "Facturation",
  "landing-page": "Landing pages",
  "project-management": "Gestion de projet",
  prototyping: "Prototypage",
  seo: "SEO",
  "social-media": "Réseaux sociaux",
  "task-management": "Gestion des tâches",
  "ui-components": "Composants UI",
  "ui-design": "Design UI",
  video: "Vidéo",
  "website-builder": "Création de sites",
  wireframing: "Wireframes",
};

/**
 * Les facettes sont stockées en français dans le catalogue. Sans traduction,
 * la version anglaise affichait « Redaction », « Facturation » ou
 * « Tests Utilisateurs » au milieu de libellés anglais.
 */
const FACET_LABELS_EN: Record<string, string> = {
  analyse: "Analysis",
  "analytics-produit": "Product analytics",
  "animation-2d-3d": "2D & 3D animation",
  "assistant-generaliste": "General assistant",
  automatisation: "Automation",
  "base-de-donnees": "Database",
  "catalogue-photo": "Photo catalogue",
  "chat-equipe": "Team chat",
  communaute: "Community",
  comptabilite: "Accounting",
  "compte-pro": "Business account",
  "cours-en-ligne": "Online courses",
  "creation-cours": "Course creation",
  deploiement: "Deployment",
  "design-visuel": "Visual design",
  detourage: "Cutout",
  "editeur-email": "Email editor",
  "effets-visuels": "Visual effects",
  "enregistrement-multipistes": "Multitrack recording",
  "evenements-live": "Live events",
  facturation: "Invoicing",
  "feedback-utilisateurs": "User feedback",
  formation: "Training",
  formulaires: "Forms",
  "generation-code": "Code generation",
  "generation-image": "Image generation",
  "generation-video": "Video generation",
  "gestion-incidents": "Incident management",
  "hebergement-audio": "Audio hosting",
  "illustration-vectorielle": "Vector illustration",
  "inspection-code": "Code review",
  "mise-en-page": "Layout",
  "modelisation-3d": "3D modelling",
  "montage-audio": "Audio editing",
  "mots-de-passe": "Passwords",
  paie: "Payroll",
  paiements: "Payments",
  partage: "Sharing",
  planification: "Scheduling",
  "plugin-sketchup": "SketchUp plugin",
  "presentation-client": "Client presentation",
  "prise-rendez-vous": "Appointment booking",
  prospection: "Prospecting",
  publication: "Publishing",
  "publication-web": "Web publishing",
  redaction: "Writing",
  "rendu-3d": "3D rendering",
  "retouche-photo": "Photo retouching",
  "roadmap-produit": "Product roadmap",
  securite: "Security",
  "stockage-fichiers": "File storage",
  "tests-utilisateurs": "User testing",
  // Devenues visibles en supprimant la troncature à douze facettes.
  "analyse-documents": "Document analysis",
  "analytics-contenu": "Content analytics",
  "analytics-reseaux": "Social analytics",
  "creation-musicale": "Music creation",
  "creation-sites": "Site building",
  "direction-visuelle": "Art direction",
  "facturation-temps": "Time billing",
  "gestion-assets": "Asset management",
  "gestion-conges": "Leave management",
  "gestion-documentaire": "Document management",
  "gestion-inbox": "Inbox management",
  "gestion-notes-frais": "Expense management",
  "gestion-pipeline-rh": "HR pipeline",
  "gestion-produit": "Product management",
  "gestion-raw": "Raw management",
  "idees-contenus": "Content ideas",
  "identite-visuelle": "Visual identity",
  "liens-entre-notes": "Linked notes",
  "logo-creation": "Logo design",
  monetisation: "Monetisation",
  "monetisation-newsletter": "Newsletter monetisation",
  "monetisation-podcast": "Podcast monetisation",
  "monetisation-video": "Video monetisation",
  "montage-video": "Video editing",
  "montage-video-court": "Short-form editing",
  notes: "Notes",
  "notes-frais": "Expense reports",
  "notes-reunion": "Meeting notes",
  "planification-posts": "Post scheduling",
  "retouche-photo-mobile": "Mobile retouching",
  "storytelling-visuel": "Visual storytelling",
  "suivi-emails": "Email tracking",
  "suivi-issues": "Issue tracking",
  "suivi-temps": "Time tracking",
  taches: "Tasks",
  "temps-reel": "Real time",
};

/** Jetons que la capitalisation mot à mot écrirait « Seo », « Bim » ou « 3d ». */
const FACET_TOKEN_LABELS: Record<string, string> = {
  "2d": "2D",
  "3d": "3D",
  ai: "AI",
  bim: "BIM",
  crm: "CRM",
  devops: "DevOps",
  lms: "LMS",
  pdf: "PDF",
  seo: "SEO",
  ui: "UI",
  ux: "UX",
};

export function formatFacetLabel(value: string, lang: string) {
  const mapped = lang === "fr" ? FACET_LABELS_FR[value] : FACET_LABELS_EN[value];
  if (mapped) return mapped;
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => FACET_TOKEN_LABELS[part] ?? part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Use facets of a tool, normalised (functional needs and covered uses). */
export function toolFacets(tool: ToolSummary): Set<string> {
  return new Set([...(tool.functional_needs || []), ...(tool.covers || [])]
    .map((tag) => normalizeToolText(tag).trim())
    .filter(Boolean));
}

const DEMAND = (toolDemand as { impressions: Record<string, number> }).impressions;

/** Google Search impressions of a tool's pages: real demand, never fiche maturity. */
export function toolDemandOf(tool: Pick<ToolSummary, "id" | "slug">): number {
  return DEMAND[tool.slug || tool.id] || 0;
}

/** "Popular" order: search demand, then name. */
export function compareByDemand(a: ToolSummary, b: ToolSummary): number {
  return toolDemandOf(b) - toolDemandOf(a) || (a.name ?? "").localeCompare(b.name ?? "");
}
