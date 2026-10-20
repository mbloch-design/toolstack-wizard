# Comptes et stacks : exploitation et activation

Livraison A préparée localement le 20 octobre 2026. Les deux flags restent désactivés par défaut. Aucun déploiement, migration distante, utilisateur réel, e-mail, paiement ou abonnement n'a été créé par la recette automatique.

## État de préparation

Le code rassemble une stack personnelle v4 (sélection v3, gratuit/payant, montants et décisions), les caches par propriétaire, la synchronisation CAS, la suppression reprenable et la consultation administrateur. Le catalogue JSON reste l'autorité des fiches ; aucune migration du catalogue historique Supabase n'est incluse. Le back-office utilise l'index JSON directement et signale les références absentes.

Contrôles de configuration en lecture seule du 19 octobre : Google désactivé, e-mail activé, inscription permise, confirmation e-mail requise. Ces réglages ne prouvent ni la livraison d'un code ni un retour Google. Les variables locales inspectées sont publiques ; aucune clé de service ni allowlist administrateur n'a été copiée. La lecture des métadonnées Vercel a renvoyé 403, sans CLI disponible : les variables de déploiement restent à vérifier avec un opérateur autorisé.

## Configuration de recette puis de production

| Variable | Emplacement | Condition |
| --- | --- | --- |
| `STACK_ACCOUNT_ENABLED` | serveur uniquement | `true` explicite après validation ; défaut désactivé |
| `VITE_STACK_ACCOUNT_ENABLED` | build navigateur | `true` explicite après validation ; défaut désactivé |
| `SUPABASE_URL` | serveur | projet de recette dédié, puis projet cible validé |
| `SUPABASE_SERVICE_ROLE_KEY` | serveur uniquement | secret de service, jamais préfixé `VITE_`, jamais dans Git |
| `VITE_SUPABASE_URL` | navigateur | même projet que le serveur |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | navigateur | clé publique du même projet |
| `BACKOFFICE_ADMIN_EMAILS` | serveur uniquement | liste séparée par virgules d'adresses administrateur confirmées |

Ne pas déduire la configuration des valeurs de secours publiques du client. Le serveur refuse les API privées lorsque son flag ou ses variables manquent. Une allowlist absente refuse les accès administrateur ; ni les métadonnées utilisateur ni un rôle envoyé par le navigateur ne donnent ces droits. Un flag navigateur activé sans serveur prêt affiche une sauvegarde indisponible ; l'usage local reste accessible. Une modification des variables `VITE_` demande un nouveau build.

Google : configurer le client OAuth et son secret dans le fournisseur Supabase du projet de recette, puis autoriser exactement son URL de callback Supabase dans Google. Configurer Site URL et l'allowlist des retours ToolTrim FR/EN sur le domaine de recette, sans wildcard de production par défaut. L'application demande l'identité de base, aucun accès aux contacts ou fichiers. Tester le consentement, l'annulation et le retour à l'action commencée. Le client limite lui-même le retour aux routes ToolTrim autorisées et au même origin.

E-mail : configurer le fournisseur d'envoi de production, son domaine vérifié et ses quotas ; vérifier délivrabilité, limites de renvoi et expiration. Le template d'authentification doit afficher le code `{{ .Token }}` attendu par l'interface (6 à 10 chiffres), pas uniquement un lien magique. Ne pas mettre de token réel dans les captures ou journaux. Vérifier création, connexion existante, mauvais code, expiration, rejeu et renvoi borné. Vérifier le rapprochement sûr Google/e-mail par le fournisseur ; des adresses différentes ne sont pas fusionnées par l'application.

## Migrations et permissions

Sauvegarder la base et exporter les métadonnées de schéma/permissions avant une intervention autorisée. Confirmer les migrations déjà appliquées avant d'utiliser la CLI Supabase et inspecter son `--help` dans l'environnement opérateur. Appliquer dans cet ordre sur une recette isolée :

1. [20261019081436_personal_stack_v4.sql](../supabase/migrations/20261019081436_personal_stack_v4.sql).
2. [20261020064858_personal_account_deletion.sql](../supabase/migrations/20261020064858_personal_account_deletion.sql).

Ces migrations sont préparées, elles n'ont pas été appliquées au projet distant par cette livraison. Elles conservent les snapshots historiques, ajoutent révision/statut de suppression et RPC serveur avec vérification de session. `profiles`/`stack_snapshots` ne sont plus modifiables directement par les clients ; les RPC privées ne sont exécutables que par `service_role`, avec politiques propriétaire en défense supplémentaire. Ne pas exposer le schéma Auth ni changer les FK contributrices pour faciliter une suppression.

Le garde de suppression conserve les contributions historiques. Un compte lié à des contributions reçoit une erreur explicite et reste protégé pour reprise ; aucune cascade improvisée. L'ancienne Edge Function `delete-account` est dormante et répond 410 dans la source : ne pas la déployer comme contournement.

`npm run test:accounts:db` exécute migration, assertions SQL et rollback sur PGlite PostgreSQL 18.6. Le contrôleur a aussi exécuté le même SQL sur PostgreSQL 17.5 embarqué. Ces preuves ne couvrent pas GoTrue, PostgREST, les conseillers Supabase ou deux connexions SQL indépendantes.

## Recette automatique isolée

