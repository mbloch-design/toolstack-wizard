import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools } from "@/hooks/useSupabaseData";
import {
  SelectorFormData, MainGoal, SelectedTool,
  TJM_OPTIONS, PHASE_OPTIONS, MATURITY_OPTIONS,
  TjmRange, ProjectPhase, TechMaturity,
  VERTICAL_FAMILIES, FAMILY_ACTIVITIES, VerticalFamily,
  TIME_WEIGHT_OPTIONS, TimeWeight, VerticalWeight,
  ToolType,
} from "@/data/types";
import { verticals as VERTICALS_MAP } from "@/data/content";
import { ArrowLeft, ArrowRight, Check, Loader2, Search, X, RotateCcw, ChevronDown, ChevronUp, Sparkles, Package, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getToolLogoUrl, getToolLogoUrlHD } from "@/hooks/useSupabaseData";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tool } from "@/data/types";

const STEPS = 5;

const STEP_META_FR = [
  { label: "Profil", sub: "Activité" },
  { label: "Temps", sub: "Pondération" },
  { label: "Business", sub: "Contexte" },
  { label: "Outils", sub: "Stack actuelle" },
  { label: "Résultats", sub: "Email" },
];
const STEP_META_EN = [
  { label: "Profile", sub: "Activity" },
  { label: "Time", sub: "Weighting" },
  { label: "Business", sub: "Context" },
  { label: "Tools", sub: "Current stack" },
  { label: "Results", sub: "Email" },
];

/* ─── Section 3: Persona-based activity groups for Temps 1 ─── */
const PERSONA_MAP: Record<string, string> = {
  creatif: "sofia", tech: "theo", conseil: "marc", content: "alix", business: "claire",
};

interface ActivityGroup { title: string; titleEn: string; functional_needs: string[] }

const PERSONA_ACTIVITIES: Record<string, ActivityGroup[]> = {
  sofia: [
    { title: "Pour créer et produire", titleEn: "To create and produce", functional_needs: ["design-visuel", "montage-video", "motion-design", "retouche-photo", "illustration-vectorielle", "prototypage-interactif"] },
    { title: "Pour livrer à tes clients", titleEn: "To deliver to clients", functional_needs: ["livraison-client", "review-client-video", "galerie-client", "partage"] },
    { title: "Pour gérer tes missions", titleEn: "To manage missions", functional_needs: ["crm-leger", "suivi-temps", "gestion-missions", "documentation"] },
    { title: "Pour facturer et te faire payer", titleEn: "To invoice and get paid", functional_needs: ["facturation", "paiements", "signature-contrats", "comptabilite"] },
    { title: "Pour te coordonner", titleEn: "To coordinate", functional_needs: ["prise-de-rdv", "video-async", "scheduling"] },
  ],
  marc: [
    { title: "Pour gérer ton équipe", titleEn: "To manage your team", functional_needs: ["gestion-equipe", "communication-interne", "iam", "gestion-licences"] },
    { title: "Pour sécuriser les accès", titleEn: "To secure access", functional_needs: ["securite", "iam", "gestion-licences"] },
    { title: "Pour suivre les projets", titleEn: "To track projects", functional_needs: ["gestion-projet", "bug-tracking", "documentation", "roadmap-produit"] },
    { title: "Pour les dépenses et licences", titleEn: "For expenses and licenses", functional_needs: ["consolidation-depenses", "gestion-notes-frais", "renouvellements-licences", "reporting-financier"] },
    { title: "Pour recruter et onboarder", titleEn: "To recruit and onboard", functional_needs: ["ats", "sourcing", "onboarding", "sirh"] },
  ],
  theo: [
    { title: "Pour builder ton produit", titleEn: "To build your product", functional_needs: ["versioning-code", "deploiement", "base-de-donnees", "coding", "no-code-ia", "app-builder"] },
    { title: "Pour comprendre tes users", titleEn: "To understand your users", functional_needs: ["analytics-produit", "kpi-tracking", "dashboards", "feedback-utilisateurs"] },
    { title: "Pour l'acquisition et la conversion", titleEn: "For acquisition and conversion", functional_needs: ["email-marketing", "funnel-acquisition", "crm", "billing"] },
    { title: "Pour le support et l'onboarding", titleEn: "For support and onboarding", functional_needs: ["support-client", "onboarding-users", "chatbot"] },
    { title: "Pour les ops et l'automatisation", titleEn: "For ops and automation", functional_needs: ["automatisation", "workflows", "gestion-projet", "documentation"] },
  ],
  alix: [
    { title: "Tes outils IA", titleEn: "Your AI tools", functional_needs: ["generation-image", "generation-video", "generation-audio", "generation-texte", "code", "transcription"] },
    { title: "Pour builder et automatiser", titleEn: "To build and automate", functional_needs: ["no-code-ia", "automatisation", "integration-llm", "orchestration-agents", "app-builder"] },
    { title: "Pour créer du contenu", titleEn: "To create content", functional_needs: ["montage-video-court", "creation-visuels", "redaction", "sous-titrage", "repurposing"] },
    { title: "Pour gérer ton audience", titleEn: "To manage your audience", functional_needs: ["editeur-email", "liste-abonnes", "planification-posts", "monetisation-newsletter"] },
    { title: "Pour distribuer", titleEn: "To distribute", functional_needs: ["hebergement-audio", "distribution-podcast", "seo-video", "analytics-contenu"] },
  ],
  claire: [
    { title: "Pour les dépenses et la trésorerie", titleEn: "For expenses and cash flow", functional_needs: ["consolidation-depenses", "gestion-notes-frais", "renouvellements-licences", "paiements"] },
    { title: "Pour facturer et encaisser", titleEn: "To invoice and collect", functional_needs: ["facturation", "tva", "comptabilite", "billing"] },
    { title: "Pour la paie et les RH", titleEn: "For payroll and HR", functional_needs: ["paie", "sirh", "gestion-conges", "onboarding"] },
    { title: "Pour le reporting et les prévisions", titleEn: "For reporting and forecasts", functional_needs: ["reporting-financier", "dashboards", "previsionnel", "audit"] },
    { title: "Pour la conformité et la sécurité", titleEn: "For compliance and security", functional_needs: ["audit", "securite", "iam", "signature-contrats"] },
  ],
};

