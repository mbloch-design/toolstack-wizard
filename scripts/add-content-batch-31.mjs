/** add-content-batch-31.mjs — contenu complet pour Vidyard,
 * Repurpose.io, Memberful, ShopMy, Maven, TrueCoach + aiAngle pour
 * Kling AI et Magnific AI (déjà bien remplis). */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  "kling-ai": {
    stance: "augmente",
    augmentFr: "Kling AI est lui-même un générateur vidéo IA concurrent de Runway et Sora — la question n'est pas de savoir si l'IA l'augmente, mais quelles productions vidéo classiques sont challengées par son existence.",
    augmentEn: "Kling AI is itself an AI video generator competing with Runway and Sora — the question isn't whether AI augments it, but which classic video productions are challenged by its existence.",
    replaceFr: "Kling AI remplace-t-il un tournage vidéo classique ? Pour des concepts visuels expérimentaux ou des budgets serrés, oui en partie. Pour une production avec des acteurs réels et un contrôle narratif fin, le tournage classique reste nécessaire. Verdict : Kling challenge les petites productions à petit budget, pas le cinéma narratif complexe.",
    replaceEn: "Does Kling AI replace classic video shooting? For experimental visual concepts or tight budgets, partly yes. For a production with real actors and fine narrative control, classic shooting remains necessary. Verdict: Kling challenges small low-budget productions, not complex narrative filmmaking.",
    aiTools: ["runway"],
  },
  "magnific-ai": {
    stance: "augmente",
    augmentFr: "Magnific AI combine plus de 40 modèles de génération (image, vidéo, 3D) dans une seule plateforme, se positionnant comme un hub multi-modèles plutôt qu'un concurrent frontal d'un seul générateur spécialisé.",
    augmentEn: "Magnific AI combines over 40 generation models (image, video, 3D) into a single platform, positioning itself as a multi-model hub rather than a head-on competitor to a single specialized generator.",
    replaceFr: "Magnific AI remplace-t-il un designer ou photographe ? Pour des visuels génériques ou de l'upscaling, oui en partie. Pour une direction artistique de marque cohérente, l'expertise humaine reste différenciante. Verdict : l'IA augmente fortement la production visuelle, sans remplacer la direction artistique experte.",
    replaceEn: "Does Magnific AI replace a designer or photographer? For generic visuals or upscaling, partly yes. For coherent brand art direction, human expertise remains differentiating. Verdict: AI strongly augments visual production, without replacing expert art direction.",
    aiTools: ["midjourney"],
  },
};

