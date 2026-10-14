# R9 — Observer Ma Stack et Explorer

État au 13 octobre 2026 : support prêt ; essais réels différés à la demande du propriétaire. Aucun participant observé, aucune réussite utilisateur revendiquée. Les validations navigateur sont une recette technique distincte.

## Préparation

Prévoir environ quinze minutes par personne, sur son ordinateur ou son téléphone. Cible : freelance ou petite équipe qui utilise plusieurs outils SaaS. Ouvrir https://tooltrim.com/fr/ma-stack dans un profil de navigateur de test, sans effacer une sélection personnelle existante. Aucun compte requis. Utiliser uniquement des outils réellement présents dans le catalogue.

Donner les tâches une à une, sans montrer les boutons. Noter les obstacles et les paroles exactes ; demander « qu’attendais-tu ici ? » après une hésitation. Si une aide est donnée, la consigner. Ne pas demander de paiement, d’email ni d’identifiant personnel.

## Tâches à lire

1. « Ajoute deux outils que tu utilises à ta stack. »
2. « Cherche une nouvelle idée à partir de l’ensemble de tes outils. »
3. « Choisis une idée, explique ce qui la relie à tes outils, puis explore autour d’elle. »
4. « Enregistre un outil qui t’intéresse dans une collection, puis retrouve-le dans ta stack. »
5. « Retire cet outil, annule le retrait, puis recharge la page. Retrouves-tu ta sélection ? »

Si la personne ne trouve pas de suggestion pertinente, noter cette limite plutôt que lui imposer une idée. La réussite d’un clic ne prouve pas la pertinence du lien.

## Grille à remplir après observation

Codes : S = terminé seul ; A = terminé avec aide ; X = abandonné. Laisser les cellules vides tant que le test n’a pas eu lieu.

| Participant anonyme | Appareil / langue | T1 | T2 | T3 | T4 | T5 | Obstacle et paroles exactes |
|---|---|---|---|---|---|---|---|
| P1 | | | | | | | |
| P2 | | | | | | | |
| P3 | | | | | | | |
| P4 | | | | | | | |
| P5 | | | | | | | |

## Décision après les cinq essais

Critère R9 : quatre personnes sur cinq accomplissent le parcours sans aide. Identifier séparément les obstacles de navigation, d’enregistrement et de pertinence des suggestions. Corriger d’abord les obstacles reproduits, dans les routes et composants existants. Les réserves éditoriales R5 restent ouvertes ; ce test ne recertifie ni les prix ni le catalogue.

## Mesure technique du parcours — 14 octobre 2026

Les événements existants restent conservés : `stack_explorer_click` (`source: whole_stack` pour le fil global), `stack_tool_open`, `explorer_recenter`, `add_to_stack` et `stack_remove`. Le complément R9 distingue désormais les étapes propres à Explorer :

| Événement | Déclenchement | Paramètres propres à l’événement |
|---|---|---|
| `explorer_view` | Source exploitable affichée ; attend le chargement du tag et l’accord. Une fois par source affichée, pas à chaque filtre ou rerender. | `source_type` : `stack`, `outil` ou `objectif` |
| `explorer_save` | Confirmation du dialogue d’enregistrement, après mise à jour de la sélection locale. Une ouverture ou annulation ne compte pas. | `source_type` ; `intent` : `stack` ou `wishlist` |
| `explorer_back` | Clic sur le bouton de retour d’Explorer, avant navigation. | `source_type` |

Tous passent par le garde-fou analytics commun. Aucun événement métier sans consentement ; les clics antérieurs à l’accord ne sont pas rejoués. Une acceptation tardive peut mesurer la vue actuellement ouverte, jamais une vue déjà quittée. Aucun nouvel identifiant de visite, nom/identifiant de collection, liste d’outils ou verbatim dans ces trois charges utiles. Les événements existants peuvent inclure des slugs publics d’outils. Les vues de page consenties conservent leur fonctionnement existant, distinct de ces paramètres métier.

### Lecture attendue et limites

