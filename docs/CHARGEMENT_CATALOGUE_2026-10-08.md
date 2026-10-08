# Chargement catalogue — mesures et prochain lot

Mesuré le 8 octobre 2026 sur https://tooltrim.com, application publiée `34391450cc`. Aucun changement de données, de composant ou de configuration distante dans ce lot.

## Conclusion

Le coût commun observé est **l'index de résumés de 1 348 outils** : environ **334 650 octets transférés par Chromium**, pour **1 520 530 octets de corps décompressé**. Il est téléchargé sur chacun des cinq parcours froids, y compris la fiche Notion déjà prérendue. L'import statique de `tools_index.json` dans `useSupabaseData.ts`, relié au graphe d'entrée, explique ce chargement ; le chunk séparé `data-tool-index` existe déjà. Retirer un simple hint preload ne suffit pas à changer cette dépendance.

Le catalogue complet `tools_v4` n'est téléchargé dans aucun des 34 parcours mesurés. Sur Ma Stack, l'ouverture de l'inspecteur Figma ajoute un seul shard `s33.json`, environ **58 ko transférés / 223 448 octets décodés**. Le découpage actuel remplit donc son rôle. Le prochain gain à étudier se situe dans les résumés communs, avant un nouveau découpage des détails.

## Protocole et limites

- Chromium, contextes jetables, consentement refusé, sélection fictive Figma/Canva/Slack/Notion. Aucun appel d'écriture au backend ; les actions n'ajoutent ni ne retirent d'outil.
- 30 parcours froids : cinq routes/actions × deux profils × trois passages. Quatre passages supplémentaires sur desktop avec cache HTTP disponible dans le même contexte. Ce sont des renavigations : le cache mémoire de la SPA est réinitialisé.
- Desktop 1 440 × 1 000 ; profil mobile 390 × 1 000 avec CPU ×4. Réseau réel sans ralentissement simulé. Ce profil n'est pas un téléphone physique.
- Horloge monotone Node depuis le début de navigation jusqu'à l'assertion d'une interaction réussie. Attente de l'effet de montage avant le clic sur la fiche ; exactement un document par parcours. Les durées incluent réseau, hydratation, attente des locators et interaction automatisée. Elles ne sont ni INP, ni Core Web Vitals, ni un temps isolé de handler.
- Observation bornée à quatre secondes après l'action. Aucune requête catalogue inachevée à la fin des 34 captures. Les images hors écran et les autres actions différées ne sont pas couvertes.
- Octets transférés : `Network.loadingFinished.encodedDataLength` via CDP, avec redirections conservées ; cela inclut la comptabilité réseau de Chromium et diffère de la taille du seul corps compressé. Les sommes `Network.dataReceived.dataLength` et Resource Timing donnent un contrôle des corps décodés. Resource Timing seul peut masquer les tailles cross-origin.
- **Tous les appels Supabase observés échouent avec `ERR_NAME_NOT_RESOLVED` ; une résolution DNS indépendante retourne `ENOTFOUND`.** Le rafraîchissement distant sain reste **non mesuré**. Ces parcours documentent le fonctionnement avec le fallback local. Ils ne prouvent pas une panne pour tous les visiteurs et ne chiffrent pas un gain sur les réponses API. Les tentatives Fetch sont séparées des entrées Other/preflight ; une réponse manquante n'est pas comptée comme une réponse réussie de zéro octet.

Le premier essai de chronométrage a été écarté : un clic avant hydratation pouvait déclencher une seconde navigation et réinitialiser l'horloge navigateur. Les résultats retenus proviennent exclusivement de la sonde corrigée. Une relecture indépendante n'a trouvé aucun défaut bloquant dans cette version ; ses limites sont conservées ci-dessus.

## Résultats froids

Médiane de trois passages, en secondes depuis le début de navigation jusqu'à l'interaction réussie. Le minimum et le maximum rendent visible la variabilité du réseau et de la sonde.

| Parcours | Interaction vérifiée | Desktop médiane [min–max] | Mobile CPU ×4 médiane [min–max] |
|---|---|---|---|
| `/fr/tool/notion` | Onglet Prix actif après montage, sans navigation document | 2,11 [2,08–2,60] | 2,72 [2,70–2,75] |
| `/fr/tools` | Panneau Filtres ouvert | 1,37 [1,18–2,09] | 2,95 [2,91–3,01] |
| `/fr/category/communication` | Panneau Filtres ouvert | 1,37 [1,34–2,51] | 1,86 [1,79–2,00] |
| `/fr/ma-stack`, vide | Résultat de recherche Notion visible | 1,51 [0,83–2,21] | 1,28 [1,13–1,34] |
| `/fr/ma-stack`, enregistrée | Quatre outils présents et inspecteur Figma ouvert | 1,14 [1,03–1,72] | 2,19 [2,01–2,37] |

L'ouverture de l'inspecteur ne signifie pas que son détail complet est déjà résolu à cet instant ; le shard est comptabilisé dans la fenêtre d'observation suivante. Les différences entre profils ne permettent pas d'isoler le coût CPU de l'index. Aucune accélération future n'est annoncée à partir de ces seules durées.