```sh
npm run test:e2e:accounts
```

Playwright démarre lui-même `e2e/fixtures/accounts-server.mjs` sur `http://127.0.0.1:8192`, sans réutiliser un service existant. Il simule les routes réellement appelées par le SDK Supabase (`otp`, `verify`, `authorize`, `token`, `user`, `logout`) et les API privées. Il n'importe jamais la fixture dans l'application. Les contextes bloquent toute requête navigateur dont l'origin n'est pas exactement celui de la fixture, y compris les autres ports locaux ; les service workers sont désactivés. Les identités sont limitées à `@example.invalid`. Les contrôles `/__accounts-test/` n'existent que sur ce serveur de test. Ne pas utiliser ce serveur sur une interface publique ni l'intégrer à un déploiement.

Pour une inspection manuelle locale, démarrer `node e2e/fixtures/accounts-server.mjs`, ouvrir `/fr/ma-stack` ou `/en/ma-stack`, recevoir un code avec une adresse `@example.invalid` et saisir `123456`. Pour l'entrée directe `/fr/back-office` ou `/en/back-office`, utiliser **admin@example.invalid / fixture-password**. Ces identifiants sont exclusivement fictifs ; le mot de passe concerne le shell administrateur existant, pas le parcours compte personnel sans mot de passe. Redémarrer la fixture efface ses données en mémoire. Le serveur démarre sans compte ; la connexion administrateur crée un compte fictif confirmé, sans stack.

La suite vérifie FR/EN à 390 et 1440 px, état personnel complet sur un nouveau contexte sans stockage copié, retrait persistant, choix du brouillon divergent et absence de dialogue équivalent, code invalide/renvoi, annulation Google/retour sûr, A→B/réponse A tardive, panne et cache sale après reload, reprise, conflit CAS et confirmation perdue, suppression confirmée/reprise/recréation. Le back-office vérifie entrée directe, refus ordinaire et métadonnées forgées, compteurs globaux, pagination/recherche, détail JSON et v3, références absentes et indisponibilité distincte de zéro. Les captures et traces sont dans `test-results/accounts/` (non versionnés).

## Recette fournisseur obligatoire avant activation

Cette étape reste ouverte : les mocks ne permettent pas de la déclarer réussie. Prévoir deux identités A/B dédiées et un administrateur de recette contrôlés par l'opérateur, sans message à un tiers ni branche cloud payante automatique.

1. Sur Supabase isolé, vérifier code réel et Google réels avec les erreurs décrites plus haut ; capturer les paramètres de retour sans secret.
2. Vérifier l'identité confirmée et les sessions réelles, puis révoquer une session et constater le refus de lecture/écriture. Vérifier qu'A et B restent isolés, y compris un appel privé avec un autre owner dans un body forgé.
3. Avec les rôles `anon`/`authenticated`, vérifier le refus des RPC et des écritures directes ; avec le service serveur, vérifier les lectures/sauvegardes autorisées, la création de profil sans snapshot vide et les limites de payload. Vérifier le refus back-office d'un utilisateur/éditeur et d'un utilisateur ayant forgé ses métadonnées.
4. Sur deux connexions/appareils, faire deux PUT avec la même révision : une réussite, un 409. Couper l'accusé de réception après commit, relire et résoudre sans écrasement. Sauvegarder en parallèle d'une suppression : aucune recréation après statut deleting ni après suppression Auth. Vérifier reprise après erreur Auth et traitement contributif conservateur.
5. Vérifier les compteurs sur plus de 25 comptes, les snapshots v3/v4/vides et les références JSON absentes. Une source corrompue ou indisponible doit afficher indisponible, jamais zéro inventé.
6. Contrôler les conseillers sécurité/performance Supabase après migration et consigner les résultats et écarts. Tester les secrets uniquement côté serveur et l'absence des fixtures dans le bundle public.
7. Vérifier flags désactivés sur le build public et drapeaux explicitement activés sur recette ; revalider FR/EN mobile et bureau sur la recette fournisseur.

Après ces preuves et résolution des écarts, proposer l'activation publique comme opération distincte. La préparation et le passage des tests locaux ne valent pas publication ou activation.

## Retour arrière et incident

Désactiver les deux flags (rebuild pour le navigateur), drainer les requêtes privées en cours et vérifier que la navigation locale reste disponible. Conserver profils, snapshots v4, révisions et barrières `deleting`. Inspecter puis appliquer les scripts de rollback de configuration en ordre inverse : [suppression](../supabase/rollback/20261020064858_personal_account_deletion.sql), puis [stack v4](../supabase/rollback/20261019081436_personal_stack_v4.sql). Ils révoquent les accès RPC et préservent les données ; ils ne réouvrent pas les anciennes écritures client. Sauvegarder avant toute réparation de données distincte.

En cas de panne, le cache sale reste lié à son propriétaire ; ne pas le copier dans un brouillon anonyme. Proposer réessai/reconnexion/conflit selon l'état affiché. Ne pas annoncer une suppression distante après une simple expiration de session : l'action de nettoyage local est distincte de la confirmation serveur. Si le navigateur bloque le nettoyage, suivre l'avertissement de l'interface et effacer les données du site sur l'appareil partagé. Ne pas exporter les caches personnels dans les journaux de support.
