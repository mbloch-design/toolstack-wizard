# Artefact 6/6 — Scénario de déploiement + tests (**NON EXÉCUTÉ**)

> Rév. 4.10. **Aucun SQL exécuté sur Supabase, aucune écriture Supabase/JSON.** A1 + import Wix ont passé 18/18 tests sur PostgreSQL 16 jetable en rollback-only. A4/A5 doivent encore passer la répétition générale : la projection publique commune est obligatoire, seule la projection Diagnostic reste différée.
>
> **Rév. 4.2** — resolvers `SECURITY DEFINER` testés sous `anon` **et** `authenticated` ; relations à cible publiée sans orpheline (T9/T9b) ; périmètre public actif vérifié (T10/T10b/T10c). Manifeste **non régénéré** : les ensembles de slugs sont inchangés (1126 / 593, `slugListSha256 = 9d0e3f59…`, commit `dbea365…`).
> **Rév. 4.1** — garde de publication dans les resolvers (`select_current_compare_price`, `legacy_relationships`) + sonde `__draft_probe__` sous `anon`/`authenticated` : un outil non publié ne divulgue **ni prix, ni is_free, ni relation**, et n'apparaît jamais comme cible de relation.

## Manifeste matérialisé (référence de publication)

Généré en lecture seule le 2026-07-16 :
- [`manifest-1126.json`](./manifest-1126.json) · [`manifest-1126.slugs.txt`](./manifest-1126.slugs.txt)
- `gitCommit = dbea365…`, `gitBranch = codex/go25-preprod-hardening`
- `source.sha256 = d92d47b5…`, `slugCount = 1126`, `slugListSha256 = 9d0e3f59…`
- le JSON contient directement les **1 126 slugs**, les **593 JSON-only**, et les 1 126 résultats de référence produits par le vrai `hasGenuineFreeTier` TypeScript (**589 true / 537 false**)
- = union par slug de `getMergedTools` = entrées `tool/` du sitemap (parité vérifiée). **Aucun slug au-delà.**

### Matérialisation SQL et backfill explicite (NON EXÉCUTÉS)

Le runner de migration fournit le contenu du fichier sous le paramètre textuel `:manifest_json`. Le commit et le hash sont vérifiés par le runner **avant** d'ouvrir la transaction.

```sql
-- ⛔ BROUILLON NON EXÉCUTÉ. Cette séquence précède obligatoirement la création des vues.
insert into catalog_private.published_manifest(slug,source_commit,slug_set_sha256)
select slug, doc->>'gitCommit', doc->>'slugListSha256'
from (select :'manifest_json'::jsonb doc) m
cross join lateral jsonb_array_elements_text(m.doc->'slugs') slug;

do $$ begin
  if (select count(*) from catalog_private.published_manifest) <> 1126 then
    raise exception 'published manifest must contain exactly 1126 slugs';
  end if;
  if exists (select 1 from catalog_private.published_manifest m left join public.tools t using(slug) where t.id is null) then
    raise exception 'manifest references a missing tool';
  end if;
end $$;

-- Publication explicite : les 533 existants et 593 importés sont encore draft avant ceci.
update public.tools t set content_status='published', published_at=coalesce(published_at,now())
from catalog_private.published_manifest m where m.slug=t.slug;

-- Gate avant CREATE VIEW : ni manque, ni publication hors manifeste.
do $$ begin
  if exists (
    (select slug from catalog_private.published_manifest except select slug from public.tools where content_status='published')
    union all
    (select slug from public.tools where content_status='published' except select slug from catalog_private.published_manifest)
  ) then raise exception 'published set differs from manifest'; end if;
end $$;
```

## Gate préalable Wix — proposition de staging (NON EXÉCUTÉE)

Le CLI de préparation vérifie le slug contre ce manifeste et le registre de sources, puis dérive les cinq plans Wix à partir du mapping humain et des preuves collectées. Seuls l'ordre canonique et `comparePlanKey=light` vivent dans le profil métier explicite.

État vérifié localement en rév. 4.9 : proposition `sha256:85b45eb1447745fc9d0a52f33d82360d27cde4eeca03d8b6ba9656cca449845b` ; 3 sources, 3 captures, 17 basis machine, 1 attestation humaine historique, 2 événements, 5 plans, 4 observations de prix, 2 claims, 4 localisations, 2 contenus éditoriaux `draft`, 0 relation Wix actuelle et **0 approved**. Le dossier Wix d'entrée reste `sha256:a10e922aed742d5c96598282166e9034c2a811ca4b7e97ef133c8f00a075650f`.

