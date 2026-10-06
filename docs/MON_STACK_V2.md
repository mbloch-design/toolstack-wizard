# Mon Stack V2 — correction UX, 5 octobre 2026

## Audit préalable

Relus avant modification : CartPage, StackToolInspector, stackView, useStackPins et stackState ; ToolSummary et chargement des fiches ; types catalogue, index léger et générateur ; helpers pricing/toolUtils/classification ; design system, architecture et roadmap V1. Rendu existant inspecté sur la sélection locale de 13 outils, sans modifier cette sélection.

Le catalogue local contient 1 348 outils. Champs réellement renseignés : catégorie 1 348, functional_needs 1 339, covers 1 335, cluster de substitution 1 260, useCases 1 281 (EN 1 275), personas 864, alternatives explicites 712, pricing_v5 1 090 (EN 562). Pas de subcategory ni de features génériques ; tags présents sur seulement 5 objets bruts, absents du contrat général. Ils ne constituent pas une source générale de classification.

L’index léger fournit catégorie, functional_needs, cluster, personas et références freeAlternative/betterAlternative. Il ne fournit pas covers, useCases, alternatives ni plans. covers peut arriver au rafraîchissement catalogue ; la fiche complète fournit les autres champs à la demande pour le seul Focus. Aucune colonne, requête ou écriture serveur ajoutée. Pas de copie des données catalogue dans la sélection locale.

L’ancien classificateur de besoins est conservé pour ses autres consommateurs. Ses huit objectifs, déductions par nom et descriptions ne servent pas à fabriquer la nouvelle Map.

## Conserver / Ajuster / Retravailler

| Décision | Intervention |
|---|---|
| Conserver | CartPage, routes, recherche/ajout immédiat, stockage et undo, switch mémorisé, Focus intégré, fiche et retrait, design system |
| Ajuster | Stack catalogue : padding vertical des outils 16 → 8 px et rythme intergroupes 32 → 24 px ; prix courts ; fermeture et navigation query sans remise à zéro du scroll |
| Retravailler | Classification et composition Map ; hiérarchie contextuelle du Focus et représentation unique des tarifs |

## Modèle sémantique minimal

`stackUsage.ts` est une transformation pure du catalogue, utilisée par les deux composants existants. Ordre de lecture : cluster spécifique reconnu → signaux functional_needs → covers disponibles → repli neutre vers le libellé catalogue dans « Autres usages ». Les clusters génériques content-creation et design-support sont volontairement ignorés. Aucun classement à partir du nom produit, des descriptions, de personas supposés ou d’un questionnaire.

Les territoires regroupent des sous-territoires issus du vocabulaire observé : Créer (3D, Vidéo & Motion, Audio, Interfaces & Prototypage, Photo & Image, Design visuel), Communiquer (Écriture, Contenu & Audience, Email & Prospection, Échanges & Support), Automatiser, Construire (Sites, Infrastructure, Code, Formulaires), Organiser (Notes & Documents, Fichiers & Stockage, Projets, Agenda), Gérer, Analyser, IA généraliste. Seuls les groupes réellement peuplés sont rendus. Un outil conserve une seule position ; les usages supplémentaires connus restent au Focus.

| Outils du cas observé | Position principale | Données utilisées |
|---|---|---|
| Cinema 4D, Houdini, ZBrush | Créer / 3D | cluster 3d-software, malgré motion-design partagé |
| After Effects, Red Giant, Motion Array | Créer / Vidéo & Motion | besoins motion/plugin/assets/video |
| Audacity | Créer / Audio | montage-audio, enregistrement-multipistes |
| Adobe Express | Créer / Design visuel | design-visuel, quick-design, branding, social-assets |
| Grammarly | Communiquer / Écriture | writing-assistant, correction-texte |
| VidIQ | Communiquer / Contenu & Audience | seo-tools, seo-video, analytics-contenu |
| Figma, Miro | Créer / Interfaces & Prototypage | design-interface, design-prototyping |
| Make, Zapier | Automatiser / Workflows | automation-orchestration |
| Acrobat | Organiser / Notes & Documents | pdf-tools |
| Fly.io, Wix | Construire / Infrastructure ou Sites | cloud-hosting-paas, website-builder |

Cela décrit les capacités catalogue dans une sélection personnelle, pas l’usage réel de la personne. Le cas de 25 outils a également permis de vérifier les clusters réels ai-text-generalist, cloud-storage et form-builder : les assistants généralistes ne sont pas réduits à l’écriture, Dropbox reste dans les fichiers et Typeform dans les formulaires. Les correspondances restent limitées au vocabulaire audité ; les données inconnues restent visibles sans relation sémantique supposée.

## Rendu et Focus

Map : composition flexible ouverte, largeur selon le nombre de sous-territoires, titres discrets et frontières fines. Logo et nom sont les objets principaux ; aucun prix dans Map. Mobile : même hiérarchie en lecture verticale. Le Focus reste sous le territoire sans élargir/repositionner ses outils à l’ouverture.