const POPULAR_IDS = [
  'notion', 'figma', 'canva', 'slack', 'calendly', 'loom', 'stripe',
  'google-drive', 'dropbox', 'make', 'zapier', 'github', 'cursor',
  'chatgpt', 'claude', 'midjourney', 'linear', 'asana', 'trello',
  'mailchimp', 'beehiiv', 'substack', 'clickup', 'airtable',
  'adobe-cc', 'davinci-resolve', 'grammarly', 'elevenlabs', 'runway',
  'buffer', 'hootsuite', 'tubebody', 'descript', 'riverside',
  'buzzsprout', 'todoist', 'indy', 'pennylane', 'qonto',
  '1password', 'typeform', 'tally', 'webflow', 'bubble',
  'posthog', 'amplitude', 'intercom', 'sentry', 'toggl',
  'capcut', 'typefully', 'hotjar', 'frame-io', 'pixieset',
  'capture-one', 'notion-ai', 'perplexity',
];

const PERSONA_VERTICALS: Record<string, string[]> = {
  sofia: ['graphiste-da', 'motion-video', 'photographe', 'illustrateur'],
  marc: ['manager-dsi', 'cto-lead-tech', 'rh-recruteur'],
  theo: ['fondateur-saas', 'developpeur-solo', 'product-manager'],
  alix: ['ai-builder', 'createur-contenu', 'newslettiste-auteur'],
  claire: ['daf-finance', 'manager-dsi'],
};

/* ─── Phase A: Persona Quick Picks ─── */
const PERSONA_QUICK_PICKS: Record<string, string[]> = {
  sofia: [
    'figma', 'adobe-cc', 'canva', 'notion', 'slack',
    'calendly', 'loom', 'stripe', 'indy', 'capture-one',
    'davinci-resolve', 'frame-io'
  ],
  theo: [
    'github', 'cursor', 'notion', 'linear', 'slack',
    'vercel', 'supabase', 'chatgpt', 'claude', 'posthog',
    'stripe', 'sentry'
  ],
  marc: [
    'notion', 'slack', 'asana', 'google-drive', 'zoom',
    'hubspot', 'pipedrive', '1password', 'loom', 'calendly',
    'qonto', 'pennylane'
  ],
  alix: [
    'chatgpt', 'claude', 'midjourney', 'notion', 'beehiiv',
    'substack', 'capcut', 'canva', 'buffer', 'typefully',
    'descript', 'elevenlabs'
  ],
  claire: [
    'pennylane', 'qonto', 'indy', 'stripe', 'notion',
    'slack', 'google-drive', 'docusign', 'hubspot', 'asana',
    'zoom', 'loom'
  ],
};

/* ─── Phase B: Contextual Questions ─── */
interface ContextualQuestion {
  id: string;
  question: string;
  questionEn: string;
  toolIds: string[];
  personas: string[];
}

