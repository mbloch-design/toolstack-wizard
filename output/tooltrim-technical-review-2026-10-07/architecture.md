# ToolTrim — revue architecture frontend / données, 7 octobre 2026

Audit READ-ONLY du checkout `/Users/mike/Documents/New project`. Aucune modification du code, de la base, ni action Git de publication. Les probes sont dans `/private/tmp/tooltrim-architecture-probes.test.ts`, configuration `/private/tmp/tooltrim-arch-vitest.config.mjs`.

État audité : checkout sale avec travaux catalogue parallèles et corrections tarifaires du coordinateur en cours. La production n'a pas été interrogée ; la présence de ces défauts dans la version déployée reste inconnue. Les numéros ci-dessous correspondent au code lu avant les interventions parallèles.

## Constats prioritaires

### 1. P1 — Retour à une comparaison SSR : la mauvaise paire reste active

**Preuve :** `src/hooks/useSupabaseData.ts:429-440, 434-436, 485-487`; fournisseur persistant `src/main.tsx:32-43`; consommateur `src/pages/ComparePage.tsx:2003, 2018-2034` et décisions `src/components/stack/StackCompareDecision.tsx:38-41, 65-70`.

Le state est initialisé depuis `SsrComparePairContext` uniquement au premier montage. Après avoir chargé une autre paire sur la même route dynamique, le retour à la paire initiale vérifie `ssrMatches` et sort immédiatement de l'effet sans remettre les outils SSR dans le state. Le hook retourne alors les outils de l'autre comparaison et `loading:false`. Contrairement à `useToolBySlug`, il n'applique pas de garde de correspondance entre les outils retournés et la route.

**Reproduction contrôlée :** contexte SSR Gamma/Pixlr → rerender Tapstitch/Shade (laisser les shards se charger) → rerender Gamma/Pixlr. Résultat final : `toolA.slug=tapstitch`, `toolB.slug=shade`, `loading=false`. Probe PASS reproduisant l'erreur sur le hook réel.

**Scénario utilisateur :** entrée directe sur une comparaison pré-rendue, navigation SPA vers une autre comparaison puis retour navigateur. Le titre, le contenu générique et les actions « garder / retirer » reçoivent la paire précédente alors que l'URL a retrouvé la paire initiale. L'impact potentiel concerne le retrait d'un autre outil de la stack, ce qui justifie P1.

**Confiance :** élevée, reproduction déterministe en React. Limite : pas de recette navigateur avec un HTML de production. Corriger la restauration SSR et tester aussi le tout premier rendu lors d'un changement de paire.

### 2. P2 — Un cluster de substitution est présenté comme une extension

**Preuve :** `src/lib/toolExploration.ts:148-157, 182-197`.

`getFamilyKey` utilise `substitution_cluster_v2` comme fallback de famille. `getRelation` vérifie `sameFamily` avant `sameCluster`. Pour deux produits ordinaires partageant le cluster, la branche « alternatives » est donc masquée par la branche « extensions ».

**Reproduction sur le catalogue réel :** Notion → Obsidian (`knowledge-workspace`), ChatGPT → Claude (`ai-text-generalist`), Slack → Discord (`team-chat`) produisent tous `direction:"extensions"` et « Extension de [source] ». Probe PASS avec les entrées actuelles de `tools_index.json`.

**Impact :** Explorer promet une relation technique d'extension quand la donnée atteste seulement un groupe de substitution ; le résultat est aussi classé dans le mauvais angle. Le modèle contredit le cap documenté « substituer / étendre / compléter ».

**Confiance :** élevée ; code et données actuelles. Corriger la séparation entre famille d'écosystème et groupe de substitution, en gardant une relation d'hôte explicite prioritaire.

### 3. P2 — Les pages d'hôte peuvent rester entièrement vides après une entrée par fiche SSR

**Preuve :** `src/main.tsx:25-29`, `src/hooks/useSupabaseData.ts:501-509, 573`, `src/pages/HostPage.tsx:58-72, 95-103`.

