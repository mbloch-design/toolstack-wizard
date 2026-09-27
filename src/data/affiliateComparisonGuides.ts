import type { ComparisonDecisionGuide } from './comparisonDecisionGuides';

// Existing official product assets; provenance is retained in the catalogue research.
export const comparisonVisuals: Record<string, { src: string; name: string }> = {
  'getresponse-vs-brevo': { src: '/tool-media/getresponse/overview.webp', name: 'GetResponse' },
  'engagebay-vs-hubspot': { src: '/tool-media/engagebay/official-1.webp', name: 'EngageBay' },
  'flexclip-vs-canva': { src: '/tool-media/flexclip/editor.webp', name: 'FlexClip' },
};

export const comparisonOffers: Record<string, { name: string; url: string; affiliated: boolean }[]> = {
  'getresponse-vs-brevo': [
    { name: 'GetResponse', url: 'https://try.getresponsetoday.com/k3g20w6hpboy', affiliated: true },
    { name: 'Brevo', url: 'https://get.brevo.com/k11w0iqmh2r0-m7y3c', affiliated: true },
  ],
  'engagebay-vs-hubspot': [
    { name: 'EngageBay', url: 'https://www.awin1.com/cread.php?awinmid=127075&awinaffid=2901291&clickref=tooltrim', affiliated: true },
    { name: 'HubSpot', url: 'https://www.hubspot.com/products/crm/starter', affiliated: false },
  ],
  'flexclip-vs-canva': [
    { name: 'FlexClip', url: 'https://tidd.ly/4hRTGb1', affiliated: true },
    { name: 'Canva', url: 'https://www.canva.com/video-editor/', affiliated: false },
  ],
};

const emailSources = [
  { label: 'GetResponse · Pricing', url: 'https://www.getresponse.com/pricing' },
  { label: 'Brevo · Plans', url: 'https://help.brevo.com/hc/fr/articles/208589409' },
];
const crmSources = [
  { label: 'EngageBay · All-in-One pricing', url: 'https://www.engagebay.com/pricing/all-in-one' },
  { label: 'HubSpot · Starter Customer Platform', url: 'https://www.hubspot.com/products/crm/starter' },
];
const videoSources = [
  { label: 'FlexClip · Pricing', url: 'https://www.flexclip.com/pricing.html' },
  { label: 'Canva · Video editor', url: 'https://www.canva.com/video-editor/' },
];

