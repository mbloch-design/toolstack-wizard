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

## Mesure déjà présente et limites

Le code du parcours émet `stack_explorer_click` (source `whole_stack` pour le fil global), `stack_tool_open`, `explorer_recenter`, `add_to_stack` et `stack_remove` via le mécanisme analytics commun. Cette présence dans le code n’atteste ni la réception GA4 ni une audience réelle.

Les événements ne suffisent pas actuellement à calculer une réussite complète : pas de corrélation de visite dédiée au parcours, pas de distinction systématique entre ajout depuis Explorer et ajout depuis une autre page, pas de mesure explicite de l’aide nécessaire ou de la pertinence perçue. La grille d’observation reste nécessaire. Ne pas envoyer le nom des collections, le contenu de la stack ou des verbatims à GA4.

## Périmètre maintenu

Essais réels à programmer plus tard par le propriétaire. R5/R6 éditoriaux, campagne tarifaire, migration distante, couverture exhaustive WebKit et optimisations de chargement restent différés. Le paiement réel reste exclu.

## Contrôles techniques du 13 octobre

Sept scénarios ciblés d’accessibilité passent sur le site public : quatre routes auditées sans violation sérieuse/critique détectée, recherche clavier avec retour de focus, fermeture mobile et menu Explorer avec retour de focus. Ces contrôles restent partiels. Trois scénarios hérités (ancien menu de carte, ancien filtre catégorie et ancien panneau de filtres stacks) visaient des contrôles remplacés. Ils ont été repris le 14 octobre sur les actions actuelles, avec ouverture et fermeture clavier, sélection, persistance et retour de focus, en FR/EN et mobile/ordinateur. Les deux panneaux de filtres sans nom accessible ont été corrigés. La suite Chromium comprend désormais 21 contrôles ; cela ne certifie ni la couverture exhaustive R8, ni WebKit, ni les lecteurs d’écran.

Un obstacle technique distinct est reproduit sur une fiche prérendue : le bouton d’ajout peut être cliqué avant le chargement de son code, sans enregistrer l’outil. Le correctif le maintient inactif jusqu’à son hydratation ; les textes, tarifs et liens SEO restent conservés. Cette recette ne remplace pas une observation de la valeur des suggestions.