const CONTEXTUAL_QUESTIONS: ContextualQuestion[] = [
  // SOFIA — creatif
  { id: 'uses_after_effects', question: 'Tu travailles sur After Effects ?', questionEn: 'Do you work with After Effects?', toolIds: ['newton-3', 'rubberhouse-2', 'motion-bro', 'bao-boa', 'animation-composer', 'duik-angela', 'gifgun', 'bodymovin'], personas: ['sofia'] },
  { id: 'uses_figma_plugins', question: 'Tu utilises des plugins Figma ?', questionEn: 'Do you use Figma plugins?', toolIds: ['figma-tokens', 'iconify-for-figma', 'stark', 'anima'], personas: ['sofia'] },
  { id: 'uses_video_editing', question: 'Tu fais du montage vidéo ?', questionEn: 'Do you do video editing?', toolIds: ['davinci-resolve', 'adobe-premiere-pro', 'capcut', 'descript', 'frame-io'], personas: ['sofia'] },
  { id: 'uses_3d', question: 'Tu fais de la 3D ou du motion design ?', questionEn: 'Do you do 3D or motion design?', toolIds: ['blender', 'cinema-4d', 'adobe-after-effects', 'rive'], personas: ['sofia'] },
  { id: 'has_clients_gallery', question: 'Tu livres des photos ou visuels à tes clients en ligne ?', questionEn: 'Do you deliver photos or visuals to clients online?', toolIds: ['pixieset', 'wetransfer', 'dropbox'], personas: ['sofia'] },
  // THEO — tech
  { id: 'uses_ai_coding', question: "Tu utilises un assistant IA pour coder ?", questionEn: 'Do you use an AI assistant for coding?', toolIds: ['cursor', 'github-copilot', 'chatgpt', 'claude'], personas: ['theo'] },
  { id: 'uses_analytics', question: 'Tu mesures le comportement de tes utilisateurs ?', questionEn: 'Do you track user behavior?', toolIds: ['posthog', 'amplitude', 'hotjar', 'mixpanel'], personas: ['theo'] },
  { id: 'uses_nocode', question: 'Tu utilises des outils no-code ou low-code ?', questionEn: 'Do you use no-code or low-code tools?', toolIds: ['webflow', 'bubble', 'make', 'zapier', 'retool'], personas: ['theo'] },
  { id: 'uses_infra', question: 'Tu gères toi-même ton infra ou déploiement ?', questionEn: 'Do you manage your own infra or deployment?', toolIds: ['vercel', 'netlify', 'supabase', 'datadog', 'sentry'], personas: ['theo'] },
  { id: 'has_newsletter_tech', question: 'Tu as une newsletter ou une liste email ?', questionEn: 'Do you have a newsletter or email list?', toolIds: ['beehiiv', 'mailchimp', 'substack', 'brevo'], personas: ['theo'] },
  // MARC — conseil
  { id: 'uses_crm', question: 'Tu utilises un CRM pour suivre tes clients ou prospects ?', questionEn: 'Do you use a CRM to track clients or prospects?', toolIds: ['hubspot', 'pipedrive', 'salesforce', 'notion'], personas: ['marc'] },
  { id: 'uses_project_management', question: 'Tu as un outil de suivi de projets ou de tâches ?', questionEn: 'Do you use a project or task management tool?', toolIds: ['asana', 'notion', 'clickup', 'linear', 'trello', 'monday'], personas: ['marc'] },
  { id: 'uses_esignature', question: 'Tu fais signer des contrats en ligne ?', questionEn: 'Do you sign contracts online?', toolIds: ['docusign', 'pandadoc', 'indy'], personas: ['marc'] },
  { id: 'uses_expense_management', question: 'Tu gères des notes de frais ou dépenses équipe ?', questionEn: 'Do you manage expense reports or team spending?', toolIds: ['qonto', 'spendesk', 'pennylane', 'n26-business'], personas: ['marc'] },
  { id: 'uses_communication_async', question: 'Tu envoies des vidéos ou messages async à ton équipe ?', questionEn: 'Do you send async video or messages to your team?', toolIds: ['loom', 'slack', 'notion'], personas: ['marc'] },
  // ALIX — content
  { id: 'uses_image_generation', question: 'Tu génères des images avec une IA ?', questionEn: 'Do you generate images with AI?', toolIds: ['midjourney', 'adobe-firefly', 'dalle', 'stable-diffusion'], personas: ['alix'] },
  { id: 'uses_video_generation', question: 'Tu génères de la vidéo avec une IA ?', questionEn: 'Do you generate video with AI?', toolIds: ['runway', 'kling', 'pika', 'sora'], personas: ['alix'] },
  { id: 'has_newsletter_content', question: 'Tu as une newsletter ou une liste email ?', questionEn: 'Do you have a newsletter or email list?', toolIds: ['beehiiv', 'substack', 'mailchimp', 'kit'], personas: ['alix'] },
  { id: 'uses_social_scheduling', question: 'Tu planifies tes posts sur les réseaux ?', questionEn: 'Do you schedule your social media posts?', toolIds: ['buffer', 'typefully', 'hootsuite', 'later'], personas: ['alix'] },
  { id: 'uses_podcast', question: 'Tu fais un podcast ou du contenu audio ?', questionEn: 'Do you make a podcast or audio content?', toolIds: ['buzzsprout', 'descript', 'riverside', 'elevenlabs', 'audacity'], personas: ['alix'] },
  { id: 'uses_automation_content', question: 'Tu automatises des parties de ta production de contenu ?', questionEn: 'Do you automate parts of your content production?', toolIds: ['make', 'zapier', 'n8n', 'notion'], personas: ['alix'] },
  // CLAIRE — business
  { id: 'uses_accounting', question: 'Tu gères ta comptabilité ou facturation en ligne ?', questionEn: 'Do you manage your accounting or billing online?', toolIds: ['pennylane', 'indy', 'qonto', 'stripe'], personas: ['claire'] },
  { id: 'uses_hr', question: 'Tu gères des RH, paie ou congés ?', questionEn: 'Do you manage HR, payroll or leave?', toolIds: ['payfit', 'lucca', 'bamboohr', 'factorial'], personas: ['claire'] },
  { id: 'uses_esignature_claire', question: 'Tu fais signer des contrats ou documents en ligne ?', questionEn: 'Do you sign contracts or documents online?', toolIds: ['docusign', 'pandadoc', 'yousign'], personas: ['claire'] },
  { id: 'uses_reporting', question: 'Tu fais du reporting ou des tableaux de bord financiers ?', questionEn: 'Do you do financial reporting or dashboards?', toolIds: ['notion', 'google-sheets', 'airtable', 'metabase'], personas: ['claire'] },
  { id: 'uses_procurement', question: 'Tu gères les achats et licences logicielles de ton équipe ?', questionEn: 'Do you manage your team software purchases and licenses?', toolIds: ['qonto', 'spendesk', 'notion', 'airtable'], personas: ['claire'] },
];

