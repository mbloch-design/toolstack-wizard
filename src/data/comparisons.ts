export interface FeaturedComparison {
  slugPair: string;
  toolA: string;
  toolB: string;
}

export const FEATURED_COMPARISONS: FeaturedComparison[] = [
  // AI / Writing
  { slugPair: "chatgpt-vs-claude", toolA: "chatgpt", toolB: "claude" },
  { slugPair: "chatgpt-vs-gemini", toolA: "chatgpt", toolB: "gemini" },
  { slugPair: "chatgpt-vs-perplexity", toolA: "chatgpt", toolB: "perplexity" },
  { slugPair: "claude-vs-gemini", toolA: "claude", toolB: "gemini" },
  { slugPair: "deepseek-vs-chatgpt", toolA: "deepseek", toolB: "chatgpt" },
  { slugPair: "grammarly-vs-claude", toolA: "grammarly", toolB: "claude" },
  { slugPair: "grammarly-vs-prowritingaid", toolA: "grammarly", toolB: "prowritingaid" },
  { slugPair: "midjourney-vs-firefly", toolA: "midjourney", toolB: "adobe-firefly" },
  { slugPair: "github-copilot-vs-cursor", toolA: "github-copilot", toolB: "cursor" },

  // Productivity / Project Management
  { slugPair: "notion-vs-obsidian", toolA: "notion", toolB: "obsidian" },
  { slugPair: "notion-vs-airtable", toolA: "notion", toolB: "airtable" },
  { slugPair: "notion-vs-trello", toolA: "notion", toolB: "trello" },
  { slugPair: "notion-vs-clickup", toolA: "notion", toolB: "clickup" },
  { slugPair: "notion-vs-coda", toolA: "notion", toolB: "coda" },
  { slugPair: "asana-vs-trello", toolA: "asana", toolB: "trello" },
  { slugPair: "asana-vs-clickup", toolA: "asana", toolB: "clickup" },
  { slugPair: "clickup-vs-asana", toolA: "clickup", toolB: "asana" },
  { slugPair: "clickup-vs-trello", toolA: "clickup", toolB: "trello" },
  { slugPair: "trello-vs-linear", toolA: "trello", toolB: "linear" },
  { slugPair: "wrike-vs-asana", toolA: "wrike", toolB: "asana" },
  { slugPair: "basecamp-vs-asana", toolA: "basecamp", toolB: "asana" },
  { slugPair: "hive-vs-asana", toolA: "hive", toolB: "asana" },
  { slugPair: "todoist-vs-trello", toolA: "todoist", toolB: "trello" },
  { slugPair: "smartsuite-vs-notion", toolA: "smartsuite", toolB: "notion" },
  { slugPair: "linear-vs-jira", toolA: "linear", toolB: "jira" },

  // Automation
  { slugPair: "zapier-vs-make", toolA: "zapier", toolB: "make" },
  { slugPair: "make-vs-zapier", toolA: "make", toolB: "zapier" },
  { slugPair: "zapier-vs-albato", toolA: "zapier", toolB: "albato" },

  // Design
  { slugPair: "figma-vs-canva", toolA: "figma", toolB: "canva" },
  { slugPair: "canva-vs-photoshop-elements", toolA: "canva", toolB: "photoshop-elements" },
  { slugPair: "visme-vs-canva", toolA: "visme", toolB: "canva" },
  { slugPair: "prezi-vs-pitch", toolA: "prezi", toolB: "pitch" },

  // Storage / File Sharing
  { slugPair: "dropbox-vs-google-drive", toolA: "dropbox", toolB: "google-drive" },
  { slugPair: "box-vs-dropbox", toolA: "box", toolB: "dropbox" },
  { slugPair: "box-vs-google-drive", toolA: "box", toolB: "google-drive" },

  // Email Marketing
  { slugPair: "mailchimp-vs-sendinblue", toolA: "mailchimp", toolB: "sendinblue" },
  { slugPair: "mailchimp-vs-getresponse", toolA: "mailchimp", toolB: "getresponse" },
  { slugPair: "mailchimp-vs-convertkit", toolA: "mailchimp", toolB: "convertkit" },
  { slugPair: "convertkit-vs-getresponse", toolA: "convertkit", toolB: "getresponse" },
  { slugPair: "moosend-vs-mailchimp", toolA: "moosend", toolB: "mailchimp" },

  // CRM / Sales
  { slugPair: "hubspot-vs-pipedrive", toolA: "hubspot", toolB: "pipedrive" },
  { slugPair: "pipedrive-vs-salesforce", toolA: "pipedrive", toolB: "salesforce" },
  { slugPair: "pipedrive-vs-zoho", toolA: "pipedrive", toolB: "zoho" },
  { slugPair: "salesforce-vs-zoho", toolA: "salesforce", toolB: "zoho" },
  { slugPair: "close-vs-pipedrive", toolA: "close", toolB: "pipedrive" },
  { slugPair: "capsule-vs-pipedrive", toolA: "capsule", toolB: "pipedrive" },

  // Website Builders / CMS
  { slugPair: "webflow-vs-squarespace", toolA: "webflow", toolB: "squarespace" },
  { slugPair: "webflow-vs-framer", toolA: "webflow", toolB: "framer" },
  { slugPair: "webflow-vs-wix", toolA: "webflow", toolB: "wix" },
  { slugPair: "wix-vs-squarespace", toolA: "wix", toolB: "squarespace" },
  { slugPair: "wordpress-com-vs-wix", toolA: "wordpress-com", toolB: "wix" },
  { slugPair: "shopify-vs-wix", toolA: "shopify", toolB: "wix" },
  { slugPair: "vercel-vs-replit", toolA: "vercel", toolB: "replit" },

  // E-commerce
  { slugPair: "shopify-vs-woocommerce", toolA: "shopify", toolB: "woocommerce" },

  // Social Media Management
  { slugPair: "hootsuite-vs-later", toolA: "hootsuite", toolB: "later" },
  { slugPair: "hootsuite-vs-socialbee", toolA: "hootsuite", toolB: "socialbee" },
  { slugPair: "later-vs-socialbee", toolA: "later", toolB: "socialbee" },
  { slugPair: "sendible-vs-hootsuite", toolA: "sendible", toolB: "hootsuite" },

  // Time Tracking
  { slugPair: "toggl-vs-clockify", toolA: "toggl", toolB: "clockify" },
  { slugPair: "toggl-vs-timecamp", toolA: "toggl", toolB: "timecamp" },
  { slugPair: "clockify-vs-timecamp", toolA: "clockify", toolB: "timecamp" },
  { slugPair: "time-doctor-vs-clockify", toolA: "time-doctor", toolB: "clockify" },

  // Landing Pages
  { slugPair: "unbounce-vs-instapage", toolA: "unbounce", toolB: "instapage" },
  { slugPair: "unbounce-vs-leadpages", toolA: "unbounce", toolB: "leadpages" },
  { slugPair: "instapage-vs-leadpages", toolA: "instapage", toolB: "leadpages" },

  // Payments / Finance
  { slugPair: "stripe-vs-paypal", toolA: "stripe", toolB: "paypal" },
  { slugPair: "stripe-vs-razorpay", toolA: "stripe", toolB: "razorpay" },
  { slugPair: "quickbooks-vs-freshbooks", toolA: "quickbooks", toolB: "freshbooks" },

  // Forms / Surveys
  { slugPair: "typeform-vs-tally", toolA: "typeform", toolB: "tally" },
  { slugPair: "typeform-vs-surveysparrow", toolA: "typeform", toolB: "surveysparrow" },

  // Communication / Support
  { slugPair: "slack-vs-microsoft-teams", toolA: "slack", toolB: "microsoft-teams" },
  { slugPair: "slack-vs-front", toolA: "slack", toolB: "front" },
  { slugPair: "tidio-vs-zendesk", toolA: "tidio", toolB: "zendesk" },

  // Video
  { slugPair: "loom-vs-vimeo", toolA: "loom", toolB: "vimeo" },

  // Client Management
  { slugPair: "dubsado-vs-honeybook", toolA: "dubsado", toolB: "honeybook" },

  // SEO / Analytics
  { slugPair: "semrush-vs-similarweb", toolA: "semrush", toolB: "similarweb" },
];
