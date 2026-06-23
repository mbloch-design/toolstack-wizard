/** add-ai-angle-batch-37.mjs — aiAngle pour Adobe Acrobat Sign, PayFit,
 * Factorial, Justworks, Rocket Lawyer, Ironclad, Google Workspace, ADP
 * Workforce. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  "adobe-acrobat-sign": {
    stance: "augmente",
    augmentFr: "Adobe Acrobat Sign a ajouté l'IA pour résumer des contrats et extraire des clés, mais reste l'infrastructure de signature électronique légalement reconnue pour les documents officiels.",
    augmentEn: "Adobe Acrobat Sign added AI to summarize contracts and extract key terms, but remains the legally recognized e-signature infrastructure for official documents.",
    replaceFr: "Remplacer Adobe Acrobat Sign par une IA ? Non : faire signer un document avec une valeur légale reconnue reste un besoin de conformité réglementée. L'IA aide à résumer ou analyser le contrat, elle ne remplace pas l'infrastructure de signature. Verdict : l'IA augmente l'analyse de documents, la signature légale reste le produit.",
    replaceEn: "Replace Adobe Acrobat Sign with an AI? No: getting a document signed with legally recognized value remains a regulated compliance need. AI helps summarize or analyze the contract, it doesn't replace signature infrastructure. Verdict: AI augments document analysis, legal signature remains the product.",
    aiTools: [],
  },
  payfit: {
    stance: "augmente",
    augmentFr: "PayFit automatise déjà fortement le calcul de paie via des règles métier, et ajoute l'IA pour répondre aux questions RH courantes — la conformité légale de la fiche de paie reste son cœur réglementé.",
    augmentEn: "PayFit already heavily automates payroll calculation via business rules, and adds AI to answer common HR questions — the legal compliance of the payslip remains its regulated core.",
    replaceFr: "Remplacer PayFit par une IA ? Non : calculer une fiche de paie conforme à la législation sociale française reste une responsabilité légale qu'une IA générative ne peut pas assumer seule. Verdict : l'IA augmente le support RH, la conformité de paie reste le vrai produit.",
    replaceEn: "Replace PayFit with an AI? No: calculating a payslip compliant with French labor law remains a legal responsibility a generative AI can't take on alone. Verdict: AI augments HR support, payroll compliance remains the real product.",
    aiTools: [],
  },
  factorial: {
    stance: "augmente",
    augmentFr: "Factorial a ajouté l'IA pour automatiser certaines tâches RH (réponses aux questions employés, tri de CV), mais reste un système de gestion RH réglementé (congés, paie, contrats) pour les PME.",
    augmentEn: "Factorial added AI to automate certain HR tasks (employee question answers, CV sorting), but remains a regulated HR management system (leave, payroll, contracts) for SMBs.",
    replaceFr: "Remplacer Factorial par une IA ? Non : gérer les contrats, congés et paie d'une équipe implique une responsabilité légale qu'une IA ne peut pas assumer seule. L'IA accélère certaines tâches RH, l'infrastructure réglementaire reste le vrai produit. Verdict : l'IA augmente la productivité RH, pas la conformité elle-même.",
    replaceEn: "Replace Factorial with an AI? No: managing a team's contracts, leave, and payroll involves legal liability an AI can't take on alone. AI speeds up certain HR tasks, the regulatory infrastructure remains the real product. Verdict: AI augments HR productivity, not compliance itself.",
    aiTools: [],
  },
  justworks: {
    stance: "augmente",
    augmentFr: "Justworks reste un PEO (employeur de référence) qui gère paie, avantages sociaux et conformité RH pour des petites entreprises américaines, un besoin réglementé sans rapport direct avec la génération IA.",
    augmentEn: "Justworks remains a PEO (employer of record) managing payroll, benefits, and HR compliance for small American businesses, a regulated need unrelated to AI generation.",
    replaceFr: "Remplacer Justworks par une IA ? Non : être l'employeur de référence légal pour gérer paie et avantages sociaux reste une structure réglementée que l'IA ne peut pas remplacer. Verdict : l'IA n'a pas de rôle direct ici, la conformité légale reste le produit.",
    replaceEn: "Replace Justworks with an AI? No: being the legal employer of record to manage payroll and benefits remains a regulated structure AI can't replace. Verdict: AI has no direct role here, legal compliance remains the product.",
    aiTools: [],
  },
  "rocket-lawyer": {
    stance: "augmente",
    augmentFr: "Rocket Lawyer combine des templates de documents juridiques avec un accès à des avocats, et ajoute l'IA pour pré-remplir des documents, mais la validation juridique finale reste humaine et réglementée.",
    augmentEn: "Rocket Lawyer combines legal document templates with access to lawyers, and adds AI to pre-fill documents, but final legal validation remains human and regulated.",
    replaceFr: "Remplacer Rocket Lawyer par une IA ? Pour un premier jet de contrat standard, l'IA peut aider. Pour une validation juridique engageant une responsabilité légale, un avocat humain reste nécessaire. Verdict : l'IA augmente la rédaction de documents, la validation juridique reste un travail humain.",
    replaceEn: "Replace Rocket Lawyer with an AI? For a first draft of a standard contract, AI can help. For legal validation involving liability, a human lawyer remains necessary. Verdict: AI augments document drafting, legal validation remains human work.",
    aiTools: [],
  },
  ironclad: {
    stance: "augmente",
    augmentFr: "Ironclad a ajouté l'IA pour analyser et négocier automatiquement des clauses contractuelles standard, mais reste une plateforme de gestion du cycle de vie des contrats (CLM) pour les équipes juridiques d'entreprise.",
    augmentEn: "Ironclad added AI to automatically analyze and negotiate standard contract clauses, but remains a contract lifecycle management (CLM) platform for corporate legal teams.",
    replaceFr: "Remplacer Ironclad par une IA ? Non : gérer le cycle de vie complet de centaines de contrats d'entreprise (signature, renouvellement, conformité) reste un besoin d'infrastructure réglementée. L'IA accélère l'analyse de clauses, elle ne remplace pas la gestion de contrats. Verdict : l'IA augmente l'analyse contractuelle, l'infrastructure CLM reste le produit.",
    replaceEn: "Replace Ironclad with an AI? No: managing the full lifecycle of hundreds of corporate contracts (signature, renewal, compliance) remains a regulated infrastructure need. AI speeds up clause analysis, it doesn't replace contract management. Verdict: AI augments contract analysis, CLM infrastructure remains the product.",
    aiTools: [],
  },
  "google-workspace": {
    stance: "augmente",
    augmentFr: "Google Workspace a intégré Gemini directement dans Gmail, Docs, Sheets et Meet, mais reste la suite bureautique collaborative elle-même — l'IA s'ajoute en couche d'assistance plutôt que de remplacer les outils.",
    augmentEn: "Google Workspace integrated Gemini directly into Gmail, Docs, Sheets, and Meet, but remains the collaborative office suite itself — AI is added as an assistance layer rather than replacing the tools.",
    replaceFr: "Remplacer Google Workspace par une IA ? Non : la collaboration en temps réel (documents partagés, mails, visio) reste un besoin d'infrastructure que l'IA assiste sans remplacer. Verdict : l'IA augmente la productivité dans chaque outil, la suite collaborative reste le produit.",
    replaceEn: "Replace Google Workspace with an AI? No: real-time collaboration (shared documents, mail, video) remains an infrastructure need AI assists without replacing. Verdict: AI augments productivity within each tool, the collaborative suite remains the product.",
    aiTools: ["gemini"],
  },
  "adp-workforce": {
    stance: "augmente",
    augmentFr: "ADP Workforce a ajouté l'IA pour des prévisions de masse salariale et des réponses RH automatisées, mais reste un système de paie et RH réglementé pour les grandes entreprises américaines.",
    augmentEn: "ADP Workforce added AI for payroll forecasting and automated HR responses, but remains a regulated payroll and HR system for large American companies.",
    replaceFr: "Remplacer ADP Workforce par une IA ? Non : calculer une paie conforme aux lois fiscales et sociales de plusieurs juridictions reste une responsabilité légale qu'une IA ne peut pas assumer seule. Verdict : l'IA augmente l'analyse et le support RH, la conformité de paie reste le vrai produit.",
    replaceEn: "Replace ADP Workforce with an AI? No: calculating payroll compliant with tax and labor laws across multiple jurisdictions remains a legal responsibility an AI can't take on alone. Verdict: AI augments analysis and HR support, payroll compliance remains the real product.",
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
