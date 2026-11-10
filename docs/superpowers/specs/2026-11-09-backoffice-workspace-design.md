# Un espace d’administration ToolTrim

## Intention

Les pages d’administration cumulent aujourd’hui la navigation publique, une seconde rangée de navigation, des titres et des actions répétés. L’éditeur ajoute encore des éléments de navigation et d’aide à la décision de la fiche publique. Une personne qui ouvre le back-office doit pouvoir identifier sa section, trouver un élément et agir sans chercher dans plusieurs niveaux de commandes.

## Approches

- **Menu d’administration dans le cadre ToolTrim — retenu.** La même enveloppe porte le logo, les réglages et le compte. Dans le back-office, le menu d’administration occupe l’emplacement du menu public et comporte « Retour au site ». Cette structure donne la place au contenu sans créer un autre produit.
- **Menu public conservé et onglets internes.** Cette solution laisse les destinations publiques à portée immédiate. Elle entretient deux navigations simultanées, réduit l’espace de travail et reste moins claire sur téléphone.

Le choix du menu unique est confirmé. L’ordre des rubriques et la composition des écrans ci-dessous sont des propositions d’implémentation.

## Cadre commun

Sur ordinateur, un seul menu latéral indique la rubrique active. Sur téléphone, le bouton de menu ouvre le même ensemble de destinations dans un panneau, avec fermeture au choix et retour du focus. La barre haute affiche « Back-office », le contexte de la page si utile et les commandes de compte, langue et thème. Le logo et « Retour au site » mènent au site dans la langue courante. Le pied de page éditorial et les raccourcis publics ne participent pas à l’espace de travail admin.

Navigation principale, dans cet ordre : Vue d’ensemble, Fiches, Utilisateurs, Stacks et outils, Activité. Sources et Diagnostic restent accessibles dans une zone secondaire. Les rubriques actuelles conservent leurs données et leurs URL ; un lien d’ouverture d’une fiche ou d’un utilisateur arrive au bon écran.

Un écran commence par un titre, une phrase d’aide si elle est utile et au plus une action principale. Les filtres et la recherche sont attachés à la liste concernée. Les tableaux utilisent des colonnes lisibles sur ordinateur et des lignes compactes sur téléphone. Le chargement, le vide et l’erreur utilisent les composants d’état communs.

## Parcours

- **Vue d’ensemble :** quelques indicateurs issus des données existantes, puis les accès utiles. Les liens mènent aux listes qui expliquent ces chiffres.
- **Fiches :** recherche et filtre Brouillons au-dessus d’une liste simple. Chaque ligne mène à l’édition directe. L’ancien formulaire reste temporairement dans les actions secondaires. Le nombre de brouillons et l’action de publication sont regroupés dans l’en-tête du catalogue. La revue de publication occupe un écran identifiable, avec les fiches concernées et une confirmation.
- **Édition d’une fiche :** un en-tête compact regroupe le nom, le retour à la liste, l’état du brouillon et l’aperçu. La zone de travail affiche les sections éditables, dont les offres modifiables dans leur carte. Les éléments publics qui ne servent pas à éditer (navigation publique de la fiche, encart de décision, appels à visiter ou comparer) apparaissent dans l’aperçu de la fiche, à partir du brouillon et du rendu partagé. L’aperçu permet de parcourir les sections publiques en lecture seule avec une navigation locale au même brouillon. L’éditeur garde le rendu en contexte et la sauvegarde automatique. Revenir à la liste conserve la recherche et la pagination. La publication reste groupée et la suppression d’un brouillon enregistré reste confirmée.
- **Utilisateurs et stacks :** listes et tableaux, avec détail sélectionné ou page dédiée selon le volume. Les données, libellés métier et liens disponibles restent ceux du back-office actuel.
- **Activité :** reprend « Usage du site » et ses sources actuelles. L’écran distingue clairement un rapport disponible d’une source à raccorder. Les sessions historiques se consultent dans Diagnostic.
- **Sources et diagnostic :** même titre et mêmes composants d’état. L’exploration des sources et les outils historiques gardent leur place secondaire et leurs permissions actuelles.

## Contraintes et validation

Réutiliser les composants ToolTrim déjà disponibles : Page, Button, IconButton, Field, Chip, Tag, Drawer, Notice et PageLoading, selon les besoins. Les nouvelles compositions vivent dans `src/ds` en CSS Modules et utilisent les jetons existants. Les stories précèdent la mise en place. Couvrir les listes pleines et vides, les intitulés longs, l’édition et la revue de publication. Vérifier français, anglais, clair, sombre, clavier et largeurs 390, 768 et 1280 px.

L’authentification, les permissions, les sources de données et le contrat de publication restent les responsabilités des services actuels. Le changement du cadre est limité aux routes d’administration. Les liens directs, le retour navigateur, le changement de langue, la reconnexion et la protection des brouillons font partie de la recette.

Le critère principal est de pouvoir, depuis n’importe quelle rubrique, retrouver une fiche ou un compte en une navigation claire, puis comprendre où se trouve la prochaine action. L’écran d’édition doit laisser le contenu visible sans concurrencer la fiche par une seconde navigation publique.
