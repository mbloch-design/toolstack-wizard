# Hydratation du HTML généré en CI — 8 octobre 2026

## Périmètre

Le workflow Preprod CI conserve ses contrôles applicatifs, SEO, design, types, Ma Stack et build. Il se déclenche désormais aussi sur les pushes vers main, en plus de preprod/codex et des PR vers main/preprod.

Après le build, Chromium est installé avec ses dépendances Linux, puis npm run test:e2e:hydration lance les 56 scénarios sur le serveur des fichiers réellement générés (8087), sans serveur Vite ni backend distant. Présentation/prix, Alternatives/Avis, FR/EN, sélection vide/enregistrée et rechargement sont couverts.

Le workflow ne reçoit que contents:read. Les suites utilisent des sélections fictives et bloquent Supabase ; aucun secret ou compte utilisateur n'est nécessaire.

## Durée et diagnostic

- Job : plafond 30 minutes, incluant installation/build et recette.
- Suite Playwright : plafond 10 minutes ; le runner peut terminer ses reporters avant l'expiration du job.
- Un worker, au maximum cinq tests définitivement en échec. Les deux retries existants restent activés en CI ; failOnFlakyTests rend néanmoins rouge un test qui ne passe qu'après retry.
- Rapport HTML et test-results conservés sept jours dans l'artefact hydration-report, même après échec de suite. Une annulation/expiration globale du job peut empêcher l'upload ; les rapports n'existent pas si une étape antérieure au navigateur échoue.
- playwright-report est ignoré par Git ; les traces l'étaient déjà. Les configurations Playwright entrent dans le typecheck node.
- reducedMotion est placé dans use.contextOptions, option reconnue par les types/runtime, avec la préférence habituelle no-preference.

## Vérification

Une copie temporaire du payload Notion EN a été altérée pour reproduire une divergence réelle. Le scénario existant a échoué ; rapport HTML et trois traces (essai initial et retries) ont été produits. Le HTML original a été restauré octet pour octet avant la recette complète. Cette sonde reste hors du dépôt et hors du produit.

Recette locale avec CI=1 : 56/56 PASS en 4,8 minutes, rapport HTML produit. 249 tests applicatifs et typecheck app/node PASS ; les deux configurations Playwright sont désormais couvertes. Le réglage contextOptions reproduit la préférence par défaut exercée pendant cette recette. Artefact applicatif validé du lot 863e4737eb réutilisé, aucun changement produit à reconstruire localement. La relecture indépendante ne remplace pas le premier run Actions, dont le résultat et la durée seront communiqués après publication.

Aucun code applicatif, contenu catalogue, CSS ou HTML de production modifié par ce lot. Les catégories locales sont exclues.

Références : [guide CI Playwright](https://playwright.dev/docs/ci-intro), [upload-artifact](https://github.com/actions/upload-artifact).
