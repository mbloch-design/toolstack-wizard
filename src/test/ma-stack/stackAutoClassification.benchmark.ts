import type { SuggestedStackNeedId } from "@/lib/stackAutoClassification";

export type StackClassificationBenchmarkCase = {
  slug: string;
  acceptableNeedIds: SuggestedStackNeedId[];
};

function cases(needId: SuggestedStackNeedId, slugs: string[]): StackClassificationBenchmarkCase[] {
  return slugs.map((slug) => ({ slug, acceptableNeedIds: [needId] }));
}

/**
 * Jeu produit fixe et lisible : des outils connus, des challengers et des
 * catégories voisines. Les attentes sont définies à la main, jamais dérivées
 * du moteur évalué.
 */
export const STACK_CLASSIFICATION_BENCHMARK: StackClassificationBenchmarkCase[] = [
  ...cases("ia", [
    "chatgpt", "claude", "perplexity", "gemini", "deepseek", "hume-ai", "midjourney",
    "runway", "ideogram", "leonardo-ai", "stable-diffusion", "jasper", "elevenlabs",
  ]),
  ...cases("organisation", [
    "notion", "asana", "clickup", "monday", "trello", "coda", "slack", "google-drive",
    "dropbox", "loom", "calendly", "confluence", "box",
  ]),
  ...cases("design", [
    "figma", "canva", "framer", "adobe-photoshop", "adobe-illustrator", "affinity-designer",
    "blender", "sketch", "adobe-xd", "affinity-photo", "davinci-resolve", "capcut", "penpot",
  ]),
  ...cases("automation", [
    "make", "zapier", "n8n", "activepieces", "softr", "bubble", "base44",
    "glide", "integrately", "pabbly-connect", "phantombuster", "gumloop",
  ]),
  { slug: "airtable", acceptableNeedIds: ["automation", "organisation"] },
  ...cases("marketing", [
    "mailchimp", "brevo", "buffer", "google-analytics", "semrush", "ahrefs",
    "activecampaign", "beehiiv", "hootsuite", "later", "klaviyo", "metricool",
  ]),
  ...cases("vente", [
    "hubspot", "pipedrive", "salesforce", "apollo-io", "close", "gong",
    "attio", "folk", "capsule", "insightly", "salesflare", "snov-io",
  ]),
  ...cases("finance", [
    "stripe", "pennylane", "indy", "quickbooks", "dext", "qonto",
    "paypal", "freshbooks", "xero", "payhawk", "moss", "shine",
  ]),
  ...cases("dev", [
    "github", "railway", "cursor", "github-copilot", "vercel", "supabase",
    "next-js", "sentry", "docker", "digitalocean", "firebase", "netlify",
  ]),
];
