/** fix-gsc-batch-2.mjs — 3 opportunités GSC supplémentaires (page 1, 0 clic) :
 * - dependabot : stub auto-généré réécrit. Vraie réponse : 100% gratuit sur tout
 *   repo GitHub (public ou privé), aucune offre payante pour la fonctionnalité
 *   coeur (les add-ons payants comme Advanced Security sont des produits séparés).
 * - switch-monster : nouvelle fiche (call tracking gratuit, vrai concurrent de
 *   ResponseTap, couverture presse 2026). La requête "switch.monster responsetap
 *   alternative" (150 impr, pos 5.91, 0 clic) cherchait ce comparatif.
 * - responsetap : alternatives vide -> switch-monster, plus titre FAQ dédié. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

// --- 1. Dependabot : réécriture complète (était un stub générique) ---
const dependabot = tools.find((x) => (x.slug || x.id) === "dependabot");
if (dependabot) {
  Object.assign(dependabot, {
    shortDescription: "Mises à jour automatiques des dépendances et alertes de sécurité, 100% gratuit sur GitHub.",
    shortDescriptionEn: "Automatic dependency updates and security alerts, 100% free on GitHub.",
    pricing: { free: "100% gratuit, sur tout repo GitHub (public ou privé), tous plans.", paid: "" },
    pricingEn: { free: "100% free, on every GitHub repo (public or private), all plans.", paid: "" },
    longDescription: "Dependabot est une fonctionnalité native de GitHub, totalement gratuite, sur tous les plans (Free, Pro, Team, Enterprise) et sur les repos publics comme privés. Il scanne tes dépendances (npm, pip, Maven, Gradle, Docker, Go, Terraform, GitHub Actions et une trentaine d'autres écosystèmes), alerte en cas de vulnérabilité connue, et peut ouvrir automatiquement des pull requests pour mettre à jour les versions concernées.\n\nIl ne faut pas le confondre avec les produits payants de la suite GitHub Advanced Security (GitHub Code Security à 30$/committer/mois, GitHub Secret Protection à 19$/committer/mois) : ce sont des add-ons séparés pour des fonctionnalités plus poussées (scan de code statique, détection de secrets). Le coeur de Dependabot, lui, n'a jamais nécessité de payer quoi que ce soit.",
    longDescriptionEn: "Dependabot is a native GitHub feature, completely free, on every plan (Free, Pro, Team, Enterprise) and on both public and private repos. It scans your dependencies (npm, pip, Maven, Gradle, Docker, Go, Terraform, GitHub Actions and about thirty other ecosystems), alerts on known vulnerabilities, and can automatically open pull requests to update affected versions.\n\nDon't confuse it with GitHub's paid Advanced Security suite (GitHub Code Security at $30/committer/month, GitHub Secret Protection at $19/committer/month): those are separate add-ons for more advanced features (static code scanning, secret detection). Dependabot's core feature has never required paying anything.",
    verdict: {
      keepIf: [
        "Tu as un repo GitHub (public ou privé) avec des dépendances tierces : aucune raison de ne pas l'activer",
        "Tu veux des alertes de sécurité automatiques sans payer un outil tiers",
      ],
      avoidIf: [
        "Tu veux du scan de code statique ou de la détection de secrets : c'est GitHub Advanced Security, un produit payant séparé",
      ],
      threshold: "Gratuit et sans contrepartie : à activer systématiquement sur tout repo GitHub avec des dépendances.",
    },
    verdictEn: {
      keepIf: [
        "You have a GitHub repo (public or private) with third-party dependencies: no reason not to enable it",
        "You want automatic security alerts without paying for a third-party tool",
      ],
      avoidIf: [
        "You want static code scanning or secret detection: that's GitHub Advanced Security, a separate paid product",
      ],
      threshold: "Free with no catch: enable it on every GitHub repo with dependencies.",
    },
    pros: [
      "100% gratuit, sur tous les plans GitHub et tous les repos",
      "Couvre une trentaine d'écosystèmes (npm, pip, Maven, Docker, Go, Terraform...)",
      "Ouvre automatiquement des pull requests de mise à jour",
      "Alertes de vulnérabilité en temps réel",
    ],
    prosEn: [
      "100% free, on every GitHub plan and every repo",
      "Covers about thirty ecosystems (npm, pip, Maven, Docker, Go, Terraform...)",
      "Automatically opens update pull requests",
      "Real-time vulnerability alerts",
    ],
    cons: [
      "Limité à l'écosystème GitHub (pas pour GitLab ou Bitbucket)",
      "Le scan de code avancé nécessite GitHub Advanced Security, payant",
      "Peut générer beaucoup de pull requests sur un repo avec de nombreuses dépendances",
    ],
    consEn: [
      "Limited to the GitHub ecosystem (not for GitLab or Bitbucket)",
      "Advanced code scanning requires the paid GitHub Advanced Security",
      "Can generate a lot of pull requests on a repo with many dependencies",
    ],
    useCases: [
      "Recevoir des alertes automatiques sur les vulnérabilités connues",
      "Mettre à jour les dépendances via des pull requests automatiques",
      "Sécuriser un repo open source ou privé sans outil tiers payant",
    ],
    useCasesEn: [
      "Get automatic alerts on known vulnerabilities",
      "Update dependencies via automatic pull requests",
      "Secure an open source or private repo without a paid third-party tool",
    ],
    defaultMonthlyPrice: 0,
    seo: Object.assign({}, dependabot.seo, {
      metaDescription: "Dependabot 2026 : 100% gratuit sur tout repo GitHub. Ce qu'il couvre vraiment, et la différence avec GitHub Advanced Security (payant). Le verdict ToolTrim.",
    }),
    alternatives: ["github"],
  });
  console.log("dependabot: réécrit (pricing clarifié : 100% gratuit)");
}

// --- 2. Nouvelle fiche : switch.monster (call tracking gratuit) ---
if (!present.has("switch-monster")) {
  tools.push({
    id: "switch-monster",
    slug: "switch-monster",
    name: "switch.monster",
    category: "analytics",
    shortDescription: "Call tracking gratuit : connecte les appels entrants aux campagnes PPC et Google Ads.",
    shortDescriptionEn: "Free call tracking: connects inbound calls to PPC and Google Ads campaigns.",
    pricing: { free: "Gratuit sur le coeur du produit (tracking, numéros dynamiques).", paid: "" },
    pricingEn: { free: "Free for the core product (tracking, dynamic numbers).", paid: "" },
    defaultMonthlyPrice: 0,
    affiliateLink: "https://switch.monster/",
    websiteUrl: "https://switch.monster/",
    logo: "",
    longDescription: "switch.monster fait du call tracking et de l'attribution marketing : il affiche un numéro de téléphone différent selon le canal qui a amené le visiteur (Google Ads, PPC, SEO, direct...), ce qui permet de relier un appel entrant à la campagne qui l'a généré. C'est exactement la même catégorie que ResponseTap, mais avec un positionnement gratuit qui change la donne pour les petites structures.\n\nLes fonctionnalités couvrent l'insertion dynamique de numéro, le routage d'appels (groupes, IVR), l'enregistrement et le reporting. Pour une agence ou un e-commerçant qui veut juste savoir quelles campagnes génèrent des appels sans payer un abonnement dédié, c'est une alternative sérieuse à des outils historiquement payants comme ResponseTap ou CallRail.",
    longDescriptionEn: "switch.monster does call tracking and marketing attribution: it shows a different phone number depending on which channel brought the visitor (Google Ads, PPC, SEO, direct...), letting you tie an inbound call back to the campaign that generated it. That's the exact same category as ResponseTap, but with a free positioning that changes the math for smaller teams.\n\nFeatures cover dynamic number insertion, call routing (hunt groups, IVR), recording and reporting. For an agency or e-commerce business that just wants to know which campaigns generate calls without paying for a dedicated subscription, it's a serious alternative to historically paid tools like ResponseTap or CallRail.",
    verdict: {
      keepIf: [
        "Tu veux relier tes appels entrants à tes campagnes PPC/Google Ads sans payer d'abonnement",
        "Tu es une petite structure ou agence qui démarre avec le call tracking",
      ],
      avoidIf: [
        "Tu as besoin d'intégrations CRM très poussées ou d'un support entreprise garanti : les outils payants établis (ResponseTap) ont plus de maturité sur ce terrain",
      ],
      threshold: "Excellent point d'entrée gratuit pour le call tracking. Pour des besoins entreprise complexes, compare avec ResponseTap ou CallRail.",
    },
    verdictEn: {
      keepIf: [
        "You want to connect inbound calls to your PPC/Google Ads campaigns without paying for a subscription",
        "You're a small team or agency just getting started with call tracking",
      ],
      avoidIf: [
        "You need very deep CRM integrations or guaranteed enterprise support: established paid tools (ResponseTap) have more maturity there",
      ],
      threshold: "An excellent free entry point for call tracking. For complex enterprise needs, compare against ResponseTap or CallRail.",
    },
    pros: [
      "Gratuit sur le coeur du produit (tracking, numéros dynamiques)",
      "Attribution claire entre appels et campagnes marketing",
      "Mise en place rapide, pas d'engagement",
    ],
    prosEn: [
      "Free for the core product (tracking, dynamic numbers)",
      "Clear attribution between calls and marketing campaigns",
      "Quick setup, no commitment",
    ],
    cons: [
      "Plus jeune et moins éprouvé que les outils payants établis",
      "Intégrations CRM probablement moins matures que ResponseTap",
    ],
    consEn: [
      "Younger and less proven than established paid tools",
      "CRM integrations likely less mature than ResponseTap",
    ],
    useCases: [
      "Relier un appel entrant à la campagne Google Ads ou PPC qui l'a généré",
      "Router les appels par groupes ou IVR",
      "Démarrer le call tracking sans budget dédié",
    ],
    useCasesEn: [
      "Connect an inbound call to the Google Ads or PPC campaign that generated it",
      "Route calls via hunt groups or IVR",
      "Start call tracking with no dedicated budget",
    ],
    covers: ["analytics"],
    relevantFor: ["freelance", "createur-contenu"],
    personas: ["freelance"],
    soloRelevance: "high",
    teamRelevance: "medium",
    seo: {
      metaDescription: "switch.monster 2026 : call tracking gratuit, alternative à ResponseTap. Fonctionnalités, attribution marketing et verdict ToolTrim.",
    },
    alternatives: ["responsetap"],
    articles: [],
    freeAlternative: null,
    tool_type: "metier",
    substitutable: true,
    host_app: null,
    bundle_parent: null,
    verticals: [],
    functional_needs: ["analytics"],
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
      source_domain: "switch.monster",
      usage_sensitive: false,
      compare_plan_kind: "free",
      compare_plan_name: "Gratuit",
      price_reliability: "medium",
      location_sensitive: false,
      official_source_url: "https://switch.monster/",
      verification_status: "third_party_observed",
      compare_price_monthly_eur: 0,
    },
    substitution_cluster_v2: "analytics",
  });
  console.log("switch-monster: nouvelle fiche créée");
}

// --- 3. ResponseTap : relier à switch.monster + titre alternatives dédié ---
const responsetap = tools.find((x) => (x.slug || x.id) === "responsetap");
if (responsetap) {
  responsetap.alternatives = ["switch-monster"];
  responsetap.seo = Object.assign({}, responsetap.seo, {
    altTitleFr: "ResponseTap vs switch.monster (gratuit) : quelle alternative en 2026 ? | ToolTrim",
    altTitleEn: "ResponseTap vs switch.monster (Free): Which Alternative in 2026? | ToolTrim",
    altMetaDescriptionFr: "switch.monster est une alternative gratuite à ResponseTap pour le call tracking. ToolTrim compare les deux : fonctionnalités, attribution marketing et quand choisir l'un ou l'autre.",
    altMetaDescriptionEn: "switch.monster is a free alternative to ResponseTap for call tracking. ToolTrim compares both: features, marketing attribution and when to pick one over the other.",
  });
  console.log("responsetap: alternative + titre dédié");
}

const out = JSON.stringify(tools, null, 2) + "\n";
JSON.parse(out);
writeFileSync(PATH, out);
console.log("OK — JSON valide");
