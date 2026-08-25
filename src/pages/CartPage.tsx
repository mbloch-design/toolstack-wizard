import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Compass, GripVertical, Heart, MoreHorizontal, Pencil, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { ToolCardEditorial } from "@/components/ToolCardEditorial";
import ToolLogo from "@/components/ToolLogo";
import StackToolInspector from "@/components/stack/StackToolInspector";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import { useCategories, useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { scrollToTop } from "@/lib/scroll";
import { classifyToolForStack } from "@/lib/stackAutoClassification";
import { computeStackPricing, formatStackToolPrice } from "@/lib/stackPricing";
import { getExplorerHref } from "@/lib/toolExploration";

type StackBoard = {
  id: string;
  labelFr: string;
  labelEn: string;
  pattern: RegExp;
  source?: "suggested" | "custom";
};

type StackViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => unknown;
};

function runStackViewTransition(update: () => void) {
  const transitionDocument = document as StackViewTransitionDocument;
  if (!transitionDocument.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return;
  }
  transitionDocument.startViewTransition(() => flushSync(update));
}

type StackObjective = StackBoard & {
  tools: ToolSummary[];
};

type StackSubdomain = {
  id: string;
  labelFr: string;
  labelEn: string;
  descriptionFr: string;
  descriptionEn: string;
  order: number;
  pattern?: RegExp;
};

type StackSubdomainGroup = StackSubdomain & {
  tools: ToolSummary[];
};

type StackSubdomainOverrides = Record<string, Record<string, string>>;

const STACK_SUBDOMAIN_OVERRIDES_KEY = "tooltrim-ma-stack-subdomains-v1";

function readStackSubdomainOverrides(): StackSubdomainOverrides {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STACK_SUBDOMAIN_OVERRIDES_KEY) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).flatMap(([boardId, value]) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return [];
      const entries = Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string");
      return entries.length > 0 ? [[boardId, Object.fromEntries(entries)]] : [];
    }));
  } catch {
    return {};
  }
}

type PickerFilterId = "recommended" | "objective" | "plugins" | "ai" | "budget";
type PickerCandidate = {
  categoryLabel: string;
  boardScore: number;
  score: number;
  subdomainId?: string;
  tool: ToolSummary;
};


type DesignPickerContext = {
  activeSubdomainIds: Set<string>;
  selectedBundleParentCounts: Map<string, number>;
  selectedBundleParentKeys: Set<string>;
  selectedFamilyKeys: Set<string>;
  selectedNeedKeys: Set<string>;
  selectedSubdomainCounts: Map<string, number>;
  selectedToolKeys: Set<string>;
  selectedToolCount: number;
};

type ObjectivePickerConfig = {
  boardId: string;
  categoryIds: string[];
  coreSubdomainOrder: string[];
  familyCap?: number;
  minScore?: number;
  pluginCap?: number;
  signalKeys: string[];
  starterToolIds: string[];
  strictSignal?: boolean;
  subdomainCap?: number;
  supportSubdomainIds?: string[];
};

const PICKER_RESULT_BATCH = 8;
const GLOBAL_STACK_PICKER_ID = "__all-tools__";

type CreativeStackSubdomain = StackSubdomain & {
  toolIds?: string[];
  signalKeys?: string[];
};

const STACK_BOARDS: StackBoard[] = [
  {
    id: "ia",
    labelFr: "IA",
    labelEn: "AI",
    pattern: /\bia\b|\bai\b|gpt|llm|claude|chatgpt|midjourney|generation|generative|assistant|prompt/i,
  },
  {
    id: "organisation",
    labelFr: "Organisation",
    labelEn: "Organization",
    pattern: /organis|project|projet|task|todo|kanban|note|doc|wiki|calendar|agenda|workspace|collaboration|meeting/i,
  },
  {
    id: "design",
    labelFr: "Design",
    labelEn: "Design",
    pattern: /design|figma|prototype|photo|image|visual|visuel|canvas|brand|branding|logo|video|vidéo|motion|3d|rendu|render|illustration|retouche|photoshop|lightroom|blender|sketch|canva|audio|podcast/i,
  },
  {
    id: "automation",
    labelFr: "Automatisation",
    labelEn: "Automation",
    pattern: /automat|workflow|zapier|make|n8n|integration|api|nocode|no-code|trigger|connector/i,
  },
  {
    id: "marketing",
    labelFr: "Marketing",
    labelEn: "Marketing",
    pattern: /marketing|seo|content|contenu|social|newsletter|email|campaign|ads|analytics|audience|growth/i,
  },
  {
    id: "vente",
    labelFr: "Vente",
    labelEn: "Sales",
    pattern: /crm|sales|vente|client|lead|prospect|pipeline|ecommerce|shop|payment|checkout|stripe|booking/i,
  },
  {
    id: "finance",
    labelFr: "Finance",
    labelEn: "Finance",
    pattern: /finance|account|compta|invoice|factur|billing|budget|expense|payroll|bank|tax/i,
  },
  {
    id: "dev",
    labelFr: "Dev",
    labelEn: "Dev",
    pattern: /dev|code|github|git|deploy|hosting|database|data|backend|frontend|monitoring|security|securite/i,
  },
];

const STACK_SUBDOMAINS: StackSubdomain[] = [
  {
    id: "ia-generative",
    labelFr: "IA générative",
    labelEn: "Generative AI",
    descriptionFr: "Assistants, modèles généralistes, génération et aide à la production.",
    descriptionEn: "Assistants, general models, generation and production support.",
    order: 5,
    pattern: /gpt|llm|claude|chatgpt|gemini|deepseek|mistral|perplexity|copilot|assistant|prompt/i,
  },
  {
    id: "retouche-photo",
    labelFr: "Retouche photo",
    labelEn: "Photo editing",
    descriptionFr: "Outils pour corriger, composer, préparer et organiser les images.",
    descriptionEn: "Tools to correct, compose, prepare and organize images.",
    order: 10,
    pattern: /retouche-photo|photo|photographe|photoshop|lightroom|raw|compositing|image-edit|upscale|background/i,
  },
  {
    id: "montage-video",
    labelFr: "Montage vidéo",
    labelEn: "Video editing",
    descriptionFr: "Montage, sous-titrage, export et production vidéo quotidienne.",
    descriptionEn: "Editing, subtitles, export and day-to-day video production.",
    order: 20,
    pattern: /montage-video|video|vidéo|premiere|davinci|capcut|subtitle|sous-titre|review-client-video|rendu-video/i,
  },
  {
    id: "motion-3d",
    labelFr: "Motion / 3D",
    labelEn: "Motion / 3D",
    descriptionFr: "Animation, modélisation, rendu et effets visuels.",
    descriptionEn: "Animation, modeling, rendering and visual effects.",
    order: 30,
    pattern: /motion|3d|animation-2d-3d|motion-design|modelisation|modélisation|rendu-3d|after-effects|blender|spline|sketchup|cinema|enscape|v-ray|twinmotion|d5-render/i,
  },
  {
    id: "audio-podcast",
    labelFr: "Audio / podcast",
    labelEn: "Audio / podcast",
    descriptionFr: "Enregistrement, amélioration audio, montage et diffusion podcast.",
    descriptionEn: "Recording, audio enhancement, editing and podcast publishing.",
    order: 40,
    pattern: /audio|podcast|montage-audio|qualite-podcast|qualité-podcast|hebergement-audio|distribution-podcast|voice|transcription/i,
  },
  {
    id: "design-system",
    labelFr: "Design system",
    labelEn: "Design system",
    descriptionFr: "Composants, tokens, librairies, cohérence UI et handoff.",
    descriptionEn: "Components, tokens, libraries, UI consistency and handoff.",
    order: 50,
    pattern: /design-system|ui-components|component|tokens|handoff|dev mode|accessibility|version-control|library|librairie/i,
  },
  {
    id: "prototypage",
    labelFr: "Prototypage",
    labelEn: "Prototyping",
    descriptionFr: "Maquettes, prototypes, parcours, collaboration et validation.",
    descriptionEn: "Mockups, prototypes, flows, collaboration and validation.",
    order: 60,
    pattern: /prototype|prototyping|wireframe|mockup|figma|framer|webflow|design-collaboration|commenting|feedback/i,
  },
  {
    id: "creation-visuelle",
    labelFr: "Création visuelle",
    labelEn: "Visual creation",
    descriptionFr: "Création graphique, identité, contenus et déclinaisons visuelles.",
    descriptionEn: "Graphic creation, identity, content and visual variations.",
    order: 70,
    pattern: /design-visuel|graphic design|brand|branding|logo|illustration|creative|creation|création|canva|presentation|présentation|image/i,
  },
  {
    id: "automation",
    labelFr: "Automation",
    labelEn: "Automation",
    descriptionFr: "Connexions, workflows, API et tâches répétitives automatisées.",
    descriptionEn: "Connections, workflows, APIs and automated repetitive tasks.",
    order: 80,
    pattern: /automation|automatisation|workflow|api|integration|intégration|zapier|make|n8n|connector|trigger/i,
  },
  {
    id: "marketing",
    labelFr: "Marketing / contenu",
    labelEn: "Marketing / content",
    descriptionFr: "Publication, SEO, social, campagnes, newsletter et mesure.",
    descriptionEn: "Publishing, SEO, social, campaigns, newsletter and measurement.",
    order: 90,
    pattern: /marketing|seo|content|contenu|social|newsletter|email|ads|campaign|audience|analytics|growth/i,
  },
  {
    id: "gestion",
    labelFr: "Gestion / organisation",
    labelEn: "Management / organization",
    descriptionFr: "Projets, notes, clients, fichiers, calendrier et coordination.",
    descriptionEn: "Projects, notes, clients, files, calendar and coordination.",
    order: 100,
    pattern: /project|projet|task|todo|kanban|note|doc|wiki|calendar|agenda|crm|client|workspace|collaboration/i,
  },
];

const OBJECTIVE_STACK_SUBDOMAINS: Record<string, StackSubdomain[]> = {
  ia: [
    {
      id: "ia-assistants",
      labelFr: "Assistants et recherche",
      labelEn: "Assistants and search",
      descriptionFr: "Chat, recherche augmentée, analyse de documents et aide à la décision.",
      descriptionEn: "Chat, augmented search, document analysis and decision support.",
      order: 10,
      pattern: /chatgpt|claude|perplexity|gemini|mistral|deepseek|assistant|generation-texte|analyse-documents|brainstorming|llm|prompt/i,
    },
    {
      id: "ia-creative",
      labelFr: "Création IA",
      labelEn: "AI creation",
      descriptionFr: "Images, vidéos, exploration visuelle, voix et accélération créative.",
      descriptionEn: "Images, videos, visual exploration, voice and creative acceleration.",
      order: 20,
      pattern: /generation-image|generation-video|ai-image|midjourney|firefly|runway|ideogram|krea|leonardo|figma-weave|weavy|voice|audio-cleanup/i,
    },
    {
      id: "ia-code",
      labelFr: "Code et agents",
      labelEn: "Code and agents",
      descriptionFr: "Aide au développement, génération d'apps, agents et intégrations LLM.",
      descriptionEn: "Development help, app generation, agents and LLM integrations.",
      order: 30,
      pattern: /coding|code|github-copilot|cursor|bolt|app-builder|ai-builder|integration-llm|agent/i,
    },
    {
      id: "ia-meeting-data",
      labelFr: "Réunions et données",
      labelEn: "Meetings and data",
      descriptionFr: "Transcription, synthèse, données vectorielles et recherche interne.",
      descriptionEn: "Transcription, summaries, vector data and internal search.",
      order: 40,
      pattern: /transcription|meeting|otter|notebook|vector|pgvector|data|knowledge|search/i,
    },
  ],
  organisation: [
    {
      id: "org-projects",
      labelFr: "Projets et tâches",
      labelEn: "Projects and tasks",
      descriptionFr: "Pilotage, priorités, tâches, roadmap et suivi du travail.",
      descriptionEn: "Planning, priorities, tasks, roadmap and work tracking.",
      order: 10,
      pattern: /project-management|task-management|kanban|roadmap|todo|asana|clickup|trello|monday|basecamp/i,
    },
    {
      id: "org-docs",
      labelFr: "Notes et documentation",
      labelEn: "Notes and documentation",
      descriptionFr: "Notes, wiki, documents, bases de connaissance et références.",
      descriptionEn: "Notes, wiki, documents, knowledge bases and references.",
      order: 20,
      pattern: /notes|documentation|wiki|knowledge-base|productivity-docs|notion|coda|confluence|google-docs/i,
    },
    {
      id: "org-files",
      labelFr: "Fichiers et partage",
      labelEn: "Files and sharing",
      descriptionFr: "Stockage, partage, sauvegarde et accès aux fichiers.",
      descriptionEn: "Storage, sharing, backup and file access.",
      order: 30,
      pattern: /storage|stockage|cloud-storage|drive|dropbox|box|fichiers|files/i,
    },
    {
      id: "org-team",
      labelFr: "Communication équipe",
      labelEn: "Team communication",
      descriptionFr: "Messagerie, réunions, calendrier et coordination quotidienne.",
      descriptionEn: "Messaging, meetings, calendar and day-to-day coordination.",
      order: 40,
      pattern: /team-communication|meeting|calendar|slack|teams|chat|agenda|collaboration/i,
    },
  ],
  automation: [
    {
      id: "auto-workflows",
      labelFr: "Workflows",
      labelEn: "Workflows",
      descriptionFr: "Scénarios, déclencheurs, connexions entre outils et tâches répétitives.",
      descriptionEn: "Scenarios, triggers, tool connections and repetitive tasks.",
      order: 10,
      pattern: /workflow|workflows|trigger|automation|automatisation|make|zapier|n8n|activepieces|connector/i,
    },
    {
      id: "auto-apps",
      labelFr: "Apps no-code",
      labelEn: "No-code apps",
      descriptionFr: "Création d'apps, portails, bases métier et interfaces internes.",
      descriptionEn: "Apps, portals, business databases and internal interfaces.",
      order: 20,
      pattern: /no-code|nocode|app-builder|base44|bolt|bubble|softr|webflow|firebase/i,
    },
    {
      id: "auto-data",
      labelFr: "Données et API",
      labelEn: "Data and APIs",
      descriptionFr: "API, synchronisation, bases de données et enrichissement.",
      descriptionEn: "APIs, sync, databases and enrichment.",
      order: 30,
      pattern: /api|integration|data|database|sync|airtable|supabase|firebase/i,
    },
  ],
  marketing: [
    {
      id: "mkt-email",
      labelFr: "Email et newsletter",
      labelEn: "Email and newsletter",
      descriptionFr: "Newsletters, automatisation email, nurturing et mesure email.",
      descriptionEn: "Newsletters, email automation, nurturing and email measurement.",
      order: 10,
      pattern: /email-marketing|newsletter|automation-email|editeur-email|mailchimp|brevo|beehiiv|convertkit|getresponse/i,
    },
    {
      id: "mkt-social-content",
      labelFr: "Contenu et social",
      labelEn: "Content and social",
      descriptionFr: "Création de contenus, planification, réutilisation et réseaux sociaux.",
      descriptionEn: "Content creation, scheduling, repurposing and social media.",
      order: 20,
      pattern: /content|contenu|social|planification-posts|buffer|metricool|later|canva|adcreative|castmagic/i,
    },
    {
      id: "mkt-analytics",
      labelFr: "Analytics et SEO",
      labelEn: "Analytics and SEO",
      descriptionFr: "Trafic, attribution, SEO, conversion et reporting.",
      descriptionEn: "Traffic, attribution, SEO, conversion and reporting.",
      order: 30,
      pattern: /analytics|seo|web-analytics|conversion-tracking|campaign-measurement|posthog|hotjar|google-analytics|looker|semrush|ahrefs/i,
    },
    {
      id: "mkt-crm",
      labelFr: "CRM marketing",
      labelEn: "Marketing CRM",
      descriptionFr: "Audience, leads, segmentation et campagnes relationnelles.",
      descriptionEn: "Audience, leads, segmentation and relationship campaigns.",
      order: 40,
      pattern: /crm-marketing|lead|audience|hubspot|activecampaign|campaign/i,
    },
  ],
  vente: [
    {
      id: "sales-crm",
      labelFr: "CRM et pipeline",
      labelEn: "CRM and pipeline",
      descriptionFr: "Contacts, opportunités, pipeline, suivi commercial et relances.",
      descriptionEn: "Contacts, opportunities, pipeline, sales tracking and follow-ups.",
      order: 10,
      pattern: /crm|pipeline|client-management|hubspot|pipedrive|salesforce|close|folk|capsule/i,
    },
    {
      id: "sales-prospecting",
      labelFr: "Prospection",
      labelEn: "Prospecting",
      descriptionFr: "Leads, données, prospection sortante et intelligence commerciale.",
      descriptionEn: "Leads, data, outbound and sales intelligence.",
      order: 20,
      pattern: /lead-generation|sales-intelligence|outbound|prospection|apollo|clearbit|cognism|data-enrichment/i,
    },
    {
      id: "sales-meetings",
      labelFr: "Rendez-vous et relation",
      labelEn: "Meetings and relationship",
      descriptionFr: "Prise de rendez-vous, appels, messagerie client et suivi relationnel.",
      descriptionEn: "Booking, calls, client messaging and relationship follow-up.",
      order: 30,
      pattern: /booking|prise-rendez-vous|calendly|aircall|call-center|business-phone|front|intercom|communication/i,
    },
    {
      id: "sales-checkout",
      labelFr: "Paiement et checkout",
      labelEn: "Payment and checkout",
      descriptionFr: "Vente en ligne, paiement, panier, facturation et support marchand.",
      descriptionEn: "Online sales, payment, cart, billing and merchant support.",
      order: 40,
      pattern: /payment|checkout|stripe|shopify|gumroad|paypal|gorgias|ecommerce/i,
    },
  ],
  finance: [
    {
      id: "fin-accounting",
      labelFr: "Compta et facturation",
      labelEn: "Accounting and invoicing",
      descriptionFr: "Factures, comptabilité, trésorerie, rapprochement et déclarations.",
      descriptionEn: "Invoices, accounting, cash flow, reconciliation and filings.",
      order: 10,
      pattern: /accounting|invoice|facturation|freshbooks|quickbooks|pennylane|indy|stripe|paypal|bookkeeping/i,
    },
    {
      id: "fin-expenses",
      labelFr: "Dépenses et justificatifs",
      labelEn: "Expenses and receipts",
      descriptionFr: "Notes de frais, reçus, justificatifs et préparation comptable.",
      descriptionEn: "Expenses, receipts, documents and bookkeeping prep.",
      order: 20,
      pattern: /expense|receipt|dext|expensify|coast|expense-documents|receipt-capture/i,
    },
    {
      id: "fin-payroll",
      labelFr: "Paie et contrats",
      labelEn: "Payroll and contracts",
      descriptionFr: "Paie, contrats, signatures, RH et conformité administrative.",
      descriptionEn: "Payroll, contracts, signatures, HR and admin compliance.",
      order: 30,
      pattern: /payroll|hris|contract|legal-contracts|deel|gusto|docusign|adobe-acrobat-sign|contractor/i,
    },
    {
      id: "fin-planning",
      labelFr: "Budget et pilotage",
      labelEn: "Budget and planning",
      descriptionFr: "Budget, prévisionnel, reporting financier et pilotage.",
      descriptionEn: "Budget, forecasts, financial reporting and planning.",
      order: 40,
      pattern: /budget|budgeting-fpa|fpa|forecast|anaplan|google-sheets|reporting/i,
    },
  ],
  dev: [
    {
      id: "dev-code",
      labelFr: "Code et dépôt",
      labelEn: "Code and repository",
      descriptionFr: "Code, versioning, revue, composants et collaboration dev.",
      descriptionEn: "Code, versioning, review, components and dev collaboration.",
      order: 10,
      pattern: /code|github|git|versioning-code|code-review|react|ui-components|frontend-framework|cursor|copilot/i,
    },
    {
      id: "dev-deploy",
      labelFr: "Déploiement et hosting",
      labelEn: "Deployment and hosting",
      descriptionFr: "Déploiement, hébergement, CI/CD, backend et environnements.",
      descriptionEn: "Deployment, hosting, CI/CD, backend and environments.",
      order: 20,
      pattern: /deploy|hosting|ci-cd|vercel|netlify|fly|digitalocean|firebase|docker|backend/i,
    },
    {
      id: "dev-data",
      labelFr: "Données et API",
      labelEn: "Data and APIs",
      descriptionFr: "Bases de données, API, auth, stockage et synchronisation.",
      descriptionEn: "Databases, APIs, auth, storage and synchronization.",
      order: 30,
      pattern: /database|data|api|supabase|firebase|postgres|graphql|data-fetching|state-management/i,
    },
    {
      id: "dev-monitoring",
      labelFr: "Monitoring et sécurité",
      labelEn: "Monitoring and security",
      descriptionFr: "Observabilité, incidents, mots de passe, secrets et sécurité.",
      descriptionEn: "Observability, incidents, passwords, secrets and security.",
      order: 40,
      pattern: /monitoring|observabilite|incident|security|securite|sentry|datadog|1password|bitwarden|dashlane/i,
    },
  ],
};

