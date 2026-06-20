/** curate-alternatives-3.mjs — curation des alternatives sur le lot SaaS-2 (12 fiches). */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const ALT = {
  "typeform": ["jotform"],
  "buffer": ["hootsuite", "later", "sprout-social"],
  "hootsuite": ["buffer", "later", "sprout-social"],
  "mixpanel": ["amplitude", "google-analytics"],
  "google-analytics": ["plausible", "fathom-analytics", "mixpanel"],
  "salesforce": ["hubspot", "pipedrive"],
  "slack": ["microsoft-teams"],
  "zoom": ["google-meet", "microsoft-teams"],
  "miro": ["figjam"],
  // Framer pointait vers InVision (design tool fermé en 2024) et Balsamiq (wireframing
  // basse-fidélité, pas un vrai concurrent) : remplacé par les vrais concurrents
  // (sites no-code/IA générés, pas des outils de maquette).
  "framer": ["webflow", "wix", "squarespace"],
  "stripe": ["paypal"],
  "quickbooks": ["xero", "freshbooks"],
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
console.log(`alternatives curées (lot 3) sur ${n} fiches | JSON OK`);
