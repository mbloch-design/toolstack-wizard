/** add-ai-angle-archviz-3d.mjs — aiAngle (niché dans seo) sur l'archviz temps réel
 * et les apps 3D restantes. Règle : tout outil IA cité dans le texte est dans aiTools. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const A = {
  "unreal-engine": {
    stance: "augmente",
    augmentFr: "Unreal profite de l'IA en amont et en aval, pas en son coeur. En amont, la 3D générative (Meshy, Tripo) fournit des bases d'assets à intégrer dans tes niveaux, et l'AI mocap (Move AI, Autodesk Flow Studio) capture de l'animation de personnage depuis une simple vidéo, sans studio. Le moteur lui-même intègre des outils IA comme MetaHuman Animator pour l'animation faciale.",
    augmentEn: "Unreal benefits from AI upstream and downstream, not at its core. Upstream, generative 3D (Meshy, Tripo) provides base assets to bring into your levels, and AI mocap (Move AI, Autodesk Flow Studio) captures character animation from a simple video, no studio needed. The engine itself ships AI tools like MetaHuman Animator for facial animation.",
    replaceFr: "Remplacer Unreal par une IA ? Impensable à court terme : c'est un moteur temps réel complet (rendu, physique, réseau, interactivité), pas un générateur de contenu. La 3D générative produit des objets isolés, pas des niveaux jouables ou des expériences de virtual production. Verdict : l'IA accélère la création de contenu qui alimente Unreal, elle ne remplace pas le moteur.",
    replaceEn: "Replace Unreal with an AI? Unthinkable in the short term: it's a complete real-time engine (rendering, physics, networking, interactivity), not a content generator. Generative 3D produces isolated objects, not playable levels or virtual production experiences. Verdict: AI speeds up the content that feeds into Unreal, it doesn't replace the engine.",
    aiTools: ["meshy", "tripo", "move-ai", "autodesk-flow-studio"],
  },
  "twinmotion": {
    stance: "challenge",
    augmentFr: "Twinmotion sert surtout à produire vite une image ou une visite convaincante depuis une maquette 3D. Pour le rendu final, des IA d'image comme Magnific ou Krea peuvent repasser sur un export Twinmotion pour pousser le photoréalisme d'une image clé, sans toucher au modèle.",
    augmentEn: "Twinmotion mainly serves to quickly produce a convincing image or walkthrough from a 3D model. For the final render, image AIs like Magnific or Krea can rework a Twinmotion export to push photorealism on a hero image, without touching the model.",
    replaceFr: "Remplacer Twinmotion par une IA ? Pour le rendu marketing pur (une image hero, une ambiance), les générateurs IA texte-image produisent déjà des visuels d'architecture bluffants sans aucune maquette 3D, ce qui grignote l'usage purement illustratif. Mais pour une visite synchronisée à la maquette BIM, avec plans et mesures cohérents, aucune IA ne fait ce travail. Verdict : challengé sur l'image isolée, irremplaçable sur la visite technique.",
    replaceEn: "Replace Twinmotion with an AI? For pure marketing renders (a hero image, a mood shot), text-to-image AI generators already produce stunning architecture visuals with no 3D model at all, eating into the purely illustrative use case. But for a walkthrough synced to the BIM model, with consistent plans and measurements, no AI does that work. Verdict: challenged on the standalone image, irreplaceable on the technical walkthrough.",
    aiTools: ["magnific-ai", "krea-ai"],
  },
  "d5-render": {
    stance: "augmente",
    augmentFr: "D5 intègre déjà de l'IA pour accélérer le rendu (débruitage, peuplement automatique de végétation et de foules). Pour aller plus loin sur une image clé, repasser un export D5 dans Magnific ou Krea pousse le photoréalisme ou stylise le rendu sans repartir de zéro.",
    augmentEn: "D5 already integrates AI to speed up rendering (denoising, automatic vegetation and crowd population). To go further on a hero image, running a D5 export through Magnific or Krea pushes photorealism or restyles the render without starting over.",
    replaceFr: "Remplacer D5 par une IA ? Non pour le rendu lié à une maquette 3D précise et à ses imports CAD (SketchUp, Revit, Rhino) : c'est tout l'intérêt de D5. Une IA d'image peut produire un visuel séduisant à partir d'un croquis, mais sans le contrôle technique d'une vraie maquette. Verdict : l'IA accélère D5 en interne et en post-traitement, elle ne remplace pas le rendu lié à la maquette.",
    replaceEn: "Replace D5 with an AI? Not for rendering tied to a precise 3D model and its CAD imports (SketchUp, Revit, Rhino): that's the whole point of D5. An image AI can produce an appealing visual from a sketch, but without the technical control of a real model. Verdict: AI speeds up D5 internally and in post, it doesn't replace model-based rendering.",
    aiTools: ["magnific-ai", "krea-ai"],
  },
  "enscape": {
    stance: "augmente",
    augmentFr: "La force d'Enscape, c'est le live-sync avec Revit, SketchUp ou Rhino : ce que tu modélises se met à jour en temps réel dans le rendu. L'IA n'intervient pas là-dedans, mais elle peut repasser sur une image fixe exportée (Magnific, Krea) pour un visuel marketing plus poussé.",
    augmentEn: "Enscape's strength is live-sync with Revit, SketchUp or Rhino: what you model updates in real time in the render. AI doesn't play a role there, but it can rework a fixed exported image (Magnific, Krea) for a more polished marketing visual.",
    replaceFr: "Remplacer Enscape par une IA ? Non, et c'est net : le live-sync BIM n'a aucun équivalent IA, c'est un lien technique direct entre la maquette et le rendu, indispensable en architecture professionnelle. Les IA d'image génèrent des visuels isolés, sans connexion à un modèle réel. Verdict : Enscape reste irremplaçable pour le flux BIM, l'IA n'intervient qu'en périphérie sur l'image finale.",
    replaceEn: "Replace Enscape with an AI? No, clearly: BIM live-sync has no AI equivalent, it's a direct technical link between the model and the render, essential in professional architecture. Image AIs generate standalone visuals, with no connection to a real model. Verdict: Enscape remains irreplaceable for the BIM workflow, AI only plays a peripheral role on the final image.",
    aiTools: ["magnific-ai", "krea-ai"],
  },
  "lumion": {
    stance: "challenge",
    augmentFr: "Lumion vend une bibliothèque d'assets et une ambiance cinématique prête à l'emploi. Pour pousser une image clé encore plus loin, une passe par Magnific ou Krea ajoute du détail et du photoréalisme sur un export Lumion.",
    augmentEn: "Lumion sells a ready-made asset library and a cinematic mood. To push a hero image even further, a pass through Magnific or Krea adds detail and photorealism to a Lumion export.",
    replaceFr: "Remplacer Lumion par une IA ? Sur l'image isolée et l'ambiance, les générateurs IA d'architecture font une concurrence sérieuse, surtout pour un usage marketing rapide sans vraie maquette. Mais pour une animation cinématique cohérente avec ta géométrie réelle, Lumion reste seul sur ce terrain. Verdict : challengé sur le visuel d'ambiance ponctuel, solide sur l'animation liée à la maquette.",
    replaceEn: "Replace Lumion with an AI? On the standalone image and mood, AI architecture generators are serious competition, especially for quick marketing use with no real model. But for cinematic animation consistent with your actual geometry, Lumion stays alone on that ground. Verdict: challenged on the one-off mood visual, solid on model-based animation.",
    aiTools: ["magnific-ai", "krea-ai"],
  },
  "3ds-max": {
    stance: "augmente",
    augmentFr: "Autour de 3ds Max, l'IA arrive par les mêmes voies que sur Maya : la 3D générative (Meshy, Tripo) sort une base de modèle à raffiner, et l'AI mocap (Move AI) capture de l'animation sans studio. Au rendu, le débruitage IA des moteurs comme Arnold ou V-Ray accélère beaucoup les calculs.",
    augmentEn: "Around 3ds Max, AI arrives through the same channels as on Maya: generative 3D (Meshy, Tripo) outputs a base model to refine, and AI mocap (Move AI) captures animation with no studio. At render time, AI denoising in engines like Arnold or V-Ray speeds up computation a lot.",
    replaceFr: "Remplacer 3ds Max par une IA ? Pas pour les pipelines archviz et jeu pro intégrés à l'écosystème Autodesk (Revit, Maya, moteurs de rendu) : aucune IA ne gère ce niveau d'intégration et de contrôle. La 3D générative dégrossit une base, mais le travail de production reste dans Max. Verdict : l'IA accélère certaines étapes, le coeur du pipeline pro reste intact.",
    replaceEn: "Replace 3ds Max with an AI? Not for archviz and pro game pipelines integrated into the Autodesk ecosystem (Revit, Maya, render engines): no AI handles that level of integration and control. Generative 3D roughs out a base, but the production work stays in Max. Verdict: AI speeds up certain steps, the core of the pro pipeline stays intact.",
    aiTools: ["meshy", "tripo", "move-ai"],
  },
  "rhino": {
    stance: "augmente",
    augmentFr: "Rhino vit de la précision NURBS, un terrain où l'IA générative ne joue pas encore : Meshy ou Tripo sortent des maillages organiques approximatifs, pas des surfaces mathématiques exploitables en fabrication. L'IA peut en revanche aider en amont, pour visualiser rapidement une idée de forme avant de la reconstruire proprement dans Rhino.",
    augmentEn: "Rhino lives on NURBS precision, ground where generative AI doesn't play yet: Meshy or Tripo output approximate organic meshes, not mathematical surfaces usable in manufacturing. AI can help upstream though, to quickly visualize a shape idea before rebuilding it cleanly in Rhino.",
    replaceFr: "Remplacer Rhino par une IA ? Non, et l'écart est net : le design produit, la bijouterie et l'architecture de précision exigent une géométrie exacte et un historique paramétrique (Grasshopper), ce que la 3D générative ne fournit pas. Verdict : aucune IA actuelle ne touche au coeur du métier de Rhino, la précision mathématique.",
    replaceEn: "Replace Rhino with an AI? No, and the gap is clear: product design, jewelry and precision architecture require exact geometry and parametric history (Grasshopper), which generative 3D doesn't provide. Verdict: no current AI touches Rhino's core job, mathematical precision.",
    aiTools: ["meshy", "tripo"],
  },
  "sketchup-pro": {
    stance: "challenge",
    augmentFr: "Pour une esquisse rapide de volume, des outils IA comme Meshy proposent désormais une alternative à la modélisation manuelle de masse dans SketchUp. Pour le rendu, brancher une image SketchUp sur Krea ajoute du photoréalisme en quelques secondes.",
    augmentEn: "For a quick massing sketch, AI tools like Meshy now offer an alternative to manual mass modeling in SketchUp. For rendering, running a SketchUp image through Krea adds photorealism in seconds.",
    replaceFr: "Remplacer SketchUp par une IA ? Pour un croquis de concept rapide, la 3D générative ou un simple générateur d'image peut suffire et va parfois plus vite. Mais pour un plan mesuré, un dossier de permis ou un échange de fichiers avec des architectes, SketchUp reste la référence : aucune IA ne produit ce niveau de précision exploitable. Verdict : challengé sur le croquis d'idée, solide sur la modélisation exploitable.",
    replaceEn: "Replace SketchUp with an AI? For a quick concept sketch, generative 3D or a simple image generator can be enough and sometimes faster. But for a measured plan, a permit package or file exchange with architects, SketchUp stays the reference: no AI produces that level of usable precision. Verdict: challenged on the idea sketch, solid on usable modeling.",
    aiTools: ["meshy", "krea-ai"],
  },
  "modo": {
    stance: "challenge",
    augmentFr: "Modo profitait surtout de son flux de modélisation et de rendu rapide. L'IA générative (Meshy, Tripo) attaque exactement ce terrain : sortir une base 3D vite, ce qui réduit encore l'intérêt de payer pour un outil que Blender égalait déjà gratuitement.",
    augmentEn: "Modo mainly relied on its fast modeling and rendering flow. Generative AI (Meshy, Tripo) attacks exactly that ground: getting a 3D base out fast, which further reduces the case for paying for a tool Blender already matched for free.",
    replaceFr: "Remplacer Modo par une IA ? Pas directement, mais la double pression de Blender (gratuit) et de la 3D générative (rapide) rend Modo de plus en plus difficile à justifier, sauf attachement à son flux spécifique. Verdict : déjà challengé par le gratuit, encore plus par l'IA.",
    replaceEn: "Replace Modo with an AI? Not directly, but the double pressure of Blender (free) and generative 3D (fast) makes Modo increasingly hard to justify, unless you're attached to its specific workflow. Verdict: already challenged by free tools, even more so by AI.",
    aiTools: ["meshy", "tripo"],
  },
  "nomad-sculpt": {
    stance: "augmente",
    augmentFr: "Sur tablette, le combo le plus efficace reste de générer une base avec Meshy ou Tripo, puis de l'importer dans Nomad pour sculpter les détails au doigt. Ça remplace l'étape de blockout, pas le geste de sculpture.",
    augmentEn: "On tablet, the most efficient combo is still generating a base with Meshy or Tripo, then importing it into Nomad to sculpt details by hand. It replaces the blockout step, not the sculpting itself.",
    replaceFr: "Remplacer Nomad par une IA ? Non : la 3D générative donne une forme de départ, mais le contrôle fin du détail et de l'expression artistique reste un geste humain que l'IA ne reproduit pas. Verdict : l'IA fournit la base, Nomad fait le travail qui compte.",
    replaceEn: "Replace Nomad with an AI? No: generative 3D gives a starting shape, but fine detail control and artistic expression remain a human gesture AI doesn't replicate. Verdict: AI provides the base, Nomad does the work that matters.",
    aiTools: ["meshy", "tripo"],
  },
  "marvelous-designer": {
    stance: "augmente",
    augmentFr: "Une IA d'image comme Midjourney peut générer un concept de vêtement séduisant en quelques secondes, ce qui aide à explorer des idées avant de les construire. Mais transformer ce concept en patron 2D qui se drape correctement en 3D reste un travail de simulation physique.",
    augmentEn: "An image AI like Midjourney can generate an appealing clothing concept in seconds, which helps explore ideas before building them. But turning that concept into a 2D pattern that drapes correctly in 3D remains a job of physical simulation.",
    replaceFr: "Remplacer Marvelous Designer par une IA ? Non : aucune IA ne simule aujourd'hui la physique du tissu (poids, élasticité, frottement) à partir d'un patron réel, ce qui est le coeur du métier pour la mode, le jeu et le ciné. Les IA d'image inspirent le concept, Marvelous le rend physiquement crédible. Verdict : complémentaires, pas concurrentes.",
    replaceEn: "Replace Marvelous Designer with an AI? No: no AI currently simulates fabric physics (weight, stretch, friction) from a real pattern, which is the core job for fashion, games and film. Image AIs inspire the concept, Marvelous makes it physically credible. Verdict: complementary, not competing.",
    aiTools: ["midjourney"],
  },
  "nuke": {
    stance: "challenge",
    augmentFr: "Les IA vidéo (Runway, Kling) automatisent désormais des tâches qui occupaient des compositeurs Nuke : suppression d'objet, rotoscopie approximative, remplissage de fond. Ça absorbe le travail répétitif bas de gamme, pas la finition.",
    augmentEn: "Video AIs (Runway, Kling) now automate tasks that used to occupy Nuke compositors: object removal, rough rotoscoping, background fill. It absorbs the repetitive low-end work, not the finishing.",
    replaceFr: "Remplacer Nuke par une IA ? Pas pour un pipeline VFX cinéma complet (compositing multicouche, color management, intégration avec le studio) : c'est un niveau de contrôle que l'IA générative n'offre pas. Mais une part croissante des tâches de compositing simples bascule déjà vers des IA vidéo en quelques clics. Verdict : le haut de gamme tient, le bas de gamme du compositing est sérieusement grignoté.",
    replaceEn: "Replace Nuke with an AI? Not for a full feature-film VFX pipeline (multi-layer compositing, color management, studio integration): that's a level of control generative AI doesn't offer. But a growing share of simple compositing tasks already shifts to video AIs in a few clicks. Verdict: the high end holds, the low end of compositing is seriously eaten into.",
    aiTools: ["runway", "kling-ai"],
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
console.log(`aiAngle (archviz + 3D restant) sur ${n} fiches | JSON OK`);
