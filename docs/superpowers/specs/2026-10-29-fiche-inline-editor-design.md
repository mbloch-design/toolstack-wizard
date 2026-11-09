# Fiche ToolTrim : édition dans le rendu et contrat de présentation

Statut : périmètre approuvé par le propriétaire le30octobre2026 et implémentation demandée (« démarre »). Livraison de la fiche complète dans le back-office super administrateur actuel, vrais brouillons et publication globale ; futurs éditeurs restreints préparés mais non ouverts. La dernière instruction d’édition directe dans chaque boîte remplace les alternatives historiques. Plan d’exécution : `docs/superpowers/plans/2026-10-30-backoffice-inline-editor.md`.

Révision après retour du propriétaire : le premier périmètre était insuffisant côté ToolTrim. Les critères de notation, preuves, usages, capacités et classements sont désormais inclus ; seule la note globale calculée reste sans saisie directe. La logique des tarifs doit être présentée par offre et observation, pas comme plusieurs champs concurrents de prix. Couverture exhaustive des clés observées : [BACKOFFICE_FICHE_FIELD_COVERAGE.md](../../BACKOFFICE_FICHE_FIELD_COVERAGE.md).

Base inspectée : `a00ec671a1`, branche `codex/backoffice-pilotage`. Audit et user stories : [BACKOFFICE_FICHE_UX_AUDIT.md](../../BACKOFFICE_FICHE_UX_AUDIT.md). La maquette est un prototype jetable ; son HTML copié, ses contrôles de permissions locaux et ses manipulations du DOM ne sont pas une base de code produit.

La première relecture indépendante concernait un périmètre plus étroit. Une nouvelle relecture du 29 octobre a identifié quatre contrats à préciser : brouillons incomplets, repli tarifaire après retrait, création de termes globaux et traitement des défauts historiques. Les décisions proposées et leurs limites sont explicitées ci-dessous ; la proposition reste soumise à validation du propriétaire.

## Intention et responsabilité

L’administrateur lit la fiche et écrit dedans. Il ne doit plus traduire mentalement une suite de champs JSON en page publique. Les valeurs absentes et les transformations deviennent compréhensibles, sans transformer l’écran en outil de débogage.

Le propriétaire a précisé que ToolTrim conserve sa liberté d’analyse et de notation. Les éditeurs pourraient modifier les autres informations ; cette ouverture, ses limites et une éventuelle monétisation restent à étudier. Ce lot livre l’outil administrateur et les fondations nécessaires, pas des comptes éditeur, un abonnement ou des droits de publication fournisseur.

## Approches considérées

| Approche | Intérêt | Compromis |
| --- | --- | --- |
| Édition dans le rendu pour les textes, panneau contextuel pour les données structurées | Lecture et correction au même endroit ; tarifs, sources et erreurs restent intelligibles. Piste recommandée et montrée dans la maquette. | Quelques réglages se font dans le panneau plutôt qu’à leur position exacte. |
| Tous les réglages intégrés aux blocs de la fiche | Interaction littérale à même le contenu, même pour chaque cellule tarifaire. | La page doit accueillir devises, périodes, sources et erreurs ; risque d’encombrer la lecture et de faire varier la géométrie. |

Le formulaire actuel accompagné d’un aperçu séparé n’est pas retenu : il ne répond pas au besoin d’écrire dans la fiche et son aperçu n’utilise pas le rendu public.

## Périmètre du lot

Inclure les fiches existantes, les deux langues, les textes simples, les listes, l’analyse et le verdict complets, les critères de notation et leurs preuves, les capacités/besoins/usages, les publics et métiers, les relations et recommandations administrables, les offres tarifaires, les médias/liens, les réglages SEO et la publication globale existante. Le schéma serveur actuel n’est pas la frontière du besoin : ses chemins autorisés devront être étendus explicitement pour les nouvelles données administrables. Conserver les fonctions maintenues et les protections.

Exclure la création d’un outil ou le changement d’identifiant/slug, les comptes et justificatifs de propriété éditeur, leur workflow de modération, la facturation, une nouvelle méthode de notation, une migration en base et l’édition libre de HTML ou de JSON. Les champs historiques inconnus restent préservés sans devenir automatiquement modifiables.

