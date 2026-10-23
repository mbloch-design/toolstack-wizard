# Comptes et stacks : exploitation et activation

Expérience complète préparée localement le 21 octobre 2026. Les flags de compte et de fournisseurs restent désactivés par défaut. Aucun déploiement, migration distante, utilisateur réel, e-mail, paiement ou abonnement n'a été créé par la recette automatique.

## État de préparation

Le parcours public utilise Google, GitHub et e-mail/mot de passe dans un formulaire partagé, avec confirmation, récupération, avatar/menu et paramètres. Le code rassemble une stack personnelle v4 (sélection v3, gratuit/payant, montants et décisions), les caches par propriétaire, la synchronisation CAS, la suppression reprenable et la consultation administrateur. Le catalogue JSON reste l'autorité des fiches ; aucune migration du catalogue historique Supabase n'est incluse. Le back-office utilise l'index JSON directement et signale les références absentes.

Contrôles de configuration en lecture seule du 19 octobre : Google désactivé, e-mail activé, inscription permise, confirmation e-mail requise. Cette observation historique est à revalider : elle ne prouve ni la livraison des liens de confirmation/récupération ni les retours Google/GitHub. Les variables locales inspectées sont publiques ; aucune clé de service ni allowlist administrateur n'a été copiée. La lecture des métadonnées Vercel a renvoyé 403, sans CLI disponible : les variables de déploiement restent à vérifier avec un opérateur autorisé.

## Configuration de recette puis de production

| Variable | Emplacement | Condition |
| --- | --- | --- |
| `STACK_ACCOUNT_ENABLED` | serveur uniquement | `true` explicite après validation ; défaut désactivé |
| `VITE_STACK_ACCOUNT_ENABLED` | build navigateur | `true` explicite après validation ; défaut désactivé |
| `VITE_ACCOUNT_GOOGLE_ENABLED` | build navigateur | `true` seulement si Google a été configuré et recetté ; défaut désactivé |
| `VITE_ACCOUNT_GITHUB_ENABLED` | build navigateur | `true` seulement si GitHub a été configuré et recetté ; défaut désactivé |
| `SUPABASE_URL` | serveur | projet de recette dédié, puis projet cible validé |
| `SUPABASE_SERVICE_ROLE_KEY` | serveur uniquement | secret de service, jamais préfixé `VITE_`, jamais dans Git |
| `VITE_SUPABASE_URL` | navigateur | même projet que le serveur |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | navigateur | clé publique du même projet |
| `BACKOFFICE_ADMIN_EMAILS` | serveur uniquement | liste séparée par virgules d'adresses administrateur confirmées |

Ne pas déduire la configuration des valeurs de secours publiques du client. Le serveur refuse les API privées lorsque son flag ou ses variables manquent. Une allowlist absente refuse les accès administrateur ; ni les métadonnées utilisateur ni un rôle envoyé par le navigateur ne donnent ces droits. Un flag navigateur activé sans serveur prêt affiche une sauvegarde indisponible ; cela ne doit pas être utilisé comme configuration de recette. Le compte est requis avant le premier ajout lorsque la fonctionnalité est activée. Une modification des variables `VITE_` demande un nouveau build.

### Fournisseurs et chemins de retour

Configurer Google et GitHub séparément dans Supabase avec leurs client ID/secrets côté fournisseur. Le **callback enregistré chez Google/GitHub** est `https://<project-ref>.supabase.co/auth/v1/callback` (ou le callback exact affiché par le projet si domaine personnalisé). Ce callback Supabase est distinct des routes de retour ToolTrim. Ne pas enregistrer `/fr/connexion/retour` comme callback fournisseur à sa place. Les scopes applicatifs restent ceux de l'identité de base ; aucun scope repository GitHub ni contacts/fichiers Google n'est demandé. Le rapprochement d'identités appartient à Supabase, sans fusion client d'adresses.

Configurer Site URL sur l'origine de recette, puis l'allowlist Supabase Redirect URLs avec les URL ToolTrim exactes sur ce domaine :

- Confirmation/retour OAuth : `https://<domaine>/fr/connexion/retour`, `https://<domaine>/en/sign-in/callback` (inclure les paramètres de navigation sûrs utilisés par la recette ; vérifier la correspondance effective chez Supabase).
- Récupération : `https://<domaine>/fr/compte/reinitialiser`, `https://<domaine>/en/account/reset-password`.

