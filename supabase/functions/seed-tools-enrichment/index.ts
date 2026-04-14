import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-admin-key, content-type",
};

const PERTINENCE: Record<string, Record<string, number>> = {
  "finance":             { THEO: 20, SOFIA: 25, MARC: 40, ALIX: 20, CLAIRE: 95 },
  "organization":        { THEO: 60, SOFIA: 50, MARC: 80, ALIX: 40, CLAIRE: 90 },
  "project-management":  { THEO: 60, SOFIA: 50, MARC: 80, ALIX: 40, CLAIRE: 90 },
  "communication":       { THEO: 50, SOFIA: 60, MARC: 85, ALIX: 50, CLAIRE: 70 },
  "automation":          { THEO: 70, SOFIA: 30, MARC: 60, ALIX: 70, CLAIRE: 80 },
  "ai-general":          { THEO: 80, SOFIA: 50, MARC: 70, ALIX: 90, CLAIRE: 60 },
  "analytics":           { THEO: 90, SOFIA: 5,  MARC: 5,  ALIX: 5,  CLAIRE: 10 },
  "design-tools":        { THEO: 20, SOFIA: 95, MARC: 15, ALIX: 30, CLAIRE: 15 },
  "creation":            { THEO: 15, SOFIA: 90, MARC: 10, ALIX: 70, CLAIRE: 10 },
  "nocode-web":          { THEO: 40, SOFIA: 70, MARC: 50, ALIX: 80, CLAIRE: 30 },
  "security":            { THEO: 90, SOFIA: 10, MARC: 20, ALIX: 15, CLAIRE: 30 },
  "email-productivity":  { THEO: 15, SOFIA: 20, MARC: 30, ALIX: 95, CLAIRE: 25 },
  "productivity-tracking": { THEO: 60, SOFIA: 40, MARC: 70, ALIX: 50, CLAIRE: 80 },
  "storage":             { THEO: 70, SOFIA: 40, MARC: 60, ALIX: 50, CLAIRE: 60 },
  "communication-team":  { THEO: 50, SOFIA: 60, MARC: 85, ALIX: 50, CLAIRE: 70 },
};
const DEF = { THEO: 50, SOFIA: 50, MARC: 50, ALIX: 50, CLAIRE: 50 };

interface NewTool {
  id: string; name: string; slug: string; category: string;
  default_monthly_price: number; short_description: string;
  tool_type: string; personas: string[];
}