La correction du contrat tarifaire contradictoire et les cas d’absence sont inclus, car ils empêchent une édition fidèle. Une réécriture générale des règles de prix ou du contenu du catalogue est exclue.

## Parcours et ergonomie

### Entrer et lire

Point de conception rouvert le30octobre : le propriétaire attend un parcours global compréhensible par une personne sans expérience des CMS. La dernière maquette essaie une entrée par tâches concrètes (« Que veux-tu modifier ? »), une action de retour stable et des mots ordinaires (« Terminer », « Mettre en ligne »). Cette hypothèse reste à valider avec lui ; elle ne constitue pas une autorisation de remplacer l’édition dans le rendu par des formulaires. La navigation publique et la navigation privée ne doivent pas se superposer dans un même contexte de travail. Ne pas confondre succès d’un test d’interaction et preuve de compréhension par l’utilisateur.

La liste permet de rechercher une fiche et d’identifier sa version publiée ou son brouillon. Ouvrir une fiche affiche son rendu complet, pas un second formulaire. Une barre persistante contient retour au catalogue, langue, état d’enregistrement, affichage avec/sans repères, modifications et publication du lot.

La navigation de rubriques suit les sections réellement disponibles. Une section absente propose une création dans le mode édition ; cette invite n’existe pas sur la page publique. Le panneau peut se fermer pour retrouver toute la largeur. Sur petit écran il devient un tiroir ; l’écriture simple dans la fiche reste accessible sans panneau permanent.

Organiser la navigation avec des mots métier : présentation, usages, médias, prix, analyse, notation, relations, liens commerciaux et référencement. Les détails de provenance et de couverture technique sont secondaires. Garder un accès aux rubriques sur mobile quand la navigation latérale disparaît. La fermeture du panneau rend le focus au contrôle qui le rouvre ; la section sélectionnée reste identifiable.

### Écrire dans la fiche

Cliquer ou activer au clavier un texte autorisé ouvre une saisie à son emplacement. Un titre reste visuellement un titre ; un paragraphe garde sa largeur et sa typographie. Une zone vide affiche un libellé d’ajout en mode édition seulement.

Les valeurs simples sont du texte brut. Coller depuis un traitement de texte n’introduit ni balises ni style. Entrée termine un champ monoligne ; les paragraphes conservent les retours à la ligne ; Échap annule la session de saisie courante et rend le focus à son déclencheur. Une composition IME ne doit pas déclencher de validation anticipée. L’ordre clavier, les noms accessibles et le focus restent explicites.

Les listes ont des actions accessibles d’ajout, suppression et réorganisation. Les plans utilisent leurs `planKey` stables, pas leur index comme identité. Réorganiser un tableau ne doit pas déplacer le focus vers une autre donnée.

Le tableau « Logique des actions par rubrique » de `docs/BACKOFFICE_FICHE_UX_AUDIT.md` fait partie du périmètre proposé : un champ modifiable seul n’est pas suffisant. Chaque famille dispose des actions adaptées, de son état vide, des règles de retrait et de l’effet sur les données dépendantes. Les petites suppressions sont annulables ; le retrait d’une offre de référence exige le choix explicite de son remplaçant lorsqu’un candidat existe. Une copie d’offre reçoit une identité distincte et n’hérite pas du statut de référence. Le retrait d’un usage retire l’affectation à la fiche et ne détruit pas un terme partagé.

Un brouillon peut être incomplet : afficher les manques qui interdisent sa publication sans empêcher la reprise de saisie. Réinitialiser une personnalisation SEO supprime sa surcharge pour revenir à la règle publique. Les cinq axes de notation restent fixes à l’échelle d’une fiche ; « non noté » ne vaut pas une note à zéro. Retirer un groupe facultatif doit traiter ses dépendances, sans générer un objet partiel incohérent.

### Régler les données complexes

Cliquer une offre ou un média sélectionne cette zone et ouvre ses réglages. Le panneau commence par les contrôles utiles : nom de l’offre, montant natif, devise, périodicité, engagement, source et date ; ou image, URL, ordre et remplacement pour les médias.