Aucun wildcard de production ajouté par défaut. Le client limite `returnTo` aux routes ToolTrim autorisées et au même origin ; les tokens de transport ne deviennent pas une destination mémorisée. Tester succès et refus des deux fournisseurs avec retour à une fiche et choix explicite du brouillon. Une identité absente de `user.identities` n'est jamais affichée comme associée.

### E-mail, SMTP et politique de mot de passe

Configurer le SMTP du projet isolé, domaine et expéditeur vérifiés, quotas, délais et limites d'envoi. Valider les templates **Confirm signup** et **Reset password** avec le lien de confirmation Supabase (`{{ .ConfirmationURL }}`), dont le redirect autorisé mène respectivement au callback ToolTrim et à la page de récupération. Le parcours public par code e-mail est remplacé : un template affichant seulement `{{ .Token }}` ne correspond plus à l'interface. Vérifier la livraison réelle, expiration/rejeu et renvoi borné, sans token réel dans les captures ni journaux.

Configurer une longueur minimale de **8 caractères** pour les nouveaux mots de passe ; phrases et espaces sont acceptés, sans composition obligatoire. L'application ne trim jamais le mot de passe. La connexion accepte un mot de passe existant non vide sans imposer la nouvelle longueur. Ne pas durcir le fournisseur avec des contraintes que l'interface ne peut pas expliquer sans décision produit séparée.

Le reset exige un événement SDK `PASSWORD_RECOVERY` et la même identité/session ; le simple paramètre `recovery=true` n'autorise rien. Une preuve UX peut survivre au reload dans le même onglet pendant 15 minutes au maximum, liée à la session ; le serveur reste l'autorité. Après `updateUser`, le fournisseur reçoit une révocation des autres sessions. Si cette révocation échoue, l'interface distingue le mot de passe déjà changé et l'avertissement de fermeture non confirmée : ne pas répéter la mutation. Traiter les exigences de réauthentification/nonce du fournisseur sans les contourner. Les paramètres envoient aussi un lien e-mail, sans formulaire de mutation directe.

