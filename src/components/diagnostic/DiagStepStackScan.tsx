import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  ChevronRight,
  FileText,
  FolderKanban,
  Layers3,
  MessageSquare,
  Palette,
  Plus,
  Receipt,
  Search,
  Shield,
  Video,
  Workflow,
  X,
} from "@/lib/icons";
import ToolLogo from "@/components/ToolLogo";
import CommercialAccessReview from "@/components/diagnostic/CommercialAccessReview";
import type {
  AiCapabilityId,
  AiContributionMode,
  AiUsageConstraint,
  AiUsageFrequency,
  AiWorkflowActor,
  CommercialContract,
  SessionState,
  Tool,
  ToolRelationKind,
  WorkflowUsage,
} from "@/types/diagnostic";
import {
  buildCreativeQuestions,
  CREATIVE_MAX_SUGGESTION_COUNT,
  CREATIVE_VISIBLE_SUGGESTION_COUNT,
  DEFAULT_CREATIVE_QUESTION_BUDGET,
  diversifyRankedCreativeTools,
  isCreativeCommercialContainer,
  planCreativeQuestions,
  rankToolsForCreativeQuestion,
  type CreativeQuestion,
} from "@/lib/creativeAdaptiveEngine";
import {
  deriveWorkflowUsages,
  getWorkflowUsage,
  inferWorkflowMethod,
  mergeWorkflowUsages,
  upsertWorkflowUsage,
} from "@/lib/workflowUsage";
import {
  aiActorId,
  aiCapabilityLabel,
  aiCapabilityOptionsForObjective,
  aiCapabilityOptionsForTool,
  createAiActor,
  integratedAiFeatureOptions,
  reconcileAiActorsForMode,
  removeAiActor,
  resolveAiCaptureMode,
  setAiActorFrequency,
  setAiActorFeature,
  toggleAiCapability,
  toggleAiConstraint,
  upsertAiActor,
  type AiCapabilityOption,
} from "@/lib/aiWorkflow";
import { commercialFamilyId } from "@/lib/commercialAccess";
import {
  formatMonthlyEur,
  formatMonthlyTotal,
  getMonthlyBudgetBreakdown,
  getPricingCaptureSummary,
} from "@/utils/diagnosticPricing";

interface Props {
  session: SessionState;
  tools: Tool[];
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  onPrev?: () => void;
  onTrack?: (eventName: string, eventPayload?: Record<string, unknown>) => void;
  t: (fr: string, en: string) => string;
  fromTool?: string;
}

const STACK_MOMENTS = [
  {
    id: "ai-assistant",
    Icon: Brain,
    fr: "IA et recherche",
    en: "AI and research",
    questionFr: "Quels assistants IA ou outils de recherche utilises-tu vraiment ?",
    questionEn: "Which AI assistants or research tools do you really use?",
    hintFr: "ChatGPT, Claude, Perplexity, Gemini, Copilot...",
    hintEn: "ChatGPT, Claude, Perplexity, Gemini, Copilot...",
    pattern: /ai|ia|chatgpt|claude|perplexity|gemini|copilot|deepseek|mistral|research|recherche/i,
    ids: ["chatgpt", "claude", "perplexity", "gemini", "github-copilot", "deepseek"],
  },
  {
    id: "docs-knowledge",
    Icon: FileText,
    fr: "Docs et connaissance",
    en: "Docs and knowledge",
    questionFr: "Où écris-tu, ranges-tu tes notes, docs, briefs ou contenus ?",
    questionEn: "Where do you write and organize notes, docs, briefs or content?",
    hintFr: "Notion, Google Drive, Docs, Airtable, Coda...",
    hintEn: "Notion, Google Drive, Docs, Airtable, Coda...",
    pattern: /doc|docs|notion|drive|airtable|coda|knowledge|wiki|content|writing|redaction|document|note/i,
    ids: ["notion", "google-drive", "airtable", "coda", "google-docs"],
  },
  {
    id: "creative-production",
    Icon: Palette,
    fr: "Création visuelle",
    en: "Creative production",
    questionFr: "Quels outils te servent à créer, designer, monter ou produire des visuels ?",
    questionEn: "Which tools do you use to design, edit or produce visuals?",
    hintFr: "Canva, Figma, Adobe, Midjourney, Runway, CapCut...",
    hintEn: "Canva, Figma, Adobe, Midjourney, Runway, CapCut...",
    pattern: /design|figma|canva|adobe|midjourney|runway|video|image|visual|creative|creation|capcut|photo/i,
    ids: ["canva", "figma", "midjourney", "runway", "capcut", "adobe-creative-cloud"],
  },
  {
    id: "automation",
    Icon: Workflow,
    fr: "Automatisation",
    en: "Automation",
    questionFr: "As-tu des automatisations ou connecteurs entre tes outils ?",
    questionEn: "Do you use automations or connectors between tools?",
    hintFr: "Make, Zapier, n8n, Airtable automations...",
    hintEn: "Make, Zapier, n8n, Airtable automations...",
    pattern: /automation|automatisation|workflow|make|zapier|n8n|connector|integration|api/i,
    ids: ["make", "zapier", "n8n", "airtable"],
  },
  {
    id: "communication",
    Icon: MessageSquare,
    fr: "Communication client",
    en: "Client communication",
    questionFr: "Comment échanges-tu avec tes clients, prospects ou équipes ?",
    questionEn: "How do you communicate with clients, leads or teams?",
    hintFr: "Slack, Gmail, WhatsApp, Teams, Discord...",
    hintEn: "Slack, Gmail, WhatsApp, Teams, Discord...",
    pattern: /slack|gmail|mail|email|teams|discord|whatsapp|communication|chat|inbox|messaging/i,
    ids: ["slack", "gmail", "microsoft-teams", "discord"],
  },
  {
    id: "project-delivery",
    Icon: FolderKanban,
    fr: "Projet et livraison",
    en: "Project and delivery",
    questionFr: "Qu’est-ce qui pilote tes tâches, projets, tickets ou livrables ?",
    questionEn: "What manages your tasks, projects, tickets or deliverables?",
    hintFr: "Trello, Asana, Linear, Jira, ClickUp, Monday...",
    hintEn: "Trello, Asana, Linear, Jira, ClickUp, Monday...",
    pattern: /project|projet|task|ticket|delivery|kanban|trello|asana|linear|jira|clickup|monday/i,
    ids: ["trello", "asana", "linear", "jira", "clickup", "monday"],
  },
  {
    id: "meetings-video",
    Icon: Video,
    fr: "Rendez-vous et vidéo",
    en: "Meetings and video",
    questionFr: "Quels outils utilises-tu pour les rendez-vous, démos ou enregistrements ?",
    questionEn: "Which tools do you use for calls, demos or recordings?",
    hintFr: "Calendly, Zoom, Loom, Google Meet...",
    hintEn: "Calendly, Zoom, Loom, Google Meet...",
    pattern: /calendar|calendly|zoom|meet|loom|meeting|call|video|recording|demo|rdv|rendez/i,
    ids: ["calendly", "zoom", "loom", "google-meet"],
  },
  {
    id: "security-admin",
    Icon: Shield,
    fr: "Sécurité et accès",
    en: "Security and access",
    questionFr: "Comment gères-tu les mots de passe, accès, signatures ou fichiers sensibles ?",
    questionEn: "How do you manage passwords, access, signatures or sensitive files?",
    hintFr: "1Password, Dashlane, DocuSign, Dropbox...",
    hintEn: "1Password, Dashlane, DocuSign, Dropbox...",
    pattern: /password|security|securite|access|signature|sign|1password|dashlane|docusign|dropbox|vault/i,
    ids: ["1password", "dashlane", "docusign", "dropbox"],
  },
  {
    id: "finance-admin",
    Icon: Receipt,
    fr: "Facturation et admin",
    en: "Billing and admin",
    questionFr: "Quels outils servent à facturer, encaisser, signer ou suivre l’administratif ?",
    questionEn: "Which tools handle invoicing, payments, signatures or admin?",
    hintFr: "Stripe, Pennylane, QuickBooks, Indy, PayPal...",
    hintEn: "Stripe, Pennylane, QuickBooks, Indy, PayPal...",
    pattern: /invoice|billing|facturation|payment|stripe|paypal|finance|accounting|admin|compta|quickbooks|pennylane|indy/i,
    ids: ["stripe", "paypal", "quickbooks", "pennylane", "indy"],
  },
  {
    id: "analytics-growth",
    Icon: BarChart3,
    fr: "Analytics et croissance",
    en: "Analytics and growth",
    questionFr: "Mesures-tu ton site, tes conversions, tes emails ou tes prospects ?",
    questionEn: "Do you measure your site, conversions, emails or leads?",
    hintFr: "GA4, PostHog, Hotjar, Brevo, HubSpot...",
    hintEn: "GA4, PostHog, Hotjar, Brevo, HubSpot...",
    pattern: /analytics|growth|conversion|tracking|posthog|hotjar|hubspot|brevo|mailerlite|ga4|google analytics|crm|lead/i,
    ids: ["google-analytics", "posthog", "hotjar", "brevo", "hubspot", "mailerlite"],
  },
] as const;

const CREATIVE_STACK_MOMENTS = [
  {
    id: "creative-brief-assets",
    Icon: FileText,
    fr: "Brief et sources",
    en: "Brief and sources",
    questionFr: "Où poses-tu le brief, les références, les moodboards ou les sources client ?",
    questionEn: "Where do you keep briefs, references, moodboards or client sources?",
    hintFr: "Milanote, Notion, Drive, Figma, Canva...",
    hintEn: "Milanote, Notion, Drive, Figma, Canva...",
    pattern: /brief|source|moodboard|reference|inspiration|notion|drive|milanote|figma|canva|asset/i,
    ids: ["milanote", "notion", "google-drive", "figma", "canva", "dropbox"],
  },
  {
    id: "creative-design-core",
    Icon: Palette,
    fr: "Design principal",
    en: "Core design",
    questionFr: "Avec quoi crées-tu les visuels, maquettes, identités ou supports principaux ?",
    questionEn: "What do you use to create visuals, mockups, identities or main deliverables?",
    hintFr: "Figma, Canva, Photoshop, Illustrator, Affinity...",
    hintEn: "Figma, Canva, Photoshop, Illustrator, Affinity...",
    pattern: /figma|canva|photoshop|illustrator|affinity|adobe|design|identity|brand|visual|creative/i,
    ids: ["figma", "canva", "adobe-photoshop", "adobe-illustrator", "indesign", "affinity-photo", "sketch", "procreate", "adobe-express"],
  },
  {
    id: "creative-plugins-resources",
    Icon: Layers3,
    fr: "Plugins et ressources",
    en: "Plugins and resources",
    questionFr: "Quels plugins, templates, fonts, icônes ou mockups accélèrent ton travail ?",
    questionEn: "Which plugins, templates, fonts, icons or mockups speed up your work?",
    hintFr: "Iconify, Tokens, Stark, Envato, mockups, fonts...",
    hintEn: "Iconify, Tokens, Stark, Envato, mockups, fonts...",
    pattern: /plugin|addon|template|mockup|font|icon|asset|envato|iconify|tokens|stark|mockups|rightfont|fontbase/i,
    ids: [
      "figma-iconify",
      "figma-tokens",
      "figma-stark",
      "figma-anima",
      "dynamic-mockups",
      "envato-elements",
      "icons8",
      "noun-project",
      "hugeicons",
      "fontbase",
      "rightfont",
      "canva-templates",
      "figma-templates",
      "motion-array",
    ],
  },
  {
    id: "creative-ai-visual",
    Icon: Brain,
    fr: "IA visuelle",
    en: "Visual AI",
    questionFr: "Quelles IA t’aident à générer, retoucher ou explorer des pistes visuelles ?",
    questionEn: "Which AI tools help you generate, retouch or explore visual directions?",
    hintFr: "Midjourney, Krea, Firefly, Runway, Remove.bg...",
    hintEn: "Midjourney, Krea, Firefly, Runway, Remove.bg...",
    pattern: /midjourney|krea|firefly|stable|diffusion|flux|ideogram|leonardo|runway|remove|ai|ia|image/i,
    ids: ["midjourney", "krea-ai", "firefly", "stable-diffusion", "flux-ai", "ideogram", "leonardo-ai", "runway", "remove-bg"],
  },
  {
    id: "creative-motion-video",
    Icon: Video,
    fr: "Motion et vidéo",
    en: "Motion and video",
    questionFr: "Quels outils ou extensions utilises-tu pour monter, animer ou produire de la vidéo ?",
    questionEn: "Which tools or extensions do you use to edit, animate or produce video?",
    hintFr: "After Effects, Premiere, DaVinci, CapCut, Lottie, plugins AE...",
    hintEn: "After Effects, Premiere, DaVinci, CapCut, Lottie, AE plugins...",
    pattern: /after effects|premiere|davinci|capcut|runway|lottie|motion|video|animation|subtitle|descript|topaz/i,
    ids: [
      "adobe-after-effects",
      "adobe-premiere-pro",
      "davinci-resolve",
      "capcut",
      "runway",
      "ae-bodymovin",
      "lottiefiles",
      "ae-animation-composer",
      "motion-bro",
      "ae-overlord",
      "ae-duik",
      "ae-gifgun",
      "ae-red-giant",
      "topaz-video-ai",
      "descript",
    ],
  },
  {
    id: "creative-photo-retouch",
    Icon: Palette,
    fr: "Photo et retouche",
    en: "Photo and retouching",
    questionFr: "Quels outils structurent ta retouche, tes presets, tes galeries ou tes exports photo ?",
    questionEn: "Which tools structure retouching, presets, galleries or photo exports?",
    hintFr: "Lightroom, Capture One, presets, Pixieset, Nik Collection...",
    hintEn: "Lightroom, Capture One, presets, Pixieset, Nik Collection...",
    pattern: /lightroom|capture one|photo|retouch|preset|raw|pixieset|nik|luminar/i,
    ids: ["adobe-lightroom", "capture-one", "adobe-photoshop", "luminar-neo", "nik-collection", "lightroom-mobile", "pixieset"],
  },
  {
    id: "creative-client-review",
    Icon: MessageSquare,
    fr: "Validation client",
    en: "Client review",
    questionFr: "Comment fais-tu valider, commenter ou livrer les créations aux clients ?",
    questionEn: "How do clients review, comment on or receive creative work?",
    hintFr: "Frame.io, Loom, Tella, Drive, Dropbox, WeTransfer...",
    hintEn: "Frame.io, Loom, Tella, Drive, Dropbox, WeTransfer...",
    pattern: /review|comment|feedback|client|delivery|livraison|frame|loom|tella|pixieset|drive|dropbox|wetransfer|acrobat/i,
    ids: ["frame-io", "loom", "tella", "pixieset", "google-drive", "dropbox", "wetransfer", "adobe-acrobat-sign", "adobe-acrobat"],
  },
  {
    id: "creative-handoff-web",
    Icon: FolderKanban,
    fr: "Handoff et prototype",
    en: "Handoff and prototype",
    questionFr: "Quels outils servent au prototype, au handoff ou à la mise en ligne ?",
    questionEn: "Which tools handle prototypes, handoff or publishing?",
    hintFr: "Figma, Zeplin, Tokens, Anima, ProtoPie, Rive, Spline, Framer...",
    hintEn: "Figma, Zeplin, Tokens, Anima, ProtoPie, Rive, Spline, Framer...",
    pattern: /handoff|prototype|framer|webflow|zeplin|anima|tokens|protopie|rive|spline|publish|website/i,
    ids: ["figma", "zeplin", "figma-tokens", "figma-anima", "protopie", "rive", "spline", "framer", "webflow-framer"],
  },
  {
    id: "creative-admin-rights",
    Icon: Shield,
    fr: "Droits et licences",
    en: "Rights and licenses",
    questionFr: "Où gères-tu licences, assets payants, polices, droits et facturation créative ?",
    questionEn: "Where do you manage licenses, paid assets, fonts, rights and creative billing?",
    hintFr: "Adobe CC, Envato, Brand kits, Font managers, Stripe, Indy...",
    hintEn: "Adobe CC, Envato, Brand kits, font managers, Stripe, Indy...",
    pattern: /license|licence|rights|droits|asset|font|adobe creative cloud|envato|brand kit|stripe|indy|paypal|billing/i,
    ids: ["adobe-cc", "envato-elements", "brandpad", "fontbase", "rightfont", "stripe", "indy", "paypal"],
  },
  {
    id: "creative-measure-growth",
    Icon: BarChart3,
    fr: "Portfolio et mesure",
    en: "Portfolio and measurement",
    questionFr: "Mesures-tu ton site, tes campagnes, tes leads ou la performance des contenus ?",
    questionEn: "Do you measure your site, campaigns, leads or content performance?",
    hintFr: "GA4, PostHog, Hotjar, Brevo, HubSpot, MailerLite...",
    hintEn: "GA4, PostHog, Hotjar, Brevo, HubSpot, MailerLite...",
    pattern: /analytics|portfolio|campaign|newsletter|lead|crm|brevo|hubspot|mailerlite|hotjar|posthog|google analytics/i,
    ids: ["google-analytics", "posthog", "hotjar", "brevo", "hubspot", "mailerlite", "looker-studio"],
  },
] as const;

