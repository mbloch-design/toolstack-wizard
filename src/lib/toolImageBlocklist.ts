/* Tools whose ogImageUrl points to a real, verified-200 response but the
 * image itself renders unusably (blank, wrong crop, favicon-only, or simply
 * absent) via a real HTTP/Image() check — found while auditing the homepage
 * dynamic shelves. Every listing surface (homepage shelves, category pages)
 * must filter through this so a tool with a broken visual never surfaces
 * with a card treatment that expects a real screenshot — re-run the check
 * before removing an entry, don't just trust the field is fixed. */
export const TOOL_IMAGE_BLOCKLIST = new Set([
  "fathom-analytics", "guideless", "gumloop", "hugeicons", "voicetypr", "youform",
  "figma-weave", "ae-gifgun", "google-meet", "premiere-rush", "brandmark", "glide",
  "move-ai", "autodesk-flow-studio", "cleanvoice", "meshy", "heygen",
  "obs", "davinci-resolve", "touchdesigner",
  // 25/09/2026: captures in public/og-screenshots that are 90 % or more white
  // (bot checks, parked domains, blank or login pages), plus Avocode's
  // shutdown notice. Found by measuring each file; a sample checked by eye.
  "app-store-connect", "archive-tools", "artlist", "avocode", "canva-pro",
  "canva-templates", "cleanup3", "clockify", "condeco", "coupa",
  "crowdfire-inc", "drata", "excel", "firefly", "fiverr", "flask", "ga4",
  "gmail", "google-analytics", "google-slides", "google-tag-manager", "gusto",
  "ideogram", "insightly", "jobber", "jquery", "justworks", "kit", "krita",
  "leonardo-ai", "lottiefiles", "lusha", "megahr", "midjourney", "moobot",
  "motion", "motion-array", "namecheap", "openai", "openai-api", "pagefly",
  "pagespeed-insights", "personio", "pixco", "poetry", "pro-tools",
  "product-hunt", "recharts", "shield", "shotdeck", "taplio", "tezza",
  "ukg-pro", "vue-cli", "webxr", "whisper", "youtube-studio",
]);