Le fournisseur SSR de l'outil entoure toute l'application et survit à la navigation SPA. `useToolSummaries` interprète la présence de ce contexte comme « page SSR » même après navigation vers un autre écran et saute le rafraîchissement distant. Le snapshot léger local contient actuellement zéro entrée avec `worksWith` et zéro `formFactor`. `HostPage` exige au moins un `formFactor` et retourne `null` tant que ce modèle n'est pas chargé.

**Scénario :** nouvelle session, entrée directe sur une fiche outil SSR → lien interne vers `/fr/plugins/after-effects` ou autre famille/hôte. Même avec le réseau disponible, le hook ne lance pas sa requête et la page d'hôte reste vide. La même page n'a également aucune sortie visible quand une requête distante échoue et que le fallback ne contient pas ce modèle.

**Probe :** `useToolSummaries` dans `SsrToolContext` retourne plus de 100 outils, `loading:false`, aucun `formFactor`, et zéro appel à `supabase.from`. PASS. Les gardes du consommateur établissent le reste du scénario.

**Confiance :** élevée sur la chaîne déterministe ; pas de rendu navigateur de HostPage. Corriger la portée de l'exemption SSR et fournir un état de fallback explicite si les champs de rattachement restent indisponibles.

### 4. P2 — Une stack absente ou un shard inaccessible laisse une page vide indéfiniment

**Preuve :** `src/hooks/useStackDetailData.ts:30-36, 60-63, 69-72`; `src/pages/StackDetailPage.tsx:661-664`.

Après résolution `null`, le state interne `loading` devient faux. Le hook calcule toutefois `loading || (!!slug && !matchesCurrentSlug)`, ce qui rend de nouveau `loading:true` pour toute absence définitive. Le consommateur affiche un `<main aria-busy>` vide et n'atteint jamais sa redirection prévue.

**Scénarios :** navigation vers `/fr/stacks/slug-inexistant`, ou shard de stack répondant 404 / fetch échoué. La page n'affiche ni erreur, ni redirection, ni moyen de retry.

**Probe :** réponse de shard vide, attente de sa résolution ; résultat permanent `{stack:null,loading:true}`. PASS.

**Confiance :** élevée. L'identité courante doit protéger du rendu précédent sans être assimilée au chargement une fois la tentative terminée.

### 5. P2 — Plans payés et décisions divergent entre onglets, puis s'écrasent

**Preuve :** `src/hooks/useStackPaidPlans.ts:16-36, 51-60`; `src/hooks/useStackDecisions.ts:29-48, 62-65, 72-83`. Contraste utile : `src/hooks/useStackPins.ts:102-119` gère déjà `storage` pour la sélection.

Ces deux stores chargent leur contenu une fois en mémoire et n'écoutent aucun événement `storage`. Les listes d'outils se synchronisent entre onglets, mais les déclarations payantes et les décisions ne suivent pas. Chaque prochaine écriture réécrit l'ensemble du store depuis une copie devenue ancienne.

**Scénario reproductible sans race :** ouvrir Ma stack dans A et B ; B coche « version payante » pour Notion, ou garde une paire ; A conserve son ancien budget / sa paire à revoir. A coche ensuite Figma, ou décide sur une autre paire : sa réécriture supprime du localStorage le choix pris dans B. Un hard reload n'empêche pas la perte puisque la valeur persistée a déjà été écrasée.

**Probes :** store chargé vide, simulation d'une écriture et d'un événement `storage` provenant de B, puis mutation dans A. Le choix de B n'apparaît pas et disparaît de la valeur persistée. Deux probes PASS (plans et décisions).

**Confiance :** élevée. Ajouter invalidation + notification cohérentes pour ces clés ; ne pas se limiter à relire lors du rendu suivant puisque les snapshots `useSyncExternalStore` doivent rester stables entre changements.

