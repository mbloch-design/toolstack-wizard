import type { Tool } from "@/types/diagnostic";
import {
  getToolRelations,
  relationTargets,
  relationToHost,
} from "@/lib/toolRelations";

export type CreativeOutputId =
  | "brand-visual"
  | "ui-product"
  | "photo"
  | "video"
  | "motion"
  | "illustration"
  | "three-d"
  | "spaces"
  | "audio"
  | "social-content";

export type CreativeQuestionKind = "core" | "workflow" | "ecosystem";

export interface CreativeOutputDefinition {
  id: CreativeOutputId;
  labelFr: string;
  labelEn: string;
  detailFr: string;
  detailEn: string;
  verticals: string[];
  primaryNeeds: string[];
}

export interface CreativeQuestion {
  id: string;
  kind: CreativeQuestionKind;
  labelFr: string;
  labelEn: string;
  questionFr: string;
  questionEn: string;
  hintFr: string;
  hintEn: string;
  needKeys: string[];
  explicitToolIds: string[];
  allowedToolTypes: Tool["tool_type"][];
  priority: number;
  sourceToolId?: string;
}

export interface RankedCreativeTool {
  tool: Tool;
  score: number;
  reasonFr: string;
  reasonEn: string;
}

export interface CreativeQuestionPlanContext {
  outputIds: readonly string[];
  selectedTools: Tool[];
  toolUsageMap?: Record<string, string[]>;
  coveredIds: ReadonlySet<string>;
  skippedIds: ReadonlySet<string>;
  currentId?: string;
  maxQuestions?: number;
}

export interface CreativeQuestionPlan {
  questions: CreativeQuestion[];
  deferred: CreativeQuestion[];
  scores: Record<string, number>;
}

export type CreativeWorkflowStageId = "produce" | "accelerate" | "review" | "publish" | "secure";

export const DEFAULT_CREATIVE_QUESTION_BUDGET = 6;

const SECONDARY_CREATIVE_QUESTION_IDS = new Set([
  "creative-brief-input",
  "creative-assets",
  "creative-review-delivery",
]);

export const CREATIVE_OUTPUTS: CreativeOutputDefinition[] = [
  {
    id: "brand-visual",
    labelFr: "Identités, visuels ou mises en page",
    labelEn: "Brand identities, visuals or layouts",
    detailFr: "Logo, branding, print, présentations, packaging",
    detailEn: "Logo, branding, print, presentations, packaging",
    verticals: ["graphiste-da", "creative"],
    primaryNeeds: ["visual-identity", "layout-publishing"],
  },
  {
    id: "ui-product",
    labelFr: "Interfaces et prototypes",
    labelEn: "Interfaces and prototypes",
    detailFr: "Sites, applications, design systems, handoff",
    detailEn: "Websites, apps, design systems, handoff",
    verticals: ["ux-ui", "product-manager"],
    primaryNeeds: ["ui-design", "prototype-handoff"],
  },
  {
    id: "photo",
    labelFr: "Photos et retouches",
    labelEn: "Photography and retouching",
    detailFr: "Développement RAW, retouche, sélection et livraison",
    detailEn: "RAW development, retouching, selection and delivery",
    verticals: ["photographe"],
    primaryNeeds: ["photo-development", "photo-retouch"],
  },
  {
    id: "video",
    labelFr: "Vidéos et contenus filmés",
    labelEn: "Video and filmed content",
    detailFr: "Montage, étalonnage, sous-titres et livraison",
    detailEn: "Editing, grading, subtitles and delivery",
    verticals: ["motion-video", "createur-contenu"],
    primaryNeeds: ["video-edit", "video-finish"],
  },
  {
    id: "motion",
    labelFr: "Animations et motion design",
    labelEn: "Animation and motion design",
    detailFr: "Compositing, effets, animation 2D/3D",
    detailEn: "Compositing, effects, 2D/3D animation",
    verticals: ["motion-video"],
    primaryNeeds: ["motion-compositing", "video-finish"],
  },
  {
    id: "illustration",
    labelFr: "Illustrations",
    labelEn: "Illustration",
    detailFr: "Dessin, vectoriel, concept art et peinture numérique",
    detailEn: "Drawing, vectors, concept art and digital painting",
    verticals: ["illustrateur", "graphiste-da"],
    primaryNeeds: ["illustration-drawing"],
  },
  {
    id: "three-d",
    labelFr: "Images, objets ou animations 3D",
    labelEn: "3D images, objects or animation",
    detailFr: "Modélisation, sculpture, animation et rendu",
    detailEn: "Modeling, sculpting, animation and rendering",
    verticals: ["motion-video", "scenographe", "architecte-bim"],
    primaryNeeds: ["three-d-creation", "three-d-render"],
  },
  {
    id: "spaces",
    labelFr: "Espaces, scènes ou architecture",
    labelEn: "Spaces, scenes or architecture",
    detailFr: "Plans, scénographie, intérieur, BIM et visualisation",
    detailEn: "Plans, scenography, interiors, BIM and visualization",
    verticals: ["scenographe", "architecte-bim", "interior-design"],
    primaryNeeds: ["space-design", "space-documentation", "three-d-render"],
  },
  {
    id: "audio",
    labelFr: "Audio, musique ou podcasts",
    labelEn: "Audio, music or podcasts",
    detailFr: "Enregistrement, montage, mixage et diffusion",
    detailEn: "Recording, editing, mixing and publishing",
    verticals: ["podcasteur", "motion-video"],
    primaryNeeds: ["audio-production", "audio-publishing"],
  },
  {
    id: "social-content",
    labelFr: "Contenus et formats sociaux",
    labelEn: "Content and social formats",
    detailFr: "Posts, carrousels, présentations et déclinaisons",
    detailEn: "Posts, carousels, presentations and variations",
    verticals: ["createur-contenu", "community-manager"],
    primaryNeeds: ["social-visuals", "video-edit", "social-publishing"],
  },
];

