/** add-content-batch-8.mjs — aiAngle pour Google Drive, Microsoft Teams,
 * SharePoint, OneDrive, Box, SEMrush, Ahrefs + contenu complet pour
 * PandaDoc (encore placeholder). */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  "google-drive": {
    stance: "augmente",
    augmentFr: "Google Drive bénéficie de Gemini pour résumer un dossier de fichiers ou retrouver un document par description, mais reste l'infrastructure de stockage et de partage — l'IA aide à s'y retrouver, pas à remplacer le stockage.",
    augmentEn: "Google Drive benefits from Gemini to summarize a folder of files or find a document by description, but remains storage and sharing infrastructure — AI helps navigate it, not replace storage.",
    replaceFr: "Remplacer Google Drive par une IA ? Non : stocker et partager des fichiers en sécurité avec une équipe reste un besoin d'infrastructure, pas de génération. L'IA aide à retrouver l'information plus vite dans tes fichiers. Verdict : l'IA augmente la recherche, le stockage reste indispensable.",
    replaceEn: "Replace Google Drive with an AI? No: storing and sharing files securely with a team remains an infrastructure need, not a generation one. AI helps find information faster in your files. Verdict: AI augments search, storage remains essential.",
    aiTools: ["gemini"],
  },
  "microsoft-teams": {
    stance: "augmente",
    augmentFr: "Teams a intégré Copilot pour résumer des réunions et générer des comptes-rendus, mais la messagerie d'équipe et la visioconférence restent un besoin de coordination que l'IA assiste sans remplacer.",
    augmentEn: "Teams integrated Copilot to summarize meetings and generate recaps, but team messaging and video conferencing remain a coordination need that AI assists without replacing.",
    replaceFr: "Remplacer Teams par une IA ? Non : coordonner une équipe en temps réel (chat, visio, fichiers partagés) reste un besoin social et organisationnel. L'IA augmente ce qui se passe pendant et après les réunions (résumés, comptes-rendus), elle ne remplace pas le besoin de se coordonner. Verdict : l'IA augmente le compte-rendu, Teams reste l'outil de coordination.",
    replaceEn: "Replace Teams with an AI? No: coordinating a team in real time (chat, video, shared files) remains a social and organizational need. AI augments what happens during and after meetings (summaries, recaps), it doesn't replace the need to coordinate. Verdict: AI augments the recap, Teams remains the coordination tool.",
    aiTools: [],
  },
  sharepoint: {
    stance: "augmente",
    augmentFr: "SharePoint profite de Copilot pour résumer des sites et documents internes, mais reste l'infrastructure de gestion documentaire et d'intranet des entreprises sous Microsoft 365 — un besoin structurel, pas de génération.",
    augmentEn: "SharePoint benefits from Copilot to summarize internal sites and documents, but remains the document management and intranet infrastructure for companies on Microsoft 365 — a structural need, not a generation one.",
    replaceFr: "Remplacer SharePoint par une IA ? Non : structurer la documentation et les permissions d'accès d'une entreprise reste un besoin d'infrastructure réglementé, pas une tâche de génération. L'IA aide à résumer et chercher dans cette documentation. Verdict : l'IA augmente la recherche documentaire, SharePoint reste l'infrastructure.",
    replaceEn: "Replace SharePoint with an AI? No: structuring a company's documentation and access permissions remains a regulated infrastructure need, not a generation task. AI helps summarize and search within that documentation. Verdict: AI augments document search, SharePoint remains the infrastructure.",
    aiTools: [],
  },
  onedrive: {
    stance: "augmente",
    augmentFr: "OneDrive profite de l'intégration Copilot pour chercher et résumer des fichiers, mais reste l'infrastructure de stockage cloud de l'écosystème Microsoft 365 — un besoin de stockage, pas de génération.",
    augmentEn: "OneDrive benefits from Copilot integration to search and summarize files, but remains the cloud storage infrastructure for the Microsoft 365 ecosystem — a storage need, not a generation one.",
    replaceFr: "Remplacer OneDrive par une IA ? Non : synchroniser et stocker des fichiers en sécurité dans l'écosystème Microsoft reste un besoin d'infrastructure. L'IA aide à les retrouver plus vite, elle ne remplace pas le stockage. Verdict : l'IA augmente la recherche, le stockage reste indispensable.",
    replaceEn: "Replace OneDrive with an AI? No: syncing and securely storing files within the Microsoft ecosystem remains an infrastructure need. AI helps find them faster, it doesn't replace storage. Verdict: AI augments search, storage remains essential.",
    aiTools: [],
  },
  box: {
    stance: "augmente",
    augmentFr: "Box a ajouté Box AI pour résumer et extraire des informations de documents stockés, mais reste avant tout une plateforme de stockage et de gouvernance documentaire pensée pour les entreprises avec des besoins de sécurité poussés.",
    augmentEn: "Box added Box AI to summarize and extract information from stored documents, but remains primarily a storage and document governance platform built for enterprises with advanced security needs.",
    replaceFr: "Remplacer Box par une IA ? Non : la gouvernance documentaire et la conformité de sécurité (souvent réglementée) restent un besoin d'infrastructure que l'IA n'adresse pas seule. Elle aide à extraire de l'information plus vite. Verdict : l'IA augmente l'exploitation des documents, le stockage sécurisé reste le produit.",
    replaceEn: "Replace Box with an AI? No: document governance and security compliance (often regulated) remain an infrastructure need AI doesn't address alone. It helps extract information faster. Verdict: AI augments document use, secure storage remains the product.",
    aiTools: [],
  },
  semrush: {
    stance: "augmente",
    augmentFr: "SEMrush a ajouté des fonctionnalités IA (résumé d'audit SEO, génération de contenu optimisé) mais reste avant tout un outil de données : positions de mots-clés, backlinks, trafic concurrent — des données réelles que l'IA ne peut pas inventer.",
    augmentEn: "SEMrush added AI features (SEO audit summaries, optimized content generation) but remains primarily a data tool: keyword rankings, backlinks, competitor traffic — real data that AI can't invent.",
    replaceFr: "Remplacer SEMrush par une IA ? Non : connaître la position réelle d'un mot-clé ou le trafic d'un concurrent nécessite de crawler le web et d'indexer des données réelles, pas de générer du texte. ChatGPT peut analyser des données SEO, mais ne peut pas les collecter lui-même. Verdict : l'IA augmente l'analyse, la collecte de données reste le vrai produit.",
    replaceEn: "Replace SEMrush with an AI? No: knowing a keyword's real ranking or a competitor's traffic requires crawling the web and indexing real data, not generating text. ChatGPT can analyze SEO data, but can't collect it itself. Verdict: AI augments analysis, data collection remains the real product.",
    aiTools: [],
  },
  ahrefs: {
    stance: "augmente",
    augmentFr: "Ahrefs a ajouté des résumés et suggestions IA dans ses rapports, mais sa valeur fondamentale reste son index de backlinks, l'un des plus complets du marché — une infrastructure de crawl, pas un problème de génération.",
    augmentEn: "Ahrefs added AI summaries and suggestions to its reports, but its core value remains its backlink index, one of the most complete on the market — crawling infrastructure, not a generation problem.",
    replaceFr: "Remplacer Ahrefs par une IA ? Non : son index de backlinks demande un crawl continu du web à très grande échelle, une infrastructure que l'IA générative n'a pas vocation à remplacer. L'IA aide à interpréter les données, pas à les collecter. Verdict : l'IA augmente l'analyse SEO, le crawl reste l'infrastructure clé.",
    replaceEn: "Replace Ahrefs with an AI? No: its backlink index requires continuous large-scale web crawling, infrastructure generative AI isn't built to replace. AI helps interpret the data, not collect it. Verdict: AI augments SEO analysis, crawling remains the key infrastructure.",
    aiTools: [],
  },
};