Sources vérifiées le 21 octobre : [mot de passe](https://supabase.com/docs/guides/auth/passwords), [Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [GitHub](https://supabase.com/docs/guides/auth/social-login/auth-github), [templates](https://supabase.com/docs/guides/auth/auth-email-templates), [retours](https://supabase.com/docs/guides/auth/redirect-urls). SDK installé 2.99.1 conservé. Le changelog de retrait des anciens ciphers TLS ne change pas ces appels dans les navigateurs modernes.

## Migrations et permissions

Sauvegarder la base et exporter les métadonnées de schéma/permissions avant une intervention autorisée. Confirmer les migrations déjà appliquées avant d'utiliser la CLI Supabase et inspecter son `--help` dans l'environnement opérateur. Vérifier d’abord le socle [20260825124355_ma_stack_account_sync.sql](../supabase/migrations/20260825124355_ma_stack_account_sync.sql) dans l’historique existant ; ne pas le réappliquer sur une base déjà provisionnée. Appliquer ensuite les migrations absentes, dans cet ordre, sur une recette isolée :

1. [20261019081436_personal_stack_v4.sql](../supabase/migrations/20261019081436_personal_stack_v4.sql).
2. [20261020064858_personal_account_deletion.sql](../supabase/migrations/20261020064858_personal_account_deletion.sql).
3. [20261021073601_account_profile_settings.sql](../supabase/migrations/20261021073601_account_profile_settings.sql).
4. [20261022073822_account_oauth_profile.sql](../supabase/migrations/20261022073822_account_oauth_profile.sql).

Ces quatre migrations ont été appliquées au projet ToolTrim le 23 octobre 2026, après accord du propriétaire et sauvegarde préalable. Les versions distantes sont attribuées par l’outil de migration ; vérifier les noms plutôt que réappliquer les fichiers locaux. Elles conservent les snapshots historiques, ajoutent révision/statut de suppression et RPC serveur avec vérification de session. La dernière ajoute une importation unique du nom, de l'avatar et de la langue fournis par l'identité Google/GitHub vérifiée ; les noms personnalisés, même effacés, ne sont pas réimportés. La langue fournisseur est informative et ne change pas la langue de navigation. `profiles`/`stack_snapshots` ne sont plus modifiables directement par les clients ; les RPC privées ne sont exécutables que par `service_role`, avec politiques propriétaire en défense supplémentaire. Ne pas exposer le schéma Auth ni changer les FK contributrices pour faciliter une suppression.

Le garde de suppression conserve les contributions historiques. Un compte lié à des contributions reçoit une erreur explicite et reste protégé pour reprise ; aucune cascade improvisée. L'ancienne Edge Function `delete-account` est dormante et répond 410 dans la source : ne pas la déployer comme contournement.

`npm run test:accounts:db` exécute migration, assertions SQL et rollback sur PGlite PostgreSQL 18.6. Le contrôleur a aussi exécuté le même SQL sur PostgreSQL 17.5 embarqué. Ces preuves ne couvrent pas GoTrue, PostgREST, les conseillers Supabase ou deux connexions SQL indépendantes.

## Recette automatique isolée

```sh
npm run test:e2e:accounts
```

Playwright démarre lui-même `e2e/fixtures/accounts-server.mjs` sur `http://127.0.0.1:8192`, sans réutiliser un service existant. Il simule les routes réellement appelées par le SDK Supabase 2.99.1 (`signup`, `resend`, `recover`, `authorize` Google/GitHub, `token` password/refresh, GET/PUT `user`, `logout`) et les API privées, dont le profil. Un cache Vite propre à 8192 évite de partager les dépendances optimisées avec la prévisualisation. Il n'importe jamais la fixture dans l'application. Les contextes bloquent toute requête navigateur dont l'origin n'est pas exactement celui de la fixture, y compris les autres ports locaux ; les service workers sont désactivés. Les identités sont limitées à `@example.invalid`. Les contrôles `/__accounts-test/` n'existent que sur ce serveur de test. Ne pas utiliser ce serveur sur une interface publique ni l'intégrer à un déploiement.

Pour une inspection manuelle locale, démarrer `node e2e/fixtures/accounts-server.mjs`, créer un compte avec une adresse `@example.invalid` et un mot de passe fictif de huit caractères minimum, puis ouvrir `/__accounts-test/mailbox` pour cliquer sur le lien. La récupération utilise cette même boîte locale ; aucun e-mail n'est expédié. Les contrôles de test peuvent aussi précréer des comptes confirmés avec `fixture-password`, dont `admin@example.invalid` pour le back-office. Redémarrer cette fixture efface uniquement ses données en mémoire ; ne pas utiliser ce redémarrage sur la prévisualisation utilisateur distincte. Les mots de passe fictifs restent dans une map serveur dédiée, exclus du journal de requêtes et des réponses de contrôle.

La suite conserve les contrôles complets de stack v4 sur un autre contexte sans stockage copié, décisions/prix/intention, retrait persistant, brouillon divergent/équivalent, panne/cache sale/reload, reprise/accusé perdu, CAS, réponse A tardive/B, suppression/reprise/recréation et refus/compteurs/détails back-office. Elle ajoute confirmation, mauvais mot de passe sans inscription implicite, renvoi borné, récupération SDK à froid sans faux message invalide puis après reload, lien expiré, nouveau mot de passe exact, avertissement distinct après échec de révocation, deux OAuth succès/refus et retour fiche, nom confirmé/relu, préférences locales, export et sortie sale. Les deux recettes OAuth de profil vérifient l'import, la relecture, la reconnexion, le nom effacé et le détail administrateur ; les avatars fictifs sont interceptés et servis localement sans accès aux hôtes externes. Les captures propres FR/EN, 390/1440, clair/sombre, clavier/focus/modal/menu sont dans `.superpowers/sdd/2026-10-21-account-experience/render-task4/` (ignoré) ; traces et captures de recette dans `test-results/accounts/`.

### Confidentialité des retours d'authentification

Les URL de retour peuvent encore contenir des tokens pendant l'initialisation SDK. GA4 enlève tous les fragments, les paramètres des routes privées et les clés de transport/identité des URL publiques et du referrer, même après consentement préalable ; ses champs `set` et `page_view` utilisent les mêmes valeurs nettoyées. Les paramètres publics ordinaires (par exemple UTM/devise) restent utilisables.

Avant tout chargement DataFast, un garde dans `index.html` examine URL et referrer initiaux. Les documents privés, les URL sensibles et les documents avec fragment omettent DataFast et Vercel Analytics pendant toute leur durée de vie, même après nettoyage SDK ou retour SPA sur une fiche. Il ne mémorise qu'un booléen dans le document, sans URL, token, flag d'exclusion persistant ni modification du transport Auth. Vercel utilise aussi le `beforeSend` du package installé pour refuser les événements sensibles ultérieurs et nettoyer les fragments publics. **La perte de mesure d'audience sur ces documents est intentionnelle.** Un prochain chargement complet d'une page publique ordinaire rétablit les trackers ; le choix de consentement existant reste inchangé.

Les régressions utilisent des tokens fictifs, un faux tracker et des charges utiles enregistrées localement, sans requête analytics réelle. La simulation ne certifie pas les scripts tiers futurs ni la configuration distante.

### Recette du serveur généré après le build final

Le contrôleur lance une seule fois le build production avec les flags publics désactivés, puis :

```sh
npx playwright test --config playwright.accounts-generated.config.ts
```

Cette commande ne lance aucun build et ne réutilise aucun serveur. Elle sert le `dist` frais sur `127.0.0.1:8193` avec `scripts/serve-generated-routing.mjs`, les rewrites et en-têtes configurés de `vercel.json` et un cache local `no-store`. Elle vérifie les dix routes privées HTTP 200 avec `X-Robots-Tag: noindex, nofollow`, le rendu FR/EN flags désactivés sans appel Auth/profil, un chemin inconnu 404 et une fiche publique indexable. Elle ne certifie pas le CDN Vercel ni ses en-têtes distants ; vérifier le HTTP réel lors d'une future publication autorisée. Le test HTTP du harness utilise un répertoire temporaire, sans build ni modification du `dist` final.

## Recette fournisseur obligatoire avant activation

Cette étape reste ouverte : les mocks ne permettent pas de la déclarer réussie. Prévoir deux identités A/B dédiées et un administrateur de recette contrôlés par l'opérateur, sans message à un tiers ni branche cloud payante automatique.

1. Sur Supabase isolé, vérifier inscription/confirmation et connexion par mot de passe, récupération réelle (expiration, rejeu, reload et révocation), puis Google et GitHub réels avec les erreurs décrites plus haut ; capturer les paramètres de retour sans secret.
2. Vérifier l'identité confirmée et les sessions réelles, puis révoquer une session et constater le refus de lecture/écriture. Vérifier qu'A et B restent isolés, y compris un appel privé avec un autre owner dans un body forgé.
3. Avec les rôles `anon`/`authenticated`, vérifier le refus des RPC et des écritures directes ; avec le service serveur, vérifier les lectures/sauvegardes autorisées, la création de profil sans snapshot vide et les limites de payload. Vérifier pour Google et GitHub l'import unique des seules données cosmétiques de `identity_data`, la priorité du nom personnalisé ou effacé, l'avatar, la langue informative, le détail back-office et les métadonnées invalides. Vérifier le refus back-office d'un utilisateur/éditeur et d'un utilisateur ayant forgé ses métadonnées.
4. Sur deux connexions/appareils, faire deux PUT avec la même révision : une réussite, un 409. Couper l'accusé de réception après commit, relire et résoudre sans écrasement. Sauvegarder en parallèle d'une suppression : aucune recréation après statut deleting ni après suppression Auth. Vérifier reprise après erreur Auth et traitement contributif conservateur.
5. Vérifier les compteurs sur plus de 25 comptes, les snapshots v3/v4/vides et les références JSON absentes. Une source corrompue ou indisponible doit afficher indisponible, jamais zéro inventé. Le garde-fou SQL reconnaît la structure minimale des enveloppes enregistrées sur tous les comptes éligibles, avant de rendre les agrégats ; une ligne illisible hors de la recherche ou de la page provoque aussi une réponse HTTP 503. Les formes v3 partielles et les membres récupérables restent acceptés.
6. Contrôler les conseillers sécurité/performance Supabase après migration et consigner les résultats et écarts. Tester les secrets uniquement côté serveur et l'absence des fixtures dans le bundle public.
7. Vérifier flags désactivés sur le build public et drapeaux explicitement activés sur recette ; revalider FR/EN mobile et bureau sur la recette fournisseur.

Après ces preuves et résolution des écarts, proposer l'activation publique comme opération distincte. La préparation et le passage des tests locaux ne valent pas publication ou activation.

## Retour arrière et incident

Désactiver les flags de compte serveur et navigateur ainsi que ceux des fournisseurs (rebuild pour le navigateur), drainer les requêtes privées en cours et vérifier que la navigation locale reste disponible. Conserver profils, snapshots v4, révisions et barrières `deleting`. Inspecter puis appliquer les scripts de rollback de configuration en ordre inverse : [profil OAuth](../supabase/rollback/20261022073822_account_oauth_profile.sql), [profil](../supabase/rollback/20261021073601_account_profile_settings.sql), [suppression](../supabase/rollback/20261020064858_personal_account_deletion.sql), puis [stack v4](../supabase/rollback/20261019081436_personal_stack_v4.sql). Ils révoquent les accès RPC et préservent les données ; ils ne réouvrent pas les anciennes écritures client. Les fonctions sont conservées avec leurs ACL EXECUTE révoquées, y compris pour service_role ; **ne pas relancer aveuglément les migrations `CREATE FUNCTION`** qui échoueraient sur ces objets conservés. Une réactivation requiert inspection des définitions/signatures et restauration explicite des seules ACL service autorisées, ou une nouvelle migration revue. Ne pas redonner d’accès navigateur. Sauvegarder avant toute réparation de données distincte.

En cas de panne, le cache sale reste lié à son propriétaire ; ne pas le copier dans un brouillon anonyme. Proposer réessai/reconnexion/conflit selon l'état affiché. Ne pas annoncer une suppression distante après une simple expiration de session : l'action de nettoyage local est distincte de la confirmation serveur. Si le navigateur bloque le nettoyage, suivre l'avertissement de l'interface et effacer les données du site sur l'appareil partagé. Ne pas exporter les caches personnels dans les journaux de support.

Le persona, le métier, l’entreprise et la qualification progressive restent pour plus tard, séparés du profil et de la preuve de connexion. Aucun questionnaire obligatoire ni schéma persona anticipé dans cette livraison.

## Préflight de préproduction du 23 octobre 2026

- Projet Supabase ToolTrim : quatre migrations appliquées après confirmation que cette base n’est pas exploitée. Sauvegarde préalable locale privée ; contrôle des sept RPC métier : refus anon/authenticated et exécution service_role autorisée.
- Auth publique : e-mail activé, inscription permise, confirmation requise ; Google et GitHub désactivés. SMTP, templates et livraison réelle non vérifiés.
- Vercel : connecteur refusé (403), mais accès CLI vérifié au projet `toolstack-wizard` de l’équipe `mbloch-designs-projects`. Déploiement de recette en préparation.
- Recette supplémentaire locale : API 283 tests réussis, 18 ignorés ; migrations/assertions/rollback SQL réussis en base éphémère. Ces résultats ne prouvent pas une connexion OAuth ou une livraison e-mail réelle.

Avant de communiquer une URL de recette : vérifier la cible Vercel de préproduction et le projet Supabase convenu, contrôler les migrations installées, configurer les secrets serveur et les retours autorisés, activer les flags, déployer la version vérifiée, puis tester inscription/confirmation, connexion/déconnexion, récupération, sauvegarde/relecture de stack et refus d’accès privé. Tester chaque fournisseur OAuth avant d’activer son bouton. Ne pas promouvoir en production dans ce lot.


### Reconstruire après un changement de configuration

Le filtre Git ignore volontairement les sources inchangées. Pour une activation de fournisseur sans modification de code, définir explicitement `TOOLTRIM_FORCE_BUILD=1` sur la Preview visée avant de reconstruire, puis retirer ce signal une fois le déploiement lancé. Le signal ne change aucun flag métier et n’active pas les comptes en production. Le test `node --test scripts/vercel-ignore-build.test.mjs` vérifie le maintien du skip normal et le rebuild explicite. GitHub a été activé dans Supabase le 23 octobre ; le propriétaire a confirmé son retour connecté vers Ma stack et la projection serveur contient un profil GitHub avec nom et avatar.