const BASE_QUESTIONS: CreativeQuestion[] = [
  {
    id: "creative-brief-input",
    kind: "workflow",
    labelFr: "Brief et références",
    labelEn: "Brief and references",
    questionFr: "Comment centralises-tu le brief, les références et les fichiers reçus ?",
    questionEn: "How do you centralize briefs, references and incoming files?",
    hintFr: "On cherche ici ton point d’entrée, pas un outil de création.",
    hintEn: "We are looking for your starting point, not a creation tool.",
    needKeys: ["brief", "moodboard", "references", "documentation", "storage", "notes"],
    explicitToolIds: ["milanote", "notion", "google-drive", "dropbox", "pure-ref", "figma"],
    allowedToolTypes: ["metier", "gestion", "satellite", "core"],
    priority: 95,
  },
  {
    id: "visual-identity",
    kind: "core",
    labelFr: "Identité et création visuelle",
    labelEn: "Identity and visual creation",
    questionFr: "Comment construis-tu aujourd’hui tes identités et visuels ?",
    questionEn: "How do you currently build identities and visuals?",
    hintFr: "Vectoriel, composition, branding et déclinaisons.",
    hintEn: "Vector work, composition, branding and variations.",
    needKeys: ["design-visuel", "illustration-vectorielle", "logos", "branding", "creation"],
    explicitToolIds: ["adobe-illustrator", "affinity-designer", "canva", "figma", "coreldraw", "adobe-photoshop", "adobe-express"],
    allowedToolTypes: ["metier", "core", "bundle"],
    priority: 100,
  },
  {
    id: "layout-publishing",
    kind: "core",
    labelFr: "Mise en page et publication",
    labelEn: "Layout and publishing",
    questionFr: "Comment réalises-tu tes documents, éditions ou supports imprimés ?",
    questionEn: "How do you create documents, publications or print materials?",
    hintFr: "Brochures, magazines, présentations, packaging ou print.",
    hintEn: "Brochures, magazines, presentations, packaging or print.",
    needKeys: ["mise-en-page", "print", "presentations", "packaging", "publication"],
    explicitToolIds: ["indesign", "affinity-publisher", "canva", "quarkxpress", "adobe-illustrator", "figma"],
    allowedToolTypes: ["metier", "core", "bundle"],
    priority: 90,
  },
  {
    id: "ui-design",
    kind: "core",
    labelFr: "Conception d’interfaces",
    labelEn: "Interface design",
    questionFr: "Comment conçois-tu tes interfaces et design systems aujourd’hui ?",
    questionEn: "How do you currently design interfaces and design systems?",
    hintFr: "Aucun outil n’est présumé : Figma, Sketch, Penpot ou autre.",
    hintEn: "No tool is assumed: Figma, Sketch, Penpot or another one.",
    needKeys: ["ui-design", "design-system", "wireframing", "ui-components"],
    explicitToolIds: ["figma", "sketch", "penpot", "adobe-xd", "framer", "balsamiq"],
    allowedToolTypes: ["metier", "core"],
    priority: 100,
  },
  {
    id: "prototype-handoff",
    kind: "workflow",
    labelFr: "Prototype et handoff",
    labelEn: "Prototype and handoff",
    questionFr: "Comment prototypes-tu et transmets-tu le travail pour intégration ?",
    questionEn: "How do you prototype and hand work over for implementation?",
    hintFr: "Ton outil principal peut aussi couvrir cette étape.",
    hintEn: "Your main tool may also cover this step.",
    needKeys: ["prototyping", "prototypage", "handoff-dev", "prototype", "design-system"],
    explicitToolIds: ["figma", "sketch", "penpot", "zeplin", "protopie", "framer", "figma-anima"],
    allowedToolTypes: ["metier", "plugin", "satellite"],
    priority: 85,
  },
  {
    id: "photo-development",
    kind: "core",
    labelFr: "Développement photo",
    labelEn: "Photo development",
    questionFr: "Comment développes-tu, classes-tu et ajustes-tu tes photos ?",
    questionEn: "How do you develop, organize and adjust photos?",
    hintFr: "RAW, catalogues, couleurs, presets et sélection.",
    hintEn: "RAW, catalogs, color, presets and selection.",
    needKeys: ["retouche-photo", "photo", "raw", "color-grading", "catalogue-photo"],
    explicitToolIds: ["adobe-lightroom", "capture-one", "darktable", "dxo-photolab", "luminar-neo"],
    allowedToolTypes: ["metier", "core"],
    priority: 100,
  },
  {
    id: "photo-retouch",
    kind: "core",
    labelFr: "Retouche et finition photo",
    labelEn: "Photo retouching and finishing",
    questionFr: "Comment réalises-tu les retouches et finitions avancées ?",
    questionEn: "How do you handle advanced retouching and finishing?",
    hintFr: "Montage, détourage, peau, nettoyage ou amélioration IA.",
    hintEn: "Compositing, cutouts, skin, cleanup or AI enhancement.",
    needKeys: ["retouche-photo", "compositing", "detourage", "photo-enhancement"],
    explicitToolIds: ["adobe-photoshop", "affinity-photo", "photopea", "pixelmator-pro", "topaz-photo-ai", "remove-bg"],
    allowedToolTypes: ["metier", "ia", "satellite"],
    priority: 90,
  },
  {
    id: "video-edit",
    kind: "core",
    labelFr: "Montage vidéo",
    labelEn: "Video editing",
    questionFr: "Comment montes-tu principalement tes vidéos aujourd’hui ?",
    questionEn: "How do you currently edit your videos?",
    hintFr: "Montage, rythme, son, formats courts ou longs.",
    hintEn: "Editing, pacing, sound, short or long-form formats.",
    needKeys: ["montage-video", "video-editing", "creator-workflow"],
    explicitToolIds: ["adobe-premiere-pro", "davinci-resolve", "final-cut-pro", "capcut", "descript"],
    allowedToolTypes: ["metier", "core"],
    priority: 100,
  },
  {
    id: "video-finish",
    kind: "workflow",
    labelFr: "Finition vidéo",
    labelEn: "Video finishing",
    questionFr: "Comment gères-tu l’image, le son, les sous-titres et les exports après le montage ?",
    questionEn: "How do you handle picture, sound, subtitles and exports after editing?",
    hintFr: "Étalonnage, nettoyage audio, upscale, transcription et exports.",
    hintEn: "Grading, audio cleanup, upscaling, transcription and exports.",
    needKeys: ["color-grading", "effets-visuels", "transcription", "generation-video", "audio-cleanup"],
    explicitToolIds: ["davinci-resolve", "topaz-video-ai", "descript", "adobe-enhance-speech", "capcut", "runway"],
    allowedToolTypes: ["metier", "ia", "satellite", "plugin"],
    priority: 78,
  },
  {
    id: "motion-compositing",
    kind: "core",
    labelFr: "Motion et compositing",
    labelEn: "Motion and compositing",
    questionFr: "Comment animes-tu, composes-tu ou crées-tu tes effets ?",
    questionEn: "How do you animate, composite or create effects?",
    hintFr: "Motion design, VFX, titrage et animation.",
    hintEn: "Motion design, VFX, titles and animation.",
    needKeys: ["motion-design", "animation", "animation-2d-3d", "effets-visuels"],
    explicitToolIds: ["adobe-after-effects", "cavalry", "rive", "fusion", "apple-motion", "nuke"],
    allowedToolTypes: ["metier", "core"],
    priority: 100,
  },
  {
    id: "illustration-drawing",
    kind: "core",
    labelFr: "Illustration et dessin",
    labelEn: "Illustration and drawing",
    questionFr: "Comment dessines-tu ou construis-tu tes illustrations ?",
    questionEn: "How do you draw or build illustrations?",
    hintFr: "Vectoriel, bitmap, concept art ou dessin sur tablette.",
    hintEn: "Vector, bitmap, concept art or tablet drawing.",
    needKeys: ["illustration-vectorielle", "illustration", "concept-art", "digital-painting"],
    explicitToolIds: ["procreate", "adobe-illustrator", "affinity-designer", "clip-studio-paint", "krita", "adobe-fresco"],
    allowedToolTypes: ["metier", "core"],
    priority: 100,
  },
  {
    id: "three-d-creation",
    kind: "core",
    labelFr: "Création 3D",
    labelEn: "3D creation",
    questionFr: "Comment modélises-tu, sculptes-tu ou animes-tu en 3D ?",
    questionEn: "How do you model, sculpt or animate in 3D?",
    hintFr: "Blender n’est qu’une option parmi C4D, Maya, Houdini, 3ds Max…",
    hintEn: "Blender is only one option among C4D, Maya, Houdini, 3ds Max…",
    needKeys: ["modelisation-3d", "3d", "sculpture-3d", "animation-2d-3d"],
    explicitToolIds: ["blender", "cinema-4d", "maya", "houdini", "3ds-max", "zbrush", "spline"],
    allowedToolTypes: ["metier", "core"],
    priority: 100,
  },
  {
    id: "three-d-render",
    kind: "workflow",
    labelFr: "Rendu 3D",
    labelEn: "3D rendering",
    questionFr: "Comment produis-tu tes rendus finaux ?",
    questionEn: "How do you produce your final renders?",
    hintFr: "Le moteur peut être intégré, inclus dans une suite ou ajouté séparément.",
    hintEn: "The renderer may be built in, bundled or added separately.",
    needKeys: ["rendu-3d", "render-engine", "rendering"],
    explicitToolIds: ["enscape", "twinmotion", "lumion", "d5-render", "v-ray", "redshift", "octane-render", "corona-renderer", "arnold", "blender"],
    allowedToolTypes: ["metier", "plugin", "satellite"],
    priority: 88,
  },
  {
    id: "space-design",
    kind: "core",
    labelFr: "Conception d’espaces",
    labelEn: "Spatial design",
    questionFr: "Comment conçois-tu tes plans, espaces ou scènes ?",
    questionEn: "How do you design plans, spaces or scenes?",
    hintFr: "Architecture, intérieur, scénographie, BIM ou visualisation.",
    hintEn: "Architecture, interiors, scenography, BIM or visualization.",
    needKeys: ["architecture", "bim", "interior-design", "scenography", "modelisation-3d"],
    explicitToolIds: ["sketchup-pro", "revit", "autocad", "archicad", "vectorworks", "rhino", "cinema-4d", "blender"],
    allowedToolTypes: ["metier", "core"],
    priority: 100,
  },
  {
    id: "space-documentation",
    kind: "workflow",
    labelFr: "Plans et dossier technique",
    labelEn: "Plans and technical documentation",
    questionFr: "Comment produis-tu les plans, coupes, cotations et dossiers à livrer ?",
    questionEn: "How do you produce plans, sections, dimensions and delivery documents?",
    hintFr: "La modélisation et le dossier livré ne reposent pas toujours sur le même outil.",
    hintEn: "Modeling and the delivered documentation do not always rely on the same tool.",
    needKeys: ["plans-2d", "plans-techniques", "dessin-technique", "documentation", "document-delivery", "pdf-review", "presentation-client"],
    explicitToolIds: ["layout-sketchup", "autocad", "autocad-lt", "revit", "archicad", "vectorworks", "adobe-acrobat"],
    allowedToolTypes: ["metier", "core", "satellite"],
    priority: 90,
  },
  {
    id: "audio-production",
    kind: "core",
    labelFr: "Production audio",
    labelEn: "Audio production",
    questionFr: "Comment enregistres-tu, montes-tu ou mixes-tu l’audio ?",
    questionEn: "How do you record, edit or mix audio?",
    hintFr: "Podcast, musique, voix, sound design ou postproduction.",
    hintEn: "Podcast, music, voice, sound design or post-production.",
    needKeys: ["montage-audio", "enregistrement-multipistes", "audio", "sound-design", "mixing"],
    explicitToolIds: ["pro-tools", "logic-pro", "adobe-audition", "ableton-live", "reaper", "audacity", "descript"],
    allowedToolTypes: ["metier", "core"],
    priority: 100,
  },
  {
    id: "audio-publishing",
    kind: "workflow",
    labelFr: "Hébergement et diffusion audio",
    labelEn: "Audio hosting and publishing",
    questionFr: "Comment héberges-tu, diffuses-tu et suis-tu tes épisodes ou créations audio ?",
    questionEn: "How do you host, distribute and track your episodes or audio work?",
    hintFr: "Hébergeur, flux RSS, diffusion multi-plateformes et statistiques.",
    hintEn: "Hosting, RSS feeds, multi-platform distribution and analytics.",
    needKeys: ["hebergement-audio", "distribution-podcast", "analytics-podcast", "creator-workflow"],
    explicitToolIds: ["anchor-spotify", "buzzsprout", "ausha", "acast"],
    allowedToolTypes: ["satellite", "specialise", "metier"],
    priority: 84,
  },
  {
    id: "social-visuals",
    kind: "core",
    labelFr: "Formats sociaux",
    labelEn: "Social formats",
    questionFr: "Comment produis-tu et déclines-tu tes contenus sociaux ?",
    questionEn: "How do you produce and adapt social content?",
    hintFr: "Posts, carrousels, stories, miniatures et présentations.",
    hintEn: "Posts, carousels, stories, thumbnails and presentations.",
    needKeys: ["design-visuel", "social-media", "presentations", "templates", "creator-workflow"],
    explicitToolIds: ["canva", "adobe-express", "figma", "adobe-photoshop", "capcut"],
    allowedToolTypes: ["metier", "core"],
    priority: 100,
  },
  {
    id: "social-publishing",
    kind: "workflow",
    labelFr: "Planification et publication sociale",
    labelEn: "Social scheduling and publishing",
    questionFr: "Comment planifies-tu, publies-tu et mesures-tu tes contenus sociaux ?",
    questionEn: "How do you schedule, publish and measure social content?",
    hintFr: "Calendrier, publication multi-plateformes, validation et analytics.",
    hintEn: "Calendar, multi-platform publishing, approval and analytics.",
    needKeys: ["planification-posts", "multi-plateformes", "analytics-reseaux", "social-media-management", "reporting-client"],
    explicitToolIds: ["buffer", "metricool", "later", "hootsuite", "sprout-social", "planoly"],
    allowedToolTypes: ["satellite", "specialise", "gestion"],
    priority: 84,
  },
  {
    id: "creative-ai",
    kind: "workflow",
    labelFr: "IA créative",
    labelEn: "Creative AI",
    questionFr: "Quelles IA interviennent réellement dans ta production ?",
    questionEn: "Which AI tools are genuinely part of your production?",
    hintFr: "Exploration, génération, retouche, vidéo, son ou accélération.",
    hintEn: "Exploration, generation, retouching, video, audio or acceleration.",
    needKeys: ["generation-image", "generation-video", "concept-art", "ai-general", "creator-workflow"],
    explicitToolIds: ["midjourney", "firefly", "krea-ai", "flux", "runway", "ideogram", "leonardo-ai", "stable-diffusion"],
    allowedToolTypes: ["ia", "satellite", "metier"],
    priority: 66,
  },
  {
    id: "creative-assets",
    kind: "workflow",
    labelFr: "Ressources et assets",
    labelEn: "Resources and assets",
    questionFr: "Où trouves-tu les templates, polices, images, sons ou modèles que tu réutilises ?",
    questionEn: "Where do you source reusable templates, fonts, images, audio or models?",
    hintFr: "On inclut les bibliothèques gratuites, payantes et les assets achetés au cas par cas.",
    hintEn: "This includes free and paid libraries and one-off asset purchases.",
    needKeys: ["templates", "creative-licensing", "fonts", "assets", "stock", "creator-workflow"],
    explicitToolIds: ["envato-elements", "adobe-stock", "motion-array", "icons8", "noun-project", "fontbase", "rightfont"],
    allowedToolTypes: ["satellite", "plugin", "metier"],
    priority: 58,
  },
  {
    id: "creative-review-delivery",
    kind: "workflow",
    labelFr: "Validation, livraison et archives",
    labelEn: "Review, delivery and archives",
    questionFr: "Comment fais-tu valider, livrer puis archiver ton travail ?",
    questionEn: "How do you get work reviewed, delivered and then archived?",
    hintFr: "Commentaires, versions, galeries, transferts, sauvegarde et présentation client.",
    hintEn: "Comments, versions, galleries, transfers, backup and client presentation.",
    needKeys: ["collaboration", "review", "delivery", "presentation-client", "storage", "backup", "archive", "versioning"],
    explicitToolIds: ["frame-io", "pixieset", "google-drive", "dropbox", "onedrive", "wetransfer", "loom", "tella", "adobe-acrobat"],
    allowedToolTypes: ["satellite", "gestion", "metier"],
    priority: 62,
  },
];

