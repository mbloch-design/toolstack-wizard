/** curate-alternatives-4.mjs — curation alternatives sur dev/video/email/no-code/PM.
 * Seuls les slugs avec un vrai concurrent existant dans le catalogue sont remplis ;
 * les autres (github, replit, docker, capcut, riverside, bubble) restent vides
 * faute de fiche concurrente réelle (mieux vide que faux). */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const ALT = {
  "vercel": ["netlify", "render"],
  "netlify": ["vercel", "render"],
  "cursor": ["windsurf"],
  "github-copilot": ["cursor", "windsurf"],
  "postman": ["insomnia"],
  "davinci-resolve": ["adobe-premiere-pro", "final-cut-pro"],
  "klaviyo": ["mailchimp", "brevo", "activecampaign"],
  "hubspot": ["salesforce", "pipedrive"],
  "zapier": ["make", "n8n"],
  "make": ["zapier", "n8n"],
  "n8n": ["zapier", "make"],
  "webflow": ["wix", "framer"],
  "airtable": ["smartsheet", "notion"],
  "retool": ["appsmith", "budibase"],
  "softr": ["glide"],
  "asana": ["clickup", "monday", "trello"],
  "clickup": ["asana", "monday", "trello"],
  "pipedrive": ["hubspot", "salesforce"],
  "zendesk": ["intercom"],
};

const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));
let n = 0;
for (const x of tools) {
  const slug = x.slug || x.id;
  if (!ALT[slug]) continue;
  x.alternatives = ALT[slug].filter((s) => present.has(s));
  n++;
}
const out = JSON.stringify(tools, null, 2) + "\n";
JSON.parse(out);
writeFileSync(PATH, out);
console.log(`alternatives curées (lot 4) sur ${n} fiches | JSON OK`);
