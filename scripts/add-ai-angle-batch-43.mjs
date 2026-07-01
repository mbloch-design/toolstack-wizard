/** add-ai-angle-batch-43.mjs — aiAngle pour 17hats, Proposify, Better
 * Proposals, Reflect, SignRequest, Superlist, Zotero, CaptainDoc. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  "17hats": {
    stance: "augmente",
    augmentFr: "17hats combine CRM, devis, contrats et facturation pour les freelances et petites entreprises de service, avec quelques automatisations mais sans IA générative poussée.",
    augmentEn: "17hats combines CRM, quotes, contracts, and invoicing for freelancers and small service businesses, with some automation but no deep generative AI.",
    replaceFr: "Remplacer 17hats par une IA ? Non : centraliser le parcours client complet (devis, contrat, facturation) reste un besoin structurel d'organisation, pas de génération de contenu. Verdict : l'IA n'a pas de rôle central ici, la structuration du parcours client reste le produit.",
    replaceEn: "Replace 17hats with an AI? No: centralizing the full client journey (quote, contract, invoicing) remains a structural organization need, not content generation. Verdict: AI has no central role here, client journey structuring remains the product.",
    aiTools: [],
  },
  proposify: {
    stance: "augmente",
    augmentFr: "Proposify a ajouté l'IA pour générer du contenu de proposition commerciale à partir de templates, mais reste l'infrastructure de suivi et de signature de propositions pour les équipes commerciales.",
    augmentEn: "Proposify added AI to generate sales proposal content from templates, but remains the proposal tracking and signature infrastructure for sales teams.",
    replaceFr: "Remplacer Proposify par une IA ? Non : suivre l'ouverture d'une proposition et sécuriser sa signature reste un besoin d'infrastructure de suivi. L'IA aide à rédiger le contenu, elle ne remplace pas le suivi du document. Verdict : l'IA augmente la rédaction, le suivi reste le produit.",
    replaceEn: "Replace Proposify with an AI? No: tracking a proposal's opening and securing its signature remains a tracking infrastructure need. AI helps write the content, it doesn't replace document tracking. Verdict: AI augments writing, tracking remains the product.",
    aiTools: [],
  },
  "better-proposals": {
    stance: "augmente",
    augmentFr: "Better Proposals propose des templates de propositions commerciales avec suivi de lecture, et ajoute l'IA pour rédiger du contenu, mais reste un outil de suivi documentaire plutôt qu'un générateur seul.",
    augmentEn: "Better Proposals offers sales proposal templates with read tracking, and adds AI to write content, but remains a document tracking tool rather than a generator alone.",
    replaceFr: "Remplacer Better Proposals par une IA ? Non : suivre quand un prospect consulte une proposition et sécuriser sa signature reste un besoin d'infrastructure de suivi. L'IA aide à rédiger, elle ne remplace pas le suivi. Verdict : l'IA augmente la rédaction, le suivi documentaire reste le produit.",
    replaceEn: "Replace Better Proposals with an AI? No: tracking when a prospect views a proposal and securing its signature remains a tracking infrastructure need. AI helps write, it doesn't replace tracking. Verdict: AI augments writing, document tracking remains the product.",
    aiTools: [],
  },
  "reflect-notes": {
    stance: "augmente",
    augmentFr: "Reflect a intégré des assistants IA pour résumer et générer des liens entre notes, dans la même catégorie que Roam Research et Obsidian — un système de notes liées augmenté par l'IA sans en changer la philosophie.",
    augmentEn: "Reflect integrated AI assistants to summarize and generate links between notes, in the same category as Roam Research and Obsidian — a linked-notes system augmented by AI without changing its philosophy.",
    replaceFr: "Remplacer Reflect par une IA ? Non : construire un système de pensée personnel en réseau au fil du temps reste un besoin de réflexion humaine que l'IA assiste sans remplacer. Verdict : l'IA augmente l'exploitation des notes, le système de pensée reste personnel.",
    replaceEn: "Replace Reflect with an AI? No: building a personal networked thinking system over time remains a human thinking need AI assists without replacing. Verdict: AI augments note usage, the thinking system remains personal.",
    aiTools: [],
  },
  signrequest: {
    stance: "augmente",
    augmentFr: "SignRequest reste un outil de signature électronique simple et économique, sans IA générative native — sa valeur est la conformité légale de la signature, pas la génération de contenu.",
    augmentEn: "SignRequest remains a simple, affordable e-signature tool, with no native generative AI — its value is the legal compliance of the signature, not content generation.",
    replaceFr: "Remplacer SignRequest par une IA ? Non : faire signer un document avec une valeur légale reconnue reste un besoin de conformité réglementée que l'IA ne peut pas remplacer. Verdict : l'IA n'a pas de rôle direct ici, la signature légale reste le produit.",
    replaceEn: "Replace SignRequest with an AI? No: getting a document signed with legally recognized value remains a regulated compliance need AI can't replace. Verdict: AI has no direct role here, legal signature remains the product.",
    aiTools: [],
  },
  superlist: {
    stance: "augmente",
    augmentFr: "Superlist combine tâches et notes dans une interface collaborative, avec quelques automatisations mais sans IA générative poussée — sa valeur reste l'organisation structurée des tâches en équipe.",
    augmentEn: "Superlist combines tasks and notes in a collaborative interface, with some automation but no deep generative AI — its value remains structured team task organization.",
    replaceFr: "Remplacer Superlist par une IA ? Non : organiser des tâches partagées avec une équipe reste un besoin structurel que l'IA assiste sans remplacer. Verdict : l'IA n'a pas de rôle central ici, l'organisation de tâches reste le produit.",
    replaceEn: "Replace Superlist with an AI? No: organizing shared tasks with a team remains a structural need AI assists without replacing. Verdict: AI has no central role here, task organization remains the product.",
    aiTools: [],
  },
  zotero: {
    stance: "augmente",
    augmentFr: "Zotero capture des métadonnées bibliographiques réelles depuis des sources académiques, sans génération IA poussée — sa valeur reste la précision de la collecte et du formatage de citations.",
    augmentEn: "Zotero captures real bibliographic metadata from academic sources, with no deep AI generation — its value remains the precision of collection and citation formatting.",
    replaceFr: "Remplacer Zotero par une IA ? Non : capturer fidèlement les métadonnées exactes d'une source académique pour des citations conformes reste un besoin de précision technique, pas de génération. Verdict : l'IA n'a pas de rôle central ici, la précision bibliographique reste le produit.",
    replaceEn: "Replace Zotero with an AI? No: faithfully capturing an academic source's exact metadata for compliant citations remains a technical precision need, not generation. Verdict: AI has no central role here, bibliographic precision remains the product.",
    aiTools: [],
  },
  captaindoc: {
    stance: "augmente",
    augmentFr: "CaptainDoc combine devis, contrats et suivi client pour les freelances, avec des automatisations mais sans IA générative poussée — un besoin de structuration administrative, pas de génération.",
    augmentEn: "CaptainDoc combines quotes, contracts, and client tracking for freelancers, with automations but no deep generative AI — an administrative structuring need, not generation.",
    replaceFr: "Remplacer CaptainDoc par une IA ? Non : centraliser le suivi administratif d'un freelance (devis, contrats, factures) reste un besoin structurel que l'IA assiste sans remplacer. Verdict : l'IA n'a pas de rôle central ici, la structuration administrative reste le produit.",
    replaceEn: "Replace CaptainDoc with an AI? No: centralizing a freelancer's administrative tracking (quotes, contracts, invoices) remains a structural need AI assists without replacing. Verdict: AI has no central role here, administrative structuring remains the product.",
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
