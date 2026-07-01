/** add-ai-angle-video-email.mjs — aiAngle sur vidéo (4) et email/marketing (5). */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const A = {
  // --- Vidéo ---
  "adobe-premiere-pro": {
    stance: "augmente",
    augmentFr: "Premiere Pro a ajouté la génération vidéo IA (Firefly) directement dans la timeline : extension de plan, remplissage génératif d'objet, et la fonction Text-Based Editing qui monte depuis la transcription. Pour des coupes rapides pilotées par le texte, Descript reste plus simple.",
    augmentEn: "Premiere Pro added AI video generation (Firefly) right in the timeline: shot extension, generative object fill, and Text-Based Editing that cuts from the transcript. For quick text-driven cuts, Descript stays simpler.",
    replaceFr: "Remplacer Premiere par une IA ? Non pour un montage pro multicouche avec étalonnage, mixage et export broadcast : c'est un niveau de contrôle qu'aucune IA ne fournit. Les IA vidéo (Runway, Kling) génèrent des plans depuis zéro, ce qui est un usage différent du montage. Verdict : l'IA s'intègre dans Premiere, elle ne le remplace pas pour un montage sérieux.",
    replaceEn: "Replace Premiere with an AI? No for pro multi-layer editing with grading, mixing and broadcast export: that's a level of control no AI provides. Video AIs (Runway, Kling) generate shots from scratch, a different use case from editing. Verdict: AI integrates into Premiere, it doesn't replace it for serious editing.",
    aiTools: ["runway", "kling-ai", "descript"],
  },
  "davinci-resolve": {
    stance: "augmente",
    augmentFr: "Resolve intègre déjà de l'IA (détection de scène, masquage de visage automatique, recadrage intelligent), gratuitement pour l'essentiel. Pour générer un plan qui n'existe pas, des IA vidéo comme Runway ou Kling produisent du contenu à importer ensuite dans le montage.",
    augmentEn: "Resolve already integrates AI (scene detection, automatic face masking, smart reframe), free for most of it. To generate a shot that doesn't exist, video AIs like Runway or Kling produce content to import into the edit afterward.",
    replaceFr: "Remplacer Resolve par une IA ? Non : c'est un outil de montage, étalonnage et mixage complet et gratuit, ce qu'aucune IA générative ne propose. L'IA vidéo crée du contenu brut, Resolve le monte et le finalise. Verdict : complémentaires, et le fait que Resolve soit gratuit rend la question presque sans objet.",
    replaceEn: "Replace Resolve with an AI? No: it's a complete and free editing, grading and mixing tool, which no generative AI offers. Video AI creates raw content, Resolve edits and finalizes it. Verdict: complementary, and the fact that Resolve is free makes the question almost moot.",
    aiTools: ["runway", "kling-ai"],
  },
  "capcut": {
    stance: "challenge",
    augmentFr: "CapCut a été l'un des premiers à intégrer l'IA en masse : sous-titres auto, suppression de fond, extension d'image, et même de la génération de clips. C'est un argument de vente central de l'app, pas un module à part.",
    augmentEn: "CapCut was one of the first to integrate AI at scale: auto captions, background removal, image extension, and even clip generation. It's a central selling point of the app, not a separate module.",
    replaceFr: "Remplacer CapCut par une IA ? Une partie de son usage (montage vertical rapide pour les réseaux) est de plus en plus couvert par des IA de montage automatique qui font le travail à la place de l'utilisateur (Opus Clip, par exemple, pour extraire des clips viraux depuis une longue vidéo). Verdict : challengé sur le montage automatisé pur, encore utile pour le contrôle créatif fin.",
    replaceEn: "Replace CapCut with an AI? Part of its use case (fast vertical editing for social) is increasingly covered by automatic editing AIs that do the work for the user (Opus Clip, for instance, to extract viral clips from a long video). Verdict: challenged on pure automated editing, still useful for fine creative control.",
    aiTools: ["opus-clip"],
  },
  "riverside": {
    stance: "augmente",
    augmentFr: "Riverside enregistre en local haute qualité et ajoute une couche IA : transcription, suppression des silences, et génération de clips courts pour les réseaux à partir d'un long enregistrement.",
    augmentEn: "Riverside records locally in high quality and adds an AI layer: transcription, silence removal, and short clip generation for social from a long recording.",
    replaceFr: "Remplacer Riverside par une IA ? Non pour l'enregistrement à distance haute fidélité (chaque participant enregistre en local, sans dépendre de la connexion) : c'est un problème technique que l'IA ne résout pas. Pour la découpe de clips ensuite, des outils dédiés comme Opus Clip font une partie du travail. Verdict : l'enregistrement reste son coeur de métier, l'IA gère l'après.",
    replaceEn: "Replace Riverside with an AI? No for high-fidelity remote recording (each participant records locally, independent of connection quality): that's a technical problem AI doesn't solve. For clipping afterward, dedicated tools like Opus Clip do part of the work. Verdict: recording stays its core job, AI handles what comes after.",
    aiTools: ["opus-clip"],
  },
  // --- Email / marketing ---
  "mailchimp": {
    stance: "augmente",
    augmentFr: "Mailchimp a ajouté un générateur de contenu IA pour rédiger des emails et suggérer des sujets, plus une optimisation d'envoi automatique. Ça aide à démarrer une campagne, sans changer le coeur du produit : la délivrabilité et la segmentation.",
    augmentEn: "Mailchimp added an AI content generator to write emails and suggest subject lines, plus automatic send-time optimization. It helps kickstart a campaign, without changing the core product: deliverability and segmentation.",
    replaceFr: "Remplacer Mailchimp par une IA ? Non : ChatGPT peut rédiger le texte d'un email, mais pas gérer une liste de contacts, la délivrabilité, les automatisations et la conformité RGPD. Verdict : l'IA aide à écrire plus vite, l'infrastructure email reste indispensable.",
    replaceEn: "Replace Mailchimp with an AI? No: ChatGPT can write an email's copy, but not manage a contact list, deliverability, automations and GDPR compliance. Verdict: AI helps write faster, the email infrastructure stays essential.",
    aiTools: ["chatgpt"],
  },
  "klaviyo": {
    stance: "augmente",
    augmentFr: "Klaviyo mise sur l'IA pour la segmentation prédictive (qui va acheter, qui va se désabonner) et la génération de contenu d'email à partir d'un prompt. C'est un atout e-commerce qui s'appuie sur les données déjà collectées.",
    augmentEn: "Klaviyo bets on AI for predictive segmentation (who will buy, who will churn) and email content generation from a prompt. It's an e-commerce edge that relies on data already collected.",
    replaceFr: "Remplacer Klaviyo par une IA ? Non : l'IA prédictive de Klaviyo dépend de son intégration profonde aux données e-commerce (Shopify, historique d'achat), ce qu'une IA généraliste n'a pas accès. Verdict : l'IA renforce Klaviyo via ses propres données, elle ne le rend pas remplaçable.",
    replaceEn: "Replace Klaviyo with an AI? No: Klaviyo's predictive AI depends on its deep integration with e-commerce data (Shopify, purchase history), which a general AI doesn't have access to. Verdict: AI strengthens Klaviyo through its own data, it doesn't make it replaceable.",
    aiTools: ["chatgpt"],
  },
  "activecampaign": {
    stance: "augmente",
    augmentFr: "ActiveCampaign a ajouté la génération de contenu IA et des suggestions d'automatisation. Comme chez ses concurrents, ça facilite la prise en main sans changer le coeur du produit : les parcours d'automatisation marketing.",
    augmentEn: "ActiveCampaign added AI content generation and automation suggestions. Like its competitors, it eases onboarding without changing the core product: marketing automation journeys.",
    replaceFr: "Remplacer ActiveCampaign par une IA ? Non : construire des parcours d'automatisation conditionnels reliés à un CRM est un travail de configuration, pas de génération de texte. Verdict : l'IA aide à rédiger, l'automatisation reste le vrai produit.",
    replaceEn: "Replace ActiveCampaign with an AI? No: building conditional automation journeys tied to a CRM is configuration work, not text generation. Verdict: AI helps write, automation remains the real product.",
    aiTools: ["chatgpt"],
  },
  "brevo": {
    stance: "augmente",
    augmentFr: "Brevo a ajouté un assistant IA pour générer des emails et des SMS à partir d'un brief. C'est utile pour démarrer vite, surtout pour une petite équipe sans rédacteur dédié.",
    augmentEn: "Brevo added an AI assistant to generate emails and SMS from a brief. Useful to get started fast, especially for a small team with no dedicated copywriter.",
    replaceFr: "Remplacer Brevo par une IA ? Non : la plateforme gère l'envoi, la délivrabilité, le CRM et le multicanal (email, SMS, WhatsApp), ce qu'une IA de rédaction ne couvre pas. Verdict : l'IA écrit, Brevo envoie et orchestre.",
    replaceEn: "Replace Brevo with an AI? No: the platform handles sending, deliverability, CRM and multichannel (email, SMS, WhatsApp), which a writing AI doesn't cover. Verdict: AI writes, Brevo sends and orchestrates.",
    aiTools: ["chatgpt"],
  },
  "hubspot": {
    stance: "augmente",
    augmentFr: "HubSpot a déployé Breeze, son IA transverse qui rédige du contenu, résume des fiches contact et automatise des tâches CRM. Pour aller plus loin sur la rédaction pure, un ChatGPT ou Claude en complément reste plus flexible.",
    augmentEn: "HubSpot rolled out Breeze, its cross-product AI that writes content, summarizes contact records and automates CRM tasks. To go further on pure writing, a complementary ChatGPT or Claude stays more flexible.",
    replaceFr: "Remplacer HubSpot par une IA ? Non : c'est une plateforme CRM, marketing et support intégrée, pas un générateur de texte. L'IA y ajoute une couche d'assistance utile, mais la valeur reste dans la donnée centralisée et les automatisations qui en découlent. Verdict : l'IA augmente HubSpot sans le remplacer.",
    replaceEn: "Replace HubSpot with an AI? No: it's an integrated CRM, marketing and support platform, not a text generator. AI adds a useful assistance layer, but the value stays in centralized data and the automations built on it. Verdict: AI augments HubSpot without replacing it.",
    aiTools: ["chatgpt", "claude"],
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
console.log(`aiAngle (vidéo + email) sur ${n} fiches | JSON OK`);
