# Comptes et stacks : exploitation et activation

État au 24 octobre 2026 : comptes activés et vérifiés sur `https://tooltrim.com`, après intégration de la branche `codex/accounts-stack-mvp` avec main, sur le projet Supabase existant expressément autorisé par le propriétaire. Six migrations de comptes ont été appliquées après sauvegarde (les deux dernières via SQL Editor, sans entrée dans l’historique). Les flags restent désactivés par défaut dans le code. La finalisation Production et l'intégration avec `main` sont décrites en fin de document ; ne pas assimiler une CI de branche à une validation du code de production intégré.

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
| `SUPABASE_URL` | serveur | projet existant autorisé pour la recette ; vérifier la cible avant toute modification |
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

### Usage, métier et tarif journalier : migrations du 23 octobre 2026

Deux migrations à appliquer dans cet ordre, après les quatre précédentes :

1. [20261023090000_personal_stack_usage.sql](../supabase/migrations/20261023090000_personal_stack_usage.sql) : l'usage des outils, de 1 à 5.
2. [20261023100000_personal_stack_onboarding.sql](../supabase/migrations/20261023100000_personal_stack_onboarding.sql) : le métier (`trade`) et le tarif journalier (`dailyRate`) de l'onboarding.

Elles ne modifient aucune table et ne réécrivent aucune ligne. Chacune remplace la fonction de validation `public._personal_stack_valid(jsonb)` par une version qui contrôle en plus les nouveaux champs, facultatifs. Une stack sans ces champs reste valide. Les droits sont conservés par `create or replace`. Sans ces migrations, le prénom s'enregistre quand même (profil existant), mais une stack qui contient un usage, un métier ou un tarif est refusée à la sauvegarde.

Les requêtes ci-dessous ont été exécutées le 23 octobre 2026 sur PostgreSQL éphémère dans le même ordre (état initial, deux migrations, deux retours arrière). Les résultats attendus viennent de cette exécution.

**Étape 0 : préparer**

- Confirmer le projet Supabase visé (préproduction ToolTrim) et faire une sauvegarde, comme pour les migrations précédentes.
- Ne pas déployer la nouvelle version du site avant l'étape 4 : l'ancienne version reste compatible avec les deux validateurs.

**Étape 1 : relever l'état de départ** (SQL Editor, lecture seule)

```sql
-- Migrations déjà enregistrées : les quatre précédentes doivent apparaître, pas les deux nouvelles.
select version, name from supabase_migrations.schema_migrations order by version desc limit 10;

-- Le validateur en place doit être celui de la stack v4 : attendu false, false.
select position('''usage''' in d) > 0 as has_usage_check, position('''trade''' in d) > 0 as has_onboarding_check
from (select pg_get_functiondef('public._personal_stack_valid(jsonb)'::regprocedure) as d) f;

-- Les stacks enregistrées : noter les quatre nombres, ils servent de référence jusqu'à la fin.
select count(*) as snapshots,
       count(*) filter (where public._personal_stack_stored(state)) as stored_ok,
       count(*) filter (where state ? 'usage') as with_usage,
       count(*) filter (where state ? 'trade' or state ? 'dailyRate') as with_onboarding
from public.stack_snapshots;
```

Si le validateur contient déjà `usage`, la première migration est déjà passée : vérifier l'historique avant d'aller plus loin, ne rien réappliquer à l'aveugle.

**Étape 2 : appliquer la migration usage**

Soit par la CLI (vérifier d'abord `supabase db push --help` dans l'environnement opérateur) : `supabase db push --dry-run` doit lister seulement les deux fichiers du jour, puis `supabase db push`. Soit par le SQL Editor : coller le contenu complet du fichier entre `begin;` et `commit;`. Dans ce cas, l'historique `schema_migrations` n'est pas renseigné : un `db push` ultérieur rejouerait le fichier, ce qui est sans effet puisqu'il ne fait que `create or replace`.

Vérifier aussitôt :