Focus : position, liste courte de libellés d’usage FR/EN, outils présents avec relation individuelle, puis plans catalogue. Une référence explicite est libellée « Alternative connue » ; un voisin déterministe « Également dans [sous-territoire] ». Une catégorie seule ne crée aucune relation. Les tags inconnus ne sont pas exposés comme slugs ni remplacés par des fonctions inventées.

Tarifs Stack : Gratuit uniquement si offre gratuite attestée et absence d’offre payante, Freemium si gratuite + prix payant/devis attestés, montant natif court ou Sur devis. Essais, montants zéro, prix approximatifs, consommation et formats numériques ambigus sont masqués. Focus : au plus trois plans (gratuit, référence, puis autre), montants natifs, unités localisées, taxes et engagement explicite conservés ; conditions du gratuit conservées. Sans plans exploitables, repli sur le texte catalogue localisé fiable. Aucune conversion ou somme.

Fermeture : même mode, bouton d’origine refocalisé et scroll mémorisé restauré instantanément après retrait du panneau (indépendamment du scroll fluide global). Le shell continue de gérer le scroll global ; aucune animation ou nouvelle couche d’interaction.

## Validation

- 71/71 tests ciblés PASS : stockage/undo et régressions V1, classification des données réelles, unicité sur 1/5/13/25 outils, prix courts, formats ambigus, relations connues et absence de fausses relations, unités natives.
- Vérificateur strict TypeScript : erreurs historiques hors fichiers modifiés ; aucune erreur sur CartPage, StackToolInspector, stackView ou stackUsage. Le build ne remplace pas cette vérification.
- CSS : aucun changement hors bloc Mon Stack, aucune couleur hex ou rayon littéral supplémentaire ; baseline design-tokens historique non modifiée. `git diff --check` PASS.
- Les assertions E2E V1 ont été adaptées à la Map flexible et à l’absence de prix, sans annoncer leur exécution Playwright pour V2. Les contrôles navigateur de cette passe utilisent le navigateur intégré.
- Rendus et interactions : contrôles de stacks 1, 5, 13 et 25, desktop et mobile ; captures finales et bilan build ci-dessous.

Limites : Chromium du navigateur intégré uniquement, pas de Safari/WebKit ou étude d’usage. Les correspondances n’inventent pas une fonction quand le vocabulaire est inconnu. L’audit porte sur le catalogue disponible, sans nouvelle collecte des tarifs chez les éditeurs. Dark mode détaillé reste différé comme en V1.


## Ajustement MVP du Focus — 5 octobre 2026

Cette passe remplace la hiérarchie et le détail des tarifs décrits plus haut : relations avec le stack en premier, usages catalogue et position ensuite, repère tarifaire court en dernier. Les plans détaillés restent dans la fiche.

Les relations explicitent jusqu’à trois usages communs connus, par intersection des identifiants functional_needs/covers. Une intersection peut relier deux territoires différents. Une proximité de classement seule conserve son libellé général. Aucun alias deviné, enrichissement catalogue, verdict de remplacement ou nouvelle interaction. Les informations manquantes ne deviennent pas des absences.


Validation de cette passe MVP : 27 tests ciblés dans 8 fichiers PASS ; build production complet (génération, prerender et budgets) PASS ; diff sans erreur d’espacement. TypeScript applicatif conserve des erreurs hors des fichiers de cette passe, aucune sur StackToolInspector ou stackUsage. Contrôle Chromium desktop/mobile à 390 px : usages communs et proximité générale, navigation entre Focus, fermeture/réouverture sans modification des 25 outils du stack de contrôle. Capture desktop : /private/tmp/focus-mvp-desktop.png. Aucune publication ni étude utilisateur effectuée.


## Focus et navigation par domaines — 6 octobre 2026

- Barre de domaines présents avec compteurs de sélection, état actif souligné et deux pictogrammes Stack/Map à droite. Le filtre est commun aux deux vues et reste un état de consultation. Un changement de domaine masque le Focus s’il exclut l’outil ; suivre un outil lié hors filtre rétablit Tous les outils.
- Focus après la rangée sélectionnée dans Stack ; après la rangée de sous-territoires concernée dans Map desktop ; immédiatement sous l’outil dans les deux vues mobiles. Mesure des colonnes par ResizeObserver, sans déplacer les outils dans leur classement.
- Lecture usages → autres outils : lignes de correspondance précises, autres usages séparés, alternatives référencées et simples voisins de domaine distincts. Prix court dans l’en-tête, actions en bas, nom et surface du Focus mieux différenciés.
- Les signaux génériques (dont motion-design, design-visuel, collaboration) ne produisent plus de liens fonctionnels précis. Les outils liés par un usage précis ou une référence explicite sont signalés dans la Map, sans graphe ni score.
- Le chargement de la fiche sélectionnée est partagé avec la Map et vérifié par identifiant : les données conservées du précédent outil pendant le chargement ne sont pas affichées pour le nouveau.
- Validation : 29 tests ciblés PASS ; build production complet PASS (dernier journal /private/tmp/stack-toolbar-build.log). TypeScript conserve des erreurs hors fichiers modifiés, aucune sur les fichiers de cette passe. Contrôle navigateur desktop : filtre Automatiser (2 outils), maintien du filtre en Map, Créer (11 outils), Focus Figma (Prototypage/Miro, alternative Canva), précédemment Adobe Express (proximité générale). Le contrôle mobile final est limité par un timeout répété de la commande de viewport du navigateur ; la CSS et l’insertion mobile sont implémentées mais ne sont pas déclarées visuellement validées. Capture Focus : /private/tmp/stack-focus-final.png.