### 6. P2 — Un store de décisions JSON valide mais structurellement corrompu bloque Ma stack

**Preuve :** `src/hooks/useStackDecisions.ts:34-42`; `src/components/stack/StackOverlapPairs.tsx:92-93`.

La lecture ne valide que le conteneur objet. Une valeur de décision `null` est acceptée, puis `d.kind` est accédé sans garde dans le rendu des recoupements. Le `try/catch` de lecture ne couvre pas ce rendu ultérieur.

**Scénario :** persistance locale `tooltrim-ma-stack-decisions-v1={"a|b":null}`, puis ouverture d'une stack ayant au moins un outil. Ma stack tombe dans l'ErrorBoundary ; recharger relit la même valeur invalide.

**Probe :** import frais du hook avec ce JSON → objet invalide conservé ; rendu réel du composant `StackOverlapPairs` → `Cannot read properties of null`. PASS.

**Confiance :** élevée sur le comportement, occurrence faible : le code normal actuel ne génère pas `null`. C'est un défaut de récupération après corruption, distinct de la récupération déjà solide du store principal de stack. Valider/filtrer les décisions individuellement ; conserver les entrées valides.

### 7. P2 — Les shards de stacks à noms stables sont cachés comme des assets immuables pendant un an

**Preuve :** `src/hooks/useStackDetailData.ts:19-27` (`fetch` avec `force-cache`), `scripts/emit-stack-catalog-shards.ts:5, 25-27` (noms `${key}.json`), `vercel.json:5-13`.

La règle globale `/assets/((?!tool-catalog/).*)` pose `max-age=31536000, immutable`. Elle exclut le catalogue outils mais inclut `stack-catalog`. Les noms des shards ne changent pas après un changement éditorial.

**Scénario :** un utilisateur consulte une stack via navigation SPA, ferme la session, puis revient après publication d'une correction de budget / outils / contenu. Le navigateur peut servir le même `a.json` pendant un an ; `force-cache` encourage explicitement cette réutilisation. Un nouveau HTML SSR peut montrer une stack à jour en entrée directe alors que la navigation vers une autre stack redevient ancienne.

**Confiance :** élevée sur la configuration et les noms ; les headers effectifs de production n'ont pas été lus. Ajouter la même politique de revalidation que pour les shards outils, ou utiliser des noms versionnés. Aucun besoin d'optimisation globale pour traiter ce problème.

## Couverture et validations

- Lecture des instructions, `docs/ARCHITECTURE.md`, `docs/MA_STACK_ROADMAP.md`, architecture des routes/providers, chargement SSR/client, index léger, projection publique, fallbacks JSON/shards, hooks recherche/catalogue, état local stack, migrations/backup, décisions/plans payants, Explorer et relations.
- Inspection de `useStackAccount` et `stackSync` : **aucun consommateur actif de `useStackAccount` trouvé dans `src`** ; risques ci-dessous classés dette dormante.
- Probes jetables : **7/7 PASS**. Ils sont des reproductions positives de défauts existants, pas des tests d'acceptation montrant que le produit est sain. Réseau / Supabase mockés ; aucune écriture distante.
- `npm run test:ma-stack` : **74 tests historiques PASS** (9 suites). Une nouvelle suite `pricingAudit.test.ts`, créée parallèlement par le coordinateur, échouait encore à la collecte sur `comparisonPricing` en cours d'implémentation lors de l'exécution à 18:08. Ce résultat intermédiaire n'est pas attribué au checkout initial ; le coordinateur doit relancer après ses corrections.
- Aucune build intégrale ni recette UI de production dans cette sous-revue. Les corrections tarifaires et d'identité sont sous responsabilité du coordinateur et ne sont pas dupliquées ici.

## Forces constatées

