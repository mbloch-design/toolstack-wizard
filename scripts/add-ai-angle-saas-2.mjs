/** add-ai-angle-saas-2.mjs — aiAngle sur design (Figma), productivité/comm (Calendly,
 * Typeform, Buffer, Hootsuite, Slack, Zoom, Miro), analytics (Hotjar, Mixpanel,
 * Google Analytics), CRM (Salesforce), no-code design (Framer), finance (Stripe, QuickBooks). */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const A = {
  "figma": {
    stance: "augmente",
    augmentFr: "Figma a ajouté Figma AI pour générer des variantes de design, traduire des maquettes et créer des images directement dans le canvas, et a lancé Figma Weave pour la génération multi-modèles. Pour aller plus loin sur la génération de code depuis un design, des outils comme bolt.new ou Lovable transforment une maquette en application fonctionnelle.",
    augmentEn: "Figma added Figma AI to generate design variants, translate mockups and create images right in the canvas, and launched Figma Weave for multi-model generation. To go further on code generation from a design, tools like bolt.new or Lovable turn a mockup into a working application.",
    replaceFr: "Remplacer Figma par une IA ? Non : la collaboration en temps réel, les composants et les design systems restent un besoin structurel que l'IA générative ne couvre pas. Les constructeurs IA (Lovable, bolt.new) génèrent une interface fonctionnelle directement depuis un prompt, ce qui challenge l'étape de maquettage pour des projets simples, mais pas le travail de design produit structuré. Verdict : l'IA augmente Figma et grignote le maquettage le plus simple.",
    replaceEn: "Replace Figma with an AI? No: real-time collaboration, components and design systems remain a structural need generative AI doesn't cover. AI builders (Lovable, bolt.new) generate a working interface straight from a prompt, which challenges the mockup step for simple projects, but not structured product design work. Verdict: AI augments Figma and nibbles at the simplest mockup work.",
    aiTools: ["lovable", "bolt-new"],
  },
  "calendly": {
    stance: "augmente",
    augmentFr: "Calendly a ajouté des suggestions IA pour optimiser les créneaux proposés et router automatiquement les rendez-vous selon des règles. C'est un assistant en périphérie d'un outil dont la valeur est la synchronisation de calendrier.",
    augmentEn: "Calendly added AI suggestions to optimize proposed time slots and automatically route meetings based on rules. It's an assistant on the edge of a tool whose value is calendar sync.",
    replaceFr: "Remplacer Calendly par une IA ? Non : synchroniser plusieurs calendriers et gérer les fuseaux horaires de façon fiable reste un problème technique, pas un problème de génération de texte. Verdict : l'IA optimise les règles, la synchronisation reste le produit.",
    replaceEn: "Replace Calendly with an AI? No: reliably syncing multiple calendars and handling time zones remains a technical problem, not a text-generation one. Verdict: AI optimizes the rules, sync remains the product.",
    aiTools: [],
  },
  "typeform": {
    stance: "augmente",
    augmentFr: "Typeform a ajouté la génération de formulaires par IA à partir d'un prompt, et un résumé automatique des réponses collectées.",
    augmentEn: "Typeform added AI form generation from a prompt, and automatic summarization of collected responses.",
    replaceFr: "Remplacer Typeform par une IA ? Non : collecter des réponses structurées avec une belle expérience utilisateur reste un besoin de formulaire, pas de conversation libre. Un chatbot IA peut remplacer un formulaire simple dans certains cas, mais perd la structure de données propre. Verdict : l'IA aide à créer le formulaire plus vite, elle ne le remplace pas pour de la collecte structurée.",
    replaceEn: "Replace Typeform with an AI? No: collecting structured responses with a nice user experience remains a form need, not free conversation. An AI chatbot can replace a simple form in some cases, but loses the clean data structure. Verdict: AI helps create the form faster, it doesn't replace it for structured data collection.",
    aiTools: ["chatgpt"],
  },
  "buffer": {
    stance: "augmente",
    augmentFr: "Buffer a ajouté un assistant IA pour rédiger des posts et suggérer des idées de contenu à partir d'un thème.",
    augmentEn: "Buffer added an AI assistant to write posts and suggest content ideas from a theme.",
    replaceFr: "Remplacer Buffer par une IA ? Non : planifier et publier sur plusieurs réseaux sociaux reste un besoin d'outillage, pas de rédaction seule. Verdict : l'IA écrit le post, Buffer le programme et le publie.",
    replaceEn: "Replace Buffer with an AI? No: scheduling and publishing across multiple social networks remains a tooling need, not just writing. Verdict: AI writes the post, Buffer schedules and publishes it.",
    aiTools: ["chatgpt"],
  },
  "hootsuite": {
    stance: "augmente",
    augmentFr: "Hootsuite a ajouté OwlyWriter AI pour générer des légendes et repérer les meilleurs moments de publication, en plus de son analyse de tendances.",
    augmentEn: "Hootsuite added OwlyWriter AI to generate captions and spot the best posting times, alongside its trend analysis.",
    replaceFr: "Remplacer Hootsuite par une IA ? Non : gérer plusieurs comptes sociaux d'une équipe avec des workflows d'approbation reste un besoin d'outillage que l'IA ne remplace pas. Verdict : l'IA accélère la rédaction, Hootsuite reste la plateforme de gestion.",
    replaceEn: "Replace Hootsuite with an AI? No: managing multiple team social accounts with approval workflows remains a tooling need AI doesn't replace. Verdict: AI speeds up writing, Hootsuite remains the management platform.",
    aiTools: ["chatgpt"],
  },
  "hotjar": {
    stance: "augmente",
    augmentFr: "Hotjar a ajouté des résumés IA de sessions enregistrées et de feedback utilisateur, pour repérer plus vite les points de friction sans regarder chaque vidéo une par une.",
    augmentEn: "Hotjar added AI summaries of recorded sessions and user feedback, to spot friction points faster without watching every video one by one.",
    replaceFr: "Remplacer Hotjar par une IA ? Non : enregistrer de vrais comportements utilisateurs (heatmaps, sessions) reste un besoin de collecte de données réelles, pas de génération. Verdict : l'IA résume les données, Hotjar les collecte.",
    replaceEn: "Replace Hotjar with an AI? No: recording real user behavior (heatmaps, sessions) remains a real-data collection need, not generation. Verdict: AI summarizes the data, Hotjar collects it.",
    aiTools: ["chatgpt"],
  },
  "mixpanel": {
    stance: "augmente",
    augmentFr: "Mixpanel a ajouté un assistant IA pour interroger les données produit en langage naturel et générer des rapports sans écrire de requête.",
    augmentEn: "Mixpanel added an AI assistant to query product data in natural language and generate reports without writing a query.",
    replaceFr: "Remplacer Mixpanel par une IA ? Non : suivre des événements produit précis et construire des entonnoirs d'analyse reste un besoin d'instrumentation que l'IA ne remplace pas. Verdict : l'IA rend l'analyse accessible sans SQL, elle ne remplace pas la collecte d'événements.",
    replaceEn: "Replace Mixpanel with an AI? No: tracking precise product events and building analysis funnels remains an instrumentation need AI doesn't replace. Verdict: AI makes analysis accessible without SQL, it doesn't replace event collection.",
    aiTools: ["chatgpt"],
  },
  "google-analytics": {
    stance: "augmente",
    augmentFr: "Google Analytics 4 a ajouté des insights générés automatiquement (anomalies de trafic, prédictions d'achat) et un chat pour interroger les données en langage naturel via Gemini.",
    augmentEn: "Google Analytics 4 added automatically generated insights (traffic anomalies, purchase predictions) and a chat to query data in natural language via Gemini.",
    replaceFr: "Remplacer Google Analytics par une IA ? Non, et c'est gratuit : c'est l'infrastructure de mesure de référence du web, ce qu'aucune IA ne reproduit indépendamment. Verdict : l'IA aide à lire les données, GA4 reste la source.",
    replaceEn: "Replace Google Analytics with an AI? No, and it's free: it's the reference web measurement infrastructure, which no AI reproduces independently. Verdict: AI helps read the data, GA4 remains the source.",
    aiTools: ["gemini"],
  },
  "salesforce": {
    stance: "augmente",
    augmentFr: "Salesforce a investi massivement dans Agentforce, ses agents IA capables de qualifier des leads, répondre au support et automatiser des tâches CRM en autonomie.",
    augmentEn: "Salesforce invested heavily in Agentforce, its AI agents able to qualify leads, handle support and automate CRM tasks autonomously.",
    replaceFr: "Remplacer Salesforce par une IA ? Non, pas la plateforme : c'est le CRM le plus profondément intégré aux processus d'entreprise, ce qu'une IA seule ne reproduit pas. Mais une part croissante des tâches manuelles (qualification, suivi) bascule vers les agents IA, ce qui redéfinit le rôle des équipes commerciales plus que l'outil lui-même. Verdict : l'IA transforme le travail dans Salesforce, pas la plateforme.",
    replaceEn: "Replace Salesforce with an AI? Not the platform: it's the CRM most deeply integrated into enterprise processes, which no standalone AI reproduces. But a growing share of manual tasks (qualification, follow-up) shifts to AI agents, redefining sales teams' role more than the tool itself. Verdict: AI transforms the work inside Salesforce, not the platform.",
    aiTools: ["chatgpt", "claude"],
  },
  "slack": {
    stance: "augmente",
    augmentFr: "Slack a ajouté Slack AI pour résumer des fils de discussion, répondre à des questions sur l'historique d'un canal et rédiger des récapitulatifs de réunion.",
    augmentEn: "Slack added Slack AI to summarize threads, answer questions about a channel's history and draft meeting recaps.",
    replaceFr: "Remplacer Slack par une IA ? Non : la messagerie d'équipe en temps réel et l'intégration à des dizaines d'outils restent un besoin de communication structurel. Verdict : l'IA résume ce qui se passe dans Slack, elle ne remplace pas la messagerie.",
    replaceEn: "Replace Slack with an AI? No: real-time team messaging and integration with dozens of tools remain a structural communication need. Verdict: AI summarizes what happens in Slack, it doesn't replace messaging.",
    aiTools: ["chatgpt"],
  },
  "zoom": {
    stance: "augmente",
    augmentFr: "Zoom a ajouté Zoom AI Companion pour résumer des réunions, générer des comptes-rendus et répondre à des questions sur ce qui a été dit, gratuitement sur la plupart des forfaits.",
    augmentEn: "Zoom added Zoom AI Companion to summarize meetings, generate recaps and answer questions about what was said, free on most plans.",
    replaceFr: "Remplacer Zoom par une IA ? Non : la visioconférence elle-même (qualité vidéo, stabilité, fonctionnalités webinaire) reste un besoin d'infrastructure que l'IA n'élimine pas. Verdict : l'IA résume la réunion, elle ne remplace pas le besoin de se voir en visio.",
    replaceEn: "Replace Zoom with an AI? No: video conferencing itself (video quality, stability, webinar features) remains an infrastructure need AI doesn't eliminate. Verdict: AI summarizes the meeting, it doesn't replace the need for video calls.",
    aiTools: ["chatgpt"],
  },
  "miro": {
    stance: "augmente",
    augmentFr: "Miro a ajouté Miro AI pour générer des diagrammes, regrouper des post-its en thèmes et résumer un board entier en quelques secondes.",
    augmentEn: "Miro added Miro AI to generate diagrams, cluster sticky notes into themes and summarize an entire board in seconds.",
    replaceFr: "Remplacer Miro par une IA ? Non : le brainstorming visuel collaboratif en temps réel avec une équipe reste une expérience que l'IA seule ne remplace pas. Verdict : l'IA organise le contenu du board, elle ne remplace pas l'espace de collaboration.",
    replaceEn: "Replace Miro with an AI? No: real-time collaborative visual brainstorming with a team remains an experience standalone AI doesn't replace. Verdict: AI organizes the board's content, it doesn't replace the collaboration space.",
    aiTools: ["chatgpt"],
  },
  "framer": {
    stance: "challenge",
    augmentFr: "Framer a ajouté un assistant IA pour générer une mise en page ou réécrire du texte directement dans l'éditeur, et propose déjà un site complet généré depuis un prompt.",
    augmentEn: "Framer added an AI assistant to generate a layout or rewrite text directly in the editor, and already offers a complete site generated from a prompt.",
    replaceFr: "Remplacer Framer par une IA ? Pour un site marketing simple, des constructeurs IA généralistes (Lovable, bolt.new) couvrent désormais le même besoin, ce qui challenge directement le positionnement de Framer. Pour un design très soigné avec des animations fines, l'éditeur visuel de Framer garde l'avantage. Verdict : challengé sur le site simple généré par prompt, solide sur le design visuel poussé.",
    replaceEn: "Replace Framer with an AI? For a simple marketing site, general AI builders (Lovable, bolt.new) now cover the same need, directly challenging Framer's positioning. For a highly polished design with fine animations, Framer's visual editor keeps the edge. Verdict: challenged on the simple prompt-generated site, solid on advanced visual design.",
    aiTools: ["lovable", "bolt-new"],
  },
  "stripe": {
    stance: "augmente",
    augmentFr: "Stripe a ajouté de la détection de fraude par IA (Radar) et des agents capables d'intégrer des paiements dans des applications générées par IA via son API.",
    augmentEn: "Stripe added AI fraud detection (Radar) and agents able to integrate payments into AI-generated applications via its API.",
    replaceFr: "Remplacer Stripe par une IA ? Non, aucun rapport : c'est une infrastructure de paiement, pas un produit de contenu. Les constructeurs IA (Lovable, bolt.new) intègrent d'ailleurs Stripe par défaut pour monétiser une app générée. Verdict : l'essor des apps IA renforce la demande pour Stripe.",
    replaceEn: "Replace Stripe with an AI? No, unrelated: it's payment infrastructure, not a content product. AI builders (Lovable, bolt.new) actually integrate Stripe by default to monetize a generated app. Verdict: the rise of AI apps strengthens demand for Stripe.",
    aiTools: ["lovable", "bolt-new"],
  },
  "quickbooks": {
    stance: "augmente",
    augmentFr: "QuickBooks a ajouté de la catégorisation automatique des dépenses par IA et des prévisions de trésorerie basées sur l'historique.",
    augmentEn: "QuickBooks added AI-powered automatic expense categorization and cash-flow forecasting based on history.",
    replaceFr: "Remplacer QuickBooks par une IA ? Non : la comptabilité a des obligations légales et fiscales précises qu'une IA généraliste ne gère pas de façon fiable. Verdict : l'IA catégorise plus vite, la conformité comptable reste le vrai produit.",
    replaceEn: "Replace QuickBooks with an AI? No: accounting has precise legal and tax obligations a general AI doesn't handle reliably. Verdict: AI categorizes faster, accounting compliance remains the real product.",
    aiTools: ["chatgpt"],
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
console.log(`aiAngle (SaaS lot 2) sur ${n} fiches | JSON OK`);
