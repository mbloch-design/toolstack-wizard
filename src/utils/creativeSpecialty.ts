import type { CreativeSpecialty, Tool } from "@/types/diagnostic";

export type CreativeSpecialtyRead = {
  id: CreativeSpecialty;
  scoringToolIds: readonly string[];
  scoringKeywords: readonly string[];
  labelFr: string;
  labelEn: string;
  sidebarLabelFr: string;
  sidebarLabelEn: string;
  sidebarDetailFr: string;
  sidebarDetailEn: string;
  thesisFluidFr: string;
  thesisFluidEn: string;
  thesisCoreFr: string;
  thesisCoreEn: string;
  preVerdictTitleFr: string;
  preVerdictTitleEn: string;
  preVerdictDescriptionFr: string;
  preVerdictDescriptionEn: string;
  readingSteps: readonly { fr: string; en: string }[];
  chainTitleFr: string;
  chainTitleEn: string;
  chainDescriptionFr: string;
  chainDescriptionEn: string;
  discoveryQuestionFr: string;
  discoveryQuestionEn: string;
  discoveryOptions: readonly {
    labelFr: string;
    labelEn: string;
    impact: "keep" | "review" | "cancel";
  }[];
  preVerdictCards: readonly {
    labelFr: string;
    labelEn: string;
    detailFr: string;
    detailEn: string;
  }[];
};

export const DEFAULT_CREATIVE_SPECIALTY: CreativeSpecialty = "brand_identity";

