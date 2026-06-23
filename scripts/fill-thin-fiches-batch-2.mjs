/** fill-thin-fiches-batch-2.mjs — complète 6 fiches qui avaient déjà un
 * angle IA et un prix correct, mais des pros/cons/useCases vides et une
 * longDescription minimale : PayPal, Toggl Track, 1Password, Firebase,
 * TikTok, Sketch. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));

const UPDATES = {
  paypal: {
    longDescription: "PayPal est un service de paiement en ligne qui permet d'envoyer et recevoir de l'argent, d'encaisser des clients ou de payer des fournisseurs sans partager ses coordonnées bancaires. Pour un freelance, c'est souvent le moyen de paiement le plus simple à proposer à des clients internationaux qui n'ont pas de RIB français.\n\nLe compte personnel est gratuit ; les frais s'appliquent surtout sur les encaissements professionnels (environ 2,9% + frais fixe par transaction en France) et sur la conversion de devises. Pour des virements réguliers en euros entre comptes français, Stripe ou un virement bancaire classique reviennent souvent moins cher.",
    longDescriptionEn: "PayPal is an online payment service that lets you send and receive money, collect from clients, or pay suppliers without sharing your bank details. For a freelancer, it's often the simplest payment method to offer international clients who don't have a French bank account.\n\nThe personal account is free; fees mainly apply to professional payments received (around 2.9% + a fixed fee per transaction in France) and currency conversion. For regular euro transfers between French accounts, Stripe or a standard bank transfer often end up cheaper.",
    pros: ["Accepté presque partout, reconnu et rassurant pour les clients internationaux", "Aucune coordonnée bancaire à partager pour encaisser ou payer", "Compte personnel gratuit, ouverture immédiate"],
    prosEn: ["Accepted almost everywhere, recognized and reassuring for international clients", "No bank details to share to receive or send money", "Free personal account, instant setup"],
    cons: ["Frais d'encaissement pro qui s'accumulent vite (≈2,9% + frais fixe par transaction)", "Taux de conversion de devises moins avantageux qu'une carte ou Stripe", "Gel de compte possible en cas de litige, parfois difficile à débloquer rapidement"],
    consEn: ["Professional payment fees add up quickly (~2.9% + fixed fee per transaction)", "Currency conversion rates less favorable than a card or Stripe", "Possible account freezes in case of a dispute, sometimes slow to resolve"],
    useCases: ["Encaisser des clients internationaux sans IBAN local", "Payer rapidement un sous-traitant ou un outil à l'étranger", "Recevoir un paiement ponctuel sans configurer un compte pro complet"],
    useCasesEn: ["Collect from international clients without a local IBAN", "Quickly pay a subcontractor or a tool abroad", "Receive a one-off payment without setting up a full business account"],
    verdict: {
      keepIf: ["Tes clients sont à l'international et veulent un moyen de paiement universel", "Tu factures occasionnellement sans vouloir un compte pro dédié"],
      avoidIf: ["Tu factures surtout en France/Europe — un virement SEPA ou Stripe coûte moins cher", "Le volume est élevé et les frais d'encaissement deviennent significatifs"],
      threshold: "Pratique pour l'international et l'occasionnel ; pour du volume régulier en euros, compare avec Stripe ou un compte pro.",
    },
    verdictEn: {
      keepIf: ["Your clients are international and want a universal payment method", "You invoice occasionally without wanting a dedicated business account"],
      avoidIf: ["You mostly invoice in France/Europe — a SEPA transfer or Stripe costs less", "Volume is high and receiving fees become significant"],
      threshold: "Convenient for international and occasional use; for regular euro volume, compare with Stripe or a business account.",
    },
  },
  toggl: {
    pros: ["Interface simple, démarrer/arrêter le chrono prend une seconde", "Rapports détaillés par client, projet ou tag pour justifier une facture", "Version gratuite généreuse pour un usage solo"],
    prosEn: ["Simple interface, starting/stopping the timer takes a second", "Detailed reports by client, project, or tag to back up an invoice", "Generous free version for solo use"],
    cons: ["Aucune détection automatique — tout repose sur le réflexe de lancer le chrono", "Les fonctionnalités d'équipe (planning, approbation) demandent un plan payant", "Pas d'outil de facturation intégré, juste le suivi du temps"],
    consEn: ["No automatic detection — everything relies on the reflex to start the timer", "Team features (scheduling, approval) require a paid plan", "No built-in invoicing, just time tracking"],
    useCases: ["Facturer un client au temps passé avec un rapport détaillé à l'appui", "Comprendre où part réellement son temps entre plusieurs projets", "Comparer le temps estimé vs réel pour mieux chiffrer ses prochains devis"],
    useCasesEn: ["Bill a client by time spent with a detailed report to back it up", "Understand where your time actually goes across several projects", "Compare estimated vs. actual time to quote future projects better"],
  },
  "1password": {
    pros: ["Coffre-fort chiffré de bout en bout, y compris pour le partage d'équipe", "Remplissage automatique fiable sur navigateur et mobile", "Alertes intégrées en cas de mot de passe compromis (Watchtower)"],
    prosEn: ["End-to-end encrypted vault, including for team sharing", "Reliable autofill on browser and mobile", "Built-in alerts when a password is compromised (Watchtower)"],
    cons: ["Payant dès le premier compte, contrairement à des alternatives comme Bitwarden", "Migration depuis un autre gestionnaire parfois fastidieuse", "Dépendance totale à l'app en cas de compte bloqué sans backup du coffre"],
    consEn: ["Paid from the first account, unlike alternatives like Bitwarden", "Migration from another password manager can be tedious", "Total dependency on the app if the account is locked without a vault backup"],
    useCases: ["Centraliser et sécuriser tous les mots de passe d'une activité freelance", "Partager des accès clients ou outils avec une équipe sans exposer les mots de passe en clair", "Stocker des informations sensibles (clés API, documents) en plus des mots de passe"],
    useCasesEn: ["Centralize and secure all passwords for a freelance business", "Share client or tool access with a team without exposing plaintext passwords", "Store sensitive information (API keys, documents) alongside passwords"],
  },
  firebase: {
    longDescription: "Firebase est la plateforme backend de Google : authentification, base de données temps réel (Firestore), hébergement, notifications push et stockage de fichiers, pensée pour développer une app sans monter sa propre infrastructure serveur.\n\nPour un développeur indépendant ou une petite équipe technique, Firebase permet de lancer un MVP rapidement avec un plan gratuit généreux (Spark) ; les coûts montent ensuite avec l'usage réel (lectures/écritures en base, bande passante), ce qui en fait un bon choix pour démarrer mais qui demande une vraie surveillance des coûts à l'échelle.",
    longDescriptionEn: "Firebase is Google's backend platform: authentication, real-time database (Firestore), hosting, push notifications, and file storage, built to develop an app without setting up your own server infrastructure.\n\nFor an independent developer or a small technical team, Firebase makes it possible to launch an MVP quickly with a generous free plan (Spark); costs then scale with actual usage (database reads/writes, bandwidth), making it a good choice to start but one that requires real cost monitoring at scale.",
    pros: ["Plan gratuit (Spark) généreux pour démarrer un projet ou un MVP", "Authentification, base de données et hosting dans un seul écosystème intégré", "Scalabilité automatique sans gérer de serveurs"],
    prosEn: ["Generous free plan (Spark) to start a project or MVP", "Authentication, database, and hosting in one integrated ecosystem", "Automatic scaling without managing servers"],
    cons: ["Les coûts deviennent difficiles à prévoir une fois le trafic réel installé", "Vendor lock-in fort sur l'écosystème Google une fois le projet avancé", "Firestore impose des contraintes de modélisation de données spécifiques à apprendre"],
    consEn: ["Costs become hard to predict once real traffic kicks in", "Strong vendor lock-in to the Google ecosystem once the project is well underway", "Firestore imposes specific data-modeling constraints to learn"],
    useCases: ["Lancer un MVP d'app mobile ou web sans gérer de serveur", "Ajouter une authentification utilisateur complète en quelques heures", "Stocker et synchroniser des données en temps réel entre plusieurs clients (chat, collaboratif)"],
    useCasesEn: ["Launch a mobile or web app MVP without managing a server", "Add full user authentication in a few hours", "Store and sync data in real time across multiple clients (chat, collaborative apps)"],
    verdict: {
      keepIf: ["Tu développes un MVP ou une app et veux éviter de monter une infrastructure serveur", "Ton trafic reste modéré ou prévisible"],
      avoidIf: ["Ton app a un trafic important et imprévisible — les coûts peuvent s'envoler", "Tu veux éviter le lock-in et garder ton infrastructure portable"],
      threshold: "Idéal pour démarrer vite ; surveille les coûts dès que le trafic réel s'installe.",
    },
    verdictEn: {
      keepIf: ["You're building an MVP or app and want to avoid setting up server infrastructure", "Your traffic stays moderate or predictable"],
      avoidIf: ["Your app has significant, unpredictable traffic — costs can spike", "You want to avoid lock-in and keep your infrastructure portable"],
      threshold: "Great to start fast; watch costs closely once real traffic kicks in.",
    },
  },
  tiktok: {
    longDescription: "TikTok est la plateforme de vidéos courtes dont l'algorithme de recommandation reste la référence pour la portée organique : une vidéo sans aucun follower peut atteindre des centaines de milliers de vues si le contenu retient l'attention.\n\nPour un créateur de contenu ou une marque, c'est avant tout un canal de visibilité et d'acquisition d'audience, pas un outil de gestion — la production (montage, sous-titrage) passe généralement par des outils tiers (CapCut, Submagic) avant publication.",
    longDescriptionEn: "TikTok is the short-video platform whose recommendation algorithm remains the reference for organic reach: a video with zero followers can reach hundreds of thousands of views if the content holds attention.\n\nFor a content creator or a brand, it's primarily a visibility and audience-acquisition channel, not a management tool — production (editing, captioning) usually goes through third-party tools (CapCut, Submagic) before publishing.",
    pros: ["Portée organique inégalée pour du contenu sans budget pub", "Algorithme qui favorise la qualité du contenu plutôt que la taille de l'audience existante", "Monétisation possible (Creator Rewards, boutique, partenariats de marque)"],
    prosEn: ["Unmatched organic reach for content with no ad budget", "Algorithm that favors content quality over existing audience size", "Monetization possible (Creator Rewards, shop, brand partnerships)"],
    cons: ["Algorithme imprévisible, les résultats varient fortement d'une vidéo à l'autre", "Revenus de monétisation directe (Creator Rewards) souvent faibles sans partenariats", "Incertitude réglementaire dans certains pays (interdictions, restrictions)"],
    consEn: ["Unpredictable algorithm, results vary widely from one video to another", "Direct monetization revenue (Creator Rewards) often low without partnerships", "Regulatory uncertainty in some countries (bans, restrictions)"],
    useCases: ["Construire une audience depuis zéro sans budget publicitaire", "Promouvoir un service ou produit freelance auprès d'une audience jeune", "Tester rapidement quels formats de contenu engagent le plus avant de les décliner ailleurs"],
    useCasesEn: ["Build an audience from zero without an ad budget", "Promote a freelance service or product to a younger audience", "Quickly test which content formats engage most before repurposing them elsewhere"],
    verdict: {
      keepIf: ["Ton audience cible est présente sur la plateforme (souvent plus jeune)", "Tu peux produire du contenu vidéo court régulièrement"],
      avoidIf: ["Ton audience B2B ou senior n'est pas vraiment présente sur TikTok", "Tu n'as pas la capacité de produire du contenu vidéo de façon régulière"],
      threshold: "Vaut l'investissement si tu peux publier régulièrement et que ton audience y est présente.",
    },
    verdictEn: {
      keepIf: ["Your target audience is on the platform (often younger)", "You can produce short video content regularly"],
      avoidIf: ["Your B2B or older audience isn't really present on TikTok", "You don't have the capacity to produce video content regularly"],
      threshold: "Worth the investment if you can publish regularly and your audience is there.",
    },
  },
  sketch: {
    longDescription: "Sketch est un éditeur de design d'interface né sur macOS, l'un des premiers outils à populariser le design de composants réutilisables (symbols) avant l'arrivée de Figma. Il reste utilisé par certaines équipes déjà installées sur l'écosystème, mais a perdu beaucoup de terrain face à Figma, qui a imposé la collaboration en temps réel comme standard.\n\nSketch fonctionne uniquement sur Mac (pas de version web ou Windows native), ce qui limite la collaboration avec des équipes mixtes — un point qui pèse de plus en plus dans le choix face à des alternatives multiplateformes.",
    longDescriptionEn: "Sketch is an interface design editor born on macOS, one of the first tools to popularize reusable component design (symbols) before Figma arrived. It's still used by some teams already invested in the ecosystem, but has lost significant ground to Figma, which made real-time collaboration the standard.\n\nSketch only runs on Mac (no web or native Windows version), which limits collaboration with mixed teams — a point that increasingly weighs against it compared to cross-platform alternatives.",
    pros: ["Interface légère et rapide, pensée spécifiquement pour macOS", "Écosystème de plugins encore actif pour des besoins spécifiques", "Tarification à l'achat de licence possible, pas uniquement par abonnement"],
    prosEn: ["Lightweight and fast interface, built specifically for macOS", "Still-active plugin ecosystem for specific needs", "License purchase option available, not subscription-only"],
    cons: ["Mac uniquement — aucune version Windows ou web native", "Collaboration en temps réel moins fluide que Figma", "Perd du terrain en termes d'adoption face à Figma, surtout chez les nouvelles équipes"],
    consEn: ["Mac only — no native Windows or web version", "Real-time collaboration less smooth than Figma", "Losing ground in adoption to Figma, especially among new teams"],
    useCases: ["Concevoir des interfaces avec une équipe déjà sur macOS et Sketch", "Maintenir un design system existant construit historiquement sur Sketch", "Profiter d'un éditeur léger sans dépendre d'une connexion internet permanente"],
    useCasesEn: ["Design interfaces with a team already on macOS and Sketch", "Maintain an existing design system historically built on Sketch", "Use a lightweight editor without depending on a constant internet connection"],
    verdict: {
      keepIf: ["Ton équipe est déjà sur Sketch avec un design system établi", "Tu travailles exclusivement sur Mac sans besoin de collaboration multiplateforme"],
      avoidIf: ["Tu démarres un nouveau projet ou une nouvelle équipe — Figma est devenu le standard", "Tu as besoin de collaborer avec des utilisateurs Windows ou en ligne facilement"],
      threshold: "Cohérent pour une équipe déjà investie ; pour un nouveau projet, Figma est aujourd'hui le choix par défaut.",
    },
    verdictEn: {
      keepIf: ["Your team is already on Sketch with an established design system", "You work exclusively on Mac with no need for cross-platform collaboration"],
      avoidIf: ["You're starting a new project or team — Figma has become the standard", "You need to easily collaborate with Windows users or online"],
      threshold: "Consistent for a team already invested; for a new project, Figma is the default choice today.",
    },
  },
};

let updated = 0;
for (const [slug, fields] of Object.entries(UPDATES)) {
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  if (!tool) { console.warn(`⚠️  ${slug} not found`); continue; }
  for (const [key, value] of Object.entries(fields)) tool[key] = value;
  if (fields.longDescription) tool.description = fields.longDescription;
  updated++;
  console.log(`✓ ${tool.name} (${slug}) filled`);
}
writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated}/${Object.keys(UPDATES).length} fiches filled.`);
