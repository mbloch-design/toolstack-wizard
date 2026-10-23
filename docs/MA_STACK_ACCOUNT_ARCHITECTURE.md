# Comptes et stack personnelle

Référence produit actualisée le 23 octobre 2026. Remplace la décision local-first du 25 août.

## Parcours retenu

Le catalogue reste public et ses fiches proviennent des JSON. Lorsque la fonctionnalité compte est activée, une connexion est requise avant le premier ajout. Une personne dispose d’une stack personnelle pour ce MVP. Ma stack reste accessible en haut à droite, comme un panier ; la connexion reste aussi explicite dans le header.

Une stack vide hors connexion présente la promesse, les bénéfices et les accès inscription/connexion. Après connexion, elle propose la recherche du premier outil. Un ajout refusé ne produit ni faux succès ni événement de conversion. Le retour d’authentification conserve une destination interne autorisée ; il n’ajoute pas automatiquement un outil.

## Identité et paramètres

Google, GitHub et e-mail/mot de passe utilisent Supabase Auth. Le parcours e-mail comprend confirmation et récupération. Les boutons OAuth ne sont activés qu’après configuration réelle du fournisseur. Le serveur vérifie la session ; le client ne fusionne pas des comptes sur la base d’une adresse e-mail.

Les paramètres comprennent profil, connexion et sécurité, préférences, stack et données. Une session absente ou terminée redirige vers l’accueil. Les données cosmétiques disponibles d’une identité OAuth vérifiée peuvent initialiser une fois le nom, l’avatar et la langue fournisseur ; une personnalisation ultérieure reste prioritaire. Les personas et le questionnaire de qualification sont différés.

## Stockage et synchronisation

La stack utilise un snapshot versionné v4 dans `stack_snapshots`, avec propriétaire et révision. Le cache local est séparé par propriétaire. La synchronisation utilise un contrôle de révision (CAS) et un choix explicite en cas de brouillon divergent ; aucune fusion aveugle ne remplace la stack distante.

Les quatre migrations préparées conservent les données historiques et établissent des RPC privées exécutées côté serveur avec `service_role`. Les clients ne modifient plus directement `profiles` et `stack_snapshots`. La suppression respecte les contributions historiques et prévoit une reprise en cas d’échec.

Le back-office vérifie côté serveur une allowlist d’adresses administrateur confirmées. Un rôle ou une métadonnée transmis par le navigateur ne donne aucun privilège. La consultation du catalogue utilise les JSON ; cette livraison ne migre pas les fiches.

## Livraison et activation

Le code et la recette simulée locale sont livrés. Ils ne prouvent pas l’activation distante. Le 23 octobre, après accord explicite sur l’utilisation du projet existant, les quatre migrations ont été appliquées sur Supabase ToolTrim avec sauvegarde préalable des tables concernées. Les sept RPC métier vérifiées sont réservées à service_role. E-mail activé avec confirmation, Google et GitHub désactivés ; la livraison SMTP reste à tester. L’accès Vercel fonctionne par CLI malgré le refus 403 du connecteur.

La recette utilise le projet Supabase existant, déclaré non exploité par le propriétaire. Les secrets doivent être configurés dans les outils d’administration. Les flags restent désactivés par défaut. Aucun déploiement de fixture ou de boîte e-mail simulée n’est prévu.

Voir [le guide d’exploitation](STACK_ACCOUNT_OPERATIONS.md) pour les migrations, les retours OAuth, le SMTP, les variables et les tests de mise en service.