Un niveau « origine et affichage » explique, lorsque nécessaire, la valeur saisie, la valeur effective, la source et la transformation. Les chemins JSON et détails de calcul restent dans ce niveau secondaire. Les valeurs dérivées ne deviennent pas de faux champs indépendants : un équivalent mensuel n’est pas modifié séparément de son montant annuel.

Les liens permettent de distinguer le site officiel d’une destination affiliée. Les URL et médias continuent de respecter la validation serveur ; pas d’exécution de contenu arbitraire ni de navigation accidentelle pendant la saisie.

### Notation administrable, score calculé

ToolTrim peut créer et modifier les cinq critères de la méthode existante : valeur ajoutée, simplicité, résultat obtenu, puissance et réversibilité. Chaque critère vaut de1 à5 ou « non noté » ; ses justifications FR/EN et les dates de notation et d’activité vérifiée sont accessibles dans le même contexte. Un critère renseigné exige sa justification et une date de notation valide, vérifiées côté serveur ; la maquette n’est pas cette validation.

Le total, l’arrondi, le libellé et les éventuels effets de fraîcheur sont calculés par la méthode commune. Ils réagissent à l’édition des critères, sans devenir une note manuelle parallèle. En l’absence de grille complète, le recours actuel au score historique est explicitement indiqué. Le lot ne change pas cette formule à l’insu du propriétaire.

Ce repli historique dépend notamment du type d’outil, de la gratuité ou de certains signaux de classement. L’éditeur doit donc montrer l’origine et les impacts de la note ; l’ouverture future aux fournisseurs ne pourra pas se contenter de masquer les cinq champs de critères pour garantir l’indépendance éditoriale.

### Usages et classement administrables

Séparer les capacités de l’outil (`covers`), les besoins couverts (`functional_needs`), les cas d’usage rédigés (`useCases`/`useCasesEn`), les publics (`relevantFor`), les métiers/verticales, les profils ToolTrim et les usages IA. La catégorie, le type, l’application hôte et les relations de remplacement ont aussi leurs contrôles, distincts de ces listes.

La sélection propose recherche, libellés compréhensibles, ajout/retrait et ordre lorsque celui-ci influe sur l’affichage. Elle utilise des identifiants et référentiels existants, sans déduire que le rare champ brut `tags` est la source canonique de tout le classement. Signaler les termes historiques, inconnus ou présents sous plusieurs identifiants ; ne pas les renommer automatiquement en enregistrant une fiche.

L’interface indique l’effet : fonctionnalités de la fiche, filtre, rapprochement ou recommandation. Le bloc public fusionne certains ensembles, déduplique et n’affiche que six fonctionnalités : un tag enregistré mais au-delà de cette limite n’est pas prétendu immédiatement visible. La création d’un nouveau terme global avec traductions, distincte de son affectation à une fiche, doit être traitée explicitement ; une saisie libre ne suffit pas à garantir son usage par les filtres.

Décision de portée proposée par Codex : ce lot affecte et ordonne les termes existants, conserve les identifiants historiques et signale un terme introuvable. La création, fusion ou suppression d’un terme global est hors de ce lot : elle relève du référentiel propriétaire, de ses traductions et de ses consommateurs. Ne pas afficher un bouton de création global sans parcours réellement disponible. La couverture de l’éditeur signifie que chaque donnée a un traitement explicite, pas que l’éditeur de fiche administre tous les référentiels transversaux.

### Prix organisés par offre et observation

**Dernière direction explicitement demandée le30octobre : édition directement dans les boîtes, sur la vue des offres.** Le propriétaire rejette le panneau latéral et le passage à un écran d’offre séparé : le nom et le montant se modifient à leur emplacement dans chaque boîte ; les autres réglages se déplient dans cette même boîte. Les offres voisines restent présentes. Ajouter, classer et supprimer restent sur cette surface. Cette instruction remplace le parcours strict en deux niveaux décrit dans les versions intermédiaires ci-dessous. La mise en ligne reste globale après relecture. Les changements de type tarifaire doivent se refléter immédiatement dans le montant ou la mention de la boîte, sans ancien aperçu divergent. Les champs complémentaires gardent leurs contrats, leurs sources et leurs limites ; la simplification porte sur l’interaction, pas sur une saisie indépendante de valeurs calculées.

