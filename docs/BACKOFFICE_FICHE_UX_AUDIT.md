# Fiche en édition — audit et user stories de discussion

29 octobre 2026. Exploration et maquette, pas une spécification validée ni une fonctionnalité livrée. Base locale `a00ec671a1` ; aucun catalogue de production modifié.

## Intention exprimée

Voir la fiche et écrire directement dedans. Ce travail interne doit préparer les futurs comptes éditeur. ToolTrim conserve sa liberté d’analyse, de verdict et de notation ; l’ouverture des autres contenus aux éditeurs est souhaitée, avec des limites encore à challenger. La monétisation reste une hypothèse, pas une règle à implémenter.

## Ce qui fonctionne aujourd’hui

L’éditeur charge la fiche JSON publiée et son brouillon privé, protège les identifiants, vérifie les versions concurrentes, enregistre les brouillons et publie un lot global. Ces garanties doivent survivre à la refonte ergonomique. Une publication GitHub et un déploiement public sont deux états distincts.

## Constats vérifiés

1. **L’aperçu n’est pas le rendu public.** `CatalogEditor.tsx` reconstruit un article avec `CatalogValue` et ses groupes de champs. Il ne rend pas `ToolDetailPage`. Les tests actuels vérifient la présence du texte édité, pas son équivalence avec la fiche publique.
2. **La présentation dépend de plusieurs transformations.** `mapToolFromJson` normalise les champs et applique les corrections de liens/médias ; les helpers de prix, de SEO et d’analyse produisent ensuite des valeurs dérivées. Éditer une valeur brute ne prouve pas que cette valeur sera celle que le lecteur verra.
3. **Les corrections de liens ne constituent pas actuellement un écart généralisé.** Le fichier contient 62 corrections conditionnelles, appliquées seulement à une ancienne URL exacte. Le passage du helper sur les 1 356 fiches locales ne change actuellement aucune des quatre propriétés contrôlées. Il faut préserver ce mécanisme et en expliquer l’effet lorsqu’il existe, plutôt que prétendre qu’il masque aujourd’hui toutes les modifications.
4. **Les champs absents disparaissent de l’interface.** Le filtre `field in value` empêche de proposer une saisie pour un champ manquant. `pricing_v5En` est absent de 763 fiches locales ; ces grilles ne peuvent pas être initialisées par cet écran. Une absence doit devenir un état éditable explicite, pas une section invisible.
5. **Une règle tarifaire contredit des données admises à l’affichage.** Six grilles comportent plusieurs plans de comparaison, notamment des variantes EUR/USD. Les helpers publics savent choisir une devise, mais `validateCatalogTool` impose un seul plan de comparaison par grille. Reproduction sans écriture sur Attio : modifier le résumé d’un plan est rejeté avec `INVALID_CATALOG_TOOL` ; le même contrôle avec un seul plan de comparaison est accepté. La règle doit être définie par devise/marché/période selon le contrat retenu, pas corrigée en supprimant arbitrairement des plans.
6. **L’anglais n’a pas une règle de repli universelle.** Certaines descriptions courtes peuvent reprendre le français ; l’analyse longue anglaise absente peut être masquée volontairement. La future édition doit montrer si un contenu est traduit, repris d’une autre langue ou absent.

Ces constats sont une reconnaissance de code et de données locales. Ils ne constituent pas encore une recette exhaustive JSON → prérendu → hydratation → production pour toutes les fiches.

## Parcours proposé à discuter

Une fiche réelle comme espace de travail ; les textes simples s’éditent à leur emplacement. Tarifs, médias, liens et SEO ouvrent un panneau contextuel structuré. Le panneau peut expliquer la source et les transformations sans afficher du JSON technique par défaut. Un mode de consultation retire les repères d’édition.

Les responsabilités doivent être attachées aux champs et contrôlées côté serveur, indépendamment de la place d’un champ dans une rubrique. Masquer un crayon ne constitue pas une permission. La délimitation exacte des informations factuelles, commerciales et éditoriales reste à valider ; aucun droit payant n’est fixé ici.

## User stories initiales

