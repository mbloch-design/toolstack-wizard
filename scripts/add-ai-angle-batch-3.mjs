/** add-ai-angle-batch-3.mjs — 8 fiches supplémentaires : Coda, Sketch,
 * Twitch, Okta, Datadog, Giphy, NetSuite, Workday. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  coda: {
    stance: "augmente",
    augmentFr: "Coda a son propre assistant IA pour résumer des docs, générer des tableaux ou rédiger des sections, dans la continuité de ce que Notion AI propose sur son concurrent direct.",
    augmentEn: "Coda has its own AI assistant for summarizing docs, generating tables, or drafting sections, in line with what Notion AI offers on its direct competitor.",
    replaceFr: "Remplacer Coda par une IA ? Non : la valeur de Coda, c'est de transformer un document en mini-application (formules, automatisations, vues multiples) — une IA généraliste ne reproduit pas cette structure. Verdict : l'IA aide à remplir le document plus vite, la structure reste le produit.",
    replaceEn: "Replace Coda with an AI? No: Coda's value is turning a document into a mini-app (formulas, automations, multiple views) — a general-purpose AI doesn't replicate that structure. Verdict: AI helps fill the document faster, the structure remains the product.",
    aiTools: ["notion-ai"],
  },
  sketch: {
    stance: "challenge",
    augmentFr: "Sketch reste un éditeur manuel sans génération IA native, alors que des concurrents comme Figma (avec Figma AI) ou des générateurs comme v0 et Lovable produisent désormais des interfaces depuis un simple prompt.",
    augmentEn: "Sketch remains a manual editor with no native AI generation, while competitors like Figma (with Figma AI) or generators like v0 and Lovable now produce interfaces from a simple prompt.",
    replaceFr: "Remplacer Sketch par une IA ? Pour un premier jet d'interface, oui, les générateurs IA vont plus vite. Pour affiner un design system ou un produit déjà établi, l'édition manuelle précise reste nécessaire — mais Sketch lui-même perd du terrain face à Figma sur ce point, IA ou non. Verdict : challengé à la fois par l'IA et par la concurrence directe.",
    replaceEn: "Replace Sketch with an AI? For a first interface draft, yes, AI generators move faster. For refining an established design system or product, precise manual editing remains necessary — but Sketch itself is losing ground to Figma on this point, AI or not. Verdict: challenged both by AI and by direct competition.",
    aiTools: ["v0-vercel", "lovable"],
  },
  twitch: {
    stance: "augmente",
    augmentFr: "Twitch reste la plateforme de streaming live ; l'IA intervient en amont (génération de miniatures, d'overlays, de clips automatiques) via des outils tiers, pas dans la diffusion elle-même.",
    augmentEn: "Twitch remains the live streaming platform; AI comes in upstream (thumbnail generation, overlays, automatic clips) via third-party tools, not in the broadcast itself.",
    replaceFr: "Remplacer Twitch par une IA ? Non : le direct, la communauté et le chat en temps réel sont l'expérience que les viewers viennent chercher, pas quelque chose qu'une IA peut simuler. L'IA aide à produire les visuels et à découper les meilleurs moments après coup. Verdict : l'IA augmente la production autour du stream, pas le stream lui-même.",
    replaceEn: "Replace Twitch with an AI? No: live interaction, community, and real-time chat are the experience viewers come for, not something an AI can simulate. AI helps produce visuals and clip the best moments afterward. Verdict: AI augments production around the stream, not the stream itself.",
    aiTools: [],
  },
  okta: {
    stance: "augmente",
    augmentFr: "Okta a intégré la détection IA des comportements de connexion suspects (Okta AI), mais sa fonction principale — l'authentification unique et la gestion des accès à l'échelle d'une entreprise — reste un problème d'identité, pas un problème de génération.",
    augmentEn: "Okta integrated AI detection of suspicious login behavior (Okta AI), but its main function — single sign-on and access management at company scale — remains an identity problem, not a generation problem.",
    replaceFr: "Remplacer Okta par une IA ? Non : gérer qui a accès à quoi dans une organisation est une question de sécurité et de conformité réglementée, pas une tâche que l'IA peut effectuer seule. L'IA améliore la détection de fraude en arrière-plan. Verdict : l'IA augmente la sécurité, elle ne remplace pas la gestion d'identité.",
    replaceEn: "Replace Okta with an AI? No: managing who has access to what across an organization is a security and regulated-compliance question, not a task AI can perform on its own. AI improves fraud detection in the background. Verdict: AI augments security, it doesn't replace identity management.",
    aiTools: [],
  },
  datadog: {
    stance: "augmente",
    augmentFr: "Datadog a ajouté Bits AI, un agent qui analyse les anomalies et propose des causes probables d'incident directement dans les dashboards — un vrai gain pour le diagnostic, sans changer ce qu'est l'outil.",
    augmentEn: "Datadog added Bits AI, an agent that analyzes anomalies and suggests likely incident causes directly in the dashboards — a real diagnostic boost, without changing what the tool is.",
    replaceFr: "Remplacer Datadog par une IA ? Non : il faut d'abord collecter les logs, métriques et traces en production avant qu'une IA puisse les analyser. Datadog reste l'infrastructure d'observabilité ; l'IA accélère ensuite le diagnostic des incidents. Verdict : l'IA augmente l'analyse, elle ne remplace pas la collecte de données.",
    replaceEn: "Replace Datadog with an AI? No: you first need to collect logs, metrics, and traces in production before an AI can analyze them. Datadog remains the observability infrastructure; AI then speeds up incident diagnosis. Verdict: AI augments analysis, it doesn't replace data collection.",
    aiTools: [],
  },
  giphy: {
    stance: "challenge",
    augmentFr: "Giphy reste une bibliothèque de GIFs existants à chercher par mot-clé, alors que des générateurs d'images et de vidéos IA (Midjourney pour les visuels, des outils texte-vers-GIF) permettent de créer un visuel original à la demande.",
    augmentEn: "Giphy remains a library of existing GIFs to search by keyword, while AI image and video generators (Midjourney for visuals, text-to-GIF tools) let you create an original visual on demand.",
    replaceFr: "Remplacer Giphy par une IA ? Pour un GIF culturel ou une réaction reconnaissable, Giphy reste plus rapide et plus pertinent — l'IA générerait quelque chose de nouveau, pas la référence que tout le monde reconnaît. Pour un visuel original sur-mesure, l'IA prend l'avantage. Verdict : challengé sur le contenu original, solide sur les références culturelles.",
    replaceEn: "Replace Giphy with an AI? For a cultural GIF or a recognizable reaction, Giphy stays faster and more relevant — AI would generate something new, not the reference everyone recognizes. For an original, custom visual, AI takes the lead. Verdict: challenged on original content, solid on cultural references.",
    aiTools: ["midjourney"],
  },
  netsuite: {
    stance: "augmente",
    augmentFr: "NetSuite a ajouté des fonctionnalités IA (prévisions financières, génération de rapports automatique) à sa suite ERP, mais reste avant tout un système de gestion comptable et opérationnelle réglementé, pas un outil que l'IA peut improviser.",
    augmentEn: "NetSuite added AI features (financial forecasting, automatic report generation) to its ERP suite, but remains primarily a regulated accounting and operations management system, not something AI can improvise.",
    replaceFr: "Remplacer NetSuite par une IA ? Non : un ERP centralise la comptabilité, les stocks et la conformité fiscale d'une entreprise — un système d'enregistrement légal, pas une tâche de génération de contenu. L'IA améliore les prévisions et les rapports, elle ne remplace pas le système comptable. Verdict : l'IA augmente l'analyse financière, l'ERP reste l'infrastructure de référence.",
    replaceEn: "Replace NetSuite with an AI? No: an ERP centralizes a company's accounting, inventory, and tax compliance — a legal system of record, not a content-generation task. AI improves forecasting and reporting, it doesn't replace the accounting system. Verdict: AI augments financial analysis, the ERP remains the system of record.",
    aiTools: [],
  },
  workday: {
    stance: "augmente",
    augmentFr: "Workday a intégré des agents IA (Workday AI) pour automatiser le recrutement, la paie et les RH, mais reste avant tout un système d'enregistrement RH et financier réglementé pour les grandes entreprises.",
    augmentEn: "Workday integrated AI agents (Workday AI) to automate recruiting, payroll, and HR, but remains primarily a regulated HR and financial system of record for large companies.",
    replaceFr: "Remplacer Workday par une IA ? Non : la paie, la conformité RH et la gestion des talents impliquent une responsabilité légale par pays que l'IA ne peut pas porter seule. L'IA accélère certaines tâches RH (tri de CV, reporting), mais l'infrastructure réglementaire reste le vrai produit. Verdict : l'IA augmente la productivité RH, pas la conformité elle-même.",
    replaceEn: "Replace Workday with an AI? No: payroll, HR compliance, and talent management involve per-country legal liability that AI can't carry alone. AI speeds up certain HR tasks (CV sorting, reporting), but the regulatory infrastructure remains the real product. Verdict: AI augments HR productivity, not compliance itself.",
    aiTools: [],
  },
};

let updated = 0;
for (const [slug, angle] of Object.entries(ANGLES)) {
  if (!present.has(slug)) { console.warn(`⚠️  ${slug} not found, skipping`); continue; }
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  tool.seo = Object.assign({}, tool.seo, { aiAngle: angle });
  updated++;
  console.log(`✓ ${tool.name} (${slug}): ${angle.stance}`);
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated}/${Object.keys(ANGLES).length} fiches updated.`);