Les quatre passages avec cache transfèrent **zéro octet pour l'index de résumés**. Le shard stable Figma est revalidé, à **98 octets CDP** dans le passage chaud observé. Ce résultat est cohérent avec la politique `cache: no-cache` ; elle ne doit pas être remplacée par un cache immutable sans versionner les URLs stables. Un seul passage chaud par route ne constitue pas une médiane statistique.

**34/34 assertions de parcours passent**, une seule navigation document chacune, zéro erreur applicative `pageerror`, zéro durée négative, sélection enregistrée conservée à l'identique. Cela n'efface pas les échecs réseau Supabase consignés séparément.

## Audit de l'index et coordination catalogue

Le JSON compact de l'index représente **1 520 477 octets**, cohérent avec le module JS décodé mesuré. Les tailles suivantes sont des contributions JSON non compressées, clés incluses : elles ne sont pas des gains réseau garantis.

| Groupe | Contribution actuelle |
|---|---:|
| `pricing` + `pricingEn` | 363 190 octets |
| `shortDescription` + `shortDescriptionEn` | 339 643 octets |
| `ogImageUrl` | 108 984 octets |
| `relevantFor` | 97 752 octets |
| `functional_needs` | 73 597 octets |

Les prix et descriptions bilingues représentent environ **46 %** de l'index compact. Ce constat autorise une étude de projection, **pas une suppression de ces contenus**. Les champs FR peuvent aussi participer aux calculs en EN : le correctif d'hydratation déjà publié doit rester couvert.

La proposition existante `docs/tool-catalog-migration/14-architecture-catalogue-v4-contributions-marques.md` prévoit déjà `catalog_api.tool_summaries` et `catalog_api.tool_details`. Ce lot ne crée ni une seconde base ni une nouvelle fabrique ; les prochaines projections doivent être dérivées du même catalogue publié. Le contrat v4 local reste un travail distinct, sans certification de son déploiement par cet audit.

## Prochain lot recommandé et critères de sortie

1. **Inventorier les consommateurs des champs du résumé**, puis définir une projection minimale pour cartes/recherche et une projection contextuelle pour relations/inspection. `ToolDetailPage` utilise aussi l'index pour alternatives, bundles, plugins, hôtes et relations ; Ma Stack l'utilise pour coûts et recoupements. Aucun champ ne doit être retiré sur sa seule taille.
2. **Tester une projection dérivée dans un canary local**, avec chargement ciblé des compléments nécessaires. Conserver prix natifs attestés, sentinelle prix inconnu, langues, alternatives et relations ; ne pas reconstruire un prix depuis du texte éditorial. Choisir le découpage après cette matrice, sans shard supplémentaire par défaut.
3. **Comparer au même protocole** : baisse mesurée du transfert froid et du corps décodé, absence de régression des interactions, aucun nouveau téléchargement de `tools_v4`, pas de multiplication des appels distants, cache stable après navigation et rechargement.
4. **Avant publication du canary** : parité SSR/client FR/EN, 56 parcours d'hydratation, coûts/relations Ma Stack, persistance des choix, texte/métadonnées/JSON-LD/sitemap conservés, build/types/gates actuels. Obtenir aussi une mesure de réponses Supabase réussies depuis un environnement où le DNS fonctionne ; l'intégration de la nouvelle projection distante dépend de cette vérification.

Le gain mobile sera une mesure avant/après, pas une promesse déduite du nombre d'octets.

Actualisation après inventaire : [matrice des consommateurs et prototype de transport](MATRICE_RESUMES_CATALOGUE_2026-10-08.md) terminés. Les descriptions/prix restent fonctionnels ; le premier candidat filtre uniquement les 109 lignes déjà écartées par le hook. Parité de 1 239 résumés démontrée dans une sonde de données, économie gzip simulée de 4,93 % ; le correctif applicatif et sa recette navigateur restent à réaliser.

## Reproduction et preuves

```bash
node scripts/measure-catalog-loading.mjs
```

Variables facultatives : `CATALOG_MEASURE_BASE`, `CATALOG_MEASURE_OUTPUT`, `CATALOG_MEASURE_REPEATS` (1 à 10, défaut 3). Le script n'est pas ajouté à la CI régulière : ces timings réseau variables sont une recette d'audit, pas un gate de performance.

- Résumé exploitable : `output/tooltrim-catalog-loading-2026-10-08/summary.json`.
- Captures CDP locales complètes : `output/tooltrim-catalog-loading-2026-10-08/measurements.json` ; sans en-têtes, corps de réponses ni paramètres de requêtes. Les tailles, statuts, erreurs et chemins restent inspectables.
- Index source inchangé : SHA-256 `76ee5478cdb73362fff77e6a6cd29d03a94c03fb9a4a97f5167da71672e85c7c`.
- CI publiée précédente : [première exécution réussie, 56/56 en 5 min 28 s](https://github.com/mbloch-design/toolstack-wizard/actions/runs/37782506339), rapport conservé sept jours.

Références de méthode : [CDP Network](https://chromedevtools.github.io/devtools-protocol/tot/Network/) et [Resource Timing transferSize](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/transferSize).