**Clarification du propriétaire le 30 octobre — parcours en deux niveaux.** L’entrée « Prix » ouvre d’abord la vue des offres existantes (quatre dans l’exemple Notion), sans formulaire d’une offre sélectionnée par défaut. Cette vue sert à ajouter, classer, supprimer et ouvrir. Les actions sur chaque carte utilisent les pictogrammes Iconoir communs : déplacement gauche/droite, crayon pour ouvrir/modifier, corbeille pour retirer ; bouton Ajouter avec pictogramme plus et libellé. Pictogrammes nommés pour les technologies d’assistance et accompagnés d’infobulles ; les positions extrêmes désactivent le déplacement impossible. Les flèches constituent aussi une alternative clavier au glisser-déposer, sans afficher de poignée fictive si le glissement n’est pas implémenté.

Ouvrir une offre constitue un second niveau : seule cette offre est le contexte de travail, avec son aperçu et ses champs. Le retour « Toutes les offres » retrouve la liste et conserve les modifications du brouillon. Aucun sélecteur d’autres offres, aucun bouton d’ajout ou de classement des offres ne mélange ce niveau avec la gestion de la liste. Ajouter depuis la liste ouvre immédiatement la nouvelle offre ; retirer reste une action de liste avec les garanties de référence et d’annulation déjà décrites. Les listes de fonctionnalités à l’intérieur de l’offre gardent leurs propres actions.

Cette clarification remplace l’entrée directe dans un panneau de la première offre et le sélecteur d’offres de la première simplification Elementor. Elle précise l’ergonomie demandée, sans ouvrir la mise en production ni modifier le modèle de publication globale.

Révision ergonomique du 30 octobre après référence du propriétaire à Elementor : l’offre visible dans la fiche est l’objet de travail. Cliquer une carte la sélectionne et ouvre un panneau « Modifier l’offre », avec le minimum utile : nom, type de prix, montant/devise, facturation, unité, description et fonctionnalités. Ne pas demander de comprendre le modèle d’observation pour corriger un tarif. Les sources, dates, marché, taxes, référence de comparaison et conditions globales sont des réglages secondaires repliés. Ajouter, dupliquer, retirer et ordonner les offres restent des actions explicites.

Le contrôle de facturation associe un libellé compréhensible à la période du montant et à son engagement : chaque mois ; chaque année avec prix affiché par mois ; chaque année avec total annuel ; achat unique ; non renseigné. Ce contrôle ne fusionne pas les deux données sources et ne déduit pas un état absent. La carte et le résumé expliquent le montant réellement affiché ; aucune seconde saisie d’équivalent mensuel. Le panneau ne modifie pas le style de la fiche : il édite son contenu avec les composants existants.

Le parcours commence par l’offre, sa disponibilité et son contexte commercial, puis le montant annoncé et ce qu’il couvre, l’engagement, l’unité de vente, le marché, les taxes, les preuves et dates. L’offre de référence ToolTrim est choisie explicitement dans le contexte de devise approprié. Une offre gratuite, un prix inconnu, une offre sur devis, un achat unique et un tarif à l’usage ne sont pas confondus par la présence de zéro ou de null.

Les listes déroulantes reflètent la donnée réelle, y compris son absence ou une valeur historique hors des options courantes. Ne jamais présenter la première option comme une valeur existante, ni normaliser le JSON en ouvrant un panneau. Le résolveur de référence actuel exclut les offres gratuites et les montants absents : ne pas proposer une telle offre comme référence payante effectivement consommée. Si une modification rend la référence inéligible, montrer les impacts et la prochaine source, puis exiger la résolution du nouvel état avant publication ; aucun remplacement implicite ni promesse de zéro euro.

Un résumé visible montre le résultat et le calcul. Exemple d’interaction, sans changer un prix du catalogue : un montant annoncé par mois avec paiement annuel produit un total annuel ; un montant annoncé pour l’année produit un équivalent mensuel ; un achat unique ne porte pas le suffixe mensuel. La périodicité du montant et l’engagement sont deux données différentes.

