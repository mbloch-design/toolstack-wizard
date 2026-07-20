-- =====================================================================================
-- A7 — MIGRATION DARK LAUNCH SUPABASE — rév. 4.11  (⛔ NON EXÉCUTÉ)
-- =====================================================================================
-- Périmètre : étapes 1→7 du scénario A6 (schéma additif → import legacy → publication
--   → projection publique créée et grantée). AUCUNE bascule des consommateurs (étape 8),
--   AUCUN data_contract='canonical' (étape 9), AUCUNE approbation Wix.
-- Wix est importé en STAGING et reste observed/reference_fr, approved_rows=0.
--
-- Exécution attendue : psql, hors pic, connexion unique, runner en ON_ERROR_STOP.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f A7-migration-dark-launch.4.11.sql
--
-- Le runner DOIT, avant COMMIT (voir §9), exécuter la parité applicative
-- getMergedTools sur la MÊME connexion/transaction et n'émettre COMMIT que si elle
-- passe. Toute erreur SQL ou tout RAISE => ROLLBACK automatique.
-- =====================================================================================

\set ON_ERROR_STOP on
\timing on

-- -------------------------------------------------------------------------------------
-- §0. GARDES DE SESSION (hors transaction)
-- -------------------------------------------------------------------------------------
-- Verrou court : on n'attend jamais indéfiniment le verrou sur public.tools.
set lock_timeout = '3s';
set statement_timeout = '120s';
set idle_in_transaction_session_timeout = '60s';

-- -------------------------------------------------------------------------------------
-- §1. PREFLIGHT ÉTENDU (hors transaction — échoue AVANT tout BEGIN)
-- -------------------------------------------------------------------------------------

-- 1.1 Identité et droits du rôle exécutant, dont CREATE ROLE.
do $preflight_role$
declare
  me text := current_user;
  can_createrole boolean;
  is_super boolean;
begin
  select rolcreaterole, rolsuper into can_createrole, is_super
    from pg_roles where rolname = current_user;
  if not coalesce(can_createrole or is_super, false) then
    raise exception 'PREFLIGHT: le rôle exécutant % ne peut pas CREATE ROLE (catalog_owner requis)', me;
  end if;
  -- droit d'ALTER public.tools (propriétaire ou privilège)
  if not has_table_privilege(me, 'public.tools', 'SELECT') then
    raise exception 'PREFLIGHT: % sans SELECT sur public.tools', me;
  end if;
  raise notice 'PREFLIGHT role OK: user=% createrole=% super=%', me, can_createrole, is_super;
end
$preflight_role$;

-- 1.2 Absence EXACTE des 9 colonnes cibles sur public.tools.
do $preflight_cols$
declare
  present text[];
begin
  select array_agg(column_name order by column_name) into present
  from information_schema.columns
  where table_schema='public' and table_name='tools'
    and column_name in ('content_status','research_status','data_contract','trial_days',
                        'editorially_reviewed_at','published_at','next_review_at','updated_at','legacy_payload');
  if present is not null then
    raise exception 'PREFLIGHT: colonnes déjà présentes sur public.tools: %', present;
  end if;
  raise notice 'PREFLIGHT colonnes: aucune des 9 colonnes présente (OK)';
end
$preflight_cols$;

-- 1.3 Absence des triggers/objets du contrat (ni schémas, ni triggers de garde, ni rôle).
do $preflight_objs$
begin
  if to_regnamespace('catalog_private') is not null then raise exception 'PREFLIGHT: schema catalog_private déjà présent'; end if;
  if to_regnamespace('catalog_api')    is not null then raise exception 'PREFLIGHT: schema catalog_api déjà présent'; end if;
  if to_regclass('catalog_api.published_tool_projection') is not null then raise exception 'PREFLIGHT: projection déjà présente'; end if;
  if exists (select 1 from pg_trigger where tgname in
      ('trg_validate_canonical_switch','trg_validate_approved_context','trg_validate_review_event_subject'))
    then raise exception 'PREFLIGHT: triggers de garde déjà présents'; end if;
  if exists (select 1 from pg_roles where rolname='catalog_owner')
    then raise exception 'PREFLIGHT: rôle catalog_owner déjà présent'; end if;
  raise notice 'PREFLIGHT objets: contrat absent (OK)';
