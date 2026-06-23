/** add-ai-angle-batch-21.mjs — aiAngle pour Audacity, Qonto, Frame.io,
 * VidIQ, Snapseed, MongoDB Atlas, Zoom Pro, Streamlabs. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  audacity: {
    stance: "augmente",
    augmentFr: "Audacity reste un éditeur audio open source gratuit sans IA native, mais des plugins tiers (suppression de bruit, transcription) commencent à s'y greffer sans changer sa philosophie d'outil manuel et léger.",
    augmentEn: "Audacity remains a free open-source audio editor with no native AI, but third-party plugins (noise removal, transcription) are starting to attach to it without changing its philosophy as a manual, lightweight tool.",
    replaceFr: "Remplacer Audacity par une IA ? Non : éditer manuellement de l'audio (couper, mixer, ajuster) reste un savoir-faire que l'IA assiste via des plugins sans le remplacer entièrement. Verdict : l'IA augmente certaines tâches techniques, le montage manuel reste possible et gratuit.",
    replaceEn: "Replace Audacity with an AI? No: manually editing audio (cutting, mixing, adjusting) remains a skill AI assists via plugins without fully replacing it. Verdict: AI augments certain technical tasks, manual editing remains possible and free.",
    aiTools: [],
  },
  qonto: {
    stance: "augmente",
    augmentFr: "Qonto a ajouté l'IA pour catégoriser automatiquement les transactions et faciliter la pré-comptabilité, mais reste une néobanque professionnelle réglementée pour PME et indépendants.",
    augmentEn: "Qonto added AI to automatically categorize transactions and ease pre-accounting, but remains a regulated professional neobank for SMBs and freelancers.",
    replaceFr: "Remplacer Qonto par une IA ? Non : tenir un compte bancaire professionnel réglementé reste un besoin d'infrastructure financière que l'IA ne remplace pas. Elle aide à catégoriser les dépenses plus vite. Verdict : l'IA augmente la gestion comptable, le compte bancaire reste indispensable.",
    replaceEn: "Replace Qonto with an AI? No: holding a regulated professional bank account remains a financial infrastructure need AI doesn't replace. It helps categorize expenses faster. Verdict: AI augments accounting management, the bank account remains essential.",
    aiTools: [],
  },
  "frame-io": {
    stance: "augmente",
    augmentFr: "Frame.io (racheté par Adobe) a ajouté la transcription et le résumé IA pour faciliter les retours sur une vidéo, mais reste l'outil de revue collaborative vidéo (commentaires horodatés, versions) pour les équipes de montage.",
    augmentEn: "Frame.io (acquired by Adobe) added AI transcription and summaries to ease video feedback, but remains the collaborative video review tool (timestamped comments, versions) for editing teams.",
    replaceFr: "Remplacer Frame.io par une IA ? Non : collecter des retours précis et horodatés d'un client ou d'une équipe sur un montage vidéo reste un besoin de collaboration humaine. L'IA aide à résumer les retours, elle ne remplace pas le processus de validation. Verdict : l'IA augmente la synthèse, la collaboration reste le produit.",
    replaceEn: "Replace Frame.io with an AI? No: collecting precise, timestamped feedback from a client or team on a video edit remains a human collaboration need. AI helps summarize feedback, it doesn't replace the validation process. Verdict: AI augments synthesis, collaboration remains the product.",
    aiTools: [],
  },
  vidiq: {
    stance: "augmente",
    augmentFr: "VidIQ a intégré des suggestions IA pour les titres, vignettes et scripts vidéo, en plus de ses fonctions classiques de recherche de mots-clés YouTube et d'analyse de concurrence.",
    augmentEn: "VidIQ integrated AI suggestions for titles, thumbnails, and video scripts, alongside its classic YouTube keyword research and competitor analysis functions.",
    replaceFr: "Remplacer VidIQ par une IA ? Non : les données réelles de recherche et de concurrence sur YouTube nécessitent une collecte de données spécifique à la plateforme. L'IA aide à rédiger titres et scripts plus vite, elle ne remplace pas l'analyse de données YouTube. Verdict : l'IA augmente la création de contenu, l'analyse de données reste l'infrastructure clé.",
    replaceEn: "Replace VidIQ with an AI? No: real YouTube search and competition data requires platform-specific data collection. AI helps write titles and scripts faster, it doesn't replace YouTube data analysis. Verdict: AI augments content creation, data analysis remains the key infrastructure.",
    aiTools: [],
  },
  snapseed: {
    stance: "augmente",
    augmentFr: "Snapseed propose des outils de retouche photo avancés (gratuits, par Google) avec quelques filtres automatiques intelligents, mais reste un éditeur manuel pour qui veut un contrôle précis sur ses retouches.",
    augmentEn: "Snapseed offers advanced photo editing tools (free, by Google) with a few smart automatic filters, but remains a manual editor for those who want precise control over their edits.",
    replaceFr: "Remplacer Snapseed par une IA ? Pour une retouche rapide automatique, des apps IA générationnelles vont plus vite. Pour un contrôle créatif précis (courbes, masques), Snapseed reste pertinent et gratuit. Verdict : challengé pour la retouche rapide, solide pour le contrôle créatif manuel gratuit.",
    replaceEn: "Replace Snapseed with an AI? For a quick automatic edit, generative AI apps move faster. For precise creative control (curves, masks), Snapseed remains relevant and free. Verdict: challenged for quick editing, solid for free manual creative control.",
    aiTools: [],
  },
  "mongodb-atlas": {
    stance: "augmente",
    augmentFr: "MongoDB Atlas a ajouté une recherche vectorielle native pour des cas d'usage IA (RAG, recherche sémantique), positionnant la base de données comme infrastructure pour construire des applications IA, pas comme un produit IA en soi.",
    augmentEn: "MongoDB Atlas added native vector search for AI use cases (RAG, semantic search), positioning the database as infrastructure to build AI applications, not as an AI product itself.",
    replaceFr: "Remplacer MongoDB Atlas par une IA ? Non : stocker des données structurées ou semi-structurées de façon fiable reste un besoin d'infrastructure. La recherche vectorielle ajoutée sert justement à construire des applications IA dessus, sans remplacer la base de données. Verdict : l'IA s'appuie sur MongoDB, elle ne le remplace pas.",
    replaceEn: "Replace MongoDB Atlas with an AI? No: reliably storing structured or semi-structured data remains an infrastructure need. The added vector search is precisely meant to build AI applications on top of it, not replace the database. Verdict: AI relies on MongoDB, it doesn't replace it.",
    aiTools: [],
  },
  "zoom-pro": {
    stance: "augmente",
    augmentFr: "Zoom a intégré Zoom AI Companion pour résumer des réunions et générer des comptes-rendus automatiquement, une fonctionnalité désormais standard sur la plupart des outils de visioconférence professionnels.",
    augmentEn: "Zoom integrated Zoom AI Companion to summarize meetings and automatically generate recaps, a feature now standard on most professional video conferencing tools.",
    replaceFr: "Remplacer Zoom par une IA ? Non : la visioconférence elle-même (qualité vidéo, capacité de participants, fiabilité de connexion) reste un besoin d'infrastructure. L'IA augmente ce qui se passe pendant et après la réunion (résumés), elle ne remplace pas le besoin de se voir en visio. Verdict : l'IA augmente le compte-rendu, la visioconférence reste le produit.",
    replaceEn: "Replace Zoom with an AI? No: video conferencing itself (video quality, participant capacity, connection reliability) remains an infrastructure need. AI augments what happens during and after the meeting (summaries), it doesn't replace the need for video calls. Verdict: AI augments the recap, video conferencing remains the product.",
    aiTools: [],
  },
  streamlabs: {
    stance: "augmente",
    augmentFr: "Streamlabs a intégré des outils IA (génération de thumbnails, suggestions de titre) pour simplifier la production de stream, en plus de son rôle classique de logiciel de diffusion en direct simplifié.",
    augmentEn: "Streamlabs integrated AI tools (thumbnail generation, title suggestions) to simplify stream production, alongside its classic role as simplified live broadcasting software.",
    replaceFr: "Remplacer Streamlabs par une IA ? Non : diffuser un flux vidéo en direct avec alertes et overlays configurés reste un besoin technique d'infrastructure. L'IA aide à produire les visuels autour du stream, elle ne remplace pas le logiciel de diffusion. Verdict : l'IA augmente la production annexe, Streamlabs reste l'infrastructure de diffusion.",
    replaceEn: "Replace Streamlabs with an AI? No: broadcasting a live video stream with configured alerts and overlays remains a technical infrastructure need. AI helps produce visuals around the stream, it doesn't replace the broadcasting software. Verdict: AI augments peripheral production, Streamlabs remains the broadcasting infrastructure.",
    aiTools: [],
  },
};

let updated = 0;
for (const [slug, angle] of Object.entries(ANGLES)) {
  if (!present.has(slug)) { console.warn(`⚠️  ${slug} not found, skipping`); continue; }
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  tool.seo = Object.assign({}, tool.seo, { aiAngle: angle });
  updated++;
  console.log(`✓ ${tool.name} (${slug}): aiAngle ${angle.stance}`);
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated} fiches mises à jour.`);
