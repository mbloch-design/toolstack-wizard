-- Small local fixture for the historic public.tools dependency.
create table public.tools (
  id varchar primary key, slug varchar unique not null, name varchar not null default '',
  website_url text, content_status text not null default 'draft'
);
grant select on public.tools to service_role;
