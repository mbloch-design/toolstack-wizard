/** add-content-batch-5.mjs — aiAngle pour 8 fiches (Xero, Squarespace,
 * Pinterest, WhatsApp Business, Vimeo, AWS, DigitalOcean, Heroku) +
 * remplissage complet pour celles encore avec du contenu placeholder. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  xero: {
    stance: "augmente",
    augmentFr: "Xero a son assistant IA (Xero JAX) pour catégoriser automatiquement les transactions et répondre à des questions sur la compta, mais la tenue de comptes réglementée et la conformité fiscale restent le cœur du produit.",
    augmentEn: "Xero has its AI assistant (Xero JAX) to automatically categorize transactions and answer accounting questions, but regulated bookkeeping and tax compliance remain the product's core.",
    replaceFr: "Remplacer Xero par une IA ? Non : la comptabilité d'une entreprise doit respecter des règles fiscales précises et produire des documents légaux (bilans, déclarations) — pas une tâche qu'un chatbot peut assumer seul. L'IA accélère la catégorisation et la saisie, elle ne remplace pas le système comptable. Verdict : l'IA augmente la productivité comptable, la conformité reste le vrai produit.",
    replaceEn: "Replace Xero with an AI? No: business accounting must follow precise tax rules and produce legal documents (balance sheets, filings) — not a task a chatbot can handle alone. AI speeds up categorization and entry, it doesn't replace the accounting system. Verdict: AI augments accounting productivity, compliance remains the real product.",
    aiTools: [],
  },
  squarespace: {
    stance: "challenge",
    augmentFr: "Squarespace a ajouté un générateur de site par IA pour démarrer plus vite, mais affronte désormais des concurrents IA-first comme Framer AI qui produisent un résultat visuel plus moderne dès le premier prompt.",
    augmentEn: "Squarespace added an AI site generator to start faster, but now faces AI-first competitors like Framer AI that produce a more modern visual result from the very first prompt.",
    replaceFr: "Remplacer Squarespace par une IA ? Pour un premier jet de site, les outils IA-first vont souvent plus vite et avec un design plus actuel. Squarespace garde l'avantage sur les templates soignés et l'écosystème complet (hébergement, e-commerce, blog) une fois le site en place. Verdict : challengé sur la génération initiale, solide sur la gestion à long terme.",
    replaceEn: "Replace Squarespace with an AI? For a first draft site, AI-first tools often move faster with a more current design. Squarespace keeps the edge on polished templates and the full ecosystem (hosting, e-commerce, blog) once the site is live. Verdict: challenged on initial generation, solid on long-term management.",
    aiTools: ["framer"],
  },
  pinterest: {
    stance: "augmente",
    augmentFr: "Pinterest a intégré la recherche visuelle par IA et des suggestions de tendances, mais reste avant tout un moteur de recherche visuel et un canal de trafic — la production des visuels eux-mêmes passe de plus en plus par des générateurs IA externes (Midjourney, Canva).",
    augmentEn: "Pinterest integrated AI-powered visual search and trend suggestions, but remains primarily a visual search engine and traffic channel — producing the visuals themselves increasingly goes through external AI generators (Midjourney, Canva).",
    replaceFr: "Remplacer Pinterest par une IA ? Non : la plateforme reste le canal de découverte et de trafic durable (les pins continuent de générer du trafic des mois après publication, contrairement aux réseaux sociaux classiques). L'IA aide à produire les épingles plus vite, elle ne remplace pas la portée de la plateforme. Verdict : l'IA augmente la production visuelle, Pinterest reste le canal de distribution longue traîne.",
    replaceEn: "Replace Pinterest with an AI? No: the platform remains the discovery and long-tail traffic channel (pins keep generating traffic months after posting, unlike traditional social media). AI helps produce pins faster, it doesn't replace the platform's reach. Verdict: AI augments visual production, Pinterest remains the long-tail distribution channel.",
    aiTools: ["midjourney", "canva"],
  },
  "whatsapp-business": {
    stance: "augmente",
    augmentFr: "WhatsApp Business intègre des réponses automatiques et, via l'API, des chatbots IA pour le support client, mais la messagerie elle-même reste un canal de communication directe que les clients attendent et reconnaissent.",
    augmentEn: "WhatsApp Business integrates automatic replies and, via the API, AI chatbots for customer support, but the messaging itself remains a direct communication channel clients expect and recognize.",
    replaceFr: "Remplacer WhatsApp Business par une IA ? Non : c'est le canal de messagerie le plus utilisé dans de nombreux pays — remplacer l'app reviendrait à perdre l'accès à l'audience qui y est déjà. L'IA automatise les réponses fréquentes via l'API, elle ne remplace pas la présence sur le canal. Verdict : l'IA augmente le support client, WhatsApp reste le canal incontournable.",
    replaceEn: "Replace WhatsApp Business with an AI? No: it's the most-used messaging channel in many countries — replacing the app would mean losing access to an audience already there. AI automates frequent replies via the API, it doesn't replace presence on the channel. Verdict: AI augments customer support, WhatsApp remains the essential channel.",
    aiTools: [],
  },
  vimeo: {
    stance: "augmente",
    augmentFr: "Vimeo a ajouté des outils IA pour générer des sous-titres automatiques et des résumés de vidéo, mais sa valeur reste l'hébergement professionnel sans publicité et le contrôle fin de la confidentialité — un besoin d'infrastructure, pas de génération.",
    augmentEn: "Vimeo added AI tools for automatic captions and video summaries, but its value remains ad-free professional hosting and fine-grained privacy control — an infrastructure need, not a generation one.",
    replaceFr: "Remplacer Vimeo par une IA ? Non : héberger une vidéo de façon professionnelle, sans pub ni vidéos suggérées concurrentes, reste un besoin d'infrastructure que l'IA n'adresse pas. Elle aide à sous-titrer et résumer plus vite. Verdict : l'IA augmente l'accessibilité du contenu, l'hébergement pro reste indispensable.",
    replaceEn: "Replace Vimeo with an AI? No: hosting a video professionally, without ads or competing suggested videos, remains an infrastructure need AI doesn't address. It helps caption and summarize faster. Verdict: AI augments content accessibility, professional hosting remains essential.",
    aiTools: [],
  },
  aws: {
    stance: "augmente",
    augmentFr: "AWS a son propre assistant IA (Amazon Q) pour générer du code d'infrastructure et diagnostiquer des problèmes, et héberge aussi les modèles IA d'autres entreprises (Bedrock) — l'IA s'ajoute en couche sur une infrastructure cloud qui reste le vrai produit.",
    augmentEn: "AWS has its own AI assistant (Amazon Q) to generate infrastructure code and diagnose issues, and also hosts other companies' AI models (Bedrock) — AI sits as a layer on top of cloud infrastructure that remains the real product.",
    replaceFr: "Remplacer AWS par une IA ? Non : hébergement, stockage, bases de données et réseau pour une application sont des problèmes d'infrastructure, pas de génération de contenu. L'IA aide à écrire du code d'infrastructure plus vite (Amazon Q), elle ne remplace pas le besoin de serveurs et de stockage. Verdict : l'IA augmente la vitesse de développement sur AWS, l'infrastructure reste le produit.",
    replaceEn: "Replace AWS with an AI? No: hosting, storage, databases, and networking for an application are infrastructure problems, not content-generation ones. AI helps write infrastructure code faster (Amazon Q), it doesn't replace the need for servers and storage. Verdict: AI augments development speed on AWS, the infrastructure remains the product.",
    aiTools: [],
  },
  digitalocean: {
    stance: "augmente",
    augmentFr: "DigitalOcean a ajouté des fonctionnalités IA (GenAI Platform pour déployer des apps IA, assistant de support) mais reste avant tout une alternative plus simple et moins chère qu'AWS pour héberger une application — un problème d'infrastructure, pas de génération.",
    augmentEn: "DigitalOcean added AI features (GenAI Platform to deploy AI apps, support assistant) but remains primarily a simpler, cheaper alternative to AWS for hosting an application — an infrastructure problem, not a generation one.",
    replaceFr: "Remplacer DigitalOcean par une IA ? Non : héberger un serveur ou une base de données reste un besoin d'infrastructure. L'IA aide désormais à déployer des apps IA elles-mêmes sur DigitalOcean (GenAI Platform), elle ne remplace pas l'hébergement. Verdict : l'IA augmente ce que tu peux construire sur DigitalOcean, l'infrastructure reste le produit.",
    replaceEn: "Replace DigitalOcean with an AI? No: hosting a server or database remains an infrastructure need. AI now helps deploy AI apps themselves on DigitalOcean (GenAI Platform), it doesn't replace the hosting. Verdict: AI augments what you can build on DigitalOcean, the infrastructure remains the product.",
    aiTools: [],
  },
  heroku: {
    stance: "augmente",
    augmentFr: "Heroku reste une plateforme de déploiement simplifiée (PaaS) pensée pour lancer une app sans gérer de serveurs ; les générateurs d'apps IA comme Lovable ou Bolt.new déploient souvent directement sur ce type d'infrastructure en arrière-plan.",
    augmentEn: "Heroku remains a simplified deployment platform (PaaS) designed to launch an app without managing servers; AI app generators like Lovable or Bolt.new often deploy directly onto this kind of infrastructure behind the scenes.",
    replaceFr: "Remplacer Heroku par une IA ? Non : déployer et faire tourner une app en production reste un besoin d'infrastructure. Les générateurs d'apps par IA changent la façon de coder l'app, mais ont toujours besoin d'une plateforme pour l'héberger — Heroku ou un équivalent. Verdict : l'IA change comment l'app est créée, pas le besoin de l'héberger.",
    replaceEn: "Replace Heroku with an AI? No: deploying and running an app in production remains an infrastructure need. AI app generators change how the app is coded, but still need a platform to host it on — Heroku or an equivalent. Verdict: AI changes how the app is created, not the need to host it.",
    aiTools: ["lovable", "bolt-new"],
  },
};

const CONTENT = {
  xero: {
    pros: ["Référence en comptabilité cloud pour PME, comparable à QuickBooks", "Rapprochement bancaire automatique et facturation intégrée", "Écosystème d'intégrations large avec d'autres outils business"],
    prosEn: ["Reference cloud accounting tool for SMBs, comparable to QuickBooks", "Automatic bank reconciliation and built-in invoicing", "Wide integration ecosystem with other business tools"],
    cons: ["Moins répandu en France qu'à l'international (UK, Australie, US)", "Nécessite souvent un comptable pour bien paramétrer le plan comptable local", "Fonctionnalités avancées (multi-devises, multi-entités) réservées aux plans supérieurs"],
    consEn: ["Less common in France than internationally (UK, Australia, US)", "Often requires an accountant to properly set up the local chart of accounts", "Advanced features (multi-currency, multi-entity) reserved for higher plans"],
    useCases: ["Tenir sa comptabilité de freelance ou petite entreprise en autonomie", "Centraliser facturation, dépenses et rapprochement bancaire", "Donner un accès direct à son comptable sur les mêmes données en temps réel"],
    useCasesEn: ["Manage freelance or small business bookkeeping independently", "Centralize invoicing, expenses, and bank reconciliation", "Give your accountant direct access to the same real-time data"],
    verdict: {
      keepIf: ["Tu factures et gères ta compta toi-même avec un comptable en support", "Tu as une activité internationale ou multi-devises"],
      avoidIf: ["Ton comptable utilise un autre logiciel imposé (les ressaisies double l'intérêt)", "Tu es en France avec des besoins comptables très spécifiques au système local"],
      threshold: "Vérifie avec ton comptable s'il accompagne Xero avant de t'engager, surtout en France.",
    },
    verdictEn: {
      keepIf: ["You invoice and manage your own bookkeeping with an accountant in support", "You have an international or multi-currency business"],
      avoidIf: ["Your accountant uses a different mandated software (double entry defeats the purpose)", "You're in France with very system-specific local accounting needs"],
      threshold: "Check with your accountant that they support Xero before committing, especially in France.",
    },
  },
  squarespace: {
    pros: ["Templates parmi les plus soignés visuellement du marché", "Hébergement, sécurité et SSL inclus sans configuration", "Bon compromis pour un portfolio créatif ou une activité de service"],
    prosEn: ["Among the most visually polished templates on the market", "Hosting, security, and SSL included with no setup", "Good fit for a creative portfolio or service business"],
    cons: ["Personnalisation plus limitée que WordPress pour des besoins spécifiques", "Migration vers une autre plateforme difficile une fois le site construit", "SEO technique moins flexible que sur un CMS open-source"],
    consEn: ["More limited customization than WordPress for specific needs", "Migration to another platform difficult once the site is built", "Technical SEO less flexible than on an open-source CMS"],
    useCases: ["Créer un portfolio ou site vitrine avec un design soigné sans coder", "Lancer un blog ou une activité de service avec prise de rendez-vous intégrée", "Vendre quelques produits via la fonction e-commerce intégrée"],
    useCasesEn: ["Create a portfolio or showcase site with polished design, no coding", "Launch a blog or service business with built-in booking", "Sell a few products via the built-in e-commerce feature"],
    verdict: {
      keepIf: ["Tu veux un site au design soigné rapidement sans coder", "Ton activité est créative (photo, design, conseil) et le visuel compte beaucoup"],
      avoidIf: ["Tu as besoin d'un contrôle technique poussé (SEO, plugins) — WordPress convient mieux", "Tu prévois une boutique e-commerce avec un volume important — Shopify est plus adapté"],
      threshold: "Idéal pour un site vitrine au visuel premium ; pour du e-commerce sérieux ou du SEO poussé, regarde ailleurs.",
    },
    verdictEn: {
      keepIf: ["You want a polished-looking site quickly without coding", "Your business is creative (photo, design, consulting) and visuals matter a lot"],
      avoidIf: ["You need deep technical control (SEO, plugins) — WordPress fits better", "You're planning high-volume e-commerce — Shopify fits better"],
      threshold: "Great for a premium-looking showcase site; for serious e-commerce or deep SEO, look elsewhere.",
    },
  },
  pinterest: {
    shortDescription: "Moteur de recherche visuel et canal de trafic longue traîne pour du contenu et des produits créatifs.",
    shortDescriptionEn: "Visual search engine and long-tail traffic channel for creative content and products.",
    longDescription: "Pinterest fonctionne comme un moteur de recherche visuel plutôt qu'un réseau social classique : les épingles continuent de générer du trafic des mois, voire des années après leur publication, ce qui en fait un canal d'acquisition particulièrement rentable sur la durée pour qui vend des produits visuels (déco, mode, recettes, templates, designs).\n\nPour un créateur indépendant ou une marque e-commerce, c'est un complément précieux à Instagram : moins instantané, mais avec une demi-vie de trafic beaucoup plus longue par épingle publiée.",
    longDescriptionEn: "Pinterest works like a visual search engine rather than a traditional social network: pins keep generating traffic months, even years after posting, making it a particularly cost-effective acquisition channel over time for anyone selling visual products (decor, fashion, recipes, templates, designs).\n\nFor an independent creator or e-commerce brand, it's a valuable complement to Instagram: less instant, but with a much longer traffic half-life per pin published.",
    pricing: "Gratuit pour le compte business ; la publicité (Pinterest Ads) démarre dès quelques euros par jour de budget.",
    pricingEn: "Free for the business account; advertising (Pinterest Ads) starts from a few dollars a day.",
    defaultMonthlyPrice: 0,
    pros: ["Trafic durable, une épingle continue de générer des clics longtemps après publication", "Excellent pour rediriger vers un site, une boutique ou un blog", "Moins de pression à publier en continu que sur Instagram ou TikTok"],
    prosEn: ["Durable traffic, a pin keeps generating clicks long after publishing", "Excellent for driving traffic to a site, store, or blog", "Less pressure to post constantly than on Instagram or TikTok"],
    cons: ["Audience plus orientée déco/mode/lifestyle, moins universelle que d'autres réseaux", "Résultats lents à démarrer, l'effet cumulatif prend du temps à se construire", "Moins adapté à du contenu purement B2B ou technique"],
    consEn: ["Audience more decor/fashion/lifestyle-oriented, less universal than other networks", "Slow to start, the cumulative effect takes time to build", "Less suited to purely B2B or technical content"],
    useCases: ["Générer du trafic durable vers un blog, une boutique ou un portfolio", "Promouvoir des templates, designs ou produits visuels téléchargeables", "Construire une bibliothèque d'inspirations et de moodboards pour son activité créative"],
    useCasesEn: ["Generate durable traffic to a blog, store, or portfolio", "Promote templates, designs, or downloadable visual products", "Build a library of inspiration and moodboards for a creative business"],
    verdict: {
      keepIf: ["Tu vends ou promeus des produits visuels (déco, mode, templates, recettes)", "Tu cherches un canal de trafic complémentaire avec un effet durable"],
      avoidIf: ["Ton activité est B2B ou technique sans angle visuel", "Tu cherches des résultats rapides — Pinterest demande de la patience"],
      threshold: "Pertinent en complément d'un blog ou d'une boutique, surtout dans les niches visuelles.",
    },
    verdictEn: {
      keepIf: ["You sell or promote visual products (decor, fashion, templates, recipes)", "You want a complementary traffic channel with a durable effect"],
      avoidIf: ["Your business is B2B or technical with no visual angle", "You want fast results — Pinterest requires patience"],
      threshold: "Worth it alongside a blog or store, especially in visual niches.",
    },
  },
  "whatsapp-business": {
    shortDescription: "Messagerie professionnelle pour communiquer avec ses clients sur le canal qu'ils utilisent déjà.",
    shortDescriptionEn: "Business messaging to reach clients on the channel they already use.",
    longDescription: "WhatsApp Business est la version professionnelle de WhatsApp : profil entreprise, réponses automatiques, catalogue de produits et, via l'API officielle, intégration à des outils de support ou de CRM. Pour beaucoup de pays (Amérique latine, Inde, une partie de l'Europe), c'est le canal de communication client par défaut, devant l'email ou le SMS.\n\nPour un freelance ou une petite entreprise, l'app gratuite suffit largement ; l'API payante n'a de sens qu'à partir d'un volume de conversations qui justifie l'automatisation.",
    longDescriptionEn: "WhatsApp Business is the professional version of WhatsApp: business profile, automatic replies, product catalog, and, via the official API, integration with support or CRM tools. In many countries (Latin America, India, parts of Europe), it's the default customer communication channel, ahead of email or SMS.\n\nFor a freelancer or small business, the free app is largely enough; the paid API only makes sense once conversation volume justifies automation.",
    pricing: "App gratuite pour l'essentiel ; l'API WhatsApp Business (pour l'automatisation à volume) est facturée par conversation selon le pays.",
    pricingEn: "Free app for the essentials; the WhatsApp Business API (for volume automation) is billed per conversation depending on the country.",
    defaultMonthlyPrice: 0,
    pros: ["Canal que les clients utilisent déjà au quotidien, taux d'ouverture très élevé", "App gratuite avec profil pro, catalogue et réponses automatiques de base", "Perçu comme plus direct et personnel qu'un email"],
    prosEn: ["A channel clients already use daily, very high open rates", "Free app with business profile, catalog, and basic automatic replies", "Perceived as more direct and personal than email"],
    cons: ["Gestion manuelle qui devient difficile à volume élevé sans l'API payante", "Moins structuré qu'un vrai outil de support client (pas de tickets, de SLA)", "Dépendance à un numéro de téléphone, migration parfois délicate"],
    consEn: ["Manual management becomes difficult at high volume without the paid API", "Less structured than a real customer support tool (no tickets, SLAs)", "Dependency on a phone number, migration sometimes tricky"],
    useCases: ["Répondre aux questions clients sur le canal qu'ils préfèrent déjà", "Envoyer des confirmations de commande ou de rendez-vous", "Présenter un catalogue de produits ou services directement dans l'app"],
    useCasesEn: ["Answer client questions on the channel they already prefer", "Send order or appointment confirmations", "Present a product or service catalog directly in the app"],
    verdict: {
      keepIf: ["Tes clients sont dans une région où WhatsApp est le canal dominant", "Tu veux un contact direct et personnel sans la lourdeur d'un CRM"],
      avoidIf: ["Ton volume de conversations dépasse ce qu'une gestion manuelle permet", "Tu as déjà un outil de support structuré (Zendesk, Intercom) qui couvre le besoin"],
      threshold: "Gratuit et suffisant pour un volume modéré ; passe à l'API dès que la gestion manuelle devient ingérable.",
    },
    verdictEn: {
      keepIf: ["Your clients are in a region where WhatsApp is the dominant channel", "You want direct, personal contact without the overhead of a CRM"],
      avoidIf: ["Your conversation volume exceeds what manual management allows", "You already have a structured support tool (Zendesk, Intercom) covering the need"],
      threshold: "Free and sufficient for moderate volume; move to the API once manual management becomes unmanageable.",
    },
  },
  aws: {
    pros: ["Écosystème de services le plus complet du marché (compute, stockage, data, IA)", "Scalabilité quasi illimitée, du petit projet à l'app à très fort trafic", "Standard de facto, énormément de documentation et de talents formés"],
    prosEn: ["Most complete service ecosystem on the market (compute, storage, data, AI)", "Near-unlimited scalability, from small project to very high-traffic app", "De facto standard, huge amount of documentation and trained talent"],
    cons: ["Complexité et courbe d'apprentissage élevées pour un développeur solo", "Facturation à l'usage difficile à prévoir sans surveillance active", "Sur-dimensionné pour un petit projet — DigitalOcean ou Heroku sont plus simples"],
    consEn: ["High complexity and learning curve for a solo developer", "Usage-based billing hard to predict without active monitoring", "Overkill for a small project — DigitalOcean or Heroku are simpler"],
    useCases: ["Héberger une application à fort trafic nécessitant une scalabilité fine", "Construire une infrastructure data ou IA sur mesure (S3, SageMaker, Bedrock)", "Migrer une infrastructure d'entreprise existante vers le cloud"],
    useCasesEn: ["Host a high-traffic application needing fine-grained scalability", "Build a custom data or AI infrastructure (S3, SageMaker, Bedrock)", "Migrate an existing enterprise infrastructure to the cloud"],
    verdict: {
      keepIf: ["Ton app a des besoins de scalabilité ou des services spécifiques (IA, data) qu'AWS couvre", "Tu as l'équipe ou les compétences pour gérer la complexité et les coûts"],
      avoidIf: ["Tu es seul sur un petit projet — la complexité dépasse le besoin réel", "Tu veux un coût prévisible sans surveillance constante"],
      threshold: "Justifié à partir d'une vraie échelle ou de besoins spécifiques ; pour un projet simple, un PaaS plus simple suffit.",
    },
    verdictEn: {
      keepIf: ["Your app has scalability needs or specific services (AI, data) that AWS covers", "You have the team or skills to manage the complexity and costs"],
      avoidIf: ["You're solo on a small project — the complexity exceeds the real need", "You want predictable cost without constant monitoring"],
      threshold: "Worth it at real scale or for specific needs; for a simple project, a simpler PaaS is enough.",
    },
  },
  digitalocean: {
    shortDescription: "Alternative simple et prévisible à AWS pour héberger une app ou un site sans se noyer dans la complexité.",
    shortDescriptionEn: "Simple, predictable alternative to AWS for hosting an app or site without drowning in complexity.",
    longDescription: "DigitalOcean propose les mêmes briques de base qu'AWS (serveurs, stockage, bases de données managées) mais avec une interface et une tarification volontairement plus simples — pensé pour les développeurs indépendants et petites équipes qui veulent du contrôle sans la complexité d'un cloud d'entreprise.\n\nC'est le compromis classique entre un PaaS très simplifié (Heroku) et un cloud complet (AWS) : plus de contrôle que Heroku, plus simple qu'AWS.",
    longDescriptionEn: "DigitalOcean offers the same basic building blocks as AWS (servers, storage, managed databases) but with deliberately simpler interface and pricing — built for independent developers and small teams who want control without enterprise-cloud complexity.\n\nIt's the classic middle ground between a fully simplified PaaS (Heroku) and a full cloud (AWS): more control than Heroku, simpler than AWS.",
    pricing: "À partir de 5$/mois pour un Droplet (serveur) basique.",
    pricingEn: "From $5/month for a basic Droplet (server).",
    pros: ["Tarification simple et prévisible, sans surprise à la facturation", "Interface bien plus lisible qu'AWS pour un développeur solo", "Bon compromis contrôle/simplicité pour héberger une app ou un site"],
    prosEn: ["Simple, predictable pricing, no billing surprises", "Much more readable interface than AWS for a solo developer", "Good control/simplicity trade-off to host an app or site"],
    cons: ["Moins de services managés et de régions qu'AWS ou GCP", "Demande tout de même des bases en administration serveur (Linux, Docker)", "Pas d'équivalent direct aux services IA avancés des gros clouds"],
    consEn: ["Fewer managed services and regions than AWS or GCP", "Still requires basic server administration skills (Linux, Docker)", "No direct equivalent to big clouds' advanced AI services"],
    useCases: ["Héberger une app ou un site web pour un projet indépendant ou une startup", "Monter une base de données managée sans la complexité d'AWS RDS", "Déployer une app générée par un outil IA (Lovable, Bolt.new) sur une infrastructure simple"],
    useCasesEn: ["Host an app or website for an independent project or startup", "Set up a managed database without the complexity of AWS RDS", "Deploy an app generated by an AI tool (Lovable, Bolt.new) on simple infrastructure"],
    verdict: {
      keepIf: ["Tu veux du contrôle serveur sans la complexité d'AWS", "Ton budget doit rester prévisible et simple à suivre"],
      avoidIf: ["Tu as besoin de services managés avancés ou d'une présence mondiale poussée", "Tu préfères ne gérer aucun serveur — un PaaS comme Vercel ou Heroku ira plus vite"],
      threshold: "Bon choix par défaut pour héberger un projet indépendant sans se noyer dans la complexité d'un cloud d'entreprise.",
    },
    verdictEn: {
      keepIf: ["You want server control without AWS's complexity", "Your budget needs to stay predictable and easy to track"],
      avoidIf: ["You need advanced managed services or deep global presence", "You'd rather manage no servers at all — a PaaS like Vercel or Heroku will be faster"],
      threshold: "Good default choice to host an independent project without drowning in enterprise-cloud complexity.",
    },
  },
  heroku: {
    shortDescription: "Plateforme de déploiement (PaaS) qui met une app en ligne en quelques commandes, sans gérer de serveur.",
    shortDescriptionEn: "Deployment platform (PaaS) that gets an app online in a few commands, no server management needed.",
    longDescription: "Heroku a popularisé le modèle PaaS (Platform as a Service) : un simple `git push` suffit pour déployer une app, sans configurer de serveur, de réseau ou de système d'exploitation. C'est l'option la plus rapide pour transformer un projet codé en local en une app accessible en ligne.\n\nLe compromis : cette simplicité a un coût, et les tarifs de Heroku sont devenus moins compétitifs qu'avant face à des alternatives comme Render ou Railway qui offrent une expérience similaire à moindre coût.",
    longDescriptionEn: "Heroku popularized the PaaS (Platform as a Service) model: a simple `git push` is enough to deploy an app, with no server, network, or OS configuration. It's the fastest way to turn a locally coded project into an app accessible online.\n\nThe trade-off: this simplicity comes at a cost, and Heroku's pricing has become less competitive than alternatives like Render or Railway, which offer a similar experience at a lower cost.",
    pricing: "À partir de 5$/mois (dynos Eco/Basic), facturation à l'usage au-delà.",
    pricingEn: "From $5/month (Eco/Basic dynos), usage-based billing beyond that.",
    pros: ["Déploiement le plus simple du marché, idéal pour un premier projet en ligne", "Aucune compétence serveur requise (pas de Linux, pas de Docker à gérer)", "Add-ons (base de données, monitoring) installables en un clic"],
    prosEn: ["Simplest deployment on the market, ideal for a first project going live", "No server skills required (no Linux, no Docker to manage)", "Add-ons (database, monitoring) installable in one click"],
    cons: ["Tarifs moins compétitifs que des alternatives récentes (Render, Railway)", "Moins de contrôle fin que sur AWS ou DigitalOcean", "Les dynos gratuits ont disparu, le coût d'entrée a augmenté"],
    consEn: ["Pricing less competitive than newer alternatives (Render, Railway)", "Less fine-grained control than AWS or DigitalOcean", "Free dynos disappeared, the entry cost has gone up"],
    useCases: ["Déployer rapidement un MVP ou un prototype sans gérer d'infrastructure", "Mettre en ligne une app générée par un outil no-code/IA sans compétence serveur", "Tester une idée avant d'investir dans une infrastructure plus complexe"],
    useCasesEn: ["Quickly deploy an MVP or prototype without managing infrastructure", "Put a no-code/AI-generated app online with no server skills", "Test an idea before investing in more complex infrastructure"],
    verdict: {
      keepIf: ["Tu veux déployer une app en quelques minutes sans toucher à un serveur", "La simplicité compte plus que le prix pour ton usage"],
      avoidIf: ["Le budget est serré — Render ou Railway offrent une expérience similaire moins chère", "Tu as besoin de contrôle serveur fin (AWS, DigitalOcean conviennent mieux)"],
      threshold: "Toujours pertinent pour la simplicité, mais compare le prix avec Render/Railway avant de t'engager.",
    },
    verdictEn: {
      keepIf: ["You want to deploy an app in minutes without touching a server", "Simplicity matters more than price for your use case"],
      avoidIf: ["Budget is tight — Render or Railway offer a similar experience for less", "You need fine-grained server control (AWS, DigitalOcean fit better)"],
      threshold: "Still worth it for simplicity, but compare pricing with Render/Railway before committing.",
    },
  },
};

let updated = 0;
for (const [slug, angle] of Object.entries(ANGLES)) {
  if (!present.has(slug)) { console.warn(`⚠️  ${slug} not found, skipping`); continue; }
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  tool.seo = Object.assign({}, tool.seo, { aiAngle: angle });
  if (CONTENT[slug]) {
    for (const [key, value] of Object.entries(CONTENT[slug])) tool[key] = value;
    if (CONTENT[slug].longDescription) tool.description = CONTENT[slug].longDescription;
  }
  updated++;
  console.log(`✓ ${tool.name} (${slug}): ${angle.stance}${CONTENT[slug] ? " + contenu complet" : ""}`);
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated}/${Object.keys(ANGLES).length} fiches mises à jour.`);
