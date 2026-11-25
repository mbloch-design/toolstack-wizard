#!/usr/bin/env node
/**
 * Lot du 25/11/2026 : enrichir les pages /alternatives à forte demande
 * (Search Console, 3 mois). Sources : research/tool-pages/<slug>.json et
 * research/tool-pages/_alternatives-proposals-2026-11-25.json.
 *
 * - ajoute 8 fiches (GameMaker, Defold, Cocos Creator, Appwrite, PocketBase,
 *   Convex, AWS Secrets Manager, Akeyless) en fin de tools_v4.json ;
 * - remplace la liste `alternatives` de 6 fiches existantes.
 *
 * Édition par texte, pour un diff minimal et sans reformater le fichier.
 * Idempotent : une fiche déjà présente n'est pas ajoutée deux fois.
 *
 * Usage : node scripts/apply-alternatives-batch-2026-11-25.mjs [fichier]
 * (défaut src/data/tools_v4.json). Prix et limites : uniquement ceux des
 * dossiers ; pricing_v5 seulement là où un montant de plan est relevé
 * (conversion indicative 1 USD = 0,8587 EUR, taux des fiches existantes).
 */
import fs from "node:fs";

const file = process.argv[2] || "src/data/tools_v4.json";

const RELATIONS = {
  "google-chat": ["slack", "microsoft-teams", "discord"],
  "microsoft-teams": ["slack", "google-chat", "discord"],
  "unreal-engine": ["unity", "godot", "twinmotion", "blender"],
  supabase: ["firebase", "neon", "appwrite", "convex", "pocketbase", "mongodb-atlas", "planetscale"],
  unity: ["godot", "unreal-engine", "gamemaker", "defold", "cocos-creator"],
  vault: ["doppler", "infisical", "aws-secrets-manager", "akeyless"],
};

const ENGINE = {
  category: "creation",
  covers: ["creation", "3d", "animation"],
  relevantFor: ["Développeurs indépendants", "Studios de petite taille"],
  personas: ["THEO"],
  soloRelevance: "high",
  teamRelevance: "medium",
  tool_type: "satellite",
  substitutable: true,
  verticals: ["creative"],
  functional_needs: ["creation", "3d", "animation"],
  substitution_cluster_v2: "real-time-3d",
};
const BACKEND = {
  category: "nocode-web",
  covers: ["app-builder", "nocode-web", "devops"],
  relevantFor: ["Développeurs freelance", "Développeurs solo"],
  personas: ["THEO"],
  soloRelevance: "high",
  teamRelevance: "high",
  tool_type: "metier",
  substitutable: true,
  verticals: ["dev-freelance", "developpeur-solo"],
  functional_needs: ["app-builder", "nocode-web", "devops"],
  substitution_cluster_v2: "backend-database-platform",
};
const SECRETS = {
  category: "security",
  covers: ["security", "devops"],
  relevantFor: ["Équipes plateforme", "CTO / lead tech"],
  personas: ["THEO"],
  soloRelevance: "medium",
  teamRelevance: "high",
  tool_type: "core",
  substitutable: true,
  verticals: ["cto-lead-tech", "dev-freelance"],
  functional_needs: ["security", "devops"],
  substitution_cluster_v2: "secrets-management",
};

const USD_EUR = 0.8587;
const plan = (planKey, displayName, fields) => ({
  planKey, displayName, summary: null, featureHighlights: [], detailsSourceUrl: fields.source,
  pricingUnit: fields.unit, isFree: fields.amount === 0, isComparePlan: Boolean(fields.compare),
  nativeAmount: fields.amount, nativeCurrency: "USD", billingPeriod: fields.period ?? "monthly",
  ...(fields.priceStatus ? { priceStatus: fields.priceStatus } : {}),
  taxInclusion: "unknown", observedMarket: "US", observedOn: "2026-11-25", lastConfirmedOn: "2026-11-25",
});
const pricingV5 = ({ kind, name, source, monthlyUsd, reliability = "high", cautions, cautionsEn, plans }) => ({
  cautions, cautionsEn, verified_on: "2026-11-25", source_domain: new URL(source).hostname.replace(/^www\./, ""),
  usage_sensitive: kind === "usage", compare_plan_kind: kind, compare_plan_name: name, price_reliability: reliability,
  location_sensitive: false, official_source_url: source, verification_status: "official_explicit",
  compare_price_monthly_eur: Math.round(monthlyUsd * USD_EUR * 100) / 100, plans,
});

const tool = (base, t) => ({
  id: t.slug,
  slug: t.slug,
  name: t.name,
  category: base.category,
  shortDescription: t.short,
  shortDescriptionEn: t.shortEn,
  description: t.short,
  longDescription: t.long,
  longDescriptionEn: t.longEn,
  pricing: t.pricing,
  pricingEn: t.pricingEn,
  defaultMonthlyPrice: t.defaultMonthlyPrice,
  pricing_v5: t.pricing_v5 ?? null,
  affiliateLink: "",
  websiteUrl: t.url,
  logo: "",
  seo: t.seo,
  pros: t.pros,
  prosEn: t.prosEn,
  cons: t.cons,
  consEn: t.consEn,
  useCases: t.useCases,
  useCasesEn: t.useCasesEn,
  covers: base.covers,
  relevantFor: base.relevantFor,
  personas: base.personas,
  alternatives: t.alternatives,
  verdict: t.verdict,
  verdictEn: t.verdictEn,
  articles: [],
  timeGainedHoursPerMonth: null,
  freeAlternative: null,
  soloRelevance: base.soloRelevance,
  teamRelevance: base.teamRelevance,
  tool_type: base.tool_type,
  substitutable: base.substitutable,
  host_app: null,
  bundle_parent: null,
  verticals: base.verticals,
  functional_needs: base.functional_needs,
  ia_use_case: null,
  betterAlternative: null,
  migrationGuide: null,
  downgradePlan: null,
  prescription_quality: "contextual",
  prescription_output: null,
  prescription_block_reasons: [],
  prescription_context_questions: [],
  substitution_cluster_v2: base.substitution_cluster_v2,
  decision_policy_v3: { auto_cancel_allowed: false, auto_replace_allowed: false, auto_downgrade_allowed: false },
  force_silence: false,
  // Same shape as the existing `research` field; the dossier holds the claims.
  research: { researchedOn: "2026-11-25", sources: sourceCount(t.slug) },
});

function sourceCount(slug) {
  const dossier = JSON.parse(fs.readFileSync(`research/tool-pages/${slug}.json`, "utf8"));
  return new Set(dossier.claims.map((claim) => claim.sourceUrl)).size;
}