Langue, marché et devise ne sont pas interchangeables. Deux traductions se référant à la même observation doivent partager leurs faits et garder leurs textes localisés ; deux tarifs réellement distincts par marché, devise ou condition restent séparés. Le plan devra définir et tester l’identité de l’observation et sa correspondance avec les représentations JSON existantes, avant tout lien automatique ou synchronisation des valeurs FR/EN.

Les anciennes références normalisées et les résumés éditoriaux ne restent pas plusieurs saisies concurrentes de ce même prix. Leur provenance et leur statut sont explicites ; la compatibilité JSON est assurée par le contrat commun, pas par une seconde vérité invisible. Les minima de sièges, réserves, tableaux de coûts et exemples TCO présents ont également leurs contrôles éditoriaux ; distinguer les calculs automatiques des tableaux sourcés personnalisés.

### Enregistrer et reprendre

Proposition de Codex : sauvegarde automatique du brouillon après environ une seconde d’inactivité ou à la fin d’une édition valide, avec bouton « Enregistrer » pour forcer immédiatement cette sauvegarde. Elle n’envoie pas une requête par frappe et ne publie rien.

Une seule sauvegarde est active par fiche. Si une nouvelle saisie arrive pendant la requête, la réponse acquitte le snapshot envoyé et ne remplace jamais le texte plus récent. La version retournée sert à la sauvegarde suivante. La fermeture ou le changement de fiche ne prétend pas enregistrer une requête qui n’a pas abouti.

États explicites : inchangé, modifications locales, enregistrement, brouillon enregistré, données invalides, échec réseau, session expirée et conflit. Une erreur conserve la saisie et propose une reprise. Un conflit bloque l’écrasement ; le lot ne crée pas silencieusement un mécanisme de fusion automatique. Pas de nouvelle persistance des fiches dans le localStorage.

### Deux validations et sémantique du retrait

Décision technique proposée par Codex : séparer la validation structurelle d’un brouillon de sa validation métier avant publication. La première garantit identité immuable, chemins autorisés, types, limites et contenu sûr ; elle accepte les valeurs de saisie incomplètes prévues par le registre (nom vide, offre sans montant ou libellé, ligne nouvellement ajoutée). La seconde applique les exigences métier aux données modifiées et à leurs dépendances. Un champ incomplet reste identifié par chemin, langue et rubrique. Un montant absent sur une offre explicitement gratuite, un devis sourcé et un montant inconnu ne partagent pas artificiellement la même erreur.

Cette séparation doit couvrir l’écriture ET la relecture des brouillons Redis : le décodeur actuel appelle lui aussi `validateCatalogTool`. Étendre seulement le formulaire ou la route de sauvegarde ne suffit pas. Une structure invalide, un type arbitraire ou un contenu interdit restent refusés dès l’enregistrement ; les erreurs ne détruisent jamais la saisie locale.

Le registre fixe par chemin les opérations autorisées : retirer une surcharge SEO = absence de propriété ; retirer une affectation = tableau sans cet élément ; vider une liste facultative = tableau vide ; désactiver une recommandation optionnelle = valeur nulle si c’est sa forme canonique ; champ requis temporairement vide = brouillon incomplet. Aucune conversion globale entre absence, chaîne vide et null. Les suppressions de propriétés actuellement interdites par le validateur doivent être autorisées explicitement pour ces chemins, sans permettre une suppression de n’importe quelle clé.

Les données historiques inchangées restent préservées et leurs défauts connus sont signalés. Une nouvelle exigence de preuve, traduction ou promotion ne bloque pas une correction sans rapport avec cette donnée. Bloquer les incohérences nouvellement introduites et les dépendances effectivement affectées ; conserver les invariants de sécurité et d’identité sur tout le document. Modifier un élément d’un tableau ne déclenche pas une migration silencieuse de ses voisins historiques. Une opération de remise en conformité générale est distincte de ce lot.

### Relire et publier

