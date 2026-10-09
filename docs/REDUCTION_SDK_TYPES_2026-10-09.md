# R1 — Réduction du SDK utilisé pour les types API

**9 octobre 2026 — candidat local validé ; publication et CI distante R1 encore attendues.** R0 est publié sur `main` via `bb4bc7f94b` : sa CI complète est verte, avec sa nouvelle étape API, dans la [CI R0](https://github.com/mbloch-design/toolstack-wizard/actions/runs/37900711727). Le déploiement Vercel R0 est réussi.

## Changement

`@vercel/node` 5.10.2 était une dépendance de développement, consommée uniquement par quatre imports de types : trois handlers et leur fixture HTTP. Ces imports pointent maintenant vers `types/vercel-http.ts`, hors du dossier des fonctions déployables. Le contrat reprend `IncomingMessage` / `ServerResponse` de Node et les champs/méthodes ajoutés par Vercel. Les payloads `any` conservent le contrat existant ; la validation reste celle des handlers.

Les helpers sont fournis par la plateforme, comme décrit dans la [documentation Node Vercel](https://vercel.com/docs/functions/runtimes/node-js#nodejs-helpers). Aucun adaptateur, réglage de déploiement, corps de handler, email ou appel de données n’est modifié.

## Preuves

- Assignabilité des requêtes et réponses dans les deux sens avec les types SDK installés, avant retrait : typecheck réussi ; probe temporaire retiré.
- Après désinstallation et avant remplacement des imports : échec TypeScript attendu sur les quatre modules introuvables ; après remplacement : 82 contrats API et types app/outils/API réussis.
- Installation propre du lockfile : réussie ; 266 tests applicatifs et 23 contrats SEO réussis.
- JavaScript transpillé des trois handlers : strictement identique avant/après. Cela prouve l’effacement du changement de types, pas le packaging distant Vercel.
- Build production réussi : 824,8 MiB, dont 713,2 MiB HTML, sous les budgets 831/716. Les 13 162 HTML, 80 assets JavaScript et sitemap sont identiques octet pour octet au build R0 du même jour.
- Relecture indépendante : aucun défaut identifié dans types/imports/configuration/lockfile.
- Lockfile : 104 entrées retirées, zéro ajout, aucune entrée conservée modifiée hormis la dépendance racine retirée. Ces entrées incluent des variantes de plateforme ; ce n’est pas 104 dépendances directes.

## Gain mesuré et limites

Audit complet : **15 → 9 entrées**, dont **11 → 5 élevées**, quatre modérées inchangées, zéro critique. Vue omit-dev : **7 → 7** (cinq élevées, deux modérées). Avis comptés au niveau des paquets et de leur propagation, sans assimiler leur retrait à six exploits corrigés. Les chaînes restantes concernent Tailwind/globs/parseur de sélecteurs et outils associés.

Aucun gain de poids navigateur, de vitesse utilisateur ni de référencement revendiqué. Le retrait réduit les dépendances de développement ; le runtime Vercel reste géré par la plateforme. GET/OPTIONS des trois API étaient conformes avant le changement (405/204 et CORS localhost) ; aucune requête envoyant un email n’a été utilisée.

L’accès MCP aux détails du déploiement renvoie 403 dans le scope configuré. Le contrôle de livraison utilise donc le statut Vercel associé au commit GitHub et les réponses publiques ; les logs internes du runtime ne sont pas certifiés.

[Preuves du lot](../output/tooltrim-sdk-types-2026-10-09/). Les travaux locaux catégories/catalogue/médias restent exclus.
