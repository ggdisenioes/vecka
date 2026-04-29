-- Allow staff (admin/editorial) to read course content regardless of status,
-- so they can preview unpublished/private courses they are editing.
-- Public/student access rules are unchanged.

drop policy if exists "public_can_read_catalog_courses" on public.courses;
create policy "public_can_read_catalog_courses"
on public.courses
for select
to anon, authenticated
using (
  public.has_staff_role(auth.uid())
  or (
    status = 'published'
    and (
      visibility in ('public', 'catalog')
      or public.has_active_course_access(id, auth.uid())
    )
  )
);

drop policy if exists "public_can_read_modules_of_public_courses" on public.course_modules;
create policy "public_can_read_modules_of_public_courses"
on public.course_modules
for select
to anon, authenticated
using (
  public.has_staff_role(auth.uid())
  or exists (
    select 1
    from public.courses
    where courses.id = course_modules.course_id
      and courses.status = 'published'
      and (
        courses.visibility in ('public', 'catalog')
        or public.has_active_course_access(courses.id, auth.uid())
      )
  )
);

drop policy if exists "public_can_read_preview_lessons" on public.course_lessons;
create policy "public_can_read_preview_lessons"
on public.course_lessons
for select
to anon, authenticated
using (
  public.has_staff_role(auth.uid())
  or (
    status = 'published'
    and exists (
      select 1
      from public.course_modules
      join public.courses on courses.id = course_modules.course_id
      where course_modules.id = course_lessons.module_id
        and courses.status = 'published'
        and (
          (course_lessons.is_preview = true and courses.visibility in ('public', 'catalog'))
          or public.has_active_course_access(courses.id, auth.uid())
        )
    )
  )
);

drop policy if exists "authorized_users_can_read_course_materials" on public.course_materials;
create policy "authorized_users_can_read_course_materials"
on public.course_materials
for select
to anon, authenticated
using (
  public.has_staff_role(auth.uid())
  or exists (
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
      )
  )
);
