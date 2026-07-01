/** curate-alternatives-2.mjs — second passe de curation, lot bundle/3D restant. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const ALT = {
  // maxon-one pointait vers cinema-4d, qui est un COMPOSANT du bundle, pas une alternative.
  "maxon-one": ["blender", "houdini"],
  "marvelous-designer": ["clo-3d", "blender"],
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
console.log(`alternatives curées (lot 2) sur ${n} fiches | JSON OK`);
