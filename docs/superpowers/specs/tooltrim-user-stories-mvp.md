# ToolTrim — user stories du MVP comptes, stack et éditeurs

19 octobre 2026 — proposition produit à valider avant le plan technique.
Travail consolidé de trois revues : parcours utilisateur ; éditeur/back-office ; structure Supabase et droits.
Livrable de cadrage : aucune nouvelle fonctionnalité, migration métier, inscription, soumission, paiement ou notification n'a été exécutée pour produire ces stories.

## 1. Promesse et règles validées

Permettre à une personne de retrouver sa stack et, si elle représente un outil, de suivre ses demandes depuis le même compte. Donner au propriétaire ToolTrim un lieu central pour voir les comptes, stacks, éditeurs, demandes et indicateurs.

- Une seule stack personnelle par compte.
- Confirmation du propriétaire après lecture des stories : la sauvegarde inclut les choix gratuit/payant et les décisions déjà prises dans l'interface.
- Confirmation du propriétaire : si un brouillon anonyme différent et une stack enregistrée existent, proposer « Retrouver ma stack enregistrée » ou « Ajouter ma nouvelle sélection », sans fusion automatique.
- Les fiches restent alimentées par les JSON existants. Pas d'import, de synchronisation ou de réactivation du catalogue historique Supabase.
- Supabase porte l'identité, la stack et les informations de suivi privées nécessaires au MVP.
- Le visiteur compose librement ; il s'identifie pour enregistrer sa stack.
- L'éditeur s'identifie avant de commencer sa demande. L'offre reste consultable publiquement.
- Un même compte peut utiliser les deux espaces ; aucun choix de rôle exclusif à l'inscription.
- Google et code reçu par e-mail constituent le parcours proposé. Aucun mot de passe utilisateur imposé, aucun questionnaire métier à l'inscription.
- L'éditeur ne modifie ni ne publie les fiches ; le processus éditorial actuel reste en place.
- Le back-office permet au propriétaire de consulter les stacks individuelles. Il ne les modifie pas dans ce MVP.
- Chaque livraison doit fonctionner sur le site existant, avec une possibilité de désactiver l'accès aux nouvelles fonctions sans supprimer les données.

## 2. Ce qui existe et ce qui reste à construire

| Domaine | Constat vérifié | Conséquence |
|---|---|---|
| Stack locale | Sélection et besoins existants ; état versionné, choix gratuit/payant et décisions personnels dans des mécanismes séparés | Définir un enregistrement complet des choix personnels, pas seulement une liste de slugs |
| Compte/synchronisation | Hook et tables profiles/stack_snapshots existants ; une stack imposée par la clé owner_id ; hook non raccordé à CartPage | Socle à adapter, pas parcours livré |
| Connexion e-mail | Envoi de lien magique présent dans le hook, pas de parcours complet de saisie de code établi | Le code e-mail doit être conçu et testé |
| Soumissions | Upstash conserve reçus, empreinte, paiement et jobs e-mail ; champs métier non conservés comme dossier structuré autonome | Créer le suivi structuré des nouvelles demandes sans casser la réception actuelle |
| Statut accepted | Réception technique durable dans Upstash | Ne signifie pas validation éditoriale |
| Éditeurs | Marques, membres et rattachements existent ; liens actuels vers public.tools historique | Adapter la référence à l'outil sans imposer une migration du catalogue JSON |
| Administration | Back-office existant centré sur l'ancien diagnostic | Réutiliser l'entrée et les mécanismes utiles, sans réactiver le diagnostic |
| Volumes | JSON local : 1 351 fiches ; base historique : 1 178 outils au relevé de l'audit | Un outil absent de public.tools doit rester utilisable pour la stack et le futur suivi éditeur |

Ces observations viennent du code local et de l'audit précédent. Elles ne constituent pas une recette des parcours en production.

## 3. Livraisons proposées

### Livraison A — Enregistrer et retrouver sa stack

Stories U01 à U06, A01, A02, A05 et indicateurs comptes/stacks de A04.
Résultat : un utilisateur conserve sa stack ; le propriétaire retrouve le compte et la stack dans le back-office. Le parcours local existant continue à fonctionner.

### Livraison B — Soumettre et suivre un outil

