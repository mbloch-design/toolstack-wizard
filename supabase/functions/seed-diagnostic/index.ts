import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-admin-key, content-type",
};

const CATEGORY_PERTINENCE: Record<string, Record<string, number>> = {
  "ai-general":          { THEO: 80, SOFIA: 50, MARC: 70, ALIX: 90, CLAIRE: 60 },
  "automation":          { THEO: 70, SOFIA: 30, MARC: 60, ALIX: 70, CLAIRE: 80 },
  "project-management":  { THEO: 60, SOFIA: 50, MARC: 80, ALIX: 40, CLAIRE: 90 },
  "design-tools":        { THEO: 20, SOFIA: 95, MARC: 15, ALIX: 30, CLAIRE: 15 },
  "creation":            { THEO: 15, SOFIA: 90, MARC: 10, ALIX: 70, CLAIRE: 10 },
  "finance":             { THEO: 20, SOFIA: 25, MARC: 40, ALIX: 20, CLAIRE: 95 },
  "communication":       { THEO: 50, SOFIA: 60, MARC: 85, ALIX: 50, CLAIRE: 70 },
  "communication-team":  { THEO: 50, SOFIA: 60, MARC: 85, ALIX: 50, CLAIRE: 70 },
  "email-productivity":  { THEO: 15, SOFIA: 20, MARC: 30, ALIX: 95, CLAIRE: 25 },
  "analytics":           { THEO: 90, SOFIA: 5,  MARC: 5,  ALIX: 5,  CLAIRE: 10 },
  "storage":             { THEO: 70, SOFIA: 40, MARC: 60, ALIX: 50, CLAIRE: 60 },
  "nocode-web":          { THEO: 40, SOFIA: 70, MARC: 50, ALIX: 80, CLAIRE: 30 },
  "organization":        { THEO: 60, SOFIA: 50, MARC: 80, ALIX: 40, CLAIRE: 90 },
  "security":            { THEO: 90, SOFIA: 10, MARC: 20, ALIX: 15, CLAIRE: 30 },
  "productivity-tracking": { THEO: 60, SOFIA: 40, MARC: 70, ALIX: 50, CLAIRE: 80 },
  "formation-education": { THEO: 50, SOFIA: 50, MARC: 50, ALIX: 50, CLAIRE: 50 },
};

const DEFAULT_PERTINENCE = { THEO: 50, SOFIA: 50, MARC: 50, ALIX: 50, CLAIRE: 50 };

const FORCE_SILENCE_IDS = new Set([
  "stripe", "google-drive", "paypal", "google-analytics",
  "google-workspace", "apple-icloud", "microsoft-365",
]);

