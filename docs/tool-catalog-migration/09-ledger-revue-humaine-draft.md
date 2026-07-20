# Ledger privé de revue humaine — contrat rév. 4.10 (**NON EXÉCUTÉ SUR SUPABASE**)

> Statut : correction de gouvernance intégrée aux brouillons A1/A2/A6 en rév. 4.10, toujours soumise à validation avant Supabase. A1 + import ont été testés uniquement sur PostgreSQL jetable avec rollback ; aucune écriture Supabase/JSON.

## Pourquoi cet ajout est nécessaire

Le collecteur local distingue désormais correctement :

1. la capture et les observations brutes ;
2. l'attestation humaine d'un contexte (`reference_fr`) ;
3. l'approbation ultérieure d'une observation ou d'un claim.

Le brouillon SQL sait stocker les captures et les statuts `approved`, mais pas encore **qui** a pris la décision, **sur quelle version**, ni si l'attestation a ensuite été révoquée. Importer seulement `market_context='reference_fr'` ferait perdre cette chaîne de preuve et rendrait l'incident Wix invisible dans la base canonique.

## Principe retenu

- Les actes humains sont privés, immuables et append-only.
- Une révocation est un nouvel événement ; elle ne supprime ni ne réécrit l'acte initial.
- Une attestation de contexte rend une observation **éligible à la revue** ; elle ne l'approuve jamais.
- Une ligne `approved` doit être adossée à une décision d'approbation attribuable.
- Les projections publiques n'exposent ni identité du réviseur, ni notes internes, ni historique d'incident.

## Extension minimale proposée

### 1. `catalog_private.tool_context_attestations`

Faisceaux machine importés intégralement depuis `collector.context_attestations[]` : capture, URL, hash, date d'accès et payload immuable (egress, locale, timezone, marqueurs visibles). Ils constituent la basis réauditable de l'acte humain.

### 2. `catalog_private.tool_review_attestations`

Actes de contexte importés depuis `review_attestations[]` :

| Champ | Rôle |
|---|---|
| `id text primary key` | identifiant déterministe `sha256:*` du dossier local |
| `tool_id text` | outil concerné |
| `attestation_type text` | initialement `market_context` |
| `value_json jsonb` | initialement `"reference_fr"` |
| `basis_attestation_id text` | faisceau de contexte immuable |
| `capture_id uuid` | capture SQL exacte visée |
| `content_hash text` | version de contenu exacte |
| `source_url text` | contrôle de cohérence supplémentaire |
| `attested_by text`, `attested_at timestamptz` | attribution humaine |
| `note text`, `created_at timestamptz` | trace privée |

La table refuse `UPDATE` et `DELETE`. Une nouvelle attestation produit une nouvelle ligne.

### 3. `catalog_private.tool_review_events`

Journal append-only des décisions et incidents :

| Champ | Rôle |
|---|---|
| `id text primary key` | identifiant stable de l'événement |
| `tool_id text` | périmètre outil |
| `event_type text` | `attestation_revoked`, `observation_approved`, `claim_approved`, `rejected`, `superseded`, `incident_recorded` |
| `subject_type text` | `context_attestation`, `price_observation`, `claim`, `relationship`, `localization` |
| `subject_id text` | identifiant de la ligne visée |
| `attestation_id text null` | attestation de contexte concernée, si applicable |
| `actor text`, `occurred_at timestamptz` | auteur et date de la décision |
| `reason text`, `payload jsonb` | justification et données de contrôle |
| `research_run_id uuid null` | rattachement facultatif au run |
| `created_at timestamptz` | horodatage base |

Cette table refuse également `UPDATE` et `DELETE`. L'état courant est dérivé des événements, jamais obtenu en effaçant l'historique.

### 3. Références depuis les faits approuvés

Ajouter `context_attestation_id text null` aux observations de prix et aux claims.

Pour une ligne `approved` avec `market_context='reference_fr'`, le trigger doit exiger :

- une attestation existante, non révoquée ;
- `attestation_type='market_context'` et `value_json='"reference_fr"'` ;
- le même outil ;
- la même capture, URL et version de contenu ;
- une décision `observation_approved` ou `claim_approved` distincte, attribuée et postérieure à l'attestation.

Une approbation `global_usd_fallback` reste adossée à sa capture officielle mais ne nécessite pas d'attestation `reference_fr`.

## Vue privée d'état courant

Une vue interne `catalog_private.active_review_attestations` peut sélectionner les attestations pour lesquelles aucun événement `attestation_revoked` n'existe. Elle n'est jamais accordée à `anon` ou `authenticated`.

Le resolver public continue de lire uniquement les observations `approved`. Il n'a pas besoin d'exposer le ledger, car les triggers garantissent l'intégrité en amont.

## Import idempotent depuis les dossiers locaux

Ordre recommandé pour un slug :

1. importer sources et captures ;
2. importer les basis de contexte avec leur payload intégral ;
3. importer l'attestation humaine par son identifiant déterministe (`ON CONFLICT DO NOTHING`) et sa FK vers la basis ;
4. importer les événements de contexte/incidents ;
5. importer plans, observations et claims en `observed` ;
6. résoudre les références capture/attestation ;
7. insérer la décision humaine d'approbation ;
8. seulement ensuite, passer les lignes explicitement retenues à `approved` dans la même transaction.

Un second import identique doit créer zéro ligne et ne modifier aucun horodatage métier.

## Révocation

La révocation d'une attestation utilisée par une ligne approuvée doit être transactionnelle :

1. ajouter les événements de déclassement/supersession des faits dépendants ;
2. faire repasser ces faits à `needs_review` ou les superséder ;
3. ajouter seulement alors l'événement `attestation_revoked` ; le trigger le refuse si un fait `approved` dépend encore de l'attestation ;
4. vérifier qu'aucune observation/claim `approved` ne référence une attestation inactive ;
5. ne jamais supprimer l'ancienne attestation ni sa décision d'approbation.

## Cas Wix attendu

Avant l'acte humain réel :

- importer l'attestation accidentelle `sha256:83064812…740b` ;
- importer sa révocation et l'événement d'incident ;
- état actif dérivé : **0 attestation** ;
- les quatre observations restent `observed/needs_review`.

Après le véritable acte humain :

- une seconde attestation, avec une autre identité et un autre identifiant, est importée ;
- elle vise la basis `sha256:4faa267f…fcfa6` et la capture exacte ;
- elle rend les quatre observations éligibles, sans les approuver ;
- une revue de prix distincte est encore nécessaire.

## Tests bloquants avant DDL

1. `anon` et `authenticated` ne peuvent lire aucune des deux tables.
2. `UPDATE`/`DELETE` d'une basis, d'une attestation ou d'un événement échoue, y compris pour le pipeline ordinaire.
3. Une attestation révoquée ne peut soutenir aucune nouvelle approbation.
4. Une capture ou un hash différent fait échouer l'approbation.
5. `reference_fr` sans `context_attestation_id` fait échouer l'approbation.
6. Une décision d'approbation sans acteur ou sans date fait échouer l'approbation.
7. Le second import du même dossier est un no-op.
8. L'incident Wix est présent mais ne produit aucune attestation active.
9. L'attestation réelle seule ne change aucun `review_status` en `approved`.
10. La projection publique reste inchangée et ne révèle aucun champ du ledger.

## Décision demandée

Valider ou refuser la rév. 4.10 avant toute exécution Supabase. Tant qu'elle n'est pas validée, aucun DDL staging distant ne doit être exécuté et aucune valeur `reference_fr` ne doit être matérialisée comme approuvée en base.