export const CREATIVE_SPECIALTY_READS: Record<CreativeSpecialty, CreativeSpecialtyRead> = {
  brand_identity: {
    id: "brand_identity",
    scoringToolIds: [
      "adobe-illustrator",
      "adobe-photoshop",
      "indesign",
      "figma",
      "canva",
      "affinity-photo",
      "fontbase",
      "rightfont",
      "envato-elements",
      "icons8",
      "noun-project",
      "dynamic-mockups",
      "hugeicons",
      "brandpad",
      "adobe-cc",
    ],
    scoringKeywords: ["brand", "identity", "identité", "font", "mockup", "asset", "icon", "template", "illustrator", "photoshop", "canva", "figma"],
    labelFr: "Identité / DA",
    labelEn: "Brand / art direction",
    sidebarLabelFr: "Angle marque",
    sidebarLabelEn: "Brand angle",
    sidebarDetailFr: "Identité, supports, fonts, mockups, droits et validation.",
    sidebarDetailEn: "Identity, collateral, fonts, mockups, rights and review.",
    thesisFluidFr: "le vrai sujet est la cohérence de ta chaîne marque : produire vite sans disperser les assets, fonts et droits.",
    thesisFluidEn: "the real topic is brand-chain consistency: producing fast without scattering assets, fonts and rights.",
    thesisCoreFr: "ta stack marque repose surtout sur les outils principaux. Il faut vérifier les ressources, fonts, mockups et droits autour.",
    thesisCoreEn: "your brand stack mostly relies on core tools. We need to check resources, fonts, mockups and rights around them.",
    preVerdictTitleFr: "Ta chaîne marque est prête à lire.",
    preVerdictTitleEn: "Your brand chain is ready to read.",
    preVerdictDescriptionFr: "Je vais lire la production d’identité, les ressources, les fonts, les mockups, les droits et la validation client. Le risque n’est pas seulement le coût, c’est la dispersion.",
    preVerdictDescriptionEn: "I will read identity production, resources, fonts, mockups, rights and client review. The risk is not only cost, it is dispersion.",
    readingSteps: [
      { fr: "Identité", en: "Identity" },
      { fr: "Ressources", en: "Resources" },
      { fr: "Droits", en: "Rights" },
    ],
    chainTitleFr: "Ta stack comme une chaîne de marque",
    chainTitleEn: "Your stack as a brand chain",
    chainDescriptionFr: "On sépare création, ressources réutilisables, validations et droits d’usage.",
    chainDescriptionEn: "We separate creation, reusable resources, reviews and usage rights.",
    discoveryQuestionFr: "Pour ton activité identité/DA, le point à clarifier est plutôt ?",
    discoveryQuestionEn: "For brand/art direction work, what needs clarification most?",
    discoveryOptions: [
      { labelFr: "Fonts, mockups ou droits d’usage", labelEn: "Fonts, mockups or usage rights", impact: "review" },
      { labelFr: "Validation client et versions finales", labelEn: "Client review and final versions", impact: "review" },
      { labelFr: "Déclinaisons de supports", labelEn: "Collateral variations", impact: "keep" },
      { labelFr: "Tout est déjà cadré", labelEn: "Everything is already framed", impact: "keep" },
    ],
    preVerdictCards: [
      { labelFr: "1. Créer", labelEn: "1. Create", detailFr: "Les outils qui fabriquent l’identité et les supports.", detailEn: "The tools that create identity and collateral." },
      { labelFr: "2. Réutiliser", labelEn: "2. Reuse", detailFr: "Fonts, templates, mockups et assets qui évitent de repartir de zéro.", detailEn: "Fonts, templates, mockups and assets that avoid restarting from scratch." },
      { labelFr: "3. Sécuriser", labelEn: "3. Secure", detailFr: "Droits, licences, validation client et livrables finaux.", detailEn: "Rights, licenses, client review and final deliverables." },
    ],
  },
  ui_product: {
    id: "ui_product",
    scoringToolIds: [
      "figma",
      "figma-tokens",
      "figma-iconify",
      "figma-stark",
      "figma-anima",
      "figma-slides",
      "zeplin",
      "protopie",
      "rive",
      "spline",
      "framer",
      "webflow-framer",
      "sketch",
      "hugeicons",
    ],
    scoringKeywords: ["ui", "ux", "prototype", "handoff", "design system", "component", "token", "accessibility", "a11y", "framer", "webflow"],
    labelFr: "UI / Produit",
    labelEn: "UI / Product",
    sidebarLabelFr: "Angle produit",
    sidebarLabelEn: "Product design angle",
    sidebarDetailFr: "Design system, composants, handoff, prototypes et accessibilité.",
    sidebarDetailEn: "Design system, components, handoff, prototypes and accessibility.",
    thesisFluidFr: "le vrai sujet est la continuité entre design, système, prototype et passage aux équipes.",
    thesisFluidEn: "the real topic is continuity between design, system, prototype and handoff.",
    thesisCoreFr: "ta stack UI repose surtout sur les outils principaux. Il faut vérifier plugins, tokens, accessibilité et handoff.",
    thesisCoreEn: "your UI stack mostly relies on core tools. We need to check plugins, tokens, accessibility and handoff.",
    preVerdictTitleFr: "Ta chaîne design produit est prête à lire.",
    preVerdictTitleEn: "Your product design chain is ready to read.",
    preVerdictDescriptionFr: "Je vais lire le flux interface : conception, composants, tokens, prototype, handoff et validation. Le sujet est la friction entre design et livraison.",
    preVerdictDescriptionEn: "I will read the interface flow: design, components, tokens, prototype, handoff and review. The topic is friction between design and delivery.",
    readingSteps: [
      { fr: "Système", en: "System" },
      { fr: "Handoff", en: "Handoff" },
      { fr: "Qualité", en: "Quality" },
    ],
    chainTitleFr: "Ta stack comme une chaîne produit",
    chainTitleEn: "Your stack as a product chain",
    chainDescriptionFr: "On lit le passage de l’idée au composant, puis du composant au livrable.",
    chainDescriptionEn: "We read the path from idea to component, then from component to deliverable.",
    discoveryQuestionFr: "Sur ton workflow UI/produit, qu’est-ce qui mérite d’être vérifié ?",
    discoveryQuestionEn: "In your UI/product workflow, what deserves checking?",
    discoveryOptions: [
      { labelFr: "Tokens, composants ou librairie", labelEn: "Tokens, components or library", impact: "review" },
      { labelFr: "Handoff dev et prototype", labelEn: "Dev handoff and prototype", impact: "review" },
      { labelFr: "Accessibilité et QA design", labelEn: "Accessibility and design QA", impact: "review" },
      { labelFr: "Le flux est déjà net", labelEn: "The flow is already clear", impact: "keep" },
    ],
    preVerdictCards: [
      { labelFr: "1. Concevoir", labelEn: "1. Design", detailFr: "Les outils qui portent les écrans, composants et systèmes.", detailEn: "The tools carrying screens, components and systems." },
      { labelFr: "2. Transmettre", labelEn: "2. Handoff", detailFr: "Plugins, tokens, prototypes et relais vers la production.", detailEn: "Plugins, tokens, prototypes and relay to production." },
      { labelFr: "3. Fiabiliser", labelEn: "3. Make reliable", detailFr: "Accessibilité, cohérence, validation et dette design.", detailEn: "Accessibility, consistency, review and design debt." },
    ],
  },
  motion_video: {
    id: "motion_video",
    scoringToolIds: [
      "adobe-after-effects",
      "adobe-premiere-pro",
      "davinci-resolve",
      "capcut",
      "runway",
      "ae-bodymovin",
      "lottiefiles",
      "ae-animation-composer",
      "motion-bro",
      "ae-overlord",
      "ae-duik",
      "ae-gifgun",
      "ae-red-giant",
      "topaz-video-ai",
      "descript",
      "frame-io",
      "motion-array",
    ],
    scoringKeywords: ["motion", "video", "vidéo", "animation", "subtitle", "premiere", "after effects", "lottie", "template", "review", "export"],
    labelFr: "Motion / Vidéo",
    labelEn: "Motion / Video",
    sidebarLabelFr: "Angle motion",
    sidebarLabelEn: "Motion angle",
    sidebarDetailFr: "Montage, animation, plugins, sous-titres, review et exports.",
    sidebarDetailEn: "Editing, animation, plugins, subtitles, review and exports.",
    thesisFluidFr: "le vrai sujet est le flux vidéo : produire, accélérer, faire valider et exporter sans multiplier les abonnements.",
    thesisFluidEn: "the real topic is the video flow: produce, accelerate, review and export without multiplying subscriptions.",
    thesisCoreFr: "ta stack motion repose surtout sur les logiciels principaux. Il faut vérifier plugins, templates, IA vidéo et review client.",
    thesisCoreEn: "your motion stack mostly relies on main software. We need to check plugins, templates, video AI and client review.",
    preVerdictTitleFr: "Ta chaîne motion/vidéo est prête à lire.",
    preVerdictTitleEn: "Your motion/video chain is ready to read.",
    preVerdictDescriptionFr: "Je vais lire montage, animation, plugins, IA vidéo, sous-titres, review client et exports. Les gains se cachent souvent dans les extensions et la validation.",
    preVerdictDescriptionEn: "I will read editing, animation, plugins, video AI, subtitles, client review and exports. Gains often hide in extensions and review.",
    readingSteps: [
      { fr: "Produire", en: "Produce" },
      { fr: "Accélérer", en: "Accelerate" },
      { fr: "Valider", en: "Review" },
    ],
    chainTitleFr: "Ta stack comme une chaîne vidéo",
    chainTitleEn: "Your stack as a video chain",
    chainDescriptionFr: "On sépare logiciel principal, plugins, review client, IA et exports.",
    chainDescriptionEn: "We separate main software, plugins, client review, AI and exports.",
    discoveryQuestionFr: "Pour ton flux motion/vidéo, le point le plus flou est plutôt ?",
    discoveryQuestionEn: "For your motion/video flow, what is the least clear point?",
    discoveryOptions: [
      { labelFr: "Plugins/templates vraiment utiles", labelEn: "Actually useful plugins/templates", impact: "review" },
      { labelFr: "Review client et versions", labelEn: "Client review and versions", impact: "review" },
      { labelFr: "IA vidéo ou sous-titres", labelEn: "Video AI or subtitles", impact: "review" },
      { labelFr: "Tout est déjà structuré", labelEn: "Everything is already structured", impact: "keep" },
    ],
    preVerdictCards: [
      { labelFr: "1. Produire", labelEn: "1. Produce", detailFr: "Montage, animation, génération et finition vidéo.", detailEn: "Editing, animation, generation and video finishing." },
      { labelFr: "2. Accélérer", labelEn: "2. Accelerate", detailFr: "Extensions, presets, templates, sous-titres et automatisations.", detailEn: "Extensions, presets, templates, subtitles and automations." },
      { labelFr: "3. Valider", labelEn: "3. Review", detailFr: "Commentaires client, versions, exports et livraison.", detailEn: "Client comments, versions, exports and delivery." },
    ],
  },
  photo_retouch: {
    id: "photo_retouch",
    scoringToolIds: [
      "adobe-lightroom",
      "capture-one",
      "adobe-photoshop",
      "luminar-neo",
      "nik-collection",
      "lightroom-mobile",
      "pixieset",
      "remove-bg",
      "topaz-video-ai",
      "dropbox",
      "wetransfer",
    ],
    scoringKeywords: ["photo", "retouch", "retouche", "raw", "preset", "lightroom", "gallery", "galerie", "pixieset", "export"],
    labelFr: "Photo / Retouche",
    labelEn: "Photo / Retouching",
    sidebarLabelFr: "Angle photo",
    sidebarLabelEn: "Photo angle",
    sidebarDetailFr: "RAW, retouche, presets, galeries, stockage et livraison client.",
    sidebarDetailEn: "RAW, retouching, presets, galleries, storage and client delivery.",
    thesisFluidFr: "le vrai sujet est le passage RAW → retouche → galerie → livraison, avec des plans parfois déjà inclus.",
    thesisFluidEn: "the real topic is the RAW → retouching → gallery → delivery path, with plans sometimes already included.",
    thesisCoreFr: "ta stack photo repose surtout sur les outils de retouche. Il faut vérifier presets, galeries, stockage et livraison client.",
    thesisCoreEn: "your photo stack mostly relies on retouching tools. We need to check presets, galleries, storage and client delivery.",
    preVerdictTitleFr: "Ta chaîne photo est prête à lire.",
    preVerdictTitleEn: "Your photo chain is ready to read.",
    preVerdictDescriptionFr: "Je vais lire retouche, presets, galeries, stockage, livraison client et plans inclus. Le sujet est autant l’expérience client que l’outil principal.",
    preVerdictDescriptionEn: "I will read retouching, presets, galleries, storage, client delivery and included plans. The topic is as much client experience as the main tool.",
    readingSteps: [
      { fr: "Retouche", en: "Retouch" },
      { fr: "Galerie", en: "Gallery" },
      { fr: "Livraison", en: "Delivery" },
    ],
    chainTitleFr: "Ta stack comme une chaîne photo",
    chainTitleEn: "Your stack as a photo chain",
    chainDescriptionFr: "On lit le flux complet : import, retouche, presets, galerie, stockage et preuve client.",
    chainDescriptionEn: "We read the full flow: import, retouching, presets, gallery, storage and client proof.",
    discoveryQuestionFr: "Dans ton flux photo/retouche, qu’est-ce qui est le moins cadré ?",
    discoveryQuestionEn: "In your photo/retouching flow, what is least framed?",
    discoveryOptions: [
      { labelFr: "Presets ou extensions dormantes", labelEn: "Dormant presets or extensions", impact: "review" },
      { labelFr: "Galeries et livraison client", labelEn: "Client galleries and delivery", impact: "review" },
      { labelFr: "Stockage, sauvegarde, exports", labelEn: "Storage, backup, exports", impact: "review" },
      { labelFr: "Le flux est clair", labelEn: "The flow is clear", impact: "keep" },
    ],
    preVerdictCards: [
      { labelFr: "1. Retoucher", labelEn: "1. Retouch", detailFr: "RAW, retouche, IA photo et qualité finale.", detailEn: "RAW, retouching, photo AI and final quality." },
      { labelFr: "2. Répéter", labelEn: "2. Repeat", detailFr: "Presets, packs, automatisations et exports récurrents.", detailEn: "Presets, packs, automations and recurring exports." },
      { labelFr: "3. Livrer", labelEn: "3. Deliver", detailFr: "Galeries client, stockage, preuves et accès.", detailEn: "Client galleries, storage, proof and access." },
    ],
  },
  content_social: {
    id: "content_social",
    scoringToolIds: [
      "canva",
      "canva-pro",
      "canva-templates",
      "adobe-express",
      "figma",
      "adobe-photoshop",
      "midjourney",
      "firefly",
      "krea-ai",
      "runway",
      "ideogram",
      "leonardo-ai",
      "capcut",
      "descript",
      "tella",
      "brevo",
      "mailerlite",
      "google-analytics",
      "hubspot",
      "posthog",
      "hotjar",
    ],
    scoringKeywords: ["content", "contenu", "social", "newsletter", "campaign", "campagne", "publish", "publier", "calendar", "audience", "lead"],
    labelFr: "Contenu social",
    labelEn: "Social content",
    sidebarLabelFr: "Angle contenu",
    sidebarLabelEn: "Content angle",
    sidebarDetailFr: "Idées, visuels, montage court, planning, publication et mesure.",
    sidebarDetailEn: "Ideas, visuals, short editing, planning, publishing and measurement.",
    thesisFluidFr: "le vrai sujet est la cadence : créer, décliner, publier et mesurer sans empiler les outils.",
    thesisFluidEn: "the real topic is cadence: create, repurpose, publish and measure without stacking tools.",
    thesisCoreFr: "ta stack contenu repose surtout sur les outils de création. Il faut vérifier planning, déclinaisons, mesure et IA visuelle.",
    thesisCoreEn: "your content stack mostly relies on creation tools. We need to check planning, repurposing, measurement and visual AI.",
    preVerdictTitleFr: "Ta chaîne contenu est prête à lire.",
    preVerdictTitleEn: "Your content chain is ready to read.",
    preVerdictDescriptionFr: "Je vais lire idées, production, formats courts, déclinaisons, publication, mesure et outils IA. Le sujet est la cadence soutenable.",
    preVerdictDescriptionEn: "I will read ideas, production, short formats, repurposing, publishing, measurement and AI tools. The topic is sustainable cadence.",
    readingSteps: [
      { fr: "Produire", en: "Produce" },
      { fr: "Publier", en: "Publish" },
      { fr: "Mesurer", en: "Measure" },
    ],
    chainTitleFr: "Ta stack comme une chaîne de contenu",
    chainTitleEn: "Your stack as a content chain",
    chainDescriptionFr: "On relie production, planning, publication et mesure au lieu de lire les outils séparément.",
    chainDescriptionEn: "We connect production, planning, publishing and measurement instead of reading tools separately.",
    discoveryQuestionFr: "Pour ton contenu social, quelle étape crée le plus de friction ?",
    discoveryQuestionEn: "For your social content, which step creates the most friction?",
    discoveryOptions: [
      { labelFr: "Décliner les formats", labelEn: "Repurposing formats", impact: "review" },
      { labelFr: "Planifier et publier", labelEn: "Planning and publishing", impact: "review" },
      { labelFr: "Mesurer ce qui marche", labelEn: "Measuring what works", impact: "review" },
      { labelFr: "La cadence est maîtrisée", labelEn: "Cadence is under control", impact: "keep" },
    ],
    preVerdictCards: [
      { labelFr: "1. Créer", labelEn: "1. Create", detailFr: "Visuels, textes, vidéos courtes et IA de production.", detailEn: "Visuals, copy, short videos and production AI." },
      { labelFr: "2. Publier", labelEn: "2. Publish", detailFr: "Calendrier, validation, déclinaisons et automatisations.", detailEn: "Calendar, review, repurposing and automations." },
      { labelFr: "3. Mesurer", labelEn: "3. Measure", detailFr: "Audience, leads, emails, campagnes et performance.", detailEn: "Audience, leads, emails, campaigns and performance." },
    ],
  },
  illustration_3d: {
    id: "illustration_3d",
    scoringToolIds: [
      "procreate",
      "adobe-illustrator",
      "adobe-photoshop",
      "affinity-photo",
      "figma",
      "midjourney",
      "krea-ai",
      "stable-diffusion",
      "leonardo-ai",
      "flux",
      "ideogram",
      "spline",
      "rive",
      "framer",
      "blender",
      "adobe-substance-3d",
      "lottiefiles",
      "ae-bodymovin",
    ],
    scoringKeywords: ["illustration", "3d", "render", "rendu", "drawing", "procreate", "spline", "rive", "blender", "asset", "source"],
    labelFr: "Illustration / 3D",
    labelEn: "Illustration / 3D",
    sidebarLabelFr: "Angle image/3D",
    sidebarLabelEn: "Image/3D angle",
    sidebarDetailFr: "Dessin, rendu, IA, assets, exports et usage des fichiers.",
    sidebarDetailEn: "Drawing, rendering, AI, assets, exports and file usage.",
    thesisFluidFr: "le vrai sujet est le pipeline image : créer, générer, rendre, exporter et réutiliser sans perdre les sources.",
    thesisFluidEn: "the real topic is the image pipeline: create, generate, render, export and reuse without losing sources.",
    thesisCoreFr: "ta stack illustration/3D repose surtout sur les outils de création. Il faut vérifier assets, IA, exports et droits.",
    thesisCoreEn: "your illustration/3D stack mostly relies on creation tools. We need to check assets, AI, exports and rights.",
    preVerdictTitleFr: "Ta chaîne image/3D est prête à lire.",
    preVerdictTitleEn: "Your image/3D chain is ready to read.",
    preVerdictDescriptionFr: "Je vais lire création, génération, rendu, assets, exports, droits et réutilisation. Le sujet est la continuité du pipeline.",
    preVerdictDescriptionEn: "I will read creation, generation, rendering, assets, exports, rights and reuse. The topic is pipeline continuity.",
    readingSteps: [
      { fr: "Créer", en: "Create" },
      { fr: "Rendre", en: "Render" },
      { fr: "Réutiliser", en: "Reuse" },
    ],
    chainTitleFr: "Ta stack comme une chaîne image/3D",
    chainTitleEn: "Your stack as an image/3D chain",
    chainDescriptionFr: "On vérifie la continuité entre création, génération, rendu, export et droits.",
    chainDescriptionEn: "We check continuity between creation, generation, rendering, export and rights.",
    discoveryQuestionFr: "Pour illustration/3D, le point à clarifier est plutôt ?",
    discoveryQuestionEn: "For illustration/3D, what needs clarification most?",
    discoveryOptions: [
      { labelFr: "Exports et formats finaux", labelEn: "Exports and final formats", impact: "review" },
      { labelFr: "Assets, packs ou droits", labelEn: "Assets, packs or rights", impact: "review" },
      { labelFr: "IA générative et sources", labelEn: "Generative AI and source files", impact: "review" },
      { labelFr: "Pipeline déjà stable", labelEn: "Pipeline already stable", impact: "keep" },
    ],
    preVerdictCards: [
      { labelFr: "1. Créer", labelEn: "1. Create", detailFr: "Dessin, illustration, génération, 3D et rendu.", detailEn: "Drawing, illustration, generation, 3D and rendering." },
      { labelFr: "2. Transformer", labelEn: "2. Transform", detailFr: "Formats, exports, animations et intégration web/produit.", detailEn: "Formats, exports, animations and web/product integration." },
      { labelFr: "3. Réutiliser", labelEn: "3. Reuse", detailFr: "Sources, assets, droits et versions finales.", detailEn: "Sources, assets, rights and final versions." },
    ],
  },
  creative_ops: {
    id: "creative_ops",
    scoringToolIds: [
      "stripe",
      "indy",
      "paypal",
      "adobe-cc",
      "adobe-creative-cloud",
      "envato-elements",
      "fontbase",
      "rightfont",
      "brandpad",
      "frame-io",
      "loom",
      "tella",
      "wetransfer",
      "google-drive",
      "dropbox",
      "notion",
      "milanote",
      "airtable",
      "hubspot",
      "brevo",
      "mailerlite",
      "looker-studio",
    ],
    scoringKeywords: ["studio", "ops", "license", "licence", "rights", "droits", "client", "review", "storage", "stockage", "billing", "facturation"],
    labelFr: "Studio / Ops créa",
    labelEn: "Studio / Creative ops",
    sidebarLabelFr: "Angle studio",
    sidebarLabelEn: "Studio angle",
    sidebarDetailFr: "Licences, validation, clients, stockage, facturation et pilotage créatif.",
    sidebarDetailEn: "Licenses, review, clients, storage, billing and creative operations.",
    thesisFluidFr: "le vrai sujet est la maîtrise du studio : droits, validation, clients, facturation et outils partagés.",
    thesisFluidEn: "the real topic is studio control: rights, review, clients, billing and shared tools.",
    thesisCoreFr: "ta stack studio repose surtout sur quelques outils principaux. Il faut vérifier licences, validation, stockage et pilotage client.",
    thesisCoreEn: "your studio stack mostly relies on a few core tools. We need to check licenses, review, storage and client operations.",
    preVerdictTitleFr: "Ta chaîne studio est prête à lire.",
    preVerdictTitleEn: "Your studio chain is ready to read.",
    preVerdictDescriptionFr: "Je vais lire licences, droits, clients, validation, stockage, facturation et outils partagés. Le sujet est la maîtrise opérationnelle.",
    preVerdictDescriptionEn: "I will read licenses, rights, clients, review, storage, billing and shared tools. The topic is operational control.",
    readingSteps: [
      { fr: "Cadrer", en: "Frame" },
      { fr: "Valider", en: "Review" },
      { fr: "Piloter", en: "Operate" },
    ],
    chainTitleFr: "Ta stack comme une chaîne studio",
    chainTitleEn: "Your stack as a studio chain",
    chainDescriptionFr: "On vérifie les points qui protègent le temps, les droits, les clients et la facturation.",
    chainDescriptionEn: "We check the points that protect time, rights, clients and billing.",
    discoveryQuestionFr: "Pour ton studio/ops créa, quel risque mérite le plus d’attention ?",
    discoveryQuestionEn: "For your creative ops/studio, which risk deserves the most attention?",
    discoveryOptions: [
      { labelFr: "Licences et droits partagés", labelEn: "Shared licenses and rights", impact: "review" },
      { labelFr: "Validation client et versions", labelEn: "Client review and versions", impact: "review" },
      { labelFr: "Facturation et suivi", labelEn: "Billing and follow-up", impact: "review" },
      { labelFr: "Le pilotage est clair", labelEn: "Operations are clear", impact: "keep" },
    ],
    preVerdictCards: [
      { labelFr: "1. Cadrer", labelEn: "1. Frame", detailFr: "Briefs, sources, droits, licences et responsabilités.", detailEn: "Briefs, sources, rights, licenses and responsibilities." },
      { labelFr: "2. Valider", labelEn: "2. Review", detailFr: "Clients, commentaires, versions, accès et livrables.", detailEn: "Clients, comments, versions, access and deliverables." },
      { labelFr: "3. Piloter", labelEn: "3. Operate", detailFr: "Budget, facturation, CRM, stockage et outils partagés.", detailEn: "Budget, billing, CRM, storage and shared tools." },
    ],
  },
};

