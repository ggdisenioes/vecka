-- Fix public catalog RLS policies to exclude membership-only courses.
-- Without this patch, courses marked is_membership=true appeared in /courses
-- even though users without an active grant couldn't access them.

drop policy if exists "public_can_read_catalog_courses" on public.courses;
create policy "public_can_read_catalog_courses"
on public.courses
for select
to anon, authenticated
using (
  status = 'published'
  and visibility in ('public', 'catalog')
  and is_membership = false
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
      and courses.visibility in ('public', 'catalog')
      and courses.is_membership = false
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
      and courses.is_membership = false
  )
);
