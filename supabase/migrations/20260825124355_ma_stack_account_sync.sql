create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text not null default 'fr' check (locale in ('fr', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stack_snapshots (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  state_version integer not null default 3,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint stack_snapshots_state_is_object check (jsonb_typeof(state) = 'object')
);

alter table public.profiles enable row level security;
alter table public.stack_snapshots enable row level security;

revoke all on public.profiles from anon;
revoke all on public.stack_snapshots from anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.stack_snapshots to authenticated;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using ((select auth.uid()) = id);

create policy "stack_snapshots_select_own"
  on public.stack_snapshots for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "stack_snapshots_insert_own"
  on public.stack_snapshots for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "stack_snapshots_update_own"
  on public.stack_snapshots for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "stack_snapshots_delete_own"
  on public.stack_snapshots for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

comment on table public.stack_snapshots is
  'Canonical versioned Ma Stack state for one authenticated ToolTrim user.';