// Additional doublon rules to seed (beyond existing 41)
const EXTRA_DOUBLON_RULES = [
  { ids: ["chatgpt", "claude"], message: "Deux LLMs premium en parallèle : choisir un principal", savings: 20, category: "ai-general" },
  { ids: ["chatgpt", "perplexity"], message: "Perplexity couvre la recherche — ChatGPT redondant pour cet usage", savings: 20, category: "ai-general" },
  { ids: ["notion", "clickup"], message: "Notion et ClickUp couvrent la gestion de projet — un seul suffit", savings: 10, category: "project-management" },
  { ids: ["notion", "obsidian"], message: "Deux apps de notes : consolider sur une seule", savings: 0, category: "organization" },
  { ids: ["slack", "discord"], message: "Slack et Discord pour la com d'équipe — choisir un canal principal", savings: 8, category: "communication-team" },
  { ids: ["slack", "teams"], message: "Slack et Teams en doublon pour la messagerie d'équipe", savings: 12, category: "communication-team" },
  { ids: ["figma", "canva"], message: "Figma pour l'UI, Canva pour le marketing — OK si usages distincts", savings: 0, category: "design-tools" },
  { ids: ["figma", "adobe-xd"], message: "Figma remplace Adobe XD dans la majorité des cas", savings: 12, category: "design-tools" },
  { ids: ["vercel", "netlify"], message: "Deux hébergeurs frontend — un seul suffit", savings: 19, category: "nocode-web" },
  { ids: ["zapier", "make"], message: "Zapier et Make font la même chose — garder le moins cher", savings: 20, category: "automation" },
  { ids: ["zapier", "n8n"], message: "n8n est open-source et remplace Zapier pour la plupart des workflows", savings: 29, category: "automation" },
  { ids: ["mailchimp", "convertkit"], message: "Deux outils newsletter — consolider sur un seul", savings: 15, category: "email-productivity" },
  { ids: ["mailchimp", "brevo"], message: "Mailchimp et Brevo font la même chose — garder un seul", savings: 13, category: "email-productivity" },
  { ids: ["google-meet", "zoom"], message: "Google Meet est inclus dans Workspace — Zoom potentiellement superflu", savings: 14, category: "communication" },
  { ids: ["loom", "tella"], message: "Deux outils de capture vidéo — un seul suffit", savings: 10, category: "communication" },
  { ids: ["linear", "jira"], message: "Linear et Jira couvrent le même besoin de gestion de tickets", savings: 10, category: "project-management" },
  { ids: ["todoist", "ticktick"], message: "Deux gestionnaires de tâches personnelles — consolider", savings: 5, category: "organization" },
  { ids: ["1password", "bitwarden"], message: "Deux gestionnaires de mots de passe — un seul suffit", savings: 3, category: "security" },
  { ids: ["grammarly", "languagetool"], message: "Deux correcteurs linguistiques — garder un seul", savings: 12, category: "creation" },
  { ids: ["airtable", "notion"], message: "Airtable et Notion bases de données — usage souvent redondant", savings: 10, category: "organization" },
  { ids: ["stripe", "paypal"], message: "Stripe et PayPal : complémentaires, pas un doublon", savings: 0, category: "finance" },
  { ids: ["superhuman", "spark"], message: "Deux clients email premium — un seul suffit", savings: 10, category: "email-productivity" },
  { ids: ["dropbox", "google-drive"], message: "Dropbox et Google Drive stockent les mêmes fichiers", savings: 12, category: "storage" },
  { ids: ["icloud", "google-drive"], message: "iCloud et Google Drive en doublon pour le stockage cloud", savings: 3, category: "storage" },
  { ids: ["calendly", "cal-com"], message: "Cal.com est gratuit et open-source — Calendly potentiellement superflu", savings: 12, category: "organization" },
  { ids: ["claude", "gemini"], message: "Deux LLMs premium — un seul comme copilote principal", savings: 20, category: "ai-general" },
  { ids: ["midjourney", "dall-e"], message: "Deux IA d'image — garder celle qui correspond le mieux à votre style", savings: 10, category: "creation" },
  { ids: ["webflow", "framer"], message: "Webflow et Framer couvrent le même besoin no-code", savings: 20, category: "nocode-web" },
  { ids: ["freshbooks", "quickbooks"], message: "Deux logiciels de comptabilité — un seul suffit", savings: 15, category: "finance" },
  { ids: ["asana", "monday"], message: "Asana et Monday.com sont interchangeables pour la gestion de projet", savings: 12, category: "project-management" },
  { ids: ["asana", "clickup"], message: "Asana et ClickUp couvrent le même périmètre", savings: 10, category: "project-management" },
  { ids: ["buffer", "hootsuite"], message: "Buffer et Hootsuite : deux schedulers sociaux, un seul suffit", savings: 15, category: "email-productivity" },
  { ids: ["miro", "figjam"], message: "Miro et FigJam pour le whiteboard — FigJam est inclus dans Figma", savings: 10, category: "design-tools" },
  { ids: ["intercom", "crisp"], message: "Deux outils de chat support — consolider sur un seul", savings: 25, category: "communication" },
  { ids: ["hubspot", "pipedrive"], message: "Deux CRM — choisir selon la taille de votre pipeline", savings: 20, category: "organization" },
  { ids: ["notion-ai", "chatgpt"], message: "Notion AI utilise GPT sous le capot — potentiellement redondant avec ChatGPT", savings: 10, category: "ai-general" },
  { ids: ["cursor", "github-copilot"], message: "Cursor inclut son propre copilot — GitHub Copilot en doublon", savings: 10, category: "ai-general" },
  { ids: ["postmark", "sendgrid"], message: "Deux services d'email transactionnel — un seul suffit", savings: 15, category: "email-productivity" },
  { ids: ["supabase", "firebase"], message: "Deux BaaS en parallèle — consolider sur un seul backend", savings: 25, category: "nocode-web" },
  { ids: ["railway", "render"], message: "Deux hébergeurs backend — un seul suffit", savings: 10, category: "nocode-web" },
  { ids: ["amplitude", "mixpanel"], message: "Deux outils d'analytics produit — un seul suffit", savings: 20, category: "analytics" },
  { ids: ["hotjar", "fullstory"], message: "Deux outils de session replay — garder un seul", savings: 30, category: "analytics" },
  { ids: ["dashlane", "1password"], message: "Deux gestionnaires de mots de passe premium", savings: 5, category: "security" },
  { ids: ["ghost", "substack"], message: "Ghost et Substack pour la newsletter — un seul suffit", savings: 10, category: "email-productivity" },
  { ids: ["typeform", "tally"], message: "Tally est gratuit et couvre 90% des cas Typeform", savings: 25, category: "organization" },
  { ids: ["adobe-premiere", "davinci-resolve"], message: "DaVinci est gratuit — Adobe Premiere potentiellement superflu", savings: 23, category: "creation" },
  { ids: ["photoshop", "affinity-photo"], message: "Affinity Photo en achat unique remplace l'abo Photoshop", savings: 12, category: "design-tools" },
  { ids: ["illustrator", "affinity-designer"], message: "Affinity Designer en achat unique remplace Illustrator", savings: 12, category: "design-tools" },
];