const COMMERCIAL_CONTAINER_TOOL_IDS = new Set([
  "adobe-cc",
  "adobe-creative-cloud",
  "maxon-one",
  "microsoft-365",
  "canva-pro",
]);

export function isCreativeCommercialContainer(tool: Tool) {
  return tool.tool_type === "bundle" || COMMERCIAL_CONTAINER_TOOL_IDS.has(tool.id);
}

const ECOSYSTEM_OVERRIDES: Record<string, string[]> = {
  figma: ["figma-iconify", "figma-tokens", "figma-stark", "figma-anima", "zeplin", "figma-slides"],
  sketch: ["zeplin", "invision", "abstract", "craft"],
  canva: ["canva-templates", "envato-elements", "icons8", "noun-project"],
  "adobe-after-effects": ["ae-bodymovin", "lottiefiles", "ae-animation-composer", "motion-bro", "ae-overlord", "ae-duik", "ae-gifgun", "ae-red-giant", "trapcode"],
  "after-effects": ["ae-bodymovin", "lottiefiles", "ae-animation-composer", "motion-bro", "ae-overlord", "ae-duik", "ae-gifgun", "ae-red-giant", "trapcode"],
  "adobe-premiere-pro": ["frame-io", "topaz-video-ai", "descript", "adobe-enhance-speech", "red-giant-universe", "pluraleyes"],
  "premiere-pro": ["frame-io", "topaz-video-ai", "descript", "adobe-enhance-speech", "red-giant-universe", "pluraleyes"],
  "adobe-photoshop": ["remove-bg", "topaz-photo-ai", "nik-collection", "dynamic-mockups", "envato-elements"],
  "adobe-lightroom": ["lightroom-mobile", "luminar-neo", "nik-collection", "pixieset"],
  "capture-one": ["nik-collection", "pixieset", "topaz-photo-ai"],
  blender: [
    "quixel-megascans",
    "auto-rig-pro",
    "hard-ops-boxcutter",
    "blenderkit",
    "cycles",
    "adobe-substance-3d",
    "substance-3d-designer",
    "substance-3d-painter",
    "octane-render",
  ],
  "cinema-4d": ["redshift", "octane-render", "adobe-after-effects"],
  "3ds-max": ["v-ray", "corona-renderer", "arnold"],
  maya: ["arnold", "redshift", "v-ray"],
  houdini: ["redshift", "arnold", "octane-render"],
  "sketchup-pro": [
    "layout-sketchup", "fredo6-bundle", "joint-push-pull", "fredocorner", "curviloft",
    "profile-builder-3", "skatter", "transmutr", "solid-inspector2",
    "eneroth-face-creator", "1001bit-tools", "flextools", "cleanup3",
    "enscape", "twinmotion", "lumion", "d5-render", "v-ray",
  ],
  revit: ["enscape", "twinmotion", "lumion", "d5-render"],
};