| ID | Histoire | Critères d’acceptation proposés |
| --- | --- | --- |
| US01 | Comme administrateur, je corrige une formulation en la lisant dans la fiche. | Cliquer ou utiliser le clavier ouvre la saisie au même endroit ; annuler restaure le texte ; la modification reste dans le brouillon. |
| US02 | Comme administrateur, je comprends l’effet réel d’un tarif. | Montant, devise, période, marché et source sont explicites ; aucun montant mensuel ou converti n’est présenté comme une saisie indépendante lorsqu’il est calculé. |
| US03 | Comme contributeur, je complète un contenu absent. | Une section vide propose une création ; FR/EN restent distincts ; un repli linguistique est signalé. |
| US04 | Comme administrateur, je sais pourquoi une valeur affichée diffère du fichier. | Le panneau indique la valeur brute, la valeur effective, sa provenance et la transformation ; une correction conditionnelle est identifiable. |
| US05 | Comme administrateur, je vérifie le rendu avant publication. | Le même modèle de présentation et les mêmes composants produisent le brouillon et la fiche publique ; test desktop/mobile, FR/EN et sous-pages pertinentes. |
| US06 | Comme responsable de publication, je relis et publie toutes les modifications ensemble. | Un bouton principal ouvre le récapitulatif du lot ; l’enregistrement d’un brouillon ne publie rien ; les états commit/deploiement et les conflits restent explicites. |
| US07 | Comme futur éditeur, je distingue les informations que je peux modifier de l’analyse indépendante. | Les champs autorisés sont identifiables ; analyse, verdict et notation ToolTrim sont protégés côté serveur ; voir la fiche n’accorde aucun droit supplémentaire. |
| US08 | Comme ToolTrim, je peux faire évoluer les droits et la modération sans réécrire l’éditeur. | Permissions et états de validation sont séparés du rendu ; aucune offre commerciale ni validation automatique de revendications n’est présumée. |
| US09 | Comme utilisateur, je retrouve mon travail sans écraser celui d’un autre. | États non enregistré/enregistrement/enregistré/échec visibles ; révision concurrente bloquée ; annulation et reprise préservent les garanties actuelles. |
| US10 | Comme ToolTrim, je travaille la notation et ses justifications. | Les cinq critères, preuves FR/EN et dates sont modifiables ; le score global se recalcule avec sa règle visible ; un critère inconnu reste distinct d’une mauvaise note. |
| US11 | Comme ToolTrim, je classe un outil selon ses effets réels. | Capacités, besoins, cas d’usage rédigés, publics, métiers et usages IA ont des contrôles distincts ; les identifiants et traductions sont préservés ; leur effet sur fiche et filtres est vérifié. |
| US12 | Comme ToolTrim, je saisis une offre sans dupliquer ses prix calculés. | Montant annoncé, devise, période, engagement, unité, marché, source et date forment une observation ; mensualité calculée et référence par devise sont explicites ; les textes localisés restent séparés des faits partagés. |
| US13 | Comme ToolTrim, je retrouve toute donnée métier sans passer par du JSON brut. | Le registre recense les 81 clés racines et leurs structures imbriquées, avec un traitement explicite ; les champs autorisés absents sont créables ; les données techniques et calculées sont identifiées. |

Révision après retour utilisateur : la première maquette était trop limitée pour l’administration ToolTrim. Le [registre exhaustif des champs](BACKOFFICE_FICHE_FIELD_COVERAGE.md) distingue les 30 clés actuellement autorisées à l’édition des possibilités visées. Ce relevé ne signifie pas que 81 champs doivent être affichés ensemble, ni que l’implémentation est livrée.

## Logique des actions par rubrique

Révision du 29 octobre après demande de revoir chaque rubrique : une possibilité de modifier un champ ne constitue pas à elle seule une ergonomie d’administration. Les règles ci-dessous sont la proposition de fonctionnement. Les contrôles expérimentés dans la maquette ne constituent pas une validation serveur ni un rendu produit partagé.

