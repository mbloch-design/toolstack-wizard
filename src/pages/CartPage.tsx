import { useMemo, type KeyboardEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import ToolLogo from "@/components/ToolLogo";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import { useCategories, useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { scrollToTop } from "@/lib/scroll";

type StackBoard = {
  id: string;
  labelFr: string;
  labelEn: string;
  pattern: RegExp;
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

type CreativeStackSubdomain = StackSubdomain & {
  toolIds?: string[];
  signalKeys?: string[];
};

const STACK_BOARDS: StackBoard[] = [
  {
    id: "ia",
    labelFr: "IA",
    labelEn: "AI",
    pattern: /\bia\b|ai|gpt|llm|claude|chatgpt|midjourney|generation|generative|assistant|prompt/i,
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

function formatSubdomainCount(count: number, lang: string) {
  if (lang === "en") return `${count} ${count === 1 ? "area" : "areas"}`;
  return `${count} domaine${count > 1 ? "s" : ""}`;
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

function getSubdomainSectionClassName(group: StackSubdomainGroup) {
  return [
    "stack-subdomain-section",
    group.tools.length === 1 ? "stack-subdomain-section--compact" : "stack-subdomain-section--wide",
  ].join(" ");
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
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const { state, unpinTool } = useStackPins();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryById = useMemo(() => new Map(categories.map((category: any) => [category.id, category])), [categories]);
  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);
  const selectedTools = state.pinnedToolSlugs.map((slug) => toolBySlug.get(slug)).filter(Boolean) as ToolSummary[];
  const stackPricing = useMemo(() => computeStackPricing(selectedTools, tools), [selectedTools, tools]);

  const boards = useMemo(() => {
    const grouped = new Map<string, ToolSummary[]>();
    STACK_BOARDS.forEach((board) => grouped.set(board.id, []));

    selectedTools.forEach((tool) => {
      const category = categoryById.get(tool.categoryId);
      const categoryLabel = category
        ? cleanCategoryLabel(lang === "en" ? category.nameEn || category.name : category.name)
        : "";
      const board = getBoardForTool(tool, categoryLabel);
      grouped.get(board.id)?.push(tool);
    });

    return STACK_BOARDS.map((board) => ({
      ...board,
      tools: grouped.get(board.id) || [],
    }));
  }, [categoryById, lang, selectedTools]);
  const activeBoards = boards.filter((board) => board.tools.length > 0) as StackObjective[];
  const zoomObjectiveId = searchParams.get("objectif");
  const zoomedBoard = activeBoards.find((board) => board.id === zoomObjectiveId) || null;
  const zoomedPricing = useMemo(
    () => computeStackPricing(zoomedBoard?.tools || [], tools),
    [tools, zoomedBoard],
  );

  function getCategoryLabel(tool: ToolSummary) {
    const category = categoryById.get(tool.categoryId) as any;
    return category
      ? cleanCategoryLabel(lang === "en" ? category.nameEn || category.name : category.name)
      : cleanCategoryLabel(tool.categoryId);
  }

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
    setSearchParams(nextParams);
  }

  function handleBoardKeyDown(event: KeyboardEvent<HTMLElement>, boardId: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openObjective(boardId);
  }

  function removeToolFromZoom(toolSlug: string) {
    const shouldClose = !!zoomedBoard && zoomedBoard.tools.length <= 1;
    unpinTool(toolSlug);
    if (shouldClose) closeObjective();
  }

  return (
    <div className={`stack-boards-page${zoomedBoard ? " stack-boards-page--zoomed" : ""}`}>
      {zoomedBoard ? (
        <section className={`tt-page-hero tt-page-hero--banner stack-objective-page-hero stack-board-card--${zoomedBoard.id}`}>
          <div className="tt-page-hero-inner">
            <div className="tt-page-hero-band">
              <img src="/hero/stacks-gradient.png" alt="" className="tt-page-hero-art" aria-hidden="true" />
              <div className="tt-page-hero-content">
                <div className="stack-objective-hero-topline">
                  <Breadcrumb
                    items={[
                      { label: t("Ma stack", "My stack") as string, href: `${prefix}/ma-stack` },
                      { label: t(zoomedBoard.labelFr, zoomedBoard.labelEn) as string },
                    ]}
                  />
                  <button type="button" className="stack-objective-hero-back" onClick={closeObjective}>
                    <ArrowLeft size={16} aria-hidden />
                    {t("Retour", "Back")}
                  </button>
                </div>
                <h1 className="tt-page-hero-title">{t(zoomedBoard.labelFr, zoomedBoard.labelEn)}</h1>
                <p className="tt-page-hero-desc">
                  {t(
                    "Vue des outils retenus pour cet objectif, regroupés par usage concret.",
                    "A view of the tools saved for this objective, grouped by practical use.",
                  )}
                </p>
                <div className="stack-objective-hero-actions">
                  <Link to={`${prefix}/tools`} className="cart-primary-link stack-objective-hero-action">
                    {getObjectiveToolsCta(zoomedBoard, lang)}
                  </Link>
                </div>

                <div className="stack-objective-hero-bottom">
                  <dl className="stack-objective-hero-facts" aria-label={t("Résumé de cet objectif", "Objective summary") as string}>
                    <div>
                      <dt>{t("Outils", "Tools")}</dt>
                      <dd>{zoomedBoard.tools.length}</dd>
                    </div>
                    <div>
                      <dt>{t("Domaines", "Areas")}</dt>
                      <dd>{zoomedSubdomains.length}</dd>
                    </div>
                    <div>
                      <dt>{zoomedPricing.bundleLines.length > 0 ? t("Budget avec suites", "Budget with suites") : t("Budget estimé", "Estimated budget")}</dt>
                      <dd>{formatMonthlyPrice(zoomedPricing.total, lang)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="tt-page-hero tt-page-hero--banner tt-page-hero--ma-stack">
          <div className="tt-page-hero-inner">
            <div className="tt-page-hero-band">
              <img src="/hero/stacks-gradient.png" alt="" className="tt-page-hero-art" aria-hidden="true" />
              <div className="tt-page-hero-content">
                <div className="tt-page-hero-breadcrumb">
                  <Breadcrumb items={[{ label: t("Ma stack", "My stack") }]} />
                </div>
                <h1 className="tt-page-hero-title">{t("Ma stack", "My stack")}</h1>
                <p className="tt-page-hero-desc">
                  {t(
                    "Visualisez les outils mis de côté, comprenez leur rôle et préparez une stack plus claire.",
                    "See the tools you saved, understand their role and prepare a clearer stack.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {!zoomedBoard && selectedTools.length > 0 && (
        <section className="stack-overview-strip" aria-label={t("Résumé de ma stack", "My stack summary") as string}>
          <dl className="stack-overview-facts">
            <div>
              <dt>{t("Outils", "Tools")}</dt>
              <dd>{selectedTools.length}</dd>
            </div>
            <div>
              <dt>{stackPricing.bundleLines.length > 0 ? t("Budget avec suites", "Budget with bundles") : t("Budget estimé", "Estimated budget")}</dt>
              <dd>{formatMonthlyPrice(stackPricing.total, lang)}</dd>
            </div>
            {stackPricing.bundleLines.length > 0 && (
              <div>
                <dt>{stackPricing.bundleLines.length === 1 ? t("Suite", "Bundle") : t("Suites", "Bundles")}</dt>
                <dd>{stackPricing.bundleLines.length}</dd>
              </div>
            )}
          </dl>
          <Link to={`${prefix}/tools`} className="cart-primary-link stack-overview-action">
            {t("Ajouter des outils", "Add tools")}
          </Link>
        </section>
      )}

      {zoomedBoard ? (
        <main className="stack-objective-detail" aria-label={t(`Détail ${zoomedBoard.labelFr}`, `${zoomedBoard.labelEn} detail`) as string}>
          {zoomedPricing.bundleLines.length > 0 && (
            <section className="stack-bundle-board-grid" aria-label={t("Suites de cette stack", "Suites in this stack") as string}>
              {zoomedPricing.bundleLines.map((line) => {
                const parentSelected = line.tools.some((tool) => isSameTool(tool, line.parent));
                const visibleBundleTools = line.tools
                  .filter((tool) => !isSameTool(tool, line.parent))
                  .slice(0, 4);
                const representedTools = visibleBundleTools.length + (parentSelected ? 1 : 0);
                const overflowCount = Math.max(0, line.tools.length - representedTools);

                return (
                  <article key={line.id} className="stack-board-card stack-bundle-board-card">
                    <div
                      className="stack-bundle-preview"
                      role="list"
                      aria-label={t(`Outils regroupés dans ${line.parent.name}`, `Tools grouped in ${line.parent.name}`) as string}
                    >
                      <span className="stack-bundle-preview-logo stack-bundle-preview-logo--main" role="listitem">
                        <ToolLogo tool={line.parent} size={64} className="stack-board-logo-mark" />
                      </span>

                      {visibleBundleTools.map((tool, index) => (
                        <span
                          key={getToolKey(tool)}
                          className={`stack-bundle-preview-logo stack-bundle-preview-logo--${index + 1}`}
                          role="listitem"
                        >
                          <ToolLogo tool={tool} size={38} className="stack-board-logo-mark" />
                        </span>
                      ))}

                      {overflowCount > 0 && <span className="stack-board-overflow stack-bundle-overflow">+{overflowCount}</span>}
                    </div>

                    <div className="stack-board-footer stack-bundle-footer">
                      <div>
                        <h2>{line.parent.name}</h2>
                        <p>
                          {lang === "en"
                            ? `${formatToolCount(line.tools.length, lang)} grouped`
                            : `${formatToolCount(line.tools.length, lang)} regroupé${line.tools.length > 1 ? "s" : ""}`}
                        </p>
                      </div>
                      <span>{formatMonthlyPrice(line.bundleTotal, lang)}</span>
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          <div className="stack-subdomain-grid">
            {zoomedSubdomains.map((group) => (
              <section key={group.id} className={getSubdomainSectionClassName(group)}>
                <div className="stack-subdomain-heading">
                  <span>{formatToolCount(group.tools.length, lang)}</span>
                  <h3>{t(group.labelFr, group.labelEn)}</h3>
                  <p>{t(group.descriptionFr, group.descriptionEn)}</p>
                </div>

                <div className="stack-detail-tool-grid">
                  {group.tools.map((tool) => {
                    const toolSlug = getToolKey(tool);
                    const needs = getToolNeedLabels(tool, lang);
                    const relation = getToolRelation(tool, tools, lang);
                    const description = lang === "en" ? tool.shortDescriptionEn || tool.shortDescription : tool.shortDescription;
                    const bundleLine = getBundleLineForTool(zoomedPricing, tool);
                    const countedInBundle = !!bundleLine && !isSameTool(tool, bundleLine.parent);
                    const detailLine = getToolTypeLabel(tool, lang);
                    const contextLine = countedInBundle && bundleLine
                      ? t(`Inclus dans ${bundleLine.parent.name}`, `Included in ${bundleLine.parent.name}`)
                      : relation || needs.slice(0, 2).join(" · ");
                    const showStandalonePrice = getToolPrice(tool) > 0 && !countedInBundle;

                    return (
                      <article key={toolSlug} className="stack-detail-tool-card">
                        <div className="stack-detail-tool-head">
                          <ToolLogo tool={tool} size={36} className="stack-detail-tool-logo" />
                          <div className="stack-detail-tool-title">
                            <h4>{tool.name}</h4>
                            {detailLine && <p>{detailLine}</p>}
                          </div>
                          <div className="stack-detail-tool-actions" aria-label={t(`Actions pour ${tool.name}`, `Actions for ${tool.name}`) as string}>
                            <button
                              type="button"
                              className="stack-detail-tool-remove"
                              onClick={() => removeToolFromZoom(toolSlug)}
                              aria-label={t(`Retirer ${tool.name} de ma stack`, `Remove ${tool.name} from my stack`) as string}
                              title={t("Retirer de ma stack", "Remove from my stack") as string}
                            >
                              <X size={15} aria-hidden />
                            </button>
                          </div>
                        </div>

                        {description && <p className="stack-detail-tool-desc">{description}</p>}

                        <div className="stack-detail-tool-footer">
                          <div className="stack-detail-tool-footnote">
                            {contextLine && (
                              <span className={countedInBundle ? "stack-detail-tool-footer-bundle" : undefined}>
                                {contextLine}
                              </span>
                            )}
                            {showStandalonePrice && <strong>{formatMonthlyPrice(tool.defaultMonthlyPrice, lang)}</strong>}
                          </div>
                          <Link
                            className="stack-detail-tool-link"
                            to={`${prefix}/tool/${toolSlug}`}
                            aria-label={t(`Voir la fiche ${tool.name}`, `Open ${tool.name} page`) as string}
                            title={t("Voir la fiche", "Open page") as string}
                          >
                            <span>{t("Voir la fiche", "Open page")}</span>
                            <ArrowRight size={13} aria-hidden />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </main>
      ) : (
        <main className="stack-board-grid" aria-label={t("Vue d'ensemble de ma stack", "My stack overview") as string}>
          {activeBoards.length === 0 && (
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
            const visibleToolCount = board.tools.length > 6 ? 5 : 6;
            const visibleTools = board.tools.slice(0, visibleToolCount);
            const overflowCount = Math.max(0, board.tools.length - visibleTools.length);
            const subdomainCount = new Set(board.tools.map((tool) => getSubdomainForBoardTool(board.id, tool, getCategoryLabel(tool)).id)).size;
            return (
              <section
                key={board.id}
                className={`stack-board-card stack-board-card--${board.id} stack-board-card--openable`}
                role="button"
                tabIndex={0}
                onClick={() => openObjective(board.id)}
                onKeyDown={(event) => handleBoardKeyDown(event, board.id)}
                aria-label={t(`Voir le détail ${board.labelFr}`, `View ${board.labelEn} detail`) as string}
              >
                <div
                  className="stack-board-preview"
                  role="list"
                  aria-label={t(`Outils ${board.labelFr}`, `${board.labelEn} tools`) as string}
                >
                  {visibleTools.map((tool, index) => (
                    <span
                      key={getToolKey(tool)}
                      className={`stack-board-logo stack-board-logo--${index + 1}`}
                      data-tool-slug={getToolKey(tool)}
                      role="listitem"
                    >
                      <ToolLogo tool={tool} size={42} className="stack-board-logo-mark" />
                      <button
                        type="button"
                        className="stack-board-remove"
                        onClick={(event) => {
                          event.stopPropagation();
                          unpinTool(getToolKey(tool));
                        }}
                        aria-label={t(`Retirer ${tool.name} de ma stack`, `Remove ${tool.name} from my stack`) as string}
                        title={t("Retirer de ma stack", "Remove from my stack") as string}
                      >
                        <X size={13} aria-hidden />
                      </button>
                    </span>
                  ))}
                  {overflowCount > 0 && <span className="stack-board-overflow stack-board-overflow--preview">+{overflowCount}</span>}
                </div>

                <div className="stack-board-footer">
                  <div className="stack-board-footer-copy">
                    <h2>{t(board.labelFr, board.labelEn)}</h2>
                    <p>
                      {formatSubdomainCount(subdomainCount, lang)}
                      <span aria-hidden="true"> · </span>
                      {formatToolCount(board.tools.length, lang)}
                    </p>
                  </div>
                  <Link
                    to={getBoardToolsHref(board, prefix)}
                    className="stack-board-add-link"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                    aria-label={getObjectiveToolsCta(board, lang)}
                    title={getObjectiveToolsCta(board, lang)}
                  >
                    <Plus size={14} aria-hidden />
                    {t("Ajouter", "Add")}
                  </Link>
                </div>
              </section>
            );
          })}
          {activeBoards.length > 0 && (
            <section className="stack-board-card stack-board-card--create">
              <Link
                to={`${prefix}/tools`}
                className="stack-board-create-preview"
                aria-label={t("Ajouter des outils à ma stack", "Add tools to my stack") as string}
              >
                <span className="stack-board-create-tile stack-board-create-tile--main" />
                <span className="stack-board-create-tile stack-board-create-tile--side-top" />
                <span className="stack-board-create-tile stack-board-create-tile--side-bottom" />
                <span className="stack-board-create-button">
                  <Plus size={18} aria-hidden />
                  {t("Ajouter", "Add")}
                </span>
              </Link>

              <div className="stack-board-footer">
                <div>
                  <h2>{t("Ajouter des outils", "Add tools")}</h2>
                </div>
                <span>{t("Catalogue", "Catalog")}</span>
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  );
};

export default CartPage;
