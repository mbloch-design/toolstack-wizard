/** add-content-batch-12.mjs — contenu complet pour Upwork (placeholder
 * malgré sa forte notoriété) + aiAngle pour Neon, Strapi, Sanity,
 * Contentful, Directus, Payload CMS. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  neon: {
    stance: "augmente",
    augmentFr: "Neon (rachetée par Databricks) met en avant son intégration avec des workflows IA (branching de base pour tester du code généré par IA), mais reste fondamentalement une base de données PostgreSQL serverless — une infrastructure, pas un générateur.",
    augmentEn: "Neon (acquired by Databricks) highlights its integration with AI workflows (database branching to test AI-generated code), but remains fundamentally a serverless PostgreSQL database — infrastructure, not a generator.",
    replaceFr: "Remplacer Neon par une IA ? Non : stocker des données structurées de façon fiable reste un besoin d'infrastructure. Le branching de base facilite le test de code généré par IA, mais la base elle-même reste indispensable. Verdict : l'IA augmente le workflow de développement, la base de données reste le produit.",
    replaceEn: "Replace Neon with an AI? No: reliably storing structured data remains an infrastructure need. Database branching makes it easier to test AI-generated code, but the database itself remains essential. Verdict: AI augments the development workflow, the database remains the product.",
    aiTools: [],
  },
  strapi: {
    stance: "augmente",
    augmentFr: "Strapi reste un CMS headless open source qui structure du contenu pour l'exposer via API à n'importe quel frontend — un besoin d'infrastructure de contenu, pas de génération de texte.",
    augmentEn: "Strapi remains an open-source headless CMS that structures content to expose via API to any frontend — a content infrastructure need, not text generation.",
    replaceFr: "Remplacer Strapi par une IA ? Non : structurer du contenu pour qu'il soit servi de façon cohérente à un site, une app et potentiellement plusieurs canaux reste un besoin d'architecture. L'IA peut générer le contenu à y mettre, elle ne remplace pas la structure. Verdict : l'IA augmente la création de contenu, le CMS reste l'infrastructure.",
    replaceEn: "Replace Strapi with an AI? No: structuring content to serve it consistently to a site, an app, and potentially multiple channels remains an architecture need. AI can generate the content to put in it, it doesn't replace the structure. Verdict: AI augments content creation, the CMS remains the infrastructure.",
    aiTools: [],
  },
  sanity: {
    stance: "augmente",
    augmentFr: "Sanity a son assistant IA (Sanity AI) pour générer et traduire du contenu directement dans le CMS, mais reste l'infrastructure de contenu structuré qui alimente différents frontends.",
    augmentEn: "Sanity has its AI assistant (Sanity AI) to generate and translate content directly in the CMS, but remains the structured content infrastructure feeding different frontends.",
    replaceFr: "Remplacer Sanity par une IA ? Non : la structuration du contenu en blocs réutilisables sur plusieurs canaux reste un besoin d'architecture. L'IA aide à générer ou traduire le contenu, elle ne remplace pas le CMS headless. Verdict : l'IA augmente la production de contenu, la structure reste le produit.",
    replaceEn: "Replace Sanity with an AI? No: structuring content into reusable blocks across multiple channels remains an architecture need. AI helps generate or translate content, it doesn't replace the headless CMS. Verdict: AI augments content production, the structure remains the product.",
    aiTools: [],
  },
  contentful: {
    stance: "augmente",
    augmentFr: "Contentful a intégré des outils IA pour générer et traduire du contenu dans son CMS d'entreprise, mais reste l'infrastructure de gestion de contenu structuré pour de grandes organisations multi-canal.",
    augmentEn: "Contentful integrated AI tools to generate and translate content in its enterprise CMS, but remains the structured content management infrastructure for large multi-channel organizations.",
    replaceFr: "Remplacer Contentful par une IA ? Non : gérer du contenu structuré à l'échelle d'une grande entreprise (gouvernance, permissions, multi-canal) reste un besoin d'infrastructure que l'IA n'adresse pas seule. Verdict : l'IA augmente la production de contenu, la gouvernance reste le vrai produit.",
    replaceEn: "Replace Contentful with an AI? No: managing structured content at large-enterprise scale (governance, permissions, multi-channel) remains an infrastructure need AI doesn't address alone. Verdict: AI augments content production, governance remains the real product.",
    aiTools: [],
  },
  directus: {
    stance: "augmente",
    augmentFr: "Directus reste un CMS headless open source qui transforme n'importe quelle base de données SQL en API structurée, avec une interface d'administration auto-générée — un besoin d'infrastructure, pas de génération.",
    augmentEn: "Directus remains an open-source headless CMS that turns any SQL database into a structured API, with an auto-generated admin interface — an infrastructure need, not generation.",
    replaceFr: "Remplacer Directus par une IA ? Non : exposer une base de données existante via une API structurée avec une interface d'administration reste un besoin technique d'infrastructure. Verdict : l'IA n'a pas vraiment de rôle direct ici, le besoin reste structurel.",
    replaceEn: "Replace Directus with an AI? No: exposing an existing database via a structured API with an admin interface remains a technical infrastructure need. Verdict: AI doesn't really play a direct role here, the need remains structural.",
    aiTools: [],
  },
  "payload-cms": {
    stance: "augmente",
    augmentFr: "Payload CMS est un CMS headless open source pensé pour les développeurs (configuration en code TypeScript), avec des plugins IA tiers pour générer du contenu, mais reste fondamentalement une infrastructure de contenu structuré.",
    augmentEn: "Payload CMS is an open-source headless CMS built for developers (TypeScript code configuration), with third-party AI plugins to generate content, but remains fundamentally structured content infrastructure.",
    replaceFr: "Remplacer Payload CMS par une IA ? Non : configurer et structurer un modèle de contenu en code reste un besoin de développement, pas de génération. L'IA peut aider à remplir le contenu, pas à définir l'architecture. Verdict : l'IA augmente le remplissage de contenu, l'architecture reste un travail de développeur.",
    replaceEn: "Replace Payload CMS with an AI? No: configuring and structuring a content model in code remains a development need, not generation. AI can help fill in content, not define the architecture. Verdict: AI augments content filling, architecture remains a developer's job.",
    aiTools: [],
  },
};

const CONTENT = {
  upwork: {
    shortDescription: "La plus grande place de marché freelance au monde, pour trouver des missions ou des prestataires.",
    shortDescriptionEn: "The world's largest freelance marketplace, to find projects or service providers.",
    longDescription: "Upwork est la place de marché freelance la plus utilisée au monde, mettant en relation des entreprises avec des freelances sur des missions ponctuelles ou récurrentes, tous domaines confondus (développement, design, rédaction, marketing, support).\n\nPour un freelance qui débute, c'est souvent le moyen le plus rapide de trouver ses premières missions sans réseau préexistant — au prix d'une concurrence internationale forte sur les prix et d'une commission qui réduit la marge nette, surtout sur les petites missions.",
    longDescriptionEn: "Upwork is the most widely used freelance marketplace in the world, connecting businesses with freelancers for one-off or recurring projects across all fields (development, design, writing, marketing, support).\n\nFor a freelancer starting out, it's often the fastest way to land first projects without a pre-existing network — at the cost of strong international price competition and a commission that reduces net margin, especially on small projects.",
    pricing: "Gratuit pour s'inscrire ; commission de 10% sur les revenus facturés (dégressive selon le volume avec un client).",
    pricingEn: "Free to sign up; 10% commission on billed earnings (decreasing with volume per client).",
    defaultMonthlyPrice: 0,
    pros: ["Accès à un volume massif de missions, tous domaines et budgets confondus", "Système de paiement sécurisé (Upwork garantit le paiement sur les contrats horaires suivis)", "Profil et avis clients qui se construisent au fil des missions, utiles pour la crédibilité"],
    prosEn: ["Access to a massive volume of projects, all fields and budgets included", "Secure payment system (Upwork guarantees payment on tracked hourly contracts)", "Profile and client reviews that build up over projects, useful for credibility"],
    cons: ["Concurrence internationale très forte qui tire les prix vers le bas", "Commission de 10% qui réduit la marge nette, surtout sur les petites missions", "Démarrer sans avis clients est difficile, effet \"poule et œuf\""],
    consEn: ["Very strong international competition pulling prices down", "10% commission that reduces net margin, especially on small projects", "Starting with no client reviews is hard, a chicken-and-egg problem"],
    useCases: ["Trouver ses premières missions freelance sans réseau professionnel existant", "Diversifier ses sources de revenus en complément d'une clientèle directe", "Tester une nouvelle compétence ou un nouveau marché avant de se spécialiser"],
    useCasesEn: ["Find first freelance projects with no existing professional network", "Diversify income sources alongside a direct client base", "Test a new skill or market before specializing"],
    verdict: {
      keepIf: ["Tu débutes en freelance et as besoin de premières missions et avis clients", "Tu veux diversifier tes sources de missions en complément du démarchage direct"],
      avoidIf: ["Tu as déjà un réseau ou une clientèle directe suffisante — la commission n'est alors pas justifiée", "Tu vises une clientèle premium peu présente sur ce type de plateforme"],
      threshold: "Utile pour démarrer ou diversifier ; à mesure que ton réseau grandit, le démarchage direct devient plus rentable.",
    },
    verdictEn: {
      keepIf: ["You're starting out as a freelancer and need first projects and client reviews", "You want to diversify your project sources alongside direct outreach"],
      avoidIf: ["You already have a sufficient network or direct client base — the commission isn't justified then", "You're targeting a premium clientele rarely found on this type of platform"],
      threshold: "Useful to start or diversify; as your network grows, direct outreach becomes more cost-effective.",
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
