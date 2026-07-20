-- === A7-schema-preflight.4.12.sql — fingerprint legacy requis ===
create temporary table _expected_legacy_column(name text primary key, sql_type text not null, char_max int) on commit drop;
insert into _expected_legacy_column values('id','character varying',50);
insert into _expected_legacy_column values('slug','character varying',255);
insert into _expected_legacy_column values('name','character varying',255);
insert into _expected_legacy_column values('category','character varying',50);
insert into _expected_legacy_column values('tool_type','text',null);
insert into _expected_legacy_column values('website_url','character varying',500);
insert into _expected_legacy_column values('affiliate_link','character varying',500);
insert into _expected_legacy_column values('logo','character varying',10);
insert into _expected_legacy_column values('og_image_url','text',null);
insert into _expected_legacy_column values('short_description','text',null);
insert into _expected_legacy_column values('short_description_en','text',null);
insert into _expected_legacy_column values('long_description','text',null);
insert into _expected_legacy_column values('long_description_en','text',null);
insert into _expected_legacy_column values('pricing','jsonb',null);
insert into _expected_legacy_column values('pricing_en','jsonb',null);
insert into _expected_legacy_column values('default_monthly_price','numeric',null);
insert into _expected_legacy_column values('pricing_v5','jsonb',null);
insert into _expected_legacy_column values('verdict','jsonb',null);
insert into _expected_legacy_column values('verdict_en','jsonb',null);
insert into _expected_legacy_column values('pros','jsonb',null);
insert into _expected_legacy_column values('pros_en','jsonb',null);
insert into _expected_legacy_column values('cons','jsonb',null);
insert into _expected_legacy_column values('cons_en','jsonb',null);
insert into _expected_legacy_column values('covers','jsonb',null);
insert into _expected_legacy_column values('use_cases','jsonb',null);
insert into _expected_legacy_column values('use_cases_en','jsonb',null);
insert into _expected_legacy_column values('relevant_for','jsonb',null);
insert into _expected_legacy_column values('seo','jsonb',null);
insert into _expected_legacy_column values('articles','jsonb',null);
insert into _expected_legacy_column values('alternatives','jsonb',null);
insert into _expected_legacy_column values('functional_needs','jsonb',null);
insert into _expected_legacy_column values('verticals','jsonb',null);
insert into _expected_legacy_column values('personas','jsonb',null);
insert into _expected_legacy_column values('better_alternative','jsonb',null);
insert into _expected_legacy_column values('free_alternative','text',null);
insert into _expected_legacy_column values('migration_guide','jsonb',null);
insert into _expected_legacy_column values('downgrade_plan','jsonb',null);
insert into _expected_legacy_column values('solo_relevance','character varying',50);
insert into _expected_legacy_column values('team_relevance','character varying',50);
insert into _expected_legacy_column values('time_gained_hours_per_month','integer',null);
insert into _expected_legacy_column values('substitutable','boolean',null);
insert into _expected_legacy_column values('prescription_quality','text',null);
insert into _expected_legacy_column values('prescription_output','jsonb',null);
insert into _expected_legacy_column values('prescription_block_reasons','jsonb',null);
insert into _expected_legacy_column values('prescription_context_questions','jsonb',null);
insert into _expected_legacy_column values('substitution_cluster_v2','text',null);
insert into _expected_legacy_column values('decision_policy_v3','jsonb',null);
insert into _expected_legacy_column values('pertinence_by_persona','jsonb',null);
insert into _expected_legacy_column values('force_silence','boolean',null);
insert into _expected_legacy_column values('ia_use_case','jsonb',null);
insert into _expected_legacy_column values('host_app','text',null);
insert into _expected_legacy_column values('bundle_parent','text',null);
do $schema$
declare bad text;
begin
  select string_agg(e.name||':'||e.sql_type||coalesce('('||e.char_max||')','')||'!='||coalesce(c.data_type||coalesce('('||c.character_maximum_length||')',''),'ABSENT'), ', ' order by e.name) into bad
  from _expected_legacy_column e left join information_schema.columns c
    on c.table_schema='public' and c.table_name='tools' and c.column_name=e.name
  where c.column_name is null or c.data_type is distinct from e.sql_type
     or c.character_maximum_length is distinct from e.char_max;
  if bad is not null then raise exception 'SCHEMA FINGERPRINT incompatible: %', bad; end if;
end $schema$;
