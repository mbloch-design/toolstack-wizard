# Résumés catalogue — matrice et prototype de transport

Étude du 8 octobre 2026 sur `19909b4673`, après la baseline de [chargement public](CHARGEMENT_CATALOGUE_2026-10-08.md). Objectif : réduire le transfert initial en conservant les sorties visibles, la recherche, les prix, les relations et les choix enregistrés. Cette étude ne modifie pas le produit ou le catalogue source.

## Résultat et choix du premier canary

Les deux groupes volumineux — descriptions bilingues et prix — ont des consommateurs fonctionnels. Les retirer du résumé commun nécessiterait une migration coordonnée des consommateurs ; ce n'est pas une suppression de champs sans effet.

Un premier candidat limité existe : **filtrer avant transport les entrées que `useToolSummaries` exclut déjà à l'exécution**. Le prototype conserve tous les champs de chaque ligne restante et l'ordre actuel : 1 348 lignes transportées aujourd'hui, 1 239 lignes effectivement exposées par le hook, soit **109 lignes déjà invisibles**. Le catalogue complet, ses outils/alias et leurs routes ne sont pas supprimés.

Le prototype exécute le véritable mapper extrait de `useSupabaseData.ts`, pas un mapper réécrit pour la démonstration. Ses deux sorties sont identiques octet pour octet : SHA-256 `d7e71165c4c8e0eec99b4228789e2a4e82e45cadbf1ea41da811a95f6f4a1bde`. C'est une preuve de parité des données exposées ; aucune recette navigateur de ce candidat n'est déclarée réalisée.

## Matrice des consommateurs

Les lignes ci-dessous incluent les lectures transitives des helpers, et pas seulement les propriétés présentes dans les types des composants. Une propriété non lue par une carte peut être indispensable à son filtre, à sa recherche ou à un autre écran.

