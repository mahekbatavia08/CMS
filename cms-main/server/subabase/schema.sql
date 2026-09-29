-- =====================================================================
-- Portfolio CMS — Supabase schema (replaces MongoDB + Cloudinary)
-- Run once in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- Safe to re-run (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Helpers
-- ---------------------------------------------------------------------

-- 24-char hex ids (same format as Mongo ObjectIds) so existing ids, URLs,
-- JWTs and the `isMongoId()` validators keep working unchanged.
create or replace function public.generate_object_id()
returns text
language sql
volatile
set search_path = ''
as $$
  select lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0')
         || substr(md5(random()::text || clock_timestamp()::text), 1, 16);
$$;

-- updated_at auto-bump (skipped when the caller sets updated_at explicitly,
-- e.g. the one-time data migration).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.updated_at is not distinct from old.updated_at then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. admins  (was Mongo "admins" collection)
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  id          text primary key default public.generate_object_id(),
  name        text        not null,
  email       text        not null,
  password    text        not null,                -- bcrypt hash
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint admins_email_lowercase check (email = lower(email))
);
create unique index if not exists admins_email_key on public.admins (email);

drop trigger if exists admins_set_updated_at on public.admins;
create trigger admins_set_updated_at
  before update on public.admins
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2. projects  (was Mongo "projects" collection)
--    Each nested Mongo sub-document is a JSONB column, so the API shape
--    stays byte-for-byte identical. Hot query fields are exposed as
--    generated columns + indexes.
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id                       text primary key default public.generate_object_id(),
  project_tag              text        not null,
  project_category         text        not null default 'individual'
                             check (project_category in ('portfolio', 'individual')),
  parent_project           text        references public.projects (id) on delete set null,
  also_show_as_individual  boolean     not null default false,

  general          jsonb not null default '{}'::jsonb,
  contact          jsonb not null default '{}'::jsonb,
  location         jsonb not null default '{}'::jsonb,
  specifications   jsonb not null default '[]'::jsonb,
  filters          jsonb not null default '{}'::jsonb,
  rera             jsonb not null default '{}'::jsonb,
  media            jsonb not null default '{}'::jsonb,
  videos           jsonb not null default '[]'::jsonb,
  brochures        jsonb not null default '[]'::jsonb,
  legal_documents  jsonb not null default '[]'::jsonb,
  floor_plans      jsonb not null default '[]'::jsonb,
  seo              jsonb not null default '{}'::jsonb,
  status           jsonb not null default '{}'::jsonb,
  map_skin         text  not null default 'default',
  skin_settings    jsonb not null default '{}'::jsonb,
  legacy           jsonb not null default '{}'::jsonb,   -- unknown fields carried over from Mongo

  -- generated (read-only) columns for filtering / sorting / uniqueness
  slug          text    generated always as (general ->> 'slug') stored,
  project_name  text    generated always as (general ->> 'projectName') stored,
  builder_name  text    generated always as (general ->> 'builderName') stored,
  status_value  text    generated always as (status ->> 'status') stored,
  is_deleted    boolean generated always as (coalesce((status ->> 'isDeleted')::boolean, false)) stored,
  featured      boolean generated always as (coalesce((status ->> 'featured')::boolean, false)) stored,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint projects_type_checks check (
    jsonb_typeof(general) = 'object' and jsonb_typeof(status) = 'object'
    and jsonb_typeof(specifications) = 'array' and jsonb_typeof(videos) = 'array'
    and jsonb_typeof(brochures) = 'array' and jsonb_typeof(legal_documents) = 'array'
    and jsonb_typeof(floor_plans) = 'array'
  )
);

create unique index if not exists projects_project_tag_key on public.projects (project_tag);
create unique index if not exists projects_slug_key        on public.projects (slug);
create index if not exists projects_parent_idx     on public.projects (parent_project);
create index if not exists projects_category_idx   on public.projects (project_category);
create index if not exists projects_is_deleted_idx on public.projects (is_deleted);
create index if not exists projects_status_idx     on public.projects (status_value);
create index if not exists projects_created_idx    on public.projects (created_at desc);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. filter_values  (was Mongo "filtervalues" collection — autocomplete)
-- ---------------------------------------------------------------------
create table if not exists public.filter_values (
  id           text primary key default public.generate_object_id(),
  type         text    not null,
  value        text    not null,
  usage_count  integer not null default 1 check (usage_count >= 1),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint filter_values_type_value_key unique (type, value)
);

drop trigger if exists filter_values_set_updated_at on public.filter_values;
create trigger filter_values_set_updated_at
  before update on public.filter_values
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. RPC functions used by the Express server
-- ---------------------------------------------------------------------

