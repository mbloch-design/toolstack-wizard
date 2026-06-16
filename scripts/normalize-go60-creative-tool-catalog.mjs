import { readFile, writeFile } from "node:fs/promises";

const TOOLS_PATH = "src/data/tools_v4.json";
const TODAY = "2026-06-15";
const USD_TO_EUR_RATE = 0.92;

function eurFromUsd(value) {
  return Math.round(value * USD_TO_EUR_RATE * 100) / 100;
}

function billingOption(value, labelFr, labelEn, extra = {}) {
  return {
    value,
    label_fr: labelFr,
    label_en: labelEn,
    ...extra,
  };
}

function defaultSubscriptionOptions({ plan, monthlyEur, original, currency = "USD" }) {
  return [
    billingOption("free", "Gratuit", "Free", { price_monthly_eur: 0 }),
    billingOption("paid", plan, plan, {
      price_monthly_eur: monthlyEur,
      price_original: original,
      currency,
    }),
    billingOption("team", "Équipe", "Team", { needs_verification: true }),
    billingOption("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
  ];
}

function mergeArray(...arrays) {
  return [...new Set(arrays.flat().filter(Boolean))];
}

function verifiedUsdPricing({
  usd,
  plan,
  kind = "individual",
  sourceDomain,
  sourceUrl,
  cautions = [],
  usageSensitive = false,
  billingModel,
  billingOptions,
}) {
  const monthlyEur = eurFromUsd(usd);
  return {
    compare_price_monthly_eur: monthlyEur,
    compare_plan_name: plan,
    compare_plan_kind: kind,
    billing_model: billingModel || (kind === "bundle" ? "bundle" : kind === "seat" ? "seat" : "subscription"),
    billing_options: billingOptions || defaultSubscriptionOptions({
      plan,
      monthlyEur,
      original: usd,
      currency: "USD",
    }),
    price_original: usd,
    price_original_currency: "USD",
    currency: "USD",
    conversion_rate_to_eur: USD_TO_EUR_RATE,
    price_reliability: "high",
    usage_sensitive: usageSensitive,
    location_sensitive: true,
    cautions: mergeArray(
      cautions,
      [`Prix source en USD, conversion indicative avec le taux fixe ${USD_TO_EUR_RATE}.`]
    ),
    source_domain: sourceDomain,
    verified_on: TODAY,
    official_source_url: sourceUrl,
    verification_status: "official_explicit",
  };
}

function verifiedEurPricing({
  eur,
  plan,
  kind = "individual",
  sourceDomain,
  sourceUrl,
  cautions = [],
  usageSensitive = false,
  billingModel,
  billingOptions,
}) {
  return {
    compare_price_monthly_eur: eur,
    compare_plan_name: plan,
    compare_plan_kind: kind,
    billing_model: billingModel || (kind === "bundle" ? "bundle" : kind === "seat" ? "seat" : "subscription"),
    billing_options: billingOptions || defaultSubscriptionOptions({
      plan,
      monthlyEur: eur,
      original: eur,
      currency: "EUR",
    }),
    price_original: eur,
    price_original_currency: "EUR",
    currency: "EUR",
    price_reliability: "high",
    usage_sensitive: usageSensitive,
    location_sensitive: true,
    cautions,
    source_domain: sourceDomain,
    verified_on: TODAY,
    official_source_url: sourceUrl,
    verification_status: "official_explicit",
  };
}

function freePricing({ plan = "Free", sourceDomain, sourceUrl, cautions = [] }) {
  return {
    compare_price_monthly_eur: 0,
    compare_plan_name: plan,
    compare_plan_kind: "free",
    billing_model: "free",
    billing_options: [
      billingOption("free", "Gratuit", "Free", { price_monthly_eur: 0 }),
      billingOption("team", "Équipe", "Team", { needs_verification: true }),
      billingOption("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
    ],
    price_original: 0,
    price_original_currency: "EUR",
    currency: "EUR",
    price_reliability: "high",
    usage_sensitive: false,
    location_sensitive: false,
    cautions,
    source_domain: sourceDomain,
    verified_on: TODAY,
    official_source_url: sourceUrl,
    verification_status: "official_explicit",
  };
}

function oneTimePricing({
  amount,
  currency = "USD",
  plan,
  sourceDomain,
  sourceUrl,
  cautions = [],
}) {
  return {
    compare_price_monthly_eur: 0,
    compare_plan_name: plan,
    compare_plan_kind: "one_time",
    billing_model: "one_time",
    billing_options: [
      billingOption("one_time", "Achat unique", "One-time", {
        price_monthly_eur: 0,
        price_original: amount,
        currency,
      }),
      billingOption("included", "Déjà acheté", "Already bought", { price_monthly_eur: 0 }),
      billingOption("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
    ],
    price_original: amount,
    price_original_currency: currency,
    currency,
    price_reliability: "medium",
    usage_sensitive: false,
    location_sensitive: true,
    cautions: mergeArray(cautions, "Achat ponctuel ou licence non mensuelle : ne pas compter comme abonnement mensuel sans confirmation."),
    source_domain: sourceDomain,
    verified_on: TODAY,
    official_source_url: sourceUrl,
    verification_status: "official_contextual",
  };
}

const updates = {
  canva: {
    tool_type: "metier",
    category: "design-tools",
    functional_needs: [
      "design-visuel",
      "brand-kit",
      "templates",
      "presentations",
      "social-assets",
      "export-client",
    ],
    pricing_v5: verifiedUsdPricing({
      usd: 15,
      plan: "Canva Pro",
      sourceDomain: "canva.com",
      sourceUrl: "https://www.canva.com/pricing/",
      cautions: ["Vérifier si l'utilisateur est sur Free, Pro ou Teams."],
    }),
  },
  "canva-pro": {
    tool_type: "metier",
    category: "design-tools",
    functional_needs: ["design-visuel", "brand-kit", "templates", "social-assets"],
    bundle_parent: "canva",
    force_silence: true,
    pricing_v5: null,
  },
  "adobe-creative-cloud": {
    name: "Adobe Creative Cloud All Apps",
    category: "design-tools",
    websiteUrl: "https://www.adobe.com/creativecloud/plans.html",
    tool_type: "metier",
    functional_needs: [
      "suite-creative",
      "retouche-photo",
      "illustration-vectorielle",
      "motion-design",
      "montage-video",
      "licences-creative-cloud",
    ],
    pricing_v5: verifiedUsdPricing({
      usd: 69.99,
      plan: "Creative Cloud All Apps",
      kind: "bundle",
      sourceDomain: "adobe.com",
      sourceUrl: "https://www.adobe.com/creativecloud/plans.html",
      cautions: ["Peut être déjà couvert par une licence équipe ou entreprise."],
    }),
  },
  "adobe-lightroom": {
    functional_needs: ["retouche-photo", "gestion-raw", "catalogage", "exports-photo"],
    pricing_v5: verifiedUsdPricing({
      usd: 11.99,
      plan: "Lightroom",
      sourceDomain: "adobe.com",
      sourceUrl: "https://www.adobe.com/products/photoshop-lightroom/plans.html",
      cautions: ["Vérifier si l'utilisateur paye Lightroom seul ou le plan Photography."],
    }),
  },
  "adobe-photoshop": {
    functional_needs: ["retouche-photo", "photomontage", "mockups", "assets-client", "design-visuel"],
  },
  "adobe-illustrator": {
    functional_needs: ["illustration-vectorielle", "logo", "identite-visuelle", "iconographie", "design-visuel"],
  },
  "adobe-express": {
    tool_type: "satellite",
    category: "creation",
    functional_needs: ["social-assets", "templates", "quick-design", "brand-kit", "video-short-form"],
  },
  "adobe-acrobat": {
    tool_type: "satellite",
    category: "productivity-tracking",
    functional_needs: ["pdf-review", "signature", "client-validation", "document-delivery"],
  },
  indesign: {
    tool_type: "metier",
    functional_needs: ["mise-en-page", "print-design", "pdf-client", "brand-documents"],
  },
  sketch: {
    tool_type: "metier",
    functional_needs: ["ui-design", "prototypage", "design-system"],
  },
  "affinity-photo": {
    functional_needs: ["retouche-photo", "photomontage", "design-visuel"],
    pricing_v5: oneTimePricing({
      amount: 69.99,
      currency: "USD",
      plan: "Universal / one-time license",
      sourceDomain: "affinity.serif.com",
      sourceUrl: "https://affinity.serif.com/",
    }),
  },
  procreate: {
    tool_type: "metier",
    functional_needs: ["illustration", "sketching", "ipad-drawing", "concept-art"],
    pricing_v5: oneTimePricing({
      amount: 12.99,
      currency: "USD",
      plan: "iPad app",
      sourceDomain: "procreate.com",
      sourceUrl: "https://procreate.com/",
    }),
  },
  "envato-elements": {
    category: "design-tools",
    tool_type: "satellite",
    functional_needs: [
      "asset-library",
      "templates",
      "stock-photos",
      "video-templates",
      "fonts",
      "music-sfx",
      "creative-licensing",
    ],
    pricing_v5: verifiedUsdPricing({
      usd: 16.5,
      plan: "Core annual monthly equivalent",
      sourceDomain: "elements.envato.com",
      sourceUrl: "https://elements.envato.com/pricing",
      cautions: ["Le prix mensuel sans annuel est plus élevé ; vérifier le mode de facturation."],
    }),
  },
  "remove-bg": {
    category: "creation",
    tool_type: "satellite",
    functional_needs: ["background-removal", "photo-cleanup", "ecommerce-assets", "visual-production"],
    pricing_v5: freePricing({
      sourceDomain: "remove.bg",
      sourceUrl: "https://www.remove.bg/pricing",
      cautions: ["Usage gratuit limité ; vérifier crédits ou abonnement si volume élevé."],
    }),
  },
  envato: {
    category: "design-tools",
    tool_type: "satellite",
    functional_needs: ["asset-marketplace", "templates", "creative-licensing"],
    bundle_parent: "envato-elements",
    force_silence: true,
  },
  lottiefiles: {
    category: "design-tools",
    tool_type: "satellite",
    functional_needs: ["animation-web", "lottie-export", "handoff-dev", "motion-assets"],
    pricing_v5: freePricing({
      sourceDomain: "lottiefiles.com",
      sourceUrl: "https://lottiefiles.com/pricing",
      cautions: ["Vérifier si un espace équipe ou une librairie privée est utilisée."],
    }),
  },
  "figma-tokens": {
    functional_needs: ["design-system", "tokens-design", "handoff-dev", "composants-ui"],
  },
  "figma-iconify": {
    functional_needs: ["iconographie", "composants-ui", "design-system"],
  },
  "figma-stark": {
    functional_needs: ["accessibilite", "contraste", "design-system", "audit-ui"],
  },
  stark: {
    name: "Stark standalone",
    functional_needs: ["accessibilite", "contraste", "audit-ui"],
    bundle_parent: "figma-stark",
    force_silence: true,
  },
  "figma-anima": {
    functional_needs: ["handoff-dev", "export-code", "prototype-to-code"],
  },
  "dynamic-mockups": {
    tool_type: "satellite",
    functional_needs: ["mockup-generation", "design-automation", "product-visuals", "batch-export"],
  },
  brandpad: {
    category: "design-tools",
    tool_type: "satellite",
    functional_needs: ["brand-guidelines", "brand-portal", "client-handoff", "asset-library"],
  },
  "mockup-plugins": {
    name: "Mockup plugins génériques",
    tool_type: "specialise",
    functional_needs: ["mockup-generation", "plugin-placeholder"],
    force_silence: true,
    pricing_v5: null,
  },
  icons8: {
    category: "design-tools",
    tool_type: "satellite",
    functional_needs: ["icons", "illustrations", "stock-assets", "design-resources"],
  },
  "noun-project": {
    category: "design-tools",
    tool_type: "satellite",
    functional_needs: ["icons", "iconographie", "design-resources"],
  },
  fontbase: {
    category: "design-tools",
    tool_type: "satellite",
    functional_needs: ["font-management", "typography", "creative-assets"],
    pricing_v5: freePricing({
      sourceDomain: "fontba.se",
      sourceUrl: "https://fontba.se/",
      cautions: ["Vérifier si l'utilisateur paie un compte Awesome ou une alternative font manager."],
    }),
  },
  rightfont: {
    category: "design-tools",
    tool_type: "satellite",
    functional_needs: ["font-management", "typography", "creative-assets"],
    pricing_v5: oneTimePricing({
      amount: 59,
      currency: "USD",
      plan: "License",
      sourceDomain: "rightfontapp.com",
      sourceUrl: "https://rightfontapp.com/",
    }),
  },
  "presets-lightroom": {
    name: "Lightroom presets génériques",
    tool_type: "specialise",
    functional_needs: ["photo-presets", "plugin-placeholder"],
    force_silence: true,
    pricing_v5: null,
  },
  "lightroom-presets": {
    name: "Lightroom presets génériques",
    tool_type: "specialise",
    functional_needs: ["photo-presets", "plugin-placeholder"],
    force_silence: true,
    pricing_v5: null,
  },
  "lightroom-mobile": {
    name: "Lightroom Mobile",
    tool_type: "satellite",
    functional_needs: ["retouche-photo-mobile", "exports-photo", "photo-presets"],
    bundle_parent: "adobe-lightroom",
  },
  "krea-ai": {
    functional_needs: ["generation-image", "moodboard", "real-time-ai-visual", "image-enhancement", "concept-art"],
  },
  krea: {
    name: "Krea AI duplicate",
    tool_type: "ia",
    category: "ai-general",
    functional_needs: ["generation-image", "real-time-ai-visual", "image-enhancement"],
    bundle_parent: "krea-ai",
    force_silence: true,
  },
  firefly: {
    name: "Adobe Firefly",
    category: "ai-general",
    tool_type: "ia",
    functional_needs: ["generation-image", "generative-fill", "retouche-photo", "creative-cloud-ai"],
    pricing_v5: freePricing({
      sourceDomain: "adobe.com",
      sourceUrl: "https://www.adobe.com/products/firefly.html",
      cautions: ["Les crédits génératifs et plans Firefly peuvent dépendre de Creative Cloud."],
    }),
  },
  "topaz-video-ai": {
    tool_type: "satellite",
    category: "creation",
    functional_needs: ["video-upscaling", "denoise-video", "slow-motion", "post-production"],
    pricing_v5: oneTimePricing({
      amount: 299,
      currency: "USD",
      plan: "License",
      sourceDomain: "topazlabs.com",
      sourceUrl: "https://www.topazlabs.com/topaz-video-ai",
    }),
  },
  "nik-collection": {
    functional_needs: ["retouche-photo", "color-grading", "photo-plugin", "creative-effects"],
    pricing_v5: oneTimePricing({
      amount: 149,
      currency: "USD",
      plan: "License",
      sourceDomain: "nikcollection.dxo.com",
      sourceUrl: "https://nikcollection.dxo.com/",
    }),
  },
  "adobe-enhance-speech": {
    tool_type: "ia",
    category: "ai-general",
    functional_needs: ["audio-cleanup", "voice-enhancement", "video-post-production"],
    pricing_v5: freePricing({
      sourceDomain: "podcast.adobe.com",
      sourceUrl: "https://podcast.adobe.com/enhance",
      cautions: ["Vérifier si l'usage passe par Adobe Express Premium ou Creative Cloud."],
    }),
  },
  "motion-array": {
    category: "creation",
    tool_type: "satellite",
    functional_needs: ["video-templates", "stock-video", "music-sfx", "motion-assets", "creative-licensing"],
  },
  storyblocks: {
    category: "creation",
    tool_type: "satellite",
    functional_needs: ["stock-video", "stock-audio", "templates", "creative-licensing"],
  },
  artlist: {
    functional_needs: ["music-licensing", "stock-video", "sfx", "creative-licensing"],
  },
  "epidemic-sound": {
    functional_needs: ["music-licensing", "sfx", "video-production"],
  },
  pixieset: {
    functional_needs: ["galerie-client", "livraison-client", "vente-prints", "photo-proofing"],
  },
  wetransfer: {
    functional_needs: ["file-transfer", "client-delivery", "creative-review"],
  },
  paypal: {
    category: "finance",
    tool_type: "gestion",
    functional_needs: ["paiement-client", "facturation", "encaissement"],
  },
  "google-analytics": {
    category: "analytics",
    tool_type: "satellite",
    functional_needs: ["web-analytics", "conversion-tracking", "portfolio-measurement", "campaign-measurement"],
  },
  tella: {
    category: "creation",
    tool_type: "satellite",
    functional_needs: ["screen-recording", "video-editing", "client-demo", "video-sharing"],
    pricing_v5: verifiedUsdPricing({
      usd: 12,
      plan: "Pro",
      sourceDomain: "tella.tv",
      sourceUrl: "https://www.tella.tv/pricing",
      cautions: ["Vérifier si le plan gratuit suffit ou si les limites imposent Pro."],
    }),
  },
  spline: {
    category: "design-tools",
    tool_type: "satellite",
    functional_needs: ["3d-design", "web-animation", "interactive-design", "prototype-3d"],
    pricing_v5: verifiedUsdPricing({
      usd: 12,
      plan: "Pro",
      sourceDomain: "spline.design",
      sourceUrl: "https://spline.design/pricing",
      cautions: ["Le plan gratuit peut suffire si le watermark et les limites ne posent pas problème."],
    }),
  },
  "ae-overlord": {
    pricing_v5: oneTimePricing({
      amount: 45,
      currency: "USD",
      plan: "License",
      sourceDomain: "battleaxe.co",
      sourceUrl: "https://battleaxe.co/overlord",
    }),
  },
  "ae-gifgun": {
    pricing_v5: oneTimePricing({
      amount: 39.99,
      currency: "USD",
      plan: "License",
      sourceDomain: "aescripts.com",
      sourceUrl: "https://aescripts.com/gifgun/",
    }),
  },
  "ae-red-giant": {
    pricing_v5: {
      compare_price_monthly_eur: 0,
      compare_plan_name: "Maxon subscription",
      compare_plan_kind: "subscription",
      price_reliability: "official_context_required",
      usage_sensitive: true,
      location_sensitive: true,
      cautions: ["Tarif Maxon variable selon suite et bundle ; vérifier le plan exact avant calcul mensuel."],
      source_domain: "maxon.net",
      verified_on: TODAY,
      official_source_url: "https://www.maxon.net/en/buy",
      verification_status: "needs_official_quote",
    },
  },
};

const billingOverrides = {
  figma: {
    billing_model: "seat",
    billing_options: [
      billingOption("free", "Starter", "Starter", { price_monthly_eur: 0 }),
      billingOption("paid", "Professional seat", "Professional seat", { price_monthly_eur: 16, currency: "EUR" }),
      billingOption("team", "Organization / équipe", "Organization / team", { needs_verification: true }),
      billingOption("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
    ],
  },
  canva: {
    billing_model: "subscription",
    billing_options: [
      billingOption("free", "Free", "Free", { price_monthly_eur: 0 }),
      billingOption("paid", "Canva Pro", "Canva Pro", {
        price_monthly_eur: eurFromUsd(15),
        price_original: 15,
        currency: "USD",
      }),
      billingOption("team", "Canva Teams", "Canva Teams", { needs_verification: true }),
      billingOption("included", "Inclus équipe", "Team included", { price_monthly_eur: 0 }),
      billingOption("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
    ],
  },
  "adobe-cc": {
    billing_model: "bundle",
    billing_options: [
      billingOption("bundle", "Creative Cloud All Apps", "Creative Cloud All Apps", {
        price_monthly_eur: 78.65,
        currency: "EUR",
      }),
      billingOption("included", "Licence entreprise", "Company license", { price_monthly_eur: 0 }),
      billingOption("team", "Licence équipe", "Team license", { needs_verification: true }),
      billingOption("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
    ],
  },
  "adobe-creative-cloud": {
    billing_model: "bundle",
    billing_options: [
      billingOption("bundle", "Creative Cloud All Apps", "Creative Cloud All Apps", {
        price_monthly_eur: eurFromUsd(69.99),
        price_original: 69.99,
        currency: "USD",
      }),
      billingOption("included", "Licence entreprise", "Company license", { price_monthly_eur: 0 }),
      billingOption("team", "Licence équipe", "Team license", { needs_verification: true }),
      billingOption("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
    ],
  },
  "adobe-lightroom": {
    billing_model: "subscription",
    billing_options: [
      billingOption("single_app", "Lightroom seul", "Lightroom only", {
        price_monthly_eur: eurFromUsd(11.99),
        price_original: 11.99,
        currency: "USD",
      }),
      billingOption("bundle", "Photography plan", "Photography plan", {
        price_monthly_eur: eurFromUsd(19.99),
        price_original: 19.99,
        currency: "USD",
      }),
      billingOption("included", "Inclus Creative Cloud", "Included in Creative Cloud", { price_monthly_eur: 0 }),
      billingOption("team", "Licence équipe", "Team license", { needs_verification: true }),
      billingOption("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
    ],
  },
  "adobe-photoshop": {
    billing_model: "seat",
    billing_options: [
      billingOption("single_app", "Photoshop seul", "Photoshop only", { price_monthly_eur: 26.21, currency: "EUR" }),
      billingOption("bundle", "Photography / Creative Cloud", "Photography / Creative Cloud", { needs_verification: true }),
      billingOption("included", "Inclus Creative Cloud", "Included in Creative Cloud", { price_monthly_eur: 0 }),
      billingOption("team", "Licence équipe", "Team license", { needs_verification: true }),
      billingOption("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
    ],
  },
  "adobe-illustrator": {
    billing_model: "seat",
    billing_options: [
      billingOption("single_app", "Illustrator seul", "Illustrator only", { price_monthly_eur: 26.21, currency: "EUR" }),
      billingOption("included", "Inclus Creative Cloud", "Included in Creative Cloud", { price_monthly_eur: 0 }),
      billingOption("team", "Licence équipe", "Team license", { needs_verification: true }),
      billingOption("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
    ],
  },
  "adobe-premiere-pro": {
    billing_model: "seat",
    billing_options: [
      billingOption("single_app", "Premiere Pro seul", "Premiere Pro only", { price_monthly_eur: 26.21, currency: "EUR" }),
      billingOption("included", "Inclus Creative Cloud", "Included in Creative Cloud", { price_monthly_eur: 0 }),
      billingOption("team", "Licence équipe", "Team license", { needs_verification: true }),
      billingOption("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
    ],
  },
  "adobe-after-effects": {
    billing_model: "seat",
    billing_options: [
      billingOption("single_app", "After Effects seul", "After Effects only", { price_monthly_eur: 26.21, currency: "EUR" }),
      billingOption("included", "Inclus Creative Cloud", "Included in Creative Cloud", { price_monthly_eur: 0 }),
      billingOption("team", "Licence équipe", "Team license", { needs_verification: true }),
      billingOption("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
    ],
  },
  "envato-elements": {
    billing_model: "subscription",
    billing_options: [
      billingOption("paid", "Core annuel", "Core annual", {
        price_monthly_eur: eurFromUsd(16.5),
        price_original: 16.5,
        currency: "USD",
      }),
      billingOption("team", "Teams", "Teams", { needs_verification: true }),
      billingOption("marketplace", "Achat ponctuel", "One-off marketplace", { needs_verification: true }),
      billingOption("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
    ],
  },
  "remove-bg": {
    billing_model: "credits",
    billing_options: [
      billingOption("free", "Free limité", "Limited free", { price_monthly_eur: 0 }),
      billingOption("credits", "Crédits", "Credits", { needs_verification: true }),
      billingOption("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
    ],
  },
  firefly: {
    billing_model: "credits",
    billing_options: [
      billingOption("free", "Free / crédits inclus", "Free / included credits", { price_monthly_eur: 0 }),
      billingOption("included", "Inclus Creative Cloud", "Included in Creative Cloud", { price_monthly_eur: 0 }),
      billingOption("credits", "Crédits Firefly", "Firefly credits", { needs_verification: true }),
      billingOption("unknown", "Je ne sais pas", "I don’t know", { needs_verification: true }),
    ],
  },
};

const raw = await readFile(TOOLS_PATH, "utf8");
const tools = JSON.parse(raw);
const byId = new Map(tools.map((tool) => [tool.id, tool]));

for (const [id, patch] of Object.entries(updates)) {
  const tool = byId.get(id);
  if (!tool) {
    throw new Error(`Missing expected tool: ${id}`);
  }
  Object.assign(tool, patch);
  if (patch.functional_needs) {
    tool.covers = mergeArray(tool.covers || [], patch.functional_needs);
  }
  if (patch.pricing_v5 && typeof patch.pricing_v5.compare_price_monthly_eur === "number") {
    tool.defaultMonthlyPrice = patch.pricing_v5.compare_price_monthly_eur;
  }
  if (!tool.slug) tool.slug = tool.id;
}

for (const [id, billingPatch] of Object.entries(billingOverrides)) {
  const tool = byId.get(id);
  if (!tool) {
    throw new Error(`Missing expected billing tool: ${id}`);
  }
  tool.pricing_v5 = {
    ...(tool.pricing_v5 || {}),
    ...billingPatch,
  };
}

const seenIds = new Set();
const dedupedTools = tools.filter((tool) => {
  if (!tool?.id) return true;
  if (seenIds.has(tool.id)) return false;
  seenIds.add(tool.id);
  return true;
});

await writeFile(TOOLS_PATH, `${JSON.stringify(dedupedTools, null, 2)}\n`);
console.log(`Updated ${Object.keys(updates).length} creative catalog entries in ${TOOLS_PATH}.`);
console.log(`Removed ${tools.length - dedupedTools.length} duplicate id entr${tools.length - dedupedTools.length === 1 ? "y" : "ies"}.`);