const CREATIVE_STACK_SUBDOMAINS: CreativeStackSubdomain[] = [
  {
    id: "creative-brief-input",
    labelFr: "Briefs et références",
    labelEn: "Briefs and references",
    descriptionFr: "Entrée du projet : brief, moodboard, références, notes et fichiers sources.",
    descriptionEn: "Project intake: brief, moodboard, references, notes and source files.",
    order: 5,
    toolIds: ["milanote", "notion", "google-drive", "dropbox", "pure-ref", "arena", "miro", "whimsical", "excalidraw", "airtable", "pitch"],
    signalKeys: ["brief", "moodboard", "references", "documentation", "storage", "stockage-fichiers", "cloud-storage", "partage", "notes", "presentation-client"],
    pattern: /brief|moodboard|reference|référence|documentation|storage|stockage|notes|milanote|pure-ref|drive|dropbox|miro/i,
  },
  {
    id: "creative-photo-retouch",
    labelFr: "Photo et retouche",
    labelEn: "Photo and retouching",
    descriptionFr: "Développement RAW, retouche, détourage, finition image et galeries client.",
    descriptionEn: "RAW development, retouching, cutouts, image finishing and client galleries.",
    order: 10,
    toolIds: ["adobe-lightroom", "capture-one", "darktable", "dxo-photolab", "luminar-neo", "adobe-photoshop", "affinity-photo", "photopea", "pixelmator-pro", "topaz-photo-ai", "topaz-gigapixel", "remove-bg", "nik-collection", "pixieset"],
    signalKeys: ["retouche-photo", "photo", "raw", "catalogue-photo", "color-grading", "compositing", "detourage", "photo-enhancement", "galerie-client", "vente-prints", "livraison-client"],
    pattern: /photo|retouch|retouche|lightroom|capture one|photoshop|raw|compositing|détourage|detourage|galerie-client|pixieset|topaz/i,
  },
  {
    id: "creative-motion-video",
    labelFr: "Motion et vidéo",
    labelEn: "Motion and video",
    descriptionFr: "Montage, animation, compositing, sous-titres, exports et postproduction vidéo.",
    descriptionEn: "Editing, animation, compositing, subtitles, exports and video post-production.",
    order: 20,
    toolIds: ["adobe-premiere-pro", "davinci-resolve", "final-cut-pro", "capcut", "descript", "runway", "topaz-video-ai", "adobe-after-effects", "screen-studio", "opus-clip", "tella", "whisper", "cavalry", "rive", "fusion", "nuke", "lottie", "ae-bodymovin", "lottiefiles", "ae-animation-composer", "motion-bro", "ae-overlord", "ae-duik", "ae-gifgun", "ae-red-giant", "trapcode", "red-giant-universe", "pluraleyes"],
    signalKeys: ["montage-video", "video-editing", "montage-video-court", "short-form-video", "video-repurposing", "sous-titrage", "screen-recording", "generation-video", "motion-design", "animation", "animation-2d-3d", "effets-visuels", "animation-web", "animation-mobile", "micro-interactions", "lottie-export", "motion-assets", "review-client-video", "upscaling-video", "debruitage-video"],
    pattern: /video|vidéo|motion|animation|after-effects|premiere|davinci|capcut|lottie|compositing|sous-titre|subtitle|runway|topaz-video/i,
  },
  {
    id: "creative-three-d",
    labelFr: "3D et rendu",
    labelEn: "3D and rendering",
    descriptionFr: "Modélisation, scènes, architecture, rendu, moteurs temps réel et assets 3D.",
    descriptionEn: "Modeling, scenes, architecture, rendering, real-time engines and 3D assets.",
    order: 30,
    toolIds: ["blender", "cinema-4d", "maya", "houdini", "3ds-max", "zbrush", "spline", "unreal-engine", "marvelous-designer", "rhino", "nomad-sculpt", "plasticity", "enscape", "twinmotion", "lumion", "d5-render", "v-ray", "redshift", "octane-render", "corona-renderer", "arnold", "cycles", "marmoset-toolbag", "sketchup-pro", "revit", "autocad", "archicad", "vectorworks", "fusion-360", "quixel-megascans", "adobe-substance-3d", "substance-3d-designer", "substance-3d-painter"],
    signalKeys: ["modelisation-3d", "3d", "sculpture-3d", "animation-2d-3d", "rendu-3d", "render-engine", "rendering", "temps-reel", "architecture", "bim", "interior-design", "scenography", "plans-techniques", "dessin-technique", "assets-3d"],
    pattern: /3d|rendu|render|modelisation|modélisation|blender|cinema|maya|houdini|sketchup|revit|enscape|twinmotion|lumion|v-ray|redshift|octane|substance/i,
  },
  {
    id: "creative-audio",
    labelFr: "Audio et podcast",
    labelEn: "Audio and podcast",
    descriptionFr: "Enregistrement, montage, nettoyage, voix, musique, hébergement et diffusion audio.",
    descriptionEn: "Recording, editing, cleanup, voice, music, hosting and audio publishing.",
    order: 40,
    toolIds: ["pro-tools", "logic-pro", "adobe-audition", "ableton-live", "reaper", "audacity", "descript", "podcastle", "riverside", "adobe-podcast-ai", "adobe-enhance-speech", "cleanvoice", "auphonic", "whisper", "suno", "udio", "epidemic-sound", "artlist", "anchor-spotify", "spotify-for-podcasters", "buzzsprout", "ausha", "acast", "podbean", "headliner", "castmagic"],
    signalKeys: ["montage-audio", "enregistrement-multipistes", "audio", "sound-design", "mixing", "audio-cleanup", "voice-enhancement", "transcription", "qualite-podcast", "generation-audio", "creation-musicale", "music-licensing", "hebergement-audio", "distribution-podcast", "analytics-podcast", "monetisation-podcast"],
    pattern: /audio|podcast|voice|voix|transcription|audition|riverside|descript|cleanvoice|auphonic|spotify|buzzsprout|ausha/i,
  },
  {
    id: "creative-ui-system",
    labelFr: "Interface et design system",
    labelEn: "Interface and design system",
    descriptionFr: "Conception d’interfaces, composants, tokens, librairies et cohérence produit.",
    descriptionEn: "Interface design, components, tokens, libraries and product consistency.",
    order: 50,
    toolIds: ["figma", "penpot", "sketch", "figjam", "adobe-xd", "v0-vercel", "relume-ai", "figma-tokens", "figma-stark"],
    signalKeys: ["ui-design", "design-system", "wireframing", "ui-components", "component", "components", "tokens", "accessibility", "design-collaboration"],
    pattern: /figma|penpot|sketch|design-system|ui-design|wireframe|component|tokens|accessibility|stark/i,
  },
  {
    id: "creative-prototype-handoff",
    labelFr: "Prototype et handoff",
    labelEn: "Prototype and handoff",
    descriptionFr: "Prototypes, tests, transmission dev, sites publiés et validation de parcours.",
    descriptionEn: "Prototypes, tests, developer handoff, published sites and flow validation.",
    order: 60,
    toolIds: ["zeplin", "protopie", "framer", "webflow-framer", "figma-anima", "origami", "maze", "invision", "abstract", "craft"],
    signalKeys: ["prototyping", "prototypage", "handoff-dev", "handoff", "prototype", "tests-utilisateurs", "user-research", "analytics-ux", "website", "publish"],
    pattern: /prototype|prototypage|handoff|zeplin|protopie|framer|webflow|anima|maze|user-research|tests-utilisateurs/i,
  },
  {
    id: "creative-visual-identity",
    labelFr: "Identité et création visuelle",
    labelEn: "Identity and visual creation",
    descriptionFr: "Branding, logos, illustration, composition, supports graphiques et déclinaisons.",
    descriptionEn: "Branding, logos, illustration, composition, graphic assets and variations.",
    order: 70,
    toolIds: ["adobe-illustrator", "affinity-designer", "canva", "adobe-express", "procreate", "clip-studio-paint", "krita", "adobe-fresco", "coreldraw", "indesign", "affinity-publisher", "quarkxpress", "pitch", "keynote", "google-slides", "beautiful-ai", "readymag"],
    signalKeys: ["design-visuel", "illustration-vectorielle", "logos", "logo-design", "branding", "visual-identity", "mise-en-page", "print", "presentations", "packaging", "publication", "illustration", "concept-art", "digital-painting"],
    pattern: /design-visuel|visual-identity|brand|branding|logo|illustration|vector|vectoriel|canva|illustrator|indesign|presentation|présentation|print|publication/i,
  },
  {
    id: "creative-ai-visual",
    labelFr: "IA créative",
    labelEn: "Creative AI",
    descriptionFr: "Génération, exploration, retouche IA, vidéo IA et accélération de production.",
    descriptionEn: "Generation, exploration, AI retouching, AI video and production acceleration.",
    order: 80,
    toolIds: ["midjourney", "firefly", "krea-ai", "flux-ai", "ideogram", "leonardo-ai", "stable-diffusion", "pika-labs", "kling-ai", "figma-weave", "canva-ai", "descript-ai"],
    signalKeys: ["generation-image", "generation-video", "concept-art", "ai-general", "ai-image", "ai-generation", "ia", "audio-cleanup", "voice-enhancement", "video-post-production"],
    pattern: /midjourney|firefly|krea|flux|ideogram|leonardo|stable-diffusion|pika|kling|ia|ai|generation/i,
  },
  {
    id: "creative-plugins-resources",
    labelFr: "Plugins et ressources",
    labelEn: "Plugins and resources",
    descriptionFr: "Plugins, templates, icônes, polices, mockups, assets et bibliothèques réutilisables.",
    descriptionEn: "Plugins, templates, icons, fonts, mockups, assets and reusable libraries.",
    order: 90,
    toolIds: ["figma-iconify", "canva-templates", "figma-templates", "dynamic-mockups", "envato-elements", "envato", "adobe-stock", "motion-array", "icons8", "noun-project", "hugeicons", "fontbase", "rightfont", "brandpad"],
    signalKeys: ["templates", "creative-licensing", "fonts", "assets", "stock", "icons", "iconographie", "design-resources", "stock-assets", "brand-guidelines", "brand-portal", "asset-library", "mockup", "plugin"],
    pattern: /plugin|template|mockup|font|police|icon|icône|asset|envato|stock|icons8|noun-project|rightfont|fontbase|brandpad/i,
  },
  {
    id: "creative-review-delivery",
    labelFr: "Validation, livraison et archives",
    labelEn: "Review, delivery and archives",
    descriptionFr: "Commentaires, versions, présentation client, transfert, sauvegarde et archivage.",
    descriptionEn: "Comments, versions, client presentation, transfer, backup and archiving.",
    order: 100,
    toolIds: ["frame-io", "loom", "tella", "wetransfer", "google-drive", "dropbox", "adobe-acrobat", "adobe-acrobat-sign", "pixieset"],
    signalKeys: ["collaboration", "review", "delivery", "presentation-client", "backup", "archive", "versioning", "review-client-video", "livraison-client", "document-delivery", "pdf-review", "file-storage"],
    pattern: /review|feedback|comment|client|delivery|livraison|archive|frame-io|loom|wetransfer|acrobat|drive|dropbox/i,
  },
  {
    id: "creative-admin-rights",
    labelFr: "Droits, licences et budget",
    labelEn: "Rights, licensing and budget",
    descriptionFr: "Suites, licences, droits d’usage, facturation et accès commerciaux.",
    descriptionEn: "Suites, licenses, usage rights, billing and commercial access.",
    order: 110,
    toolIds: ["adobe-cc", "adobe-creative-cloud", "maxon-one", "canva-pro", "microsoft-365", "stripe", "indy", "paypal"],
    signalKeys: ["license", "licence", "rights", "droits", "creative-licensing", "billing", "facturation", "payment", "brand-kit"],
    pattern: /licen[cs]e|licence|rights|droits|billing|facturation|payment|stripe|paypal|creative cloud|canva pro|maxon/i,
  },
  {
    id: "creative-measure-growth",
    labelFr: "Portfolio et mesure",
    labelEn: "Portfolio and measurement",
    descriptionFr: "Portfolio, campagnes, contenus, leads, analytics et suivi de performance.",
    descriptionEn: "Portfolio, campaigns, content, leads, analytics and performance tracking.",
    order: 120,
    toolIds: ["format", "google-analytics", "posthog", "hotjar", "brevo", "hubspot", "mailerlite", "looker-studio", "buffer", "metricool", "later", "hootsuite", "sprout-social", "planoly"],
    signalKeys: ["portfolio-builder", "analytics", "web-analytics", "conversion-tracking", "campaign-measurement", "social-media", "social-publishing", "reporting-client", "lead", "crm", "newsletter"],
    pattern: /portfolio|analytics|campaign|newsletter|lead|crm|social|buffer|metricool|later|hotjar|posthog|google analytics|looker/i,
  },
];