Le récapitulatif compare la base et le brouillon par zones, montre les autres fiches modifiées et les éléments non enregistrés ou bloquants. Un bouton principal publie le lot entier, après relecture ; aucun bouton par fiche ne contourne ce lot.

Conserver les révisions Redis, les empreintes de base, la vérification de main, la publication sans force et le nettoyage conditionnel des seules versions publiées. Les modifications concurrentes sur une autre fiche sont conservées. Un délai réseau ambigu reste un état de reprise, pas une invitation à republier aveuglément.

Un commit confirmé signifie « modifications transmises ». Sans preuve du déploiement correspondant, afficher « mise en ligne non confirmée » avec le lien du commit ; ne pas inventer un suivi Vercel ou un état « en ligne ». Le suivi automatique des déploiements n’est pas un prérequis ajouté à ce lot.

Le lot comprend toutes les fiches modifiées enregistrées, jamais un sous-ensemble choisi silencieusement. Une fiche bloquante empêche le lot entier : fournir un accès direct à son erreur et permettre de revenir la corriger ou d’abandonner explicitement son brouillon après confirmation. Une sélection devenue périmée est relue ; le récapitulatif indique les révisions qui seront publiées. Distinguer annuler une saisie, annuler une action, abandonner un brouillon entier et annuler le dialogue de publication.

## JSON et rendu : un contrat partagé

### Modèle commun

Extraire une frontière claire entre données de fiche, modèle de présentation et effets de page. L’éditeur, la fiche publique côté navigateur et le prérendu utilisent les mêmes normalisations et composants pour la même entrée. L’éditeur injecte son brouillon comme entrée contrôlée : il ne passe pas par un hook qui recharge ensuite la fiche publiée.

Le shell public conserve ses effets de SEO, statistiques et navigation. Le conteneur privé n’envoie pas d’événements de consultation publique, n’écrit pas de métadonnées publiques et n’indexe pas les brouillons. Les actions commerciales, d’ajout à Ma Stack et les navigations sont inertes ou explicitement placées en mode consultation dans l’édition.

La source réellement active fait partie de ce contrat. Dans le code inspecté, le build est explicitement maintenu sur les JSON ; une lecture distante côté navigateur reste un opt-in distinct. Ce lot ne réactive pas les anciens circuits de lecture ou de projection. Si une configuration de déploiement fait primer une autre source sur le JSON édité, le contrôle de cohérence doit le signaler et ne pas présenter la publication du seul JSON comme une modification effective de cette valeur.

Ne pas copier `ToolDetailPage` dans le back-office. Ne pas réutiliser le HTML prérendu en lui ajoutant `contenteditable`. Le composant de présentation partagé reçoit le modèle résolu et des capacités explicites d’édition ; l’ancienne branche `CatalogValue` cesse d’être l’aperçu de référence.

### Matrice de traçabilité obligatoire

Le plan complétera la matrice vérifiable des81 clés racines observées et de leurs sous-champs métier : type et chemin, langue, responsabilité proposée, valeur vide, règles de validation, provenance, transformations et consommateurs. Les30 propriétés actuellement autorisées ne constituent pas une couverture suffisante. Chaque champ doit être classé : administrable, calculé, identifiant protégé, alias relié à la source active, métadonnée ou non servi dans un parcours identifié. Aucun champ métier ne disparaît implicitement. Une valeur non servie ne doit pas être vendue comme une correction visible.

Familles à couvrir : identité/catégorie ; descriptions ; analyse, avantages, limites et usages ; verdict ; grilles et résumés tarifaires ; liens, affiliation et médias ; alternatives ; SEO des sous-pages. Inclure cartes catalogue et leurs index générés, sous-pages pertinentes et données structurées, pas uniquement la fiche principale.

Les corrections d’URL ne s’appliquent qu’à une valeur ancienne exacte. Les conserver dans le pipeline partagé, et les tester avec une correction active synthétique : l’audit local n’en a trouvé aucune active sur son snapshot, ce qui ne prouve pas que le mécanisme est inutile.

