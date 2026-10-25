# Back-office ToolTrim — conception proposée

Statut : conception approuvée par « ok fais », premier lot implémenté et vérifié localement. Date : 25 octobre 2026.

## Révision après examen des données utilisateur réelles

La première maquette sous-représente les données disponibles et ne constitue plus la cible suffisante. L’utilisateur demande une vision plus complète des utilisateurs. Les constats SQL ci-dessous priment sur les hypothèses tirées du seul checkout local.

Les trois snapshots distants possèdent une enveloppe avec selection, billing, usage, decisions, trade, dailyRate et version. Le code local inspecté utilise un ToolCartState plus ancien à la racine : il ne décrit donc pas fidèlement le contrat distant actuel. Ne surtout pas normaliser l’enveloppe distante avec ce seul ancien décodeur, au risque de présenter des stacks vides ou de perdre leurs données.

Présence vérifiée le 25 octobre 2026, sans lecture des valeurs personnelles dans le rapport :

| Donnée | Disponibilité vérifiée |
|---|---|
| Sélection / outils / tableaux | needs, toolEntries et pinnedToolSlugs non vides dans 3 snapshots sur 3 |
| Abonnements déclarés | billing.choices et billing.paid non vides pour 1 compte sur 3 ; billing.reviewed également non vide pour 1 compte |
| Usage renseigné | usage non vide pour 1 compte sur 3 ; unité et sens des nombres à vérifier dans le contrat actif avant de les afficher |
| Métier | trade renseigné pour 2 comptes sur 3 |
| TJM | dailyRate avec amount et currency pour 1 compte sur 3 |
| Décisions | decisions présent mais vide pour les 3 comptes |
| Identité | champs Auth et profil ; last_sign_in_at existe mais n’est pas une mesure de dernière visite |
| Anciennes fiches leads | métier, outils actuels et TJM présents dans les 4 leads ; main_goal vide pour les 4 |

Présence d’un champ ne signifie pas qu’il est renseigné ; statut paid ou billing désigne des déclarations et non des paiements ToolTrim. Aucune somme de revenus ou achat vérifié ne peut en être déduite.

### Nouvelle cible de pilotage

La page d’entrée doit répondre à trois questions : qui s’inscrit, que renseigne-t-on dans Ma Stack et quelles informations sont encore manquantes. Remplacer la simple juxtaposition de compteurs par inscriptions datées, synthèse des stacks et couverture des données déclarées. Les listes récentes restent distinctes des totaux globaux.

L’espace Utilisateurs devient le centre de consultation : table compacte avec identité, confirmation, inscription, dernière connexion Auth, dernière sauvegarde, nombre d’outils utilisés/à étudier, métier et complétude explicite par rubrique. Ouvrir une fiche conserve la liste et ses filtres. La fiche rassemble :

1. Profil : identité, fournisseur de connexion disponible, langue, statut, inscription et connexion Auth.
2. Stack : outils utilisés, à étudier, tableaux et dates d’ajout disponibles.
3. Budget déclaré : choix de plans, montants, devises, périodes et places réellement enregistrés ; inconnus conservés comme inconnus.
4. Usage : valeurs renseignées avec unité vérifiée, sans les présenter comme une télémétrie observée.
5. Contexte : métier et TJM avec leur provenance déclarative.
6. Décisions : décisions effectivement sauvegardées ; état vide lisible aujourd’hui.

Une rubrique de couverture indique pour chaque catégorie « renseignée », « non renseignée » ou « indisponible ». Aucun score de complétude arbitraire.

Une analyse des stacks peut agréger les outils utilisés ou à étudier, les métiers et les déclarations d’abonnement. Sa population doit toujours être affichée : trois snapshots au moment de l’audit, pas l’ensemble des visiteurs. Ne pas déduire une tendance représentative de ce faible volume.

Les données avant connexion restées dans le navigateur ne sont pas récupérables rétrospectivement par cette refonte. GA4 reste une source distincte à connecter pour les parcours agrégés. Aucune promesse d’historique exhaustif ou de liaison individuelle à GA4.

Cette révision élargit le premier lot : navigation, synthèse, liste utilisateur et lecture de toutes les rubriques effectivement sauvegardées. L’implémentation reste conditionnée à l’identification du contrat actif et de la version produisant la capture.

## Intention et décision de structure

L’utilisateur veut comprendre ce qui se passe sur le site, voir qui est inscrit et accéder aux données disponibles. Il a répondu « ok » à une proposition en six espaces. Cette réponse permet de détailler cette organisation ; elle ne vaut pas validation d’une intégration GA4 ou d’une mise en production.