```sql
-- Sondes : attendu empty_ok true, usage_ok true, usage_9_accepted false.
with base as (select '{"version":4,"selection":{"version":3,"needs":[],"toolEntries":[],"pinnedToolSlugs":[]},"billing":{"paid":[],"reviewed":[],"choices":{}},"decisions":{}}'::jsonb as s)
select public._personal_stack_valid(s) as empty_ok,
       public._personal_stack_valid(s || '{"usage":{"figma":4}}') as usage_ok,
       public._personal_stack_valid(s || '{"usage":{"figma":9}}') as usage_9_accepted,
       public._personal_stack_valid(s || '{"trade":"designer","dailyRate":{"amount":500,"currency":"EUR"}}') as onboarding_ok,
       public._personal_stack_valid(s || '{"trade":"astronaut"}') as trade_unknown_accepted,
       public._personal_stack_valid(s || '{"dailyRate":{"amount":0,"currency":"EUR"}}') as rate_0_accepted
from base;

-- Droits : attendu security_definer false, anon false, authenticated false sur les deux fonctions.
select p.proname as fonction, p.prosecdef as security_definer,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('_personal_stack_valid', '_personal_stack_stored')
order by 1;
```

Relancer aussi la requête des stacks enregistrées de l'étape 1 : les quatre nombres doivent être identiques.

**Étape 3 : appliquer la migration onboarding**

Même méthode que l'étape 2, avec le second fichier. Vérifier ensuite :

- Sondes : `empty_ok`, `usage_ok`, `onboarding_ok` à true ; `usage_9_accepted`, `trade_unknown_accepted`, `rate_0_accepted` à false.
- Droits : inchangés (false partout).
- Validateur : `has_usage_check` et `has_onboarding_check` à true.
- Stacks enregistrées : les quatre nombres de l'étape 1, inchangés.

**Étape 4 : recette dans l'application**

Déployer la version vérifiée de la branche en préproduction. Avec un compte de test : se connecter, faire l'onboarding jusqu'à « Ouvrir mon espace » en choisissant un métier et un tarif, répondre à une question d'usage, recharger, puis se connecter depuis une autre session : métier, tarif et usage doivent revenir. Contrôler la ligne du compte de test uniquement :

```sql
select revision, updated_at, state->'trade' as trade, state->'dailyRate' as daily_rate, state->'usage' as usage
from public.stack_snapshots
where owner_id = (select id from auth.users where email = 'adresse-du-compte-de-test');
```

**Retour arrière**

Dans l'ordre inverse, et seulement si nécessaire :

1. [rollback onboarding](../supabase/rollback/20261023100000_personal_stack_onboarding.sql) : remet le validateur de l'étape 2. Sondes attendues : `trade_unknown_accepted` et `rate_0_accepted` reviennent à true, `usage_9_accepted` reste false.
2. [rollback usage](../supabase/rollback/20261023090000_personal_stack_usage.sql) : remet le validateur de la stack v4. Sondes attendues : `usage_9_accepted` revient à true.

Après chaque retour arrière : droits inchangés, et les quatre nombres de l'étape 1 identiques. Les valeurs déjà enregistrées (`usage`, `trade`, `dailyRate`) restent dans les stacks : l'ancien validateur les ignore, aucune stack ne devient invalide. Si l'historique `schema_migrations` a été renseigné par la CLI, y retirer les deux versions concernées avant une nouvelle application, sinon la CLI les considérera comme déjà passées.

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

Le métier et le tarif journalier facultatif sont collectés dans l’onboarding et conservés dans la stack, séparément du profil et de la preuve de connexion. L’entreprise et une qualification supplémentaire restent différées.

## Préflight de préproduction du 23 octobre 2026

