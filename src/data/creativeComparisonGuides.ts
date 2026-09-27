import type { ComparisonDecisionGuide } from './comparisonDecisionGuides';

export const creativeVisuals = {
  'pdf-agile-vs-adobe-acrobat': { src: '/tool-media/pdf-agile/convert.png', name: 'PDF Agile' },
  'piktochart-vs-canva': { src: '/tool-media/piktochart/diagrams.png', name: 'Piktochart' },
  'pixlr-vs-photopea': { src: '/tool-media/pixlr/editor.jpg', name: 'Pixlr' },
};
export const creativeOffers = {
  'pdf-agile-vs-adobe-acrobat': [
    { name: 'PDF Agile', url: 'https://tidd.ly/4iWjapP', affiliated: true },
    { name: 'Adobe Acrobat Pro', url: 'https://www.adobe.com/acrobat/pricing.html', affiliated: false },
  ],
  'piktochart-vs-canva': [
    { name: 'Piktochart', url: 'https://tidd.ly/3V5Yxh1', affiliated: true },
    { name: 'Canva', url: 'https://www.canva.com/pricing/', affiliated: false },
  ],
  'pixlr-vs-photopea': [
    { name: 'Pixlr', url: 'https://tidd.ly/4xN3vg8', affiliated: true },
    { name: 'Photopea', url: 'https://www.photopea.com/', affiliated: false },
  ],
};
const pdfSources = [{ label: 'PDF Agile · Pricing', url: 'https://www.pdfagile.com/pricing' }, { label: 'Adobe Acrobat · Pricing', url: 'https://www.adobe.com/acrobat/pricing.html' }];
const infographicSources = [{ label: 'Piktochart · Pricing', url: 'https://piktochart.com/pricing/' }, { label: 'Canva · Plans and features', url: 'https://www.canva.com/pricing/' }];
const photoSources = [{ label: 'Pixlr · Pricing', url: 'https://pixlr.com/pricing/' }, { label: 'Photopea · Open and Save', url: 'https://www.photopea.com/learn/opening-saving' }];