Une navigation permanente donne accès à Vue d’ensemble, Utilisateurs, Usage du site, Catalogue & contenus, Demandes & emails, Historique diagnostic. La vue d’ensemble est l’entrée proposée par Codex. Le français est la langue de la maquette ; l’application conserve son fonctionnement FR/EN.

## Approches

- Réorganiser la page monolithique actuelle : moins de changement initial, mais conserve le mélange des domaines et les problèmes de navigation.
- Un back-office structuré par tâches, avec synthèse et pages de détail : approche proposée, cohérente avec l’organisation présentée puis accueillie par « ok ».
- Un outil BI externe : utile pour des analyses ponctuelles, mais ne remplace pas l’accès aux utilisateurs et aux opérations depuis ToolTrim.

## État vérifié et limites

Une lecture SQL le 25 octobre relève 3 comptes Auth, tous confirmés, 3 profils, 3 snapshots de stack, 4 leads, 86 sessions diagnostic, 4 jobs email diagnostic et 36 résultats de sélecteur. Ces volumes ne sont ni additionnables ni des métriques de la journée. Les données de démonstration de la maquette doivent rester explicitement distinguées des données vérifiées.

Les sources identifiées sont Supabase Auth, profiles, stack_snapshots, leads, selector_results, les tables diagnostic, le catalogue public et catalog_private. Les soumissions utilisent aussi un stockage Redis Upstash via api/_submission-store.ts : l’existence de ce code ne confirme pas son contenu distant.

Le client envoie des pages vues et des événements à GA4. Aucun accès de reporting GA4 n’a été vérifié. Aucune série de trafic, de taux de conversion, de rétention ou de visiteurs actifs ne peut donc être affichée comme disponible.

Le code local BackOfficePage.tsx et backofficeApi.ts reste centré diagnostic ; la capture comporte une vue comptes absente des fichiers inspectés. Identifier le commit/checkout et l’API qui produisent cet écran est un préalable à toute modification produit. Conserver la version la plus récente et ses contrôles d’accès.

## Écrans et parcours

### Vue d’ensemble

En-tête compact, accès au site, date d’actualisation et bouton Actualiser. Trois résumés : comptes confirmés, comptes disposant d’un snapshot, leads. Chaque nombre ouvre la liste correspondante. Ne pas présenter un snapshot vide comme une stack contenant des outils.

Au-dessous : inscriptions récentes et dernières sauvegardes en deux listes datées. Ces listes décrivent des faits enregistrés, pas une activité en temps réel. Les dates et les volumes de la période doivent être calculés côté serveur ; aucun total global ne doit être dérivé d’une page paginée. Si un filtre temporel est offert, chaque bloc indique s’il montre un stock total ou des événements de la période. V1 : résumés globaux et listes récentes explicitement libellés, sans filtre global ambigu.

Un accès Usage du site affiche l’état de connexion GA4. Ne pas remplacer une métrique inconnue par zéro et ne pas fabriquer des courbes.

### Utilisateurs

Liste paginée côté serveur : nom, email, confirmation, inscription, présence d’un snapshot, dernière sauvegarde. Recherche et filtres explicites. Inclure les comptes non confirmés s’ils existent, avec leur statut, au lieu de les faire disparaître du décompte.

Ouverture d’une fiche utilisateur avec identité, dates disponibles, tableaux et outils classés selon les intentions réellement présentes dans le snapshot. Le décodage utilise le contrat versionné du store existant, sans en inventer un nouveau. Champs absents : « Non renseigné » ; outil retiré du catalogue : conserver son identifiant et signaler l’indisponibilité. Ne pas estimer un budget à partir de prix inconnus ni confondre un plan déclaré avec un achat vérifié.

La fiche montre l’état sauvegardé actuel. Elle ne reconstitue pas un historique de modifications que la base ne conserve pas. Les comptes ne sont pas reliés aux anciens diagnostics sur la seule base d’une ressemblance de nom ; tout rapprochement doit être explicite et documenté.

### Usage du site

Dans le premier lot, état « Reporting GA4 non connecté » et explication des indicateurs envisagés : fréquentation, pages, recherches et clics. L’intégration effective fera l’objet d’un lot distinct après vérification des accès et de la propriété. Données agrégées ; aucune promesse de suivi individuel du parcours d’une personne inscrite.

### Catalogue & contenus

