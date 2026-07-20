#!/usr/bin/env node
/** Brouillons éditoriaux déterministes, strictement séparés des faits volatils. */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const DRAFTS = {
  webflow: {
    fr: {
      short_description: "Un constructeur de sites visuel orienté design, CMS et publication professionnelle.",
      long_description: "Webflow combine un éditeur visuel précis, un hébergement géré et un CMS. Il convient surtout aux sites marketing et éditoriaux qui demandent davantage de contrôle qu’un constructeur généraliste, sans imposer de gérer soi-même une pile technique complète. La séparation entre offres de site et offres d’équipe doit toutefois rester claire au moment d’estimer le coût réel.",
      use_cases: ["Créer un site marketing sur mesure", "Publier un site éditorial avec CMS", "Livrer des sites clients sans gérer l’hébergement"],
      pros: ["Contrôle visuel poussé sur la mise en page", "CMS et hébergement réunis", "Montée en gamme possible pour les sites riches en contenu"],
      cons: ["Courbe d’apprentissage supérieure à un éditeur très guidé", "Tarification séparée entre site et organisation", "Le plan sans CMS devient vite limité pour un site éditorial"],
      verdict: { keepIf: ["Tu veux contrôler finement le design sans maintenir une infrastructure web", "Ton site a besoin d’un CMS structuré"], avoidIf: ["Tu veux seulement publier quelques pages avec le minimum de réglages", "Tu risques de confondre coûts du site et coûts de l’équipe"], threshold: "Pertinent quand la maîtrise du design et du CMS justifie une prise en main plus exigeante." },
    },
    en: {
      short_description: "A visual website builder focused on design control, CMS, and professional publishing.",
      long_description: "Webflow combines a precise visual editor, managed hosting, and a CMS. It is best suited to marketing and editorial sites that need more control than a general-purpose builder without requiring teams to maintain a full technical stack. Site plans and team-level plans should remain clearly separated when estimating total cost.",
      use_cases: ["Build a custom marketing site", "Publish an editorial website with a CMS", "Deliver client sites without managing hosting"],
      pros: ["Fine-grained visual layout control", "CMS and hosting in one platform", "A clear upgrade path for content-rich sites"],
      cons: ["Steeper learning curve than highly guided builders", "Site and organization pricing are separate", "The non-CMS tier is quickly limiting for editorial sites"],
      verdict: { keepIf: ["You need strong design control without maintaining web infrastructure", "Your site needs a structured CMS"], avoidIf: ["You only need a few pages with minimal setup", "You may overlook the difference between site and team costs"], threshold: "Worth it when design and CMS control justify the additional learning curve." },
    },
  },
  framer: {
    fr: {
      short_description: "Un outil de création de sites visuels centré sur la rapidité, le design et les interactions.",
      long_description: "Framer permet de concevoir et publier rapidement des sites visuels, avec domaine personnalisé, CMS et outils de mise en ligne selon l’offre choisie. Il se distingue par un flux de travail proche des outils de design. Les frais liés au site et ceux des éditeurs supplémentaires restent deux dimensions différentes du coût.",
      use_cases: ["Créer une landing page soignée", "Publier un portfolio", "Lancer rapidement un site marketing avec CMS"],
      pros: ["Passage rapide du design au site publié", "Bon niveau de finition visuelle", "Fonctions de staging et de collaboration sur les offres supérieures"],
      cons: ["Les éditeurs supplémentaires sont facturés séparément", "Les limites CMS et de bande passante varient fortement selon l’offre", "Les anciens noms de plans peuvent rendre les comparaisons historiques trompeuses"],
      verdict: { keepIf: ["Tu privilégies la vitesse de conception et la qualité visuelle", "Ton équipe travaille déjà avec une logique proche des outils de design"], avoidIf: ["Tu as besoin d’un CMS très complexe", "Ton équipe comporte de nombreux éditeurs payants"], threshold: "Pertinent pour publier vite un site marketing ou un portfolio très visuel." },
    },
    en: {
      short_description: "A visual website builder focused on speed, design quality, and interactions.",
      long_description: "Framer helps teams design and publish visual websites quickly, with custom domains, CMS capabilities, and publishing tools depending on the selected plan. Its workflow feels close to modern design tools. Site costs and additional editor-seat costs remain separate parts of the overall budget.",
      use_cases: ["Build a polished landing page", "Publish a portfolio", "Launch a marketing site with a CMS quickly"],
      pros: ["Fast path from design to a live site", "Strong visual polish", "Staging and collaboration features on higher tiers"],
      cons: ["Additional editors are billed separately", "CMS and bandwidth limits vary significantly by tier", "Legacy plan names can make historical comparisons misleading"],
      verdict: { keepIf: ["You prioritize design speed and visual quality", "Your team already works with design-tool-like workflows"], avoidIf: ["You need a highly complex CMS", "You have many paid editors"], threshold: "Worth it for quickly publishing a visually polished marketing site or portfolio." },
    },
  },
  squarespace: {
    fr: {
      short_description: "Un constructeur de sites tout-en-un pour publier, vendre et gérer une présence en ligne.",
      long_description: "Squarespace réunit création de site, hébergement, contenus et fonctions commerciales dans une interface guidée. Il convient aux indépendants et petites structures qui veulent lancer une présence professionnelle sans assembler plusieurs services. Le choix d’offre dépend surtout du nombre de contributeurs, du niveau de personnalisation et des frais liés à la vente.",
      use_cases: ["Créer un site vitrine professionnel", "Publier un portfolio ou un blog", "Vendre des produits, services ou contenus"],
      pros: ["Environnement tout-en-un", "Mise en ligne guidée", "Fonctions commerciales accessibles sur plusieurs offres"],
      cons: ["Personnalisation plus contrainte qu’un outil orienté développement", "Les frais de transaction varient selon l’offre", "Chaque site possède son propre abonnement"],
      verdict: { keepIf: ["Tu veux un site professionnel sans gérer plusieurs services", "Tu privilégies une expérience guidée"], avoidIf: ["Tu veux un contrôle technique très fin", "Tu exploites plusieurs sites et sous-estimes le coût par site"], threshold: "Pertinent pour une petite structure qui privilégie la simplicité d’exploitation à la liberté technique maximale." },
    },
    en: {
      short_description: "An all-in-one website builder for publishing, selling, and managing an online presence.",
      long_description: "Squarespace combines website creation, hosting, content, and commerce features in a guided interface. It suits freelancers and small organizations that want a professional presence without assembling several services. Plan choice mainly depends on contributor count, customization needs, and selling-related fees.",
      use_cases: ["Create a professional business website", "Publish a portfolio or blog", "Sell products, services, or content"],
      pros: ["All-in-one environment", "Guided publishing workflow", "Commerce features across several tiers"],
      cons: ["Less flexible than development-oriented tools", "Transaction fees vary by plan", "Each website has its own subscription"],
      verdict: { keepIf: ["You want a professional site without managing multiple services", "You prefer a guided setup"], avoidIf: ["You need fine-grained technical control", "You run several sites and may underestimate per-site costs"], threshold: "Worth it for small organizations that value operational simplicity over maximum technical freedom." },
    },
  },
};

