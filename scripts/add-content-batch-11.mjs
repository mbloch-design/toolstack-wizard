/** add-content-batch-11.mjs — aiAngle pour Front, HelpScout, Crisp,
 * Tidio, OVHcloud + contenu complet pour Railway, Fly.io, PlanetScale. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  front: {
    stance: "augmente",
    augmentFr: "Front a ajouté des suggestions de réponse et un résumé de conversation par IA, mais reste avant tout une boîte de réception partagée pour coordonner une équipe support ou commerciale sur les mêmes emails.",
    augmentEn: "Front added AI reply suggestions and conversation summaries, but remains primarily a shared inbox to coordinate a support or sales team on the same emails.",
    replaceFr: "Remplacer Front par une IA ? Non : coordonner une équipe sur une boîte mail partagée (assignation, statuts, historique) reste un besoin organisationnel que l'IA assiste sans remplacer. Verdict : l'IA augmente la rédaction de réponses, la coordination d'équipe reste le produit.",
    replaceEn: "Replace Front with an AI? No: coordinating a team on a shared inbox (assignment, statuses, history) remains an organizational need AI assists without replacing. Verdict: AI augments reply drafting, team coordination remains the product.",
    aiTools: [],
  },
  helpscout: {
    stance: "augmente",
    augmentFr: "Help Scout a ajouté l'IA pour résumer des tickets et suggérer des réponses dans sa base de connaissances, mais reste un outil de support client structuré (tickets, SLA, base de connaissances) que l'IA assiste.",
    augmentEn: "Help Scout added AI to summarize tickets and suggest replies from its knowledge base, but remains a structured customer support tool (tickets, SLAs, knowledge base) that AI assists.",
    replaceFr: "Remplacer Help Scout par une IA ? Non : suivre des tickets de support avec des SLA et un historique client reste un besoin organisationnel. L'IA accélère la rédaction de réponses, elle ne remplace pas le suivi structuré. Verdict : l'IA augmente la productivité support, le suivi reste le produit.",
    replaceEn: "Replace Help Scout with an AI? No: tracking support tickets with SLAs and customer history remains an organizational need. AI speeds up reply drafting, it doesn't replace structured tracking. Verdict: AI augments support productivity, tracking remains the product.",
    aiTools: [],
  },
  crisp: {
    stance: "augmente",
    augmentFr: "Crisp a son propre chatbot IA (MagicReply) pour répondre automatiquement aux questions fréquentes via le chat, mais reste l'infrastructure de chat en direct et de gestion de conversation client.",
    augmentEn: "Crisp has its own AI chatbot (MagicReply) to automatically answer frequent questions via chat, but remains the live chat and customer conversation management infrastructure.",
    replaceFr: "Remplacer Crisp par une IA ? Partiellement : pour les questions fréquentes, le chatbot IA intégré gère déjà une bonne partie du volume. Pour les cas complexes ou sensibles, un humain reste nécessaire derrière l'outil. Verdict : l'IA augmente le premier niveau de support, Crisp reste l'infrastructure de conversation.",
    replaceEn: "Replace Crisp with an AI? Partially: for frequent questions, the built-in AI chatbot already handles a good share of volume. For complex or sensitive cases, a human is still needed behind the tool. Verdict: AI augments first-level support, Crisp remains the conversation infrastructure.",
    aiTools: [],
  },
  tidio: {
    stance: "augmente",
    augmentFr: "Tidio a son propre agent IA (Lyro) pour répondre automatiquement aux questions clients via chat, positionnant l'outil comme une solution de support hybride humain + IA plutôt qu'un simple widget de chat.",
    augmentEn: "Tidio has its own AI agent (Lyro) to automatically answer customer questions via chat, positioning the tool as a hybrid human + AI support solution rather than a simple chat widget.",
    replaceFr: "Remplacer Tidio par une IA ? La question s'inverse en partie : Tidio intègre déjà un agent IA pour le premier niveau de support. Pour les questions complexes, un humain reste dans la boucle. Verdict : l'IA est devenue partie intégrante du produit, pas un simple ajout.",
    replaceEn: "Replace Tidio with an AI? The question partly flips: Tidio already integrates an AI agent for first-level support. For complex questions, a human stays in the loop. Verdict: AI has become an integral part of the product, not just an add-on.",
    aiTools: [],
  },
  ovh: {
    stance: "augmente",
    augmentFr: "OVHcloud a ajouté des services IA managés (AI Endpoints, AI Deploy) pour héberger des modèles, mais reste avant tout un hébergeur cloud européen — un besoin d'infrastructure et de souveraineté des données, pas de génération.",
    augmentEn: "OVHcloud added managed AI services (AI Endpoints, AI Deploy) to host models, but remains primarily a European cloud host — an infrastructure and data sovereignty need, not a generation one.",
    replaceFr: "Remplacer OVHcloud par une IA ? Non : héberger des serveurs, sites ou bases de données en Europe avec une garantie de souveraineté des données reste un besoin d'infrastructure réglementé. L'IA s'ajoute en service complémentaire (hébergement de modèles). Verdict : l'IA augmente l'offre, l'hébergement souverain reste le produit principal.",
    replaceEn: "Replace OVHcloud with an AI? No: hosting servers, sites, or databases in Europe with a data sovereignty guarantee remains a regulated infrastructure need. AI is added as a complementary service (model hosting). Verdict: AI augments the offering, sovereign hosting remains the main product.",
    aiTools: [],
  },
};

const CONTENT = {
  railway: {
    shortDescription: "Plateforme de déploiement (PaaS) moderne, simple à utiliser pour héberger une app ou une base de données.",
    shortDescriptionEn: "Modern deployment platform (PaaS), simple to use for hosting an app or database.",
    longDescription: "Railway est une plateforme de déploiement nouvelle génération qui simplifie l'hébergement d'applications et de bases de données : connecte ton repo GitHub, et Railway détecte et déploie automatiquement ton projet, avec une tarification à l'usage plus transparente que Heroku.\n\nPour un développeur indépendant ou une petite startup, c'est souvent l'alternative moderne préférée à Heroku : interface plus claire, déploiement plus rapide, et un free tier généreux pour tester un projet.",
    longDescriptionEn: "Railway is a next-generation deployment platform that simplifies hosting apps and databases: connect your GitHub repo, and Railway automatically detects and deploys your project, with more transparent usage-based pricing than Heroku.\n\nFor an independent developer or small startup, it's often the preferred modern alternative to Heroku: clearer interface, faster deployment, and a generous free tier to test a project.",
    pricing: "Free tier limité (crédit de 5$/mois) ; plan Hobby à 5$/mois, facturation à l'usage au-delà.",
    pricingEn: "Limited free tier ($5/month credit); Hobby plan at $5/month, usage-based billing beyond that.",
    pros: ["Déploiement automatique depuis GitHub, configuration quasi nulle", "Interface moderne et claire, plus agréable que Heroku", "Bases de données managées incluses (PostgreSQL, MySQL, Redis)"],
    prosEn: ["Automatic deployment from GitHub, almost zero configuration", "Modern, clear interface, more pleasant than Heroku", "Managed databases included (PostgreSQL, MySQL, Redis)"],
    cons: ["Moins mature et établi qu'AWS ou Heroku pour des besoins d'entreprise", "Facturation à l'usage qui peut surprendre si le trafic explose", "Moins de régions disponibles que les gros clouds"],
    consEn: ["Less mature and established than AWS or Heroku for enterprise needs", "Usage-based billing that can surprise if traffic spikes", "Fewer available regions than the big clouds"],
    useCases: ["Déployer rapidement une app ou une API depuis un repo GitHub", "Héberger une base de données managée sans configuration complexe", "Remplacer Heroku pour une interface plus moderne et une tarification plus claire"],
    useCasesEn: ["Quickly deploy an app or API from a GitHub repo", "Host a managed database with no complex configuration", "Replace Heroku for a more modern interface and clearer pricing"],
    verdict: {
      keepIf: ["Tu veux déployer rapidement sans configuration complexe", "Tu préfères une interface moderne à Heroku ou AWS"],
      avoidIf: ["Tu as des besoins d'entreprise nécessitant une infrastructure plus mature", "Ton trafic est imprévisible et tu veux un coût fixe garanti"],
      threshold: "Excellent choix pour un projet indépendant ou une startup ; pour de l'entreprise, AWS reste plus mature.",
    },
    verdictEn: {
      keepIf: ["You want to deploy quickly with no complex configuration", "You prefer a modern interface to Heroku or AWS"],
      avoidIf: ["You have enterprise needs requiring more mature infrastructure", "Your traffic is unpredictable and you want a guaranteed fixed cost"],
      threshold: "Excellent choice for an independent project or startup; for enterprise, AWS remains more mature.",
    },
  },
  "fly-io": {
    shortDescription: "Déploiement d'applications conteneurisées au plus proche des utilisateurs, dans le monde entier.",
    shortDescriptionEn: "Deploy containerized applications close to users, worldwide.",
    longDescription: "Fly.io permet de déployer des applications conteneurisées (Docker) sur un réseau mondial de serveurs, en plaçant l'app au plus proche géographiquement de chaque utilisateur pour réduire la latence — une approche différente d'un cloud centralisé classique.\n\nC'est particulièrement pertinent pour une app avec des utilisateurs répartis dans plusieurs pays, où la latence réseau impacte directement l'expérience (apps temps réel, API à faible latence).",
    longDescriptionEn: "Fly.io lets you deploy containerized (Docker) applications on a global network of servers, placing the app geographically closest to each user to reduce latency — a different approach from a classic centralized cloud.\n\nIt's particularly relevant for an app with users spread across multiple countries, where network latency directly impacts experience (real-time apps, low-latency APIs).",
    pricing: "Free tier limité ; facturation à l'usage des ressources (CPU, RAM, bande passante) au-delà.",
    pricingEn: "Limited free tier; usage-based billing for resources (CPU, RAM, bandwidth) beyond that.",
    pros: ["Déploiement multi-régions natif pour réduire la latence mondiale", "Bon support des conteneurs Docker pour des stacks techniques variées", "Tarification à l'usage qui peut être très économique pour de petits projets"],
    prosEn: ["Native multi-region deployment to reduce global latency", "Good Docker container support for varied tech stacks", "Usage-based pricing that can be very economical for small projects"],
    cons: ["Demande des connaissances Docker, moins accessible qu'un PaaS simplifié", "Documentation parfois moins claire que des concurrents plus établis", "Facturation à l'usage qui demande une surveillance active"],
    consEn: ["Requires Docker knowledge, less accessible than a simplified PaaS", "Documentation sometimes less clear than more established competitors", "Usage-based billing requires active monitoring"],
    useCases: ["Déployer une app avec des utilisateurs répartis mondialement pour minimiser la latence", "Héberger une API ou un service temps réel sensible à la latence réseau", "Containeriser une stack technique spécifique sans dépendre d'un PaaS limité"],
    useCasesEn: ["Deploy an app with globally distributed users to minimize latency", "Host a real-time API or service sensitive to network latency", "Containerize a specific tech stack without depending on a limited PaaS"],
    verdict: {
      keepIf: ["Tes utilisateurs sont répartis dans plusieurs pays et la latence compte", "Tu es à l'aise avec Docker et veux du contrôle sur le déploiement"],
      avoidIf: ["Tu veux la simplicité maximale sans toucher à Docker — Heroku ou Railway sont plus simples", "Ton app a des utilisateurs concentrés dans une seule région"],
      threshold: "Pertinent dès que la latence géographique impacte réellement l'expérience utilisateur.",
    },
    verdictEn: {
      keepIf: ["Your users are spread across multiple countries and latency matters", "You're comfortable with Docker and want deployment control"],
      avoidIf: ["You want maximum simplicity without touching Docker — Heroku or Railway are simpler", "Your app has users concentrated in a single region"],
      threshold: "Worth it once geographic latency genuinely impacts user experience.",
    },
  },
  planetscale: {
    shortDescription: "Base de données MySQL serverless avec branching de schéma, pensée pour les équipes de développement.",
    shortDescriptionEn: "Serverless MySQL database with schema branching, designed for development teams.",
    longDescription: "PlanetScale propose une base de données MySQL serverless qui scale automatiquement, avec une fonctionnalité distinctive : le branching de schéma, qui permet de tester des changements de structure de base de données comme on teste du code (branches, merge, rollback) sans bloquer la production.\n\nPour un développeur indépendant ou une petite équipe, c'est un moyen d'éviter les migrations de base de données risquées en production, au prix d'un apprentissage du modèle de branching spécifique à l'outil.",
    longDescriptionEn: "PlanetScale offers a serverless MySQL database that scales automatically, with a distinctive feature: schema branching, which lets you test database structure changes like you test code (branches, merge, rollback) without blocking production.\n\nFor an independent developer or small team, it's a way to avoid risky production database migrations, at the cost of learning the tool's specific branching model.",
    pricing: "Free tier disponible (limité en stockage) ; plans payants à partir de ~39$/mois selon l'usage.",
    pricingEn: "Free tier available (limited storage); paid plans from ~$39/month depending on usage.",
    pros: ["Branching de schéma unique pour tester des changements de base sans risque", "Scalabilité automatique sans gestion serveur", "Compatible MySQL, migration relativement simple depuis une base existante"],
    prosEn: ["Unique schema branching to test database changes risk-free", "Automatic scalability with no server management", "MySQL-compatible, relatively simple migration from an existing database"],
    cons: ["Modèle de branching qui demande un temps d'apprentissage spécifique", "Plus cher que gérer sa propre base MySQL sur un serveur classique", "Pas de support des clés étrangères natives, contrainte à connaître"],
    consEn: ["Branching model requires a specific learning curve", "More expensive than managing your own MySQL on a classic server", "No native foreign key support, a constraint to be aware of"],
    useCases: ["Tester des changements de schéma de base de données sans risque en production", "Scaler une base MySQL automatiquement sans gérer de serveur", "Collaborer en équipe sur l'évolution d'un schéma de base de données"],
    useCasesEn: ["Test database schema changes risk-free in production", "Automatically scale a MySQL database with no server management", "Collaborate as a team on evolving a database schema"],
    verdict: {
      keepIf: ["Tu veux éviter les migrations de base de données risquées en production", "Tu es déjà sur MySQL et veux la scalabilité sans gérer de serveur"],
      avoidIf: ["Tu as besoin de clés étrangères natives — c'est une vraie limite de l'outil", "Gérer ta propre base MySQL suffit et coûte moins cher pour ton volume"],
      threshold: "Pertinent dès que les migrations de schéma deviennent un risque réel pour ton équipe.",
    },
    verdictEn: {
      keepIf: ["You want to avoid risky production database migrations", "You're already on MySQL and want scalability with no server management"],
      avoidIf: ["You need native foreign keys — that's a real limitation of the tool", "Managing your own MySQL is enough and cheaper for your volume"],
      threshold: "Worth it once schema migrations become a real risk for your team.",
    },
  },
};

let updated = 0;
for (const [slug, fields] of Object.entries(CONTENT)) {
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  if (!tool) { console.warn(`⚠️  ${slug} not found`); continue; }
  for (const [key, value] of Object.entries(fields)) tool[key] = value;
  if (fields.longDescription) tool.description = fields.longDescription;
  updated++;
  console.log(`✓ ${tool.name} (${slug}) contenu complet`);
}
for (const [slug, angle] of Object.entries(ANGLES)) {
  if (!present.has(slug)) { console.warn(`⚠️  ${slug} not found, skipping`); continue; }
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  tool.seo = Object.assign({}, tool.seo, { aiAngle: angle });
  updated++;
  console.log(`✓ ${tool.name} (${slug}): aiAngle ${angle.stance}`);
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated} fiches mises à jour.`);