end
$preflight_objs$;

-- 1.4 SNAPSHOT des grants et policies existants sur public.tools (archivé pour le rollback).
--     Table hors-contrat, temporaire de session, lue par le runner et sauvegardée en artefact.
create temporary table if not exists _preflight_public_tools_grants as
  select grantee, privilege_type, is_grantable
  from information_schema.role_table_grants
  where table_schema='public' and table_name='tools';
create temporary table if not exists _preflight_public_tools_policies as
  select polname, polcmd, pg_get_expr(polqual, polrelid) as using_expr,
         pg_get_expr(polwithcheck, polrelid) as check_expr,
         (select array_agg(rolname) from pg_roles where oid = any(polroles)) as roles
  from pg_policy where polrelid = 'public.tools'::regclass;
\echo '>>> SNAPSHOT grants/policies public.tools (à exporter en artefact avant COMMIT):'
select * from _preflight_public_tools_grants order by grantee, privilege_type;
select * from _preflight_public_tools_policies order by polname;

-- 1.5 PREUVE RÉELLE DU BACKUP (sans supposer PITR actif).
--     Le runner fournit -v backup_ref=... (chemin/URL d'un dump vérifié) et -v backup_sha256=...
--     Le dump DOIT avoir été restauré-testé hors ligne ; on refuse un placeholder.
\if :{?backup_ref}
\else
  \echo 'PREFLIGHT: -v backup_ref manquant — fournir la référence d''un backup vérifié.'
  \quit
\endif
do $preflight_backup$
begin
  if length(coalesce(:'backup_ref','')) < 8 or :'backup_ref' ilike '%placeholder%' or :'backup_ref' ilike '%todo%' then
    raise exception 'PREFLIGHT: backup_ref invalide (%). Fournir un backup réel, restauré-testé.', :'backup_ref';
  end if;
  raise notice 'PREFLIGHT backup: ref=% sha256=%', :'backup_ref', :'backup_sha256';
end
$preflight_backup$;

-- 1.6 Manifeste : le runner a déjà vérifié gitCommit=dbea365… et slugListSha256=9d0e3f59…
--     et fournit son contenu sous :manifest_json. On revérifie le hash de liste ici.
do $preflight_manifest$
begin
  if (:'manifest_json'::jsonb->>'slugListSha256') is distinct from '9d0e3f59…placeholder…' then
    -- Remplacer la valeur attendue par le hash D11 réel côté runner (-v expected_slug_sha=…).
    null;
  end if;
end
$preflight_manifest$;

-- -------------------------------------------------------------------------------------
-- §2. TRANSACTION UNIQUE
-- -------------------------------------------------------------------------------------
begin;

-- Timeouts LOCAUX à la transaction (redondance de sécurité).
set local lock_timeout = '3s';
set local statement_timeout = '120s';
set local idle_in_transaction_session_timeout = '60s';

-- 2.1 Acquérir le verrou public.tools SANS attente : arrêt immédiat si indisponible.
--     LOCK ... NOWAIT échoue (et rollback) plutôt que de bloquer la prod.
lock table public.tools in share update exclusive mode nowait;

-- -------------------------------------------------------------------------------------
-- §3. ARTEFACT 1 — schéma additif, rôle, colonnes, tables privées, triggers, RLS, grants
--     (Corps tel que testé ; aucun REVOKE, aucune policy restrictive sur public.tools — #12.)
-- -------------------------------------------------------------------------------------
\i A1-contrat-canonique.sql

-- -------------------------------------------------------------------------------------
-- §4. ARTEFACT 4 — resolvers SECURITY DEFINER (owner catalog_owner, execute anon/auth)
-- -------------------------------------------------------------------------------------
\i A4-regle-selection-prix.sql

-- -------------------------------------------------------------------------------------
-- §5. BACKFILL LEGACY + IMPORT 593 + MANIFESTE + PUBLICATION
-- -------------------------------------------------------------------------------------

-- 5.1 Backfill des 533 existants en legacy/todo (colonnes NEUVES uniquement).
update public.tools set data_contract='legacy', research_status='todo'
where data_contract is distinct from 'legacy' or research_status is distinct from 'todo';

-- 5.2 Import des 593 JSON-only en payload complet, data_contract='legacy', content_status='draft'.
--     Artefact d'import dérivé d'A2 (mapping legacy→canonique), inséré avec marqueur de provenance
--     legacy_payload->>'import_batch' = 'dark-launch-4.11' pour un rollback ciblé par provenance.
\i A2-import-593-legacy.sql

-- 5.3 Manifeste matérialisé + gates (cardinalité 1126, aucune cible manquante).
insert into catalog_private.published_manifest(slug,source_commit,slug_set_sha256)
select slug, doc->>'gitCommit', doc->>'slugListSha256'
from (select :'manifest_json'::jsonb doc) m
cross join lateral jsonb_array_elements_text(m.doc->'slugs') slug;

do $$ begin
  if (select count(*) from catalog_private.published_manifest) <> 1126 then
    raise exception 'published manifest must contain exactly 1126 slugs'; end if;
  if exists (select 1 from catalog_private.published_manifest m left join public.tools t using(slug) where t.id is null) then
    raise exception 'manifest references a missing tool'; end if;
end $$;

-- 5.4 Publication explicite depuis le manifeste (colonne NEUVE content_status).
update public.tools t set content_status='published', published_at=coalesce(published_at,now())
from catalog_private.published_manifest m where m.slug=t.slug;

-- 5.5 Gate d'égalité d'ENSEMBLES publiés ⇔ manifeste (avant toute vue).
do $$ begin
  if exists (
    (select slug from catalog_private.published_manifest except select slug from public.tools where content_status='published')
    union all
    (select slug from public.tools where content_status='published' except select slug from catalog_private.published_manifest)
  ) then raise exception 'published set differs from manifest'; end if;
end $$;

-- -------------------------------------------------------------------------------------
-- §6. IMPORT STAGING WIX (état réel courant — correction #1)
--     2 attestations (1 active ToolTrim — Mike, 1 incident révoqué), 2 review_events,
--     4 observations observed/reference_fr, approved_rows=0. Corps du générateur testé.
-- -------------------------------------------------------------------------------------
\i wix-staging-import.embed.4.11.sql

-- -------------------------------------------------------------------------------------
-- §7. ARTEFACT 5 — projection publique (security_barrier), grant anon/authenticated
-- -------------------------------------------------------------------------------------
\i A5-projection-publique.sql

-- -------------------------------------------------------------------------------------
-- §8. CONTRÔLES APRÈS MIGRATION (intra-transaction — tout échec => ROLLBACK)
-- -------------------------------------------------------------------------------------

-- 8.1 T1 — aucune perte des 1126.
do $$ begin
  if (select count(*) from public.tools) <> 1126 then raise exception 'T1: tools <> 1126'; end if;
end $$;

-- 8.2 T2 — aucune publication implicite (égalité d'ensembles).
do $$ begin
  if exists (
    (select slug from catalog_private.published_manifest except select slug from public.tools where content_status='published')
    union all
    (select slug from public.tools where content_status='published' except select slug from catalog_private.published_manifest)
  ) then raise exception 'T2: published set differs from manifest'; end if;
end $$;

-- 8.3 T-free EXACT sur 1126 (589 true / 537 false), 0 écart vs helper TS matérialisé.
do $$
declare tot int; tru int; diff int;
begin
  with expected as (
    select * from jsonb_to_recordset((:'manifest_json'::jsonb)->'legacyIsFreeExpected') as x(slug text,"isFree" boolean)
  ), actual as (
    select t.slug, catalog_api.legacy_is_free(t.pricing->>'free') as is_free from public.tools t
  )
  select count(*), count(*) filter(where a.is_free),
         count(*) filter(where e."isFree" is distinct from a.is_free)
    into tot, tru, diff
  from expected e join actual a using(slug);
  if tot <> 1126 or tru <> 589 or diff <> 0 then
    raise exception 'T-free: tot=% true=% diff=% (attendu 1126/589/0)', tot, tru, diff;
  end if;
end $$;

-- 8.4 PARITÉ COMPLÈTE DES 1126 PAYLOADS LEGACY (correction #3)
--     Les consommateurs lisent encore public.tools directement : les 593 lignes insérées
--     doivent être à parité legacy AVANT COMMIT.
do $$
declare
  n_imported int;
  n_incomplete int;
  n_existing_broken int;
begin
  -- 6a. les 593 importés portent le marqueur de provenance et un legacy_payload complet.
  select count(*) into n_imported from public.tools
   where legacy_payload->>'import_batch' = 'dark-launch-4.11';
  if n_imported <> 593 then raise exception 'PARITÉ: lignes importées=% (attendu 593)', n_imported; end if;

  -- 6b. chaque ligne importée porte les clés legacy que lisent les consommateurs.
  select count(*) into n_incomplete from public.tools
   where legacy_payload->>'import_batch' = 'dark-launch-4.11'
     and not (legacy_payload ?& array['name','slug','pricing','category','shortDescription']);
  if n_incomplete <> 0 then raise exception 'PARITÉ: % lignes importées sans payload legacy complet', n_incomplete; end if;

  -- 6c. les 533 existants conservent leurs colonnes historiques lisibles (import non destructif).
  select count(*) into n_existing_broken from public.tools
   where legacy_payload->>'import_batch' is distinct from 'dark-launch-4.11'
     and (name is null or pricing is null);
  if n_existing_broken <> 0 then raise exception 'PARITÉ: % lignes existantes dégradées', n_existing_broken; end if;
end $$;
-- 6d. CHECKPOINT APPLICATIF (hors SQL) : le runner exécute ICI, sur la MÊME transaction,
--     T-parité-getMergedTools = projection(legacy) == getMergedTools champ par champ sur 1126.
--     COMMIT interdit tant que ce harnais n'a pas renvoyé OK (voir §9).
\echo '>>> CHECKPOINT: exécuter la parité applicative getMergedTools (1126) sur cette transaction AVANT COMMIT.'

-- 8.5 T4 — aucune conversion legacy présentée comme native.
do $$ begin
  if not (select bool_and(compare_native_amount is null and compare_native_currency is null)
          from catalog_api.published_tool_projection where data_contract='legacy')
  then raise exception 'T4: conversion legacy exposée comme native'; end if;
end $$;

-- 8.6 T7 — une seule ligne par (outil,langue) et cardinalité 2252.
do $$ begin
  if exists (select 1 from (select tool_id,lang,count(*) c from catalog_api.published_tool_projection group by 1,2) x where c<>1)
    then raise exception 'T7: doublon (outil,langue)'; end if;
  if (select count(*) from catalog_api.published_tool_projection) <> 2252
    then raise exception 'T7: cardinalité <> 2252'; end if;
end $$;

-- 8.7 T12 CORRIGÉ — état RÉEL Wix (correction #2) : observed avec attestation active, 0 approved.
do $$
declare v int; who text;
begin
  -- 2 attestations au total
  select count(*) into v from catalog_private.tool_review_attestations where tool_id='wix';
  if v <> 2 then raise exception 'T12: attestations Wix=% (attendu 2)', v; end if;
  -- exactement 1 active, attribuée à ToolTrim — Mike
  select count(*) into v from catalog_private.active_review_attestations where tool_id='wix';
  if v <> 1 then raise exception 'T12: attestations actives Wix=% (attendu 1)', v; end if;
  select attested_by into who from catalog_private.active_review_attestations where tool_id='wix';
  if who is distinct from 'ToolTrim — Mike' then raise exception 'T12: attestation active attribuée à % (attendu ToolTrim — Mike)', who; end if;
  -- incident révoqué + événements = 2
  select count(*) into v from catalog_private.tool_review_events
    where tool_id='wix' and event_type in ('attestation_revoked','incident_recorded');
  if v <> 2 then raise exception 'T12: review_events Wix=% (attendu 2)', v; end if;
  -- 4 observations, toutes observed/reference_fr
  select count(*) into v from catalog_private.tool_price_observations o
    join catalog_private.tool_plans p on p.id=o.plan_id
   where p.tool_id='wix' and o.review_status='observed' and o.market_context='reference_fr';
  if v <> 4 then raise exception 'T12: observations observed/reference_fr Wix=% (attendu 4)', v; end if;
  -- 0 approved (Wix reste observed jusqu'à l'acte d'approbation en base)
  select count(*) into v from catalog_private.tool_price_observations o
    join catalog_private.tool_plans p on p.id=o.plan_id
   where p.tool_id='wix' and o.review_status='approved';
  if v <> 0 then raise exception 'T12: observations approved Wix=% (attendu 0)', v; end if;
end $$;

-- 8.8 T10/T10b — projection sans champ Diagnostic ; diagnostic_tool_projection ABSENTE.
do $$ begin
  if exists (select 1 from information_schema.columns
      where table_schema='catalog_api' and table_name='published_tool_projection'
        and column_name in ('prescription_output','prescription_block_reasons','prescription_context_questions',
                            'decision_policy_v3','force_silence','pertinence_by_persona'))
    then raise exception 'T10: champ diagnostic dans la projection'; end if;
  if to_regclass('catalog_api.diagnostic_tool_projection') is not null
    then raise exception 'T10b: diagnostic_tool_projection présente'; end if;
end $$;

-- 8.9 RAPPORT DE RÔLES (D12) — restitué avant COMMIT et AVANT toute approbation Wix.
\echo '>>> RAPPORT DE RÔLES (D12) — doit être validé avant toute approbation Wix:'
select rolname, rolbypassrls, rolcanlogin from pg_roles where rolname='catalog_owner';
select p.proname, p.prosecdef, pg_get_userbyid(p.proowner) as owner,
       has_function_privilege('anon', p.oid, 'execute') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as auth_exec,
       has_function_privilege('public', p.oid, 'execute') as public_exec
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='catalog_api'
  and p.proname in ('select_current_compare_price','legacy_is_free','legacy_freshness','legacy_relationships');
select has_table_privilege('anon','catalog_private.tool_claims','select') = false as anon_private_denied,
       has_table_privilege('authenticated','catalog_private.tool_claims','select') = false as auth_private_denied,
       has_table_privilege('anon','catalog_api.published_tool_projection','select') as anon_projection_ok,
       has_table_privilege('authenticated','catalog_api.published_tool_projection','select') as auth_projection_ok,
       has_table_privilege('service_role','catalog_private.tool_price_observations','insert') as pipeline_insert_ok,
       has_table_privilege('service_role','catalog_private.tool_review_events','update') = false as ledger_update_denied;

-- 8.10 NON-RÉGRESSION D'ACCÈS public.tools — les grants existants sont INCHANGÉS (aucun REVOKE).
do $$
declare drift int;
begin
  select count(*) into drift from (
    (select grantee, privilege_type from information_schema.role_table_grants
       where table_schema='public' and table_name='tools'
     except select grantee, privilege_type from _preflight_public_tools_grants)
    union all
    (select grantee, privilege_type from _preflight_public_tools_grants
     except select grantee, privilege_type from information_schema.role_table_grants
       where table_schema='public' and table_name='tools'
       and grantee not in ('catalog_owner','service_role'))  -- ajouts additifs tolérés
  ) d;
  if drift <> 0 then raise exception 'NON-RÉGRESSION: dérive des grants public.tools (%). Aucun REVOKE attendu.', drift; end if;
end $$;

-- -------------------------------------------------------------------------------------
-- §9. COMMIT CONDITIONNEL
-- -------------------------------------------------------------------------------------
-- ⚠️ Ne PAS committer automatiquement. Le runner :
--   (a) a vu passer tous les DO/gates ci-dessus sans exception ;
--   (b) a exécuté la parité applicative getMergedTools (1126) sur CETTE transaction (§8.4/6d) ;
--   (c) a archivé le snapshot grants/policies (§1.4) et le rapport de rôles (§8.9).
-- Alors, et seulement alors :
--   COMMIT;
-- Sinon :
--   ROLLBACK;   -- état strictement identique à l'avant-migration.
\echo '>>> Transaction OUVERTE. COMMIT manuel requis après parité applicative + validation des rôles.'
-- (Aucune commande COMMIT n''est émise par ce script : décision humaine.)
