/** add-plugins-c4d-blender.mjs — comble le vrai trou de couverture plugins :
 * Cinema 4D et Blender avaient 0 plugin référencé malgré l'écosystème 3D construit.
 * Crée X-Particles (C4D) et Auto-Rig Pro / Hard Ops+Boxcutter (Blender),
 * et corrige la fiche Skatter (SketchUp) qui existait mais en stub générique
 * (prix faux "Licence payante", pas de host_app). Prix vérifiés juin 2026. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const NEW = [
  {
    id: "x-particles",
    slug: "x-particles",
    name: "X-Particles",
    category: "design-tools",
    shortDescription: "Système de particules et VFX avancé pour Cinema 4D (Insydium).",
    shortDescriptionEn: "Advanced particle and VFX system for Cinema 4D (Insydium).",
    pricing: {
      free: "Démo 15 jours",
      paid: "Via l'abonnement Insydium Fused : env. 38€/mois en 3 mois, ou 36€/mois en annuel (~390£/an).",
    },
    pricingEn: {
      free: "15-day demo",
      paid: "Via the Insydium Fused subscription: about $41/month over 3 months, or $39/month annual (~£390/year).",
    },
    defaultMonthlyPrice: 38,
    affiliateLink: "https://insydium.ltd/products/x-particles/",
    websiteUrl: "https://insydium.ltd/products/x-particles/",
    logo: "",
    longDescription: "X-Particles, c'est le système de particules de référence pour Cinema 4D, utilisé en motion design, VFX et publicité depuis plus de dix ans. Il gère des nuées massives, des fluides, des champs de force et des effets organiques (fumée, feu, eau, destruction) avec un contrôle bien plus fin que les particules natives de C4D.\n\nDepuis quelques années, X-Particles n'est plus vendu seul : il fait partie de l'abonnement Insydium Fused (avec d'autres outils comme Cycles 4D ou TerraformFX), facturé environ 160£ tous les 3 mois, 250£ tous les 6 mois ou 390£ à l'année. Ça revient à payer pour toute la collection même si on n'utilise que les particules. Pour un studio de motion design ou de VFX qui fait des effets organiques régulièrement, ça reste un investissement justifié ; pour un usage ponctuel, le coût de l'abonnement est difficile à amortir.",
    longDescriptionEn: "X-Particles is the reference particle system for Cinema 4D, used in motion design, VFX and advertising for over a decade. It handles massive crowds, fluids, force fields and organic effects (smoke, fire, water, destruction) with far finer control than C4D's native particles.\n\nFor a few years now, X-Particles hasn't been sold standalone: it's part of the Insydium Fused subscription (alongside other tools like Cycles 4D or TerraformFX), billed around £160 every 3 months, £250 every 6 months or £390 a year. That means paying for the whole collection even if you only use the particles. For a motion design or VFX studio doing organic effects regularly, it's a justified investment; for occasional use, the subscription cost is hard to amortize.",
    verdict: {
      keepIf: [
        "Tu fais régulièrement des effets organiques (fumée, feu, fluides, destruction) dans Cinema 4D",
        "Tu utilises aussi les autres outils de la collection Fused (le bundle devient rentable)",
      ],
      avoidIf: [
        "Tu n'as besoin de particules que ponctuellement : l'abonnement Fused est cher pour un usage rare",
        "Les particules natives de Cinema 4D ou Redshift suffisent à ton besoin",
      ],
      threshold: "Pertinent pour un usage régulier d'effets organiques et de particules avancées dans Cinema 4D. Pour un besoin ponctuel, l'abonnement Fused est difficile à rentabiliser.",
    },
    verdictEn: {
      keepIf: [
        "You regularly do organic effects (smoke, fire, fluids, destruction) in Cinema 4D",
        "You also use the other tools in the Fused collection (the bundle becomes worth it)",
      ],
      avoidIf: [
        "You only need particles occasionally: the Fused subscription is pricey for rare use",
        "Cinema 4D's or Redshift's native particles are enough for your need",
      ],
      threshold: "Worth it for regular use of organic effects and advanced particles in Cinema 4D. For occasional need, the Fused subscription is hard to justify.",
    },
    pros: [
      "Référence du marché pour les particules dans Cinema 4D",
      "Gère fumée, feu, fluides, destruction avec un contrôle fin",
      "Intégré aux moteurs de rendu (Redshift, Octane, Arnold)",
      "Communauté et tutoriels abondants",
    ],
    prosEn: [
      "Market reference for particles in Cinema 4D",
      "Handles smoke, fire, fluids, destruction with fine control",
      "Integrated with render engines (Redshift, Octane, Arnold)",
      "Abundant community and tutorials",
    ],
    cons: [
      "Plus vendu seul : abonnement Fused obligatoire (~38€/mois)",
      "Courbe d'apprentissage réelle pour exploiter tout le potentiel",
      "Cher pour un usage ponctuel",
      "Abonnement only, pas de licence perpétuelle",
    ],
    consEn: [
      "No longer sold alone: Fused subscription required (~$41/month)",
      "Real learning curve to use its full potential",
      "Pricey for occasional use",
      "Subscription only, no perpetual license",
    ],
    useCases: [
      "Créer des effets de fumée, feu et destruction dans Cinema 4D",
      "Simuler des fluides et des nuées massives",
      "Générer des effets organiques pour la pub et le motion design",
      "Combiner particules et champs de force pour des animations complexes",
    ],
    useCasesEn: [
      "Create smoke, fire and destruction effects in Cinema 4D",
      "Simulate fluids and massive crowds",
      "Generate organic effects for advertising and motion design",
      "Combine particles and force fields for complex animations",
    ],
    covers: ["3d", "effets-visuels"],
    relevantFor: ["designer", "motion-video"],
    personas: ["designer"],
    soloRelevance: "low",
    teamRelevance: "medium",
    seo: { metaDescription: "X-Particles 2026 : le système de particules pour Cinema 4D (Insydium Fused). Prix réel par abonnement et alternatives. Le verdict ToolTrim." },
    alternatives: ["cinema-4d", "houdini"],
    articles: [],
    freeAlternative: null,
    tool_type: "plugin",
    substitutable: false,
    host_app: "cinema-4d",
    bundle_parent: null,
    verticals: ["motion-video"],
    functional_needs: ["effets-visuels"],
    ia_use_case: null,
    betterAlternative: null,
    migrationGuide: null,
    downgradePlan: null,
    prescription_quality: "question",
    prescription_output: null,
    prescription_block_reasons: [],
    prescription_context_questions: [],
    pricing_v5: {
      cautions: ["Plus vendu à l'unité : uniquement via l'abonnement Insydium Fused"],
      verified_on: "2026-06-20",
      source_domain: "insydium.ltd",
      usage_sensitive: false,
      compare_plan_kind: "subscription",
      compare_plan_name: "Insydium Fused (annuel)",
      price_reliability: "high",
      location_sensitive: false,
      official_source_url: "https://insydium.ltd/products/subscriptions/",
      verification_status: "official_explicit",
      compare_price_monthly_eur: 36,
    },
    substitution_cluster_v2: "plugin-cinema-4d",
  },
  {
    id: "auto-rig-pro",
    slug: "auto-rig-pro",
    name: "Auto-Rig Pro",
    category: "design-tools",
    shortDescription: "Add-on Blender pour rigger des personnages et retargeter des animations.",
    shortDescriptionEn: "Blender add-on to rig characters and retarget animations.",
    pricing: {
      free: "",
      paid: "40$ en licence perpétuelle (achat unique sur Superhive, ex-Blender Market).",
    },
    pricingEn: {
      free: "",
      paid: "$40 perpetual license (one-time purchase on Superhive, formerly Blender Market).",
    },
    defaultMonthlyPrice: 0,
    affiliateLink: "https://superhivemarket.com/products/auto-rig-pro",
    websiteUrl: "https://superhivemarket.com/products/auto-rig-pro",
    logo: "",
    longDescription: "Auto-Rig Pro automatise ce qui prend normalement des heures dans Blender : créer un squelette de personnage propre, le skinner et exporter le tout en FBX ou glTF avec des réglages prêts pour Unity, Unreal ou Godot. Il ajoute aussi un retargeting d'animations, pour réutiliser un mocap ou une animation existante sur un personnage différent.\n\nÀ 40$ en achat unique, c'est l'un des meilleurs rapports qualité-prix de l'écosystème Blender : un seul paiement, pas d'abonnement, et l'add-on est mis à jour régulièrement pour suivre les nouvelles versions de Blender. La communauté le signale parfois comme exigeant à prendre en main au début (beaucoup d'options), mais une fois maîtrisé, il fait gagner un temps considérable face à un rig manuel, surtout pour qui exporte vers un moteur de jeu.",
    longDescriptionEn: "Auto-Rig Pro automates what normally takes hours in Blender: creating a clean character skeleton, skinning it and exporting the whole thing as FBX or glTF with settings ready for Unity, Unreal or Godot. It also adds animation retargeting, to reuse mocap or an existing animation on a different character.\n\nAt $40 as a one-time purchase, it's one of the best value-for-money deals in the Blender ecosystem: a single payment, no subscription, and the add-on gets updated regularly to follow new Blender versions. The community sometimes flags it as demanding to learn at first (lots of options), but once mastered, it saves considerable time versus manual rigging, especially for anyone exporting to a game engine.",
    verdict: {
      keepIf: [
        "Tu rigges des personnages régulièrement dans Blender, pour le jeu, l'animation ou le motion design",
        "Tu exportes vers Unity, Unreal ou Godot et veux un flux FBX/glTF propre",
      ],
      avoidIf: [
        "Tu ne rigges que ponctuellement un personnage simple : le rigging manuel de Blender peut suffire",
        "Tu cherches un outil de mocap, pas de rigging (vois plutôt Move AI ou Autodesk Flow Studio)",
      ],
      threshold: "Très rentable dès qu'on rigge des personnages plus d'une fois ou deux : 40$ payés une fois pour un gain de temps énorme.",
    },
    verdictEn: {
      keepIf: [
        "You rig characters regularly in Blender, for games, animation or motion design",
        "You export to Unity, Unreal or Godot and want a clean FBX/glTF pipeline",
      ],
      avoidIf: [
        "You only rig a simple character occasionally: Blender's manual rigging may be enough",
        "You're looking for a mocap tool, not rigging (see Move AI or Autodesk Flow Studio instead)",
      ],
      threshold: "Very worth it as soon as you rig characters more than once or twice: $40 paid once for a huge time saving.",
    },
    pros: [
      "Achat unique à 40$, pas d'abonnement",
      "Export FBX/glTF prêt pour Unity, Unreal, Godot",
      "Retargeting d'animation entre personnages différents",
      "Mises à jour régulières, suit les nouvelles versions de Blender",
    ],
    prosEn: [
      "One-time $40 purchase, no subscription",
      "FBX/glTF export ready for Unity, Unreal, Godot",
      "Animation retargeting between different characters",
      "Regular updates, follows new Blender versions",
    ],
    cons: [
      "Courbe d'apprentissage réelle au démarrage (beaucoup d'options)",
      "Documentation parfois jugée perfectible par la communauté",
      "Spécifique à Blender, pas multi-logiciel",
    ],
    consEn: [
      "Real learning curve at the start (lots of options)",
      "Documentation sometimes seen as improvable by the community",
      "Blender-specific, not multi-software",
    ],
    useCases: [
      "Rigger un personnage 3D pour le jeu vidéo ou l'animation",
      "Exporter un personnage riggé vers Unity, Unreal ou Godot",
      "Retargeter une animation ou un mocap sur un autre personnage",
      "Automatiser le skinning d'un modèle humanoïde ou créature",
    ],
    useCasesEn: [
      "Rig a 3D character for games or animation",
      "Export a rigged character to Unity, Unreal or Godot",
      "Retarget an animation or mocap onto a different character",
      "Automate skinning for a humanoid or creature model",
    ],
    covers: ["3d", "animation"],
    relevantFor: ["designer", "createur-contenu"],
    personas: ["designer"],
    soloRelevance: "high",
    teamRelevance: "medium",
    seo: { metaDescription: "Auto-Rig Pro 2026 : l'add-on Blender pour rigger et exporter des personnages (40$, achat unique). Le verdict ToolTrim et les alternatives." },
    alternatives: ["blender", "move-ai"],
    articles: [],
    freeAlternative: null,
    tool_type: "plugin",
    substitutable: true,
    host_app: "blender",
    bundle_parent: null,
    verticals: ["motion-video"],
    functional_needs: ["3d"],
    ia_use_case: null,
    betterAlternative: null,
    migrationGuide: null,
    downgradePlan: null,
    prescription_quality: "question",
    prescription_output: null,
    prescription_block_reasons: [],
    prescription_context_questions: [],
    pricing_v5: {
      cautions: [],
      verified_on: "2026-06-20",
      source_domain: "superhivemarket.com",
      usage_sensitive: false,
      compare_plan_kind: "one_time",
      compare_plan_name: "Licence perpétuelle",
      price_reliability: "medium",
      location_sensitive: false,
      official_source_url: "https://superhivemarket.com/products/auto-rig-pro",
      verification_status: "third_party_observed",
      compare_price_monthly_eur: 0,
    },
    substitution_cluster_v2: "plugin-blender",
  },
  {
    id: "hard-ops-boxcutter",
    slug: "hard-ops-boxcutter",
    name: "Hard Ops / Boxcutter",
    category: "design-tools",
    shortDescription: "Bundle Blender pour la modélisation hard-surface (booléens, bevels, arrays).",
    shortDescriptionEn: "Blender bundle for hard-surface modeling (booleans, bevels, arrays).",
    pricing: {
      free: "",
      paid: "38$ en licence perpétuelle (achat unique, bundle des deux add-ons).",
    },
    pricingEn: {
      free: "",
      paid: "$38 perpetual license (one-time purchase, bundle of both add-ons).",
    },
    defaultMonthlyPrice: 0,
    affiliateLink: "https://superhivemarket.com/products/hard-ops--boxcutter-ultimate-bundle",
    websiteUrl: "https://superhivemarket.com/products/hard-ops--boxcutter-ultimate-bundle",
    logo: "",
    longDescription: "Hard Ops et Boxcutter forment le duo de référence pour la modélisation hard-surface dans Blender (véhicules, robots, armes, props mécaniques). Boxcutter ajoute un découpage booléen à la souris, directement à l'écran, sans passer par les modificateurs un par un. Hard Ops automatise les tâches répétitives (chanfreins, miroirs, tableaux complexes) avec des raccourcis pensés pour un flux rapide.\n\nVendu en bundle à 38$, c'est un achat unique qui remplace des heures de modélisation manuelle. C'est devenu un standard chez les modélisateurs hard-surface sous Blender, au point que beaucoup de tutoriels et d'écoles l'enseignent comme base. La contrepartie, c'est une interface dense et un vocabulaire spécifique (les raccourcis et workflows propres à ces add-ons) qui demandent un vrai temps d'adaptation.",
    longDescriptionEn: "Hard Ops and Boxcutter form the reference duo for hard-surface modeling in Blender (vehicles, robots, weapons, mechanical props). Boxcutter adds on-screen boolean cutting with the mouse, without going through modifiers one by one. Hard Ops automates repetitive tasks (bevels, mirrors, complex arrays) with shortcuts built for a fast workflow.\n\nSold as a $38 bundle, it's a one-time purchase that replaces hours of manual modeling. It has become a standard among hard-surface modelers in Blender, to the point that many tutorials and schools teach it as a baseline. The trade-off is a dense interface and a specific vocabulary (shortcuts and workflows unique to these add-ons) that need real time to get used to.",
    verdict: {
      keepIf: [
        "Tu fais de la modélisation hard-surface régulière (véhicules, robots, props mécaniques) dans Blender",
        "Tu veux accélérer les découpes booléennes et les tâches répétitives (chanfreins, arrays)",
      ],
      avoidIf: [
        "Tu modélises surtout des formes organiques (le duo n'apporte rien sur ce terrain, vois plutôt le sculpt natif ou ZBrush)",
        "Tu débutes sur Blender : la courbe d'apprentissage de l'add-on s'ajoute à celle du logiciel",
      ],
      threshold: "Très rentable pour qui fait du hard-surface régulièrement : 38$ payés une fois pour un standard de l'industrie Blender.",
    },
    verdictEn: {
      keepIf: [
        "You do regular hard-surface modeling (vehicles, robots, mechanical props) in Blender",
        "You want to speed up boolean cuts and repetitive tasks (bevels, arrays)",
      ],
      avoidIf: [
        "You mostly model organic shapes (the duo adds nothing there, look at native sculpting or ZBrush instead)",
        "You're new to Blender: the add-on's learning curve stacks on top of the software's",
      ],
      threshold: "Very worth it for regular hard-surface work: $38 paid once for a Blender industry standard.",
    },
    pros: [
      "Achat unique à 38$, pas d'abonnement",
      "Standard de l'industrie pour le hard-surface sous Blender",
      "Découpe booléenne à la souris, directement à l'écran",
      "Automatise chanfreins, miroirs et arrays complexes",
    ],
    prosEn: [
      "One-time $38 purchase, no subscription",
      "Industry standard for hard-surface in Blender",
      "On-screen mouse-driven boolean cutting",
      "Automates bevels, mirrors and complex arrays",
    ],
    cons: [
      "Interface dense, vocabulaire et raccourcis spécifiques à apprendre",
      "Apporte peu sur la modélisation organique",
      "Spécifique à Blender, pas multi-logiciel",
    ],
    consEn: [
      "Dense interface, specific vocabulary and shortcuts to learn",
      "Adds little for organic modeling",
      "Blender-specific, not multi-software",
    ],
    useCases: [
      "Modéliser des véhicules, robots et props mécaniques",
      "Découper des formes par booléens directement à l'écran",
      "Automatiser chanfreins, miroirs et tableaux d'objets répétitifs",
      "Accélérer un flux de modélisation hard-surface pour le jeu ou le rendu",
    ],
    useCasesEn: [
      "Model vehicles, robots and mechanical props",
      "Cut shapes with booleans directly on screen",
      "Automate bevels, mirrors and repetitive object arrays",
      "Speed up a hard-surface modeling flow for games or rendering",
    ],
    covers: ["3d"],
    relevantFor: ["designer", "createur-contenu"],
    personas: ["designer"],
    soloRelevance: "high",
    teamRelevance: "medium",
    seo: { metaDescription: "Hard Ops / Boxcutter 2026 : le duo Blender pour la modélisation hard-surface (38$, achat unique). Le verdict ToolTrim et les alternatives." },
    alternatives: ["blender", "modo"],
    articles: [],
    freeAlternative: null,
    tool_type: "plugin",
    substitutable: true,
    host_app: "blender",
    bundle_parent: null,
    verticals: ["motion-video"],
    functional_needs: ["3d"],
    ia_use_case: null,
    betterAlternative: null,
    migrationGuide: null,
    downgradePlan: null,
    prescription_quality: "question",
    prescription_output: null,
    prescription_block_reasons: [],
    prescription_context_questions: [],
    pricing_v5: {
      cautions: [],
      verified_on: "2026-06-20",
      source_domain: "superhivemarket.com",
      usage_sensitive: false,
      compare_plan_kind: "one_time",
      compare_plan_name: "Bundle perpétuel",
      price_reliability: "medium",
      location_sensitive: false,
      official_source_url: "https://superhivemarket.com/products/hard-ops--boxcutter-ultimate-bundle",
      verification_status: "third_party_observed",
      compare_price_monthly_eur: 0,
    },
    substitution_cluster_v2: "plugin-blender",
  },
];

const tools = JSON.parse(readFileSync(PATH, "utf8"));

// 1. Ajout des 3 nouvelles fiches plugin
for (const entry of NEW) {
  if (tools.some((t) => (t.slug || t.id) === entry.slug)) {
    console.log(`SKIP ${entry.slug} (existe déjà)`);
    continue;
  }
  tools.push(entry);
}

// 2. Correction de Skatter (stub générique -> vraie fiche plugin SketchUp)
const skatter = tools.find((t) => (t.slug || t.id) === "skatter");
if (skatter) {
  skatter.shortDescription = "Extension SketchUp pour disperser des objets (végétation, foules, props) sur une surface.";
  skatter.shortDescriptionEn = "SketchUp extension to scatter objects (vegetation, crowds, props) across a surface.";
  skatter.pricing = { free: "Démo 15 jours", paid: "149€ en licence perpétuelle, ou 99€/an en abonnement (HT)." };
  skatter.pricingEn = { free: "15-day demo", paid: "€149 perpetual license, or €99/year subscription (excl. VAT)." };
  skatter.defaultMonthlyPrice = 0;
  skatter.tool_type = "plugin";
  skatter.host_app = "sketchup-pro";
  skatter.substitutable = true;
  skatter.alternatives = ["sketchup-pro", "lumion"];
  skatter.pricing_v5 = {
    cautions: [],
    verified_on: "2026-06-20",
    source_domain: "skatter.software",
    usage_sensitive: false,
    compare_plan_kind: "one_time",
    compare_plan_name: "Licence perpétuelle",
    price_reliability: "high",
    location_sensitive: false,
    official_source_url: "https://skatter.software/",
    verification_status: "official_explicit",
    compare_price_monthly_eur: 0,
  };
  skatter.seo = Object.assign({}, skatter.seo, {
    metaDescription: "Skatter 2026 : l'extension SketchUp pour disperser végétation et props (149€ à vie ou 99€/an). Le verdict ToolTrim.",
  });
  console.log("Skatter corrigée (host_app=sketchup-pro, prix réel, tool_type=plugin)");
}

const out = JSON.stringify(tools, null, 2) + "\n";
JSON.parse(out);
writeFileSync(PATH, out);
console.log(`Plugins C4D/Blender : ${NEW.length} nouvelles fiches + correction Skatter | JSON OK`);