| Rubrique | Ajouter / créer | Retirer / vider | Déplacer / dupliquer | Règle et conséquence |
|---|---|---|---|---|
| Identité et présentation | Compléter une valeur autorisée absente, créer une traduction | Retirer une information facultative ; nom, identité technique et destination obligatoire gardent leur validation | Aucune duplication d’identité, aucun ordre arbitraire de champs | Distinguer langue, valeur absente, repli effectif et contenu réellement projeté ; ne pas créer des champs libres sans consommateur |
| Analyse et verdict | Ajouter points forts, limites, conditions, profils et points de vigilance structurés | Retirer un élément ou une section facultative ; conserver l’option d’annuler | Réordonner les listes de lecture ; ne pas transformer les objets profil/recommandation ou titre/explication en JSON brut | ToolTrim conserve la responsabilité ; la suppression d’un jugement ne vaut pas approbation d’un fait contraire |
| Notation | Renseigner chacun des cinq axes, sa preuve et ses dates | Passer un axe à « non noté » ; retirer sa preuve seulement avec un état invalide/incomplet explicite | Pas d’ajout ou suppression d’axes à l’échelle d’une fiche | Les cinq axes appartiennent à la méthode, le total est calculé ; montrer le repli historique et son impact avant publication |
| Usages et classement | Affecter un terme existant ; créer un cas d’usage rédigé ou un public | Désaffecter de cette fiche sans supprimer le terme global | Ordre modifiable s’il influe sur les six capacités visibles ou la lecture | Recherche, doublons empêchés, identifiants stables ; création, fusion et suppression de termes globaux hors de ce lot, via leur référentiel propriétaire. Aucun faux bouton de création globale |
| Offres et observations tarifaires | Créer une offre, dupliquer une base avec nouvelle identité et sans référence héritée | Retrait explicite ; si elle est référence, choisir un remplacement de même devise lorsqu’un candidat existe, puis montrer la prochaine source effective, y compris tout repli encore actif | Ordre des offres ; synchroniser uniquement leurs projections réellement liées | Distinguer gratuit, inconnu, devis sourcé, consommation et forfait. Ne pas convertir un inconnu en zéro ni annoncer une indisponibilité si un autre plan, le CSV ou une valeur normalisée fournit encore un prix. Les faits partagés ne deviennent pas deux vérités FR/EN |
| Conditions et coûts | Ajouter réserves, lignes de coûts sourcées, exemple TCO ; préciser taxes, minimum de sièges, dates | Retirer les données facultatives ; ne pas supprimer silencieusement une réserve lors d’un changement d’offre | Ordre des réserves et lignes éditoriales | Un tableau personnalisé n’est pas une projection automatique. Clarifier les noms historiques monthlyUsd/annualUsd et leur devise avant intégration |
| Médias | Ajouter une image de galerie ; compléter un logo ou une couverture absents | Retirer une image ; retirer un média singulier seulement avec aperçu de son repli | Ordre de galerie, remplacement d’une URL ; pas de duplication utile d’une même image | Validation des URL, état d’échec, texte alternatif si pris en charge par le contrat. La maquette n’invente pas un upload inexistant |
| Relations et recommandations | Ajouter une relation vers un outil existant ; créer une recommandation structurée, un guide ou une évaluation de réduction | Retirer la relation, la recommandation ou le guide, sans supprimer l’outil cible | Ordre des alternatives et étapes ; éviter doublons et relation vers soi-même | Conserver les formes historiques jusqu’à une migration explicite. « Non évalué », « disponible » et « indisponible » restent distincts |
| Liens commerciaux | Compléter une destination, un code et ses textes associés | Retirer les informations facultatives, avec visibilité des dépendances restantes | Aucun ordre ou doublon de destinations sans raison métier | Lien officiel, affiliation et promotion distincts ; une promotion incomplète bloque sa publication, sans effacer les autres données |
| SEO | Créer une personnalisation par langue et sous-page | « Revenir à la valeur automatique » retire la surcharge au lieu d’enregistrer une chaîne vide ambiguë | Aucun ordre ni duplication automatique entre sous-pages | Afficher l’origine et l’aperçu du résultat résolu, notamment {price}/{rating}, avec le contrat public partagé |
| Politiques et recommandations avancées | Contrôles typés des paramètres existants, questions de contexte et raisons de blocage | Réinitialisation explicite d’une politique ; retrait de question ou raison avec impact sur le moteur indiqué | Ordre uniquement s’il est consommé ; pas de duplication de sorties calculées | Les sorties prescription_output restent calculées/tracées. Une édition brute de paramètres sensibles sans expliquer leur effet n’est pas un éditeur terminé |
| Dossier et provenance | Accès aux preuves et à leur processus propriétaire | Ne pas supprimer une preuve, un dossier ou un historique depuis « retirer de la fiche » | Pas de copie de preuves ou d’historique comme contenu public | Distinguer statut de cycle de vie administrable, métadonnées de recherche et artefacts de dossier. Les contrôles de ces derniers ne doivent pas être prétendus livrés dans la maquette |

