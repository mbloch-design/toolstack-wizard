import { getDomainFromUrl } from "@/lib/toolUtils";

export type LogoCandidateTool = {
  id?: string;
  slug?: string;
  name?: string;
  websiteUrl?: string;
  affiliateLink?: string;
  logo?: string;
  pricing_v5?: {
    source_domain?: string;
  } | null;
};

// ── Manual slug map: tool-id / slug → simpleicons.org slug ──────────────────
// Only needed when the normalized candidate key doesn't match the simpleicons slug directly.
// Auto-probing (below) handles the common case where they match.
const SIMPLE_ICON_SLUGS: Record<string, string> = {
  // A
  "1password": "1password",
  activecampaign: "activecampaign",
  adobe: "adobe",
  "adobe-acrobat-sign": "adobeacrobatreader",
  "adobe-after-effects": "adobeaftereffects",
  "adobe-cc": "adobecreativecloud",
  "adobe-creative-cloud": "adobecreativecloud",
  "adobe-illustrator": "adobeillustrator",
  indesign: "adobeindesign",
  "adobe-lightroom": "adobelightroom",
  "adobe-photoshop": "adobephotoshop",
  "adobe-premiere-pro": "adobepremierepro",
  "adobe-xd": "adobexd",
  ahrefs: "ahrefs",
  aircall: "aircall",
  airtable: "airtable",
  amplitude: "amplitude",
  angular: "angular",
  anthropic: "anthropic",
  asana: "asana",
  auth0: "auth0",
  aws: "amazonaws",
  "amazon-web-services": "amazonaws",
  azure: "microsoftazure",
  // B
  basecamp: "basecamp",
  beehiiv: "beehiiv",
  bitwarden: "bitwarden",
  blender: "blender",
  box: "box",
  brevo: "brevo",
  buffer: "buffer",
  buzzsprout: "buzzsprout",
  // C
  calendly: "calendly",
  canva: "canva",
  carrd: "carrd",
  chatgpt: "openai",
  chargebee: "chargebee",
  chrome: "googlechrome",
  claude: "claude",
  clickup: "clickup",
  cloudflare: "cloudflare",
  contentful: "contentful",
  cypress: "cypress",
  // D
  datadog: "datadog",
  dbt: "dbt",
  discord: "discord",
  docker: "docker",
  docusign: "docusign",
  drift: "drift",
  dropbox: "dropbox",
  // E
  elasticsearch: "elasticsearch",
  excel: "microsoftexcel",
  // F
  facebook: "facebook",
  figma: "figma",
  firebase: "firebase",
  "figma-iconify": "iconify",
  "figma-tokens": "tokensstudio",
  "tokens-studio": "tokensstudio",
  framer: "framer",
  freshdesk: "freshdesk",
  // G
  gcp: "googlecloud",
  gemini: "googlegemini",
  "google-cloud": "googlecloud",
  "google-analytics": "googleanalytics",
  "google-drive": "googledrive",
  "google-workspace": "google",
  ghost: "ghost",
  gitbook: "gitbook",
  github: "github",
  "github-copilot": "githubcopilot",
  gitlab: "gitlab",
  google: "google",
  grafana: "grafana",
  // H
  helpscout: "helpscout",
  heroku: "heroku",
  hotjar: "hotjar",
  hubspot: "hubspot",
  // I
  instagram: "instagram",
  intercom: "intercom",
  insomnia: "insomnia",
  // J
  jest: "jest",
  jira: "jira",
  // K
  kibana: "kibana",
  klaviyo: "klaviyo",
  kubernetes: "kubernetes",
  // L
  linear: "linear",
  linkedin: "linkedin",
  loom: "loom",
  // M
  mailchimp: "mailchimp",
  mailerlite: "mailerlite",
  make: "make",
  mapbox: "mapbox",
  meta: "meta",
  miro: "miro",
  mixpanel: "mixpanel",
  mongodb: "mongodb",
  monday: "mondaydotcom",
  "monday-com": "mondaydotcom",
  // N
  namecheap: "namecheap",
  netlify: "netlify",
  "next-js": "nextdotjs",
  nextjs: "nextdotjs",
  nginx: "nginx",
  notion: "notion",
  npm: "npm",
  nuxt: "nuxt",
  nuxtjs: "nuxt",
  // O
  okta: "okta",
  onedrive: "microsoftonedrive",
  openai: "openai",
  outlook: "microsoftoutlook",
  // P
  pagerduty: "pagerduty",
  paypal: "paypal",
  perplexity: "perplexity",
  pinterest: "pinterest",
  pipedrive: "pipedrive",
  postgresql: "postgresql",
  posthog: "posthog",
  postman: "postman",
  powerpoint: "microsoftpowerpoint",
  prisma: "prisma",
  // R
  raycast: "raycast",
  react: "react",
  redis: "redis",
  reddit: "reddit",
  // S
  salesforce: "salesforce",
  sendgrid: "sendgrid",
  sentry: "sentry",
  shopify: "shopify",
  sketch: "sketch",
  slack: "slack",
  spotify: "spotify",
  storybook: "storybook",
  stripe: "stripe",
  supabase: "supabase",
  svelte: "svelte",
  sveltekit: "svelte",
  // T
  tailwind: "tailwindcss",
  tailwindcss: "tailwindcss",
  teams: "microsoftteams",
  "microsoft-teams": "microsoftteams",
  telegram: "telegram",
  terraform: "terraform",
  todoist: "todoist",
  trello: "trello",
  twilio: "twilio",
  tiktok: "tiktok",
  twitter: "x",
  typescript: "typescript",
  typeform: "typeform",
  // V
  vercel: "vercel",
  vue: "vuedotjs",
  vuejs: "vuedotjs",
  vscode: "visualstudiocode",
  // W
  webflow: "webflow",
  webpack: "webpack",
  whatsapp: "whatsapp",
  wix: "wix",
  wordpress: "wordpress",
  word: "microsoftword",
  // X
  xero: "xero",
  // Y
  youtube: "youtube",
  // Z
  zapier: "zapier",
  zendesk: "zendesk",
  zoom: "zoom",
};

