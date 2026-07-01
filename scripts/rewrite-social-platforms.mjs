/** rewrite-social-platforms.mjs — Instagram, LinkedIn, YouTube Studio, Twitch.
 * Cadrage différent des SaaS classiques : plateformes gratuites, l'angle utile
 * pour un freelance/créateur est "qu'est-ce qui coûte vraiment" (Premium,
 * Sales Navigator, seuils de monétisation) plutôt qu'une grille tarifaire. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const A = {
  "instagram": {
    shortDescription: "Réseau social visuel gratuit ; les coûts réels viennent de la pub et des outils tiers, pas de la plateforme.",
    shortDescriptionEn: "Free visual social network; the real costs come from ads and third-party tools, not the platform itself.",
    pricing: { free: "Gratuit, sans limite de publications ni de followers.", paid: "Aucun abonnement Instagram natif. Le coût vient de la pub (Meta Ads, budget libre) ou d'outils tiers de gestion/planification (Buffer, Later...)." },
    pricingEn: { free: "Free, no limit on posts or followers.", paid: "No native Instagram subscription. Cost comes from ads (Meta Ads, flexible budget) or third-party scheduling/management tools (Buffer, Later...)." },
    defaultMonthlyPrice: 0,
    longDescription: "Instagram est entièrement gratuit à utiliser, pour un compte personnel comme professionnel. Ce qui coûte de l'argent, ce sont les deux choses qu'on ajoute autour : la publicité (Meta Ads, budget libre, à partir de quelques euros par jour) pour gagner en visibilité au-delà de la portée organique, et les outils tiers de planification ou d'analytics (Buffer, Later, Hootsuite) pour gérer plusieurs comptes ou automatiser la publication.\n\nPour un créateur ou un freelance, Instagram reste avant tout un canal de visibilité et de portfolio visuel (avant/après, coulisses, preuve sociale), pas un outil qu'on paie. Le vrai coût caché, c'est le temps de création de contenu, pas l'abonnement.",
    longDescriptionEn: "Instagram is completely free to use, for a personal account as well as a professional one. What costs money are the two things added around it: advertising (Meta Ads, flexible budget, starting from a few euros a day) to gain visibility beyond organic reach, and third-party scheduling or analytics tools (Buffer, Later, Hootsuite) to manage multiple accounts or automate posting.\n\nFor a creator or freelancer, Instagram remains primarily a visibility and visual portfolio channel (before/after, behind the scenes, social proof), not a tool you pay for. The real hidden cost is content creation time, not a subscription.",
    verdict: {
      keepIf: ["Ton activité a un volet visuel (design, photo, artisanat, mode) où le portfolio public compte", "Tu veux de la preuve sociale gratuite avant de payer pour de la pub"],
      avoidIf: ["Ton activité n'a rien de visuel à montrer : le temps investi ne sera pas rentable sans contenu pertinent"],
      threshold: "Gratuit et pertinent dès que l'activité a un volet visuel. Le budget à prévoir, c'est le temps de création, pas un abonnement.",
    },
    verdictEn: {
      keepIf: ["Your business has a visual side (design, photography, craft, fashion) where a public portfolio matters", "You want free social proof before paying for ads"],
      avoidIf: ["Your business has nothing visual to show: the time invested won't pay off without relevant content"],
      threshold: "Free and worth it as soon as the business has a visual side. The budget to plan for is creation time, not a subscription.",
    },
    pros: ["100% gratuit, aucune limite de publication", "Excellent pour un portfolio visuel et la preuve sociale", "Pub à budget libre, dès quelques euros par jour"],
    prosEn: ["100% free, no posting limit", "Excellent for a visual portfolio and social proof", "Flexible-budget ads, starting from a few euros a day"],
    cons: ["Portée organique limitée sans contenu régulier ou pub", "Algorithme changeant qui demande un suivi constant", "Gestion multi-comptes nécessite un outil tiers payant"],
    consEn: ["Limited organic reach without regular content or ads", "Ever-changing algorithm that requires constant attention", "Multi-account management requires a paid third-party tool"],
    useCases: ["Construire un portfolio visuel public (avant/après, réalisations)", "Générer de la preuve sociale et de la confiance auprès de prospects", "Faire de la publicité ciblée à petit budget (Meta Ads)"],
    useCasesEn: ["Build a public visual portfolio (before/after, work samples)", "Generate social proof and trust with prospects", "Run targeted advertising on a small budget (Meta Ads)"],
    alternatives: ["tiktok", "linkedin"],
  },
  "linkedin": {
    shortDescription: "Réseau pro gratuit ; Premium Business à 60$/mois, Sales Navigator dès 120$/mois.",
    shortDescriptionEn: "Free professional network; Premium Business at $60/month, Sales Navigator from $120/month.",
    pricing: { free: "Gratuit : profil, posts, messages, recherche de base.", paid: "Premium Business 59,99$/mois ; Premium All-in-One 99$/mois. Sales Navigator Core 119,99$/mois (~90$ en annuel) ; Advanced 159,99$/mois ; Advanced Plus sur devis (~1600$/an)." },
    pricingEn: { free: "Free: profile, posts, messages, basic search.", paid: "Premium Business $59.99/month; Premium All-in-One $99/month. Sales Navigator Core $119.99/month (~$90 annual); Advanced $159.99/month; Advanced Plus custom quote (~$1,600/year)." },
    defaultMonthlyPrice: 0,
    longDescription: "LinkedIn est gratuit pour l'usage de base : profil, publications, messages, recherche limitée. Pour un freelance qui fait de la prospection ou de la veille pro, le gratuit suffit souvent largement, surtout si l'activité repose sur le contenu (posts réguliers) plutôt que sur la prospection active en masse.\n\nLes paliers payants ciblent des besoins précis : Premium Business (59,99$/mois) lève les limites de recherche et ajoute des insights sur qui consulte ton profil. Sales Navigator (à partir de 119,99$/mois, ou environ 90$ en annuel) est pensé pour la prospection commerciale intensive, avec des filtres de recherche avancés et le suivi de comptes ciblés. C'est un budget qui ne se justifie que si LinkedIn est un canal d'acquisition client central, pas un usage occasionnel.",
    longDescriptionEn: "LinkedIn is free for basic use: profile, posts, messages, limited search. For a freelancer doing networking or professional research, the free plan is often more than enough, especially if the activity relies on content (regular posts) rather than active mass prospecting.\n\nPaid tiers target specific needs: Premium Business ($59.99/month) lifts search limits and adds insights on who views your profile. Sales Navigator (starting at $119.99/month, or about $90 annual) is built for intensive sales prospecting, with advanced search filters and tracking of targeted accounts. It's a budget that only makes sense if LinkedIn is a central client-acquisition channel, not occasional use.",
    verdict: {
      keepIf: ["Ton acquisition client repose sur le contenu LinkedIn (posts réguliers) : le gratuit suffit", "Tu fais de la prospection commerciale intensive et ciblée : Sales Navigator se justifie"],
      avoidIf: ["Tu utilises LinkedIn occasionnellement : aucun palier payant ne se justifie", "Tu veux juste lever les limites de recherche de temps en temps : le coût de Premium est élevé pour un usage ponctuel"],
      threshold: "Le gratuit couvre la plupart des usages de contenu/réseau. Sales Navigator (dès 120$/mois) ne se justifie que si LinkedIn est un canal d'acquisition central et actif.",
    },
    verdictEn: {
      keepIf: ["Your client acquisition relies on LinkedIn content (regular posts): free is enough", "You do intensive, targeted sales prospecting: Sales Navigator earns its place"],
      avoidIf: ["You use LinkedIn occasionally: no paid tier is worth it", "You just want to lift search limits now and then: Premium's cost is high for occasional use"],
      threshold: "Free covers most content/networking use cases. Sales Navigator (from $120/month) only makes sense if LinkedIn is a central, active acquisition channel.",
    },
    pros: ["Gratuit et suffisant pour la plupart des usages de contenu/réseau", "Sales Navigator très puissant pour la prospection ciblée", "Crédibilité professionnelle reconnue, utile pour la confiance client"],
    prosEn: ["Free and enough for most content/networking use cases", "Sales Navigator very powerful for targeted prospecting", "Recognized professional credibility, useful for client trust"],
    cons: ["Sales Navigator coûteux pour un usage occasionnel", "Premium Business apporte peu si l'activité repose sur le contenu plutôt que la prospection", "Tarifs Advanced Plus opaques, sur devis uniquement"],
    consEn: ["Sales Navigator expensive for occasional use", "Premium Business adds little if the activity relies on content rather than prospecting", "Advanced Plus pricing opaque, quote-only"],
    useCases: ["Publier du contenu pro régulier pour générer des leads entrants", "Prospecter des comptes ciblés avec des filtres avancés (Sales Navigator)", "Construire une crédibilité professionnelle visible par les prospects"],
    useCasesEn: ["Publish regular professional content to generate inbound leads", "Prospect targeted accounts with advanced filters (Sales Navigator)", "Build professional credibility visible to prospects"],
    alternatives: [],
  },
  "youtube-studio": {
    shortDescription: "Outil de gestion de chaîne YouTube, gratuit ; la monétisation a ses propres seuils.",
    shortDescriptionEn: "Free YouTube channel management tool; monetization has its own thresholds.",
    pricing: { free: "Gratuit, sans limite. Pas un abonnement : c'est l'interface de gestion de la chaîne YouTube.", paid: "Pas de version payante de YouTube Studio lui-même. La monétisation (Partner Program) dépend de seuils d'audience, pas d'un paiement." },
    pricingEn: { free: "Free, no limit. Not a subscription: it's YouTube's channel management interface.", paid: "No paid version of YouTube Studio itself. Monetization (Partner Program) depends on audience thresholds, not a payment." },
    defaultMonthlyPrice: 0,
    longDescription: "YouTube Studio est l'interface gratuite de gestion d'une chaîne YouTube : upload, analytics, miniatures, gestion des commentaires. Il n'y a rien à payer pour l'utiliser, quelle que soit la taille de la chaîne.\n\nLe vrai sujet pour un créateur, c'est la monétisation, qui se débloque par paliers d'audience et non par abonnement. Depuis 2026, un premier palier (500 abonnés, 3 vidéos publiques, 3000 heures de visionnage sur 90 jours, ou 3 millions de vues Shorts) donne accès aux pourboires et au shopping. Le plein accès à la pub (Partner Program complet) demande 1000 abonnés et 4000 heures de visionnage valides sur 12 mois, ou 10 millions de vues Shorts sur 90 jours. YouTube durcit aussi sa politique contre le contenu généré par IA de façon non transparente (scripts IA, voix off sur images d'archive) en 2026.",
    longDescriptionEn: "YouTube Studio is the free interface for managing a YouTube channel: upload, analytics, thumbnails, comment management. There's nothing to pay to use it, regardless of channel size.\n\nThe real subject for a creator is monetization, which unlocks through audience tiers rather than a subscription. Since 2026, a first tier (500 subscribers, 3 public videos, 3,000 watch hours in 90 days, or 3 million Shorts views) grants access to tipping and shopping features. Full ad access (complete Partner Program) requires 1,000 subscribers and 4,000 valid watch hours over 12 months, or 10 million Shorts views in 90 days. YouTube is also tightening its policy in 2026 against non-transparent AI-generated content (AI scripts, voiceovers over stock footage).",
    verdict: {
      keepIf: ["Tu publies du contenu vidéo régulièrement : l'outil est gratuit et complet", "Tu vises la monétisation : connaître les seuils précis évite de viser au hasard"],
      avoidIf: ["Tu cherches un outil de montage ou de miniatures avancé : YouTube Studio gère la chaîne, pas la production"],
      threshold: "Gratuit et incontournable pour gérer une chaîne. La vraie question est d'atteindre les seuils de monétisation (1000 abonnés + 4000h, ou les Shorts), pas de payer un outil.",
    },
    verdictEn: {
      keepIf: ["You publish video content regularly: the tool is free and complete", "You're aiming for monetization: knowing the exact thresholds avoids guessing blind"],
      avoidIf: ["You're looking for advanced editing or thumbnail tools: YouTube Studio manages the channel, not production"],
      threshold: "Free and essential for managing a channel. The real question is reaching monetization thresholds (1,000 subscribers + 4,000h, or Shorts), not paying for a tool.",
    },
    pros: ["100% gratuit, quelle que soit la taille de la chaîne", "Analytics détaillées incluses", "Premier palier de monétisation accessible dès 500 abonnés depuis 2026"],
    prosEn: ["100% free, regardless of channel size", "Detailed analytics included", "First monetization tier accessible from 500 subscribers since 2026"],
    cons: ["Pas d'outil de montage avancé intégré", "Seuils de monétisation à atteindre, pas garantis par l'usage de l'outil", "Politique anti-IA non transparente plus stricte en 2026, à surveiller"],
    consEn: ["No advanced editing tool built in", "Monetization thresholds to reach, not guaranteed by using the tool", "Stricter anti-non-transparent-AI policy in 2026, worth watching"],
    useCases: ["Gérer l'upload, les miniatures et les métadonnées d'une chaîne", "Suivre les analytics pour comprendre ce qui fonctionne", "Atteindre les seuils de monétisation (abonnés, heures de visionnage)"],
    useCasesEn: ["Manage upload, thumbnails and metadata for a channel", "Track analytics to understand what's working", "Reach monetization thresholds (subscribers, watch hours)"],
    alternatives: ["twitch", "tiktok"],
  },
  "twitch": {
    shortDescription: "Streaming live gratuit ; Affiliate dès 25 followers, Partner par révision manuelle.",
    shortDescriptionEn: "Free live streaming; Affiliate from 25 followers, Partner by manual review.",
    pricing: { free: "Gratuit pour streamer et regarder, sans limite.", paid: "Pas d'abonnement Twitch pour streamer. La monétisation se débloque par statut : Affiliate (automatique dès les seuils atteints) puis Partner (sur validation manuelle), avec un partage de revenus sur les abonnements et les bits." },
    pricingEn: { free: "Free to stream and watch, no limit.", paid: "No Twitch subscription to stream. Monetization unlocks by status: Affiliate (automatic once thresholds are met) then Partner (manual approval), with revenue sharing on subscriptions and bits." },
    defaultMonthlyPrice: 0,
    longDescription: "Twitch est gratuit pour streamer comme pour regarder. La monétisation suit deux paliers de statut, pas un abonnement : Affiliate, accessible automatiquement dès 25 followers, 4 heures de stream, 4 jours de diffusion et 3 viewers moyens sur une fenêtre de 30 jours (seuil assoupli en 2025, contre 50 followers/500 minutes/7 jours auparavant). La plupart des streamers réguliers l'obtiennent en 4 à 12 semaines.\n\nPartner demande beaucoup plus : 75 heures, 25 jours et 75 viewers moyens sur 30 jours, plus une validation manuelle par l'équipe Twitch qui regarde la régularité (30+ jours de chiffres stables) et l'engagement communautaire, pas juste les chiffres bruts. Les Affiliates touchent un partage à 50/50 sur les abonnements ; les Partners peuvent négocier jusqu'à 70/30 en leur faveur.",
    longDescriptionEn: "Twitch is free to stream as well as to watch. Monetization follows two status tiers, not a subscription: Affiliate, automatically accessible from 25 followers, 4 hours streamed, 4 broadcast days and 3 average viewers over a 30-day window (eased in 2025, down from 50 followers/500 minutes/7 days before). Most regular streamers reach it in 4 to 12 weeks.\n\nPartner requires much more: 75 hours, 25 days and 75 average viewers over 30 days, plus manual approval from Twitch's team that looks at consistency (30+ days of steady numbers) and community engagement, not just raw numbers. Affiliates get a 50/50 split on subscriptions; Partners can negotiate up to 70/30 in their favor.",
    verdict: {
      keepIf: ["Tu streames régulièrement (plusieurs fois par semaine) : Affiliate est atteignable en quelques semaines", "Tu veux monétiser sans payer d'abonnement : le modèle est entièrement basé sur l'audience"],
      avoidIf: ["Tu streames ponctuellement : les seuils, même assouplis, demandent une vraie régularité"],
      threshold: "Gratuit, et Affiliate est devenu accessible rapidement depuis 2025 (25 followers). Partner reste exigeant et soumis à validation manuelle.",
    },
    verdictEn: {
      keepIf: ["You stream regularly (several times a week): Affiliate is reachable within a few weeks", "You want to monetize with no subscription: the model is entirely audience-based"],
      avoidIf: ["You stream occasionally: the thresholds, even eased, require real consistency"],
      threshold: "Free, and Affiliate has become quickly accessible since 2025 (25 followers). Partner remains demanding and subject to manual review.",
    },
    pros: ["Gratuit pour streamer et regarder", "Seuil Affiliate assoupli en 2025, atteignable en quelques semaines", "Partage de revenus négociable jusqu'à 70/30 au statut Partner"],
    prosEn: ["Free to stream and watch", "Affiliate threshold eased in 2025, reachable within weeks", "Revenue split negotiable up to 70/30 at Partner status"],
    cons: ["Statut Partner soumis à validation manuelle, pas garanti même en atteignant les chiffres", "Revenus dépendent entièrement de l'audience, pas d'un abonnement prévisible"],
    consEn: ["Partner status subject to manual review, not guaranteed even when hitting the numbers", "Revenue depends entirely on audience, not a predictable subscription"],
    useCases: ["Streamer en direct pour bâtir une communauté", "Monétiser via les abonnements et les bits une fois Affiliate atteint", "Viser le statut Partner pour un meilleur partage de revenus"],
    useCasesEn: ["Stream live to build a community", "Monetize via subscriptions and bits once Affiliate is reached", "Aim for Partner status for a better revenue split"],
    alternatives: ["youtube-studio", "tiktok"],
  },
};

const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));
let n = 0;
for (const x of tools) {
  const slug = x.slug || x.id;
  if (!A[slug]) continue;
  const fix = A[slug];
  Object.assign(x, fix);
  x.alternatives = (fix.alternatives || []).filter((s) => present.has(s));
  n++;
}
const out = JSON.stringify(tools, null, 2) + "\n";
JSON.parse(out);
writeFileSync(PATH, out);
console.log(`Réécriture plateformes sociales : ${n}/4 fiches | JSON OK`);
