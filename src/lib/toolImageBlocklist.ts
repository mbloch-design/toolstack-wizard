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
]);