La suite de tests RESEARCH couvre collecteur, attestations, mapper, CLI, relations sourcées, distinction slug/ID, staging éditorial, génération du brouillon SQL, correspondance de ses colonnes avec le DDL, union des consommateurs et droits RLS explicites : **164/164 verts**. Le premier test PostgreSQL couvre A1 + import ; il ne prouve pas encore A4/A5 ni le runtime de parité applicative.

## Ordre de migration

| Étape | Action | Gate / test |
|---|---|---|
| **1. Manifeste + backup** | Figer `manifest-1126` (hash+commit) ; snapshot « last known good » | manifeste == sitemap |
| **2. Schéma additif** | Artefact 1 : `catalog_private.*`, `catalog_api`, colonnes `tools`, RLS/REVOKE, rôle `catalog_owner` | T-anon-private ✓ |
| **3. Backfill 533** | `data_contract='legacy'`, `research_status='todo'` sur les 533 existants | 533 legacy |
| **4. Import 593 payloads complets** | Artefact 2 (M0) : insérer les 593 JSON-only avec **payload complet** (resolvers legacy OK) | T1 (1126), T-parité-getMergedTools |
| **5. Parité 1126** | `count(tools)=1126`, 0 `canonical` | T1 |
| **6. Backfill `content_status='published'`** | SQL ci-dessus, **depuis la table matérialisée et AVANT la projection** | T2 (égalité des ensembles, pas seulement des comptes) |
| **7. Projection** | Artefact 5 : `published_tool_projection`, grant anon/authenticated | T3, T4, T7 |
| **8. Bascule consommateurs publics** | Adaptateur unique (`lang` obligatoire, gratuit ≠ inconnu), puis Fiche / Ma Stack / Explorer / build → `published_tool_projection` | T8 (parité 4 surfaces) |
| **9. Bascule par outil** | RESEARCH→sources/captures→ledger→faits `observed`→décisions de revue→`approved`→`data_contract='canonical'` (transaction) | parité legacy/canonical par fiche + T11/T12 |

Avant l'étape 9, le gate par fiche compare aussi galerie, angle IA et guidance pricing entre la ligne legacy adaptée et la ligne canonical adaptée. Un outil qui perd un de ces blocs ne peut pas passer `data_contract='canonical'`.

> **#12 :** aucun `REVOKE` et aucune nouvelle policy restrictive sur `public.tools` ne figurent dans ces artefacts. Les appels directs résiduels, notamment le code Diagnostic différé, restent donc fonctionnels mais hors chemin critique. Une restriction future exigera une décision et une migration séparées, prouvées par recherche statique et tests runtime.

## Diagnostic différé

Le Diagnostic ne fait pas partie du déploiement actuel. Aucun objet SQL, grant, changement applicatif ou test de parité Diagnostic n'est requis pour livrer le catalogue commun aux quatre consommateurs actifs. Sa réouverture future devra créer sa propre projection à partir du même socle canonique, sans modifier les tables de provenance ni le contrat des consommateurs actuels.

## D12 — tests de rôle effectifs (NON EXÉCUTÉ)

