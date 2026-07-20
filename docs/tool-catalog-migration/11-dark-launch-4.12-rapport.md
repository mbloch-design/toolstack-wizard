# Dark launch Supabase — rapport de finalisation rév. 4.12

Date : 2026-07-20. Statut : **dark launch commité et vérifié sur Supabase ; aucun consommateur basculé**.

## Résultat

- Suite RESEARCH : **164/164** tests verts, sans réseau.
- PostgreSQL local : **17.10** via Postgres.app notarisé, avec privilèges Supabase reproduits dans un cluster temporaire.
- PostgreSQL Supabase : **17.6** ; preflight en lecture seule vert avant migration.
- Migration 4.12 en ligne : **COMMIT réel réussi** (`DARK_LAUNCH_4_12_COMMITTED`, puis `DARK_LAUNCH_4_12_ONLINE_SUCCESS`).
- État post-COMMIT : 1 126 outils, projection 2 252 lignes, 593 imports marqués, 1 126 outils `published/legacy`.
- Wix : 4 observations `observed/reference_fr`, 2 attestations dont 1 active, 2 événements de revue et **0 prix approuvé**.
- Resolver canonique Wix : une ligne `needs_review`, montant comparatif `null`. La projection publique reste volontairement sur le contrat `legacy` tant que la bascule canonique n'est pas autorisée : `price_status=legacy`, prix natif `null` et ancienne conversion EUR explicitement marquée `compare_eur_is_legacy_conversion=true`.
- Rôles : projection lisible sous `anon` et `authenticated` ; `catalog_private` refusé aux deux rôles.
- `catalog_owner` : `NOLOGIN`, sans `BYPASSRLS` ; vue publique propriétaire `catalog_owner` avec `security_barrier=true`.
- La projection diagnostic est absente et les accès directs existants à `public.tools` sont conservés pendant le dark launch.
- Parité `legacy_is_free` : 589 vrais / 537 faux sur 1 126 outils.
- Rollback 4.12 : testé avec **COMMIT réel en local**, état initial de 533 outils et droits restaurés.

## Corrections intégrées pendant la finalisation

1. Les 533 lignes existantes ne portent plus le marqueur `import_batch` ; seules les 593 insertions sont supprimables par provenance.
2. L'autorité legacy des 533 lignes est leur état SQL pré-migration ; l'autorité des 593 absentes reste `tools_v4.json`.
3. La parité reconstruit et compare les 52 colonnes typées sur les 1 126 slugs.
4. La reconstruction JSON est fractionnée pour respecter la limite PostgreSQL de 100 arguments par fonction.
5. Le preflight vérifie le fingerprint SQL, notamment `pricing=jsonb`, la cardinalité 533, l'ensemble des slugs, RLS, ownership et capacité `CREATE ROLE`.
6. Migration et rollback committent automatiquement seulement après leurs gates ; aucune transaction n'attend une décision humaine.
7. Le rollback restaure conditionnellement le grant `service_role`, puis compare les grants et policies au snapshot pré-migration.
8. Le runner en ligne exige un consentement littéral, un backup présent et une référence de restauration ; il vérifie tous les hashes avant connexion.
9. En cas d'échec détecté après COMMIT, le runner lance automatiquement le rollback 4.12 ; avant COMMIT, PostgreSQL annule la transaction à la fermeture.
10. Le schéma réel comporte neuf colonnes legacy `varchar` et `time_gained_hours_per_month integer` ; leur fingerprint exact est désormais vérifié.
11. `logo` et `team_relevance` sont élargies en `text` avant l'import afin de conserver sans troncature 216 logos et 71 valeurs de pertinence longues ; le rollback restaure les types initiaux après suppression des 593 lignes.
12. Pour 61 outils, 11 catégories JSON ne correspondent pas encore à `public.categories` : la catégorie brute reste dans `legacy_payload` et la colonne typée est volontairement `null` jusqu'au mapping éditorial.
13. L'autorité SQL des 533 outils diffère du manifeste uniquement pour `gamma` et `unbounce` ; les deux écarts s'annulent dans le total 589/537 et sont contrôlés explicitement.
14. PostgreSQL 17 exige une appartenance explicite avec droit `SET` pour que l'acteur de migration puisse utiliser le rôle `catalog_owner` non-superuser ; ce droit est désormais créé et testé sans donner `BYPASSRLS` au propriétaire.

## Artefacts principaux

