-- Adds 'upload' as a supported video provider so lessons/modules can host their
-- own video files in Supabase Storage as an alternative to Vimeo.
alter table public.course_lessons
  drop constraint if exists course_lessons_video_provider_check;
alter table public.course_lessons
  add constraint course_lessons_video_provider_check
  check (video_provider in ('vimeo', 'external', 'upload', 'none'));
alter table public.course_lessons
  add column if not exists video_storage_path text;
alter table public.course_lessons
  add column if not exists video_bucket text not null default 'course-videos';

alter table public.course_modules
  drop constraint if exists course_modules_video_provider_check;
alter table public.course_modules
  add constraint course_modules_video_provider_check
  check (video_provider in ('vimeo', 'external', 'upload', 'none'));
alter table public.course_modules
  add column if not exists video_storage_path text;
alter table public.course_modules
  add column if not exists video_bucket text not null default 'course-videos';

-- Replace per-lesson attachments with a unified materials table that supports
-- attachments at three levels: course, module, lesson.
drop table if exists public.lesson_attachments cascade;

create table if not exists public.course_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  module_id uuid references public.course_modules(id) on delete cascade,
  lesson_id uuid references public.course_lessons(id) on delete cascade,
  bucket_name text not null default 'lesson-assets',
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  constraint course_materials_exactly_one_parent check (
    (case when course_id is not null then 1 else 0 end)
    + (case when module_id is not null then 1 else 0 end)
    + (case when lesson_id is not null then 1 else 0 end) = 1
  )
);

create unique index if not exists course_materials_bucket_path_idx
  on public.course_materials (bucket_name, storage_path);
create index if not exists course_materials_course_idx
  on public.course_materials (course_id);
create index if not exists course_materials_module_idx
  on public.course_materials (module_id);
create index if not exists course_materials_lesson_idx
  on public.course_materials (lesson_id);

-- Resolves the owning course id for a material regardless of which level it
-- hangs from. SECURITY DEFINER so RLS policies that call it can read the join
-- tables even for anon callers.
create or replace function public.resolve_material_course_id(
  p_course_id uuid,
  p_module_id uuid,
  p_lesson_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    p_course_id,
    (select course_id from public.course_modules where id = p_module_id),
    (select cm.course_id
       from public.course_modules cm
       join public.course_lessons cl on cl.module_id = cm.id
       where cl.id = p_lesson_id)
  );
$$;

alter table public.course_materials enable row level security;

drop policy if exists "authorized_users_can_read_course_materials" on public.course_materials;
create policy "authorized_users_can_read_course_materials"
on public.course_materials
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = public.resolve_material_course_id(
        course_materials.course_id,
        course_materials.module_id,
        course_materials.lesson_id
      )
      and c.status = 'published'
      and (
        c.visibility in ('public', 'catalog')
        or public.has_active_course_access(c.id, auth.uid())
        or public.has_staff_role(auth.uid())
      )
  )
);

-- Private bucket for self-hosted course videos.
insert into storage.buckets (id, name, public)
values ('course-videos', 'course-videos', false)
on conflict (id) do nothing;
