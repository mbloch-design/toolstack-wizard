/** add-ai-angle-batch-39.mjs — aiAngle pour WeTransfer, Namecheap,
 * Cloudinary, Kit, Chatbase, KrispCall, ProofHub, Plane. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  wetransfer: {
    stance: "augmente",
    augmentFr: "WeTransfer reste un service de transfert de fichiers volumineux simple, sans IA native — sa valeur est la simplicité d'envoi sans compte ni configuration, pas la génération de contenu.",
    augmentEn: "WeTransfer remains a simple large-file transfer service, with no native AI — its value is the simplicity of sending with no account or setup, not content generation.",
    replaceFr: "Remplacer WeTransfer par une IA ? Non : transférer un fichier volumineux de façon fiable reste un besoin d'infrastructure de transfert, pas de génération. Verdict : l'IA n'a pas de rôle direct ici, la simplicité de transfert reste le produit.",
    replaceEn: "Replace WeTransfer with an AI? No: reliably transferring a large file remains a transfer infrastructure need, not generation. Verdict: AI has no direct role here, transfer simplicity remains the product.",
    aiTools: [],
  },
  namecheap: {
    stance: "augmente",
    augmentFr: "Namecheap a ajouté un assistant IA pour suggérer des noms de domaine disponibles, mais reste un registraire de domaines et hébergeur — une infrastructure technique réglementée, pas un générateur de contenu.",
    augmentEn: "Namecheap added an AI assistant to suggest available domain names, but remains a domain registrar and host — regulated technical infrastructure, not a content generator.",
    replaceFr: "Remplacer Namecheap par une IA ? Non : enregistrer un nom de domaine de façon réglementée (ICANN) reste un besoin d'infrastructure technique. L'IA aide à trouver des idées de noms disponibles, elle ne remplace pas l'enregistrement lui-même. Verdict : l'IA augmente la recherche de noms, l'enregistrement reste une infrastructure réglementée.",
    replaceEn: "Replace Namecheap with an AI? No: registering a domain name in a regulated way (ICANN) remains a technical infrastructure need. AI helps find available name ideas, it doesn't replace registration itself. Verdict: AI augments name search, registration remains regulated infrastructure.",
    aiTools: [],
  },
  cloudinary: {
    stance: "augmente",
    augmentFr: "Cloudinary a intégré l'IA pour le recadrage automatique, la détection d'objets et l'optimisation de médias, mais reste une infrastructure de gestion et de livraison d'images/vidéos pour développeurs.",
    augmentEn: "Cloudinary integrated AI for automatic cropping, object detection, and media optimization, but remains image/video management and delivery infrastructure for developers.",
    replaceFr: "Remplacer Cloudinary par une IA ? Non : stocker, transformer et livrer des médias à grande échelle avec une latence minimale reste un besoin d'infrastructure technique. L'IA améliore le traitement automatique des médias, elle ne remplace pas l'infrastructure de livraison. Verdict : l'IA augmente le traitement média, l'infrastructure reste le produit.",
    replaceEn: "Replace Cloudinary with an AI? No: storing, transforming, and delivering media at scale with minimal latency remains a technical infrastructure need. AI improves automatic media processing, it doesn't replace delivery infrastructure. Verdict: AI augments media processing, infrastructure remains the product.",
    aiTools: [],
  },
  kit: {
    stance: "augmente",
    augmentFr: "Kit (anciennement ConvertKit) a ajouté l'IA pour générer des emails et automatisations, mais reste l'infrastructure d'email marketing pensée spécifiquement pour les créateurs qui monétisent une audience.",
    augmentEn: "Kit (formerly ConvertKit) added AI to generate emails and automations, but remains email marketing infrastructure specifically designed for creators monetizing an audience.",
    replaceFr: "Remplacer Kit par une IA ? Non : envoyer des emails à une liste d'abonnés avec délivrabilité et automatisations reste un besoin d'infrastructure technique. L'IA aide à rédiger les emails, elle ne remplace pas la plateforme d'envoi. Verdict : l'IA augmente la rédaction, l'infrastructure d'envoi reste le produit.",
    replaceEn: "Replace Kit with an AI? No: sending emails to a subscriber list with deliverability and automations remains a technical infrastructure need. AI helps write the emails, it doesn't replace the sending platform. Verdict: AI augments writing, sending infrastructure remains the product.",
    aiTools: [],
  },
  chatbase: {
    stance: "augmente",
    augmentFr: "Chatbase permet de créer un chatbot IA personnalisé entraîné sur ses propres documents, se positionnant comme l'outil no-code de référence pour déployer un agent de support IA sans développeur.",
    augmentEn: "Chatbase lets you build a custom AI chatbot trained on your own documents, positioning itself as the reference no-code tool to deploy an AI support agent with no developer.",
    replaceFr: "Chatbase remplace-t-il un agent de support humain ? Pour les questions fréquentes et répétitives, oui largement. Pour les cas complexes ou sensibles nécessitant de l'empathie, un humain reste nécessaire derrière l'outil. Verdict : l'IA augmente fortement le premier niveau de support, l'humain reste nécessaire pour l'escalade.",
    replaceEn: "Does Chatbase replace a human support agent? For frequent, repetitive questions, largely yes. For complex or sensitive cases requiring empathy, a human remains necessary behind the tool. Verdict: AI strongly augments first-level support, humans remain necessary for escalation.",
    aiTools: [],
  },
  krispcall: {
    stance: "augmente",
    augmentFr: "KrispCall a ajouté l'IA pour transcrire et résumer les appels, mais reste l'infrastructure téléphonique cloud (numéros virtuels, routage) pour les équipes commerciales et support.",
    augmentEn: "KrispCall added AI to transcribe and summarize calls, but remains cloud phone infrastructure (virtual numbers, routing) for sales and support teams.",
    replaceFr: "Remplacer KrispCall par une IA ? Non : gérer des numéros de téléphone virtuels et router les appels reste un besoin d'infrastructure téléphonique. L'IA aide à résumer les appels après coup, elle ne remplace pas le système téléphonique. Verdict : l'IA augmente le suivi des appels, l'infrastructure téléphonique reste le produit.",
    replaceEn: "Replace KrispCall with an AI? No: managing virtual phone numbers and routing calls remains a phone infrastructure need. AI helps summarize calls afterward, it doesn't replace the phone system. Verdict: AI augments call tracking, phone infrastructure remains the product.",
    aiTools: [],
  },
  proofhub: {
    stance: "augmente",
    augmentFr: "ProofHub combine gestion de projet et outils de revue/validation (proofing) pour les agences et équipes créatives, sans IA générative poussée — un besoin de structuration de projet, pas de génération.",
    augmentEn: "ProofHub combines project management and proofing/validation tools for agencies and creative teams, with no deep generative AI — a project structuring need, not generation.",
    replaceFr: "Remplacer ProofHub par une IA ? Non : structurer le suivi de projet et la validation de livrables avec un client reste un besoin organisationnel. Verdict : l'IA n'a pas de rôle central ici, la structuration de projet reste le produit.",
    replaceEn: "Replace ProofHub with an AI? No: structuring project tracking and deliverable validation with a client remains an organizational need. Verdict: AI has no central role here, project structuring remains the product.",
    aiTools: [],
  },
  plane: {
    stance: "augmente",
    augmentFr: "Plane est un outil open source de gestion de projet (alternative à Linear ou Jira), avec quelques assistants IA tiers, mais reste avant tout une infrastructure de suivi de tickets et de sprints.",
    augmentEn: "Plane is an open-source project management tool (an alternative to Linear or Jira), with some third-party AI assistants, but remains primarily ticket and sprint tracking infrastructure.",
    replaceFr: "Remplacer Plane par une IA ? Non : suivre des tickets, sprints et dépendances d'équipe reste un besoin de coordination structurée. L'IA aide à rédiger des tickets plus vite, elle ne remplace pas le suivi de projet. Verdict : l'IA augmente la rédaction de tickets, le suivi de projet reste le produit.",
    replaceEn: "Replace Plane with an AI? No: tracking tickets, sprints, and team dependencies remains a structured coordination need. AI helps write tickets faster, it doesn't replace project tracking. Verdict: AI augments ticket writing, project tracking remains the product.",
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
