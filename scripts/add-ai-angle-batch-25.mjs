/** add-ai-angle-batch-25.mjs — aiAngle pour Affinity Photo, Gusto,
 * Logseq, Microsoft Project, Rippling, Contra, Upwork, Vanta. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  "affinity-photo": {
    stance: "augmente",
    augmentFr: "Affinity Photo reste un éditeur de retouche manuel en achat unique, sans IA générative native — sa différenciation reste le prix (pas d'abonnement) plutôt que des fonctionnalités IA comme Photoshop.",
    augmentEn: "Affinity Photo remains a manual editing tool with a one-time purchase, with no native generative AI — its differentiation remains price (no subscription) rather than AI features like Photoshop.",
    replaceFr: "Remplacer Affinity Photo par une IA ? Non, mais il accuse un retard sur les fonctionnalités IA génératives de Photoshop (remplissage génératif). Sa valeur reste le contrôle manuel précis sans abonnement. Verdict : challengé sur l'IA générative, mais différencié par son modèle économique sans abonnement.",
    replaceEn: "Replace Affinity Photo with an AI? No, but it lags behind Photoshop's generative AI features (generative fill). Its value remains precise manual control with no subscription. Verdict: challenged on generative AI, but differentiated by its no-subscription business model.",
    aiTools: [],
  },
  gusto: {
    stance: "augmente",
    augmentFr: "Gusto a ajouté l'IA pour répondre aux questions RH courantes, mais reste un système de paie et d'avantages sociaux réglementé pour les PME américaines — un besoin de conformité, pas de génération.",
    augmentEn: "Gusto added AI to answer common HR questions, but remains a regulated payroll and benefits system for US SMBs — a compliance need, not generation.",
    replaceFr: "Remplacer Gusto par une IA ? Non : calculer une paie conforme aux lois fiscales et sociales reste une responsabilité légale qu'une IA ne peut pas assumer seule. L'IA répond aux questions courantes, elle ne remplace pas le système de paie. Verdict : l'IA augmente le support RH, la conformité reste le vrai produit.",
    replaceEn: "Replace Gusto with an AI? No: calculating payroll compliant with tax and labor laws remains a legal responsibility an AI can't take on alone. AI answers common questions, it doesn't replace the payroll system. Verdict: AI augments HR support, compliance remains the real product.",
    aiTools: [],
  },
  logseq: {
    stance: "augmente",
    augmentFr: "Logseq reste un système de notes liées open source et local, avec des plugins IA tiers qui s'y ajoutent progressivement sans changer sa philosophie de pensée en réseau et de propriété des données.",
    augmentEn: "Logseq remains an open-source, local linked-notes system, with third-party AI plugins gradually being added without changing its philosophy of networked thinking and data ownership.",
    replaceFr: "Remplacer Logseq par une IA ? Non : la valeur de Logseq est de garder ses notes en local, structurées par soi-même au fil du temps — un système de pensée personnel que l'IA n'a pas vocation à remplacer. Verdict : l'IA augmente l'exploitation des notes, le système de pensée reste personnel.",
    replaceEn: "Replace Logseq with an AI? No: Logseq's value is keeping notes local, self-structured over time — a personal thinking system AI isn't meant to replace. Verdict: AI augments note usage, the thinking system remains personal.",
    aiTools: [],
  },
  "microsoft-project": {
    stance: "augmente",
    augmentFr: "Microsoft Project a ajouté des suggestions IA pour la planification de tâches, mais reste un outil de gestion de projet structuré (Gantt, ressources, dépendances) pour des projets complexes en entreprise.",
    augmentEn: "Microsoft Project added AI suggestions for task planning, but remains a structured project management tool (Gantt, resources, dependencies) for complex enterprise projects.",
    replaceFr: "Remplacer Microsoft Project par une IA ? Non : planifier un projet complexe avec des dépendances et des ressources partagées reste un besoin de structure que l'IA assiste sans remplacer. Verdict : l'IA augmente la suggestion de planning, la structure de projet reste le produit.",
    replaceEn: "Replace Microsoft Project with an AI? No: planning a complex project with dependencies and shared resources remains a structural need AI assists without replacing. Verdict: AI augments scheduling suggestions, project structure remains the product.",
    aiTools: [],
  },
  rippling: {
    stance: "augmente",
    augmentFr: "Rippling a intégré l'IA pour automatiser certaines tâches RH et IT (provisioning d'équipement, réponses aux questions employés), mais reste une plateforme unifiée RH/IT/finance réglementée pour les entreprises.",
    augmentEn: "Rippling integrated AI to automate certain HR and IT tasks (equipment provisioning, employee question answers), but remains a unified, regulated HR/IT/finance platform for companies.",
    replaceFr: "Remplacer Rippling par une IA ? Non : unifier la paie, les RH et la gestion IT (provisioning d'appareils, accès) reste un besoin d'infrastructure réglementée. L'IA automatise certaines tâches répétitives, elle ne remplace pas la plateforme. Verdict : l'IA augmente l'automatisation RH/IT, l'infrastructure reste le produit.",
    replaceEn: "Replace Rippling with an AI? No: unifying payroll, HR, and IT management (device provisioning, access) remains a regulated infrastructure need. AI automates certain repetitive tasks, it doesn't replace the platform. Verdict: AI augments HR/IT automation, infrastructure remains the product.",
    aiTools: [],
  },
  contra: {
    stance: "augmente",
    augmentFr: "Contra est une place de marché freelance sans commission (\"commission-free\"), positionnée comme alternative à Upwork ou Fiverr — l'IA y est secondaire, l'argument principal reste l'absence de frais de plateforme.",
    augmentEn: "Contra is a commission-free freelance marketplace, positioned as an alternative to Upwork or Fiverr — AI is secondary there, the main argument remains the absence of platform fees.",
    replaceFr: "Remplacer Contra par une IA ? Non : mettre en relation freelances et clients avec un profil portfolio et un système de paiement reste un besoin de plateforme, pas de génération. Verdict : l'IA n'a pas de rôle central ici, le modèle sans commission reste le vrai différenciateur.",
    replaceEn: "Replace Contra with an AI? No: connecting freelancers and clients with a portfolio profile and payment system remains a platform need, not generation. Verdict: AI has no central role here, the commission-free model remains the real differentiator.",
    aiTools: [],
  },
  upwork: {
    stance: "augmente",
    augmentFr: "Upwork a ajouté des suggestions IA pour rédiger des propositions et matcher freelances et missions, mais reste la place de marché freelance la plus utilisée au monde — un besoin de mise en relation et de paiement sécurisé.",
    augmentEn: "Upwork added AI suggestions to write proposals and match freelancers with projects, but remains the world's most-used freelance marketplace — a need for matching and secure payment.",
    replaceFr: "Remplacer Upwork par une IA ? Non : trouver des missions et sécuriser le paiement entre freelance et client reste un besoin de plateforme avec une audience déjà construite. L'IA aide à rédiger des propositions plus vite, elle ne remplace pas la mise en relation. Verdict : l'IA augmente la candidature, la plateforme reste le produit.",
    replaceEn: "Replace Upwork with an AI? No: finding projects and securing payment between freelancer and client remains a platform need with an already-built audience. AI helps write proposals faster, it doesn't replace matching. Verdict: AI augments applying, the platform remains the product.",
    aiTools: [],
  },
  vanta: {
    stance: "augmente",
    augmentFr: "Vanta automatise la surveillance continue de conformité (SOC 2, ISO 27001, RGPD) avec des contrôles techniques, mais l'audit final et la responsabilité de conformité restent humains et réglementés.",
    augmentEn: "Vanta automates continuous compliance monitoring (SOC 2, ISO 27001, GDPR) with technical controls, but the final audit and compliance liability remain human and regulated.",
    replaceFr: "Remplacer Vanta par une IA ? Non : surveiller en continu des centaines de contrôles de sécurité techniques pour rester conforme reste un besoin d'automatisation de surveillance, pas de génération de contenu. L'audit final reste effectué par des auditeurs humains certifiés. Verdict : l'IA automatise la surveillance, l'audit humain reste la validation finale.",
    replaceEn: "Replace Vanta with an AI? No: continuously monitoring hundreds of technical security controls to stay compliant remains a monitoring automation need, not content generation. The final audit is still performed by certified human auditors. Verdict: AI automates monitoring, human audit remains the final validation.",
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