- Snapshot léger disponible immédiatement ; fiches complètes chargées par shards. Le hook fiche commence la lecture locale et la projection distante en parallèle.
- `useToolBySlug` annule les mises à jour asynchrones après navigation et protège l'identité retournée ; sa restauration SSR est explicitement testée. Ce pattern manque au hook paire.
- Échec de shard outils/stacks : le cache de promesse est purgé pour permettre une nouvelle tentative ; shards outils configurés en revalidation.
- Store principal stack versionné, normalisé, dédupliqué ; backup et migrations, statut dégradé en cas de stockage indisponible ; restauration ciblée après suppression ; écoute entre onglets.
- `stackRelations` ne transforme pas un simple territoire commun en substitution : alternatives explicites et usages précis sont distingués. Les recoupements excluent les signaux éditoriaux trop larges.
- Routes paresseuses, Suspense intérieur au shell, ErrorBoundary global, initialisation monétaire déterministe SSR/client.

## Dette séparée des bugs actifs

1. **Synchronisation de compte dormante.** `useStackAccount` n'est actuellement importé par aucune page/composant. Si réactivé : lecture du snapshot → merge → upsert → `replaceState(merged)` peut perdre des edits locaux faits pendant l'upsert (`src/hooks/useStackAccount.ts:76-102`). Les uploads debouncés peuvent être simultanément en vol et ne portent aucun contrôle de révision (`115-140`). `mergeToolCartStates` est une union sans tombstones (`src/lib/stackSync.ts:3-16`) : un retrait sur un appareil ne peut pas se propager fidèlement lors d'un merge avec une copie ancienne. Recette multi-appareils et conflits nécessaires avant activation ; aucun incident actuel affirmé.
2. **Sources hybrides assumées.** Fiche = projection publique puis table legacy puis snapshot ; comparaisons = table legacy puis snapshot ; liste = table legacy + snapshot. Une publication canonique peut donc être visible sur la fiche avant les comparaisons/listes. Ce décalage est une limite documentée de migration, pas une preuve de données fautives ni une invitation à supprimer le fallback.
3. **Exemption SSR trop globale.** Même hors HostPage, un onglet initialisé depuis une fiche conserve la liste locale pour d'autres routes parce que le contexte persiste. Les données ne sont pas réabonnées quand un cache de module se remplit depuis un autre consommateur. Aucun problème supplémentaire d'édition/production n'est inventé au-delà du parcours HostPage démontré.
4. **Documentation historique.** ARCHITECTURE référence encore `useTools()` alors que son retrait est documenté dans le hook ; roadmap mêle les caps de juillet et octobre et annonce un compte implémenté malgré l'absence de consommateur actif. Aligner ces notes après arbitrage produit, sans refactorisation structurelle pendant cet audit.

## Mémoire consultée

La mémoire a servi uniquement à repérer les surfaces historiques Ma stack, le cap local-first et l'usage summaries/detail. Tous les constats sont fondés sur le checkout actuel et les probes, pas sur les anciens nombres de tests ni les anciens commits. Référence de contexte : `MEMORY.md:38-48`, rollout `01a10b41-1d01-71e2-9faa-267e02627e63`.

## Intervention ciblée autorisée après revue — P1 corrigé localement

Le coordinateur a délégué la correction du constat 1 uniquement. `useToolPair` restaure désormais sa paire SSR dans le state et la renvoie immédiatement au retour, et masque tout outil dont la paire ne correspond pas à la route. L'annulation des requêtes précédentes est conservée. Test permanent `src/hooks/useToolPair.test.tsx` : trois scénarios de navigation/réponse retardée, tous rouges avant correction et verts après. Exécution conjointe avec `useToolBySlug.test.tsx` : **5/5 PASS**. Pas de publication.

`tsc --noEmit` réussit mais n'analyse pas `src` dans cette configuration (tsconfig racine `files:[]`, références de projets). Une exécution explicite `tsc --noEmit -p tsconfig.app.json` trouve des erreurs ailleurs, dont un module de route en création concurrente et des erreurs préexistantes de typage ; aucune erreur dans les deux fichiers de cette correction. Aucun nettoyage hors périmètre entrepris.
