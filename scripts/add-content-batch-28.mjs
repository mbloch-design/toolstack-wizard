/** add-content-batch-28.mjs — contenu complet pour Premiere Rush,
 * Pretty Links, ShortPixel, Surfer AI, Nightbot, Elgato, LTK,
 * Trainerize. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));

const ANGLES = {
  "surfer-ai": {
    stance: "augmente",
    augmentFr: "Surfer AI génère des articles optimisés SEO en analysant les pages déjà bien classées sur un mot-clé, combinant génération de texte et données de positionnement réelles plutôt que de la pure génération.",
    augmentEn: "Surfer AI generates SEO-optimized articles by analyzing already well-ranked pages for a keyword, combining text generation with real ranking data rather than pure generation.",
    replaceFr: "Surfer AI remplace-t-il un rédacteur SEO ? Pour un premier jet structuré selon les standards SEO d'une requête, oui en grande partie. Pour une voix de marque distinctive et une expertise réelle sur le sujet, une relecture humaine reste nécessaire. Verdict : l'IA augmente fortement la vitesse de rédaction SEO, la qualité éditoriale reste à valider humainement.",
    replaceEn: "Does Surfer AI replace an SEO writer? For a first draft structured to a query's SEO standards, largely yes. For a distinctive brand voice and real subject expertise, human review remains necessary. Verdict: AI strongly augments SEO writing speed, editorial quality still needs human validation.",
    aiTools: [],
  },
};

const CONTENT = {
  "premiere-rush": {
    shortDescription: "Montage vidéo simplifié d'Adobe, pensé pour les réseaux sociaux sur mobile et desktop.",
    shortDescriptionEn: "Adobe's simplified video editing, designed for social media on mobile and desktop.",
    longDescription: "Premiere Rush est la version simplifiée de Premiere Pro pensée pour monter rapidement des vidéos courtes destinées aux réseaux sociaux, avec une interface unifiée entre mobile et desktop qui permet de commencer un montage sur téléphone et de le terminer sur ordinateur.\n\nPour un créateur qui veut rester dans l'écosystème Adobe sans la complexité de Premiere Pro, c'est un bon compromis — au prix de fonctionnalités plus limitées que la version complète.",
    longDescriptionEn: "Premiere Rush is the simplified version of Premiere Pro designed for quickly editing short videos for social media, with a unified interface between mobile and desktop that lets you start an edit on your phone and finish it on a computer.\n\nFor a creator who wants to stay in the Adobe ecosystem without Premiere Pro's complexity, it's a good compromise — at the cost of more limited features than the full version.",
    pricing: "Inclus dans certains abonnements Creative Cloud ; sinon ~10€/mois en autonome.",
    pricingEn: "Included in some Creative Cloud subscriptions; otherwise ~$10/month standalone.",
    defaultMonthlyPrice: 10,
    pros: ["Continuité mobile/desktop, démarre un montage sur téléphone et termine sur ordinateur", "Interface simplifiée, plus accessible que Premiere Pro complet", "Intégration native avec l'écosystème Adobe (Creative Cloud)"],
    prosEn: ["Mobile/desktop continuity, start an edit on phone and finish on computer", "Simplified interface, more accessible than full Premiere Pro", "Native integration with the Adobe ecosystem (Creative Cloud)"],
    cons: ["Fonctionnalités nettement plus limitées que Premiere Pro complet", "Moins pertinent si tu as déjà accès à Premiere Pro via Creative Cloud", "Écosystème de plugins inexistant comparé à la version complète"],
    consEn: ["Notably more limited features than full Premiere Pro", "Less relevant if you already have Premiere Pro access via Creative Cloud", "No plugin ecosystem compared to the full version"],
    useCases: ["Monter rapidement des vidéos courtes pour les réseaux sociaux sur mobile", "Démarrer un montage en déplacement et le finaliser sur ordinateur", "Rester dans l'écosystème Adobe sans la complexité de Premiere Pro"],
    useCasesEn: ["Quickly edit short videos for social media on mobile", "Start an edit on the go and finish it on a computer", "Stay in the Adobe ecosystem without Premiere Pro's complexity"],
    verdict: {
      keepIf: ["Tu veux monter en mobilité et continuer sur desktop", "Tu es dans l'écosystème Adobe mais ne veux pas la complexité de Premiere Pro"],
      avoidIf: ["Tu as déjà accès à Premiere Pro complet via Creative Cloud", "Tu as besoin de fonctionnalités de montage avancées"],
      threshold: "Pertinent pour du montage social rapide en mobilité ; pour du montage complexe, passe à Premiere Pro.",
    },
    verdictEn: {
      keepIf: ["You want to edit on the go and continue on desktop", "You're in the Adobe ecosystem but don't want Premiere Pro's complexity"],
      avoidIf: ["You already have full Premiere Pro access via Creative Cloud", "You need advanced editing features"],
      threshold: "Worth it for quick social editing on the go; for complex editing, move to Premiere Pro.",
    },
  },
  "pretty-links": {
    shortDescription: "Plugin WordPress de raccourcissement et de suivi de liens, avec masquage pour l'affiliation.",
    shortDescriptionEn: "WordPress link shortening and tracking plugin, with cloaking for affiliate use.",
    longDescription: "Pretty Links permet de créer des liens raccourcis et personnalisés directement depuis WordPress, avec suivi des clics et masquage (cloaking) pour des URLs d'affiliation plus propres, sans dépendre d'un service externe.\n\nPour un blogueur ou créateur qui monétise via l'affiliation ou veut des liens personnalisés à sa marque, c'est une alternative gratuite à des services de raccourcissement de liens tiers.",
    longDescriptionEn: "Pretty Links lets you create shortened, custom links directly from WordPress, with click tracking and cloaking for cleaner affiliate URLs, without relying on an external service.",
    pricing: "Version gratuite disponible ; Pro à partir de ~99$/an pour le suivi avancé.",
    pricingEn: "Free version available; Pro from ~$99/year for advanced tracking.",
    defaultMonthlyPrice: 0,
    pros: ["Gratuit et intégré directement à WordPress, pas de service externe nécessaire", "Masquage de liens pour des URLs personnalisées à ta marque", "Suivi des clics par lien pour identifier ce qui convertit"],
    prosEn: ["Free and built directly into WordPress, no external service needed", "Link cloaking for URLs customized to your brand", "Click tracking per link to identify what converts"],
    cons: ["Spécifique à WordPress, inutile sur une autre plateforme", "Fonctionnalités avancées de reporting réservées à la version Pro", "Moins de fonctionnalités marketing que des outils dédiés comme ThirstyAffiliates"],
    consEn: ["WordPress-specific, useless on another platform", "Advanced reporting features reserved for the Pro version", "Fewer marketing features than dedicated tools like ThirstyAffiliates"],
    useCases: ["Créer des liens raccourcis personnalisés à sa marque sur WordPress", "Masquer des liens d'affiliation pour un rendu plus professionnel", "Suivre les clics pour identifier les liens les plus performants"],
    useCasesEn: ["Create brand-customized shortened links on WordPress", "Cloak affiliate links for a more professional look", "Track clicks to identify the best-performing links"],
    verdict: {
      keepIf: ["Tu es sur WordPress et veux des liens raccourcis personnalisés gratuitement", "Tu veux éviter de dépendre d'un service externe de raccourcissement"],
      avoidIf: ["Tu n'es pas sur WordPress — le plugin ne fonctionne pas ailleurs", "Tu as des besoins d'affiliation avancés — ThirstyAffiliates est plus complet"],
      threshold: "Bon choix gratuit pour des liens personnalisés WordPress de base.",
    },
    verdictEn: {
      keepIf: ["You're on WordPress and want free custom shortened links", "You want to avoid depending on an external shortening service"],
      avoidIf: ["You're not on WordPress — the plugin doesn't work elsewhere", "You have advanced affiliate needs — ThirstyAffiliates is more complete"],
      threshold: "Good free choice for basic WordPress custom links.",
    },
  },
  shortpixel: {
    shortDescription: "Plugin WordPress de compression d'images pour accélérer le chargement d'un site.",
    shortDescriptionEn: "WordPress image compression plugin to speed up site loading.",
    longDescription: "ShortPixel compresse automatiquement les images d'un site WordPress (sans perte visible de qualité) pour réduire leur poids et accélérer le chargement des pages — un facteur direct de SEO et d'expérience utilisateur.\n\nPour qui publie régulièrement des images en haute résolution (photographe, e-commerce, blog visuel), c'est un moyen simple d'éviter qu'un site ne devienne lent à mesure que la médiathèque grossit.",
    longDescriptionEn: "ShortPixel automatically compresses a WordPress site's images (with no visible quality loss) to reduce their weight and speed up page loading — a direct SEO and user-experience factor.\n\nFor anyone regularly publishing high-resolution images (photographer, e-commerce, visual blog), it's a simple way to prevent a site from slowing down as the media library grows.",
    pricing: "Plan gratuit limité (100 images/mois) ; plans payants à partir de ~5$/mois selon le volume.",
    pricingEn: "Limited free plan (100 images/month); paid plans from ~$5/month depending on volume.",
    defaultMonthlyPrice: 5,
    pros: ["Compression automatique sans intervention manuelle après installation", "Compression sans perte visible de qualité perceptible", "Impact direct et mesurable sur la vitesse de chargement du site"],
    prosEn: ["Automatic compression with no manual intervention after install", "Compression with no perceptible visible quality loss", "Direct, measurable impact on site loading speed"],
    cons: ["Plan gratuit limité en volume, vite dépassé sur un site avec beaucoup d'images", "Coût récurrent qui monte avec le volume d'images traitées", "Spécifique à WordPress, inutile sur une autre plateforme"],
    consEn: ["Free plan limited in volume, quickly exceeded on an image-heavy site", "Recurring cost that rises with image volume processed", "WordPress-specific, useless on another platform"],
    useCases: ["Réduire le poids des images d'un site WordPress sans perdre en qualité visuelle", "Améliorer le score de performance (PageSpeed) impacté par des images lourdes", "Automatiser la compression sans avoir à traiter chaque image manuellement"],
    useCasesEn: ["Reduce a WordPress site's image weight with no visible quality loss", "Improve a performance score (PageSpeed) impacted by heavy images", "Automate compression with no manual per-image processing"],
    verdict: {
      keepIf: ["Tu publies régulièrement des images haute résolution sur WordPress", "La vitesse de chargement de ton site est impactée par le poids des images"],
      avoidIf: ["Tu publies très peu d'images — le gratuit illimité d'autres outils suffit", "Tu n'es pas sur WordPress"],
      threshold: "Pertinent dès que le volume d'images dépasse le plan gratuit et impacte la vitesse du site.",
    },
    verdictEn: {
      keepIf: ["You regularly publish high-resolution images on WordPress", "Your site's loading speed is impacted by image weight"],
      avoidIf: ["You publish very few images — other tools' unlimited free tier is enough", "You're not on WordPress"],
      threshold: "Worth it once image volume exceeds the free plan and impacts site speed.",
    },
  },
  "surfer-ai": {
    shortDescription: "Génère des articles optimisés SEO en analysant les pages déjà bien classées sur un mot-clé.",
    shortDescriptionEn: "Generates SEO-optimized articles by analyzing already well-ranked pages for a keyword.",
    longDescription: "Surfer AI combine génération de texte par IA et analyse SEO en temps réel : il étudie les pages déjà positionnées sur un mot-clé visé, puis génère un article structuré pour matcher les critères qui semblent fonctionner (longueur, densité de mot-clé, structure de titres).\n\nPour qui produit du contenu SEO en volume, c'est un gain de temps significatif sur le premier jet — la relecture éditoriale et la vérification des faits restant nécessaires avant publication.",
    longDescriptionEn: "Surfer AI combines AI text generation with real-time SEO analysis: it studies pages already ranking for a target keyword, then generates a structured article matching criteria that seem to work (length, keyword density, heading structure).\n\nFor anyone producing SEO content at volume, it's a significant time saver on the first draft — editorial review and fact-checking remain necessary before publishing.",
    pricing: "À partir de ~89$/mois selon le volume d'articles générés.",
    pricingEn: "From ~$89/month depending on the volume of articles generated.",
    pros: ["Combine génération IA et données SEO réelles plutôt qu'une génération générique", "Gain de temps significatif sur la structure d'un premier jet SEO", "Analyse en temps réel des pages concurrentes déjà bien positionnées"],
    prosEn: ["Combines AI generation with real SEO data rather than generic generation", "Significant time savings on a first draft's SEO structure", "Real-time analysis of already well-ranked competing pages"],
    cons: ["Coût mensuel significatif pour qui produit peu d'articles", "Le contenu généré nécessite toujours une relecture éditoriale et factuelle", "Optimiser pour les critères actuels de Google ne garantit pas un bon classement futur"],
    consEn: ["Significant monthly cost for those producing few articles", "Generated content still requires editorial and factual review", "Optimizing for current Google criteria doesn't guarantee future ranking"],
    useCases: ["Produire des premiers jets d'articles SEO optimisés en volume", "Identifier rapidement la structure qui fonctionne pour un mot-clé donné", "Accélérer une stratégie de contenu SEO sans embaucher plusieurs rédacteurs"],
    useCasesEn: ["Produce SEO-optimized article first drafts at volume", "Quickly identify the structure that works for a given keyword", "Speed up an SEO content strategy without hiring multiple writers"],
    verdict: {
      keepIf: ["Tu produis du contenu SEO en volume et veux accélérer les premiers jets", "Tu as une équipe éditoriale pour relire et enrichir le contenu généré"],
      avoidIf: ["Tu produis très peu de contenu — le coût mensuel n'est pas justifié", "Tu n'as personne pour relire et valider le contenu généré avant publication"],
      threshold: "Pertinent pour une production de contenu SEO en volume avec relecture éditoriale en place.",
    },
    verdictEn: {
      keepIf: ["You produce SEO content at volume and want to speed up first drafts", "You have an editorial team to review and enrich generated content"],
      avoidIf: ["You produce very little content — the monthly cost isn't justified", "You have no one to review and validate generated content before publishing"],
      threshold: "Worth it for volume SEO content production with editorial review in place.",
    },
  },
  nightbot: {
    shortDescription: "Bot de modération et de commandes automatisées pour les chats Twitch et YouTube Live.",
    shortDescriptionEn: "Moderation and automated command bot for Twitch and YouTube Live chats.",
    longDescription: "Nightbot modère automatiquement le chat d'un stream (filtrage de spam, liens, mots interdits) et permet de créer des commandes personnalisées (!discord, !socials) que les viewers peuvent déclencher, réduisant la charge de modération manuelle pour un streamer.\n\nC'est l'un des bots de modération les plus utilisés sur Twitch et YouTube Live, gratuit et simple à configurer même pour un petit streamer qui débute.",
    longDescriptionEn: "Nightbot automatically moderates a stream's chat (spam, link, and banned-word filtering) and lets you create custom commands (!discord, !socials) that viewers can trigger, reducing manual moderation load for a streamer.\n\nIt's one of the most widely used moderation bots on Twitch and YouTube Live, free and simple to set up even for a small streamer just starting out.",
    pricing: "Gratuit ; abonnement payant optionnel pour des fonctionnalités avancées (~9$/mois).",
    pricingEn: "Free; optional paid subscription for advanced features (~$9/month).",
    defaultMonthlyPrice: 0,
    pros: ["Gratuit et largement adopté, standard de fait sur Twitch et YouTube", "Modération automatique qui réduit la charge de gestion manuelle du chat", "Commandes personnalisées simples à configurer sans coder"],
    prosEn: ["Free and widely adopted, the de facto standard on Twitch and YouTube", "Automatic moderation that reduces manual chat management load", "Custom commands simple to set up with no coding"],
    cons: ["Fonctionnalités avancées (playlist de musique, etc.) réservées à l'abonnement payant", "Moins de personnalisation poussée que des bots plus configurables (StreamElements)", "Demande une configuration initiale pour bien régler les filtres"],
    consEn: ["Advanced features (music playlist, etc.) reserved for the paid subscription", "Less deep customization than more configurable bots (StreamElements)", "Requires initial setup to properly tune filters"],
    useCases: ["Modérer automatiquement le chat d'un stream sans surveillance constante", "Créer des commandes rapides pour rediriger les viewers (réseaux, Discord)", "Réduire la charge de modération manuelle sur un stream qui grandit"],
    useCasesEn: ["Automatically moderate a stream's chat with no constant supervision", "Create quick commands to redirect viewers (socials, Discord)", "Reduce manual moderation load on a growing stream"],
    verdict: {
      keepIf: ["Tu streams régulièrement et veux automatiser la modération de base", "Tu veux des commandes rapides pour ton audience sans configuration complexe"],
      avoidIf: ["Ton chat est très petit et facile à modérer manuellement", "Tu veux une personnalisation très poussée — StreamElements offre plus d'options"],
      threshold: "Pertinent dès que le chat devient difficile à modérer manuellement seul.",
    },
    verdictEn: {
      keepIf: ["You stream regularly and want to automate basic moderation", "You want quick commands for your audience with no complex setup"],
      avoidIf: ["Your chat is very small and easy to moderate manually", "You want very deep customization — StreamElements offers more options"],
      threshold: "Worth it once chat becomes hard to moderate manually alone.",
    },
  },
  elgato: {
    shortDescription: "Matériel de streaming professionnel : Stream Deck, capture, éclairage et micros.",
    shortDescriptionEn: "Professional streaming hardware: Stream Deck, capture, lighting, and microphones.",
    longDescription: "Elgato fabrique le matériel de référence pour le streaming et la création de contenu vidéo : Stream Deck (clavier de raccourcis programmables), cartes de capture vidéo, éclairage Key Light, et microphones — l'écosystème matériel le plus reconnu dans la communauté streamer.\n\nPour un créateur qui investit dans une configuration de stream sérieuse, le matériel Elgato est souvent la référence par défaut, au prix d'un budget plus élevé que des alternatives génériques.",
    longDescriptionEn: "Elgato makes the reference hardware for streaming and video content creation: Stream Deck (programmable shortcut keypad), video capture cards, Key Light lighting, and microphones — the most recognized hardware ecosystem in the streamer community.\n\nFor a creator investing in a serious stream setup, Elgato hardware is often the default reference, at a higher budget than generic alternatives.",
    pricing: "Achat unique de matériel, de ~50€ (clé de capture basique) à plusieurs centaines d'euros (configuration complète).",
    pricingEn: "One-time hardware purchase, from ~$50 (basic capture key) to several hundred dollars (full setup).",
    defaultMonthlyPrice: 0,
    pros: ["Référence reconnue dans la communauté streamer, gage de qualité et de compatibilité", "Écosystème cohérent (Stream Deck, lumière, capture) qui s'intègre bien ensemble", "Logiciel de contrôle bien pensé pour automatiser des actions de stream"],
    prosEn: ["Recognized reference in the streamer community, a sign of quality and compatibility", "Coherent ecosystem (Stream Deck, lighting, capture) that integrates well together", "Well-designed control software to automate stream actions"],
    cons: ["Budget plus élevé que des alternatives génériques équivalentes", "Investissement matériel, pas un abonnement — coût initial à prévoir", "Surdimensionné pour un streamer occasionnel sans besoin de configuration poussée"],
    consEn: ["Higher budget than equivalent generic alternatives", "Hardware investment, not a subscription — upfront cost to plan for", "Overkill for a casual streamer with no need for an advanced setup"],
    useCases: ["Construire une configuration de stream professionnelle reconnue par la communauté", "Automatiser des actions de stream (scènes, alertes) via Stream Deck", "Améliorer la qualité visuelle (éclairage, capture) d'un stream ou de vidéos"],
    useCasesEn: ["Build a professional stream setup recognized by the community", "Automate stream actions (scenes, alerts) via Stream Deck", "Improve a stream or video's visual quality (lighting, capture)"],
    verdict: {
      keepIf: ["Tu streams ou produis du contenu vidéo régulièrement et veux du matériel fiable", "Le budget pour un investissement matériel de qualité est disponible"],
      avoidIf: ["Tu streams occasionnellement sans besoin d'une configuration poussée", "Le budget est serré — des alternatives génériques moins chères existent"],
      threshold: "Pertinent pour un streamer ou créateur sérieux qui investit dans une configuration durable.",
    },
    verdictEn: {
      keepIf: ["You stream or produce video content regularly and want reliable hardware", "Budget for a quality hardware investment is available"],
      avoidIf: ["You stream occasionally with no need for an advanced setup", "Budget is tight — cheaper generic alternatives exist"],
      threshold: "Worth it for a serious streamer or creator investing in a durable setup.",
    },
  },
  ltk: {
    shortDescription: "Plateforme de liens d'affiliation pour influenceurs mode et lifestyle, avec app shopping dédiée.",
    shortDescriptionEn: "Affiliate link platform for fashion and lifestyle influencers, with a dedicated shopping app.",
    longDescription: "LTK (LikeToKnow.it) permet aux créateurs mode, beauté et lifestyle de partager des liens d'affiliation vers des produits via une app shopping dédiée que leur audience peut consulter, contrairement à un simple lien en bio générique.\n\nC'est l'une des plateformes les plus établies dans la niche influence mode/lifestyle, avec un réseau de marques partenaires déjà construit, ce qui simplifie la monétisation par rapport à négocier des partenariats individuellement.",
    longDescriptionEn: "LTK (LikeToKnow.it) lets fashion, beauty, and lifestyle creators share affiliate links to products via a dedicated shopping app their audience can browse, unlike a generic link-in-bio.\n\nIt's one of the most established platforms in the fashion/lifestyle influence niche, with an already-built network of partner brands, simplifying monetization compared to negotiating partnerships individually.",
    pricing: "Gratuit pour les créateurs, commission prélevée sur les ventes générées.",
    pricingEn: "Free for creators, commission taken on generated sales.",
    defaultMonthlyPrice: 0,
    pros: ["Réseau de marques partenaires déjà construit, pas besoin de négocier individuellement", "App shopping dédiée que l'audience consulte activement, pas un simple lien", "Référence établie dans la niche mode, beauté et lifestyle"],
    prosEn: ["Already-built partner brand network, no need to negotiate individually", "Dedicated shopping app actively browsed by the audience, not a simple link", "Established reference in the fashion, beauty, and lifestyle niche"],
    cons: ["Surtout pertinent dans les niches mode/beauté/lifestyle, moins adapté ailleurs", "Revenus dépendants de l'audience et du taux de conversion réel", "Concurrence interne avec d'autres créateurs sur la plateforme"],
    consEn: ["Mainly relevant in fashion/beauty/lifestyle niches, less suited elsewhere", "Revenue dependent on audience and real conversion rate", "Internal competition with other creators on the platform"],
    useCases: ["Monétiser une audience mode, beauté ou lifestyle via des liens produits", "Accéder à un réseau de marques partenaires sans négociation individuelle", "Centraliser ses recommandations produits dans une app dédiée au shopping"],
    useCasesEn: ["Monetize a fashion, beauty, or lifestyle audience via product links", "Access a partner brand network with no individual negotiation", "Centralize product recommendations in a dedicated shopping app"],
    verdict: {
      keepIf: ["Tu es créateur dans la mode, la beauté ou le lifestyle avec une audience active", "Tu veux monétiser sans négocier des partenariats individuellement"],
      avoidIf: ["Ta niche n'est pas mode/beauté/lifestyle — l'audience LTK n'y est pas adaptée", "Ton audience est encore trop petite pour générer des ventes significatives"],
      threshold: "Pertinent une fois une audience établie dans la niche mode/beauté/lifestyle.",
    },
    verdictEn: {
      keepIf: ["You're a creator in fashion, beauty, or lifestyle with an active audience", "You want to monetize with no individual partnership negotiation"],
      avoidIf: ["Your niche isn't fashion/beauty/lifestyle — the LTK audience doesn't fit there", "Your audience is still too small to generate significant sales"],
      threshold: "Worth it once you have an established audience in the fashion/beauty/lifestyle niche.",
    },
  },
  trainerize: {
    shortDescription: "Application de coaching fitness à distance pour gérer ses clients et leurs programmes d'entraînement.",
    shortDescriptionEn: "Remote fitness coaching app to manage clients and their training programs.",
    longDescription: "Trainerize permet à un coach sportif de créer des programmes d'entraînement personnalisés, suivre les progrès de ses clients à distance, et communiquer via l'app — une alternative au suivi par feuille de calcul ou messages dispersés.\n\nPour un coach indépendant qui veut scaler son activité au-delà du suivi en personne, c'est un outil structurant pour gérer plusieurs clients simultanément sans perdre en qualité de suivi.",
    longDescriptionEn: "Trainerize lets a fitness coach create personalized training programs, track clients' progress remotely, and communicate via the app — an alternative to spreadsheet tracking or scattered messages.\n\nFor an independent coach wanting to scale their business beyond in-person follow-up, it's a structuring tool to manage several clients simultaneously without losing tracking quality.",
    pricing: "À partir de ~5$/mois par client actif, selon le plan.",
    pricingEn: "From ~$5/month per active client, depending on the plan.",
    pros: ["Structure le suivi client à distance, remplace les feuilles de calcul dispersées", "Permet de scaler le nombre de clients suivis sans perdre en qualité", "App client dédiée qui améliore l'engagement et l'adhésion au programme"],
    prosEn: ["Structures remote client tracking, replaces scattered spreadsheets", "Lets you scale the number of clients tracked without losing quality", "Dedicated client app that improves engagement and program adherence"],
    cons: ["Coût par client actif qui monte avec le nombre de clients suivis", "Courbe d'apprentissage pour bien configurer les programmes types", "Moins pertinent pour un coach qui suit très peu de clients en personne"],
    consEn: ["Per-active-client cost that rises with the number of clients tracked", "Learning curve to properly set up template programs", "Less relevant for a coach tracking very few clients in person"],
    useCases: ["Suivre plusieurs clients de coaching fitness à distance simultanément", "Créer des programmes d'entraînement personnalisés réutilisables", "Scaler une activité de coaching au-delà du suivi en personne uniquement"],
    useCasesEn: ["Track several remote fitness coaching clients simultaneously", "Create reusable personalized training programs", "Scale a coaching business beyond in-person-only tracking"],
    verdict: {
      keepIf: ["Tu coaches plusieurs clients à distance et veux structurer le suivi", "Tu veux scaler ton activité de coaching sans perdre en qualité de suivi"],
      avoidIf: ["Tu coaches très peu de clients, tous en personne — l'outil est surdimensionné", "Le coût par client actif dépasse ce que tu factures pour ce service"],
      threshold: "Pertinent dès que tu coaches plusieurs clients à distance simultanément.",
    },
    verdictEn: {
      keepIf: ["You coach several remote clients and want to structure tracking", "You want to scale your coaching business without losing tracking quality"],
      avoidIf: ["You coach very few clients, all in person — the tool is overkill", "The per-active-client cost exceeds what you bill for this service"],
      threshold: "Worth it once you coach several remote clients simultaneously.",
    },
  },
};

let updated = 0;
for (const [slug, fields] of Object.entries(CONTENT)) {
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  if (!tool) { console.warn(`⚠️  ${slug} not found`); continue; }
  for (const [key, value] of Object.entries(fields)) tool[key] = value;
  if (fields.longDescription) tool.description = fields.longDescription;
  if (ANGLES[slug]) tool.seo = Object.assign({}, tool.seo, { aiAngle: ANGLES[slug] });
  updated++;
  console.log(`✓ ${tool.name} (${slug}) contenu complet${ANGLES[slug] ? " + aiAngle" : ""}`);
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated} fiches mises à jour.`);
