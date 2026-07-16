# Migration du catalogue outils — Supabase comme source unique

> Architecture cible pour supprimer les fichiers JSON éditoriaux sans perdre le prerender, le SEO, le GEO ni la résilience du build.

## Décision

Oui, tout le catalogue outils peut vivre dans Supabase.

La cible n’est pas de charger les fiches depuis Supabase uniquement après l’ouverture de la page. La cible est :

```text
collecte → tables de recherche → revue éditoriale → vue publiée Supabase
                                                ↓
                                      snapshot de build généré
                                                ↓
                           sitemap + prerender HTML + hydratation React
```

Le snapshot de build peut être sérialisé temporairement en cache ou gardé en mémoire. Il n’est ni édité manuellement, ni versionné comme source de vérité. Il est l’équivalent d’un artefact compilé.

## Pourquoi l’ancienne migration pouvait casser le SEO

Le dépôt actuel protège le SEO grâce à plusieurs mécanismes liés aux JSON :

1. `vite.config.ts` lit `src/data/tools_v4.json`, récupère Supabase puis fusionne les deux sources pour le sitemap et le prerender.
2. En cas d’échec Supabase, le build retombe silencieusement sur le JSON.
3. `useToolSummaries()` démarre avec `tools_index.json`, ce qui permet aux listings de rendre du contenu avant la requête réseau.
4. `useToolBySlug()` reçoit, pour les pages pré-rendues, la fiche injectée dans `__SSR_TOOL__` puis hydrate exactement le même HTML.
5. Le diagnostic et plusieurs tests importent directement `tools_v4.json`.

Si `tools_v4.json` est supprimé immédiatement :

- le build sitemap/prerender n’a plus sa source initiale ;
- une panne ou une règle RLS peut produire zéro fiche ;
- les listings peuvent démarrer vides ;
- le diagnostic perd son catalogue de secours ;
- les tests qui importent le JSON échouent ;
- un HTML vide rempli seulement après `useEffect` devient beaucoup moins fiable pour les moteurs et les extracteurs GEO.

## Principe SEO non négociable

Pour toute route indexable, les éléments suivants doivent être présents dans le HTML retourné avant JavaScript :

- contenu principal de la fiche ;
- H1 et sections propres à l’intention ;
- title, description et canonical ;
- données tarifaires publiées ;
- liens internes principaux ;
- JSON-LD correspondant au contenu visible.

La requête Supabase de build doit donc avoir lieu avant le prerender. Le navigateur peut utiliser Supabase pour les navigations ultérieures, mais pas comme unique moyen d’obtenir le contenu initial indexable.

## Architecture de données recommandée

### 1. `tools`

Record publié et consommable par le produit. Conserver les champs actuels pendant la migration pour éviter une refonte simultanée de toute l’application.

Ajouter au minimum :

- `content_status`: `draft | review | published | stale | archived` ;
- `editorially_reviewed_at` ;
- `published_at` ;
- `content_version` ;
- `research_status` ;
- `next_review_at` ;
- `updated_at` géré côté base.

### 2. `tool_sources`

Une ligne par source consultée :

- `id`, `tool_id`, `url`, `domain` ;
- `source_type`: pricing, docs, changelog, security, integration, independent ;
- `source_tier`: 1, 2 ou 3 ;
- `accessed_at`, `http_status`, `title` ;
- `content_hash` pour détecter un changement ;
- `is_official`, `is_accessible` ;
- `notes`, sans copie longue de contenu protégé.

### 3. `tool_claims`

Une ligne par affirmation exploitable :

- `id`, `tool_id`, `claim_key` ;
- `value_json` ;
- `source_id` ;
- `confidence`: low, medium, high ;
- `volatility`: low, medium, high ;
- `valid_from`, `verified_at`, `expires_at` ;
- `status`: observed, conflicted, approved, rejected, superseded ;
- `evidence_note` courte ;
- `research_run_id`.

### 4. `tool_research_runs`

Journal de chaque passe :

- outil, date, agent, mode et version du collecteur ;
- URLs tentées, erreurs et conflits ;
- nombre de claims créés ou modifiés ;
- statut de revue ;
- résumé du diff proposé.

### 5. `tool_editorial_revisions`

Historique de publication et rollback :

- `tool_id`, `content_version` ;
- snapshot des champs publiés ;
- auteur/relecteur ;
- motif de modification ;
- date de publication ;
- hash du contenu.

### 6. Pricing normalisé — phase ultérieure

Le JSONB `pricing_v5` peut rester pendant la première migration. À terme, des tables `tool_pricing_plans` et `tool_pricing_limits` facilitent les comparaisons, l’historique et les calculs du diagnostic.

