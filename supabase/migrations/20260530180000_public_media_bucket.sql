-- Bucket público para imágenes mostradas a usuarios anónimos (covers de
-- membresías, covers de cursos, ilustraciones de blog, etc.).
insert into storage.buckets (id, name, public)
values ('public-media', 'public-media', true)
on conflict (id) do update set public = true;

-- Lectura pública vía Storage CDN ya cubierta por public=true.
-- Solo staff puede subir / modificar / borrar.
create policy "public-media staff insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'public-media'
    and public.has_staff_role(auth.uid())
  );

create policy "public-media staff update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'public-media'
    and public.has_staff_role(auth.uid())
  )
  with check (
    bucket_id = 'public-media'
    and public.has_staff_role(auth.uid())
  );

create policy "public-media staff delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'public-media'
    and public.has_staff_role(auth.uid())
  );
