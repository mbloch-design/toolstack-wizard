import {
  Banknote,
  BarChart2,
  Bot,
  Boxes,
  Camera,
  Check,
  Clock,
  Cloud,
  Code2,
  Database,
  Eye,
  FileText,
  FolderKanban,
  GraduationCap,
  Handshake,
  Headphones,
  Mail,
  Megaphone,
  MessageCircle,
  Palette,
  Search,
  Shield,
  ShoppingCart,
  Users,
  Video,
  Workflow,
  type LucideIcon,
} from "@/lib/icons";

// Ordered keyword buckets — most visually specific first, so e.g. a slug
// like "marketing-automation" lands on Megaphone rather than the generic
// Workflow catch-all at the bottom. Matched against the raw slug
// (covers / functional_needs), not the display label.
const FEATURE_ICON_RULES: [LucideIcon, string[]][] = [
  [Headphones, ["speech", "voix", "voice", "audio", "podcast", "music", "musical", "sfx", "mixing", "mastering", "enregistrement", "transcription", "voiceover", "sequencing", "loudness", "sound-design"]],
  [Video, ["video", "streaming", "webinaire", "motion", "clipping", "replays-sessions", "vfx", "effets-visuels", "sous-titrage"]],
  [Boxes, ["3d", "modelisation", "sculpture", "texturing", "mocap", "render-engine", "rendering", "rendu-3d"]],
  [Bot, ["ai-", "-ai", "ia-", "-ia", "chatbot", "assistant-generaliste", "agents", "integration-llm"]],
  [Camera, ["photo", "image", "detourage", "retouche", "watermark", "upscaling", "screen-capture", "screen-recording", "capture-ecran"]],
  [Palette, ["design", "ui-", "ux-", "brand", "logo", "mockup", "wireframe", "prototyp", "illustration", "moodboard", "typography", "vector", "icons", "iconographie", "sketching", "styling", "concept-art", "digital-painting", "graphic", "composants-ui", "direction-visuelle", "identite-visuelle", "maquette", "storyboard", "specs-design"]],
  [Code2, ["code", "-dev", "dev-", "api", "graphql", "css-in-js", "frontend", "ssr", "devops", "ci-cd", "snippets", "build-tooling", "webflow-logic", "state-management", "dom-manipulation", "proxy-infrastructure", "no-code", "nocode", "developer"]],
  [Handshake, ["crm", "vente", "sales", "lead", "prospect", "pipeline", "funnel", "upsell", "retention", "conversion", "deal"]],
  [Banknote, ["finance", "facturation", "paiement", "payment", "comptab", "payroll", "paie", "budgeting", "tax", "expense", "notes-frais", "bookkeeping", "consolidation-depenses", "kyc", "insurance", "business-funding", "business-loans"]],
  [ShoppingCart, ["ecommerce", "e-commerce", "shopify", "checkout", "inventory", "print-on-demand", "vente-prints", "vente-directe", "online-store", "amazon-tool"]],
  [Megaphone, ["marketing", "ad-optimization", "social", "sms-marketing", "brand-monitoring", "monetisation", "affiliat", "funnel-acquisition", "collecte-leads"]],
  [Search, ["seo", "recherche", "search", "sourcing"]],
  [Eye, ["veille", "monitoring", "tracking", "observabilite"]],
  [Mail, ["email", "newsletter", "mailing", "cold-email", "outbound-email"]],
  [Shield, ["security", "securite", "password", "mots-de-passe", "compliance", "conformite", "cybersecurity", "vendor-risk"]],
  [Cloud, ["cloud", "storage", "stockage", "backup", "hosting"]],
  [Database, ["database", "base-de-donnees", "data-collection", "data-enrichment", "data-extraction", "web-scraping", "b2b-data"]],
  [BarChart2, ["analytics", "reporting", "kpi", "dashboard", "data-visualization"]],
  [Clock, ["calendar", "scheduling", "rappels", "prise-rendez-vous", "time-tracking", "suivi-temps", "attendance", "time-clock"]],
  [Users, ["hr", "rh", "recruiting", "ats", "employee", "workforce", "sirh", "scoring-candidats", "onboarding-rh", "global-hr"]],
  [GraduationCap, ["formation", "training", "lms", "cours", "coaching", "certification", "online-courses"]],
  [FileText, ["document", "contract", "legal", "signature", "pdf", "wiki", "knowledge", "note", "brief", "documentation"]],
  [MessageCircle, ["chat", "support", "helpdesk", "contact-center", "call-center", "inbox", "communication", "phone", "voip", "messaging"]],
  [FolderKanban, ["project", "task", "todo", "to-do", "planning", "planification", "roadmap", "sprint", "priorisation", "work-management", "workflow", "process-management", "sop-documentation"]],
  [Workflow, ["automation", "automatisation"]],
];

/** Best-effort icon for a covers/functional_needs slug. Falls back to a
 * plain check when no keyword bucket matches. */
export function getFeatureIcon(slug: string): LucideIcon {
  for (const [Icon, keywords] of FEATURE_ICON_RULES) {
    if (keywords.some((kw) => slug.includes(kw))) return Icon;
  }
  return Check;
}
