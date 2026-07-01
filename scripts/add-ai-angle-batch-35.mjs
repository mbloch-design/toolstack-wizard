/** add-ai-angle-batch-35.mjs — aiAngle pour Balsamiq, Visily, CallRail,
 * UptimeRobot, Grafana, Segment, Jupyter, WebPageTest. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  balsamiq: {
    stance: "challenge",
    augmentFr: "Balsamiq reste un outil de wireframing manuel au style délibérément esquissé (low-fidelity), une approche désormais challengée par des générateurs IA capables de produire des wireframes voire des maquettes haute-fidélité en quelques secondes.",
    augmentEn: "Balsamiq remains a manual wireframing tool with a deliberately sketchy (low-fidelity) style, an approach now challenged by AI generators able to produce wireframes or even high-fidelity mockups in seconds.",
    replaceFr: "Remplacer Balsamiq par une IA ? Pour un premier jet rapide de structure d'écran, des outils comme Visily ou v0 vont plus vite. Balsamiq garde l'avantage du style volontairement low-fidelity qui évite de figer des détails visuels trop tôt. Verdict : challengé sur la vitesse de génération, différencié par sa philosophie low-fidelity intentionnelle.",
    replaceEn: "Replace Balsamiq with an AI? For a fast first draft of screen structure, tools like Visily or v0 move faster. Balsamiq keeps the advantage of its deliberately low-fidelity style that avoids locking in visual details too early. Verdict: challenged on generation speed, differentiated by its intentional low-fidelity philosophy.",
    aiTools: ["v0-vercel"],
  },
  visily: {
    stance: "augmente",
    augmentFr: "Visily génère des wireframes et maquettes à partir d'une description texte, d'une capture d'écran ou d'un croquis, accélérant la phase initiale de design avant le passage à un outil plus poussé comme Figma.",
    augmentEn: "Visily generates wireframes and mockups from a text description, screenshot, or sketch, speeding up the initial design phase before moving to a more advanced tool like Figma.",
    replaceFr: "Visily remplace-t-il un designer UX ? Pour un premier jet rapide de structure d'écran, oui en grande partie. Pour une expérience utilisateur fine et une direction visuelle de marque, l'expertise design reste nécessaire. Verdict : l'IA augmente fortement la vitesse de wireframing, le design final reste un travail humain.",
    replaceEn: "Does Visily replace a UX designer? For a fast first draft of screen structure, largely yes. For fine user experience and brand visual direction, design expertise remains necessary. Verdict: AI strongly augments wireframing speed, final design remains human work.",
    aiTools: [],
  },
  callrail: {
    stance: "augmente",
    augmentFr: "CallRail a ajouté l'IA pour transcrire et résumer les appels entrants, mais reste l'infrastructure de suivi d'appels (quel canal marketing génère quel appel) pour mesurer le ROI publicitaire.",
    augmentEn: "CallRail added AI to transcribe and summarize incoming calls, but remains call tracking infrastructure (which marketing channel generates which call) to measure ad ROI.",
    replaceFr: "Remplacer CallRail par une IA ? Non : attribuer un appel téléphonique réel à une campagne marketing spécifique nécessite un suivi technique réel (numéros dynamiques), pas de la génération. L'IA aide à résumer le contenu de l'appel. Verdict : l'IA augmente l'analyse d'appels, l'attribution marketing reste l'infrastructure clé.",
    replaceEn: "Replace CallRail with an AI? No: attributing a real phone call to a specific marketing campaign requires real technical tracking (dynamic numbers), not generation. AI helps summarize call content. Verdict: AI augments call analysis, marketing attribution remains the key infrastructure.",
    aiTools: [],
  },
  uptimerobot: {
    stance: "augmente",
    augmentFr: "UptimeRobot surveille en continu la disponibilité réelle d'un site et alerte en cas de panne — un besoin de monitoring technique basé sur des données réelles, que l'IA générative ne peut pas remplacer.",
    augmentEn: "UptimeRobot continuously monitors a site's real availability and alerts on downtime — a technical monitoring need based on real data, which generative AI can't replace.",
    replaceFr: "Remplacer UptimeRobot par une IA ? Non : vérifier réellement si un site répond, à intervalles réguliers depuis plusieurs points du monde, nécessite une infrastructure de monitoring réelle, pas de la génération. Verdict : l'IA n'a pas de rôle direct ici, le monitoring réel reste indispensable.",
    replaceEn: "Replace UptimeRobot with an AI? No: actually checking if a site responds, at regular intervals from multiple points worldwide, requires real monitoring infrastructure, not generation. Verdict: AI has no direct role here, real monitoring remains essential.",
    aiTools: [],
  },
  grafana: {
    stance: "augmente",
    augmentFr: "Grafana a ajouté l'IA pour détecter des anomalies dans les métriques et suggérer des causes probables, mais reste l'infrastructure de visualisation de données de monitoring techniques réelles.",
    augmentEn: "Grafana added AI to detect anomalies in metrics and suggest likely causes, but remains the visualization infrastructure for real technical monitoring data.",
    replaceFr: "Remplacer Grafana par une IA ? Non : collecter et visualiser des métriques techniques réelles en temps réel reste un besoin d'infrastructure de monitoring. L'IA aide à détecter des anomalies, elle ne remplace pas la collecte de données. Verdict : l'IA augmente la détection d'anomalies, l'infrastructure de visualisation reste le produit.",
    replaceEn: "Replace Grafana with an AI? No: collecting and visualizing real technical metrics in real time remains a monitoring infrastructure need. AI helps detect anomalies, it doesn't replace data collection. Verdict: AI augments anomaly detection, visualization infrastructure remains the product.",
    aiTools: [],
  },
  segment: {
    stance: "augmente",
    augmentFr: "Segment (Twilio) collecte et unifie les données clients depuis de multiples sources pour les router vers d'autres outils — une infrastructure de données réelle, pas un générateur de contenu.",
    augmentEn: "Segment (Twilio) collects and unifies customer data from multiple sources to route it to other tools — real data infrastructure, not a content generator.",
    replaceFr: "Remplacer Segment par une IA ? Non : collecter et synchroniser des données clients réelles entre des dizaines d'outils (CRM, analytics, marketing) reste un besoin d'infrastructure technique. Verdict : l'IA n'a pas de rôle direct ici, la collecte de données réelles reste l'infrastructure clé.",
    replaceEn: "Replace Segment with an AI? No: collecting and syncing real customer data across dozens of tools (CRM, analytics, marketing) remains a technical infrastructure need. Verdict: AI has no direct role here, real data collection remains the key infrastructure.",
    aiTools: [],
  },
  jupyter: {
    stance: "augmente",
    augmentFr: "Jupyter a intégré des assistants IA (GitHub Copilot, extensions IA) pour générer du code dans les notebooks, mais reste l'environnement de référence pour l'exploration de données interactive en data science.",
    augmentEn: "Jupyter integrated AI assistants (GitHub Copilot, AI extensions) to generate code in notebooks, but remains the reference environment for interactive data exploration in data science.",
    replaceFr: "Remplacer Jupyter par une IA ? Non : explorer des données réelles de façon interactive avec du code exécutable reste un besoin d'environnement technique. L'IA aide à écrire le code plus vite, elle ne remplace pas l'analyse de données elle-même. Verdict : l'IA augmente la vitesse de codage, l'exploration de données reste un travail d'analyste.",
    replaceEn: "Replace Jupyter with an AI? No: interactively exploring real data with executable code remains a technical environment need. AI helps write code faster, it doesn't replace the data analysis itself. Verdict: AI augments coding speed, data exploration remains an analyst's work.",
    aiTools: [],
  },
  webpagetest: {
    stance: "augmente",
    augmentFr: "WebPageTest mesure réellement le temps de chargement d'une page depuis de vrais navigateurs et connexions réseau simulées — une mesure technique réelle que l'IA générative ne peut pas remplacer.",
    augmentEn: "WebPageTest actually measures a page's load time from real browsers and simulated network connections — a real technical measurement generative AI can't replace.",
    replaceFr: "Remplacer WebPageTest par une IA ? Non : mesurer objectivement le temps de chargement réel d'une page sous différentes conditions réseau nécessite des tests réels, pas de la génération. Verdict : l'IA aide à interpréter les résultats, elle ne peut pas inventer la mesure elle-même.",
    replaceEn: "Replace WebPageTest with an AI? No: objectively measuring a page's real load time under different network conditions requires real tests, not generation. Verdict: AI helps interpret results, it can't invent the measurement itself.",
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
