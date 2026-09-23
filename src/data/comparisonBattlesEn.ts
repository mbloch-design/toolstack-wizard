/**
 * Traductions anglaises du contenu éditorial des comparatifs.
 *
 * Les 12 fichiers `src/data/comparison-battles/*.json` portent `"locale": "fr"`
 * et n'ont aucun champ `*En`. `ComparePage` dérivait donc ses champs anglais
 * via `asEnglishCopy()`, une fonction qui renvoyait la valeur telle quelle.
 * Résultat : les pages `/en/comparatif/` servaient leur accroche, leur
 * différence de fond et leurs arbitrages « Choose X if… » en français.
 *
 * Cette table remplace le bouchon. La correspondance est exacte sur la valeur
 * entière, jamais par sous-chaîne : substituer un fragment à l'intérieur d'une
 * phrase produit du charabia sans accent, qui échappe ensuite aux détecteurs.
 *
 * Une chaîne absente de la table retombe sur le français. C'est volontaire :
 * mieux vaut une fuite visible qu'un texte tronqué ou vide.
 *
 * Si les fichiers sources gagnent un jour de vrais champs `*En`, cette table
 * devient inutile et doit être supprimée.
 */

const COMPARISON_BATTLE_EN: Record<string, string> = {
  // ── ChatGPT vs Claude ──────────────────────────────────────────────────
  "Gardez ChatGPT si vous cherchez un seul assistant polyvalent.":
    "Keep ChatGPT if you want one versatile assistant.",
  "Passez à Claude si les textes longs, les documents et la réécriture représentent la majorité de votre usage.":
    "Switch to Claude if long-form writing, documents and rewriting make up most of your work.",
  "Gardez les deux seulement si ChatGPT couvre recherche, multimodal et code, tandis que Claude prend en charge les textes longs et l’analyse documentaire.":
    "Keep both only if ChatGPT handles research, multimodal work and code while Claude handles long-form writing and document analysis.",
  "Claude seul si votre usage est principalement rédactionnel.":
    "Use Claude alone if most of your work is writing.",
  "Ils semblent interchangeables car ils répondent tous les deux à des prompts. En réalité, le choix dépend surtout du type de travail : assistant polyvalent et outillé côté ChatGPT, profondeur rédactionnelle et confort sur longs documents côté Claude.":
    "They look interchangeable because both answer prompts. In practice the choice depends on the kind of work: ChatGPT is the broader, better-equipped assistant, Claude goes deeper on writing and stays comfortable across long documents.",
  "Tu veux un assistant unique pour rédaction, recherche, image, fichiers, code et usages variés.":
    "You want a single assistant for writing, research, images, files, code and varied use.",
  "Tu utilises souvent les outils intégrés type recherche, analyse de fichiers, génération ou workflows business.":
    "You often use the built-in tools: search, file analysis, generation, business workflows.",
  "Tu veux éviter de payer deux IA sans séparation claire des usages.":
    "You want to avoid paying for two AIs with no clear split between them.",
  "Tu travailles beaucoup sur des textes longs, briefs, documents, notes, contrats ou synthèses.":
    "You work mostly on long text: briefs, documents, notes, contracts, summaries.",
  "Tu privilégies une réponse plus posée, structurée et souvent plus naturelle sur l’éditorial.":
    "You prefer a calmer, more structured answer that usually reads better in editorial work.",
  "Tu as besoin d’un second regard IA spécialisé dans l’analyse longue.":
    "You need a second AI opinion specialised in long-form analysis.",
  "Couvre le plus grand nombre d’usages avec un seul abonnement.":
    "Covers the widest range of uses on a single subscription.",
  "Très bon, mais moins évident comme unique assistant si l’usage est très varié.":
    "Very good, but a less obvious single assistant when your use is broad.",
  "Efficace avec un bon brief.": "Effective given a good brief.",
  "Très bon confort sur textes longs, ton et synthèse.":
    "Very comfortable on long text, tone and summarising.",
  "Claude si l’éditorial est central.": "Claude when editorial work is central.",
  "Recherche avec sources et livrables rapides": "Research with sources and fast deliverables",
  "Plus outillé pour recherche et production multimodale selon plan.":
    "Better equipped for research and multimodal output, depending on plan.",
  "Pertinent, mais à vérifier selon fonctionnalités disponibles au moment de l’usage.":
    "Relevant, but check which features are available when you actually need them.",
  "ChatGPT si la recherche est fréquente.": "ChatGPT when research is frequent.",
  "Solide pour fichiers et extraction.": "Solid on files and extraction.",
  "Très fort pour garder une lecture structurée d’un corpus long.":
    "Very strong at keeping a structured reading of a long corpus.",
  "Claude si les documents sont longs et nombreux.":
    "Claude when documents are long and numerous.",
  "Commencer avec ChatGPT si tu veux un seul assistant IA.":
    "Start with ChatGPT if you want one AI assistant.",
  "Ajouter ou basculer vers Claude quand plus de 50 % de ton usage concerne longs textes, documents, reformulations sensibles ou analyse éditoriale.":
    "Add or switch to Claude once more than 50% of your use is long text, documents, delicate rewriting or editorial analysis.",
  "Choisir après un seul prompt": "Choosing after a single prompt",
  "Payer deux IA sans séparation": "Paying for two AIs with no split",
  "Attribuer un rôle clair à chaque outil ou en supprimer un.":
    "Give each tool a clear role, or drop one.",
  "Garder Notion, Airtable, Linear ou CRM pour structurer les données durables.":
    "Keep Notion, Airtable, Linear or a CRM for data that has to last.",
  "Claude pour longs textes": "Claude for long text",
  "Seulement si les rôles sont séparés : ChatGPT pour polyvalence/recherche, Claude pour longs textes et analyse documentaire.":
    "Only with separate roles: ChatGPT for breadth and research, Claude for long text and document analysis.",
  "Claude est-il toujours meilleur pour écrire ?": "Is Claude always better at writing?",
  "Non. Claude est souvent plus confortable sur textes longs, mais ChatGPT peut être excellent avec un brief précis.":
    "No. Claude is often more comfortable on long text, but ChatGPT does excellent work given a precise brief.",
  "Pas de gagnant absolu. ChatGPT est plus polyvalent. Claude est souvent plus confortable pour textes longs et analyse profonde.":
    "No outright winner. ChatGPT covers more ground. Claude is usually more comfortable on long text and deep analysis.",
  "Bon pour tester, pas pour production intensive.":
    "Fine for testing, not for heavy production.",
  "Bon pour tester, limites sensibles selon usage.":
    "Fine for testing, with limits you will feel depending on use.",
  "Risque de payer Pro sans usage intensif réel.":
    "Risk of paying for Pro without genuinely heavy use.",
  "Risque de doubler avec ChatGPT si usages non séparés.":
    "Risk of duplicating ChatGPT if the uses are not separated.",

  // ── ChatGPT vs Gemini ──────────────────────────────────────────────────
  "Ils semblent interchangeables car ils répondent tous les deux à des prompts. En réalité, le choix dépend surtout de l'écosystème : Gemini devient vraiment intéressant seulement si ton travail quotidien est dans Google Workspace.":
    "They look interchangeable because both answer prompts. In practice the choice comes down to ecosystem: Gemini only becomes genuinely interesting if your daily work lives in Google Workspace.",
  "Tu veux un assistant IA principal qui fonctionne quel que soit ton écosystème.":
    "You want a main AI assistant that works whatever your ecosystem.",
  "Tu utilises des outils variés hors de Google : Notion, Slack, Figma, GitHub, etc.":
    "You use varied tools outside Google: Notion, Slack, Figma, GitHub and the rest.",
  "Tu veux un assistant unique pour rédaction, analyse, code, images et recherche.":
    "You want one assistant for writing, analysis, code, images and research.",
  "Ton travail quotidien est ancré dans Google Workspace : Gmail, Docs, Sheets, Drive.":
    "Your daily work is anchored in Google Workspace: Gmail, Docs, Sheets, Drive.",
  "Tu utilises Google Search intensivement et veux des réponses enrichies avec sources récentes.":
    "You use Google Search heavily and want answers enriched with recent sources.",
  "Tu veux une IA qui lit et modifie directement tes fichiers Google Drive sans friction.":
    "You want an AI that reads and edits your Google Drive files directly, without friction.",
  "Couvre le plus grand nombre d'usages avec un seul abonnement, quel que soit l'écosystème.":
    "Covers the widest range of uses on one subscription, whatever the ecosystem.",
  "Bon, mais devient vraiment intéressant seulement dans un contexte Google-first.":
    "Good, but only becomes genuinely interesting in a Google-first setup.",
  "Travail dans Google Workspace": "Working inside Google Workspace",
  "Gemini si tu vis dans Google Workspace.": "Gemini if you live in Google Workspace.",
  "Recherche avec sources récentes": "Research with recent sources",
  "Google Search intégré nativement avec résultats enrichis.":
    "Google Search built in natively, with enriched results.",
  "Avantage Gemini pour la recherche Google-native.":
    "Gemini has the edge on Google-native research.",
  "Très fort pour code, génération d'images, analyse de fichiers variés.":
    "Very strong on code, image generation and varied file analysis.",
  "Capable, mais moins spécialisé sur code et créatif.":
    "Capable, but less specialised on code and creative work.",
  "ChatGPT pour code et créatif.": "ChatGPT for code and creative work.",
  "Commencer avec ChatGPT si tu veux un assistant IA agnostique et polyvalent.":
    "Start with ChatGPT if you want a broad, ecosystem-agnostic assistant.",
  "Basculer vers Gemini quand plus de 60 % de ton travail passe par Gmail, Google Docs, Sheets ou Drive.":
    "Switch to Gemini once more than 60% of your work runs through Gmail, Google Docs, Sheets or Drive.",
  "Choisir Gemini juste parce que c'est Google": "Picking Gemini just because it is Google",
  "Evaluer honnêtement : combien d'heures par semaine dans Gmail, Docs, Drive ?":
    "Be honest about it: how many hours a week do you spend in Gmail, Docs and Drive?",
  "Payer deux IA généralistes sans usages séparés":
    "Paying for two general-purpose AIs with no separate uses",
  "Définir un rôle précis pour chaque outil ou n'en garder qu'un.":
    "Give each tool a precise role, or keep only one.",
  "ChatGPT reste l'option par défaut. Gemini ne devient pertinent que si ton workflow vit dans Google Workspace.":
    "ChatGPT stays the default. Gemini only becomes relevant if your workflow lives in Google Workspace.",
  "Recherche avec sources": "Research with sources",
  "Gemini est-il meilleur avec Google Workspace ?": "Is Gemini better inside Google Workspace?",
  "Seulement si les rôles sont vraiment séparés : ChatGPT pour la polyvalence agnostique, Gemini pour l'intégration Workspace native. Sans usage Workspace quotidien, Gemini n'apporte pas grand-chose de plus.":
    "Only with genuinely separate roles: ChatGPT for ecosystem-agnostic breadth, Gemini for native Workspace integration. Without daily Workspace use, Gemini adds little.",
  "Oui, clairement. L'intégration native Gmail, Docs, Drive et Google Search fait de Gemini l'assistant le plus logique si ton workflow quotidien est dans l'écosystème Google.":
    "Yes, clearly. Native Gmail, Docs, Drive and Google Search integration makes Gemini the logical assistant if your daily workflow sits in Google's ecosystem.",
  "ChatGPT peut-il aussi s'intégrer à Google Drive ?": "Can ChatGPT connect to Google Drive too?",
  "Oui, une connexion est possible selon le plan, mais elle est moins native et moins profonde que celle de Gemini. ChatGPT reste plus fort en dehors de l'écosystème Google.":
    "Yes, a connection is available depending on plan, but it is less native and less deep than Gemini's. ChatGPT stays stronger outside Google's ecosystem.",
  "Pas de gagnant absolu. ChatGPT est plus polyvalent et agnostique. Gemini est plus fort dans Google Workspace.":
    "No outright winner. ChatGPT covers more ground and stays ecosystem-agnostic. Gemini is stronger inside Google Workspace.",
  "Suffisant pour tester, mais intégration Workspace complète nécessite le plan payant.":
    "Enough to test, but full Workspace integration needs the paid plan.",
  "Quand l'intégration Gmail/Docs/Drive native devient centrale dans le workflow.":
    "Once native Gmail, Docs and Drive integration becomes central to the workflow.",
  "L'AI Premium inclut 2 To Google One — coût perçu comme stockage plus que comme IA.":
    "AI Premium includes 2 TB of Google One, so the cost reads as storage more than as AI.",
  "Le gratuit suffit pour tester des prompts et vérifier si l'usage revient chaque semaine.":
    "The free tier is enough to test prompts and check whether the use comes back weekly.",
  "Paie ChatGPT si l'usage devient transversal. Paie Gemini si Workspace devient le centre du travail.":
    "Pay for ChatGPT if the use spreads across everything. Pay for Gemini if Workspace becomes the centre of the work.",
  "Le vrai risque est de payer Pro ou AI Premium sans séparation claire des rôles.":
    "The real risk is paying for Pro or AI Premium with no clear split of roles.",

  // ── ClickUp vs Asana ───────────────────────────────────────────────────
  "Complexité de configuration et risque de sur-outillage.":
    "Setup complexity, and the risk of over-tooling.",
  "Vous voulez un outil très complet à coût bas.":
    "You want a very complete tool at a low price.",
  "Vous aimez configurer vues, champs, dashboards.":
    "You enjoy configuring views, fields and dashboards.",
  "Votre priorité est coordination claire et adoption par l'équipe.":
    "Your priority is clear coordination and team adoption.",
  "Vous voulez moins de bruit fonctionnel.": "You want less feature noise.",
  "Asana pour une équipe qui doit s'aligner vite sans phase de configuration.":
    "Asana for a team that has to align fast without a configuration phase.",
  "Basculer vers ClickUp quand l'équipe a besoin de centraliser beaucoup de workflows et accepte de configurer le workspace.":
    "Switch to ClickUp when the team needs to centralise many workflows and accepts configuring the workspace.",
  "Très généreux en fonctionnalités mais stockage très limité.":
    "Very generous on features, very limited on storage.",
  "Plus propre et simple mais moins riche gratuitement.":
    "Cleaner and simpler, but thinner on the free plan.",
  "Choisir ClickUp pour tout faire sans phase de setup":
    "Picking ClickUp to do everything with no setup phase",
  "Définir les vues et workflows avant de déployer ClickUp en équipe.":
    "Define views and workflows before rolling ClickUp out to a team.",
  "Choisir Asana quand le besoin est surtout individuel/power user":
    "Picking Asana when the need is mostly individual or power-user",
  "ClickUp Free est souvent suffisant pour un solo ou une petite équipe tech.":
    "ClickUp Free is often enough for a solo operator or a small technical team.",
  "Plus propre mais moins riche": "Cleaner but thinner",
  "ClickUp Free gagne en volume de fonctions.": "ClickUp Free wins on sheer feature count.",
  "Plus longue à configurer": "Longer to configure",
  "Plus rapide à déployer": "Faster to roll out",
  "Asana pour adoption rapide.": "Asana for fast adoption.",
  "AI Teammates sur Starter+": "AI Teammates from Starter up",
  "Les deux ont de l'IA sur plans payants.": "Both have AI on paid plans.",
  "Meilleur pour solo": "Better for solo work",
  "ClickUp pour solo/power user.": "ClickUp for solo and power users.",
  "ClickUp gagne en richesse/prix. Asana gagne en clarté et adoption équipe.":
    "ClickUp wins on features per euro. Asana wins on clarity and team adoption.",
  "Minimum seats/structure d’équipe à vérifier, coût par user plus élevé.":
    "Check the seat minimum and team structure; cost per user is higher.",

  // ── Figma vs Canva ─────────────────────────────────────────────────────
  "Ils produisent tous les deux des designs. Mais Figma sert à concevoir des interfaces et systèmes. Canva sert à produire vite des supports marketing accessibles.":
    "Both produce designs. But Figma is for designing interfaces and systems. Canva is for turning out accessible marketing material fast.",
  "Tu conçois des interfaces, apps, sites ou design systems.":
    "You design interfaces, apps, websites or design systems.",
  "Tu dois gérer composants, variants, prototypes et handoff dev.":
    "You have to manage components, variants, prototypes and developer handoff.",
  "Tu travailles avec designers et développeurs.": "You work with designers and developers.",
  "Tu produis posts, présentations, flyers, miniatures, supports commerciaux ou contenus récurrents.":
    "You turn out posts, presentations, flyers, thumbnails, sales material or recurring content.",
  "Des non-designers doivent créer eux-mêmes dans un cadre simple.":
    "Non-designers have to create on their own, inside a simple framework.",
  "La vitesse prime sur la précision UI.": "Speed matters more than UI precision.",
  "Pas fait pour livrer une UI pro.": "Not built to ship a professional UI.",
  "Social media en volume": "Social media at volume",
  "Possible mais lent pour non-designers.": "Possible, but slow for non-designers.",
  "Très propre si designer.": "Very clean in a designer's hands.",
  "Brand kit utile mais pas design system produit.":
    "The brand kit helps, but it is not a product design system.",
  "Canva si tu produis du marketing simple et fréquent.":
    "Canva if you produce simple marketing material often.",
  "Faire une maquette web dans Canva": "Mocking up a website in Canva",
  "Utiliser Figma pour tout livrable destiné au dev.":
    "Use Figma for anything a developer will build.",
  "Limiter Figma aux profils design/dev, Canva aux producteurs de contenus.":
    "Keep Figma for design and dev profiles, Canva for content producers.",
  "Abuser des templates Canva": "Leaning too hard on Canva templates",
  "Créer un système visuel cadré avant production.":
    "Set a framed visual system before production starts.",
  "Ne choisis pas entre deux outils de design. Choisis entre conception produit et production marketing.":
    "You are not choosing between two design tools. You are choosing between product design and marketing production.",
  "Peut-on utiliser Figma et Canva ensemble ?": "Can you use Figma and Canva together?",
  "Oui. Figma pour concevoir le système, Canva pour décliner vite des contenus cadrés.":
    "Yes. Figma to design the system, Canva to turn out framed content fast.",
  "Figma est-il gratuit ?": "Is Figma free?",
  "Figma propose un plan gratuit limité à 3 fichiers Figma et 3 fichiers FigJam. Pour une utilisation professionnelle (fichiers illimités, partage avancé), les plans payants démarrent à 15 $/seat/mois.":
    "Figma has a free plan capped at 3 Figma files and 3 FigJam files. For professional use, meaning unlimited files and advanced sharing, paid plans start at $15 per seat per month.",
  "Canva est-il adapté aux designers produit ?": "Is Canva suitable for product designers?",
  "Non. Canva n'est pas conçu pour le design produit : pas de composants réutilisables, pas de variants, pas de handoff développeur. C'est un outil de production contenu, pas de design système.":
    "No. Canva is not built for product design: no reusable components, no variants, no developer handoff. It is a content production tool, not a design system tool.",
  "Quelle est la principale différence entre Figma et Canva ?":
    "What is the main difference between Figma and Canva?",
  "La nature du livrable. Figma produit des interfaces (maquettes, prototypes, design systems). Canva produit des visuels prêts à publier (posts, présentations, flyers). Le point de bascule : dès que le fichier doit être intégré par un développeur, il faut Figma.":
    "The nature of the deliverable. Figma produces interfaces: mockups, prototypes, design systems. Canva produces ready-to-publish visuals: posts, presentations, flyers. The tipping point is simple, as soon as a developer has to build the file, you need Figma.",
  "Lequel choisir pour une petite équipe sans designer dédié ?":
    "Which one for a small team with no dedicated designer?",
  "Canva. Sa courbe d'apprentissage est quasi nulle et ses templates couvrent 90 % des besoins marketing. Figma nécessite une formation minimale et suppose que l'output final sera développé.":
    "Canva. Its learning curve is close to zero and its templates cover 90% of marketing needs. Figma takes some training and assumes the final output will be built.",
  "Pas de vainqueur absolu. Figma gagne côté produit. Canva gagne côté contenu marketing.":
    "No outright winner. Figma wins on product. Canva wins on marketing content.",
  "Bon pour tester et prototyper.": "Fine for testing and prototyping.",
  "Très bon pour créer vite mais limité sur marque/assets.":
    "Very good for creating fast, limited on brand and assets.",
  "Dès qu’une équipe design a besoin de bibliothèques, Dev Mode ou gouvernance.":
    "As soon as a design team needs libraries, Dev Mode or governance.",
  "Abonnement récurrent et contrôle créatif plus limité.":
    "A recurring subscription, with less creative control.",
  "Montée en gamme forte vers hubs Pro/Enterprise.":
    "A steep climb towards the Pro and Enterprise hubs.",

  // ── HubSpot vs Pipedrive ───────────────────────────────────────────────
  "HubSpot est une plateforme marketing/sales. Pipedrive est un CRM pipeline-first.":
    "HubSpot is a marketing and sales platform. Pipedrive is a pipeline-first CRM.",
  "Vous combinez CRM, marketing, formulaires, contenu et automation.":
    "You combine CRM, marketing, forms, content and automation.",
  "Vous acceptez une plateforme plus large.": "You accept a broader platform.",
  "Votre besoin central est pipeline, relances et closing.":
    "Your core need is pipeline, follow-ups and closing.",
  "Vous voulez une adoption sales rapide.": "You want fast adoption by the sales team.",
  "Pipedrive pour une petite équipe sales qui doit juste fermer des deals.":
    "Pipedrive for a small sales team that just has to close deals.",
  "Passer à HubSpot quand le CRM doit s'étendre au marketing, à l'inbound et aux workflows automatisés.":
    "Move to HubSpot when the CRM has to stretch into marketing, inbound and automated workflows.",
  "Très bon pour démarrer un CRM simple.": "Very good for starting a simple CRM.",
  "Pas de gratuit permanent.": "No permanent free plan.",
  "Utiliser HubSpot Free comme CRM définitif sans prévoir la montée":
    "Treating HubSpot Free as a permanent CRM with no plan for the climb",
  "Projeter le coût à 6 mois avec les fonctions dont vous aurez vraiment besoin.":
    "Project the cost six months out, with the features you will genuinely need.",
  "Choisir Pipedrive quand le besoin va au-delà du pipeline":
    "Picking Pipedrive when the need goes beyond the pipeline",
  "Évaluer si HubSpot ou un outil marketing séparé est plus cohérent à terme.":
    "Weigh whether HubSpot, or a separate marketing tool, makes more sense long term.",
  "HubSpot si besoin de gratuit.": "HubSpot if you need a free plan.",
  "Plus complexe, plus de fonctions": "More complex, more features",
  "Pipedrive pour adoption sales rapide.": "Pipedrive for fast sales adoption.",
  "HubSpot si le marketing est dans le scope.": "HubSpot when marketing is in scope.",

  // ── Make vs Zapier ─────────────────────────────────────────────────────
  "Ils connectent les mêmes apps, mais pas avec la même logique. Zapier est plus simple et linéaire. Make est plus visuel, plus technique et plus puissant pour scénarios complexes.":
    "They connect the same apps, but not with the same logic. Zapier is simpler and linear. Make is more visual, more technical, and goes further on complex scenarios.",
  "Tu as des scénarios multi-étapes avec routes, filtres, transformations ou webhooks.":
    "You run multi-step scenarios with routes, filters, transformations or webhooks.",
  "Tu veux optimiser le coût sur des workflows complexes.":
    "You want to optimise cost on complex workflows.",
  "Tu acceptes une courbe d’apprentissage plus technique.":
    "You accept a more technical learning curve.",
  "Tu veux connecter vite deux ou trois apps.": "You want to connect two or three apps quickly.",
  "Tu privilégies simplicité, catalogue d’apps et mise en place rapide.":
    "You value simplicity, app coverage and fast setup.",
  "Tu n’as pas envie de designer une architecture d’automatisation.":
    "You have no appetite for designing an automation architecture.",
  "Possible mais plus de setup.": "Possible, but more setup.",
  "Possible mais peut devenir coûteux/moins lisible.":
    "Possible, but it can get expensive and harder to read.",
  "Bon pour structurer et optimiser.": "Good for structuring and optimising.",
  "Très bien si flux simples.": "Very good when the flows stay simple.",
  "Zapier au début, Make si volume/complexité.":
    "Zapier to begin with, Make once volume or complexity arrives.",
  "Commencer avec Zapier si tu as 1 à 5 automatisations simples.":
    "Start with Zapier if you have one to five simple automations.",
  "Passer à Make quand les Zaps deviennent nombreux, chers, multi-étapes, conditionnels ou difficiles à maintenir.":
    "Move to Make when the Zaps get numerous, expensive, multi-step, conditional or hard to maintain.",
  "Auditer les volumes avant de scaler.": "Audit your volumes before scaling.",
  "Choisir Make sans compétence ops": "Picking Make with no ops skills",
  "Documenter chaque scénario et surveiller les opérations.":
    "Document every scenario and watch the operation count.",
  "Comparer seulement le nombre d’apps": "Comparing app counts and nothing else",
  "Comparer le workflow réel et les limites de consommation.":
    "Compare the real workflow and the consumption limits.",
  "Make est-il moins cher que Zapier ?": "Is Make cheaper than Zapier?",
  "Pas toujours. Make peut être plus optimisable sur workflows complexes, mais un mauvais scénario peut consommer beaucoup d’opérations.":
    "Not always. Make can be optimised further on complex workflows, but a badly built scenario burns a lot of operations.",
  "Zapier gagne en simplicité. Make gagne quand le workflow devient complexe ou volumineux.":
    "Zapier wins on simplicity. Make wins once the workflow gets complex or high-volume.",
  "Mieux pour apprendre la logique visuelle et tester quelques scénarios.":
    "Better for learning the visual logic and testing a few scenarios.",
  "Mieux pour automatisations simples et rapides.":
    "Better for simple, fast automations.",
  "Quand les scénarios tournent souvent ou manipulent beaucoup d’étapes/data.":
    "Once scenarios run often or handle many steps and a lot of data.",
  "Très vite si plusieurs Zaps multi-étapes tournent chaque jour.":
    "Very quickly, if several multi-step Zaps run every day.",
  "Temps de setup plus élevé et logique de crédits.":
    "Longer setup, and a credit-based model.",
  "Tasks consommées vite, coût volume souvent plus élevé.":
    "Tasks burn fast, and the cost at volume is usually higher.",

  // ── Notion vs Airtable ─────────────────────────────────────────────────
  "Notion et Airtable se ressemblent par leurs tableaux. Mais Notion est d’abord un espace de connaissance, Airtable une base métier structurée.":
    "Notion and Airtable look alike because of their tables. But Notion is first a knowledge space, Airtable a structured business database.",
  "Tu veux centraliser notes, briefs, wiki, process, contenus et suivi léger.":
    "You want to centralise notes, briefs, wiki, processes, content and light tracking.",
  "Ton équipe doit comprendre vite l’espace sans logique de base avancée.":
    "Your team has to grasp the space quickly, without advanced database logic.",
  "Tu privilégies lisibilité et adoption plutôt que puissance de données.":
    "You value readability and adoption over raw data capability.",
  "Tu gères des leads, inventaires, contenus, ressources ou opérations avec statuts, filtres et vues multiples.":
    "You manage leads, inventory, content, resources or operations with statuses, filters and multiple views.",
  "Tu as besoin de formulaires, automatisations, interfaces ou données relationnelles.":
    "You need forms, automations, interfaces or relational data.",
  "Tu veux éviter de bricoler un CRM ou un outil ops dans Notion.":
    "You want to avoid improvising a CRM or an ops tool inside Notion.",
  "Pages, process et documents sont son terrain naturel.":
    "Pages, processes and documents are its natural ground.",
  "Trop base de données pour un simple wiki.": "Too database-heavy for a plain wiki.",
  "Meilleur dès que vues, statuts et automatisations se multiplient.":
    "Better as soon as views, statuses and automations multiply.",
  "Airtable si le pipeline devient central.": "Airtable once the pipeline becomes central.",
  "Moins naturel pour raconter le contexte.": "Less natural for telling the context.",
  "Plus fiable quand les données circulent.": "More dependable once data starts moving.",
  "Airtable au seuil de process.": "Airtable at the process threshold.",
  "Commencer avec Notion pour organiser le savoir et valider le process.":
    "Start with Notion to organise knowledge and validate the process.",
  "Basculer vers Airtable quand la base a plusieurs vues critiques, des relations entre tables, des formulaires, des automatisations ou plusieurs personnes qui modifient les données.":
    "Switch to Airtable when the base has several critical views, relations between tables, forms, automations, or several people editing the data.",
  "Passer sur Airtable dès que les relations et vues deviennent centrales.":
    "Move to Airtable as soon as relations and views become central.",
  "Tout mettre dans Notion": "Putting everything in Notion",
  "Commencer simple, puis structurer quand le process est validé.":
    "Start simple, then structure once the process is settled.",
  "Notion peut-il remplacer Airtable ?": "Can Notion replace Airtable?",
  "Oui pour une base simple. Non si les données deviennent relationnelles, automatisées ou critiques.":
    "Yes for a simple base. No once the data becomes relational, automated or business-critical.",
  "Notion gagne pour documenter et collaborer légèrement. Airtable gagne pour structurer et exploiter des données.":
    "Notion wins for documenting and light collaboration. Airtable wins for structuring and working data.",
  "Très bon pour solo et documentation.": "Very good for solo work and documentation.",
  "Bon pour tester une base simple.": "Fine for testing a simple base.",
  "Dès qu’une équipe a besoin d’historique, permissions et espaces avancés.":
    "As soon as a team needs history, permissions and advanced spaces.",
  "Dès que la base devient volumineuse, relationnelle ou collaborative.":
    "As soon as the base grows large, relational or collaborative.",
  "Coût de désordre si on force Notion comme base métier.":
    "A mess to pay for later, if Notion is forced into being a business database.",
  "Coût par éditeur et setup de base plus exigeant.":
    "A per-editor cost, and a more demanding initial setup.",

  // ── Slack vs Microsoft Teams ───────────────────────────────────────────
  "Slack est meilleur comme hub de conversation. Teams est meilleur si Microsoft 365 est déjà le socle.":
    "Slack is better as a conversation hub. Teams is better when Microsoft 365 is already the foundation.",
  "Vous voulez une messagerie d'équipe claire et rapide.":
    "You want clear, fast team messaging.",
  "Votre stack n'est pas centrée Microsoft.": "Your stack is not Microsoft-centric.",
  "Votre organisation utilise Outlook, SharePoint, OneDrive et Microsoft 365.":
    "Your organisation runs on Outlook, SharePoint, OneDrive and Microsoft 365.",
  "Les réunions et fichiers Office sont centraux.":
    "Meetings and Office files are central to the work.",
  "Slack pour les petites équipes agiles hors Microsoft.":
    "Slack for small, agile teams outside Microsoft.",
  "Passer à Teams quand Microsoft 365 est déjà payé et que la collaboration Office est centrale.":
    "Move to Teams when Microsoft 365 is already paid for and Office collaboration is central.",
  "Très bon pour démarrer, mauvais comme mémoire long terme.":
    "Very good to start on, poor as long-term memory.",
  "Utiliser Slack Free sans prévoir la perte d'historique":
    "Using Slack Free without planning for the loss of history",
  "Passer au plan Pro dès que la conservation de l'historique devient critique.":
    "Move to Pro as soon as keeping the history becomes critical.",
  "Adopter Teams hors d'un écosystème Microsoft":
    "Adopting Teams outside a Microsoft ecosystem",
  "Slack ou Discord plus adaptés pour les équipes sans dépendance Microsoft.":
    "Slack or Discord suit teams with no Microsoft dependency better.",
  "Un espace commun avec clients et partenaires.":
    "A shared space with clients and partners.",
  "Plus cadré, mais plus administratif.": "More framed, but more administrative.",
  "Slack pour multi-clients. Teams pour organisations Microsoft-first.":
    "Slack for multi-client work. Teams for Microsoft-first organisations.",
  "Teams si les réunions structurent le travail.":
    "Teams when meetings structure the work.",
  "Slack pour outils variés. Teams pour suite Microsoft.":
    "Slack for varied tools. Teams for the Microsoft suite.",
  "Ajouter un canal de plus": "Adding one more channel",
  "Peut doubler Teams ou l'outil client.":
    "It can duplicate Teams, or the client's own tool.",
  "Subir les espaces clients": "Letting client spaces pile up",
  "Choisis le hub qui réduit le plus les changements de contexte.":
    "Pick the hub that cuts context switching the most.",
  "Deux hubs pour parler. Deux logiques pour travailler.":
    "Two hubs for talking. Two logics for working.",
  "Slack gagne en expérience de messagerie. Teams gagne si l’entreprise est déjà Microsoft 365.":
    "Slack wins on the messaging experience. Teams wins when the company already runs Microsoft 365.",
  "Dès que l’historique devient une mémoire d’équipe.":
    "As soon as the history becomes the team's memory.",
  "Dès que l’équipe vit déjà dans Microsoft 365.":
    "As soon as the team already lives in Microsoft 365.",

  // ── Stripe vs PayPal ───────────────────────────────────────────────────
  "Stripe est une infrastructure de paiement. PayPal est une méthode de paiement reconnue par les clients.":
    "Stripe is payment infrastructure. PayPal is a payment method customers recognise.",
  "Vous avez un SaaS, abonnement, marketplace ou besoin API.":
    "You run a SaaS product, subscriptions, a marketplace, or need an API.",
  "Vous voulez contrôler le checkout et les flux.":
    "You want control over the checkout and the flows.",
  "Vous voulez ajouter vite une méthode de paiement connue.":
    "You want to add a familiar payment method quickly.",
  "Stripe pour les SaaS et produits digitaux qui contrôlent leur checkout.":
    "Stripe for SaaS and digital products that control their own checkout.",
  "Ajouter PayPal comme méthode complémentaire si les clients le demandent ou si la conversion augmente avec cette option.":
    "Add PayPal as a secondary method if customers ask for it, or if conversion improves with it.",
  "Comparer uniquement les taux de transaction affichés":
    "Comparing headline transaction rates and nothing else",
  "Modéliser le coût avec votre mix réel de cartes, international et add-ons.":
    "Model the cost with your real mix of cards, international payments and add-ons.",
  "Choisir PayPal pour un SaaS avec logique d'abonnement API":
    "Picking PayPal for a SaaS with API-driven subscription logic",
  "Stripe ou un PSP technique pour toute logique produit avancée.":
    "Stripe, or a technical payment provider, for any advanced product logic.",
  "Frais à la transaction + add-ons": "Per-transaction fees plus add-ons",
  "Frais marchands à la transaction": "Per-transaction merchant fees",
  "Comparer selon le profil de transactions réelles.":
    "Compare against your real transaction profile.",
  "PayPal si zéro dev. Stripe si contrôle du checkout.":
    "PayPal if there is no developer. Stripe if you control the checkout.",
  "Stripe pour abonnements récurrents.": "Stripe for recurring subscriptions.",
  "PayPal si conversion nécessite la marque.":
    "PayPal when conversion needs the brand.",
  "Stripe gagne pour l’infrastructure et l’API. PayPal gagne comme option de paiement simple et rassurante pour certains clients.":
    "Stripe wins on infrastructure and API. PayPal wins as a simple, reassuring payment option for some customers.",
  "Risque de désordre si projet dev complexe.":
    "Risk of a mess on a complex development project.",

  // ── Trello vs Linear ───────────────────────────────────────────────────
  "Trello organise visuellement. Linear structure le shipping produit/dev.":
    "Trello organises visually. Linear structures product and engineering shipping.",
  "Vous avez besoin d'un Kanban simple.": "You need a simple Kanban board.",
  "Votre équipe n'est pas orientée produit/dev.":
    "Your team is not product or engineering oriented.",
  "Vous gérez issues, cycles, roadmap et releases.":
    "You manage issues, cycles, roadmap and releases.",
  "Votre équipe travaille avec GitHub ou un workflow dev.":
    "Your team works with GitHub or an engineering workflow.",
  "Trello pour les équipes non-tech qui veulent un Kanban simple.":
    "Trello for non-technical teams that want a simple Kanban board.",
  "Passer à Linear dès que le travail ressemble à du shipping produit — bugs, cycles, sprints, releases.":
    "Move to Linear as soon as the work looks like product shipping: bugs, cycles, sprints, releases.",
  "Très bon pour Kanban simple.": "Very good for simple Kanban.",
  "Très bon pour petites équipes produit/dev.":
    "Very good for small product and engineering teams.",
  "Gérer un backlog produit complexe dans Trello":
    "Running a complex product backlog in Trello",
  "Linear ou Jira pour tout backlog avec sprints, bugs et roadmap.":
    "Linear or Jira for any backlog with sprints, bugs and a roadmap.",
  "Imposer Linear à une équipe non-dev":
    "Forcing Linear on a non-engineering team",
  "Trello ou Asana pour les équipes sans culture produit/engineering.":
    "Trello or Asana for teams without a product and engineering culture.",
  "Les deux ont un bon Free selon usage.":
    "Both have a solid free plan, depending on use.",
  "Adapté aux non-dev": "Suits non-developers",
  "Faible — pensé pour l'engineering": "Low, it is built for engineering",
  "Trello pour équipes non-tech.": "Trello for non-technical teams.",
  "Faible — pas de cycles ni de releases": "Low, no cycles and no releases",
  "Linear si l'équipe shippe du produit.": "Linear when the team ships product.",
  "Linear pour les équipes dev qui veulent l'IA.":
    "Linear for engineering teams that want the AI features.",
  "Trello gagne pour organiser simplement. Linear gagne pour suivre du produit et du développement.":
    "Trello wins at organising simply. Linear wins at tracking product and development.",
  "Dès qu’il faut plus de boards, vues et contrôles.":
    "As soon as you need more boards, views and controls.",
  "Dès qu’il faut issues illimitées, plusieurs équipes et rôles admin.":
    "As soon as you need unlimited issues, several teams and admin roles.",
  "Risque d’outil trop spécialisé pour non-dev.":
    "Risk of a tool too specialised for non-developers.",

  // ── Webflow vs Framer ──────────────────────────────────────────────────
  "Ils semblent être deux website builders design. Webflow est plus proche d’un outil de production web structuré. Framer est plus proche d’un outil design-to-site rapide.":
    "They look like two design-led website builders. Webflow is closer to a structured web production tool. Framer is closer to a fast design-to-site tool.",
  "Tu construis un site marketing avec CMS, blog, SEO, collections, rôles ou besoin d’agence.":
    "You are building a marketing site with a CMS, blog, SEO, collections, roles or agency needs.",
  "Tu veux un contrôle plus fin sur structure, interactions et production durable.":
    "You want finer control over structure, interactions and production that lasts.",
  "Tu dois livrer un site client maintenable.":
    "You have to deliver a client site somebody can maintain.",
  "Tu veux lancer vite une landing, un portfolio, une page produit ou un site visuel premium.":
    "You want to launch a landing page, portfolio, product page or premium visual site fast.",
  "Tu pars d’un design Figma ou d’une intention très visuelle.":
    "You are starting from a Figma design, or from a strongly visual intent.",
  "Tu veux réduire le temps de build au maximum.":
    "You want to cut build time as far as possible.",
  "Très propre mais parfois plus lent.": "Very clean, sometimes slower.",
  "Rapide, visuel, efficace pour lancer.": "Fast, visual, effective for launching.",
  "Framer si pas de CMS lourd.": "Framer when there is no heavy CMS.",
  "Site agence avec CMS": "Agency site with a CMS",
  "Meilleur pour structure, collections et maintenance.":
    "Better for structure, collections and maintenance.",
  "Possible si site léger.": "Possible on a light site.",
  "Solide mais plus long.": "Solid, but slower.",
  "Très bon rendu avec peu de friction.": "Very good output with little friction.",
  "Plus robuste pour croissance.": "Holds up better as the site grows.",
  "OK au début, attention à la complexité future.":
    "Fine at first, watch the complexity that comes later.",
  "Webflow si site stratégique.": "Webflow when the site is strategic.",
  "Commencer avec Framer si le besoin est une landing ou un site vitrine rapide.":
    "Start with Framer if the need is a landing page or a quick brochure site.",
  "Passer à Webflow quand le site a un CMS important, plusieurs gabarits, SEO sérieux, équipe marketing ou maintenance client.":
    "Move to Webflow when the site has a substantial CMS, several templates, serious SEO, a marketing team or client maintenance.",
  "Choisir Framer pour un site qui va devenir un média":
    "Picking Framer for a site that will become a publication",
  "Choisir Webflow dès le départ si le contenu va grossir.":
    "Pick Webflow from the start if the content will grow.",
  "Choisir Webflow pour une simple page test":
    "Picking Webflow for a single test page",
  "Utiliser Framer pour pré-lancement rapide.":
    "Use Framer for a fast pre-launch.",
  "Comparer seulement le prix mensuel": "Comparing monthly price and nothing else",
  "Framer suffit-il pour un site professionnel ?":
    "Is Framer enough for a professional site?",
  "Oui pour une landing, un portfolio ou un site vitrine léger. Webflow est plus logique pour CMS, SEO et architecture durable.":
    "Yes for a landing page, a portfolio or a light brochure site. Webflow makes more sense for a CMS, SEO and an architecture that lasts.",
  "Framer gagne sur vitesse de mise en ligne. Webflow gagne quand le site devient un vrai actif web structuré.":
    "Framer wins on time to publish. Webflow wins once the site becomes a structured web asset.",
  "Très bon pour staging et apprentissage.": "Very good for staging and learning.",
  "Très bon pour prototypes et landing pages simples.":
    "Very good for prototypes and simple landing pages.",
  "Add-ons et limites quand le site grandit.":
    "Add-ons and limits once the site grows.",

  // ── GitHub Copilot vs Cursor ───────────────────────────────────────────
  "Copilot s'adapte à votre workflow. Cursor vous demande de le reconstruire autour de l'IA.":
    "Copilot fits your workflow. Cursor asks you to rebuild it around the AI.",

  // ── Libelles courts, releves sur le HTML servi ─────────────────────────
  "Adoption équipe":
    "Team adoption",
  "Assistant IA généraliste solo":
    "A single general-purpose AI assistant",
  "Bon — membres illimités, 2 équipes":
    "Good, unlimited members, 2 teams",
  "CRM léger":
    "Lightweight CRM",
  "CRM léger ou pipeline contenu":
    "Lightweight CRM or content pipeline",
  "Calendrier, fichiers et coédition.":
    "Calendar, files and co-editing.",
  "Changements de tenant et notifications dispersées.":
    "Tenant switching, and notifications scattered across places.",
  "ChatGPT par défaut.":
    "ChatGPT by default.",
  "Choisir Zapier par réflexe":
    "Picking Zapier out of habit",
  "ClickUp donne beaucoup. Asana donne moins mais structure mieux l'adoption équipe.":
    "ClickUp gives you a lot. Asana gives you less, but structures team adoption better.",
  "Code, automatisation, outils créatifs":
    "Code, automation, creative tools",
  "Complexité licence Microsoft et dépendance suite Office.":
    "Microsoft licensing complexity, and dependency on the Office suite.",
  "Confondre assistant IA et outil métier":
    "Confusing an AI assistant with a business tool",
  "Confondre tableau et base métier":
    "Confusing a table with a business database",
  "Coût":
    "Cost",
  "Coût par type de seat et complexité design system.":
    "Cost per seat type, and design-system complexity.",
  "Cœur du produit.":
    "The heart of the product.",
  "Demande de comprendre données et opérations.":
    "Requires understanding data and operations.",
  "Domaine personnalisé, site public pro, besoins de scale/localisation.":
    "Custom domain, professional public site, scaling and localisation needs.",
  "Donner Figma à toute l’équipe":
    "Giving Figma to the whole team",
  "Dès l’usage réel après essai.":
    "Once real use starts, after the trial.",
  "Dès qu’il faut Brand Kit, premium assets et production régulière.":
    "As soon as you need Brand Kit, premium assets and regular output.",
  "Dès qu’il faut automatisation, reporting, marketing sérieux ou enlever limites.":
    "As soon as you need automation, reporting, serious marketing, or the limits lifted.",
  "Dès qu’il faut stockage, intégrations, dashboards et automatisations.":
    "As soon as you need storage, integrations, dashboards and automations.",
  "Dès qu’il faut timeline, workflow builder, reporting et coordination d’équipe.":
    "As soon as you need a timeline, workflow builder, reporting and team coordination.",
  "Dès qu’il y a transactions ou vente internationale.":
    "As soon as there are transactions or international sales.",
  "Dès qu’il y a transactions, Billing, Tax ou Connect.":
    "As soon as there are transactions, Billing, Tax or Connect.",
  "Dépend fortement de l’écosystème Microsoft.":
    "Depends heavily on the Microsoft ecosystem.",
  "Fort — ClickUp Free très complet":
    "Strong, ClickUp Free is very complete",
  "Fort — aucune formation nécessaire":
    "Strong, no training needed",
  "Fort — cycles, sprints, GitHub intégration":
    "Strong, cycles, sprints, GitHub integration",
  "Frais internationaux, conversion, litiges et conditions par marché.":
    "International fees, conversion, disputes and market-by-market terms.",
  "Gratuit à installer, payant à l’usage.":
    "Free to set up, paid once you use it.",
  "Gratuit à ouvrir, payant à l’usage.":
    "Free to open, paid once you use it.",
  "Généreux — 10 boards, cartes illimitées":
    "Generous, 10 boards, unlimited cards",
  "HubSpot gagne comme plateforme globale. Pipedrive gagne comme CRM de vente simple et focalisé.":
    "HubSpot wins as an all-round platform. Pipedrive wins as a simple, focused sales CRM.",
  "Huddles et intégrations visio.":
    "Huddles and video integrations.",
  "IA intégrée":
    "Built-in AI",
  "Intégration":
    "Integration",
  "Intégration Workspace":
    "Workspace integration",
  "Intégration native Gmail, Docs, Sheets, Drive, Meet.":
    "Native Gmail, Docs, Sheets, Drive and Meet integration.",
  "Invités et accès externes":
    "Guests and external access",
  "Limité":
    "Limited",
  "Limité — add-ons nécessaires":
    "Limited, add-ons needed",
  "Lisible et facile à partager.":
    "Readable and easy to share.",
  "Marketing intégré":
    "Built-in marketing",
  "Modèle tarifaire":
    "Pricing model",
  "Neutre — checkout Stripe ou personnalisé":
    "Neutral, Stripe checkout or your own",
  "OK pour démarrer.":
    "Fine to start on.",
  "Ops internes récurrentes":
    "Recurring internal ops",
  "Passer à Figma dès qu’il y a UI, dev, design system, composants ou besoin de cohérence produit.":
    "Move to Figma as soon as there is UI, development, a design system, components, or a need for product consistency.",
  "Portfolio créatif":
    "Creative portfolio",
  "Présentations":
    "Presentations",
  "Présentations commerciales":
    "Sales presentations",
  "Rapide et accessible à l’équipe.":
    "Fast, and easy for the team to pick up.",
  "Recherche web disponible, bonne qualité selon plan.":
    "Web search available, quality depending on plan.",
  "Rédaction longue, analyse de documents, usage fréquent.":
    "Long-form writing, document analysis, frequent use.",
  "Réunions + Office natifs":
    "Native meetings and Office",
  "Réunions et documents":
    "Meetings and documents",
  "Site client, CMS réel, domaine, trafic, collaboration.":
    "Client site, real CMS, domain, traffic, collaboration.",
  "Suffisant — Personal Free limité":
    "Adequate, Personal Free is limited",
  "Suffit au début.":
    "Enough at the start.",
  "Suite intégrée":
    "Integrated suite",
  "Surmodéliser Airtable trop tôt":
    "Over-modelling Airtable too early",
  "Séparer documentation et données opérationnelles.":
    "Separate documentation from operational data.",
  "Tester 5 cas réels : rédaction, synthèse, analyse fichier, recherche, réécriture.":
    "Test five real cases: writing, summarising, file analysis, research, rewriting.",
  "Très généreux, tâches illimitées":
    "Very generous, unlimited tasks",
  "Usage quotidien, fichiers, recherche, code, outils avancés.":
    "Daily use, files, research, code, advanced tools.",
  "Écriture longue":
    "Long-form writing",
  "Écriture longue et réécriture fine":
    "Long-form writing and careful rewriting",
  "Équipe":
    "Team",
  "Vous voulez un assistant généraliste avec outils variés.": "You want a general-purpose assistant with a broad set of tools.",
  "Vous travaillez beaucoup sur documents longs, rédaction ou analyse nuancée.": "You regularly work on long documents, writing or nuanced analysis.",
  "Par défaut, ToolTrim recommande de choisir une IA principale selon usage réel. Garder les deux seulement si ChatGPT sert aux outils polyvalents et Claude aux textes longs.": "ToolTrim recommends choosing one main AI based on your actual work. Keep both only if ChatGPT handles your broader tool needs and Claude handles long-form text.",
  "Analyse de documents lourds": "Analysing large documents",
  "Tu utilises ChatGPT pour recherche/multimodal/code et Claude pour textes longs/édition/analyse documentaire.": "You use ChatGPT for research, multimodal tasks and code, and Claude for long-form text, editing and document analysis.",
  "Payer les deux sans frontière d’usage crée un doublon coûteux et confus.": "Paying for both without distinct roles creates an expensive, confusing overlap.",
  "ChatGPT pour produire une structure, Claude pour affiner un manifeste.": "ChatGPT to develop an outline, Claude to refine a manifesto.",
  "ChatGPT pour analyser des données et sources, Claude pour transformer en note claire.": "ChatGPT to analyse data and sources, Claude to turn them into a clear memo.",
  "Claude seul si ton usage est principalement rédactionnel.": "Claude alone if your work is mainly writing.",
  "Faut-il payer ChatGPT et Claude ?": "Should you pay for both ChatGPT and Claude?",
  "Vous cherchez surtout une lecture longue très stable.": "Your main requirement is consistent reading of long documents.",
  "Vous avez besoin d’un écosystème d’outils très large dans une seule interface.": "You need a very broad set of tools in one interface.",
  "Asana pour une équipe marketing qui coordonne des campagnes.": "Asana for a marketing team coordinating campaigns.",
  "CMS et structure peuvent devenir limitants.": "The CMS and site structure can become limiting.",
  "Canva pour social media et présentations. Photoshop Elements pour organiser et retoucher ses photos personnelles.": "Canva for social media and presentations. Photoshop Elements for organising and editing personal photos.",
  "Canva reste l'outil adapté pour la production de contenus en volume.": "Canva remains the appropriate tool for producing content at scale.",
  "Canva si le livrable est un contenu marketing à publier.": "Canva when the deliverable is marketing content ready to publish.",
  "Canva si ton livrable est un visuel prêt à publier. Zéro formation, templates pour tout, parfait pour les équipes marketing sans designer dédié.": "Canva when your deliverable is a visual ready to publish. No training required, templates for many formats, and a fit for marketing teams without a dedicated designer.",
  "Cartes qui s'accumulent sans priorisation ni cycle clair.": "Cards accumulate without clear priorities or work cycles.",
  "ChatGPT pour code et analyse de fichiers variés, Gemini pour résumés d'emails Gmail.": "ChatGPT for code and varied file analysis, Gemini for Gmail email summaries.",
  "ChatGPT pour produire et itérer rapidement, Gemini pour insérer directement dans Google Docs.": "ChatGPT for rapid drafting and iteration, Gemini for inserting work directly into Google Docs.",
  "Choisir ClickUp pour tout faire et créer une usine à gaz — la richesse fonctionnelle peut devenir un frein à l'adoption.": "Choosing ClickUp to do everything and building an overcomplicated system: its feature breadth can hinder adoption.",
  "Choisir HubSpot pour tout faire puis subir la montée tarifaire vers les hubs Pro/Enterprise.": "Choosing HubSpot to do everything, then facing price increases for Pro or Enterprise hubs.",
  "Choisir Slack Free en oubliant la limite d'historique — les données disparaissent après 90 jours.": "Choosing Slack Free without accounting for its history limit: the source analysis flags a 90-day access window.",
  "ClickUp pour une équipe ops qui veut centraliser tâches, reporting et automatisations.": "ClickUp for an operations team centralising tasks, reporting and automation.",
  "Comparer prix + temps + migration future.": "Compare price, time and future migration costs.",
  "Comparer seulement le taux affiché sans modèle de revenus — le vrai coût dépend du mix cartes, international, conversions et add-ons.": "Comparing only the advertised rate without modelling revenue: actual costs depend on cards, international payments, currency conversion and add-ons.",
  "Comparer un outil de design collaboratif à un logiciel de retouche photo — ils ne couvrent pas le même besoin.": "Comparing collaborative design software with a photo editor: they address different needs.",
  "Contrôle insuffisant par rapport à un éditeur dédié.": "Insufficient control compared with a dedicated editor.",
  "Coût et complexité inutiles.": "Unnecessary cost and complexity.",
  "Coût fixe doublé et usage confus entre deux outils similaires.": "Twice the fixed cost and confusing overlap between two similar tools.",
  "Coût fixe doublé et usage confus.": "Twice the fixed cost and unclear usage.",
  "Coût par user plus élevé pour des fonctions disponibles gratuitement ailleurs.": "A higher cost per user for features available free elsewhere.",
  "Coût qui explose dès qu'on veut des automatisations ou reporting avancé.": "Costs rise sharply when advanced automation or reporting becomes necessary.",
  "Faut-il payer ChatGPT et Gemini ?": "Should you pay for both ChatGPT and Gemini?",
  "Figma pour brand system, Canva pour déclinaisons social media.": "Figma for the brand system, Canva for social media variations.",
  "Figma pour concevoir le système, Canva pour permettre à l’équipe de produire des déclinaisons cadrées.": "Figma to design the system, Canva to let the team produce variations within its guidelines.",
  "Figma pour maquette site, Canva pour posts LinkedIn.": "Figma for website mockups, Canva for LinkedIn posts.",
  "Figma si ton livrable est une interface, une maquette ou un design system. L'outil de référence pour toute équipe qui travaille avec des développeurs.": "Figma when your deliverable is an interface, a mockup or a design system. A reference tool for teams working with developers.",
  "Framer pour prototypes/landing rapides, Webflow pour site principal durable.": "Framer for quick prototypes and landing pages, Webflow for the long-term main site.",
  "Framer pour pré-lancement produit.": "Framer for a product pre-launch.",
  "Friction d'adoption et outil sous-utilisé.": "Adoption friction and an underused tool.",
  "Gemini n'apporte pas grand-chose si tu ne travailles pas dans Workspace.": "Gemini adds less value if you do not work in Workspace.",
  "Gemini seul si ton workflow est 100 % Google Workspace.": "Gemini alone if your workflow is entirely in Google Workspace.",
  "HubSpot pour une PME qui veut aligner marketing et sales dans une même plateforme.": "HubSpot for a small or medium business aligning marketing and sales in one platform.",
  "Identité visuelle banalisée.": "A generic visual identity.",
  "L'équipe se perd dans les options et abandonne l'outil.": "The team gets lost in the options and abandons the tool.",
  "Le choix Google-first": "The Google-first choice",
  "Le choix contenu": "The content choice",
  "Le choix polyvalent": "The versatile choice",
  "Le choix produit": "The product choice",
  "Le fichier n’est pas exploitable comme base UI sérieuse.": "The file cannot serve as a reliable UI design foundation.",
  "Le pire montage consiste à maintenir les mêmes données dans les deux outils.": "The worst arrangement is maintaining the same data in both tools.",
  "Le résultat reflète souvent le prompt, pas l’outil.": "The result often reflects the prompt rather than the tool.",
  "Le système devient fragile quand les données grandissent.": "The system becomes fragile as the data grows.",
  "Le temps de build fausse la décision.": "Build time distorts the decision.",
  "Lent, pas de templates, pas de collaboration.": "Slow, with no templates or collaboration.",
  "Les deux peuvent coexister si l'usage est clairement séparé.": "Both can coexist if their roles are clearly separated.",
  "Les décisions et données finissent dans des conversations difficiles à maintenir.": "Decisions and data end up in conversations that are hard to maintain.",
  "Limitations techniques et contrôle insuffisant du checkout.": "Technical limitations and insufficient checkout control.",
  "Linear pour une équipe dev qui ship des features avec GitHub et des cycles hebdomadaires.": "Linear for a development team shipping features with GitHub and weekly cycles.",
  "L’espace devient lent à comprendre et difficile à maintenir.": "The workspace becomes hard to understand and maintain.",
  "Make pour enrichir, router, transformer et synchroniser plusieurs bases.": "Make for enriching, routing, transforming and synchronising multiple databases.",
  "Mauvais critère de décision.": "The wrong basis for a decision.",
  "Notion pour le brief éditorial, Airtable pour le calendrier de production.": "Notion for the editorial brief, Airtable for the production calendar.",
  "Notion pour le contexte et Airtable pour la donnée source.": "Notion for context and Airtable for source data.",
  "Notion pour le playbook commercial, Airtable pour le pipeline leads.": "Notion for the sales playbook, Airtable for the lead pipeline.",
  "Outil lourd et moins intuitif sans la suite Office.": "A heavier, less intuitive tool without the Office suite.",
  "Par défaut, ToolTrim recommande Asana pour une équipe qui doit s’aligner vite. ClickUp devient meilleur pour power users ou équipes prêtes à structurer un vrai workspace.": "ToolTrim recommends Asana by default for a team that needs to align quickly. ClickUp becomes a better fit for power users or teams ready to structure a full workspace.",
  "Par défaut, ToolTrim recommande Canva pour les créatifs et solos qui produisent des contenus. Photoshop Elements devient logique si le besoin principal est la retouche photo simple sans abonnement lourd.": "ToolTrim recommends Canva by default for creatives and solo professionals producing content. Photoshop Elements makes sense when the main need is simple photo editing without a substantial subscription.",
  "Par défaut, ToolTrim recommande ChatGPT pour un solo ou freelance qui veut un assistant agnostique. Gemini devient meilleur si le workflow est ancré dans Google Workspace.": "ToolTrim recommends ChatGPT by default for a solo professional or freelancer seeking an ecosystem-independent assistant. Gemini becomes a better fit when the workflow is rooted in Google Workspace.",
  "Par défaut, ToolTrim recommande Figma pour l’UX/UI et Canva pour les contenus marketing. Le seuil bascule dès que le livrable passe d’un visuel à publier à une interface à construire.": "ToolTrim recommends Figma for UX/UI and Canva for marketing content. The decision changes when the deliverable shifts from a visual to publish to an interface to build.",
  "Par défaut, ToolTrim recommande Framer pour lancer vite, Webflow pour construire durablement. Le seuil bascule quand le site devient un système éditorial ou marketing complexe.": "ToolTrim recommends Framer for a fast launch and Webflow for a lasting foundation. The decision changes when the site becomes a complex editorial or marketing system.",
  "Par défaut, ToolTrim recommande Notion pour les solos et équipes créatives. Airtable devient meilleur quand les données, vues et permissions deviennent structurantes.": "ToolTrim recommends Notion by default for solo professionals and creative teams. Airtable becomes a better fit when data, views and permissions shape the workflow.",
  "Par défaut, ToolTrim recommande Pipedrive pour une petite équipe sales. HubSpot devient meilleur quand le CRM doit nourrir marketing, support et acquisition.": "ToolTrim recommends Pipedrive by default for a small sales team. HubSpot becomes a better fit when the CRM must support marketing, customer service and acquisition.",
  "Par défaut, ToolTrim recommande Slack pour les petites équipes agiles hors Microsoft. Teams devient meilleur quand Microsoft 365 est déjà payé et structurant.": "ToolTrim recommends Slack by default for small agile teams outside Microsoft. Teams becomes a better fit when Microsoft 365 is already paid for and central to the workflow.",
  "Par défaut, ToolTrim recommande Stripe pour les SaaS et produits digitaux. PayPal devient complémentaire si la conversion client augmente avec cette option.": "ToolTrim recommends Stripe by default for SaaS and digital products. PayPal complements it when offering that option improves customer conversion.",
  "Par défaut, ToolTrim recommande Trello pour les équipes non-tech. Linear devient meilleur dès que le travail ressemble à du shipping produit.": "ToolTrim recommends Trello by default for nontechnical teams. Linear becomes a better fit when the work centres on shipping a product.",
  "Par défaut, ToolTrim recommande Zapier pour démarrer vite. Make devient meilleur quand le volume, la logique ou le coût par exécution deviennent décisifs.": "ToolTrim recommends Zapier for a quick start. Make becomes a better fit when volume, logic or cost per execution becomes decisive.",
  "Passer à Photoshop Elements quand le besoin principal devient la retouche photo locale sans payer un abonnement récurrent.": "Switch to Photoshop Elements when the main need becomes local photo editing without a recurring subscription.",
  "Payer les deux sans frontière d'usage crée un doublon coûteux. Gemini n'apporte pas grand-chose hors écosystème Google.": "Paying for both without distinct roles creates expensive overlap. Gemini adds less value outside Google's ecosystem.",
  "Perte de mémoire collective après 90 jours.": "Loss of accessible team history after 90 days.",
  "Photoshop Elements ou Lightroom pour les corrections photos sérieuses.": "Photoshop Elements or Lightroom for more demanding photo corrections.",
  "Pipedrive pour une équipe commerciale de 3-5 personnes qui gère un pipeline simple.": "Pipedrive for a sales team of three to five people managing a simple pipeline.",
  "Refaire un site Framer devenu trop complexe dans Webflow coûte plus cher qu’un bon choix initial.": "Rebuilding an overgrown Framer site in Webflow costs more than choosing appropriately at the start.",
  "Scénarios difficiles à maintenir.": "Scenarios that are hard to maintain.",
  "Setup long pour un besoin encore flou.": "A long setup for a need that is still unclear.",
  "Simple au début, cher si les tâches augmentent.": "Simple at first, expensive as task volume increases.",
  "Slack pour une agence ou startup tech sans dépendance Microsoft.": "Slack for an agency or technology startup without Microsoft dependencies.",
  "Sous-estimation des frais réels selon le profil de paiement.": "Underestimating actual fees for the payment mix.",
  "Stack fragmentée avec des outils marketing séparés.": "A fragmented stack with separate marketing tools.",
  "Stripe + PayPal pour un e-commerce B2C avec clients internationaux.": "Stripe and PayPal for a consumer online store with international customers.",
  "Stripe seul pour un SaaS B2B avec paiement carte.": "Stripe alone for a business SaaS product accepting card payments.",
  "Teams pour une PME ou grande entreprise déjà sur Microsoft 365.": "Teams for a small, medium or large company already using Microsoft 365.",
  "Trello pour une équipe marketing qui gère des campagnes en Kanban.": "Trello for a marketing team managing campaigns with Kanban.",
  "Trop de setup pour valider une idée.": "Too much setup to validate an idea.",
  "Tu uses ChatGPT pour code, créatif et outils non-Google, et Gemini pour Workspace et recherche Google.": "You use ChatGPT for code, creative work and non-Google tools, and Gemini for Workspace and Google search.",
  "Un scénario Make mal construit peut consommer énormément d’opérations ; un Zap mal conçu peut brûler les tâches du mois.": "A poorly built Make scenario can consume many operations; a poorly designed Zap can use up the month's task allowance.",
  "Utiliser Canva pour de la retouche photo précise": "Using Canva for precise photo editing",
  "Utiliser Canva pour une UI crée souvent des fichiers impossibles à exploiter proprement en dev.": "Using Canva for UI design often produces files that are difficult to use in development.",
  "Utiliser Photoshop Elements pour produire des contenus social media en volume": "Using Photoshop Elements to produce social media content at scale",
  "Utiliser Trello pour piloter un backlog produit sérieux — l'outil craque sous la complexité.": "Using Trello to manage a demanding product backlog: complexity can overwhelm the tool.",
  "Vos clients demandent PayPal.": "Your customers request PayPal.",
  "Vos tableaux restent simples.": "Your tables remain simple.",
  "Votre base doit devenir robuste et filtrable à grande échelle.": "Your database needs to be robust and filterable at scale.",
  "Votre priorité est coordination claire et adoption par l’équipe.": "Your priority is clear coordination and team adoption.",
  "Votre seul usage est l'intégration native Google Workspace.": "Your only use case is native Google Workspace integration.",
  "Votre stack n’est pas centrée Microsoft.": "Your stack is not centred on Microsoft.",
  "Votre workflow quotidien passe par Gmail, Google Docs, Sheets ou Drive.": "Your daily workflow runs through Gmail, Google Docs, Sheets or Drive.",
  "Votre équipe non-tech doit maintenir les automatisations.": "Your nontechnical team needs to maintain the automations.",
  "Votre équipe n’est pas composée de designers produit.": "Your team does not consist of product designers.",
  "Votre équipe n’est pas orientée produit/dev.": "Your team is not focused on product development.",
  "Votre équipe se perd dans les outils trop configurables.": "Your team gets lost in highly configurable tools.",
  "Vous avez beaucoup de contenus, gouvernance ou contraintes CMS.": "You have substantial content, governance or CMS requirements.",
  "Vous avez beaucoup d’étapes et un volume élevé.": "You have many steps and high volume.",
  "Vous avez besoin de branches, scénarios visuels, contrôles fins.": "You need branching, visual scenarios and fine-grained controls.",
  "Vous avez besoin d’un Kanban simple.": "You need a simple Kanban board.",
  "Vous avez des usages variés : code, images, fichiers, recherche non-Google.": "Your use cases include code, images, files and research outside Google.",
  "Vous avez un site CMS sérieux, des contraintes client ou SEO avancé.": "You have a substantial CMS site, client requirements or advanced SEO needs.",
  "Vous avez une logique produit/API avancée.": "You have advanced product or API logic.",
  "Vous cherchez le maximum de fonctions au prix le plus bas.": "You want the most features at the lowest price.",
  "Vous cherchez surtout des templates prêts à publier.": "You mainly want ready-to-publish templates.",
  "Vous cherchez surtout un espace d’écriture et de documentation.": "You mainly want a writing and documentation space.",
  "Vous cherchez un contrôle photo précis type éditeur local.": "You want precise photo control in a local editor.",
  "Vous cherchez un outil léger et très fluide pour communautés ou petites équipes.": "You want a lightweight, fluid tool for communities or small teams.",
  "Vous cherchez une plateforme inbound complète.": "You want a complete inbound marketing platform.",
  "Vous concevez des interfaces.": "You design interfaces.",
  "Vous construisez un wiki ou un espace client.": "You are building a wiki or client workspace.",
  "Vous craignez les sauts de prix et la complexité des hubs.": "You are concerned about price jumps and hub complexity.",
  "Vous devez créer des assets social media en volume.": "You need to create social media assets at scale.",
  "Vous devez lancer vite une page soignée.": "You need to launch a polished page quickly.",
  "Vous devez livrer un design system ou une maquette produit précise.": "You need to deliver a design system or a precise product mockup.",
  "Vous devez piloter bugs, cycles et priorités produit.": "You need to manage bugs, cycles and product priorities.",
  "Vous gérez des records, relations, vues métier ou automatisations.": "You manage records, relationships, business views or automations.",
  "Vous n'utilisez pas Gmail, Docs ou Drive au quotidien.": "You do not use Gmail, Docs or Drive daily.",
  "Vous ne pouvez pas gérer setup technique et conformité paiement.": "You cannot manage technical setup and payment compliance.",
  "Vous n’avez pas le temps de modéliser un scénario.": "You do not have time to model a scenario.",
  "Vous privilégiez design et vitesse de publication.": "You prioritise design and publishing speed.",
  "Vous produisez beaucoup de formats marketing.": "You produce many marketing formats.",
  "Vous produisez des visuels social, decks ou supports rapides.": "You produce social visuals, decks or quick materials.",
  "Vous refusez de payer pour conserver l’historique.": "You do not want to pay to retain history.",
  "Vous retouchez surtout des photos.": "You mainly edit photos.",
  "Vous surveillez le coût au volume.": "You monitor costs at scale.",
  "Vous travaillez avec développeurs, composants et prototypes.": "You work with developers, components and prototypes.",
  "Vous travaillez avec templates, marque, exports et collaboration.": "You work with templates, branding, exports and collaboration.",
  "Vous travaillez en agence ou avec une équipe web.": "You work in an agency or with a web team.",
  "Vous travaillez principalement hors de l'écosystème Google.": "You mainly work outside Google's ecosystem.",
  "Vous utilisez recherche, multimodal, code ou génération visuelle.": "You use research, multimodal features, code or visual generation.",
  "Vous voulez connecter vite deux ou trois apps.": "You want to connect two or three apps quickly.",
  "Vous voulez juste tester une landing page en une journée.": "You just want to test a landing page in a day.",
  "Vous voulez juste une to-do visuelle facile.": "You just want an easy visual task list.",
  "Vous voulez un assistant généraliste qui fonctionne hors de l'écosystème Google.": "You want a general-purpose assistant that works outside Google's ecosystem.",
  "Vous voulez une IA qui accède directement à vos documents Google.": "You want an AI that can access your Google documents directly.",
  "Vous voulez une messagerie d’équipe claire et rapide.": "You want clear, fast team messaging.",
  "Vous voulez éviter un abonnement mensuel complet.": "You want to avoid a full monthly subscription.",
  "Webflow pour site corporate avec blog, cas clients et ressources.": "Webflow for a corporate site with a blog, case studies and resources.",
  "Zapier pour automatisations simples d’équipe, Make pour scénarios ops avancés.": "Zapier for simple team automations, Make for advanced operations scenarios.",
  "Zapier pour envoyer un lead Typeform vers Pipedrive.": "Zapier to send a Typeform lead to Pipedrive.",
  "À considérer si ton travail vit déjà dans Google Workspace, avec beaucoup de documents, recherche, fichiers et usages multimodaux.": "Consider it if your work already lives in Google Workspace, with extensive document, research, file and multimodal needs.",
  "À privilégier si tu veux un assistant unique pour écrire, analyser, coder, manipuler des fichiers et produire vite au quotidien.": "Prefer it if you want one assistant to write, analyse, code, handle files and produce work quickly each day.",

  "Complexité et coût peuvent grimper vite.": "Complexity and cost can rise quickly.",
  "Contrôle photo précis limité par rapport à un éditeur dédié.": "Limited precise photo control compared with a dedicated editor.",
  "Courbe d'apprentissage plus longue qu'Asana.": "A longer learning curve than Asana.",
  "Courbe d’apprentissage plus élevée que Canva.": "A steeper learning curve than Canva.",
  "Courbe d’apprentissage plus élevée.": "A steeper learning curve.",
  "Coût par seat et paliers peuvent monter vite.": "Seat costs and pricing tiers can rise quickly.",
  "Coût par seat qui monte avec l'équipe.": "Seat costs increase as the team grows.",
  "Coût par type de seat à surveiller.": "Monitor costs by seat type.",
  "Coût par user plus élevé que ClickUp.": "A higher cost per user than ClickUp.",
  "Coût récurrent et dépendance aux contenus premium.": "Recurring costs and dependence on premium content.",
  "Debug et architecture demandent méthode.": "Debugging and architecture require a methodical approach.",
  "Devient vraiment intéressant uniquement si le workflow est ancré dans Google Workspace.": "Its value is strongest when the workflow is rooted in Google Workspace.",
  "Frais additionnels sur Billing (0,7%), Tax, Connect.": "Additional fees for Billing (0.7%), Tax and Connect.",
  "Historique limité sur Free — données perdues après 90 jours.": "Limited history on Free: the editorial source identifies a 90-day limit.",
  "Intégration Workspace avancée dépend du plan souscrit.": "Advanced Workspace integration depends on the subscribed plan.",
  "La richesse des modes/outils peut créer du flou si l’utilisateur ne définit pas ses usages.": "The range of modes and tools can be confusing without clearly defined use cases.",
  "La tarification par tâches peut pénaliser la croissance.": "Task-based pricing can penalise growth.",
  "Le coût réel dépend du nombre d’opérations générées par bundles/modules.": "Actual cost depends on the operations generated by bundles and modules.",
  "Les limites d’usage sont un vrai sujet pour les utilisateurs intensifs.": "Usage limits are a significant consideration for heavy users.",
  "Moins adapté au design produit, UI complexe, design system et handoff dev.": "Less suited to product design, complex UI, design systems and developer handoff.",
  "Moins adapté aux logiques produit/API avancées.": "Less suited to advanced product or API logic.",
  "Moins adapté aux équipes sans culture produit/engineering.": "Less suited to teams without a product or engineering culture.",
  "Moins adapté si le CRM doit nourrir marketing et support.": "Less suited when the CRM must support marketing and customer service.",
  "Moins de fonctionnalités gratuitement.": "Fewer features available free.",
  "Moins fluide pour communautés ou petites équipes sans M365.": "Less fluid for communities or small teams without Microsoft 365.",
  "Moins intégré nativement à Google Workspace, Gmail, Google Docs ou Google Search.": "Less natively integrated with Google Workspace, Gmail, Google Docs or Google Search.",
  "Moins large que ChatGPT pour certains usages multimodaux ou écosystème d’outils selon disponibilité.": "A narrower range than ChatGPT for some multimodal uses or tools, depending on availability.",
  "Moins lisible pour workflows très complexes ou transformations avancées.": "Harder to follow for very complex workflows or advanced transformations.",
  "Moins naturel pour documentation longue et écriture libre.": "Less natural for long-form documentation and free-form writing.",
  "Moins pertinent pour un usage hors écosystème Google.": "Less relevant outside Google's ecosystem.",
  "Moins robuste que Webflow pour CMS complexe, gouvernance et sites marketing lourds.": "Less robust than Webflow for complex CMS needs, governance and substantial marketing sites.",
  "Moins robuste qu’une vraie base relationnelle pour données volumineuses, workflows métier et vues complexes.": "Less robust than a relational database for large datasets, business workflows and complex views.",
  "Nécessite setup technique et conformité paiement.": "Requires technical setup and payment compliance.",
  "Pas adapté pour piloter un backlog produit sérieux.": "Not suited to managing a demanding product backlog.",
  "Pas de plan gratuit permanent.": "No permanent free plan.",
  "Pas fait pour produire des assets social media en volume.": "Not designed to produce social media assets at scale.",
  "Pas pensé pour produire rapidement des supports social media en volume sans design system.": "Not designed for quickly producing social media materials at scale without a design system.",
  "Peut devenir cher quand les tâches augmentent.": "Can become expensive as task volume grows.",
  "Peut devenir limité si le site devient un système complet.": "Can become limiting if the site develops into a complete system.",
  "Peut devenir un fourre-tout si la gouvernance est faible.": "Can become a catch-all workspace without clear governance.",
  "Peut générer du bruit si l'utilisateur ne cadre pas précisément ses usages.": "Can create noise if the user does not define their needs precisely.",
  "Peut être lourd pour une landing simple.": "Can be excessive for a simple landing page.",
  "Peut être moins confortable que Claude sur certains longs textes éditoriaux ou documents très narratifs.": "May be less comfortable than Claude for some long editorial texts or highly narrative documents.",
  "Plus complexe à bien modéliser que Notion.": "More complex to model well than Notion.",
  "Plus technique que Zapier.": "More technical than Zapier.",
  "Portabilité moins propre pour fichiers de design professionnels.": "Less straightforward portability for professional design files.",
  "Pricing plus complexe : site plan + workspace + add-ons possibles.": "More complex pricing: site plan, workspace and possible add-ons.",
  "Renouvellement requis après 3 ans, courbe d'apprentissage photo.": "Renewal required after three years, plus a photo-editing learning curve.",
  "Risque d'outil trop spécialisé pour non-dev.": "May be too specialised for non-developers.",
  "Risque d’un rendu générique si templates mal maîtrisés.": "Risk of generic-looking results if templates are poorly adapted.",
  "Écosystème pro moins profond que Webflow pour certaines intégrations.": "A less extensive professional ecosystem than Webflow for some integrations.",

  "Automation simple formulaire → email/CRM": "Simple form-to-email/CRM automation",
  "Canva sauf direction artistique premium.": "Canva, unless you need bespoke art direction.",
  "Composants, variables, librairies.": "Components, variables and libraries.",
  "Connexion Drive possible mais moins native.": "Drive connection is possible but less native.",
  "Documentation projet client": "Client project documentation",
  "Landing page SaaS": "SaaS landing page",
  "Plus accessible.": "More accessible.",
  "Rapide et simple.": "Fast and simple.",
  "Routes, filtres et logique visuelle.": "Routes, filters and visual logic.",
  "Site marketing long terme": "Long-term marketing site",
  "Templates et production rapide.": "Templates and fast production.",
  "Utilisateur non-tech": "Nontechnical user",
  "Wiki d’agence": "Agency wiki",
  "Workflow multi-branches": "Multi-branch workflow",

  "ChatGPT pour varier les tâches ; Claude si votre travail repose surtout sur les textes longs et les documents.": "ChatGPT for a mix of tasks; Claude when most of your work involves long texts and documents.",
  "Choisissez une IA principale. Payez les deux seulement si vous séparez clairement leurs rôles : tâches variées pour ChatGPT, textes longs pour Claude.": "Choose one main AI. Pay for both only with distinct roles: varied tasks for ChatGPT, long-form text for Claude.",
};

export function translateBattleCopy(value: string): string {
  return COMPARISON_BATTLE_EN[value] ?? value;
}

export const COMPARISON_BATTLE_EN_SIZE = Object.keys(COMPARISON_BATTLE_EN).length;