const DESIGN_PICKER_SUBDOMAIN_IDS = new Set([
  "creative-brief-input",
  "creative-photo-retouch",
  "creative-motion-video",
  "creative-three-d",
  "creative-audio",
  "creative-ui-system",
  "creative-prototype-handoff",
  "creative-visual-identity",
  "creative-ai-visual",
  "creative-plugins-resources",
  "creative-review-delivery",
]);

const DESIGN_PICKER_STARTER_TOOL_IDS = [
  "figma",
  "adobe-illustrator",
  "adobe-photoshop",
  "canva",
  "adobe-lightroom",
  "framer",
  "midjourney",
  "blender",
  "adobe-premiere-pro",
  "adobe-after-effects",
  "capture-one",
  "procreate",
  "davinci-resolve",
  "indesign",
  "milanote",
  "frame-io",
];

const DESIGN_PICKER_SUPPORT_SUBDOMAIN_IDS = new Set([
  "creative-brief-input",
  "creative-plugins-resources",
  "creative-review-delivery",
]);

const DESIGN_PICKER_CORE_SUBDOMAIN_ORDER = [
  "creative-ui-system",
  "creative-photo-retouch",
  "creative-motion-video",
  "creative-visual-identity",
  "creative-prototype-handoff",
  "creative-three-d",
  "creative-ai-visual",
  "creative-audio",
];

const DESIGN_PICKER_CORE_SUBDOMAIN_IDS = new Set(DESIGN_PICKER_CORE_SUBDOMAIN_ORDER);

const DESIGN_PICKER_FAMILY_CAP = 2;
const DESIGN_PICKER_PLUGIN_CAP = 1;
const DESIGN_PICKER_SUBDOMAIN_CAP = 1;

const DESIGN_PICKER_CATEGORY_IDS = new Set([
  "creation",
  "design-tools",
  "prototyping",
]);

const DESIGN_PICKER_SIGNAL_KEYS = new Set([
  "accessibility",
  "ai-image",
  "animation",
  "animation-2d-3d",
  "asset-library",
  "assets-3d",
  "background-removal",
  "branding",
  "color-grading",
  "compositing",
  "component",
  "components",
  "concept-art",
  "creative-licensing",
  "design-collaboration",
  "design-resources",
  "design-system",
  "design-visuel",
  "detourage",
  "digital-painting",
  "effets-visuels",
  "fonts",
  "generation-image",
  "generation-video",
  "handoff",
  "handoff-dev",
  "iconographie",
  "icons",
  "identite-visuelle",
  "illustration",
  "illustration-vectorielle",
  "interactive-design",
  "landing-page",
  "logo-design",
  "logos",
  "lottie-export",
  "mise-en-page",
  "mockup",
  "modelisation-3d",
  "montage-audio",
  "montage-video",
  "montage-video-court",
  "motion-assets",
  "motion-design",
  "packaging",
  "photo",
  "photo-cleanup",
  "photo-enhancement",
  "print",
  "presentation-client",
  "presentations",
  "prototype",
  "prototype-3d",
  "prototypage",
  "prototyping",
  "raw",
  "render-engine",
  "rendering",
  "retouche-photo",
  "rendu-3d",
  "short-form-video",
  "sound-design",
  "stock",
  "stock-assets",
  "templates",
  "tests-utilisateurs",
  "tokens",
  "ui-components",
  "ui-design",
  "upscaling-video",
  "video-editing",
  "video-post-production",
  "visual-identity",
  "visual-production",
  "web-animation",
  "wireframing",
]);

const OBJECTIVE_PICKER_CONFIGS: Record<string, ObjectivePickerConfig> = {
  design: {
    boardId: "design",
    categoryIds: Array.from(DESIGN_PICKER_CATEGORY_IDS),
    coreSubdomainOrder: DESIGN_PICKER_CORE_SUBDOMAIN_ORDER,
    familyCap: DESIGN_PICKER_FAMILY_CAP,
    pluginCap: DESIGN_PICKER_PLUGIN_CAP,
    signalKeys: Array.from(DESIGN_PICKER_SIGNAL_KEYS),
    starterToolIds: DESIGN_PICKER_STARTER_TOOL_IDS,
    subdomainCap: DESIGN_PICKER_SUBDOMAIN_CAP,
    supportSubdomainIds: Array.from(DESIGN_PICKER_SUPPORT_SUBDOMAIN_IDS),
  },
  ia: {
    boardId: "ia",
    categoryIds: ["ai-general"],
    coreSubdomainOrder: ["ia-assistants", "ia-creative", "ia-code", "ia-meeting-data"],
    signalKeys: [
      "ai-builder",
      "ai-generation",
      "ai-general",
      "analyse-documents",
      "app-builder",
      "audio-cleanup",
      "brainstorming",
      "chatbot",
      "code",
      "coding",
      "generation-audio",
      "generation-image",
      "generation-texte",
      "generation-video",
      "ia",
      "integration-llm",
      "llm",
      "no-code-ia",
      "prompt",
      "transcription",
      "voice-enhancement",
    ],
    starterToolIds: [
      "chatgpt",
      "claude",
      "perplexity",
      "gemini",
      "deepseek",
      "cursor",
      "github-copilot",
      "midjourney",
      "firefly",
      "runway",
      "bolt-new",
    ],
    strictSignal: true,
  },
  organisation: {
    boardId: "organisation",
    categoryIds: ["project-management", "communication-team", "storage"],
    coreSubdomainOrder: ["org-projects", "org-docs", "org-files", "org-team"],
    signalKeys: [
      "calendar",
      "cloud-storage",
      "collaboration",
      "documentation",
      "knowledge-base",
      "notes",
      "productivity-docs",
      "project-management",
      "stockage-fichiers",
      "task-management",
      "team-communication",
      "time-tracking",
      "wiki",
      "workspace",
    ],
    starterToolIds: ["notion", "clickup", "asana", "monday", "airtable", "coda", "trello", "basecamp", "google-workspace", "microsoft-365", "slack", "google-drive", "dropbox"],
    strictSignal: true,
  },
  automation: {
    boardId: "automation",
    categoryIds: ["automation"],
    coreSubdomainOrder: ["auto-workflows", "auto-apps", "auto-data"],
    signalKeys: [
      "api",
      "api-integration",
      "app-builder",
      "automation",
      "automatisation",
      "connectors",
      "integration",
      "integration-llm",
      "no-code",
      "no-code-ia",
      "nocode",
      "trigger",
      "workflow",
      "workflows",
    ],
    starterToolIds: ["make", "zapier", "n8n", "activepieces", "airtable", "base44", "bolt-new", "firebase", "bubble", "softr", "webflow"],
    strictSignal: true,
  },
  marketing: {
    boardId: "marketing",
    categoryIds: ["email-productivity", "analytics", "marketing"],
    coreSubdomainOrder: ["mkt-email", "mkt-social-content", "mkt-analytics", "mkt-crm"],
    signalKeys: [
      "ads",
      "analytics",
      "analytics-email",
      "audience",
      "brand-monitoring",
      "campaign-measurement",
      "content-repurposing",
      "conversion-tracking",
      "editeur-email",
      "email-marketing",
      "marketing-automation",
      "newsletter",
      "planification-posts",
      "reporting-client",
      "seo",
      "social-media",
      "social-publishing",
      "web-analytics",
    ],
    starterToolIds: ["hubspot", "brevo", "mailchimp", "beehiiv", "buffer", "metricool", "google-analytics", "looker-studio", "semrush", "ahrefs", "hotjar", "posthog", "canva", "chatgpt"],
    strictSignal: true,
  },
  vente: {
    boardId: "vente",
    categoryIds: ["communication"],
    coreSubdomainOrder: ["sales-crm", "sales-prospecting", "sales-meetings", "sales-checkout"],
    signalKeys: [
      "booking",
      "business-phone",
      "call-center",
      "client-management",
      "crm",
      "crm-calls",
      "crm-marketing",
      "data-enrichment",
      "ecommerce",
      "helpdesk",
      "lead",
      "lead-generation",
      "outbound-email",
      "payment",
      "pipeline",
      "prise-rendez-vous",
      "prospection",
      "sales-intelligence",
    ],
    starterToolIds: ["hubspot", "pipedrive", "salesforce", "close", "apollo-io", "folk", "calendly", "stripe", "shopify", "gorgias", "intercom", "aircall"],
    strictSignal: true,
  },
  finance: {
    boardId: "finance",
    categoryIds: ["finance", "budgeting-fpa", "erp", "hris-payroll", "legal-contracts", "vendor-risk-data"],
    coreSubdomainOrder: ["fin-accounting", "fin-expenses", "fin-payroll", "fin-planning"],
    signalKeys: [
      "accounting",
      "accounting-automation",
      "bookkeeping-prep",
      "budgeting-fpa",
      "contractor-management",
      "expense-documents",
      "expense-management",
      "facturation",
      "global-payroll",
      "hris-sync",
      "invoice",
      "legal-contracts",
      "payment",
      "receipt-capture",
      "tax-automation",
    ],
    starterToolIds: ["pennylane", "indy", "quickbooks", "freshbooks", "stripe", "paypal", "dext", "deel", "gusto", "anaplan", "google-sheets", "docusign"],
    strictSignal: true,
  },
  dev: {
    boardId: "dev",
    categoryIds: ["security", "ui-components"],
    coreSubdomainOrder: ["dev-code", "dev-deploy", "dev-data", "dev-monitoring"],
    signalKeys: [
      "ai-builder",
      "api",
      "app-builder",
      "backend",
      "build-tooling",
      "ci-cd",
      "code",
      "code-review",
      "coding",
      "data-fetching",
      "database",
      "deploy",
      "documentation",
      "frontend-framework",
      "hosting",
      "integration-llm",
      "monitoring",
      "observabilite",
      "security",
      "state-management",
      "ui-components",
      "versioning-code",
    ],
    starterToolIds: ["github", "cursor", "github-copilot", "vercel", "netlify", "supabase", "firebase", "react", "next-js", "docker", "datadog", "sentry", "1password", "bitwarden"],
    strictSignal: true,
  },
};

const TOOL_TYPE_LABELS: Record<string, { fr: string; en: string }> = {
  ia: { fr: "IA", en: "AI" },
  metier: { fr: "Métier", en: "Core" },
  gestion: { fr: "Gestion", en: "Management" },
  plugin: { fr: "Plugin", en: "Plugin" },
  satellite: { fr: "Satellite", en: "Satellite" },
};

const NEED_LABEL_OVERRIDES: Record<string, { fr: string; en: string }> = {
  "retouche-photo": { fr: "Retouche photo", en: "Photo editing" },
  "montage-video": { fr: "Montage vidéo", en: "Video editing" },
  "motion-video": { fr: "Motion vidéo", en: "Motion video" },
  "motion-design": { fr: "Motion design", en: "Motion design" },
  "animation-2d-3d": { fr: "Animation 2D / 3D", en: "2D / 3D animation" },
  "modelisation-3d": { fr: "Modélisation 3D", en: "3D modeling" },
  "rendu-3d": { fr: "Rendu 3D", en: "3D rendering" },
  "montage-audio": { fr: "Montage audio", en: "Audio editing" },
  "qualite-podcast": { fr: "Qualité podcast", en: "Podcast quality" },
  "distribution-podcast": { fr: "Distribution podcast", en: "Podcast distribution" },
  "design-system": { fr: "Design system", en: "Design system" },
  "design-visuel": { fr: "Design visuel", en: "Visual design" },
  "design-collaboration": { fr: "Collaboration design", en: "Design collaboration" },
  "ui-components": { fr: "Composants UI", en: "UI components" },
  "project-management": { fr: "Gestion de projet", en: "Project management" },
  "email-marketing": { fr: "Email marketing", en: "Email marketing" },
  "api-integration": { fr: "Intégrations API", en: "API integrations" },
  "ai-generation": { fr: "Génération IA", en: "AI generation" },
  "ai-image": { fr: "Image IA", en: "AI image" },
  "ai-writing": { fr: "Rédaction IA", en: "AI writing" },
  "ai-coding": { fr: "Code IA", en: "AI coding" },
};

function toolSearchText(tool: ToolSummary, categoryLabel = "") {
  return [
    tool.id,
    tool.slug,
    tool.name,
    tool.categoryId,
    categoryLabel,
    tool.shortDescription,
    tool.shortDescriptionEn,
    tool.tool_type,
    tool.host_app,
    tool.bundle_parent,
    tool.substitution_cluster_v2,
    ...(tool.covers || []),
    ...(tool.functional_needs || []),
    ...(tool.verticals || []),
  ].join(" ");
}