Stories E01 à E05, A03 et indicateurs éditeurs/demandes de A04.
Résultat : un éditeur s'identifie avant sa demande, la suit, consulte ses outils validés ; le propriétaire traite les demandes depuis le même back-office. Les protections paiement et e-mail existantes sont préservées.

La livraison B peut être préparée après validation du cadrage, sans être une condition pour livrer A. Les statistiques minimales accompagnent chaque livraison ; pas de tableau de bord entièrement vide en attendant la fin.

## 4. Stories utilisateur — livraison A

### U01 — Composer librement
En tant que visiteur, je veux constituer ma stack avant de créer un compte pour comprendre la valeur de ToolTrim.

- Ajouter, retirer et consulter les outils reste possible sans connexion.
- Un même outil n'apparaît pas deux fois ; la sélection locale persiste lorsque le stockage du navigateur fonctionne.
- L'action « Enregistrer ma stack » explique le bénéfice du compte ; aucune inscription n'est imposée pendant l'exploration.
- Une panne du service de compte n'empêche pas de consulter les fiches JSON ni de travailler localement.

### U02 — S'identifier sans perdre son travail
En tant que visiteur, je veux continuer avec Google ou un code e-mail pour enregistrer ma stack simplement.

- Un même écran sert à l'inscription et à la connexion ; aucune seconde étape de profil obligatoire.
- La sélection et les choix personnels sont conservés pendant l'authentification et les tentatives infructueuses.
- Code invalide/expiré, e-mail non reçu ou annulation Google permettent de reprendre ; aucune réussite annoncée avant validation.
- Après identification réussie, retour à l'action commencée. L'accès Google ne demande pas de permissions sur les fichiers ou contacts.

### U03 — Enregistrer les choix qui constituent ma stack
En tant qu'utilisateur, je veux conserver mes outils et mes choix pour retrouver une stack cohérente.

- Un compte possède au maximum une stack ; les retours de connexion répétés ne créent pas de doublons.
- L'enregistrement couvre les outils, besoins et affectations, l'intention utilisé/envisagé ainsi que les choix gratuit/payant, montants personnels déclarés et décisions personnelles déjà disponibles dans l'interface. Le périmètre gratuit/payant et décisions a été confirmé par le propriétaire.
- Les prix et contenus des fiches ne sont pas copiés comme vérités personnelles : ils sont relus depuis les JSON ; un prix actualisé peut donc modifier l'estimation affichée.
- L'interface distingue « Enregistrement… », « Enregistré » et « Non enregistré ». Une erreur conserve les changements et permet de réessayer.

### U04 — Retrouver et faire évoluer ma stack
En tant qu'utilisateur, je veux retrouver ma stack sur un autre appareil et continuer à la modifier.

- Un nouveau navigateur retrouve la dernière version enregistrée, y compris les retraits et les choix personnels.
- Un vrai brouillon anonyme différent d'une stack déjà enregistrée n'est pas fusionné silencieusement. Comportement confirmé : deux actions courtes, « Retrouver ma stack enregistrée » ou « Ajouter ma nouvelle sélection ». Pour les outils déjà présents, les choix enregistrés sont conservés.
- Un ancien appareil ne peut pas écraser silencieusement une version plus récente. Un conflit conserve les deux états jusqu'au choix explicite de la version à garder.
- Une ancienne copie locale ne fait pas réapparaître automatiquement un outil supprimé.

### U05 — Changer de compte sans mélange
En tant qu'utilisateur d'un appareil partagé, je veux que chaque compte conserve uniquement sa stack.

- La déconnexion termine les sauvegardes du compte quitté ; aucune réponse réseau tardive ne modifie l'espace du compte suivant.
- Après déconnexion, la stack du compte n'est plus exposée comme brouillon anonyme. Proposition : retour à une sélection anonyme vierge.
- Une modification non enregistrée est signalée avant la sortie ; son abandon doit être explicite.
- La connexion à B n'importe jamais les données de A. La reconnexion à A retrouve sa propre version enregistrée.

### U06 — Supprimer mon compte personnel
En tant qu'utilisateur, je veux supprimer mon compte et sa stack depuis mon espace.

