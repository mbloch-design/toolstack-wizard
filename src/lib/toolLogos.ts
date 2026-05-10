import { getDomainFromUrl } from "@/lib/toolUtils";

export type LogoCandidateTool = {
  id?: string;
  slug?: string;
  name?: string;
  websiteUrl?: string;
  affiliateLink?: string;
  logo?: string;
};

const SIMPLE_ICON_SLUGS: Record<string, string> = {
  "1password": "1password",
  activecampaign: "activecampaign",
  adobe: "adobe",
  "adobe-acrobat-sign": "adobeacrobatreader",
  "adobe-after-effects": "adobeaftereffects",
  "adobe-cc": "adobecreativecloud",
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
  asana: "asana",
  brevo: "brevo",
  calendly: "calendly",
  canva: "canva",
  chatgpt: "openai",
  claude: "anthropic",
  clickup: "clickup",
  discord: "discord",
  dropbox: "dropbox",
  figma: "figma",
  framer: "framer",
  github: "github",
  gitlab: "gitlab",
  google: "google",
  "google-analytics": "googleanalytics",
  "google-drive": "googledrive",
  hubspot: "hubspot",
  intercom: "intercom",
  linear: "linear",
  loom: "loom",
  mailchimp: "mailchimp",
  make: "make",
  miro: "miro",
  monday: "mondaydotcom",
  notion: "notion",
  openai: "openai",
  perplexity: "perplexity",
  raycast: "raycast",
  salesforce: "salesforce",
  sentry: "sentry",
  shopify: "shopify",
  slack: "slack",
  stripe: "stripe",
  supabase: "supabase",
  trello: "trello",
  vercel: "vercel",
  webflow: "webflow",
  wix: "wix",
  wordpress: "wordpress",
  zapier: "zapier",
  zendesk: "zendesk",
  zoom: "zoom",
};

const SIMPLE_ICON_COLORS: Record<string, string> = {
  adobe: "FF0000",
  asana: "F06A6A",
  brevo: "0B996E",
  calendly: "006BFF",
  figma: "F24E1E",
  hubspot: "FF5C35",
  intercom: "0A7CFF",
  linear: "5E6AD2",
  loom: "625DF5",
  notion: "111111",
  slack: "4A154B",
  stripe: "635BFF",
  zapier: "FF4F00",
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
};

function makeBadgeSvg({ label, bg, fg, border }: { label: string; bg: string; fg: string; border: string }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="5" y="5" width="54" height="54" rx="12" fill="#${bg}" stroke="#${border}" stroke-width="4"/><text x="32" y="39" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800" fill="#${fg}">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function normalizeKey(value?: string) {
  return (value || "")
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.(com|co|io|so|app|ai|dev|net|org)$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getToolLogoSources(tool: LogoCandidateTool, size: 32 | 64 | 128 = 64): string[] {
  const sources: string[] = [];
  if (tool.logo?.startsWith("http")) sources.push(tool.logo);

  const key = normalizeKey(tool.slug || tool.id || tool.name);
  const badge = PRODUCT_BADGES[key];
  if (badge) sources.push(makeBadgeSvg(badge));

  const simpleIcon = SIMPLE_ICON_SLUGS[key];
  if (simpleIcon) {
    sources.push(`https://cdn.simpleicons.org/${simpleIcon}/${SIMPLE_ICON_COLORS[key] || "111111"}`);
  }

  const domain = getDomainFromUrl(tool.websiteUrl) || getDomainFromUrl(tool.affiliateLink);
  if (domain) sources.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);

  return Array.from(new Set(sources));
}

export function getToolLogoUrl(tool: LogoCandidateTool, size: 32 | 64 | 128 = 64): string | null {
  return getToolLogoSources(tool, size)[0] || null;
}