Pour les visites consenties, suivre la séquence `stack_explorer_click` → `explorer_view` → `explorer_save` → retour sur la route Ma Stack. Segmenter `explorer_view` et `explorer_save` par `source_type` et distinguer l’enregistrement `stack` de `wishlist`. `explorer_recenter` indique l’exploration d’une autre idée. Les décomptes globaux de ces événements, pris séparément, ne constituent pas un taux de conversion : une visite peut explorer plusieurs sources, enregistrer plusieurs idées ou revenir avec le bouton du navigateur.

`explorer_back` mesure une intention : il ne certifie pas une arrivée dans Ma Stack. Son historique peut mener à une autre étape d’Explorer ou à une fiche outil. Une vue de Ma Stack ultérieure est nécessaire pour vérifier l’arrivée. Les retours du navigateur ne produisent pas cet événement de clic. Un enregistrement confirme la mise à jour locale de l’interface, pas une synchronisation distante ou une persistance durable lorsque le stockage du navigateur est dégradé.

Aucun entonnoir GA4 configuré ni visibilité dans les rapports réels attestée par la recette automatisée isolée. Les scénarios navigateur interceptent les services analytics et vérifient les commandes GA4 locales ; ils ne polluent pas l’audience réelle. La mesure des personnes refusant le suivi reste limitée aux vues minimisées du Consent Mode existant. Ne pas confondre ces signaux avec une mesure exhaustive de l’audience, de la pertinence des liens ou d’une réussite sans aide. La grille d’observation reste nécessaire.

### Publication et recette publique du 14 octobre

Code R9 publié sur 5db09fd39d, déploiement Vercel réussi ; 773b57373e conserve ce code. Les 19 contrôles analytics/consentement publics passent (22 s), services simulés. Une seule visite réelle distincte a confirmé affichage, enregistrement et retour dans Ma Stack : zéro cookie GA avant accord ; les trois événements acceptés dans chacun des deux flux existants G-DL5MJKQ3JE et G-PQPPPH19MH (six réponses HTTP 204, consentement G101).

La réception réseau est attestée ; leur visibilité dans les rapports temps réel n’est pas encore attestée. Aucun réglage des propriétés n’a été changé. La CI a aussi révélé un chemin de capture Mac dans l’ancien scénario consentement mobile : remplacé par le dossier de résultats portable Playwright, scénario public rejoué avec capture créée. La chaîne distante complète doit confirmer cette correction.

### Vérification reproductible

- `npm test -- src/test/analytics/consent.spec.tsx` : cycle de consentement, chargement lent, accord tardif et annulation d’une vue quittée.
- `npx playwright test e2e/stack-analytics.spec.ts e2e/analytics-consent.spec.ts e2e/analytics-csp.spec.ts` : parcours réel, refus/retrait, données privées absentes des nouveaux paramètres, absence de doublon sur filtre et annulation distincte de confirmation. Services externes simulés.
- La CI exécute cette recette isolée et conserve les traces d’échec dans `analytics-test-results/`.

## Périmètre maintenu

Essais réels à programmer plus tard par le propriétaire. R5/R6 éditoriaux, campagne tarifaire, migration distante, couverture exhaustive WebKit et optimisations de chargement restent différés. Le paiement réel reste exclu.

## Contrôles techniques du 13 octobre

Sept scénarios ciblés d’accessibilité passent sur le site public : quatre routes auditées sans violation sérieuse/critique détectée, recherche clavier avec retour de focus, fermeture mobile et menu Explorer avec retour de focus. Ces contrôles restent partiels. Trois scénarios hérités (ancien menu de carte, ancien filtre catégorie et ancien panneau de filtres stacks) visaient des contrôles remplacés. Ils ont été repris le 14 octobre sur les actions actuelles, avec ouverture et fermeture clavier, sélection, persistance et retour de focus, en FR/EN et mobile/ordinateur. Les deux panneaux de filtres sans nom accessible ont été corrigés. La suite Chromium comprend désormais 21 contrôles ; cela ne certifie ni la couverture exhaustive R8, ni WebKit, ni les lecteurs d’écran.

Un obstacle technique distinct est reproduit sur une fiche prérendue : le bouton d’ajout peut être cliqué avant le chargement de son code, sans enregistrer l’outil. Le correctif le maintient inactif jusqu’à son hydratation ; les textes, tarifs et liens SEO restent conservés. Cette recette ne remplace pas une observation de la valeur des suggestions.
