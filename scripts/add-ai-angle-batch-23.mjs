/** add-ai-angle-batch-23.mjs — aiAngle pour les grands modèles IA
 * eux-mêmes : ChatGPT, Claude, Gemini, Perplexity, Grok, Microsoft 365
 * Copilot, Runway, ElevenLabs. Angle adapté : ces outils SONT l'IA,
 * la question est leur position face à des IA verticales spécialisées. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  chatgpt: {
    stance: "challenge",
    augmentFr: "ChatGPT reste le généraliste de référence (rédaction, code, analyse, brainstorm), mais des outils verticaux spécialisés (Claude pour le code complexe, Perplexity pour la recherche, Midjourney pour l'image) le devancent souvent sur leur tâche précise.",
    augmentEn: "ChatGPT remains the reference generalist (writing, code, analysis, brainstorming), but specialized vertical tools (Claude for complex code, Perplexity for research, Midjourney for images) often outperform it on their specific task.",
    replaceFr: "ChatGPT challenge-t-il les métiers créatifs et de rédaction ? Partiellement : il accélère la production de premiers jets, mais la pertinence, la vérification des faits et la voix de marque restent un travail humain. Verdict : ChatGPT augmente la productivité de l'utilisateur généraliste, sans remplacer l'expertise verticale.",
    replaceEn: "Does ChatGPT challenge creative and writing jobs? Partly: it speeds up first drafts, but relevance, fact-checking, and brand voice remain human work. Verdict: ChatGPT augments the generalist user's productivity, without replacing vertical expertise.",
    aiTools: ["claude", "perplexity", "gemini"],
  },
  claude: {
    stance: "augmente",
    augmentFr: "Claude s'est positionné sur le code complexe, l'analyse de documents longs et l'usage agentique (Claude Code), se différenciant de ChatGPT par la qualité de raisonnement plutôt que par la diversité des fonctionnalités grand public.",
    augmentEn: "Claude positioned itself on complex coding, long-document analysis, and agentic use (Claude Code), differentiating from ChatGPT through reasoning quality rather than breadth of consumer features.",
    replaceFr: "Claude challenge-t-il les développeurs ou analystes ? Il accélère fortement l'écriture de code et l'analyse de documents, mais la conception d'architecture logicielle et la validation métier restent humaines. Verdict : Claude augmente la productivité technique, sans remplacer le jugement d'ingénierie.",
    replaceEn: "Does Claude challenge developers or analysts? It strongly speeds up code writing and document analysis, but software architecture design and business validation remain human. Verdict: Claude augments technical productivity, without replacing engineering judgment.",
    aiTools: ["chatgpt"],
  },
  gemini: {
    stance: "augmente",
    augmentFr: "Gemini tire sa force de l'intégration profonde dans l'écosystème Google (Workspace, Search, Android), ce qui le différencie de ChatGPT par la distribution plutôt que par des capacités brutes radicalement supérieures.",
    augmentEn: "Gemini draws its strength from deep integration into the Google ecosystem (Workspace, Search, Android), differentiating it from ChatGPT through distribution rather than radically superior raw capabilities.",
    replaceFr: "Gemini challenge-t-il les autres modèles généralistes ? Il les concurrence surtout par la commodité (déjà présent dans Gmail, Docs, Sheets) plutôt que par une avance technique nette. Verdict : Gemini augmente la productivité dans l'écosystème Google, l'avantage est la distribution, pas la rupture.",
    replaceEn: "Does Gemini challenge other generalist models? It mainly competes through convenience (already present in Gmail, Docs, Sheets) rather than a clear technical lead. Verdict: Gemini augments productivity within the Google ecosystem, the advantage is distribution, not a breakthrough.",
    aiTools: ["chatgpt", "claude"],
  },
  perplexity: {
    stance: "challenge",
    augmentFr: "Perplexity a construit sa position autour de la recherche augmentée par IA avec sources citées, challengeant directement Google Search sur les requêtes informationnelles complexes plutôt que de concurrencer ChatGPT sur la génération pure.",
    augmentEn: "Perplexity built its position around AI-augmented search with cited sources, directly challenging Google Search on complex informational queries rather than competing with ChatGPT on pure generation.",
    replaceFr: "Perplexity remplace-t-il Google ? Pour des recherches qui demandent une synthèse de plusieurs sources, oui en partie. Pour de la navigation simple ou des achats, Google reste plus rapide. Verdict : Perplexity challenge la recherche informationnelle complexe, pas la recherche web généraliste.",
    replaceEn: "Does Perplexity replace Google? For searches requiring synthesis of multiple sources, partly yes. For simple navigation or shopping, Google remains faster. Verdict: Perplexity challenges complex informational search, not general web search.",
    aiTools: ["chatgpt"],
  },
  grok: {
    stance: "augmente",
    augmentFr: "Grok se différencie par son intégration native à X (accès aux données temps réel de la plateforme) plutôt que par des capacités génériques supérieures aux autres modèles généralistes.",
    augmentEn: "Grok differentiates itself through native X integration (access to the platform's real-time data) rather than through generic capabilities superior to other generalist models.",
    replaceFr: "Grok challenge-t-il les autres assistants IA ? Son avantage est l'accès aux données en temps réel de X, pertinent pour de la veille ou du contenu d'actualité, moins pour des tâches génériques de rédaction ou de code. Verdict : l'IA augmente la veille en temps réel, sans dominer sur les usages généralistes.",
    replaceEn: "Does Grok challenge other AI assistants? Its edge is real-time access to X data, relevant for monitoring or news content, less so for generic writing or coding tasks. Verdict: AI augments real-time monitoring, without dominating generalist use cases.",
    aiTools: ["chatgpt", "claude"],
  },
  "microsoft-365-copilot": {
    stance: "augmente",
    augmentFr: "Microsoft 365 Copilot intègre l'IA directement dans Word, Excel, Outlook et Teams, misant sur la distribution dans des outils déjà utilisés par des millions d'entreprises plutôt que sur une interface IA distincte.",
    augmentEn: "Microsoft 365 Copilot integrates AI directly into Word, Excel, Outlook, and Teams, betting on distribution within tools already used by millions of businesses rather than a separate AI interface.",
    replaceFr: "Copilot 365 remplace-t-il les outils Microsoft eux-mêmes ? Non : c'est une couche d'assistance ajoutée à des outils qui restent l'infrastructure (documents, tableurs, mails). Verdict : l'IA augmente la productivité dans les outils existants, elle ne les remplace pas.",
    replaceEn: "Does Copilot 365 replace the Microsoft tools themselves? No: it's an assistance layer added to tools that remain the infrastructure (documents, spreadsheets, emails). Verdict: AI augments productivity within existing tools, it doesn't replace them.",
    aiTools: ["chatgpt"],
  },
  runway: {
    stance: "augmente",
    augmentFr: "Runway s'est positionné comme un studio de production vidéo par IA générative (Gen-3) pour les créateurs et studios, plutôt qu'un simple éditeur — challengeant des productions vidéo qui nécessitaient un budget tournage classique.",
    augmentEn: "Runway positioned itself as a generative AI video production studio (Gen-3) for creators and studios, rather than a simple editor — challenging video productions that required a classic shooting budget.",
    replaceFr: "Runway remplace-t-il un tournage vidéo classique ? Pour des concepts visuels expérimentaux ou des budgets serrés, oui en partie. Pour une production avec des acteurs réels, une histoire complexe et un contrôle narratif fin, le tournage classique reste nécessaire. Verdict : Runway challenge les petites productions à petit budget, pas le cinéma narratif complexe.",
    replaceEn: "Does Runway replace classic video shooting? For experimental visual concepts or tight budgets, partly yes. For a production with real actors, a complex story, and fine narrative control, classic shooting remains necessary. Verdict: Runway challenges small low-budget productions, not complex narrative filmmaking.",
    aiTools: [],
  },
  elevenlabs: {
    stance: "challenge",
    augmentFr: "ElevenLabs a atteint une qualité de synthèse vocale et de clonage de voix si réaliste qu'il challenge directement les métiers du doublage, de la voix-off et de la narration audio pour des budgets serrés.",
    augmentEn: "ElevenLabs reached a voice synthesis and cloning quality so realistic that it directly challenges dubbing, voice-over, and audio narration jobs for tight budgets.",
    replaceFr: "ElevenLabs remplace-t-il les voix-off humaines ? Pour du contenu de volume (audiobooks automatisés, doublage rapide) avec un budget serré, oui en grande partie. Pour une performance artistique nuancée (publicité premium, animation de personnage), une voix humaine reste préférée. Verdict : challenge fortement le doublage de volume, moins la performance vocale artistique haut de gamme.",
    replaceEn: "Does ElevenLabs replace human voice-overs? For volume content (automated audiobooks, fast dubbing) with a tight budget, largely yes. For a nuanced artistic performance (premium advertising, character animation), a human voice remains preferred. Verdict: strongly challenges volume dubbing, less so high-end artistic vocal performance.",
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