const HOST_ALIASES: Record<string, string[]> = {
  "adobe-after-effects": ["after-effects"],
  "adobe-premiere-pro": ["premiere-pro"],
  "cinema-4d": ["c4d"],
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toolNeedSet(tool: Tool) {
  return new Set((tool.functional_needs || []).map(normalize));
}

function outputDefinitions(outputIds: readonly string[]) {
  const selected = new Set(outputIds);
  return CREATIVE_OUTPUTS.filter((output) => selected.has(output.id));
}

export function buildCreativeQuestions(
  outputIds: readonly string[],
  selectedTools: Tool[] = [],
  allTools: Tool[] = selectedTools
): CreativeQuestion[] {
  const outputs = outputDefinitions(outputIds);
  const orderedPrimaryNeeds = outputs.flatMap((output) => output.primaryNeeds);
  const primaryNeedIds = new Set(orderedPrimaryNeeds);
  const primaryNeedOrder = new Map(orderedPrimaryNeeds.map((id, index) => [id, index]));
  const core = BASE_QUESTIONS.filter((question) => primaryNeedIds.has(question.id));
  const shared = BASE_QUESTIONS.filter((question) =>
    ["creative-brief-input", "creative-assets", "creative-review-delivery"].includes(question.id)
  );
  const ecosystem = buildEcosystemQuestions(selectedTools, allTools);
  const seen = new Set<string>();

  return [...core, ...ecosystem, ...shared]
    .filter((question) => {
      if (seen.has(question.id)) return false;
      seen.add(question.id);
      return true;
    })
    .sort((a, b) => {
      const priorityDifference = b.priority - a.priority;
      if (priorityDifference !== 0) return priorityDifference;
      return (primaryNeedOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER)
        - (primaryNeedOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER);
    });
}

export function getCreativeOutput(id: string | undefined) {
  return CREATIVE_OUTPUTS.find((output) => output.id === id);
}

export function rankToolsForCreativeQuestion(
  question: CreativeQuestion,
  tools: Tool[],
  outputIds: readonly string[],
  selectedToolIds: ReadonlySet<string> = new Set()
): RankedCreativeTool[] {
  const outputs = outputDefinitions(outputIds);
  const outputVerticals = new Set(outputs.flatMap((output) => output.verticals).map(normalize));
  const needKeys = new Set(question.needKeys.map(normalize));
  const explicitRanks = new Map(question.explicitToolIds.map((id, index) => [normalize(id), index]));

  return tools
    .map((tool): RankedCreativeTool | null => {
      const normalizedId = normalize(tool.id);
      const explicitRank = explicitRanks.get(normalizedId);
      if (isCreativeCommercialContainer(tool)) {
        return null;
      }
      if (question.kind === "ecosystem" && (tool.id === question.sourceToolId || explicitRank == null)) {
        return null;
      }
      const toolNeeds = toolNeedSet(tool);
      const sharedNeeds = [...needKeys].filter((need) => toolNeeds.has(need));
      const sharedVerticals = (tool.verticals || []).map(normalize).filter((vertical) => outputVerticals.has(vertical));
      const allowedType = question.allowedToolTypes.includes(tool.tool_type);
      if (explicitRank == null && !allowedType) return null;
      if (explicitRank == null && sharedNeeds.length === 0) return null;

      let score = 0;
      const reasonsFr: string[] = [];
      const reasonsEn: string[] = [];

      if (explicitRank != null) {
        score += 140 - explicitRank * 4;
        reasonsFr.push("correspond à ce besoin");
        reasonsEn.push("matches this need");
      }
      if (sharedNeeds.length > 0) {
        score += Math.min(72, sharedNeeds.length * 24);
        reasonsFr.push(`couvre ${sharedNeeds.slice(0, 2).join(", ")}`);
        reasonsEn.push(`covers ${sharedNeeds.slice(0, 2).join(", ")}`);
      }
      if (sharedVerticals.length > 0) {
        score += Math.min(30, sharedVerticals.length * 15);
      }
      if (allowedType) score += 10;
      if (selectedToolIds.has(tool.id)) {
        score += 36;
        reasonsFr.unshift("déjà dans ta stack");
        reasonsEn.unshift("already in your stack");
      }

      if (question.kind === "ecosystem" && question.sourceToolId) {
        const sourceTool = tools.find((candidate) => candidate.id === question.sourceToolId);
        if (sourceTool) {
          const inboundRelation = relationToHost(tool, sourceTool);
          const outboundRelation = getToolRelations(sourceTool).find(
            (relation) => normalize(relation.targetToolId) === normalizedId
          );
          const relation = inboundRelation || outboundRelation;
          if (relation?.kind === "plugin_of") {
            reasonsFr.unshift(`plugin de ${sourceTool.name}`);
            reasonsEn.unshift(`${sourceTool.name} plugin`);
          } else if (relation?.kind === "included_in") {
            reasonsFr.unshift(`inclus avec ${sourceTool.name}`);
            reasonsEn.unshift(`included with ${sourceTool.name}`);
          } else {
            reasonsFr.unshift(`complément de ${sourceTool.name}`);
            reasonsEn.unshift(`complements ${sourceTool.name}`);
          }
        }
      }

      if (score < 34) return null;
      return {
        tool,
        score,
        reasonFr: reasonsFr.slice(0, 2).join(" · ") || "pertinent pour ce besoin",
        reasonEn: reasonsEn.slice(0, 2).join(" · ") || "relevant to this need",
      };
    })
    .filter((item): item is RankedCreativeTool => item !== null)
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name));
}

