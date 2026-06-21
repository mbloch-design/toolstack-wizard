/** rewrite-communication-stubs-2.mjs — 4 autres stubs communication.
 * Around : fait discontinué (fermé le 31 mars 2025 après son rachat par Miro),
 * absent du stub d'origine, point capital pour ne pas recommander un outil mort. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const A = {
  "lusha": {
    shortDescription: "Base de contacts B2B (emails, téléphones) à crédits, dès 37,45$/mois.",
    shortDescriptionEn: "B2B contact database (emails, phones) on credits, from $37.45/month.",
    pricing: { free: "40 crédits/mois, 1 utilisateur.", paid: "Starter 37,45$/mois/utilisateur (4800 crédits/an) ; Pro 52 à 175$/mois selon volume ; Premium 300 à 660$/mois. 1 crédit = 1 email, 10 crédits = 1 téléphone (doublé depuis mi-2026, contre 5 avant)." },
    pricingEn: { free: "40 credits/month, 1 user.", paid: "Starter $37.45/month/user (4,800 credits/year); Pro $52-175/month depending on volume; Premium $300-660/month. 1 credit = 1 email, 10 credits = 1 phone number (doubled since mid-2026, from 5 before)." },
    defaultMonthlyPrice: 37,
    longDescription: "Lusha trouve des coordonnées B2B (email, téléphone direct) à partir d'un profil LinkedIn ou d'un nom d'entreprise, pour de la prospection commerciale. Le fonctionnement est à crédits : 1 crédit pour un email, 10 crédits pour un numéro de téléphone direct.\n\nLe point à connaître pour 2026 : le coût d'un numéro de téléphone a doublé (10 crédits au lieu de 5 auparavant), ce qui change sérieusement le calcul si ton usage repose sur les appels à froid plutôt que l'email. Une équipe qui budgétait sur les anciens tarifs peut se retrouver à consommer 60-80% de crédits en plus que prévu. Le plan gratuit (40 crédits/mois) permet de tester ; au-delà, Starter (37,45$/mois) couvre un usage solo modéré.",
    longDescriptionEn: "Lusha finds B2B contact info (email, direct phone) from a LinkedIn profile or company name, for sales prospecting. It works on credits: 1 credit for an email, 10 credits for a direct phone number.\n\nThe thing to know for 2026: the cost of a phone number doubled (10 credits instead of 5 before), which seriously changes the math if your usage relies on cold calling rather than email. A team budgeting on last year's rates can end up burning 60-80% more credits than expected. The free plan (40 credits/month) lets you test it; beyond that, Starter ($37.45/month) covers moderate solo use.",
    verdict: {
      keepIf: ["Ta prospection repose surtout sur l'email, où le coût en crédits reste stable", "Tu veux tester avant de t'engager : le plan gratuit (40 crédits) suffit pour évaluer"],
      avoidIf: ["Ta prospection repose beaucoup sur l'appel à froid : le doublement du coût des numéros de téléphone en 2026 change fortement la rentabilité"],
      threshold: "Refais le calcul de coût avec les nouveaux tarifs 2026 (10 crédits/téléphone) avant de t'engager sur un usage intensif d'appels.",
    },
    verdictEn: {
      keepIf: ["Your prospecting relies mostly on email, where the credit cost stays stable", "You want to test before committing: the free plan (40 credits) is enough to evaluate"],
      avoidIf: ["Your prospecting relies heavily on cold calling: the 2026 doubling of phone number costs significantly changes the math"],
      threshold: "Redo the cost calculation with the new 2026 rates (10 credits/phone) before committing to heavy calling use.",
    },
    pros: ["Trouve emails et téléphones directs depuis LinkedIn", "Plan gratuit pour tester (40 crédits/mois)", "Intégrations Salesforce/HubSpot sur les plans Scale"],
    prosEn: ["Finds emails and direct phone numbers from LinkedIn", "Free plan to test (40 credits/month)", "Salesforce/HubSpot integrations on Scale plans"],
    cons: ["Coût des numéros de téléphone doublé en 2026 (10 crédits au lieu de 5)", "Système de crédits qui peut vite devenir cher en usage intensif", "Intégrations CRM complètes réservées au plan Scale, sur devis"],
    consEn: ["Phone number cost doubled in 2026 (10 credits instead of 5)", "Credit system that can get expensive fast on heavy use", "Full CRM integrations reserved for the custom-priced Scale plan"],
    useCases: ["Trouver l'email ou le téléphone direct d'un prospect B2B depuis LinkedIn", "Enrichir une liste de prospection avec des coordonnées vérifiées", "Synchroniser les contacts trouvés avec un CRM (Salesforce, HubSpot)"],
    useCasesEn: ["Find a B2B prospect's email or direct phone from LinkedIn", "Enrich a prospecting list with verified contact info", "Sync found contacts with a CRM (Salesforce, HubSpot)"],
    alternatives: [],
  },
  "slido": {
    shortDescription: "Sondages et Q&A en direct pour réunions et événements, gratuit jusqu'à 100 participants.",
    shortDescriptionEn: "Live polls and Q&A for meetings and events, free up to 100 participants.",
    pricing: { free: "Jusqu'à 100 participants, sondages, Q&A, nuages de mots, quiz.", paid: "Plans payants selon le nombre de participants et les besoins de marque/analytics ; les tarifs varient fortement selon la taille d'événement, à vérifier sur devis pour un usage au-delà de 100 participants." },
    pricingEn: { free: "Up to 100 participants, polls, Q&A, word clouds, quizzes.", paid: "Paid plans scale with participant count and branding/analytics needs; rates vary significantly by event size, worth requesting a quote beyond 100 participants." },
    defaultMonthlyPrice: 0,
    longDescription: "Slido ajoute des sondages en direct, des questions-réponses et des nuages de mots à une réunion ou un événement, utilisable en visio comme en présentiel. Le plan gratuit couvre jusqu'à 100 participants avec l'essentiel des fonctionnalités (sondages, Q&A, quiz), ce qui suffit pour une réunion d'équipe ou un petit événement.\n\nAu-delà de 100 participants, ou pour de la personnalisation de marque et des analytics avancées, il faut passer à un plan payant. Les tarifs annoncés varient fortement selon la source (de quelques dizaines à plusieurs centaines de dollars par mois) car ils dépendent du volume de participants et des fonctionnalités entreprise : mieux vaut demander un devis précis selon la taille réelle de tes événements plutôt que se fier à un chiffre générique.",
    longDescriptionEn: "Slido adds live polls, Q&A and word clouds to a meeting or event, usable in video calls as well as in person. The free plan covers up to 100 participants with the essentials (polls, Q&A, quizzes), enough for a team meeting or small event.\n\nBeyond 100 participants, or for brand customization and advanced analytics, you need a paid plan. Quoted rates vary widely by source (from a few tens to several hundred dollars per month) because they depend on participant volume and enterprise features: better to request a precise quote based on your actual event size than rely on a generic figure.",
    verdict: {
      keepIf: ["Tes réunions ou événements restent sous 100 participants : le gratuit couvre déjà tout", "Tu veux du Q&A et des sondages en direct sans configuration lourde"],
      avoidIf: ["Tu organises des événements de grande envergure avec marque personnalisée : demande un devis précis, les tarifs annoncés en ligne sont peu fiables"],
      threshold: "Excellent et gratuit jusqu'à 100 participants. Au-delà, le coût dépend trop du volume pour donner un chiffre fiable sans devis.",
    },
    verdictEn: {
      keepIf: ["Your meetings or events stay under 100 participants: free already covers everything", "You want live Q&A and polls with no heavy setup"],
      avoidIf: ["You organize large-scale branded events: request a precise quote, online quoted rates aren't reliable"],
      threshold: "Excellent and free up to 100 participants. Beyond that, cost depends too much on volume to give a reliable figure without a quote.",
    },
    pros: ["Gratuit et complet jusqu'à 100 participants", "Fonctionne en visio comme en présentiel", "Mise en place rapide, sans formation nécessaire"],
    prosEn: ["Free and complete up to 100 participants", "Works in video calls as well as in person", "Quick setup, no training needed"],
    cons: ["Tarifs payants peu transparents en ligne, à vérifier sur devis", "Fonctionnalités de marque/analytics réservées aux plans payants"],
    consEn: ["Paid rates aren't transparent online, worth checking via quote", "Branding/analytics features reserved for paid plans"],
    useCases: ["Recueillir des questions du public pendant une présentation", "Faire des sondages en direct lors d'une réunion d'équipe", "Animer un événement avec quiz et nuages de mots"],
    useCasesEn: ["Collect audience questions during a presentation", "Run live polls during a team meeting", "Run an event with quizzes and word clouds"],
    alternatives: [],
  },
  "liinks": {
    shortDescription: "Page de liens bio personnalisable pour créateurs, dès 5$/mois.",
    shortDescriptionEn: "Customizable link-in-bio page for creators, from $5/month.",
    pricing: { free: "Création et test de la page gratuits avant de s'engager.", paid: "Starter 5$/mois : l'essentiel pour une page de liens. Pro 12$/mois : domaine personnalisé et gestion de plusieurs profils." },
    pricingEn: { free: "Free to build and test the page before committing.", paid: "Starter $5/month: the essentials for a link page. Pro $12/month: custom domain and multi-profile management." },
    defaultMonthlyPrice: 5,
    longDescription: "Liinks fait la même chose que Linktree (une page unique avec tous tes liens importants, pour la bio Instagram ou TikTok) mais avec un positionnement plus design, pensé pour les créateurs qui veulent une page qui ne ressemble pas à un template générique.\n\nStarter (5$/mois) couvre l'essentiel pour un créateur seul. Pro (12$/mois) ajoute un domaine personnalisé (pour ne pas avoir 'liinks.co' dans l'URL) et la gestion de plusieurs profils, utile pour une agence ou quelqu'un qui gère plusieurs marques personnelles. Tu peux construire et tester ta page gratuitement avant de payer, ce qui permet de juger le rendu avant de s'engager.",
    longDescriptionEn: "Liinks does the same thing as Linktree (a single page with all your important links, for your Instagram or TikTok bio) but with a more design-forward positioning, built for creators who want a page that doesn't look like a generic template.\n\nStarter ($5/month) covers the essentials for a solo creator. Pro ($12/month) adds a custom domain (so you don't have 'liinks.co' in the URL) and multi-profile management, useful for an agency or someone managing several personal brands. You can build and test your page for free before paying, which lets you judge the look before committing.",
    verdict: {
      keepIf: ["Tu veux une page de liens bio avec un design plus soigné qu'un template générique", "Tu gères plusieurs profils ou marques (Pro, 12$/mois)"],
      avoidIf: ["Le design ne t'importe pas : Linktree gratuit fait le strict nécessaire sans payer"],
      threshold: "Pertinent si le rendu visuel de ta page de liens compte pour ton image de marque. Sinon, une alternative gratuite suffit.",
    },
    verdictEn: {
      keepIf: ["You want a link-in-bio page with a more polished design than a generic template", "You manage several profiles or brands (Pro, $12/month)"],
      avoidIf: ["Design doesn't matter to you: free Linktree does the strict minimum with no payment"],
      threshold: "Worth it if your link page's visual look matters for your brand image. Otherwise, a free alternative is enough.",
    },
    pros: ["Design plus soigné que les templates génériques de liens bio", "Test gratuit avant de payer", "Domaine personnalisé et multi-profils sur Pro (12$/mois)"],
    prosEn: ["More polished design than generic link-in-bio templates", "Free test before paying", "Custom domain and multi-profile on Pro ($12/month)"],
    cons: ["Moins connu que Linktree, écosystème de templates plus restreint", "Pas de plan gratuit permanent au-delà du test"],
    consEn: ["Less known than Linktree, smaller template ecosystem", "No permanent free plan beyond the test"],
    useCases: ["Centraliser tous tes liens importants dans une bio Instagram ou TikTok", "Gérer plusieurs profils de marque depuis un seul compte (Pro)", "Personnaliser le design de sa page de liens au-delà d'un template générique"],
    useCasesEn: ["Centralize all your important links in an Instagram or TikTok bio", "Manage several brand profiles from one account (Pro)", "Customize your link page's design beyond a generic template"],
    alternatives: [],
  },
  "around": {
    shortDescription: "Appel vidéo nouvelle génération, fermé depuis le 31 mars 2025 après son rachat par Miro.",
    shortDescriptionEn: "Next-gen video calling, shut down on March 31, 2025 after being acquired by Miro.",
    pricing: { free: "Service arrêté.", paid: "" },
    pricingEn: { free: "Service discontinued.", paid: "" },
    defaultMonthlyPrice: 0,
    longDescription: "Around proposait un appel vidéo repensé : petites bulles flottantes plutôt que des fenêtres plein écran, suppression d'écho intelligente, collaboration en direct sur le bureau. Le point capital à connaître en 2026 : Around a fermé ses portes le 31 mars 2025, un peu plus d'un an après son rachat par Miro, qui a choisi d'intégrer certaines de ses fonctionnalités (la suppression d'écho, les réactions) dans ses propres outils de collaboration plutôt que de maintenir Around comme produit autonome.\n\nIl n'y a donc plus de tarification 2026 à fournir : le service n'existe plus. Pour qui cherchait l'expérience d'Around, Miro a repris certains éléments dans sa propre plateforme ; pour de l'appel vidéo classique, Zoom, Google Meet ou Microsoft Teams restent les choix actifs et maintenus.",
    longDescriptionEn: "Around offered a reimagined video call: small floating bubbles instead of full-screen windows, smart echo cancellation, live desktop collaboration. The key thing to know in 2026: Around shut down on March 31, 2025, just over a year after being acquired by Miro, which chose to fold some of its features (echo cancellation, reactions) into its own collaboration tools rather than keep Around running as a standalone product.\n\nSo there's no 2026 pricing to provide: the service no longer exists. For those who liked Around's experience, Miro carried over some elements into its own platform; for classic video calling, Zoom, Google Meet or Microsoft Teams remain the active, maintained choices.",
    verdict: {
      keepIf: [],
      avoidIf: ["Dans tous les cas : le service est fermé depuis le 31 mars 2025, il n'y a plus rien à utiliser"],
      threshold: "Service arrêté. Aucune raison de le chercher en 2026 : utilise Zoom, Google Meet, Microsoft Teams, ou Miro pour certaines fonctionnalités héritées.",
    },
    verdictEn: {
      keepIf: [],
      avoidIf: ["In every case: the service has been shut down since March 31, 2025, there's nothing left to use"],
      threshold: "Discontinued service. No reason to look for it in 2026: use Zoom, Google Meet, Microsoft Teams, or Miro for some inherited features.",
    },
    pros: [],
    prosEn: [],
    cons: ["Service fermé depuis le 31 mars 2025, plus aucun usage possible"],
    consEn: ["Service shut down since March 31, 2025, no longer usable"],
    useCases: [],
    useCasesEn: [],
    alternatives: ["zoom-pro", "google-meet"],
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
console.log(`Réécriture communication (lot 2) : ${n}/4 fiches | JSON OK`);