- Projet Supabase ToolTrim : quatre migrations appliquées après confirmation que cette base n’est pas exploitée. Sauvegarde préalable locale privée ; contrôle des sept RPC métier : refus anon/authenticated et exécution service_role autorisée.
- Complément du 23 octobre 2026 : migrations `20261023090000_personal_stack_usage.sql`, puis `20261023100000_personal_stack_onboarding.sql` appliquées sur ToolTrim (`rtfyfuwfdpnsogovkwai`, eu-central-1) depuis la branche synchronisée au commit `4c5b9dc5cc`. Méthode : SQL Editor, contenu complet de chaque fichier dans une transaction distincte `begin; … commit;`, vérifications en lecture seule via le connecteur Supabase entre les deux transactions. Sauvegarde locale privée préalable des deux définitions de fonctions, propriétaires/ACL et résultats du préflight ; aucune sauvegarde de données personnelles ni réécriture de stack.
  - État initial : les quatre migrations précédentes sont présentes ; les deux nouvelles sont absentes de l’historique. Contrôles `usage` / `trade` : `false / false`. Compteurs `snapshots / stored_ok / with_usage / with_onboarding` : `2 / 2 / 2 / 0`.
  - Après usage : sondes `empty_ok / usage_ok / usage_9_accepted / onboarding_ok / trade_unknown_accepted / rate_0_accepted` = `true / true / false / true / true / true`. Après onboarding : `true / true / false / true / false / false` ; contrôles `usage` / `trade` = `true / true`.
  - Après chacune : `security_definer / anon EXECUTE / authenticated EXECUTE` à `false / false / false` sur `_personal_stack_valid` et `_personal_stack_stored` ; les quatre compteurs restent `2 / 2 / 2 / 0`. Aucun écart dans les sondes, droits ou compteurs, aucun retour arrière.
  - Historique final `supabase_migrations.schema_migrations` inchangé, dernière version `20261023060651` (`account_oauth_profile`) : les deux fichiers appliqués par SQL Editor ne sont pas enregistrés dans cette table, conformément à la procédure. Aucun autre objet ni droit modifié. Ordre opératoire : les trois lectures du préflight ont précédé la sauvegarde, qui a bien précédé toute écriture. Étape 4 applicative non exécutée dans cette intervention : aucun compte de test désigné et instruction explicite de ne pas déployer ; aucun déploiement ni promotion en production lancé.
- État Auth au début du préflight : e-mail activé avec confirmation ; Google et GitHub étaient alors désactivés. État ultérieur : les deux fournisseurs ont été configurés et leur retour connecté confirmé par le propriétaire. Les modèles ToolTrim sont enregistrés ; leur livraison réelle reste à recetter (voir la recette ci-dessous).
- État Vercel au début du préflight : connecteur refusé (403), accès CLI vérifié au projet `toolstack-wizard` de l’équipe `mbloch-designs-projects` ; les déploiements de recette ultérieurs sont consignés ci-dessous.
- Recette supplémentaire locale : API 283 tests réussis, 18 ignorés ; migrations/assertions/rollback SQL réussis en base éphémère. Ces résultats ne prouvent pas une connexion OAuth ou une livraison e-mail réelle.

Avant de communiquer une URL de recette : vérifier la cible Vercel de préproduction et le projet Supabase convenu, contrôler les migrations installées, configurer les secrets serveur et les retours autorisés, activer les flags, déployer la version vérifiée, puis tester inscription/confirmation, connexion/déconnexion, récupération, sauvegarde/relecture de stack et refus d’accès privé. Tester chaque fournisseur OAuth avant d’activer son bouton. Ne pas promouvoir en production dans ce lot.


### Reconstruire après un changement de configuration

Le filtre Git ignore volontairement les sources inchangées. Pour une activation de fournisseur sans modification de code, définir explicitement `TOOLTRIM_FORCE_BUILD=1` sur la Preview visée avant de reconstruire, puis retirer ce signal une fois le déploiement lancé. Le signal ne change aucun flag métier et n’active pas les comptes en production. Le test `node --test scripts/vercel-ignore-build.test.mjs` vérifie le maintien du skip normal et le rebuild explicite. GitHub a été activé dans Supabase le 23 octobre ; le propriétaire a confirmé son retour connecté vers Ma stack et la projection serveur contient un profil GitHub avec nom et avatar.

### Modèles d’e-mails ToolTrim

Les sources versionnées des messages de confirmation et récupération se trouvent dans `supabase/templates/account/`. Voir leur README pour l’installation, la vérification et le retour arrière. La publication web ne déploie pas ces modèles dans Supabase. Le français et l’anglais coexistent dans un message pour les comptes existants, sans nouvelle collecte de langue. Les jetons et retours utilisent exclusivement `{{ .ConfirmationURL }}`.