- Une confirmation explicite précède la suppression ; une annulation ne modifie rien.
- Après réussite, le profil, la stack et leurs copies locales sont supprimés et l'accès aux données privées est refusé, y compris depuis une autre session.
- Un échec n'est jamais affiché comme une suppression réussie. Une recréation ultérieure ne restaure pas l'ancienne stack.
- Pour un compte également éditeur, aucune fiche JSON n'est supprimée. La règle de conservation des demandes et reçus doit être arrêtée avant l'ouverture de la livraison B ; aucune suppression automatique de reçus commerciaux n'est déduite de cette story.

## 5. Stories éditeur — livraison B

### E01 — Accéder à la soumission avec mon compte
En tant qu'éditeur, je veux m'identifier avant de commencer une demande.

- L'offre est publique ; le clic pour commencer une soumission conduit à la connexion si nécessaire, puis au formulaire.
- Une personne déjà connectée continue avec son compte existant et conserve sa stack.
- Être demandeur ne prouve pas que je représente l'outil et ne me donne aucun droit administrateur.
- Le serveur détermine le propriétaire de la demande à partir de la session ; un identifiant fourni dans le formulaire ne permet pas de changer de propriétaire.

### E02 — Envoyer une demande sans répétition ni perte
En tant qu'éditeur connecté, je veux envoyer mon outil et obtenir une preuve claire de réception.

- Les formules actuelles, les contrôles de badge et la vérification réelle du paiement sont conservés.
- La demande reçue possède une référence stable et un dossier structuré utile au suivi ; répéter l'envoi ne crée ni double dossier ni double consommation de paiement.
- Un échec d'e-mail après réception durable ne transforme pas la demande en demande perdue.
- Si l'enregistrement du suivi échoue, la reprise conserve le lien au reçu existant. Aucune confirmation ne prétend que le suivi est disponible avant qu'il le soit.

### E03 — Reprendre après interruption
En tant qu'éditeur, je veux reprendre mon formulaire ou mon retour de paiement sans tout recommencer.

- Le brouillon est conservé dans le même navigateur pendant une interruption et la connexion.
- Le retour de paiement retrouve la demande concernée ; une opération déjà réglée n'exige pas un second paiement.
- Un retour de paiement engagé avant la mise en place des comptes reste récupérable par un parcours contrôlé ; aucune attribution sur la seule base d'un paramètre d'URL.
- Le MVP ne promet pas de synchroniser les brouillons éditeur entre appareils.

### E04 — Comprendre l'avancement de mes demandes
En tant qu'éditeur, je veux connaître le statut et la prochaine action attendue.

- Seules mes demandes sont visibles, avec outil, date, formule, statut et dernière mise à jour.
- Statuts proposés : « Reçue », « En cours », « Action attendue », « Publiée », « Non retenue » ; paiement et livraison des e-mails restent des informations distinctes.
- « Action attendue » et « Non retenue » ont une explication compréhensible. Un contact e-mail avec la référence permet les échanges initiaux.
- Ni l'envoi ni le paiement ne font passer automatiquement une demande à « Publiée ». Pas de messagerie intégrée dans le MVP.

### E05 — Retrouver les outils que je représente
En tant qu'éditeur validé, je veux consulter mes outils réellement en ligne.

- ToolTrim valide le rattachement ; déclarer un domaine ou utiliser un e-mail du domaine ne suffit pas.
- Un outil présent uniquement dans les JSON peut être rattaché. Un outil pas encore publié reste une demande, pas une fiche publique inventée.
- L'espace présente les données publiques et le lien réel de la fiche, sans contenu privé d'autres éditeurs.
- Aucun bouton ni appel API ne permet de modifier la fiche, sa note, son classement ou sa publication.

## 6. Stories back-office

### A01 — Avoir une entrée centrale
En tant qu'administrateur autorisé, je veux retrouver les comptes, stacks, éditeurs, demandes et statistiques au même endroit.

- Une navigation centrale dessert les sections disponibles ; les fonctions pas encore livrées ne sont pas présentées comme actives.
- L'accès est contrôlé côté serveur ; cacher un lien dans l'interface ne suffit pas.
- La stack personnelle et le rôle éditeur d'un administrateur restent distincts de ses droits de gestion.
- Le diagnostic historique n'est pas remis en service pour fournir ce tableau de bord.

