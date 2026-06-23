/** add-ai-angle-batch-34.mjs — aiAngle pour Dext, Kelio, Rydoo, Soldo,
 * Invoicely, Doppler, OneLogin, Payhawk. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  dext: {
    stance: "augmente",
    augmentFr: "Dext utilise l'IA pour extraire automatiquement les données d'un reçu ou d'une facture photographiée (montant, TVA, fournisseur), mais reste un outil de pré-comptabilité qui prépare les données pour un logiciel comptable.",
    augmentEn: "Dext uses AI to automatically extract data from a photographed receipt or invoice (amount, VAT, supplier), but remains a pre-accounting tool that prepares data for accounting software.",
    replaceFr: "Remplacer Dext par une IA ? Non : extraire fiablement des données comptables de documents réels (reçus, factures) reste un besoin technique précis. L'IA accélère la saisie, elle ne remplace pas le système comptable en aval. Verdict : l'IA augmente la saisie de dépenses, la comptabilité reste un système séparé.",
    replaceEn: "Replace Dext with an AI? No: reliably extracting accounting data from real documents (receipts, invoices) remains a precise technical need. AI speeds up entry, it doesn't replace the downstream accounting system. Verdict: AI augments expense entry, accounting remains a separate system.",
    aiTools: [],
  },
  kelio: {
    stance: "augmente",
    augmentFr: "Kelio gère la gestion des temps et des absences en entreprise (badgeage, congés), avec quelques automatisations mais sans IA générative poussée — un besoin de conformité RH et de suivi réel, pas de génération.",
    augmentEn: "Kelio manages time and leave tracking in companies (clocking, leave), with some automation but no deep generative AI — a need for HR compliance and real tracking, not generation.",
    replaceFr: "Remplacer Kelio par une IA ? Non : suivre le temps de travail réel et les congés légaux d'une équipe reste un besoin de conformité RH, pas un problème de génération de contenu. Verdict : l'IA n'a pas de rôle direct ici, le suivi réglementaire reste le produit.",
    replaceEn: "Replace Kelio with an AI? No: tracking a team's real working time and legal leave remains an HR compliance need, not a content-generation problem. Verdict: AI has no direct role here, regulatory tracking remains the product.",
    aiTools: [],
  },
  rydoo: {
    stance: "augmente",
    augmentFr: "Rydoo utilise l'IA pour scanner et catégoriser automatiquement les notes de frais, mais reste une plateforme de gestion de dépenses professionnelles avec validation et remboursement.",
    augmentEn: "Rydoo uses AI to automatically scan and categorize expense reports, but remains a professional expense management platform with validation and reimbursement.",
    replaceFr: "Remplacer Rydoo par une IA ? Non : valider et rembourser des notes de frais avec une politique d'entreprise réelle reste un besoin de processus structuré. L'IA accélère la saisie des dépenses, elle ne remplace pas le workflow d'approbation. Verdict : l'IA augmente la saisie, le processus de validation reste structurel.",
    replaceEn: "Replace Rydoo with an AI? No: validating and reimbursing expense reports with a real company policy remains a structured process need. AI speeds up expense entry, it doesn't replace the approval workflow. Verdict: AI augments entry, the validation process remains structural.",
    aiTools: [],
  },
  soldo: {
    stance: "augmente",
    augmentFr: "Soldo combine cartes de paiement professionnelles et logiciel de gestion des dépenses, avec catégorisation automatique des transactions — un besoin d'infrastructure financière, pas de génération de contenu.",
    augmentEn: "Soldo combines professional payment cards with expense management software, with automatic transaction categorization — a financial infrastructure need, not content generation.",
    replaceFr: "Remplacer Soldo par une IA ? Non : émettre des cartes de paiement professionnelles avec des limites de dépense contrôlées reste un besoin d'infrastructure financière réglementée. L'IA catégorise les dépenses, elle ne remplace pas les cartes elles-mêmes. Verdict : l'IA augmente la catégorisation, l'infrastructure de paiement reste le produit.",
    replaceEn: "Replace Soldo with an AI? No: issuing professional payment cards with controlled spending limits remains a regulated financial infrastructure need. AI categorizes spending, it doesn't replace the cards themselves. Verdict: AI augments categorization, payment infrastructure remains the product.",
    aiTools: [],
  },
  invoicely: {
    stance: "augmente",
    augmentFr: "Invoicely reste un outil de facturation simple sans IA générative native — sa valeur est la simplicité et le prix gratuit pour des besoins basiques de facturation, pas l'automatisation avancée.",
    augmentEn: "Invoicely remains a simple invoicing tool with no native generative AI — its value is simplicity and free pricing for basic invoicing needs, not advanced automation.",
    replaceFr: "Remplacer Invoicely par une IA ? Non : générer et envoyer des factures conformes reste un besoin administratif simple que l'outil couvre déjà sans IA. Verdict : l'IA n'a pas de rôle central ici, la simplicité de l'outil reste son principal atout.",
    replaceEn: "Replace Invoicely with an AI? No: generating and sending compliant invoices remains a simple administrative need the tool already covers with no AI. Verdict: AI has no central role here, the tool's simplicity remains its main asset.",
    aiTools: [],
  },
  doppler: {
    stance: "augmente",
    augmentFr: "Doppler reste un outil de gestion centralisée des secrets et variables d'environnement pour développeurs, sans IA native — un besoin de sécurité technique, pas de génération de contenu.",
    augmentEn: "Doppler remains a centralized secrets and environment variable management tool for developers, with no native AI — a technical security need, not content generation.",
    replaceFr: "Remplacer Doppler par une IA ? Non : centraliser et sécuriser des clés API et variables d'environnement sensibles reste un besoin technique précis. Verdict : l'IA n'a pas de rôle direct ici, la gestion de secrets reste une infrastructure stable.",
    replaceEn: "Replace Doppler with an AI? No: centralizing and securing sensitive API keys and environment variables remains a precise technical need. Verdict: AI has no direct role here, secrets management remains stable infrastructure.",
    aiTools: [],
  },
  onelogin: {
    stance: "augmente",
    augmentFr: "OneLogin a ajouté l'IA pour détecter des comportements de connexion suspects, mais reste un service d'authentification unique (SSO) et de gestion d'accès pour les entreprises — un besoin de sécurité réglementé.",
    augmentEn: "OneLogin added AI to detect suspicious login behavior, but remains a single sign-on (SSO) and access management service for companies — a regulated security need.",
    replaceFr: "Remplacer OneLogin par une IA ? Non : gérer l'authentification unique et les accès d'une entreprise à l'échelle reste un besoin de sécurité et de conformité réglementée. L'IA améliore la détection de fraude en arrière-plan. Verdict : l'IA augmente la sécurité, elle ne remplace pas la gestion d'identité.",
    replaceEn: "Replace OneLogin with an AI? No: managing single sign-on and access for a company at scale remains a regulated security and compliance need. AI improves fraud detection in the background. Verdict: AI augments security, it doesn't replace identity management.",
    aiTools: [],
  },
  payhawk: {
    stance: "augmente",
    augmentFr: "Payhawk combine cartes d'entreprise et gestion des dépenses avec catégorisation automatique par IA, mais reste une infrastructure financière réglementée pour les entreprises européennes.",
    augmentEn: "Payhawk combines corporate cards and expense management with AI automatic categorization, but remains regulated financial infrastructure for European companies.",
    replaceFr: "Remplacer Payhawk par une IA ? Non : émettre des cartes d'entreprise et gérer les dépenses avec des contrôles financiers reste un besoin d'infrastructure réglementée. L'IA catégorise les dépenses, elle ne remplace pas les cartes elles-mêmes. Verdict : l'IA augmente la catégorisation, l'infrastructure de paiement reste le produit.",
    replaceEn: "Replace Payhawk with an AI? No: issuing corporate cards and managing expenses with financial controls remains a regulated infrastructure need. AI categorizes spending, it doesn't replace the cards themselves. Verdict: AI augments categorization, payment infrastructure remains the product.",
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