// Brand color overrides — only when simpleicons brand color is wrong/too light for UI.
// Leave empty to auto-use the brand's own color from simpleicons.
const SIMPLE_ICON_COLORS: Record<string, string> = {
  notion: "111111",
  github: "181717",
};

const PRODUCT_BADGES: Record<string, { label: string; bg: string; fg: string; border: string }> = {
  "adobe-acrobat-sign": { label: "Ac", bg: "FFF1F1", fg: "E41E26", border: "E41E26" },
  "adobe-after-effects": { label: "Ae", bg: "1F1148", fg: "D8B5FF", border: "9A6DFF" },
  "adobe-cc": { label: "CC", bg: "FFF1F1", fg: "E41E26", border: "E41E26" },
  "adobe-illustrator": { label: "Ai", bg: "2C1400", fg: "FF9A00", border: "FF9A00" },
  indesign: { label: "Id", bg: "3A0820", fg: "FF5DA2", border: "FF5DA2" },
  "adobe-lightroom": { label: "Lr", bg: "001E36", fg: "31A8FF", border: "31A8FF" },
  "adobe-photoshop": { label: "Ps", bg: "001E36", fg: "31A8FF", border: "31A8FF" },
  "adobe-premiere-pro": { label: "Pr", bg: "1F1148", fg: "D8B5FF", border: "9A6DFF" },
  "adobe-xd": { label: "Xd", bg: "470137", fg: "FF61F6", border: "FF61F6" },
  firefly: { label: "Ff", bg: "231F20", fg: "FFB000", border: "FFB000" },
  claude: { label: "C", bg: "F8F5F0", fg: "D97757", border: "D8C7BA" },
  "github-copilot": { label: "Co", bg: "F6F8FA", fg: "24292F", border: "D0D7DE" },
};