-- Paginated / filtered / sorted project listing (replaces Mongo find()).
create or replace function public.list_projects(
  p_search          text    default null,
  p_status          text    default null,
  p_featured        boolean default null,
  p_category        text    default null,
  p_parent          text    default null,
  p_include_sub     boolean default false,
  p_exclude_parents text[]  default null,
  p_sort            text    default 'newest',
  p_limit           integer default 10,
  p_offset          integer default 0
)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with f as (
    select p.*
    from public.projects p
    where p.is_deleted = false
      and (
        p_search is null
        or strpos(lower(coalesce(p.project_name, '')), lower(p_search)) > 0
        or strpos(lower(coalesce(p.builder_name, '')), lower(p_search)) > 0
      )
      and (p_status is null or p.status_value = p_status)
      and (p_featured is null or p.featured = p_featured)
      and (
        p_category is null
        or (
          p_category = 'individual'
          and (p.project_category = 'individual' or p.also_show_as_individual)
          and (p.project_category <> 'portfolio' or p.also_show_as_individual)
        )
        or (p_category <> 'individual' and p.project_category = p_category)
      )
      and (
        case
          when p_parent is not null then p.parent_project = p_parent
          when coalesce(p_include_sub, false) then true
          else (p.parent_project is null or p.also_show_as_individual)
        end
      )
      and (
        p_exclude_parents is null
        or p.parent_project is null
        or not (p.parent_project = any (p_exclude_parents))
      )
  ),
  page as (
    select f.*,
           row_number() over (
             order by
               case when p_sort = 'oldest'    then f.created_at end asc,
               case when p_sort = 'name-asc'  then f.project_name collate "C" end asc,
               case when p_sort = 'name-desc' then f.project_name collate "C" end desc,
               case when coalesce(p_sort, 'newest') not in ('oldest', 'name-asc', 'name-desc')
                    then f.created_at end desc,
               f.id
           ) as rn
    from f
  )
  select jsonb_build_object(
    'total', (select count(*) from f),
    'items', coalesce(
      (select jsonb_agg(to_jsonb(x) - 'rn' order by x.rn)
         from (select * from page
               where rn > greatest(p_offset, 0)
                 and rn <= greatest(p_offset, 0) + greatest(p_limit, 1)) x),
      '[]'::jsonb)
  );
$$;

-- Soft delete (status.isDeleted = true) by ids and/or by parent ids.
create or replace function public.soft_delete_projects(
  p_ids        text[] default null,
  p_parent_ids text[] default null
)
returns integer
language sql
volatile
set search_path = ''
as $$
  with u as (
    update public.projects
       set status = jsonb_set(coalesce(status, '{}'::jsonb), '{isDeleted}', 'true'::jsonb, true)
     where is_deleted = false
       and (
         (p_ids is not null and id = any (p_ids))
         or (p_parent_ids is not null and parent_project = any (p_parent_ids))
       )
    returning 1
  )
  select count(*)::integer from u;
$$;

-- Autocomplete suggestions (case-insensitive "contains", top 10).
create or replace function public.get_filter_suggestions(
  p_type  text,
  p_query text default ''
)
returns table (value text, "usageCount" integer)
language sql
stable
set search_path = ''
as $$
  select fv.value, fv.usage_count
  from public.filter_values fv
  where fv.type = p_type
    and (
      coalesce(btrim(p_query), '') = ''
      or strpos(lower(fv.value), lower(btrim(p_query))) > 0
    )
  order by fv.usage_count desc, fv.value collate "C" asc
  limit 10;
$$;

-- Atomic upsert + increment (replaces findOneAndUpdate({$inc}, {upsert}))
create or replace function public.increment_filter_value(
  p_type  text,
  p_value text
)
returns void
language sql
volatile
set search_path = ''
as $$
  insert into public.filter_values (type, value, usage_count)
  values (p_type, p_value, 1)
  on conflict (type, value)
  do update set usage_count = public.filter_values.usage_count + 1;
$$;

-- ---------------------------------------------------------------------
-- 5. Security: server-only access (service_role / secret key)
--    RLS on + no policies = anon/authenticated keys can't touch data.
-- ---------------------------------------------------------------------
alter table public.admins        enable row level security;
alter table public.projects      enable row level security;
alter table public.filter_values enable row level security;

revoke all on public.admins, public.projects, public.filter_values from anon, authenticated;
grant all on public.admins, public.projects, public.filter_values to service_role;

revoke execute on function public.list_projects(text, text, boolean, text, text, boolean, text[], text, integer, integer) from public, anon, authenticated;
revoke execute on function public.soft_delete_projects(text[], text[])       from public, anon, authenticated;
revoke execute on function public.get_filter_suggestions(text, text)         from public, anon, authenticated;
revoke execute on function public.increment_filter_value(text, text)         from public, anon, authenticated;

grant execute on function public.list_projects(text, text, boolean, text, text, boolean, text[], text, integer, integer) to service_role;
grant execute on function public.soft_delete_projects(text[], text[])       to service_role;
grant execute on function public.get_filter_suggestions(text, text)         to service_role;
grant execute on function public.increment_filter_value(text, text)         to service_role;

-- ---------------------------------------------------------------------
-- 6. Storage bucket (replaces Cloudinary + local /uploads)
--    Public read (URLs are embedded in the map skins / iframes).
--    Writes only via the server's service_role key.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('cms-media', 'cms-media', true)
on conflict (id) do update set public = true;