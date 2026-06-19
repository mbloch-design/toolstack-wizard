/** aiAngle sur moteurs de rendu + texturing. Chips = IA citées. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const A = {
  "redshift": {
    stance: "augmente",
    augmentFr: "L'IA accélère Redshift plutôt qu'elle ne le concurrence : le débruitage IA réduit fortement les temps de rendu, et en amont la 3D générative (Meshy, Tripo) fournit des assets à mettre en scène et à rendre.",
    augmentEn: "AI accelerates Redshift rather than competing with it: AI denoising sharply cuts render times, and upstream generative 3D (Meshy, Tripo) provides assets to stage and render.",
    replaceFr: "Remplacer un moteur de rendu par une IA ? Non. Générer une image 2D, c'est ce que fait Midjourney ; calculer une scène 3D contrôlée, animée et cohérente plan après plan, non. Pour un rendu fidèle à ta scène, Redshift reste indispensable. Verdict : l'IA l'accélère, elle ne le remplace pas.",
    replaceEn: "Replace a render engine with an AI? No. Generating a 2D image is what Midjourney does; computing a controlled, animated, consistent 3D scene shot after shot is not. For renders faithful to your scene, Redshift stays essential. Verdict: AI accelerates it, it does not replace it.",
    aiTools: ["meshy", "magnific-ai"],
  },
  "v-ray": {
    stance: "augmente",
    augmentFr: "Pour V-Ray, l'IA est surtout un accélérateur : débruitage IA au rendu, et assets générés (Meshy) à intégrer. Pour upscaler un rendu final, un Magnific va plus loin que la sortie native.",
    augmentEn: "For V-Ray, AI is mostly an accelerator: AI denoising at render time, and generated assets (Meshy) to integrate. To upscale a final render, a Magnific goes beyond the native output.",
    replaceFr: "Pour de l'archviz photoréaliste fidèle au modèle, l'IA générative n'est pas une option : elle invente une image, V-Ray calcule TA scène exacte. Verdict : l'IA augmente V-Ray (vitesse, upscale), mais le rendu fidèle reste son domaine.",
    replaceEn: "For photorealistic archviz faithful to the model, generative AI is not an option: it invents an image, V-Ray computes YOUR exact scene. Verdict: AI augments V-Ray (speed, upscale), but faithful rendering stays its domain.",
    aiTools: ["meshy", "magnific-ai"],
  },
  "octane-render": {
    stance: "augmente",
    augmentFr: "Octane profite du débruitage IA pour rendre encore plus vite, et la 3D générative (Meshy, Tripo) lui fournit des objets à mettre en scène. L'IA est un carburant, pas un rival.",
    augmentEn: "Octane benefits from AI denoising to render even faster, and generative 3D (Meshy, Tripo) feeds it objects to stage. AI is fuel, not a rival.",
    replaceFr: "Aucune IA ne calcule à ta place une scène 3D contrôlée et animée : c'est le travail d'Octane. L'image générative (Midjourney) peut produire un visuel d'inspiration, mais pas un rendu reproductible et précis. Verdict : l'IA l'accélère, elle ne le remplace pas.",
    replaceEn: "No AI computes a controlled, animated 3D scene for you: that is Octane's job. Generative imagery (Midjourney) can produce an inspiration visual, but not a reproducible, precise render. Verdict: AI accelerates it, it does not replace it.",
    aiTools: ["meshy", "magnific-ai"],
  },
  "corona-renderer": {
    stance: "augmente",
    augmentFr: "Corona gagne en vitesse grâce au débruitage IA, et tu peux lui amener des assets générés (Meshy) ou upscaler ses sorties (Magnific). L'IA sert le flux, elle ne le casse pas.",
    augmentEn: "Corona gains speed from AI denoising, and you can bring it generated assets (Meshy) or upscale its outputs (Magnific). AI serves the flow, it does not break it.",
    replaceFr: "Pour de l'archviz fidèle et photoréaliste, l'IA générative invente alors que Corona reproduit fidèlement ta scène. Verdict : l'IA augmente Corona, elle ne remplace pas le rendu précis.",
    replaceEn: "For faithful, photorealistic archviz, generative AI invents while Corona faithfully reproduces your scene. Verdict: AI augments Corona, it does not replace precise rendering.",
    aiTools: ["meshy", "magnific-ai"],
  },
  "keyshot": {
    stance: "challenge",
    augmentFr: "KeyShot intègre déjà de l'IA (matériaux, fonds), et la 3D générative (Meshy) peut lui fournir des modèles. Mais sur son terrain (l'image produit), des générateurs comme Midjourney ou Krea sortent des visuels marketing bluffants sans aucun modèle 3D.",
    augmentEn: "KeyShot already integrates AI (materials, backgrounds), and generative 3D (Meshy) can feed it models. But on its turf (product imagery), generators like Midjourney or Krea output stunning marketing visuals with no 3D model at all.",
    replaceFr: "Voilà le vrai sujet : pour une image produit d'illustration ou de marketing, une IA générative peut suffire et coûte bien moins cher que KeyShot. Mais pour un rendu fidèle à TON produit exact (depuis ta CAO), l'IA invente, KeyShot reproduit. Verdict : challengé sur les visuels d'inspiration, indispensable sur le rendu fidèle.",
    replaceEn: "Here is the real point: for an illustrative or marketing product image, a generative AI can be enough and costs far less than KeyShot. But for a render faithful to YOUR exact product (from your CAD), AI invents, KeyShot reproduces. Verdict: challenged on inspiration visuals, essential for faithful rendering.",
    aiTools: ["midjourney", "krea-ai"],
  },
  "arnold": {
    stance: "augmente",
    augmentFr: "Arnold bénéficie du débruitage IA (Noice/OptiX) pour des rendus plus rapides, et la 3D générative (Meshy) alimente ses scènes. L'IA est un accélérateur de production.",
    augmentEn: "Arnold benefits from AI denoising (Noice/OptiX) for faster renders, and generative 3D (Meshy) feeds its scenes. AI is a production accelerator.",
    replaceFr: "Le rendu de cinéma et d'animation exige un contrôle total et une cohérence absolue que l'IA générative ne fournit pas : elle invente, Arnold calcule la scène voulue. Verdict : l'IA l'accélère, elle ne le remplace pas.",
    replaceEn: "Film and animation rendering demands total control and absolute consistency that generative AI does not provide: it invents, Arnold computes the intended scene. Verdict: AI accelerates it, it does not replace it.",
    aiTools: ["meshy", "magnific-ai"],
  },
  "renderman": {
    stance: "augmente",
    augmentFr: "Même chez Pixar, l'IA sert le rendu plutôt qu'elle ne le remplace : débruitage IA et assets générés en amont. RenderMan reste le moteur qui calcule fidèlement des plans de cinéma.",
    augmentEn: "Even at Pixar, AI serves rendering rather than replacing it: AI denoising and generated upstream assets. RenderMan stays the engine that faithfully computes film shots.",
    replaceFr: "Aucune IA générative ne produit un long-métrage cohérent, contrôlé plan par plan, avec des personnages tenus dans le temps. C'est précisément ce que RenderMan rend possible. Verdict : l'IA l'augmente, le rendu de cinéma reste hors de portée d'un simple générateur.",
    replaceEn: "No generative AI produces a coherent feature film, controlled shot by shot, with characters held consistent over time. That is exactly what RenderMan makes possible. Verdict: AI augments it, film rendering remains out of reach of a mere generator.",
    aiTools: ["meshy", "magnific-ai"],
  },
  "substance-3d-painter": {
    stance: "challenge",
    augmentFr: "L'IA arrive fort sur le texturing : la 3D générative (Meshy, Tripo) sort des modèles déjà texturés, et des outils de text-to-texture habillent un modèle depuis une description. Pour aller vite sur un asset simple, c'est redoutable.",
    augmentEn: "AI is arriving hard in texturing: generative 3D (Meshy, Tripo) outputs already-textured models, and text-to-texture tools dress a model from a description. To move fast on a simple asset, it is formidable.",
    replaceFr: "Pour un texturing contrôlé, propre et de niveau production (jeu AAA, héros), Substance reste le standard : l'IA texture vite mais grossièrement, sans la précision des smart materials et des masques. Verdict : challengé sur les assets simples et rapides, irremplaçable sur le texturing pro et précis.",
    replaceEn: "For controlled, clean, production-grade texturing (AAA games, hero assets), Substance stays the standard: AI textures fast but coarsely, without the precision of smart materials and masks. Verdict: challenged on simple, fast assets, irreplaceable for pro, precise texturing.",
    aiTools: ["meshy", "tripo"],
  },
  "substance-3d-designer": {
    stance: "challenge",
    augmentFr: "Des outils de text-to-material génèrent un matériau depuis une description en quelques secondes, ce qui couvre déjà beaucoup de besoins simples. La 3D générative (Meshy) embarque aussi sa propre texturisation.",
    augmentEn: "Text-to-material tools generate a material from a description in seconds, already covering many simple needs. Generative 3D (Meshy) also brings its own texturing.",
    replaceFr: "Pour des matériaux procéduraux précis, paramétriques et réutilisables, Designer garde l'avantage : l'IA produit un résultat, pas un graphe contrôlable que tu ajustes à l'infini. Verdict : challengé sur la génération de matériaux simples, encore devant sur le procédural sur mesure.",
    replaceEn: "For precise, parametric, reusable procedural materials, Designer keeps the edge: AI produces a result, not a controllable graph you tweak infinitely. Verdict: challenged on simple material generation, still ahead on bespoke procedural work.",
    aiTools: ["meshy", "tripo"],
  },
  "mari": {
    stance: "challenge",
    augmentFr: "Le texturing par IA (modèles texturés générés, text-to-texture) progresse vite et couvre déjà des cas qui demandaient un outil dédié. La 3D générative (Meshy, Tripo) en est le fer de lance.",
    augmentEn: "AI texturing (generated textured models, text-to-texture) is advancing fast and already covers cases that required a dedicated tool. Generative 3D (Meshy, Tripo) leads the charge.",
    replaceFr: "Mari vise les assets héros de cinéma, en très haute résolution et avec un grand nombre d'UDIM : là, l'IA n'a pas le niveau de contrôle requis. Verdict : challengé sur le texturing courant, encore pertinent sur le très haut de gamme film.",
    replaceEn: "Mari targets hero film assets, at very high resolution and with many UDIMs: there, AI lacks the required control. Verdict: challenged on everyday texturing, still relevant for the very high end of film.",
    aiTools: ["meshy", "tripo"],
  },
  "marmoset-toolbag": {
    stance: "augmente",
    augmentFr: "Marmoset est sur un terrain plutôt sûr : l'IA n'attaque ni le baking de maps, ni la présentation d'assets. Au contraire, elle l'alimente : tu présentes dans Marmoset des modèles générés par IA (Meshy, Tripo).",
    augmentEn: "Marmoset sits on fairly safe ground: AI attacks neither map baking nor asset presentation. On the contrary, it feeds it: you present AI-generated models (Meshy, Tripo) in Marmoset.",
    replaceFr: "Remplacer Marmoset par une IA ? Non : générer un modèle ne le bake pas et ne le met pas en valeur. Marmoset reste l'étape finale de présentation et de baking que l'IA ne couvre pas. Verdict : l'IA l'alimente, elle ne le menace pas.",
    replaceEn: "Replace Marmoset with an AI? No: generating a model does not bake it or showcase it. Marmoset stays the final presentation and baking step that AI does not cover. Verdict: AI feeds it, it does not threaten it.",
    aiTools: ["meshy", "tripo"],
  },
  "quixel-megascans": {
    stance: "challenge",
    augmentFr: "Megascans est une bibliothèque d'assets scannés ; l'IA, elle, génère des assets sur mesure depuis un prompt (Meshy, Tripo). Pour un besoin spécifique introuvable dans la bibliothèque, l'IA devient une vraie alternative.",
    augmentEn: "Megascans is a library of scanned assets; AI, for its part, generates bespoke assets from a prompt (Meshy, Tripo). For a specific need not found in the library, AI becomes a real alternative.",
    replaceFr: "Le vrai sujet : pourquoi chercher dans une bibliothèque quand une IA te génère l'asset exact dont tu as besoin ? Mais Megascans garde l'avantage du photoréalisme scanné depuis le monde réel, que l'IA n'égale pas encore en fidélité. Verdict : challengé pour le sur-mesure, encore devant sur le réalisme scanné.",
    replaceEn: "The real point: why search a library when an AI generates the exact asset you need? But Megascans keeps the edge of photorealism scanned from the real world, which AI does not yet match in fidelity. Verdict: challenged for custom needs, still ahead on scanned realism.",
    aiTools: ["meshy", "tripo"],
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
console.log(`aiAngle (render+tex) sur ${n} fiches | JSON OK`);
