-- The deployed attribution relations predate the checked-in migrations.
-- Reproduce the three dependencies on a new project; reject partial schemas.
begin;

create schema if not exists catalog_contrib;

do $baseline$
declare
  present_count integer;
begin
  select count(*) into present_count
  from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'catalog_contrib'
    and c.relname in ('brands','brand_memberships','brand_tool_assignments') and c.relkind = 'r';

  if present_count = 0 then
    create table catalog_contrib.brands (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      legal_name text,
      website_domain text not null check (website_domain = lower(btrim(website_domain)))
        check (website_domain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'),
      status text not null default 'pending' check (status in ('pending','verified','suspended','archived')),
      created_by uuid not null references auth.users(id),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create table catalog_contrib.brand_memberships (
      brand_id uuid not null references catalog_contrib.brands(id) on delete cascade,
      user_id uuid not null references auth.users(id) on delete cascade,
      role text not null check (role in ('owner','admin','editor','viewer')),
      status text not null default 'invited' check (status in ('invited','active','revoked')),
      invited_by uuid references auth.users(id),
      created_at timestamptz not null default now(),
      accepted_at timestamptz,
      revoked_at timestamptz,
      primary key (brand_id,user_id)
    );
    create index brand_memberships_user_idx on catalog_contrib.brand_memberships(user_id, status, brand_id);
    create table catalog_contrib.brand_tool_assignments (
      brand_id uuid not null references catalog_contrib.brands(id) on delete cascade,
      tool_id text not null references public.tools(id) on delete cascade,
      status text not null default 'claimed' check (status in ('claimed','verified','rejected','revoked')),
      is_primary boolean not null default true,
      verification_method text,
      evidence jsonb not null default '{}'::jsonb,
      verified_by uuid references auth.users(id),
      claimed_at timestamptz not null default now(),
      verified_at timestamptz,
      revoked_at timestamptz,
      primary key (brand_id,tool_id)
    );
    create unique index brand_tool_one_primary_idx on catalog_contrib.brand_tool_assignments(tool_id)
      where status = 'verified' and is_primary;
    create index brand_tool_tool_idx on catalog_contrib.brand_tool_assignments(tool_id,status,brand_id);
    alter table catalog_contrib.brands enable row level security;
    alter table catalog_contrib.brand_memberships enable row level security;
    alter table catalog_contrib.brand_tool_assignments enable row level security;
    revoke all on catalog_contrib.brands, catalog_contrib.brand_memberships,
      catalog_contrib.brand_tool_assignments from public, anon, authenticated;
  elsif present_count <> 3 or not exists (
    select from pg_catalog.pg_index
    where indexrelid = to_regclass('catalog_contrib.brand_tool_one_primary_idx')
      and indisunique and indisvalid and indpred is not null
  ) then
    raise exception 'CMS attribution baseline drift';
  end if;

  -- Compile the column contract in both upgrade paths before granting access.
  perform b.id, b.name, b.website_domain, b.status, b.created_by,
    m.user_id, m.role, m.status, m.accepted_at, a.tool_id, a.status,
    a.is_primary, a.verified_by, a.verification_method, a.verified_at
    from catalog_contrib.brands b
    join catalog_contrib.brand_memberships m on m.brand_id = b.id
    join catalog_contrib.brand_tool_assignments a on a.brand_id = b.id
    limit 0;
end;
$baseline$;

grant usage on schema catalog_contrib to service_role;
grant select, insert, update on catalog_contrib.brands, catalog_contrib.brand_memberships,
  catalog_contrib.brand_tool_assignments to service_role;

commit;