### Recette réelle du 23 octobre 2026

- La recette distante générale a vérifié les API privées, la persistance de stack et de profil, les conflits de révision, le refus administrateur pour un compte ordinaire et la suppression du seul compte temporaire.
- Les messages génériques de confirmation/récupération ont été reçus sur un alias de recette autorisé. Les limitations liées à la protection Vercel lors du test navigateur sont consignées dans le rapport de recette.
- Les deux modèles de ces messages sont maintenant enregistrés dans Supabase au style ToolTrim, avec le logo officiel converti en PNG et hébergé dans le seul bucket public de marque. Leur persistance et leur aperçu ont été revérifiés ; livraison réelle des deux nouvelles versions recettée le 23 octobre sur un alias temporaire dédié (réception en boîte, logo, textes FR/EN et authentification SPF/DKIM/DMARC). Le lien reçu de confirmation établit la session attendue, celui de récupération permet le changement de mot de passe et la révocation des autres sessions ; leur rejeu est refusé. Le SMTP intégré reste inchangé.
- Le 23 octobre, le compte connecté du propriétaire a été refusé par l’allowlist serveur, puis son ajout a été explicitement autorisé. Modification limitée à la variable Preview de la branche comptes ; accès existants conservés. Déploiement `dpl_8Uy7VBkNBWRdmXN8mJTTDowq4BFe` READY, commit `9fd2bf8830727ab0fa736bfdb53c0c348ddb5f47`. Accès réel vérifié dans Chrome : tableau chargé, compte retrouvé par recherche, détail et état de stack affichés. Les compteurs globaux (2 comptes confirmés, 0 stack sauvegardée) correspondent à la requête de contrôle en base et restent globaux après filtrage. API anonyme refusée avec HTTP 401.
- L’ancienne page technique de retour OAuth a ensuite été remplacée par une transition discrète avec retour automatique. Les parcours simulés vérifient cette transition ; la recette navigateur avec les fournisseurs réels reste distincte.


### Contrôles continus après la revue du 23 octobre 2026

Le job CI `accounts` exécute les assertions de migration/droits/rollback sur PostgreSQL éphémère, puis les parcours navigateur avec fournisseurs simulés. Le job principal vérifie également les routes générées comptes après le build. Ces recettes ne remplacent pas les vrais e-mails et retours OAuth du domaine final.

Les états sains d’attente et de sauvegarde sont affichés discrètement ; une reprise manuelle est proposée uniquement pour un véritable échec. Le scénario réseau attend explicitement la réponse PUT et la révision effectivement enregistrée avant l’indicateur visuel. Pour isoler une recette locale d’un serveur déjà actif : `PLAYWRIGHT_ACCOUNTS_PORT=8292 npm run test:e2e:accounts`. Aucune activation publique n’est comprise dans ces corrections.

### Retours du domaine final vérifiés le 23 octobre 2026

Après sauvegarde privée de la configuration et autorisation explicite du propriétaire, quatre URL exactes ont été ajoutées dans Supabase URL Configuration : `https://tooltrim.com/fr/connexion/retour`, `https://tooltrim.com/en/sign-in/callback`, `https://tooltrim.com/fr/compte/reinitialiser` et `https://tooltrim.com/en/account/reset-password`. Les cinq URL de recette et la Site URL Preview sont conservées ; total : neuf destinations, sans wildcard supplémentaire. La persistance est vérifiée après réouverture du tableau de bord.

Les sondes de génération de lien du seul compte temporaire confirment les quatre destinations exactes. Elles révèlent aussi que Supabase refuse un callback enrichi de `?returnTo=…` et retombe alors sur la Site URL : le client transmet désormais uniquement le callback exact et garde la destination validée dans le sessionStorage de l’onglet, pendant une heure maximum. Sans ce contexte (autre appareil, stockage bloqué, expiration), le retour ouvre Ma stack. Les anciens liens comportant une destination continuent d’être validés. La destination est effacée après la transition terminée, jamais pendant le rendu React.

Cette configuration prépare les retours ; elle ne constitue ni une promotion ni une recette navigateur du domaine public. La Site URL doit être revue au moment de l’activation finale. La livraison, les liens et les mots de passe de recette restent privés et ne sont jamais consignés dans le dépôt.

