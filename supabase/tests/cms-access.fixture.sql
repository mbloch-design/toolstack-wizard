-- Small local fixture for the historic public.tools dependency.
create table public.tools (id varchar primary key, slug text unique not null);
grant select on public.tools to service_role;