Le prix natif peut provenir d’un plan attesté ou du registre existant, puis les libellés sont dérivés. Lorsque le prix affiché provient du registre CSV et non d’un champ modifiable du JSON, le panneau le signale. Le lot n’édite pas ce CSV caché : proposer une offre JSON attestée suivant la priorité existante, ou conserver l’information en lecture seule tant que la correction n’a pas de source valable.

Retirer une offre ne signifie pas retirer tout prix affiché. Avant confirmation, résoudre le prochain prix effectif pour les parcours concernés, avec sa source : autre observation JSON, registre natif, valeur normalisée convertie, ou absence. Ne pas annoncer « prix indisponible » tant qu’un repli reste actif. Ce lot n’ajoute pas un état général d’occultation du prix et ne modifie pas silencieusement le CSV ; une demande de retrait de l’information tarifaire elle-même doit passer par son processus de source explicite. La maquette ne calcule pas encore tous ces replis et ne peut pas servir de preuve de cette résolution.

### Absence et langues

Remplacer le filtre « clé présente » par un registre des chemins autorisés et de leurs valeurs initiales. Créer une grille anglaise absente est possible sans copier automatiquement les montants français ni modifier une propriété inconnue. La validation serveur reste l’autorité.

Chaque zone indique traduit, repris d’une autre langue ou absent lorsque cela affecte ce que le lecteur voit. Préserver les replis actuels par champ ; ne pas inventer une règle globale de traduction automatique. Une analyse anglaise volontairement absente ne devient pas française par effet de la nouvelle interface.

### Comparaisons multidevises

Corriger la contradiction reproduite : plusieurs plans de comparaison dans une grille sont autorisés lorsqu’ils représentent des devises différentes. Proposition technique minimale : au plus un plan de comparaison par devise native dans chaque grille linguistique, en conservant les identités uniques et les validations de montant, source et date. La même devise à plusieurs marchés ou périodes ne devient pas implicitement une nouvelle possibilité du comparateur.

Le plan vérifiera cette règle contre tous les cas existants et la sélection effective dans les grilles FR/EN réunies. Les ambiguïtés de priorité sont affichées et couvertes par des tests, pas résolues en supprimant des données ou en choisissant arbitrairement une nouvelle offre. Tout changement de règle de présentation dépassant la correction minimale doit être isolé et justifié.

## Liberté éditoriale et futurs comptes éditeur

Le produit livré reste réservé aux administrateurs autorisés côté serveur. La maquette propose deux points de vue pour discuter des droits ; elle ne crée pas un rôle éditeur dans l’application et aucun paramètre client ne peut accorder un droit.

Le registre de champs distingue responsabilité éditoriale ToolTrim, information de présentation et donnée dérivée. Analyse, verdict, avantages/limites exprimant un jugement et notation sont classés ToolTrim comme proposition de départ. ToolTrim modifie les cinq critères de notation, leurs preuves FR/EN et les dates de vérification. La note globale reste calculée et sa règle est visible ; elle ne constitue pas un second chiffre à saisir.

Les champs mélangeant une description factuelle et une analyse doivent être signalés avant d’accorder des droits éditeur. La classification future détaillée, la propriété des liens affiliés et le workflow de modération ne sont pas considérés comme approuvés. Ils n’empêchent pas de livrer l’éditeur administrateur.

La monétisation ne constitue ni une permission implicite sur l’analyse ni une fonctionnalité à coder maintenant. L’interface doit pouvoir recevoir plus tard des capacités calculées côté serveur sans avoir à changer les composants de lecture et d’édition.

## Architecture et limites existantes

Rester dans React/TypeScript et le système commun de `src/ds/Controls/Controls.tsx`. Les nouveaux contrôles d’édition sont des primitives explicites ; aucune ancienne famille de boutons, aucune dépendance au kit Ma Stack ni surcharge d’apparence par ancêtre métier.

Réutiliser le transport et le stockage des brouillons existants : JSON versionné, Redis privé, validation des chemins, empreintes et version monotone. Conserver les limites actuelles de taille, profondeur, nombre de brouillons et types, ou signaler précisément un cas empêchant la nouvelle ergonomie avant de modifier une limite. Pas de nouvel éditeur riche ou de nouvelle bibliothèque d’état imposés.