const CREATIVE_AI_SUGGESTION_IDS_BY_MOMENT: Record<string, string[]> = {
  "creative-brief-input": [
    "chatgpt",
    "claude",
    "perplexity",
    "notion-ai",
    "milanote",
  ],
  "visual-identity": [
    "firefly",
    "midjourney",
    "krea-ai",
    "ideogram",
    "canva-ai",
    "figma-weave",
  ],
  "layout-publishing": [
    "chatgpt",
    "canva-ai",
    "beautiful-ai",
    "firefly",
  ],
  "ui-design": [
    "figma-weave",
    "relume-ai",
    "v0-vercel",
    "chatgpt",
    "claude",
  ],
  "prototype-handoff": [
    "figma-weave",
    "v0-vercel",
    "relume-ai",
    "figma-anima",
    "chatgpt",
  ],
  "photo-development": [
    "topaz-photo-ai",
    "topaz-gigapixel",
    "luminar-neo",
    "firefly",
  ],
  "photo-retouch": [
    "topaz-photo-ai",
    "remove-bg",
    "firefly",
    "luminar-neo",
    "topaz-gigapixel",
  ],
  "video-edit": [
    "descript",
    "descript-ai",
    "opus-clip",
    "capcut-ai",
    "runway",
    "whisper",
    "adobe-enhance-speech",
  ],
  "video-finish": [
    "runway",
    "pika-labs",
    "kling-ai",
    "topaz-video-ai",
    "descript",
    "adobe-enhance-speech",
  ],
  "motion-compositing": [
    "runway",
    "pika-labs",
    "kling-ai",
    "lottie",
    "ae-animation-composer",
  ],
  "illustration-drawing": [
    "midjourney",
    "stable-diffusion",
    "leonardo-ai",
    "firefly",
    "krea-ai",
  ],
  "three-d-creation": [
    "midjourney",
    "leonardo-ai",
    "stable-diffusion",
    "runway",
    "gaea",
  ],
  "three-d-render": [
    "runway",
    "krea-ai",
    "midjourney",
    "topaz-gigapixel",
  ],
  "space-design": [
    "midjourney",
    "krea-ai",
    "runway",
    "relume-ai",
  ],
  "space-documentation": [
    "chatgpt",
    "claude",
    "adobe-acrobat",
    "perplexity",
    "notion-ai",
  ],
  "audio-production": [
    "descript",
    "descript-ai",
    "podcastle",
    "cleanvoice",
    "auphonic",
    "whisper",
    "adobe-enhance-speech",
    "riverside",
  ],
  "audio-publishing": [
    "castmagic",
    "headliner",
    "opus-clip",
    "auphonic",
    "chatgpt",
    "claude",
  ],
  "social-visuals": [
    "canva-ai",
    "midjourney",
    "krea-ai",
    "firefly",
    "capcut-ai",
  ],
  "social-publishing": [
    "chatgpt",
    "claude",
    "typefully",
    "taplio",
    "publer",
  ],
  "creative-ai": [
    "midjourney",
    "firefly",
    "krea-ai",
    "runway",
    "pika-labs",
    "kling-ai",
    "figma-weave",
    "canva-ai",
    "v0-vercel",
    "descript-ai",
  ],
  "creative-assets": [
    "firefly",
    "midjourney",
    "krea-ai",
    "figma-weave",
    "canva-ai",
  ],
  "creative-review-delivery": [
    "chatgpt",
    "claude",
    "adobe-acrobat",
    "loom",
  ],
};

const CREATIVE_PARENT_RELATIONS = [
  {
    parentIds: ["figma"],
    momentIds: ["creative-plugins-resources", "creative-handoff-web"],
    toolIds: ["figma-iconify", "figma-tokens", "figma-stark", "figma-anima", "zeplin", "figma-slides"],
  },
  {
    parentIds: ["adobe-after-effects"],
    momentIds: ["creative-motion-video"],
    toolIds: ["ae-bodymovin", "lottiefiles", "ae-animation-composer", "motion-bro", "ae-overlord", "ae-duik", "ae-gifgun", "ae-red-giant"],
  },
  {
    parentIds: ["adobe-lightroom", "capture-one"],
    momentIds: ["creative-photo-retouch", "creative-client-review"],
    toolIds: ["luminar-neo", "nik-collection", "pixieset"],
  },
  {
    parentIds: ["canva"],
    momentIds: ["creative-plugins-resources", "creative-design-core"],
    toolIds: ["canva-pro", "canva-templates", "envato-elements", "dynamic-mockups", "icons8", "noun-project"],
  },
  {
    parentIds: ["adobe-photoshop", "adobe-illustrator"],
    momentIds: ["creative-plugins-resources", "creative-design-core", "creative-admin-rights"],
    toolIds: ["dynamic-mockups", "envato-elements", "icons8", "noun-project", "hugeicons", "fontbase", "rightfont"],
  },
  {
    parentIds: ["capcut", "adobe-premiere-pro", "davinci-resolve"],
    momentIds: ["creative-motion-video", "creative-client-review"],
    toolIds: ["capcut-templates", "capcut-ai", "topaz-video-ai", "descript", "adobe-enhance-speech", "frame-io"],
  },
  {
    parentIds: ["midjourney", "krea-ai", "firefly", "runway"],
    momentIds: ["creative-ai-visual", "creative-plugins-resources"],
    toolIds: ["remove-bg", "topaz-video-ai", "envato-elements", "dynamic-mockups"],
  },
] as const;

type StackMoment = {
  id: string;
  Icon: typeof Brain;
  fr: string;
  en: string;
  questionFr: string;
  questionEn: string;
  hintFr: string;
  hintEn: string;
  pattern: RegExp;
  ids: readonly string[];
  creativeQuestion?: CreativeQuestion;
};
type StackFeedAnimation = {
  id: string;
  tool: Tool;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
};