const NEW_TOOLS: NewTool[] = [
  // CLAIRE — Notes de frais
  { id: "moss", name: "Moss", slug: "moss", category: "finance", default_monthly_price: 9, short_description: "Gestion des dépenses et cartes d'entreprise.", tool_type: "gestion", personas: ["CLAIRE"] },
  { id: "soldo", name: "Soldo", slug: "soldo", category: "finance", default_monthly_price: 6, short_description: "Cartes prépayées et gestion des frais professionnels.", tool_type: "gestion", personas: ["CLAIRE"] },
  { id: "rydoo", name: "Rydoo", slug: "rydoo", category: "finance", default_monthly_price: 8, short_description: "Notes de frais automatisées avec OCR.", tool_type: "gestion", personas: ["CLAIRE"] },
  { id: "payhawk", name: "Payhawk", slug: "payhawk", category: "finance", default_monthly_price: 12, short_description: "Plateforme tout-en-un dépenses, cartes et factures.", tool_type: "gestion", personas: ["CLAIRE"] },
  // CLAIRE — Conformité légale
  { id: "legifrance-pro", name: "Legifrance Pro", slug: "legifrance-pro", category: "organization", default_monthly_price: 0, short_description: "Accès aux textes juridiques français officiels.", tool_type: "gestion", personas: ["CLAIRE"] },
  { id: "wolters-kluwer", name: "Wolters Kluwer", slug: "wolters-kluwer", category: "organization", default_monthly_price: 49, short_description: "Solutions de conformité et veille juridique.", tool_type: "gestion", personas: ["CLAIRE"] },
  { id: "legalstart", name: "Legalstart", slug: "legalstart", category: "organization", default_monthly_price: 15, short_description: "Création et gestion juridique d'entreprise en ligne.", tool_type: "gestion", personas: ["CLAIRE"] },
  { id: "captaindoc", name: "Captaindoc", slug: "captaindoc", category: "organization", default_monthly_price: 19, short_description: "Automatisation de documents juridiques et contractuels.", tool_type: "gestion", personas: ["CLAIRE"] },
  // CLAIRE — Signature électronique
  { id: "signrequest", name: "SignRequest", slug: "signrequest", category: "organization", default_monthly_price: 7, short_description: "Signature électronique simple et rapide.", tool_type: "satellite", personas: ["CLAIRE", "MARC"] },
  { id: "connective", name: "Connective", slug: "connective", category: "organization", default_monthly_price: 15, short_description: "Signatures électroniques et identité numérique.", tool_type: "satellite", personas: ["CLAIRE"] },
  { id: "skribble", name: "Skribble", slug: "skribble", category: "organization", default_monthly_price: 12, short_description: "Signature électronique qualifiée européenne.", tool_type: "satellite", personas: ["CLAIRE"] },
  // CLAIRE — RH et paie
  { id: "silae", name: "Silae", slug: "silae", category: "finance", default_monthly_price: 35, short_description: "Logiciel de paie et gestion sociale française.", tool_type: "gestion", personas: ["CLAIRE"] },
  { id: "sage-paie", name: "Sage Paie", slug: "sage-paie", category: "finance", default_monthly_price: 40, short_description: "Solution de paie complète pour PME.", tool_type: "gestion", personas: ["CLAIRE"] },
  { id: "kelio", name: "Kelio", slug: "kelio", category: "finance", default_monthly_price: 8, short_description: "Gestion des temps et planification RH.", tool_type: "gestion", personas: ["CLAIRE"] },
  { id: "workday", name: "Workday", slug: "workday", category: "finance", default_monthly_price: 99, short_description: "HCM et finance cloud pour grandes entreprises.", tool_type: "core", personas: ["CLAIRE"] },
  // CLAIRE — Gestion de projet (coda, microsoft-project — notion/airtable existent)
  { id: "coda", name: "Coda", slug: "coda", category: "project-management", default_monthly_price: 10, short_description: "Doc collaboratif qui fonctionne comme une app.", tool_type: "core", personas: ["CLAIRE", "MARC", "ALIX"] },
  { id: "microsoft-project", name: "Microsoft Project", slug: "microsoft-project", category: "project-management", default_monthly_price: 25, short_description: "Gestion de projet avancée Microsoft.", tool_type: "gestion", personas: ["CLAIRE"] },

  // MARC — Portail client
  { id: "suitedash", name: "SuiteDash", slug: "suitedash", category: "organization", default_monthly_price: 19, short_description: "Portail client tout-en-un pour agences et freelances.", tool_type: "satellite", personas: ["MARC", "CLAIRE"] },
  { id: "honeybook", name: "HoneyBook", slug: "honeybook", category: "organization", default_monthly_price: 16, short_description: "Gestion de projets clients et facturation créative.", tool_type: "satellite", personas: ["MARC", "SOFIA"] },
  { id: "bloom-crm", name: "Bloom", slug: "bloom-crm", category: "organization", default_monthly_price: 13, short_description: "CRM et portail client pour créatifs et photographes.", tool_type: "satellite", personas: ["MARC", "SOFIA"] },
  // dubsado already exists
  // MARC — LinkedIn et prospection
  { id: "phantombuster", name: "PhantomBuster", slug: "phantombuster", category: "automation", default_monthly_price: 56, short_description: "Extraction de données et automatisation LinkedIn.", tool_type: "ia", personas: ["MARC", "ALIX"] },
  { id: "lemlist", name: "Lemlist", slug: "lemlist", category: "email-productivity", default_monthly_price: 39, short_description: "Outreach email personnalisé avec séquences automatisées.", tool_type: "satellite", personas: ["MARC"] },
  { id: "la-growth-machine", name: "La Growth Machine", slug: "la-growth-machine", category: "automation", default_monthly_price: 60, short_description: "Automatisation multi-canal LinkedIn + Email.", tool_type: "satellite", personas: ["MARC"] },
  { id: "waalaxy", name: "Waalaxy", slug: "waalaxy", category: "automation", default_monthly_price: 40, short_description: "Prospection LinkedIn automatisée.", tool_type: "satellite", personas: ["MARC", "ALIX"] },
  // MARC — Propositions commerciales
  { id: "proposify", name: "Proposify", slug: "proposify", category: "organization", default_monthly_price: 35, short_description: "Création de propositions commerciales professionnelles.", tool_type: "satellite", personas: ["MARC"] },
  { id: "better-proposals", name: "Better Proposals", slug: "better-proposals", category: "organization", default_monthly_price: 19, short_description: "Propositions commerciales avec suivi et signatures.", tool_type: "satellite", personas: ["MARC"] },
  { id: "nusii", name: "Nusii", slug: "nusii", category: "organization", default_monthly_price: 29, short_description: "Logiciel de propositions commerciales pour agences.", tool_type: "satellite", personas: ["MARC"] },
  { id: "loopio", name: "Loopio", slug: "loopio", category: "organization", default_monthly_price: 50, short_description: "Automatisation des réponses RFP et appels d'offres.", tool_type: "satellite", personas: ["MARC"] },
  // MARC — Knowledge management
  { id: "roam-research", name: "Roam Research", slug: "roam-research", category: "organization", default_monthly_price: 15, short_description: "Prise de notes en réseau avec liens bidirectionnels.", tool_type: "satellite", personas: ["MARC", "THEO"] },
  { id: "logseq", name: "Logseq", slug: "logseq", category: "organization", default_monthly_price: 0, short_description: "PKM open-source avec graphe de connaissances.", tool_type: "satellite", personas: ["MARC", "THEO"] },
  { id: "reflect-notes", name: "Reflect", slug: "reflect-notes", category: "organization", default_monthly_price: 10, short_description: "Notes networked avec IA intégrée et backlinks.", tool_type: "satellite", personas: ["MARC"] },
  { id: "heptabase", name: "Heptabase", slug: "heptabase", category: "organization", default_monthly_price: 12, short_description: "Tableau blanc visuel pour la gestion des connaissances.", tool_type: "satellite", personas: ["MARC", "SOFIA"] },

  // ALIX — IA voix (descript/adobe-podcast exist)
  { id: "podcastle", name: "Podcastle", slug: "podcastle", category: "creation", default_monthly_price: 12, short_description: "Enregistrement, édition et transcription de podcasts.", tool_type: "ia", personas: ["ALIX", "SOFIA"] },
  { id: "cleanvoice", name: "Cleanvoice", slug: "cleanvoice", category: "creation", default_monthly_price: 10, short_description: "Nettoyage audio automatique par IA.", tool_type: "ia", personas: ["ALIX"] },
  // ALIX — Analytics social
  { id: "shield-app", name: "Shield App", slug: "shield-app", category: "analytics", default_monthly_price: 8, short_description: "Analytics LinkedIn pour créateurs de contenu.", tool_type: "satellite", personas: ["ALIX", "MARC"] },
  { id: "notionlytics", name: "Notionlytics", slug: "notionlytics", category: "analytics", default_monthly_price: 5, short_description: "Analytics pour pages Notion partagées.", tool_type: "satellite", personas: ["ALIX"] },
  { id: "beehiiv-analytics", name: "Beehiiv Analytics", slug: "beehiiv-analytics", category: "analytics", default_monthly_price: 0, short_description: "Métriques avancées pour newsletters Beehiiv.", tool_type: "satellite", personas: ["ALIX"] },
  { id: "convertkit-analytics", name: "ConvertKit Analytics", slug: "convertkit-analytics", category: "analytics", default_monthly_price: 0, short_description: "Suivi de performance intégré ConvertKit.", tool_type: "satellite", personas: ["ALIX"] },
  // ALIX — Automatisation (n8n exists)
  { id: "pabbly-connect", name: "Pabbly Connect", slug: "pabbly-connect", category: "automation", default_monthly_price: 16, short_description: "Automatisation sans code à prix fixe illimité.", tool_type: "satellite", personas: ["ALIX", "CLAIRE"] },
  { id: "activepieces", name: "Activepieces", slug: "activepieces", category: "automation", default_monthly_price: 0, short_description: "Automatisation open-source alternative à Zapier.", tool_type: "satellite", personas: ["ALIX", "THEO"] },
  { id: "integrately", name: "Integrately", slug: "integrately", category: "automation", default_monthly_price: 20, short_description: "Automatisations en 1 clic entre 1000+ apps.", tool_type: "satellite", personas: ["ALIX"] },

  // THEO — Productivité dev (obsidian exists)
  { id: "warp", name: "Warp", slug: "warp", category: "productivity-tracking", default_monthly_price: 0, short_description: "Terminal moderne avec IA intégrée pour développeurs.", tool_type: "core", personas: ["THEO"] },
  { id: "fig-terminal", name: "Fig", slug: "fig-terminal", category: "productivity-tracking", default_monthly_price: 0, short_description: "Autocomplétion IDE pour le terminal.", tool_type: "satellite", personas: ["THEO"] },
  { id: "zed", name: "Zed", slug: "zed", category: "productivity-tracking", default_monthly_price: 0, short_description: "Éditeur de code haute performance avec collaboration.", tool_type: "core", personas: ["THEO"] },
  { id: "arc-browser", name: "Arc Browser", slug: "arc-browser", category: "productivity-tracking", default_monthly_price: 0, short_description: "Navigateur repensé pour la productivité.", tool_type: "satellite", personas: ["THEO", "SOFIA"] },
  // THEO — Docs et config
  { id: "doppler", name: "Doppler", slug: "doppler", category: "security", default_monthly_price: 0, short_description: "Gestion centralisée des secrets et variables d'environnement.", tool_type: "core", personas: ["THEO"] },
  { id: "vault", name: "HashiCorp Vault", slug: "vault", category: "security", default_monthly_price: 0, short_description: "Gestion de secrets et chiffrement enterprise.", tool_type: "core", personas: ["THEO"] },
  { id: "infisical", name: "Infisical", slug: "infisical", category: "security", default_monthly_price: 0, short_description: "Gestion de secrets open-source pour équipes dev.", tool_type: "core", personas: ["THEO"] },
  { id: "dotenv-vault", name: "Dotenv Vault", slug: "dotenv-vault", category: "security", default_monthly_price: 0, short_description: "Sync et chiffrement de fichiers .env entre environnements.", tool_type: "satellite", personas: ["THEO"] },

  // SOFIA — Workflow créatif (webflow/framer exist)
  { id: "readymag", name: "Readymag", slug: "readymag", category: "nocode-web", default_monthly_price: 16, short_description: "Design éditorial web avec animations avancées.", tool_type: "satellite", personas: ["SOFIA"] },
  { id: "cargo-site", name: "Cargo Site", slug: "cargo-site", category: "nocode-web", default_monthly_price: 13, short_description: "Portfolios créatifs avec design expérimental.", tool_type: "satellite", personas: ["SOFIA"] },
  // SOFIA — CRM Client (dubsado exists, bloom-crm already added above)
  { id: "17hats", name: "17hats", slug: "17hats", category: "organization", default_monthly_price: 15, short_description: "CRM all-in-one pour freelances créatifs.", tool_type: "satellite", personas: ["SOFIA"] },
  { id: "tave", name: "Táve", slug: "tave", category: "organization", default_monthly_price: 22, short_description: "Studio manager pour photographes et vidéastes.", tool_type: "satellite", personas: ["SOFIA"] },
];

