/** add-ai-angle-batch-42.mjs — aiAngle pour Podcastle, Cleanvoice,
 * Screen Studio, Tella, Crayo AI, Vmake, Clipwing, PostSyncer. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  podcastle: {
    stance: "augmente",
    augmentFr: "Podcastle combine enregistrement audio, nettoyage par IA et même clonage vocal pour corriger une prise sans réenregistrer, l'un des outils de podcast les plus IA-natifs du marché.",
    augmentEn: "Podcastle combines audio recording, AI cleanup, and even voice cloning to fix a take without re-recording, one of the most AI-native podcasting tools on the market.",
    replaceFr: "Remplacer Podcastle par un studio classique ? Pour la qualité audio de base et la correction rapide, l'IA comble efficacement l'écart avec un équipement amateur. Pour un mixage broadcast très exigeant, un ingénieur du son reste préférable. Verdict : l'IA augmente fortement la production podcast amateur, l'expertise pro reste différenciante pour les exigences hautes.",
    replaceEn: "Replace Podcastle with a classic studio? For basic audio quality and quick fixes, AI effectively closes the gap with amateur equipment. For very demanding broadcast mixing, a sound engineer remains preferable. Verdict: AI strongly augments amateur podcast production, pro expertise remains differentiating for high demands.",
    aiTools: [],
  },
  cleanvoice: {
    stance: "augmente",
    augmentFr: "Cleanvoice est lui-même un outil IA spécialisé dans le nettoyage automatique de l'audio (bruits de bouche, hésitations, silences) — l'IA n'est pas une fonctionnalité ajoutée, c'est tout le produit.",
    augmentEn: "Cleanvoice is itself an AI tool specialized in automatic audio cleanup (mouth noises, filler words, silences) — AI isn't an added feature, it's the entire product.",
    replaceFr: "Remplacer Cleanvoice par un monteur audio humain ? Pour le nettoyage répétitif (suppression de \"euh\", de bruits de bouche), l'IA est largement plus rapide et moins chère. Pour un mixage créatif global, un monteur reste pertinent. Verdict : l'IA augmente fortement le nettoyage technique répétitif, le mixage créatif reste un travail humain.",
    replaceEn: "Replace Cleanvoice with a human audio editor? For repetitive cleanup (removing filler words, mouth noises), AI is largely faster and cheaper. For overall creative mixing, an editor remains relevant. Verdict: AI strongly augments repetitive technical cleanup, creative mixing remains human work.",
    aiTools: [],
  },
  "screen-studio": {
    stance: "augmente",
    augmentFr: "Screen Studio ajoute des effets de zoom et de curseur automatiques par algorithme pour rendre une capture d'écran plus dynamique, sans génération IA poussée — sa valeur reste la qualité de production automatisée.",
    augmentEn: "Screen Studio adds automatic zoom and cursor effects via algorithm to make a screen recording more dynamic, with no deep AI generation — its value remains automated production quality.",
    replaceFr: "Remplacer Screen Studio par une IA générative ? Non : capturer fidèlement les actions réelles sur un écran avec des effets dynamiques reste une tâche technique spécialisée, pas une génération de contenu. Verdict : l'IA n'a pas de rôle central ici, la capture automatisée reste le produit.",
    replaceEn: "Replace Screen Studio with a generative AI? No: faithfully capturing real actions on a screen with dynamic effects remains a specialized technical task, not content generation. Verdict: AI has no central role here, automated capture remains the product.",
    aiTools: [],
  },
  tella: {
    stance: "augmente",
    augmentFr: "Tella combine enregistrement d'écran et webcam avec montage automatique simplifié, pensé pour produire rapidement des vidéos de démo ou tutoriels sans logiciel de montage complexe.",
    augmentEn: "Tella combines screen and webcam recording with simplified automatic editing, designed to quickly produce demo videos or tutorials with no complex editing software.",
    replaceFr: "Remplacer Tella par un logiciel de montage classique ? Pour une vidéo de démo rapide sans compétences de montage, Tella va plus vite. Pour un montage créatif poussé, un éditeur complet reste nécessaire. Verdict : l'IA augmente la rapidité de production de démo, le montage poussé reste un travail spécialisé.",
    replaceEn: "Replace Tella with a classic editing software? For a quick demo video with no editing skills, Tella is faster. For advanced creative editing, a full editor remains necessary. Verdict: AI augments demo production speed, advanced editing remains specialized work.",
    aiTools: [],
  },
  "crayo-ai": {
    stance: "augmente",
    augmentFr: "Crayo AI est lui-même un outil de génération automatisée de vidéos courtes (script, voix, montage) pour TikTok et Shorts — l'IA n'est pas une fonctionnalité ajoutée, c'est tout le produit.",
    augmentEn: "Crayo AI is itself an automated short-video generation tool (script, voice, editing) for TikTok and Shorts — AI isn't an added feature, it's the entire product.",
    replaceFr: "Remplacer Crayo AI par un créateur humain ? Pour du contenu générique et répétitif à fort volume, l'IA est rentable. Pour une voix de marque distinctive et une stratégie de contenu réfléchie, la création humaine reste différenciante. Verdict : l'IA augmente fortement la production de volume, la stratégie de contenu reste un travail humain.",
    replaceEn: "Replace Crayo AI with a human creator? For generic, repetitive high-volume content, AI is cost-effective. For a distinctive brand voice and thoughtful content strategy, human creation remains differentiating. Verdict: AI strongly augments volume production, content strategy remains human work.",
    aiTools: [],
  },
  vmake: {
    stance: "augmente",
    augmentFr: "Vmake combine plusieurs outils IA (suppression de fond, amélioration vidéo, sous-titres) dans une seule plateforme, se positionnant comme un couteau suisse IA pour la production vidéo rapide.",
    augmentEn: "Vmake combines several AI tools (background removal, video enhancement, captions) into a single platform, positioning itself as an AI swiss-army-knife for fast video production.",
    replaceFr: "Remplacer Vmake par des outils spécialisés séparés ? Des outils dédiés (CapCut pour le montage, Topaz pour l'upscaling) peuvent offrir plus de profondeur sur chaque tâche. Vmake gagne en simplicité de tout centraliser. Verdict : l'IA augmente la simplicité d'usage, des outils spécialisés restent plus poussés individuellement.",
    replaceEn: "Replace Vmake with separate specialized tools? Dedicated tools (CapCut for editing, Topaz for upscaling) can offer more depth on each task. Vmake gains simplicity by centralizing everything. Verdict: AI augments ease of use, specialized tools remain more advanced individually.",
    aiTools: [],
  },
  clipwing: {
    stance: "augmente",
    augmentFr: "Clipwing automatise la transformation de vidéos longues en clips courts pour les réseaux sociaux, dans la même catégorie que OpusClip — l'IA identifie les meilleurs moments à découper.",
    augmentEn: "Clipwing automates turning long videos into short clips for social media, in the same category as OpusClip — AI identifies the best moments to clip.",
    replaceFr: "Remplacer Clipwing par un montage manuel ? Pour identifier rapidement les meilleurs moments d'une longue vidéo, l'IA est nettement plus rapide. Une relecture humaine reste utile pour valider la pertinence des clips choisis. Verdict : l'IA augmente fortement l'identification de moments, la validation finale reste humaine.",
    replaceEn: "Replace Clipwing with manual editing? To quickly identify a long video's best moments, AI is notably faster. Human review remains useful to validate the relevance of chosen clips. Verdict: AI strongly augments moment identification, final validation remains human.",
    aiTools: ["opusclip"],
  },
  postsyncer: {
    stance: "augmente",
    augmentFr: "PostSyncer automatise la republication de contenu sur plusieurs réseaux sociaux avec des suggestions IA d'adaptation par plateforme, dans la même catégorie que Repurpose.io.",
    augmentEn: "PostSyncer automates republishing content across multiple social networks with AI suggestions for per-platform adaptation, in the same category as Repurpose.io.",
    replaceFr: "Remplacer PostSyncer par une republication manuelle ? Pour republier régulièrement sur plusieurs plateformes, l'automatisation IA fait gagner un temps réel. Pour une adaptation créative fine par plateforme, un ajustement humain reste préférable. Verdict : l'IA augmente fortement la republication répétitive, l'adaptation créative fine reste humaine.",
    replaceEn: "Replace PostSyncer with manual republishing? To regularly republish across multiple platforms, AI automation saves real time. For fine creative per-platform adaptation, human adjustment remains preferable. Verdict: AI strongly augments repetitive republishing, fine creative adaptation remains human.",
    aiTools: [],
  },
};

let updated = 0;
for (const [slug, angle] of Object.entries(ANGLES)) {
  if (!present.has(slug)) { console.warn(`⚠️  ${slug} not found, skipping`); continue; }
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  tool.seo = Object.assign({}, tool.seo, { aiAngle: angle });
  updated++;
  console.log(`✓ ${tool.name} (${slug}): aiAngle ${angle.stance}`);
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated} fiches mises à jour.`);