const INITIAL_FORM: SelectorFormData = {
  family: null, verticals: [], persona: null, mainGoal: null,
  currentTools: [], aiUsageLevel: null, tjm: null, projectPhase: null,
  techMaturity: null, email: "", firstName: "", marketingOptIn: false,
};

/* ─── Tool Type Visual Tokens ─── */
const TYPE_TOKENS: Record<string, { label: string; labelEn: string; dot: string }> = {
  metier:    { label: "Métier",    labelEn: "Core",   dot: "bg-primary" },
  plugin:    { label: "Plugin",    labelEn: "Plugin",  dot: "bg-violet-500" },
  ia:        { label: "IA",        labelEn: "AI",      dot: "bg-amber-500" },
  gestion:   { label: "Gestion",   labelEn: "Mgmt",    dot: "bg-cyan-500" },
  satellite: { label: "Satellite", labelEn: "Misc",    dot: "bg-muted-foreground/40" },
};

/* ─── Multi-fallback Logo ─── */
function ToolLogo({ tool, size = 28 }: { tool: Tool; size?: number }) {
  const googleUrl = getToolLogoUrl(tool);
  const hdUrl = getToolLogoUrlHD(tool);
  const [src, setSrc] = useState<string | null>(hdUrl || googleUrl);
  const [failed, setFailed] = useState(0);
  const handleError = () => {
    if (failed === 0 && hdUrl && googleUrl) { setSrc(googleUrl); setFailed(1); }
    else setFailed(2);
  };
  if (!src || failed >= 2) {
    return (
      <div className="flex shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground font-mono font-medium"
        style={{ width: size, height: size, fontSize: size * 0.4 }}>
        {tool.name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img src={src} alt={`${tool.name} logo`}
      className="shrink-0 rounded-md object-contain bg-white dark:bg-secondary/60 border border-border/50"
      style={{ width: size, height: size }} loading="lazy" onError={handleError} />
  );
}

/* ─── Tool Row — clean, airy ─── */
function ToolRow({ tool, selected, onToggle, lang, highlighted }: {
  tool: Tool; selected: boolean; onToggle: () => void; lang: string; highlighted?: boolean;
}) {
  const tt = TYPE_TOKENS[tool.tool_type || "satellite"] || TYPE_TOKENS.satellite;
  return (
    <button onClick={onToggle}
      className={`group flex items-center gap-3 px-4 py-3 text-left transition-all w-full
        ${selected
          ? "bg-accent/60"
          : highlighted
          ? "hover:bg-accent/30"
          : "hover:bg-secondary/40"
        }`}>
      <ToolLogo tool={tool} size={32} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate leading-snug">{tool.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`h-1.5 w-1.5 rounded-full ${tt.dot}`} />
          <span className="text-[11px] text-muted-foreground">{lang === "en" ? tt.labelEn : tt.label}</span>
          <span className="text-[11px] text-muted-foreground/60">·</span>
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
            {tool.defaultMonthlyPrice > 0 ? `${tool.defaultMonthlyPrice}€` : lang === "en" ? "Free" : "Gratuit"}
          </span>
        </div>
      </div>
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all
        ${selected
          ? "bg-primary shadow-sm"
          : "border border-border group-hover:border-primary/40"
        }`}>
        {selected && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
      </div>
    </button>
  );
}

/* ─── Selection Chip Card ─── */
function SelectionCard({ selected, onClick, emoji, label, desc, compact }: {
  selected: boolean; onClick: () => void; emoji: string; label: string; desc?: string; compact?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`relative flex items-start gap-3 rounded-lg text-left transition-all
        ${compact ? "px-3.5 py-3" : "px-4 py-4"}
        ${selected
          ? "bg-accent/80 shadow-[0_0_0_1.5px_hsl(var(--primary))]"
          : "bg-card border border-border hover:border-primary/30 hover:shadow-sm"
        }`}>
      <span className={`${compact ? "text-lg" : "text-xl"} leading-none mt-0.5`}>{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-medium leading-snug ${compact ? "text-[13px]" : "text-sm"}`}>{label}</p>
        {desc && <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{desc}</p>}
      </div>
      {selected && (
        <div className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
          <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

/* ─── Section Header ─── */
function SectionHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-heading text-xl md:text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}
    </div>
  );
}

const SelectorPage = () => {
  const { t, prefix, lang } = useLang();
  const navigate = useNavigate();
  const { tools } = useTools();
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SelectorFormData>({ ...INITIAL_FORM });
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toolSearch, setToolSearch] = useState("");
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, boolean | null>>({});
  const [searchPhaseVisible, setSearchPhaseVisible] = useState(false);

  const stepMeta = lang === "en" ? STEP_META_EN : STEP_META_FR;

  const next = () => step < STEPS && setStep(step + 1);
  const prev = () => step > 1 && setStep(step - 1);

  const canNext = () => {
    switch (step) {
      case 1: return !!form.family && selectedActivities.length > 0;
      case 2: return form.verticals.length > 0;
      case 3: return !!form.tjm && !!form.projectPhase && !!form.techMaturity;
      case 4: return true; // Tools step is optional
      case 5: return form.email.includes("@") && form.firstName.length > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step === 1 && form.family) {
      const activities = FAMILY_ACTIVITIES[form.family];
      const allVerticalIds: string[] = [];
      for (const activityLabel of selectedActivities) {
        const activity = activities.find((a) => a.label === activityLabel);
        if (activity) allVerticalIds.push(...activity.verticals);
      }
      const uniqueIds = [...new Set(allVerticalIds)];
      const weights: VerticalWeight[] = uniqueIds.map((id) => ({
        id, weight: 1.0, timeWeight: "principal" as TimeWeight,
      }));
      setForm({ ...form, verticals: weights });
    }
    next();
  };

  const toggleActivity = (label: string) => {
    if (selectedActivities.includes(label)) setSelectedActivities(selectedActivities.filter((a) => a !== label));
    else if (selectedActivities.length < 5) setSelectedActivities([...selectedActivities, label]);
  };

  const updateVerticalWeight = (verticalId: string, timeWeight: TimeWeight) => {
    setForm({
      ...form,
      verticals: form.verticals.map((v) =>
        v.id === verticalId
          ? { ...v, timeWeight, weight: { principal: 1.0, secondaire: 0.5, occasionnel: 0.2 }[timeWeight] }
          : v
      ),
    });
  };

  const toggleTool = (toolId: string) => {
    const exists = form.currentTools.find((ct) => ct.toolId === toolId);
    if (exists) setForm({ ...form, currentTools: form.currentTools.filter((ct) => ct.toolId !== toolId) });
    else setForm({ ...form, currentTools: [...form.currentTools, { toolId, monthlyCost: 0, usage: "medium" }] });
  };

  const handleReset = () => {
    if (window.confirm(t("Remettre le formulaire à zéro ?", "Reset the form?"))) {
      setForm({ ...INITIAL_FORM }); setSelectedActivities([]); setStep(1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const tjmMedian = TJM_OPTIONS.find((o) => o.value === form.tjm)?.median || 0;
      const leadData = {
        email: form.email.trim(), first_name: form.firstName.trim() || null,
        user_type: form.family || null, job_role: form.verticals.map((v) => v.id).join(",") || null,
        main_goal: form.mainGoal || null, current_tools: JSON.stringify(form.currentTools),
        ai_usage_level: form.aiUsageLevel || null, marketing_opt_in: form.marketingOptIn ?? false,
        tjm: tjmMedian, project_phase: form.projectPhase || null,
        tech_maturity: form.techMaturity || null, source: "selector-v10",
      };
      const { error } = await supabase.from("leads").insert(leadData as any);
      if (error) throw error;
      sessionStorage.setItem("tooltrim_selector", JSON.stringify(form));
      navigate(`${prefix}/selector/results`);
    } catch (err: any) {
      console.error("Error saving lead:", err?.message || err);
      toast.error(t("Une erreur est survenue. Veuillez réessayer.", "An error occurred. Please try again."));
    } finally { setSubmitting(false); }
  };

  /* ─── Tool helpers ─── */
  const selectedIds = new Set(form.currentTools.map((ct) => ct.toolId));
  const totalCost = Math.round(form.currentTools.reduce((sum, ct) => {
    const tool = tools.find((t) => t.id === ct.toolId);
    return sum + (ct.monthlyCost || tool?.defaultMonthlyPrice || 0);
  }, 0) * 100) / 100;
  const selectedToolObjects = useMemo(() => tools.filter((t) => selectedIds.has(t.id)), [tools, selectedIds]);

  const personaKey = PERSONA_MAP[form.family || ""] || "sofia";

  /* ── Phase A: Quick pick tools for this persona ── */
  const quickPickTools = useMemo(() => {
    const ids = PERSONA_QUICK_PICKS[personaKey] || [];
    return ids
      .map(id => tools.find(t => t.id === id || t.slug === id))
      .filter(Boolean) as Tool[];
  }, [personaKey, tools]);

  /* ── Phase B: Contextual questions for this persona ── */
  const relevantQuestions = useMemo(() => {
    return CONTEXTUAL_QUESTIONS.filter(q => q.personas.includes(personaKey));
  }, [personaKey]);

  const unlockedQuestionTools = useMemo(() => {
    const unlockedIds = new Set<string>();
    for (const q of relevantQuestions) {
      if (questionAnswers[q.id] === true) {
        q.toolIds.forEach(id => unlockedIds.add(id));
      }
    }
    return [...unlockedIds]
      .map(id => tools.find(t => t.id === id || t.slug === id))
      .filter(Boolean) as Tool[];
  }, [relevantQuestions, questionAnswers, tools]);

  const allSuggestedIds = useMemo(() => {
    const ids = new Set([
      ...quickPickTools.map(t => t.id),
      ...unlockedQuestionTools.map(t => t.id),
    ]);
    return ids;
  }, [quickPickTools, unlockedQuestionTools]);

  /* ── Phase C: Free search ── */
  const searchResults = useMemo(() => {
    if (!toolSearch.trim()) return [];
    return tools
      .filter(t =>
        t.name.toLowerCase().includes(toolSearch.toLowerCase().trim()) &&
        !allSuggestedIds.has(t.id)
      )
      .slice(0, 20);
  }, [tools, toolSearch, allSuggestedIds]);

  const verticalLabel = (id: string) => {
    const allActivities = Object.values(FAMILY_ACTIVITIES).flat();
    for (const a of allActivities) {
      if (a.verticals.includes(id)) return lang === "en" ? a.labelEn : a.label;
    }
    return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const family = VERTICAL_FAMILIES.find((f) => f.value === form.family);

  return (
    <div className="min-h-[80vh] py-6 md:py-10">
      <div className="container mx-auto max-w-2xl px-4 md:px-6">

        {/* ═══ Step Indicator — minimal numbered dots ═══ */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {stepMeta.map((meta, i) => {
              const stepNum = i + 1;
              const isActive = step === stepNum;
              const isDone = step > stepNum;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                  <button
                    onClick={() => isDone && setStep(stepNum)}
                    disabled={!isDone}
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-medium transition-all
                      ${isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                        : isDone
                        ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                        : "bg-secondary text-muted-foreground/50"
                      }`}>
                    {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : stepNum}
                  </button>
                  {!isMobile && (
                    <span className={`text-[10px] font-medium transition-colors text-center leading-tight
                      ${isActive ? "text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                      {meta.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Progress bar below dots */}
          <div className="mt-3 flex gap-1">
            {stepMeta.map((_, i) => (
              <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-300
                ${step > i + 1 ? "bg-primary/50" : step === i + 1 ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground font-mono tabular-nums">{step}/{STEPS}</p>
            {step > 1 && (
              <button onClick={handleReset} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                <RotateCcw className="h-3 w-3" /> {t("Recommencer", "Reset")}
              </button>
            )}
          </div>
        </div>

        {/* ═══ STEP 1 — Family + Activities ═══ */}
        {step === 1 && (
          <div className="animate-fade-in space-y-10">
            <div>
              <SectionHead
                title={t("Quelle est votre famille d'activité ?", "What's your activity family?")}
                subtitle={t("Choisissez la catégorie qui correspond le mieux à votre quotidien.", "Choose the category that best matches your daily work.")}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {VERTICAL_FAMILIES.map((f) => (
                  <button key={f.value}
                    onClick={() => { setForm({ ...form, family: f.value, verticals: [] }); setSelectedActivities([]); }}
                    className={`flex flex-col items-center gap-2 rounded-lg px-3 py-4 text-center transition-all
                      ${form.family === f.value
                        ? "bg-accent/80 shadow-[0_0_0_1.5px_hsl(var(--primary))]"
                        : "bg-card border border-border hover:border-primary/30 hover:shadow-sm"
                      }`}>
                    <span className="text-2xl">{f.emoji}</span>
                    <span className="text-[13px] font-medium leading-tight">{lang === "en" ? f.labelEn : f.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {form.family && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-heading text-base font-semibold">{t("Vos activités concrètes", "Your actual activities")}</h3>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{t("Sélectionnez jusqu'à 5 activités.", "Select up to 5 activities.")}</p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">{selectedActivities.length}/5</span>
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {FAMILY_ACTIVITIES[form.family].map((activity) => {
                    const isSelected = selectedActivities.includes(activity.label);
                    return (
                      <SelectionCard key={activity.label} compact selected={isSelected}
                        onClick={() => toggleActivity(activity.label)}
                        emoji={isSelected ? "✓" : "○"}
                        label={lang === "en" ? activity.labelEn : activity.label} />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 2 — Time Allocation ═══ */}
        {step === 2 && form.verticals.length > 0 && (
          <div className="animate-fade-in">
            <SectionHead
              title={t("Répartition de votre temps", "Time allocation")}
              subtitle={t("Pour chaque activité, indiquez son importance dans votre quotidien.", "For each activity, indicate its importance in your daily work.")}
            />
            <div className="space-y-3">
              {form.verticals.map((v) => (
                <div key={v.id} className="rounded-lg bg-card border border-border p-4">
                  <p className="text-[13px] font-medium mb-3">{verticalLabel(v.id)}</p>
                  <div className="flex gap-1.5">
                    {TIME_WEIGHT_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => updateVerticalWeight(v.id, opt.value)}
                        className={`flex-1 rounded-md px-2 py-2 text-center transition-all
                          ${v.timeWeight === opt.value
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}>
                        <span className="block text-xs font-medium">{lang === "en" ? opt.labelEn : opt.label}</span>
                        <span className="block text-[10px] opacity-60 mt-0.5 leading-tight">{lang === "en" ? opt.descEn : opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 3 — Business Profile ═══ */}
        {step === 3 && (
          <div className="animate-fade-in space-y-8">
            <SectionHead
              title={t("Votre profil business", "Your business profile")}
              subtitle={t("Ces informations affinent la pertinence des recommandations.", "These details refine the relevance of recommendations.")}
            />

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("Taux journalier moyen", "Average daily rate")}</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {TJM_OPTIONS.map((o) => (
                  <SelectionCard key={o.value} compact selected={form.tjm === o.value}
                    onClick={() => setForm({ ...form, tjm: o.value })} emoji="💰"
                    label={lang === "en" ? o.labelEn : o.label} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("Phase de développement", "Development phase")}</p>
              <div className="grid gap-1.5 sm:grid-cols-3">
                {PHASE_OPTIONS.map((o) => (
                  <SelectionCard key={o.value} compact selected={form.projectPhase === o.value}
                    onClick={() => setForm({ ...form, projectPhase: o.value })} emoji={o.emoji}
                    label={lang === "en" ? o.labelEn : o.label} desc={lang === "en" ? o.descEn : o.desc} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("Maturité technique", "Technical maturity")}</p>
              <div className="grid gap-1.5 sm:grid-cols-3">
                {MATURITY_OPTIONS.map((o) => (
                  <SelectionCard key={o.value} compact selected={form.techMaturity === o.value}
                    onClick={() => setForm({ ...form, techMaturity: o.value })} emoji={o.emoji}
                    label={lang === "en" ? o.labelEn : o.label} desc={lang === "en" ? o.descEn : o.desc} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 4 — Tools: 3-Phase Single Screen ═══ */}
        {step === 4 && (
          <div className="animate-fade-in space-y-8">

            {/* ── SELECTED STACK SUMMARY ── */}
            {selectedToolObjects.length > 0 && (
              <div className="rounded-xl border border-primary/20 bg-accent/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">
                      {t("Ma stack", "My stack")}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-primary tabular-nums">
                    {selectedToolObjects.length} {t("outils", "tools")} · {totalCost}€/{t("mois", "mo")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedToolObjects.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-destructive/40 hover:text-destructive hover:bg-destructive/5 group"
                    >
                      <ToolLogo tool={tool} size={14} />
                      <span>{tool.name}</span>
                      <X className="h-3 w-3 opacity-30 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════
                PHASE A — QUICK RECOGNITION
            ══════════════════════════════════ */}
            <div>
              <div className="mb-4">
                <h2 className="font-heading text-lg font-semibold">
                  {t("Les outils les plus utilisés par ton profil", "Most used tools for your profile")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("Clique sur ceux que tu utilises déjà", "Click the ones you already use")}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {quickPickTools.map(tool => {
                  const isSelected = selectedIds.has(tool.id);
                  const price = tool.pricing_v5?.compare_price_monthly_eur ?? tool.defaultMonthlyPrice ?? 0;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all
                        ${isSelected
                          ? 'border-primary bg-accent/60 shadow-[0_0_0_1.5px_hsl(var(--primary))]'
                          : 'border-border bg-card hover:border-primary/30 hover:shadow-sm'
                        }`}
                    >
                      <ToolLogo tool={tool} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium truncate">{tool.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {price === 0 ? t('Gratuit', 'Free') : `${price}€`}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                          <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ══════════════════════════════════
                PHASE B — CONTEXTUAL QUESTIONS
            ══════════════════════════════════ */}
            <div>
              <div className="mb-4">
                <h2 className="font-heading text-lg font-semibold">
                  {t("Quelques questions rapides", "A few quick questions")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t(
                    "On va débloquer les outils qui correspondent à ta façon de travailler",
                    "We'll unlock the tools that match your way of working"
                  )}
                </p>
              </div>
              <div className="space-y-3">
                {relevantQuestions.map(q => {
                  const answer = questionAnswers[q.id];
                  const isAnsweredYes = answer === true;
                  const isAnsweredNo = answer === false;
                  const relevantTools = q.toolIds
                    .map(id => tools.find(t => t.id === id || t.slug === id))
                    .filter(Boolean) as Tool[];

                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border transition-all overflow-hidden
                        ${isAnsweredYes ? 'border-primary/30 bg-accent/20' : 'border-border bg-card'}`}
                    >
                      {/* Question row */}
                      <div className="flex items-center justify-between gap-4 p-4">
                        <p className="text-[14px] font-medium flex-1">
                          {lang === 'en' ? q.questionEn : q.question}
                        </p>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => setQuestionAnswers(prev => ({
                              ...prev,
                              [q.id]: prev[q.id] === true ? null : true
                            }))}
                            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all
                              ${isAnsweredYes
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                              }`}
                          >
                            {t("Oui", "Yes")}
                          </button>
                          <button
                            onClick={() => setQuestionAnswers(prev => ({
                              ...prev,
                              [q.id]: prev[q.id] === false ? null : false
                            }))}
                            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all
                              ${isAnsweredNo
                                ? 'bg-secondary text-foreground'
                                : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                              }`}
                          >
                            {t("Non", "No")}
                          </button>
                        </div>
                      </div>

                      {/* Unlocked tools */}
                      {isAnsweredYes && relevantTools.length > 0 && (
                        <div className="border-t border-border/50 px-4 py-3 bg-accent/10">
                          <div className="flex flex-wrap gap-2">
                            {relevantTools.map(tool => {
                              const isSelected = selectedIds.has(tool.id);
                              return (
                                <button
                                  key={tool.id}
                                  onClick={() => toggleTool(tool.id)}
                                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all
                                    ${isSelected
                                      ? 'border-primary bg-primary/10 text-primary font-medium'
                                      : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground'
                                    }`}
                                >
                                  <ToolLogo tool={tool} size={18} />
                                  <span>{tool.name}</span>
                                  {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ══════════════════════════════════
                PHASE C — FREE SEARCH
            ══════════════════════════════════ */}
            <div>
              <button
                onClick={() => setSearchPhaseVisible(!searchPhaseVisible)}
                className="w-full flex items-center justify-between rounded-xl border border-dashed border-border p-4 text-left hover:border-primary/40 hover:bg-accent/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {t("Tu utilises un autre outil ?", "Do you use another tool?")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("Cherche dans toute notre base de données", "Search our entire database")}
                    </p>
                  </div>
                </div>
                {searchPhaseVisible
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                }
              </button>

              {searchPhaseVisible && (
                <div className="mt-3 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                      type="text"
                      value={toolSearch}
                      onChange={e => setToolSearch(e.target.value)}
                      placeholder={t("Rechercher un outil...", "Search for a tool...")}
                      className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-9 text-sm outline-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                      autoFocus
                    />
                    {toolSearch && (
                      <button
                        onClick={() => setToolSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {toolSearch.trim() && searchResults.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      {t("Aucun outil trouvé", "No tool found")}
                    </p>
                  )}

                  {searchResults.length > 0 && (
                    <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border/30">
                      {searchResults.map(tool => (
                        <ToolRow
                          key={tool.id}
                          tool={tool}
                          selected={selectedIds.has(tool.id)}
                          onToggle={() => toggleTool(tool.id)}
                          lang={lang}
                          highlighted
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ STEP 5 — Email (was step 6) ═══ */}
        {step === 5 && (
          <div className="animate-fade-in">
            <SectionHead
              title={t("Recevez votre diagnostic", "Get your diagnostic")}
              subtitle={t("Nous analysons votre stack et préparons des recommandations personnalisées.", "We analyze your stack and prepare personalized recommendations.")}
            />

            {/* Profile recap */}
            <div className="rounded-lg border border-border bg-card p-4 mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("Récapitulatif", "Summary")}</p>
              <div className="space-y-2 text-[13px]">
                {family && (
                  <div className="flex items-center gap-2">
                    <span className="text-base">{family.emoji}</span>
                    <span className="text-muted-foreground">{t("Famille", "Family")}</span>
                    <span className="font-medium ml-auto">{lang === "en" ? family.labelEn : family.label}</span>
                  </div>
                )}
                {form.verticals.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-px">📋</span>
                    <span className="text-muted-foreground shrink-0">{t("Activités", "Activities")}</span>
                    <span className="font-medium ml-auto text-right">{form.verticals.map((v) => verticalLabel(v.id)).join(", ")}</span>
                  </div>
                )}
                {form.currentTools.length > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <span className="text-base">🧰</span>
                    <span className="text-muted-foreground">{t("Stack", "Stack")}</span>
                    <span className="font-mono font-medium ml-auto tabular-nums">
                      {form.currentTools.length} {t("outils", "tools")} · <span className="text-primary">{totalCost}€/{t("mois", "mo")}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[13px] font-medium text-foreground">{t("Prénom", "First name")}</label>
                <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                  placeholder={t("Votre prénom", "Your first name")} />
              </div>
              <div>
                <label className="text-[13px] font-medium text-foreground">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                  placeholder="you@example.com" />
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input type="checkbox" checked={form.marketingOptIn} onChange={(e) => setForm({ ...form, marketingOptIn: e.target.checked })}
                  className="mt-0.5 rounded border-input accent-primary h-4 w-4" />
                <span className="text-[12px] text-muted-foreground leading-relaxed">
                  {t("J'accepte de recevoir des conseils et comparatifs par email (pas de spam, promis).",
                    "I agree to receive tips and comparisons by email (no spam, promise).")}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ═══ Navigation Footer ═══ */}
        {step === 4 ? (
          <div className="sticky bottom-0 -mx-4 md:-mx-6 px-4 md:px-6 pb-4 pt-3 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-2px_12px_-4px_hsl(var(--foreground)/0.06)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] text-muted-foreground">
                <span className="font-mono font-medium text-foreground">{form.currentTools.length}</span>{' '}
                {t("outils sélectionnés", "tools selected")}
              </span>
              <span className="font-mono text-[12px] font-medium tabular-nums">
                {t("Total", "Total")} : <span className="text-primary">{totalCost}€/{t("mois", "mo")}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={prev}
                className="flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> {t("Retour", "Back")}
              </button>
              <div className="flex items-center gap-3">
                {form.currentTools.length === 0 && (
                  <button
                    onClick={next}
                    className="text-[12px] text-muted-foreground/70 hover:text-muted-foreground transition-colors underline-offset-2 hover:underline"
                  >
                    {t("Passer cette étape", "Skip this step")}
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground transition-all hover:bg-primary/90 shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25"
                >
                  {form.currentTools.length === 0
                    ? <>{t("Continuer sans outils", "Continue without tools")} <ArrowRight className="h-3.5 w-3.5" /></>
                    : <>{t("Valider ma stack", "Confirm my stack")} <Check className="h-3.5 w-3.5" /></>
                  }
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <button
                onClick={prev}
                disabled={step === 1}
                className="flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-0 disabled:pointer-events-none">
                <ArrowLeft className="h-3.5 w-3.5" /> {t("Retour", "Back")}
              </button>
              <div className="flex items-center gap-3">
                {step < STEPS ? (
                  <button
                    onClick={handleNext}
                    disabled={!canNext()}
                    className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-30 disabled:pointer-events-none shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25">
                    {t("Continuer", "Continue")} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={!canNext() || submitting}
                    className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-30 disabled:pointer-events-none shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25">
                    {submitting
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("Analyse…", "Analyzing…")}</>
                      : <>{t("Voir mes résultats", "See my results")} <ArrowRight className="h-3.5 w-3.5" /></>
                    }
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SelectorPage;
