/** add-ai-angle-batch-36.mjs — aiAngle pour Leadpages, Jotform, Dub,
 * Readymag, Google Cloud, Google Play Console, Flutter, WooCommerce. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  leadpages: {
    stance: "challenge",
    augmentFr: "Leadpages a ajouté un générateur IA pour rédiger du texte de landing page, mais affronte désormais des générateurs IA-first comme Framer AI ou Lovable qui créent une page complète depuis un simple prompt.",
    augmentEn: "Leadpages added an AI generator to write landing page text, but now faces AI-first generators like Framer AI or Lovable that create a full page from a simple prompt.",
    replaceFr: "Remplacer Leadpages par une IA ? Pour un premier jet de landing page, les générateurs IA-first vont souvent plus vite. Leadpages garde l'avantage des templates orientés conversion et de l'A/B testing intégré. Verdict : challengé sur la génération initiale, solide sur l'optimisation de conversion.",
    replaceEn: "Replace Leadpages with an AI? For a first landing page draft, AI-first generators often move faster. Leadpages keeps the edge of conversion-oriented templates and built-in A/B testing. Verdict: challenged on initial generation, solid on conversion optimization.",
    aiTools: ["framer", "lovable"],
  },
  jotform: {
    stance: "augmente",
    augmentFr: "Jotform a son assistant IA pour générer des formulaires à partir d'une description, mais reste l'infrastructure de collecte de données structurées (formulaires, paiements, signatures) la plus utilisée du marché.",
    augmentEn: "Jotform has its AI assistant to generate forms from a description, but remains the most-used structured data collection infrastructure (forms, payments, signatures) on the market.",
    replaceFr: "Remplacer Jotform par une IA ? Non : collecter des données structurées de façon fiable (avec validation, paiement intégré) reste un besoin d'infrastructure. L'IA aide à générer le formulaire plus vite, elle ne remplace pas la collecte de données. Verdict : l'IA augmente la création de formulaires, l'infrastructure reste le produit.",
    replaceEn: "Replace Jotform with an AI? No: reliably collecting structured data (with validation, integrated payment) remains an infrastructure need. AI helps generate the form faster, it doesn't replace data collection. Verdict: AI augments form creation, infrastructure remains the product.",
    aiTools: [],
  },
  dub: {
    stance: "augmente",
    augmentFr: "Dub est un raccourcisseur de liens open source pensé pour les développeurs, avec quelques suggestions IA pour les slugs de liens, mais reste avant tout une infrastructure de redirection et d'analytics de liens.",
    augmentEn: "Dub is an open-source link shortener built for developers, with some AI suggestions for link slugs, but remains primarily redirection and link analytics infrastructure.",
    replaceFr: "Remplacer Dub par une IA ? Non : raccourcir et suivre des liens de façon fiable avec des redirections rapides reste un besoin d'infrastructure technique. Verdict : l'IA n'a pas de rôle central ici, l'infrastructure de redirection reste le produit.",
    replaceEn: "Replace Dub with an AI? No: reliably shortening and tracking links with fast redirects remains a technical infrastructure need. Verdict: AI has no central role here, redirection infrastructure remains the product.",
    aiTools: [],
  },
  readymag: {
    stance: "challenge",
    augmentFr: "Readymag reste un constructeur de sites au design très soigné pour portfolios et magazines en ligne, sans génération IA native — une approche désormais challengée par des générateurs IA-first plus rapides.",
    augmentEn: "Readymag remains a website builder with very polished design for portfolios and online magazines, with no native AI generation — an approach now challenged by faster AI-first generators.",
    replaceFr: "Remplacer Readymag par une IA ? Pour un résultat visuel sophistiqué et personnalisé (magazine, portfolio créatif), Readymag garde l'avantage du contrôle manuel fin. Les générateurs IA vont plus vite mais avec moins de raffinement visuel sur-mesure. Verdict : challengé sur la rapidité, différencié par le raffinement visuel manuel.",
    replaceEn: "Replace Readymag with an AI? For a sophisticated, custom visual result (magazine, creative portfolio), Readymag keeps the edge of fine manual control. AI generators move faster but with less custom visual refinement. Verdict: challenged on speed, differentiated by manual visual refinement.",
    aiTools: [],
  },
  gcp: {
    stance: "augmente",
    augmentFr: "Google Cloud héberge directement les modèles Gemini (via Vertex AI) en plus de son offre cloud classique, mais reste une infrastructure de calcul, stockage et réseau — un besoin technique, pas un générateur en soi.",
    augmentEn: "Google Cloud directly hosts Gemini models (via Vertex AI) alongside its classic cloud offering, but remains compute, storage, and network infrastructure — a technical need, not a generator itself.",
    replaceFr: "Remplacer Google Cloud par une IA ? Non : héberger des applications et données d'entreprise reste un besoin d'infrastructure réglementée. Google Cloud héberge même les modèles IA plutôt que d'être remplacé par eux. Verdict : l'IA s'ajoute en service complémentaire, l'infrastructure reste le produit.",
    replaceEn: "Replace Google Cloud with an AI? No: hosting enterprise applications and data remains a regulated infrastructure need. Google Cloud even hosts AI models rather than being replaced by them. Verdict: AI is added as a complementary service, infrastructure remains the product.",
    aiTools: [],
  },
  "google-play-console": {
    stance: "augmente",
    augmentFr: "Google Play Console a ajouté des suggestions IA pour optimiser les fiches d'app (ASO), mais reste l'infrastructure officielle de publication et de gestion des apps Android — un besoin de plateforme, pas de génération.",
    augmentEn: "Google Play Console added AI suggestions to optimize app listings (ASO), but remains the official Android app publishing and management infrastructure — a platform need, not generation.",
    replaceFr: "Remplacer Google Play Console par une IA ? Non : publier et gérer une app sur le store Android (mises à jour, conformité, statistiques) reste un besoin de plateforme officielle incontournable. L'IA aide à optimiser la fiche, elle ne remplace pas la publication elle-même. Verdict : l'IA augmente l'optimisation ASO, la plateforme reste indispensable.",
    replaceEn: "Replace Google Play Console with an AI? No: publishing and managing an app on the Android store (updates, compliance, stats) remains an unavoidable official platform need. AI helps optimize the listing, it doesn't replace publishing itself. Verdict: AI augments ASO optimization, the platform remains essential.",
    aiTools: [],
  },
  flutter: {
    stance: "augmente",
    augmentFr: "Flutter bénéficie de générateurs IA tiers (FlutterFlow, Rork) qui produisent du code Flutter à partir d'un prompt, mais reste le framework de développement mobile cross-platform lui-même, pas un produit IA.",
    augmentEn: "Flutter benefits from third-party AI generators (FlutterFlow, Rork) that produce Flutter code from a prompt, but remains the cross-platform mobile development framework itself, not an AI product.",
    replaceFr: "Remplacer Flutter par une IA ? Non : c'est un framework de code, pas un produit qu'on remplace. Les générateurs IA produisent du code Flutter qui doit ensuite être compilé et déployé via le framework. Verdict : l'IA augmente la vitesse d'écriture de code Flutter, le framework reste l'infrastructure de base.",
    replaceEn: "Replace Flutter with an AI? No: it's a code framework, not a product to replace. AI generators produce Flutter code that still needs to be compiled and deployed via the framework. Verdict: AI augments Flutter coding speed, the framework remains the base infrastructure.",
    aiTools: [],
  },
  woocommerce: {
    stance: "augmente",
    augmentFr: "WooCommerce a accès à des extensions IA tierces (description produit, support client) construites sur l'écosystème WordPress, mais reste le plugin e-commerce lui-même, pas un produit IA.",
    augmentEn: "WooCommerce has access to third-party AI extensions (product descriptions, customer support) built on the WordPress ecosystem, but remains the e-commerce plugin itself, not an AI product.",
    replaceFr: "Remplacer WooCommerce par une IA ? Non : transformer un site WordPress en boutique fonctionnelle (catalogue, paiement, stock) reste un besoin d'infrastructure e-commerce. L'IA aide à rédiger des fiches produit via des extensions, elle ne remplace pas le plugin. Verdict : l'IA augmente la rédaction produit, l'infrastructure e-commerce reste le produit.",
    replaceEn: "Replace WooCommerce with an AI? No: turning a WordPress site into a functional store (catalog, payment, inventory) remains an e-commerce infrastructure need. AI helps write product listings via extensions, it doesn't replace the plugin. Verdict: AI augments product writing, e-commerce infrastructure remains the product.",
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
