# Artefact 4/6 — Règle de sélection du prix public + resolvers (**NON EXÉCUTÉ**)

> Rév. 4.9. Corrections : `is_free` dans le resolver · ligne `needs_review` garantie · classement **FR/fr-FR → fallback mondial → autres** · `p_ref_locale` · portage **exact** de `hasGenuineFreeTier` + test de parité 1126 · dates exactes de première observation et de dernière reconfirmation pour les consommateurs/SEO.
>
> **Rév. 4 — sécurité d'exécution.** Tous les resolvers appelés par `catalog_api.published_tool_projection` sont `SECURITY DEFINER`, propriétaire **`catalog_owner`** (NOLOGIN / NOBYPASSRLS), avec `SET search_path` sûr et objets **entièrement qualifiés**, puis `REVOKE … FROM PUBLIC` et `GRANT EXECUTE TO anon, authenticated`. Sans cela la vue échouait sous `anon` (fonctions non inlinables : CTE/LIMIT).
> `catalog_owner` n'ayant pas BYPASSRLS, les fonctions restent soumises à la policy `catalog_owner_read` (A1) : le `SECURITY DEFINER` n'accorde que les droits de `catalog_owner`, pas un contournement de RLS.

## `select_current_compare_price` — prix comparatif courant

```sql
-- ⛔ BROUILLON NON EXÉCUTÉ. Rôle: catalog_owner.
create or replace function catalog_api.select_current_compare_price(
  p_tool_id text,
  p_ref_market  text default 'FR',
  p_ref_locale  text default 'fr-FR'
) returns table(
  plan_key text, is_free boolean, pricing_unit text,
  native_amount numeric, native_currency text, billing_commitment text, billing_period text,
  tax_inclusion text, normalized_monthly_eur numeric, observed_market text, observed_locale text,
  observed_on date, last_confirmed_on date,
  price_status text, freshness text, source_url text
) language sql stable
  security definer
  set search_path = pg_catalog, catalog_private, public
as $$
  -- rév.4.1 — GARDE DE PUBLICATION : la fonction étant SECURITY DEFINER et
  -- exécutable par anon, elle ne doit rien divulguer d'un outil non publié.
  with pub as (
    select t.id from public.tools t
    where t.id = p_tool_id and t.content_status = 'published'
  ),
  plan as (
    -- Toujours une ligne : `is_free` signifie "l'outil possède au moins un
    -- plan gratuit durable", pas "le plan de comparaison est gratuit".
    -- Si l'outil n'est pas publié : plan_key / is_free / pricing_unit restent
    -- NULL (aucune donnée privée) et la ligne unique sort en needs_review.
    select cp.id,cp.plan_key,
           case when exists (select 1 from pub)
                then coalesce((select bool_or(p.is_free) from catalog_private.tool_plans p
                                where p.tool_id=p_tool_id),false)
           end as is_free,
           cp.pricing_unit
    from (values(1)) seed(n)
    left join lateral (
      select p.id,p.plan_key,p.pricing_unit from catalog_private.tool_plans p
      where p.tool_id=p_tool_id and p.is_compare_plan
        and exists (select 1 from pub)          -- garde: outil publié uniquement
      limit 1
    ) cp on true
  ),
  ranked as (
    select o.*, s.url as source_url,
      -- CLASSEMENT: 0 = FR/fr-FR exact, 1 = fallback mondial, 2 = autres
      case
        when lower(coalesce(o.observed_market,'')) = lower(coalesce(p_ref_market,''))
         and lower(coalesce(o.observed_locale,'')) = lower(coalesce(p_ref_locale,'')) then 0
        when o.market_context = 'global_usd_fallback' then 1
        else 2
      end as ctx_rank
    from catalog_private.tool_price_observations o
    left join catalog_private.tool_source_captures c on c.id = o.capture_id
    left join catalog_private.tool_sources s on s.id = c.source_id
    where o.plan_id = (select id from plan) and o.review_status = 'approved'
  ),
  pick as (
    select * from ranked
    order by ctx_rank asc,
             (billing_commitment = 'annual_prepaid') desc,   -- aligné affichage fournisseur
             coalesce(last_confirmed_on, observed_on) desc
    limit 1
  )
  -- LIGNE UNIQUE GARANTIE : left join depuis le plan (ou dummy) vers l'observation choisie.
  select
    pl.plan_key,
    pl.is_free,                       -- #is_free au resolver
    pl.pricing_unit,
    pk.native_amount, pk.native_currency, pk.billing_commitment, pk.billing_period,
    pk.tax_inclusion, pk.normalized_monthly_eur, pk.observed_market, pk.observed_locale,
    pk.observed_on, pk.last_confirmed_on,
    case when pk.id is null then 'needs_review' else 'approved' end as price_status,  -- #needs_review garanti
    case when coalesce(pk.last_confirmed_on,pk.observed_on) is null then 'unknown'
         when coalesce(pk.last_confirmed_on,pk.observed_on) < current_date - interval '90 days' then 'stale'
         else 'fresh' end as freshness,
    pk.source_url
  from plan pl
  left join (select * from pick) pk on true;
$$;

revoke all on function catalog_api.select_current_compare_price(text,text,text) from public;
grant execute on function catalog_api.select_current_compare_price(text,text,text) to anon, authenticated;
alter function catalog_api.select_current_compare_price(text,text,text) owner to catalog_owner;
```