const sortKeys = (v) => Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object"
  ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v;

export function editorialPayload(slug, doc) {
  const captures = [...new Set((doc.collector?.observations ?? []).filter((o) => o.status === "observed").map((o) => o.capture_ref).filter(Boolean))];
  return {
    status: "draft", content_version: 1, author: "ToolTrim research pilot",
    generated_on: "2026-07-20", facts_basis: captures,
    pricing_facts_policy: "Les montants, devises et engagements restent exclusivement dans collector.observations.",
    ...DRAFTS[slug],
  };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const report = [];
  for (const slug of Object.keys(DRAFTS)) {
    const file = path.join(process.cwd(), "research", "tool-pages", `${slug}.json`);
    const doc = JSON.parse(await readFile(file, "utf8"));
    const next = editorialPayload(slug, doc);
    const changed = JSON.stringify(sortKeys(doc.editorial_drafts ?? null)) !== JSON.stringify(sortKeys(next));
    if (apply && changed) {
      doc.editorial_drafts = next;
      await writeFile(file, JSON.stringify(sortKeys(doc), null, 2) + "\n");
    }
    report.push({ slug, changed, applied: apply && changed, facts_basis: next.facts_basis.length });
  }
  console.log(JSON.stringify({ mode: apply ? "APPLY_LOCAL_RESEARCH_ONLY" : "DRY_RUN", report }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e); process.exit(1); });
