import type { ComparisonDecisionGuide } from './comparisonDecisionGuides';

export const kitAffiliateUrl = 'https://partners.kit.com/u037oht6r48p';
const kitPricing = 'https://kit.com/pricing';

function guide(lang: 'fr' | 'en', rival: 'Mailchimp' | 'GetResponse'): ComparisonDecisionGuide {
  const en = lang === 'en';
  const kitFirst = rival === 'GetResponse';
  const pair = (kit: string, other: string) => kitFirst ? { a: kit, b: other } : { a: other, b: kit };
  const rivalReason = rival === 'Mailchimp'
    ? (en ? 'A broader business marketing toolkit, including email and SMS features.' : 'Un ensemble marketing d’entreprise plus large, avec email et fonctions SMS.')
    : (en ? 'A funnel-led approach connecting acquisition, email and automation.' : 'Une approche par tunnel reliant acquisition, email et automatisation.');
  const result: ComparisonDecisionGuide = {
    checkedAt: '2026-10-19', scope: '',
    intro: en
      ? `Choose Kit when a creator newsletter supports your content, courses or launches. Compare ${rival} when your marketing needs extend beyond that journey. Start with the workflow you want to run, not a headline price.`
      : `Choisis Kit si ta newsletter sert tes contenus, formations ou lancements. Compare ${rival} si ton besoin marketing dépasse ce parcours. Pars du scénario à construire, pas d’un prix d’appel.`,
    scenarios: [
      { situation: en ? 'Creator newsletter' : 'Newsletter de créateur', choice: en ? 'Try Kit first' : 'Essaie Kit en premier', reason: en ? 'Forms, tags and sequences connect an audience to your offers.' : 'Formulaires, tags et séquences relient ton audience à tes offres.', limit: en ? 'Sequences and visual automations require a paid Kit plan.' : 'Les séquences et automatisations visuelles nécessitent un forfait Kit payant.' },
      { situation: en ? 'Broader marketing' : 'Marketing plus large', choice: en ? `Compare ${rival}` : `Compare ${rival}`, reason: rivalReason, limit: en ? 'Check the channels, integrations and limits included in your selected plan.' : 'Contrôle les canaux, intégrations et limites de ton forfait.' },
      { situation: en ? 'Existing working setup' : 'Un outil qui fonctionne déjà', choice: en ? 'Test before switching' : 'Teste avant de migrer', reason: en ? 'Use one form and a welcome sequence to see whether Kit simplifies your workflow.' : 'Une page et une séquence de bienvenue permettent de voir si Kit simplifie ton parcours.', limit: en ? 'Do not cancel the current tool until signup, consent and messages work end to end.' : 'Ne résilie pas avant d’avoir validé inscription, consentement et envois de bout en bout.' },
    ],
    criteria: [
      { title: en ? 'Primary use' : 'Usage principal', ...pair(en ? 'Creator newsletters and email journeys around your offers.' : 'Newsletter et parcours email autour des offres d’un créateur.', rivalReason), takeaway: en ? 'Choose the business model you actually run.' : 'Choisis selon ton modèle d’activité réel.' },
      { title: en ? 'Welcome journey' : 'Parcours de bienvenue', ...pair(en ? 'Creator combines visual automation with email sequences.' : 'Creator combine automatisations visuelles et séquences email.', en ? 'Email automation is available; inclusions depend on the plan.' : 'Automatisation email disponible ; périmètre selon le forfait.'), takeaway: en ? 'Test delivery of a resource, a follow-up and an offer.' : 'Teste la livraison d’une ressource, une relance et une offre.', source: 1 },
      { title: en ? 'Migration' : 'Migration', ...pair(en ? 'CSV import and migration assistance offered by Kit; confirm your scope.' : 'Import CSV et accompagnement proposés par Kit ; confirme le périmètre.', en ? 'Keep a backup of contacts, consent and working campaigns.' : 'Conserve une sauvegarde des contacts, consentements et campagnes.'), takeaway: en ? 'An imported contact list does not prove your automations have been rebuilt.' : 'Importer les contacts ne prouve pas que les automatisations sont recréées.', source: 1 },
    ],
    prices: [
      { label: en ? 'Start without an annual commitment' : 'Commencer sans engagement annuel', ...pair(en ? 'Free up to 10,000 subscribers; 14-day trial of paid features, no card required.' : 'Free jusqu’à 10 000 abonnés ; essai des fonctions payantes de 14 jours sans carte.', en ? 'Check the current free offer or trial and its limits.' : 'Vérifie l’offre gratuite ou l’essai actuel et ses limites.'), note: en ? 'Kit Free excludes sequences and visual automations.' : 'Kit Free n’inclut ni séquences ni automatisations visuelles.' },
      { label: en ? 'Creator reference · 1,000 subscribers' : 'Repère Creator · 1 000 abonnés', ...pair(en ? '$390/year, paid annually.' : '390 $US/an, payés annuellement.', en ? 'Price at the same list size and required feature set in the official selector.' : 'Tarif à comparer au même volume et avec les fonctions nécessaires dans le sélecteur officiel.'), note: en ? 'No currency conversion or claimed saving between unlike plans.' : 'Aucune conversion de devise ni économie déduite de forfaits différents.' },
    ],
    priceNote: en ? 'Checked October 19, 2026. Kit pricing scales with subscribers. Pro first-year offers are temporary and renew at the standard rate; confirm eligibility, billing and taxes before paying.' : 'Vérifié le 19 octobre 2026. Kit facture selon le nombre d’abonnés. Les promotions Pro de première année sont temporaires : contrôle conditions, renouvellement, période de paiement et taxes.',
    switching: [
      { title: en ? 'Start' : 'Démarrer', text: en ? 'Create one signup page and deliver a useful resource.' : 'Crée une page d’inscription et livre une ressource utile.' },
      { title: en ? 'Automate' : 'Automatiser', text: en ? 'Use the Kit trial for a three-email welcome sequence. Verify the trigger and tags.' : 'Utilise l’essai Kit pour trois emails de bienvenue. Vérifie le déclencheur et les tags.' },
      { title: en ? 'Decide' : 'Décider', text: en ? 'Choose Creator only after the workflow works and the price fits your list.' : 'Choisis Creator après validation du parcours et du tarif pour ta liste.' },
    ],
    trial: en ? ['Publish one form with clear consent.', 'Trigger three welcome emails and test the links.', 'Check tags, unsubscribe handling and the price at your list size.'] : ['Publie un formulaire avec un consentement clair.', 'Déclenche trois emails de bienvenue et teste les liens.', 'Vérifie tags, désinscription et tarif pour ta liste.'],
    faq: [
      { question: en ? 'When should I choose Kit?' : 'Quand choisir Kit ?', answer: en ? 'When your newsletter supports recurring content and offers and you want forms, tags and sequences in one workflow. Start with Free for broadcasts, or use the paid-feature trial to test the journey before upgrading.' : 'Si ta newsletter accompagne des contenus et des offres régulières et que tu veux réunir formulaires, tags et séquences. Commence avec Free pour les newsletters ou teste le parcours pendant l’essai des fonctions payantes.' },
      { question: en ? 'Does Kit Free include sequences?' : 'Kit Free inclut-il les séquences ?', answer: en ? 'No. Email sequences and visual automations need a paid plan. The 14-day no-card trial is temporary; it is different from the permanent Free plan.' : 'Non. Les séquences email et automatisations visuelles nécessitent un forfait payant. L’essai de 14 jours sans carte est temporaire et distinct du plan Free permanent.' },
    ],
    alternatives: [{ slug: 'brevo', name: 'Brevo', reason: en ? 'Transactional email and multichannel needs.' : 'Transactionnel et besoins multicanaux.' }, { slug: 'beehiiv', name: 'Beehiiv', reason: en ? 'A publication-led newsletter business.' : 'Une activité centrée sur la publication.' }],
    sources: [{ label: 'Kit · pricing and features', url: kitPricing }, { label: `${rival} · features`, url: rival === 'Mailchimp' ? 'https://mailchimp.com/features/' : 'https://www.getresponse.com/features' }],
  };
  // The existing comparison template pairs the first two scenarios with
  // the products in hero order. Keep the recommendation and logo aligned.
  if (!kitFirst) [result.scenarios[0], result.scenarios[1]] = [result.scenarios[1], result.scenarios[0]];
  return result;
}

export const kitComparisonGuides: Record<string, Record<'fr' | 'en', ComparisonDecisionGuide>> = {
  'mailchimp-vs-convertkit': { fr: guide('fr', 'Mailchimp'), en: guide('en', 'Mailchimp') },
  'convertkit-vs-getresponse': { fr: guide('fr', 'GetResponse'), en: guide('en', 'GetResponse') },
};
