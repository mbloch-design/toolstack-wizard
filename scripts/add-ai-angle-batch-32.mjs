/** add-ai-angle-batch-32.mjs — aiAngle pour Anthropic API, OpenAI API,
 * Google AI Studio, LangChain, Figma Weave, Adobe Podcast AI, Pika
 * Labs, Topaz Video AI. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  anthropic: {
    stance: "augmente",
    augmentFr: "L'API Anthropic est l'infrastructure qui permet à des développeurs d'intégrer Claude dans leurs propres produits — un besoin d'infrastructure de développement plutôt qu'un produit IA destiné à l'utilisateur final.",
    augmentEn: "The Anthropic API is the infrastructure that lets developers integrate Claude into their own products — a development infrastructure need rather than an end-user-facing AI product.",
    replaceFr: "Remplacer l'API Anthropic par une IA ? La question est inversée : c'est l'infrastructure qui PERMET de construire des applications IA, pas un produit qu'on remplace par une IA. Verdict : l'API augmente les capacités des produits qui l'intègrent, elle n'est pas en concurrence avec elles.",
    replaceEn: "Replace the Anthropic API with an AI? The question is inverted: it's the infrastructure that LETS you build AI applications, not a product replaced by AI. Verdict: the API augments the capabilities of products that integrate it, it doesn't compete with them.",
    aiTools: [],
  },
  "openai-api": {
    stance: "augmente",
    augmentFr: "L'API OpenAI est l'infrastructure qui permet à des milliers de produits (de Notion AI à GitHub Copilot) d'intégrer des modèles GPT — un besoin de développement plutôt qu'un produit destiné à l'utilisateur final.",
    augmentEn: "The OpenAI API is the infrastructure that lets thousands of products (from Notion AI to GitHub Copilot) integrate GPT models — a development need rather than an end-user-facing product.",
    replaceFr: "Remplacer l'API OpenAI par une IA ? La question est inversée : c'est l'infrastructure qui PERMET à d'autres produits d'intégrer l'IA, pas un produit qu'on remplace. Verdict : l'API augmente les capacités des produits qui l'intègrent, elle n'est pas en concurrence avec eux.",
    replaceEn: "Replace the OpenAI API with an AI? The question is inverted: it's the infrastructure that LETS other products integrate AI, not a product to replace. Verdict: the API augments the capabilities of products that integrate it, it doesn't compete with them.",
    aiTools: [],
  },
  "google-ai-studio": {
    stance: "augmente",
    augmentFr: "Google AI Studio est l'environnement de développement gratuit pour tester et intégrer les modèles Gemini dans une application — un besoin de prototypage pour développeurs, pas un produit IA grand public.",
    augmentEn: "Google AI Studio is the free development environment to test and integrate Gemini models into an application — a prototyping need for developers, not a mainstream AI product.",
    replaceFr: "Remplacer Google AI Studio par une IA ? Non : c'est un outil de développement pour tester et configurer des prompts Gemini avant de les intégrer dans un produit, pas un produit fini en soi. Verdict : l'IA est le sujet testé, pas ce qui remplace l'outil de test.",
    replaceEn: "Replace Google AI Studio with an AI? No: it's a development tool to test and configure Gemini prompts before integrating them into a product, not a finished product itself. Verdict: AI is the subject being tested, not what replaces the testing tool.",
    aiTools: [],
  },
  langchain: {
    stance: "augmente",
    augmentFr: "LangChain est un framework de développement pour orchestrer des applications IA complexes (agents, RAG, chaînes de prompts) — une infrastructure de développement, pas un produit IA destiné à l'utilisateur final.",
    augmentEn: "LangChain is a development framework to orchestrate complex AI applications (agents, RAG, prompt chains) — development infrastructure, not an end-user-facing AI product.",
    replaceFr: "Remplacer LangChain par une IA ? Non : c'est un framework qui structure le code pour construire des applications IA, pas un produit qu'on remplace par de l'IA. Verdict : LangChain augmente la capacité des développeurs à orchestrer l'IA, il n'est pas en concurrence avec elle.",
    replaceEn: "Replace LangChain with an AI? No: it's a framework that structures code to build AI applications, not a product replaced by AI. Verdict: LangChain augments developers' ability to orchestrate AI, it doesn't compete with it.",
    aiTools: [],
  },
  "figma-weave": {
    stance: "augmente",
    augmentFr: "Figma Weave (ex-Weavy) propose un canevas nodal multi-modèles pour combiner plusieurs IA génératives (image, vidéo) dans un seul flux créatif, intégré directement à l'écosystème Figma.",
    augmentEn: "Figma Weave (formerly Weavy) offers a multi-model nodal canvas to combine several generative AIs (image, video) into a single creative flow, directly integrated into the Figma ecosystem.",
    replaceFr: "Figma Weave remplace-t-il un designer ? Non : il accélère l'exploration créative en combinant plusieurs modèles IA, mais la direction artistique et le jugement final restent humains. Verdict : l'IA augmente l'exploration créative multi-modèles, sans remplacer la direction artistique.",
    replaceEn: "Does Figma Weave replace a designer? No: it speeds up creative exploration by combining several AI models, but art direction and final judgment remain human. Verdict: AI augments multi-model creative exploration, without replacing art direction.",
    aiTools: ["midjourney", "krea-ai"],
  },
  "adobe-podcast-ai": {
    stance: "augmente",
    augmentFr: "Adobe Podcast AI nettoie automatiquement l'audio (bruit de fond, écho) et améliore la qualité d'enregistrement avec un microphone basique, sans remplacer le contenu ou la performance du podcasteur.",
    augmentEn: "Adobe Podcast AI automatically cleans audio (background noise, echo) and improves recording quality with a basic microphone, without replacing the content or the podcaster's performance.",
    replaceFr: "Remplacer Adobe Podcast AI par un studio professionnel ? Pour la qualité audio de base, l'IA comble efficacement l'écart avec un équipement amateur. Pour un rendu broadcast très exigeant, un vrai traitement audio professionnel reste préférable. Verdict : l'IA augmente la qualité audio amateur, l'expertise de mixage pro reste différenciante pour les exigences les plus hautes.",
    replaceEn: "Replace Adobe Podcast AI with a professional studio? For basic audio quality, AI effectively closes the gap with amateur equipment. For very demanding broadcast quality, real professional audio processing remains preferable. Verdict: AI augments amateur audio quality, professional mixing expertise remains differentiating for the highest demands.",
    aiTools: [],
  },
  "pika-labs": {
    stance: "augmente",
    augmentFr: "Pika Labs génère des vidéos courtes à partir de texte ou d'image, se positionnant comme une alternative plus accessible et moins chère à Runway pour des créatifs vidéo expérimentaux rapides.",
    augmentEn: "Pika Labs generates short videos from text or images, positioning itself as a more accessible, cheaper alternative to Runway for fast experimental video creatives.",
    replaceFr: "Pika Labs remplace-t-il un tournage vidéo ? Pour des concepts visuels courts et expérimentaux, oui en partie. Pour une production narrative avec des acteurs et un contrôle fin, le tournage classique reste nécessaire. Verdict : Pika challenge les petits formats expérimentaux à petit budget, pas la production narrative complexe.",
    replaceEn: "Does Pika Labs replace video shooting? For short, experimental visual concepts, partly yes. For narrative production with actors and fine control, classic shooting remains necessary. Verdict: Pika challenges small experimental low-budget formats, not complex narrative production.",
    aiTools: ["runway"],
  },
  "topaz-video-ai": {
    stance: "augmente",
    augmentFr: "Topaz Video AI est lui-même un outil IA dont la fonction est d'améliorer et d'agrandir des vidéos par apprentissage profond (upscaling, interpolation de mouvement) — l'IA n'est pas une fonctionnalité ajoutée, c'est tout le produit.",
    augmentEn: "Topaz Video AI is itself an AI tool whose function is to enhance and upscale videos through deep learning (upscaling, motion interpolation) — AI isn't an added feature, it's the entire product.",
    replaceFr: "Remplacer Topaz Video AI par une autre IA ? La question ne se pose pas vraiment : c'est déjà un outil IA-natif spécialisé dans l'amélioration vidéo. Verdict : Topaz Video AI a été conçu autour de l'IA dès le départ plutôt que d'être challengé par elle.",
    replaceEn: "Replace Topaz Video AI with another AI? The question barely applies: it's already an AI-native tool specialized in video enhancement. Verdict: Topaz Video AI was built around AI from the start rather than being challenged by it.",
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