Ne normaliser le pricing qu’après avoir figé : plan de référence, période, devise, par-siège versus workspace, minimum de sièges et équivalent annuel.

## Vues de publication

Créer des vues stables plutôt que laisser chaque client reconstruire le modèle :

### `published_tools`

- uniquement `content_status = 'published'` ;
- une ligne par slug ;
- champs déjà nommés selon le contrat consommé par l’application ;
- aucune note de recherche privée ;
- prix et version éditoriale actuellement approuvés.

### `published_tool_summaries`

Projection légère pour homepage, recherche, catégories, stacks et alternatives.

### `published_tool_build_manifest`

Projection minimale pour le build : slug, langue disponible, catégorie, `updated_at`, statut et version. Elle sert au sitemap et au contrôle de couverture.

Les vues publiques doivent fonctionner avec la clé anonyme et une RLS en lecture seule. Les tables de recherche, de claims et de révisions restent privées.

## Pipeline de collecte cible

```text
1. Le collecteur ouvre les sources autorisées.
2. Il écrit un `tool_research_run` et des claims observés.
3. Un validateur détecte conflits, fraîcheur et champs manquants.
4. Une revue éditoriale approuve ou rejette les claims.
5. Un compilateur prépare un diff du record `tools`.
6. La publication crée une révision puis met à jour `tools`.
7. Un webhook déclenche un nouveau build ou une revalidation contrôlée.
8. Le build lit `published_tools`, pré-rend et déploie.
```

Le scraper ne doit jamais écrire directement dans `tools`.

## Snapshot de build

### Rôle

Une seule récupération paginée de `published_tools` alimente pendant le build :

- sitemap ;
- pages outil principales ;
- sous-pages Prix, Alternatives, Avis et FAQ ;
- pages catégories ;
- comparatifs ;
- données injectées pour l’hydratation ;
- index léger utilisé par les composants serveur.

Tous ces rendus doivent utiliser le même snapshot et le même mapper. Cela évite qu’un prix diffère entre sitemap, metadata, HTML et JSON-LD.

### Forme

Options acceptables :

1. snapshot gardé en mémoire dans le processus de build ;
2. fichier temporaire sous `.cache/tooltrim/catalog.json`, ignoré par Git ;
3. artefact CI téléchargé puis supprimé après le build.

Ce fichier généré n’est pas un retour à une source JSON éditoriale. Il est comparable à `dist/` : reproductible et non édité.

### Comportement en cas d’échec

Après suppression du JSON versionné, le build ne doit pas publier un site vide.

Il doit échouer si :

- Supabase est inaccessible ;
- zéro outil est retourné ;
- le nombre d’outils chute au-delà d’un seuil explicite ;
- des slugs publiés sont dupliqués ;
- une fiche prioritaire manque ;
- des champs SEO indispensables sont invalides.

La disponibilité du site existant est assurée par le dernier déploiement réussi, pas par un nouveau déploiement incomplet.

Un snapshot « last known good » peut être conservé comme artefact de rollback, avec date et version visibles. Il ne doit jamais masquer silencieusement une panne de données pendant un nouveau build.

## Accès, secrets et RLS

- Le navigateur utilise seulement la clé anonyme et les vues publiées.
- Les migrations, recherches et publications utilisent une clé serveur en CI ou environnement local sécurisé.
- Aucune clé service role dans `vite.config.ts`, le bundle ou un fichier versionné.
- Le build peut utiliser une clé de lecture dédiée ou la vue publique si toutes les données sont publiables.
- Les tables de recherche ne doivent jamais être lisibles anonymement.
- Toute mutation doit enregistrer l’auteur, le run et la version.

## Plan de migration sans coupure

### Phase 0 — figer les invariants

- inventorier tous les imports de `tools_v4.json`, `tools_index.json` et `categories_index.json` ;
- définir les champs obligatoires par usage : fiche, listing, diagnostic, comparatif ;
- créer un test de parité JSON/Supabase ;
- mesurer le nombre de fiches, slugs, catégories et relations.

**Gate :** aucun champ présent uniquement dans le JSON sans décision explicite.

### Phase 1 — rendre Supabase complet

- aligner le schéma `tools` et le type `Tool` ;
- compléter le mapping snake_case/camelCase unique ;
- importer les valeurs manquantes du JSON par lots et en dry-run ;
- vérifier par slug que Supabase restitue le même contenu publié.

**Gate :** 100 % des fiches publiées et des champs critiques sont présents dans Supabase.

