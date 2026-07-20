# Cahier d'exécution — Scraper `RESEARCH_ONLY`

> Mode unique couvert ici : `RESEARCH_ONLY`. Le collecteur **n'écrit jamais** dans `public.tools`, ni dans `src/data/*.json`, ni dans les vues publiées. Il ne fait **aucun** `--apply`.
> Implémentation : [`scripts/research-collector.mjs`](../../scripts/research-collector.mjs) (**v0.3.3.1**) · tests sur fixtures : [`scripts/research-collector.test.mjs`](../../scripts/research-collector.test.mjs) (`npx vitest run --config vitest.research.config.mjs`).

## 0. État réel (au 2026-07-17)

**Deux canaris ont été exécutés. Aucune écriture staging/DB n'a eu lieu — le sink est resté strictement local.**

| Canari | Portée | Résultat |
|---|---|---|
| **Canari 1** (v0.1) | `carrd`, `figma` — valide **uniquement la couche transport** | 2 passes ; idempotence prouvée. A révélé : `carrd.co/pricing` = **404** (vraie URL `/pro`) et un bug — une réponse 404 était **versionnée**. Run `baea391f-…` marqué **`valid=false`**, raison `collector_bug_404_versioned` (historique conservé, non supprimé). |
| **Canari 2** (v0.2) | `carrd` (statique), `wix` (**navigateur** FR/fr-FR) | 2 passes ; **0 observation**, **25 weak_claims**, **0 `approved`**, 0 dossier parasite, `captures` inchangées au second passage. |

**Faits établis par le canari 2** (à traiter avant tout élargissement) :
- **Wix** n'expose **ni `<html lang>` ni `Content-Language`** : la locale FR **n'est pas prouvable** par le transport, malgré un contenu servi en français. Conformément à la règle « marché/locale jamais déduits », **aucun montant n'a été retenu**. Une règle de preuve supplémentaire (ex. URL localisée, signal de contenu validé humainement) doit être **décidée** avant de collecter Wix en FR.
- Les **noms de plans Wix ne sont pas dans des titres `h1-h4`** : l'association plan↔montant par titre est **inopérante** sur ce type de page (les weak_claims portent un `plan_name` erroné, « Forfaits Premium Wix »). Le garde-fou a empêché toute promotion, mais l'extracteur a besoin d'une association **scopée au bloc de plan** pour les grilles en `div`.
- Le **cache est versionné** (`cache_schema`) depuis la v0.2 : un cache d'un schéma antérieur est traité comme périmé (sinon `cache_hit` silencieux privant l'extracteur de son entrée — bug constaté).

## 1. Périmètre et interdits

**Le collecteur fait** : ouvrir des sources autorisées, capturer des faits et écrire uniquement les dossiers/journaux de recherche locaux autorisés. La transformation en proposition `observed` pour le staging privé appartient au mapper/importeur distinct ; le collecteur n'accède jamais à la base.