const CONTENT = {
  vidyard: {
    shortDescription: "Hébergement vidéo pour les équipes commerciales, avec suivi d'engagement par prospect.",
    shortDescriptionEn: "Video hosting for sales teams, with per-prospect engagement tracking.",
    longDescription: "Vidyard permet aux commerciaux d'enregistrer et envoyer des vidéos personnalisées à des prospects (pitch, démo, suivi), avec un suivi précis de qui a regardé la vidéo et jusqu'où — un signal d'engagement précieux pour prioriser les relances.\n\nPour une équipe sales B2B, c'est un moyen de se différencier d'un email texte classique en y intégrant un message vidéo personnalisé, avec des données d'engagement directement exploitables dans le CRM.",
    longDescriptionEn: "Vidyard lets salespeople record and send personalized videos to prospects (pitch, demo, follow-up), with precise tracking of who watched the video and how far — a valuable engagement signal to prioritize follow-ups.\n\nFor a B2B sales team, it's a way to differentiate from a classic text email by embedding a personalized video message, with engagement data directly usable in the CRM.",
    pricing: "Plan gratuit limité ; plans payants à partir de ~15$/mois par utilisateur.",
    pricingEn: "Limited free plan; paid plans from ~$15/month per user.",
    pros: ["Suivi précis de l'engagement vidéo par prospect, signal utile pour prioriser", "Vidéo personnalisée qui se différencie d'un email texte classique", "Intégration directe avec les CRM commerciaux courants"],
    prosEn: ["Precise per-prospect video engagement tracking, a useful signal to prioritize", "Personalized video that differentiates from a classic text email", "Direct integration with common sales CRMs"],
    cons: ["Demande un effort de production vidéo répété pour chaque prospect", "Coût par utilisateur qui monte avec la taille de l'équipe sales", "Moins pertinent si l'équipe n'est pas à l'aise devant la caméra"],
    consEn: ["Requires repeated video production effort for each prospect", "Per-user cost rises with sales team size", "Less relevant if the team isn't comfortable on camera"],
    useCases: ["Envoyer des pitchs ou démos vidéo personnalisées à des prospects B2B", "Suivre l'engagement vidéo pour prioriser les relances commerciales", "Se différencier d'un email texte classique dans une stratégie de prospection"],
    useCasesEn: ["Send personalized video pitches or demos to B2B prospects", "Track video engagement to prioritize sales follow-ups", "Differentiate from a classic text email in a prospecting strategy"],
    verdict: {
      keepIf: ["Ton équipe sales B2B est à l'aise pour produire des vidéos personnalisées", "Le suivi d'engagement vidéo apporterait un signal utile à ta prospection"],
      avoidIf: ["Ton équipe n'est pas à l'aise devant la caméra ou n'a pas le temps de produire des vidéos", "Ton volume de prospects est trop faible pour justifier l'outil"],
      threshold: "Pertinent pour une équipe sales B2B qui veut se différencier par la vidéo personnalisée.",
    },
    verdictEn: {
      keepIf: ["Your B2B sales team is comfortable producing personalized videos", "Video engagement tracking would add a useful signal to your prospecting"],
      avoidIf: ["Your team isn't comfortable on camera or doesn't have time to produce videos", "Your prospect volume is too low to justify the tool"],
      threshold: "Worth it for a B2B sales team wanting to differentiate through personalized video.",
    },
  },
  "repurpose-io": {
    shortDescription: "Automatise la republication de contenu d'un format vers d'autres plateformes sociales.",
    shortDescriptionEn: "Automates republishing content from one format to other social platforms.",
    longDescription: "Repurpose.io automatise la transformation et republication d'un contenu source (vidéo YouTube, podcast) vers d'autres formats et plateformes (clips TikTok, posts Instagram, épisodes audio) sans intervention manuelle répétée à chaque publication.\n\nPour un créateur qui produit un contenu principal régulièrement, c'est un moyen de maximiser sa présence multi-plateforme sans recréer manuellement chaque format à chaque fois.",
    longDescriptionEn: "Repurpose.io automates transforming and republishing source content (YouTube video, podcast) into other formats and platforms (TikTok clips, Instagram posts, audio episodes) with no repeated manual intervention at each publication.\n\nFor a creator regularly producing main content, it's a way to maximize multi-platform presence without manually recreating each format every time.",
    pricing: "À partir de ~15$/mois selon le nombre d'automatisations.",
    pricingEn: "From ~$15/month depending on the number of automations.",
    pros: ["Automatise la republication répétitive sur plusieurs plateformes", "Gain de temps réel pour qui produit un contenu source régulier", "Couvre de nombreuses combinaisons de plateformes sources et destinations"],
    prosEn: ["Automates repetitive republishing across multiple platforms", "Real time savings for those regularly producing source content", "Covers many source and destination platform combinations"],
    cons: ["Automatisation pure, sans optimisation créative du contenu transformé", "Coût mensuel récurrent pour une tâche qui pourrait être manuelle à petit volume", "Demande un contenu source régulier pour rentabiliser l'abonnement"],
    consEn: ["Pure automation, with no creative optimization of the transformed content", "Recurring monthly cost for a task that could be manual at small volume", "Requires regular source content to make the subscription worthwhile"],
    useCases: ["Republier automatiquement un podcast en clips vidéo sur plusieurs plateformes", "Maximiser la présence multi-plateforme sans recréer chaque format manuellement", "Gagner du temps sur la distribution répétitive de contenu"],
    useCasesEn: ["Automatically republish a podcast as video clips on multiple platforms", "Maximize multi-platform presence without manually recreating each format", "Save time on repetitive content distribution"],
    verdict: {
      keepIf: ["Tu produis un contenu source régulier (podcast, vidéo) à redistribuer", "Tu veux automatiser la republication répétitive sur plusieurs plateformes"],
      avoidIf: ["Tu publies peu souvent — la republication manuelle reste gérable", "Tu préfères adapter créativement chaque format plutôt que de l'automatiser"],
      threshold: "Pertinent dès que la republication manuelle répétitive devient une vraie charge de temps.",
    },
    verdictEn: {
      keepIf: ["You produce regular source content (podcast, video) to redistribute", "You want to automate repetitive republishing across multiple platforms"],
      avoidIf: ["You publish infrequently — manual republishing remains manageable", "You prefer creatively adapting each format rather than automating it"],
      threshold: "Worth it once repetitive manual republishing becomes a real time burden.",
    },
  },
  memberful: {
    shortDescription: "Plateforme d'abonnement et de membership pour monétiser du contenu exclusif, intégrée à WordPress.",
    shortDescriptionEn: "Subscription and membership platform to monetize exclusive content, integrated with WordPress.",
    longDescription: "Memberful permet de créer un programme d'abonnement payant donnant accès à du contenu exclusif, en s'intégrant directement à un site WordPress, une newsletter ou un podcast existant plutôt que d'imposer une plateforme séparée comme Patreon.\n\nPour un créateur qui a déjà un site ou une audience établie, c'est un moyen de monétiser sans rediriger son audience vers une plateforme tierce, en gardant le contrôle de la marque et de l'expérience utilisateur.",
    longDescriptionEn: "Memberful lets you create a paid subscription program granting access to exclusive content, integrating directly with an existing WordPress site, newsletter, or podcast rather than imposing a separate platform like Patreon.\n\nFor a creator who already has a site or established audience, it's a way to monetize without redirecting the audience to a third-party platform, keeping control of the brand and user experience.",
    pricing: "Gratuit jusqu'à un certain volume ; commission de 4,9% à 10% selon le plan au-delà.",
    pricingEn: "Free up to a certain volume; 4.9% to 10% commission depending on the plan beyond that.",
    pros: ["Intégration directe au site existant, pas de redirection vers une plateforme tierce", "Garde le contrôle de la marque et de l'expérience utilisateur", "Commission compétitive comparée à des plateformes comme Patreon"],
    prosEn: ["Direct integration with the existing site, no redirect to a third-party platform", "Keeps control of the brand and user experience", "Competitive commission compared to platforms like Patreon"],
    cons: ["Demande déjà un site ou une infrastructure existante pour bien fonctionner", "Moins de découvrabilité qu'une plateforme avec sa propre audience comme Patreon", "Configuration technique initiale plus complexe qu'une plateforme tout-en-un"],
    consEn: ["Requires an already existing site or infrastructure to work well", "Less discoverability than a platform with its own audience like Patreon", "More complex initial technical setup than an all-in-one platform"],
    useCases: ["Monétiser un site, une newsletter ou un podcast existant par abonnement", "Garder le contrôle de la marque plutôt que dépendre d'une plateforme tierce", "Offrir du contenu exclusif à une audience déjà fidèle sur son propre site"],
    useCasesEn: ["Monetize an existing site, newsletter, or podcast via subscription", "Keep brand control rather than depending on a third-party platform", "Offer exclusive content to an already loyal audience on your own site"],
    verdict: {
      keepIf: ["Tu as déjà un site ou une audience établie et veux garder le contrôle de la marque", "Tu préfères une commission plus compétitive que Patreon"],
      avoidIf: ["Tu n'as pas encore de site ou d'infrastructure existante — Patreon est plus simple à démarrer", "Tu veux profiter de la découvrabilité d'une plateforme avec sa propre audience"],
      threshold: "Pertinent si tu as déjà une audience sur ton propre site et veux garder le contrôle de la marque.",
    },
    verdictEn: {
      keepIf: ["You already have a site or established audience and want to keep brand control", "You prefer a more competitive commission than Patreon"],
      avoidIf: ["You don't yet have a site or existing infrastructure — Patreon is simpler to start with", "You want to benefit from the discoverability of a platform with its own audience"],
      threshold: "Worth it if you already have an audience on your own site and want to keep brand control.",
    },
  },
  shopmy: {
    shortDescription: "Plateforme de liens shoppables pour influenceurs mode, beauté et lifestyle, alternative à LTK.",
    shortDescriptionEn: "Shoppable link platform for fashion, beauty, and lifestyle influencers, an alternative to LTK.",
    longDescription: "ShopMy permet aux créateurs de partager des liens vers des produits recommandés et de toucher une commission sur les ventes, avec une interface plus moderne et un réseau de marques en croissance rapide, positionné comme alternative à LTK pour les créateurs lifestyle.\n\nLa différence principale avec LTK est souvent une interface plus actuelle et des conditions de commission perçues comme plus avantageuses par certains créateurs, bien que le réseau de marques partenaires soit encore en construction comparé à LTK.",
    longDescriptionEn: "ShopMy lets creators share links to recommended products and earn a commission on sales, with a more modern interface and a rapidly growing brand network, positioned as an alternative to LTK for lifestyle creators.\n\nThe main difference with LTK is often a more current interface and commission terms perceived as more favorable by some creators, although the partner brand network is still being built compared to LTK.",
    pricing: "Gratuit pour les créateurs, commission prélevée sur les ventes générées.",
    pricingEn: "Free for creators, commission taken on generated sales.",
    defaultMonthlyPrice: 0,
    pros: ["Interface plus moderne que des concurrents établis comme LTK", "Réseau de marques en croissance rapide avec de nouvelles opportunités", "Conditions de commission perçues comme avantageuses par certains créateurs"],
    prosEn: ["More modern interface than established competitors like LTK", "Rapidly growing brand network with new opportunities", "Commission terms perceived as favorable by some creators"],
    cons: ["Réseau de marques partenaires encore moins étendu que LTK, plus établi", "Plateforme plus récente, moins de retours d'expérience à long terme", "Surtout pertinent dans les mêmes niches mode/beauté/lifestyle que LTK"],
    consEn: ["Partner brand network still less extensive than the more established LTK", "Newer platform, less long-term track record", "Mainly relevant in the same fashion/beauty/lifestyle niches as LTK"],
    useCases: ["Monétiser une audience mode, beauté ou lifestyle via des liens produits", "Tester une alternative à LTK avec une interface plus moderne", "Diversifier ses sources de revenus d'affiliation entre plusieurs plateformes"],
    useCasesEn: ["Monetize a fashion, beauty, or lifestyle audience via product links", "Test an alternative to LTK with a more modern interface", "Diversify affiliate income sources across multiple platforms"],
    verdict: {
      keepIf: ["Tu es créateur lifestyle et veux tester une alternative à LTK", "Tu préfères une interface plus moderne pour gérer tes liens"],
      avoidIf: ["Tu es déjà bien installé sur LTK avec de bons résultats", "Ta niche n'est pas mode/beauté/lifestyle"],
      threshold: "Pertinent à tester en complément de LTK pour diversifier ses revenus d'affiliation.",
    },
    verdictEn: {
      keepIf: ["You're a lifestyle creator and want to test an LTK alternative", "You prefer a more modern interface to manage your links"],
      avoidIf: ["You're already well-established on LTK with good results", "Your niche isn't fashion/beauty/lifestyle"],
      threshold: "Worth testing alongside LTK to diversify affiliate income.",
    },
  },
  maven: {
    shortDescription: "Plateforme de cours en ligne en direct, animés par des experts plutôt que pré-enregistrés.",
    shortDescriptionEn: "Live online course platform, taught by experts rather than pre-recorded.",
    longDescription: "Maven se différencie des plateformes de cours pré-enregistrés (Udemy, Teachable) en se concentrant sur des cours en direct, en cohorte, animés par des experts reconnus dans leur domaine — un format plus engageant et interactif qu'une vidéo statique.\n\nPour un expert qui veut monétiser son savoir sans produire un cours pré-enregistré complexe, c'est un format plus rapide à lancer, au prix d'un engagement de temps récurrent pour animer chaque session live.",
    longDescriptionEn: "Maven differentiates itself from pre-recorded course platforms (Udemy, Teachable) by focusing on live, cohort-based courses taught by recognized domain experts — a more engaging, interactive format than a static video.\n\nFor an expert wanting to monetize their knowledge without producing a complex pre-recorded course, it's a faster format to launch, at the cost of a recurring time commitment to host each live session.",
    pricing: "Gratuit pour créer un cours ; commission sur les ventes (~10%).",
    pricingEn: "Free to create a course; commission on sales (~10%).",
    defaultMonthlyPrice: 0,
    pros: ["Format en direct plus engageant qu'un cours pré-enregistré statique", "Lancement plus rapide qu'un cours vidéo complet à produire", "Positionnement premium qui justifie souvent un prix plus élevé"],
    prosEn: ["Live format more engaging than a static pre-recorded course", "Faster to launch than a full video course to produce", "Premium positioning that often justifies a higher price"],
    cons: ["Engagement de temps récurrent pour animer chaque session en direct", "Moins scalable qu'un cours pré-enregistré vendu en illimité", "Dépend de la capacité à recruter des participants pour chaque cohorte"],
    consEn: ["Recurring time commitment to host each live session", "Less scalable than a pre-recorded course sold unlimited", "Depends on the ability to recruit participants for each cohort"],
    useCases: ["Monétiser une expertise via un cours en direct sans produire de vidéo pré-enregistrée", "Créer un format de formation plus interactif et engageant", "Tester une offre de formation rapidement avant d'investir dans un cours complet"],
    useCasesEn: ["Monetize expertise via a live course with no pre-recorded video to produce", "Create a more interactive and engaging training format", "Quickly test a training offer before investing in a full course"],
    verdict: {
      keepIf: ["Tu es expert dans un domaine et veux monétiser rapidement sans produire de cours vidéo", "Tu es à l'aise pour animer des sessions en direct récurrentes"],
      avoidIf: ["Tu préfères un revenu passif sans engagement de temps récurrent — un cours pré-enregistré convient mieux", "Tu n'as pas le temps d'animer des cohortes régulièrement"],
      threshold: "Pertinent pour un expert qui veut monétiser rapidement et est à l'aise en direct.",
    },
    verdictEn: {
      keepIf: ["You're an expert in a field and want to monetize quickly without producing a video course", "You're comfortable hosting recurring live sessions"],
      avoidIf: ["You prefer passive income with no recurring time commitment — a pre-recorded course fits better", "You don't have time to host cohorts regularly"],
      threshold: "Worth it for an expert who wants to monetize quickly and is comfortable live.",
    },
  },
  truecoach: {
    shortDescription: "Application de coaching fitness à distance, alternative à Trainerize.",
    shortDescriptionEn: "Remote fitness coaching app, an alternative to Trainerize.",
    longDescription: "TrueCoach est un concurrent direct de Trainerize pour le coaching fitness à distance : création de programmes personnalisés, suivi de progrès, communication avec les clients — les deux outils couvrent un besoin très similaire.\n\nLa différence se joue surtout sur l'interface et certaines fonctionnalités spécifiques (templates d'exercices, intégrations) ; le choix dépend souvent d'une préférence personnelle après avoir testé les deux.",
    longDescriptionEn: "TrueCoach is a direct competitor to Trainerize for remote fitness coaching: creating personalized programs, tracking progress, communicating with clients — both tools cover a very similar need.\n\nThe difference mostly comes down to interface and certain specific features (exercise templates, integrations); the choice often depends on personal preference after trying both.",
    pricing: "À partir de ~5$/mois par client actif, selon le plan.",
    pricingEn: "From ~$5/month per active client, depending on the plan.",
    pros: ["Bibliothèque d'exercices avec vidéos de démonstration intégrées", "Structure le suivi client à distance, remplace les feuilles de calcul dispersées", "Permet de scaler le nombre de clients suivis sans perdre en qualité"],
    prosEn: ["Exercise library with built-in demonstration videos", "Structures remote client tracking, replaces scattered spreadsheets", "Lets you scale the number of clients tracked without losing quality"],
    cons: ["Coût par client actif qui monte avec le nombre de clients suivis", "Très proche de Trainerize en fonctionnalités, peu de différenciation nette", "Moins pertinent pour un coach qui suit très peu de clients en personne"],
    consEn: ["Per-active-client cost that rises with the number of clients tracked", "Very close to Trainerize in features, little clear differentiation", "Less relevant for a coach tracking very few clients in person"],
    useCases: ["Suivre plusieurs clients de coaching fitness à distance simultanément", "Créer des programmes d'entraînement avec vidéos de démonstration intégrées", "Scaler une activité de coaching au-delà du suivi en personne uniquement"],
    useCasesEn: ["Track several remote fitness coaching clients simultaneously", "Create training programs with built-in demonstration videos", "Scale a coaching business beyond in-person-only tracking"],
    verdict: {
      keepIf: ["Tu coaches plusieurs clients à distance et veux structurer le suivi", "Tu préfères la bibliothèque d'exercices vidéo de TrueCoach à celle de Trainerize"],
      avoidIf: ["Tu coaches très peu de clients, tous en personne — l'outil est surdimensionné", "Tu as déjà testé et préfères Trainerize"],
      threshold: "Équivalent à Trainerize ; le choix dépend surtout d'une préférence d'interface après test des deux.",
    },
    verdictEn: {
      keepIf: ["You coach several remote clients and want to structure tracking", "You prefer TrueCoach's video exercise library to Trainerize's"],
      avoidIf: ["You coach very few clients, all in person — the tool is overkill", "You've already tried and prefer Trainerize"],
      threshold: "Equivalent to Trainerize; the choice mostly comes down to interface preference after trying both.",
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
