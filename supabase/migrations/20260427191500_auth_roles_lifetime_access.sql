create table if not exists public.platform_settings (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null default 'Vecka',
  primary_domain text not null default 'vecka.com.ar',
  app_domain text not null default 'nuevo.vecka.com.ar',
  video_provider text not null default 'vimeo' check (video_provider in ('vimeo', 'external')),
  video_embed_domains text[] not null default array['vecka.com.ar', 'nuevo.vecka.com.ar'],
  course_access_model text not null default 'lifetime' check (course_access_model in ('lifetime')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (brand_name, primary_domain, app_domain, video_provider, video_embed_domains, course_access_model)
select 'Vecka', 'vecka.com.ar', 'nuevo.vecka.com.ar', 'vimeo', array['vecka.com.ar', 'nuevo.vecka.com.ar'], 'lifetime'
where not exists (select 1 from public.platform_settings);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'student' check (role in ('admin', 'editorial', 'student')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update
  set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

create or replace function public.has_staff_role(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = target_user
      and role in ('admin', 'editorial')
  );
$$;

create or replace function public.has_active_course_access(target_course uuid, target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.course_enrollments
    where course_id = target_course
      and user_id = target_user
      and access_status = 'active'
      and (expires_at is null or expires_at > now())
  );
$$;

alter table public.profiles enable row level security;
alter table public.platform_settings enable row level security;

drop policy if exists "users_can_read_own_profile" on public.profiles;
create policy "users_can_read_own_profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.has_staff_role(auth.uid()));

drop policy if exists "users_can_update_own_profile" on public.profiles;
create policy "users_can_update_own_profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.has_staff_role(auth.uid()))
with check (auth.uid() = id or public.has_staff_role(auth.uid()));

drop policy if exists "staff_can_read_platform_settings" on public.platform_settings;
create policy "staff_can_read_platform_settings"
on public.platform_settings
for select
to authenticated
using (public.has_staff_role(auth.uid()));

drop policy if exists "public_can_read_catalog_courses" on public.courses;
create policy "public_can_read_catalog_courses"
on public.courses
for select
to anon, authenticated
using (
  status = 'published'
  and (
    visibility in ('public', 'catalog')
    or public.has_active_course_access(id, auth.uid())
    or public.has_staff_role(auth.uid())
  )
);

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
      and (
        courses.visibility in ('public', 'catalog')
        or public.has_active_course_access(courses.id, auth.uid())
        or public.has_staff_role(auth.uid())
      )
  )
);

drop policy if exists "public_can_read_preview_lessons" on public.course_lessons;
create policy "public_can_read_preview_lessons"
on public.course_lessons
for select
to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.course_modules
    join public.courses on courses.id = course_modules.course_id
    where course_modules.id = course_lessons.module_id
      and courses.status = 'published'
      and (
        (
          course_lessons.is_preview = true
          and courses.visibility in ('public', 'catalog')
        )
        or public.has_active_course_access(courses.id, auth.uid())
        or public.has_staff_role(auth.uid())
      )
  )
);

drop policy if exists "authorized_users_can_read_attachments" on public.lesson_attachments;
create policy "authorized_users_can_read_attachments"
on public.lesson_attachments
for select
to authenticated
using (
  exists (
    select 1
    from public.course_lessons
    join public.course_modules on course_modules.id = course_lessons.module_id
    join public.courses on courses.id = course_modules.course_id
    where course_lessons.id = lesson_attachments.lesson_id
      and courses.status = 'published'
      and (
        public.has_active_course_access(courses.id, auth.uid())
        or public.has_staff_role(auth.uid())
      )
  )
);

drop policy if exists "users_can_read_own_enrollments_or_staff" on public.course_enrollments;
create policy "users_can_read_own_enrollments_or_staff"
on public.course_enrollments
for select
to authenticated
using (user_id = auth.uid() or public.has_staff_role(auth.uid()));

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists platform_settings_set_updated_at on public.platform_settings;
create trigger platform_settings_set_updated_at
before update on public.platform_settings
for each row execute procedure public.set_current_timestamp_updated_at();
