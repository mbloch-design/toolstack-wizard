/** add-ai-angle-batch-33.mjs — aiAngle pour Magic Patterns, Milanote,
 * BrandCrowd, Stark, Rive, Dynamic Mockups, FlowMapp, Hugeicons. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  "magic-patterns": {
    stance: "augmente",
    augmentFr: "Magic Patterns génère des interfaces et composants UI fonctionnels à partir d'un prompt ou d'un croquis, se positionnant entre l'outil de design classique et le générateur de code complet comme v0.",
    augmentEn: "Magic Patterns generates functional UI interfaces and components from a prompt or sketch, positioning itself between a classic design tool and a full code generator like v0.",
    replaceFr: "Magic Patterns remplace-t-il un designer UI ? Pour un premier jet rapide d'interface ou de composant, oui en grande partie. Pour une direction visuelle de marque cohérente et des décisions UX fines, l'expertise design reste nécessaire. Verdict : l'IA augmente fortement la vitesse de prototypage, le design system cohérent reste un travail humain.",
    replaceEn: "Does Magic Patterns replace a UI designer? For a fast first draft of an interface or component, largely yes. For coherent brand visual direction and fine UX decisions, design expertise remains necessary. Verdict: AI strongly augments prototyping speed, a coherent design system remains human work.",
    aiTools: ["v0-vercel"],
  },
  milanote: {
    stance: "augmente",
    augmentFr: "Milanote reste un outil d'organisation visuelle manuelle (moodboards, brainstorming) sans génération IA native — sa valeur est la structuration libre d'idées, pas la production automatisée de contenu.",
    augmentEn: "Milanote remains a manual visual organization tool (moodboards, brainstorming) with no native AI generation — its value is freely structuring ideas, not automated content production.",
    replaceFr: "Remplacer Milanote par une IA ? Non : organiser visuellement des idées, références et inspirations en équipe reste un travail de structuration créative humaine que l'IA n'a pas vocation à remplacer. Verdict : l'IA n'a pas de rôle central ici, l'organisation visuelle reste un besoin de réflexion humaine.",
    replaceEn: "Replace Milanote with an AI? No: visually organizing ideas, references, and inspiration as a team remains human creative structuring work AI isn't meant to replace. Verdict: AI has no central role here, visual organization remains a human thinking need.",
    aiTools: [],
  },
  brandcrowd: {
    stance: "challenge",
    augmentFr: "BrandCrowd génère des logos par algorithme à partir d'un nom et secteur d'activité depuis longtemps, une approche désormais challengée par des générateurs IA plus récents offrant plus de variété créative et de personnalisation.",
    augmentEn: "BrandCrowd has long generated logos algorithmically from a name and industry, an approach now challenged by newer AI generators offering more creative variety and customization.",
    replaceFr: "Remplacer BrandCrowd par une IA plus récente ? Pour la variété créative, des générateurs IA récents (Looka, Midjourney) prennent souvent l'avantage. BrandCrowd garde l'intérêt de fichiers prêts à l'emploi avec mockups intégrés. Verdict : challengé sur la créativité par des outils IA plus récents, solide sur la simplicité et les mockups inclus.",
    replaceEn: "Replace BrandCrowd with a newer AI? For creative variety, newer AI generators (Looka, Midjourney) often take the lead. BrandCrowd retains the appeal of ready-to-use files with built-in mockups. Verdict: challenged on creativity by newer AI tools, solid on simplicity and included mockups.",
    aiTools: ["midjourney"],
  },
  stark: {
    stance: "augmente",
    augmentFr: "Stark a ajouté des suggestions IA pour générer des textes alternatifs d'images et vérifier l'accessibilité automatiquement, mais reste un outil d'audit d'accessibilité (contraste, lisibilité) intégré aux outils de design.",
    augmentEn: "Stark added AI suggestions to generate image alt text and automatically check accessibility, but remains an accessibility audit tool (contrast, readability) integrated into design tools.",
    replaceFr: "Remplacer Stark par une IA ? Non : vérifier la conformité réelle aux normes d'accessibilité (WCAG) nécessite des règles précises, pas seulement de la génération. L'IA aide à rédiger des textes alternatifs, elle ne remplace pas l'audit de conformité. Verdict : l'IA augmente la rédaction de textes alternatifs, l'audit de conformité reste technique.",
    replaceEn: "Replace Stark with an AI? No: verifying real compliance with accessibility standards (WCAG) requires precise rules, not just generation. AI helps draft alt text, it doesn't replace compliance auditing. Verdict: AI augments alt text writing, compliance auditing remains technical.",
    aiTools: [],
  },
  rive: {
    stance: "augmente",
    augmentFr: "Rive reste un outil d'animation interactive vectorielle pour développeurs et designers, sans génération IA native — l'animation d'interface précise et performante reste un savoir-faire technique manuel.",
    augmentEn: "Rive remains a vector interactive animation tool for developers and designers, with no native AI generation — precise, performant interface animation remains a manual technical skill.",
    replaceFr: "Remplacer Rive par une IA ? Non : créer une animation d'interface interactive légère et performante (state machines, interactions) reste un travail technique précis que l'IA ne génère pas encore de façon fiable. Verdict : l'IA n'a pas encore de rôle significatif ici, l'animation d'interface reste un savoir-faire technique.",
    replaceEn: "Replace Rive with an AI? No: creating lightweight, performant interactive interface animation (state machines, interactions) remains precise technical work AI doesn't yet generate reliably. Verdict: AI doesn't yet have a significant role here, interface animation remains a technical skill.",
    aiTools: [],
  },
  "dynamic-mockups": {
    stance: "augmente",
    augmentFr: "Dynamic Mockups automatise la génération de visuels produits sur des mockups réalistes (t-shirts, mugs, packaging) à partir d'un design, un cas d'usage IA ciblé plutôt qu'une plateforme générative générale.",
    augmentEn: "Dynamic Mockups automates generating product visuals on realistic mockups (t-shirts, mugs, packaging) from a design, a targeted AI use case rather than a general generative platform.",
    replaceFr: "Remplacer Dynamic Mockups par une IA générative générale ? Non : appliquer précisément un design sur un mockup avec un rendu réaliste (plis, ombres) reste une tâche technique spécialisée plus fiable qu'une génération d'image générique. Verdict : l'IA spécialisée augmente la production de mockups, une IA générale moins précise pour ce cas d'usage.",
    replaceEn: "Replace Dynamic Mockups with a general generative AI? No: precisely applying a design onto a mockup with a realistic render (folds, shadows) remains a specialized technical task more reliable than generic image generation. Verdict: specialized AI augments mockup production, a general AI is less precise for this use case.",
    aiTools: [],
  },
  flowmapp: {
    stance: "augmente",
    augmentFr: "FlowMapp a ajouté des suggestions IA pour générer des sitemaps et user flows à partir d'une description, mais reste un outil de planification UX structurée pour des projets web complexes.",
    augmentEn: "FlowMapp added AI suggestions to generate sitemaps and user flows from a description, but remains a structured UX planning tool for complex web projects.",
    replaceFr: "Remplacer FlowMapp par une IA ? Non : planifier l'architecture d'information et les parcours utilisateur d'un projet web complexe reste un besoin de structuration UX. L'IA aide à esquisser un premier jet, elle ne remplace pas la réflexion UX fine. Verdict : l'IA augmente le premier jet de planification, la structuration UX reste un travail humain.",
    replaceEn: "Replace FlowMapp with an AI? No: planning the information architecture and user journeys of a complex web project remains a UX structuring need. AI helps sketch a first draft, it doesn't replace fine UX thinking. Verdict: AI augments the first planning draft, UX structuring remains human work.",
    aiTools: [],
  },
  hugeicons: {
    stance: "augmente",
    augmentFr: "Hugeicons propose un catalogue cohérent de plus de 30000 icônes dans plusieurs styles, avec quelques outils de personnalisation, sans génération IA poussée — sa valeur reste la cohérence visuelle du catalogue.",
    augmentEn: "Hugeicons offers a coherent catalog of over 30,000 icons in several styles, with some customization tools, with no deep AI generation — its value remains the catalog's visual coherence.",
    replaceFr: "Remplacer Hugeicons par une IA générative ? Pour une icône très spécifique non couverte, un générateur IA peut aider. Pour une cohérence visuelle garantie sur un projet entier, un catalogue structuré comme Hugeicons reste plus fiable. Verdict : l'IA complète les cas non couverts, le catalogue reste la référence de cohérence.",
    replaceEn: "Replace Hugeicons with a generative AI? For a very specific icon not covered, an AI generator can help. For guaranteed visual coherence across an entire project, a structured catalog like Hugeicons remains more reliable. Verdict: AI fills uncovered cases, the catalog remains the coherence reference.",
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
