-- === A7-parity-gate.4.12.sql — comparaison exhaustive 1126 (GÉNÉRÉ) ===
do $parity$
declare n_missing int; n_mismatch int;
begin
  -- chaque slug attendu a une ligne
  select count(*) into n_missing from _expected_tool e left join public.tools t using(slug) where t.id is null;
  if n_missing <> 0 then raise exception 'PARITÉ: % slugs attendus absents de public.tools', n_missing; end if;
  if (select count(*) from public.tools) <> 1126 then raise exception 'PARITÉ: public.tools doit contenir 1126 lignes'; end if;
  -- comparaison champ-par-champ (colonnes typées) via jsonb reconstruit
  select count(*) into n_mismatch from public.tools t join _expected_tool e using(slug)
  where jsonb_build_object(
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
       ) is distinct from e.expected;
  if n_mismatch <> 0 then raise exception 'PARITÉ: % lignes divergent champ-par-champ de tools_v4.json', n_mismatch; end if;
  -- provenance : exactement 593 insertions marquées dark-launch-4.12, aucun des 533 existants.
  if (select count(*) from public.tools where legacy_payload->>'import_batch' = 'dark-launch-4.12') <> 593
    then raise exception 'PARITÉ: marqueur import_batch attendu sur exactement 593 lignes'; end if;
  if exists (select 1 from public.tools t join _expected_tool e using(slug)
             where not e.is_json_only and t.legacy_payload ? 'import_batch')
    then raise exception 'PARITÉ: une ligne préexistante porte un marqueur d''import'; end if;
  if exists (select 1 from public.tools t join _expected_tool e using(slug)
             where catalog_api.legacy_is_free(t.pricing->>'free') is distinct from e.expected_is_free)
    then raise exception 'PARITÉ: legacy_is_free diffère de la référence JS'; end if;
  if (select count(*) from public.tools where catalog_api.legacy_is_free(pricing->>'free')) <> 589
    then raise exception 'PARITÉ: legacy_is_free doit produire 589 true / 537 false'; end if;
  raise notice 'PARITÉ 1126: 0 manquant, 0 divergence champ-par-champ';
end $parity$;