### A02 — Comprendre un compte et sa stack
En tant qu'administrateur, je veux ouvrir un compte pour comprendre ses usages et consulter sa stack.

- Recherche par e-mail/identifiant et accès au profil minimal, à sa stack enregistrée et à sa dernière sauvegarde confirmée.
- Un même compte apparaît une seule fois, avec ses usages stack et éditeur lorsqu'ils existent.
- Les outils sont résolus depuis les JSON. Une référence disparue est signalée sans supprimer silencieusement le choix.
- Consultation seule de la stack : pas de modification à la place de l'utilisateur dans le MVP.

### A03 — Traiter les demandes et valider les rattachements
En tant qu'administrateur, je veux gérer les demandes et leur lien à un éditeur.

- Liste filtrable et détail réunissant les informations structurées, le compte, le reçu et les références techniques utiles.
- Changement de statut et validation/retrait d'un rattachement sont historisés avec auteur et date.
- L'administrateur peut relier une demande à une fiche JSON publique vérifiée ; le changement de statut ne publie aucun contenu.
- Les anciennes soumissions ne sont ni attribuées automatiquement sur la seule adresse e-mail, ni reconstruites en masse depuis le HTML des e-mails.

### A04 — Lire des statistiques fiables
En tant que propriétaire, je veux voir les indicateurs utiles à mes décisions sans les confondre avec des estimations.

- Au lot A : comptes confirmés, comptes avec stack enregistrée, stacks non vides, sauvegardes réussies et outils présents dans les stacks.
- Au lot B : comptes ayant soumis une demande, éditeurs avec rattachement validé, demandes par statut/formule et ancienneté des demandes ouvertes.
- Chaque indicateur précise sa période ou s'il représente l'état actuel, sa définition, sa source et sa date d'actualisation. Une erreur de source affiche « Indisponible », jamais zéro.
- Les totaux proviennent de toutes les lignes autorisées, pas seulement de la page affichée. Aucun revenu n'est déduit d'un prix d'offre ni d'un statut éditorial.

### A05 — Garder les données de chacun privées
En tant que propriétaire, je veux que chaque personne accède uniquement à ses ressources.

- L'utilisateur A ne lit ni ne modifie la stack, les demandes ou les rattachements de B, même en appelant directement l'API.
- Un compte ne peut pas s'attribuer lui-même un rôle administrateur ou un rattachement validé en modifiant ses métadonnées.
- Le retrait d'un rattachement bloque les accès privés correspondants dès la prochaine opération contrôlée, même si l'éditeur possède encore un écran ou une session ouverts.
- Les tableaux de bord globaux ne sont accessibles qu'aux administrateurs autorisés ; aucune clé serveur n'est livrée au navigateur.
- Les contrôles sont testés avec au moins deux identités et les rôles visiteur, utilisateur, éditeur et administrateur avant ouverture.

## 7. Définitions minimales des statistiques

| Indicateur | Définition proposée | Limite à afficher |
|---|---|---|
| Comptes confirmés | Identités permanentes vérifiées, distinctes par compte | Pas le nombre de visiteurs |
| Comptes avec stack | Compte possédant un snapshot enregistré | Peut inclure une stack vide |
| Stacks non vides | Snapshot contenant au moins un outil utilisé ou envisagé | État courant, pas historique |
| Outils dans les stacks | Nombre de comptes distincts contenant chaque outil | Séparer utilisé/envisagé ; pas une preuve d'achat |
| Activité de sauvegarde | Dernière sauvegarde serveur réussie par compte | Ne mesure pas toutes les visites |
| Demandes reçues | Demandes métier distinctes ayant une réception durable | Pas nombre d'e-mails ni nombre de paiements |
| Éditeurs validés | Comptes distincts avec au moins un rattachement actif validé | Différent de tous les demandeurs |
| Délai des demandes | Temps depuis réception des demandes non closes | Ne constitue pas une promesse commerciale |

Le back-office est le lieu de consultation central. Cela n'impose pas de déplacer Upstash, GA4 et les reçus des prestataires dans une seule base. La synchronisation des sources et la récupération d'erreurs doivent être définies dans le plan. Les statistiques de navigation et de conversion anonymes restent dans le dispositif analytique existant ; aucun nouveau suivi exhaustif des visiteurs n'est introduit ici.