// Cluster updates: cluster_id -> tool_ids to ADD (will be merged with existing)
const CLUSTER_ADDITIONS: Record<string, string[]> = {
  // CLAIRE — new clusters needed
  "claire-expenses":    ["moss", "soldo", "rydoo", "payhawk"],
  "claire-legal":       ["legifrance-pro", "wolters-kluwer", "legalstart", "captaindoc"],
  "claire-esignature":  ["signrequest", "connective", "skribble"],
  "claire-hr":          ["silae", "sage-paie", "kelio", "workday"],
  // CLAIRE existing cluster updates
  "claire-2":           ["coda", "microsoft-project"], // add to gestion de projet

  // MARC — new clusters
  "marc-portal":        ["suitedash", "honeybook", "bloom-crm", "dubsado"],
  "marc-prospection":   ["phantombuster", "lemlist", "la-growth-machine", "waalaxy"],
  "marc-proposals":     ["proposify", "better-proposals", "nusii", "loopio"],
  "marc-knowledge":     ["roam-research", "logseq", "reflect-notes", "heptabase"],

  // ALIX — updates and new
  "alix-6":             ["podcastle", "cleanvoice"],  // add to podcast/audio
  "alix-analytics":     ["shield-app", "notionlytics", "beehiiv-analytics", "convertkit-analytics"],
  "alix-automation":    ["pabbly-connect", "activepieces", "integrately"],

  // THEO — new clusters
  "theo-devtools":      ["warp", "fig-terminal", "zed", "arc-browser", "obsidian"],
  "theo-secrets":       ["doppler", "vault", "infisical", "dotenv-vault"],

  // SOFIA — updates and new
  "sofia-web":          ["readymag", "cargo-site"], // add to prototypage web (sofia-8)
  "sofia-clientcrm":    ["bloom-crm", "dubsado", "17hats", "tave"],
};