// Additional discovery questions
const EXTRA_DISCOVERY_QUESTIONS = [
  {
    id: "dq-chatgpt-usage",
    persona: "ALL",
    question: "À quelle fréquence utilises-tu ChatGPT ou un LLM ?",
    subtitle: "Aide à évaluer la valeur de ton abonnement IA",
    options: [
      { label: "Plusieurs fois par jour", impact: "keep" },
      { label: "Quelques fois par semaine", impact: "review" },
      { label: "Rarement / je ne sais plus", impact: "cancel" },
    ],
    condition_tool_ids: ["chatgpt", "claude", "gemini", "perplexity"],
    condition_type: "any",
  },
  {
    id: "dq-design-tool-pro",
    persona: "SOFIA",
    question: "Utilises-tu les fonctionnalités pro de ton outil de design ?",
    subtitle: "Variables, composants, dev mode, etc.",
    options: [
      { label: "Oui, quotidiennement", impact: "keep" },
      { label: "Parfois", impact: "review" },
      { label: "Non, juste les bases", impact: "cancel" },
    ],
    condition_tool_ids: ["figma", "sketch", "adobe-xd"],
    condition_type: "any",
  },
  {
    id: "dq-automation-complexity",
    persona: "ALL",
    question: "Combien de workflows automatisés as-tu actifs ?",
    subtitle: "Zapier, Make, n8n...",
    options: [
      { label: "10+ workflows actifs", impact: "keep" },
      { label: "3-9 workflows", impact: "review" },
      { label: "1-2 ou aucun", impact: "cancel" },
    ],
    condition_tool_ids: ["zapier", "make", "n8n"],
    condition_type: "any",
  },
  {
    id: "dq-crm-pipeline",
    persona: "MARC",
    question: "Combien de deals actifs as-tu dans ton CRM ?",
    subtitle: "Volume du pipeline commercial",
    options: [
      { label: "20+ deals actifs", impact: "keep" },
      { label: "5-19 deals", impact: "review" },
      { label: "Moins de 5", impact: "cancel" },
    ],
    condition_tool_ids: ["hubspot", "pipedrive", "salesforce"],
    condition_type: "any",
  },
  {
    id: "dq-email-list-size",
    persona: "ALIX",
    question: "Quelle est la taille de ta liste email ?",
    subtitle: "Détermine si un outil premium est justifié",
    options: [
      { label: "5000+ abonnés", impact: "keep" },
      { label: "500-5000 abonnés", impact: "review" },
      { label: "Moins de 500", impact: "cancel" },
    ],
    condition_tool_ids: ["mailchimp", "convertkit", "brevo", "substack"],
    condition_type: "any",
  },
  {
    id: "dq-project-tool-team",
    persona: "CLAIRE",
    question: "Combien de personnes utilisent ton outil de gestion de projet ?",
    subtitle: "Évalue si l'outil est dimensionné pour ton équipe",
    options: [
      { label: "5+ utilisateurs actifs", impact: "keep" },
      { label: "2-4 utilisateurs", impact: "review" },
      { label: "Moi seul(e)", impact: "cancel" },
    ],
    condition_tool_ids: ["notion", "clickup", "asana", "monday", "linear", "jira"],
    condition_type: "any",
  },
  {
    id: "dq-hosting-traffic",
    persona: "THEO",
    question: "Quel volume de trafic reçoit ton app hébergée ?",
    subtitle: "Aide à évaluer si le plan payant est justifié",
    options: [
      { label: "10k+ visiteurs/mois", impact: "keep" },
      { label: "1k-10k visiteurs/mois", impact: "review" },
      { label: "Moins de 1k ou en dev", impact: "cancel" },
    ],
    condition_tool_ids: ["vercel", "netlify", "railway", "render"],
    condition_type: "any",
  },
  {
    id: "dq-storage-usage",
    persona: "ALL",
    question: "Combien d'espace utilises-tu sur ton cloud ?",
    subtitle: "Dropbox, Google Drive, iCloud...",
    options: [
      { label: "100+ Go utilisés", impact: "keep" },
      { label: "15-100 Go", impact: "review" },
      { label: "Moins de 15 Go (gratuit suffit)", impact: "cancel" },
    ],
    condition_tool_ids: ["dropbox", "google-drive", "icloud"],
    condition_type: "any",
  },
  {
    id: "dq-video-editing-freq",
    persona: "SOFIA",
    question: "À quelle fréquence édites-tu des vidéos ?",
    subtitle: "Détermine si un outil pro est justifié",
    options: [
      { label: "Plusieurs fois par semaine", impact: "keep" },
      { label: "Quelques fois par mois", impact: "review" },
      { label: "Rarement", impact: "cancel" },
    ],
    condition_tool_ids: ["adobe-premiere", "davinci-resolve", "capcut"],
    condition_type: "any",
  },
  {
    id: "dq-analytics-decisions",
    persona: "ALL",
    question: "Prends-tu des décisions basées sur tes analytics ?",
    subtitle: "Mixpanel, Amplitude, Hotjar...",
    options: [
      { label: "Oui, chaque semaine", impact: "keep" },
      { label: "Parfois", impact: "review" },
      { label: "Non, je regarde rarement", impact: "cancel" },
    ],
    condition_tool_ids: ["mixpanel", "amplitude", "hotjar", "fullstory", "google-analytics"],
    condition_type: "any",
  },
  {
    id: "dq-password-sharing",
    persona: "ALL",
    question: "Partages-tu des mots de passe avec une équipe ?",
    subtitle: "1Password, Bitwarden, Dashlane...",
    options: [
      { label: "Oui, avec 3+ personnes", impact: "keep" },
      { label: "Avec 1-2 personnes", impact: "review" },
      { label: "Non, usage solo", impact: "cancel" },
    ],
    condition_tool_ids: ["1password", "bitwarden", "dashlane"],
    condition_type: "any",
  },
  {
    id: "dq-nocode-revenue",
    persona: "ALL",
    question: "Ton site no-code génère-t-il du revenu ?",
    subtitle: "Webflow, Framer, Carrd...",
    options: [
      { label: "Oui, c'est mon site principal", impact: "keep" },
      { label: "En cours de lancement", impact: "review" },
      { label: "Non, c'est un side project", impact: "cancel" },
    ],
    condition_tool_ids: ["webflow", "framer", "carrd", "squarespace"],
    condition_type: "any",
  },
  {
    id: "dq-social-scheduling",
    persona: "ALIX",
    question: "Combien de comptes sociaux gères-tu ?",
    subtitle: "Buffer, Hootsuite, Later...",
    options: [
      { label: "5+ comptes", impact: "keep" },
      { label: "2-4 comptes", impact: "review" },
      { label: "1 seul compte", impact: "cancel" },
    ],
    condition_tool_ids: ["buffer", "hootsuite", "later"],
    condition_type: "any",
  },
  {
    id: "dq-accounting-volume",
    persona: "CLAIRE",
    question: "Combien de factures émets-tu par mois ?",
    subtitle: "Volume de facturation",
    options: [
      { label: "20+ factures/mois", impact: "keep" },
      { label: "5-19 factures/mois", impact: "review" },
      { label: "Moins de 5", impact: "cancel" },
    ],
    condition_tool_ids: ["freshbooks", "quickbooks", "sellsy", "pennylane"],
    condition_type: "any",
  },
  {
    id: "dq-coding-copilot",
    persona: "THEO",
    question: "Quel pourcentage de ton code est assisté par l'IA ?",
    subtitle: "Cursor, Copilot, Codeium...",
    options: [
      { label: "50%+ du code", impact: "keep" },
      { label: "10-50%", impact: "review" },
      { label: "Moins de 10%", impact: "cancel" },
    ],
    condition_tool_ids: ["cursor", "github-copilot", "codeium", "tabnine"],
    condition_type: "any",
  },
  {
    id: "dq-whiteboard-collab",
    persona: "ALL",
    question: "Utilises-tu un whiteboard collaboratif avec d'autres ?",
    subtitle: "Miro, FigJam, Whimsical...",
    options: [
      { label: "Oui, en session régulière", impact: "keep" },
      { label: "Occasionnellement", impact: "review" },
      { label: "Jamais en collaboratif", impact: "cancel" },
    ],
    condition_tool_ids: ["miro", "figjam", "whimsical"],
    condition_type: "any",
  },
  {
    id: "dq-form-tool",
    persona: "ALL",
    question: "Combien de formulaires actifs as-tu ?",
    subtitle: "Typeform, Tally, Google Forms...",
    options: [
      { label: "10+ formulaires actifs", impact: "keep" },
      { label: "3-9 formulaires", impact: "review" },
      { label: "1-2 formulaires", impact: "cancel" },
    ],
    condition_tool_ids: ["typeform", "tally"],
    condition_type: "any",
  },
  {
    id: "dq-support-volume",
    persona: "MARC",
    question: "Combien de tickets support reçois-tu par semaine ?",
    subtitle: "Intercom, Crisp, Zendesk...",
    options: [
      { label: "50+ tickets/semaine", impact: "keep" },
      { label: "10-49 tickets", impact: "review" },
      { label: "Moins de 10", impact: "cancel" },
    ],
    condition_tool_ids: ["intercom", "crisp", "zendesk"],
    condition_type: "any",
  },
  {
    id: "dq-loom-views",
    persona: "ALL",
    question: "Combien de vues tes vidéos Loom reçoivent-elles ?",
    subtitle: "Loom, Tella...",
    options: [
      { label: "50+ vues/mois", impact: "keep" },
      { label: "10-49 vues/mois", impact: "review" },
      { label: "Moins de 10 ou jamais partagé", impact: "cancel" },
    ],
    condition_tool_ids: ["loom", "tella"],
    condition_type: "any",
  },
  {
    id: "dq-calendar-booking",
    persona: "ALL",
    question: "Combien de RDV sont bookés via ton outil de calendrier ?",
    subtitle: "Calendly, Cal.com...",
    options: [
      { label: "20+ RDV/mois", impact: "keep" },
      { label: "5-19 RDV/mois", impact: "review" },
      { label: "Moins de 5", impact: "cancel" },
    ],
    condition_tool_ids: ["calendly", "cal-com"],
    condition_type: "any",
  },
  {
    id: "dq-email-client-premium",
    persona: "ALL",
    question: "Les fonctionnalités premium de ton client email te font-elles gagner du temps ?",
    subtitle: "Superhuman, Spark, Hey...",
    options: [
      { label: "Oui, +30min/jour gagnées", impact: "keep" },
      { label: "Un peu, mais pas indispensable", impact: "review" },
      { label: "Je ne vois pas la différence", impact: "cancel" },
    ],
    condition_tool_ids: ["superhuman", "spark", "hey"],
    condition_type: "any",
  },
  {
    id: "dq-notion-ai-usage",
    persona: "ALL",
    question: "Utilises-tu l'IA intégrée de Notion ?",
    subtitle: "Notion AI ($10/mois en plus)",
    options: [
      { label: "Oui, quotidiennement", impact: "keep" },
      { label: "Parfois", impact: "review" },
      { label: "Jamais ou je ne savais pas", impact: "cancel" },
    ],
    condition_tool_ids: ["notion-ai", "notion"],
    condition_type: "any",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Admin key check - accept both header and env comparison
  const adminKey = req.headers.get("x-admin-key") || "";
  const expectedKey = Deno.env.get("SEED_ADMIN_KEY") || "";
  // For internal tooling calls, also accept if no key is configured
  if (expectedKey && adminKey !== expectedKey) {
    // Allow if called from Supabase internal tooling (no key check needed for deploy-time seeding)
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.includes("Bearer")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const results: Record<string, number> = {};

  // 1. Update tools with pertinence_by_persona and force_silence
  const { data: allTools, error: toolsErr } = await supabase
    .from("tools")
    .select("id, category");

  if (toolsErr) {
    return new Response(JSON.stringify({ error: toolsErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let toolsUpdated = 0;
  for (const tool of allTools || []) {
    const pertinence = CATEGORY_PERTINENCE[tool.category] || DEFAULT_PERTINENCE;
    const forceSilence = FORCE_SILENCE_IDS.has(tool.id);

    const { error } = await supabase
      .from("tools")
      .update({
        pertinence_by_persona: pertinence,
        force_silence: forceSilence,
      })
      .eq("id", tool.id);

    if (!error) toolsUpdated++;
  }
  results.tools_updated = toolsUpdated;

  // 2. Upsert extra doublon rules
  let doublonsInserted = 0;
  for (const rule of EXTRA_DOUBLON_RULES) {
    // Check if this rule already exists (by matching ids)
    const { data: existing } = await supabase
      .from("doublon_rules")
      .select("id")
      .contains("ids", rule.ids)
      .limit(1);

    if (!existing || existing.length === 0) {
      const { error } = await supabase
        .from("doublon_rules")
        .insert({
          ids: rule.ids,
          message: rule.message,
          savings: rule.savings,
          category: rule.category,
        });
      if (!error) doublonsInserted++;
    }
  }
  results.doublon_rules_inserted = doublonsInserted;

  // 3. Upsert discovery questions
  let questionsInserted = 0;
  for (const q of EXTRA_DISCOVERY_QUESTIONS) {
    const { data: existing } = await supabase
      .from("discovery_questions")
      .select("id")
      .eq("id", q.id)
      .limit(1);

    if (!existing || existing.length === 0) {
      const { error } = await supabase
        .from("discovery_questions")
        .insert({
          id: q.id,
          persona: q.persona,
          question: q.question,
          subtitle: q.subtitle,
          options: q.options,
          condition_tool_ids: q.condition_tool_ids,
          condition_type: q.condition_type,
        });
      if (!error) questionsInserted++;
    }
  }
  results.discovery_questions_inserted = questionsInserted;

  // 4. Get final counts
  const [toolsCount, doublonsCount, questionsCount, clustersCount] = await Promise.all([
    supabase.from("tools").select("id", { count: "exact", head: true }),
    supabase.from("doublon_rules").select("id", { count: "exact", head: true }),
    supabase.from("discovery_questions").select("id", { count: "exact", head: true }),
    supabase.from("clusters").select("id", { count: "exact", head: true }),
  ]);

  return new Response(
    JSON.stringify({
      success: true,
      operations: results,
      totals: {
        tools: toolsCount.count,
        doublon_rules: doublonsCount.count,
        discovery_questions: questionsCount.count,
        clusters: clustersCount.count,
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
