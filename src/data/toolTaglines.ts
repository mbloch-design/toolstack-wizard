/**
 * What a tool does, in two or three words, for cards and shelf rows where a
 * full short description is too long to read at a glance.
 *
 * Written by hand, FR/EN. A tool without an entry simply shows no subtitle:
 * better nothing than a sentence cut mid-word. Add an entry whenever a tool
 * starts appearing on the catalogue shelves.
 */
export const TOOL_TAGLINES: Record<string, { fr: string; en: string }> = {
  // Featured / general
  framer: { fr: "Créateur de sites", en: "Website builder" },
  notion: { fr: "Espace de travail", en: "All-in-one workspace" },
  figma: { fr: "Design d'interface", en: "Interface design" },
  // Content creation
  "motion-array": { fr: "Ressources vidéo", en: "Video assets" },
  zbrush: { fr: "Sculpture 3D", en: "3D sculpting" },
  houdini: { fr: "Effets visuels 3D", en: "3D visual effects" },
  "substance-3d-painter": { fr: "Texturing 3D", en: "3D texturing" },
  grammarly: { fr: "Correcteur anglais", en: "Writing assistant" },
  vidiq: { fr: "Croissance YouTube", en: "YouTube growth" },
  pixieset: { fr: "Galeries photo", en: "Photo galleries" },
  audacity: { fr: "Montage audio", en: "Audio editing" },
  madmapper: { fr: "Mapping vidéo", en: "Video mapping" },
  canva: { fr: "Design rapide", en: "Quick design" },
  auphonic: { fr: "Mastering audio", en: "Audio mastering" },
  "screen-studio": { fr: "Démos écran", en: "Screen demos" },
  "opus-clip": { fr: "Clips courts", en: "Short clips" },
  "adobe-podcast-ai": { fr: "Voix nettoyée", en: "Voice cleanup" },
  capcut: { fr: "Montage vidéo", en: "Video editing" },
  descript: { fr: "Montage par texte", en: "Text-based editing" },
  // Design & prototyping
  "adobe-lightroom": { fr: "Retouche photo", en: "Photo editing" },
  "motion-bro": { fr: "Presets motion", en: "Motion presets" },
  "ae-red-giant": { fr: "Plugins VFX", en: "VFX plugins" },
  "adobe-after-effects": { fr: "Motion design", en: "Motion design" },
  "adobe-premiere-pro": { fr: "Montage vidéo", en: "Video editing" },
  "adobe-photoshop": { fr: "Retouche d'image", en: "Image editing" },
  "ae-gifgun": { fr: "Export GIF", en: "GIF export" },
  "ae-animation-composer": { fr: "Presets d'animation", en: "Animation presets" },
  "nik-collection": { fr: "Filtres photo", en: "Photo filters" },
  "affinity-photo": { fr: "Retouche photo", en: "Photo editing" },
  spline: { fr: "3D interactive", en: "Interactive 3D" },
  hugeicons: { fr: "Bibliothèque d'icônes", en: "Icon library" },
  excalidraw: { fr: "Schémas à main levée", en: "Hand-drawn diagrams" },
  milanote: { fr: "Moodboards", en: "Moodboards" },
  // No-code & web
  remix: { fr: "Framework React", en: "React framework" },
  "mongodb-atlas": { fr: "Base NoSQL", en: "NoSQL database" },
  "cargo-site": { fr: "Portfolio en ligne", en: "Portfolio sites" },
  gitlens: { fr: "Historique Git", en: "Git history" },
  firebase: { fr: "Backend Google", en: "App backend" },
  "fly-io": { fr: "Hébergement d'apps", en: "App hosting" },
  codemagic: { fr: "CI/CD mobile", en: "Mobile CI/CD" },
  ovh: { fr: "Hébergement web", en: "Web hosting" },
  neon: { fr: "Postgres serverless", en: "Serverless Postgres" },
  webflow: { fr: "Sites visuels", en: "Visual websites" },
  supabase: { fr: "Backend Postgres", en: "Postgres backend" },
  carrd: { fr: "Site d'une page", en: "One-page sites" },
  bubble: { fr: "Apps no-code", en: "No-code apps" },
  // Analytics
  hotjar: { fr: "Heatmaps", en: "Heatmaps" },
  "coupler-io": { fr: "Export de données", en: "Data syncing" },
  datadog: { fr: "Monitoring", en: "Monitoring" },
  sentry: { fr: "Suivi d'erreurs", en: "Error tracking" },
  ahrefs: { fr: "Analyse SEO", en: "SEO research" },
  brand24: { fr: "Veille de marque", en: "Brand monitoring" },
  metabase: { fr: "Tableaux de bord", en: "Dashboards" },
  "looker-studio": { fr: "Reporting Google", en: "Google reporting" },
  "google-search-console": { fr: "Suivi Google", en: "Search monitoring" },
  "google-analytics": { fr: "Mesure d'audience", en: "Web analytics" },
  "microsoft-clarity": { fr: "Replays gratuits", en: "Free session replays" },
  datawrapper: { fr: "Graphiques web", en: "Web charts" },
  plausible: { fr: "Analytics RGPD", en: "Privacy analytics" },
  // AI & generative
  "topaz-video-ai": { fr: "Upscale vidéo", en: "Video upscaling" },
  "google-ai-studio": { fr: "Modèles Gemini", en: "Gemini playground" },
  firefly: { fr: "Images génératives", en: "Generative images" },
  runway: { fr: "Vidéo générative", en: "Generative video" },
  elevenlabs: { fr: "Voix IA", en: "AI voices" },
  cursor: { fr: "Éditeur de code IA", en: "AI code editor" },
  "krea-ai": { fr: "Images IA", en: "AI images" },
  suno: { fr: "Musique IA", en: "AI music" },
  chatgpt: { fr: "Assistant IA", en: "AI assistant" },
  claude: { fr: "Assistant IA", en: "AI assistant" },
  midjourney: { fr: "Images IA", en: "AI images" },
  // Organisation
  freshservice: { fr: "Helpdesk IT", en: "IT helpdesk" },
  basecamp: { fr: "Gestion de projet", en: "Project management" },
  dropbox: { fr: "Stockage cloud", en: "Cloud storage" },
  obsidian: { fr: "Notes locales", en: "Local notes" },
  linear: { fr: "Suivi produit", en: "Issue tracking" },
  confluence: { fr: "Wiki d'équipe", en: "Team wiki" },
  logseq: { fr: "Notes en graphe", en: "Graph notes" },
  safetyculture: { fr: "Inspections terrain", en: "Field inspections" },
  box: { fr: "Stockage sécurisé", en: "Secure storage" },
  todoist: { fr: "Liste de tâches", en: "To-do list" },
  scribe: { fr: "Guides pas à pas", en: "Step-by-step guides" },
  // Marketing, automation, communication
  mailchimp: { fr: "Emailing", en: "Email marketing" },
  lemlist: { fr: "Prospection email", en: "Cold outreach" },
  clay: { fr: "Enrichissement de leads", en: "Lead enrichment" },
  make: { fr: "Automatisation visuelle", en: "Visual automation" },
  n8n: { fr: "Automatisation open source", en: "Open-source automation" },
  zapier: { fr: "Automatisation", en: "Automation" },
  lindy: { fr: "Agents IA", en: "AI agents" },
  calendly: { fr: "Prise de rendez-vous", en: "Scheduling" },
  loom: { fr: "Vidéos asynchrones", en: "Async video" },
  crisp: { fr: "Chat support", en: "Support chat" },
  slack: { fr: "Messagerie d'équipe", en: "Team chat" },
};

export function toolTagline(slug: string | undefined, lang: string): string {
  if (!slug) return "";
  const entry = TOOL_TAGLINES[slug];
  return entry ? (lang === "en" ? entry.en : entry.fr) : "";
}
