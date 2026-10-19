-- Local test engine only. Never apply these fixture roles/tables to Supabase.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (
 id uuid primary key, email varchar, created_at timestamptz default now(),
 email_confirmed_at timestamptz, phone_confirmed_at timestamptz,
 confirmed_at timestamptz generated always as (least(email_confirmed_at, phone_confirmed_at)) stored,
 is_anonymous boolean not null default false, deleted_at timestamptz, banned_until timestamptz
);
create table auth.sessions (
 id uuid primary key, user_id uuid references auth.users(id) on delete cascade,
 not_after timestamptz
);
create function auth.uid() returns uuid language sql stable as
 $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to authenticated;
create table public.accounts_catalog_sentinel (id integer primary key, value text);
insert into public.accounts_catalog_sentinel values (1, 'catalogue must stay unchanged');