### Comportements communs

- Une liste vide conserve un point d’entrée « Ajouter ». Le dernier élément peut être retiré lorsque la section est facultative ; les exigences de publication sont montrées séparément.
- Une action retire seulement son objet annoncé. Le retrait d’un groupe retire ses dépendances explicites, avec possibilité d’annuler ; il ne laisse pas un objet partiellement incohérent.
- Les petites suppressions locales sont annulables. Une suppression affectant le prix de référence ou plusieurs langues montre son périmètre avant confirmation. Aucune action de la maquette ne touche le catalogue.
- Après ajout : focus sur le nouvel élément ; après retrait ou déplacement : focus sur un voisin ou la commande correspondante ; action clavier alternative au glisser-déposer. La stabilité du focus complet reste à vérifier en implémentation produit.
- Les champs requis sont signalés ; un état incomplet peut rester dans le brouillon mais ne peut pas être présenté comme prêt à publier. Les valeurs inconnues restent inconnues.
- Les champs facultatifs distinguent suppression de la surcharge, valeur vide et valeur nulle selon le contrat ; un bouton générique « supprimer » ne choisit pas cette sémantique à la place du métier.

### Vérification et limites de la maquette révisée

Parcours Chromium local : onze rubriques ouvertes sans erreur JavaScript ; ajout/édition/retrait/réorganisation/annulation d’une liste ; ajout de profils et points de vigilance structurés ; axe non noté et protection du point de vue éditeur ; ordre des capacités ; suppression d’une offre de référence bloquée sans remplaçant, puis suppression FR/EN et annulation ; duplication avec identité distincte et référence non héritée ; nouvelle offre, transitions gratuit/payant, annuel/achat unique ; galerie vide puis ajout/retrait ; création/retrait d’une recommandation ; retour d’une évaluation de réduction à « non évaluée » ; retrait et restauration d’une personnalisation SEO ; panneau ouvert/fermé à390px sans débordement horizontal.

Cette vérification ne livre pas l’éditeur produit. La maquette repose sur le DOM public figé de Notion et des modifications en mémoire : elle ne démontre pas le rendu exhaustif des éléments ajoutés/supprimés, la conservation de tous les brouillons, la validation serveur, la résolution SEO effective ou la publication globale. Les politiques avancées, données de dossier, relations qualifiées et création de termes globaux demandent encore leurs contrôles propriétaires ; leur présence dans l’inventaire n’est pas une couverture interactive acquise.

## Revue UX et produit indépendante — 29 octobre

**Dernier retour du30octobre — édition sur place.** Le propriétaire rejette explicitement le panneau à droite et propose de travailler directement sur la vue précédente des offres. Nouvelle maquette : nom et montant dans chaque boîte, saisie directe, type gratuit/devis/payant au même endroit ; détails dépliés dans la boîte pour la facturation, la description, les fonctionnalités et les sources. Les quatre offres restent dans la même vue. Les étapes « ouvrir l’offre » et « terminer l’offre » des itérations précédentes sont supprimées. Le contenu du JSON reste la donnée de travail ; les équivalents sont calculés, pas ressaisis dans un second formulaire. Une description restée « sur devis » après saisie d’un montant est signalée localement. Les distinctions explicites devis/inconnu dans le futur contrat persistent et ne sont pas considérées comme résolues par le seul cache d’intention de la maquette.

Vérification UI de cette direction dans l’onglet existant : renommer Plus directement dans la liste des quatre offres, annuler, passer Enterprise de devis à payant, saisir120 dans sa boîte, déplier ses détails sans écran intermédiaire, ajouter puis retirer une fonctionnalité, remonter l’offre, supprimer puis annuler sa suppression, ajouter une cinquième offre en place avec focus sur son nom. Le contexte « Offres et prix » reste inchangé. Cette vérification porte sur les interactions en mémoire de la maquette et ne prétend pas valider un contrat de sauvegarde produit ou le rendu public après publication.

**Retour suivant du 30 octobre — parcours global compréhensible sans connaissance d’un CMS.** Le propriétaire précise que la difficulté concerne tout le parcours, avec le repère d’une personne de15ans sans culture CMS. Ce repère ne constitue pas un persona mineur réel ni une validation d’utilisabilité. L’inspection de l’onglet réellement ouvert, à527px de large, montre une superposition de la navigation privée et de la navigation publique, ainsi que des offres trop hautes pour être comparées ensemble. Les essais précédents prouvaient des actions fonctionnelles, pas la compréhension du parcours.