// New clusters to create
const NEW_CLUSTERS = [
  { id: "claire-expenses", persona: "CLAIRE", order: 10, question: "Tes outils de notes de frais", why: "La gestion des dépenses est critique pour les ops", cols: 2 },
  { id: "claire-legal", persona: "CLAIRE", order: 11, question: "Tes outils juridiques et conformité", why: "Conformité légale et documents contractuels", cols: 2 },
  { id: "claire-esignature", persona: "CLAIRE", order: 12, question: "Tes outils de signature électronique", why: "Signatures de contrats et documents", cols: 2 },
  { id: "claire-hr", persona: "CLAIRE", order: 13, question: "Tes outils RH et paie avancés", why: "Gestion sociale et paie", cols: 2 },
  { id: "marc-portal", persona: "MARC", order: 11, question: "Tes portails client", why: "Centralisation des échanges client", cols: 2 },
  { id: "marc-prospection", persona: "MARC", order: 12, question: "Tes outils de prospection LinkedIn", why: "Automatisation de la prospection B2B", cols: 2 },
  { id: "marc-proposals", persona: "MARC", order: 13, question: "Tes outils de propositions commerciales", why: "Création et suivi des devis et propositions", cols: 2 },
  { id: "marc-knowledge", persona: "MARC", order: 14, question: "Tes outils de gestion des connaissances", why: "Organisation et partage du savoir", cols: 2 },
  { id: "alix-analytics", persona: "ALIX", order: 13, question: "Tes outils d'analytics social", why: "Mesurer l'impact de ton contenu", cols: 2 },
  { id: "alix-automation", persona: "ALIX", order: 14, question: "Tes outils d'automatisation contenu", why: "Automatiser la distribution de contenu", cols: 2 },
  { id: "theo-devtools", persona: "THEO", order: 12, question: "Tes outils de productivité dev", why: "Terminal, éditeur et navigateur pour le flow", cols: 2 },
  { id: "theo-secrets", persona: "THEO", order: 13, question: "Tes outils de gestion des secrets", why: "Sécurisation des variables d'environnement", cols: 2 },
  { id: "sofia-clientcrm", persona: "SOFIA", order: 13, question: "Tes outils CRM client créatif", why: "Gestion des projets et relations client", cols: 2 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results: Record<string, number> = {};

  // 1. Insert new tools
  let toolsInserted = 0;
  for (const t of NEW_TOOLS) {
    const pert = PERTINENCE[t.category] || DEF;
    const { error } = await supabase.from("tools").upsert({
      id: t.id,
      name: t.name,
      slug: t.slug,
      category: t.category,
      default_monthly_price: t.default_monthly_price,
      short_description: t.short_description,
      tool_type: t.tool_type,
      personas: t.personas,
      pertinence_by_persona: pert,
      force_silence: false,
      functional_needs: [],
    }, { onConflict: "id" });
    if (!error) toolsInserted++;
    else console.error(`Tool ${t.id}:`, error.message);
  }
  results.tools_inserted = toolsInserted;

  // 2. Create new clusters
  let clustersCreated = 0;
  for (const c of NEW_CLUSTERS) {
    const toolIds = CLUSTER_ADDITIONS[c.id] || [];
    const { error } = await supabase.from("clusters").upsert({
      id: c.id,
      persona: c.persona,
      order: c.order,
      question: c.question,
      why: c.why,
      cols: c.cols,
      tool_ids: toolIds,
    }, { onConflict: "id" });
    if (!error) clustersCreated++;
    else console.error(`Cluster ${c.id}:`, error.message);
  }
  results.clusters_created = clustersCreated;

  // 3. Update existing clusters with new tool_ids
  const existingUpdates: Record<string, string[]> = {
    "claire-2": ["coda", "microsoft-project"],
    "alix-6": ["podcastle", "cleanvoice"],
    "sofia-8": ["readymag", "cargo-site"],
  };

  let clustersUpdated = 0;
  for (const [clusterId, newIds] of Object.entries(existingUpdates)) {
    const { data } = await supabase.from("clusters").select("tool_ids").eq("id", clusterId).single();
    if (data) {
      const existing = Array.isArray(data.tool_ids) ? data.tool_ids as string[] : [];
      const merged = [...new Set([...existing, ...newIds])].slice(0, 7);
      const { error } = await supabase.from("clusters").update({ tool_ids: merged }).eq("id", clusterId);
      if (!error) clustersUpdated++;
    }
  }
  results.clusters_updated = clustersUpdated;

  // 4. Final counts
  const [tc, cc] = await Promise.all([
    supabase.from("tools").select("id", { count: "exact", head: true }),
    supabase.from("clusters").select("id", { count: "exact", head: true }),
  ]);

  return new Response(JSON.stringify({
    success: true,
    operations: results,
    totals: { tools: tc.count, clusters: cc.count },
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