const NEW_TOOLS = [
  tool(ENGINE, {
    slug: "gamemaker", name: "GameMaker", url: "https://gamemaker.io/",
    short: "Moteur de jeu 2D d’Opera, gratuit en non commercial, licence commerciale en achat unique.",
    shortEn: "Opera’s 2D game engine, free for non-commercial use, commercial licence as a one-time purchase.",
    long: "GameMaker est un moteur de jeu 2D édité par Opera. La version gratuite exporte vers desktop, web et mobile pour un usage non commercial. Pour vendre ton jeu, il faut la licence Professional, en achat unique. L’export console demande l’abonnement Enterprise.",
    longEn: "GameMaker is a 2D game engine published by Opera. The free version exports to desktop, web and mobile for non-commercial use. To sell your game you need the Professional licence, a one-time purchase. Console export requires the Enterprise subscription.",
    pricing: { free: "Gratuit pour un usage non commercial", paid: "Professional : 99,99 $ en achat unique ; Enterprise sur abonnement (console)" },
    pricingEn: { free: "Free for non-commercial use", paid: "Professional: $99.99 one-time; Enterprise subscription (console)" },
    defaultMonthlyPrice: 0,
    pricing_v5: pricingV5({
      kind: "one_time", name: "Professional", source: "https://gamemaker.io/en/get", monthlyUsd: 0,
      cautions: ["Achat unique, pas un tarif mensuel.", "L’export console exige l’abonnement Enterprise, dont le montant n’a pas été relevé."],
      cautionsEn: ["One-time purchase, not a monthly price.", "Console export requires the Enterprise subscription, whose price was not captured."],
      plans: [
        plan("free", "Free", { source: "https://gamemaker.io/en/get", unit: "account", amount: 0 }),
        plan("professional", "Professional", { source: "https://gamemaker.io/en/get", unit: "license", amount: 99.99, period: null, compare: true }),
        plan("enterprise", "Enterprise", { source: "https://gamemaker.io/en/get", unit: "account", amount: null, priceStatus: "unknown" }),
      ],
    }),
    pros: ["Licence commerciale en achat unique, sans abonnement.", "Exports desktop, web et mobile dès la version gratuite.", "Aucun écran de démarrage imposé."],
    prosEn: ["Commercial licence as a one-time purchase, no subscription.", "Desktop, web and mobile exports from the free version.", "No forced splash screen."],
    cons: ["Pensé pour la 2D.", "L’export console exige l’abonnement Enterprise."],
    consEn: ["Built for 2D.", "Console export requires the Enterprise subscription."],
    useCases: ["Développer un jeu 2D indépendant.", "Prototyper un jeu avant de le vendre.", "Publier un jeu 2D sur le web et le mobile."],
    useCasesEn: ["Build an indie 2D game.", "Prototype a game before selling it.", "Ship a 2D game to web and mobile."],
    alternatives: ["unity", "godot", "defold"],
    verdict: {
      keepIf: ["Tu fais un jeu 2D et tu veux payer ta licence commerciale une seule fois."],
      avoidIf: ["Tu vises la 3D ou la console sans budget pour un abonnement Enterprise."],
      threshold: "Gratuit tant que tu ne vends pas ton jeu ; la licence Professional coûte 99,99 $ une fois, l’export console passe par Enterprise.",
    },
    verdictEn: {
      keepIf: ["You make a 2D game and want to pay for your commercial licence once."],
      avoidIf: ["You target 3D or consoles without a budget for an Enterprise subscription."],
      threshold: "Free until you sell your game; the Professional licence costs $99.99 once, and console export goes through Enterprise.",
    },
    seo: {
      metaDescription: "GameMaker sur ToolTrim : moteur 2D, licence en achat unique et limites.",
      presentationTitleFr: "GameMaker : moteur 2D, licence commerciale en achat unique",
      presentationTitleEn: "GameMaker: 2D engine with a one-time commercial licence",
      presentationMetaDescriptionFr: "GameMaker est le moteur 2D d’Opera : gratuit en non commercial, exports desktop, web et mobile, licence commerciale à 99,99 $ en achat unique.",
      presentationMetaDescriptionEn: "GameMaker is Opera’s 2D engine: free for non-commercial use, desktop, web and mobile exports, and a $99.99 one-time commercial licence.",
      prixTitleFr: "Prix de GameMaker : gratuit, puis 99,99 $ une fois",
      prixTitleEn: "GameMaker pricing: free, then $99.99 once",
      prixMetaDescriptionFr: "Prix de GameMaker : gratuit en non commercial, licence Professional à 99,99 $ en achat unique, abonnement Enterprise pour l’export console.",
      prixMetaDescriptionEn: "GameMaker pricing: free for non-commercial use, Professional licence at $99.99 one-time, Enterprise subscription for console export.",
      altTitleFr: "Alternatives à GameMaker : Unity, Godot, Defold",
      altTitleEn: "GameMaker alternatives: Unity, Godot, Defold",
      altMetaDescriptionFr: "Tu passes à la 3D ou tu veux zéro licence ? Unity, Godot et Defold comparés à GameMaker sur le prix, la 2D, la 3D et les exports.",
      altMetaDescriptionEn: "Moving to 3D or want no licence at all? Unity, Godot and Defold compared with GameMaker on price, 2D, 3D and exports.",
      avisTitleFr: "Avis GameMaker : la 2D payée une seule fois",
      avisTitleEn: "GameMaker review: 2D paid for once",
      avisMetaDescriptionFr: "Avis GameMaker, noté {rating} : licence commerciale en achat unique et exports larges ; pensé pour la 2D, console réservée à Enterprise.",
      avisMetaDescriptionEn: "GameMaker review, rated {rating}: one-time commercial licence and wide exports; built for 2D, consoles reserved for Enterprise.",
    },
  }),
  tool(ENGINE, {
    slug: "defold", name: "Defold", url: "https://defold.com/",
    short: "Moteur de jeu 2D gratuit, sans redevance, porté par une fondation.",
    shortEn: "Free, royalty-free 2D game engine run by a foundation.",
    long: "Defold est un moteur de jeu gratuit maintenu par la Defold Foundation. Pas de licence, pas de redevance, et la fondation s’engage par écrit à ne jamais passer à l’abonnement. Il publie vers desktop, mobile, web et consoles. Il est pensé pour la 2D, et la logique s’écrit en Lua.",
    longEn: "Defold is a free game engine maintained by the Defold Foundation. No licence fee, no royalties, and the foundation commits in writing never to move to a subscription. It publishes to desktop, mobile, web and consoles. It is built for 2D, and game logic is written in Lua.",
    pricing: { free: "Gratuit, sans redevance ni frais d’exécution", paid: "Contrats de support payants, prix non publié" },
    pricingEn: { free: "Free, no royalties or runtime fees", paid: "Paid support contracts, price not published" },
    defaultMonthlyPrice: 0,
    pros: ["Gratuit, sans redevance, engagement écrit de ne jamais facturer.", "Publication vers mobile, web, desktop et consoles.", "Léger, adapté aux jeux web et mobiles."],
    prosEn: ["Free, royalty-free, with a written pledge never to charge.", "Publishes to mobile, web, desktop and consoles.", "Lightweight, suited to web and mobile games."],
    cons: ["La 3D demande beaucoup de travail.", "Logique de jeu en Lua."],
    consEn: ["3D takes a lot of work.", "Game logic in Lua."],
    useCases: ["Publier un jeu 2D sur le web et le mobile.", "Sortir un jeu sur console sans payer de licence moteur.", "Prototyper un jeu léger."],
    useCasesEn: ["Ship a 2D game to web and mobile.", "Release a console game without an engine licence fee.", "Prototype a lightweight game."],
    alternatives: ["godot", "unity", "gamemaker"],
    verdict: {
      keepIf: ["Tu fais un jeu 2D pour le web ou le mobile et tu ne veux jamais payer le moteur."],
      avoidIf: ["Ton jeu repose sur de la 3D, ou ton équipe refuse le Lua."],
      threshold: "Rien à payer, ni licence ni redevance ; le coût est ailleurs : la 3D et le Lua.",
    },
    verdictEn: {
      keepIf: ["You make a 2D game for web or mobile and never want to pay for the engine."],
      avoidIf: ["Your game relies on 3D, or your team won’t use Lua."],
      threshold: "Nothing to pay, no licence and no royalties; the cost lies elsewhere: 3D and Lua.",
    },
    seo: {
      metaDescription: "Defold sur ToolTrim : moteur 2D gratuit, sans redevance, et ses limites.",
      presentationTitleFr: "Defold : moteur de jeu 2D gratuit et sans redevance",
      presentationTitleEn: "Defold: free, royalty-free 2D game engine",
      presentationMetaDescriptionFr: "Defold est un moteur de jeu 2D gratuit, sans redevance, maintenu par une fondation, qui publie vers web, mobile, desktop et consoles.",
      presentationMetaDescriptionEn: "Defold is a free, royalty-free 2D game engine run by a foundation, publishing to web, mobile, desktop and consoles.",
      prixTitleFr: "Prix de Defold : gratuit, sans redevance",
      prixTitleEn: "Defold pricing: free, no royalties",
      prixMetaDescriptionFr: "Prix de Defold : gratuit, sans licence, sans redevance ni frais d’exécution, avec l’engagement écrit de ne jamais passer à l’abonnement.",
      prixMetaDescriptionEn: "Defold pricing: free, with no licence, royalties or runtime fees, and a written pledge never to move to a subscription.",
      altTitleFr: "Alternatives à Defold : Godot, Unity, GameMaker",
      altTitleEn: "Defold alternatives: Godot, Unity, GameMaker",
      altMetaDescriptionFr: "Besoin de 3D ou d’un autre langage que Lua ? Godot, Unity et GameMaker comparés à Defold sur la 3D, le prix et les exports.",
      altMetaDescriptionEn: "Need 3D or a language other than Lua? Godot, Unity and GameMaker compared with Defold on 3D, price and exports.",
      avisTitleFr: "Avis Defold : la 2D gratuite pour de bon",
      avisTitleEn: "Defold review: 2D, free for good",
      avisMetaDescriptionFr: "Avis Defold, noté {rating} : gratuit, sans redevance, exports jusqu’aux consoles ; la 3D reste lourde et la logique passe par Lua.",
      avisMetaDescriptionEn: "Defold review, rated {rating}: free, royalty-free, exports up to consoles; 3D remains heavy and logic goes through Lua.",
    },
  }),
  tool(ENGINE, {
    slug: "cocos-creator", name: "Cocos Creator", url: "https://www.cocos.com/en/creator",
    short: "Moteur de jeu 2D et 3D gratuit pour le jeu, fort sur le web, le mobile et les mini-jeux.",
    shortEn: "2D and 3D game engine, free for games, strong on web, mobile and mini-games.",
    long: "Cocos Creator est un moteur 2D et 3D édité par Cocos (Xiamen Yaji Software). Il est gratuit pour développer des jeux et publie vers Android, iOS, le web, Windows, macOS et les plateformes de mini-jeux. L’éditeur est propriétaire, le moteur est open source. Le contrat d’utilisation permet à l’éditeur de le rendre payant avec un préavis.",
    longEn: "Cocos Creator is a 2D and 3D engine published by Cocos (Xiamen Yaji Software). It is free for game development and publishes to Android, iOS, the web, Windows, macOS and mini-game platforms. The editor is proprietary and the engine is open source. The user agreement allows the publisher to start charging with notice.",
    pricing: { free: "Gratuit pour développer des jeux", paid: "Usage hors jeu sur autorisation, frais possibles" },
    pricingEn: { free: "Free for game development", paid: "Non-game use by authorisation, fees possible" },
    defaultMonthlyPrice: 0,
    pros: ["Gratuit pour le jeu, en 2D comme en 3D.", "Très présent sur le web et les plateformes de mini-jeux.", "Moteur open source."],
    prosEn: ["Free for games, in both 2D and 3D.", "Strong on the web and mini-game platforms.", "Open-source engine."],
    cons: ["Éditeur propriétaire, gratuité révisable avec préavis.", "Usage hors jeu soumis à autorisation."],
    consEn: ["Proprietary editor, free use can be revised with notice.", "Non-game use requires authorisation."],
    useCases: ["Publier un jeu léger sur le web.", "Viser les plateformes de mini-jeux.", "Développer un jeu mobile 2D ou 3D."],
    useCasesEn: ["Ship a lightweight web game.", "Target mini-game platforms.", "Build a 2D or 3D mobile game."],
    alternatives: ["unity", "godot", "defold"],
    verdict: {
      keepIf: ["Ton jeu vise le web, le mobile ou les mini-jeux et tu veux de la 2D et de la 3D sans licence."],
      avoidIf: ["Tu veux une garantie de gratuité dans la durée ou un usage hors jeu."],
      threshold: "Gratuit pour le jeu aujourd’hui ; le contrat laisse l’éditeur changer de modèle avec un préavis public.",
    },
    verdictEn: {
      keepIf: ["Your game targets web, mobile or mini-games and you want 2D and 3D without a licence fee."],
      avoidIf: ["You need a long-term guarantee of free use, or a non-game use."],
      threshold: "Free for games today; the agreement lets the publisher change its model with public notice.",
    },
    seo: {
      metaDescription: "Cocos Creator sur ToolTrim : moteur 2D et 3D pour le web et le mobile.",
      presentationTitleFr: "Cocos Creator : moteur 2D et 3D pour le web et le mobile",
      presentationTitleEn: "Cocos Creator: 2D and 3D engine for web and mobile",
      presentationMetaDescriptionFr: "Cocos Creator est un moteur 2D et 3D gratuit pour le jeu, qui publie vers le web, le mobile, le desktop et les plateformes de mini-jeux.",
      presentationMetaDescriptionEn: "Cocos Creator is a 2D and 3D engine, free for games, publishing to web, mobile, desktop and mini-game platforms.",
      prixTitleFr: "Prix de Cocos Creator : gratuit pour le jeu",
      prixTitleEn: "Cocos Creator pricing: free for games",
      prixMetaDescriptionFr: "Prix de Cocos Creator : gratuit pour développer des jeux ; usage hors jeu sur autorisation, et l’éditeur peut changer de modèle avec préavis.",
      prixMetaDescriptionEn: "Cocos Creator pricing: free for game development; non-game use by authorisation, and the publisher may change its model with notice.",
      altTitleFr: "Alternatives à Cocos Creator : Unity, Godot, Defold",
      altTitleEn: "Cocos Creator alternatives: Unity, Godot, Defold",
      altMetaDescriptionFr: "Tu veux un moteur open source de bout en bout ou la console ? Unity, Godot et Defold comparés à Cocos Creator.",
      altMetaDescriptionEn: "Want a fully open-source engine or consoles? Unity, Godot and Defold compared with Cocos Creator.",
      avisTitleFr: "Avis Cocos Creator : le web et les mini-jeux d’abord",
      avisTitleEn: "Cocos Creator review: web and mini-games first",
      avisMetaDescriptionFr: "Avis Cocos Creator, noté {rating} : gratuit pour le jeu, 2D et 3D, fort sur le web ; éditeur propriétaire et gratuité révisable.",
      avisMetaDescriptionEn: "Cocos Creator review, rated {rating}: free for games, 2D and 3D, strong on the web; proprietary editor and revisable free use.",
    },
  }),
  tool(BACKEND, {
    slug: "appwrite", name: "Appwrite", url: "https://appwrite.io/",
    short: "Backend open source : base, auth, stockage, fonctions, en cloud ou auto-hébergé.",
    shortEn: "Open-source backend: database, auth, storage, functions, in the cloud or self-hosted.",
    long: "Appwrite réunit base de données, authentification, stockage et fonctions. Le cloud propose un plan Free (une organisation, deux projets, gel au dépassement) et un plan Pro facturé par organisation, avec dépassements payés automatiquement et plafond de budget. Le code est open source et s’auto-héberge avec Docker ou Kubernetes.",
    longEn: "Appwrite brings together database, authentication, storage and functions. The cloud offers a Free plan (one organisation, two projects, frozen when over the limit) and a Pro plan billed per organisation, with overages charged automatically and a budget cap. The code is open source and self-hosts with Docker or Kubernetes.",
    pricing: { free: "Free : une organisation, deux projets, gel au dépassement", paid: "Pro par organisation, dépassements à l’usage ; base dédiée dès 10 $/mois" },
    pricingEn: { free: "Free: one organisation, two projects, frozen over the limit", paid: "Pro per organisation, usage-based overages; dedicated database from $10/mo" },
    defaultMonthlyPrice: 0,
    pros: ["Open source et auto-hébergeable.", "Plafond de budget sur le plan Pro.", "Base, auth, stockage et fonctions au même endroit."],
    prosEn: ["Open source and self-hostable.", "Budget cap on the Pro plan.", "Database, auth, storage and functions in one place."],
    cons: ["Free limité à deux projets, gelés au dépassement.", "Auto-hébergement : du temps d’exploitation à prévoir."],
    consEn: ["Free limited to two projects, frozen over the limit.", "Self-hosting: plan for operations time."],
    useCases: ["Lancer le backend d’une app web ou mobile.", "Auto-héberger son backend.", "Remplacer Firebase ou Supabase."],
    useCasesEn: ["Launch the backend of a web or mobile app.", "Self-host your backend.", "Replace Firebase or Supabase."],
    alternatives: ["supabase", "firebase", "pocketbase", "convex"],
    verdict: {
      keepIf: ["Tu veux un backend complet que tu pourras auto-héberger si le cloud ne te convient plus."],
      avoidIf: ["Tu veux du Postgres et du SQL : Supabase colle mieux."],
      threshold: "Le plan Free tient deux projets ; au-delà, le Pro facture par organisation, avec un plafond de budget à régler dès le départ.",
    },
    verdictEn: {
      keepIf: ["You want a complete backend you can self-host if the cloud stops suiting you."],
      avoidIf: ["You want Postgres and SQL: Supabase fits better."],
      threshold: "The Free plan holds two projects; beyond that, Pro bills per organisation, with a budget cap to set from day one.",
    },
    seo: {
      metaDescription: "Appwrite sur ToolTrim : backend open source, plans cloud et limites.",
      presentationTitleFr: "Appwrite : backend open source, cloud ou auto-hébergé",
      presentationTitleEn: "Appwrite: open-source backend, cloud or self-hosted",
      presentationMetaDescriptionFr: "Appwrite réunit base, auth, stockage et fonctions, en cloud ou auto-hébergé ; le plan Free couvre deux projets.",
      presentationMetaDescriptionEn: "Appwrite brings database, auth, storage and functions together, cloud or self-hosted; the Free plan covers two projects.",
      prixTitleFr: "Prix d’Appwrite : Free, Pro et auto-hébergement",
      prixTitleEn: "Appwrite pricing: Free, Pro and self-hosting",
      prixMetaDescriptionFr: "Prix d’Appwrite : Free limité à deux projets et gelé au dépassement, Pro facturé par organisation avec dépassements à l’usage et plafond de budget.",
      prixMetaDescriptionEn: "Appwrite pricing: Free limited to two projects and frozen over the limit, Pro billed per organisation with usage overages and a budget cap.",
      altTitleFr: "Alternatives à Appwrite : Supabase, Firebase, PocketBase",
      altTitleEn: "Appwrite alternatives: Supabase, Firebase, PocketBase",
      altMetaDescriptionFr: "Postgres, Google ou un seul binaire ? Supabase, Firebase, PocketBase et Convex comparés à Appwrite.",
      altMetaDescriptionEn: "Postgres, Google or a single binary? Supabase, Firebase, PocketBase and Convex compared with Appwrite.",
      avisTitleFr: "Avis Appwrite : le backend qu’on peut reprendre chez soi",
      avisTitleEn: "Appwrite review: the backend you can take home",
      avisMetaDescriptionFr: "Avis Appwrite, noté {rating} : open source, auto-hébergeable, plafond de budget ; Free limité à deux projets.",
      avisMetaDescriptionEn: "Appwrite review, rated {rating}: open source, self-hostable, budget cap; Free limited to two projects.",
    },
  }),
  tool(BACKEND, {
    slug: "pocketbase", name: "PocketBase", url: "https://pocketbase.io/",
    short: "Backend open source en un seul fichier : SQLite, auth, temps réel, auto-hébergé.",
    shortEn: "Open-source backend in a single file: SQLite, auth, realtime, self-hosted.",
    long: "PocketBase tient dans un exécutable : base SQLite embarquée, authentification, temps réel et tableau de bord. C’est un projet bénévole, gratuit, sans offre hébergée : tu l’installes sur ton serveur. Il monte en charge sur un seul serveur et reste avant la v1.0, donc des migrations manuelles sont possibles.",
    longEn: "PocketBase fits in one executable: embedded SQLite database, authentication, realtime and a dashboard. It is a free volunteer project with no hosted offer: you run it on your own server. It scales on a single server and is still pre-1.0, so manual migrations may be needed.",
    pricing: { free: "Gratuit, auto-hébergé", paid: "Aucune offre payante ; coût de ton serveur uniquement" },
    pricingEn: { free: "Free, self-hosted", paid: "No paid offer; only your server costs" },
    defaultMonthlyPrice: 0,
    pros: ["Un seul binaire à déployer.", "Gratuit, sans dépendance à un fournisseur.", "Auth et temps réel inclus."],
    prosEn: ["A single binary to deploy.", "Free, no vendor dependency.", "Auth and realtime included."],
    cons: ["Avant la v1.0 : rétrocompatibilité non garantie.", "SQLite seulement, un seul serveur, pas de fonctions cloud."],
    consEn: ["Pre-1.0: no backward-compatibility guarantee.", "SQLite only, single server, no cloud functions."],
    useCases: ["Monter le backend d’un petit projet.", "Prototyper une app en une heure.", "Garder un backend sans abonnement."],
    useCasesEn: ["Set up the backend of a small project.", "Prototype an app in an hour.", "Keep a backend with no subscription."],
    alternatives: ["supabase", "appwrite", "firebase"],
    verdict: {
      keepIf: ["Tu lances un petit projet et tu veux un backend gratuit que tu maîtrises de bout en bout."],
      avoidIf: ["Ton app doit monter en charge sur plusieurs serveurs, ou tu ne veux pas suivre le journal des versions."],
      threshold: "Gratuit, mais tu payes en exploitation : serveur, sauvegardes et migrations avant la v1.0 sont à ta charge.",
    },
    verdictEn: {
      keepIf: ["You’re launching a small project and want a free backend you fully control."],
      avoidIf: ["Your app must scale across several servers, or you won’t follow the changelog."],
      threshold: "Free, but you pay in operations: server, backups and pre-1.0 migrations are on you.",
    },
    seo: {
      metaDescription: "PocketBase sur ToolTrim : backend en un fichier, gratuit, et ses limites.",
      presentationTitleFr: "PocketBase : backend open source en un seul fichier",
      presentationTitleEn: "PocketBase: open-source backend in a single file",
      presentationMetaDescriptionFr: "PocketBase réunit SQLite, auth, temps réel et tableau de bord dans un exécutable gratuit, à auto-héberger.",
      presentationMetaDescriptionEn: "PocketBase packs SQLite, auth, realtime and a dashboard into one free executable you self-host.",
      prixTitleFr: "Prix de PocketBase : gratuit, auto-hébergé",
      prixTitleEn: "PocketBase pricing: free, self-hosted",
      prixMetaDescriptionFr: "Prix de PocketBase : gratuit, sans offre hébergée ni plan payant ; ton seul coût est le serveur qui le fait tourner.",
      prixMetaDescriptionEn: "PocketBase pricing: free, with no hosted offer or paid plan; your only cost is the server it runs on.",
      altTitleFr: "Alternatives à PocketBase : Supabase, Appwrite, Firebase",
      altTitleEn: "PocketBase alternatives: Supabase, Appwrite, Firebase",
      altMetaDescriptionFr: "Besoin de monter en charge ou d’un service géré ? Supabase, Appwrite et Firebase comparés à PocketBase.",
      altMetaDescriptionEn: "Need to scale or a managed service? Supabase, Appwrite and Firebase compared with PocketBase.",
      avisTitleFr: "Avis PocketBase : un backend dans la poche",
      avisTitleEn: "PocketBase review: a backend in your pocket",
      avisMetaDescriptionFr: "Avis PocketBase, noté {rating} : un binaire, gratuit, auth et temps réel inclus ; avant la v1.0 et limité à un serveur.",
      avisMetaDescriptionEn: "PocketBase review, rated {rating}: one binary, free, auth and realtime included; pre-1.0 and limited to one server.",
    },
  }),
  tool(BACKEND, {
    slug: "convex", name: "Convex", url: "https://www.convex.dev/",
    short: "Base de données réactive et fonctions serveur en TypeScript, avec palier gratuit.",
    shortEn: "Reactive database and server functions in TypeScript, with a free tier.",
    long: "Convex combine base de données réactive, fonctions serveur et temps réel, le tout en TypeScript. Le palier gratuit inclut 1 million d’appels de fonction et 0,5 Go de base, puis se paye à l’usage. Le plan Professional coûte 25 $ par développeur et par mois. Le backend est auto-hébergeable sous licence FSL.",
    longEn: "Convex combines a reactive database, server functions and realtime, all in TypeScript. The free tier includes 1 million function calls and 0.5 GB of database, then is pay-as-you-go. The Professional plan costs $25 per developer per month. The backend is self-hostable under the FSL licence.",
    pricing: { free: "Free & Starter : 0 $/mois, 1 M appels et 0,5 Go inclus, puis à l’usage", paid: "Professional : 25 $ par développeur et par mois ; Business dès 2 500 $/mois" },
    pricingEn: { free: "Free & Starter: $0/month, 1M calls and 0.5 GB included, then usage-based", paid: "Professional: $25 per developer per month; Business from $2,500/month" },
    defaultMonthlyPrice: 0,
    pricing_v5: pricingV5({
      kind: "seat", name: "Professional", source: "https://www.convex.dev/pricing", monthlyUsd: 25,
      cautions: ["Prix par développeur et par mois.", "Au-delà des quotas inclus, les ressources se paient à l’usage."],
      cautionsEn: ["Price per developer per month.", "Beyond the included quotas, resources are billed by usage."],
      plans: [
        plan("free-starter", "Free & Starter", { source: "https://www.convex.dev/pricing", unit: "account", amount: 0 }),
        plan("professional", "Professional", { source: "https://www.convex.dev/pricing", unit: "seat", amount: 25, compare: true }),
        plan("business", "Business & Enterprise", { source: "https://www.convex.dev/pricing", unit: "account", amount: 2500 }),
      ],
    }),
    pros: ["Données synchronisées en temps réel sans code de plomberie.", "Tout en TypeScript, du schéma aux fonctions.", "Grille d’usage publique et détaillée."],
    prosEn: ["Realtime-synced data without plumbing code.", "All TypeScript, from schema to functions.", "Public, detailed usage pricing."],
    cons: ["Modèle de données propre à Convex, pas de SQL.", "Pro facturé par développeur."],
    consEn: ["Convex-specific data model, no SQL.", "Pro billed per developer."],
    useCases: ["Construire une app collaborative en temps réel.", "Lancer un SaaS en TypeScript.", "Remplacer Firebase pour une app réactive."],
    useCasesEn: ["Build a realtime collaborative app.", "Launch a SaaS in TypeScript.", "Replace Firebase for a reactive app."],
    alternatives: ["supabase", "firebase", "appwrite"],
    verdict: {
      keepIf: ["Ton app vit en temps réel et ton équipe code en TypeScript."],
      avoidIf: ["Tu veux du SQL et la portabilité de Postgres."],
      threshold: "Gratuit jusqu’à 1 million d’appels de fonction ; au-delà de l’usage solo, compte 25 $ par développeur et par mois.",
    },
    verdictEn: {
      keepIf: ["Your app lives in realtime and your team writes TypeScript."],
      avoidIf: ["You want SQL and Postgres portability."],
      threshold: "Free up to 1 million function calls; beyond solo use, count $25 per developer per month.",
    },
    seo: {
      metaDescription: "Convex sur ToolTrim : base réactive en TypeScript, prix et limites.",
      presentationTitleFr: "Convex : base de données réactive en TypeScript",
      presentationTitleEn: "Convex: reactive database in TypeScript",
      presentationMetaDescriptionFr: "Convex combine base réactive, fonctions serveur et temps réel en TypeScript, avec un palier gratuit et un plan à 25 $ par développeur.",
      presentationMetaDescriptionEn: "Convex combines a reactive database, server functions and realtime in TypeScript, with a free tier and a $25-per-developer plan.",
      prixTitleFr: "Prix de Convex : gratuit, puis 25 $ par développeur",
      prixTitleEn: "Convex pricing: free, then $25 per developer",
      prixMetaDescriptionFr: "Prix de Convex : palier gratuit avec 1 M appels et 0,5 Go, puis à l’usage ; Professional à 25 $ par développeur et par mois.",
      prixMetaDescriptionEn: "Convex pricing: free tier with 1M calls and 0.5 GB, then usage-based; Professional at $25 per developer per month.",
      altTitleFr: "Alternatives à Convex : Supabase, Firebase, Appwrite",
      altTitleEn: "Convex alternatives: Supabase, Firebase, Appwrite",
      altMetaDescriptionFr: "Tu préfères le SQL ou un backend auto-hébergé ? Supabase, Firebase et Appwrite comparés à Convex.",
      altMetaDescriptionEn: "Prefer SQL or a self-hosted backend? Supabase, Firebase and Appwrite compared with Convex.",
      avisTitleFr: "Avis Convex : le temps réel sans plomberie",
      avisTitleEn: "Convex review: realtime without plumbing",
      avisMetaDescriptionFr: "Avis Convex, noté {rating} : temps réel natif et tout en TypeScript ; pas de SQL, Pro facturé par développeur.",
      avisMetaDescriptionEn: "Convex review, rated {rating}: native realtime and all TypeScript; no SQL, Pro billed per developer.",
    },
  }),
  tool(SECRETS, {
    slug: "aws-secrets-manager", name: "AWS Secrets Manager", url: "https://aws.amazon.com/secrets-manager/",
    short: "Service AWS pour stocker et faire tourner les secrets, facturé au secret et à l’appel.",
    shortEn: "AWS service to store and rotate secrets, billed per secret and per call.",
    long: "AWS Secrets Manager stocke les secrets de tes applications dans AWS et les fait tourner automatiquement. Il se facture à l’usage : environ 0,40 $ par secret et par mois, plus 0,05 $ par 10 000 appels API, sans engagement. Les nouvelles versions créées par la rotation ne sont pas facturées.",
    longEn: "AWS Secrets Manager stores your application secrets in AWS and rotates them automatically. It is billed by usage: about $0.40 per secret per month, plus $0.05 per 10,000 API calls, with no commitment. New versions created by rotation are not charged.",
    pricing: { free: "Pas de plan gratuit dédié ; crédits AWS Free Tier pour les nouveaux comptes", paid: "0,40 $ par secret et par mois + 0,05 $ par 10 000 appels" },
    pricingEn: { free: "No dedicated free plan; AWS Free Tier credits for new accounts", paid: "$0.40 per secret per month + $0.05 per 10,000 calls" },
    defaultMonthlyPrice: null,
    pricing_v5: pricingV5({
      kind: "usage", name: "Par secret", source: "https://aws.amazon.com/secrets-manager/pricing/", monthlyUsd: 0.4, reliability: "medium",
      cautions: ["Montant lu dans les exemples chiffrés de la page AWS.", "Les appels API (0,05 $ par 10 000) s’ajoutent au prix par secret."],
      cautionsEn: ["Amount read from the worked examples on the AWS page.", "API calls ($0.05 per 10,000) come on top of the per-secret price."],
      plans: [
        plan("per-secret", "Par secret", { source: "https://aws.amazon.com/secrets-manager/pricing/", unit: "usage", amount: 0.4, compare: true, priceStatus: "usage" }),
      ],
    }),
    pros: ["Rien à opérer : service géré par AWS.", "Facturation à l’usage, sans engagement.", "Rotation automatique des secrets."],
    prosEn: ["Nothing to operate: managed by AWS.", "Usage-based billing, no commitment.", "Automatic secret rotation."],
    cons: ["Pensé pour les équipes déjà sur AWS.", "La facture grimpe avec le nombre de secrets."],
    consEn: ["Built for teams already on AWS.", "The bill grows with the number of secrets."],
    useCases: ["Gérer les identifiants de bases de données sur AWS.", "Faire tourner des secrets automatiquement.", "Remplacer un Vault auto-hébergé."],
    useCasesEn: ["Manage database credentials on AWS.", "Rotate secrets automatically.", "Replace a self-hosted Vault."],
    alternatives: ["vault", "doppler", "infisical", "akeyless"],
    verdict: {
      keepIf: ["Ton infrastructure tourne déjà sur AWS et tu ne veux plus opérer Vault."],
      avoidIf: ["Ton équipe est multi-cloud, ou tu veux une interface simple pour toute l’équipe."],
      threshold: "Compte 0,40 $ par secret et par mois : 15 secrets et 4 000 appels font environ 6 $/mois.",
    },
    verdictEn: {
      keepIf: ["Your infrastructure already runs on AWS and you no longer want to operate Vault."],
      avoidIf: ["Your team is multi-cloud, or you want a simple interface for the whole team."],
      threshold: "Count $0.40 per secret per month: 15 secrets and 4,000 calls come to about $6/month.",
    },
    seo: {
      metaDescription: "AWS Secrets Manager sur ToolTrim : secrets gérés sur AWS, prix et limites.",
      presentationTitleFr: "AWS Secrets Manager : les secrets gérés par AWS",
      presentationTitleEn: "AWS Secrets Manager: secrets managed by AWS",
      presentationMetaDescriptionFr: "AWS Secrets Manager stocke et fait tourner tes secrets dans AWS, facturé environ 0,40 $ par secret et par mois.",
      presentationMetaDescriptionEn: "AWS Secrets Manager stores and rotates your secrets in AWS, billed about $0.40 per secret per month.",
      prixTitleFr: "Prix d’AWS Secrets Manager : 0,40 $ par secret",
      prixTitleEn: "AWS Secrets Manager pricing: $0.40 per secret",
      prixMetaDescriptionFr: "Prix d’AWS Secrets Manager : 0,40 $ par secret et par mois, plus les appels API facturés à l’usage, sans engagement ni minimum.",
      prixMetaDescriptionEn: "AWS Secrets Manager pricing: $0.40 per secret per month, plus usage-based API calls, with no commitment or minimum.",
      altTitleFr: "Alternatives à AWS Secrets Manager : Vault, Doppler",
      altTitleEn: "AWS Secrets Manager alternatives: Vault, Doppler",
      altMetaDescriptionFr: "Multi-cloud ou interface pour toute l’équipe ? Vault, Doppler, Infisical et Akeyless comparés à AWS Secrets Manager.",
      altMetaDescriptionEn: "Multi-cloud or a UI for the whole team? Vault, Doppler, Infisical and Akeyless compared with AWS Secrets Manager.",
      avisTitleFr: "Avis AWS Secrets Manager : simple si tu es sur AWS",
      avisTitleEn: "AWS Secrets Manager review: simple if you’re on AWS",
      avisMetaDescriptionFr: "Avis AWS Secrets Manager, noté {rating} : géré, à l’usage, rotation automatique ; lié à AWS et facturé au secret.",
      avisMetaDescriptionEn: "AWS Secrets Manager review, rated {rating}: managed, usage-based, automatic rotation; tied to AWS and billed per secret.",
    },
  }),
  tool(SECRETS, {
    slug: "akeyless", name: "Akeyless", url: "https://www.akeyless.io/",
    short: "Gestion de secrets en SaaS : secrets dynamiques, rotation, PKI, plan gratuit limité.",
    shortEn: "SaaS secrets management: dynamic secrets, rotation, PKI, limited free plan.",
    long: "Akeyless gère les secrets, les certificats et le chiffrement en SaaS, avec une option hybride qui garde des passerelles chez toi. Le plan Free couvre 5 clients, 5 secrets dynamiques et 5 secrets à rotation, avec 3 jours de journal d’audit. Le plan Enterprise est sur devis.",
    longEn: "Akeyless manages secrets, certificates and encryption as SaaS, with a hybrid option that keeps gateways on your premises. The Free plan covers 5 clients, 5 dynamic secrets and 5 rotated secrets, with 3 days of audit log. The Enterprise plan is quote-based.",
    pricing: { free: "Free : 5 clients, 5 secrets dynamiques, 5 à rotation, audit 3 jours", paid: "Enterprise sur devis" },
    pricingEn: { free: "Free: 5 clients, 5 dynamic secrets, 5 rotated, 3-day audit", paid: "Enterprise on quote" },
    defaultMonthlyPrice: 0,
    pros: ["Pas de cluster à opérer, contrairement à Vault.", "Secrets dynamiques et rotation, aussi en plan gratuit.", "Option hybride avec passerelles sur site."],
    prosEn: ["No cluster to operate, unlike Vault.", "Dynamic secrets and rotation, even on the free plan.", "Hybrid option with on-prem gateways."],
    cons: ["Prix Enterprise non public.", "Plan gratuit très limité (5 clients, audit 3 jours)."],
    consEn: ["Enterprise price not public.", "Very limited free plan (5 clients, 3-day audit)."],
    useCases: ["Remplacer Vault sans opérer de cluster.", "Générer des secrets dynamiques pour une base.", "Centraliser certificats et secrets."],
    useCasesEn: ["Replace Vault without operating a cluster.", "Generate dynamic secrets for a database.", "Centralise certificates and secrets."],
    alternatives: ["vault", "doppler", "infisical", "aws-secrets-manager"],
    verdict: {
      keepIf: ["Tu as besoin de secrets dynamiques comme avec Vault, sans opérer de cluster."],
      avoidIf: ["Tu veux un prix public avant de t’engager."],
      threshold: "Le Free suffit pour essayer (5 clients) ; dès la production, il faut négocier un devis Enterprise.",
    },
    verdictEn: {
      keepIf: ["You need dynamic secrets like Vault, without operating a cluster."],
      avoidIf: ["You want a public price before committing."],
      threshold: "Free is enough to try it (5 clients); for production, you need to negotiate an Enterprise quote.",
    },
    seo: {
      metaDescription: "Akeyless sur ToolTrim : secrets en SaaS, plan gratuit et limites.",
      presentationTitleFr: "Akeyless : gestion de secrets en SaaS, sans cluster",
      presentationTitleEn: "Akeyless: SaaS secrets management, no cluster",
      presentationMetaDescriptionFr: "Akeyless gère secrets, certificats et chiffrement en SaaS ou en hybride ; plan Free à 5 clients, Enterprise sur devis.",
      presentationMetaDescriptionEn: "Akeyless manages secrets, certificates and encryption as SaaS or hybrid; Free plan with 5 clients, Enterprise on quote.",
      prixTitleFr: "Prix d’Akeyless : Free limité, Enterprise sur devis",
      prixTitleEn: "Akeyless pricing: limited Free, Enterprise on quote",
      prixMetaDescriptionFr: "Prix d’Akeyless : plan Free à 5 clients, 5 secrets dynamiques et 3 jours d’audit ; Enterprise sur devis, sans prix public.",
      prixMetaDescriptionEn: "Akeyless pricing: Free plan with 5 clients, 5 dynamic secrets and 3 days of audit; Enterprise on quote, no public price.",
      altTitleFr: "Alternatives à Akeyless : Vault, Doppler, Infisical",
      altTitleEn: "Akeyless alternatives: Vault, Doppler, Infisical",
      altMetaDescriptionFr: "Prix public ou auto-hébergement ? Vault, Doppler, Infisical et AWS Secrets Manager comparés à Akeyless.",
      altMetaDescriptionEn: "Public price or self-hosting? Vault, Doppler, Infisical and AWS Secrets Manager compared with Akeyless.",
      avisTitleFr: "Avis Akeyless : Vault sans le cluster",
      avisTitleEn: "Akeyless review: Vault without the cluster",
      avisMetaDescriptionFr: "Avis Akeyless, noté {rating} : secrets dynamiques en SaaS, option hybride ; Free limité, Enterprise sans prix public.",
      avisMetaDescriptionEn: "Akeyless review, rated {rating}: SaaS dynamic secrets, hybrid option; limited Free, Enterprise with no public price.",
    },
  }),
];