const CONTENT = {
  pandadoc: {
    shortDescription: "Création, envoi et signature électronique de devis, propositions et contrats.",
    shortDescriptionEn: "Create, send, and electronically sign quotes, proposals, and contracts.",
    longDescription: "PandaDoc combine la création de documents (devis, propositions commerciales, contrats) avec la signature électronique et le suivi d'ouverture, dans un seul outil. Pour un freelance ou une petite entreprise qui envoie régulièrement des propositions commerciales, c'est un gain de temps par rapport à jongler entre un PDF, un outil de signature séparé (DocuSign) et un suivi manuel.\n\nLes templates et la bibliothèque de contenu réutilisable en font surtout un outil pertinent à partir du moment où le volume de devis/contrats envoyés justifie d'automatiser la création.",
    longDescriptionEn: "PandaDoc combines document creation (quotes, sales proposals, contracts) with electronic signature and open tracking, in a single tool. For a freelancer or small business regularly sending sales proposals, it saves time compared to juggling a PDF, a separate signing tool (DocuSign), and manual tracking.\n\nTemplates and reusable content libraries make it especially relevant once the volume of quotes/contracts sent justifies automating creation.",
    pricing: "À partir de ~19€/mois par utilisateur (plan Essentials avec signature électronique).",
    pricingEn: "From ~$19/month per user (Essentials plan with e-signature).",
    pros: ["Création de proposition et signature électronique dans le même outil", "Suivi d'ouverture du document (sais quand le client l'a consulté)", "Templates réutilisables qui accélèrent l'envoi de devis récurrents"],
    prosEn: ["Proposal creation and e-signature in the same tool", "Document open tracking (know when the client viewed it)", "Reusable templates that speed up sending recurring quotes"],
    cons: ["Coût par utilisateur qui monte vite pour une petite équipe", "Moins connu que DocuSign, certains clients peuvent être moins familiers", "Fonctionnalités avancées (CPQ, intégrations CRM) réservées aux plans supérieurs"],
    consEn: ["Per-user cost rises quickly for a small team", "Less known than DocuSign, some clients may be less familiar with it", "Advanced features (CPQ, CRM integrations) reserved for higher plans"],
    useCases: ["Envoyer des propositions commerciales avec suivi d'ouverture et signature intégrée", "Standardiser la création de devis récurrents avec des templates", "Suivre quand un prospect consulte un contrat pour relancer au bon moment"],
    useCasesEn: ["Send sales proposals with open tracking and built-in signature", "Standardize recurring quote creation with templates", "Track when a prospect views a contract to follow up at the right time"],
    verdict: {
      keepIf: ["Tu envoies des propositions commerciales ou devis régulièrement", "Le suivi d'ouverture et la signature intégrée te font gagner du temps réel"],
      avoidIf: ["Tu signes rarement des documents — DocuSign à l'usage ou une signature manuelle suffisent", "Ton budget par utilisateur est serré pour une petite équipe"],
      threshold: "Pertinent dès que tu envoies des devis/contrats assez souvent pour justifier l'automatisation.",
    },
    verdictEn: {
      keepIf: ["You send sales proposals or quotes regularly", "Open tracking and built-in signature save you real time"],
      avoidIf: ["You rarely sign documents — pay-as-you-go DocuSign or manual signing is enough", "Your per-user budget is tight for a small team"],
      threshold: "Worth it once you send quotes/contracts often enough to justify automation.",
    },
  },
};

let updated = 0;
for (const [slug, fields] of Object.entries(CONTENT)) {
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  if (!tool) { console.warn(`⚠️  ${slug} not found`); continue; }
  for (const [key, value] of Object.entries(fields)) tool[key] = value;
  if (fields.longDescription) tool.description = fields.longDescription;
  updated++;
  console.log(`✓ ${tool.name} (${slug}) contenu complet`);
}
for (const [slug, angle] of Object.entries(ANGLES)) {
  if (!present.has(slug)) { console.warn(`⚠️  ${slug} not found, skipping`); continue; }
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  tool.seo = Object.assign({}, tool.seo, { aiAngle: angle });
  updated++;
  console.log(`✓ ${tool.name} (${slug}): aiAngle ${angle.stance}`);
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated} fiches mises à jour.`);