export const affiliateComparisonGuides: Record<string, Record<'fr' | 'en', ComparisonDecisionGuide>> = {
  'getresponse-vs-brevo': {
    fr: {
      checkedAt: '2026-09-27', scope: '',
      intro: 'GetResponse vs Brevo : choisissez selon le parcours à construire, pas seulement le prix de la newsletter. Votre nombre de contacts, la fréquence des envois et vos automatisations changent le calcul.',
      scenarios: [
        { situation: 'Acquisition', choice: 'GetResponse pour construire un parcours', reason: 'À essayer pour relier pages de capture, emails et automatisations dans un même projet marketing.', limit: 'Ne choisissez pas Starter pour des parcours multiples : il inclut un seul workflow personnalisé.' },
        { situation: 'Campagnes régulières', choice: 'Brevo pour partir de vos volumes', reason: 'À comparer si vous voulez commencer par les campagnes email, puis choisir votre palier selon les envois et les contacts.', limit: 'Le gratuit est plafonné à 300 emails par jour. Une campagne ne part donc pas forcément en une fois.' },
      ],
      criteria: [
        { title: 'Acquérir des abonnés', a: 'Pages de capture et formulaires dans le parcours email.', b: 'Campagnes email ; une landing page incluse dans Standard.', takeaway: 'Dessinez inscription, premier message et relance avant de choisir.', source: 1 },
        { title: 'Automatiser', a: 'Starter : un workflow personnalisé. Marketer : workflows illimités.', b: 'Standard : automatisation sans plafond de contacts dédié.', takeaway: 'Un scénario complexe doit être testé dans le forfait prévu, pas seulement pendant un essai complet.', source: 2 },
        { title: 'Dimensionner', a: 'Comparez votre taille de liste et le plan nécessaire.', b: 'Vérifiez simultanément envois mensuels et contacts stockés.', takeaway: 'Une grande liste peu sollicitée et une petite liste très active ne produisent pas le même devis.' },
      ],
      prices: [
        { label: 'Commencer', a: 'Essai de 14 jours sans carte bancaire.', b: 'Gratuit : 300 emails/jour.', note: 'Un essai temporaire et une offre gratuite ne sont pas équivalents.' },
        { label: 'Campagnes et automatisations', a: 'Starter ou Marketer : prix selon la liste et la devise. Confirmez le montant dans le sélecteur officiel.', b: 'Starter dès 7 €/mois ; Standard dès 17 €/mois. Palier initial : 5 000 emails/mois et 500 contacts.', note: 'Aucune conversion USD/EUR ni économie relative n’est déduite de ces prix d’entrée.' },
      ],
      priceNote: 'Sources consultées le 27 septembre 2026. GetResponse a affiché une devise géolocalisée : aucun prix USD n’en est déduit. Vérifiez taxes, période de paiement, nombre de contacts et options avant souscription.',
      switching: [
        { title: 'Garder', text: 'Vos campagnes actuelles atteignent le bon public et vos parcours fonctionnent ? Gardez votre outil tant que le nouveau ne résout pas un blocage précis.' },
        { title: 'Changer', text: 'Une limite de contacts, de cadence ou de workflow devient récurrente ? Testez un segment consenti et une séquence avant toute migration complète.' },
      ],
      trial: ['Préparez le même formulaire et trois emails dans chaque outil.', 'Testez les déclencheurs et exclusions avec quelques contacts autorisés.', 'Comparez le devis pour votre base actuelle et pour son double, avec la même fréquence d’envoi.'],
      faq: [
        { question: 'Lequel choisir pour une newsletter ?', answer: 'Commencez par votre cadence, votre liste et les automatismes indispensables. Brevo permet de tester gratuitement, dans sa limite quotidienne. GetResponse mérite un essai si la newsletter fait partie d’un parcours d’acquisition plus large. Aucun gain de délivrabilité n’est établi par ce comparatif.' },
        { question: 'Faut-il migrer toute sa base pour essayer ?', answer: 'Non. Reproduisez d’abord une campagne et une séquence avec un petit groupe autorisé. Contrôlez ensuite les consentements, désinscriptions et champs personnalisés. Le temps de reconstruction compte dans le coût du changement, même si le nouveau forfait paraît moins cher.' },
      ],
      alternatives: [{ slug: 'kit', name: 'Kit', reason: 'Newsletter de créateur.' }], sources: emailSources,
    },
    en: {
      checkedAt: '2026-09-27', scope: '',
      intro: 'GetResponse vs Brevo: choose around the customer journey, not just newsletter pricing. List size, sending frequency and automation requirements change the calculation.',
      scenarios: [
        { situation: 'Acquisition', choice: 'GetResponse for a connected journey', reason: 'Worth trying when signup pages, email and automation belong to the same marketing project.', limit: 'Starter includes one custom workflow. Do not choose it for multiple automated journeys.' },
        { situation: 'Regular campaigns', choice: 'Brevo for volume-led planning', reason: 'Compare it when you want to start with email campaigns and size your plan around sending and contact volumes.', limit: 'Free is capped at 300 emails per day. Your whole campaign may not go out at once.' },
      ],
      criteria: [
        { title: 'Acquire subscribers', a: 'Landing pages and forms within the email journey.', b: 'Email campaigns; one landing page in Standard.', takeaway: 'Map signup, first message and follow-up before choosing.', source: 1 },
        { title: 'Automate', a: 'Starter: one custom workflow. Marketer: unlimited workflows.', b: 'Standard: automation without a dedicated contact cap.', takeaway: 'Test a complex journey in the intended plan, not just an unrestricted trial.', source: 2 },
        { title: 'Size the plan', a: 'Match list size to the required plan.', b: 'Check both monthly sends and stored contacts.', takeaway: 'A large occasional list and a small active list need different quotes.' },
      ],
      prices: [
        { label: 'Get started', a: '14-day trial without a credit card.', b: 'Free: 300 emails/day.', note: 'A temporary trial and an ongoing free plan are not equivalent.' },
        { label: 'Campaigns and automation', a: 'Starter or Marketer: pricing varies by list and currency. Confirm the amount in the official selector.', b: 'Starter from €7/month; Standard from €17/month. Initial tier: 5,000 emails/month and 500 contacts.', note: 'No USD/EUR conversion or comparative savings are inferred from these entry prices.' },
      ],
      priceNote: 'Sources consulted on 27 September 2026. GetResponse displayed a location-based currency: no USD price is inferred. Check tax, billing period, contacts and add-ons before subscribing.',
      switching: [
        { title: 'Keep', text: 'Your campaigns reach the right audience and your journeys work? Keep your current tool until the alternative solves a specific problem.' },
        { title: 'Switch', text: 'A contact, sending or workflow limit keeps getting in the way? Test a consented segment and one sequence before a full migration.' },
      ],
      trial: ['Build the same form and three emails in each tool.', 'Check triggers and exclusions with a few authorised contacts.', 'Price your current list and twice that size at the same sending frequency.'],
      faq: [
        { question: 'Which is better for a newsletter?', answer: 'Start with your sending frequency, list and essential automations. Brevo lets you try for free within its daily cap. GetResponse is worth a trial when the newsletter belongs to a broader acquisition journey. This comparison does not establish a deliverability advantage for either tool.' },
        { question: 'Must I migrate my entire list to test?', answer: 'No. Recreate one campaign and sequence with a small authorised group first. Then check consent, unsubscribes and custom fields. Rebuilding time belongs in your switching cost even when a new subscription looks cheaper.' },
      ],
      alternatives: [{ slug: 'kit', name: 'Kit', reason: 'Creator newsletters.' }], sources: emailSources,
    },
  },
  'engagebay-vs-hubspot': {
    fr: {
      checkedAt: '2026-09-27', scope: '',
      intro: 'EngageBay vs HubSpot : deux approches pour réunir suivi commercial et marketing. Le bon choix dépend de vos processus, des connexions indispensables et du coût une fois l’équipe équipée.',
      scenarios: [
        { situation: 'Petite équipe', choice: 'EngageBay pour une suite resserrée', reason: 'À tester si vous cherchez un espace commun pour contacts, emails et support, avec peu de processus particuliers.', limit: 'La suite gratuite accueille 250 contacts. Les automatisations marketing figurent dans Growth.' },
        { situation: 'Écosystème', choice: 'HubSpot pour vos connexions métier', reason: 'À privilégier dans le test si votre activité dépend déjà de son CRM, de ses applications ou de ses partenaires.', limit: 'Starter ne représente pas tout HubSpot. Chiffrez les fonctions supérieures avant de construire votre organisation autour.' },
      ],
      criteria: [
        { title: 'Périmètre', a: 'Suite All-in-One : CRM, email, helpdesk et chat.', b: 'Starter Customer Platform réunit les éditions Starter autour du CRM.', takeaway: 'Comparez deux suites, pas EngageBay complet face à un seul Hub.', source: 1 },
        { title: 'Automatisation', a: 'Growth est le palier à examiner pour le marketing automatisé.', b: 'Vérifiez l’édition requise pour chaque workflow.', takeaway: 'Écrivez vos trois règles métier puis demandez leur démonstration.' },
        { title: 'Migration', a: 'Vérifiez les objets et champs réellement transférables.', b: 'Cartographiez les données déjà utilisées par vos équipes et intégrations.', takeaway: 'Un export de contacts ne reconstitue pas les activités, rapports et habitudes de travail.' },
      ],
      prices: [
        { label: 'Démarrer', a: 'Free : 250 contacts. Basic : 500 contacts.', b: 'Outils gratuits disponibles ; Starter est une offre distincte.', note: 'Le quota de contacts ne suffit pas à comparer les fonctionnalités.' },
        { label: 'Offres payantes', a: 'Plusieurs périodes affichées pour Basic et Growth. Confirmez période, sièges et montant total au paiement.', b: 'Promotion nouveaux clients : 7 $US/siège/mois avec paiement annuel, ou 10 $US en paiement mensuel sans engagement annuel.', note: 'Promotion HubSpot limitée dans le temps, observée le 27 septembre 2026. Ne la traitez pas comme un prix permanent.' },
      ],
      priceNote: 'La grille EngageBay contient plusieurs montants selon la période et des libellés ambigus dans sa version textuelle : aucun tarif unique n’est retenu ici. HubSpot publie une promotion réservée aux nouveaux clients. Vérifiez renouvellement, taxes, contacts et sièges sur le devis final.',
      switching: [
        { title: 'Garder', text: 'HubSpot centralise déjà des données fiables et des intégrations utiles ? Une baisse du prix d’entrée ne suffit pas à justifier une migration.' },
        { title: 'Changer', text: 'EngageBay reproduit vos parcours essentiels lors d’un pilote et le coût total est mieux adapté ? Validez exports et reprise des historiques avant de basculer.' },
      ],
      trial: ['Recréez dix contacts de test et un pipeline à trois étapes.', 'Testez formulaire, attribution, relance et ticket de support.', 'Demandez un devis pour toute l’équipe avec vos automatismes et connexions, puis vérifiez un export.'],
      faq: [
        { question: 'EngageBay est-il toujours moins cher ?', answer: 'Non. Les promotions, utilisateurs, contacts et fonctions changent le résultat. Comparez un coût annuel pour le même processus, y compris le renouvellement. Le prix affiché d’une suite ne prouve pas que toutes les automatisations ou intégrations dont vous avez besoin sont incluses.' },
        { question: 'Quel forfait HubSpot faut-il comparer ?', answer: 'Pour une petite équipe cherchant marketing, ventes et service, partez de Starter Customer Platform plutôt que du seul Marketing Hub. Vérifiez ensuite les fonctions manquantes. Si elles demandent une édition supérieure, refaites le devis avant de conclure.' },
      ],
      alternatives: [{ slug: 'pipedrive', name: 'Pipedrive', reason: 'Pipeline commercial.' }], sources: crmSources,
    },
    en: {
      checkedAt: '2026-09-27', scope: '',
      intro: 'EngageBay vs HubSpot: two ways to connect sales and marketing. Choose around your processes, essential integrations and the cost of equipping the whole team.',
      scenarios: [
        { situation: 'Small team', choice: 'EngageBay for a focused suite', reason: 'Test it when you need contacts, email and support together without many specialised processes.', limit: 'Free allows 250 contacts. Marketing automation is listed in Growth.' },
        { situation: 'Ecosystem', choice: 'HubSpot for your connected workflow', reason: 'Prioritise it in your trial if work already depends on its CRM, apps or partners.', limit: 'Starter is not all of HubSpot. Price higher-tier requirements before building your operation around it.' },
      ],
      criteria: [
        { title: 'Scope', a: 'All-in-One suite: CRM, email, helpdesk and chat.', b: 'Starter Customer Platform combines Starter editions around the CRM.', takeaway: 'Compare two suites, not the whole EngageBay product against one Hub.', source: 1 },
        { title: 'Automation', a: 'Examine Growth for marketing automation.', b: 'Check the edition required for each workflow.', takeaway: 'Write down three business rules and request a demonstration.' },
        { title: 'Migration', a: 'Check which objects and fields can actually transfer.', b: 'Map the data used by your teams and integrations.', takeaway: 'A contact export does not recreate activities, reports and working habits.' },
      ],
      prices: [
        { label: 'Get started', a: 'Free: 250 contacts. Basic: 500 contacts.', b: 'Free tools available; Starter is a separate offer.', note: 'A contact allowance alone does not establish equivalent features.' },
        { label: 'Paid plans', a: 'Basic and Growth show multiple billing periods. Confirm period, seats and total payment at checkout.', b: 'New-customer promotion: US$7/seat/month paid annually, or US$10 paid monthly without an annual commitment.', note: 'Time-limited HubSpot promotion observed on 27 September 2026, not a permanent price.' },
      ],
      priceNote: 'EngageBay displays several billing-period prices and ambiguous labels in its text rendering; no single price is retained here. HubSpot publishes a new-customer promotion. Check renewal, taxes, contacts and seats in the final quote.',
      switching: [
        { title: 'Keep', text: 'HubSpot already connects reliable data and useful integrations? A lower starting price alone does not justify migration.' },
        { title: 'Switch', text: 'EngageBay reproduces essential workflows in a pilot at a more suitable total cost? Validate exports and history transfer before switching.' },
      ],
      trial: ['Recreate ten test contacts and a three-stage pipeline.', 'Test a form, assignment, follow-up and support ticket.', 'Request a whole-team quote including automation and integrations, then test an export.'],
      faq: [
        { question: 'Is EngageBay always cheaper?', answer: 'No. Promotions, users, contacts and features change the result. Compare annual costs for the same process, including renewal. A suite’s starting price does not prove that every automation or integration you need is included.' },
        { question: 'Which HubSpot plan should I compare?', answer: 'For a small team needing marketing, sales and service, start with Starter Customer Platform rather than Marketing Hub alone. Then check missing features. If those need a higher edition, request a new quote before deciding.' },
      ],
      alternatives: [{ slug: 'pipedrive', name: 'Pipedrive', reason: 'Sales pipeline.' }], sources: crmSources,
    },
  },
  'flexclip-vs-canva': {
    fr: {
      checkedAt: '2026-09-27', scope: '',
      intro: 'FlexClip vs Canva : faut-il un outil centré sur la vidéo ou conserver un espace de création polyvalent ? Comparez un même clip, son export et les ressources réellement utilisées.',
      scenarios: [
        { situation: 'Vidéo récurrente', choice: 'FlexClip pour un travail centré sur la vidéo', reason: 'À essayer si vos livrables récurrents sont des clips marketing plutôt que des présentations ou documents.', limit: 'Résolution, médias stock et crédits IA dépendent du plan. Un abonnement ne signifie pas génération IA illimitée.' },
        { situation: 'Création polyvalente', choice: 'Canva pour rester dans votre espace créatif', reason: 'Si vos modèles et votre marque y sont déjà organisés, commencez par son éditeur vidéo avant d’ajouter un abonnement.', limit: 'Un export gratuit sans filigrane suppose de ne pas utiliser d’éléments payants.' },
      ],
      criteria: [
        { title: 'Format livré', a: 'Éditeur vidéo en ligne ; Plus en 1080p, Business en 4K.', b: 'Montage vidéo avec timeline multicouche et export MP4 ou GIF.', takeaway: 'Fixez résolution, durée et ratio dans le brief avant le test.', source: 1 },
        { title: 'Ressources', a: 'Quotas distincts pour stock, stockage et crédits IA.', b: 'Les éléments gratuits et Pro ne donnent pas les mêmes conditions d’export.', takeaway: 'Vérifiez les ressources dans le projet final, pas seulement dans la bibliothèque.', source: 2 },
        { title: 'Choix pratique', a: 'Mesurez le temps nécessaire pour passer du brief au clip exporté.', b: 'Comptez aussi le temps économisé en réutilisant vos modèles existants.', takeaway: 'Ce protocole départage votre usage ; aucun test de vitesse ToolTrim n’est revendiqué.' },
      ],
      prices: [
        { label: 'Tester gratuitement', a: 'Free : export 720p.', b: 'Export sans filigrane avec des éléments gratuits.', note: 'Faites un export complet pour voir si le gratuit répond à votre besoin.' },
        { label: 'Paiement annuel', a: 'Plus : 143,88 $US/an. Business : 239,88 $US/an.', b: 'Canva Pro : montant local à confirmer au paiement ; aucun montant unique vérifié ici.', note: 'FlexClip : équivalents de 11,99 et 19,99 $US/mois, mais paiement annuel. Ce ne sont pas des forfaits mensuels sans engagement.' },
      ],
      priceNote: 'FlexClip : montants annuels observés le 27 septembre 2026, conservés en USD. Aucune conversion en EUR ni comparaison de prix Canva non vérifié. Contrôlez taxes, licences des médias, quotas et renouvellement.',
      switching: [
        { title: 'Garder', text: 'Canva produit déjà les clips attendus avec vos modèles ? Gardez-le tant qu’une limite concrète ne justifie pas un outil supplémentaire.' },
        { title: 'Changer', text: 'FlexClip simplifie votre production lors d’un test réel ? Vérifiez trois exports représentatifs et le coût des ressources avant de déplacer votre travail.' },
      ],
      trial: ['Importez les mêmes rushes et préparez un clip de 30 secondes.', 'Ajoutez titres, sous-titres et musique dont vous détenez les droits.', 'Exportez en vertical et horizontal, puis vérifiez rendu, filigrane, résolution et crédits consommés.'],
      faq: [
        { question: 'Faut-il payer les deux ?', answer: 'Seulement si chacun répond à un besoin récurrent distinct. Si Canva couvre déjà vos vidéos, commencez par tester ce qui manque dans FlexClip. La présence de fonctions IA ou de modèles supplémentaires ne justifie pas à elle seule un second abonnement.' },
        { question: 'Peut-on utiliser les vidéos dans une publicité ?', answer: 'Vérifiez les droits de chaque musique, image et séquence utilisée, ainsi que les conditions de la plateforme. La possibilité technique d’exporter ne garantit pas une licence adaptée à votre campagne. Conservez les informations de licence associées aux ressources retenues.' },
      ],
      alternatives: [{ slug: 'descript', name: 'Descript', reason: 'Montage de contenus parlés.' }], sources: videoSources,
    },
    en: {
      checkedAt: '2026-09-27', scope: '',
      intro: 'FlexClip vs Canva: do you need a video-focused tool or a broader creative workspace? Compare the same clip, its export and the assets actually used.',
      scenarios: [
        { situation: 'Recurring video work', choice: 'FlexClip for video-focused production', reason: 'Worth trying when your recurring deliverables are marketing clips rather than presentations or documents.', limit: 'Resolution, stock assets and AI credits vary by plan. A subscription does not mean unlimited AI generation.' },
        { situation: 'Broader creative work', choice: 'Canva for your existing creative workspace', reason: 'If your templates and brand already live there, start with its video editor before adding a subscription.', limit: 'Watermark-free exports on Free require avoiding paid elements.' },
      ],
      criteria: [
        { title: 'Deliverable', a: 'Online video editor; Plus offers 1080p, Business 4K.', b: 'Multi-layer video timeline with MP4 or GIF export.', takeaway: 'Set resolution, duration and aspect ratio before the test.', source: 1 },
        { title: 'Assets', a: 'Separate allowances for stock, storage and AI credits.', b: 'Free and Pro elements have different export conditions.', takeaway: 'Check assets in the finished project, not just the library.', source: 2 },
        { title: 'Practical fit', a: 'Measure the time from brief to exported clip.', b: 'Include time saved by reusing existing templates.', takeaway: 'This tests your workflow; no hands-on ToolTrim speed benchmark is claimed.' },
      ],
      prices: [
        { label: 'Try for free', a: 'Free: 720p export.', b: 'Watermark-free export using free elements.', note: 'Finish an export to check whether Free meets your needs.' },
        { label: 'Annual payment', a: 'Plus: US$143.88/year. Business: US$239.88/year.', b: 'Canva Pro: confirm local pricing at checkout; no single amount verified here.', note: 'FlexClip equivalents are US$11.99 and US$19.99/month, paid annually. These are not flexible monthly subscriptions.' },
      ],
      priceNote: 'FlexClip annual amounts observed on 27 September 2026, retained in USD. No EUR conversion or unverified Canva price comparison. Check taxes, asset licences, allowances and renewal.',
      switching: [
        { title: 'Keep', text: 'Canva already produces the clips you need using existing templates? Keep it until a specific limitation justifies another tool.' },
        { title: 'Switch', text: 'FlexClip simplifies production in your own test? Check three representative exports and asset costs before moving your workflow.' },
      ],
      trial: ['Import identical footage and make a 30-second clip.', 'Add titles, captions and music you have permission to use.', 'Export vertical and horizontal versions; check rendering, watermark, resolution and credits consumed.'],
      faq: [
        { question: 'Should I pay for both?', answer: 'Only when each serves a distinct recurring need. If Canva already covers your video work, first test what is missing in FlexClip. Extra AI features or templates alone do not justify another subscription.' },
        { question: 'Can I use the videos in an ad?', answer: 'Check the licence for each music track, image and clip, alongside platform terms. The ability to export does not guarantee suitable rights for your campaign. Keep the licence information associated with the assets you select.' },
      ],
      alternatives: [{ slug: 'descript', name: 'Descript', reason: 'Spoken-content editing.' }], sources: videoSources,
    },
  },
};
