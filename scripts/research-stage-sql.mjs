import { createHash } from "node:crypto";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

/**
 * Génère un script PostgreSQL de répétition générale. Il finit toujours par
 * ROLLBACK et ne contient aucun chemin COMMIT. Le script n'est pas exécuté ici.
 */
export function generateStageDryRunSql(proposal) {
  if (proposal?.mode !== "STAGING_PROPOSAL_ONLY") throw new Error("SQL dry-run: mode de proposition invalide");
  if (proposal.approved_rows !== 0) throw new Error("SQL dry-run: approved_rows doit être 0");
  const json = JSON.stringify(proposal);
  const payloadTag = `p_${sha256(json).slice(0, 16)}`;
  const payloadQuote = `$${payloadTag}$`;
  if (json.includes(payloadQuote)) throw new Error("SQL dry-run: collision de dollar quote");

  return `-- GENERATED / STAGING DRY-RUN ONLY
-- tool=${proposal.tool_id} proposal_hash=${proposal.proposal_hash}
-- Ce script exige le DDL rév. 4.6 et se termine volontairement par ROLLBACK.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $tooltrim_import$
declare
  p jsonb := ${payloadQuote}${json}${payloadQuote}::jsonb;
  r jsonb;
  v_tool_id text := p->>'tool_id';
  v_tool_slug text := p->>'tool_slug';
  v_source_id uuid;
  v_capture_id uuid;
  v_plan_id uuid;
  v_existing_compare text;
begin
  if p->>'mode' <> 'STAGING_PROPOSAL_ONLY' or (p->>'approved_rows')::int <> 0 then
    raise exception 'staging proposal must be STAGING_PROPOSAL_ONLY with zero approved rows';
  end if;
  if not exists (
    select 1 from public.tools t
    join catalog_private.published_manifest m on m.slug=t.slug
    where t.id=v_tool_id and t.slug=v_tool_slug and t.content_status='published'
  ) then raise exception 'tool % is not in the materialized published manifest', v_tool_id; end if;

  perform pg_advisory_xact_lock(pg_catalog.hashtextextended('tooltrim-stage:' || v_tool_id, 0));

  -- 1. Identités de sources (métadonnées courantes) puis captures immuables.
  for r in select value from jsonb_array_elements(p#>'{tables,tool_sources}') loop
    insert into catalog_private.tool_sources
      (tool_id,collector_id,url,domain,source_type,source_tier,is_official,collector_payload)
    values
      (v_tool_id,r->>'collector_id',r->>'url',r->>'domain',r->>'source_type',
       nullif(r->>'source_tier','')::smallint,nullif(r->>'is_official','')::boolean,
       coalesce(r->'collector_payload','{}'::jsonb))
    on conflict (tool_id,collector_id) do update set
      domain=excluded.domain, source_type=excluded.source_type,
      source_tier=excluded.source_tier, is_official=excluded.is_official,
      collector_payload=excluded.collector_payload
    where catalog_private.tool_sources.url=excluded.url;
    if not found then raise exception 'source collector_id reused with another URL: %', r->>'collector_id'; end if;
  end loop;

  for r in select value from jsonb_array_elements(p#>'{tables,tool_source_captures}') loop
    select s.id into strict v_source_id from catalog_private.tool_sources s
      where s.tool_id=v_tool_id and s.collector_id=r->>'source_collector_id';
    insert into catalog_private.tool_source_captures
      (source_id,collector_id,accessed_at,http_status,title,content_hash,rendered_by,
       observed_market,observed_locale,market_context,is_accessible,notes,collector_payload)
    values
      (v_source_id,r->>'collector_id',(r->>'accessed_at')::timestamptz,
       nullif(r->>'http_status','')::int,r->>'title',r->>'content_hash',r->>'rendered_by',
       r->>'observed_market',r->>'observed_locale',r->>'market_context',
       nullif(r->>'is_accessible','')::boolean,r->>'notes',coalesce(r->'collector_payload','{}'::jsonb))
    on conflict (source_id,collector_id) do nothing;
    if not exists (select 1 from catalog_private.tool_source_captures c
                   where c.source_id=v_source_id and c.collector_id=r->>'collector_id'
                     and c.content_hash is not distinct from r->>'content_hash')
    then raise exception 'capture identity collision: %', r->>'collector_id'; end if;
  end loop;

  -- 2. Faisceaux machine et actes humains : insertions immuables.
  for r in select value from jsonb_array_elements(p#>'{tables,tool_context_attestations}') loop
    select c.id into strict v_capture_id
      from catalog_private.tool_source_captures c
      join catalog_private.tool_sources s on s.id=c.source_id
      where s.tool_id=v_tool_id and c.collector_id=r->>'capture_collector_id';
    insert into catalog_private.tool_context_attestations
      (id,tool_id,capture_id,source_url,content_hash,accessed_at,payload)
    values
      (r->>'id',v_tool_id,v_capture_id,r->>'source_url',r->>'content_hash',
       (r->>'accessed_at')::timestamptz,r->'payload')
    on conflict (id) do nothing;
    if not exists (select 1 from catalog_private.tool_context_attestations a
                   where a.id=r->>'id' and a.tool_id=v_tool_id and a.capture_id=v_capture_id
                     and a.payload=r->'payload')
    then raise exception 'context attestation collision: %', r->>'id'; end if;
  end loop;

  for r in select value from jsonb_array_elements(p#>'{tables,tool_review_attestations}') loop
    select c.id into strict v_capture_id
      from catalog_private.tool_source_captures c
      join catalog_private.tool_sources s on s.id=c.source_id
      where s.tool_id=v_tool_id and c.collector_id=r->>'capture_collector_id';
    insert into catalog_private.tool_review_attestations
      (id,tool_id,attestation_type,value_json,basis_attestation_id,capture_id,
       content_hash,source_url,attested_by,attested_at,note,collector_payload)
    values
      (r->>'id',v_tool_id,r->>'attestation_type',r->'value_json',r->>'basis_attestation_id',
       v_capture_id,r->>'content_hash',r->>'source_url',r->>'attested_by',
       (r->>'attested_at')::timestamptz,r->>'note',coalesce(r->'collector_payload','{}'::jsonb))
    on conflict (id) do nothing;
    if not exists (select 1 from catalog_private.tool_review_attestations a
                   where a.id=r->>'id' and a.tool_id=v_tool_id
                     and a.basis_attestation_id=r->>'basis_attestation_id'
                     and a.collector_payload=coalesce(r->'collector_payload','{}'::jsonb))
    then raise exception 'review attestation collision: %', r->>'id'; end if;
  end loop;

  -- 3. Plans. Changer le plan comparatif existant exige une décision séparée.
  select p0.plan_key into v_existing_compare from catalog_private.tool_plans p0
    where p0.tool_id=v_tool_id and p0.is_compare_plan limit 1;
  if v_existing_compare is not null and v_existing_compare is distinct from (
    select x->>'plan_key' from jsonb_array_elements(p#>'{tables,tool_plans}') x
    where (x->>'is_compare_plan')::boolean limit 1
  ) then raise exception 'compare plan change requires a separate reviewed migration'; end if;

  for r in select value from jsonb_array_elements(p#>'{tables,tool_plans}') loop
    select p0.id into v_plan_id from catalog_private.tool_plans p0
      where p0.tool_id=v_tool_id and p0.plan_key=r->>'plan_key'
        and p0.seat_type is not distinct from r->>'seat_type';
    if v_plan_id is null then
      insert into catalog_private.tool_plans
        (tool_id,plan_key,seat_type,pricing_unit,is_free,is_compare_plan,display_order)
      values
        (v_tool_id,r->>'plan_key',r->>'seat_type',r->>'pricing_unit',
         (r->>'is_free')::boolean,(r->>'is_compare_plan')::boolean,(r->>'display_order')::int)
      returning id into v_plan_id;
    else
      update catalog_private.tool_plans set
        pricing_unit=r->>'pricing_unit', is_free=(r->>'is_free')::boolean,
        is_compare_plan=(r->>'is_compare_plan')::boolean,
        display_order=(r->>'display_order')::int, updated_at=now()
      where id=v_plan_id;
    end if;
  end loop;

  -- 4. Faits observés uniquement. Une reconfirmation ne réécrit que sa fraîcheur/payload.
  for r in select value from jsonb_array_elements(p#>'{tables,tool_price_observations}') loop
    select p0.id into strict v_plan_id from catalog_private.tool_plans p0
      where p0.tool_id=v_tool_id and p0.plan_key=r#>>'{plan_ref,plan_key}'
        and p0.seat_type is not distinct from r#>>'{plan_ref,seat_type}';
    select c.id into strict v_capture_id
      from catalog_private.tool_source_captures c
      join catalog_private.tool_sources s on s.id=c.source_id
      where s.tool_id=v_tool_id and c.collector_id=r->>'capture_collector_id';
    insert into catalog_private.tool_price_observations
      (plan_id,collector_id,native_amount,native_currency,billing_period,billing_commitment,
       tax_inclusion,observed_market,observed_locale,market_context,market_context_candidate,
       market_context_source,market_evidence,evidence_excerpt,evidence_selector,observed_on,
       last_confirmed_on,capture_id,context_attestation_id,approval_event_id,confidence,
       review_status,collector_payload)
    values
      (v_plan_id,r->>'collector_id',nullif(r->>'native_amount','')::numeric,r->>'native_currency',
       r->>'billing_period',r->>'billing_commitment',r->>'tax_inclusion',r->>'observed_market',
       r->>'observed_locale',r->>'market_context',r->>'market_context_candidate',
       r->>'market_context_source',r->'market_evidence',r->>'evidence_excerpt',
       r->>'evidence_selector',(r->>'observed_on')::date,(r->>'last_confirmed_on')::date,
       v_capture_id,r->>'context_attestation_id',null,r->>'confidence','observed',
       coalesce(r->'collector_payload','{}'::jsonb))
    on conflict (plan_id,collector_id) do update set
      last_confirmed_on=greatest(catalog_private.tool_price_observations.last_confirmed_on,
                                 excluded.last_confirmed_on),
      collector_payload=excluded.collector_payload, updated_at=now()
    where catalog_private.tool_price_observations.review_status <> 'approved';
  end loop;

  for r in select value from jsonb_array_elements(p#>'{tables,tool_claims}') loop
    select c.id into strict v_capture_id
      from catalog_private.tool_source_captures c
      join catalog_private.tool_sources s on s.id=c.source_id
      where s.tool_id=v_tool_id and c.collector_id=r->>'capture_collector_id';
    insert into catalog_private.tool_claims
      (tool_id,collector_id,claim_key,value_json,capture_id,observed_market,observed_locale,
       market_context,market_context_candidate,confidence,volatility,observed_on,status,
       evidence_note,collector_payload)
    values
      (v_tool_id,r->>'collector_id',r->>'claim_key',r->'value_json',v_capture_id,
       r->>'observed_market',r->>'observed_locale',r->>'market_context',
       r->>'market_context_candidate',r->>'confidence',r->>'volatility',
       nullif(r->>'observed_on','')::date,'observed',r->>'evidence_note',
       coalesce(r->'collector_payload','{}'::jsonb))
    on conflict (tool_id,collector_id) do nothing;
  end loop;

  for r in select value from jsonb_array_elements(p#>'{tables,tool_plan_localizations}') loop
    select p0.id into strict v_plan_id from catalog_private.tool_plans p0
      where p0.tool_id=v_tool_id and p0.plan_key=r#>>'{plan_ref,plan_key}'
        and p0.seat_type is not distinct from r#>>'{plan_ref,seat_type}';
    select c.id into strict v_capture_id
      from catalog_private.tool_source_captures c
      join catalog_private.tool_sources s on s.id=c.source_id
      where s.tool_id=v_tool_id and c.collector_id=r->>'capture_collector_id';
    insert into catalog_private.tool_plan_localizations
      (plan_id,collector_id,locale,display_name,capture_id,observed_on,status)
    values
      (v_plan_id,r->>'collector_id',r->>'locale',r->>'display_name',v_capture_id,
       (r->>'observed_on')::date,'observed')
    on conflict (plan_id,collector_id) do nothing;
  end loop;

  -- 5. Contenu éditorial importé en draft uniquement. Sa publication reste
  -- une décision humaine distincte et précède obligatoirement la bascule.
  for r in select value from jsonb_array_elements(p#>'{tables,tool_editorial_content}') loop
    if r->>'status' <> 'draft' then
      raise exception 'staging importer refuses editorial status %', r->>'status';
    end if;
    insert into catalog_private.tool_editorial_content
      (tool_id,lang,content_version,short_description,long_description,covers,use_cases,
       pros,cons,verdict,relevant_for,seo,gallery_images,ai_angle,pricing_guidance,
       status,author,reviewed_by,published_at,content_hash)
    values
      (v_tool_id,r->>'lang',(r->>'content_version')::int,r->>'short_description',
       r->>'long_description',nullif(r->'covers','null'::jsonb),
       nullif(r->'use_cases','null'::jsonb),nullif(r->'pros','null'::jsonb),
       nullif(r->'cons','null'::jsonb),nullif(r->'verdict','null'::jsonb),
       nullif(r->'relevant_for','null'::jsonb),nullif(r->'seo','null'::jsonb),
       nullif(r->'gallery_images','null'::jsonb),nullif(r->'ai_angle','null'::jsonb),
       nullif(r->'pricing_guidance','null'::jsonb),'draft',r->>'author',null,null,
       r->>'content_hash')
    on conflict (tool_id,lang,content_version) do nothing;
    if not exists (select 1 from catalog_private.tool_editorial_content ec
                   where ec.tool_id=v_tool_id and ec.lang=r->>'lang'
                     and ec.content_version=(r->>'content_version')::int
                     and ec.content_hash=r->>'content_hash')
    then raise exception 'editorial version collision: %/%', v_tool_id, r->>'lang'; end if;
  end loop;

  -- 6. Relations proposées : cible publiée, explication et provenance conservées.
  for r in select value from jsonb_array_elements(p#>'{tables,tool_relationships}') loop
    if not exists (
      select 1 from public.tools t
      join catalog_private.published_manifest m on m.slug=t.slug
      where t.id=r->>'related_tool_id' and t.slug=r->>'related_tool_slug'
        and t.content_status='published'
    ) then raise exception 'relationship target is not published: %', r->>'related_tool_id'; end if;
    if r->>'status' not in ('proposed','rejected')
    then raise exception 'staging importer refuses relationship status %', r->>'status'; end if;
    v_capture_id := null;
    if r->>'capture_collector_id' is not null then
      select c.id into strict v_capture_id
        from catalog_private.tool_source_captures c
        join catalog_private.tool_sources s on s.id=c.source_id
        where s.tool_id=v_tool_id and c.collector_id=r->>'capture_collector_id';
    end if;
    insert into catalog_private.tool_relationships
      (tool_id,related_tool_id,collector_id,rel_type,direction,reason_fr,reason_en,
       capture_id,confidence,observed_on,verified_at,approval_event_id,status,collector_payload)
    values
      (v_tool_id,r->>'related_tool_id',r->>'collector_id',r->>'rel_type',r->>'direction',
       r->>'reason_fr',r->>'reason_en',v_capture_id,r->>'confidence',
       nullif(r->>'observed_on','')::date,null,null,r->>'status',
       coalesce(r->'collector_payload','{}'::jsonb))
    on conflict (tool_id,collector_id) do nothing;
  end loop;

  -- 7. Le ledger vient après ses sujets. Ici, uniquement révocation/incident de contexte.
  for r in select value from jsonb_array_elements(p#>'{tables,tool_review_events}') loop
    if r->>'event_type' not in ('attestation_revoked','incident_recorded')
    then raise exception 'staging importer refuses event type %', r->>'event_type'; end if;
    insert into catalog_private.tool_review_events
      (id,tool_id,event_type,subject_type,subject_id,attestation_id,actor,occurred_at,reason,payload)
    values
      (r->>'id',v_tool_id,r->>'event_type',r->>'subject_type',r->>'subject_id',
       r->>'attestation_id',r->>'actor',(r->>'occurred_at')::timestamptz,
       r->>'reason',coalesce(r->'payload','{}'::jsonb))
    on conflict (id) do nothing;
  end loop;

  if exists (
    select 1 from catalog_private.tool_price_observations o
    join catalog_private.tool_plans p0 on p0.id=o.plan_id
    join jsonb_array_elements(p#>'{tables,tool_price_observations}') x
      on x->>'collector_id'=o.collector_id
    where p0.tool_id=v_tool_id and o.review_status='approved'
  ) or exists (
    select 1 from catalog_private.tool_claims c
    join jsonb_array_elements(p#>'{tables,tool_claims}') x on x->>'collector_id'=c.collector_id
    where c.tool_id=v_tool_id and c.status='approved'
  ) or exists (
    select 1 from catalog_private.tool_relationships rel
    join jsonb_array_elements(p#>'{tables,tool_relationships}') x on x->>'collector_id'=rel.collector_id
    where rel.tool_id=v_tool_id and rel.status='approved'
  ) then raise exception 'staging import touched an approved fact'; end if;
end
$tooltrim_import$;

-- Preuves visibles dans la transaction, puis annulation obligatoire.
select '${proposal.proposal_hash}'::text as proposal_hash,
       '${proposal.tool_id}'::text as tool_id,
       (select count(*) from catalog_private.tool_sources where tool_id='${proposal.tool_id}') as sources_after,
       (select count(*) from catalog_private.tool_plans where tool_id='${proposal.tool_id}') as plans_after,
       (select count(*) from catalog_private.tool_claims where tool_id='${proposal.tool_id}') as claims_after;
rollback;
`;
}