export const creativeComparisonGuides: Record<string, Record<'fr' | 'en', ComparisonDecisionGuide>> = {
  'pdf-agile-vs-adobe-acrobat': {
    fr: {
      checkedAt: '2026-09-27', scope: '',
      intro: 'PDF Agile vs Adobe Acrobat Pro : le choix dépend de vos documents et de leur circuit de validation. Pour corriger et convertir vos propres PDF, testez PDF Agile. Pour un processus partagé de signature ou de contrôle documentaire, examinez Acrobat Pro.',
      scenarios: [
        { situation: 'Édition individuelle', choice: 'PDF Agile pour vos PDF du quotidien', reason: 'À essayer pour modifier, convertir et traiter des scans, avec une licence payée une seule fois.', limit: 'Vérifiez la mise en page sur vos documents réels. Un prix inférieur ne prouve pas une qualité OCR équivalente.' },
        { situation: 'Circuit documentaire', choice: 'Acrobat Pro pour un processus partagé', reason: 'À examiner si votre travail demande comparaison de versions, caviardage ou collecte de signatures suivie.', limit: 'Le tarif annuel facturé au mois reste un engagement annuel. Ne le confondez pas avec un abonnement mensuel sans engagement.' },
      ],
      criteria: [
        { title: 'Corriger et convertir', a: 'Édition, conversion et OCR.', b: 'Édition, conversion et traitement de scans.', takeaway: 'Comparez les tableaux, polices et retours à la ligne du fichier exporté.' },
        { title: 'Valider un document', a: 'Signature et protection annoncées ; vérifiez le circuit attendu.', b: 'Comparaison de versions, caviardage et suivi des demandes de signature.', takeaway: 'Ajouter une signature sur une page ne remplace pas forcément un circuit de validation.', source: 2 },
        { title: 'Acheter', a: 'Paiement unique, avec durée de mises à jour selon la formule.', b: 'Abonnement. Les fonctions AI Assistant ne sont pas toutes incluses dans Pro.', takeaway: 'Listez les fonctions nécessaires avant de comparer les montants.' },
      ],
      prices: [
        { label: 'Licence et abonnement', a: 'Annual : 59 $ en paiement unique, avec un an de mises à jour et de support.', b: 'Pro : 19,99 $/mois, engagement annuel facturé mensuellement, sur la page US.', note: 'Deux modèles commerciaux différents : ne pas présenter ces montants comme deux abonnements mensuels.' },
        { label: 'Sur la durée', a: 'Lifetime : 119 $ en paiement unique, prix promotionnel observé. Mises à jour et support à vie annoncés.', b: '239,88 $ pour douze mensualités de 19,99 $, hors variations et taxes applicables.', note: 'La comparaison ne garantit ni les promotions futures ni une équivalence fonctionnelle.' },
      ],
      priceNote: 'Observation du 27 septembre 2026, en USD, sans conversion en euros. Confirmez le pays, les taxes et les conditions au paiement. Adobe indique des frais possibles en cas de résiliation anticipée après 14 jours.',
      switching: [{ title: 'Garder Acrobat', text: 'Vos clients ou collègues dépendent déjà de ses validations ? Testez le circuit complet avant de supprimer votre abonnement.' }, { title: 'Passer à PDF Agile', text: 'Vous gérez principalement vos propres fichiers ? Vérifiez les exports et l’OCR, puis choisissez la licence correspondant à la durée de mises à jour voulue.' }],
      trial: ['Préparez un PDF avec tableaux, un scan et un formulaire sans données sensibles.', 'Corrigez le même passage et exportez les fichiers dans les deux outils.', 'Ouvrez le résultat dans un autre lecteur et faites valider le document par son destinataire.'],
      faq: [{ question: 'PDF Agile peut-il remplacer Acrobat Pro ?', answer: 'Pour certaines tâches individuelles, il mérite un essai. La réponse dépend de la fidélité des exports et de votre besoin de signatures, de formulaires ou de caviardage. Ce comparatif documentaire ne présente pas de test de qualité OCR réalisé par ToolTrim.' }, { question: 'La licence à vie est-elle facturée chaque mois ?', answer: 'Non. Le tarif Lifetime observé est un paiement unique de 119 $, sans mensualisation. Confirmez les conditions de licence, d’activation et de support avant achat.' }],
      alternatives: [], sources: pdfSources,
    },
    en: {
      checkedAt: '2026-09-27', scope: '',
      intro: 'PDF Agile vs Adobe Acrobat Pro: choose around your documents and approval process. Try PDF Agile for editing and converting your own PDFs. Examine Acrobat Pro for shared signing and document-control workflows.',
      scenarios: [
        { situation: 'Individual editing', choice: 'PDF Agile for everyday PDFs', reason: 'Worth trying for edits, conversion and scans, with a one-time licence purchase.', limit: 'Check layout on real files. A lower price does not establish equal OCR accuracy.' },
        { situation: 'Document workflow', choice: 'Acrobat Pro for shared processes', reason: 'Consider it for version comparison, redaction or tracked signature requests.', limit: 'Annual billing paid monthly still requires an annual commitment. It is not a cancel-anytime monthly plan.' },
      ],
      criteria: [
        { title: 'Edit and convert', a: 'Editing, conversion and OCR.', b: 'Editing, conversion and scan processing.', takeaway: 'Inspect tables, fonts and line breaks in the exported file.' },
        { title: 'Approve documents', a: 'Signing and protection advertised; check the required workflow.', b: 'Version comparison, redaction and signature-request tracking.', takeaway: 'Placing a signature on a page does not necessarily replace an approval process.', source: 2 },
        { title: 'Purchase model', a: 'One-time payment, with an update period tied to the plan.', b: 'Subscription. Pro does not include every AI Assistant feature.', takeaway: 'List required features before comparing amounts.' },
      ],
      prices: [
        { label: 'Licence and subscription', a: 'Annual: $59 one-time, including one year of updates and support.', b: 'Pro: $19.99/month, annual commitment billed monthly, on the US page.', note: 'Different purchase models, not two comparable monthly subscriptions.' },
        { label: 'Longer-term cost', a: 'Lifetime: $119 one-time promotional price observed, with lifetime updates and support advertised.', b: '$239.88 for twelve payments of $19.99, before changes and applicable taxes.', note: 'This does not guarantee future promotions or equivalent functionality.' },
      ],
      priceNote: 'Observed on 27 September 2026 in USD, without currency conversion. Confirm country, tax and checkout terms. Adobe warns of possible early cancellation fees after 14 days.',
      switching: [{ title: 'Keep Acrobat', text: 'Clients or colleagues depend on its approvals? Test the whole workflow before cancelling.' }, { title: 'Move to PDF Agile', text: 'Mostly handling your own files? Validate exports and OCR, then choose the update period you need.' }],
      trial: ['Prepare a PDF with tables, a scan and a form without sensitive data.', 'Make the same edit and export the files in both tools.', 'Open the output in another reader and ask the recipient to validate it.'],
      faq: [{ question: 'Can PDF Agile replace Acrobat Pro?', answer: 'It is worth testing for some individual tasks. The answer depends on export fidelity and your signing, form or redaction requirements. This documentary comparison does not report an OCR quality benchmark carried out by ToolTrim.' }, { question: 'Is the lifetime licence charged monthly?', answer: 'No. The observed Lifetime price is a single $119 payment, not a monthly amount. Confirm licensing, activation and support terms before buying.' }],
      alternatives: [], sources: pdfSources,
    },
  },
  'piktochart-vs-canva': {
    fr: {
      checkedAt: '2026-09-27', scope: '',
      intro: 'Piktochart vs Canva : partez du livrable. Un rapport visuel récurrent mérite un essai dans Piktochart ; une communication mêlant présentations, réseaux sociaux et vidéo invite à regarder Canva. Le format à livrer peut départager les forfaits.',
      scenarios: [
        { situation: 'Rapports et infographies', choice: 'Piktochart pour expliquer vos données', reason: 'À tester sur un rapport, un diagramme ou une infographie que vous devez remettre à jour régulièrement.', limit: 'Le forfait Pro exporte en PNG. Pour livrer un PDF ou un PowerPoint, la grille standard renvoie vers Business.' },
        { situation: 'Communication variée', choice: 'Canva pour réunir vos formats', reason: 'À examiner si les mêmes éléments servent à vos présentations, publications et vidéos.', limit: 'Vérifiez les ressources payantes et le forfait de chaque collaborateur avant de compter sur un modèle partagé.' },
      ],
      criteria: [
        { title: 'Livrable principal', a: 'Infographies, rapports et diagrammes.', b: 'Présentations, formats sociaux, documents et vidéos.', takeaway: 'Reproduisez votre dernier livrable plutôt que de comparer le nombre de modèles.' },
        { title: 'Fichier final', a: 'PNG dans Pro ; PDF et PowerPoint dans Business.', b: 'Exports PDF, JPG et PNG présentés dans la gamme.', takeaway: 'Testez le fichier remis au client, pas seulement le rendu dans l’éditeur.', source: 1 },
        { title: 'Travail récurrent', a: 'Un modèle de rapport à actualiser avec vos chiffres.', b: 'Un ensemble de supports à décliner dans le même espace.', takeaway: 'Le meilleur choix est celui qui limite les corrections sur votre production réelle.' },
      ],
      prices: [
        { label: 'Essai gratuit', a: 'Free : deux téléchargements, au format PNG.', b: 'Canva Free disponible ; contrôlez les éléments utilisés avant export.', note: 'Un compte gratuit ne donne pas accès à toutes les ressources payantes.' },
        { label: 'Publication régulière', a: 'Pro : 10 $/membre/mois facturés annuellement, soit 120 $/an. Business : 17 $, soit 204 $/an.', b: 'Pro ou Business selon le besoin. Montant local à confirmer dans le sélecteur officiel.', note: 'Pour un livrable PDF dans Piktochart, comparez Business, pas le seul prix Pro.' },
      ],
      priceNote: 'Sources consultées le 27 septembre 2026. Prix Piktochart en USD et paiement annuel ; prix local Canva non confirmé ici. Pas de conversion de devise ni de promesse d’économie.',
      switching: [{ title: 'Garder Canva', text: 'Votre équipe y produit déjà les supports attendus ? Un nouveau modèle peut suffire avant d’ajouter un abonnement.' }, { title: 'Essayer Piktochart', text: 'Vos rapports demandent trop de remise en page ? Reproduisez un document complet, puis sa mise à jour mensuelle, pour évaluer l’intérêt.' }],
      trial: ['Prenez le même jeu de données et un rapport anonymisé.', 'Créez une page, puis modifiez trois chiffres et un paragraphe.', 'Exportez dans le format client et vérifiez lisibilité, liens et éléments modifiables.'],
      faq: [{ question: 'Piktochart Pro inclut-il le PDF ?', answer: 'La grille standard consultée réserve les exports PDF et PowerPoint à Business. Pro inclut les téléchargements PNG. Les offres éducation et associations ont leurs propres conditions.' }, { question: 'Faut-il les deux outils ?', answer: 'Seulement si chacun répond à un besoin régulier distinct. Commencez par le livrable qui vous bloque. Ce comparatif ne démontre pas de gain de temps mesuré entre les deux éditeurs.' }],
      alternatives: [{ slug: 'visme', name: 'Visme', reason: 'À examiner pour d’autres besoins de présentation.' }], sources: infographicSources,
    },
    en: {
      checkedAt: '2026-09-27', scope: '',
      intro: 'Piktochart vs Canva: start with the deliverable. A recurring visual report warrants a Piktochart trial; a mix of presentations, social posts and video points toward Canva. The required output format can decide which plan you need.',
      scenarios: [
        { situation: 'Reports and infographics', choice: 'Piktochart for explaining your data', reason: 'Try it on a report, diagram or infographic you need to update regularly.', limit: 'Pro exports PNG. The standard pricing table puts PDF and PowerPoint exports in Business.' },
        { situation: 'Mixed communication', choice: 'Canva for multiple formats', reason: 'Consider it when the same assets support presentations, posts and videos.', limit: 'Check paid assets and collaborator plans before relying on a shared template.' },
      ],
      criteria: [
        { title: 'Main deliverable', a: 'Infographics, reports and diagrams.', b: 'Presentations, social formats, documents and videos.', takeaway: 'Recreate your last deliverable instead of counting templates.' },
        { title: 'Final file', a: 'PNG in Pro; PDF and PowerPoint in Business.', b: 'PDF, JPG and PNG exports listed across the range.', takeaway: 'Test the file you hand over, not just its appearance in the editor.', source: 1 },
        { title: 'Recurring work', a: 'A report template to refresh with new figures.', b: 'Several types of content in one workspace.', takeaway: 'Choose around the corrections required in your actual production.' },
      ],
      prices: [
        { label: 'Free starting point', a: 'Free: two downloads, in PNG format.', b: 'Canva Free available; check your chosen assets before exporting.', note: 'A free account does not unlock every paid asset.' },
        { label: 'Regular publishing', a: 'Pro: $10/member/month billed annually, or $120/year. Business: $17, or $204/year.', b: 'Pro or Business depending on requirements. Confirm local pricing in the official selector.', note: 'For PDF delivery in Piktochart, compare Business rather than the headline Pro price.' },
      ],
      priceNote: 'Sources consulted on 27 September 2026. Piktochart prices are USD with annual payment; local Canva pricing is not confirmed here. No currency conversion or savings claim.',
      switching: [{ title: 'Keep Canva', text: 'Your team already delivers the required materials there? A better template may be enough before adding a subscription.' }, { title: 'Try Piktochart', text: 'Reports take too much layout work? Recreate a whole document and its next monthly update to assess the benefit.' }],
      trial: ['Use the same dataset and anonymised report.', 'Create a page, then change three figures and a paragraph.', 'Export the client format and check readability, links and editable elements.'],
      faq: [{ question: 'Does Piktochart Pro include PDF export?', answer: 'The standard table consulted places PDF and PowerPoint downloads in Business. Pro includes PNG downloads. Education and nonprofit plans have separate terms.' }, { question: 'Do I need both tools?', answer: 'Only when each serves a distinct recurring task. Start with the deliverable causing problems. This comparison does not establish a measured time saving between the editors.' }],
      alternatives: [{ slug: 'visme', name: 'Visme', reason: 'Consider for other presentation requirements.' }], sources: infographicSources,
    },
  },
  'pixlr-vs-photopea': {
    fr: {
      checkedAt: '2026-09-27', scope: '',
      intro: 'Pixlr vs Photopea : cherchez-vous à produire une image rapidement ou à reprendre un fichier avec ses calques ? Pixlr mérite un essai pour les retouches et outils IA. Photopea est à examiner en priorité si le PSD est au centre de vos échanges.',
      scenarios: [
        { situation: 'Retouche et génération', choice: 'Pixlr pour une production photo assistée', reason: 'À tester sur vos détourages, retouches et variantes visuelles dans le navigateur.', limit: 'Les fonctions IA consomment des crédits. Un nombre de crédits n’est pas une garantie de livrables utilisables.' },
        { situation: 'Fichiers à reprendre', choice: 'Photopea pour travailler vos PSD', reason: 'À essayer quand il faut ouvrir un projet, reprendre ses calques et conserver un fichier éditable.', limit: 'Vérifiez les polices, effets et objets du PSD réel. La compatibilité annoncée ne garantit pas une reproduction parfaite.' },
      ],
      criteria: [
        { title: 'Point de départ', a: 'Photo à retoucher ou contenu à générer.', b: 'Projet à ouvrir, éditer et réenregistrer en PSD.', takeaway: 'Une image aplatie et un fichier de travail ne répondent pas au même besoin.' },
        { title: 'Budget de production', a: 'Forfaits sans publicité avec crédits IA.', b: 'Éditeur accessible gratuitement ; conditions Premium à vérifier dans l’application.', takeaway: 'Comptez les retouches et tentatives nécessaires, pas seulement le premier résultat.' },
        { title: 'Livraison', a: 'Vérifiez dimensions, transparence et format dans votre flux.', b: 'PSD pour le projet, exports d’image pour la diffusion.', takeaway: 'Conservez le fichier éditable avant de livrer une version aplatie.', source: 2 },
      ],
      prices: [
        { label: 'Retoucher sans abonnement', a: 'Accès gratuit avec limites ; vérifiez les exports avant de démarrer une série.', b: 'Éditeur gratuit disponible.', note: 'Le gratuit suffit peut-être à une correction occasionnelle.' },
        { label: 'Usage régulier', a: 'Plus : 2,49 €/mois, 80 crédits IA mensuels. Premium : 9,99 €/mois, 1 000 crédits mensuels.', b: 'Aucun tarif Premium vérifié ici ; consultez l’offre dans l’éditeur.', note: 'Prix Pixlr observés avec facturation mensuelle, pas les équivalents annuels affichés à côté.' },
      ],
      priceNote: 'Observation du 27 septembre 2026, Pixlr affiché en EUR. Confirmez taxes, validité des crédits et modèle utilisé. Aucun coût garanti par image ni conversion en USD.',
      switching: [{ title: 'Garder votre éditeur', text: 'Les fichiers clients s’ouvrent correctement et vos retouches passent ? Un changement doit résoudre une friction réelle.' }, { title: 'Tester l’autre', text: 'Prenez le fichier qui vous bloque et tentez un aller-retour complet avant de changer votre production.' }],
      trial: ['Ouvrez une photo et un PSD anonymisé avec calques.', 'Effectuez une correction, un détourage et une exportation.', 'Rouvrez le fichier de travail et inspectez polices, transparence et dimensions.'],
      faq: [{ question: 'Photopea ouvre-t-il les PSD ?', answer: 'Oui, la documentation décrit leur ouverture et l’enregistrement au format PSD. Testez néanmoins les fichiers de vos clients pour repérer les écarts de rendu ou les ressources manquantes.' }, { question: 'Pixlr Premium est-il nécessaire pour une retouche ?', answer: 'Pas systématiquement. Essayez le flux gratuit sur votre fichier. Un forfait se justifie si ses limites, la publicité ou les besoins en crédits bloquent une tâche récurrente, pas simplement parce que l’option existe.' }],
      alternatives: [], sources: photoSources,
    },
    en: {
      checkedAt: '2026-09-27', scope: '',
      intro: 'Pixlr vs Photopea: do you need a finished image quickly or a layered project you can keep editing? Try Pixlr for retouching and AI tools. Examine Photopea first when PSD files are central to your work.',
      scenarios: [
        { situation: 'Retouching and generation', choice: 'Pixlr for assisted photo production', reason: 'Try it on cutouts, edits and visual variants in your browser.', limit: 'AI features consume credits. A credit allowance does not guarantee a number of usable deliverables.' },
        { situation: 'Editable projects', choice: 'Photopea for PSD workflows', reason: 'Worth trying to open a project, edit its layers and keep an editable file.', limit: 'Check fonts, effects and objects in your actual PSD. Format support does not guarantee perfect reproduction.' },
      ],
      criteria: [
        { title: 'Starting point', a: 'A photo to retouch or content to generate.', b: 'A project to open, edit and save as PSD.', takeaway: 'A flattened image and a working file serve different purposes.' },
        { title: 'Production budget', a: 'Ad-free plans with AI credits.', b: 'Free editor access; check Premium terms inside the app.', takeaway: 'Count corrections and attempts, not just the initial result.' },
        { title: 'Handover', a: 'Check dimensions, transparency and format in your workflow.', b: 'PSD for the project, image exports for publishing.', takeaway: 'Keep an editable file before delivering a flattened version.', source: 2 },
      ],
      prices: [
        { label: 'Without a subscription', a: 'Free access with limits; check exports before starting a series.', b: 'Free editor available.', note: 'Free access may cover an occasional correction.' },
        { label: 'Regular use', a: 'Plus: €2.49/month, 80 monthly AI credits. Premium: €9.99/month, 1,000 monthly credits.', b: 'No Premium price verified here; consult the offer inside the editor.', note: 'Pixlr amounts observed on monthly billing, not the annual equivalents shown alongside them.' },
      ],
      priceNote: 'Observed on 27 September 2026 with Pixlr displaying EUR. Confirm taxes, credit validity and model choice. No guaranteed cost per image or USD conversion.',
      switching: [{ title: 'Keep your editor', text: 'Client files open correctly and your edits work? A switch should solve a real problem.' }, { title: 'Test the alternative', text: 'Use the file causing trouble and complete a full round trip before moving production.' }],
      trial: ['Open a photo and an anonymised layered PSD.', 'Make a correction, cutout and export.', 'Reopen the working file and inspect fonts, transparency and dimensions.'],
      faq: [{ question: 'Can Photopea open PSD files?', answer: 'Yes. Its documentation describes opening them and saving projects as PSD. Still test client files to identify rendering differences or missing resources.' }, { question: 'Is Pixlr Premium required for a photo edit?', answer: 'Not necessarily. Try the free workflow on your file. A plan makes sense when limits, advertising or credit requirements block recurring work, not simply because an upgrade exists.' }],
      alternatives: [], sources: photoSources,
    },
  },
};
