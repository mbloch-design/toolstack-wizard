export type SuggestedStackNeedId = "ia" | "organisation" | "design" | "automation" | "marketing" | "vente" | "finance" | "dev";

export interface StackClassificationTool {
  id?: string | null;
  slug?: string | null;
  name?: string | null;
  categoryId?: string | null;
  shortDescription?: string | null;
  shortDescriptionEn?: string | null;
  covers?: string[] | null;
  functional_needs?: string[] | null;
  verticals?: string[] | null;
}

export interface StackAutoClassification {
  needIds: SuggestedStackNeedId[];
  confidence: "high" | "medium" | "low";
  reason: "known-tool" | "structured-signals" | "category" | "text" | "unclassified";
}

const KNOWN_TOOL_NEEDS: Partial<Record<SuggestedStackNeedId, string[]>> = {
  ia: ["chatgpt", "claude", "perplexity", "gemini", "deepseek", "mistral", "midjourney", "runway"],
  organisation: ["notion", "clickup", "asana", "monday", "trello", "basecamp", "coda", "slack", "google-drive", "dropbox", "loom", "calendly"],
  design: ["figma", "canva", "framer", "adobe-photoshop", "adobe-illustrator", "affinity-designer", "blender", "sketch"],
  automation: ["make", "zapier", "n8n", "activepieces", "softr", "bubble"],
  marketing: ["mailchimp", "brevo", "buffer", "google-analytics", "semrush", "ahrefs"],
  vente: ["hubspot", "pipedrive", "salesforce", "apollo-io", "close", "gong", "attio", "folk", "snov-io"],
  finance: ["stripe", "pennylane", "indy", "quickbooks", "dext", "qonto", "paypal"],
  dev: ["github", "gitlab", "cursor", "github-copilot", "vercel", "supabase", "next-js", "sentry", "docker", "railway", "digitalocean", "firebase", "netlify"],
};

const CATEGORY_NEEDS: Partial<Record<SuggestedStackNeedId, string[]>> = {
  ia: ["ai-general", "ai-image", "ai-writing", "ai-coding"],
  organisation: ["organization", "project-management", "communication-team", "storage"],
  design: ["design-tools", "creation", "design", "photo", "video"],
  automation: ["automation"],
  marketing: ["email-productivity", "analytics", "marketing", "seo", "social-media"],
  vente: ["crm", "sales", "ecommerce"],
  finance: ["finance", "accounting", "banking"],
  dev: ["development", "developer-tools", "hosting", "database", "security"],
};

const SIGNAL_NEEDS: Record<SuggestedStackNeedId, string[]> = {
  ia: ["assistant-generaliste", "generation-texte", "generation-image", "generation-video", "analyse-documents", "llm", "prompt", "transcription"],
  organisation: ["project-management", "task-management", "gestion-projet", "gestion-taches", "collaboration", "notes", "wiki", "calendar", "planification", "chat-equipe", "stockage-fichiers", "video-async"],
  design: ["ui-design", "prototypage", "prototyping", "design-system", "wireframing", "design-visuel", "retouche-photo", "montage-video", "motion-design", "logos"],
  automation: ["automation", "automatisation", "workflow", "workflows", "no-code", "nocode", "api-integration", "connectors", "trigger"],
  marketing: ["email-marketing", "marketing-email", "newsletter", "seo", "social-media", "planification-posts", "analytics-email", "audience", "campaign-measurement"],
  vente: ["crm", "lead-generation", "prospection", "pipeline", "checkout", "ecommerce", "booking"],
  finance: ["facturation", "paiements", "comptabilite", "invoice", "billing", "expense-management", "receipt-capture", "banking", "paie"],
  dev: ["versioning-code", "code-review", "ci-cd", "deploiement", "hosting", "database", "monitoring", "bug-tracking", "backend", "frontend"],
};

const TEXT_PATTERNS: Record<SuggestedStackNeedId, RegExp> = {
  ia: /\b(ai|ia|llm|gpt)\b|assistant|prompt|generati(?:on|ve)/i,
  organisation: /project|projet|task|tâche|note|wiki|calendar|agenda|collaboration|meeting|réunion|workspace/i,
  design: /design|prototype|photo|image|visual|visuel|brand|logo|video|vidéo|motion|illustration/i,
  automation: /automat|workflow|zapier|no-code|nocode|trigger|connector/i,
  marketing: /marketing|seo|newsletter|campaign|campagne|audience|social media|analytics/i,
  vente: /\bcrm\b|sales|vente|lead|prospect|pipeline|checkout|ecommerce/i,
  finance: /finance|account|compta|invoice|factur|billing|expense|payroll|bank|tax/i,
  dev: /developer|\bdev\b|\bcode\b|github|gitlab|deploy|hosting|database|backend|frontend|monitoring/i,
};

const NEED_ORDER = Object.keys(SIGNAL_NEEDS) as SuggestedStackNeedId[];

function normalize(value?: string | null) {
  return (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function classifyToolForStack(tool: StackClassificationTool): StackAutoClassification {
  const identity = normalize(tool.slug || tool.id || tool.name);
  const knownNeed = NEED_ORDER.find((needId) => KNOWN_TOOL_NEEDS[needId]?.includes(identity));
  if (knownNeed) return { needIds: [knownNeed], confidence: "high", reason: "known-tool" };

  const signals = new Set([...(tool.covers || []), ...(tool.functional_needs || []), ...(tool.verticals || [])].map(normalize));
  const signalScores = NEED_ORDER.map((needId) => ({
    needId,
    score: SIGNAL_NEEDS[needId].reduce((score, signal) => score + (signals.has(normalize(signal)) ? 1 : 0), 0),
  })).sort((a, b) => b.score - a.score || NEED_ORDER.indexOf(a.needId) - NEED_ORDER.indexOf(b.needId));
  if (signalScores[0].score >= 1 && signalScores[0].score > signalScores[1].score) {
    return { needIds: [signalScores[0].needId], confidence: signalScores[0].score >= 2 ? "high" : "medium", reason: "structured-signals" };
  }

  const category = normalize(tool.categoryId);
  const categoryNeed = NEED_ORDER.find((needId) => CATEGORY_NEEDS[needId]?.map(normalize).includes(category));
  if (categoryNeed) return { needIds: [categoryNeed], confidence: "medium", reason: "category" };

  const text = [tool.name, tool.shortDescription, tool.shortDescriptionEn].filter(Boolean).join(" ");
  const textMatches = NEED_ORDER.filter((needId) => TEXT_PATTERNS[needId].test(text));
  if (textMatches.length === 1) return { needIds: textMatches, confidence: "low", reason: "text" };

  return { needIds: [], confidence: "low", reason: "unclassified" };
}
