-- === A7-baseline-existing.4.12.sql — état réel des 533 AVANT migration ===
-- Remplace la référence JSON pour les lignes déjà présentes : leur état SQL est l'autorité legacy.
do $baseline$
begin
  if (select count(*) from public.tools) <> 533 then raise exception 'BASELINE: public.tools doit contenir 533 lignes'; end if;
  if exists ((select slug from public.tools except select slug from _expected_tool where not is_json_only)
             union all (select slug from _expected_tool where not is_json_only except select slug from public.tools))
  then raise exception 'BASELINE: ensemble des 533 slugs différent du manifeste'; end if;
end $baseline$;
update _expected_tool e set expected = jsonb_build_object(
         'id', to_jsonb(t.id),
         'slug', to_jsonb(t.slug),
         'name', to_jsonb(t.name),
         'category', to_jsonb(t.category),
         'tool_type', to_jsonb(t.tool_type),
         'website_url', to_jsonb(t.website_url),
         'affiliate_link', to_jsonb(t.affiliate_link),
         'logo', to_jsonb(t.logo),
         'og_image_url', to_jsonb(t.og_image_url),
         'short_description', to_jsonb(t.short_description),
         'short_description_en', to_jsonb(t.short_description_en),
         'long_description', to_jsonb(t.long_description),
         'long_description_en', to_jsonb(t.long_description_en),
         'pricing', to_jsonb(t.pricing),
         'pricing_en', to_jsonb(t.pricing_en),
         'default_monthly_price', to_jsonb(t.default_monthly_price),
         'pricing_v5', to_jsonb(t.pricing_v5),
         'verdict', to_jsonb(t.verdict),
         'verdict_en', to_jsonb(t.verdict_en),
         'pros', to_jsonb(t.pros),
         'pros_en', to_jsonb(t.pros_en),
         'cons', to_jsonb(t.cons),
         'cons_en', to_jsonb(t.cons_en),
         'covers', to_jsonb(t.covers),
         'use_cases', to_jsonb(t.use_cases)
       ) ||
       jsonb_build_object(
         'use_cases_en', to_jsonb(t.use_cases_en),
         'relevant_for', to_jsonb(t.relevant_for),
         'seo', to_jsonb(t.seo),
         'articles', to_jsonb(t.articles),
         'alternatives', to_jsonb(t.alternatives),
         'functional_needs', to_jsonb(t.functional_needs),
         'verticals', to_jsonb(t.verticals),
         'personas', to_jsonb(t.personas),
         'better_alternative', to_jsonb(t.better_alternative),
         'free_alternative', to_jsonb(t.free_alternative),
         'migration_guide', to_jsonb(t.migration_guide),
         'downgrade_plan', to_jsonb(t.downgrade_plan),
         'solo_relevance', to_jsonb(t.solo_relevance),
         'team_relevance', to_jsonb(t.team_relevance),
         'time_gained_hours_per_month', to_jsonb(t.time_gained_hours_per_month),
         'substitutable', to_jsonb(t.substitutable),
         'prescription_quality', to_jsonb(t.prescription_quality),
         'prescription_output', to_jsonb(t.prescription_output),
         'prescription_block_reasons', to_jsonb(t.prescription_block_reasons),
         'prescription_context_questions', to_jsonb(t.prescription_context_questions),
         'substitution_cluster_v2', to_jsonb(t.substitution_cluster_v2),
         'decision_policy_v3', to_jsonb(t.decision_policy_v3),
         'pertinence_by_persona', to_jsonb(t.pertinence_by_persona),
         'force_silence', to_jsonb(t.force_silence),
         'ia_use_case', to_jsonb(t.ia_use_case)
       ) ||
       jsonb_build_object(
         'host_app', to_jsonb(t.host_app),
         'bundle_parent', to_jsonb(t.bundle_parent)
       )
from public.tools t where t.slug=e.slug and not e.is_json_only;
create temporary table _baseline_is_free on commit drop as
select t.slug, case
  when coalesce(trim(t.pricing->>'free'),'')='' then false
  when t.pricing->>'free' ~* 'no free|aucun|pas de|non communiqué' then false
  when t.pricing->>'free' ~* 'essai|trial|jours? gratuit|demo gratuite|démo gratuite'
       and not t.pricing->>'free' ~* 'gratuit (a|à) vie|forever free|illimité dans le temps|sans limite de temps|entièrement gratuit|plan gratuit permanent|produit complet|open-?source' then false
  else true end as actual_is_free
from public.tools t;
do $free_delta$
begin
  if (select coalesce(array_agg(b.slug::text order by b.slug),'{}'::text[])
      from _baseline_is_free b join _expected_tool e using(slug)
      where b.actual_is_free is distinct from e.expected_is_free)
     is distinct from array['gamma','unbounce']::text[] then
    raise exception 'BASELINE: delta legacy_is_free différent de gamma/unbounce';
  end if;
end $free_delta$;
update _expected_tool e set expected_is_free=b.actual_is_free
from _baseline_is_free b where b.slug=e.slug and not e.is_json_only;