L’organisation précise des composants, la technique de saisie inline accessible, les performances de rendu et les tests unitaires relèvent du builder, dans ces contrats. La maquette ne fixe pas une copie exacte de son panneau ou de son CSS.

## Acceptation et preuves

Les user stories US01 à US13 de l’audit deviennent la base d’acceptation, avec ces preuves complémentaires :

- Modifier, annuler, sauvegarder et recharger un texte sans altérer d’autres propriétés, tableaux vides ou valeurs nulles ; restauration du focus et saisie IME.
- Créer une propriété autorisée absente, notamment une grille EN ; rejeter une propriété inconnue ou une tentative de changement de slug.
- Enregistrer une modification de résumé dans une grille EUR/USD existante ; conserver l’offre choisie pour chaque devise ; refuser un doublon ambigu dans une même devise.
- Comparer entrée → présentation de brouillon → sauvegarde/rechargement → prérendu/public pour les champs servis et leurs dérivations. Les tests de présence de texte seuls ne suffisent pas.
- Exercices tarifaires : gratuit, prix inconnu, devise native, annuel et achat unique ; aucune conversion ou mensualité présentée comme un montant natif saisi.
- Modifier les cinq critères et leurs preuves, constater le recalcul, conserver un critère inconnu et expliquer le recours éventuel au calcul historique. Les droits futurs doivent couvrir les effets indirects des informations factuelles sur ce calcul historique.
- Modifier capacités, besoins, cas d’usage et publics séparément ; vérifier leur effet sur les composants et filtres qui les consomment, y compris la limite de six capacités visibles sur la fiche.
- Distinguer une observation tarifaire partagée FR/EN d’une condition localisée ; une traduction ne change pas implicitement la devise. Préserver les autres offres de référence par devise.
- Couvrir les 81 clés racines recensées et leurs structures imbriquées dans le registre : édition métier, résultat calculé, identifiant protégé ou donnée technique explicitement traitée. Une clé absente d’une fiche ne disparaît pas des possibilités de création autorisées.
- Correction d’URL active, reprise linguistique et absence d’analyse EN ; cohérence avec carte catalogue et SEO/sous-pages.
- Modification pendant une sauvegarde, échec réseau, expiration de session, conflit concurrent et publication ambiguë : aucune perte silencieuse ni faux état enregistré/en ligne.
- FR/EN, grand/petit écran, clavier, libellés longs, lecture sans repères et mouvement réduit. Aucune action publique ou publication réelle provoquée par les tests.
- Pour chaque famille, vérifier état initial vide, premier ajout, édition, retrait du dernier élément, réorganisation lorsque pertinente, annulation et recharge. Inclure retrait d’offre de référence, portée FR/EN d’une observation liée, duplication sans référence héritée, retrait de groupe et restauration d’une surcharge SEO. Vérifier les données ET le rendu public effectif, pas seulement les contrôles.
- Vérifier la sauvegarde puis relecture serveur d’un brouillon incomplet, sa correction et le blocage de publication avant correction ; retirer réellement une surcharge facultative ; modifier une accroche malgré une ancienne donnée non conforme inchangée ; ne pas accepter une nouvelle incohérence dans le même contexte.
- Tester retrait de dernière observation avec repli CSV encore actif, puis sans source de repli ; la confirmation doit montrer le résultat du même résolveur que fiche, cartes, index, SEO et comparateur. Tester aussi une référence retirée alors qu’une autre langue fournit encore un candidat.
- Build complet jusqu’au verdict des audits puis contrôle sur preview produit. Les écarts déjà ouverts du chantier design system restent suivis séparément ; cette nouvelle maquette ne les déclare pas résolus.

## Décisions proposées par Codex à faire valider

Édition hybride couvrant les données métier du registre, sauvegarde automatique du brouillon avec reprise explicite, texte brut sans HTML arbitraire, critères et preuves de notation modifiables par ToolTrim avec score calculé, classement par référentiels distincts et tarification par offre/observation. Livraison administrateur avant tout compte éditeur. Les droits fins, la modération et le modèle économique restent hors décision de ce lot.
