#!/usr/bin/env node
/**
 * Classe par famille d'effet les fiches d'effets Maxon arrivées sans
 * classement avec le lot `47989ad4` : les 106 effets Red Giant Universe
 * (`universe-*`) et les 32 plugins Red Giant (`red-giant-*`), pour qu'ils
 * aient des alternatives entre eux (décision Michael du 02/10/2026 : garder
 * une fiche par effet, les relier entre eux).
 *
 * Chaque fiche reçoit :
 *   - `functional_needs` : son tag d'effet + `<gamme>-effect:<famille>` +
 *     `after-effects-plugin`, pour le voisinage de catégorie ;
 *   - `substitution_cluster_v2` : `<gamme>-<famille>` ;
 *   - `alternatives` : jusqu'à 4 autres effets de la même famille.
 *
 * Idempotent. Usage : node scripts/classify-maxon-effects.mjs [--apply]
 */
import fs from "node:fs";

const FILE = "src/data/tools_v4.json";
const APPLY = process.argv.includes("--apply");

const RANGES = {
  universe: {
  transitions: ["blinds", "bokeh-transition", "camera-shake-transition", "carousel-transition", "channel-blur", "channel-surf", "clock-wipe", "color-mosaic", "color-stripe", "cube", "diamond-wave", "dolly-fade", "exposure-blur-transition", "film-transition", "flicker-cut", "fold", "glitch-transition", "inside-cube", "knoll-light-transition", "linear-wipe", "retrograde-transition", "rubix-cube", "shape-wipe", "slide", "soft-edge-wipe", "spectralicious-transition", "stretch-transition", "swish-pan", "triangle-wave", "turbulence-transition", "unfold", "vhs-transition", "warp"],
  "blur-glow": ["blur", "bokeh", "chromatic-glow", "compound-blur", "edge-glow", "glimmer", "glo-fi", "glo-fi-ii", "glow", "halflight", "knoll-light-factory-ez", "luster", "overlight", "point-zoom", "spot-blur"],
  text: ["hacker-text", "logo-motion", "numbers", "screen-text", "symbol-mapper", "text-tile", "title-motion", "type-cast", "type-on", "typographic"],
  "retro-glitch": ["analog", "av-club", "chromatic-aberration", "chromatown", "glitch", "grain16", "misfire", "retrograde", "rgb-separation", "vhs"],
  dither: ["custom-dither", "error-diffuse-dither", "halftone-dither", "multitone", "ordered-dither", "palettes", "pixel-dither", "threshold-dither"],
  stylize: ["array-gun", "ecto", "electrify", "finisher", "heatwave", "holomatrix", "hud-components", "line", "long-shadow", "modes", "noir-moderne", "prism-displacement", "quantum", "sketchify", "texturize", "texturize-motion"],
  backgrounds: ["fractal-background", "gradient-ramp", "soft-gradient-background", "spectralicious", "turbulence-noise"],
  utilities: ["camera-shake", "carousel", "fisheye-fixer", "picture-in-picture", "progresso", "reframe", "shrinkray", "socialize", "unmult"],
  },
  "red-giant": {
  color: ["colorista", "magicbullet-looks", "mojo", "film", "cosmo", "denoiser", "renoiser", "parametric-curve"],
  light: ["optical-glow", "starglow", "shine", "real-lens-flares", "lux"],
  "3d-particles": ["trapcode-particular", "form", "mir", "tao", "3d-stroke", "geo", "echospace", "horizon", "sound-keys"],
  compositing: ["primatte-keyer", "supercomp", "king-pin-tracker", "spot-clone-tracker", "lens-distortion-matcher", "depth-generator", "chromatic-displacement", "reflection", "shadow", "bang"],
  },
};

const tools = JSON.parse(fs.readFileSync(FILE, "utf8"));
let total = 0;
let changed = 0;
for (const [range, FAMILIES] of Object.entries(RANGES)) {
  const prefix = `${range}-`;
  const familyOf = new Map();
  for (const [family, effects] of Object.entries(FAMILIES)) for (const e of effects) familyOf.set(prefix + e, family);
  // red-giant-universe est la fiche de la suite entière, pas un effet.
  const effects = tools.filter((t) => t.slug.startsWith(prefix) && t.slug !== "red-giant-universe");
  const missing = effects.filter((t) => !familyOf.has(t.slug)).map((t) => t.slug);
  const unknown = [...familyOf.keys()].filter((s) => !effects.some((t) => t.slug === s));
  if (missing.length || unknown.length) {
    console.error(`${range} : sans famille :`, missing.join(" ") || "-", "| inconnus :", unknown.join(" ") || "-");
    process.exit(1);
  }
  for (const tool of effects) {
    const family = familyOf.get(tool.slug);
    const list = FAMILIES[family];
    const own = (tool.functional_needs || []).filter((n) => !/^(universe|red-giant)-effect:/.test(n) && n !== "after-effects-plugin");
    const index = list.indexOf(tool.slug.slice(prefix.length));
    // Les voisins les plus proches dans la liste de la famille, de part et d'autre.
    const alternatives = list
      .filter((e) => prefix + e !== tool.slug)
      .sort((a, b) => Math.abs(list.indexOf(a) - index) - Math.abs(list.indexOf(b) - index))
      .slice(0, 4)
      .map((e) => prefix + e);
    const before = JSON.stringify([tool.functional_needs, tool.substitution_cluster_v2, tool.alternatives]);
    tool.functional_needs = [...own, `${range}-effect:${family}`, "after-effects-plugin"];
    tool.substitution_cluster_v2 = `${range}-${family}`;
    tool.alternatives = alternatives;
    if (JSON.stringify([tool.functional_needs, tool.substitution_cluster_v2, tool.alternatives]) !== before) changed += 1;
    total += 1;
  }
}

console.log(`${total} effets Maxon, ${changed} modifiés.`, APPLY ? "" : "(simulation, --apply pour écrire)");
if (APPLY) fs.writeFileSync(FILE, JSON.stringify(tools, null, 2) + "\n");