- `A7-migration-dark-launch.4.12.sql` : `1bad9e0f3d986ee962d1b2b5fb9d6e5e81fddc2d1ca32bc5181f1e2b72ab8309`
- `A7-rollback-dark-launch.4.12.sql` : `f19745dc79c8c4e5c5fc19ad3e1441d0aa8b6e9330061dc6154eea581b4998cd`
- `A2-import-593-legacy.sql` : `729a0399b547b0cedf3cf07c7568276697c6e7a001edb935fdd8f54f3fafe255`
- `A7-online-preflight-readonly.4.12.sql` : `902e50cb37bd889759317e349f3f8bdffc5b143885fdb5b22cfc11ba6e4d64e4`
- `A7-bundle-lock.4.12.sha256` : `3f7c0982a8091e74e4b864074186e45131e7a06a1f08d5f3f8f9dbd15b61a185`
- `scripts/run-darklaunch-4.12.sh` : `73299ba6f4ef6e55d99d3bbbdd745dcb0c3392f1970cc4ac7bb72b55c0ee643e`
- `scripts/test-darklaunch-pg16.4.12.sh` : `26b3612db6a7766fa6cd4098b9080a25ca5aa8d25ce39609fbc9f867804bf02e`
- `A8-fix-verdict-json-null.4.13.sql` : `1fabf1edb22fc4d176723bf55826161d3a21b25f5e3511d255d20a1f46856226`
- `A8-rollback-verdict-json-null.4.13.sql` : `bfae97f1088fab17b81d65d9a1d57cdbfb32bb0da83b18460f14ab5b83cd806e`

Le fichier `A7-bundle-lock.4.12.sha256` porte les hashes individuels des douze dépendances SQL exécutées.

## Nettoyage et périmètre

- Le backup pré-migration restauré-testé est conservé hors dépôt dans `/Users/mike/.codex/backups/tooltrim/tooltrim-public-pre-dark-launch-4.12-2026-07-20.dump`.
- Backup : 1 024 007 octets, SHA-256 `8d4cc4b4a8cd2f4e741ecb0c6e403eebf7bea33096b4976607caf40905917e9f` ; restauration locale vérifiée à 533 outils et 18 tables publiques.
- Clusters, sockets, DMG et bundles PostgreSQL temporaires supprimés ; aucun processus ou montage résiduel.
- Aucun scraping, aucune approbation tarifaire et aucune bascule de Fiche/Ma Stack/Explorer/build.
- `src/data/tools_v4.json`, le manifeste et le dossier Wix n'ont pas été modifiés par le rejeu.

## Porte suivante

### Gate Data API constaté après déploiement

Le schéma `catalog_api` a été ajouté à la configuration PostgREST après constat d'un `PGRST106 / HTTP 406`. La configuration effective est désormais `public, graphql_public, catalog_api`, suivie d'un rechargement explicite du schéma PostgREST. `catalog_private` reste hors de la Data API.

Le contrôle reproductible `npm run validate:catalog-dark-launch` vérifie désormais :

- les 1 126 outils toujours lisibles dans `public.tools` ;
- les 2 252 lignes de `catalog_api.published_tool_projection` ;
- Wix en deux langues, encore `legacy`, sans prix natif et avec la conversion historique explicitement signalée ;
- le refus de `catalog_private` par la Data API.

Le gate est levé seulement lorsque les quatre contrôles sont verts. Les droits SQL restent minimaux et `catalog_private` ne doit jamais être ajouté aux schémas exposés.

### Shadow read applicatif

La comparaison `npm run validate:catalog-shadow-read` confronte la projection aux champs effectivement lus dans `public.tools`, sur les deux langues. Elle a détecté 182 verdicts anglais dont `verdict_en` contenait le littéral JSON `null` : `COALESCE` ne déclenchait alors pas le fallback français. La correction additive A8 rév. 4.13 utilise `NULLIF(verdict_en, 'null'::jsonb)` avant le fallback.

Résultat après correction : **1 126 outils, 2 252 lignes, 40 champs comparés par ligne, zéro divergence**. Owner, grants, `security_barrier` et contrat métier de la vue sont inchangés.

L'adaptateur pur `catalogProjectionRowsToTool` est activé pour la Fiche client et les pages Fiche SSR/SEO sous un même drapeau. Ses trois tests unitaires passent. Le build SEO lit les 1 126 lignes Supabase par pagination déterministe, au lieu des 1 000 premières seulement. Le rollback `VITE_CATALOG_PROJECTION_FICHE=false` couvre simultanément le client et le build.

La parité brute reste à zéro divergence sur 40 champs. Les 97 différences d'alternatives sont dérivées et intentionnelles : identifiants canoniques, relations éditoriales approuvées et suppression des cibles inexistantes/non publiées. Toutes les cibles exposées correspondent à un slug publié.

Après ce gate seulement : maintenir le dark launch sans bascule consommateur, surveiller la lecture de la projection, puis préparer la migration réversible d'une première fiche. Le mapping des 11 catégories manquantes, l'approbation Wix et la migration progressive des autres consommateurs restent des portes séparées.
