-- ⛔ BROUILLON NON EXÉCUTÉ. Rôle: catalog_owner.
create view catalog_api.published_tool_projection
  with (security_barrier = true) as
with langs(lang) as (values ('fr'::text),('en'::text))
select
  t.id, t.id as tool_id, t.slug, t.name, t.logo, t.og_image_url, t.category, t.tool_type,
  t.website_url, t.affiliate_link, t.trial_days, l.lang,
  -- Contrat éditorial localisé : une ligne par outil/langue.
  case when t.data_contract='canonical' then ec.short_description
       else case when l.lang='en' then coalesce(t.short_description_en,t.short_description) else t.short_description end end as short_description,
  case when t.data_contract='canonical' then ec.long_description
       else case when l.lang='en' then coalesce(t.long_description_en,t.long_description) else t.long_description end end as long_description,
  case when t.data_contract='canonical' then ec.verdict
       else case when l.lang='en' then coalesce(t.verdict_en,t.verdict) else t.verdict end end as verdict,
  case when t.data_contract='canonical' then ec.pros
       else case when l.lang='en' then coalesce(t.pros_en,t.pros) else t.pros end end as pros,
  case when t.data_contract='canonical' then ec.cons
       else case when l.lang='en' then coalesce(t.cons_en,t.cons) else t.cons end end as cons,
  case when t.data_contract='canonical' then ec.covers else t.covers end as covers,
  case when t.data_contract='canonical' then ec.use_cases
       else case when l.lang='en' then coalesce(t.use_cases_en,t.use_cases) else t.use_cases end end as use_cases,
  case when t.data_contract='canonical' then ec.relevant_for else t.relevant_for end as relevant_for,
  case when t.data_contract='canonical' then ec.seo else t.seo end as seo,
  case when t.data_contract='canonical' then ec.gallery_images
       else t.legacy_payload->'gallery_images' end as gallery_images,
  case when t.data_contract='canonical' then ec.ai_angle
       else coalesce(t.legacy_payload->'aiAngle',t.seo->'aiAngle') end as ai_angle,
  -- Données de présentation uniquement. Les prix/sources/dates factuels restent
  -- dans plans/compare_* et ne sont jamais relus depuis cet objet.
  case when t.data_contract='canonical' then ec.pricing_guidance
       else jsonb_strip_nulls(jsonb_build_object(
         'billing_options',t.pricing_v5->'billing_options',
         'cautions',t.pricing_v5->'cautions',
         'costTable',t.pricing_v5->'costTable',
         'costTableNoteFr',t.pricing_v5->'costTableNoteFr',
         'costTableNoteEn',t.pricing_v5->'costTableNoteEn',
         'minSeats',t.pricing_v5->'minSeats',
         'price_reliability',t.pricing_v5->'price_reliability',
         'tcoExampleFr',t.pricing_v5->'tcoExampleFr',
         'tcoExampleEn',t.pricing_v5->'tcoExampleEn',
         'usage_sensitive',t.pricing_v5->'usage_sensitive')) end as pricing_guidance,
  t.solo_relevance, t.team_relevance, t.personas, t.time_gained_hours_per_month, t.articles,
  t.substitutable, t.verticals, t.functional_needs, t.ia_use_case,
  t.host_app, t.bundle_parent,
  t.better_alternative, t.free_alternative, t.migration_guide, t.downgrade_plan,
  -- rév.4 — conservés publiquement : consommés hors diagnostic (fiche, Ma Stack, Explorer).
  t.prescription_quality, t.substitution_cluster_v2,
  -- rév.4.2 — réservés pour un usage futur, non exposés dans le contrat actif :
  --   prescription_output, prescription_block_reasons, prescription_context_questions,
  --   decision_policy_v3, force_silence, pertinence_by_persona
  -- Compatibilité temporaire pour les consommateurs encore non migrés. Ces
  -- champs sont explicitement legacy et ne sont jamais qualifiés de natifs.
  t.pricing as legacy_pricing, t.pricing_en as legacy_pricing_en,
  t.default_monthly_price as legacy_default_monthly_price, t.pricing_v5 as legacy_pricing_v5,
  plan_set.plans,
  -- is_free : canonical=plan.is_free ; legacy=portage exact hasGenuineFreeTier
  case when t.data_contract='canonical' then cp.is_free else catalog_api.legacy_is_free(t.pricing->>'free') end as is_free,
  -- prix comparatif
  case when t.data_contract='canonical' then cp.plan_key else t.pricing_v5->>'compare_plan_name' end as compare_plan,
  case when t.data_contract='canonical' then cp.pricing_unit else t.pricing_v5->>'compare_plan_kind' end as pricing_unit,
  -- NATIF: canonical seulement ; legacy => NULL (jamais la conversion présentée comme native)
  case when t.data_contract='canonical' then cp.native_amount   else null end as compare_native_amount,
  case when t.data_contract='canonical' then cp.native_currency else null end as compare_native_currency,
  case when t.data_contract='canonical' then cp.billing_commitment else null end as billing_commitment,
  case when t.data_contract='canonical' then cp.billing_period else null end as billing_period,
  case when t.data_contract='canonical' then cp.tax_inclusion else null end as tax_inclusion,
  -- EUR comparateur: canonical=normalisé (null si needs_review) ; legacy=conversion legacy séparée + drapeau
  case when t.data_contract='canonical' then cp.normalized_monthly_eur
       else (t.pricing_v5->>'compare_price_monthly_eur')::numeric end as compare_monthly_eur,
  case when t.data_contract='canonical' then false else true end as compare_eur_is_legacy_conversion,
  case when t.data_contract='canonical' then cp.observed_market else null end as compare_market,
  case when t.data_contract='canonical' then cp.observed_locale else null end as compare_locale,
  case when t.data_contract='canonical' then cp.observed_on
       else nullif(t.pricing_v5->>'verified_on','')::date end as price_observed_on,
  case when t.data_contract='canonical' then coalesce(cp.last_confirmed_on,cp.observed_on)
       else nullif(t.pricing_v5->>'verified_on','')::date end as price_last_confirmed_on,
  case when t.data_contract='canonical' then cp.freshness else catalog_api.legacy_freshness(t.pricing_v5) end as price_freshness,
  case when t.data_contract='canonical' then cp.price_status else 'legacy' end as price_status,
  case when t.data_contract='canonical' then cp.source_url
       else t.pricing_v5->>'official_source_url' end as price_source_url,
  rel.relationships,
  (select coalesce(jsonb_agg(x->>'slug' order by x->>'slug'),'[]'::jsonb)
     from jsonb_array_elements(rel.relationships) x where x->>'type'='substitutes') as alternatives,
  t.content_status, t.data_contract, t.editorially_reviewed_at, t.next_review_at
