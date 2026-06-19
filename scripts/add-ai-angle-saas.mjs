/** add-ai-angle-saas.mjs — aiAngle (niché dans seo) sur des SaaS à fort trafic.
 * Règle : tout outil IA cité dans le texte est listé dans aiTools (chips). */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const A = {
  "jasper": {
    stance: "menace",
    augmentFr: "Jasper a bâti son produit sur l'IA générative pour la rédaction marketing : il génère articles, posts et accroches à partir de templates. Le souci, c'est que sa matière première (les grands modèles de langage) est devenue une commodité accessible à tous.",
    augmentEn: "Jasper built its product on generative AI for marketing copy: it generates articles, posts and hooks from templates. The problem is that its raw material (large language models) has become a commodity available to everyone.",
    replaceFr: "Soyons directs : pour la plupart des usages, ChatGPT ou Claude remplacent Jasper, souvent gratuitement ou pour bien moins cher. Jasper garde un intérêt pour les équipes marketing qui veulent des templates prêts à l'emploi, des workflows de marque et une gestion d'équipe. Mais pour un freelance, payer Jasper quand une IA généraliste écrit le même texte est difficile à justifier. Verdict : sérieusement menacé par les assistants IA généralistes.",
    replaceEn: "Let us be direct: for most uses, ChatGPT or Claude replace Jasper, often for free or far cheaper. Jasper keeps an edge for marketing teams wanting ready-made templates, brand workflows and team management. But for a freelancer, paying for Jasper when a general AI writes the same copy is hard to justify. Verdict: seriously threatened by general AI assistants.",
    aiTools: ["chatgpt", "claude"],
  },
  "otter-ai": {
    stance: "challenge",
    augmentFr: "Otter transcrit et résume tes réunions automatiquement, et a ajouté un assistant IA qui répond à des questions sur tes notes. C'est pratique, mais la transcription par IA est devenue une commodité : presque tous les outils s'y mettent.",
    augmentEn: "Otter transcribes and summarizes your meetings automatically, and added an AI assistant that answers questions about your notes. Handy, but AI transcription has become a commodity: nearly every tool now does it.",
    replaceFr: "La transcription seule ne justifie plus un abonnement dédié : des outils de notes de réunion IA (comme Fathom) le font, souvent gratuitement, et un ChatGPT résume n'importe quelle transcription en quelques secondes. Otter garde un intérêt pour son temps réel et sa recherche dans l'historique. Mais pour un usage simple, des alternatives IA gratuites couvrent le besoin. Verdict : challengé par une vague d'outils IA de réunion.",
    replaceEn: "Transcription alone no longer justifies a dedicated subscription: AI meeting-notes tools (like Fathom) do it, often for free, and a ChatGPT summarizes any transcript in seconds. Otter keeps an edge for real time and history search. But for simple use, free AI alternatives cover the need. Verdict: challenged by a wave of AI meeting tools.",
    aiTools: ["fathom", "chatgpt"],
  },
  "descript": {
    stance: "augmente",
    augmentFr: "Descript EST un produit IA : il transcrit ta vidéo ou ton podcast, et tu l'édites comme un document texte (supprime un mot du texte, le son disparaît). Il ajoute le clonage de voix, la suppression des heu, l'IA de montage. L'IA n'est pas une menace ici, c'est le coeur du produit.",
    augmentEn: "Descript IS an AI product: it transcribes your video or podcast, and you edit it like a text document (delete a word in the text, the audio disappears). It adds voice cloning, filler-word removal, AI editing. AI is not a threat here, it is the core of the product.",
    replaceFr: "Remplacer Descript par une IA généraliste ? Non : ChatGPT te donne un script, mais il ne monte pas ton podcast ni ne clone ta voix. Là où Descript est challengé, c'est par les éditeurs vidéo qui ajoutent les mêmes fonctions IA. Pour de l'édition audio/vidéo pilotée par le texte, il reste l'un des plus aboutis. Verdict : l'IA le porte plus qu'elle ne le menace.",
    replaceEn: "Replace Descript with a general AI? No: ChatGPT gives you a script, but it does not edit your podcast or clone your voice. Where Descript is challenged is by video editors adding the same AI features. For text-driven audio/video editing, it stays one of the most polished. Verdict: AI carries it more than it threatens it.",
    aiTools: ["chatgpt", "runway"],
  },
  "canva": {
    stance: "challenge",
    augmentFr: "Canva a intégré une suite IA massive (Magic Studio) : génération d'images et de texte, suppression de fond, redimensionnement magique. Pour aller plus loin sur la génération pure, des outils comme Midjourney, Krea ou Leonardo produisent des visuels bien plus poussés que ce que Canva génère en interne.",
    augmentEn: "Canva integrated a massive AI suite (Magic Studio): image and text generation, background removal, magic resize. To go further on pure generation, tools like Midjourney, Krea or Leonardo produce far more advanced visuals than Canva's built-in generation.",
    replaceFr: "Remplacer Canva par une IA ? Pas pour le design assemblé (mise en page, templates, marque), où sa simplicité reste imbattable. Mais pour la création d'images, les générateurs IA dédiés font beaucoup mieux, et pour beaucoup de visuels simples une IA suffit sans ouvrir Canva. Verdict : Canva tient grâce à sa facilité et ses templates, mais l'IA générative grignote la création pure d'images.",
    replaceEn: "Replace Canva with an AI? Not for assembled design (layout, templates, branding), where its simplicity stays unbeatable. But for image creation, dedicated AI generators do much better, and for many simple visuals an AI is enough without opening Canva. Verdict: Canva holds thanks to its ease and templates, but generative AI is nibbling at pure image creation.",
    aiTools: ["midjourney", "krea-ai", "leonardo-ai"],
  },
  "notion": {
    stance: "augmente",
    augmentFr: "Notion a intégré Notion AI directement dans ton espace de travail : il rédige, résume, traduit et interroge tes pages. Pour aller plus loin, un assistant généraliste comme ChatGPT ou Claude reste plus puissant pour du raisonnement ou de la rédaction longue, en complément.",
    augmentEn: "Notion built Notion AI right into your workspace: it writes, summarizes, translates and queries your pages. To go further, a general assistant like ChatGPT or Claude stays more powerful for reasoning or long-form writing, as a complement.",
    replaceFr: "Remplacer Notion par une IA ? Non : Notion est ta base de connaissance et d'organisation, pas un chatbot. L'IA y ajoute une couche d'assistance, mais c'est la structure (pages, bases de données, partage) qui fait sa valeur. Notion AI t'évite de copier-coller vers ChatGPT pour les tâches courantes. Verdict : l'IA augmente Notion, elle ne le remplace pas.",
    replaceEn: "Replace Notion with an AI? No: Notion is your knowledge and organization base, not a chatbot. AI adds an assistance layer, but the structure (pages, databases, sharing) is its value. Notion AI saves you copy-pasting to ChatGPT for routine tasks. Verdict: AI augments Notion, it does not replace it.",
    aiTools: ["notion-ai", "chatgpt", "claude"],
  },
  "loom": {
    stance: "challenge",
    augmentFr: "Loom a ajouté de l'IA : résumés automatiques, chapitrage, suppression des silences et des heu, titres générés. Ça transforme une vidéo brute en message clair sans montage.",
    augmentEn: "Loom added AI: automatic summaries, chaptering, silence and filler removal, generated titles. It turns a raw video into a clear message with no editing.",
    replaceFr: "Remplacer Loom par une IA ? Pas directement : enregistrer son écran et sa caméra reste un geste simple que l'IA ne remplace pas. Mais la valeur ajoutée de Loom (résumés, transcription) est désormais banalisée : un ChatGPT résume n'importe quelle transcription, et des outils de réunion IA (Fathom) couvrent une partie. Verdict : l'enregistrement tient, mais la couche IA de Loom n'a plus rien d'exclusif.",
    replaceEn: "Replace Loom with an AI? Not directly: recording your screen and camera stays a simple act AI does not replace. But Loom's added value (summaries, transcription) is now commoditized: a ChatGPT summarizes any transcript, and AI meeting tools (Fathom) cover part of it. Verdict: the recording holds, but Loom's AI layer is no longer exclusive.",
    aiTools: ["chatgpt", "fathom"],
  },
  "adobe-lightroom": {
    stance: "augmente",
    augmentFr: "Lightroom est bourré d'IA Adobe : débruitage IA bluffant, masquage automatique (ciel, sujet, arrière-plan), suppression d'objets générative. Pour aller plus loin, Luminar Neo pousse les retouches IA (ciel, portrait) encore plus loin, et Magnific gère l'upscaling créatif.",
    augmentEn: "Lightroom is packed with Adobe AI: stunning AI denoise, automatic masking (sky, subject, background), generative object removal. To go further, Luminar Neo pushes AI retouching (sky, portrait) even further, and Magnific handles creative upscaling.",
    replaceFr: "Remplacer Lightroom par une IA ? Pour la gestion d'un catalogue photo et le développement RAW non destructif, non : aucune IA ne fait ce travail de fond. L'IA accélère des étapes (masquage, débruitage), mais c'est Lightroom qui organise et finalise. Verdict : l'IA augmente fortement Lightroom sans le menacer ; le vrai arbitrage reste son abonnement face à des concurrents comme Luminar.",
    replaceEn: "Replace Lightroom with an AI? For managing a photo catalog and non-destructive RAW development, no: no AI does this groundwork. AI speeds up steps (masking, denoise), but Lightroom organizes and finalizes. Verdict: AI strongly augments Lightroom without threatening it; the real trade-off remains its subscription versus competitors like Luminar.",
    aiTools: ["luminar-neo", "magnific-ai"],
  },
  "intercom": {
    stance: "challenge",
    augmentFr: "Intercom a misé gros sur l'IA avec Fin, son agent qui répond automatiquement aux clients à partir de ta base de connaissance. C'est l'une des catégories les plus transformées par l'IA : le support de niveau 1 est massivement automatisable.",
    augmentEn: "Intercom bet big on AI with Fin, its agent that answers customers automatically from your knowledge base. It is one of the categories most transformed by AI: tier-1 support is massively automatable.",
    replaceFr: "Remplacer Intercom par une IA ? Pas la plateforme entière (messagerie, CRM, intégrations), mais l'IA redéfinit le coeur du métier : une part croissante des conversations est gérée par des agents IA, et des solutions concurrentes branchent directement ChatGPT ou Claude sur une base de connaissance. Verdict : Intercom n'est pas remplacé, mais toute la catégorie du support bascule vers l'IA, avec une forte pression sur les prix et la valeur.",
    replaceEn: "Replace Intercom with an AI? Not the whole platform (messaging, CRM, integrations), but AI is redefining the core: a growing share of conversations is handled by AI agents, and competitors plug ChatGPT or Claude straight onto a knowledge base. Verdict: Intercom is not replaced, but the entire support category is shifting to AI, with strong pressure on price and value.",
    aiTools: ["chatgpt", "claude"],
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
console.log(`aiAngle (SaaS) sur ${n} fiches | JSON OK`);