type BillingOption = {
  value: NonNullable<Tool["selectedOffer"]>;
  fr: string;
  en: string;
  priceMonthlyEur?: number | null;
  priceOriginal?: number | null;
  currency?: string | null;
  needsVerification?: boolean;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizedMention(value: string) {
  return normalize(value).replace(/[^a-z0-9]+/g, " ").trim();
}

const GENERIC_PROVIDER_STRIPPED_ALIASES = new Set([
  "project",
]);

function toolMentionAliases(tool: Tool) {
  const fullName = normalizedMention(tool.name);
  const withoutProvider = fullName.replace(
    /^(adobe|apple|autodesk|google|maxon|microsoft)\s+/,
    ""
  );
  const idAlias = normalizedMention(tool.id);
  return [...new Set([fullName, withoutProvider, idAlias])]
    .filter((alias) => alias.length >= 4)
    .filter((alias) => !GENERIC_PROVIDER_STRIPPED_ALIASES.has(alias));
}

export function textMentionsTool(text: string, tool: Tool) {
  const normalizedText = ` ${normalizedMention(text)} `;
  return toolMentionAliases(tool).some((alias) =>
    normalizedText.includes(` ${alias} `)
  );
}

function option(
  value: NonNullable<Tool["selectedOffer"]>,
  fr: string,
  en: string,
  extra: Partial<BillingOption> = {}
): BillingOption {
  return { value, fr, en, ...extra };
}

function getToolBillingOptions(tool: Tool): BillingOption[] {
  const rawOptions = tool.pricing_v5?.billing_options;
  if (Array.isArray(rawOptions) && rawOptions.length > 0) {
    const mapped = rawOptions
      .filter((item) => item?.value && item.label_fr && item.label_en)
      .map((item) => ({
        value: item.value,
        fr: item.label_fr,
        en: item.label_en,
        priceMonthlyEur: item.price_monthly_eur,
        priceOriginal: item.price_original,
        currency: item.currency,
        needsVerification: item.needs_verification,
      }));
    return [...new Map(mapped.map((item) => [item.value, item])).values()];
  }

  const model = tool.pricing_v5?.billing_model || tool.pricing_v5?.compare_plan_kind;
  const planName = tool.pricing_v5?.compare_plan_name || "Pro";
  const freeOnly =
    Number(tool.pricing_v5?.compare_price_monthly_eur ?? tool.catalogMonthlyPrice ?? tool.price ?? 0) === 0 &&
    !tool.pricing?.paid &&
    /free|gratuit/i.test(planName);
  if (model === "one_time") {
    return [
      option("one_time", "Achat unique", "One-time"),
      option("included", "Déjà acheté", "Already bought"),
      option("unknown", "Je ne sais pas", "I don’t know", { needsVerification: true }),
    ];
  }
  if (model === "bundle") {
    return [
      option("bundle", planName, planName),
      option("included", "Inclus ailleurs", "Included elsewhere"),
      option("team", "Licence équipe", "Team license", { needsVerification: true }),
      option("unknown", "Je ne sais pas", "I don’t know", { needsVerification: true }),
    ];
  }
  if (model === "usage_based" || model === "credits") {
    return [
      option("free", "Free tier", "Free tier"),
      option("usage", "Usage / crédits", "Usage / credits", { needsVerification: true }),
      option("team", "Équipe", "Team", { needsVerification: true }),
      option("unknown", "Je ne sais pas", "I don’t know", { needsVerification: true }),
    ];
  }
  if (model === "free" || freeOnly) {
    return [
      option("free", "Gratuit", "Free"),
      option("team", "Équipe", "Team", { needsVerification: true }),
      option("unknown", "Je ne sais pas", "I don’t know", { needsVerification: true }),
    ];
  }
  return [
    option("free", "Gratuit", "Free"),
    option("paid", planName, planName),
    option("team", "Équipe", "Team", { needsVerification: true }),
    option("unknown", "Je ne sais pas", "I don’t know", { needsVerification: true }),
  ];
}

function getDefaultOffer(tool: Tool): NonNullable<Tool["selectedOffer"]> {
  const options = getToolBillingOptions(tool);
  return options.find((item) => item.value !== "unknown")?.value || (Number(tool.price || 0) > 0 ? "paid" : "free");
}

function makeCustomTool(
  name: string,
  price: number,
  moment?: StackMoment,
  currency?: string,
  toolType: Tool["tool_type"] = "satellite",
  relationKind?: ToolRelationKind,
  relatedToolId?: string
): Tool {
  const slug = normalize(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const relation = relationKind && relatedToolId
    ? [{ kind: relationKind, targetToolId: relatedToolId, confidence: "inferred" as const }]
    : [];
  return {
    id: `custom-${slug || "tool"}-${Date.now()}`,
    name,
    price,
    priceCurrency: currency || undefined,
    category: moment?.id || "custom",
    functional_needs: moment ? [moment.fr] : [],
    tool_type: toolType,
    host_app: relationKind === "plugin_of" ? relatedToolId : undefined,
    bundle_parent: relationKind === "included_in" ? relatedToolId : undefined,
    complements: relationKind === "complements" && relatedToolId ? [relatedToolId] : [],
    integrates_with: relationKind === "integrates_with" && relatedToolId ? [relatedToolId] : [],
    alternatives: relationKind === "alternative_to" && relatedToolId ? [relatedToolId] : [],
    relations: relation,
    usage: "medium",
    prescription_quality: "oui",
    catalogMonthlyPrice: price,
    catalogMonthlyPriceCurrency: currency || undefined,
    selectedOffer: price > 0 ? "paid" : "free",
    selectedPriceIsEstimate: false,
    force_silence: false,
  };
}

function withDefaultOffer(tool: Tool): Tool {
  const catalogMonthlyPrice = tool.pricing_v5?.compare_price_monthly_eur ?? tool.catalogMonthlyPrice ?? Number(tool.price || 0);
  const catalogMonthlyPriceCurrency = tool.pricing_v5?.compare_price_monthly_eur != null
    ? "EUR"
    : tool.catalogMonthlyPriceCurrency || tool.priceCurrency;
  return {
    ...tool,
    catalogMonthlyPrice,
    catalogMonthlyPriceCurrency,
    selectedOffer: tool.selectedOffer || getDefaultOffer(tool),
    selectedPriceIsEstimate: tool.selectedPriceIsEstimate ?? true,
    priceCurrency: tool.priceCurrency || catalogMonthlyPriceCurrency,
  };
}

function withDeferredCommercialAccess(tool: Tool, selectedTools: Tool[]): Tool {
  const baseTool = withDefaultOffer(tool);
  const includedParentId = baseTool.bundle_parent || baseTool.includedVia;
  if (
    baseTool.includedInBundle ||
    (includedParentId && selectedTools.some((selected) => selected.id === includedParentId))
  ) {
    return {
      ...baseTool,
      selectedOffer: "included",
      price: 0,
      selectedPriceIsEstimate: false,
      includedInBundle: true,
      includedVia: includedParentId,
    };
  }

  const billingModel = baseTool.pricing_v5?.billing_model;
  const planName = baseTool.pricing_v5?.compare_plan_name || "";
  const isClearlyFree =
    billingModel === "free" ||
    (Number(baseTool.catalogMonthlyPrice ?? baseTool.price ?? 0) === 0 &&
      /free|gratuit/i.test(planName));

  if (isClearlyFree) {
    return {
      ...baseTool,
      selectedOffer: "free",
      price: 0,
      selectedPriceIsEstimate: false,
    };
  }

  return {
    ...baseTool,
    selectedOffer: "unknown",
    price: Number(baseTool.catalogMonthlyPrice ?? baseTool.price ?? 0),
    priceCurrency: baseTool.catalogMonthlyPriceCurrency || baseTool.priceCurrency,
    selectedPriceIsEstimate: true,
  };
}

function toolText(tool: Tool) {
  return [
    tool.id,
    tool.name,
    tool.name_en,
    tool.category,
    tool.ia_use_case,
    ...(tool.functional_needs || []),
  ].filter(Boolean).join(" ");
}

function matchesMoment(tool: Tool, moment: StackMoment) {
  const normalizedId = normalize(tool.id);
  if ((moment.ids as readonly string[]).some((id) => normalize(id) === normalizedId)) return true;
  return moment.pattern.test(toolText(tool));
}

function creativeQuestionIcon(question: CreativeQuestion) {
  if (question.kind === "ecosystem") return Layers3;
  if (/ai/.test(question.id)) return Brain;
  if (/video|motion/.test(question.id)) return Video;
  if (/photo|visual|illustration|ui/.test(question.id)) return Palette;
  if (/three-d|space/.test(question.id)) return FolderKanban;
  if (/review|delivery/.test(question.id)) return MessageSquare;
  return FileText;
}

function getStackMomentsForPersona(
  session: SessionState,
  selectedTools: Tool[],
  allTools: Tool[]
): readonly StackMoment[] {
  if (session.persona !== "SOFIA") return STACK_MOMENTS;
  const outputIds = [session.primarySpecialty, ...(session.complementarySpecialties || [])].filter(
    (id): id is string => Boolean(id)
  );
  const baseQuestions = buildCreativeQuestions(outputIds, [], allTools);
  const baseQuestionIds = new Set(baseQuestions.map((question) => question.id));
  const relevantSelectedTools = selectedTools.filter((tool) => {
    const declaredUsages = session.toolUsageMap?.[tool.id] || [];
    if (declaredUsages.length > 0) {
      return declaredUsages.some((usageId) => baseQuestionIds.has(usageId));
    }
    return baseQuestions.some((question) =>
      rankToolsForCreativeQuestion(
        question,
        [tool],
        outputIds,
        new Set([tool.id])
      ).some((candidate) => candidate.tool.id === tool.id)
    );
  });
  return buildCreativeQuestions(outputIds, relevantSelectedTools, allTools).map((question) => ({
    id: question.id,
    Icon: creativeQuestionIcon(question),
    fr: question.labelFr,
    en: question.labelEn,
    questionFr: question.questionFr,
    questionEn: question.questionEn,
    hintFr: question.hintFr,
    hintEn: question.hintEn,
    pattern: /$a/,
    ids: question.explicitToolIds,
    creativeQuestion: question,
  }));
}

function getCreativeContextualToolIds(
  selectedTools: Tool[],
  activeMomentId: string,
  persona: SessionState["persona"]
) {
  if (persona !== "SOFIA") return new Set<string>();
  const selectedToolIds = new Set(selectedTools.map((tool) => tool.id));
  const contextualIds = new Set<string>();
  CREATIVE_PARENT_RELATIONS.forEach((relation) => {
    if (!(relation.momentIds as readonly string[]).includes(activeMomentId)) return;
    const hasParent = (relation.parentIds as readonly string[]).some((id) => selectedToolIds.has(id));
    if (!hasParent) return;
    (relation.toolIds as readonly string[]).forEach((id) => contextualIds.add(id));
  });
  return contextualIds;
}

function nextMomentId(
  moments: readonly StackMoment[],
  coveredIds: Set<string>,
  skippedIds: Set<string>,
  currentId: string
) {
  const currentIndex = moments.findIndex((moment) => moment.id === currentId);
  const ordered = [
    ...moments.slice(currentIndex + 1),
    ...moments.slice(0, currentIndex + 1),
  ];
  return ordered.find((moment) => !coveredIds.has(moment.id) && !skippedIds.has(moment.id))?.id || null;
}

export default function DiagStepStackScan({ session, tools, onUpdate, onNext, onPrev, onTrack, t, fromTool }: Props) {
  const [search, setSearch] = useState("");
  const questionRef = useRef<HTMLHeadingElement | null>(null);
  const stackDropRef = useRef<HTMLDivElement | null>(null);
  const initialSelectedTools = useMemo(() => {
    if (session.selectedTools.length > 0 || !fromTool) {
      return (session.selectedTools || []).map(withDefaultOffer);
    }
    const normalizedFromTool = normalize(fromTool);
    const entryTool = tools.find((tool) =>
      normalize(tool.id) === normalizedFromTool ||
      normalize(tool.name) === normalizedFromTool
    );
    return entryTool ? [withDeferredCommercialAccess(entryTool, [])] : [];
  }, [fromTool, session.selectedTools, tools]);
  const [selectedTools, setSelectedTools] = useState<Tool[]>(initialSelectedTools);
  const allStackMoments = useMemo(
    () => getStackMomentsForPersona(session, selectedTools, tools),
    [selectedTools, session, tools]
  );
  const [toolUsageMap, setToolUsageMap] = useState<Record<string, string[]>>(() => {
    if (session.persona !== "SOFIA") return session.toolUsageMap || {};
    if (session.toolUsageMap && Object.keys(session.toolUsageMap).length > 0) {
      return session.toolUsageMap;
    }
    return Object.fromEntries(
      initialSelectedTools
        .map((tool) => [tool.id, allStackMoments.filter((moment) => matchesMoment(tool, moment)).map((moment) => moment.id)] as const)
        .filter(([, momentIds]) => momentIds.length > 0)
    );
  });
  const [workflowUsages, setWorkflowUsages] = useState<WorkflowUsage[]>(() =>
    mergeWorkflowUsages(
      deriveWorkflowUsages(session.toolUsageMap || {}, allStackMoments),
      session.workflowUsages
    )
  );
  const [commercialContracts, setCommercialContracts] = useState<CommercialContract[]>(
    () => session.commercialContracts || []
  );
  const [activeMomentId, setActiveMomentId] = useState<string>(() => {
    const covered = new Set((session.selectionCoverage?.covered || []));
    const skipped = new Set((session.selectionCoverage?.skipped || []));
    return allStackMoments.find((moment) => !covered.has(moment.id) && !skipped.has(moment.id))?.id || allStackMoments[0]?.id || "";
  });
  const [skippedMomentIds, setSkippedMomentIds] = useState<Set<string>>(
    () => new Set(session.selectionCoverage?.skipped || [])
  );
  const [completedMomentIds, setCompletedMomentIds] = useState<Set<string>>(
    () => new Set(session.selectionCoverage?.covered || [])
  );
  const [showDeferredMoments, setShowDeferredMoments] = useState(false);
  const [expandedMomentIds, setExpandedMomentIds] = useState<string[]>([]);
  const [expandedSuggestionMomentIds, setExpandedSuggestionMomentIds] = useState<string[]>([]);
  const [usageExpansionToolId, setUsageExpansionToolId] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customToolType, setCustomToolType] = useState<Tool["tool_type"]>("satellite");
  const [customRelationKind, setCustomRelationKind] = useState<"" | ToolRelationKind>("");
  const [customRelatedToolId, setCustomRelatedToolId] = useState("");
  const [lastConfirmedToolId, setLastConfirmedToolId] = useState<string | null>(null);
  const [feedAnimation, setFeedAnimation] = useState<StackFeedAnimation | null>(null);
  const lastSyncedSnapshotRef = useRef("");

  useEffect(() => {
    const contractByProductId = new Map<string, CommercialContract>();
    commercialContracts
      .filter((contract) => contract.confirmed)
      .forEach((contract) => {
        contract.productIds.forEach((productId) => {
          contractByProductId.set(productId, contract);
        });
      });
    setSelectedTools((current) => {
      let changed = false;
      const next = current.map((tool) => {
        const contract = contractByProductId.get(tool.id);
        if (contract) {
          if (
            tool.commercialContractId === contract.id &&
            tool.selectedOffer === "included" &&
            tool.price === 0
          ) {
            return tool;
          }
          changed = true;
          return {
            ...tool,
            selectedOffer: "included" as const,
            price: 0,
            selectedPriceIsEstimate: false,
            includedInBundle: true,
            includedVia: contract.familyName,
            commercialContractId: contract.id,
          };
        }
        if (!tool.commercialContractId) return tool;
        changed = true;
        return {
          ...tool,
          selectedOffer: "unknown" as const,
          price: Number(tool.catalogMonthlyPrice || 0),
          priceCurrency: tool.catalogMonthlyPriceCurrency || tool.priceCurrency,
          selectedPriceIsEstimate: true,
          includedInBundle: false,
          includedVia: undefined,
          commercialContractId: undefined,
        };
      });
      return changed ? next : current;
    });
  }, [commercialContracts]);

  const selectedIds = useMemo(() => new Set(selectedTools.map((tool) => tool.id)), [selectedTools]);
  const selectedToolsById = useMemo(
    () => new Map(selectedTools.map((tool) => [tool.id, tool])),
    [selectedTools]
  );
  const creativeOutputIds = useMemo(
    () => [session.primarySpecialty, ...(session.complementarySpecialties || [])].filter(
      (id): id is string => Boolean(id)
    ),
    [session.complementarySpecialties, session.primarySpecialty]
  );
  const creativeQuestionPlan = useMemo(() => {
    if (session.persona !== "SOFIA") return null;
    return planCreativeQuestions(
      allStackMoments
        .map((moment) => moment.creativeQuestion)
        .filter((question): question is CreativeQuestion => Boolean(question)),
      {
        outputIds: creativeOutputIds,
        selectedTools,
        toolUsageMap,
        coveredIds: completedMomentIds,
        skippedIds: skippedMomentIds,
        currentId: activeMomentId,
        maxQuestions: DEFAULT_CREATIVE_QUESTION_BUDGET,
      }
    );
  }, [
    activeMomentId,
    allStackMoments,
    completedMomentIds,
    creativeOutputIds,
    selectedTools,
    session.persona,
    skippedMomentIds,
    toolUsageMap,
  ]);
  const stackMoments = useMemo(() => {
    if (session.persona !== "SOFIA" || !creativeQuestionPlan) {
      return allStackMoments;
    }
    const momentsById = new Map(allStackMoments.map((moment) => [moment.id, moment]));
    if (showDeferredMoments) {
      const orderedIds = [
        ...expandedMomentIds,
        ...allStackMoments
          .map((moment) => moment.id)
          .filter((id) => !expandedMomentIds.includes(id)),
      ];
      return orderedIds
        .map((id) => momentsById.get(id))
        .filter((moment): moment is StackMoment => Boolean(moment));
    }
    return creativeQuestionPlan.questions
      .map((question) => momentsById.get(question.id))
      .filter((moment): moment is StackMoment => Boolean(moment));
  }, [
    allStackMoments,
    creativeQuestionPlan,
    expandedMomentIds,
    session.persona,
    showDeferredMoments,
  ]);
  const deferredMoments = useMemo(() => {
    if (!creativeQuestionPlan) return [] as StackMoment[];
    const momentsById = new Map(allStackMoments.map((moment) => [moment.id, moment]));
    return creativeQuestionPlan.deferred
      .map((question) => momentsById.get(question.id))
      .filter((moment): moment is StackMoment => Boolean(moment));
  }, [allStackMoments, creativeQuestionPlan]);
  const allKnownTools = useMemo(() => {
    const map = new Map<string, Tool>();
    tools.forEach((tool) => map.set(tool.id, tool));
    selectedTools.forEach((tool) => map.set(tool.id, tool));
    return Array.from(map.values());
  }, [selectedTools, tools]);

  const filteredTools = useMemo(() => {
    const q = normalize(search);
    return allKnownTools
      .filter((tool) => {
        if (selectedIds.has(tool.id) && session.persona !== "SOFIA") return false;
        if (!q) return true;
        return normalize(tool.name).includes(q) || normalize(tool.category || "").includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allKnownTools, search, selectedIds, session.persona]);

  const momentCoverage = useMemo(() => {
    return stackMoments.map((moment) => {
      const selected = selectedTools.filter((tool) =>
        session.persona === "SOFIA"
          ? (toolUsageMap[tool.id] || []).includes(moment.id)
          : matchesMoment(tool, moment)
      );
      return {
        ...moment,
        selected,
        covered: completedMomentIds.has(moment.id),
        skipped: skippedMomentIds.has(moment.id),
      };
    });
  }, [completedMomentIds, selectedTools, session.persona, skippedMomentIds, stackMoments, toolUsageMap]);

  const coveredMomentIds = useMemo(
    () => new Set(momentCoverage.filter((moment) => moment.covered).map((moment) => moment.id)),
    [momentCoverage]
  );

  const activeMoment = momentCoverage.find((moment) => moment.id === activeMomentId) || momentCoverage[0];
  const activeWorkflowUsage = useMemo(
    () => getWorkflowUsage(workflowUsages, activeMoment),
    [activeMoment, workflowUsages]
  );
  const activeCustomDefaultType: Tool["tool_type"] =
    activeMoment.creativeQuestion?.kind === "core"
      ? "metier"
      : activeMoment.creativeQuestion?.kind === "ecosystem"
        ? "plugin"
        : /ai/.test(activeMoment.id)
          ? "ia"
          : "satellite";
  const activeSourceToolId = activeMoment.creativeQuestion?.sourceToolId || "";
  const activeMomentSuggestionItems = useMemo(() => {
    if (session.persona === "SOFIA" && activeMoment.creativeQuestion) {
      const outputIds = [session.primarySpecialty, ...(session.complementarySpecialties || [])].filter(
        (id): id is string => Boolean(id)
      );
      return diversifyRankedCreativeTools(
        activeMoment.creativeQuestion,
        rankToolsForCreativeQuestion(
          activeMoment.creativeQuestion,
          tools,
          outputIds,
          selectedIds
        )
      ).slice(0, CREATIVE_MAX_SUGGESTION_COUNT);
    }
    const activeMomentIds = activeMoment.ids as readonly string[];
    const contextualToolIds = getCreativeContextualToolIds(selectedTools, activeMoment.id, session.persona);
    const explicitRank = new Map(activeMomentIds.map((id, index) => [normalize(id), index]));
    const candidates = tools
      .filter((tool) => !selectedIds.has(tool.id))
      .filter((tool) => explicitRank.has(normalize(tool.id)) || contextualToolIds.has(tool.id));

    // The curated IDs are the intent model for the question. Broad text matching is
    // only a fallback when the catalogue is incomplete, otherwise generic terms
    // such as “asset” or “design” make every question surface the same tools.
    const fallback = candidates.length >= 4
      ? []
      : tools.filter((tool) =>
          !selectedIds.has(tool.id) &&
          !candidates.some((candidate) => candidate.id === tool.id) &&
          matchesMoment(tool, activeMoment)
        );

    return [...candidates, ...fallback]
      .sort((a, b) => {
        const aContext = contextualToolIds.has(a.id);
        const bContext = contextualToolIds.has(b.id);
        if (aContext !== bContext) return aContext ? -1 : 1;
        const aRank = explicitRank.get(normalize(a.id)) ?? Number.MAX_SAFE_INTEGER;
        const bRank = explicitRank.get(normalize(b.id)) ?? Number.MAX_SAFE_INTEGER;
        if (aRank !== bRank) return aRank - bRank;
        return (b.pertinence_by_persona?.[session.persona] || 0) - (a.pertinence_by_persona?.[session.persona] || 0);
      })
      .slice(0, CREATIVE_VISIBLE_SUGGESTION_COUNT)
      .map((tool) => ({
        tool,
        score: 0,
        reasonFr: "fréquent pour ce besoin",
        reasonEn: "commonly used for this need",
      }));
  }, [
    activeMoment,
    selectedIds,
    selectedTools,
    session.complementarySpecialties,
    session.persona,
    session.primarySpecialty,
    tools,
  ]);
  const activeMomentSuggestions = useMemo(
    () => activeMomentSuggestionItems.map((item) => item.tool),
    [activeMomentSuggestionItems]
  );
  const visibleMomentSuggestions = expandedSuggestionMomentIds.includes(activeMoment.id)
    ? activeMomentSuggestions
    : activeMomentSuggestions.slice(0, CREATIVE_VISIBLE_SUGGESTION_COUNT);
  const hiddenSuggestionCount = Math.max(
    0,
    activeMomentSuggestions.length - visibleMomentSuggestions.length
  );
  const activeSuggestionReasons = useMemo(
    () => new Map(activeMomentSuggestionItems.map((item) => [item.tool.id, t(item.reasonFr, item.reasonEn)])),
    [activeMomentSuggestionItems, t]
  );
  const activeAiSuggestions = useMemo(() => {
    const preferredIds = [
      "chatgpt",
      "claude",
      "firefly",
      "midjourney",
      "krea-ai",
      "runway",
      "adobe-enhance-speech",
    ];
    const contextualIds =
      CREATIVE_AI_SUGGESTION_IDS_BY_MOMENT[
        activeMoment.creativeQuestion?.id || activeMoment.id
      ] || [];
    const contextualRank = new Map(contextualIds.map((id, index) => [id, index]));
    const needKeys = new Set(
      (activeMoment.creativeQuestion?.needKeys || []).map(normalize)
    );
    return tools
      .filter((tool) =>
        contextualRank.has(tool.id) ||
        tool.tool_type === "ia" ||
        Boolean(tool.ia_use_case)
      )
      .filter((tool) => !activeWorkflowUsage.aiToolIds.includes(tool.id))
      .map((tool) => {
        const sharedNeeds = (tool.functional_needs || [])
          .map(normalize)
          .filter((need) => needKeys.has(need)).length;
        const preferredRank = preferredIds.indexOf(tool.id);
        const contextRank = contextualRank.get(tool.id);
        return {
          tool,
          score:
            sharedNeeds * 35 +
            (contextRank != null ? 90 - contextRank * 5 : 0) +
            (preferredRank >= 0 ? 18 - preferredRank : 0),
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
      .slice(0, 8)
      .map((item) => item.tool);
  }, [
    activeMoment.creativeQuestion?.id,
    activeMoment.creativeQuestion?.needKeys,
    activeMoment.id,
    activeWorkflowUsage.aiToolIds,
    tools,
  ]);
  const activeAiCapabilityOptions = useMemo(
    () => aiCapabilityOptionsForObjective(
      activeMoment.id,
      activeMoment.creativeQuestion?.needKeys || []
    ),
    [activeMoment.creativeQuestion?.needKeys, activeMoment.id]
  );
  const activeIntegratedAiTools = useMemo(
    () => activeMoment.selected.filter((tool) =>
      ["core", "metier", "gestion", "specialise"].includes(tool.tool_type)
    ),
    [activeMoment.selected]
  );
  const activeAiActors = useMemo(() => {
    if ((activeWorkflowUsage.aiActors || []).length > 0) {
      return activeWorkflowUsage.aiActors || [];
    }
    return activeWorkflowUsage.aiToolIds.map((toolId) =>
      createAiActor("external", toolId)
    );
  }, [activeWorkflowUsage.aiActors, activeWorkflowUsage.aiToolIds]);
  const usageExpansionTool = usageExpansionToolId
    ? selectedToolsById.get(usageExpansionToolId) || null
    : null;
  const additionalUsageMoments = useMemo(() => {
    if (session.persona !== "SOFIA" || !usageExpansionTool) return [];
    const existingUsages = new Set(toolUsageMap[usageExpansionTool.id] || []);
    return allStackMoments
      .filter(
        (moment) =>
          moment.id !== activeMoment.id &&
          !existingUsages.has(moment.id) &&
          Boolean(moment.creativeQuestion)
      )
      .map((moment) => ({
        moment,
        match: rankToolsForCreativeQuestion(
          moment.creativeQuestion!,
          [usageExpansionTool],
          creativeOutputIds,
          new Set([usageExpansionTool.id])
        )[0],
      }))
      .filter((item) => item.match?.tool.id === usageExpansionTool.id)
      .sort(
        (a, b) =>
          (b.moment.creativeQuestion?.priority || 0) -
          (a.moment.creativeQuestion?.priority || 0)
      )
      .slice(0, 4)
      .map((item) => item.moment);
  }, [
    activeMoment.id,
    allStackMoments,
    creativeOutputIds,
    session.persona,
    toolUsageMap,
    usageExpansionTool,
  ]);
  const coverageCount = momentCoverage.filter((moment) => moment.covered || moment.skipped).length;
  const coveredCount = momentCoverage.filter((moment) => moment.covered).length;
  const missingMoments = momentCoverage.filter((moment) => !moment.covered && !moment.skipped);
  const selectedInActiveMoment = activeMoment.selected.length;
  const hasActiveMethod =
    selectedInActiveMoment > 0 ||
    Boolean(activeWorkflowUsage.customMethod?.trim()) ||
    activeWorkflowUsage.method === "outsourced";
  const activeSelectedToolsById = useMemo(
    () => new Map(activeMoment.selected.map((tool) => [tool.id, tool])),
    [activeMoment.selected]
  );
  const mentionedToolsInMethod = useMemo(() => {
    const method = activeWorkflowUsage.customMethod?.trim() || "";
    if (!method) return [] as Tool[];
    const linkedToolIds = new Set(activeWorkflowUsage.toolIds);
    return allKnownTools
      .filter((tool) => !linkedToolIds.has(tool.id))
      .filter((tool) => !isCreativeCommercialContainer(tool))
      .filter((tool) => textMentionsTool(method, tool))
      .slice(0, 4);
  }, [
    activeWorkflowUsage.customMethod,
    activeWorkflowUsage.toolIds,
    allKnownTools,
  ]);
  const selectedMonthlyCostLabel = formatMonthlyTotal(selectedTools, t, commercialContracts);
  const pricingSummary = useMemo(
    () => getPricingCaptureSummary(selectedTools, commercialContracts),
    [commercialContracts, selectedTools]
  );
  const budgetBreakdown = useMemo(
    () => getMonthlyBudgetBreakdown(selectedTools, commercialContracts),
    [commercialContracts, selectedTools]
  );
  const commercialReviewTools = useMemo(() => {
    const featureIds = new Set(
      workflowUsages.flatMap((usage) =>
        (usage.aiActors || []).flatMap((actor) =>
          actor.featureToolId ? [actor.featureToolId] : []
        )
      )
    );
    const featureTools = tools.filter((tool) => featureIds.has(tool.id));
    return [...selectedTools, ...featureTools].filter(
      (tool, index, list) =>
        list.findIndex((candidate) => candidate.id === tool.id) === index
    );
  }, [selectedTools, tools, workflowUsages]);
  const aiAllowanceFamilyIds = useMemo(() => {
    const knownById = new Map(allKnownTools.map((tool) => [tool.id, tool]));
    const familyIds = new Set<string>();
    workflowUsages.forEach((usage) => {
      (usage.aiActors || []).forEach((actor) => {
        const hasUsageConstraint = (actor.constraints || []).some((constraint) =>
          constraint === "credits" || constraint === "quota"
        );
        const commercialTool = actor.featureToolId
          ? knownById.get(actor.featureToolId)
          : actor.toolId
            ? knownById.get(actor.toolId)
            : undefined;
        const hasVariableCatalogModel = commercialTool
          ? ["credits", "usage_based"].includes(
              commercialTool.pricing_v5?.billing_model || ""
            )
          : false;
        if (commercialTool && (hasUsageConstraint || hasVariableCatalogModel)) {
          familyIds.add(commercialFamilyId(commercialTool));
        }
      });
    });
    return [...familyIds];
  }, [allKnownTools, workflowUsages]);
  const commercialAccessToClarify = useMemo(() => {
    const toolsByFamily = new Map<string, string[]>();
    commercialReviewTools.forEach((tool) => {
      const familyId = commercialFamilyId(tool);
      toolsByFamily.set(familyId, [...(toolsByFamily.get(familyId) || []), tool.id]);
    });
    return [...toolsByFamily.entries()].filter(([familyId, productIds]) => {
      const coveredIds = new Set(
        commercialContracts
          .filter((contract) => contract.familyId === familyId && contract.confirmed)
          .flatMap((contract) => contract.productIds)
      );
      const familyContracts = commercialContracts.filter(
        (candidate) => candidate.familyId === familyId
      );
      const allowanceNeedsClarification =
        aiAllowanceFamilyIds.includes(familyId) &&
        !familyContracts.some((contract) =>
          Boolean(contract.aiAllowanceStatus) &&
          contract.aiAllowanceStatus !== "unknown" &&
          (
            contract.aiAllowanceStatus !== "extra_purchases" ||
            contract.variableMonthlyPrice !== undefined
          )
        );
      return (
        productIds.some((productId) => !coveredIds.has(productId)) ||
        allowanceNeedsClarification
      );
    }).length;
  }, [aiAllowanceFamilyIds, commercialContracts, commercialReviewTools]);
  const mobileBudgetLabel = commercialAccessToClarify > 0
    ? t("Contrats à regrouper", "Contracts to group")
    : selectedMonthlyCostLabel;
  const coverageRatio = stackMoments.length > 0 ? coverageCount / stackMoments.length : 0;
  const coverageConfidence: NonNullable<SessionState["selectionCoverage"]>["confidence"] =
    session.persona === "SOFIA"
      ? coverageRatio >= 0.85 && skippedMomentIds.size <= 2
        ? "high"
        : coverageRatio >= 0.5
          ? "medium"
          : "low"
      : coveredCount >= 7 ? "high" : coveredCount >= 4 ? "medium" : "low";

  useEffect(() => {
    const nextCoverage = {
      covered: Array.from(completedMomentIds),
      skipped: Array.from(skippedMomentIds),
      confidence: coverageConfidence,
    };
    const snapshot = JSON.stringify({
      selectedTools: selectedTools.map((tool) => ({
        id: tool.id,
        selectedOffer: tool.selectedOffer,
        price: tool.price,
        priceCurrency: tool.priceCurrency,
        selectedPriceIsEstimate: tool.selectedPriceIsEstimate,
      })),
      toolUsageMap,
      workflowUsages,
      commercialContracts,
      selectionCoverage: nextCoverage,
    });
    if (snapshot === lastSyncedSnapshotRef.current) return;
    lastSyncedSnapshotRef.current = snapshot;
    onUpdate({
      selectedTools,
      toolUsageMap,
      workflowUsages,
      commercialContracts,
      selectionCoverage: nextCoverage,
    });
  }, [
    completedMomentIds,
    coverageConfidence,
    commercialContracts,
    onUpdate,
    selectedTools,
    skippedMomentIds,
    toolUsageMap,
    workflowUsages,
  ]);

  useEffect(() => {
    if (stackMoments.some((moment) => moment.id === activeMomentId)) return;
    if (stackMoments[0]) setActiveMomentId(stackMoments[0].id);
  }, [activeMomentId, stackMoments]);

  useEffect(() => {
    setSearch("");
    setShowCatalog(false);
    setCustomName("");
    setCustomToolType(activeCustomDefaultType);
    setCustomRelationKind(activeSourceToolId ? "plugin_of" : "");
    setCustomRelatedToolId(activeSourceToolId);
    setUsageExpansionToolId(null);
    const focusTimer = window.setTimeout(() => questionRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [activeCustomDefaultType, activeMomentId, activeSourceToolId]);

  useEffect(() => {
    if (!lastConfirmedToolId) return undefined;
    const timer = window.setTimeout(() => setLastConfirmedToolId(null), 1400);
    return () => window.clearTimeout(timer);
  }, [lastConfirmedToolId]);

  useEffect(() => {
    if (!feedAnimation) return undefined;
    const timer = window.setTimeout(() => setFeedAnimation(null), 760);
    return () => window.clearTimeout(timer);
  }, [feedAnimation]);

  const setToolUsageForMoment = (toolId: string, momentId: string, enabled: boolean) => {
    setToolUsageMap((current) => {
      const usages = new Set(current[toolId] || []);
      if (enabled) usages.add(momentId);
      else usages.delete(momentId);
      const next = { ...current };
      if (usages.size > 0) next[toolId] = [...usages];
      else delete next[toolId];
      return next;
    });
    const objective = allStackMoments.find((moment) => moment.id === momentId);
    if (!objective) return;
    setWorkflowUsages((current) => {
      const usage = getWorkflowUsage(current, objective);
      const toolIds = new Set(usage.toolIds);
      if (enabled) toolIds.add(toolId);
      else toolIds.delete(toolId);
      const nextToolIds = [...toolIds];
      return upsertWorkflowUsage(current, objective, {
        toolIds: nextToolIds,
        method: inferWorkflowMethod(nextToolIds, usage.customMethod),
        aiToolIds: enabled
          ? usage.aiToolIds
          : usage.aiToolIds.filter((id) => id !== toolId),
      });
    });
  };

  const updateActiveWorkflowUsage = (patch: Partial<WorkflowUsage>) => {
    setWorkflowUsages((current) =>
      upsertWorkflowUsage(current, activeMoment, patch)
    );
  };

  const markManualMethod = () => {
    updateActiveWorkflowUsage({
      method: "manual",
      customMethod: t("À la main, sans logiciel dédié", "Manually, without a dedicated tool"),
    });
    setSkippedMomentIds((current) => {
      const next = new Set(current);
      next.delete(activeMoment.id);
      return next;
    });
  };

  const addToolImmediately = (
    tool: Tool,
    source: "suggestion" | "search" | "ai" | "method" = "suggestion",
    asAiTool = false
  ) => {
    if (selectedTools.some((item) => item.id === tool.id)) {
      setToolUsageForMoment(tool.id, activeMoment.id, true);
      if (asAiTool) {
        const aiToolIds = [...new Set([...activeWorkflowUsage.aiToolIds, tool.id])];
        const actorSource = activeWorkflowUsage.aiMode === "automated"
          ? "automation"
          : "external";
        const aiActors = upsertAiActor(
          activeAiActors,
          createAiActor(actorSource, tool.id)
        );
        updateActiveWorkflowUsage({
          aiMode: resolveAiCaptureMode(activeWorkflowUsage.aiMode, aiActors),
          aiToolIds,
          aiActors,
        });
      }
      return;
    }

    const sourceElement = document.querySelector<HTMLElement>(`[data-stack-tool-card-id="${tool.id}"]`);
    const targetElement = stackDropRef.current;
    const sourceRect = sourceElement?.getBoundingClientRect();
    const targetRect = targetElement?.getBoundingClientRect();
    const selectedTool = withDeferredCommercialAccess(tool, selectedTools);

    setSelectedTools((current) => [...current, selectedTool]);
    setToolUsageForMoment(tool.id, activeMoment.id, true);
    setSkippedMomentIds((current) => {
      const next = new Set(current);
      next.delete(activeMoment.id);
      return next;
    });
    if (asAiTool) {
      const aiToolIds = [...new Set([...activeWorkflowUsage.aiToolIds, tool.id])];
      const actorSource = activeWorkflowUsage.aiMode === "automated"
        ? "automation"
        : "external";
      const aiActors = upsertAiActor(
        activeAiActors,
        createAiActor(actorSource, tool.id)
      );
      updateActiveWorkflowUsage({
        aiMode: resolveAiCaptureMode(activeWorkflowUsage.aiMode, aiActors),
        aiToolIds,
        aiActors,
      });
    } else if (session.persona === "SOFIA") {
      setUsageExpansionToolId(tool.id);
    }
    setLastConfirmedToolId(tool.id);
    if (sourceRect && targetRect) {
      setFeedAnimation({
        id: `${tool.id}-${Date.now()}`,
        tool: selectedTool,
        fromX: sourceRect.left + sourceRect.width / 2,
        fromY: sourceRect.top + 34,
        toX: targetRect.left + targetRect.width / 2,
        toY: targetRect.top + targetRect.height / 2,
      });
    }
    onTrack?.("selector_tool_added", {
      tool_id: tool.id,
      tool_name: tool.name,
      moment_id: activeMoment.id,
      source,
      commercial_access: selectedTool.selectedOffer,
      selected_count: selectedTools.length + 1,
    });
  };

  const toggleTool = (tool: Tool, source: "suggestion" | "search" | "review" | "companion" = "suggestion") => {
    const alreadySelected = selectedTools.some((item) => item.id === tool.id);
    if (alreadySelected) {
      if (session.persona === "SOFIA" && source !== "review" && source !== "companion") {
        const alreadyUsedHere = (toolUsageMap[tool.id] || []).includes(activeMoment.id);
        setToolUsageForMoment(tool.id, activeMoment.id, !alreadyUsedHere);
        setLastConfirmedToolId(alreadyUsedHere ? null : tool.id);
        setUsageExpansionToolId(alreadyUsedHere ? null : tool.id);
        onTrack?.(alreadyUsedHere ? "selector_tool_usage_removed" : "selector_tool_usage_added", {
          tool_id: tool.id,
          tool_name: tool.name,
          moment_id: activeMoment.id,
          source,
          selected_count: selectedTools.length,
        });
        return;
      }
      setToolUsageMap((current) => {
        const next = { ...current };
        delete next[tool.id];
        return next;
      });
      setWorkflowUsages((current) =>
        current.map((usage) => ({
          ...usage,
          toolIds: usage.toolIds.filter((toolId) => toolId !== tool.id),
          aiToolIds: usage.aiToolIds.filter((toolId) => toolId !== tool.id),
          aiActors: (usage.aiActors || []).filter((actor) => actor.toolId !== tool.id),
          method: inferWorkflowMethod(
            usage.toolIds.filter((toolId) => toolId !== tool.id),
            usage.customMethod
          ),
        }))
      );
      setCommercialContracts((current) =>
        current.map((contract) => ({
          ...contract,
          productIds: contract.productIds.filter((toolId) => toolId !== tool.id),
        }))
      );
      onTrack?.("selector_tool_removed", {
        tool_id: tool.id,
        tool_name: tool.name,
        moment_id: activeMoment.id,
        source,
        selected_count: Math.max(selectedTools.length - 1, 0),
      });
      setSelectedTools((current) => current.filter((item) => item.id !== tool.id));
      return;
    }

    addToolImmediately(
      tool,
      source === "search" ? "search" : "suggestion"
    );
  };

  const updateSelectedTool = (toolId: string, patch: Partial<Tool>) => {
    setSelectedTools((prev) => prev.map((tool) => tool.id === toolId ? { ...tool, ...patch } : tool));
  };

  const addCustomTool = () => {
    const name = customName.trim();
    if (name.length < 2) return;
    const price = 0;
    const customTool = withDeferredCommercialAccess(
      makeCustomTool(
        name,
        price,
        activeMoment,
        "EUR",
        customToolType,
        customRelationKind || undefined,
        customRelatedToolId || undefined
      ),
      selectedTools
    );
    setSelectedTools((prev) => [...prev, customTool]);
    if (session.persona === "SOFIA") setToolUsageForMoment(customTool.id, activeMoment.id, true);
    if (session.persona === "SOFIA") setUsageExpansionToolId(customTool.id);
    setLastConfirmedToolId(customTool.id);
    onTrack?.("selector_custom_tool_added", {
      tool_name: name,
      moment_id: activeMoment.id,
      price,
      currency: "EUR",
      tool_type: customToolType,
      relation_kind: customRelationKind || undefined,
      related_tool_id: customRelatedToolId || undefined,
    });
    setCustomName("");
    setSearch("");
  };

  const confirmAdditionalUsage = (moment: StackMoment) => {
    if (!usageExpansionTool) return;
    setToolUsageForMoment(usageExpansionTool.id, moment.id, true);
    setCompletedMomentIds((current) => new Set(current).add(moment.id));
    setSkippedMomentIds((current) => {
      const next = new Set(current);
      next.delete(moment.id);
      return next;
    });
    onTrack?.("selector_tool_usage_added", {
      tool_id: usageExpansionTool.id,
      tool_name: usageExpansionTool.name,
      moment_id: moment.id,
      source: "usage_expansion",
      selected_count: selectedTools.length,
    });
  };

  const handleNext = () => {
    onTrack?.("selector_review_confirmed", {
      selected_count: selectedTools.length,
      covered_count: coveredCount,
      skipped_count: skippedMomentIds.size,
      confidence: coverageConfidence,
      pricing_unknown_count: pricingSummary.unknownModeCount,
      pricing_estimate_count: pricingSummary.estimateCount,
      pricing_missing_currency_count: pricingSummary.missingCurrencyCount,
    });
    onUpdate({
      selectedTools,
      toolUsageMap,
      workflowUsages,
      commercialContracts,
      selectionCoverage: {
        covered: momentCoverage.filter((moment) => moment.covered).map((moment) => moment.id),
        skipped: Array.from(skippedMomentIds),
        confidence: coverageConfidence,
      },
    });
    onNext();
  };

  const moveToNextMoment = () => {
    const nextCompleted = new Set(completedMomentIds);
    nextCompleted.add(activeMoment.id);
    setCompletedMomentIds(nextCompleted);
    onTrack?.("selector_moment_next", {
      moment_id: activeMoment.id,
      selected_in_moment: selectedInActiveMoment,
      selected_count: selectedTools.length,
      covered_count: coveredCount,
    });
    const next = nextMomentId(stackMoments, nextCompleted, skippedMomentIds, activeMoment.id);
    if (next) {
      setActiveMomentId(next);
    } else {
      openReview("all_moments_checked");
    }
  };

  const skipActiveMoment = () => {
    const nextSkipped = new Set(skippedMomentIds);
    nextSkipped.add(activeMoment.id);
    const nextCompleted = new Set(completedMomentIds);
    nextCompleted.delete(activeMoment.id);
    setCompletedMomentIds(nextCompleted);
    onTrack?.("selector_moment_skipped", {
      moment_id: activeMoment.id,
      selected_count: selectedTools.length,
      skipped_count: nextSkipped.size,
    });
    setSkippedMomentIds(nextSkipped);
    const next = nextMomentId(stackMoments, nextCompleted, nextSkipped, activeMoment.id);
    if (next) {
      setActiveMomentId(next);
    } else {
      openReview("all_moments_checked");
    }
  };

  const openReview = (reason: string) => {
    onTrack?.("selector_review_opened", {
      reason,
      selected_count: selectedTools.length,
      covered_count: coveredCount,
      missing_count: missingMoments.length,
    });
    setReviewMode(true);
  };

  const toggleSearchPanel = () => {
    const next = !showCatalog;
    setShowCatalog(next);
    if (next) {
      onTrack?.("selector_manual_tool_opened", {
        moment_id: activeMoment.id,
        selected_count: selectedTools.length,
      });
    }
  };

  const toolName = fromTool
    ? fromTool.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : null;

  if (reviewMode) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-3 text-center">
          <p className="inline-flex rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase text-primary">
            {t("Dernière vérification", "Final check")}
          </p>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            {t("Voilà ce que j’ai compris de ta stack.", "Here is what I understood about your stack.")}
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            {t(
              "Vérifie les usages compris, puis précise les contrats une seule fois par écosystème.",
              "Check the understood uses, then clarify contracts once per ecosystem."
            )}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <ReviewMetric label={t("Outils retenus", "Selected tools")} value={String(selectedTools.length)} />
          <ReviewMetric label={t("Zones vérifiées", "Checked areas")} value={`${coverageCount}/${stackMoments.length}`} />
          <ReviewMetric
            label={t("Confiance", "Confidence")}
            value={coverageConfidence === "high" ? t("Forte", "High") : coverageConfidence === "medium" ? t("Moyenne", "Medium") : t("À affiner", "Low")}
          />
          <ReviewMetric
            label={t("Contrats à préciser", "Contracts to clarify")}
            value={String(commercialAccessToClarify)}
          />
        </div>

        <CommercialAccessReview
          tools={commercialReviewTools}
          contracts={commercialContracts}
          aiAllowanceFamilyIds={aiAllowanceFamilyIds}
          onChange={setCommercialContracts}
          t={t}
        />

        <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground">{t("Zones de travail", "Work areas")}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {momentCoverage.map((moment) => {
                const Icon = moment.Icon;
                const usage = getWorkflowUsage(workflowUsages, moment);
                const aiSummary = (usage.aiActors || []).map((actor) => {
                  const hostName = actor.toolId
                    ? selectedToolsById.get(actor.toolId)?.name || actor.toolId
                    : t("Automatisation", "Automation");
                  const actorName = actor.featureName
                    ? `${actor.featureName} · ${hostName}`
                    : hostName;
                  const capabilityLabels = actor.capabilityIds
                    .slice(0, 2)
                    .map((capabilityId) => {
                      const capability = aiCapabilityLabel(capabilityId);
                      return t(capability.labelFr, capability.labelEn);
                    });
                  return capabilityLabels.length > 0
                    ? `${actorName}: ${capabilityLabels.join(", ")}`
                    : actorName;
                }).join(" · ");
                const methodSummary = [
                  usage.customMethod,
                  aiSummary || (
                    usage.aiMode !== "unknown" && usage.aiMode !== "none"
                      ? t("avec IA", "with AI")
                      : ""
                  ),
                ].filter(Boolean).join(" · ");
                return (
                  <button
                    key={moment.id}
                    type="button"
                    onClick={() => {
                      setActiveMomentId(moment.id);
                      setReviewMode(false);
                      onTrack?.("selector_review_area_reopened", {
                        moment_id: moment.id,
                        covered: moment.covered,
                        skipped: moment.skipped,
                      });
                    }}
                    className="flex min-h-12 items-center gap-3 rounded-lg border border-border px-3 text-left text-sm hover:border-primary/40"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-foreground">{t(moment.fr, moment.en)}</span>
                      {methodSummary && (
                        <span className="block truncate text-[11px] text-muted-foreground">{methodSummary}</span>
                      )}
                    </span>
                    {moment.covered ? (
                      <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{moment.selected.length}</span>
                    ) : moment.skipped ? (
                      <span className="text-xs text-muted-foreground">{t("ignorée", "skipped")}</span>
                    ) : (
                      <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">{t("à vérifier", "check")}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground">{t("Ajuster les outils et leur fréquence", "Adjust tools and frequency")}</p>
            {selectedTools.length === 0 ? (
              <p className="mt-4 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                {t("Aucun outil pour l’instant.", "No tool yet.")}
              </p>
            ) : (
              <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {selectedTools.map((tool) => (
                  <SelectedToolRow
                    key={tool.id}
                    tool={tool}
                    onRemove={() => toggleTool(tool, "review")}
                    onUpdate={(patch) => updateSelectedTool(tool.id, patch)}
                    t={t}
                  />
                ))}
              </div>
            )}
            {missingMoments.length > 0 && (
              <div className="mt-5 rounded-lg bg-muted/50 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {t("Zones encore non vérifiées", "Areas not checked yet")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {missingMoments.slice(0, 4).map((moment) => t(moment.fr, moment.en)).join(", ")}
                  {missingMoments.length > 4 ? "..." : ""}
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                onTrack?.("selector_review_back_to_edit", {
                  selected_count: selectedTools.length,
                  missing_count: missingMoments.length,
                });
                setReviewMode(false);
              }}
              className="h-11 rounded-md border border-border px-5 text-sm font-medium text-foreground hover:bg-muted"
            >
              {t("Ajouter un oubli", "Add something missing")}
            </button>
            {!showDeferredMoments && deferredMoments.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setExpandedMomentIds([
                    ...stackMoments.map((moment) => moment.id),
                    ...deferredMoments.map((moment) => moment.id),
                  ]);
                  setShowDeferredMoments(true);
                  setActiveMomentId(deferredMoments[0].id);
                  setReviewMode(false);
                  onTrack?.("selector_deferred_areas_opened", {
                    deferred_count: deferredMoments.length,
                    selected_count: selectedTools.length,
                  });
                }}
                className="h-11 rounded-md border border-border px-5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {t(
                  `Vérifier aussi ${deferredMoments.length} zones secondaires`,
                  `Also check ${deferredMoments.length} secondary areas`
                )}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleNext}
            disabled={selectedTools.length === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            {t("Confirmer et continuer", "Confirm and continue")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-32">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {t("Cartographie de l’existant", "Mapping your current stack")}
          </p>
          {toolName && (
            <p className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              {t(`On part de ${toolName}`, `Starting from ${toolName}`)}
            </p>
          )}
        </div>
        {onPrev && (
          <button
            type="button"
            onClick={onPrev}
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {session.persona === "SOFIA"
              ? t("Modifier mes productions", "Edit my outputs")
              : t("Modifier mon profil", "Edit my profile")}
          </button>
        )}
      </div>

      <section className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0">
          <StackMomentStepper
            moments={momentCoverage}
            activeMomentId={activeMoment.id}
            onSelect={(moment) => {
              setActiveMomentId(moment.id);
              onTrack?.("selector_moment_stepper_clicked", {
                moment_id: moment.id,
                covered: moment.covered,
                skipped: moment.skipped,
                selected_count: selectedTools.length,
              });
            }}
            t={t}
          />

          <div
            key={activeMoment.id}
            className="relative mt-7 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
          >
            <p className="mb-3 text-sm font-semibold text-primary">
              {t("Comment tu atteins cet objectif aujourd’hui", "How you achieve this objective today")}
            </p>
            <h2
              ref={questionRef}
              tabIndex={-1}
              className="max-w-3xl text-3xl font-bold leading-[1.08] text-foreground outline-none md:text-[2.65rem]"
            >
              {t(activeMoment.questionFr, activeMoment.questionEn)}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              {t(activeMoment.hintFr, activeMoment.hintEn)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t(
                "Sélectionne tout ce qui aide réellement ; les usages atypiques et méthodes manuelles sont bienvenus.",
                "Select everything that genuinely helps; unusual uses and manual methods are welcome."
              )}
            </p>
            {!showDeferredMoments && deferredMoments.length > 0 && (
              <p className="mt-2 text-xs font-medium text-primary">
                {t(
                  `${deferredMoments.length} zones secondaires sont gardées pour la vérification finale.`,
                  `${deferredMoments.length} secondary areas are saved for the final check.`
                )}
              </p>
            )}
          </div>

          {session.persona === "SOFIA" && (
            <WorkflowMethodInput
              usage={activeWorkflowUsage}
              mentionedTools={mentionedToolsInMethod}
              onMethodChange={(customMethod) =>
                updateActiveWorkflowUsage({
                  customMethod,
                  method: inferWorkflowMethod(
                    activeWorkflowUsage.toolIds,
                    customMethod
                  ),
                })
              }
              onLinkTool={(tool) => addToolImmediately(tool, "method")}
              t={t}
            />
          )}

          <div className="mt-6 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="diagnostic-stack-search"
                name="stack-search"
                type="text"
                value={search}
                onChange={(event) => {
                  if (!search.trim()) {
                    onTrack?.("selector_search_opened", {
                      moment_id: activeMoment.id,
                      selected_count: selectedTools.length,
                    });
                  }
                  setSearch(event.target.value);
                }}
                placeholder={t(
                  "Chercher un outil utilisé dans cette étape…",
                  "Search for a tool used in this step…"
                )}
                className="h-12 w-full border-0 border-b border-border bg-transparent pl-10 pr-10 text-sm outline-none transition-colors focus:border-foreground"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                  aria-label={t("Effacer", "Clear")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {search.trim() && (
              filteredTools.length > 0 ? (
	                <ToolGrid
	                  title={t("Résultats", "Results")}
	                  tools={filteredTools.slice(0, session.persona === "SOFIA" ? CREATIVE_MAX_SUGGESTION_COUNT : 8)}
	                  selectedToolsById={selectedToolsById}
	                  activeSelectedToolsById={activeSelectedToolsById}
	                  onToggle={(tool) => toggleTool(tool, "search")}
                  t={t}
                />
              ) : (
                <NoSearchResult
                  query={search}
                  onOpenManual={() => {
                    setCustomName(search.trim());
                    setShowCatalog(true);
                    onTrack?.("selector_manual_tool_prefilled", {
                      moment_id: activeMoment.id,
                      query: search.trim(),
                    });
                  }}
                  t={t}
                />
              )
            )}
          </div>

          {!search.trim() && (
            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                {t(
                  "Exemples fréquents — ta méthode peut être différente",
                  "Common examples — your method may be different"
                )}
              </p>
              <div className="divide-y divide-border border-y border-border">
                {visibleMomentSuggestions.length > 0 ? visibleMomentSuggestions.map((tool) => (
                  <ToolChoiceButton
                    key={tool.id}
                    tool={tool}
                    selectedTool={activeSelectedToolsById.get(tool.id)}
                    reason={activeSuggestionReasons.get(tool.id)}
                    onToggle={() => toggleTool(tool, "suggestion")}
                    t={t}
                  />
                )) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground sm:col-span-2">
                    {t("Je n'ai pas de suggestion forte ici. Recherche ton outil ou ajoute-le manuellement.", "No strong suggestion here. Search your tool or add it manually.")}
                  </div>
                )}
              </div>
              {usageExpansionTool && additionalUsageMoments.length > 0 && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {t(
                      `Tu utilises aussi ${usageExpansionTool.name} pour…`,
                      `You also use ${usageExpansionTool.name} for…`
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(
                      "Confirme les autres usages sans ajouter l’outil une deuxième fois.",
                      "Confirm other uses without adding the tool twice."
                    )}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {additionalUsageMoments.map((moment) => (
                      <button
                        key={moment.id}
                        type="button"
                        onClick={() => confirmAdditionalUsage(moment)}
                        className="rounded-full border border-primary/25 bg-background px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/50"
                      >
                        {t(moment.fr, moment.en)}
                      </button>
                ))}
              </div>
              {hiddenSuggestionCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setExpandedSuggestionMomentIds((current) => [
                      ...current,
                      activeMoment.id,
                    ]);
                    onTrack?.("selector_more_suggestions_opened", {
                      moment_id: activeMoment.id,
                      hidden_count: hiddenSuggestionCount,
                    });
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t(
                    `Voir ${hiddenSuggestionCount} autre${hiddenSuggestionCount > 1 ? "s" : ""} option${hiddenSuggestionCount > 1 ? "s" : ""}`,
                    `See ${hiddenSuggestionCount} more option${hiddenSuggestionCount > 1 ? "s" : ""}`
                  )}
                </button>
              )}
                </div>
              )}
              {session.persona === "SOFIA" && (
                <WorkflowReflectionPanel
                  usage={activeWorkflowUsage}
                  aiActors={activeAiActors}
                  integratedTools={activeIntegratedAiTools}
                  selectedAiTools={selectedTools.filter((tool) =>
                    activeWorkflowUsage.aiToolIds.includes(tool.id)
                  )}
                  aiSuggestions={activeAiSuggestions}
                  capabilityOptions={activeAiCapabilityOptions}
                  toolsById={selectedToolsById}
                  allTools={tools}
                  objectiveNeedKeys={activeMoment.creativeQuestion?.needKeys || []}
                  onAiModeChange={(aiMode) => {
                    const aiToolIds =
                      aiMode === "none" || aiMode === "integrated"
                        ? []
                        : activeWorkflowUsage.aiToolIds;
                    const externalToolIdsToDetach =
                      aiMode === "none" || aiMode === "integrated"
                        ? activeWorkflowUsage.aiToolIds
                        : [];
                    const aiActors = reconcileAiActorsForMode(
                      aiMode,
                      activeAiActors,
                      aiToolIds,
                      activeIntegratedAiTools.length === 1
                        ? activeIntegratedAiTools[0].id
                        : undefined
                    );
                    updateActiveWorkflowUsage({
                      aiMode,
                      aiToolIds,
                      aiActors,
                    });
                    externalToolIdsToDetach.forEach((toolId) =>
                      setToolUsageForMoment(toolId, activeMoment.id, false)
                    );
                  }}
                  onIntegratedToolToggle={(tool) => {
                    const id = aiActorId("integrated", tool.id);
                    const aiActors = activeAiActors.some((actor) => actor.id === id)
                      ? removeAiActor(activeAiActors, id)
                      : upsertAiActor(activeAiActors, createAiActor("integrated", tool.id));
                    updateActiveWorkflowUsage({
                      aiActors,
                      aiMode: resolveAiCaptureMode(activeWorkflowUsage.aiMode, aiActors),
                    });
                  }}
                  onActorChange={(actor) => {
                    const aiActors = upsertAiActor(activeAiActors, actor);
                    updateActiveWorkflowUsage({
                      aiActors,
                      aiMode: resolveAiCaptureMode(activeWorkflowUsage.aiMode, aiActors),
                      aiToolIds: [
                        ...new Set(
                          aiActors.flatMap((candidate) =>
                            candidate.source !== "integrated" && candidate.toolId
                              ? [candidate.toolId]
                              : []
                          )
                        ),
                      ],
                    });
                  }}
                  onSatisfactionChange={(satisfaction) =>
                    updateActiveWorkflowUsage({ satisfaction })
                  }
                  onAiToolToggle={(tool) => {
                    if (activeWorkflowUsage.aiToolIds.includes(tool.id)) {
                      const aiToolIds = activeWorkflowUsage.aiToolIds.filter(
                        (toolId) => toolId !== tool.id
                      );
                      const aiActors = activeAiActors.filter(
                        (actor) => actor.toolId !== tool.id
                      );
                      updateActiveWorkflowUsage({
                        aiToolIds,
                        aiActors,
                        aiMode: resolveAiCaptureMode(activeWorkflowUsage.aiMode, aiActors),
                      });
                      setToolUsageForMoment(tool.id, activeMoment.id, false);
                    } else {
                      addToolImmediately(tool, "ai", true);
                    }
                  }}
                  t={t}
                />
              )}
              {!hasActiveMethod && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={markManualMethod}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {t("Je le fais à la main / autrement", "I do it manually / another way")}
                  </button>
                  <button
                    type="button"
                    onClick={skipActiveMoment}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-card px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {t("Cette activité ne me concerne pas", "This activity doesn’t apply to me")}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-5">
            <button
              type="button"
              onClick={toggleSearchPanel}
              className="inline-flex items-center gap-2 text-left text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <span>{t("Je ne trouve pas mon outil", "I can’t find my tool")}</span>
              <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>

            {showCatalog && (
              <div className="mt-4 space-y-4">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    id="diagnostic-custom-tool"
                    name="custom-tool"
                    type="text"
                    value={customName}
                    onChange={(event) => setCustomName(event.target.value)}
                    placeholder={t("Ou ajoute un nom", "Or add a name")}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={addCustomTool}
                    disabled={customName.trim().length < 2}
                    className="diagnostic-primary-action inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                    {t("Ajouter", "Add")}
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t(
                    "Tooltrim déduira son rôle à partir de l’objectif actuel. Tu pourras préciser son contrat dans la vérification finale.",
                    "Tooltrim will infer its role from the current objective. You can clarify its contract in the final review."
                  )}
                </p>
              </div>
            )}
          </div>

          {(hasActiveMethod || (selectedTools.length > 0 && missingMoments.length === 0)) && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex flex-col gap-2 sm:flex-row">
              {selectedTools.length > 0 && missingMoments.length === 0 && (
                <button
                  type="button"
                  onClick={() => openReview("all_moments_checked")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  {t("Vérifier ma stack", "Check my stack")}
                </button>
              )}
              <button
                type="button"
                onClick={moveToNextMoment}
                disabled={!hasActiveMethod}
                className="diagnostic-primary-action inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-40"
              >
                {t("Zone suivante", "Next area")}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          )}
        </div>

        <StackCompanion
          selectedTools={selectedTools}
          budgetBreakdown={budgetBreakdown}
          commercialAccessToClarify={commercialAccessToClarify}
          coverageComplete={coverageCount >= stackMoments.length}
          highlightToolId={lastConfirmedToolId}
          stackDropRef={stackDropRef}
          onPricingReview={() => openReview("commercial_access")}
          onReview={() => openReview("stack_companion")}
          onRemove={(tool) => toggleTool(tool, "companion")}
          t={t}
        />
      </section>

      <StackFeedMotion animation={feedAnimation} />

      <MobileStackBar
        selectedTools={selectedTools}
        coveredCount={coverageCount}
        totalMoments={stackMoments.length}
        monthlyCostLabel={mobileBudgetLabel}
        onReview={() => openReview("mobile_stack_bar")}
        t={t}
      />
    </div>
  );
}

function WorkflowMethodInput({
  usage,
  mentionedTools,
  onMethodChange,
  onLinkTool,
  t,
}: {
  usage: WorkflowUsage;
  mentionedTools: Tool[];
  onMethodChange: (customMethod: string) => void;
  onLinkTool: (tool: Tool) => void;
  t: (fr: string, en: string) => string;
}) {
  return (
    <section className="mt-5 rounded-xl border border-border bg-card p-3">
      <label className="block">
        <span className="block text-sm font-semibold text-foreground">
          {t("Comment tu t’y prends, avec tes mots", "How you do it, in your own words")}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          {t(
            "Optionnel : décris un enchaînement, un bricolage ou un usage inhabituel. Tu peux aussi passer directement aux outils.",
            "Optional: describe a sequence, workaround, or unusual use. You can also go straight to the tools."
          )}
        </span>
        <input
          type="text"
          value={usage.customMethod || ""}
          onChange={(event) => onMethodChange(event.target.value)}
          placeholder={t(
            "Ex. devis dans InDesign, moodboard dans Illustrator, export puis retouche…",
            "E.g. quotes in InDesign, moodboards in Illustrator, export then retouch…"
          )}
          className="mt-3 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      {mentionedTools.length > 0 && (
        <span className="mt-3 block">
          <span className="block text-xs font-medium text-muted-foreground">
            {t("Tu as cité :", "You mentioned:")}
          </span>
          <span className="mt-2 flex flex-wrap gap-2">
            {mentionedTools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => onLinkTool(tool)}
                className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/50"
              >
                <Plus className="h-3.5 w-3.5" />
                {t(`Relier ${tool.name}`, `Link ${tool.name}`)}
              </button>
            ))}
          </span>
        </span>
      )}
    </section>
  );
}

function WorkflowReflectionPanel({
  usage,
  aiActors,
  integratedTools,
  selectedAiTools,
  aiSuggestions,
  capabilityOptions,
  toolsById,
  allTools,
  objectiveNeedKeys,
  onAiModeChange,
  onIntegratedToolToggle,
  onActorChange,
  onSatisfactionChange,
  onAiToolToggle,
  t,
}: {
  usage: WorkflowUsage;
  aiActors: AiWorkflowActor[];
  integratedTools: Tool[];
  selectedAiTools: Tool[];
  aiSuggestions: Tool[];
  capabilityOptions: AiCapabilityOption[];
  toolsById: Map<string, Tool>;
  allTools: Tool[];
  objectiveNeedKeys: readonly string[];
  onAiModeChange: (mode: AiContributionMode) => void;
  onIntegratedToolToggle: (tool: Tool) => void;
  onActorChange: (actor: AiWorkflowActor) => void;
  onSatisfactionChange: (satisfaction: NonNullable<WorkflowUsage["satisfaction"]>) => void;
  onAiToolToggle: (tool: Tool) => void;
  t: (fr: string, en: string) => string;
}) {
  const aiModes: Array<{
    value: AiContributionMode;
    fr: string;
    en: string;
  }> = [
    { value: "none", fr: "Sans IA", en: "No AI" },
    { value: "integrated", fr: "IA intégrée", en: "Built-in AI" },
    { value: "external", fr: "Outil IA séparé", en: "Separate AI tool" },
    { value: "mixed", fr: "Intégrée + séparée", en: "Built-in + separate" },
    { value: "automated", fr: "Chaîne / automatisation", en: "Chain / automation" },
  ];
  const showAiTools = ["external", "mixed", "automated"].includes(usage.aiMode);
  const showIntegratedTools = ["integrated", "mixed"].includes(usage.aiMode);
  const visibleActors = aiActors.filter((actor) => {
    if (usage.aiMode === "integrated") return actor.source === "integrated";
    if (usage.aiMode === "external") return actor.source === "external";
    if (usage.aiMode === "automated") return actor.source === "automation";
    return true;
  });

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      {(usage.toolIds.length > 0 || Boolean(usage.customMethod?.trim())) && (
        <div>
          <p className="text-xs font-semibold text-foreground">
            {t("Cette façon de faire te convient ?", "Does this way of working suit you?")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {([
              ["good", "Oui, très bien", "Yes, very well"],
              ["acceptable", "Ça fait le travail", "It gets the job done"],
              ["friction", "C’est pénible ou lent", "It’s awkward or slow"],
              ["blocked", "Ça me bloque vraiment", "It seriously blocks me"],
            ] as const).map(([value, fr, en]) => (
              <button
                key={value}
                type="button"
                aria-pressed={usage.satisfaction === value}
                onClick={() => onSatisfactionChange(value)}
                className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                  usage.satisfaction === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {t(fr, en)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`${
        usage.toolIds.length > 0 || Boolean(usage.customMethod?.trim())
          ? "mt-4 border-t border-border pt-4"
          : ""
      }`}>
        <p className="text-xs font-semibold text-foreground">
          {t("Est-ce que l’IA intervient ici ?", "Does AI play a role here?")}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {aiModes.map((mode) => (
            <button
              key={mode.value}
              type="button"
              aria-pressed={usage.aiMode === mode.value}
              onClick={() => onAiModeChange(mode.value)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                usage.aiMode === mode.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {t(mode.fr, mode.en)}
            </button>
          ))}
        </div>

        {showIntegratedTools && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">
              {t(
                "Dans quelle application la fonction IA est-elle utilisée ?",
                "Which application provides the built-in AI?"
              )}
            </p>
            {integratedTools.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {integratedTools.map((tool) => {
                  const selected = aiActors.some(
                    (actor) =>
                      actor.source === "integrated" &&
                      actor.toolId === tool.id
                  );
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onIntegratedToolToggle(tool)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:border-primary/35"
                      }`}
                    >
                      <ToolLogo tool={tool} size={20} className="rounded" />
                      {tool.name}
                      {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {t(
                  "Sélectionne d’abord l’application utilisée dans cette étape.",
                  "First select the application used in this step."
                )}
              </p>
            )}
          </div>
        )}

        {showAiTools && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">
              {t(
                "Quelles IA font réellement partie de cette étape ?",
                "Which AI tools are actually part of this step?"
              )}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...selectedAiTools, ...aiSuggestions]
                .filter(
                  (tool, index, list) =>
                    list.findIndex((candidate) => candidate.id === tool.id) === index
                )
                .map((tool) => {
                  const selected = usage.aiToolIds.includes(tool.id);
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onAiToolToggle(tool)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:border-primary/35"
                      }`}
                    >
                      <ToolLogo tool={tool} size={20} className="rounded" />
                      {tool.name}
                      {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {visibleActors.length > 0 && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <p className="text-xs font-semibold text-foreground">
              {t(
                "Que fait précisément l’IA dans cette étape ?",
                "What exactly does AI do in this step?"
              )}
            </p>
            {visibleActors.map((actor) => {
              const actorTool = actor.toolId ? toolsById.get(actor.toolId) : undefined;
              return (
                <AiActorEditor
                  key={actor.id}
                  actor={actor}
                  tool={actorTool}
                  capabilityOptions={capabilityOptions}
                  featureOptions={
                    actor.source === "integrated" && actorTool
                      ? integratedAiFeatureOptions(
                          actorTool,
                          allTools,
                          usage.objectiveId,
                          objectiveNeedKeys
                        )
                      : []
                  }
                  actorCount={visibleActors.length}
                  expandedByDefault={
                    visibleActors.length === 1 || actor.capabilityIds.length === 0
                  }
                  onChange={onActorChange}
                  t={t}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function AiActorEditor({
  actor,
  tool,
  capabilityOptions,
  featureOptions,
  actorCount,
  expandedByDefault,
  onChange,
  t,
}: {
  actor: AiWorkflowActor;
  tool?: Tool;
  capabilityOptions: AiCapabilityOption[];
  featureOptions: Tool[];
  actorCount: number;
  expandedByDefault: boolean;
  onChange: (actor: AiWorkflowActor) => void;
  t: (fr: string, en: string) => string;
}) {
  const [expanded, setExpanded] = useState(expandedByDefault);
  const previousActorCountRef = useRef(actorCount);
  useEffect(() => {
    if (previousActorCountRef.current !== actorCount) {
      previousActorCountRef.current = actorCount;
      setExpanded(expandedByDefault);
    }
  }, [actorCount, expandedByDefault]);
  const sourceCapabilityOptions =
    actor.source === "external" || (actor.source === "automation" && tool)
    ? aiCapabilityOptionsForTool(capabilityOptions, tool, actor.capabilityIds)
    : capabilityOptions;
  const actorCapabilityOptions = [
    ...(actor.source === "automation"
      ? [aiCapabilityLabel("automate_workflow")]
      : []),
    ...sourceCapabilityOptions,
    aiCapabilityLabel("other"),
  ].filter(
    (capability, index, options) =>
      options.findIndex((candidate) => candidate.id === capability.id) === index
  ).slice(0, 7);
  const frequencies: Array<{
    value: AiUsageFrequency;
    fr: string;
    en: string;
  }> = [
    { value: "occasional", fr: "Ponctuellement", en: "Occasionally" },
    { value: "regular", fr: "Régulièrement", en: "Regularly" },
    { value: "systematic", fr: "Presque toujours", en: "Almost every time" },
  ];
  const constraints: Array<{
    value: AiUsageConstraint;
    fr: string;
    en: string;
  }> = [
    { value: "none", fr: "Pas de limite notable", en: "No notable limit" },
    { value: "credits", fr: "Crédits payants", en: "Paid credits" },
    { value: "quota", fr: "Quota ou limite d’usage", en: "Quota or usage limit" },
    { value: "reliability", fr: "Résultat peu fiable", en: "Unreliable output" },
    { value: "privacy", fr: "Confidentialité", en: "Privacy" },
    { value: "rights", fr: "Droits ou propriété", en: "Rights or ownership" },
  ];
  const sourceLabel =
    actor.source === "integrated"
      ? t("Fonction intégrée", "Built-in feature")
      : actor.source === "external"
        ? t("Outil IA séparé", "Separate AI tool")
        : t("Chaîne automatisée", "Automated chain");
  const actorName = tool?.name || (
    actor.source === "automation"
      ? t("Automatisation de cette étape", "Automation for this step")
      : t("IA à préciser", "AI to clarify")
  );
  const displayName = actor.featureName
    ? `${actor.featureName} · ${actorName}`
    : actorName;
  const hasCapabilities = actor.capabilityIds.length > 0;

  return (
    <details
      open={expanded}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
      className="rounded-xl border border-border bg-background p-3"
    >
      <summary className="cursor-pointer list-none">
        <div className="flex items-center gap-3">
        {tool ? (
          <ToolLogo tool={tool} size={28} className="rounded-md" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Brain className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">{displayName}</p>
          <p className="text-[11px] text-muted-foreground">{sourceLabel}</p>
        </div>
        </div>
      </summary>

      {actor.source === "integrated" && featureOptions.length > 0 && (
        <div className="mt-3 rounded-lg bg-muted/35 p-3">
          <p className="text-[11px] font-semibold text-foreground">
            {t(
              "Si tu connais le nom de la fonction IA",
              "If you know the built-in AI feature"
            )}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {t(
              "On vérifiera son inclusion et ses éventuels crédits une seule fois à la fin.",
              "We will check its inclusion and possible credits once at the end."
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {featureOptions.map((feature) => {
              const selected = actor.featureToolId === feature.id;
              return (
                <button
                  key={feature.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    onChange(setAiActorFeature(actor, selected ? undefined : feature))
                  }
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {feature.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {actorCapabilityOptions.map((capability) => {
          const selected = actor.capabilityIds.includes(capability.id);
          return (
            <button
              key={capability.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(toggleAiCapability(actor, capability.id))}
              className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {t(capability.labelFr, capability.labelEn)}
            </button>
          );
        })}
      </div>

      {hasCapabilities && (
        <div className="mt-4 space-y-3 border-t border-border pt-3">
          <div>
            <p className="text-[11px] font-semibold text-foreground">
              {t("À quelle fréquence ?", "How often?")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {frequencies.map((frequency) => (
                <button
                  key={frequency.value}
                  type="button"
                  aria-pressed={actor.frequency === frequency.value}
                  onClick={() => onChange(setAiActorFrequency(actor, frequency.value))}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                    actor.frequency === frequency.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(frequency.fr, frequency.en)}
                </button>
              ))}
            </div>
          </div>

          <details>
            <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground hover:text-foreground">
              {t("Crédits, fiabilité, confidentialité ou droits ?", "Credits, reliability, privacy, or rights?")}
            </summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {constraints.map((constraint) => {
                const selected = (actor.constraints || []).includes(constraint.value);
                return (
                  <button
                    key={constraint.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange(toggleAiConstraint(actor, constraint.value))}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                      selected
                        ? "border-amber-400 bg-amber-50 text-amber-800"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t(constraint.fr, constraint.en)}
                  </button>
                );
              })}
            </div>
            <label className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={actor.handlesSensitiveData === true}
                onChange={(event) =>
                  onChange({
                    ...actor,
                    handlesSensitiveData: event.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-border"
              />
              {t(
                "Cette IA reçoit parfois des données client, personnelles ou confidentielles.",
                "This AI sometimes receives client, personal, or confidential data."
              )}
            </label>
          </details>
        </div>
      )}
    </details>
  );
}

function ToolChoiceButton({
  tool,
  selectedTool,
  onToggle,
  reason,
  t,
}: {
  tool: Tool;
  selectedTool?: Tool;
  onToggle: () => void;
  reason?: string;
  t: (fr: string, en: string) => string;
}) {
  const selected = Boolean(selectedTool);
  const displayTool = selectedTool || withDefaultOffer(tool);

  return (
    <div
      data-stack-tool-card-id={tool.id}
      data-pricing-tool-id={tool.id}
      tabIndex={-1}
      className={`group py-2 transition-all duration-200 sm:py-3 ${
        selected
          ? "bg-primary/5"
          : "hover:bg-muted/25"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        aria-label={t(`Utiliser ${displayTool.name} pour cet objectif`, `Use ${displayTool.name} for this objective`)}
        className="flex min-h-[48px] w-full items-center gap-3 px-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-[54px]"
      >
        <ToolLogo tool={displayTool} size={36} className="rounded-md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{displayTool.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {selected
              ? t("Utilisé pour cet objectif", "Used for this objective")
              : reason || t("Proposé pour cette question", "Suggested for this question")}
          </p>
        </div>
        {selected ? (
          <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary p-1.5 text-primary-foreground">
            <Check className="h-3.5 w-3.5" />
          </span>
        ) : (
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
            <Plus className="h-4 w-4" />
          </span>
        )}
      </button>

    </div>
  );
}

function StackMomentStepper({
  moments,
  activeMomentId,
  onSelect,
  t,
}: {
  moments: Array<StackMoment & { selected: Tool[]; covered: boolean; skipped: boolean }>;
  activeMomentId: string;
  onSelect: (moment: StackMoment & { selected: Tool[]; covered: boolean; skipped: boolean }) => void;
  t: (fr: string, en: string) => string;
}) {
  const activeIndex = Math.max(0, moments.findIndex((moment) => moment.id === activeMomentId));

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((activeIndex + 1) / moments.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{activeIndex + 1}/{moments.length}</span>
      </div>
      <nav
        className="mt-3 flex items-center gap-2 overflow-x-auto pb-1"
        aria-label={t("Étapes de capture de stack", "Stack capture steps")}
      >
        {moments.map((moment, index) => {
          const Icon = moment.Icon;
          const active = moment.id === activeMomentId;
          const done = moment.covered;
          const skipped = moment.skipped;
          const statusLabel = done
            ? t("remplie", "filled")
            : skipped
              ? t("marquée vide", "marked empty")
              : t("à vérifier", "to check");
          const stepLabel = `${index + 1}. ${t(moment.fr, moment.en)} · ${statusLabel}`;
          return (
            <button
              key={moment.id}
              type="button"
              onClick={() => onSelect(moment)}
              title={stepLabel}
              aria-current={active ? "step" : undefined}
              aria-label={stepLabel}
              className={`group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : done
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : skipped
                      ? "border-border bg-muted/50 text-muted-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {done && !active && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-2.5 w-2.5" />
                </span>
              )}
              {skipped && !done && !active && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground text-background">
                  <X className="h-2.5 w-2.5" />
                </span>
              )}
              <span className="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-background bg-background px-1 font-mono text-[9px] font-bold text-muted-foreground">
                {index + 1}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function StackCompanion({
  selectedTools,
  budgetBreakdown,
  commercialAccessToClarify,
  coverageComplete,
  highlightToolId,
  stackDropRef,
  onPricingReview,
  onReview,
  onRemove,
  t,
}: {
  selectedTools: Tool[];
  budgetBreakdown: ReturnType<typeof getMonthlyBudgetBreakdown>;
  commercialAccessToClarify: number;
  coverageComplete: boolean;
  highlightToolId?: string | null;
  stackDropRef: RefObject<HTMLDivElement>;
  onPricingReview: () => void;
  onReview: () => void;
  onRemove: (tool: Tool) => void;
  t: (fr: string, en: string) => string;
}) {
  const visibleTools = selectedTools.slice(-8);

  return (
    <aside className="hidden lg:sticky lg:top-24 lg:block">
      <div className="diagnostic-dark-panel overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-primary">
                {t("Ta stack", "Your stack")}
              </p>
              <h3 className="mt-1 text-lg font-bold text-foreground">
                {selectedTools.length === 0
                  ? t("Rien ajouté pour l’instant", "Nothing added yet")
                  : t("Ta sélection", "Your selection")}
              </h3>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--diag-yellow))] text-[hsl(var(--diag-ink))]">
              <Layers3 className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {selectedTools.length === 0
              ? t(
                  "Ajoute ce qui participe réellement à ton travail.",
                  "Add what genuinely plays a role in your work."
                )
              : t(
                  "Les contrats et les plans seront regroupés dans la vérification finale.",
                  "Contracts and plans will be grouped in the final review."
                )}
          </p>
        </div>

        <div className="space-y-4 p-4">
          <div className="rounded-2xl border border-border bg-background p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{t("Budget", "Budget")}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-foreground">
              ≈ {formatMonthlyEur(budgetBreakdown.confirmedEur, t)}
            </p>
            {commercialAccessToClarify > 0 && (
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {t(
                  "Les montants seront regroupés par contrat à la fin.",
                  "Amounts will be grouped by contract at the end."
                )}
              </p>
            )}
          </div>
          {commercialAccessToClarify > 0 && (
            <button
              type="button"
              onClick={onPricingReview}
              className="w-full rounded-2xl border border-[hsl(var(--diag-yellow))] bg-[hsl(var(--diag-yellow)/0.14)] px-3 py-2 text-left text-xs font-semibold text-[hsl(var(--diag-yellow))] transition-colors hover:bg-[hsl(var(--diag-yellow)/0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t(
                `${commercialAccessToClarify} contrat${commercialAccessToClarify > 1 ? "s" : ""} à préciser`,
                `${commercialAccessToClarify} contract${commercialAccessToClarify > 1 ? "s" : ""} to clarify`
              )}
            </button>
          )}

          {selectedTools.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background p-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                {t("Ajoute ton premier outil", "Add your first tool")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t("Le diagnostic devient plus précis à chaque ajout.", "The diagnostic gets sharper with every add.")}
              </p>
            </div>
          ) : (
            <div className="space-y-3" aria-live="polite">
              <div ref={stackDropRef} className="flex min-h-[38px] flex-wrap gap-2">
                {visibleTools.map((tool) => {
                  const highlighted = tool.id === highlightToolId;
                  return (
                  <div
                    key={tool.id}
                    className={`group relative animate-in zoom-in-95 duration-200 ${
                      highlighted ? "scale-[1.03] rounded-lg ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : ""
                    }`}
                    title={tool.name}
                  >
                    <ToolLogo
                      tool={tool}
                      size={38}
                      className={`rounded-lg border bg-background shadow-sm transition-colors ${
                        highlighted ? "border-primary/40 bg-primary/10" : "border-border"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => onRemove(tool)}
                      aria-label={t(`Retirer ${tool.name}`, `Remove ${tool.name}`)}
                      className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm group-hover:flex"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  );
                })}
                {selectedTools.length > visibleTools.length && (
                  <span className="flex h-[38px] items-center rounded-lg border border-border bg-background px-3 text-xs font-semibold text-muted-foreground">
                    +{selectedTools.length - visibleTools.length}
                  </span>
                )}
              </div>

              <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
                {selectedTools.slice(-5).map((tool) => {
                  const highlighted = tool.id === highlightToolId;
                  return (
                    <div
                      key={tool.id}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                        highlighted ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/40"
                      }`}
                    >
                      <ToolLogo tool={tool} size={24} className="rounded-md" />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{tool.name}</span>
                      <span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {tool.selectedOffer === "included"
                          ? t("inclus", "included")
                          : t("accès à préciser", "access later")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onReview}
            disabled={selectedTools.length === 0}
            className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-40 ${
              coverageComplete
                ? "bg-[hsl(var(--diag-yellow))] text-[hsl(var(--diag-ink))]"
                : "border border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            {t("Voir ma stack complète", "View full stack")}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function StackFeedMotion({ animation }: { animation: StackFeedAnimation | null }) {
  if (!animation) return null;

  const translateX = animation.toX - animation.fromX;
  const translateY = animation.toY - animation.fromY;

  return (
    <div
      key={animation.id}
      aria-hidden="true"
      className="pointer-events-none fixed z-[80] hidden h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-background shadow-2xl ring-4 ring-primary/15 lg:flex"
      style={{
        left: animation.fromX - 24,
        top: animation.fromY - 24,
        animation: "tooltrim-stack-feed 720ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
        ["--stack-feed-x" as string]: `${translateX}px`,
        ["--stack-feed-y" as string]: `${translateY}px`,
      }}
    >
      <ToolLogo tool={animation.tool} size={34} className="rounded-lg" />
      <style>{`
        @keyframes tooltrim-stack-feed {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) scale(0.82);
          }
          14% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
          72% {
            opacity: 1;
            transform: translate3d(calc(var(--stack-feed-x) * 0.88), calc(var(--stack-feed-y) * 0.88), 0) scale(0.72);
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--stack-feed-x), var(--stack-feed-y), 0) scale(0.42);
          }
        }
      `}</style>
    </div>
  );
}

function MobileStackBar({
  selectedTools,
  coveredCount,
  totalMoments,
  monthlyCostLabel,
  onReview,
  t,
}: {
  selectedTools: Tool[];
  coveredCount: number;
  totalMoments: number;
  monthlyCostLabel: string;
  onReview: () => void;
  t: (fr: string, en: string) => string;
}) {
  if (selectedTools.length === 0) return null;
  const logos = selectedTools.slice(-4).reverse();

  return (
    <button
      type="button"
      onClick={onReview}
      className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-3 rounded-xl border border-primary/20 bg-background/95 p-3 text-left shadow-lg backdrop-blur lg:hidden"
    >
      <div className="flex -space-x-2">
        {logos.map((tool) => (
          <ToolLogo key={tool.id} tool={tool} size={32} className="rounded-lg border-2 border-background bg-background" />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {selectedTools.length} {t("outil(s) dans ta stack", "tool(s) in your stack")}
        </p>
        <p className="text-xs text-muted-foreground">
          {coveredCount}/{totalMoments} {t("zones", "areas")} · {monthlyCostLabel}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function ReviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className="font-mono text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">{label}</p>
    </div>
  );
}

function NoSearchResult({
  query,
  onOpenManual,
  t,
}: {
  query: string;
  onOpenManual: () => void;
  t: (fr: string, en: string) => string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
      <p className="text-sm font-semibold text-foreground">
        {t(`Je ne trouve pas “${query}”.`, `I cannot find “${query}”.`)}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {t(
          "Ce n’est pas bloquant : ajoute son nom et décris comment tu t’en sers. Le contrat sera précisé plus tard.",
          "That is not blocking: add its name and describe how you use it. The contract comes later."
        )}
      </p>
      <button
        type="button"
        onClick={onOpenManual}
        className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-3 text-xs font-semibold text-background"
      >
        <Plus className="h-3.5 w-3.5" />
        {t("Ajouter cet outil", "Add this tool")}
      </button>
    </div>
  );
}

function ToolGrid({
  title,
  tools,
  selectedToolsById,
  activeSelectedToolsById,
  onToggle,
  t,
}: {
  title: string;
  tools: Tool[];
  selectedToolsById: Map<string, Tool>;
  activeSelectedToolsById: Map<string, Tool>;
  onToggle: (tool: Tool) => void;
  t: (fr: string, en: string) => string;
}) {
  if (tools.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => {
          return (
            <ToolChoiceButton
              key={tool.id}
              tool={tool}
              selectedTool={activeSelectedToolsById.get(tool.id)}
              reason={selectedToolsById.has(tool.id)
                ? t("Déjà dans ta stack · clique pour ce besoin", "Already in your stack · use it for this need")
                : undefined}
              onToggle={() => onToggle(tool)}
              t={t}
            />
          );
        })}
      </div>
    </div>
  );
}

function SelectedToolRow({
  tool,
  onRemove,
  onUpdate,
  t,
}: {
  tool: Tool;
  onRemove: () => void;
  onUpdate: (patch: Partial<Tool>) => void;
  t: (fr: string, en: string) => string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ToolLogo tool={tool} size={34} className="rounded-md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{tool.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{tool.category || t("Autre", "Other")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label={t("Retirer", "Remove")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3">
        <div className="grid grid-cols-3 rounded-md border border-border p-0.5">
          {(["high", "medium", "low"] as const).map((usage) => (
            <button
              key={usage}
              type="button"
              onClick={() => onUpdate({ usage })}
              className={`h-8 rounded-[5px] text-[11px] font-medium ${
                tool.usage === usage
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {usage === "high" ? t("Souvent", "Often") : usage === "medium" ? t("Parfois", "Sometimes") : t("Rare", "Rare")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