Le 24 octobre, le compte Resend existant et le domaine `tooltrim.com` vérifié ont été réutilisés. Après autorisation explicite, une clé « ToolTrim Supabase Auth » a été créée avec le seul droit d’envoi, limité à ce domaine ; les deux clés existantes sont conservées. Le propriétaire a saisi le secret dans Chrome puis enregistré le SMTP Supabase : hôte `smtp.resend.com`, port TLS `465`, utilisateur `resend`, expéditeur `ToolTrim <noreply@tooltrim.com>`. Activation et valeurs publiques revérifiées après rechargement ; mot de passe stocké masqué, aucune clé dans les fichiers versionnés. Resend affiche une utilisation récente de cette clé dédiée.

La recette réelle via ce SMTP a reçu la confirmation et la récupération sur un nouvel alias dédié, en boîte de réception, avec logo/identité ToolTrim et SPF/DKIM/DMARC validés. Les liens reçus établissent les sessions attendues via le SDK ; confirmation, récupération, nouveau mot de passe et refus du rejeu passent. Le compte temporaire a été supprimé et son absence vérifiée ; fichiers temporaires de mots de passe, sessions et liens consommés supprimés. Cette recette ne remplace pas le test navigateur sur le domaine public après activation.

L’alerte de fin de période de grâce a été examinée le 24 octobre : les quotas affichés restent sous les limites (base 18 %, egress 2 %, utilisateurs actifs moins de 1 % ; aucun dépassement affiché). Aucune modification de plan, de plafond ni de facturation. Ces chiffres décrivent l’instant du contrôle et ne constituent pas une garantie de capacité future.

### Contrôles complémentaires du 24 octobre 2026