export function getEcosystemToolIds(tool: Tool, allTools: Tool[]) {
  const ids = new Set<string>(ECOSYSTEM_OVERRIDES[tool.id] || []);
  const hosts = new Set([tool.id, ...(HOST_ALIASES[tool.id] || [])].map(normalize));

  relationTargets(tool, ["complements", "integrates_with", "included_in"])
    .forEach((targetToolId) => ids.add(targetToolId));

  allTools.forEach((candidate) => {
    if (candidate.id === tool.id) return;
    const host = candidate.host_app ? normalize(candidate.host_app) : "";
    const bundle = candidate.bundle_parent ? normalize(candidate.bundle_parent) : "";
    if (
      relationToHost(candidate, tool) ||
      (host && hosts.has(host)) ||
      (bundle && hosts.has(bundle))
    ) {
      ids.add(candidate.id);
    }
  });

  return [...ids].filter((id) => id !== tool.id);
}

export function buildEcosystemQuestions(selectedTools: Tool[], allTools: Tool[] = selectedTools): CreativeQuestion[] {
  return selectedTools
    .filter(
      (tool) =>
        ["metier", "core"].includes(tool.tool_type) &&
        !isCreativeCommercialContainer(tool)
    )
    .map((tool) => {
      const ecosystemIds = getEcosystemToolIds(tool, allTools);
      if (ecosystemIds.length === 0) return null;
      return {
        id: `ecosystem-${tool.id}`,
        kind: "ecosystem" as const,
        labelFr: `Autour de ${tool.name}`,
        labelEn: `Around ${tool.name}`,
        questionFr: `Qu’est-ce qui complète ou accélère ton travail dans ${tool.name} ?`,
        questionEn: `What complements or speeds up your work in ${tool.name}?`,
        hintFr: "Plugins, moteurs, extensions, bibliothèques ou services réellement utilisés.",
        hintEn: "Plugins, renderers, extensions, libraries or services you actually use.",
        needKeys: [...new Set(allTools.filter((candidate) => ecosystemIds.includes(candidate.id)).flatMap((candidate) => candidate.functional_needs || []))],
        explicitToolIds: ecosystemIds,
        allowedToolTypes: ["plugin", "ia", "satellite", "metier"] as Tool["tool_type"][],
        priority: 82,
        sourceToolId: tool.id,
      };
    })
    .filter((question): question is CreativeQuestion => question !== null);
}

