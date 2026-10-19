# ToolTrim — conception de la livraison A : compte et stack enregistrée

19 octobre 2026.
Statut : proposition de conception consolidée à relire ; aucune implémentation du lot A commencée.
Référence produit : tooltrim-user-stories-mvp.md, stories U01–U06, A01–A02, A05 et partie comptes/stacks de A04.

## Objectif de cette livraison

Une personne compose sa stack librement, s'identifie pour l'enregistrer et la retrouve sur un autre appareil avec ses choix personnels. Le propriétaire ToolTrim peut consulter les comptes, leurs stacks et quelques indicateurs dans le back-office.

La simplicité se mesure à la continuité de l'action : pas de sélection perdue, pas de questionnaire préalable, pas de choix de rôle obligatoire, pas de connexion répétée inutilement.

## Périmètre

Inclus : Google et code e-mail, reprise après identification, une stack par compte, sauvegarde des choix personnels, synchronisation, déconnexion, suppression de compte personnel, consultation administrateur et indicateurs opérationnels.

Différé au lot B : soumissions authentifiées, rattachements éditeur, suivi des demandes et statistiques éditeur. Le formulaire éditeur public actuel continue son fonctionnement pendant le lot A. Les décisions de conservation de ses reçus après suppression de compte seront arrêtées au lot B.

Hors périmètre : consultant de stack, nouveaux questionnaires, plusieurs stacks, équipes, messagerie, partage public et migration catalogue.

## Frontière catalogue — invariant

Les JSON restent la source des fiches. Cette livraison ne réactive aucune lecture catalogue en base et ne synchronise pas les 1 351 fiches JSON avec les 1 178 outils historiques observés dans Supabase.

Une stack conserve des références vers les outils et les choix personnels. L'affichage résout les fiches depuis les JSON. Un outil absent de la base historique peut être enregistré. Une référence qui ne se résout plus est signalée et conservée jusqu'à décision de l'utilisateur, sans contenu inventé.

## Parcours nominal

1. La personne compose sa stack comme aujourd'hui.
2. « Enregistrer ma stack » ouvre l'identification dans le contexte de cette action.
3. Elle continue avec Google ou saisit un code reçu par e-mail.
4. Une fois la session validée, elle revient à Ma stack.
5. Si aucune stack n'est enregistrée, son travail local devient sa stack personnelle.
6. Les modifications suivantes sont enregistrées automatiquement, avec un état visible.

Un même parcours sert à l'inscription et à la connexion. L'inscription ne demande ni mot de passe ToolTrim, ni questionnaire métier. Une connexion Google ne demande pas d'accès aux contacts ou fichiers.

La sélection est préservée pendant un code erroné/expiré, une annulation Google, un retour navigateur ou une erreur réseau. Une session encore valide évite une nouvelle identification. Les liens de retour sont limités aux destinations ToolTrim autorisées.

## Contenu sauvegardé

Périmètre explicitement confirmé :

- outils sélectionnés, besoins, affectations et ordre déjà disponibles ;
- intention utilisé/envisagé ;
- statut gratuit/payant et état des réponses déjà apportées ;
- choix de plan, paramètres utiles et montants personnels déjà déclarés ;
- décisions existantes de garder les deux outils, garder l'un ou remplacer l'autre, avec leurs références.

Les choix personnels ne deviennent pas des prix officiels. Les estimations utilisent les données catalogue courantes, sauf lorsqu'un montant personnel déclaré doit prendre le relais conformément au fonctionnement existant. Une économie mémorisée dans une ancienne décision n'est pas présentée comme un montant actuel sans recalcul compatible.

Le format est versionné et validé à la lecture comme à l'écriture. Les états locaux existants sont repris sans effacement préalable et l'ancien snapshot ne doit pas écraser des champs personnels absents de son format.

## Brouillon anonyme et stack enregistrée

Comportement explicitement confirmé si les deux côtés diffèrent et sont non vides :

- « Retrouver ma stack enregistrée » charge la version du compte.
- « Ajouter ma nouvelle sélection » ajoute les éléments du vrai brouillon anonyme.

Pas de dialogue si la stack enregistrée n'existe pas, si le brouillon est vide ou si les deux états sont équivalents.

Pour l'ajout explicite, un outil ne se duplique pas et ses choix déjà enregistrés restent prioritaires. Les nouveaux éléments et leurs choix personnels sont ajoutés. Les besoins identiques sont dédupliqués ; une collision d'identifiant de besoin personnalisé ne doit pas écraser un libellé différent.

Le brouillon reste récupérable jusqu'au succès du choix et de son enregistrement. Il ne devient pas une seconde stack nommée.

## Déconnexion et appareil partagé

Proposition consolidée :

- séparer l'état anonyme de celui de chaque compte ;
- prévenir si des changements n'ont pas encore été enregistrés ;
- après déconnexion, effacer l'affichage et les caches personnels, y compris plans et décisions, puis revenir à un état anonyme vierge ;
- ignorer les réponses et sauvegardes tardives du compte précédent ;
- ne jamais proposer la stack de A comme brouillon à importer dans B.

Une reconnexion retrouve la version enregistrée du bon compte. L'isolation concerne les mémoires des stores React autant que localStorage et ses sauvegardes.

## Sauvegarde, concurrence et erreurs

Le serveur constitue la référence du dernier enregistrement confirmé. Chaque écriture vérifie la révision dont elle part ; une version périmée ne remplace pas silencieusement la plus récente.