```sql
-- sous anon
set role anon;
select count(*) from catalog_api.published_tool_projection;      -- OK (attendu > 0)
-- rév.4 : les resolvers SECURITY DEFINER doivent être appelables ET produire des valeurs
select count(*)=1 as anon_resolver_one_row
  from catalog_api.select_current_compare_price('wix','FR','fr-FR');
select catalog_api.legacy_is_free('Essai gratuit 30 jours') = false as anon_is_free_ok;
select catalog_api.legacy_freshness('{"verified_on":"2026-03-13"}'::jsonb) = 'stale' as anon_freshness_ok;
select jsonb_typeof(catalog_api.legacy_relationships('notion','fr')) = 'array' as anon_rel_ok;
-- la colonne alimentée par le resolver doit être servie sans erreur
select bool_or(compare_plan is not null) as anon_projection_price_ok
  from catalog_api.published_tool_projection where lang='fr';
select count(*) from catalog_private.tool_price_observations;    -- DOIT ÉCHOUER (permission denied)
select count(*) from catalog_private.tool_editorial_content;     -- DOIT ÉCHOUER
select count(*) from catalog_private.tool_plans;                 -- DOIT ÉCHOUER
reset role;

-- rév.4.1 — NON-DIVULGATION D'UN OUTIL NON PUBLIÉ (appel direct des resolvers sous anon)
-- Fixture (rôle serveur, dans une transaction de test) : un outil draft complet,
-- avec plans + observation approved + relations, qui ne doit RIEN laisser filtrer.
--   insert into public.tools(id,slug,name,content_status,data_contract)
--     values('__draft_probe__','__draft_probe__','Draft Probe','draft','canonical');
--   + tool_plans(is_compare_plan) + tool_price_observations(review_status='approved')
--   + tool_relationships(status='approved') + alternatives legacy
set role anon;
-- 1) prix : ligne unique needs_review, TOUTES colonnes nulles (aucune donnée privée)
select count(*)=1
   and bool_and(plan_key is null and is_free is null and pricing_unit is null
            and native_amount is null and native_currency is null
            and billing_commitment is null and billing_period is null
            and tax_inclusion is null and normalized_monthly_eur is null
            and observed_market is null and observed_locale is null
            and source_url is null
            and price_status='needs_review') as anon_draft_price_no_leak
from catalog_api.select_current_compare_price('__draft_probe__','FR','fr-FR');
-- 2) relations : tableau vide, aucune cible révélée
select catalog_api.legacy_relationships('__draft_probe__','fr') = '[]'::jsonb
  as anon_draft_relations_no_leak;
-- 3) l'outil draft n'apparaît pas dans la projection
select count(*)=0 as anon_draft_absent_from_projection
  from catalog_api.published_tool_projection where tool_id='__draft_probe__';
-- 4) il n'apparaît pas non plus comme CIBLE de relation d'un outil publié
select count(*)=0 as anon_draft_never_a_relation_target
from catalog_api.published_tool_projection p
cross join lateral jsonb_array_elements(p.relationships) r
where r->>'slug'='__draft_probe__';
reset role;
-- (idem sous authenticated : mêmes 4 assertions attendues)
-- sous authenticated
set role authenticated;
select count(*) from catalog_api.published_tool_projection;      -- OK
select count(*)=1 as auth_resolver_one_row
  from catalog_api.select_current_compare_price('squarespace','FR','fr-FR');
select jsonb_typeof(catalog_api.legacy_relationships('calendly','fr')) = 'array' as auth_rel_ok;
select count(*) from catalog_private.tool_sources;               -- DOIT ÉCHOUER
select count(*) from catalog_private.tool_review_attestations;    -- DOIT ÉCHOUER
select count(*) from catalog_private.tool_review_events;          -- DOIT ÉCHOUER
select count(*) from catalog_private.tool_context_attestations;   -- DOIT ÉCHOUER
reset role;
-- rév.4 : propriétés effectives des resolvers (SECURITY DEFINER + search_path figé + EXECUTE)
select p.proname, p.prosecdef, p.proconfig,
       pg_get_userbyid(p.proowner) as owner,
       has_function_privilege('anon', p.oid, 'execute')          as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as auth_exec,
       has_function_privilege('public', p.oid, 'execute')        as public_exec
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='catalog_api'
  and p.proname in ('select_current_compare_price','legacy_is_free','legacy_freshness','legacy_relationships');
-- attendu par ligne : prosecdef=true, owner='catalog_owner',
--   proconfig contient 'search_path=…', anon_exec=true, auth_exec=true, public_exec=false
-- sous service_role (serveur/CI)
set role service_role;
select count(*) from catalog_private.tool_price_observations;    -- OK (écriture pipeline)
select has_table_privilege('service_role','catalog_private.tool_price_observations','insert') as pipeline_insert_ok; -- true
select has_table_privilege('service_role','catalog_private.tool_review_events','insert') as ledger_append_ok;        -- true
select has_table_privilege('service_role','catalog_private.tool_review_events','update') as ledger_update_denied;    -- false
reset role;
-- propriétaire
select rolname, rolbypassrls, rolcanlogin from pg_roles where rolname='catalog_owner';
-- attendu: rolbypassrls=false, rolcanlogin=false
select has_table_privilege('anon','catalog_private.tool_claims','select') = false as anon_private_denied,
       has_table_privilege('authenticated','catalog_private.tool_claims','select') = false as auth_private_denied,
       has_schema_privilege('public','catalog_private','usage') = false as public_private_schema_denied,
       has_table_privilege('public','catalog_private.tool_review_events','select') = false as public_review_events_denied,
       has_table_privilege('anon','catalog_private.tool_context_attestations','select') = false as anon_context_basis_denied,
       has_table_privilege('anon','catalog_private.tool_review_attestations','select') = false as anon_attestations_denied,
       has_table_privilege('authenticated','catalog_private.tool_review_events','select') = false as auth_review_events_denied,
       has_table_privilege('anon','catalog_api.published_tool_projection','select') as anon_projection_ok,
       has_table_privilege('authenticated','catalog_api.published_tool_projection','select') as auth_projection_ok;
```