export function chooseNextCreativeQuestion(
  questions: CreativeQuestion[],
  coveredIds: ReadonlySet<string>,
  skippedIds: ReadonlySet<string>,
  currentId?: string
) {
  const candidates = questions.filter((question) => !coveredIds.has(question.id) && !skippedIds.has(question.id));
  if (!currentId) return candidates[0] || null;
  const currentIndex = questions.findIndex((question) => question.id === currentId);
  const after = candidates.find((question) => questions.indexOf(question) > currentIndex);
  return after || candidates[0] || null;
}

function scoreCreativeQuestion(
  question: CreativeQuestion,
  context: CreativeQuestionPlanContext
) {
  const selectedIds = new Set(context.selectedTools.map((tool) => tool.id));
  const declaredUsageCount = context.selectedTools.filter((tool) =>
    (context.toolUsageMap?.[tool.id] || []).includes(question.id)
  ).length;
  const matchingSelectedTools = rankToolsForCreativeQuestion(
    question,
    context.selectedTools,
    context.outputIds,
    selectedIds
  );

  let score = question.priority;
  if (question.kind === "core") score += 34;
  if (question.kind === "workflow") score += 16;
  if (question.kind === "ecosystem") {
    score += question.sourceToolId && selectedIds.has(question.sourceToolId) ? 30 : -80;
  }
  if (matchingSelectedTools.length > 0 && declaredUsageCount === 0) score += 14;
  if (declaredUsageCount > 0) score -= 42;
  if (SECONDARY_CREATIVE_QUESTION_IDS.has(question.id)) score -= 22;
  if (question.priority < 70) score -= 12;

  const settledCount = context.coveredIds.size + context.skippedIds.size;
  score -= Math.max(0, settledCount - 2) * (question.kind === "core" ? 2 : 6);
  return score;
}