## 8. Garde-fous de structure à porter au plan technique

1. Identité de compte stable, indépendante de Google ou de l'e-mail. Le changement de méthode ne doit pas créer deux stacks ; adresses différentes ne sont pas fusionnées automatiquement.
2. Brouillon anonyme distinct de l'état de chaque compte. Synchronisation versionnée avec détection des écritures concurrentes et préservation des suppressions.
3. Référence d'outil stable validée depuis les JSON ; résolution des slugs à l'affichage. Pas de FK obligatoire au catalogue historique incomplet pour une nouvelle soumission. La solution exacte sera décrite dans le plan.
4. Réutiliser profiles, stack_snapshots et les briques marques/membres adaptées ; éviter un second système de rôles ou de comptes.
5. Dossier de soumission et reçu d'exécution sont deux responsabilités différentes. Lier les deux de manière idempotente et réparable, sans double envoi ni double paiement.
6. Accès administrateur côté serveur ; autorisations liées à l'identité et aux rattachements vérifiés, jamais à des métadonnées utilisateur modifiables.
7. Suppression d'un compte : retirer l'accès sur les sessions concernées, traiter les copies locales et tester les conséquences sur les références éditeur avant publication.
8. Déploiement progressif, migrations réversibles autant que possible, sauvegarde avant changement de données, reprise des anciens retours de paiement et aucune recette réelle d'e-mail/paiement non autorisée.

## 9. Hors MVP

Consultant de stack, recommandations personnalisées, questionnaires métier, plusieurs stacks, équipes et invitations, partage public, messagerie intégrée, édition de fiches par les éditeurs, migration du catalogue, reprise exhaustive des anciennes soumissions, tableau financier et nouvelle plateforme d'analytics.

## 10. Points à valider avant le plan de chaque livraison

Le cadrage précédent vient de la conversation ; les comportements suivants sont des propositions nouvelles, pas des décisions déjà approuvées :

- Étendue de la sauvegarde gratuit/payant et décisions : confirmée par le propriétaire ; ce point n'est plus à arbitrer. Les montants personnels déjà saisis sont conservés, les prix du catalogue restent issus des JSON.
- Conflit entre brouillon et stack existante : les deux actions explicites décrites dans U04 sont confirmées ; ce point n'est plus à arbitrer.
- Déconnexion : ne pas laisser la stack personnelle comme sélection anonyme sur l'appareil partagé.
- Statuts métier de suivi proposés dans E04 ; échanges initiaux par le contact e-mail existant.
- Historique éditeur : reprise manuelle des dossiers utiles, sans migration automatique depuis les e-mails.
- Règles de conservation des demandes/reçus après suppression du compte, à fixer avant le lot B.

Le choix technique détaillé, les migrations et le plan d'implémentation viennent après validation de ces stories. Aucun besoin de choisir un fournisseur supplémentaire ou de migrer les fiches pour valider ce périmètre.

## Références de la revue

- AGENTS.md ; src/config/features.ts ; src/pages/CartPage.tsx ; src/hooks/useStackAccount.ts.
- src/lib/stackState.ts ; src/lib/stackSync.ts ; hooks des choix de plans et des décisions utilisés par CartPage.
- src/pages/SubmitToolPage.tsx ; api/contact.ts ; api/_submission-contract.ts ; api/_submission-store.ts.
- src/pages/BackOfficePage.tsx ; src/lib/backofficeApi.ts ; supabase/functions/backoffice-diagnostic/index.ts.
- supabase/migrations/20260825124355_ma_stack_account_sync.sql.
- docs/tool-catalog-migration/contract-v4/V4-schema-cible.sql, rattachements et demandes liés au catalogue historique.
- Audit Supabase du 19 octobre 2026, conservé à côté de ce document.

Validation effectuée pour ce livrable : cohérence des périmètres, couverture des trois rôles, séparation réception/publication/paiement, absence de bascule catalogue, revue des risques d'identité et de synchronisation. Aucun test applicatif n'est revendiqué : seules des user stories ont été rédigées.