Nouvelle hypothèse de maquette **à tester, non approuvée pour implémentation** : entrée « Que veux-tu modifier ? » sur la fiche identifiée, choix de tâches formulés concrètement, retour toujours au même endroit, sortie explicite « Terminer », distinction visible entre changements conservés dans la session et mise en ligne globale après relecture. Les offres deviennent des lignes compactes avec prix, Modifier nommé et pictogrammes pour l’ordre/retrait ; la navigation publique est retirée de ce contexte de gestion. Le formulaire occupe toute la largeur disponible sur petit écran. Les fonctions moins fréquentes sont sous « Autres réglages ». Le rendu réel et l’écriture dans la fiche restent l’objectif du produit ; cette entrée d’orientation ne valide pas leur remplacement par un simple formulaire.

Parcours rejoué dans l’onglet visible via CUA : entrée par tâche → offres → ouverture de Plus → changement temporaire du nom → Terminer → liste portant le nom modifié → relecture des parties modifiées → simulation explicite de mise en ligne → retour à l’entrée sans modification en attente. Aucune requête de publication réelle. Cette preuve technique ne permet pas de qualifier l’interface d’intuitive sans retour utilisateur. Le récapitulatif de maquette reste par rubrique ; le diff produit détaillé et les cas de sauvegarde serveur demeurent des exigences séparées.

**Clarification suivante du 30 octobre : deux niveaux, pas un panneau toujours ouvert.** Vue globale des offres avec actions par pictogrammes (ajouter, déplacer, supprimer, ouvrir) ; puis édition d’une offre seule et retour explicite « Toutes les offres ». Maquette révisée selon cette demande : entrée Prix sans inspecteur, quatre cartes avec outils Iconoir visibles, création ouvrant le détail, retrait et déplacement en liste, conservation du brouillon au retour. Le sélecteur de changement d’offre et les actions de gestion de la liste sont retirés du détail. Vérification locale : ordre/annulation, ouverture/retour, édition conservée, retrait/annulation, ajout puis retour à cinq cartes, pictogrammes sur mobile. Ce parcours remplace le comportement initial décrit ci-dessous.

**Retour du 30 octobre — simplicité des prix / référence Elementor :** le panneau tarifaire restait trop proche du modèle technique. Maquette réorganisée autour de l’offre sélectionnée dans le canevas : quelques contrôles de contenu, un choix de facturation compréhensible, mise à jour de la carte, sources et réglages avancés repliés. La rubrique Prix amène directement au bloc tarifaire ; elle ne laisse plus le canevas sur le haut de la fiche pendant l’édition d’une offre située plus bas. Contrôle local : sélection, absence de mutation à l’ouverture, champs avancés masqués, prix en direct, équivalent annuel/mensuel, duplication/annulation et mobile. La maquette reste jetable ; ces interactions ne démontrent pas le contrat public produit complet.

Objectif : rendre les tâches ordinaires prévisibles sans demander au propriétaire de spécifier chaque interaction. La revue couvre la découverte de la fiche, le repérage du contenu, la modification, les états incomplets, l’annulation, la reprise et la publication globale. Elle ne constitue pas un test d’utilisabilité avec de vrais utilisateurs.

### Problèmes identifiés et décisions proposées