/**
 * Keeps the user's confirmed history stable, then chooses the next unanswered
 * areas by business importance, remaining uncertainty, ecosystem context and
 * fatigue. Questions outside the budget remain available for final review.
 */
export function planCreativeQuestions(
  questions: CreativeQuestion[],
  context: CreativeQuestionPlanContext
): CreativeQuestionPlan {
  const settled = questions.filter(
    (question) => context.coveredIds.has(question.id) || context.skippedIds.has(question.id)
  );
  const current = questions.find(
    (question) =>
      question.id === context.currentId &&
      !context.coveredIds.has(question.id) &&
      !context.skippedIds.has(question.id)
  );
  const scores = Object.fromEntries(
    questions.map((question) => [question.id, scoreCreativeQuestion(question, context)])
  );
  const rankedCandidates = questions
    .filter(
      (question) =>
        !context.coveredIds.has(question.id) &&
        !context.skippedIds.has(question.id) &&
        question.id !== current?.id
    )
    .sort((a, b) => scores[b.id] - scores[a.id] || b.priority - a.priority);

  const budget = Math.max(1, context.maxQuestions ?? DEFAULT_CREATIVE_QUESTION_BUDGET);
  const unansweredSlots = Math.max(0, budget - settled.length - (current ? 1 : 0));
  const selectedCandidates = rankedCandidates.slice(0, unansweredSlots);
  const selectedIds = new Set([
    ...settled.map((question) => question.id),
    ...(current ? [current.id] : []),
    ...selectedCandidates.map((question) => question.id),
  ]);

  return {
    questions: questions.filter((question) => selectedIds.has(question.id)),
    deferred: questions
      .filter((question) => !selectedIds.has(question.id))
      .sort((a, b) => scores[b.id] - scores[a.id] || b.priority - a.priority),
    scores,
  };
}

