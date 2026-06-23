/** add-ai-angle-batch-18.mjs — aiAngle pour QuickBooks Online, Carrd,
 * Whimsical, Excalidraw, Penpot, v0 by Vercel, Taskade, Paddle. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  "quickbooks-online": {
    stance: "augmente",
    augmentFr: "QuickBooks a ajouté l'IA pour catégoriser automatiquement les transactions et générer des prévisions de trésorerie, mais reste un logiciel de comptabilité réglementé conçu pour produire des documents légaux fiables.",
    augmentEn: "QuickBooks added AI to automatically categorize transactions and generate cash flow forecasts, but remains regulated accounting software designed to produce reliable legal documents.",
    replaceFr: "Remplacer QuickBooks par une IA ? Non : la comptabilité d'une entreprise doit respecter des règles fiscales précises, pas une tâche qu'un chatbot peut assumer seul. L'IA accélère la catégorisation, elle ne remplace pas le système comptable. Verdict : l'IA augmente la productivité comptable, la conformité reste le vrai produit.",
    replaceEn: "Replace QuickBooks with an AI? No: business accounting must follow precise tax rules, not a task a chatbot can handle alone. AI speeds up categorization, it doesn't replace the accounting system. Verdict: AI augments accounting productivity, compliance remains the real product.",
    aiTools: [],
  },
  carrd: {
    stance: "challenge",
    augmentFr: "Carrd reste un constructeur de site une-page minimaliste sans génération IA native, alors que des générateurs comme Framer AI ou Lovable produisent désormais une page complète depuis un simple prompt.",
    augmentEn: "Carrd remains a minimalist one-page site builder with no native AI generation, while generators like Framer AI or Lovable now produce a complete page from a simple prompt.",
    replaceFr: "Remplacer Carrd par une IA ? Pour une page simple, les générateurs IA-first vont aussi vite avec un résultat comparable. Carrd garde l'avantage de son prix imbattable (1$/an) et de sa simplicité radicale pour qui sait déjà ce qu'il veut. Verdict : challengé sur la génération, mais reste pertinent pour sa simplicité et son prix.",
    replaceEn: "Replace Carrd with an AI? For a simple page, AI-first generators are just as fast with a comparable result. Carrd keeps the edge of its unbeatable price ($1/year) and radical simplicity for those who already know what they want. Verdict: challenged on generation, but remains relevant for its simplicity and price.",
    aiTools: ["framer", "lovable"],
  },
  whimsical: {
    stance: "augmente",
    augmentFr: "Whimsical a ajouté un assistant IA pour générer des wireframes, mind maps et diagrammes de flux à partir d'une description, mais reste l'outil de structuration visuelle collaborative pour des idées et processus.",
    augmentEn: "Whimsical added an AI assistant to generate wireframes, mind maps, and flowcharts from a description, but remains the collaborative visual structuring tool for ideas and processes.",
    replaceFr: "Remplacer Whimsical par une IA ? Non : structurer visuellement une idée en équipe, avec des itérations et des commentaires collaboratifs, reste un besoin de collaboration que l'IA accélère sans remplacer. Verdict : l'IA augmente le premier jet, la collaboration visuelle reste le produit.",
    replaceEn: "Replace Whimsical with an AI? No: visually structuring an idea as a team, with iterations and collaborative comments, remains a collaboration need AI speeds up without replacing. Verdict: AI augments the first draft, visual collaboration remains the product.",
    aiTools: [],
  },
  excalidraw: {
    stance: "augmente",
    augmentFr: "Excalidraw reste un outil de dessin collaboratif au style \"tableau blanc\" volontairement minimaliste, sans génération IA native — sa valeur est la simplicité et la rapidité d'un croquis à main levée numérique.",
    augmentEn: "Excalidraw remains a deliberately minimalist \"whiteboard\"-style collaborative drawing tool, with no native AI generation — its value is the simplicity and speed of a digital hand-drawn sketch.",
    replaceFr: "Remplacer Excalidraw par une IA ? Non : l'intérêt d'Excalidraw est justement la rapidité du croquis manuel pour expliquer une idée en réunion, pas un visuel généré et poli. Verdict : l'IA n'a pas vraiment de rôle ici, la simplicité volontaire reste le produit.",
    replaceEn: "Replace Excalidraw with an AI? No: Excalidraw's appeal is precisely the speed of a manual sketch to explain an idea in a meeting, not a generated, polished visual. Verdict: AI doesn't really have a role here, deliberate simplicity remains the product.",
    aiTools: [],
  },
  penpot: {
    stance: "challenge",
    augmentFr: "Penpot reste un éditeur de design open source manuel, alors que Figma (avec Figma AI) et des générateurs comme v0 ou Lovable intègrent désormais la génération IA directement dans leur flux de travail.",
    augmentEn: "Penpot remains a manual open-source design editor, while Figma (with Figma AI) and generators like v0 or Lovable now integrate AI generation directly into their workflow.",
    replaceFr: "Remplacer Penpot par une IA ? Non, mais Penpot accuse un retard sur l'intégration IA comparé à Figma. Sa valeur reste d'être open source et auto-hébergeable, un argument indépendant de l'IA. Verdict : challengé sur les fonctionnalités IA, mais différencié par son modèle open source.",
    replaceEn: "Replace Penpot with an AI? No, but Penpot lags behind on AI integration compared to Figma. Its value remains being open source and self-hostable, an argument independent of AI. Verdict: challenged on AI features, but differentiated by its open-source model.",
    aiTools: [],
  },
  "v0-vercel": {
    stance: "augmente",
    augmentFr: "v0 est un générateur d'interface par IA développé par Vercel : il génère du code React/Tailwind fonctionnel à partir d'un prompt ou d'une image, pensé pour s'intégrer nativement à l'écosystème Next.js/Vercel.",
    augmentEn: "v0 is an AI interface generator built by Vercel: it generates working React/Tailwind code from a prompt or image, designed to integrate natively with the Next.js/Vercel ecosystem.",
    replaceFr: "Remplacer v0 par une autre IA ? v0 EST déjà un outil IA-natif de génération de code frontend. Sa différenciation est son intégration profonde avec Next.js et le déploiement Vercel plutôt qu'un outil générique. Verdict : v0 a été conçu autour de l'IA dès le départ, pas challengé par elle.",
    replaceEn: "Replace v0 with another AI? v0 already IS an AI-native frontend code generation tool. Its differentiation is deep integration with Next.js and Vercel deployment rather than being a generic tool. Verdict: v0 was built around AI from the start, not challenged by it.",
    aiTools: [],
  },
  taskade: {
    stance: "augmente",
    augmentFr: "Taskade a construit des agents IA personnalisables directement dans son outil de gestion de tâches et de notes, en plus de son rôle classique d'organisation d'équipe en temps réel.",
    augmentEn: "Taskade built customizable AI agents directly into its task and note management tool, alongside its classic role of real-time team organization.",
    replaceFr: "Remplacer Taskade par une IA ? Partiellement : Taskade intègre déjà des agents IA pour automatiser des tâches, ce qui le rapproche d'un outil hybride plutôt que d'un simple gestionnaire de tâches classique. Verdict : l'IA est devenue une fonctionnalité centrale plutôt qu'un simple ajout.",
    replaceEn: "Replace Taskade with an AI? Partially: Taskade already integrates AI agents to automate tasks, making it more of a hybrid tool than a simple classic task manager. Verdict: AI has become a central feature rather than a simple add-on.",
    aiTools: [],
  },
  paddle: {
    stance: "augmente",
    augmentFr: "Paddle reste une plateforme de paiement \"Merchant of Record\" qui gère la fiscalité internationale à la place des SaaS qui l'utilisent, un besoin d'infrastructure financière et réglementaire, pas de génération.",
    augmentEn: "Paddle remains a \"Merchant of Record\" payment platform that handles international tax on behalf of the SaaS companies using it, a financial and regulatory infrastructure need, not generation.",
    replaceFr: "Remplacer Paddle par une IA ? Non : gérer la fiscalité internationale et les paiements pour un SaaS reste un besoin réglementé d'infrastructure financière. Verdict : l'IA n'a pas de rôle direct ici, la conformité fiscale reste le produit.",
    replaceEn: "Replace Paddle with an AI? No: managing international tax and payments for a SaaS remains a regulated financial infrastructure need. Verdict: AI has no direct role here, tax compliance remains the product.",
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
