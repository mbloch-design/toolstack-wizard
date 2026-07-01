/** add-ai-angle-dev.mjs — aiAngle (niché dans seo) sur les outils dev à fort trafic. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const A = {
  "github": {
    stance: "augmente",
    augmentFr: "GitHub a intégré l'IA partout : Copilot complète le code directement dans l'éditeur, et des agents IA comme Cursor ou Windsurf peuvent ouvrir des pull requests entières depuis une description en langage naturel. Le code généré atterrit toujours sur GitHub pour la revue et l'historique.",
    augmentEn: "GitHub has integrated AI everywhere: Copilot completes code right in the editor, and AI agents like Cursor or Windsurf can open entire pull requests from a natural-language description. The generated code still lands on GitHub for review and history.",
    replaceFr: "Remplacer GitHub par une IA ? Non : écrire du code plus vite ne supprime pas le besoin de versionner, de relire en équipe et d'orchestrer un pipeline CI/CD. L'IA change la façon dont le code est écrit, pas la façon dont il est géré. Verdict : GitHub reste la plomberie indispensable, même quand l'IA écrit le code.",
    replaceEn: "Replace GitHub with an AI? No: writing code faster doesn't remove the need to version it, review it as a team, and run a CI/CD pipeline. AI changes how code gets written, not how it gets managed. Verdict: GitHub stays the essential plumbing, even when AI writes the code.",
    aiTools: ["github-copilot", "cursor", "windsurf"],
  },
  "vercel": {
    stance: "augmente",
    augmentFr: "Vercel est devenu l'infrastructure de référence pour héberger ce que les IA de développement génèrent : des outils comme Cursor, Lovable ou bolt.new produisent du code qui se déploie nativement chez Vercel. Plus on génère d'applications par IA, plus on a besoin d'un endroit pour les faire tourner.",
    augmentEn: "Vercel has become the go-to infrastructure for hosting what AI dev tools generate: tools like Cursor, Lovable or bolt.new produce code that deploys natively on Vercel. The more apps get AI-generated, the more you need somewhere to run them.",
    replaceFr: "Remplacer Vercel par une IA ? Non, ça n'a pas de sens : Vercel, c'est l'hébergement et l'infra (CDN, edge, déploiements), pas un générateur de contenu. Certains constructeurs IA tout-en-un (bolt.new) embarquent leur propre hébergement, mais pour un projet sérieux qui a besoin de scaler, Vercel reste le choix par défaut. Verdict : l'explosion du code généré par IA renforce Vercel plus qu'elle ne le menace.",
    replaceEn: "Replace Vercel with an AI? No, that doesn't make sense: Vercel is hosting and infra (CDN, edge, deployments), not a content generator. Some all-in-one AI builders (bolt.new) bundle their own hosting, but for a serious project that needs to scale, Vercel stays the default choice. Verdict: the explosion of AI-generated code strengthens Vercel more than it threatens it.",
    aiTools: ["cursor", "lovable", "bolt-new"],
  },
  "netlify": {
    stance: "augmente",
    augmentFr: "Comme Vercel, Netlify profite de la vague d'apps générées par IA : le code produit par des outils comme bolt.new ou Lovable a besoin d'un hébergeur, et Netlify reste une option solide, notamment pour les sites statiques et le Jamstack.",
    augmentEn: "Like Vercel, Netlify benefits from the wave of AI-generated apps: code produced by tools like bolt.new or Lovable needs a host, and Netlify remains a solid option, especially for static sites and Jamstack.",
    replaceFr: "Remplacer Netlify par une IA ? Non, même logique que Vercel : c'est une couche d'infrastructure, pas un produit que l'IA peut générer à la place. Le vrai arbitrage se joue plutôt face à Vercel lui-même, qui a pris l'avantage sur l'écosystème des frameworks IA-friendly. Verdict : pas menacé par l'IA, mais challengé par Vercel sur ce terrain précis.",
    replaceEn: "Replace Netlify with an AI? No, same logic as Vercel: it's an infrastructure layer, not a product AI can generate instead. The real trade-off is more against Vercel itself, which has taken the lead on the AI-friendly framework ecosystem. Verdict: not threatened by AI, but challenged by Vercel on this specific ground.",
    aiTools: ["bolt-new", "lovable"],
  },
  "cursor": {
    stance: "augmente",
    augmentFr: "Cursor EST un produit IA : c'est un éditeur de code qui prédit, complète et réécrit à partir de tes instructions en langage naturel, avec un agent capable de modifier plusieurs fichiers d'un coup. L'IA n'est pas une option ici, c'est le produit entier.",
    augmentEn: "Cursor IS an AI product: it's a code editor that predicts, completes and rewrites from your natural-language instructions, with an agent able to edit multiple files at once. AI isn't an add-on here, it's the entire product.",
    replaceFr: "Remplacer Cursor par une IA généraliste ? Non, c'est déjà une IA spécialisée pour le code, avec le contexte du projet, l'indexation du repo et l'intégration terminal/Git que ChatGPT n'a pas nativement. Le vrai choix se joue entre Cursor, GitHub Copilot et Windsurf. Verdict : Cursor ne remplace pas un développeur, mais il a redéfini ce que veut dire coder en 2026.",
    replaceEn: "Replace Cursor with a general AI? No, it's already a specialized AI for code, with project context, repo indexing and terminal/Git integration that ChatGPT doesn't have natively. The real choice is between Cursor, GitHub Copilot and Windsurf. Verdict: Cursor doesn't replace a developer, but it has redefined what coding means in 2026.",
    aiTools: ["github-copilot", "windsurf"],
  },
  "github-copilot": {
    stance: "augmente",
    augmentFr: "Copilot complète ton code ligne par ligne directement dans VS Code ou tout autre éditeur compatible, et son mode agent peut désormais ouvrir des pull requests entières. C'est l'option la plus intégrée pour qui reste sur son éditeur habituel plutôt que de migrer vers Cursor.",
    augmentEn: "Copilot completes your code line by line right in VS Code or any compatible editor, and its agent mode can now open entire pull requests. It's the most integrated option for those who stay on their usual editor rather than migrating to Cursor.",
    replaceFr: "Remplacer Copilot par une IA généraliste ? ChatGPT ou Claude peuvent générer du code dans le chat, mais sans le contexte du fichier ouvert ni l'intégration en temps réel dans l'éditeur. Pour de l'autocomplétion continue pendant qu'on code, Copilot ou ses concurrents directs (Cursor) restent plus efficaces. Verdict : Copilot augmente le développeur, il ne le remplace pas.",
    replaceEn: "Replace Copilot with a general AI? ChatGPT or Claude can generate code in chat, but without the open file's context or real-time editor integration. For continuous autocomplete while coding, Copilot or its direct competitor (Cursor) stay more effective. Verdict: Copilot augments the developer, it doesn't replace them.",
    aiTools: ["cursor", "chatgpt", "claude"],
  },
  "replit": {
    stance: "augmente",
    augmentFr: "Replit a basculé une bonne partie de son produit vers l'IA avec son Agent, capable de construire une application complète depuis une simple description, base de données et déploiement compris. Ça rapproche Replit des constructeurs IA comme Lovable ou bolt.new.",
    augmentEn: "Replit shifted a big part of its product toward AI with its Agent, able to build a complete application from a simple description, database and deployment included. That moves Replit closer to AI builders like Lovable or bolt.new.",
    replaceFr: "Remplacer Replit par une IA ? Plus difficile à trancher qu'avant : Replit Agent EST déjà cette IA, en concurrence directe avec Lovable et bolt.new sur le même terrain (générer une app complète par prompt). Le choix se fait entre ces outils, pas entre Replit et une IA externe. Verdict : Replit a absorbé la menace en devenant lui-même un constructeur IA.",
    replaceEn: "Replace Replit with an AI? Harder to call than before: Replit Agent IS already that AI, competing directly with Lovable and bolt.new on the same ground (generating a full app from a prompt). The choice is between these tools, not between Replit and an external AI. Verdict: Replit absorbed the threat by becoming an AI builder itself.",
    aiTools: ["lovable", "bolt-new"],
  },
  "supabase": {
    stance: "augmente",
    augmentFr: "Supabase est devenu le backend par défaut de la vague de constructeurs IA : Lovable, bolt.new et beaucoup d'agents de code s'y branchent directement pour la base de données, l'authentification et le stockage, sans configuration manuelle.",
    augmentEn: "Supabase has become the default backend for the wave of AI builders: Lovable, bolt.new and many coding agents plug into it directly for the database, authentication and storage, with no manual setup.",
    replaceFr: "Remplacer Supabase par une IA ? Non, aucun sens : c'est une infrastructure backend (Postgres, auth, API), pas un produit que l'IA génère à la place. Plus les IA génèrent d'applications, plus elles ont besoin d'un backend prêt à l'emploi, et Supabase a pris une longueur d'avance sur ce terrain. Verdict : l'IA générative pousse l'adoption de Supabase plus qu'elle ne le menace.",
    replaceEn: "Replace Supabase with an AI? No, that makes no sense: it's backend infrastructure (Postgres, auth, API), not a product AI generates instead. The more AI generates applications, the more it needs a ready-made backend, and Supabase has taken a lead on that ground. Verdict: generative AI drives Supabase adoption more than it threatens it.",
    aiTools: ["lovable", "bolt-new"],
  },
  "linear": {
    stance: "augmente",
    augmentFr: "Linear a ajouté de l'IA pour trier et résumer les tickets, suggérer des priorités et rédiger des descriptions à partir d'une discussion. Ça reste un assistant en périphérie d'un outil dont la valeur tient à sa rapidité d'usage et son intégration Git.",
    augmentEn: "Linear added AI to triage and summarize tickets, suggest priorities and draft descriptions from a discussion. It stays an assistant on the edge of a tool whose value lies in its speed of use and Git integration.",
    replaceFr: "Remplacer Linear par une IA ? Non : le suivi de projet structuré, les workflows d'équipe et l'intégration aux pull requests ne sont pas un problème que l'IA générative résout. Verdict : l'IA aide à remplir Linear plus vite, elle ne remplace pas l'outil.",
    replaceEn: "Replace Linear with an AI? No: structured project tracking, team workflows and pull-request integration aren't a problem generative AI solves. Verdict: AI helps fill Linear faster, it doesn't replace the tool.",
    aiTools: ["chatgpt"],
  },
  "postman": {
    stance: "augmente",
    augmentFr: "Postman a ajouté un assistant IA pour générer des tests, documenter des endpoints et suggérer des requêtes à partir d'une simple description. Ça accélère des tâches répétitives sans changer le coeur du métier : tester et documenter des API.",
    augmentEn: "Postman added an AI assistant to generate tests, document endpoints and suggest requests from a simple description. It speeds up repetitive tasks without changing the core job: testing and documenting APIs.",
    replaceFr: "Remplacer Postman par une IA ? Non : un agent IA peut appeler une API, mais organiser des collections, partager des environnements en équipe et documenter un contrat d'API reste un travail d'outillage que l'IA assiste sans le remplacer. Verdict : utilitaire renforcé par l'IA, pas menacé.",
    replaceEn: "Replace Postman with an AI? No: an AI agent can call an API, but organizing collections, sharing environments as a team and documenting an API contract stays tooling work that AI assists without replacing. Verdict: a utility strengthened by AI, not threatened.",
    aiTools: ["chatgpt"],
  },
  "docker": {
    stance: "augmente",
    augmentFr: "L'IA aide surtout en périphérie de Docker : des assistants comme Copilot ou Cursor génèrent des Dockerfiles et des docker-compose.yml à partir d'une description, ce qui évite de partir d'un template vide.",
    augmentEn: "AI mostly helps around Docker's edges: assistants like Copilot or Cursor generate Dockerfiles and docker-compose.yml files from a description, saving you from starting with an empty template.",
    replaceFr: "Remplacer Docker par une IA ? Non, aucun rapport : la conteneurisation est une couche d'infrastructure technique, pas un contenu que l'IA produit à la place. Verdict : l'IA écrit la configuration plus vite, elle ne remplace pas le besoin de conteneuriser.",
    replaceEn: "Replace Docker with an AI? No, no relation at all: containerization is a technical infrastructure layer, not content AI produces instead. Verdict: AI writes the config faster, it doesn't replace the need to containerize.",
    aiTools: ["github-copilot", "cursor"],
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
console.log(`aiAngle (dev) sur ${n} fiches | JSON OK`);