## Tests de contrat (assertions, NON EXÉCUTÉ)

```sql
-- T1  Aucune perte des 1126
select count(*) = 1126 as t1 from public.tools;
-- T2  Aucune publication implicite : égalité d'ENSEMBLES avec le manifeste
select not exists (
  (select slug from catalog_private.published_manifest except select slug from public.tools where content_status='published')
  union all
  (select slug from public.tools where content_status='published' except select slug from catalog_private.published_manifest)
) as t2;
-- T3  Aucune donnée privée en anon (cf. tests de rôle ci-dessus) : accès catalog_private => refus
-- T4  Aucune conversion legacy présentée comme native
select bool_and(compare_native_amount is null and compare_native_currency is null) as t4
  from catalog_api.published_tool_projection where data_contract='legacy';
-- T5  Figma/Framer publics: prix null + needs_review
select count(*)=4 and bool_and(compare_native_amount is null and price_status='needs_review') as t5
  from catalog_api.published_tool_projection where tool_id in ('figma','framer') and data_contract='canonical';
select count(*)=1 and bool_and(native_amount is null and price_status='needs_review') as t5_resolver_one_row
  from catalog_api.select_current_compare_price('__tool_without_compare_plan__','FR','fr-FR');
-- T5b La date publique exacte vient de la dernière reconfirmation, sans
-- écraser la date de première observation.
select count(*)=1
   and bool_and(price_last_confirmed_on >= price_observed_on) as t5b_price_dates
  from catalog_api.published_tool_projection
  where slug='webflow' and lang='fr' and price_status='approved';
-- T6  Webflow/Wix/Squarespace: prix approuvés
-- Précondition Wix : attestation de contexte active + décision de revue importées.
select count(*)=3 and bool_and(price_status='approved' and compare_native_amount is not null) as t6
  from catalog_api.published_tool_projection where tool_id in ('webflow','wix','squarespace') and lang='fr';
-- T7  Une seule ligne par (outil, langue)
select bool_and(c=1) as t7 from (select tool_id,lang,count(*) c from catalog_api.published_tool_projection group by 1,2) x;
select count(*)=2252 as t7_cardinality from catalog_api.published_tool_projection;
-- T8  Parité 4 surfaces: hash(row_fiche)=hash(row_maStack)=hash(row_explorer)=hash(row_seo) par (tool_id,lang)
--     (test applicatif: chaque surface lit la MÊME ligne de projection ; aucun recalcul local)
-- T8b Adaptateur : needs_review => prix inconnu et jamais gratuit par défaut ;
--     is_free=true reste indépendant du prix du plan comparatif.
-- T-parité-getMergedTools : projection(legacy) == sortie getMergedTools pour les 1126, champ par champ (matrice A2/A5)
-- T-parité-free EXACT sur 1126. `expected` vient du vrai helper TS, matérialisé dans le manifeste.
with expected as (
  select * from jsonb_to_recordset((:'manifest_json'::jsonb)->'legacyIsFreeExpected')
    as x(slug text,"isFree" boolean)
), actual as (
  select t.slug,catalog_api.legacy_is_free(t.pricing->>'free') as is_free from public.tools t
)
select count(*)=1126 and count(*) filter(where e."isFree" is distinct from a.is_free)=0
       and count(*) filter(where a.is_free)=589 as t_free_exact_1126
from expected e join actual a using(slug);

-- Contraintes renforcées : aucune observation approved incomplète / FX incohérent.
select count(*)=0 as t_approved_complete from catalog_private.tool_price_observations o
join catalog_private.tool_source_captures c on c.id=o.capture_id
where o.review_status='approved' and (
  o.native_amount is null or o.native_currency is null or o.confidence is null
  or (o.native_amount>0 and o.billing_commitment is null)
  or (c.observed_locale is null and c.market_context is distinct from 'global_usd_fallback'));

select count(*)=0 as t_fx_coherent from catalog_private.tool_price_observations
where normalized_monthly_eur is not null and (
  fx_rate is null or fx_rate_date is null or normalization_method is null
  or abs(normalized_monthly_eur-native_amount*fx_rate)>=0.01);

select count(*)=0 as t_trial_days from public.tools
where trial_days is not null and trial_days not between 1 and 365;

-- Une reconfirmation ne peut précéder la première observation ; la fraîcheur
-- publique doit utiliser last_confirmed_on avec fallback observed_on.
select count(*)=0 as t_confirmation_chronology
from catalog_private.tool_price_observations
where last_confirmed_on is not null and last_confirmed_on < observed_on;

select count(*)=0 as t_global_claim_exception_is_capture_backed
from catalog_private.tool_claims cl
left join catalog_private.tool_source_captures c on c.id=cl.capture_id
where cl.status='approved' and cl.observed_locale is null
  and c.market_context is distinct from 'global_usd_fallback';

-- rév.4.3 — T11 : aucune approbation reference_fr sans ledger complet et actif.
select count(*)=0 as t11_reference_fr_is_ledger_backed
from catalog_private.tool_price_observations o
join catalog_private.tool_plans p on p.id=o.plan_id
left join catalog_private.active_review_attestations a
  on a.id=o.context_attestation_id and a.tool_id=p.tool_id and a.capture_id=o.capture_id
left join catalog_private.tool_review_events e
  on e.id=o.approval_event_id and e.tool_id=p.tool_id
 and e.event_type='observation_approved' and e.subject_type='price_observation'
 and e.subject_id=o.id::text and e.attestation_id=a.id
where o.review_status='approved' and o.market_context='reference_fr'
  and (a.id is null or e.id is null);

select count(*)=0 as t11_claim_reference_fr_is_ledger_backed
from catalog_private.tool_claims cl
left join catalog_private.active_review_attestations a
  on a.id=cl.context_attestation_id and a.tool_id=cl.tool_id and a.capture_id=cl.capture_id
left join catalog_private.tool_review_events e
  on e.id=cl.approval_event_id and e.tool_id=cl.tool_id
 and e.event_type='claim_approved' and e.subject_type='claim'
 and e.subject_id=cl.id::text and e.attestation_id=a.id
where cl.status='approved' and cl.market_context='reference_fr'
  and (a.id is null or e.id is null);

-- T12 : checkpoint à exécuter immédiatement après import du ledger Wix et
-- AVANT le véritable acte humain. Il ne s'exécute pas au même checkpoint que
-- T6, qui décrit l'état cible après attestation + revue + approbation.
select count(*)=1 as t12_wix_historical_attestation
from catalog_private.tool_review_attestations where tool_id='wix';
select count(*)=17 as t12_wix_context_basis_payloads
from catalog_private.tool_context_attestations
where tool_id='wix' and jsonb_typeof(payload)='object';
select count(*)=2 as t12_wix_required_basis_present
from catalog_private.tool_context_attestations
where tool_id='wix' and id in (
  'sha256:1057c48b7455bf3c115c47592f2c542949edc58744af2f8171aa955cbaded72e',
  'sha256:4faa267f47fb2ab5620e3e45abea92f78e19944040de79b7e21e44a3270fcfa6');
select count(*)=0 as t12_wix_no_active_attestation
from catalog_private.active_review_attestations where tool_id='wix';
select count(*)=2 as t12_wix_revocation_and_incident
from catalog_private.tool_review_events
where tool_id='wix' and event_type in ('attestation_revoked','incident_recorded');
select count(*)=0 as t12_wix_nothing_approved
from catalog_private.tool_price_observations o
join catalog_private.tool_plans p on p.id=o.plan_id
where p.tool_id='wix' and o.review_status='approved';

-- T13 : clés collecteur présentes et sans doublon dans leur bon périmètre.
select count(*)=0 as t13_duplicate_sources from (
  select tool_id,collector_id from catalog_private.tool_sources group by 1,2 having count(*)>1) x;
select count(*)=0 as t13_duplicate_captures from (
  select source_id,collector_id from catalog_private.tool_source_captures group by 1,2 having count(*)>1) x;
select count(*)=0 as t13_duplicate_observations from (
  select plan_id,collector_id from catalog_private.tool_price_observations group by 1,2 having count(*)>1) x;
select count(*)=0 as t13_duplicate_claims from (
  select tool_id,collector_id from catalog_private.tool_claims group by 1,2 having count(*)>1) x;
select count(*)=0 as t13_duplicate_localizations from (
  select plan_id,collector_id from catalog_private.tool_plan_localizations group by 1,2 having count(*)>1) x;
select count(*)=0 as t13_duplicate_relationships from (
  select tool_id,collector_id from catalog_private.tool_relationships group by 1,2 having count(*)>1) x;

-- Test d'immutabilité effectif (dans une transaction de test) : sous
-- service_role, ces commandes échouent faute de privilège UPDATE/DELETE ;
-- sous le propriétaire de migration, elles atteignent le trigger et échouent
-- avec "review ledger is append-only".
-- update catalog_private.tool_context_attestations set payload='{}' where tool_id='wix';
-- update catalog_private.tool_review_attestations set note='mutation interdite' where tool_id='wix';
-- delete from catalog_private.tool_review_events where tool_id='wix';
-- Une insertion attestation_revoked DOIT également échouer tant qu'une ligne
-- approved porte encore son context_attestation_id ("revoke dependents first").

-- rév.4 — T9 : toute relation exposée cible un outil PUBLIÉ et existant (0 orpheline, 0 fantôme)
select count(*)=0 as t9_relations_target_published
from catalog_api.published_tool_projection p
cross join lateral jsonb_array_elements(p.relationships) r
left join public.tools rt on rt.slug = r->>'slug'
where rt.id is null or rt.content_status <> 'published';

-- rév.4 — T9b : pas de doublon (target, type) dans les relations d'une fiche
select count(*)=0 as t9b_relations_unique from (
  select p.tool_id, p.lang, r->>'slug' s, r->>'type' ty, count(*) c
  from catalog_api.published_tool_projection p
  cross join lateral jsonb_array_elements(p.relationships) r
  group by 1,2,3,4 having count(*)>1) x;

-- rév.4 — T10 : la projection publique ne porte AUCUN champ réservé au diagnostic
select count(*)=0 as t10_public_has_no_diagnostic_only
from information_schema.columns
where table_schema='catalog_api' and table_name='published_tool_projection'
  and column_name in ('prescription_output','prescription_block_reasons',
                      'prescription_context_questions','decision_policy_v3',
                      'force_silence','pertinence_by_persona');

-- rév.4.2 — T10b : aucun objet Diagnostic n'est déployé dans le périmètre actuel
select to_regclass('catalog_api.diagnostic_tool_projection') is null
  as t10b_diagnostic_deferred;

-- rév.4 — T10c : les champs consommés hors diagnostic restent publics
select count(*)=6 as t10c_public_keeps_shared
from information_schema.columns
where table_schema='catalog_api' and table_name='published_tool_projection'
  and column_name in ('prescription_quality','functional_needs','verticals',
                      'host_app','bundle_parent','substitution_cluster_v2');
```

