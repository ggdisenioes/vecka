create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  category text,
  level text,
  duration_label text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  visibility text not null default 'private' check (visibility in ('private', 'public', 'catalog')),
  cover_image_url text,
  price_ars integer not null default 0,
  price_usd numeric(10,2) not null default 0,
  is_membership boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  slug text not null,
  title text not null,
  summary text,
  body text,
  position integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_preview boolean not null default false,
  video_provider text not null default 'vimeo' check (video_provider in ('vimeo', 'external', 'none')),
  vimeo_url text,
  external_video_url text,
  video_duration_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists course_lessons_module_id_slug_idx on public.course_lessons(module_id, slug);

create table if not exists public.lesson_attachments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  bucket_name text not null default 'lesson-assets',
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

create unique index if not exists lesson_attachments_bucket_path_idx on public.lesson_attachments(bucket_name, storage_path);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text,
  subcategory text,
  description text,
  price_ars integer not null default 0,
  price_usd numeric(10,2) not null default 0,
  format text,
  sizes text,
  badge text,
  product_type text not null default 'downloadable' check (product_type in ('downloadable', 'physical')),
  delivery_method text not null default 'download' check (delivery_method in ('download', 'shipping')),
  shipping_cost_ars integer not null default 0,
  shipping_days text,
  download_url text,
  color_hex text default '#f4e4d4',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_status text not null default 'active' check (access_status in ('active', 'expired', 'revoked')),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  unique(course_id, user_id)
);

alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.course_lessons enable row level security;
alter table public.lesson_attachments enable row level security;
alter table public.products enable row level security;
alter table public.course_enrollments enable row level security;

drop policy if exists "public_can_read_catalog_courses" on public.courses;
create policy "public_can_read_catalog_courses"
on public.courses
for select
to anon, authenticated
using (status = 'published' and visibility in ('public', 'catalog'));

drop policy if exists "public_can_read_modules_of_public_courses" on public.course_modules;
create policy "public_can_read_modules_of_public_courses"
on public.course_modules
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.courses
    where courses.id = course_modules.course_id
      and courses.status = 'published'
      and courses.visibility in ('public', 'catalog')
  )
);

drop policy if exists "public_can_read_preview_lessons" on public.course_lessons;
create policy "public_can_read_preview_lessons"
on public.course_lessons
for select
to anon, authenticated
using (
  status = 'published'
  and is_preview = true
  and exists (
    select 1
    from public.course_modules
    join public.courses on courses.id = course_modules.course_id
    where course_modules.id = course_lessons.module_id
      and courses.status = 'published'
      and courses.visibility in ('public', 'catalog')
  )
);

drop policy if exists "public_can_read_published_products" on public.products;
create policy "public_can_read_published_products"
on public.products
for select
to anon, authenticated
using (status = 'published');

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
before update on public.courses
for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists course_modules_set_updated_at on public.course_modules;
create trigger course_modules_set_updated_at
before update on public.course_modules
for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists course_lessons_set_updated_at on public.course_lessons;
create trigger course_lessons_set_updated_at
before update on public.course_lessons
for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute procedure public.set_current_timestamp_updated_at();

insert into storage.buckets (id, name, public)
values ('lesson-assets', 'lesson-assets', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('product-downloads', 'product-downloads', false)
on conflict (id) do nothing;