Le job GitHub « Account database and browser contracts » du commit `b04c6bfaaa` est vert. Le job général atteint les tests d’accessibilité, où des attentes d’anciens libellés, du stockage v3 et de l’ancien bouton Explorer bloquent la suite. Les tests conservent leurs assertions clavier, persistance, audit axe et retour du focus, en ciblant le catalogue, le stockage v4 et le menu mobile actuels. Le nouveau scénario mobile a reproduit un défaut réel : le focus était tenté avant le montage du panneau. L’effet attend désormais ce montage. Recette locale : 21 tests d’accessibilité, 6 de recherche, 21 de médias/routage et 16 de retour paiement passent ; ces fournisseurs de paiement restent simulés. La CI complète du correctif `2cc0ec99f7` a ensuite terminé avec succès le 24 octobre : les deux jobs sont verts ([run 40066401292](https://github.com/mbloch-design/toolstack-wizard/actions/runs/40066401292)).

La recette d’hydratation a ensuite observé une erreur React 421 à la première ouverture d’une fiche avec une sélection enregistrée (56/57 scénarios passaient). Le scénario a été rendu reproductible en ralentissant le chargement du module de fiche de 1,5 seconde. Le profil sans utilisateur réémettait inutilement son état déjà inactif au montage, ce qui republiait le contexte au-dessus de la route en cours d’hydratation. Le reset préserve maintenant l’état identique ; les vrais changements d’utilisateur continuent d’effacer le profil. Après rebuild, le scénario lent passe trois fois de suite et les 11 tests de propriété/annulation du profil passent. Le test React reste actif, sans suppression d’erreur ni retry ajouté.

Recette finale du build corrigé : 58/58 scénarios d’hydratation (chargement lent inclus) et 66/66 parcours comptes passent, ainsi que les 804 tests unitaires, TypeScript app/node/API et le contrôle des design tokens. Revue indépendante : aucun défaut actionnable signalé. Aucun déploiement ou promotion en production ; le SMTP Resend a ensuite été activé et recetté comme indiqué ci-dessus. La Site URL reste celle de préproduction jusqu’à l’activation finale.

Validation distante du correctif `2cc0ec99f7` : Preview Vercel `dpl_8rdLBXwbrvHAAnWnbCds3gxJNegX` Ready, concordance avec le statut GitHub de ce commit vérifiée. Le compte rendu SMTP est ajouté après cette CI ; il ne modifie aucun code applicatif, migration, droit ou variable Vercel. Aucune promotion en production.

## Finalisation et intégration Production du 24 octobre 2026

Le propriétaire a autorisé la finalisation sur `tooltrim.com`. Les variables de comptes sont configurées dans l'environnement Vercel Production, sur le même projet Supabase `rtfyfuwfdpnsogovkwai`. La liste administrateur conserve le compte existant et inclut le propriétaire déjà autorisé en recette ; les secrets ne figurent pas dans ce compte rendu. Les paramètres de paiement et Resend existants sont conservés. La Site URL Supabase est `https://tooltrim.com` ; les quatre anciennes destinations Lovable ont été retirées après conservation de la configuration précédente. Il reste la Preview de recette et les quatre callbacks exacts de production. Sondes sur le seul compte jetable : cinq destinations conservées acceptées, quatre anciennes destinations Lovable refusées.

Google Auth Platform utilise le client ToolTrim Web du projet `zync-mbloch-71b05635`. Après accord explicite du propriétaire, l'application est passée en Production ; le nom et le logo ont été validés puis publiés par Google. Les liens publics d'accueil, confidentialité et conditions sont enregistrés. Les permissions restent celles de l'identité de base (`email profile` pour Google, `user:email` pour GitHub).

Incident de séquencement : le build isolé `8ebfa03a04` (`dpl_7cf48MZzqsb8NZnpaFtoUrMY4PsL`) avait une CI verte et ses sondes authentifiées passaient. Une tentative de mise à jour de `main` a été refusée, révélant la divergence avec `33fddee5ef` (85 commits propres à main, 91 à la branche comptes). La promotion avait déjà abouti : elle a été immédiatement annulée en réattribuant le domaine au déploiement Production précédent `dpl_CqrUZ3G8C9ctdemJDgvh2CtMEQax`, puis cette attribution a été vérifiée. Aucun push forcé, aucune migration ni modification des stacks existantes.

L'intégration reprend depuis les deux historiques, en conservant le catalogue et les métadonnées récentes de main, la suppression d'AutoPhotos.ai, CookieConsent v3, le retrait de DataFast, la recherche et la navigation actuelles, ainsi que l'onboarding et l'isolation des comptes. Les callbacks des ajouts animés et Annuler sont protégés par propriétaire et génération de session. Le bootstrap de confidentialité reste bloquant, sans réintroduire de tracker tiers. Une revue indépendante n'a trouvé aucun défaut actionnable dans ce périmètre ; elle ne remplace pas les parcours exécutés. Les résultats de publication définitive seront consignés après validation du build intégré.

Les vérifications du premier build intégré ont révélé deux écarts supplémentaires : le HTML avec comptes activés dépassait les plafonds de 0,2 Mio (0,4 Mio sur l'artefact total), et le contrat catalogue local utilisait un ancien écran vide. Le parcours de ce test a été actualisé sans supprimer son interdiction de réseau Supabase ; il a alors reproduit une initialisation indue de GoTrue en mode comptes désactivés. Le SDK et l'acquisition Auth sont désormais différés jusqu'à leur utilisation effective ; les deux langues passent avec une ancienne session expirée en stockage et zéro requête Supabase. Le renouvellement des comptes actifs reste inchangé. La revue indépendante du correctif n'a pas trouvé de défaut actionnable.

La répétition du statut vocal d'un squelette décoratif a été retirée, en conservant sa classe et ses dimensions : le build avec comptes activés mesure 851,8 Mio au total et 737,6 Mio HTML, sous les plafonds inchangés de 852 et 738 Mio. Le job comptes de la CI construit maintenant ce mode en plus des parcours isolés ; le job principal conserve le build comptes désactivés et les contrats catalogue local. Les résultats du correctif final et de sa promotion restent à consigner après exécution distante.

Le scénario SSR de chargement lent a ensuite été exécuté avec les comptes activés (les 58 tests précédents utilisaient le mode par défaut désactivé). Il reproduisait React 421 : le premier état Auth arrivait avant l'hydratation du module de route. Le démarrage du coordinateur attend désormais un marqueur de commit dans la frontière Suspense de la route ; ce signal est unique et ne retarde jamais les changements de propriétaire ultérieurs. Les tests StrictMode et d'isolation immédiate restent conservés. Le build activé passe, puis le scénario navigateur inchangé passe trois répétitions sans React 421. Ce contrôle est ajouté après le build activé dans la CI ; aucune promotion définitive avant les résultats distants du correctif.

Le run intégré `40088742939` a validé tout le job général (build, types, catalogue, navigation, paiements simulés et hydratation) mais a refusé le job comptes sur un faux état « lien invalide » au rechargement de récupération (65/66 parcours réussis). Cause reproduite : SIGNED_IN arrive avant INITIAL_SESSION lors de la restauration du SDK. La restauration accepte désormais ces deux notifications, toujours avec preuve locale non expirée liée au propriétaire et à la session exacts. Régression rouge/verte et six répétitions navigateur ciblées vérifiées ; 901 tests applicatifs passent. Le déploiement public reste sur la version précédente tant que la nouvelle CI n'est pas verte.


### Publication vérifiée du 24 octobre 2026

Code publié : `dfd61b9db1a2cc2c0360c294f320ab98d6892d93`. Le run [40106909635](https://github.com/mbloch-design/toolstack-wizard/actions/runs/40106909635) est terminé avec succès sur ses deux jobs : contrôle général et contrats comptes (66 parcours, build activé, hydratation lente). Les deux branches distantes main et codex/accounts-stack-mvp ont rejoint ce commit par avance rapide, sans push forcé. Le doublon de recherche de l'accueil a été retiré ; quatre parcours FR/EN mobile/ordinateur contrôlent son absence et l'ouverture du dialogue partagé, en plus du parcours de préférence de navigation. Tests locaux : 901 applicatifs, six répétitions de récupération/refus de lien expiré, cinq parcours de shell, types et design tokens passent.

Le déploiement Production préparé sans domaine `dpl_9s7cQjkj5wv2sVCbQWR4VSa4XRyv` a été testé puis promu avec la CLI Vercel 65.2.0, équipe mbloch-designs-projects, projet toolstack-wizard. Attribution de `tooltrim.com` à cet identifiant revérifiée. Artefact : 845,8 Mio au total, 731,6 Mio HTML ; budgets inchangés respectés. Les builds automatiques en doublon ou remplacés ont été annulés, en conservant le déploiement antérieur pour retour arrière.

Huit sondes réelles réussissent sur ce build puis sur le domaine public : connexion par mot de passe du seul compte jetable, refus anonyme, lecture authentifiée, sauvegarde et relecture outil/formule/métier/tarif/usage, conflit de version refusé, accès administrateur refusé au compte ordinaire, session révoquée refusée. Accueils FR/EN HTTP 200 ; quatre routes callback/récupération HTTP 200 et noindex ; profil et back-office anonymes HTTP 401. Rendu et ouverture de l'unique recherche vérifiés dans le navigateur public.

Recette e-mails sur un second compte jetable : confirmation reçue en boîte principale avec SPF/DKIM/DMARC valides et adresse confirmée côté Auth. La navigation initiale de recette a consommé le lien ; son rejeu renvoyait otp_expired, sans modification du code. Les liens suivants ont été vérifiés une seule fois par HTTP, puis leur retour public chargé dans le navigateur. Formulaire réel de récupération disponible, conservé après rechargement, aucun jeton dans l'adresse ; changement du mot de passe et révocation des autres sessions vérifiés via le SDK réel. Un lien de connexion reçu revient effectivement sur `/fr/ma-stack`, avec compte et onboarding visibles. Les rejeux de récupération et connexion sont refusés. Les deux comptes jetables ont été révoqués, supprimés et leur absence vérifiée ; fichiers de nouveaux identifiants et liens supprimés. Aucun compte propriétaire ni stack existante modifié.

Ce compte rendu documentaire est enregistré après les vérifications, sans changement de code ni nouveau build. Aucune migration supplémentaire, aucun changement de droit SQL et aucun fournisseur OAuth supplémentaire activé lors de cette publication.
