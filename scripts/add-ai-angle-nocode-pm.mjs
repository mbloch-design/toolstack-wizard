/** add-ai-angle-nocode-pm.mjs — aiAngle sur no-code/automation (8) et PM/CRM (8). */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const A = {
  // --- No-code / automation ---
  "zapier": {
    stance: "augmente",
    augmentFr: "Zapier a ajouté des agents IA capables de construire un workflow à partir d'une description en langage naturel, plus des étapes IA natives (résumer, classer, extraire des données) à insérer dans n'importe quel zap.",
    augmentEn: "Zapier added AI agents able to build a workflow from a natural-language description, plus native AI steps (summarize, classify, extract data) to insert into any zap.",
    replaceFr: "Remplacer Zapier par une IA ? Non : connecter des milliers d'apps de façon fiable et durable reste un travail d'intégration, pas de génération. L'IA aide à configurer le workflow plus vite, elle ne remplace pas le réseau de connecteurs. Verdict : l'IA simplifie la création, l'infrastructure d'intégration reste indispensable.",
    replaceEn: "Replace Zapier with an AI? No: reliably connecting thousands of apps over time stays integration work, not generation. AI helps configure the workflow faster, it doesn't replace the connector network. Verdict: AI simplifies creation, the integration infrastructure stays essential.",
    aiTools: ["chatgpt"],
  },
  "make": {
    stance: "augmente",
    augmentFr: "Make a ajouté un assistant IA pour générer des scénarios d'automatisation à partir d'un prompt, ce qui aide à démarrer sur son interface visuelle plus complexe que celle de Zapier.",
    augmentEn: "Make added an AI assistant to generate automation scenarios from a prompt, which helps get started on its visual interface, more complex than Zapier's.",
    replaceFr: "Remplacer Make par une IA ? Non, même logique que Zapier : l'automatisation visuelle complexe (branches, itérateurs, agrégateurs) reste un travail de configuration que l'IA facilite sans le remplacer. Verdict : l'IA réduit la courbe d'apprentissage, le moteur d'automatisation reste le produit.",
    replaceEn: "Replace Make with an AI? No, same logic as Zapier: complex visual automation (branches, iterators, aggregators) stays configuration work that AI eases without replacing. Verdict: AI flattens the learning curve, the automation engine remains the product.",
    aiTools: ["chatgpt"],
  },
  "n8n": {
    stance: "augmente",
    augmentFr: "n8n, open source et orienté développeurs, s'est positionné comme l'outil d'automatisation taillé pour brancher des agents IA personnalisés (appels à des LLM, RAG, agents autonomes) dans un workflow, avec un contrôle total du code.",
    augmentEn: "n8n, open source and developer-oriented, has positioned itself as the automation tool built to plug custom AI agents (LLM calls, RAG, autonomous agents) into a workflow, with full code control.",
    replaceFr: "Remplacer n8n par une IA ? Non, et c'est presque l'inverse : n8n est devenu l'un des outils préférés pour orchestrer des agents IA, pas un concurrent qu'ils menacent. Verdict : l'essor des agents IA renforce la demande pour n8n plus qu'il ne la menace.",
    replaceEn: "Replace n8n with an AI? No, and it's almost the opposite: n8n has become one of the favorite tools to orchestrate AI agents, not a competitor they threaten. Verdict: the rise of AI agents drives demand for n8n more than it threatens it.",
    aiTools: ["chatgpt", "claude"],
  },
  "bubble": {
    stance: "challenge",
    augmentFr: "Bubble reste une référence no-code pour des applications complexes avec une base de données interne. Pour aller plus loin, des plugins IA permettent de brancher des modèles de langage dans la logique de l'application.",
    augmentEn: "Bubble remains a no-code reference for complex applications with an internal database. To go further, AI plugins let you plug language models into the application's logic.",
    replaceFr: "Remplacer Bubble par une IA ? Pour un MVP ou une app simple, les constructeurs IA texte-vers-app (Lovable, bolt.new) génèrent désormais du vrai code en quelques minutes, ce qui concurrence directement l'usage no-code de Bubble pour les projets pas trop complexes. Pour une app très spécifique avec une logique métier lourde, le visuel de Bubble garde l'avantage. Verdict : challengé sur l'usage simple, encore pertinent sur le complexe.",
    replaceEn: "Replace Bubble with an AI? For an MVP or a simple app, text-to-app AI builders (Lovable, bolt.new) now generate real code in minutes, directly competing with Bubble's no-code use case for not-too-complex projects. For a very specific app with heavy business logic, Bubble's visual approach keeps the edge. Verdict: challenged on simple use, still relevant on the complex end.",
    aiTools: ["lovable", "bolt-new"],
  },
  "webflow": {
    stance: "challenge",
    augmentFr: "Webflow a ajouté un assistant IA pour générer une mise en page ou du contenu à partir d'un prompt, mais son coeur reste le contrôle visuel précis du HTML/CSS généré.",
    augmentEn: "Webflow added an AI assistant to generate a layout or content from a prompt, but its core remains precise visual control over the generated HTML/CSS.",
    replaceFr: "Remplacer Webflow par une IA ? Pour un site marketing simple, des constructeurs IA comme Lovable ou même Framer AI génèrent un site complet en quelques minutes, ce qui challenge l'usage le plus courant de Webflow. Pour un design system précis et du CMS structuré à grande échelle, Webflow garde le contrôle que ces outils n'offrent pas encore. Verdict : challengé sur le site simple, solide sur le site complexe et le CMS.",
    replaceEn: "Replace Webflow with an AI? For a simple marketing site, AI builders like Lovable or even Framer AI generate a complete site in minutes, challenging Webflow's most common use case. For a precise design system and structured CMS at scale, Webflow keeps the control these tools don't yet offer. Verdict: challenged on the simple site, solid on the complex site and CMS.",
    aiTools: ["lovable"],
  },
  "airtable": {
    stance: "augmente",
    augmentFr: "Airtable a ajouté Airtable AI pour résumer des lignes, classer du contenu et générer du texte directement dans les cellules, plus des agents capables d'automatiser des tâches entre tables.",
    augmentEn: "Airtable added Airtable AI to summarize rows, classify content and generate text directly in cells, plus agents able to automate tasks across tables.",
    replaceFr: "Remplacer Airtable par une IA ? Non : c'est une base de données relationnelle avec une interface no-code, ce qui reste un besoin structurel que l'IA générative ne couvre pas. Verdict : l'IA enrichit les données dans Airtable, elle ne remplace pas la base.",
    replaceEn: "Replace Airtable with an AI? No: it's a relational database with a no-code interface, a structural need generative AI doesn't cover. Verdict: AI enriches the data inside Airtable, it doesn't replace the database.",
    aiTools: ["chatgpt"],
  },
  "retool": {
    stance: "augmente",
    augmentFr: "Retool a ajouté la génération d'interfaces internes par IA à partir d'un prompt ou d'un schéma de base de données, ce qui accélère la création d'outils internes pour les équipes techniques.",
    augmentEn: "Retool added AI-generated internal interfaces from a prompt or database schema, speeding up internal tool creation for technical teams.",
    replaceFr: "Remplacer Retool par une IA ? Non : connecter de façon fiable des bases de données et des API internes pour construire un outil d'équipe reste un travail d'intégration que l'IA accélère sans le remplacer. Verdict : l'IA construit l'interface plus vite, Retool reste la plateforme.",
    replaceEn: "Replace Retool with an AI? No: reliably connecting internal databases and APIs to build a team tool stays integration work that AI speeds up without replacing. Verdict: AI builds the interface faster, Retool remains the platform.",
    aiTools: ["chatgpt"],
  },
  "softr": {
    stance: "augmente",
    augmentFr: "Softr s'appuie sur l'IA pour générer une partie de l'interface depuis une base Airtable ou Google Sheets, ce qui réduit encore le temps de mise en place d'un portail client ou d'une app interne.",
    augmentEn: "Softr leans on AI to generate part of the interface from an Airtable or Google Sheets base, further cutting setup time for a client portal or internal app.",
    replaceFr: "Remplacer Softr par une IA ? Pour un besoin très simple, un constructeur IA généraliste (Lovable) peut couvrir le besoin. Mais le lien direct et sans code à Airtable reste l'argument de Softr pour qui a déjà sa donnée là-bas. Verdict : challengé sur le générique, solide sur l'intégration Airtable.",
    replaceEn: "Replace Softr with an AI? For a very simple need, a general AI builder (Lovable) can cover it. But the direct, no-code link to Airtable remains Softr's argument for those who already have their data there. Verdict: challenged on the generic case, solid on Airtable integration.",
    aiTools: ["lovable"],
  },
  // --- PM / CRM ---
  "asana": {
    stance: "augmente",
    augmentFr: "Asana a ajouté un assistant IA pour résumer des projets, rédiger des statuts et suggérer des sous-tâches à partir d'un objectif. Ça réduit le temps passé à documenter plutôt qu'à avancer.",
    augmentEn: "Asana added an AI assistant to summarize projects, draft status updates and suggest subtasks from a goal. It cuts the time spent documenting instead of progressing.",
    replaceFr: "Remplacer Asana par une IA ? Non : la coordination d'équipe sur des projets avec dépendances, échéances et charge de travail reste un besoin structurel. Verdict : l'IA documente et résume, elle ne remplace pas la gestion de projet.",
    replaceEn: "Replace Asana with an AI? No: team coordination on projects with dependencies, deadlines and workload remains a structural need. Verdict: AI documents and summarizes, it doesn't replace project management.",
    aiTools: ["chatgpt"],
  },
  "clickup": {
    stance: "augmente",
    augmentFr: "ClickUp a poussé fort sur l'IA transverse (ClickUp Brain) : résumés automatiques, rédaction de tickets, et des réponses basées sur l'historique du workspace.",
    augmentEn: "ClickUp pushed hard on cross-product AI (ClickUp Brain): automatic summaries, ticket drafting, and answers based on the workspace's history.",
    replaceFr: "Remplacer ClickUp par une IA ? Non : la structure de gestion de projet (vues, automatisations, hiérarchie de tâches) reste le produit. Verdict : l'IA augmente la productivité dans ClickUp, elle ne le remplace pas.",
    replaceEn: "Replace ClickUp with an AI? No: the project management structure (views, automations, task hierarchy) remains the product. Verdict: AI boosts productivity inside ClickUp, it doesn't replace it.",
    aiTools: ["chatgpt"],
  },
  "monday": {
    stance: "augmente",
    augmentFr: "monday.com a ajouté monday AI pour générer des automatisations, résumer des updates et créer des tableaux à partir d'un prompt.",
    augmentEn: "monday.com added monday AI to generate automations, summarize updates and create boards from a prompt.",
    replaceFr: "Remplacer monday par une IA ? Non : visualiser et coordonner le travail d'équipe sur des tableaux personnalisés reste un besoin structurel. Verdict : l'IA configure plus vite, l'outil de gestion reste indispensable.",
    replaceEn: "Replace monday with an AI? No: visualizing and coordinating team work on customized boards remains a structural need. Verdict: AI configures faster, the management tool stays essential.",
    aiTools: ["chatgpt"],
  },
  "trello": {
    stance: "challenge",
    augmentFr: "Trello a ajouté Atlassian Intelligence pour résumer des cartes et suggérer des actions. Son modèle de tableau Kanban simple reste sa force, mais c'est aussi sa limite.",
    augmentEn: "Trello added Atlassian Intelligence to summarize cards and suggest actions. Its simple Kanban board model remains its strength, but also its limit.",
    replaceFr: "Remplacer Trello par une IA ? Pour un suivi très simple, des outils plus riches en IA (ClickUp, monday) ou même un assistant IA généraliste qui structure des listes peuvent couvrir le même besoin, ce qui rend Trello moins différenciant. Verdict : challengé par des concurrents plus IA-natifs sur le même prix.",
    replaceEn: "Replace Trello with an AI? For very simple tracking, richer AI-native tools (ClickUp, monday) or even a general AI assistant structuring lists can cover the same need, making Trello less differentiated. Verdict: challenged by more AI-native competitors at the same price point.",
    aiTools: ["chatgpt"],
  },
  "pipedrive": {
    stance: "augmente",
    augmentFr: "Pipedrive a ajouté un assistant IA pour résumer des emails, suggérer la prochaine action sur un deal et générer des messages de suivi.",
    augmentEn: "Pipedrive added an AI assistant to summarize emails, suggest the next action on a deal and generate follow-up messages.",
    replaceFr: "Remplacer Pipedrive par une IA ? Non : suivre un pipeline de vente structuré avec des deals, des étapes et un historique reste un besoin de CRM que l'IA assiste sans remplacer. Verdict : l'IA rédige et suggère, le pipeline reste le produit.",
    replaceEn: "Replace Pipedrive with an AI? No: tracking a structured sales pipeline with deals, stages and history remains a CRM need AI assists without replacing. Verdict: AI drafts and suggests, the pipeline remains the product.",
    aiTools: ["chatgpt"],
  },
  "zendesk": {
    stance: "challenge",
    augmentFr: "Zendesk a investi massivement dans les agents IA capables de répondre automatiquement aux clients à partir de la base de connaissance, dans la même course qu'Intercom avec Fin.",
    augmentEn: "Zendesk invested heavily in AI agents able to automatically answer customers from the knowledge base, in the same race as Intercom with Fin.",
    replaceFr: "Remplacer Zendesk par une IA ? Pas la plateforme entière, mais le support de niveau 1 bascule massivement vers des agents IA, chez Zendesk comme chez ses concurrents. La pression est sur le prix par ticket résolu, pas sur l'existence même de l'outil. Verdict : toute la catégorie du support client est redéfinie par l'IA.",
    replaceEn: "Replace Zendesk with an AI? Not the whole platform, but tier-1 support is massively shifting to AI agents, at Zendesk as at its competitors. The pressure is on price per resolved ticket, not on the tool's existence itself. Verdict: the entire customer support category is being redefined by AI.",
    aiTools: ["chatgpt", "claude"],
  },
  "basecamp": {
    stance: "augmente",
    augmentFr: "Basecamp reste volontairement minimaliste et n'a pas suivi la course à l'IA transverse de ses concurrents. C'est cohérent avec son positionnement anti-complexité.",
    augmentEn: "Basecamp stays deliberately minimal and hasn't followed its competitors' race toward cross-product AI. That's consistent with its anti-complexity positioning.",
    replaceFr: "Remplacer Basecamp par une IA ? Non, sans rapport : c'est un outil de coordination simple, pas un produit de contenu. Verdict : Basecamp ignore largement la vague IA, et ça ne l'affaiblit pas sur son usage cible.",
    replaceEn: "Replace Basecamp with an AI? No, unrelated: it's a simple coordination tool, not a content product. Verdict: Basecamp largely ignores the AI wave, and that doesn't weaken it for its target use case.",
    aiTools: [],
  },
};

const tools = JSON.parse(readFileSync(PATH, "utf8"));
let n = 0;
for (const x of tools) {
  const slug = x.slug || x.id;
  if (A[slug]) {
    x.seo = Object.assign({}, x.seo, { aiAngle: A[slug] });
    n++;
  }
}
const out = JSON.stringify(tools, null, 2) + "\n";
JSON.parse(out);
writeFileSync(PATH, out);
console.log(`aiAngle (no-code + PM/CRM) sur ${n} fiches | JSON OK`);