const CREATIVE_PRODUCTION_ROLES = new Set([
  "visual-identity",
  "layout-publishing",
  "ui-design",
  "photo-development",
  "photo-retouch",
  "video-edit",
  "motion-compositing",
  "illustration-drawing",
  "three-d-creation",
  "space-design",
  "space-documentation",
  "audio-production",
  "social-visuals",
]);

const LEGACY_WORKFLOW_TOOL_IDS: Record<CreativeWorkflowStageId, Set<string>> = {
  produce: new Set([
    "figma", "canva", "adobe-photoshop", "adobe-illustrator", "adobe-after-effects",
    "adobe-premiere-pro", "davinci-resolve", "capcut", "adobe-lightroom", "capture-one",
    "midjourney", "krea-ai", "firefly", "runway", "blender", "cinema-4d", "maya",
    "houdini", "3ds-max", "logic-pro", "pro-tools", "adobe-audition", "ableton-live",
  ]),
  accelerate: new Set([
    "figma-iconify", "figma-tokens", "figma-stark", "figma-anima", "ae-bodymovin",
    "lottiefiles", "ae-animation-composer", "motion-bro", "envato-elements", "fontbase",
    "rightfont", "canva-templates", "figma-templates",
  ]),
  review: new Set([
    "frame-io", "loom", "tella", "pixieset", "google-drive", "dropbox", "onedrive",
    "wetransfer", "adobe-acrobat", "adobe-acrobat-sign", "zeplin", "protopie", "framer",
  ]),
  publish: new Set([
    "buffer", "metricool", "later", "hootsuite", "sprout-social", "planoly",
    "anchor-spotify", "spotify-for-podcasters", "buzzsprout", "ausha", "acast",
  ]),
  secure: new Set([
    "adobe-creative-cloud", "adobe-cc", "envato-elements", "brand-kits",
    "fontbase", "rightfont", "google-drive", "dropbox", "onedrive",
  ]),
};

export function classifyCreativeWorkflowTools(
  tools: Tool[],
  toolUsageMap: Record<string, string[]> = {}
): Record<CreativeWorkflowStageId, Tool[]> {
  const stages: Record<CreativeWorkflowStageId, Tool[]> = {
    produce: [],
    accelerate: [],
    review: [],
    publish: [],
    secure: [],
  };

  for (const tool of tools) {
    const roles = toolUsageMap[tool.id] || [];
    const belongsTo = (stage: CreativeWorkflowStageId) => LEGACY_WORKFLOW_TOOL_IDS[stage].has(tool.id);

    if (belongsTo("produce") || roles.some((role) => CREATIVE_PRODUCTION_ROLES.has(role))) {
      stages.produce.push(tool);
    }
    if (
      belongsTo("accelerate") ||
      roles.some((role) =>
        role === "creative-ai" ||
        role === "creative-assets" ||
        role === "video-finish" ||
        role === "three-d-render" ||
        role.startsWith("ecosystem-")
      )
    ) {
      stages.accelerate.push(tool);
    }
    if (
      belongsTo("review") ||
      roles.some((role) =>
        role === "creative-brief-input" ||
        role === "prototype-handoff" ||
        role === "creative-review-delivery"
      )
    ) {
      stages.review.push(tool);
    }
    if (
      belongsTo("publish") ||
      roles.some((role) => role === "social-publishing" || role === "audio-publishing")
    ) {
      stages.publish.push(tool);
    }
    if (
      belongsTo("secure") ||
      roles.some((role) => role === "creative-assets" || role === "creative-review-delivery")
    ) {
      stages.secure.push(tool);
    }
  }

  return stages;
}
