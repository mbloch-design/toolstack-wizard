/** add-ai-angle-batch-17.mjs — aiAngle pour 8 outils business déjà bien
 * remplis : Cal.com, HoneyBook, Indy, Shine, Pennylane, Legalstart,
 * Lemlist, Apollo.io. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  "cal-com": {
    stance: "augmente",
    augmentFr: "Cal.com reste un outil de planification de rendez-vous open source ; l'IA s'ajoute en périphérie (résumé de réunion via intégrations tierces) sans changer son rôle premier de gestion de disponibilités.",
    augmentEn: "Cal.com remains an open-source scheduling tool; AI is added at the periphery (meeting summaries via third-party integrations) without changing its primary role of availability management.",
    replaceFr: "Remplacer Cal.com par une IA ? Non : synchroniser des disponibilités réelles entre plusieurs calendriers et permettre une prise de rendez-vous sans aller-retour reste un besoin d'infrastructure. Verdict : l'IA n'a pas de rôle central ici, la synchronisation de calendrier reste le produit.",
    replaceEn: "Replace Cal.com with an AI? No: syncing real availability across multiple calendars and enabling no-back-and-forth booking remains an infrastructure need. Verdict: AI has no central role here, calendar sync remains the product.",
    aiTools: [],
  },
  honeybook: {
    stance: "augmente",
    augmentFr: "HoneyBook a ajouté l'IA pour générer des propositions et contrats plus vite, mais reste la plateforme de gestion client (devis, contrats, paiements) pour les freelances créatifs et prestataires de service.",
    augmentEn: "HoneyBook added AI to generate proposals and contracts faster, but remains the client management platform (quotes, contracts, payments) for creative freelancers and service providers.",
    replaceFr: "Remplacer HoneyBook par une IA ? Non : gérer le parcours client de bout en bout (devis, signature, facturation, paiement) reste un besoin structurel. L'IA accélère la rédaction de propositions, elle ne remplace pas le suivi du parcours client. Verdict : l'IA augmente la rédaction, le suivi reste le produit.",
    replaceEn: "Replace HoneyBook with an AI? No: managing the end-to-end client journey (quotes, signature, invoicing, payment) remains a structural need. AI speeds up proposal writing, it doesn't replace client journey tracking. Verdict: AI augments writing, tracking remains the product.",
    aiTools: [],
  },
  indy: {
    stance: "augmente",
    augmentFr: "Indy a intégré des suggestions IA pour la rédaction de contrats et devis, mais reste avant tout un outil français de gestion administrative pour freelances (factures, contrats, suivi clients, déclarations).",
    augmentEn: "Indy integrated AI suggestions for drafting contracts and quotes, but remains primarily a French administrative management tool for freelancers (invoices, contracts, client tracking, declarations).",
    replaceFr: "Remplacer Indy par une IA ? Non : la gestion administrative d'un freelance français (facturation conforme, contrats, déclarations) reste un besoin réglementé. L'IA aide à rédiger plus vite, elle ne remplace pas la conformité administrative. Verdict : l'IA augmente la rédaction, la gestion admin reste le produit.",
    replaceEn: "Replace Indy with an AI? No: a French freelancer's administrative management (compliant invoicing, contracts, declarations) remains a regulated need. AI helps write faster, it doesn't replace administrative compliance. Verdict: AI augments writing, admin management remains the product.",
    aiTools: [],
  },
  shine: {
    stance: "augmente",
    augmentFr: "Shine a ajouté des fonctionnalités IA pour catégoriser les dépenses et estimer les charges, mais reste fondamentalement une banque en ligne pour freelances et auto-entrepreneurs — un besoin réglementé d'infrastructure bancaire.",
    augmentEn: "Shine added AI features to categorize expenses and estimate taxes, but remains fundamentally an online bank for freelancers and sole proprietors — a regulated banking infrastructure need.",
    replaceFr: "Remplacer Shine par une IA ? Non : tenir un compte bancaire professionnel réglementé reste un besoin d'infrastructure financière que l'IA ne remplace pas. Elle aide à catégoriser les dépenses et estimer les charges. Verdict : l'IA augmente la gestion comptable, le compte bancaire reste indispensable.",
    replaceEn: "Replace Shine with an AI? No: holding a regulated professional bank account remains a financial infrastructure need AI doesn't replace. It helps categorize expenses and estimate taxes. Verdict: AI augments accounting management, the bank account remains essential.",
    aiTools: [],
  },
  pennylane: {
    stance: "augmente",
    augmentFr: "Pennylane utilise l'IA pour automatiser la saisie comptable (lecture de factures, catégorisation), mais reste un logiciel de comptabilité réglementé conçu pour collaborer avec un expert-comptable.",
    augmentEn: "Pennylane uses AI to automate accounting entry (invoice reading, categorization), but remains regulated accounting software designed to collaborate with an accountant.",
    replaceFr: "Remplacer Pennylane par une IA ? Non : la comptabilité légale d'une entreprise doit respecter des normes précises et être validée par un expert-comptable, pas une tâche qu'une IA peut faire seule. Elle automatise la saisie, elle ne remplace pas la validation comptable. Verdict : l'IA augmente la saisie automatique, la conformité reste le vrai produit.",
    replaceEn: "Replace Pennylane with an AI? No: a company's legal accounting must follow precise standards and be validated by an accountant, not a task an AI can do alone. It automates entry, it doesn't replace accounting validation. Verdict: AI augments automatic entry, compliance remains the real product.",
    aiTools: [],
  },
  legalstart: {
    stance: "augmente",
    augmentFr: "Legalstart a ajouté des assistants IA pour pré-remplir des documents juridiques, mais reste une plateforme de services juridiques en ligne (création d'entreprise, contrats, conformité) avec une validation humaine derrière chaque document.",
    augmentEn: "Legalstart added AI assistants to pre-fill legal documents, but remains an online legal services platform (business creation, contracts, compliance) with human validation behind every document.",
    replaceFr: "Remplacer Legalstart par une IA ? Non : la création d'entreprise et la rédaction de contrats juridiquement valables impliquent une responsabilité légale qu'une IA généraliste ne peut pas assumer seule. L'IA pré-remplit, un humain valide. Verdict : l'IA augmente la rédaction, la validation juridique reste indispensable.",
    replaceEn: "Replace Legalstart with an AI? No: business creation and drafting legally valid contracts involve legal liability a general-purpose AI can't take on alone. AI pre-fills, a human validates. Verdict: AI augments drafting, legal validation remains essential.",
    aiTools: [],
  },
  lemlist: {
    stance: "augmente",
    augmentFr: "Lemlist a son assistant IA pour générer des séquences d'emails de prospection personnalisées, mais reste l'infrastructure d'envoi et de suivi des campagnes de cold email à grande échelle.",
    augmentEn: "Lemlist has its AI assistant to generate personalized cold email sequences, but remains the infrastructure for sending and tracking cold email campaigns at scale.",
    replaceFr: "Remplacer Lemlist par une IA ? Non : envoyer des emails de prospection à grande échelle sans tomber en spam, avec un suivi des taux d'ouverture et de réponse, reste un besoin d'infrastructure technique. L'IA aide à rédiger les emails, elle ne remplace pas l'envoi et le suivi. Verdict : l'IA augmente la rédaction, l'infrastructure d'envoi reste le produit.",
    replaceEn: "Replace Lemlist with an AI? No: sending cold emails at scale without landing in spam, with open and reply rate tracking, remains a technical infrastructure need. AI helps write the emails, it doesn't replace sending and tracking. Verdict: AI augments writing, sending infrastructure remains the product.",
    aiTools: [],
  },
  "apollo-io": {
    stance: "augmente",
    augmentFr: "Apollo.io combine une base de données de contacts B2B avec des fonctionnalités IA de prospection (rédaction d'emails, scoring de leads), mais sa valeur fondamentale reste sa base de données de contacts vérifiés.",
    augmentEn: "Apollo.io combines a B2B contact database with AI prospecting features (email drafting, lead scoring), but its core value remains its verified contact database.",
    replaceFr: "Remplacer Apollo.io par une IA ? Non : disposer d'une base de données de contacts B2B vérifiés et à jour nécessite une collecte et une vérification de données réelles, pas seulement de la génération. L'IA aide à rédiger et prioriser les prospects, elle ne remplace pas la base de données. Verdict : l'IA augmente la prospection, la donnée vérifiée reste l'infrastructure clé.",
    replaceEn: "Replace Apollo.io with an AI? No: having a verified, up-to-date B2B contact database requires real data collection and verification, not just generation. AI helps write and prioritize prospects, it doesn't replace the database. Verdict: AI augments prospecting, verified data remains the key infrastructure.",
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