let text = fs.readFileSync(file, "utf8");

// Relations : remplacer le tableau `alternatives` de la fiche visée.
for (const [slug, alternatives] of Object.entries(RELATIONS)) {
  const at = text.indexOf(`\n    "slug": "${slug}",`);
  if (at < 0) throw new Error(`fiche introuvable : ${slug}`);
  const end = text.indexOf("\n  }", at);
  const key = text.indexOf('\n    "alternatives": [', at);
  if (key < 0 || key > end) throw new Error(`champ alternatives introuvable : ${slug}`);
  const open = text.indexOf("[", key);
  const close = text.indexOf("]", open);
  const replacement = alternatives.length
    ? `[\n${alternatives.map((s) => `      ${JSON.stringify(s)}`).join(",\n")}\n    ]`
    : "[]";
  text = text.slice(0, open) + replacement + text.slice(close + 1);
}

// Titres et descriptions des pages /alternatives : ils annonçaient l'ancienne
// liste, or c'est le snippet qui se classe sans être cliqué (Supabase position
// 3,2, 0 clic). Teams : tutoiement (règles éditoriales du 25/11/2026).
const SEO_UPDATES = {
  unity: {
    altTitleFr: "5 alternatives à Unity : Godot, Unreal, GameMaker",
    altTitleEn: "5 Unity alternatives: Godot, Unreal, GameMaker, Defold",
    altMetaDescriptionFr: "Godot, Unreal Engine, GameMaker, Defold et Cocos Creator comparés à Unity sur la licence, les redevances, la 2D, la 3D et les plateformes d’export.",
    altMetaDescriptionEn: "Godot, Unreal Engine, GameMaker, Defold and Cocos Creator compared with Unity on licence, royalties, 2D, 3D and export platforms.",
  },
  supabase: {
    altTitleFr: "6 alternatives à Supabase : Firebase, Appwrite, Convex",
    altTitleEn: "6 Supabase alternatives: Firebase, Appwrite, Convex, Neon",
    altMetaDescriptionFr: "Firebase, Neon, Appwrite, Convex, PocketBase et MongoDB Atlas comparés à Supabase sur le prix, le palier gratuit, le SQL et l’auto-hébergement.",
    altMetaDescriptionEn: "Firebase, Neon, Appwrite, Convex, PocketBase and MongoDB Atlas compared with Supabase on price, free tier, SQL and self-hosting.",
  },
  vault: {
    altTitleFr: "4 alternatives à Vault : Doppler, Infisical, AWS, Akeyless",
    altTitleEn: "4 HashiCorp Vault alternatives: Doppler, Infisical, AWS",
    altMetaDescriptionFr: "Doppler, Infisical, AWS Secrets Manager et Akeyless comparés à HashiCorp Vault sur le prix, la mise en place et le cluster à opérer, ou pas.",
    altMetaDescriptionEn: "Doppler, Infisical, AWS Secrets Manager and Akeyless compared with HashiCorp Vault on price, setup and whether you run a cluster.",
  },
  "microsoft-teams": {
    altMetaDescriptionFr: "Tu veux sortir d’un écosystème fermé ? Slack, Google Chat et Discord comparés à Microsoft Teams sur les intégrations, les réunions et le prix.",
    altMetaDescriptionEn: "Want to leave a closed ecosystem? Slack, Google Chat and Discord compared with Microsoft Teams on integrations, meetings and price.",
  },
};
for (const [slug, fields] of Object.entries(SEO_UPDATES)) {
  const at = text.indexOf(`\n    "slug": "${slug}",`);
  const end = text.indexOf("\n  }", at);
  for (const [field, value] of Object.entries(fields)) {
    const keyAt = text.indexOf(`"${field}": `, at);
    if (keyAt < 0 || keyAt > end) throw new Error(`champ ${field} introuvable : ${slug}`);
    const valueStart = keyAt + field.length + 4;
    const raw = text.slice(valueStart).match(/^"(?:[^"\\]|\\.)*"/);
    if (!raw) throw new Error(`valeur non textuelle : ${slug}.${field}`);
    const valueEnd = valueStart + raw[0].length;
    text = text.slice(0, valueStart) + JSON.stringify(value) + text.slice(valueEnd);
  }
}

// Nouvelles fiches, en fin de tableau.
const added = [];
const indent = (entry) => JSON.stringify(entry, null, 2).split("\n").map((line) => `  ${line}`).join("\n");
let replaced = 0;
for (const entry of NEW_TOOLS) {
  const start = text.indexOf(`\n  {\n    "id": "${entry.slug}",`);
  if (start < 0) { added.push(entry); continue; }
  const end = text.indexOf("\n  }", start) + 4;
  text = `${text.slice(0, start + 1)}${indent(entry)}${text.slice(end)}`;
  replaced++;
}
if (added.length) {
  const tail = text.lastIndexOf("\n]");
  const block = added.map(indent).join(",\n");
  text = `${text.slice(0, tail)},\n${block}${text.slice(tail)}`;
}

JSON.parse(text);
fs.writeFileSync(file, text);
console.log(`${file} : ${Object.keys(RELATIONS).length} relations, ${added.length} fiches ajoutées, ${replaced} mises à jour`);
