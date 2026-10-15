# R11 — Indexabilité et observation Google, 15 octobre 2026

Le contrôle technique a identifié puis corrigé deux défauts concrets : les chemins absents recevaient un HTTP 200 avec l’accueil anglais, et sept guides traduits en anglais, déjà générés et déclarés au sitemap, étaient encore redirigés vers le français. L’accès Search Console existant a permis d’observer l’indexation réelle ; aucune demande de connexion ni modification distante n’a été nécessaire.

Ce rapport distingue l’état public mesuré avant livraison et le correctif local. Une recette HTTP du déploiement reste nécessaire pour certifier le statut CDN après publication. Les chiffres Google sont datés et ne prouvent aucun gain dû à ce lot.

## Défauts corrigés

### Réponse accueil sur chemins inconnus

Les réponses publiques `/fr/r11-route-inexistante` et `/fr/tool/r11-inexistant` étaient 200, avec canonical `https://tooltrim.com/en`, titre et H1 de l’accueil anglais. `/en/search` recevait le même document avant montage React. Cause : deux rewrites globaux `/:lang/:path*` vers `index.html`, document enrichi avec le prérendu de l’accueil.

Les chemins de contenu qui n’ont pas de fichier généré ne disposent plus de ce fallback ; ils aboutissent à `404.html`. Vercel documente la priorité du filesystem sur les rewrites et l’usage automatique de `404.html` pour une route statique absente : [configuration officielle](https://vercel.com/docs/project-configuration/vercel-json), [404 statique](https://vercel.com/kb/guide/custom-404-page). Le fichier 404 porte désormais une seule directive `noindex, follow`, au lieu du doublon `index, follow` et `noindex, follow` hérité du template.

Les véritables routes client (`search`, `back-office`, retour non localisé `/submit`, familles `plugins/libraries/mcp` et comparaisons personnalisées non prérendues) gardent un shell distinct : racine vide à monter, `noindex, follow`, sans canonical ni hreflang d’accueil. Les paramètres restent transmis aux pages existantes ; les chemins canoniques du sitemap conservent leurs fichiers.

Les aliases panier/cart/v2/outils sont préservés par redirections serveur. Les correspondances de guides entre langues et l’ancien slug `clearbit` disposent des redirections exactes manquantes ; aucune nouvelle route de contenu ni fiche n’est créée.

**Limite précise des hôtes :** leur éligibilité est actuellement calculée par `HostPage` à l’exécution, avec repli vers la fiche ou le catalogue. Ils restent hors sitemap et sans prérendu ; leur réponse initiale est 200/noindex, y compris pour un hôte inconnu, puis React conserve le comportement existant. Une page hôte éligible enlève noindex via son `setSeoTags` existant. Les comparaisons personnalisées hors liste éditoriale conservent aussi leur 200/noindex et leur éventuel état applicatif introuvable, conformément à `ComparePage`. Le lot supprime leur faux signal d’accueil ; il ne certifie pas un statut 404 serveur pour chaque slug de ces trois familles. Leur prérendu éventuel est une dette distincte, sans création de manifeste catalogue dans ce lot.

### Sept traductions masquées par des redirects obsolètes

La nouvelle gate croise le sitemap avec les règles serveur. Elle a échoué sur sept URLs EN : `meilleurs-outils-ia-freelances-2026`, `claude-opus-4-6-guide-complet-freelances`, `alternatives-gratuites-notion-freelance-2026`, `stack-minimaliste-freelance-2026`, `stripe-freelance-tarifs-alternatives`, `perplexity-vs-chatgpt-recherche`, `notion-gratuit-vs-payant-vrai-calcul`.

Les sources `posts-en.json` contiennent bien les sept traductions anglaises (environ 4 400 à 18 100 caractères de contenu chacune), le prérendu, les canonicals et les hreflang les exposent déjà. Les règles Vercel EN→FR étaient restées après la réduction de `GUIDE_FR_ONLY_SLUGS`. Retrait de ces sept règles, sans suppression de page, déclassement noindex ni modification du contenu. La seule redirection de guide réellement français seul reste conservée.

## Mesures techniques

[Preuves détaillées](proofs/r11-indexation-2026-10-15/) : audit reproductible, résultats JSON, contrats rouge/vert et observations GSC.

| Contrôle mesuré | Résultat et portée |
|---|---|
| Généré — sitemap complet | 13 148 URLs uniques ; HTML substantiel, canonical unique autoréférente, indexables, titre/description/H1/lang présents, cibles hreflang présentes et réciproques |
| JSON-LD initial | 43 328 blocs JSON parsés, aucune erreur de syntaxe ; ce contrôle ne vaut pas certification Rich Results de chaque donnée métier |
| Explorer | 2 480 pages : titre distinct, canonical, H1 unique, texte SSR et liens associés explorables |
| Hors sitemap | 14 pages explicitement noindex ; pages juridiques, Ma Stack et aliases prérendus restent traités selon la politique existante |
| Robots public | HTTP 200 ; `/api/` bloqué, pages et variantes explorables ; stratégie GEO existante conservée |
| Sitemap public | HTTP 200, 13 148 URLs ; même empreinte SHA-256 que le sitemap local au premier relevé |
| Public par famille | 30 réponses : accueil, listings, fiche, prix, avis, alternatives, Explorer, guides, catégories, Ma Stack, recherche, confidentialité et variantes ; détails dans `public-audit.json` |
| Contrats routing avant build | 5 tests purs de configuration, sans dépendance à dist ; preuve d’échec avant correction conservée |
| Gate après build | 13 148 URLs sitemap non interceptées, 130 cas dérivés des routes explicites App FR/EN, chaînes de redirections jusqu’à un fichier ou shell ; directives des shells et chemins inconnus contrôlés |

Les deux descriptions du guide rédaction du premier lot sont encore vides dans le public du premier relevé, et remplies localement : leur publication n’est pas prétendue acquise. Les métriques Core Web Vitals, le classement et l’indexation de chaque URL du site ne sont pas déduits du build.

## Observation réelle Search Console

Données relevées dans la session Chrome déjà connectée ; détails, URLs de rapports et dates dans [la transcription](proofs/r11-indexation-2026-10-15/search-console-observations.md).

- Couverture « Toutes les pages connues », **mise à jour du 9 octobre 2026** : environ **13,3 k dans l’index**, **10 k non indexées**, 11 motifs. Ce sont des compteurs arrondis historiques, pas un recensement courant des seules 13 148 URLs canoniques.
- Sitemap : **succès**, dernière lecture **15 octobre 2026**, **13 148 pages découvertes**. Découverte et indexation sont deux états distincts.
- Les guides rédaction FR et EN sont déclarés **indexés**, canonical Google identique à l’URL inspectée ; dernières explorations respectives les **17 et 25 juillet 2026**.
- `/en/explorer/around/notion` est déclarée **indexée**, canonical Google identique ; dernière exploration **29 août 2026**.
- Les exemples du motif robots concernent l’ancienne famille `/selector?from=...`, explorée début septembre. Le robots actuel l’autorise et cette famille est redirigée vers Ma Stack. Aucun assouplissement supplémentaire de robots n’est justifié par ces seules lignes historiques.

Aucune demande d’indexation, soumission de sitemap, validation de correction ou écriture Search Console n’a été effectuée. Les dates anciennes des inspections empêchent d’attribuer ces états aux changements du présent lot.

## Périmètre de clôture

La conformité technique des URLs indexables et l’observation GSC disposent maintenant de preuves ; les défauts de routing établis sont corrigés localement et couverts par une gate de build. La persistance des exclusions historiques dans Search Console ne sera pas présentée comme une anomalie corrigée tant que Google ne les aura pas réexplorées. Les garanties de classement, de réexploration immédiate et de couverture exhaustive de l’index Google restent hors des conclusions.


### État 404 après hydratation

La recette sur l’artefact a révélé que les routes dynamiques pouvaient remonter une page outil/guide/Explorer sur une réponse HTTP 404 ; Explorer retirait alors noindex. Le template 404 marque désormais son état avec `tooltrim-http-status`, lu au démarrage du routeur. Le chemin initial en échec monte l’écran introuvable existant ; la mise à jour automatique des canonicals n’y réintroduit ni canonical ni hreflang. Les autres chemins conservent le routeur existant et le retour à l’accueil retire le noindex d’erreur. Tests rouges puis verts du bootstrap, et recette HTTP + navigateur sur quatre familles d’URL inconnues, y compris le retour à une page valide. Ce mécanisme n’ajoute pas de script inline.

La recette R11 médias/routing est intégrée à la CI via `playwright.r11.config.ts`, sur les fichiers générés et la simulation explicite des règles Vercel. Elle ne prétend pas contrôler le CDN publié avant déploiement.