export function isCreativeSpecialty(value?: string): value is CreativeSpecialty {
  return Boolean(value && Object.prototype.hasOwnProperty.call(CREATIVE_SPECIALTY_READS, value));
}

export function getCreativeSpecialtyCopy(value?: string): CreativeSpecialtyRead {
  return CREATIVE_SPECIALTY_READS[isCreativeSpecialty(value) ? value : DEFAULT_CREATIVE_SPECIALTY];
}

function normalizeCreativeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function toolText(tool: Tool) {
  return normalizeCreativeText([
    tool.id,
    tool.slug,
    tool.name,
    tool.name_en,
    tool.category,
    tool.ia_use_case,
    tool.tool_type,
    ...(tool.functional_needs || []),
  ].filter(Boolean).join(" "));
}

export function getCreativeSpecialtyToolAffinity(tool: Tool, value?: string): number {
  if (!isCreativeSpecialty(value)) return 0;

  const specialty = getCreativeSpecialtyCopy(value);
  const normalizedId = normalizeCreativeText(tool.id);
  const exactMatch = specialty.scoringToolIds.some((id) => normalizeCreativeText(id) === normalizedId);
  const text = toolText(tool);
  const keywordMatch = specialty.scoringKeywords.some((keyword) => text.includes(normalizeCreativeText(keyword)));

  let affinity = 0;
  if (exactMatch) affinity += 18;
  if (keywordMatch) affinity += 8;
  if (affinity > 0 && (tool.tool_type === "plugin" || tool.tool_type === "specialise")) affinity += 4;
  if (affinity > 0 && tool.tool_type === "bundle") affinity += 2;

  return Math.min(24, affinity);
}

export function getCreativeSpecialtyProtectedToolIds(value?: string): readonly string[] {
  return isCreativeSpecialty(value) ? getCreativeSpecialtyCopy(value).scoringToolIds : [];
}
