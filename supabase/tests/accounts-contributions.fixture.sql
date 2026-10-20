-- Isolated SQL test fixtures only; exact Auth reference columns from live read-only preflight.
create schema catalog_contrib;
create schema catalog_private;
create table catalog_contrib.brand_memberships (id integer primary key, user_id uuid references auth.users(id) on delete cascade, invited_by uuid references auth.users(id));
create table catalog_contrib.brand_tool_assignments (id integer primary key, verified_by uuid references auth.users(id));
create table catalog_contrib.brands (id integer primary key, created_by uuid references auth.users(id));
create table catalog_contrib.tool_change_request_events (id integer primary key, actor_user_id uuid references auth.users(id));
create table catalog_contrib.tool_change_request_items (id integer primary key, applied_by uuid references auth.users(id), decided_by uuid references auth.users(id));
create table catalog_contrib.tool_change_requests (id integer primary key, created_by uuid references auth.users(id), reviewed_by uuid references auth.users(id));
create table catalog_private.tool_editorial_content (id integer primary key, created_by_user_id uuid references auth.users(id), reviewed_by_user_id uuid references auth.users(id));