| Risque | Décision UX / produit | Preuve et état |
|---|---|---|
| Un brouillon incomplet promis mais refusé par le serveur | Validation structurelle à l’enregistrement/relecture, validation métier distincte avant publication ; blocages reliés au champ et à sa rubrique | Contradiction confirmée dans `validateCatalogTool`, route catalogue et décodeur Redis ; contrat corrigé dans la spec, adaptation serveur à implémenter |
| Retirer une offre fait réapparaître un ancien prix | Confirmation avec prochaine source réellement résolue ; aucune promesse de retrait du prix si un repli est actif | Repli confirmé dans les résolveurs natifs ; texte trompeur corrigé dans la maquette ; résolution publique complète à intégrer |
| Une simple correction impose de réparer toute l’ancienne fiche | Préserver les données historiques inchangées, signaler leur dette ; bloquer nouvelles incohérences et dépendances touchées | Règle de compatibilité écrite dans la spec ; tests serveur à réaliser |
| « Ajouter un usage » implique à tort créer un terme global | Affectation de termes existants dans ce lot ; création globale via le référentiel propriétaire, hors portée | Périmètre explicité dans la spec et le tableau ; aucune création globale simulée |
| Une valeur manquante affiche le premier choix du formulaire | Option « Non renseigné » ou valeur historique explicite ; aucune normalisation par simple ouverture d’un panneau | Corrigé dans la maquette ; vérifié sur périodicité, engagement et unité des données Notion, Attio, Asana, Chronokura et1001bit-tools |
| Navigation latérale absente sur mobile | Sélecteur de rubrique visible indépendamment du tiroir ; section courante synchronisée | Corrigé et vérifié à390px, changement Médias → Prix sans revenir au début |
| Panneau impossible à fermer sur ordinateur | Fermeture libérant la largeur de la fiche, contrôle de réouverture visible ; Échap et retour du focus | Corrigé ; largeur utile et focus vérifiés |
| Ajout ou retrait fait perdre le point de travail | Focus sur le nouvel élément, un voisin après retrait ou la commande Ajouter si liste vide ; ordre accessible sans glisser-déposer | Corrigé et vérifié pour les listes ; exigence maintenue pour tous les contrôles produit |
| « Enregistré », « publié » et « en ligne » confondus | États distincts ; récapitulatif du lot entier ; bloquant localisable ; aucune publication partielle silencieuse | Spécifié ; la maquette simule l’enregistrement/publication et n’est pas une preuve serveur ou de déploiement |
| Inventaire limité aux propriétés principales | 81 clés racines et320 chemins terminaux observés, normalisés avec `[]`, dans le registre de couverture | Inventaire local complet du snapshot ; liaisons contrôle/validation/consommateur à vérifier en implémentation |

La nouvelle relecture de constructibilité a soulevé quatre questions importantes (brouillon incomplet, repli tarifaire, référentiel global, compatibilité historique). Après leur clarification dans la spec, la seconde passe n’a trouvé aucune contradiction bloquante pour établir le plan. Cela ne signifie pas que les capacités produit correspondantes sont déjà développées.

### Cas représentatifs obligatoires avant livraison

- **Notion** : observation partagée FR/EN, analyse et notation complètes, migration ; vérifier que les faits restent communs et les textes traduisibles.
- **Attio** : références EUR et USD simultanées ; une action sur une devise préserve l’autre.
- **Asana** : enrichissements éditoriaux, prix et tableaux de coûts ; une ligne sourcée ne se transforme pas en résultat calculé.
- **Chronokura** : unité historique `license`, périodicité absente dans l’observation ; aucun « par utilisateur / mois » inventé par le formulaire.
- **1001bit-tools** : absence de grille et de notation ; premiers ajouts accessibles sans clé JSON préexistante.

Les interactions de formulaire sur ces cinq enregistrements sont vérifiées dans la maquette. Le canevas public y reste celui de Notion : les cinq rendus publics, la persistance et la publication restent à vérifier dans le produit.

Les scénarios d’acceptation doivent également couvrir perte réseau, expiration de session, retour après fermeture, données invalides, révision concurrente, publication d’un lot contenant une fiche bloquée, résultat de publication ambigu, FR/EN et changement de devise, clavier/IME, zoom et mouvement réduit. Ils restent des critères d’implémentation tant qu’aucune preuve correspondante n’existe.

## Matrice de cohérence à produire avant implémentation

Pour chaque zone : chemin JSON, type, langue, source propriétaire, transformations, composants consommateurs, permission, validation, règle de vide et état de publication. Couvrir aussi cartes catalogue, sous-pages prix/avis/alternatives et métadonnées SEO ; ne pas limiter le contrat au paragraphe central.

Cas d’acceptation nécessaires : fiche complète ; langue manquante ; tarif sans montant public ; gratuit ; facturation annuelle et paiement unique ; même plan en plusieurs devises ; correction de média active dans un jeu de test ; données historiques inconnues ; brouillon en conflit ; publication sans déploiement confirmé.

## Décisions ouvertes

Choix du fonctionnement d’édition après la maquette ; délimitation fine des contenus éditeur/ToolTrim ; modération ; politique de traduction ; rattachement et preuve de propriété d’un outil. La monétisation et l’ouverture effective des comptes éditeur feront l’objet d’une réflexion distincte.
