// One publication visibility rule for summaries and prerender.
// Full catalogue sources and alias redirects remain intact.
export const DEPRECATED_TOOL_SLUGS: ReadonlySet<string> = new Set([
  "adobe", "adobe-cc",
  // Alias/features/combos consolidés vers la fiche canonique du produit (301 dans vercel.json).
  "capcut-ai", "clickup-ai", "excel-copilot", "streamelements-widgets", "gsc", "gorgias-helpscout",
  // Feature sans produit autonome ni parent fiché.
  "youtube-live",
  // Produit fermé (shieldapp.ai affiche « Shield is winding down »).
  "shield",
  // Recatégorisation placeholder (preuve HTTP) : URL morte ou domaine parké/générique,
  // + 4 combos/doublons redirigés 301 (voir vercel.json).
  "affiliate-dashboards", "affiliate-tools", "archive-tools", "bots-discord", "canva-kits", "canva-templates",
  "capcut-templates", "caption-tools", "chart-tools", "chatgpt-pour-brouillons-non-juridiques", "comfyui-workflows", "content-credentials-tools",
  "emoji-sticker-packs", "figma-templates", "form-apps", "frame-guides", "gaming-overlays", "krea",
  "krea-selon-metier", "lighting-kits", "lightroom-presets", "link-in-bio", "link-in-bio-tools", "map-tools",
  "media-kit-templates", "meme-templates", "mobile-gimbal-apps", "mockup-plugins", "music-libraries", "newsletter-referral-tools",
  "overlays", "pennylane-ai-selon-dispo", "pennylane-ou-indy", "pennylane-qonto", "presets", "presets-lightroom",
  "prompt-libraries", "recipe-card-templates", "review-tools", "scheduling-tools", "screen-capture-tools", "screenshot-tools",
  "shared-cloud-folders", "social-schedulers", "stock-footage", "subtitle-tools", "teleprompter-apps", "templates",
  "templates-ugc", "utm-builders", "webflow-framer", "webhooks", "workout-templates", "zapier-make",
  "gamma-ai", "adcreative", "inbound",
  "magicbrief", "modo", "opusclip",
  "webxr", "topaz-video",
  "relume-ai", "pageai", "liquid-web-partner-program", "are-na", "invision", "specify", "dovetail-ai", "shield-app", "seo-mode", "ga4", "sql", "wunderlist",
  "openai", "anthropic", "motion-app", "anchor-spotify", "descript", "flux", "kling-ai", "magnific-ai", "otter", "figma-weave", "elgato-stream-deck", "around", "monday", "fig-terminal", "reclaim-ai", "legifrance-pro", "captaindoc", "sendinblue", "clearbit", "quickbooks-online", "lemonsqueezy",
  // 02/10/2026 (décision Michael) : doublons consolidés (tubebody→tubebuddy, lottie→lottiefiles,
  // apollo→apollo-io), produits arrêtés retirés (avocode, twitch-studio, pluraleyes, premiere-rush),
  // Newton 3 renommé en Newton 4 (ae-newton3→ae-newton4). 301 dans vercel.json.
  "tubebody", "lottie", "apollo", "avocode", "twitch-studio", "pluraleyes", "premiere-rush", "ae-newton3",
]);