### Phase 2 — ajouter recherche, claims et révisions

- créer les migrations SQL ;
- ajouter les RLS ;
- migrer les dossiers de recherche vers les tables privées ;
- brancher le workflow de revue et publication.

**Gate :** aucun scraper n’écrit directement dans `tools`.

### Phase 3 — remplacer le build fusionné

- extraire `getMergedTools()` de `vite.config.ts` vers un loader serveur testé ;
- récupérer uniquement `published_tools` ;
- paginer et valider la réponse ;
- alimenter sitemap et prerender avec le même snapshot ;
- supprimer le fallback silencieux vers `tools_v4.json`.

**Gate :** une indisponibilité Supabase fait échouer le build, tandis que le dernier déploiement reste en ligne.

### Phase 4 — remplacer les fallbacks client

- `useToolBySlug()` : SSR injecté pour le premier rendu, requête ciblée pour une navigation SPA ;
- `useToolPair()` : requête ciblée ou données du snapshot serveur ;
- `useToolSummaries()` : vue légère, donnée SSR ou cache applicatif ;
- `useTools()` : réserver le catalogue complet aux pages qui en ont réellement besoin ;
- `useDiagnosticData()` : charger la vue dédiée au diagnostic, pas le JSON complet.

**Gate :** aucune page indexable ne commence vide et aucun téléchargement de catalogue complet n’est imposé à une fiche.

### Phase 5 — migrer tests et outils internes

- remplacer les imports JSON des tests par des fixtures minimales ou un snapshot généré ;
- ajouter des tests contractuels sur le mapper Supabase ;
- créer un dataset de test stable pour le diagnostic ;
- vérifier que les scripts de classification ne mutent pas la production.

**Gate :** les tests ne dépendent plus du catalogue de production versionné.

### Phase 6 — supprimer les JSON outils

Supprimer seulement après validation des phases précédentes :

- `src/data/tools_v4.json` ;
- `src/data/tools_index.json` ;
- loaders et chunks associés ;
- scripts de synchronisation devenus obsolètes.

`categories_index.json`, les posts et les autres datasets font l’objet de migrations distinctes. Ne pas élargir silencieusement le scope.

**Gate final :** recherche repository sans import du catalogue JSON, build complet, prerender vérifié et rollback documenté.

## Tests anti-régression SEO

Avant et après chaque phase, vérifier un échantillon de fiches : outil gratuit, freemium, par-siège, sur devis, plugin et outil sans alternative.

Pour chaque route principale et sous-page :

- HTTP 200 ;
- contenu significatif sans exécuter JavaScript ;
- title, description, canonical et H1 spécifiques ;
- prix cohérent entre texte, metadata, FAQ et JSON-LD ;
- aucun loader comme contenu principal ;
- hydratation sans remplacement de la fiche ;
- même intention avec ou sans slash final ;
- sitemap contenant seulement les slugs publiés ;
- date `lastmod` dérivée de la révision publiée, pas de la date du build ;
- page supprimée en 404/410 ou redirigée selon une décision éditoriale.

## Observabilité

Suivre au minimum :

- nombre de fiches publiées au build ;
- temps de récupération Supabase ;
- taux de champs critiques remplis ;
- fiches dont le pricing expire dans 30 jours ;
- conflits de claims ouverts ;
- différence de volume avec le build précédent ;
- nombre de pages pré-rendues ;
- erreurs de mapping et de validation ;
- version du snapshot déployé.

## Rollback

Chaque publication éditoriale doit pouvoir restaurer la révision précédente d’un outil. Chaque déploiement doit conserver :

- l’identifiant du build ;
- la version du schéma ;
- la version du snapshot ;
- le nombre de fiches ;
- les slugs modifiés ;
- le dernier artefact valide.

Le rollback normal est : restaurer la révision Supabase concernée, relancer le build, puis vérifier la fiche. En cas de panne générale, conserver le dernier déploiement réussi plutôt que publier un fallback incomplet.

## Définition de terminé

La migration est terminée lorsque :

- Supabase est l’unique source éditoriale du catalogue outils ;
- aucun humain n’édite un JSON de catalogue ;
- les scrapers écrivent dans un espace de recherche privé et traçable ;
- toute publication crée une révision et peut être annulée ;
- le build obtient un snapshot Supabase validé avant le prerender ;
- le HTML initial contient la fiche complète et ses métadonnées ;
- le diagnostic, les comparatifs, les listings et les tests ne dépendent plus de `tools_v4.json` ;
- une panne Supabase ne peut pas provoquer le déploiement d’un site vide.