Comportement : **exactement une ligne**. Si aucun plan de comparaison ou aucune observation `approved` (cas **framer/figma**) → `native_amount=null`, `price_status='needs_review'`. `is_free` indique l'existence d'au moins un plan gratuit durable sur l'outil, indépendamment du plan de comparaison. La fraîcheur repose sur `last_confirmed_on`, avec fallback sur la date initiale `observed_on` : une vérification identique rafraîchit le fait sans falsifier sa première observation.

**Rév. 4.1 — garde de publication.** Si `p_tool_id` ne correspond pas à un outil `content_status='published'` (ou n'existe pas), la fonction retourne la **même ligne unique `needs_review`** avec **toutes les colonnes à `null`** — y compris `plan_key`, `is_free` et `pricing_unit`. Aucune donnée de `catalog_private` n'est lue ni divulguée. Indispensable : la fonction est `SECURITY DEFINER` et `EXECUTE` est accordé à `anon`, elle est donc appelable directement avec un slug arbitraire.

## Resolvers legacy

### `legacy_is_free` — portage **exact** de `hasGenuineFreeTier` (`src/lib/pricing.ts`)
```sql
-- Miroir SQL strict. JS: NEGATION || (TRIAL_ONLY && !OVERRIDE) => false ; sinon true.
create or replace function catalog_api.legacy_is_free(free_text text)
returns boolean language sql immutable
  security definer
  set search_path = pg_catalog
as $$
  select case
    when coalesce(trim(free_text), '') = '' then false
    when free_text ~* 'no free|aucun|pas de|non communiqué' then false
    when free_text ~* 'essai|trial|jours? gratuit|demo gratuite|démo gratuite'
         and not free_text ~* 'gratuit (a|à) vie|forever free|illimité dans le temps|sans limite de temps|entièrement gratuit|plan gratuit permanent|produit complet|open-?source'
      then false
    else true
  end;
$$;
revoke all on function catalog_api.legacy_is_free(text) from public;
grant execute on function catalog_api.legacy_is_free(text) to anon, authenticated;
alter function catalog_api.legacy_is_free(text) owner to catalog_owner;
```
> Les trois regex sont copiées **à l'identique** de `NEGATION_RE`, `TRIAL_ONLY_RE`, `PERMANENT_FREE_OVERRIDE_RE`. `~*` = insensible à la casse (équivaut au `.toLowerCase()` + `/i`).

### `legacy_freshness`
```sql
create or replace function catalog_api.legacy_freshness(pv5 jsonb)
returns text language sql stable
  security definer
  set search_path = pg_catalog
as $$
  select case
    when (pv5->>'verified_on') is null then 'unknown'
    when (pv5->>'verified_on')::date < current_date - interval '90 days' then 'stale'
    else 'fresh'
  end;
$$;
revoke all on function catalog_api.legacy_freshness(jsonb) from public;
grant execute on function catalog_api.legacy_freshness(jsonb) to anon, authenticated;
alter function catalog_api.legacy_freshness(jsonb) owner to catalog_owner;
```

### `legacy_relationships` — restitution des relations legacy (#restituer relations legacy)
```sql
-- Reconstruit les relations à partir des colonnes historiques, en joignant l'outil cible pour le slug.
create or replace function catalog_api.legacy_relationships(p_tool_id text, p_lang text)
returns jsonb language sql stable
  security definer
  set search_path = pg_catalog, catalog_private, public
as $$
  -- rév.4.1 — l'outil SOURCE doit être publié : sinon aucune relation n'est
  -- restituée (retour '[]'), même si la fonction est appelée directement par anon.
  with b as (
    select * from public.tools
    where id = p_tool_id and content_status = 'published'
  ),
  rels as (
    select jsonb_array_elements_text(coalesce(b.alternatives,b.legacy_payload->'alternatives','[]'::jsonb)) as rel_slug,
           'substitutes'::text as rel_type, null::text as reason from b
    union all select b.free_alternative as rel_slug, 'substitutes'::text as rel_type, case when p_lang='en' then 'free alternative' else 'alternative gratuite' end as reason from b where b.free_alternative is not null
    union all select coalesce(b.better_alternative,b.legacy_payload->'betterAlternative')->>'tool' as rel_slug, 'substitutes'::text as rel_type,
                     coalesce(b.better_alternative,b.legacy_payload->'betterAlternative')->>'reason' from b
      where coalesce(b.better_alternative,b.legacy_payload->'betterAlternative') is not null
    union all select b.host_app, 'extends', case when p_lang='en' then 'host application' else 'application hôte' end from b where b.host_app is not null
    union all select b.bundle_parent, 'complements', case when p_lang='en' then 'included in suite' else 'inclus dans la suite' end from b where b.bundle_parent is not null
    union all select jsonb_array_elements_text(coalesce(b.legacy_payload->'complements','[]'::jsonb)), 'complements', null::text from b
    union all select jsonb_array_elements_text(coalesce(b.legacy_payload->'integrates_with','[]'::jsonb)), 'complements',
                     case when p_lang='en' then 'integration' else 'intégration' end from b
    union all
    select coalesce(x->>'targetToolId',x->>'target_tool_id'),
           case x->>'kind' when 'alternative_to' then 'substitutes' when 'plugin_of' then 'extends'
             when 'included_in' then 'complements' else 'complements' end,
           coalesce(x->>(case when p_lang='en' then 'reasonEn' else 'reasonFr' end),x->>'reason')
    from b cross join lateral jsonb_array_elements(coalesce(b.legacy_payload->'relations','[]'::jsonb)) x
  ), normalized(rel_ref,rel_type,reason) as (
    select nullif(trim(rel_slug),''), rel_type, reason from rels
  ),
  -- rév.4 — résolution DÉTERMINISTE et sans `JOIN ... OR` :
  --   1) tentative par id ; 2) sinon par slug ; cible unique ; publiée uniquement.
  resolved as (
    select n.rel_ref, n.rel_type, n.reason,
           coalesce(
             (select t.id from public.tools t
               where t.id = n.rel_ref and t.content_status = 'published'),
             (select t.id from public.tools t
               where t.slug = n.rel_ref and t.content_status = 'published'
               order by t.id limit 1)
           ) as target_id
    from normalized n
    where n.rel_ref is not null and n.rel_ref <> p_tool_id
  ),
  -- Les relations orphelines (cible inexistante ou non publiée) sont supprimées.
  dedup as (
    select distinct on (r.target_id, r.rel_type) r.target_id, r.rel_type, r.reason
    from resolved r
    where r.target_id is not null and r.target_id <> p_tool_id
    order by r.target_id, r.rel_type, r.reason nulls last
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'slug', rt.slug, 'name', rt.name,
           'type', d.rel_type, 'direction', 'directed', 'reason', d.reason)
         order by d.rel_type, rt.slug),'[]'::jsonb)
  from dedup d
  join public.tools rt on rt.id = d.target_id;   -- égalité stricte, aucune multiplication
$$;

revoke all on function catalog_api.legacy_relationships(text,text) from public;
grant execute on function catalog_api.legacy_relationships(text,text) to anon, authenticated;
alter function catalog_api.legacy_relationships(text,text) owner to catalog_owner;

-- Le rôle de migration exécute les resolvers dans les gates de parité. Ces
-- grants doivent être émis après transfert par le propriétaire final.
set role catalog_owner;
grant execute on function catalog_api.select_current_compare_price(text,text,text) to session_user;
grant execute on function catalog_api.legacy_is_free(text) to session_user;
grant execute on function catalog_api.legacy_freshness(jsonb) to session_user;
grant execute on function catalog_api.legacy_relationships(text,text) to session_user;
reset role;
```

> **Rév. 4 — invariants relations legacy** : cible obligatoirement `content_status='published'` ; résolution `id` **puis** `slug` (déterministe, `limit 1`) ; une seule cible par `(target_id, rel_type)` ; relations orphelines supprimées ; jointure finale en **égalité stricte** (`rt.id = d.target_id`), plus aucun `JOIN … OR`.
> **Rév. 4.1** : l'outil **source** doit lui aussi être `published` — un slug `draft`/`archived` passé directement à la fonction par `anon` retourne `'[]'`, sans révéler ses relations.

## Test de parité `hasGenuineFreeTier` sur les 1126 outils

Distribution de référence (JS, mesurée 2026-07-16) : **is_free TRUE = 589 · FALSE = 537**. « Essai gratuit 30 jours » (balsamiq) → FALSE (correct).

```
# Harness (à exécuter quand la base est disponible ; NON exécuté ici) :
# 1. JS: pour les 1126 fiches, r_js = hasGenuineFreeTier(t.pricing.free)  (src/lib/pricing.ts)
# 2. SQL: select id, catalog_api.legacy_is_free(pricing->>'free') from public.tools
# 3. Assert: pour chaque id, r_js == r_sql  ; diffs attendus = 0
# 4. Assert: sum(r_sql) = 589
```
Un écart = divergence de dialecte regex → à corriger avant migration (bloquant).