**Résultats conceptuels attendus après toutes les décisions humaines et bascules pilotes** (5 canonical + 3 legacy). Ce tableau n'est pas l'état actuel : Wix est encore `observed/needs_review`, sans attestation active ni approbation ; Squarespace n'est pas davantage approuvé dans cette session.

| tool | data_contract | compare_native_amount | compare_monthly_eur | eur_is_legacy_conv | price_status |
|---|---|---|---|---|---|
| framer | canonical | null | null | false | needs_review |
| figma | canonical | null | null | false | needs_review |
| webflow | canonical | 15 USD | (converti daté) | false | approved |
| wix | canonical | 16.80 EUR | 16.80 | false | approved |
| squarespace | canonical | 12 EUR | 12 | false | approved |
| notion | legacy | null | 9.5 | true | legacy |
| calendly | legacy | null | 8.66 | true | legacy |
| loom | legacy | null | 15.59 | true | legacy |

## Rollback
- Par outil : `data_contract='canonical'→'legacy'` (retour instantané aux colonnes historiques).
- Nouvelles tables additives : `drop` sans toucher `public.tools`.
- Aucun rollback de policy `public.tools` n'est requis : aucune restriction n'est incluse dans cette révision.
- Snapshot « last known good » (hash+commit) conservé comme artefact.

## Décisions avant DDL
- **D7** valider les 6 artefacts rév. 4.10 après test PostgreSQL complet A1+A4+A5, avec import sans perte, basis réauditables, ledger privé et Diagnostic explicitement différé.
- **D9** Figma/Framer `needs_review` confirmé (prix public null).
- **D11** valider `manifest-1126` (sha256 `9d0e3f59…`, commit `dbea365…`) comme liste de publication.
- **D12** valider l'architecture `catalog_private`/`catalog_api` + `catalog_owner` NOLOGIN sans BYPASSRLS + vue `security_barrier`.

**Rien n'est appliqué. Arrêt après génération des artefacts.**
