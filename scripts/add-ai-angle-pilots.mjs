/**
 * add-ai-angle-pilots.mjs — injecte aiAngle (niché dans seo) sur 3 fiches pilotes.
 * Pilote de la "brique IA" : 2 axes (augmenter / remplacer) + stance.
 */
import { readFileSync, writeFileSync } from "node:fs";

const PATH = "src/data/tools_v4.json";
const A = {
  "cinema-4d": {
    stance: "augmente",
    augmentFr: "En 3D, l'IA s'installe surtout autour de Cinema 4D, pas à sa place. En amont, des générateurs 3D comme Meshy, Tripo ou Luma Genie sortent un modèle de base depuis un texte ou une image en quelques secondes, que tu importes ensuite dans C4D pour le nettoyer et le mettre en scène. Au rendu, le denoiser IA accélère énormément les calculs. Et pour l'animation, l'AI mocap (Move AI, Wonder Dynamics) capture du mouvement depuis une simple vidéo, sans combinaison ni studio.",
    augmentEn: "In 3D, AI is settling around Cinema 4D, not in its place. Upstream, 3D generators like Meshy, Tripo or Luma Genie output a base model from text or an image in seconds, which you import into C4D to clean up and stage. At render time, AI denoising speeds up computation a lot. And for animation, AI mocap (Move AI, Wonder Dynamics) captures motion from a simple video, with no suit or studio.",
    replaceFr: "Remplacer Cinema 4D par une IA ? Pas encore, et c'est net. La 3D générative crée des objets isolés, souvent à la topologie sale, mais elle ne gère ni la mise en scène, ni l'animation procédurale (MoGraph), ni le contrôle précis d'une production. En 2026, l'IA est un accélérateur d'étapes, pas un remplaçant. Le vrai signal à surveiller : le jour où la génération de scènes complètes deviendra crédible. On n'y est pas, mais ça avance vite.",
    replaceEn: "Replace Cinema 4D with an AI? Not yet, clearly. Generative 3D creates isolated objects, often with messy topology, but handles neither staging, procedural animation (MoGraph), nor the precise control of a production. In 2026, AI is a step accelerator, not a replacement. The signal to watch: the day full-scene generation becomes credible. Not there yet, but moving fast.",
    aiTools: [],
  },
  "adobe-photoshop": {
    stance: "challenge",
    augmentFr: "Photoshop a intégré l'IA au coeur de son flux : le remplissage génératif (Generative Fill, propulsé par Firefly) crée, étend ou efface des éléments en langage naturel, et la sélection/masquage automatique fait gagner des heures. Pour aller au-delà de ce que Photoshop fait nativement, des outils comme Magnific ou Krea poussent l'upscaling et la réinvention d'image bien plus loin.",
    augmentEn: "Photoshop baked AI into its core flow: Generative Fill (powered by Firefly) creates, extends or removes elements in natural language, and automatic selection/masking saves hours. To go beyond what Photoshop does natively, tools like Magnific or Krea push upscaling and image reinvention much further.",
    replaceFr: "Pour la retouche fine et le compositing pro, Photoshop reste irremplaçable : aucune IA ne te donne ce contrôle au pixel. Mais pour beaucoup de tâches courantes (générer un visuel, détourer, supprimer un objet, changer un fond), des IA gratuites ou bon marché (Canva, remove.bg, ou la génération pure via Midjourney/Krea) font le job sans ouvrir Photoshop. Le verdict : il garde la main sur le métier, mais perd du terrain sur les tâches simples que l'IA banalise.",
    replaceEn: "For fine retouching and pro compositing, Photoshop remains irreplaceable: no AI gives you that pixel control. But for many everyday tasks (generate a visual, cut out, remove an object, change a background), free or cheap AIs (Canva, remove.bg, or pure generation via Midjourney/Krea) do the job without opening Photoshop. Verdict: it keeps the craft, but loses ground on the simple tasks AI is commoditizing.",
    aiTools: ["magnific-ai", "krea-ai", "midjourney"],
  },
  "grammarly": {
    stance: "menace",
    augmentFr: "Grammarly s'est lui-même bourré d'IA générative : réécriture, ajustement du ton, suggestions de phrases complètes. Mais le vrai sujet est ailleurs : un assistant généraliste comme ChatGPT ou Claude fait tout ce que fait Grammarly et bien plus (réécrire, traduire, résumer, adapter le ton, expliquer une règle), souvent gratuitement.",
    augmentEn: "Grammarly itself packed in generative AI: rewriting, tone adjustment, full-sentence suggestions. But the real issue is elsewhere: a general assistant like ChatGPT or Claude does everything Grammarly does and much more (rewrite, translate, summarize, adapt tone, explain a rule), often for free.",
    replaceFr: "Soyons francs : pour la plupart des usages, une IA généraliste remplace Grammarly. Là où Grammarly garde un intérêt, c'est l'intégration transparente partout où tu écris (mail, navigateur, Word), en temps réel, sans copier-coller. Si cette friction ne te dérange pas, ChatGPT ou Claude rendent l'abonnement difficile à justifier. Verdict : sérieusement menacé, à garder surtout pour le confort de l'intégration en temps réel.",
    replaceEn: "Let us be honest: for most uses, a general AI replaces Grammarly. Where Grammarly keeps an edge is seamless integration everywhere you write (email, browser, Word), in real time, with no copy-paste. If that friction does not bother you, ChatGPT or Claude make the subscription hard to justify. Verdict: seriously threatened, worth keeping mainly for the comfort of real-time integration.",
    aiTools: [],
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
console.log(`aiAngle ajouté sur ${n} fiches | JSON OK`);