**Le collecteur ne fait jamais** :
- écrire dans `public.tools`, `tools_v4.json`, `tools_index.json`, `catalog_api.*` ;
- créer/modifier une observation `approved` (l'approbation est un acte de **revue humaine**) ;
- toucher aux champs diagnostic (`prescription_*`, `decision_policy_v3`, `substitution_cluster_v2`, `pertinence_by_persona`, `force_silence`) — chantier D2 ;
- contourner un captcha, une authentification, un paywall ou une protection anti-bot ;
- déduire un `observed_market` / `observed_locale` non prouvé ;
- convertir une devise (la normalisation EUR est une étape **postérieure**, séparée).

## 2. Entrées

| Entrée | Source | Rôle |
|---|---|---|
| Liste de slugs du lot | paramètre CLI explicite (jamais « tout le catalogue ») | périmètre de la passe |
| `research/tool-pages/index.json` | file de production | statut/priorité/`openConflicts` par slug |
| État stocké par slug | `public.tools` (lecture seule) : `pricing_v5`, `pricing`, `default_monthly_price`, `website_url` | base de comparaison / détection de conflit |
| `docs/tool-catalog-migration/contract-v3/manifest-1126.json` | manifeste | validation que le slug existe et est publié |
| Contexte de référence | `--market=FR --locale=fr-FR` (défaut) ou `--market=global` | pilote `market_context` |
| `robots.txt` + ToS du domaine | réseau | autorisation d'accès |

**Paramètres** : `--slugs`, `--market/--locale`, `--concurrency` (défaut 2), `--delay` (défaut 2 s), `--cache-ttl` (défaut 24 h), `--renderer=static|browser|auto`, `--dry-run` (défaut **on**).

## 3. Sorties

**Périmètre d'écriture — liste blanche stricte.** En mode `RESEARCH_ONLY`, le **sink est exclusivement local** et se limite aux emplacements suivants :

| Sortie | Emplacement | Nature |
|---|---|---|
| Dossier de recherche par slug | `research/tool-pages/<slug>.json` | contrat §5.2 du brief, hors bundle, **fusionné** (jamais écrasé) |
| File de production | `research/tool-pages/index.json` | statut + `openConflicts` |
| Journal de passe | `research/runs/<run_id>.json` | URLs tentées, contrôles, erreurs, conflits, compteurs |
| Cohortes de gouvernance | `research/cohorts/<cohorte>.json` | listes locales de tri/recherche, hors bundle |
| Cache HTTP local | `.cache/tooltrim/research/<domain>/<sha1(url)>.*` | git-ignored, TTL |

**Interdits absolus d'écriture** : **aucune** écriture Supabase (aucune table, aucun schéma, `catalog_private.*` compris — le mode strict fonctionne **sans DB**), **aucune** écriture dans `src/data/**` (`tools_v4.json`, `tools_index.json`, `categories_index.json`…), aucune écriture dans `docs/**` ni ailleurs dans le dépôt. Toute écriture hors des chemins listés ci-dessus est un **bug bloquant**.

> Le passage vers le staging privé (`catalog_private.tool_sources/captures/claims/price_observations` en `observed`) est une **étape ultérieure et distincte**, exécutée par un importeur dédié après revue — **jamais** par le collecteur.

Le collecteur produit **toujours** un diff lisible (`proposal_not_applied`) ; il n'intègre rien.

## 4. Provenance

Chaîne obligatoire, sans raccourci :

```
tool_sources (url stable, domain, source_type, source_tier, is_official)
   └─ tool_source_captures (accessed_at, http_status, content_hash, rendered_by,
                            observed_market, observed_locale, market_context)
        ├─ tool_claims           (claim_key, value_json, confidence, volatility, status='observed')
        └─ tool_price_observations (natif + contexte, review_status='observed')
```

Règles :
- **une capture = une version datée** d'une source (append-only) ; jamais d'écrasement ;
- toute observation/claim référence **une capture précise** (`capture_id`), pas une URL nue ;
- `market_context` ∈ `reference_fr` (collecte réellement faite en FR/fr-FR) · `market_localized` (autre marché localisé) · `global_usd_fallback` (grille mondiale/USD, marché non détecté). **Jamais déduit** : `reference_fr` exige que la page ait effectivement servi FR/fr-FR ;
- devise et montant **natifs** conservés tels qu'affichés ; `normalized_monthly_eur`/`fx_*` laissés `null` par le collecteur ;
- `evidence_note` = résumé factuel court (jamais de copie longue).

## 5. Idempotence

Distinction fondamentale : **contrôle** (a-t-on regardé ?) ≠ **version de contenu** (a-t-il changé ?).

- **Le TTL déclenche un nouveau contrôle réseau.** Cache frais (TTL non dépassé) ⇒ aucune requête, contrôle servi depuis le cache. TTL **dépassé** (ou `--force-recheck`) ⇒ **nouveau contrôle réseau**. Le TTL ne crée **jamais** de version à lui seul.
- **Le hash déclenche la version.** Une **nouvelle version de contenu (capture)** n'est créée **que si `content_hash` diffère** de la dernière capture connue de la source. `content_hash` porte sur le **texte normalisé** (scripts/styles retirés, balises supprimées, espaces normalisés) afin de ne pas versionner du bruit (nonces, ids de build).
- **Hash identique ⇒ contrôle journalisé, sans nouvelle version.** On met à jour `last_checked_at` (source + dossier) et on ajoute une entrée au journal de run ; `captures[]` reste **strictement inchangé**.
- **Traçabilité de fraîcheur** : `last_checked_at` (dernier contrôle) est **distinct** de `accessed_at` de la dernière capture (dernier **changement** constaté). Les deux vivent dans le **dossier local et le journal de run** — **aucun changement de schéma** à ce stade.
- **Clé de source** : `(slug, url)` — jamais dupliquée.
- **Claims / observations** : même `value_json` + même `content_hash` de capture → **no-op**. Valeur différente → nouvelle entrée `observed` (historique empilé), l'ancienne intacte.
- **Aucun `approved`** : le collecteur ne peut ni créer, ni superséder un `approved` — acte de revue humaine exclusivement.
- **Non destructif** : `research/tool-pages/<slug>.json` est **fusionné**, jamais écrasé. Les champs curés (`identity`, `pricing`, `claims`, `unknowns`, `conflicts`) sont **préservés** ; le collecteur n'écrit que son bloc `collector`. Sortie déterministe (clés triées, dates ISO) pour un diff Git lisible.
- **Reprise** : passe interrompue reprise par slug ; `run_id` distinct, aucun doublon.

**Preuve attendue d'une seconde passe immédiate** : 0 dossier créé, 0 capture ajoutée, `last_checked_at` avancé, +1 entrée de run.

## 6. Limites de débit et politesse

- **`robots.txt` lu et respecté** avant toute URL ; refus ⇒ source marquée `is_accessible=false`, pas de contournement.
- **Concurrence max 2–3 requêtes par domaine** (défaut 2), délai ≥ 2 s entre requêtes d'un même domaine, jitter aléatoire.
- Concurrence globale ≤ 6 domaines en parallèle.
- **Cache local obligatoire** (TTL 24 h) : une même URL n'est pas re-téléchargée dans la passe.
- `User-Agent` identifiable et honnête + contact.
- Respect de `Retry-After` ; backoff exponentiel (2 s → 4 → 8, **max 3 tentatives**).
- Rendu navigateur (`browser`) **uniquement** si le fetch statique ne révèle pas le contenu tarifaire (cas Wix/Squarespace), avec les mêmes limites de débit.

## 7. Gestion des erreurs

| Code | Situation | Traitement |
|---|---|---|
| `http_error` | 4xx/5xx | **Règle absolue : une réponse non-OK produit un CONTRÔLE + une ERREUR, jamais une CAPTURE.** Une page 404/5xx n'est pas une version de la page tarifaire. `is_accessible=false`, `last_checked_at` avancé, `captures[]` inchangé. (Bug v0.1 corrigé en v0.2.) 429/5xx : 3 tentatives max avec `Retry-After` puis backoff 2s→4s→8s. |
| `tool_limit` | ex. `Parse Error: Header overflow` (cas Webflow en statique) | bascule `renderer=browser` ; si échec, `blocked` + journal |
| `js_gated` | contenu tarifaire rendu en JS (Wix, Squarespace) | bascule `browser` ; si toujours vide → `needs_review`, montant `null` |
| `robots_disallow` | interdit par `robots.txt` | **arrêt immédiat** sur cette URL, `is_accessible=false`, **jamais** de contournement |
| `protected` | captcha / login / paywall / anti-bot | **arrêt immédiat**, `blocked`, chercher une source autorisée alternative |
| `geo_variant` | page régionalisée sans marché prouvé | montant **non retenu**, `market_context` non assigné, `needs_review` |
| `parse_ambiguous` | montant/plan non isolables de façon fiable | claim `observed` + `confidence='low'` + `unknowns[]` |
| `conflict` | valeur ≠ valeur stockée ou ≠ autre source officielle | **les deux conservées**, `status='conflicted'`, `openConflicts++`, jamais d'arbitrage automatique |

Une erreur **n'invente jamais** une valeur : l'inconnu reste `null` et le statut reste `needs_review`/`blocked`.

## 8. Critères `approved` vs `needs_review`

Le collecteur ne produit **que** `observed`. Ce tableau définit ce que la **revue humaine** peut approuver — et sert de pré-qualification automatique (le validateur marque `needs_review` sinon).

**Éligible `approved`** — toutes les conditions réunies (implémenté par `approvedPreEligibility()`, **gate qualité : il n'approuve jamais**) :
1. source **niveau 1** officielle et **ouverte** (page tarifaire, pas la homepage) ;
2. `capture_id` présent, `observed_on` renseigné ;
3. `native_amount` **et** `native_currency` (ISO 4217) présents ;
4. `billing_period` présent si montant > 0 ;
5. **`billing_commitment` présent** si montant > 0. **v0.3.1 — resserré** : seul le **paiement intégral** (« réglés/payés **en totalité** », « paid in full ») prouve `annual_prepaid`. « **facturé annuellement** » / « billed annually » **seul reste ambigu** ⇒ `null`/`needs_review` (peut désigner une mensualisation sur engagement annuel) ;
6. **`pricing_unit` non nul** (**v0.3.1**) — et **prouvée** : par la page, ou par une **source officielle distincte** reliée à sa propre capture (`pricing_unit_evidence`). Jamais inférée ;
7. `market_context` non nul, **cohérent avec la capture** ; si `reference_fr` → soit prouvé par un signal déclaré, soit **attesté par une revue humaine** (`research-attest.mjs`) rattachée à une attestation de contexte immuable. Un `market_context_candidate` **ne suffit jamais** ;
8. `plan_key` mappé sur un plan officiel (`plan_name` exact), correspondance plan↔prix **univoque** ;
9. `confidence` renseignée, ≥ `medium` ;
10. cohérence `plan.is_free ⇔ native_amount = 0` ;
11. aucun conflit ouvert sur la même clé ;
12. fraîcheur : `observed_on` ≤ 90 jours.

**Forcé `needs_review`** dès qu'un de ces cas se présente :
- engagement **inconnu** (cas **Figma** 16 USD toggle non établi ; **Framer** Basic 10 USD) ;
- devise ambiguë ou étiquetée sans preuve ;
- montant issu d'une page régionalisée **sans** marché/locale prouvés (cas **Wix** avant recollecte FR) ;
- montant non exposé (JS-gated non résolu) ;
- source niveau 2/3 seule, ou homepage au lieu de la page tarifaire ;
- essai présenté comme plan gratuit ;
- conflit inter-sources officielles (cas **Figma** page 16 USD vs help 12/15 USD) ;
- `observed_on` > 90 jours.

Transition d'une observation approuvée : l'ancienne passe `superseded`, la nouvelle `approved` — **acte de revue**, jamais du collecteur.

## 9. Plan du premier lot

**Lot 1 — famille homogène « constructeurs de sites » (nocode-web), contexte `FR/fr-FR`.** Choisie parce que la forme tarifaire est déjà éprouvée sur le pilote (par **site**, annual_prepaid, EUR TTC) et qu'elle attaque le plus gros bloc `rechercher` de l'inventaire (nocode-web = 84).

| Sous-lot | Slugs | Objectif |
|---|---|---|
| **1a — reprises pilotes (3)** | `figma` (établir l'état du toggle Monthly/Annual), `framer` (engagement + réduction annuelle), `webflow` (équivalent en engagement **mensuel**) | lever les 3 `needs_review` connus |
| **1b — nouveaux (8)** | `carrd`, `dorik`, `typedream`, `readymag`, `cargo-site`, `format`, `pagecloud`, `simvoly` | valider la chaîne provenance sur une famille homogène |

**Total : 11 slugs.** Paramètres : `--market=FR --locale=fr-FR --concurrency=2 --delay=2s --renderer=auto --dry-run`.

**Déroulé** : robots.txt → page tarifaire officielle → fetch statique, bascule `browser` si JS-gated → capture datée + hash → claims/observations `observed` → dossier `<slug>.json` + journal de run → **rapport de revue** (conflits, inconnus, inaccessibles) → **arrêt**.

**Critères de succès du lot 1** :
- 11/11 dossiers produits, 0 écriture hors `research/` + staging privé ;
- chaque montant retenu porte marché + locale **prouvés** (sinon `null`) ;
- 0 valeur convertie, 0 valeur inventée ;
- re-exécution immédiate ⇒ **0 nouvelle capture** (idempotence prouvée par `content_hash`) ;
- rapport listant : claims `observed`, conflits, inconnus, sources inaccessibles.

**Puis** : revue humaine → approbations éventuelles → seulement ensuite l'extension à des lots de 10–20 (Phase C du brief).

## 10. Journal de passe (`tool_research_runs`)

Chaque run enregistre : `run_id`, `agent`, `mode='RESEARCH_ONLY'`, `collector_version`, `started_at/finished_at`, `urls_attempted[]`, `errors[]` (codes §7), `conflicts[]`, `claims_created`, `review_status='open'`, `diff_summary`. Aucun run ne peut clore une revue.

## 11. Définition de terminé (pour une passe)

Une passe est terminée quand : chaque slug a un dossier à jour ; chaque fait volatil porte une capture datée + un `sourceUrl` précis ; chaque inconnu est explicitement `null`/`unknown` ; chaque conflit est conservé des deux côtés ; le journal est écrit ; **rien n'a été appliqué**.
