import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ToolCardEditorial } from "@/components/ToolCardEditorial";
import ToolLogo from "@/components/ToolLogo";
import StackNeedsManagerDialog from "@/components/stack/StackNeedsManagerDialog";
import StackToolInspector from "@/components/stack/StackToolInspector";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import { useCategories, useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { scrollToTop } from "@/lib/scroll";
import { classifyToolForStack } from "@/lib/stackAutoClassification";

type StackBoard = {
  id: string;
  labelFr: string;
  labelEn: string;
  pattern: RegExp;
  source?: "suggested" | "custom";
};

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

type StackBundleLine = {
  id: string;
  parent: ToolSummary;
  tools: ToolSummary[];
  bundleTotal: number;
};

type StackPricingSummary = {
  total: number;
  bundleLines: StackBundleLine[];
  lineByToolKey: Map<string, StackBundleLine>;
};

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
const PICKER_FILTER_IDS: PickerFilterId[] = ["recommended", "objective", "plugins", "ai", "budget"];

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
    descriptionFr: "Outils utiles à cet objectif, regroupés depuis leur catégorie catalogue.",
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
    ? "A custom group built around one of your real needs."
    : "Un lot personnalisé construit autour de l'un de vos besoins réels.";
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

function getToolPrice(tool: ToolSummary | undefined) {
  return Math.max(0, Number(tool?.defaultMonthlyPrice) || 0);
}

function getToolLookupKeys(tool: ToolSummary) {
  return Array.from(new Set([tool.id, tool.slug, getToolKey(tool)].map(normalizeKey).filter(Boolean)));
}

function buildToolLookup(tools: ToolSummary[]) {
  const lookup = new Map<string, ToolSummary>();
  tools.forEach((tool) => {
    getToolLookupKeys(tool).forEach((key) => {
      if (!lookup.has(key)) lookup.set(key, tool);
    });
  });
  return lookup;
}

function isSameTool(a: ToolSummary, b: ToolSummary) {
  const bKeys = new Set(getToolLookupKeys(b));
  return getToolLookupKeys(a).some((key) => bKeys.has(key));
}

function getBundleParentTool(tool: ToolSummary, lookup: Map<string, ToolSummary>) {
  const parentKey = normalizeKey(tool.bundle_parent || "");
  if (!parentKey) return null;
  const parent = lookup.get(parentKey);
  if (!parent || isSameTool(tool, parent)) return null;
  return parent;
}

function computeStackPricing(selectedTools: ToolSummary[], allTools: ToolSummary[]): StackPricingSummary {
  const lookup = buildToolLookup(allTools);
  const processed = new Set<string>();
  const lineByToolKey = new Map<string, StackBundleLine>();
  const groups = new Map<string, { parent: ToolSummary; children: ToolSummary[] }>();

  selectedTools.forEach((tool) => {
    const parent = getBundleParentTool(tool, lookup);
    if (!parent) return;
    const parentKey = normalizeKey(getToolKey(parent));
    const group = groups.get(parentKey) || { parent, children: [] };
    group.children.push(tool);
    groups.set(parentKey, group);
  });

  const selectedParentFor = (parent: ToolSummary) => selectedTools.find((tool) => isSameTool(tool, parent));
  const groupCandidates = Array.from(groups.values())
    .map((group) => {
      const parentSelected = selectedParentFor(group.parent);
      const selectedGroupTools = Array.from(new Map(
        [parentSelected, ...group.children]
          .filter(Boolean)
          .map((tool) => [getToolKey(tool as ToolSummary), tool as ToolSummary]),
      ).values());
      const unit = selectedGroupTools.reduce((sum, tool) => sum + getToolPrice(tool), 0);
      const bundlePrice = getToolPrice(group.parent);
      return { ...group, parentSelected, selectedGroupTools, unit, bundlePrice };
    })
    .filter((group) => group.parentSelected || (group.children.length >= 2 && group.unit > 0))
    .filter((group) => group.bundlePrice > 0)
    .sort((a, b) => {
      const gainA = a.unit - a.bundlePrice;
      const gainB = b.unit - b.bundlePrice;
      return gainB - gainA || b.children.length - a.children.length;
    });

  const bundleLines: StackBundleLine[] = [];

  groupCandidates.forEach((group) => {
    const availableTools = group.selectedGroupTools.filter((tool) => !processed.has(normalizeKey(getToolKey(tool))));
    if (availableTools.length === 0) return;
    const line: StackBundleLine = {
      id: getToolKey(group.parent),
      parent: group.parent,
      tools: availableTools,
      bundleTotal: group.bundlePrice,
    };

    bundleLines.push(line);
    availableTools.forEach((tool) => {
      getToolLookupKeys(tool).forEach((key) => {
        processed.add(key);
        lineByToolKey.set(key, line);
      });
    });
  });

  const standaloneTotal = selectedTools.reduce((sum, tool) => {
    if (processed.has(normalizeKey(getToolKey(tool)))) return sum;
    return sum + getToolPrice(tool);
  }, 0);
  const bundleTotal = bundleLines.reduce((sum, line) => sum + line.bundleTotal, 0);

  return {
    total: standaloneTotal + bundleTotal,
    bundleLines,
    lineByToolKey,
  };
}

function getBundleLineForTool(summary: StackPricingSummary, tool: ToolSummary) {
  return getToolLookupKeys(tool)
    .map((key) => summary.lineByToolKey.get(key))
    .find(Boolean) || null;
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

function getBoardToolsHref(board: StackBoard, prefix: string) {
  const params = new URLSearchParams({ vertical: board.id });
  return `${prefix}/tools?${params.toString()}`;
}

function getPickerFilterLabel(filterId: PickerFilterId, board: StackBoard, lang: string) {
  const labels: Record<PickerFilterId, { fr: string; en: string }> = {
    recommended: { fr: "Suggestions", en: "Suggested" },
    objective: {
      fr: `Tout ${board.labelFr}`,
      en: `All ${board.labelEn}`,
    },
    plugins: { fr: "Plugins", en: "Plugins" },
    ai: { fr: "IA", en: "AI" },
    budget: { fr: "Budget léger", en: "Light budget" },
  };

  return lang === "en" ? labels[filterId].en : labels[filterId].fr;
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

function getSubdomainSectionClassName(group: StackSubdomainGroup) {
  return [
    "stack-subdomain-section",
    group.tools.length === 1 ? "stack-subdomain-section--compact" : "stack-subdomain-section--wide",
  ].join(" ");
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

function getToolRelation(tool: ToolSummary, allTools: ToolSummary[], lang: string) {
  const toolSlug = getToolKey(tool);
  const hostApp = tool.host_app
    ? allTools.find((candidate) => slugMatches(getToolKey(candidate), tool.host_app || ""))
    : null;

  if (hostApp) {
    return lang === "en" ? `Plugin for ${hostApp.name}` : `Plugin pour ${hostApp.name}`;
  }

  const bundleParent = tool.bundle_parent
    ? allTools.find((candidate) => getToolKey(candidate) === tool.bundle_parent || candidate.id === tool.bundle_parent)
    : null;

  if (bundleParent) {
    return lang === "en" ? `Included in ${bundleParent.name}` : `Inclus dans ${bundleParent.name}`;
  }

  const childPlugins = allTools.filter((candidate) =>
    candidate.tool_type === "plugin" &&
    !!candidate.host_app &&
    slugMatches(toolSlug, candidate.host_app)
  );

  if (childPlugins.length > 0) {
    if (lang === "en") return `${childPlugins.length} ${childPlugins.length === 1 ? "plugin" : "plugins"} available`;
    return `${childPlugins.length} plugin${childPlugins.length > 1 ? "s" : ""} associé${childPlugins.length > 1 ? "s" : ""}`;
  }

  return "";
}

const CartPage = () => {
  const { t, lang, prefix } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const {
    state,
    pinTool,
    unpinTool,
    assignToolNeeds,
    assignToolNeedsAutomatically,
    createNeed,
    renameNeed,
    deleteNeed,
    moveNeed,
  } = useStackPins();
  const [searchParams, setSearchParams] = useSearchParams();
  const inspectorNavigationDepth = typeof location.state?.stackToolInspectorDepth === "number"
    ? Math.max(0, location.state.stackToolInspectorDepth)
    : 0;
  const [pickerBoardId, setPickerBoardId] = useState<string | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerFilter, setPickerFilter] = useState<PickerFilterId>("recommended");
  const [pickerResultLimit, setPickerResultLimit] = useState(PICKER_RESULT_BATCH);
  const [needDialogToolSlug, setNeedDialogToolSlug] = useState<string | null>(null);
  const [draftNeedIds, setDraftNeedIds] = useState<string[]>([]);
  const [needsManagerOpen, setNeedsManagerOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDetailsElement | null>(null);
  const needDialogRef = useRef<HTMLElement | null>(null);
  const needDialogCloseRef = useRef<HTMLButtonElement | null>(null);
  const needDialogPreviousFocusRef = useRef<HTMLElement | null>(null);

  const categoryById = useMemo(() => new Map(categories.map((category: any) => [category.id, category])), [categories]);
  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);
  const pinnedToolSlugSet = useMemo(() => new Set(state.pinnedToolSlugs), [state.pinnedToolSlugs]);
  const stackEntryBySlug = useMemo(
    () => new Map(state.toolEntries.map((entry) => [entry.toolSlug, entry])),
    [state.toolEntries],
  );
  const selectedTools = useMemo(
    () => state.pinnedToolSlugs.map((slug) => toolBySlug.get(slug)).filter(Boolean) as ToolSummary[],
    [state.pinnedToolSlugs, toolBySlug],
  );
  const stackPricing = useMemo(() => computeStackPricing(selectedTools, tools), [selectedTools, tools]);
  const unassignedTools = selectedTools.filter((tool) => {
    const entry = stackEntryBySlug.get(getToolKey(tool));
    return !!entry && entry.needIds.length === 0 && entry.assignmentMode !== "pending";
  });
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
  const zoomObjectiveId = searchParams.get("objectif");
  const zoomedBoard = activeBoards.find((board) => board.id === zoomObjectiveId) || null;
  const quickToolSlug = searchParams.get("outil");
  const quickTool = zoomedBoard && quickToolSlug
    ? zoomedBoard.tools.find((tool) => getToolKey(tool) === quickToolSlug) || null
    : null;
  const pickerBoard = boards.find((board) => board.id === pickerBoardId) || null;
  const pickerIsCustom = pickerBoard?.source === "custom";

  function getCategoryLabel(tool: ToolSummary) {
    const category = categoryById.get(tool.categoryId) as any;
    return category
      ? cleanCategoryLabel(lang === "en" ? category.nameEn || category.name : category.name)
      : cleanCategoryLabel(tool.categoryId);
  }

  useEffect(() => {
    const assignments: Record<string, string[]> = {};

    state.toolEntries.forEach((entry) => {
      if (entry.needIds.length > 0 || entry.assignmentMode !== "pending") return;
      const tool = toolBySlug.get(entry.toolSlug);
      if (!tool) return;
      const classification = classifyToolForStack(tool);
      assignments[entry.toolSlug] = classification.confidence === "low" ? [] : classification.needIds;
      const addedAt = Date.parse(entry.addedAt);
      const addedRecently = Number.isFinite(addedAt) && Date.now() - addedAt < 60_000;
      if (addedRecently) {
        const classifiedNeedIds = new Set<string>(classification.confidence === "low" ? [] : classification.needIds);
        const needLabels = state.needs
          .filter((need) => classifiedNeedIds.has(need.id))
          .map((need) => t(need.labelFr, need.labelEn));
        toast.success(classifiedNeedIds.size > 0
          ? t(
            `${tool.name} rangé automatiquement dans ${needLabels.join(" et ")} · compté une seule fois.`,
            `${tool.name} automatically organized under ${needLabels.join(" and ")} · counted only once.`,
          ) as string
          : t(
            `${tool.name} ajouté à Ma stack · besoin à confirmer dans À ranger.`,
            `${tool.name} added to My stack · confirm its need under To organize.`,
          ) as string);
      }
    });

    if (Object.keys(assignments).length > 0) assignToolNeedsAutomatically(assignments);
  }, [assignToolNeedsAutomatically, state.needs, state.toolEntries, t, toolBySlug]);

  const zoomedSubdomains = useMemo(() => {
    if (!zoomedBoard) return [] as StackSubdomainGroup[];
    const groups = new Map<string, StackSubdomainGroup>();

    zoomedBoard.tools.forEach((tool) => {
      const subdomain = getSubdomainForBoardTool(zoomedBoard.id, tool, getCategoryLabel(tool));
      const existing = groups.get(subdomain.id) || { ...subdomain, tools: [] };
      existing.tools.push(tool);
      groups.set(subdomain.id, existing);
    });

    return Array.from(groups.values()).sort((a, b) => a.order - b.order || a.labelFr.localeCompare(b.labelFr));
  }, [categoryById, lang, zoomedBoard]);
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
  }, [boards, categoryById, lang, pickerBoard?.id]);

  const pickerCandidates = useMemo(() => {
    if (!pickerBoard) return [] as ToolSummary[];

    const candidates = tools
      .filter((tool) => !pinnedToolSlugSet.has(getToolKey(tool)))
      .map((tool) => {
        const categoryLabel = getCategoryLabel(tool);
        const boardScore = pickerIsCustom ? 1 : getToolPickerBoardScore(tool, pickerBoard, categoryLabel, pickerObjectiveContext);
        const searchScore = getPickerSearchScore(tool, categoryLabel, pickerQueryTokens);
        const subdomain = getObjectivePickerSubdomain(pickerBoard.id, tool, categoryLabel);
        return {
          categoryLabel,
          boardScore,
          score: (boardScore * (hasPickerQuery ? 2 : 1)) + searchScore + getToolPickerScore(tool),
          subdomainId: subdomain?.id,
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
  }, [categoryById, hasPickerQuery, lang, pickerBoard, pickerIsCustom, pickerObjectiveConfig, pickerObjectiveContext, pickerFilter, pickerQueryTokens, pinnedToolSlugSet, tools]);

  const visiblePickerCandidates = pickerCandidates.slice(0, pickerResultLimit);
  const hasMorePickerCandidates = pickerCandidates.length > visiblePickerCandidates.length;

  useEffect(() => {
    setPickerResultLimit(PICKER_RESULT_BATCH);
  }, [pickerBoardId, pickerFilter, pickerQuery]);

  useEffect(() => {
    if (!pickerBoardId) {
      setPickerQuery("");
      setPickerFilter("recommended");
      setPickerResultLimit(PICKER_RESULT_BATCH);
    }
  }, [pickerBoardId]);

  useEffect(() => {
    if (!pickerBoard) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPickerBoardId(null);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [pickerBoard]);

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

  function openToolPicker(boardId: string) {
    setPickerQuery("");
    setPickerFilter("recommended");
    setPickerResultLimit(PICKER_RESULT_BATCH);
    setPickerBoardId(boardId);
  }

  function addToolFromPicker(tool: ToolSummary) {
    pinTool(getToolKey(tool), pickerBoard ? [pickerBoard.id] : []);
    if (pickerBoard) {
      toast.success(t(
        `${tool.name} ajouté au besoin ${pickerBoard.labelFr} · compté une seule fois.`,
        `${tool.name} added to ${pickerBoard.labelEn} · counted only once.`,
      ) as string);
    }
  }

  function openNeedDialog(toolSlug: string) {
    needDialogPreviousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
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

  function saveNeedAssignments() {
    if (!needDialogToolSlug) return;
    const toolName = needDialogTool?.name || needDialogToolSlug;
    const selectedNeedLabels = state.needs
      .filter((need) => draftNeedIds.includes(need.id))
      .map((need) => t(need.labelFr, need.labelEn));
    assignToolNeeds(needDialogToolSlug, draftNeedIds);
    closeNeedDialog();
    toast.success(selectedNeedLabels.length > 0
      ? t(
        `${toolName} rangé dans ${selectedNeedLabels.join(" et ")} · compté une seule fois.`,
        `${toolName} organized under ${selectedNeedLabels.join(" and ")} · counted only once.`,
      ) as string
      : t(
        `${toolName} reste dans Ma stack, dans À ranger.`,
        `${toolName} remains in My stack, under To organize.`,
      ) as string);
  }

  function leaveToolUnassigned() {
    if (!needDialogToolSlug) return;
    const toolName = needDialogTool?.name || needDialogToolSlug;
    assignToolNeeds(needDialogToolSlug, []);
    closeNeedDialog();
    toast.success(t(
      `${toolName} reste dans Ma stack, dans À ranger.`,
      `${toolName} remains in My stack, under To organize.`,
    ) as string);
  }

  function deleteToolFromStack() {
    if (!needDialogToolSlug) return;
    const shouldCloseObjective = !!zoomedBoard && zoomedBoard.tools.some((tool) => getToolKey(tool) === needDialogToolSlug) && zoomedBoard.tools.length <= 1;
    unpinTool(needDialogToolSlug);
    closeNeedDialog();
    if (shouldCloseObjective) closeObjective();
  }

  function openObjective(boardId: string) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("objectif", boardId);
    setSearchParams(nextParams);
    if (typeof window !== "undefined") {
      scrollToTop("smooth");
    }
  }

  function closeObjective() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("objectif");
    nextParams.delete("outil");
    setSearchParams(nextParams);
  }

  function getToolInspectorHref(toolSlug: string) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("outil", toolSlug);
    return `${prefix}/ma-stack?${nextParams.toString()}`;
  }

  function closeToolInspector() {
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
    const shouldClose = !!zoomedBoard && zoomedBoard.tools.length <= 1;
    const entry = stackEntryBySlug.get(toolSlug);
    assignToolNeeds(toolSlug, (entry?.needIds || []).filter((needId) => needId !== zoomedBoard.id));
    if (shouldClose) closeObjective();
  }

  return (
    <div className={`stack-boards-page${zoomedBoard ? " stack-boards-page--zoomed" : ""}`}>
      {zoomedBoard ? (
        quickTool ? null : <section className="stack-objective-hero" aria-labelledby="stack-objective-title">
          <div className="stack-objective-hero-inner">
            <button type="button" className="stack-objective-hero-round" onClick={closeObjective} aria-label={t("Retour à Ma stack", "Back to My stack") as string} title={t("Retour à Ma stack", "Back to My stack") as string}>
              <ArrowLeft size={20} aria-hidden />
            </button>

            <div className="stack-objective-hero-copy">
              <h1 id="stack-objective-title">{t(zoomedBoard.labelFr, zoomedBoard.labelEn)}</h1>
              <p>
                <span>{t("Besoin", "Need")}</span>
                <span aria-hidden>·</span>
                {formatToolCount(zoomedBoard.tools.length, lang)}
                <span aria-hidden>·</span>
                {zoomedSubdomains.length} {t(zoomedSubdomains.length > 1 ? "sous-sections" : "sous-section", zoomedSubdomains.length > 1 ? "sections" : "section")}
              </p>
            </div>

            <div
              className="stack-objective-hero-cost"
              aria-label={t(`Coût total de Ma stack : ${formatMonthlyPrice(stackPricing.total, lang)}`, `Total My stack cost: ${formatMonthlyPrice(stackPricing.total, lang)}`) as string}
            >
              <span>{t("Coût de Ma stack", "My stack cost")}</span>
              <strong>{formatMonthlyPrice(stackPricing.total, lang)}</strong>
            </div>

            <button type="button" className="stack-objective-hero-add" onClick={() => openToolPicker(zoomedBoard.id)}>
              <Plus size={19} aria-hidden />
              <span>{t("Ajouter", "Add")}</span>
            </button>

            <details ref={workspaceMenuRef} className="stack-page-toolbar-menu stack-objective-hero-menu">
              <summary className="stack-objective-hero-round" aria-label={t("Plus d’options", "More options") as string}>
                <MoreHorizontal size={22} aria-hidden />
              </summary>
              <div className="stack-page-toolbar-popover">
                <button type="button" onClick={() => { workspaceMenuRef.current?.removeAttribute("open"); setNeedsManagerOpen(true); }}>
                  {t("Gérer tous les besoins", "Manage all needs")}
                </button>
              </div>
            </details>
          </div>
        </section>
      ) : (
        <section className="stack-page-toolbar stack-page-toolbar--overview">
          <div className="stack-page-toolbar-inner">
            <div className="stack-page-toolbar-copy">
              <h1>{t("Ma stack", "My stack")}</h1>
              <p>{selectedTools.length} {t("outils", "tools")} · {activeBoards.length} {t("besoins", "needs")}</p>
            </div>
            <div className="stack-page-toolbar-actions">
              {unassignedTools.length > 0 && (
                <button type="button" className="stack-page-toolbar-unassigned" onClick={() => document.getElementById("stack-unassigned-title")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                  {t("À ranger", "To organize")} · {unassignedTools.length}
                </button>
              )}
              <Link to={`${prefix}/tools`} className="stack-page-toolbar-icon stack-page-toolbar-icon--primary" aria-label={t("Ajouter un outil", "Add a tool") as string} title={t("Ajouter un outil", "Add a tool") as string}>
                <Plus size={19} aria-hidden />
              </Link>
              <details ref={workspaceMenuRef} className="stack-page-toolbar-menu">
                <summary className="stack-page-toolbar-icon" aria-label={t("Plus d’options", "More options") as string}>
                  <MoreHorizontal size={20} aria-hidden />
                </summary>
                <div className="stack-page-toolbar-popover">
                  <button type="button" onClick={() => { workspaceMenuRef.current?.removeAttribute("open"); setNeedsManagerOpen(true); }}>
                    {t("Gérer les besoins", "Manage needs")}
                  </button>
                </div>
              </details>
            </div>
          </div>
        </section>
      )}

      {zoomedBoard ? (
        <main className={`stack-objective-detail${quickTool ? " stack-objective-detail--tool-page" : ""}`} aria-label={t(`Détail ${zoomedBoard.labelFr}`, `${zoomedBoard.labelEn} detail`) as string}>
          {!quickTool && <div className="stack-objective-browser">
            <div className="stack-role-section-grid">
            {zoomedSubdomains.map((group) => (
              <section key={group.id} className="stack-role-section" aria-labelledby={`stack-role-${group.id}`}>
                <div className="stack-role-section-head">
                  <div>
                    <h2 id={`stack-role-${group.id}`}>{t(group.labelFr, group.labelEn)}</h2>
                    <p>{t(group.descriptionFr, group.descriptionEn)}</p>
                  </div>
                  <span>{formatToolCount(group.tools.length, lang)}</span>
                </div>
                <div className="stack-role-tool-grid" role="list">
                  {group.tools.map((tool) => {
                    const toolSlug = getToolKey(tool);
                    return (
                      <article key={toolSlug} className="stack-role-tool-card" role="listitem">
                        <ToolCardEditorial
                          tool={tool}
                          prefix={prefix}
                          t={t}
                          lang={lang}
                          categoryLabel={getCategoryLabel(tool)}
                          variant="compact"
                          showPin={false}
                          to={getToolInspectorHref(toolSlug)}
                          linkState={{ stackToolInspectorDepth: 1 }}
                          selected={quickToolSlug === toolSlug}
                        />
                        <button
                          type="button"
                          className="stack-role-tool-edit"
                          onClick={() => openNeedDialog(toolSlug)}
                          aria-label={t(`Modifier ${tool.name}`, `Edit ${tool.name}`) as string}
                          title={t("Modifier", "Edit") as string}
                        >
                          <Pencil size={13} aria-hidden />
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
            </div>
          </div>}

          {quickTool && (
            <section className="stack-tool-stage" aria-label={t(`Fiche ${quickTool.name}`, `${quickTool.name} profile`) as string}>
              <StackToolInspector
                tool={quickTool}
                needLabel={t(zoomedBoard.labelFr, zoomedBoard.labelEn)}
                sectionLabel={quickToolGroup ? t(quickToolGroup.labelFr, quickToolGroup.labelEn) : t("Outils du besoin", "Need tools")}
                categoryLabel={getCategoryLabel(quickTool)}
                typeLabel={getToolTypeLabel(quickTool, lang)}
                priceLabel={quickTool.defaultMonthlyPrice > 0 ? formatMonthlyPrice(quickTool.defaultMonthlyPrice, lang) : t("Gratuit", "Free")}
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
                t={t}
              />
            </section>
          )}
        </main>
      ) : (
        <main className="stack-board-grid" aria-label={t("Vue d'ensemble de ma stack", "My stack overview") as string}>
          {selectedTools.length === 0 && (
            <section className="stack-empty-overview">
              <span>{t("Aucun outil sélectionné", "No selected tools")}</span>
              <h2>{t("Votre vue d'ensemble est vide", "Your overview is empty")}</h2>
              <p>
                {t(
                  "Ajoutez un premier outil depuis le catalogue. Il apparaîtra ici pour commencer à composer votre stack.",
                  "Add a first tool from the catalog. It will appear here so you can start composing your stack.",
                )}
              </p>
              <Link to={`${prefix}/tools`} className="cart-primary-link">{t("Ajouter un premier outil", "Add a first tool")}</Link>
            </section>
          )}
          {activeBoards.map((board) => {
            const visibleToolCount = 3;
            const visibleTools = board.tools.slice(0, visibleToolCount);
            const overflowCount = Math.max(0, board.tools.length - visibleTools.length);
            return (
              <section
                key={board.id}
                className={`stack-board-card stack-board-card--${board.id}${board.source === "custom" ? " stack-board-card--custom" : ""}`}
                aria-label={t(board.labelFr, board.labelEn) as string}
              >
                <button
                  type="button"
                  className="stack-board-card-open"
                  onClick={() => openObjective(board.id)}
                  aria-label={t(`Ouvrir ${board.labelFr}`, `Open ${board.labelEn}`) as string}
                />
                <div className="stack-board-preview stack-board-editorial-cover">
                  <span className="stack-board-preview-copy">
                    <span className="stack-board-editorial-heading">
                      <span className="stack-board-editorial-title">{getBoardDisplayLabel(board, lang)}</span>
                      <span className="stack-board-title-count">{formatToolCount(board.tools.length, lang)}</span>
                    </span>
                    <span className="stack-board-editorial-description">{getBoardOverviewCopy(board, lang)}</span>
                  </span>
                  <div className="stack-board-editorial-logos" role="group" aria-label={t(`Outils ${board.labelFr}`, `${board.labelEn} tools`) as string}>
                    {visibleTools.map((tool) => (
                      <span key={getToolKey(tool)} className="stack-board-editorial-logo" role="listitem">
                        <ToolLogo tool={tool} size={54} className="stack-board-editorial-logo-mark" />
                      </span>
                    ))}
                    {visibleTools.length === 0 && <span className="stack-board-editorial-empty"><Plus size={22} aria-hidden /></span>}
                    {overflowCount > 0 && (
                      <details className="stack-board-logo-more">
                        <summary role="button" className="stack-board-overflow" aria-label={t(`Afficher ${overflowCount} outils supplémentaires`, `Show ${overflowCount} more tools`) as string}>
                          +{overflowCount}
                        </summary>
                        <span className="stack-board-logo-popover" role="list">
                          {board.tools.slice(visibleToolCount).map((tool) => (
                            <span key={getToolKey(tool)} className="stack-board-logo-popover-item" role="listitem" title={tool.name}>
                              <ToolLogo tool={tool} size={42} className="stack-board-editorial-logo-mark" />
                            </span>
                          ))}
                        </span>
                      </details>
                    )}
                  </div>
                </div>

                <div className="stack-board-footer">
                  <button type="button" className="stack-board-explore" onClick={() => openObjective(board.id)}>
                    {t("Explorer", "Explore")}
                  </button>
                  <button
                    type="button"
                    className="stack-board-add-link"
                    onClick={() => openToolPicker(board.id)}
                    aria-label={getObjectiveToolsCta(board, lang)}
                    title={getObjectiveToolsCta(board, lang)}
                  >
                    <Plus size={15} aria-hidden />
                    <span>{t("Ajouter", "Add")}</span>
                  </button>
                </div>
              </section>
            );
          })}
          {unassignedTools.length > 0 && (
            <section id="stack-unassigned-title" className="stack-board-card stack-board-card--unassigned" aria-label={t("À ranger", "To organize") as string}>
              <button
                type="button"
                className="stack-board-card-open"
                onClick={() => openNeedDialog(getToolKey(unassignedTools[0]))}
                aria-label={t("Examiner les outils à ranger", "Review tools to organize") as string}
              />
              <div className="stack-board-preview stack-board-editorial-cover">
                <span className="stack-board-preview-copy">
                  <span className="stack-board-editorial-heading">
                    <span className="stack-board-editorial-title">{t("À ranger", "To organize")}</span>
                    <span className="stack-board-title-count">{formatToolCount(unassignedTools.length, lang)}</span>
                  </span>
                  <span className="stack-board-editorial-description">
                    {t(
                      "Quelques outils demandent simplement votre confirmation.",
                      "A few tools simply need your confirmation.",
                    )}
                  </span>
                </span>
                <div className="stack-board-editorial-logos" role="group" aria-label={t("Outils à confirmer", "Tools to confirm") as string}>
                  {unassignedTools.slice(0, 3).map((tool) => (
                    <span key={getToolKey(tool)} className="stack-board-editorial-logo">
                      <ToolLogo tool={tool} size={54} className="stack-board-editorial-logo-mark" />
                    </span>
                  ))}
                  {unassignedTools.length > 3 && (
                    <details className="stack-board-logo-more">
                      <summary role="button" className="stack-board-overflow" aria-label={t(`Afficher ${unassignedTools.length - 3} outils supplémentaires`, `Show ${unassignedTools.length - 3} more tools`) as string}>
                        +{unassignedTools.length - 3}
                      </summary>
                      <span className="stack-board-logo-popover" role="list">
                        {unassignedTools.slice(3).map((tool) => (
                          <span key={getToolKey(tool)} className="stack-board-logo-popover-item" role="listitem" title={tool.name}>
                            <ToolLogo tool={tool} size={42} className="stack-board-editorial-logo-mark" />
                          </span>
                        ))}
                      </span>
                    </details>
                  )}
                </div>
              </div>
              <div className="stack-board-footer">
                <button type="button" className="stack-board-explore" onClick={() => openNeedDialog(getToolKey(unassignedTools[0]))}>
                  {t("Ranger", "Organize")}
                </button>
                <span>{t("À confirmer", "To confirm")}</span>
              </div>
            </section>
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
                <span>{t("Ranger l'outil", "Organize tool")}</span>
                <h2 id="stack-need-dialog-title">{needDialogTool.name}</h2>
              </div>
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

            <p className="stack-need-dialog-intro">
              {t(
                "À quels besoins cet outil répond-il ? Vous pouvez en choisir plusieurs.",
                "Which needs does this tool cover? You can choose several.",
              )}
            </p>

            <fieldset className="stack-need-options">
              <legend className="sr-only">{t("Besoins", "Needs")}</legend>
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
              <button type="button" className="stack-need-dialog-delete" onClick={deleteToolFromStack}>
                <Trash2 size={14} aria-hidden />
                {t("Supprimer de Ma stack", "Remove from My stack")}
              </button>
              <button type="button" className="stack-need-dialog-later" onClick={leaveToolUnassigned}>
                {t("Laisser à ranger", "Organize later")}
              </button>
              <button
                type="button"
                className="stack-need-dialog-save"
                onClick={saveNeedAssignments}
                disabled={draftNeedIds.length === 0}
              >
                {draftNeedIds.length > 0
                  ? t("Enregistrer le rangement", "Save organization")
                  : t("Choisir un besoin", "Choose a need")}
              </button>
            </div>
          </section>
        </div>
      )}

      <StackNeedsManagerDialog
        isOpen={needsManagerOpen}
        lang={lang}
        needs={state.needs}
        onClose={() => setNeedsManagerOpen(false)}
        onCreate={createNeed}
        onRename={renameNeed}
        onDelete={deleteNeed}
        onMove={moveNeed}
        t={t}
      />

      {pickerBoard && (
        <div className="stack-tool-picker-backdrop" onClick={() => setPickerBoardId(null)}>
          <aside
            className="stack-tool-picker"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stack-tool-picker-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="stack-tool-picker-head">
              <div>
                <h2 id="stack-tool-picker-title">{getObjectiveToolsCta({ ...pickerBoard, tools: [] }, lang)}</h2>
              </div>
              <button
                type="button"
                className="stack-tool-picker-close"
                onClick={() => setPickerBoardId(null)}
                aria-label={t("Fermer", "Close") as string}
              >
                <X size={18} aria-hidden />
              </button>
            </div>

            <div className="stack-tool-picker-controls">
              <label className="stack-tool-picker-search">
                <Search size={16} aria-hidden />
                <input
                  type="search"
                  value={pickerQuery}
                  onChange={(event) => setPickerQuery(event.target.value)}
                  placeholder={t("Chercher un outil précis", "Search a specific tool") as string}
                  aria-label={t("Rechercher un outil dans le catalogue sans quitter ma stack", "Search the catalog without leaving my stack") as string}
                />
                {pickerQuery && (
                  <button
                    type="button"
                    onClick={() => setPickerQuery("")}
                    aria-label={t("Effacer la recherche", "Clear search") as string}
                  >
                    <X size={14} aria-hidden />
                  </button>
                )}
              </label>

            </div>

            {pickerCandidates.length > 0 ? (
              <div className="stack-tool-picker-list">
                {visiblePickerCandidates.map((tool) => {
                  const toolSlug = getToolKey(tool);
                  return (
                    <article key={toolSlug} className="stack-tool-picker-card">
                      <ToolLogo tool={tool} size={34} className="stack-tool-picker-logo" />
                      <div className="stack-tool-picker-card-copy">
                        <h3>{tool.name}</h3>
                      </div>
                      <div className="stack-tool-picker-card-actions">
                        <button
                          type="button"
                          className="stack-tool-picker-add"
                          onClick={() => addToolFromPicker(tool)}
                          aria-label={t(`Ajouter ${tool.name} à ma stack`, `Add ${tool.name} to my stack`) as string}
                        >
                          <Plus size={15} aria-hidden />
                          {t("Ajouter", "Add")}
                        </button>
                      </div>
                    </article>
                  );
                })}
                {hasMorePickerCandidates && (
                  <button
                    type="button"
                    className="stack-tool-picker-more"
                    onClick={() => setPickerResultLimit((limit) => limit + PICKER_RESULT_BATCH)}
                  >
                    {t("Afficher plus d'outils", "Show more tools")}
                  </button>
                )}
              </div>
            ) : (
              <div className="stack-tool-picker-empty">
                <h3>{hasPickerQuery ? t("Aucun outil trouvé", "No tool found") : t("Tout est déjà dans votre stack", "Everything is already in your stack")}</h3>
                <p>
                  {hasPickerQuery
                    ? t(
                      "Essayez un autre nom, un usage ou un plugin. La recherche reste dans cette fenêtre.",
                      "Try another name, use case, or plugin. Search stays inside this panel.",
                    )
                    : t(
                      "Aucun autre outil évident à proposer pour cet objectif avec les données actuelles.",
                      "There are no other obvious tools to suggest for this objective with the current data.",
                    )}
                </p>
              </div>
            )}

          </aside>
        </div>
      )}
    </div>
  );
};

export default CartPage;