Bilan produit : réponse au clic plus identifiable et lecture des usages communs plus directe. La valeur informative demeure conditionnée aux données : une proximité générale Adobe Express/Canva ne constitue pas une découverte forte. Pas de test utilisateur ni de preuve de valeur « game changer » à ce stade. Aucun enrichissement catalogue ni déploiement.


### 6 octobre 2026 — Liste, Carte et Focus contextualisé

Liste en lignes (outil, usage, tarif), Carte en blocs de domaines et usages ; libellés visibles à côté des pictogrammes. Focus structuré en identité, message sur la place dans la stack, outils associés en lignes et actions séparées. Les proximités générales ne suggèrent pas une substitution. Aucun enrichissement catalogue. Validation : 74 tests Ma Stack réussis ; contrôle desktop Liste/Carte et Focus Red Giant, capture /private/tmp/stack-product-focus.png. Mobile final non vérifié. Changements locaux, sans publication.


### Composition de la sélection — 6 octobre 2026

Carte desktop : Focus dans un grid item latéral sticky, indépendant des groupes. Sélection sombre, liens précis/références soulignés et outils sans lien atténués. Groupes de hauteur naturelle. Liste desktop en colonnes nom/usage/tarif. Focus sans phrase générique ni compteur de groupe ; Audacity se limite aux usages et actions. Sous 900 px, le panneau revient dans le flux avant la carte. 74 tests PASS et compilation SSR PASS ; contrôle visuel desktop Audacity réalisé. Mobile non validé visuellement. Aucun enrichissement catalogue ni publication.


### Mes outils — hiérarchie et vocabulaire (6 octobre 2026)

Titre Mes outils, vues Liste / Par usage. Les deux vues partagent les domaines fonctionnels ; la Liste expose les colonnes Outil, Usage, Tarif catalogue. Colonne de détail réservée sur desktop pour conserver les positions à l’ouverture/fermeture ; panneau identique dans les deux vues. Suppression de l’atténuation générale et des bordures décoratives de groupes. Actions Voir la fiche complète / Retirer de mes outils. 74 tests PASS. Contrôle desktop : position du premier groupe inchangée à la fermeture (x 124, largeur 281.5 px). Mobile et suite e2e complète non exécutés. Aucun enrichissement ni publication.


### Fiche de contexte : fonction et chevauchements — 6 octobre 2026

La description précède les relations : première phrase complète de longDescription si <=400 caractères, sinon shortDescription, avec fallback explicite. Développement de VFX et rigging à l’affichage. Un seul bloc Chevauchements possibles : une ligne par outil, raison (usage précis commun ou alternative catalogue), limite locale. Les simples voisins de domaine ne sont pas présentés comme chevauchements. Suppression de la liste de tags et de la mise en garde isolée ; tarif compact après les relations. Tokens et CTA global secondaire conservés. Compilation cliente PASS ; navigateur desktop Houdini vérifié (Cinema 4D / alternative, After Effects / effets visuels), navigation vers Cinema 4D vérifiée. Capture /private/tmp/fiche-houdini-clarifiee.png. Mobile et e2e complets non exécutés ; aucune publication ni enrichissement catalogue.

### Cartes et exploration par usage — 6 octobre 2026

La vue Cartes remplace les lignes : logo, nom, usage principal et tarif court. La vue Par usage utilise les mêmes groupes catalogue, avec une navigation latérale et des bulles dont l’aire représente le nombre d’outils. Sélectionner un usage affiche ses outils en bulles de taille identique ; sélectionner un outil ouvre le panneau existant. Retour Tous les usages, filtres de domaines, mémorisation de vue et stockage restent disponibles. Aucun usage personnel ni score de redondance déduit.

Le panneau ne réserve plus de colonne lorsqu’il est fermé. Pour la vue Par usage sur les écrans jusqu’à 1400 px, le panneau ouvert suit la visualisation afin de conserver la lisibilité des bulles. Sur mobile, navigation puis visualisation dans une colonne. Aucun enrichissement catalogue, backend ou publication.

### Navigation par niveaux — 6 octobre 2026

Par usage affiche désormais les domaines à la racine, les usages du domaine au second niveau, puis les outils au troisième. La navigation latérale et les bulles montrent le même niveau. Le fil d’Ariane remplace le bouton de retour isolé ; chaque ancêtre est cliquable. Une fiche ouverte ajoute l’outil au chemin et revenir à un niveau ferme la fiche. Les lignes compactes évitent la colonne initiale contenant tous les groupes.
