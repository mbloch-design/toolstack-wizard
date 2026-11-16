-- Minimal local fixture for the deployed catalogue relations used by this migration.
create schema catalog_contrib;
create table public.tools (id varchar primary key, slug text unique not null);
create table catalog_contrib.brands (id uuid primary key, status text not null);
create table catalog_contrib.brand_memberships (
  brand_id uuid references catalog_contrib.brands,
  user_id uuid references auth.users on delete cascade,
  status text not null, role text not null,
  primary key (brand_id, user_id)
);
create table catalog_contrib.brand_tool_assignments (
  brand_id uuid references catalog_contrib.brands,
  tool_id varchar references public.tools,
  status text not null, is_primary boolean not null,
  primary key (brand_id, tool_id)
);
create unique index brand_tool_one_primary_idx
  on catalog_contrib.brand_tool_assignments (tool_id)
  where status = 'verified' and is_primary;
grant usage on schema catalog_contrib to service_role;
grant select, update on all tables in schema catalog_contrib to service_role;