function normalizeKey(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getToolIdentityKeys(tool: ToolSummary) {
  return new Set([tool.id, tool.slug, getToolKey(tool)].map(normalizeKey).filter(Boolean));
}

function getToolSignalKeys(tool: ToolSummary, categoryLabel: string) {
  return new Set([
    tool.id,
    tool.slug,
    getToolKey(tool),
    tool.categoryId,
    categoryLabel,
    tool.tool_type,
    tool.host_app,
    tool.bundle_parent,
    tool.substitution_cluster_v2,
    ...(tool.covers || []),
    ...(tool.functional_needs || []),
    ...(tool.verticals || []),
  ].map(normalizeKey).filter(Boolean));
}

function getToolFamilyKey(tool: ToolSummary) {
  const key = normalizeKey(getToolKey(tool));
  if (key.startsWith("adobe-") || ["indesign", "firefly"].includes(key)) return "adobe";
  if (key.startsWith("figma")) return "figma";
  if (key.startsWith("canva")) return "canva";
  if (key.startsWith("affinity")) return "affinity";
  if (key.startsWith("topaz")) return "topaz";
  if (["davinci-resolve", "fusion"].includes(key)) return "blackmagic";
  if (["cinema-4d", "redshift"].includes(key)) return "maxon";
  if (["blender", "cycles"].includes(key)) return "blender";

  return normalizeKey(
    tool.bundle_parent ||
    tool.host_app ||
    tool.substitution_cluster_v2 ||
    key.split("-")[0] ||
    key
  );
}

function matchesCreativeToolIds(tool: ToolSummary, subdomain: CreativeStackSubdomain) {
  if (!subdomain.toolIds?.length) return false;
  const toolKeys = getToolIdentityKeys(tool);
  return subdomain.toolIds.some((id) => toolKeys.has(normalizeKey(id)));
}

function matchesCreativeSignals(tool: ToolSummary, categoryLabel: string, subdomain: CreativeStackSubdomain) {
  if (!subdomain.signalKeys?.length) return false;
  const toolSignals = getToolSignalKeys(tool, categoryLabel);
  return subdomain.signalKeys.some((key) => toolSignals.has(normalizeKey(key)));
}

function countMatchingSignals(tool: ToolSummary, categoryLabel: string, signalKeys: Set<string>) {
  const toolSignals = getToolSignalKeys(tool, categoryLabel);
  return Array.from(signalKeys).filter((key) => toolSignals.has(normalizeKey(key))).length;
}

function getCreativeSubdomainToolRank(tool: ToolSummary, subdomain: CreativeStackSubdomain | null) {
  if (!subdomain?.toolIds?.length) return null;
  const toolKeys = getToolIdentityKeys(tool);
  const index = subdomain.toolIds.findIndex((id) => toolKeys.has(normalizeKey(id)));
  return index === -1 ? null : index;
}

function getObjectivePickerConfig(boardId: string) {
  return OBJECTIVE_PICKER_CONFIGS[boardId] || null;
}

function getObjectivePickerStarterRank(tool: ToolSummary, config: ObjectivePickerConfig) {
  const toolKeys = getToolIdentityKeys(tool);
  const index = config.starterToolIds.findIndex((id) => toolKeys.has(normalizeKey(id)));
  return index === -1 ? null : index;
}

function canUseDesignSubdomainMatch(tool: ToolSummary, categoryLabel: string, subdomain: CreativeStackSubdomain) {
  if (subdomain.id !== "creative-ai-visual") return true;
  const signals = getToolSignalKeys(tool, categoryLabel);
  const visualAiSignals = [
    "ai-image",
    "concept-art",
    "direction-visuelle",
    "generation-image",
    "generation-video",
    "motion-design",
    "retouche-photo",
    "video-post-production",
  ];
  return visualAiSignals.some((signal) => signals.has(normalizeKey(signal)));
}

function getDesignPickerSubdomain(tool: ToolSummary, categoryLabel: string) {
  const exactMatch = CREATIVE_STACK_SUBDOMAINS.find((subdomain) =>
    DESIGN_PICKER_SUBDOMAIN_IDS.has(subdomain.id) && matchesCreativeToolIds(tool, subdomain)
  );
  if (exactMatch) return exactMatch;

  const signalMatch = CREATIVE_STACK_SUBDOMAINS.find((subdomain) =>
    DESIGN_PICKER_SUBDOMAIN_IDS.has(subdomain.id) &&
    canUseDesignSubdomainMatch(tool, categoryLabel, subdomain) &&
    matchesCreativeSignals(tool, categoryLabel, subdomain)
  );
  if (signalMatch) return signalMatch;

  return CREATIVE_STACK_SUBDOMAINS.find((subdomain) =>
    DESIGN_PICKER_SUBDOMAIN_IDS.has(subdomain.id) &&
    canUseDesignSubdomainMatch(tool, categoryLabel, subdomain) &&
    !!subdomain.pattern?.test(toolSearchText(tool, categoryLabel))
  ) || null;
}

function getObjectivePickerSubdomain(boardId: string, tool: ToolSummary, categoryLabel: string) {
  if (boardId === "design") return getDesignPickerSubdomain(tool, categoryLabel);
  return getSubdomainForBoardTool(boardId, tool, categoryLabel);
}

function buildObjectivePickerContext(boardId: string, boardTools: ToolSummary[], getCategoryLabel: (tool: ToolSummary) => string): DesignPickerContext {
  const activeSubdomainIds = new Set<string>();
  const selectedBundleParentCounts = new Map<string, number>();
  const selectedBundleParentKeys = new Set<string>();
  const selectedFamilyKeys = new Set<string>();
  const selectedNeedKeys = new Set<string>();
  const selectedSubdomainCounts = new Map<string, number>();
  const selectedToolKeys = new Set<string>();

  boardTools.forEach((tool) => {
    getToolLookupKeys(tool).forEach((key) => selectedToolKeys.add(key));
    selectedFamilyKeys.add(getToolFamilyKey(tool));
    if (tool.bundle_parent) {
      const parentKey = normalizeKey(tool.bundle_parent);
      selectedBundleParentKeys.add(parentKey);
      selectedBundleParentCounts.set(parentKey, (selectedBundleParentCounts.get(parentKey) || 0) + 1);
    }
    [...(tool.functional_needs || []), ...(tool.covers || [])].forEach((need) => {
      const key = normalizeKey(need);
      if (key) selectedNeedKeys.add(key);
    });

    const subdomain = getObjectivePickerSubdomain(boardId, tool, getCategoryLabel(tool));
    if (subdomain) {
      activeSubdomainIds.add(subdomain.id);
      selectedSubdomainCounts.set(subdomain.id, (selectedSubdomainCounts.get(subdomain.id) || 0) + 1);
    }
  });

  return {
    activeSubdomainIds,
    selectedBundleParentCounts,
    selectedBundleParentKeys,
    selectedFamilyKeys,
    selectedNeedKeys,
    selectedSubdomainCounts,
    selectedToolKeys,
    selectedToolCount: boardTools.length,
  };
}

function getBoardForTool(tool: ToolSummary, categoryLabel: string) {
  const text = toolSearchText(tool, categoryLabel);
  return STACK_BOARDS.find((board) => board.pattern.test(text)) || STACK_BOARDS[1];
}

function getSubdomainForTool(tool: ToolSummary, categoryLabel: string): StackSubdomain {
  const text = toolSearchText(tool, categoryLabel);
  const matchedSubdomain = STACK_SUBDOMAINS.find((subdomain) => subdomain.pattern?.test(text));
  if (matchedSubdomain) return matchedSubdomain;

  const fallbackLabel = categoryLabel || cleanCategoryLabel(tool.categoryId) || "Autres outils";
  return {
    id: `category-${slugify(fallbackLabel)}`,
    labelFr: fallbackLabel,
    labelEn: fallbackLabel,
    descriptionFr: "Outils de cette collection, regroupés depuis leur catégorie catalogue.",
    descriptionEn: "Useful tools for this goal, grouped from their catalog category.",
    order: 900,
  };
}

function getObjectiveBoardSubdomain(boardId: string, tool: ToolSummary, categoryLabel: string) {
  const subdomains = OBJECTIVE_STACK_SUBDOMAINS[boardId];
  if (!subdomains?.length) return null;
  const text = toolSearchText(tool, categoryLabel);
  return subdomains.find((subdomain) => subdomain.pattern?.test(text)) || null;
}

function getCreativeSubdomainForTool(tool: ToolSummary, categoryLabel: string): StackSubdomain {
  const exactMatch = CREATIVE_STACK_SUBDOMAINS.find((subdomain) => matchesCreativeToolIds(tool, subdomain));
  if (exactMatch) return exactMatch;

  const signalMatch = CREATIVE_STACK_SUBDOMAINS.find((subdomain) => matchesCreativeSignals(tool, categoryLabel, subdomain));
  if (signalMatch) return signalMatch;

  const text = toolSearchText(tool, categoryLabel);
  const patternMatch = CREATIVE_STACK_SUBDOMAINS.find((subdomain) => subdomain.pattern?.test(text));
  if (patternMatch) return patternMatch;

  if (tool.tool_type === "plugin" || tool.host_app) {
    const pluginGroup = CREATIVE_STACK_SUBDOMAINS.find((subdomain) => subdomain.id === "creative-plugins-resources");
    if (pluginGroup) return pluginGroup;
  }

  return getSubdomainForTool(tool, categoryLabel);
}

function getSubdomainForBoardTool(boardId: string, tool: ToolSummary, categoryLabel: string): StackSubdomain {
  if (boardId === "design") return getCreativeSubdomainForTool(tool, categoryLabel);
  const objectiveSubdomain = getObjectiveBoardSubdomain(boardId, tool, categoryLabel);
  if (objectiveSubdomain) return objectiveSubdomain;
  return getSubdomainForTool(tool, categoryLabel);
}

function getSubdomainOptionsForBoard(boardId: string): StackSubdomain[] {
  if (boardId === "design") {
    return CREATIVE_STACK_SUBDOMAINS.filter((subdomain) => DESIGN_PICKER_SUBDOMAIN_IDS.has(subdomain.id));
  }
  return OBJECTIVE_STACK_SUBDOMAINS[boardId] || [];
}

const STACK_PROFILE_LABELS: Record<string, { fr: string; en: string }> = {
  ia: { fr: "Spécialiste IA", en: "AI specialist" },
  organisation: { fr: "Chef de projet", en: "Project manager" },
  design: { fr: "Designer", en: "Designer" },
  automation: { fr: "Spécialiste no-code", en: "No-code specialist" },
  marketing: { fr: "Responsable marketing", en: "Marketing manager" },
  vente: { fr: "Consultant commercial", en: "Sales consultant" },
  finance: { fr: "Gestionnaire indépendant", en: "Independent manager" },
  dev: { fr: "Développeur", en: "Developer" },
};

function getStackProfileLabel(boards: StackObjective[], lang: string) {
  const rankedBoards = boards
    .filter((board) => board.tools.length > 0)
    .sort((a, b) => b.tools.length - a.tools.length);
  if (rankedBoards.length === 0) return lang === "en" ? "Independent professional" : "Freelance";
  if (rankedBoards[1]?.tools.length === rankedBoards[0].tools.length) {
    return lang === "en" ? "Multi-skilled freelancer" : "Freelance polyvalent";
  }
  const profile = STACK_PROFILE_LABELS[rankedBoards[0].id];
  return profile ? profile[lang === "en" ? "en" : "fr"] : lang === "en" ? "Independent professional" : "Freelance";
}

function cleanCategoryLabel(label?: string) {
  return (label || "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "autres";
}

function getToolKey(tool: ToolSummary) {
  return tool.slug || tool.id;
}

function formatToolCount(count: number, lang: string) {
  if (lang === "en") return `${count} ${count === 1 ? "tool" : "tools"}`;
  return `${count} outil${count > 1 ? "s" : ""}`;
}

function getBoardOverviewCopy(board: StackBoard, lang: string) {
  const copy: Record<string, { fr: string; en: string }> = {
    ia: {
      fr: "Assistants, génération et outils IA retenus pour votre travail.",
      en: "Assistants, generation tools and AI utilities kept for your work.",
    },
    organisation: {
      fr: "Projets, notes, fichiers et collaboration au même endroit.",
      en: "Projects, notes, files and collaboration in one place.",
    },
    design: {
      fr: "Création, interface, image, vidéo et ressources visuelles.",
      en: "Creation, interface, image, video and visual resources.",
    },
    automation: {
      fr: "Workflows, connexions et automatisations de votre stack.",
      en: "Workflows, connections and automations in your stack.",
    },
    marketing: {
      fr: "Contenu, acquisition, audience et mesure de performance.",
      en: "Content, acquisition, audience and performance tracking.",
    },
    vente: {
      fr: "CRM, prospection, paiement et relation client.",
      en: "CRM, prospecting, payment and customer relationship tools.",
    },
    finance: {
      fr: "Compta, factures, dépenses et pilotage budgétaire.",
      en: "Accounting, invoices, expenses and budget tracking.",
    },
    dev: {
      fr: "Code, déploiement, données et outils techniques.",
      en: "Code, deployment, data and technical tools.",
    },
  };

  if (copy[board.id]) return lang === "en" ? copy[board.id].en : copy[board.id].fr;
  return lang === "en"
    ? "A custom collection for tools connected to the same need."
    : "Une collection personnalisée pour regrouper les outils liés à un même besoin.";
}

function getBoardDisplayLabel(board: StackBoard, lang: string) {
  const labels: Record<string, { fr: string; en: string }> = {
    ia: { fr: "IA", en: "AI" },
    organisation: { fr: "Organisation", en: "Organization" },
    design: { fr: "Design", en: "Design" },
    automation: { fr: "Automatisation", en: "Automation" },
    marketing: { fr: "Marketing", en: "Marketing" },
    vente: { fr: "Vente", en: "Sales" },
    finance: { fr: "Finance", en: "Finance" },
    dev: { fr: "Développement", en: "Development" },
  };
  const label = labels[board.id];
  if (label) return lang === "en" ? label.en : label.fr;
  return lang === "en" ? board.labelEn : board.labelFr;
}

function formatMonthlyPrice(value: number | undefined, lang: string) {
  const price = Math.max(0, Math.round(Number(value) || 0));
  if (lang === "en") return `€${price}/mo`;
  return `${price} €/mois`;
}

function getToolTypeLabel(tool: ToolSummary, lang: string) {
  const label = TOOL_TYPE_LABELS[tool.tool_type || "satellite"];
  if (!label) return tool.tool_type || (lang === "en" ? "Tool" : "Outil");
  return lang === "en" ? label.en : label.fr;
}

function slugToLabel(slug: string) {
  return slug
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/^\p{L}/u, (letter) => letter.toUpperCase());
}

function getNeedLabel(slug: string, lang: string) {
  const override = NEED_LABEL_OVERRIDES[slug];
  if (override) return lang === "en" ? override.en : override.fr;
  return slugToLabel(slug);
}

function getToolNeedLabels(tool: ToolSummary, lang: string) {
  return Array.from(new Set([...(tool.functional_needs || []), ...(tool.covers || []), ...(tool.verticals || [])]))
    .filter(Boolean)
    .slice(0, 5)
    .map((need) => getNeedLabel(need, lang));
}

function getToolContextRole(tool: ToolSummary, group: StackSubdomainGroup, lang: string) {
  const sectionLabel = lang === "en" ? group.labelEn : group.labelFr;
  const labels = getToolNeedLabels(tool, lang);
  return labels.find((label) => normalizeKey(label) !== normalizeKey(sectionLabel)) || sectionLabel;
}

function getToolPrice(tool: ToolSummary | undefined) {
  return Math.max(0, Number(tool?.defaultMonthlyPrice) || 0);
}

function getToolLookupKeys(tool: ToolSummary) {
  return Array.from(new Set([tool.id, tool.slug, getToolKey(tool)].map(normalizeKey).filter(Boolean)));
}

function getObjectiveToolsCta(board: StackObjective, lang: string) {
  const labelsFr: Record<string, string> = {
    ia: "Ajouter des outils IA",
    organisation: "Ajouter des outils d'organisation",
    design: "Ajouter des outils design",
    automation: "Ajouter des outils d'automatisation",
    marketing: "Ajouter des outils marketing",
    vente: "Ajouter des outils de vente",
    finance: "Ajouter des outils finance",
    dev: "Ajouter des outils dev",
  };
  const labelsEn: Record<string, string> = {
    ia: "Add AI tools",
    organisation: "Add organization tools",
    design: "Add design tools",
    automation: "Add automation tools",
    marketing: "Add marketing tools",
    vente: "Add sales tools",
    finance: "Add finance tools",
    dev: "Add dev tools",
  };

  if (lang === "en") return labelsEn[board.id] || `Add ${board.labelEn.toLocaleLowerCase("en")} tools`;
  return labelsFr[board.id] || `Ajouter des outils ${board.labelFr.toLocaleLowerCase("fr")}`;
}

function getPickerQueryTokens(query: string) {
  return query
    .split(/\s+/)
    .map(normalizeKey)
    .filter((token) => token.length >= 2);
}

function toolMatchesPickerQuery(tool: ToolSummary, categoryLabel: string, queryTokens: string[]) {
  if (queryTokens.length === 0) return true;
  const text = normalizeKey(toolSearchText(tool, categoryLabel));
  return queryTokens.every((token) => text.includes(token));
}

function getPickerSearchScore(tool: ToolSummary, categoryLabel: string, queryTokens: string[]) {
  if (queryTokens.length === 0) return 0;
  const name = normalizeKey(tool.name);
  const slug = normalizeKey(getToolKey(tool));
  const category = normalizeKey(categoryLabel);
  return queryTokens.reduce((score, token) => {
    if (name === token || slug === token) return score + 80;
    if (name.startsWith(token) || slug.startsWith(token)) return score + 52;
    if (name.includes(token) || slug.includes(token)) return score + 34;
    if (category.includes(token)) return score + 14;
    return score + 6;
  }, 0);
}

function isPickerAiTool(tool: ToolSummary, categoryLabel: string) {
  if (tool.tool_type === "ia") return true;
  return /\bia\b|\bai\b|generat|gpt|llm|prompt|midjourney|claude|chatgpt/i.test(toolSearchText(tool, categoryLabel));
}

function matchesPickerFilter(filterId: PickerFilterId, tool: ToolSummary, boardScore: number, categoryLabel: string) {
  if (filterId === "recommended") return boardScore > 0;
  if (filterId === "objective") return boardScore > 0;
  if (filterId === "plugins") return boardScore > 0 && (tool.tool_type === "plugin" || !!tool.host_app);
  if (filterId === "ai") return boardScore > 0 && isPickerAiTool(tool, categoryLabel);
  if (filterId === "budget") return boardScore > 0 && getToolPrice(tool) <= 20;
  return boardScore > 0;
}

function diversifyObjectivePickerCandidates(candidates: PickerCandidate[], filterId: PickerFilterId, hasQuery: boolean, config: ObjectivePickerConfig | null) {
  if (filterId !== "recommended" || hasQuery) return candidates;

  const result: PickerCandidate[] = [];
  const picked = new Set<string>();
  const familyCounts = new Map<string, number>();
  let pluginCount = 0;
  const subdomainCounts = new Map<string, number>();
  const familyCap = config?.familyCap ?? 2;
  const pluginCap = config?.pluginCap ?? 1;
  const subdomainCap = config?.subdomainCap ?? 1;

  const tryPick = (candidate: PickerCandidate, relaxed = false) => {
    const toolKey = getToolKey(candidate.tool);
    if (picked.has(toolKey)) return;

    const family = getToolFamilyKey(candidate.tool);
    const isPlugin = candidate.tool.tool_type === "plugin" || !!candidate.tool.host_app;
    const subdomain = candidate.subdomainId || "autres";
    const familyCount = familyCounts.get(family) || 0;
    const subdomainCount = subdomainCounts.get(subdomain) || 0;

    if (!relaxed && isPlugin && pluginCount >= pluginCap) return;
    if (!relaxed && (familyCount >= familyCap || subdomainCount >= subdomainCap)) return;

    picked.add(toolKey);
    result.push(candidate);
    if (isPlugin) pluginCount += 1;
    familyCounts.set(family, familyCount + 1);
    subdomainCounts.set(subdomain, subdomainCount + 1);
  };

  candidates.forEach((candidate) => tryPick(candidate));
  candidates.forEach((candidate) => tryPick(candidate, true));

  return result;
}

function getToolPickerScore(tool: ToolSummary) {
  const qualityScore = tool.prescription_quality === "ferme" ? 30 :
    tool.prescription_quality === "oui" ? 20 :
    tool.prescription_quality === "question" ? 8 : 0;
  const typeScore = tool.tool_type === "metier" ? 10 :
    tool.tool_type === "ia" ? 8 :
    tool.tool_type === "plugin" ? 5 : 0;
  const signalScore = (tool.functional_needs?.length || 0) + (tool.covers?.length || 0);
  return qualityScore + typeScore + Math.min(signalScore, 10);
}

function contextHasRelatedToolKey(context: DesignPickerContext, relationValue = "") {
  const relationKey = normalizeKey(relationValue);
  if (!relationKey) return false;
  return Array.from(context.selectedToolKeys).some((toolKey) =>
    toolKey === relationKey ||
    toolKey.endsWith(`-${relationKey}`) ||
    toolKey.replace(/^[^-]+-/, "") === relationKey
  );
}

function isPluginRelatedToSelection(tool: ToolSummary, context: DesignPickerContext) {
  return contextHasRelatedToolKey(context, tool.host_app || "");
}

function isBundleRelatedToSelection(tool: ToolSummary, context: DesignPickerContext) {
  const toolKeys = getToolLookupKeys(tool);
  const parentKey = normalizeKey(tool.bundle_parent || "");
  return (
    (!!parentKey && contextHasRelatedToolKey(context, parentKey)) ||
    toolKeys.some((key) => context.selectedBundleParentKeys.has(key))
  );
}

function getBundleRelationScore(tool: ToolSummary, context: DesignPickerContext) {
  const parentKey = normalizeKey(tool.bundle_parent || "");
  const selectedSiblingCount = parentKey ? context.selectedBundleParentCounts.get(parentKey) || 0 : 0;
  if (parentKey && contextHasRelatedToolKey(context, parentKey)) return 54;
  if (selectedSiblingCount >= 2) return 48;
  if (selectedSiblingCount === 1) return 18;

  const selectedChildCount = getToolLookupKeys(tool)
    .map((key) => context.selectedBundleParentCounts.get(key) || 0)
    .reduce((max, count) => Math.max(max, count), 0);

  if (selectedChildCount >= 2) return 76;
  if (selectedChildCount === 1) return 22;
  return 0;
}

function getSharedNeedCount(tool: ToolSummary, context: DesignPickerContext) {
  return [...(tool.functional_needs || []), ...(tool.covers || [])]
    .map(normalizeKey)
    .filter((key) => key && context.selectedNeedKeys.has(key))
    .length;
}

function getObjectivePickerCoverageScore(subdomain: StackSubdomain | null, context: DesignPickerContext, config: ObjectivePickerConfig) {
  if (!subdomain) return 0;

  const supportSubdomainIds = new Set((config.supportSubdomainIds || []).map(normalizeKey));
  const coreSubdomainOrder = config.coreSubdomainOrder.map(normalizeKey);
  const coreSubdomainIds = new Set(coreSubdomainOrder);
  const subdomainId = normalizeKey(subdomain.id);
  const selectedCount = context.selectedSubdomainCounts.get(subdomain.id) || 0;
  if (selectedCount > 0) {
    if (supportSubdomainIds.has(subdomainId)) return 4;
    return selectedCount === 1 ? 24 : 10;
  }

  if (!coreSubdomainIds.has(subdomainId)) {
    return supportSubdomainIds.has(subdomainId) ? 4 : 0;
  }

  const orderIndex = coreSubdomainOrder.indexOf(subdomainId);
  return Math.max(12, 38 - Math.max(0, orderIndex) * 3);
}

function getObjectivePickerScore(tool: ToolSummary, board: StackBoard, categoryLabel: string, context: DesignPickerContext, config: ObjectivePickerConfig) {
  const subdomain = getObjectivePickerSubdomain(board.id, tool, categoryLabel);
  const subdomainRank = board.id === "design" ? getCreativeSubdomainToolRank(tool, subdomain as CreativeStackSubdomain | null) : null;
  const starterRank = getObjectivePickerStarterRank(tool, config);
  const categoryMatch = config.categoryIds.map(normalizeKey).includes(normalizeKey(tool.categoryId));
  const signalMatches = countMatchingSignals(tool, categoryLabel, new Set(config.signalKeys.map(normalizeKey)));
  const sharedNeedCount = getSharedNeedCount(tool, context);
  const pluginRelated = isPluginRelatedToSelection(tool, context);
  const bundleRelationScore = getBundleRelationScore(tool, context);
  const bundleRelated = bundleRelationScore > 0 || isBundleRelatedToSelection(tool, context);
  const sameFamily = context.selectedFamilyKeys.has(getToolFamilyKey(tool));
  const hasSelectedObjectiveTools = context.selectedToolCount > 0;
  const selectedSubdomainCount = subdomain ? context.selectedSubdomainCounts.get(subdomain.id) || 0 : 0;
  const isPlugin = tool.tool_type === "plugin" || !!tool.host_app;
  const isPrimaryTool = tool.tool_type === "metier" || tool.tool_type === "ia" || starterRank != null;
  const supportSubdomainIds = new Set((config.supportSubdomainIds || []).map(normalizeKey));
  const subdomainId = normalizeKey(subdomain?.id);
  const boardMatch = getBoardForTool(tool, categoryLabel).id === board.id;
  const canUseBundleAsObjectiveSignal = board.id === "design" || boardMatch || categoryMatch || signalMatches > 0 || starterRank != null;
  const canUseSharedNeedsAsObjectiveSignal = board.id === "design" ? boardMatch || !!subdomain || sameFamily : boardMatch || !!subdomain;
  const hasCatalogObjectiveSignal = starterRank != null ||
    categoryMatch ||
    signalMatches > 0 ||
    pluginRelated ||
    (bundleRelated && canUseBundleAsObjectiveSignal);
  const hasContextObjectiveSignal = sharedNeedCount > 0 && canUseSharedNeedsAsObjectiveSignal;
  const hasStrongObjectiveSignal = hasCatalogObjectiveSignal || hasContextObjectiveSignal;
  const canUseSubdomainScore = board.id === "design" || hasStrongObjectiveSignal;

  if (config.strictSignal && !hasStrongObjectiveSignal) {
    return 0;
  }

  if (board.id === "ia" && tool.tool_type !== "ia" && starterRank == null && !categoryMatch && signalMatches === 0 && !pluginRelated) {
    return 0;
  }

  if (!boardMatch && !hasStrongObjectiveSignal) {
    return 0;
  }

  let score = getToolPickerScore(tool);

  if (boardMatch) score += hasStrongObjectiveSignal ? 28 : 18;
  if (starterRank != null) score += Math.max(36, 92 - starterRank * 4);
  if (subdomain) {
    const isTopSubdomainTool = subdomainRank != null && subdomainRank <= 10;
    score += subdomainRank == null ? canUseSubdomainScore ? 34 : 0 : Math.max(16, 68 - subdomainRank * 3);
    if (context.activeSubdomainIds.has(subdomain.id)) {
      const activeSubdomainBoost = isPlugin ? 20 : 54;
      score += (isTopSubdomainTool || starterRank != null || bundleRelated || sharedNeedCount > 0)
        ? activeSubdomainBoost
        : isPlugin ? 8 : 24;
    }
    else if (!hasSelectedObjectiveTools) score += supportSubdomainIds.has(subdomainId) ? 8 : 26;
    else if (supportSubdomainIds.has(subdomainId)) score += 18;
    else score += getObjectivePickerCoverageScore(subdomain, context, config);
  }
  if (signalMatches > 0) score += Math.min(32, signalMatches * 8);
  if (sharedNeedCount > 0) score += Math.min(42, sharedNeedCount * 14);
  if (categoryMatch) score += 12;
  if (isPrimaryTool && subdomain) score += getObjectivePickerCoverageScore(subdomain, context, config);
  if (pluginRelated) score += 42;
  if (isPlugin && pluginRelated && sharedNeedCount > 0) score += 10;
  score += bundleRelationScore;
  if (sameFamily && hasSelectedObjectiveTools) score += 16;

  const price = getToolPrice(tool);
  if (isPlugin && !pluginRelated && !supportSubdomainIds.has(subdomainId)) score -= 58;
  if (isPlugin && selectedSubdomainCount > 0) score -= 18;
  if (isPlugin && starterRank == null && !hasSelectedObjectiveTools) score -= 18;
  if (tool.tool_type === "satellite" && starterRank == null && !pluginRelated && !bundleRelated && signalMatches < 2) score -= 24;
  if (subdomain && supportSubdomainIds.has(subdomainId) && !hasSelectedObjectiveTools && starterRank == null) score -= 20;
  if (!subdomain && !pluginRelated && !bundleRelated && starterRank == null) score -= 30;
  if (price >= 80 && starterRank == null && bundleRelationScore < 76) score -= 34;
  else if (price >= 40 && starterRank == null && bundleRelationScore < 76) score -= pluginRelated ? 32 : 22;

  return score >= (config.minScore || 42) ? score : 0;
}

function getToolPickerBoardScore(tool: ToolSummary, board: StackBoard, categoryLabel: string, objectiveContext?: DesignPickerContext) {
  const config = getObjectivePickerConfig(board.id);
  if (config && objectiveContext) {
    return getObjectivePickerScore(tool, board, categoryLabel, objectiveContext, config);
  }
  if (getBoardForTool(tool, categoryLabel).id !== board.id) return 0;
  return 40 + getToolPickerScore(tool);
}


function slugMatches(toolSlug = "", relationValue = "") {
  return toolSlug === relationValue ||
    toolSlug.endsWith(`-${relationValue}`) ||
    toolSlug.replace(/^[^-]+-/, "") === relationValue;
}

const CartPage = () => {
  const { t, lang, prefix } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const {
    state,
    persistenceStatus,
    pinTool,
    saveToolSelection,
    unpinTool,
    assignToolNeeds,
    renameNeed,
    deleteNeed,
    moveNeed,
  } = useStackPins();
  const [searchParams, setSearchParams] = useSearchParams();
  const pickerBoardId = searchParams.get("ajouter");
  const inspectorNavigationDepth = typeof location.state?.stackToolInspectorDepth === "number"
    ? Math.max(0, location.state.stackToolInspectorDepth)
    : 0;
  const pickerNavigationDepth = typeof location.state?.stackToolPickerDepth === "number"
    ? Math.max(0, location.state.stackToolPickerDepth)
    : 0;
  const [pickerQuery, setPickerQuery] = useState("");
  const [collectionView, setCollectionView] = useState<"stack" | "wishlist">("stack");
  const [libraryBoardId, setLibraryBoardId] = useState<string | null>(null);
  const [pickerFilter, setPickerFilter] = useState<PickerFilterId>("recommended");
  const [pickerResultLimit, setPickerResultLimit] = useState(PICKER_RESULT_BATCH);
  const [pickerAddedToolSlugs, setPickerAddedToolSlugs] = useState<string[]>([]);
  const [needDialogToolSlug, setNeedDialogToolSlug] = useState<string | null>(null);
  const [draftNeedIds, setDraftNeedIds] = useState<string[]>([]);
  const [needDialogMode, setNeedDialogMode] = useState<"add" | "edit">("edit");
  const [renamingBoardId, setRenamingBoardId] = useState<string | null>(null);
  const [renamingBoardName, setRenamingBoardName] = useState("");
  const [pendingDeleteBoardId, setPendingDeleteBoardId] = useState<string | null>(null);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [draggedToolSlug, setDraggedToolSlug] = useState<string | null>(null);
  const [dragOverSubdomainId, setDragOverSubdomainId] = useState<string | null>(null);
  const [subdomainOverrides, setSubdomainOverrides] = useState<StackSubdomainOverrides>(readStackSubdomainOverrides);
  const [stackMotion, setStackMotion] = useState<"deeper" | "shallower" | "idle">("idle");
  const needDialogRef = useRef<HTMLElement | null>(null);
  const needDialogCloseRef = useRef<HTMLButtonElement | null>(null);
  const needDialogPreviousFocusRef = useRef<HTMLElement | null>(null);
  const pickerDialogRef = useRef<HTMLElement | null>(null);
  const pickerSearchRef = useRef<HTMLInputElement | null>(null);
  const pickerPreviousFocusRef = useRef<HTMLElement | null>(null);
  const persistenceNoticeRef = useRef("");

  useEffect(() => {
    try {
      window.localStorage.setItem(STACK_SUBDOMAIN_OVERRIDES_KEY, JSON.stringify(subdomainOverrides));
    } catch {
      // The stack remains usable in memory when local storage is unavailable.
    }
  }, [subdomainOverrides]);

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);
  const pinnedToolSlugSet = useMemo(() => new Set(state.pinnedToolSlugs), [state.pinnedToolSlugs]);
  const stackEntryBySlug = useMemo(
    () => new Map(state.toolEntries.map((entry) => [entry.toolSlug, entry])),
    [state.toolEntries],
  );
  const stackToolSlugs = useMemo(
    () => state.toolEntries.filter((entry) => entry.intent === "stack").map((entry) => entry.toolSlug),
    [state.toolEntries],
  );
  const wishlistToolSlugs = useMemo(
    () => state.toolEntries.filter((entry) => entry.intent === "wishlist").map((entry) => entry.toolSlug),
    [state.toolEntries],
  );
  const visibleToolSlugs = collectionView === "stack" ? stackToolSlugs : wishlistToolSlugs;
  const selectedTools = useMemo(
    () => visibleToolSlugs.map((slug) => toolBySlug.get(slug)).filter(Boolean) as ToolSummary[],
    [visibleToolSlugs, toolBySlug],
  );
  const stackPricing = useMemo(() => computeStackPricing(selectedTools, tools), [selectedTools, tools]);
  const needDialogTool = needDialogToolSlug ? toolBySlug.get(needDialogToolSlug) || null : null;

  const boards = useMemo(() => {
    const grouped = new Map<string, ToolSummary[]>();
    state.needs.forEach((need) => grouped.set(need.id, []));

    selectedTools.forEach((tool) => {
      const savedNeedIds = stackEntryBySlug.get(getToolKey(tool))?.needIds.filter((needId) => grouped.has(needId)) || [];
      if (savedNeedIds.length > 0) {
        savedNeedIds.forEach((needId) => grouped.get(needId)?.push(tool));
        return;
      }

      const entry = stackEntryBySlug.get(getToolKey(tool));
      if (entry && entry.assignmentMode !== "pending") return;

      const category = categoryById.get(tool.categoryId);
      const categoryLabel = category
        ? cleanCategoryLabel(lang === "en" ? category.nameEn || category.name : category.name)
        : "";
      const board = getBoardForTool(tool, categoryLabel);
      grouped.get(board.id)?.push(tool);
    });

    return state.needs.map((need) => {
      const suggestedBoard = STACK_BOARDS.find((board) => board.id === need.id);
      return {
        id: need.id,
        labelFr: need.labelFr,
        labelEn: need.labelEn,
        pattern: suggestedBoard?.pattern || /$^/,
        source: need.source,
        tools: grouped.get(need.id) || [],
      } satisfies StackObjective;
    });
  }, [categoryById, lang, selectedTools, stackEntryBySlug, state.needs]);
  const activeBoards = boards.filter((board) => board.tools.length > 0 || board.source === "custom") as StackObjective[];
  const stackNavigationBoards = useMemo(() => {
    if (collectionView === "stack") return activeBoards;

    const grouped = new Map<string, ToolSummary[]>();
    state.needs.forEach((need) => grouped.set(need.id, []));
    stackToolSlugs.map((slug) => toolBySlug.get(slug)).filter(Boolean).forEach((tool) => {
      const typedTool = tool as ToolSummary;
      const savedNeedIds = stackEntryBySlug.get(getToolKey(typedTool))?.needIds.filter((needId) => grouped.has(needId)) || [];
      if (savedNeedIds.length > 0) {
        savedNeedIds.forEach((needId) => grouped.get(needId)?.push(typedTool));
        return;
      }
      const entry = stackEntryBySlug.get(getToolKey(typedTool));
      if (entry && entry.assignmentMode !== "pending") return;
      const category = categoryById.get(typedTool.categoryId);
      const categoryLabel = category
        ? cleanCategoryLabel(lang === "en" ? category.nameEn || category.name : category.name)
        : "";
      grouped.get(getBoardForTool(typedTool, categoryLabel).id)?.push(typedTool);
    });

    return state.needs.flatMap((need) => {
      const toolsForNeed = grouped.get(need.id) || [];
      if (toolsForNeed.length === 0 && need.source !== "custom") return [];
      const suggestedBoard = STACK_BOARDS.find((board) => board.id === need.id);
      return [{
        id: need.id,
        labelFr: need.labelFr,
        labelEn: need.labelEn,
        pattern: suggestedBoard?.pattern || /$^/,
        source: need.source,
        tools: toolsForNeed,
      } satisfies StackObjective];
    });
  }, [activeBoards, categoryById, collectionView, lang, stackEntryBySlug, stackToolSlugs, state.needs, toolBySlug]);
  const stackProfileLabel = getStackProfileLabel(stackNavigationBoards, lang);
  const libraryActiveBoard = collectionView === "stack"
    ? stackNavigationBoards.find((board) => board.id === libraryBoardId) || null
    : null;
  const libraryTools = collectionView === "wishlist"
    ? selectedTools
    : libraryActiveBoard?.tools || selectedTools;
  const zoomObjectiveId = searchParams.get("objectif");
  const zoomedBoard = activeBoards.find((board) => board.id === zoomObjectiveId) || null;
  const quickToolSlug = searchParams.get("outil");
  const quickTool = zoomedBoard && quickToolSlug
    ? zoomedBoard.tools.find((tool) => getToolKey(tool) === quickToolSlug) || null
    : null;
  const isEditingBoard = !!zoomedBoard && editingBoardId === zoomedBoard.id;
  const pickerBoard = boards.find((board) => board.id === pickerBoardId) || null;
  const pickerIsGlobal = pickerBoardId === GLOBAL_STACK_PICKER_ID;
  const pickerIsCustom = pickerBoard?.source === "custom";
  const pickerDestinationLabel = pickerBoard
    ? t(pickerBoard.labelFr, pickerBoard.labelEn) as string
    : t("Ma stack", "My stack") as string;
  const pickerPageTitle = pickerBoard
    ? t("Ajouter des outils", "Add tools") as string
    : t("Ajouter des outils à Ma stack", "Add tools to My stack") as string;
  const pickerReturnLabel = pickerBoard
    ? t(`Terminer et revenir à ${pickerBoard.labelFr}`, `Finish and return to ${pickerBoard.labelEn}`) as string
    : t("Terminer et revenir à Ma stack", "Finish and return to My stack") as string;
  const pickerBoardPreviewTools = pickerBoard?.tools.slice(-3) || [];
  const pickerBoardToneClass = pickerBoard
    ? ` stack-board-card--${pickerBoard.id}${pickerBoard.source === "custom" ? " stack-board-card--custom" : ""}`
    : "";
  const pickerAddedToolSlugSet = useMemo(() => new Set(pickerAddedToolSlugs), [pickerAddedToolSlugs]);
  const pickerAddedStats = useMemo(() => {
    let organized = 0;
    let toConfirm = 0;
    let pending = 0;

    pickerAddedToolSlugs.forEach((toolSlug) => {
      const entry = stackEntryBySlug.get(toolSlug);
      if (!entry || entry.assignmentMode === "pending") {
        pending += 1;
      } else if (entry.needIds.length > 0) {
        organized += 1;
      } else {
        toConfirm += 1;
      }
    });

    return { organized, pending, toConfirm, total: pickerAddedToolSlugs.length };
  }, [pickerAddedToolSlugs, stackEntryBySlug]);

  const getCategoryLabel = useCallback((tool: ToolSummary) => {
    const category = categoryById.get(tool.categoryId);
    return category
      ? cleanCategoryLabel(lang === "en" ? category.nameEn || category.name : category.name)
      : cleanCategoryLabel(tool.categoryId);
  }, [categoryById, lang]);

  useEffect(() => {
    if (persistenceStatus.state === "ok") return;
    const signature = `${persistenceStatus.state}:${persistenceStatus.source}:${persistenceStatus.issue || ""}`;
    if (persistenceNoticeRef.current === signature) return;
    persistenceNoticeRef.current = signature;

    if (persistenceStatus.state === "recovered") {
      toast.success(t(
        "La dernière copie valide de Ma stack a été restaurée.",
        "The last valid copy of My stack was restored.",
      ) as string);
      return;
    }

    toast.error(t(
      persistenceStatus.issue === "storage-write-failed"
        ? "La modification reste visible, mais le navigateur n’a pas pu la sauvegarder. Libérez de l’espace avant de fermer cette page."
        : "Ma stack n’a pas pu être relue correctement. Aucune donnée incertaine n’a été affichée.",
      persistenceStatus.issue === "storage-write-failed"
        ? "The change remains visible, but the browser could not save it. Free up storage before closing this page."
        : "My stack could not be read safely. No uncertain data was displayed.",
    ) as string, { duration: 9000 });
  }, [persistenceStatus, t]);

  const zoomedSubdomains = useMemo(() => {
    if (!zoomedBoard) return [] as StackSubdomainGroup[];
    const groups = new Map<string, StackSubdomainGroup>();
    const optionById = new Map(getSubdomainOptionsForBoard(zoomedBoard.id).map((subdomain) => [subdomain.id, subdomain]));

    zoomedBoard.tools.forEach((tool) => {
      const overrideId = subdomainOverrides[zoomedBoard.id]?.[getToolKey(tool)];
      const subdomain = optionById.get(overrideId) || getSubdomainForBoardTool(zoomedBoard.id, tool, getCategoryLabel(tool));
      const existing = groups.get(subdomain.id) || { ...subdomain, tools: [] };
      existing.tools.push(tool);
      groups.set(subdomain.id, existing);
    });

    return Array.from(groups.values()).sort((a, b) => a.order - b.order || a.labelFr.localeCompare(b.labelFr));
  }, [getCategoryLabel, subdomainOverrides, zoomedBoard]);
  const zoomedSubdomainDestinations = useMemo(() => {
    if (!zoomedBoard) return [] as StackSubdomain[];
    const destinations = new Map(getSubdomainOptionsForBoard(zoomedBoard.id).map((subdomain) => [subdomain.id, subdomain]));
    zoomedSubdomains.forEach((subdomain) => destinations.set(subdomain.id, subdomain));
    return Array.from(destinations.values()).sort((a, b) => a.order - b.order || a.labelFr.localeCompare(b.labelFr));
  }, [zoomedBoard, zoomedSubdomains]);
  const quickToolIndex = quickTool && zoomedBoard
    ? zoomedBoard.tools.findIndex((tool) => getToolKey(tool) === getToolKey(quickTool))
    : -1;
  const quickToolGroup = quickTool
    ? zoomedSubdomains.find((group) => group.tools.some((tool) => getToolKey(tool) === getToolKey(quickTool))) || null
    : null;

  const pickerQueryTokens = useMemo(() => getPickerQueryTokens(pickerQuery), [pickerQuery]);
  const hasPickerQuery = pickerQueryTokens.length > 0;
  const pickerObjectiveConfig = pickerBoard ? getObjectivePickerConfig(pickerBoard.id) : null;
  const pickerObjectiveContext = useMemo(() => {
    if (!pickerBoard) return undefined;
    const boardTools = boards.find((board) => board.id === pickerBoard.id)?.tools || [];
    return buildObjectivePickerContext(pickerBoard.id, boardTools, getCategoryLabel);
  }, [boards, getCategoryLabel, pickerBoard]);

  const pickerCandidates = useMemo(() => {
    if (!pickerBoard && !pickerIsGlobal) return [] as ToolSummary[];

    const candidates = tools
      .filter((tool) => !pinnedToolSlugSet.has(getToolKey(tool)) || pickerAddedToolSlugSet.has(getToolKey(tool)))
      .map((tool) => {
        const categoryLabel = getCategoryLabel(tool);
        const classification = pickerIsGlobal ? classifyToolForStack(tool) : null;
        const boardScore = pickerIsGlobal
          ? (classification?.confidence === "high" ? 5 : classification?.confidence === "medium" ? 3 : 1)
          : pickerIsCustom ? 1 : getToolPickerBoardScore(tool, pickerBoard as StackObjective, categoryLabel, pickerObjectiveContext);
        const searchScore = getPickerSearchScore(tool, categoryLabel, pickerQueryTokens);
        const subdomain = pickerBoard ? getObjectivePickerSubdomain(pickerBoard.id, tool, categoryLabel) : null;
        return {
          categoryLabel,
          boardScore,
          score: (boardScore * (hasPickerQuery ? 2 : 1)) + searchScore + getToolPickerScore(tool),
          subdomainId: subdomain?.id || classification?.needIds[0],
          tool,
        } satisfies PickerCandidate;
      })
      .filter((candidate) => {
        if (hasPickerQuery) {
          if (!toolMatchesPickerQuery(candidate.tool, candidate.categoryLabel, pickerQueryTokens)) return false;
          if (pickerFilter === "recommended") return true;
        }
        return matchesPickerFilter(pickerFilter, candidate.tool, candidate.boardScore, candidate.categoryLabel);
      })
      .sort((a, b) =>
        b.score - a.score ||
        b.boardScore - a.boardScore ||
        a.tool.name.localeCompare(b.tool.name)
      );

    return diversifyObjectivePickerCandidates(candidates, pickerFilter, hasPickerQuery, pickerObjectiveConfig)
      .map((candidate) => candidate.tool)
      .slice(0, hasPickerQuery ? 48 : pickerFilter === "recommended" ? 24 : 40);
  }, [getCategoryLabel, hasPickerQuery, pickerAddedToolSlugSet, pickerBoard, pickerIsCustom, pickerIsGlobal, pickerObjectiveConfig, pickerObjectiveContext, pickerFilter, pickerQueryTokens, pinnedToolSlugSet, tools]);

  const visiblePickerCandidates = pickerCandidates.slice(0, pickerResultLimit);
  const hasMorePickerCandidates = pickerCandidates.length > visiblePickerCandidates.length;
  const legacyIdeasSeed = searchParams.get("idees");
  const legacyAngleParam = searchParams.get("angle");
  const legacyAngle = legacyAngleParam === "alternatives" || legacyAngleParam === "extensions" || legacyAngleParam === "adjacent"
    ? legacyAngleParam
    : "all";

  useEffect(() => {
    if (!legacyIdeasSeed || !zoomedBoard) return;
    const source = legacyIdeasSeed === "objectif"
      ? { type: "objectif" as const, id: zoomedBoard.id }
      : { type: "outil" as const, slug: legacyIdeasSeed };
    navigate(getExplorerHref(prefix, source, { angle: legacyAngle, destination: zoomedBoard.id }), {
      replace: true,
      state: {
        explorerCanGoBack: true,
        explorerReturnTo: `${prefix}/ma-stack?objectif=${encodeURIComponent(zoomedBoard.id)}`,
        previousSourceLabel: t(zoomedBoard.labelFr, zoomedBoard.labelEn),
      },
    });
  }, [legacyAngle, legacyIdeasSeed, navigate, prefix, t, zoomedBoard]);

  useEffect(() => {
    setPickerResultLimit(PICKER_RESULT_BATCH);
  }, [pickerBoardId, pickerFilter, pickerQuery]);

  useEffect(() => {
    if (!pickerBoardId) {
      setPickerQuery("");
      setPickerFilter("recommended");
      setPickerResultLimit(PICKER_RESULT_BATCH);
      setPickerAddedToolSlugs([]);
    }
  }, [pickerBoardId]);

  useEffect(() => {
    if (!pickerBoardId) return;
    const focusFrame = window.requestAnimationFrame(() => {
      if (window.matchMedia("(min-width: 601px)").matches) pickerSearchRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (pickerNavigationDepth > 0) {
          navigate(-pickerNavigationDepth);
          return;
        }
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("ajouter");
        setSearchParams(nextParams, { replace: true });
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      pickerPreviousFocusRef.current?.focus();
    };
  }, [navigate, pickerBoardId, pickerNavigationDepth, searchParams, setSearchParams]);

  useEffect(() => {
    if (!needDialogToolSlug) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => needDialogCloseRef.current?.focus());

    function handleNeedDialogKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setNeedDialogToolSlug(null);
        return;
      }
      if (event.key !== "Tab" || !needDialogRef.current) return;

      const focusable = Array.from(needDialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hasAttribute("hidden"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleNeedDialogKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleNeedDialogKeyDown);
      document.body.style.overflow = previousOverflow;
      needDialogPreviousFocusRef.current?.focus();
    };
  }, [needDialogToolSlug]);

  function openToolPicker(boardId = GLOBAL_STACK_PICKER_ID) {
    pickerPreviousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("outil");
    nextParams.set("ajouter", boardId);
    runStackViewTransition(() => {
      setPickerQuery("");
      setPickerFilter("recommended");
      setPickerResultLimit(PICKER_RESULT_BATCH);
      setPickerAddedToolSlugs([]);
      setStackMotion("deeper");
      setSearchParams(nextParams, {
        state: { ...location.state, stackToolPickerDepth: pickerNavigationDepth + 1 },
      });
    });
  }

  function closeToolPicker() {
    runStackViewTransition(() => {
      setStackMotion("shallower");
      if (pickerNavigationDepth > 0) {
        navigate(-pickerNavigationDepth);
        return;
      }
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("ajouter");
      setSearchParams(nextParams, { replace: true });
    });
  }

  function addToolFromPicker(tool: ToolSummary) {
    const toolSlug = getToolKey(tool);
    if (pickerAddedToolSlugSet.has(toolSlug)) {
      unpinTool(toolSlug);
      setPickerAddedToolSlugs((current) => current.filter((slug) => slug !== toolSlug));
      return;
    }
    const classification = classifyToolForStack(tool);
    const suggestedNeedId = pickerBoard?.id
      || (classification.confidence === "low" ? undefined : classification.needIds.find((needId) => state.needs.some((need) => need.id === needId)));
    setNeedDialogMode("add");
    setDraftNeedIds(suggestedNeedId ? [suggestedNeedId] : []);
    setNeedDialogToolSlug(toolSlug);
  }

  function getPickerNeedSuggestion(tool: ToolSummary) {
    if (pickerBoard) {
      return t(`Sera ajouté à ${pickerBoard.labelFr}`, `Will be added to ${pickerBoard.labelEn}`) as string;
    }
    const classification = classifyToolForStack(tool);
    if (classification.confidence === "low" || classification.needIds.length === 0) {
      return t("Choisir une collection", "Choose a collection") as string;
    }
    const need = state.needs.find((candidate) => candidate.id === classification.needIds[0]);
    return need
      ? t(`Collection suggérée · ${need.labelFr}`, `Suggested collection · ${need.labelEn}`) as string
      : t("Choisir une collection", "Choose a collection") as string;
  }

  function getPickerAddedSummary(tool: ToolSummary) {
    if (pickerBoard) {
      return t(`Ajouté dans ${pickerBoard.labelFr}`, `Added to ${pickerBoard.labelEn}`) as string;
    }
    const entry = stackEntryBySlug.get(getToolKey(tool));
    const labels = state.needs
      .filter((need) => entry?.needIds.includes(need.id))
      .map((need) => t(need.labelFr, need.labelEn));
    return labels.length > 0
      ? t(`Ajouté à ${labels.join(" et ")}`, `Added to ${labels.join(" and ")}`) as string
      : t("Ajout confirmé", "Added") as string;
  }

  function getPickerSessionSummary() {
    if (pickerAddedStats.total === 0) {
      return pickerBoard
        ? t(
          `Sélectionnez les outils à ajouter à ${pickerBoard.labelFr}.`,
          `Select the tools to add to ${pickerBoard.labelEn}.`,
        ) as string
        : t(
          "Sélectionnez un outil, puis confirmez sa collection avant de l’ajouter.",
          "Select a tool, then confirm its collection before adding it.",
        ) as string;
    }
    if (pickerAddedStats.pending > 0) {
      return t(
        `${formatToolCount(pickerAddedStats.total, lang)} ajouté${pickerAddedStats.total > 1 ? "s" : ""} · rangement en cours`,
        `${formatToolCount(pickerAddedStats.total, lang)} added · organizing`,
      ) as string;
    }

    const frenchParts = [
      `${formatToolCount(pickerAddedStats.total, lang)} ajouté${pickerAddedStats.total > 1 ? "s" : ""}`,
      pickerAddedStats.organized > 0
        ? `${pickerAddedStats.organized} classé${pickerAddedStats.organized > 1 ? "s" : ""}`
        : "",
      pickerAddedStats.toConfirm > 0 ? `${pickerAddedStats.toConfirm} à confirmer` : "",
    ].filter(Boolean);
    const englishParts = [
      `${formatToolCount(pickerAddedStats.total, lang)} added`,
      pickerAddedStats.organized > 0 ? `${pickerAddedStats.organized} organized` : "",
      pickerAddedStats.toConfirm > 0 ? `${pickerAddedStats.toConfirm} to confirm` : "",
    ].filter(Boolean);
    return t(frenchParts.join(" · "), englishParts.join(" · ")) as string;
  }

  function openNeedDialog(toolSlug: string) {
    setNeedDialogMode("edit");
    setDraftNeedIds(stackEntryBySlug.get(toolSlug)?.needIds || []);
    setNeedDialogToolSlug(toolSlug);
  }

  function closeNeedDialog() {
    setNeedDialogToolSlug(null);
  }

  function toggleDraftNeed(needId: string) {
    setDraftNeedIds((current) => current.includes(needId)
      ? current.filter((id) => id !== needId)
      : [...current, needId]);
  }

  function saveNeedAssignments(needIds: string[], intent: "stack" | "wishlist") {
    if (!needDialogToolSlug) return;
    const toolSlug = needDialogToolSlug;
    const previousNeedIds = stackEntryBySlug.get(toolSlug)?.needIds || [];
    const toolName = needDialogTool?.name || needDialogToolSlug;
    const selectedNeedLabels = state.needs
      .filter((need) => needIds.includes(need.id))
      .map((need) => t(need.labelFr, need.labelEn));
    if (needDialogMode === "add") {
      saveToolSelection(toolSlug, needIds, intent);
      setPickerAddedToolSlugs((current) => Array.from(new Set([...current, toolSlug])));
    } else {
      saveToolSelection(toolSlug, needIds, intent);
    }
    closeNeedDialog();
    toast.success(intent === "wishlist"
      ? t(`${toolName} ajouté à Mes envies.`, `${toolName} added to Wishlist.`) as string
      : t(
        `${toolName} ajouté à ${selectedNeedLabels.join(" et ")}.`,
        `${toolName} added to ${selectedNeedLabels.join(" and ")}.`,
      ) as string, {
      action: {
        label: t("Annuler", "Undo") as string,
        onClick: () => needDialogMode === "add" ? unpinTool(toolSlug) : assignToolNeeds(toolSlug, previousNeedIds),
      },
    });
  }

  function deleteToolFromStack() {
    if (!needDialogToolSlug) return;
    const toolSlug = needDialogToolSlug;
    const toolName = needDialogTool?.name || toolSlug;
    const previousNeedIds = stackEntryBySlug.get(toolSlug)?.needIds || [];
    const confirmed = window.confirm(t(
      `Retirer ${toolName} de Ma stack ?`,
      `Remove ${toolName} from My stack?`,
    ) as string);
    if (!confirmed) return;
    const shouldCloseObjective = !!zoomedBoard && zoomedBoard.tools.some((tool) => getToolKey(tool) === needDialogToolSlug) && zoomedBoard.tools.length <= 1;
    unpinTool(toolSlug);
    closeNeedDialog();
    if (shouldCloseObjective) closeObjective();
    toast.success(t(
      `${toolName} retiré de Ma stack.`,
      `${toolName} removed from My stack.`,
    ) as string, {
      action: {
        label: t("Annuler", "Undo") as string,
        onClick: () => pinTool(toolSlug, previousNeedIds),
      },
    });
  }

  function openObjective(boardId: string) {
    setEditingBoardId(null);
    setDraggedToolSlug(null);
    setDragOverSubdomainId(null);
    setStackMotion("deeper");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("objectif", boardId);
    setSearchParams(nextParams);
    if (typeof window !== "undefined") {
      scrollToTop("smooth");
    }
  }

  function openStackBoard(boardId: string) {
    setCollectionView("stack");
    setLibraryBoardId(boardId);
    if (zoomedBoard) closeObjective();
  }

  function showStackOverview() {
    setCollectionView("stack");
    setLibraryBoardId(null);
    if (zoomedBoard) closeObjective();
  }

  function showWishlist() {
    setCollectionView("wishlist");
    setLibraryBoardId(null);
    if (zoomedBoard) closeObjective();
  }

  function closeObjective() {
    setEditingBoardId(null);
    setDraggedToolSlug(null);
    setDragOverSubdomainId(null);
    setStackMotion("shallower");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("objectif");
    nextParams.delete("outil");
    nextParams.delete("idees");
    nextParams.delete("angle");
    setSearchParams(nextParams);
  }

  function openDedicatedExplorer(seedSlug = "objectif") {
    if (!zoomedBoard || zoomedBoard.tools.length === 0) return;
    const source = seedSlug === "objectif"
      ? { type: "objectif" as const, id: zoomedBoard.id }
      : { type: "outil" as const, slug: seedSlug };
    navigate(getExplorerHref(prefix, source, { destination: zoomedBoard.id }), {
      state: {
        explorerCanGoBack: true,
        explorerReturnTo: `${prefix}/ma-stack?objectif=${encodeURIComponent(zoomedBoard.id)}`,
        previousSourceLabel: seedSlug === "objectif"
          ? t(zoomedBoard.labelFr, zoomedBoard.labelEn)
          : toolBySlug.get(seedSlug)?.name || t(zoomedBoard.labelFr, zoomedBoard.labelEn),
      },
    });
  }

  function getToolInspectorHref(toolSlug: string) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("outil", toolSlug);
    return `${prefix}/ma-stack?${nextParams.toString()}`;
  }

  function closeToolInspector() {
    setStackMotion("shallower");
    if (inspectorNavigationDepth > 0) {
      navigate(-inspectorNavigationDepth);
      return;
    }
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("outil");
    setSearchParams(nextParams, { replace: true });
  }

  function editInspectedTool() {
    if (!quickTool) return;
    const toolSlug = getToolKey(quickTool);
    closeToolInspector();
    openNeedDialog(toolSlug);
  }

  function removeToolFromCurrentNeed(toolSlug: string) {
    if (!zoomedBoard) return;
    const entry = stackEntryBySlug.get(toolSlug);
    const previousNeedIds = entry?.needIds || [];
    const toolName = toolBySlug.get(toolSlug)?.name || toolSlug;
    const shouldClose = zoomedBoard.tools.length <= 1;
    assignToolNeeds(toolSlug, previousNeedIds.filter((needId) => needId !== zoomedBoard.id));
    if (shouldClose) closeObjective();
    toast.success(t(
      `${toolName} retiré de ${zoomedBoard.labelFr}.`,
      `${toolName} removed from ${zoomedBoard.labelEn}.`,
    ) as string, {
      action: {
        label: t("Annuler", "Undo") as string,
        onClick: () => assignToolNeeds(toolSlug, previousNeedIds),
      },
    });
  }

  function setToolSubdomainOverride(boardId: string, toolSlug: string, subdomainId: string | null) {
    setSubdomainOverrides((current) => {
      const boardOverrides = { ...(current[boardId] || {}) };
      if (subdomainId) boardOverrides[toolSlug] = subdomainId;
      else delete boardOverrides[toolSlug];
      const next = { ...current };
      if (Object.keys(boardOverrides).length > 0) next[boardId] = boardOverrides;
      else delete next[boardId];
      return next;
    });
  }

  function moveToolToSubdomain(toolSlug: string, subdomainId: string) {
    if (!zoomedBoard) return;
    const destination = zoomedSubdomainDestinations.find((subdomain) => subdomain.id === subdomainId);
    const tool = zoomedBoard.tools.find((candidate) => getToolKey(candidate) === toolSlug);
    if (!destination || !tool) return;
    const currentGroup = zoomedSubdomains.find((group) => group.tools.some((candidate) => getToolKey(candidate) === toolSlug));
    const previousOverride = subdomainOverrides[zoomedBoard.id]?.[toolSlug] || null;
    setDraggedToolSlug(null);
    setDragOverSubdomainId(null);
    if (currentGroup?.id === destination.id) return;
    setToolSubdomainOverride(zoomedBoard.id, toolSlug, destination.id);
    toast.success(t(
      `${tool.name} déplacé dans ${destination.labelFr}.`,
      `${tool.name} moved to ${destination.labelEn}.`,
    ) as string, {
      action: {
        label: t("Annuler", "Undo") as string,
        onClick: () => setToolSubdomainOverride(zoomedBoard.id, toolSlug, previousOverride),
      },
    });
  }

  function removeCustomBoard(board: StackObjective) {
    deleteNeed(board.id);
    toast.success(t(`Collection ${board.labelFr} supprimée. Ses outils restent dans Ma stack.`, `${board.labelEn} collection removed. Its tools remain in My stack.`) as string);
  }

  function startRenamingBoard(board: StackObjective) {
    setRenamingBoardId(board.id);
    setRenamingBoardName(getBoardDisplayLabel(board, lang));
  }

  function saveRenamedBoard(board: StackObjective) {
    const label = renamingBoardName.trim();
    if (!label) return;
    renameNeed(board.id, label);
    setRenamingBoardId(null);
    setRenamingBoardName("");
    toast.success(t(`Collection renommée « ${label} ».`, `Collection renamed “${label}”.`) as string);
  }

  function renderEstimatedProfile(additionalClass = "") {
    return (
      <div
        className={`stack-page-toolbar-profile${additionalClass ? ` ${additionalClass}` : ""}`}
        aria-label={t(`Coût mensuel estimé : ${formatMonthlyPrice(stackPricing.total, lang)}`, `Estimated monthly cost: ${formatMonthlyPrice(stackPricing.total, lang)}`) as string}
      >
        <span className="stack-page-toolbar-profile-avatar" aria-hidden><UserRound size={20} /></span>
        <span className="stack-page-toolbar-profile-copy">
          <small>{t("Profil estimé", "Estimated profile")}</small>
          <strong>{stackProfileLabel}</strong>
          <span>
            {t(`Votre stack coûte ${formatMonthlyPrice(stackPricing.total, lang)}`, `Your stack costs ${formatMonthlyPrice(stackPricing.total, lang)}`)}
            {stackPricing.unknownPriceCount > 0 && t(
              ` · ${stackPricing.unknownPriceCount} ${stackPricing.unknownPriceCount > 1 ? "prix inconnus" : "prix inconnu"}`,
              ` · ${stackPricing.unknownPriceCount} unknown ${stackPricing.unknownPriceCount > 1 ? "prices" : "price"}`,
            )}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className={`stack-boards-page${zoomedBoard ? " stack-boards-page--zoomed" : ""}${pickerBoardId ? " stack-boards-page--adding" : ""}${stackMotion !== "idle" ? ` stack-boards-page--motion-${stackMotion}` : ""}`}>
      {zoomedBoard ? (
        quickTool ? null : <section className="stack-objective-hero" aria-labelledby="stack-objective-title">
          <div className="stack-objective-hero-inner">
            <button type="button" className="stack-objective-hero-round" onClick={closeObjective} aria-label={t("Retour à Ma stack", "Back to My stack") as string} title={t("Retour à Ma stack", "Back to My stack") as string}>
              <ArrowLeft size={20} aria-hidden />
            </button>

            <div className="stack-objective-hero-copy">
              <h1 id="stack-objective-title">{t(zoomedBoard.labelFr, zoomedBoard.labelEn)}</h1>
              <p>
                <span>{t("Collection", "Collection")}</span>
                <span aria-hidden>·</span>
                {formatToolCount(zoomedBoard.tools.length, lang)}
                <span aria-hidden>·</span>
                {zoomedSubdomains.length} {t(zoomedSubdomains.length > 1 ? "catégories" : "catégorie", zoomedSubdomains.length > 1 ? "categories" : "category")}
              </p>
            </div>

            {renderEstimatedProfile("stack-objective-hero-profile")}

            <div className="stack-objective-hero-actions">
              <button
                type="button"
                className={`stack-objective-hero-edit${isEditingBoard ? " is-active" : ""}`}
                onClick={() => {
                  setEditingBoardId((current) => current === zoomedBoard.id ? null : zoomedBoard.id);
                  setDraggedToolSlug(null);
                  setDragOverSubdomainId(null);
                }}
                aria-pressed={isEditingBoard}
                aria-label={isEditingBoard ? t("Terminer", "Done") as string : t("Organiser", "Organize") as string}
                title={isEditingBoard ? t("Terminer", "Done") as string : t("Organiser", "Organize") as string}
              >
                {isEditingBoard ? <X size={18} aria-hidden /> : <Pencil size={17} aria-hidden />}
              </button>

              {zoomedBoard.tools.length > 0 && (
                <button
                  type="button"
                  className="stack-objective-hero-explore"
                  onClick={() => openDedicatedExplorer("objectif")}
                  aria-label={t(`Explorer la collection ${zoomedBoard.labelFr}`, `Explore the ${zoomedBoard.labelEn} collection`) as string}
                >
                  <Compass size={17} aria-hidden />
                  <span>{t("Explorer cette collection", "Explore this collection")}</span>
                </button>
              )}

              <button type="button" className="stack-objective-hero-add" onClick={() => openToolPicker(zoomedBoard.id)}>
                <Plus size={19} aria-hidden />
                <span>{t("Ajouter", "Add")}</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="stack-page-toolbar stack-page-toolbar--overview" aria-labelledby="stack-profile-title">
          <div className="stack-profile-header">
            <div className="stack-profile-identity">
              <span className="stack-profile-avatar" aria-hidden><UserRound size={30} /></span>
              <div className="stack-profile-copy">
                <span>{t("Votre espace ToolTrim", "Your ToolTrim space")}</span>
                <h1 id="stack-profile-title">{t("Ma stack", "My stack")}</h1>
                <p>
                  <strong>{stackProfileLabel}</strong>
                  <span aria-hidden>·</span>
                  {formatToolCount(stackToolSlugs.length, lang)}
                  <span aria-hidden>·</span>
                  {stackNavigationBoards.length} {t(stackNavigationBoards.length > 1 ? "collections" : "collection", stackNavigationBoards.length > 1 ? "collections" : "collection")}
                </p>
              </div>
            </div>
            <div className="stack-profile-actions">
              <button type="button" className="stack-page-toolbar-icon stack-page-toolbar-icon--primary" onClick={() => openToolPicker()} aria-label={t("Explorer les outils", "Explore tools") as string}>
                <Compass size={18} aria-hidden />
                <span>{t("Explorer les outils", "Explore tools")}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {!pickerBoardId && (
        <nav className="stack-library-tabs" aria-label={t("Parcourir mes collections", "Browse my collections") as string}>
          <div className="stack-library-tabs-inner">
            <button
              type="button"
              className={collectionView === "stack" && !libraryBoardId && !zoomedBoard ? "is-active" : ""}
              aria-current={collectionView === "stack" && !libraryBoardId && !zoomedBoard ? "page" : undefined}
              onClick={showStackOverview}
            >
              <span>{t("Tous les outils", "All tools")}</span>
              <small>{stackToolSlugs.length}</small>
            </button>
            {stackNavigationBoards.map((board) => (
              <span key={board.id} className="stack-library-tab-item">
                <button
                  type="button"
                  className={collectionView === "stack" && libraryBoardId === board.id ? "is-active" : ""}
                  aria-current={collectionView === "stack" && libraryBoardId === board.id ? "page" : undefined}
                  onClick={() => openStackBoard(board.id)}
                >
                  <span>{getBoardDisplayLabel(board, lang)}</span>
                  <small>{board.tools.length}</small>
                </button>
                {board.source === "custom" && (
                  <details className="stack-library-tab-menu">
                    <summary aria-label={t(`Gérer la collection ${board.labelFr}`, `Manage the ${board.labelEn} collection`) as string}>
                      <MoreHorizontal size={16} aria-hidden />
                    </summary>
                    <div>
                      <button type="button" onClick={() => startRenamingBoard(board)}><Pencil size={14} aria-hidden />{t("Renommer", "Rename")}</button>
                      <button type="button" disabled={state.needs.findIndex((need) => need.id === board.id) <= 0} onClick={() => moveNeed(board.id, -1)}><ArrowLeft size={14} aria-hidden />{t("Déplacer à gauche", "Move left")}</button>
                      <button type="button" className="is-danger" onClick={() => setPendingDeleteBoardId(board.id)}><Trash2 size={14} aria-hidden />{t("Supprimer", "Delete")}</button>
                    </div>
                  </details>
                )}
                {renamingBoardId === board.id && (
                  <form className="stack-library-tab-popover" onSubmit={(event) => { event.preventDefault(); saveRenamedBoard(board); }}>
                    <label htmlFor={`tab-rename-${board.id}`}>{t("Nom de la collection", "Collection name")}</label>
                    <input id={`tab-rename-${board.id}`} autoFocus value={renamingBoardName} onChange={(event) => setRenamingBoardName(event.target.value)} maxLength={60} />
                    <div><button type="button" onClick={() => setRenamingBoardId(null)}>{t("Annuler", "Cancel")}</button><button type="submit" disabled={!renamingBoardName.trim()}>{t("Enregistrer", "Save")}</button></div>
                  </form>
                )}
                {pendingDeleteBoardId === board.id && (
                  <div className="stack-library-tab-popover" role="alertdialog" aria-labelledby={`tab-delete-${board.id}`}>
                    <strong id={`tab-delete-${board.id}`}>{t("Supprimer cette collection ?", "Delete this collection?")}</strong>
                    <p>{t("Ses outils resteront dans leurs autres collections.", "Its tools will remain in their other collections.")}</p>
                    <div><button type="button" onClick={() => setPendingDeleteBoardId(null)}>{t("Annuler", "Cancel")}</button><button type="button" className="is-danger" onClick={() => { setPendingDeleteBoardId(null); removeCustomBoard(board); }}>{t("Supprimer", "Delete")}</button></div>
                  </div>
                )}
              </span>
            ))}
            <span className="stack-library-tabs-divider" aria-hidden />
            <button
              type="button"
              className={`stack-library-tabs-wishlist${collectionView === "wishlist" ? " is-active" : ""}`}
              aria-current={collectionView === "wishlist" ? "page" : undefined}
              onClick={showWishlist}
            >
              <Heart size={15} aria-hidden />
              <span>{t("Mes envies", "Wishlist")}</span>
              <small>{wishlistToolSlugs.length}</small>
            </button>
          </div>
        </nav>
      )}

      {zoomedBoard ? (
        <main className={`stack-objective-detail${quickTool ? " stack-objective-detail--tool-page" : ""}${isEditingBoard ? " stack-objective-detail--editing" : ""}`} aria-label={t(`Détail ${zoomedBoard.labelFr}`, `${zoomedBoard.labelEn} detail`) as string}>
          {!quickTool && (<div className="stack-objective-browser">
            {isEditingBoard && zoomedSubdomainDestinations.length > 1 && (
              <div className="stack-board-organize-destinations" aria-label={t("Groupes de destination", "Destination groups") as string}>
                <span>{draggedToolSlug ? t("Déplacer vers", "Move to") : t("Glissez un outil", "Drag a tool")}</span>
                <div>
                  {zoomedSubdomainDestinations.map((destination) => (
                    <button
                      key={destination.id}
                      type="button"
                      className={dragOverSubdomainId === destination.id ? "is-over" : ""}
                      aria-disabled={!draggedToolSlug}
                      onClick={() => draggedToolSlug && moveToolToSubdomain(draggedToolSlug, destination.id)}
                      onDragOver={(event) => {
                        if (!draggedToolSlug) return;
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        setDragOverSubdomainId(destination.id);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const toolSlug = event.dataTransfer.getData("text/plain") || draggedToolSlug;
                        if (toolSlug) moveToolToSubdomain(toolSlug, destination.id);
                      }}
                    >
                      {t(destination.labelFr, destination.labelEn)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="stack-role-section-grid">
            {zoomedSubdomains.map((group) => (
              <section
                key={group.id}
                className={`stack-role-section${group.tools.length <= 2 ? " stack-role-section--sparse" : ""}${group.tools.length === 1 ? " stack-role-section--single" : ""}${dragOverSubdomainId === group.id ? " is-drop-target" : ""}`}
                aria-labelledby={`stack-role-${group.id}`}
                onDragOver={(event) => {
                  if (!isEditingBoard || !draggedToolSlug) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOverSubdomainId(group.id);
                }}
                onDrop={(event) => {
                  if (!isEditingBoard) return;
                  event.preventDefault();
                  const toolSlug = event.dataTransfer.getData("text/plain") || draggedToolSlug;
                  if (toolSlug) moveToolToSubdomain(toolSlug, group.id);
                }}
              >
                <div className="stack-role-section-head">
                  <h2 id={`stack-role-${group.id}`}>{t(group.labelFr, group.labelEn)}</h2>
                  <span>{formatToolCount(group.tools.length, lang)}</span>
                </div>
                <div className="stack-role-tool-grid" role="list">
                  {group.tools.map((tool) => {
                    const toolSlug = getToolKey(tool);
                    return (
                      <article
                        key={toolSlug}
                        className={`stack-role-tool-card${draggedToolSlug === toolSlug ? " is-dragging" : ""}`}
                        role="listitem"
                        tabIndex={isEditingBoard ? 0 : undefined}
                        draggable={isEditingBoard}
                        onClickCapture={() => !isEditingBoard && setStackMotion("deeper")}
                        onClick={() => isEditingBoard && setDraggedToolSlug((current) => current === toolSlug ? null : toolSlug)}
                        onKeyDown={(event) => {
                          if (!isEditingBoard || (event.key !== "Enter" && event.key !== " ")) return;
                          event.preventDefault();
                          setDraggedToolSlug((current) => current === toolSlug ? null : toolSlug);
                        }}
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", toolSlug);
                          setDraggedToolSlug(toolSlug);
                        }}
                        onDragEnd={() => {
                          setDraggedToolSlug(null);
                          setDragOverSubdomainId(null);
                        }}
                        aria-label={isEditingBoard ? t(`Déplacer ${tool.name}`, `Move ${tool.name}`) as string : undefined}
                      >
                        <ToolCardEditorial
                          tool={tool}
                          prefix={prefix}
                          t={t}
                          lang={lang}
                          variant="decision"
                          showPin={false}
                          showPrice={false}
                          to={getToolInspectorHref(toolSlug)}
                          linkState={{ stackToolInspectorDepth: 1 }}
                          selected={quickToolSlug === toolSlug}
                        />
                        {isEditingBoard && (
                          <><span className="stack-role-tool-drag-handle" aria-hidden><GripVertical size={16} /></span><button
                            type="button"
                            className="stack-role-tool-remove"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              removeToolFromCurrentNeed(toolSlug);
                            }}
                            aria-label={t(`Retirer ${tool.name} de ${zoomedBoard.labelFr}`, `Remove ${tool.name} from ${zoomedBoard.labelEn}`) as string}
                            title={t("Retirer de la collection", "Remove from collection") as string}
                          >
                            <Trash2 size={17} aria-hidden />
                          </button></>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
            </div>
          </div>)}

          {quickTool && (
            <section className="stack-tool-stage" aria-label={t(`Fiche ${quickTool.name}`, `${quickTool.name} profile`) as string}>
              <StackToolInspector
                tool={quickTool}
                needLabel={t(zoomedBoard.labelFr, zoomedBoard.labelEn)}
                sectionLabel={quickToolGroup ? t(quickToolGroup.labelFr, quickToolGroup.labelEn) : t("Outils de la collection", "Collection tools")}
                categoryLabel={getCategoryLabel(quickTool)}
                typeLabel={getToolTypeLabel(quickTool, lang)}
                priceLabel={formatStackToolPrice(quickTool, lang)}
                stackCostLabel={formatMonthlyPrice(stackPricing.total, lang)}
                prefix={prefix}
                lang={lang}
                previousHref={quickToolIndex > 0 ? getToolInspectorHref(getToolKey(zoomedBoard.tools[quickToolIndex - 1])) : undefined}
                previousLabel={quickToolIndex > 0 ? zoomedBoard.tools[quickToolIndex - 1].name : undefined}
                nextHref={quickToolIndex >= 0 && quickToolIndex < zoomedBoard.tools.length - 1 ? getToolInspectorHref(getToolKey(zoomedBoard.tools[quickToolIndex + 1])) : undefined}
                nextLabel={quickToolIndex >= 0 && quickToolIndex < zoomedBoard.tools.length - 1 ? zoomedBoard.tools[quickToolIndex + 1].name : undefined}
                navigationDepth={inspectorNavigationDepth}
                onClose={closeToolInspector}
                onEdit={editInspectedTool}
                onExploreIdeas={() => openDedicatedExplorer(getToolKey(quickTool))}
                headerAside={renderEstimatedProfile("stack-tool-profile-estimated")}
                t={t}
              />
            </section>
          )}
        </main>
      ) : (
        <main className="stack-library-content" aria-label={t("Outils enregistrés", "Saved tools") as string}>
          {libraryTools.length === 0 && (
            <section className="stack-empty-overview">
              <span>{collectionView === "wishlist" ? t("Aucune envie enregistrée", "Nothing on your wishlist yet") : libraryActiveBoard ? t("Collection vide", "Empty collection") : t("Aucun outil utilisé", "No tools in use")}</span>
              <h2>{collectionView === "wishlist" ? t("Gardez ici ce qui vous inspire", "Keep inspiring tools here") : libraryActiveBoard ? t(`Aucun outil dans ${getBoardDisplayLabel(libraryActiveBoard, lang)}`, `No tools in ${getBoardDisplayLabel(libraryActiveBoard, lang)}`) : t("Votre stack est vide", "Your stack is empty")}</h2>
              <p>
                {collectionView === "wishlist"
                  ? t("Une sélection libre d’outils qui vous donnent envie, sans rien avoir à décider maintenant.", "A free selection of tools that spark your interest, with nothing to decide right now.")
                  : libraryActiveBoard
                    ? t("Ajoutez un outil à cette collection pour le retrouver directement ici.", "Add a tool to this collection to find it directly here.")
                    : t("Ajoutez les outils que vous utilisez réellement, puis organisez-les dans vos collections.", "Add the tools you actually use, then organize them into collections.")}
              </p>
              <button type="button" className="cart-primary-link" onClick={() => openToolPicker(libraryActiveBoard?.id)}>{t("Ajouter un outil", "Add a tool")}</button>
            </section>
          )}
          {libraryTools.length > 0 && (
            <div className="stack-library-tool-grid" role="list">
              {libraryTools.map((tool) => {
                const toolSlug = getToolKey(tool);
                return (
                  <article key={toolSlug} className="stack-library-tool-card" role="listitem">
                    <ToolCardEditorial
                      tool={tool}
                      prefix={prefix}
                      t={t}
                      lang={lang}
                      categoryLabel={getCategoryLabel(tool)}
                      showPin={false}
                      showPrice
                      to={`${prefix}/tool/${toolSlug}`}
                      exploreHref={getExplorerHref(prefix, { type: "outil", slug: toolSlug }, { destination: libraryActiveBoard?.id })}
                      onOrganize={() => openNeedDialog(toolSlug)}
                    />
                  </article>
                );
              })}
            </div>
          )}
        </main>
      )}

      {needDialogTool && (
        <div className="stack-need-dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeNeedDialog();
        }}>
          <section
            ref={needDialogRef}
            className="stack-need-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stack-need-dialog-title"
          >
            <div className="stack-need-dialog-head">
              <ToolLogo tool={needDialogTool} size={42} className="stack-need-dialog-logo" />
              <div>
                <span>{needDialogMode === "add" ? t("Ajouter l’outil", "Add tool") : t("Organiser cet outil", "Organize this tool")}</span>
                <h2 id="stack-need-dialog-title">{needDialogTool.name}</h2>
              </div>
              <div className="stack-need-dialog-head-actions">
                {needDialogMode === "edit" && <details className="stack-need-dialog-menu">
                  <summary aria-label={t("Plus d’options", "More options") as string} title={t("Plus d’options", "More options") as string}>
                    <MoreHorizontal size={18} aria-hidden />
                  </summary>
                  <div>
                    <button type="button" onClick={deleteToolFromStack}>
                      <Trash2 size={14} aria-hidden />
                      {t("Retirer de Ma stack", "Remove from My stack")}
                    </button>
                  </div>
                </details>}
                <button
                  ref={needDialogCloseRef}
                  type="button"
                  className="stack-need-dialog-close"
                  onClick={closeNeedDialog}
                  aria-label={t("Fermer", "Close") as string}
                >
                  <X size={18} aria-hidden />
                </button>
              </div>
            </div>

            <p className="stack-need-dialog-intro">
              {t(
                `Dans quelles collections voulez-vous classer ${needDialogTool.name} ?`,
                `Which collections should ${needDialogTool.name} belong to?`,
              )}
            </p>
            <p className="stack-need-dialog-cost-note">
              {t(
                "Plusieurs collections possibles · coût compté une seule fois.",
                "Multiple collections are possible · cost is counted only once.",
              )}
            </p>

            <fieldset className="stack-need-options">
              <legend className="sr-only">{t("Collections", "Collections")}</legend>
              {state.needs.map((need) => {
                const checked = draftNeedIds.includes(need.id);
                return (
                  <label key={need.id} className={`stack-need-option${checked ? " is-selected" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDraftNeed(need.id)}
                    />
                    <span className="stack-need-option-check" aria-hidden>{checked ? "✓" : ""}</span>
                    <span>{lang === "en" ? need.labelEn : need.labelFr}</span>
                  </label>
                );
              })}
            </fieldset>

            <div className="stack-need-dialog-foot">
              <span />
              <button
                type="button"
                className="stack-need-dialog-save"
                onClick={() => saveNeedAssignments(draftNeedIds, "stack")}
                disabled={draftNeedIds.length === 0}
              >
                {draftNeedIds.length > 0
                  ? needDialogMode === "add" ? t("Ajouter à Ma stack", "Add to My stack") : t("Enregistrer les collections", "Save collections")
                  : t("Choisir une collection", "Choose a collection")}
              </button>
            </div>
          </section>
        </div>
      )}

      {pickerBoardId && (
        <main ref={pickerDialogRef} className={`stack-tool-add-page${pickerBoardToneClass}`} aria-labelledby="stack-tool-picker-title">
          <header className="stack-tool-add-hero">
            <button type="button" className="stack-tool-add-back" onClick={closeToolPicker} aria-label={t(`Retour à ${pickerDestinationLabel}`, `Back to ${pickerDestinationLabel}`) as string}>
              <ArrowLeft size={20} aria-hidden />
            </button>
            {pickerBoard && (
              <div className="stack-tool-add-destination-card" aria-hidden="true">
                <span className="stack-tool-add-destination-copy">
                  <strong>{pickerDestinationLabel}</strong>
                  <small>{formatToolCount(pickerBoard.tools.length, lang)}</small>
                </span>
                <span className="stack-tool-add-destination-logos">
                  {pickerBoardPreviewTools.map((tool) => (
                    <span key={getToolKey(tool)}>
                      <ToolLogo tool={tool} size={34} className="stack-board-editorial-logo-mark" />
                    </span>
                  ))}
                  {pickerBoardPreviewTools.length === 0 && <span><Plus size={15} /></span>}
                </span>
              </div>
            )}
            <div className="stack-tool-add-heading">
              <h1 id="stack-tool-picker-title">{pickerPageTitle}</h1>
              {!pickerBoard && <p><strong>{t("ToolTrim suggère une collection, vous gardez le choix avant l’ajout.", "ToolTrim suggests a collection; you choose before adding.")}</strong></p>}
            </div>
            {renderEstimatedProfile("stack-tool-add-profile")}
            <button type="button" className="stack-tool-add-done" onClick={closeToolPicker}>
              {pickerReturnLabel}
              {pickerAddedStats.total > 0 && <span>{pickerAddedStats.total}</span>}
            </button>
          </header>

          <div className="stack-tool-add-search-row">
            {pickerBoard && (
              <div className="stack-tool-add-sticky-destination" aria-hidden="true">
                <span />
                <strong>{pickerDestinationLabel}</strong>
              </div>
            )}
            <label className="stack-tool-picker-search stack-tool-add-search">
              <Search size={18} aria-hidden />
              <input
                ref={pickerSearchRef}
                type="search"
                value={pickerQuery}
                onChange={(event) => setPickerQuery(event.target.value)}
                placeholder={t("Rechercher un outil", "Search for a tool") as string}
                aria-label={t("Rechercher un outil dans le catalogue", "Search the catalog") as string}
              />
              {pickerQuery && (
                <button type="button" onClick={() => setPickerQuery("")} aria-label={t("Effacer la recherche", "Clear search") as string}>
                  <X size={14} aria-hidden />
                </button>
              )}
            </label>
          </div>

          <section className="stack-tool-add-results" aria-label={t("Outils disponibles", "Available tools") as string}>
            <div className="stack-tool-add-results-head">
              <h2>{hasPickerQuery ? t("Résultats", "Results") : t("Suggestions pour vous", "Suggestions for you")}</h2>
              <span>{pickerCandidates.length} {t("outils", "tools")}</span>
            </div>

            {pickerCandidates.length > 0 ? (
              <div className="stack-tool-add-grid">
                {visiblePickerCandidates.map((tool) => {
                  const toolSlug = getToolKey(tool);
                  const wasAdded = pickerAddedToolSlugSet.has(toolSlug);
                  return (
                    <button
                      key={toolSlug}
                      type="button"
                      className={`stack-tool-add-card${wasAdded ? " is-added" : ""}`}
                      onClick={() => addToolFromPicker(tool)}
                      aria-pressed={wasAdded}
                      aria-label={wasAdded
                        ? t(`Retirer ${tool.name} de cette sélection`, `Remove ${tool.name} from this selection`) as string
                        : t(`Ajouter ${tool.name} à ma stack`, `Add ${tool.name} to my stack`) as string}
                    >
                      <span className="stack-tool-add-card-top">
                        <ToolLogo tool={tool} size={44} className="stack-tool-picker-logo" />
                        <span className={`stack-tool-add-state${wasAdded ? " is-added" : ""}`} aria-hidden>{wasAdded ? "✓" : <Plus size={17} />}</span>
                      </span>
                      <span className="stack-tool-add-card-copy">
                        <strong>{tool.name}</strong>
                        <small>{getCategoryLabel(tool)}</small>
                        <span>{wasAdded ? getPickerAddedSummary(tool) : getPickerNeedSuggestion(tool)}</span>
                      </span>
                    </button>
                  );
                })}
                {hasMorePickerCandidates && (
                  <button type="button" className="stack-tool-picker-more" onClick={() => setPickerResultLimit((limit) => limit + PICKER_RESULT_BATCH)}>
                    {t("Afficher plus d'outils", "Show more tools")}
                  </button>
                )}
              </div>
            ) : (
              <div className="stack-tool-picker-empty">
                <h3>{hasPickerQuery ? t("Aucun outil trouvé", "No tool found") : t("Tout est déjà dans votre stack", "Everything is already in your stack")}</h3>
                <p>{hasPickerQuery
                  ? t("Essayez un autre nom ou un usage.", "Try another name or use case.")
                  : t("Tous les outils disponibles sont déjà dans Ma stack.", "All available tools are already in My stack.")}</p>
                {hasPickerQuery && <button type="button" onClick={() => setPickerQuery("")}>{t("Effacer la recherche", "Clear search")}</button>}
              </div>
            )}
          </section>

          <footer className="stack-tool-add-footer">
            <span aria-live="polite">{getPickerSessionSummary()}</span>
            <button type="button" onClick={closeToolPicker}>
              {pickerReturnLabel}
              {pickerAddedStats.total > 0 && <span>{pickerAddedStats.total}</span>}
            </button>
          </footer>
        </main>
      )}
    </div>
  );
};

export default CartPage;