Accès en lecture aux outils et contenus disponibles, à leurs statuts de publication et aux signaux de qualité existants. Le modèle canonique reste la référence ; aucune nouvelle base ni nouvelle chaîne de publication. Les métriques doivent être définies sur des vues/contrats validés, car des tables internes peuvent représenter plusieurs versions d’un outil. Livraison détaillée après le lot utilisateurs ; ne pas promettre un éditeur ou des actions de publication en V1.

### Demandes & emails

Sous-vues distinctes : leads, soumissions et jobs email. Un lead n’est pas automatiquement un abonné ni un compte. Les soumissions ne deviennent une liste exploitable qu’après examen du contrat de stockage et de ses garanties : les enregistrements de maintenance ne constituent pas nécessairement une fiche de demande complète. Ne pas afficher un chiffre de ventes sans source de paiement vérifiée. Séparer absence de données, absence de connexion et erreur.

### Historique diagnostic

Conserver les fonctionnalités existantes de détail, événements et restitutions. Placer les opérations techniques et la recette préproduction dans cet espace secondaire. Garder les actions existantes autorisées et leurs contrôles, sans créer de nouvel envoi ou de suppression automatique.

## Cadre visuel et technique

Réutiliser React, React Router, Supabase et le système visuel ToolTrim : fond crème, surfaces blanches, texte charbon, typographies existantes, icônes Iconoir centralisées. Classes bo-* dans @layer components de src/index.css. En-tête moins haut, navigation latérale desktop, navigation repliable mobile, tableaux compacts et fiche détail lisible. Pas de nouvelle dépendance de dashboard pour ce besoin.

Pages ou sous-routes adressables, recherche conservée en revenant de la fiche utilisateur. Préserver le chemin /:lang/back-office et les points d’entrée existants après inventaire. Découper les composants par domaine plutôt que prolonger le fichier monolithique.

Tous les accès aux données personnelles passent par un serveur contrôlant le rôle admin selon le mécanisme déjà en production. Aucune clé privilégiée côté navigateur, aucune ouverture RLS pour servir la nouvelle UI. Ne pas charger tous les snapshots pour afficher une liste. Aucun email ou donnée personnelle dans les logs de vérification.

## États et acceptation

- Chargement, absence de résultat, source non connectée, accès refusé, session expirée et erreur récupérable distincts.
- Comptages indépendants de la pagination et de la recherche, avec périmètre indiqué.
- Recherche utilisateur, pagination, ouverture d’une fiche et retour conservant les filtres vérifiés en navigateur.
- Affichage exact des tableaux/outils sauvegardés, y compris snapshot vide ou version non reconnue.
- Refus serveur pour un visiteur et un compte ordinaire ; accès admin autorisé.
- Absence de débordement à 390px et lecture claire à 1440px ; navigation clavier et noms accessibles.
- Tests ciblés sur autorisation, agrégats et décodage de snapshots, puis npm run build et vérification des routes réelles. Un build seul ne vaut pas validation UX.

## Ordre proposé et exclusions

Relecture constructeur indépendante effectuée : le premier lot est suffisamment défini pour être planifié. Les trois espaces Catalogue, Demandes et Usage constituent une orientation ; leur détail dépend des inventaires et accès explicitement prévus ci-dessous.

1. Résoudre l’écart entre capture, code local et version déployée ; inventorier les contrats de lecture admin.
2. Livrer la navigation, Vue d’ensemble et Utilisateurs avec les données serveur existantes et les états fiables.
3. Raccorder Catalogue & contenus et Demandes & emails après audit de leurs contrats.
4. Ajouter le reporting GA4 après vérification des accès ; conserver auparavant un état non connecté.

Ce document n’autorise pas un déploiement. Pas de nouvel outil BI, de suivi individuel GA4, d’édition utilisateur, de suppression, de campagne email ou de migration catalogue dans ce périmètre. Les détails de découpage de composants et les requêtes optimisées restent au constructeur, sous réserve de conserver les garanties ci-dessus.

## Périmètre de livraison

Le premier lot conserve le filtre de sécurité existant sur les comptes confirmés actifs. Les fiches et rubriques sont consultables sans migration. La couverture détaillée est par utilisateur, sans agrégat global de complétude non fourni par la RPC. La navigation locale conserve recherche/page pendant la session du workspace ; les liens profonds et filtres dans l’URL sont différés afin de ne pas exposer d’identifiants ou d’e-mails dans l’historique. Catalogue, demandes et GA4 restent signalés dans l’inventaire des sources. Les styles bo-* utilisent les tokens existants ; validation visuelle complète du thème sombre différée, lisibilité contrôlée.
