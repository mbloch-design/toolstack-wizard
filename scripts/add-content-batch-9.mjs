/** add-content-batch-9.mjs — contenu complet pour Yoast, RankMath,
 * Google Search Console, Plausible, TikTok Ads + aiAngle pour
 * Google Tag Manager, Elementor, WP Rocket. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  "google-tag-manager": {
    stance: "augmente",
    augmentFr: "Google Tag Manager reste un outil de gestion de tags techniques (pixels, scripts de tracking) sans rapport direct avec la génération IA — son rôle d'infrastructure de mesure reste inchangé.",
    augmentEn: "Google Tag Manager remains a technical tag management tool (pixels, tracking scripts) with no direct link to AI generation — its role as measurement infrastructure stays unchanged.",
    replaceFr: "Remplacer Google Tag Manager par une IA ? Non : déployer et gérer des balises de tracking sans toucher au code du site reste un besoin technique d'infrastructure, pas une tâche de génération. Verdict : l'IA n'a pas vraiment de rôle ici, l'outil reste un besoin technique stable.",
    replaceEn: "Replace Google Tag Manager with an AI? No: deploying and managing tracking tags without touching the site's code remains a technical infrastructure need, not a generation task. Verdict: AI doesn't really play a role here, the tool remains a stable technical need.",
    aiTools: [],
  },
  elementor: {
    stance: "challenge",
    augmentFr: "Elementor a ajouté un générateur IA pour proposer des mises en page WordPress, mais affronte désormais des générateurs IA-first qui créent un site entier depuis un prompt sans passer par l'éditeur de pages.",
    augmentEn: "Elementor added an AI generator to propose WordPress layouts, but now faces AI-first generators that create an entire site from a prompt without going through a page editor.",
    replaceFr: "Remplacer Elementor par une IA ? Pour un premier jet de page, les générateurs IA-first vont plus vite. Elementor garde l'avantage pour qui est déjà sur WordPress et veut un contrôle visuel fin page par page. Verdict : challengé sur la génération initiale, solide pour l'édition fine sur WordPress.",
    replaceEn: "Replace Elementor with an AI? For a first page draft, AI-first generators move faster. Elementor keeps the edge for anyone already on WordPress who wants fine visual control page by page. Verdict: challenged on initial generation, solid for fine-grained editing on WordPress.",
    aiTools: [],
  },
  "wp-rocket": {
    stance: "augmente",
    augmentFr: "WP Rocket reste un plugin de cache et d'optimisation de performance pour WordPress, un problème purement technique (temps de chargement, Core Web Vitals) que l'IA générative n'adresse pas directement.",
    augmentEn: "WP Rocket remains a caching and performance optimization plugin for WordPress, a purely technical problem (load times, Core Web Vitals) that generative AI doesn't directly address.",
    replaceFr: "Remplacer WP Rocket par une IA ? Non : optimiser le temps de chargement d'un site WordPress (cache, minification, lazy loading) reste une tâche technique précise, pas un problème de génération de contenu. Verdict : l'IA n'a pas de rôle direct ici, le besoin reste technique.",
    replaceEn: "Replace WP Rocket with an AI? No: optimizing a WordPress site's load time (caching, minification, lazy loading) remains a precise technical task, not a content-generation problem. Verdict: AI has no direct role here, the need remains technical.",
    aiTools: [],
  },
};

const CONTENT = {
  yoast: {
    shortDescription: "Plugin SEO le plus utilisé sur WordPress pour optimiser titres, métas et structure de contenu.",
    shortDescriptionEn: "The most widely used SEO plugin on WordPress to optimize titles, meta tags, and content structure.",
    longDescription: "Yoast SEO est le plugin WordPress de référence pour l'optimisation SEO on-page : analyse de lisibilité, suggestions de mot-clé focus, génération de sitemap XML, contrôle des balises title et meta description page par page.\n\nPour qui gère un blog ou un site WordPress sans expertise SEO poussée, Yoast guide vers les bonnes pratiques de base (densité de mot-clé, longueur de contenu, liens internes) sans remplacer une vraie stratégie de contenu ou de backlinks.",
    longDescriptionEn: "Yoast SEO is the reference WordPress plugin for on-page SEO optimization: readability analysis, focus keyword suggestions, XML sitemap generation, page-by-page control of title and meta description tags.\n\nFor anyone managing a blog or WordPress site without deep SEO expertise, Yoast guides toward basic best practices (keyword density, content length, internal links) without replacing a real content or backlink strategy.",
    pricing: "Version gratuite très complète ; Premium à partir de ~99$/an pour le suivi multi-mot-clé et les redirections.",
    pricingEn: "Very complete free version; Premium from ~$99/year for multi-keyword tracking and redirects.",
    pros: ["Version gratuite déjà très complète pour du SEO on-page de base", "Interface intégrée directement dans l'éditeur WordPress, pas d'outil externe", "Génère automatiquement sitemap XML et balises techniques (canonical, OG)"],
    prosEn: ["Already very complete free version for basic on-page SEO", "Interface built directly into the WordPress editor, no external tool", "Automatically generates XML sitemap and technical tags (canonical, OG)"],
    cons: ["Reste un outil on-page, ne remplace pas une stratégie SEO de fond (backlinks, contenu)", "Peut ralentir légèrement le back-office WordPress sur de gros sites", "Premium nécessaire pour le suivi multi-mot-clé, limité en gratuit"],
    consEn: ["Remains an on-page tool, doesn't replace a real SEO strategy (backlinks, content)", "Can slightly slow down the WordPress back office on large sites", "Premium needed for multi-keyword tracking, limited in free version"],
    useCases: ["Optimiser titre et meta description de chaque page ou article WordPress", "Suivre la lisibilité de son contenu pour un public plus large", "Générer un sitemap XML propre sans configuration technique"],
    useCasesEn: ["Optimize the title and meta description of each WordPress page or post", "Track content readability for a broader audience", "Generate a clean XML sitemap with no technical configuration"],
    verdict: {
      keepIf: ["Tu gères un blog ou site WordPress et veux les bases du SEO on-page", "Tu n'as pas d'expertise SEO et veux un guide intégré à l'éditeur"],
      avoidIf: ["Tu as déjà une stratégie SEO avancée avec un outil dédié (SEMrush, Ahrefs)", "Tu ne veux suivre qu'un seul mot-clé par page — la version gratuite suffit largement"],
      threshold: "Indispensable en version gratuite pour tout site WordPress qui débute en SEO.",
    },
    verdictEn: {
      keepIf: ["You manage a blog or WordPress site and want on-page SEO basics", "You have no SEO expertise and want a guide built into the editor"],
      avoidIf: ["You already have an advanced SEO strategy with a dedicated tool (SEMrush, Ahrefs)", "You only track one keyword per page — the free version is plenty"],
      threshold: "Essential in its free version for any WordPress site starting out in SEO.",
    },
  },
  rankmath: {
    shortDescription: "Plugin SEO WordPress, alternative à Yoast avec plus de fonctionnalités gratuites.",
    shortDescriptionEn: "WordPress SEO plugin, an alternative to Yoast with more free features.",
    longDescription: "RankMath est le principal concurrent de Yoast sur WordPress, avec une approche similaire (optimisation on-page, sitemap, balises techniques) mais une version gratuite plus généreuse : suivi multi-mot-clé et intégration Google Search Console inclus gratuitement, là où Yoast les réserve au plan payant.\n\nLe choix entre les deux est surtout une question d'habitude et d'interface ; RankMath est souvent recommandé pour qui veut plus de fonctionnalités sans payer.",
    longDescriptionEn: "RankMath is Yoast's main competitor on WordPress, with a similar approach (on-page optimization, sitemap, technical tags) but a more generous free version: multi-keyword tracking and Google Search Console integration included for free, where Yoast reserves them for the paid plan.\n\nThe choice between the two is mostly a matter of habit and interface; RankMath is often recommended for those who want more features without paying.",
    pricing: "Version gratuite généreuse (suivi multi-mot-clé inclus) ; Pro à partir de ~59$/an.",
    pricingEn: "Generous free version (multi-keyword tracking included); Pro from ~$59/year.",
    pros: ["Suivi multi-mot-clé gratuit, contrairement à Yoast qui le réserve au Premium", "Intégration Google Search Console directe dans le plugin", "Assistant de configuration qui simplifie le démarrage"],
    prosEn: ["Free multi-keyword tracking, unlike Yoast which reserves it for Premium", "Direct Google Search Console integration in the plugin", "Setup wizard that simplifies getting started"],
    cons: ["Moins connu que Yoast, communauté et ressources légèrement plus restreintes", "Interface parfois jugée moins intuitive au premier abord", "Migration depuis Yoast possible mais demande une vérification manuelle"],
    consEn: ["Less known than Yoast, slightly smaller community and resources", "Interface sometimes seen as less intuitive at first", "Migration from Yoast possible but requires manual verification"],
    useCases: ["Optimiser le SEO on-page d'un site WordPress sans payer pour le suivi multi-mot-clé", "Connecter directement les données Search Console dans l'éditeur WordPress", "Remplacer Yoast pour plus de fonctionnalités gratuites"],
    useCasesEn: ["Optimize a WordPress site's on-page SEO without paying for multi-keyword tracking", "Connect Search Console data directly into the WordPress editor", "Replace Yoast for more free features"],
    verdict: {
      keepIf: ["Tu veux le suivi multi-mot-clé et l'intégration Search Console sans payer", "Tu démarres un nouveau site et n'as pas d'habitude installée avec Yoast"],
      avoidIf: ["Tu es déjà à l'aise avec Yoast et n'as pas de raison de migrer", "Tu préfères un plugin avec une communauté plus large pour le support"],
      threshold: "Bon choix par défaut pour un nouveau site ; pas urgent de migrer si Yoast te convient déjà.",
    },
    verdictEn: {
      keepIf: ["You want multi-keyword tracking and Search Console integration for free", "You're starting a new site with no existing habit with Yoast"],
      avoidIf: ["You're already comfortable with Yoast and have no reason to migrate", "You prefer a plugin with a larger community for support"],
      threshold: "Good default choice for a new site; not urgent to migrate if Yoast already works for you.",
    },
  },
  "google-search-console": {
    longDescription: "Google Search Console est l'outil gratuit de Google pour suivre comment un site apparaît dans les résultats de recherche : requêtes qui génèrent des clics, pages indexées, erreurs d'indexation, et données structurées détectées.\n\nC'est la seule source de vérité directe sur les données de recherche Google (les autres outils comme SEMrush ou Ahrefs estiment, Search Console montre les vraies données) — indispensable pour tout site qui veut suivre et corriger son SEO technique.",
    longDescriptionEn: "Google Search Console is Google's free tool to track how a site appears in search results: queries generating clicks, indexed pages, indexing errors, and detected structured data.\n\nIt's the only direct source of truth for Google search data (other tools like SEMrush or Ahrefs estimate, Search Console shows real data) — essential for any site that wants to track and fix its technical SEO.",
    pricing: "Gratuit, aucun plan payant.",
    pricingEn: "Free, no paid plan.",
    pros: ["Seule source de données réelles directement issues de Google", "Gratuit et sans limite, indispensable pour tout site", "Détecte les erreurs d'indexation et de données structurées avant qu'elles n'impactent le trafic"],
    prosEn: ["Only source of real data directly from Google", "Free and unlimited, essential for any site", "Detects indexing and structured data errors before they impact traffic"],
    cons: ["Interface moins riche en analyse comparative que des outils payants (SEMrush, Ahrefs)", "Données limitées aux 16 derniers mois et avec un léger délai", "Demande une vérification de propriété du site, parfois technique à configurer"],
    consEn: ["Interface less rich in comparative analysis than paid tools (SEMrush, Ahrefs)", "Data limited to the last 16 months and with a slight delay", "Requires site ownership verification, sometimes technical to set up"],
    useCases: ["Suivre les requêtes réelles qui génèrent du trafic depuis Google", "Détecter et corriger des erreurs d'indexation avant qu'elles n'impactent le SEO", "Vérifier que les données structurées (JSON-LD) sont bien reconnues par Google"],
    useCasesEn: ["Track real queries generating traffic from Google", "Detect and fix indexing errors before they impact SEO", "Verify that structured data (JSON-LD) is properly recognized by Google"],
    verdict: {
      keepIf: ["Tu as un site web, quel que soit sa taille — c'est gratuit et indispensable", "Tu veux des données réelles plutôt que des estimations"],
      avoidIf: ["Aucune raison valable de l'éviter, c'est gratuit et sans risque"],
      threshold: "Indispensable pour tout site web, sans exception.",
    },
    verdictEn: {
      keepIf: ["You have a website, regardless of size — it's free and essential", "You want real data rather than estimates"],
      avoidIf: ["No valid reason to avoid it, it's free and risk-free"],
      threshold: "Essential for any website, no exceptions.",
    },
  },
  plausible: {
    pros: ["Conforme RGPD sans bandeau de cookies nécessaire", "Interface simple, un seul écran avec les métriques essentielles", "Open-source, possibilité d'auto-hébergement pour un contrôle total des données"],
    prosEn: ["GDPR-compliant with no cookie banner needed", "Simple interface, a single screen with essential metrics", "Open-source, self-hosting possible for full data control"],
    cons: ["Moins de profondeur d'analyse que Google Analytics (pas de rapports comportementaux avancés)", "Payant dès le départ, contrairement à Google Analytics gratuit", "Écosystème d'intégrations plus restreint"],
    consEn: ["Less analytical depth than Google Analytics (no advanced behavioral reports)", "Paid from the start, unlike free Google Analytics", "More limited integration ecosystem"],
    useCases: ["Suivre le trafic d'un site sans bandeau de consentement cookies", "Avoir des statistiques simples et lisibles sans se noyer dans les rapports", "Respecter la confidentialité des visiteurs pour une audience sensible à ces enjeux"],
    useCasesEn: ["Track a site's traffic with no cookie consent banner", "Get simple, readable statistics without drowning in reports", "Respect visitor privacy for an audience sensitive to these issues"],
    verdict: {
      keepIf: ["Tu veux éviter le bandeau de cookies et simplifier ta conformité RGPD", "Tu préfères une interface simple à un outil d'analyse complexe"],
      avoidIf: ["Tu as besoin d'une analyse comportementale poussée (entonnoirs, segments avancés)", "Le budget compte plus que la simplicité — Google Analytics reste gratuit"],
      threshold: "Pertinent dès que la confidentialité des visiteurs et la simplicité comptent plus que l'analyse poussée.",
    },
    verdictEn: {
      keepIf: ["You want to avoid the cookie banner and simplify GDPR compliance", "You prefer a simple interface over a complex analytics tool"],
      avoidIf: ["You need advanced behavioral analysis (funnels, advanced segments)", "Budget matters more than simplicity — Google Analytics stays free"],
      threshold: "Worth it once visitor privacy and simplicity matter more than deep analysis.",
    },
  },
  "tiktok-ads": {
    shortDescription: "Plateforme publicitaire de TikTok pour cibler une audience jeune avec des formats vidéo natifs.",
    shortDescriptionEn: "TikTok's advertising platform to target a younger audience with native video formats.",
    longDescription: "TikTok Ads permet de diffuser des publicités vidéo natives sur la plateforme, avec un ciblage par centres d'intérêt, comportements et audiences similaires. Le format publicitaire le plus efficace reste celui qui ressemble à du contenu organique plutôt qu'à une pub traditionnelle.\n\nPour un freelance ou une petite marque, c'est un canal intéressant pour toucher une audience plus jeune que Facebook ou Instagram Ads, à condition d'avoir des créatifs vidéo natifs et pas juste des bannières recyclées.",
    longDescriptionEn: "TikTok Ads lets you run native video ads on the platform, with targeting by interests, behaviors, and lookalike audiences. The most effective ad format remains one that looks like organic content rather than a traditional ad.\n\nFor a freelancer or small brand, it's an interesting channel to reach a younger audience than Facebook or Instagram Ads, provided you have native video creatives rather than recycled banners.",
    pricing: "Budget minimum de campagne autour de 20$/jour ; coût par clic variable selon la niche.",
    pricingEn: "Minimum campaign budget around $20/day; cost per click varies by niche.",
    defaultMonthlyPrice: 0,
    pros: ["Accès à une audience jeune difficile à atteindre sur d'autres plateformes", "Formats natifs qui performent mieux quand le créatif est bien pensé", "Coûts par clic souvent compétitifs comparé à Meta Ads sur certaines niches"],
    prosEn: ["Access to a younger audience hard to reach on other platforms", "Native formats that perform better with well-designed creatives", "Cost per click often competitive vs. Meta Ads in some niches"],
    cons: ["Demande des créatifs vidéo natifs, une bannière classique performe mal", "Audience plus jeune, pas adaptée à toutes les offres B2B ou premium", "Plateforme publicitaire moins mature que Meta Ads ou Google Ads"],
    consEn: ["Requires native video creatives, a classic banner performs poorly", "Younger audience, not suited to all B2B or premium offers", "Ad platform less mature than Meta Ads or Google Ads"],
    useCases: ["Promouvoir un produit ou service auprès d'une audience jeune", "Tester des créatifs vidéo natifs à moindre coût qu'une vidéo publicitaire classique", "Accélérer la croissance d'une audience déjà construite organiquement sur TikTok"],
    useCasesEn: ["Promote a product or service to a younger audience", "Test native video creatives at lower cost than a classic ad video", "Accelerate growth of an audience already built organically on TikTok"],
    verdict: {
      keepIf: ["Ton audience cible est jeune et présente sur TikTok", "Tu peux produire des créatifs vidéo natifs, pas juste des bannières"],
      avoidIf: ["Ton offre est B2B ou s'adresse à une audience plus âgée", "Tu n'as pas la capacité de produire des créatifs vidéo spécifiques au format"],
      threshold: "Pertinent si l'audience jeune et les créatifs vidéo natifs correspondent à ton offre.",
    },
    verdictEn: {
      keepIf: ["Your target audience is younger and present on TikTok", "You can produce native video creatives, not just banners"],
      avoidIf: ["Your offer is B2B or targets an older audience", "You don't have the capacity to produce format-specific video creatives"],
      threshold: "Worth it if a younger audience and native video creatives fit your offer.",
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
