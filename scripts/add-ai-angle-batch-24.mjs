/** add-ai-angle-batch-24.mjs — aiAngle pour DeepSeek, Windsurf, Fathom,
 * Granola, Adobe Firefly, Krea AI, Pinecone, Fellow. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  deepseek: {
    stance: "challenge",
    augmentFr: "DeepSeek a démontré qu'un modèle open source pouvait approcher les performances de GPT-4 ou Claude à une fraction du coût d'entraînement, challengeant directement le modèle économique des labs IA propriétaires américains.",
    augmentEn: "DeepSeek demonstrated that an open-source model could approach GPT-4 or Claude's performance at a fraction of the training cost, directly challenging the business model of proprietary American AI labs.",
    replaceFr: "DeepSeek remplace-t-il ChatGPT ou Claude ? Pour un usage générique à coût minimal, c'est une alternative crédible. Pour des tâches critiques nécessitant fiabilité et support entreprise, les modèles propriétaires établis restent souvent préférés. Verdict : DeepSeek challenge fortement le rapport coût/performance du marché IA.",
    replaceEn: "Does DeepSeek replace ChatGPT or Claude? For generic use at minimal cost, it's a credible alternative. For critical tasks requiring reliability and enterprise support, established proprietary models are often still preferred. Verdict: DeepSeek strongly challenges the AI market's cost-to-performance ratio.",
    aiTools: ["chatgpt", "claude"],
  },
  windsurf: {
    stance: "augmente",
    augmentFr: "Windsurf est un IDE construit autour d'un agent IA capable de naviguer et modifier une base de code entière de façon autonome, positionné comme concurrent direct de Cursor sur le développement assisté par IA.",
    augmentEn: "Windsurf is an IDE built around an AI agent capable of autonomously navigating and modifying an entire codebase, positioned as a direct competitor to Cursor on AI-assisted development.",
    replaceFr: "Windsurf remplace-t-il le développeur ? Non : il accélère fortement l'écriture de code répétitif et l'exploration d'une base de code, mais l'architecture logicielle et les décisions métier restent humaines. Verdict : l'IA augmente la vitesse de développement, le jugement d'ingénierie reste indispensable.",
    replaceEn: "Does Windsurf replace the developer? No: it strongly speeds up writing repetitive code and exploring a codebase, but software architecture and business decisions remain human. Verdict: AI augments development speed, engineering judgment remains essential.",
    aiTools: [],
  },
  fathom: {
    stance: "augmente",
    augmentFr: "Fathom enregistre et résume automatiquement les réunions vidéo (Zoom, Meet, Teams) avec des comptes-rendus actionnables, gratuitement dans sa version de base — une fonctionnalité désormais standard sur le marché des assistants de réunion IA.",
    augmentEn: "Fathom automatically records and summarizes video meetings (Zoom, Meet, Teams) with actionable recaps, free in its basic version — a feature now standard in the AI meeting assistant market.",
    replaceFr: "Fathom remplace-t-il la prise de notes humaine ? Largement oui pour les comptes-rendus factuels, ce qui libère du temps pendant la réunion. Pour des nuances relationnelles ou politiques internes, une attention humaine reste utile. Verdict : l'IA augmente fortement la productivité de réunion, au point de rendre la prise de notes manuelle obsolète pour beaucoup.",
    replaceEn: "Does Fathom replace human note-taking? Largely yes for factual recaps, freeing up time during the meeting. For relational or internal political nuances, human attention remains useful. Verdict: AI strongly augments meeting productivity, to the point of making manual note-taking obsolete for many.",
    aiTools: [],
  },
  granola: {
    stance: "augmente",
    augmentFr: "Granola se différencie des autres assistants de réunion IA en combinant tes propres notes manuelles avec la transcription audio, produisant un compte-rendu plus fidèle à ce que tu jugeais important plutôt qu'un résumé générique.",
    augmentEn: "Granola differentiates itself from other AI meeting assistants by combining your own manual notes with audio transcription, producing a recap more faithful to what you judged important rather than a generic summary.",
    replaceFr: "Granola remplace-t-il la prise de notes ? Il la transforme plutôt que de la remplacer entièrement : tu notes les points clés, l'IA enrichit avec le contexte complet de la conversation. Verdict : l'IA augmente la qualité du compte-rendu sans éliminer l'attention humaine pendant la réunion.",
    replaceEn: "Does Granola replace note-taking? It transforms it rather than fully replacing it: you note key points, AI enriches with the full conversation context. Verdict: AI augments recap quality without eliminating human attention during the meeting.",
    aiTools: [],
  },
  firefly: {
    stance: "augmente",
    augmentFr: "Adobe Firefly génère des images et effets directement intégrés dans Photoshop et Illustrator, avec l'argument différenciant d'être entraîné sur des contenus dont les droits sont clairs (Adobe Stock), contrairement à d'autres générateurs.",
    augmentEn: "Adobe Firefly generates images and effects directly integrated into Photoshop and Illustrator, with the differentiating argument of being trained on content with clear rights (Adobe Stock), unlike other generators.",
    replaceFr: "Firefly remplace-t-il un designer ? Non : il accélère des tâches précises (remplissage génératif, extension d'image) au sein d'un flux de travail Adobe, sans remplacer la direction artistique. Son intérêt principal pour un usage commercial est la clarté juridique des droits d'auteur. Verdict : l'IA augmente la production, la clarté des droits reste son vrai différenciateur.",
    replaceEn: "Does Firefly replace a designer? No: it speeds up specific tasks (generative fill, image extension) within an Adobe workflow, without replacing art direction. Its main appeal for commercial use is copyright clarity. Verdict: AI augments production, rights clarity remains its real differentiator.",
    aiTools: [],
  },
  "krea-ai": {
    stance: "augmente",
    augmentFr: "Krea AI combine plusieurs modèles de génération d'image et vidéo dans un canevas nodal unique, se positionnant comme un hub multi-modèles plutôt qu'un générateur avec un seul moteur propriétaire.",
    augmentEn: "Krea AI combines several image and video generation models into a single nodal canvas, positioning itself as a multi-model hub rather than a generator with a single proprietary engine.",
    replaceFr: "Krea AI remplace-t-il Midjourney ou d'autres générateurs ? Plutôt l'inverse : Krea les intègre dans son canevas plutôt que de les concurrencer frontalement, en ajoutant une couche de contrôle créatif (canevas, itération en temps réel) au-dessus des modèles existants. Verdict : l'IA augmente le contrôle créatif sur des modèles tiers plutôt que de les remplacer.",
    replaceEn: "Does Krea AI replace Midjourney or other generators? Rather the opposite: Krea integrates them into its canvas instead of competing head-on, adding a layer of creative control (canvas, real-time iteration) on top of existing models. Verdict: AI augments creative control over third-party models rather than replacing them.",
    aiTools: ["midjourney"],
  },
  pinecone: {
    stance: "augmente",
    augmentFr: "Pinecone est une base de données vectorielle managée, infrastructure indispensable pour construire des applications RAG (recherche augmentée par génération) — un besoin technique en amont de l'IA générative, pas un concurrent direct.",
    augmentEn: "Pinecone is a managed vector database, essential infrastructure for building RAG (retrieval-augmented generation) applications — a technical need upstream of generative AI, not a direct competitor.",
    replaceFr: "Remplacer Pinecone par une IA ? La question est inversée : Pinecone est l'infrastructure qui PERMET à une IA générative de retrouver des informations pertinentes dans une base de connaissances. Verdict : Pinecone augmente les capacités des applications IA, il n'est pas en concurrence avec elles.",
    replaceEn: "Replace Pinecone with an AI? The question is inverted: Pinecone is the infrastructure that LETS a generative AI find relevant information in a knowledge base. Verdict: Pinecone augments AI applications' capabilities, it doesn't compete with them.",
    aiTools: [],
  },
  fellow: {
    stance: "augmente",
    augmentFr: "Fellow combine prise de notes de réunion par IA avec gestion de l'ordre du jour et suivi des actions, se positionnant comme un outil de gouvernance de réunion plutôt qu'un simple transcripteur.",
    augmentEn: "Fellow combines AI meeting notes with agenda management and action tracking, positioning itself as a meeting governance tool rather than a simple transcriber.",
    replaceFr: "Fellow remplace-t-il un assistant ou chef de projet pour le suivi de réunion ? Partiellement : il automatise la capture et le suivi des actions, mais la priorisation et le relances restent souvent humaines. Verdict : l'IA augmente le suivi des décisions de réunion, sans remplacer la coordination d'équipe.",
    replaceEn: "Does Fellow replace an assistant or project manager for meeting follow-up? Partly: it automates capture and action tracking, but prioritization and follow-ups often remain human. Verdict: AI augments meeting decision tracking, without replacing team coordination.",
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
