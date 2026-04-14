export interface FeaturedComparison {
  slugPair: string;
  toolA: string;
  toolB: string;
}

export const FEATURED_COMPARISONS: FeaturedComparison[] = [
  // Original 8
  { slugPair: "chatgpt-vs-claude", toolA: "chatgpt", toolB: "claude" },
  { slugPair: "dropbox-vs-google-drive", toolA: "dropbox", toolB: "google-drive" },
  { slugPair: "zapier-vs-make", toolA: "zapier", toolB: "make" },
  { slugPair: "notion-vs-obsidian", toolA: "notion", toolB: "obsidian" },
  { slugPair: "typeform-vs-tally", toolA: "typeform", toolB: "tally" },
  { slugPair: "midjourney-vs-firefly", toolA: "midjourney", toolB: "adobe-firefly" },
  { slugPair: "github-copilot-vs-cursor", toolA: "github-copilot", toolB: "cursor" },
  { slugPair: "grammarly-vs-claude", toolA: "grammarly", toolB: "claude" },
  // New 8
  { slugPair: "figma-vs-canva", toolA: "figma", toolB: "canva" },
  { slugPair: "linear-vs-jira", toolA: "linear", toolB: "jira" },
  { slugPair: "notion-vs-airtable", toolA: "notion", toolB: "airtable" },
  { slugPair: "vercel-vs-replit", toolA: "vercel", toolB: "replit" },
  { slugPair: "semrush-vs-similarweb", toolA: "semrush", toolB: "similarweb" },
  { slugPair: "stripe-vs-razorpay", toolA: "stripe", toolB: "razorpay" },
  { slugPair: "slack-vs-front", toolA: "slack", toolB: "front" },
  { slugPair: "notion-vs-coda", toolA: "notion", toolB: "coda" },
];
