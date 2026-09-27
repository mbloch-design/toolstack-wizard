import type { ComparisonDecisionGuide } from './comparisonDecisionGuides';

export const websiteVisuals = { 'b12-vs-wix': { src: '/tool-media/b12/official-1.webp', name: 'B12' } };
export const websiteOffers = { 'b12-vs-wix': [
  { name: 'B12', url: 'https://tidd.ly/4hRTys3', affiliated: true },
  { name: 'Wix', url: 'https://www.wix.com/plans', affiliated: false },
] };
const sources = [{ label: 'B12 · Pricing', url: 'https://www.b12.io/pricing/' }, { label: 'Wix · Plans', url: 'https://www.wix.com/plans' }];
export const websiteComparisonGuides: Record<string, Record<'fr' | 'en', ComparisonDecisionGuide>> = {
  'b12-vs-wix': {
    fr: {
      checkedAt: '2026-09-27', scope: '',
      intro: 'B12 vs Wix : choisissez un site que vous pourrez entretenir après sa création. B12 combine édition visuelle et demandes à l’IA. Wix propose aussi une création assistée, avec un éditeur et des fonctions métier à choisir selon votre activité.',
      scenarios: [
        { situation: 'Premier site professionnel', choice: 'B12 pour partir d’un brief', reason: 'À essayer si vous voulez décrire votre activité puis corriger la structure et les textes avec un éditeur assisté.', limit: 'Relisez chaque promesse et testez les formulaires. Une première version générée ne constitue pas un site validé.' },
        { situation: 'Site à faire évoluer', choice: 'Wix pour vos fonctions métier', reason: 'À examiner si réservation, vente ou gestion de contenu structurent déjà votre besoin.', limit: 'Vérifiez le plan, les applications et les options nécessaires. Le prix d’un simple site vitrine ne couvre pas forcément tout le projet.' },
      ],
      criteria: [
        { title: 'Créer et modifier', a: 'Éditeur visuel et chat IA.', b: 'Éditeur glisser-déposer et création assistée par IA.', takeaway: 'Testez une correction précise après génération, pas seulement le premier écran.' },
        { title: 'Gérer les demandes', a: 'Le plan Client Engagement ajoute contacts, email et contrats.', b: 'Core présente paiements, commerce et réservation.', takeaway: 'Partez du trajet visiteur → demande → suivi, puis chiffrez les fonctions requises.' },
        { title: 'Préparer la suite', a: 'Crédits IA et nombre de projets varient selon le plan.', b: 'Stockage, collaborateurs et fonctions varient selon le plan.', takeaway: 'Testez le site mobile, les mises à jour et la récupération de vos données avant de vous engager.' },
      ],
      prices: [
        { label: 'Commencer', a: 'Free sur un sous-domaine B12. Offre d’entrée payante : 1 $ pour les sept premiers jours, pour les nouveaux clients éligibles.', b: 'Création gratuite disponible.', note: 'L’offre B12 à 1 $ n’est pas un essai gratuit. Vérifiez la suite de la facturation.' },
        { label: 'Votre site professionnel', a: 'Website : 24 $/mois. Website + Client Engagement : 78 $/mois, tarifs mensuels USD affichés.', b: 'Light pour le site de base ; Core pour les paiements et la réservation. Prix local à confirmer au paiement.', note: 'Wix indique des prix et devises selon la localisation. La page consultée mêle des mentions de taxes contradictoires : aucun devis comparatif chiffré n’en est déduit.' },
      ],
      priceNote: 'Sources consultées le 27 septembre 2026. Aucune conversion USD/EUR. Vérifiez période, renouvellement du domaine, adresse email et options. Les services de création réalisés par des experts B12 sont distincts de cette comparaison en autonomie.',
      switching: [{ title: 'Garder votre site', text: 'Vos pages sont trouvées et les demandes arrivent correctement ? Corrigez d’abord le blocage précis, sans reconstruire tout le site.' }, { title: 'Changer de plateforme', text: 'Préparez les pages, les redirections, les formulaires et le domaine avant de basculer. Conservez l’ancien site jusqu’à validation du nouveau.' }],
      trial: ['Reproduisez accueil, offre et contact avec vos propres textes.', 'Modifiez un service, un tarif et un formulaire, puis vérifiez sur téléphone.', 'Chiffrez douze mois, les options nécessaires et le renouvellement du domaine.'],
      faq: [{ question: 'B12 remplace-t-il une agence ?', answer: 'Le parcours autonome aide à construire un site, mais vous restez responsable du contenu, de la vérification et de la maintenance. Une mission de stratégie, d’identité ou d’intégration complexe doit être évaluée séparément.' }, { question: 'Lequel garantit un meilleur référencement ?', answer: 'Aucun classement n’est garanti ici. La structure des pages, le contenu utile, les performances et la migration des anciennes URL doivent être vérifiés sur votre site réel. La génération IA ne remplace pas ce travail.' }],
      alternatives: [], sources,
    },
    en: {
      checkedAt: '2026-09-27', scope: '',
      intro: 'B12 vs Wix: choose a website you can maintain after launch. B12 combines visual editing with AI instructions. Wix also offers AI-assisted creation, alongside an editor and business features to match your activity.',
      scenarios: [
        { situation: 'First professional website', choice: 'B12 for starting from a brief', reason: 'Try it when you want to describe your business, then refine structure and copy in an assisted editor.', limit: 'Review every claim and test forms. A generated first draft is not a validated website.' },
        { situation: 'An evolving website', choice: 'Wix for business features', reason: 'Consider it when bookings, sales or content management shape your requirements.', limit: 'Check the required plan, apps and extras. A brochure-site price does not necessarily cover the entire project.' },
      ],
      criteria: [
        { title: 'Create and edit', a: 'Visual editor and AI chat.', b: 'Drag-and-drop editor and AI-assisted creation.', takeaway: 'Test a precise change after generation, not just the first screen.' },
        { title: 'Handle enquiries', a: 'Client Engagement adds contacts, email and contracts.', b: 'Core lists payments, commerce and scheduling.', takeaway: 'Map visitor → enquiry → follow-up, then price the required features.' },
        { title: 'Plan ahead', a: 'AI credits and project allowances vary by plan.', b: 'Storage, collaborators and features vary by plan.', takeaway: 'Test mobile pages, updates and data retrieval before committing.' },
      ],
      prices: [
        { label: 'Get started', a: 'Free on a B12 subdomain. Paid introductory offer: $1 for the first seven days for eligible new customers.', b: 'Free website creation available.', note: 'The $1 B12 offer is not a free trial. Check the subsequent billing.' },
        { label: 'Your business website', a: 'Website: $24/month. Website + Client Engagement: $78/month, displayed monthly USD prices.', b: 'Light for a basic site; Core for payments and scheduling. Confirm local checkout pricing.', note: 'Wix varies prices and currency by location. The consulted page contains conflicting tax labels, so no numerical cost comparison is inferred.' },
      ],
      priceNote: 'Sources consulted on 27 September 2026. No currency conversion. Check billing period, domain renewal, email and extras. B12 expert-built services are separate from this self-service comparison.',
      switching: [{ title: 'Keep your website', text: 'Your pages are found and enquiries arrive correctly? Fix the specific problem before rebuilding everything.' }, { title: 'Switch platforms', text: 'Prepare pages, redirects, forms and domain settings first. Keep the old site until the new one is validated.' }],
      trial: ['Recreate home, service and contact pages using your own copy.', 'Change a service, price and form, then check on a phone.', 'Price twelve months, necessary add-ons and domain renewal.'],
      faq: [{ question: 'Does B12 replace an agency?', answer: 'Self-service helps you build a site, but content, verification and maintenance remain your responsibility. Strategy, identity or complex integration work needs a separate assessment.' }, { question: 'Which guarantees better search rankings?', answer: 'Neither has a ranking guarantee here. Page structure, useful content, performance and old URL migration must be checked on your actual site. AI generation does not replace that work.' }],
      alternatives: [], sources,
    },
  },
};