from public.tools t
cross join langs l
left join catalog_private.tool_editorial_content ec
       on ec.tool_id=t.id and ec.lang=l.lang and ec.status='published'   -- 1 publié / (tool,lang)
left join lateral catalog_api.select_current_compare_price(t.id,'FR','fr-FR') cp on true
left join lateral (
  select coalesce(jsonb_agg(jsonb_build_object(
    'plan_key',p.plan_key,'seat_type',p.seat_type,'pricing_unit',p.pricing_unit,
    'is_free',p.is_free,'is_compare_plan',p.is_compare_plan,
    'display_name',coalesce(loc.display_name,p.plan_key),
    'native_amount',po.native_amount,'native_currency',po.native_currency,
    'billing_period',po.billing_period,'billing_commitment',po.billing_commitment,
    'tax_inclusion',po.tax_inclusion,'observed_market',po.observed_market,
    'observed_locale',po.observed_locale,'observed_on',po.observed_on,
    'last_confirmed_on',po.last_confirmed_on)
    order by p.display_order nulls last,p.plan_key),'[]'::jsonb) as plans
  from catalog_private.tool_plans p
  left join lateral (
    select lz.display_name from catalog_private.tool_plan_localizations lz
    where lz.plan_id=p.id and lz.status='approved'
    order by (lower(lz.locale)=lower(case when l.lang='fr' then 'fr-FR' else 'en-US' end)) desc,lz.observed_on desc limit 1
  ) loc on true
  left join lateral (
    select o.* from catalog_private.tool_price_observations o
    where o.plan_id=p.id and o.review_status='approved'
    order by case
      when lower(coalesce(o.observed_market,''))='fr' and lower(coalesce(o.observed_locale,''))='fr-fr' then 0
      when o.market_context='global_usd_fallback' then 1 else 2 end,
      (o.billing_commitment='annual_prepaid') desc,
      coalesce(o.last_confirmed_on,o.observed_on) desc limit 1
  ) po on true
  where p.tool_id=t.id and t.data_contract='canonical'
) plan_set on true
left join lateral (
  select case when t.data_contract='canonical' then
    coalesce((select jsonb_agg(jsonb_build_object(
      'slug',rt.slug,'name',rt.name,'type',r.rel_type,'direction',r.direction,
      'reason',case when l.lang='en' then r.reason_en else r.reason_fr end)
      order by r.rel_type,rt.slug)
      from catalog_private.tool_relationships r
      join public.tools rt on rt.id=r.related_tool_id
      -- rév.4 : cible obligatoirement publiée (pas de fuite de draft/archived,
      -- pas de lien interne mort). Les relations orphelines disparaissent.
      where r.tool_id=t.id and r.status='approved' and rt.content_status='published'),'[]'::jsonb)
    else catalog_api.legacy_relationships(t.id,l.lang) end as relationships
) rel on true
where t.content_status='published';

grant usage on schema catalog_api to anon, authenticated;
grant select on catalog_api.published_tool_projection to anon, authenticated;
alter view catalog_api.published_tool_projection owner to catalog_owner;
set role catalog_owner;
grant select on catalog_api.published_tool_projection to session_user;
reset role;
