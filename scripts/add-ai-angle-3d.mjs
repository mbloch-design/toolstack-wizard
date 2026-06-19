/** add-ai-angle-3d.mjs — déroule aiAngle (niché dans seo) sur l'écosystème 3D,
 * avec chips liés vers les fiches challengers IA (meshy, tripo, move-ai, etc.). */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const A = {
  "cinema-4d": {
    stance: "augmente",
    augmentFr: "En 3D, l'IA s'installe surtout autour de Cinema 4D, pas à sa place. En amont, des générateurs 3D comme Meshy ou Tripo sortent un modèle de base depuis un texte ou une image en quelques secondes, que tu importes ensuite dans C4D pour le nettoyer et le mettre en scène. Au rendu, le denoiser IA accélère énormément les calculs. Et pour l'animation, l'AI mocap (Move AI, Autodesk Flow Studio) capture du mouvement depuis une simple vidéo, sans combinaison ni studio.",
    augmentEn: "In 3D, AI is settling around Cinema 4D, not in its place. Upstream, 3D generators like Meshy or Tripo output a base model from text or an image in seconds, which you import into C4D to clean up and stage. At render time, AI denoising speeds up computation a lot. And for animation, AI mocap (Move AI, Autodesk Flow Studio) captures motion from a simple video, with no suit or studio.",
    replaceFr: "Remplacer Cinema 4D par une IA ? Pas encore, et c'est net. La 3D générative crée des objets isolés, souvent à la topologie sale, mais elle ne gère ni la mise en scène, ni l'animation procédurale (MoGraph), ni le contrôle précis d'une production. En 2026, l'IA est un accélérateur d'étapes, pas un remplaçant. Le vrai signal à surveiller : le jour où la génération de scènes complètes deviendra crédible. On n'y est pas, mais ça avance vite.",
    replaceEn: "Replace Cinema 4D with an AI? Not yet, clearly. Generative 3D creates isolated objects, often with messy topology, but handles neither staging, procedural animation (MoGraph), nor the precise control of a production. In 2026, AI is a step accelerator, not a replacement. The signal to watch: the day full-scene generation becomes credible. Not there yet, but moving fast.",
    aiTools: ["meshy", "tripo", "move-ai"],
  },
  "zbrush": {
    stance: "challenge",
    augmentFr: "Pour ZBrush, l'IA arrive surtout par la génération de base : des outils comme Meshy ou Tripo sortent un modèle 3D dégrossi depuis un texte ou une image en quelques secondes, que tu importes ensuite dans ZBrush pour le sculpter en détail. Ça remplace l'étape de blockout, pas le travail d'artiste.",
    augmentEn: "For ZBrush, AI mostly arrives via base generation: tools like Meshy or Tripo output a rough 3D model from text or an image in seconds, which you import into ZBrush to sculpt in detail. It replaces the blockout step, not the artist's work.",
    replaceFr: "Remplacer ZBrush par une IA ? Pour la sculpture fine de personnages et de créatures, non : aucune IA ne te donne ce niveau de détail et de contrôle. Mais pour obtenir une base 3D rapide, la 3D générative (Meshy, Tripo) grignote sérieusement l'étape de blockout, et pour un usage non-pro elle peut suffire. Verdict : ZBrush reste roi du détail, mais l'IA banalise la création de formes de départ.",
    replaceEn: "Replace ZBrush with an AI? For fine sculpting of characters and creatures, no: no AI gives you that level of detail and control. But to get a quick 3D base, generative 3D (Meshy, Tripo) is seriously eating into the blockout step, and for non-pro use it can be enough. Verdict: ZBrush stays king of detail, but AI is commoditizing the creation of starting shapes.",
    aiTools: ["meshy", "tripo"],
  },
  "maya": {
    stance: "challenge",
    augmentFr: "Autour de Maya, l'IA bouscule surtout l'animation : l'AI mocap (Move AI, Autodesk Flow Studio) capture du mouvement depuis une simple vidéo et l'exporte en FBX, ce qui remplace des setups de captation coûteux. En amont, la 3D générative (Meshy, Tripo) fournit des bases de modèles à raffiner.",
    augmentEn: "Around Maya, AI mostly shakes up animation: AI mocap (Move AI, Autodesk Flow Studio) captures motion from a simple video and exports it as FBX, replacing costly capture setups. Upstream, generative 3D (Meshy, Tripo) provides base models to refine.",
    replaceFr: "Remplacer Maya par une IA ? Pas pour l'animation et le rigging fins, qui restent son domaine et celui des studios. Mais l'IA remplace de plus en plus des étapes : la captation de mouvement (Move AI), l'intégration de personnages (Flow Studio), la génération de base. Verdict : Maya garde le contrôle artistique, mais l'IA absorbe la captation et le dégrossissage, ce qui réduit le temps passé dans le logiciel.",
    replaceEn: "Replace Maya with an AI? Not for fine animation and rigging, which remain its domain and that of studios. But AI increasingly replaces steps: motion capture (Move AI), character integration (Flow Studio), base generation. Verdict: Maya keeps artistic control, but AI absorbs capture and roughing-out, reducing time spent in the software.",
    aiTools: ["move-ai", "autodesk-flow-studio", "meshy"],
  },
  "blender": {
    stance: "augmente",
    augmentFr: "Blender est l'outil qui profite le plus de l'IA, parce qu'il est gratuit et ouvert : une nuée d'add-ons branche la 3D générative (Meshy, Tripo) directement dans l'interface, l'AI mocap (Move AI) y exporte ses animations, et des outils IA accélèrent le retopo, le texturing et le denoise au rendu (Cycles). Tu peux assembler un flux IA complet sans dépenser un centime de logiciel.",
    augmentEn: "Blender is the tool that benefits most from AI, because it's free and open: a swarm of add-ons plugs generative 3D (Meshy, Tripo) right into the interface, AI mocap (Move AI) exports its animations there, and AI tools speed up retopo, texturing and render denoising (Cycles). You can assemble a full AI flow without spending a cent on software.",
    replaceFr: "Remplacer Blender par une IA ? Non, et ce serait absurde : c'est justement l'atelier gratuit où tu rapatries et finalises tout ce que l'IA génère. L'IA crée des bases, capture du mouvement, texture vite, mais c'est dans Blender que tu mets en scène, animes finement et rends. Verdict : l'IA ne remplace pas Blender, elle le rend encore plus incontournable comme hub gratuit de production 3D.",
    replaceEn: "Replace Blender with an AI? No, and it would be absurd: it's precisely the free workshop where you bring in and finalize everything AI generates. AI creates bases, captures motion, textures fast, but it's in Blender that you stage, animate finely and render. Verdict: AI doesn't replace Blender, it makes it even more essential as the free hub of 3D production.",
    aiTools: ["meshy", "tripo", "move-ai"],
  },
  "houdini": {
    stance: "augmente",
    augmentFr: "Houdini et l'IA se ressemblent dans l'esprit (tout est procédural et reproductible), et l'IA vient surtout l'accélérer : denoise IA au rendu, et des assets de base générés (Meshy, Tripo) à injecter dans tes systèmes procéduraux. Pour la simulation temps réel ponctuelle, un EmberGen sort du feu et de la fumée en secondes.",
    augmentEn: "Houdini and AI are alike in spirit (everything is procedural and reproducible), and AI mostly accelerates it: AI render denoising, and generated base assets (Meshy, Tripo) to inject into your procedural systems. For occasional real-time simulation, an EmberGen outputs fire and smoke in seconds.",
    replaceFr: "Remplacer Houdini par une IA ? Très peu probable à court terme. La simulation physique avancée, le contrôle procédural fin et la flexibilité de Houdini n'ont pas d'équivalent IA. Les outils de simulation temps réel (comme EmberGen pour le feu/fumée) grignotent certains cas précis, mais pas le coeur du métier. Verdict : c'est sans doute l'outil 3D le moins menacé par l'IA en 2026.",
    replaceEn: "Replace Houdini with an AI? Very unlikely in the short term. Advanced physical simulation, fine procedural control and Houdini's flexibility have no AI equivalent. Real-time simulation tools (like EmberGen for fire/smoke) nibble at specific cases, but not the core of the job. Verdict: it's probably the 3D tool least threatened by AI in 2026.",
    aiTools: ["meshy", "embergen"],
  },
};

const tools = JSON.parse(readFileSync(PATH, "utf8"));
let n = 0;
for (const x of tools) {
  const slug = x.slug || x.id;
  if (A[slug]) {
    x.seo = Object.assign({}, x.seo, { aiAngle: A[slug] });
    n++;
  }
}
const out = JSON.stringify(tools, null, 2) + "\n";
JSON.parse(out);
writeFileSync(PATH, out);
console.log(`aiAngle (3D) sur ${n} fiches | JSON OK`);