| Groupe de champs | Consommateurs et rôle | Décision pour le canary |
|---|---|---|
| `id`, `slug`, `name` | Liens/cartes/recherche ; pins acceptant ID ou slug, coûts dédupliqués par ID, décisions indexées par slug ; relations parfois par nom. `CartPage:43–54`, `stackView:64–80`, `SearchModal:101–112` | Garder identités et ordre, aucune nouvelle normalisation. |
| `categoryId` | Labels, catégories, classification, facettes, voisinage. `ToolsPage:119–139`, `CategoryPage:47`, `stackUsage:47–75` | Garder. |
| `shortDescription`, `shortDescriptionEn` | Copie compact/decision/Explorer ; recherche bilingue même sur une route FR ; classification lit les deux, thèmes Explorer utilisent aussi le FR. `toolPresentation:30–32`, `useCatalogSearch:98–132`, `stackAutoClassification:71–93`, `toolExploration:101–116` | Garder les deux ; un index par langue seul ferait perdre des dépendances. |
| `pricing` | Labels free/trial/freemium, devis/licence à vie, filtres, prix stack et corpus de recherche récursivement aplati. `pricing:12–31`, `toolPresentation:33–57`, `catalogFilters:15–29`, `stackView:49–60`, `useCatalogSearch:103–125` | Garder l'objet entier ; montant numérique insuffisant. |
| `pricingEn` | Sortie du mapper et fallback de rafraîchissement distant (`useSupabaseData:272,562`) ; divers helpers de prix bilingues lisent ce champ sur des Tool complets. Lecture directe non établie pour tous les consommateurs de résumés audités | Garder le contrat ; aucune suppression sur cette seule absence de lecture directe. |
| `defaultMonthlyPrice` | Cartes/presentation, relations plugins et helpers historiques. Ne remplace pas le prix natif utilisé par le budget Ma Stack. `toolPresentation:34–36`, `ToolPluginsBlock:86–107`, `catalogFilters:21–29` | Garder sans changer les fallbacks actuels. |
| `compareMonthlyPrice`, `priceUndisclosed` | Facettes/tri et budgets de stacks éditoriales ; prix non public distinct de gratuit. `catalogFilters:15–29`, `StackDetailPage:680–695`, `stackView:54–56` | Garder les sentinelles et les zéros. |
| `nativePrices` | Montant, devise et période attestés ; prix affiché et budget Ma Stack, annuel divisé par 12, achat unique/devise non gérée hors total. `stackView:25–39`, `stackCost:24–39` | Garder toutes les monnaies/périodes, sans conversion nouvelle. |
| `ogImageUrl`, `logo`, `websiteUrl`, `affiliateLink` | Médias, logo et domaines de fallback ; supprimer les URLs change les logos quand la première source échoue. `ToolCardImage:52–53`, `ToolLogo:37–43`, `toolLogos:286–305,325–338` | Garder. |
| `functional_needs`, `verticals`, `substitution_cluster_v2` | Placement, recoupements, similarité et classement Explorer ; la similarité directe combine besoins et verticals. `stackUsage:47–75,101–121`, `alternativesSimilarity:95–108`, `toolExploration:140–211` | Garder séparés ; aucune fusion des taxonomies. |
| `alternatives`, `freeAlternative`, `betterAlternative` | Relations bidirectionnelles stack : retirer une référence côté candidat peut modifier le recoupement d'un autre outil. `stackUsage:103–121`, `stackView:64–80` | Garder, notamment `betterAlternative.tool`. |
| `host_app`, `bundle_parent`, `tool_type` | Relations hôte/plugin/bundle et premier rendu SSR des bundles. `ToolPluginsBlock:20–66`, `ToolBundleSection:28–54`, `toolExploration:140–211` | Garder ; le bundle SSR ne dépend pas d'un fetch ultérieur. |
| `prescription_quality` | Classement/facettes éditoriales et diversification Explorer. `toolExploration:235–265`, `gen-tools-index:80–81` | Garder. |
| `relevantFor` | Corpus de recherche enrichie. `useCatalogSearch:114` | Garder ; l'absence de lecture dans CartPage ne suffit pas. |
| `personas` | Pages piliers persona filtrant explicitement les codes en majuscules. `PersonaPillarPage:214–219` | Garder casse et valeurs. |
| `substitutable` | Présentation et score legacy des pages piliers. `toolPresentation:59–61`, `toolTrimScore:59`, `PersonaPillarPage:215` | Garder, même si certaines cartes n'affichent pas replaceability. |
| `covers`, `pros`, `prosEn` | Le hook les fournit ; besoins/relations/recherche/score les lisent. Pas de clé émise dans le JSON source actuel : fallbacks vides rétablis par le mapper | Conserver le mapper ; supprimer ces defaults ne réduit pas le transfert actuel. |
| `publishedAt`, `worksWith`, `formFactor` | Contrat de rafraîchissement distant ; `HostPage:57–74` lit worksWith/formFactor. Absents du JSON source actuel | Conserver le contrat distant ; aucun gain local à annoncer sur ces clés. |

Références de table : chemins sous `src/pages`, `src/components`, `src/hooks` ou `src/lib`, aux lignes du snapshot étudié. Les audits cartes/recherche et stack/relations ont été menés indépendamment, puis vérifiés avec les pages piliers, les stacks éditoriales et les consommateurs hors de ces deux groupes.

## Pièges de contrat déjà présents

- Les types étroits des cartes ne décrivent pas toutes les lectures transitives : les helpers logo/prix acceptent aussi des URLs ou objets canonical `pricing_v5`/`pricing_v5En`.
- Le résumé conserve `nativePrices`/`compareMonthlyPrice`, mais ne transmet pas les objets canonical `pricing_v5`/`pricing_v5En`. Certaines cartes utilisent donc le prix normalisé ou des fallbacks CSV, tandis que le budget Ma Stack utilise les prix natifs. Corriger cette différence serait un lot de logique métier distinct.
- `stackPricing.ts` est historique : aucun importeur de production trouvé pendant cet inventaire ; `stackCost.ts` pilote le budget actif. Ne pas déduire le contrat actif du seul helper historique.
- Un résultat de recherche dépend du texte et de son classement, pas seulement du nom affiché. Générer un `searchText` distinct pourrait devenir une évolution ultérieure, avec une recette des résultats/rangs ; ce n'est pas inclus dans ce premier canary.