function makeBadgeSvg({ label, bg, fg, border }: { label: string; bg: string; fg: string; border: string }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="5" y="5" width="54" height="54" rx="12" fill="#${bg}" stroke="#${border}" stroke-width="4"/><text x="32" y="39" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800" fill="#${fg}">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function normalizeKey(value?: unknown) {
  const text = typeof value === "string"
    ? value
    : typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : "";

  return text
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.(com|co|io|so|app|ai|dev|net|org)$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const AFFILIATE_DOMAINS = [
  "pxf.io",
  "impact.com",
  "awin1.com",
  "partnerstack.com",
  "shareasale.com",
  "cj.com",
];

function isAffiliateDomain(domain: string) {
  return AFFILIATE_DOMAINS.some((affiliateDomain) => domain === affiliateDomain || domain.endsWith(`.${affiliateDomain}`));
}

function getVerifiedDomain(tool: LogoCandidateTool) {
  const sourceDomain = getDomainFromUrl(tool.pricing_v5?.source_domain);
  if (sourceDomain) return sourceDomain;

  const websiteDomain = getDomainFromUrl(tool.websiteUrl);
  if (websiteDomain && !isAffiliateDomain(websiteDomain)) return websiteDomain;

  const affiliateDomain = getDomainFromUrl(tool.affiliateLink);
  if (affiliateDomain && !isAffiliateDomain(affiliateDomain)) return affiliateDomain;

  return "";
}

function simpleIconCandidateKeys(tool: LogoCandidateTool, domain: string) {
  const values = [
    tool.slug,
    tool.id,
    tool.name,
    domain.split(".")[0],
  ];

  const candidates = new Set<string>();
  for (const value of values) {
    const key = normalizeKey(value);
    if (!key) continue;
    candidates.add(key);
    candidates.add(key.replace(/-/g, ""));
    candidates.add(key.replace(/-io$/, "io"));
    candidates.add(key.replace(/-ai$/, "ai"));
    candidates.add(key.replace(/-app$/, "app"));
    candidates.add(key.replace(/^the-/, ""));
  }
  return Array.from(candidates).filter(Boolean);
}

export function getToolLogoSources(tool: LogoCandidateTool, size: 32 | 64 | 128 = 64): string[] {
  const sources: string[] = [];

  // 1. Custom logo override. Accept canonical remote URLs and local assets:
  // homepage/card-specific local logos must win before CDN probing so they
  // do not trigger avoidable SimpleIcons 404 → favicon fallback chains.
  if (tool.logo?.startsWith("http") || tool.logo?.startsWith("/")) sources.push(tool.logo);

  const key = normalizeKey(tool.slug || tool.id || tool.name);
  const domain = getVerifiedDomain(tool);

  // 2. Adobe product badges (SVG data-URI)
  const badge = PRODUCT_BADGES[key];
  if (badge) sources.push(makeBadgeSvg(badge));

  const candidateKeys = simpleIconCandidateKeys(tool, domain);
  const usedSimpleIconSlugs = new Set<string>();

  // 3. SimpleIcons — manual map (exact slug known)
  for (const candidate of candidateKeys) {
    const simpleIcon = SIMPLE_ICON_SLUGS[candidate];
    if (simpleIcon && !usedSimpleIconSlugs.has(simpleIcon)) {
      usedSimpleIconSlugs.add(simpleIcon);
      const colorOverride = SIMPLE_ICON_COLORS[candidate];
      sources.push(
        colorOverride
          ? `https://cdn.simpleicons.org/${simpleIcon}/${colorOverride}`
          : `https://cdn.simpleicons.org/${simpleIcon}`
      );
    }
  }

  // 4. SimpleIcons — direct CDN probing for unmatched candidate keys
  // simpleicons slugs are lowercase, no dashes/spaces. Try candidate without dashes.
  // The CDN returns 404 for unknown slugs — handled by onError in ToolLogo.
  for (const candidate of candidateKeys) {
    const probeSlug = candidate.replace(/-/g, "");
    // Skip if already covered by manual map
    if (!usedSimpleIconSlugs.has(probeSlug) && !usedSimpleIconSlugs.has(candidate)) {
      const url = `https://cdn.simpleicons.org/${probeSlug}`;
      if (!sources.includes(url)) sources.push(url);
    }
  }

  if (domain) {
    // 5. Google Favicon V2 — returns colored, high-quality logos (replaces DuckDuckGo)
    sources.push(
      `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=${size}`
    );

    // 6. DuckDuckGo favicon — last resort (16×16 ICO, low quality but universal)
    sources.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
  }

  return Array.from(new Set(sources));
}

export function getToolLogoUrl(tool: LogoCandidateTool, size: 32 | 64 | 128 = 64): string | null {
  return getToolLogoSources(tool, size)[0] || null;
}