Après un conflit entre appareils, la personne peut charger la version enregistrée ou confirmer l'enregistrement de sa version actuelle. La version écartée reste récupérable pendant cette résolution. Ce cas est distinct du choix entre brouillon anonyme et stack du compte.

Messages produit : « Enregistrement… », « Enregistré », « Non enregistré ». Le succès n'est affiché qu'après confirmation du serveur. Sans réseau ou si la session expire, les changements restent disponibles localement et une reprise est proposée.

L'expiration de session ne transforme pas une stack personnelle en brouillon anonyme transmissible à un autre compte.

## Structure Supabase et accès

Réutiliser l'identité Supabase et les tables profiles/stack_snapshots existantes après adaptation du contrat d'état. La clé owner_id impose une stack par compte. Étendre le socle plutôt que créer un deuxième système de comptes.

Les accès privés sont limités au propriétaire en base ; une écriture ne peut pas réattribuer une stack à un autre compte. Les droits administrateur sont vérifiés côté serveur par un mécanisme contrôlé par ToolTrim, distinct des métadonnées modifiables de l'utilisateur.

Les méthodes Google et e-mail doivent pouvoir aboutir au même compte dans les cas de rapprochement sûrs du fournisseur. Des adresses différentes ne sont jamais fusionnées automatiquement. Les conflits d'identité ne doivent pas conduire à perdre l'accès à la stack enregistrée.

Pas de clé privilégiée dans le navigateur. Le plan précisera les opérations serveur et le contrôle de concurrence atomique nécessaires.

## Back-office minimal

Réutiliser l'entrée d'administration et les éléments utiles de l'existant, en créant une vue comptes/stacks identifiable. Ne pas réactiver le diagnostic historique ni ses envois.

- Vue d'ensemble : comptes confirmés, comptes avec stack, stacks non vides et dernière actualisation.
- Liste recherchable : compte, date de création, présence d'une stack et dernière sauvegarde.
- Détail : identité minimale, sélection et choix personnels enregistrés, résolus depuis les JSON.
- Consultation uniquement de la stack ; pas de modification au nom de l'utilisateur.
- Pagination pour les listes ; les totaux globaux ne sont pas calculés sur la seule page visible.
- Aucun accès utilisateur ou éditeur aux données globales, y compris par appel direct à l'API.

La dernière sauvegarde n'est pas présentée comme une dernière visite. Un classement d'outils compte les stacks distinctes qui les contiennent et distingue utilisé/envisagé ; il ne mesure ni achats ni satisfaction.

## Suppression du compte personnel

Une confirmation précède la suppression. L'opération réussie retire l'accès sur les sessions concernées, supprime le profil et la stack et purge les caches personnels de l'appareil utilisé. Une autre session ne doit pas réenregistrer la stack supprimée.

Un échec conserve une possibilité de reprise et ne se présente pas comme un succès. Un nouveau compte créé ultérieurement ne récupère pas automatiquement l'ancienne stack.

Les comptes historiques déjà liés à des contributions éventuelles ne sont pas supprimés par une cascade improvisée. Leur traitement doit être vérifié avant activation publique ; la conservation des reçus des futures soumissions sera spécifiée avec le lot B. Aucune fiche JSON n'est supprimée par cette opération.

## Préparation et activation

La configuration Google, le fournisseur d'e-mail de production, les modèles de code et les URL de retour doivent être vérifiés avant ouverture. Leur présence n'est pas déduite de l'existence du hook.

Développer et tester les nouvelles fonctions derrière le mécanisme d'activation existant. Le retour arrière désactive leur exposition tout en conservant les données et l'usage local du site. Tout changement de contrat prévoit la compatibilité avec les données existantes.

La recette se fait avec des identités dédiées et des services simulés lorsque possible. Aucun e-mail vers un tiers, paiement réel, achat de service ou changement d'abonnement n'est autorisé par ce document.

## Preuves de réussite attendues

- Google et code e-mail permettent un retour à l'action commencée ; erreurs et annulations préservent le brouillon.
- Un second navigateur retrouve les outils ET les choix gratuit/payant, montants personnels et décisions.
- Brouillon identique : pas de dialogue ; brouillon divergent : les deux actions confirmées fonctionnent.
- Un outil supprimé ne revient pas lors d'une reconnexion.
- Un passage A → déconnexion → B ne mélange aucun état, même avec une requête A encore en cours.
- Deux écritures concurrentes n'entraînent pas d'écrasement silencieux.
- Des identités A et B ne lisent/modifient pas les ressources privées de l'autre.
- Le propriétaire autorisé voit le compte, la stack et des compteurs exacts ; un compte ordinaire n'y accède pas.
- Une suppression empêche les sessions concernées de recréer la stack.
- Le parcours local et les fiches JSON restent utilisables si le service de compte est indisponible.
- Vérification navigateur FR/EN sur mobile et ordinateur ; les tests et le build seuls ne prouvent pas ces parcours.

## Revue avant le plan technique

La sauvegarde complète des choix personnels et le choix explicite en présence d'un brouillon divergent ont été confirmés séparément par le propriétaire.

Ce document rassemble le reste du comportement proposé : déconnexion sur appareil partagé, concurrence, suppression, accès administrateur et indicateurs. Sa validation permettra de détailler le plan de la livraison A ; elle ne vaut pas autorisation de déploiement public ni d'achat.

Aucune interface, fonction ou migration de la livraison A n'a été exécutée pour rédiger ce document.