## Trois approches comparées

| Approche | Effet attendu / risque | Recommandation |
|---|---|---|
| Filtrage transport des lignes déjà exclues | Sorties du mapper identiques ; gain modeste, aucun champ retiré | Premier canary recommandé. |
| Séparer résumés de navigation et compléments contextuels | Potentiel plus grand, mais migration des dépendances SSR, recherche et relations ; doublons de transfert possibles | Lot architectural ultérieur, après preuve du premier canary. |
| Réduire descriptions/prix au résumé affiché ou à la langue courante | Meilleur poids théorique, mais modifie recherche bilingue, free/trial, filtres/classification et parfois rendu | Non retenu dans le canary actuel. |

## Prototype de données local — résultat

Même représentation JS `JSON.parse` pour les deux entrées, compression locale identique. Ce n'est pas le chunk Vite final ni une mesure de transfert CDN.

| Mesure | Index témoin | Candidat | Économie |
|---|---:|---:|---:|
| Module JS décodé | 1 522 327 octets | 1 421 270 octets | 101 057 (6,64 %) |
| gzip niveau 9 | 342 509 | 325 630 | 16 879 (4,93 %) |
| Brotli qualité 5 | 278 204 | 265 850 | 12 354 (4,44 %) |

L'écart avec les 1 520 530 octets du chunk Vite livré vient de l'échappement choisi par la sonde. La comparaison utilise le même format témoin/candidat. Aucun gain de temps d'interaction n'est démontré ; les pourcentages compressés ne sont pas présentés comme un transfert réel déjà économisé en production.

Sonde jetable de données, conservée comme preuve d'audit dans `output/tooltrim-summary-projection-2026-10-08/probe.cjs` ; résultat `projection-probe.json`. `candidate-index.mjs` est généré localement et n'est consommé par aucun import applicatif. Reproduction depuis la racine :

```bash
node output/tooltrim-summary-projection-2026-10-08/probe.cjs
```

La sonde extrait le mapper réel et la liste d'exclusion via l'AST TypeScript, vérifie la parité JSON de toutes les sorties et l'unicité des identités retenues. Tous les fichiers source restent intacts.

## Design concret du premier correctif

Centraliser la liste d'exclusion déjà utilisée par le hook et le prerender, puis générer une projection **uniquement pour le transport navigateur** des résumés. `tools_index.json` complet reste la source utilisée par la fabrique, les générateurs de guides/llms/stacks et les audits ; le catalogue complet et les redirections ne sont pas modifiés. Le hook conserve son filtre défensif, notamment après merge distant.

Le rendu serveur doit recevoir exactement les mêmes résumés visibles qu'aujourd'hui. La projection conserve les 1 239 lignes et tous leurs champs, sans transformation des prix ni migration du stockage. Le développement ne devra pas fabriquer une seconde source éditable ou un index dérivé à maintenir manuellement.

Validation du correctif : génération déterministe, équivalence totale des résumés et absence de suppression source ; build/types/gates, 56 parcours d'hydratation FR/EN ; rendu de catégories/listings/Explorer/pages piliers et Ma Stack (recherche, relations, coûts, choix conservés). Comparer ensuite octets réellement transférés dans le même protocole. Une migration vers la projection API distante reste hors de ce premier correctif ; sa baseline saine est toujours inconnue dans cet environnement DNS.

Le prochain point d'exécution est ce correctif de transport limité. Cette étude termine la matrice et le prototype ; elle ne déclare pas ce correctif développé ou déployé.

## Suite réalisée — 8 octobre 2026

Le design ci-dessus a ensuite été implémenté et vérifié localement : gain réel de 16 858 octets gzip, 56 hydratations et 20 comparaisons de rendu PASS. Les résultats du prototype restent conservés comme historique. [Rapport du correctif](PROJECTION_INDEX_NAVIGATEUR_2026-10-08.md). Publication à réaliser.
