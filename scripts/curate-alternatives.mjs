/** curate-alternatives.mjs — cure le champ `alternatives` sur mes fiches réécrites.
 * Critère : vrais concurrents directs les plus pertinents (même plus chers).
 * Contrainte : uniquement des slugs existants (chips vivants), pas de lien mort. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

// Concurrents directs curés. Slugs vérifiés présents dans le catalogue.
const ALT = {
  // --- SaaS / IA (vides ou hors-sujet) ---
  "jasper": ["chatgpt", "claude"],
  "canva": ["adobe-express", "visme", "figma"],
  "notion": ["obsidian", "coda", "clickup"],
  "intercom": ["zendesk", "crisp", "tidio", "helpscout"],
  "descript": ["riverside", "captions", "adobe-premiere-pro"],
  "loom": ["screen-studio", "vidyard", "scribe"],
  "otter-ai": ["fathom", "riverside"],
  "grammarly": ["chatgpt", "claude"],
  // --- 3D apps ---
  "zbrush": ["nomad-sculpt", "blender"],
  "rhino": ["plasticity", "fusion-360", "sketchup-pro"],
  // --- rendu / texturing ---
  "keyshot": ["v-ray", "octane-render", "corona-renderer"],
  "substance-3d-designer": ["substance-3d-painter", "marmoset-toolbag", "blender"],
};

const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));
let n = 0;
const skipped = [];
for (const x of tools) {
  const slug = x.slug || x.id;
  if (!ALT[slug]) continue;
  const alts = ALT[slug].filter((s) => {
    if (present.has(s)) return true;
    skipped.push(`${slug} -> ${s} (absent)`);
    return false;
  });
  x.alternatives = alts;
  n++;
}
const out = JSON.stringify(tools, null, 2) + "\n";
JSON.parse(out);
writeFileSync(PATH, out);
console.log(`alternatives curées sur ${n} fiches | JSON OK`);
if (skipped.length) console.log("IGNORÉS (slug absent):\n  " + skipped.join("\n  "));
