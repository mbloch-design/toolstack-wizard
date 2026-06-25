/** normalize-asana-related-taxonomy.mjs
 * Pilot taxonomy normalization, scoped to Asana's fiche only (cluster
 * peers + curated alternatives), per the user's explicit instruction:
 * fix the small set of tools tied to one fiche first, validate the
 * similarity algorithm against real normalized data, defer full-catalog
 * normalization to the later scaling phase.
 *
 * Two kinds of edits, kept deliberately separate:
 * 1. functional_needs: pure tag-format unification (English vs French
 *    slugs for the same real capability) - asana/wrike/basecamp/clickup/
 *    trello/airtable/monday/notion all genuinely do project/task
 *    management at some level, so they get a shared core tag set, with
 *    airtable/notion keeping an extra tag for their real extra breadth
 *    (database, notes/wiki). This part is purely a labeling fix, not an
 *    editorial judgment call.
 * 2. verticals: only touched where factually under-tagged, not to
 *    inflate scores. Wrike and Basecamp are both genuinely used by
 *    agencies/consultants in addition to internal teams - added
 *    "consultant-b2b" where missing. Monday had no verticals at all
 *    (gap, not a deliberate omission) - set to match its real broad
 *    audience. Trello/Airtable/Notion's existing verticals look like
 *    deliberate site-specific persona positioning (creative-freelancer
 *    for Trello, broader knowledge-worker for Notion/Airtable) and are
 *    left untouched - if they still score low on similarity to Asana
 *    after this, that's a real signal about audience fit, not a bug.
 */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));

const CORE_PM = ["project-management", "task-management", "collaboration"];

const FUNCTIONAL_NEEDS = {
  asana: CORE_PM,
  wrike: CORE_PM,
  basecamp: CORE_PM,
  clickup: CORE_PM,
  trello: CORE_PM,
  airtable: [...CORE_PM, "database"],
  monday: [...CORE_PM, "crm"],
  notion: [...CORE_PM, "notes", "wiki", "database"],
};

const VERTICALS_ADD = {
  wrike: ["manager-dsi", "fondateur-saas", "consultant-b2b"],
  basecamp: ["manager-dsi", "fondateur-saas", "consultant-b2b"],
  monday: ["manager-dsi", "fondateur-saas", "consultant-b2b"],
};

let updated = 0;
for (const [slug, needs] of Object.entries(FUNCTIONAL_NEEDS)) {
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  if (!tool) { console.warn(`⚠️  ${slug} not found`); continue; }
  console.log(`${slug}: functional_needs ${JSON.stringify(tool.functional_needs)} -> ${JSON.stringify(needs)}`);
  tool.functional_needs = needs;
  if (VERTICALS_ADD[slug]) {
    console.log(`${slug}: verticals ${JSON.stringify(tool.verticals)} -> ${JSON.stringify(VERTICALS_ADD[slug])}`);
    tool.verticals = VERTICALS_ADD[slug];
  }
  updated++;
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated} fiches mises à jour (taxonomie pilote Asana).`);
