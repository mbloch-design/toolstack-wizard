/** add-ai-angle-batch-2.mjs — 8 fiches supplémentaires à forte notoriété :
 * Gmail, Google Docs, Google Sheets, Google Meet, TikTok, Firebase,
 * Cloudflare, Sentry. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  gmail: {
    stance: "augmente",
    augmentFr: "Gmail a intégré Gemini directement dans la boîte mail : résumer un fil, rédiger une réponse, organiser. Beaucoup d'utilisateurs passent aussi par ChatGPT en parallèle pour rédiger des mails plus soignés avant de les coller dans Gmail.",
    augmentEn: "Gmail built Gemini right into the inbox: summarizing threads, drafting replies, organizing. Many users also go through ChatGPT in parallel to write more polished emails before pasting them into Gmail.",
    replaceFr: "Remplacer Gmail par une IA ? Non : Gmail reste l'infrastructure (adresse, stockage, intégration Workspace), l'IA n'en est qu'une couche d'assistance pour la rédaction et le tri. Verdict : l'IA augmente la productivité dans la boîte, elle ne remplace pas la boîte elle-même.",
    replaceEn: "Replace Gmail with an AI? No: Gmail remains the infrastructure (address, storage, Workspace integration), AI is just an assistance layer for writing and sorting. Verdict: AI augments productivity in the inbox, it doesn't replace the inbox itself.",
    aiTools: ["gemini", "chatgpt"],
  },
  "google-docs": {
    stance: "augmente",
    augmentFr: "Google Docs a son assistant Gemini pour résumer, réécrire ou générer un premier brouillon directement dans le document. La structure de partage et de collaboration en temps réel reste ce qui fait la valeur de l'outil.",
    augmentEn: "Google Docs has its Gemini assistant to summarize, rewrite, or generate a first draft directly in the document. Real-time sharing and collaboration structure remains what makes the tool valuable.",
    replaceFr: "Remplacer Google Docs par une IA ? Non : la collaboration en temps réel avec ton équipe ou tes clients, les commentaires, l'historique des versions — rien de tout ça n'est remplacé par un chatbot. L'IA aide à écrire plus vite dans le document, pas à se passer du document. Verdict : l'IA augmente la rédaction, la collaboration reste le cœur du produit.",
    replaceEn: "Replace Google Docs with an AI? No: real-time collaboration with your team or clients, comments, version history — none of that is replaced by a chatbot. AI helps write faster inside the document, not skip the document. Verdict: AI augments writing, collaboration remains the product's core.",
    aiTools: ["gemini"],
  },
  "google-sheets": {
    stance: "augmente",
    augmentFr: "Google Sheets a intégré Gemini pour générer des formules, résumer des données ou créer des tableaux à partir d'une simple description en langage naturel — un vrai gain de temps pour qui galère avec les formules complexes.",
    augmentEn: "Google Sheets integrated Gemini to generate formulas, summarize data, or create tables from a plain-language description — a real time-saver for anyone struggling with complex formulas.",
    replaceFr: "Remplacer Google Sheets par une IA ? Non : un tableur reste l'outil de référence pour structurer des données partagées et calculer en direct. L'IA t'évite de chercher la syntaxe d'une formule, elle ne remplace pas la feuille de calcul. Verdict : l'IA augmente la vitesse de manipulation, pas la structure de données elle-même.",
    replaceEn: "Replace Google Sheets with an AI? No: a spreadsheet remains the reference tool for structuring shared data and calculating live. AI saves you from hunting down a formula's syntax, it doesn't replace the spreadsheet. Verdict: AI augments manipulation speed, not the data structure itself.",
    aiTools: ["gemini"],
  },
  "google-meet": {
    stance: "augmente",
    augmentFr: "Google Meet propose désormais la prise de notes automatique et le résumé de réunion par IA (Gemini), une fonctionnalité que des outils tiers comme Otter ou Fellow proposaient déjà depuis plus longtemps.",
    augmentEn: "Google Meet now offers automatic note-taking and AI meeting summaries (Gemini), a feature third-party tools like Otter or Fellow had already been offering for longer.",
    replaceFr: "Remplacer Google Meet par une IA ? Non : la visioconférence elle-même (qualité vidéo, intégration calendrier, capacité de participants) reste un problème d'infrastructure que l'IA n'adresse pas. Elle augmente ce qui se passe pendant et après la réunion (notes, résumé), pas le besoin de se voir en visio. Verdict : l'IA augmente le compte-rendu, pas la visioconférence.",
    replaceEn: "Replace Google Meet with an AI? No: video conferencing itself (video quality, calendar integration, participant capacity) remains an infrastructure problem AI doesn't address. It augments what happens during and after the meeting (notes, summary), not the need to meet on video. Verdict: AI augments the recap, not the video call.",
    aiTools: ["fellow"],
  },
  tiktok: {
    stance: "augmente",
    augmentFr: "TikTok a son propre studio de création avec des effets et sous-titres automatiques, mais la plupart des créateurs utilisent des outils IA externes (CapCut, Submagic, Opus Clip) pour monter et sous-titrer leurs vidéos avant de les publier.",
    augmentEn: "TikTok has its own creation studio with effects and automatic captions, but most creators use external AI tools (CapCut, Submagic, Opus Clip) to edit and caption their videos before publishing.",
    replaceFr: "Remplacer TikTok par une IA ? Non : TikTok est la plateforme de distribution et l'algorithme qui apporte la visibilité, pas un outil de création. L'IA aide à produire le contenu plus vite, mais l'audience et la portée restent sur la plateforme elle-même. Verdict : l'IA augmente la production de contenu, TikTok reste la plateforme de diffusion.",
    replaceEn: "Replace TikTok with an AI? No: TikTok is the distribution platform and algorithm that brings visibility, not a creation tool. AI helps produce content faster, but the audience and reach stay on the platform itself. Verdict: AI augments content production, TikTok remains the distribution platform.",
    aiTools: ["opus-clip", "submagic"],
  },
  firebase: {
    stance: "augmente",
    augmentFr: "Firebase profite de l'intégration croissante avec Gemini (Vertex AI, Genkit) pour ajouter des fonctionnalités IA aux apps qu'il héberge, mais reste avant tout une infrastructure (auth, base de données, hosting), pas un générateur de site.",
    augmentEn: "Firebase benefits from growing integration with Gemini (Vertex AI, Genkit) to add AI features to the apps it hosts, but remains primarily infrastructure (auth, database, hosting), not a site generator.",
    replaceFr: "Remplacer Firebase par une IA ? Non, mais le besoin évolue : les générateurs d'apps par prompt comme Lovable ou Bolt.new utilisent souvent Firebase ou un équivalent en arrière-plan — Firebase devient l'infrastructure invisible derrière l'app générée par IA, plutôt qu'un choix que le développeur fait lui-même à la main. Verdict : l'IA augmente la façon de construire sur Firebase, elle ne le remplace pas en tant qu'infrastructure.",
    replaceEn: "Replace Firebase with an AI? No, but the need is shifting: prompt-based app generators like Lovable or Bolt.new often use Firebase or an equivalent behind the scenes — Firebase becomes the invisible infrastructure behind the AI-generated app, rather than something the developer chooses by hand. Verdict: AI augments how you build on Firebase, it doesn't replace it as infrastructure.",
    aiTools: ["lovable", "bolt-new"],
  },
  cloudflare: {
    stance: "augmente",
    augmentFr: "Cloudflare a ajouté des outils IA (Workers AI, AI Gateway, protection contre le scraping par bots IA) à son offre, mais son rôle de CDN, DNS et bouclier de sécurité reste une infrastructure réseau que l'IA ne remplace pas.",
    augmentEn: "Cloudflare added AI tools (Workers AI, AI Gateway, protection against AI bot scraping) to its offer, but its role as CDN, DNS, and security shield remains network infrastructure that AI doesn't replace.",
    replaceFr: "Remplacer Cloudflare par une IA ? Non : protéger un site contre les attaques, accélérer son chargement dans le monde entier et gérer son DNS sont des problèmes réseau, pas des problèmes de génération de contenu. L'IA chez Cloudflare ajoute des capacités (bloquer les bots IA qui scrapent ton contenu, par exemple), elle ne change pas le besoin de base. Verdict : l'IA augmente la protection, l'infrastructure réseau reste indispensable telle qu'elle est.",
    replaceEn: "Replace Cloudflare with an AI? No: protecting a site from attacks, speeding up loading worldwide, and managing DNS are network problems, not content generation problems. AI at Cloudflare adds capabilities (blocking AI bots that scrape your content, for instance), it doesn't change the underlying need. Verdict: AI augments protection, the network infrastructure remains essential as is.",
    aiTools: [],
  },
  sentry: {
    stance: "augmente",
    augmentFr: "Sentry a ajouté Seer, un agent IA qui localise la cause probable d'une erreur et propose un correctif directement dans l'outil — un vrai gain de temps sur le débogage, sans changer ce qu'est Sentry (un système de monitoring d'erreurs).",
    augmentEn: "Sentry added Seer, an AI agent that locates the likely cause of an error and suggests a fix directly in the tool — a real time-saver on debugging, without changing what Sentry is (an error monitoring system).",
    replaceFr: "Remplacer Sentry par une IA ? Non : il faut d'abord capturer l'erreur en production (stack trace, contexte, fréquence) avant qu'une IA puisse l'analyser. Sentry reste l'infrastructure de capture ; l'IA accélère ensuite le diagnostic. Verdict : l'IA augmente la vitesse de résolution des bugs, elle ne remplace pas le monitoring lui-même.",
    replaceEn: "Replace Sentry with an AI? No: you first need to capture the error in production (stack trace, context, frequency) before an AI can analyze it. Sentry remains the capture infrastructure; AI then speeds up diagnosis. Verdict: AI augments bug-resolution speed, it doesn't replace the monitoring itself.",
    aiTools: [],
  },
};

let updated = 0;
for (const [slug, angle] of Object.entries(ANGLES)) {
  if (!present.has(slug)) { console.warn(`⚠️  ${slug} not found, skipping`); continue; }
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  tool.seo = Object.assign({}, tool.seo, { aiAngle: angle });
  updated++;
  console.log(`✓ ${tool.name} (${slug}): ${angle.stance}`);
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated}/${Object.keys(ANGLES).length} fiches updated.`);
