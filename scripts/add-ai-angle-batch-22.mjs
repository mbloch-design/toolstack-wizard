/** add-ai-angle-batch-22.mjs — aiAngle pour Midjourney, Adobe After
 * Effects, Capture One, Looker Studio, Aircall, BambooHR, Roam
 * Research, SuiteDash. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  midjourney: {
    stance: "augmente",
    augmentFr: "Midjourney est lui-même un générateur d'images par IA — la question n'est pas de savoir si l'IA l'augmente, mais quels métiers créatifs (illustration, photographie de stock, mockup) sont challengés par son existence.",
    augmentEn: "Midjourney is itself an AI image generator — the question isn't whether AI augments it, but which creative jobs (illustration, stock photography, mockups) are challenged by its existence.",
    replaceFr: "Remplacer un illustrateur ou un photographe par Midjourney ? Pour des visuels génériques (illustrations de blog, mockups), oui en partie. Pour une identité visuelle de marque cohérente et un style reconnaissable, l'expertise créative humaine reste différenciante. Verdict : Midjourney challenge les visuels génériques, pas la direction artistique experte.",
    replaceEn: "Replace an illustrator or photographer with Midjourney? For generic visuals (blog illustrations, mockups), partly yes. For a coherent, recognizable brand visual identity, human creative expertise remains differentiating. Verdict: Midjourney challenges generic visuals, not expert art direction.",
    aiTools: [],
  },
  "adobe-after-effects": {
    stance: "augmente",
    augmentFr: "After Effects a intégré la génération de vidéo et d'effets via Adobe Firefly, mais reste l'outil de référence pour le motion design et les effets visuels professionnels précis, là où les générateurs IA produisent des résultats plus approximatifs.",
    augmentEn: "After Effects integrated video and effects generation via Adobe Firefly, but remains the reference tool for professional motion design and precise visual effects, where AI generators produce more approximate results.",
    replaceFr: "Remplacer After Effects par une IA ? Pour un effet visuel rapide et générique, un générateur IA peut suffire. Pour une animation de marque précise (logo animé, motion design synchronisé), le contrôle frame par frame d'After Effects reste irremplaçable. Verdict : challengé sur les effets génériques, irremplaçable sur le motion design de précision.",
    replaceEn: "Replace After Effects with an AI? For a quick, generic visual effect, an AI generator may be enough. For precise brand animation (animated logo, synchronized motion design), After Effects' frame-by-frame control remains irreplaceable. Verdict: challenged on generic effects, irreplaceable for precision motion design.",
    aiTools: [],
  },
  "capture-one": {
    stance: "augmente",
    augmentFr: "Capture One a ajouté des masques IA pour faciliter la retouche sélective, mais reste l'outil de référence pour les photographes professionnels qui veulent un contrôle colorimétrique précis sur leurs fichiers RAW.",
    augmentEn: "Capture One added AI masks to ease selective editing, but remains the reference tool for professional photographers wanting precise color control over their RAW files.",
    replaceFr: "Remplacer Capture One par une IA ? Non : le développement précis de fichiers RAW pour un rendu colorimétrique professionnel reste un savoir-faire technique que l'IA assiste (masques automatiques) sans remplacer la maîtrise de la couleur. Verdict : l'IA augmente la rapidité de masquage, l'expertise colorimétrique reste humaine.",
    replaceEn: "Replace Capture One with an AI? No: precise RAW file development for professional color rendering remains a technical skill AI assists (automatic masks) without replacing color mastery. Verdict: AI augments masking speed, color expertise remains human.",
    aiTools: [],
  },
  "looker-studio": {
    stance: "augmente",
    augmentFr: "Looker Studio a ajouté des résumés IA pour interpréter des tableaux de bord, mais reste un outil gratuit de visualisation de données connecté à des sources réelles (Google Analytics, Sheets) — un besoin d'infrastructure de reporting.",
    augmentEn: "Looker Studio added AI summaries to interpret dashboards, but remains a free data visualization tool connected to real sources (Google Analytics, Sheets) — a reporting infrastructure need.",
    replaceFr: "Remplacer Looker Studio par une IA ? Non : visualiser des données réelles connectées à plusieurs sources en temps réel reste un besoin d'infrastructure de reporting. L'IA aide à résumer un tableau de bord, elle ne remplace pas la connexion aux données réelles. Verdict : l'IA augmente l'interprétation, le reporting connecté reste le produit.",
    replaceEn: "Replace Looker Studio with an AI? No: visualizing real data connected to multiple sources in real time remains a reporting infrastructure need. AI helps summarize a dashboard, it doesn't replace the connection to real data. Verdict: AI augments interpretation, connected reporting remains the product.",
    aiTools: [],
  },
  aircall: {
    stance: "augmente",
    augmentFr: "Aircall a ajouté la transcription et le résumé IA des appels, mais reste l'infrastructure téléphonique cloud (numéros, routage d'appels, intégration CRM) pour les équipes commerciales et support.",
    augmentEn: "Aircall added AI call transcription and summaries, but remains cloud phone infrastructure (numbers, call routing, CRM integration) for sales and support teams.",
    replaceFr: "Remplacer Aircall par une IA ? Non : gérer des numéros de téléphone professionnels et router les appels vers la bonne équipe reste un besoin d'infrastructure téléphonique. L'IA aide à résumer les appels après coup, elle ne remplace pas le système téléphonique. Verdict : l'IA augmente le suivi des appels, l'infrastructure téléphonique reste le produit.",
    replaceEn: "Replace Aircall with an AI? No: managing professional phone numbers and routing calls to the right team remains a phone infrastructure need. AI helps summarize calls afterward, it doesn't replace the phone system. Verdict: AI augments call tracking, phone infrastructure remains the product.",
    aiTools: [],
  },
  bamboohr: {
    stance: "augmente",
    augmentFr: "BambooHR a ajouté des assistants IA pour le recrutement et l'onboarding, mais reste un système d'enregistrement RH réglementé (contrats, congés, paie) pour les PME.",
    augmentEn: "BambooHR added AI assistants for recruiting and onboarding, but remains a regulated HR system of record (contracts, leave, payroll) for SMBs.",
    replaceFr: "Remplacer BambooHR par une IA ? Non : la gestion RH d'une entreprise (contrats, congés, conformité) implique une responsabilité légale qu'une IA ne peut pas assumer seule. L'IA accélère certaines tâches RH, l'infrastructure réglementaire reste le vrai produit. Verdict : l'IA augmente la productivité RH, pas la conformité elle-même.",
    replaceEn: "Replace BambooHR with an AI? No: a company's HR management (contracts, leave, compliance) involves legal liability an AI can't take on alone. AI speeds up certain HR tasks, the regulatory infrastructure remains the real product. Verdict: AI augments HR productivity, not compliance itself.",
    aiTools: [],
  },
  "roam-research": {
    stance: "augmente",
    augmentFr: "Roam Research a popularisé les notes liées bidirectionnelles avant Obsidian et Logseq ; des plugins IA tiers s'y ajoutent désormais sans changer sa philosophie de pensée en réseau plutôt que hiérarchique.",
    augmentEn: "Roam Research popularized bidirectional linked notes before Obsidian and Logseq; third-party AI plugins are now added without changing its philosophy of networked rather than hierarchical thinking.",
    replaceFr: "Remplacer Roam Research par une IA ? Non : la valeur de Roam est de construire un système de pensée personnel en réseau au fil du temps, pas un contenu généré. L'IA peut aider à résumer ou relier des notes existantes. Verdict : l'IA augmente l'exploitation des notes, le système de pensée reste personnel.",
    replaceEn: "Replace Roam Research with an AI? No: Roam's value is building a personal networked thinking system over time, not generated content. AI can help summarize or link existing notes. Verdict: AI augments note usage, the thinking system remains personal.",
    aiTools: [],
  },
  suitedash: {
    stance: "augmente",
    augmentFr: "SuiteDash combine CRM, facturation, portail client et gestion de projet pour les freelances et petites agences ; l'IA s'ajoute en périphérie sans changer son rôle de plateforme tout-en-un de gestion client.",
    augmentEn: "SuiteDash combines CRM, invoicing, client portal, and project management for freelancers and small agencies; AI is added at the periphery without changing its role as an all-in-one client management platform.",
    replaceFr: "Remplacer SuiteDash par une IA ? Non : centraliser la relation client (devis, facturation, portail, projets) en un seul endroit reste un besoin structurel d'organisation, pas de génération de contenu. Verdict : l'IA n'a pas de rôle central ici, la structure tout-en-un reste le produit.",
    replaceEn: "Replace SuiteDash with an AI? No: centralizing client relationships (quotes, invoicing, portal, projects) in one place remains a structural organization need, not content generation. Verdict: AI has no central role here, the all-in-one structure remains the product.",
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
