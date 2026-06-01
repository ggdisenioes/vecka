-- ============================================================
-- MIGRACIÓN CLUB VECKA: categorías y contenido desde WP #13362
-- Pegar en SQL Editor de Supabase
-- ============================================================

-- 1. Crear tabla membership_content_categories si no existe
create table if not exists public.membership_content_categories (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references public.membership_tiers(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists membership_content_categories_tier_slug_key
  on public.membership_content_categories (tier_id, slug);
create index if not exists membership_content_categories_tier_sort_idx
  on public.membership_content_categories (tier_id, sort_order, created_at);
alter table public.membership_content_categories enable row level security;
drop policy if exists "staff_manage_membership_content_categories" on public.membership_content_categories;
create policy "staff_manage_membership_content_categories"
  on public.membership_content_categories for all to authenticated
  using (public.has_staff_role(auth.uid())) with check (public.has_staff_role(auth.uid()));
drop policy if exists "members_read_membership_content_categories" on public.membership_content_categories;
create policy "members_read_membership_content_categories"
  on public.membership_content_categories for select to authenticated
  using (exists (
    select 1 from public.membership_tiers t
    where t.id = membership_content_categories.tier_id
      and t.status = 'published'
      and public.has_active_membership_access(t.id, auth.uid())
  ));

-- 2. Agregar category_id a membership_content_items si no existe
alter table public.membership_content_items add column if not exists category_id uuid references public.membership_content_categories(id) on delete set null;
create index if not exists membership_content_items_category_idx on public.membership_content_items (tier_id, category_id, status, sort_order, created_at);

-- 3. Agregar available_from si no existe
alter table public.membership_content_items add column if not exists available_from timestamptz not null default now();

-- 4. Insertar categorías (upsert por tier+slug)
insert into public.membership_content_categories (tier_id, name, slug, sort_order)
values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', 'Mi Club', 'mi-club', 0)
on conflict (tier_id, slug) do update set name = excluded.name, sort_order = excluded.sort_order;
insert into public.membership_content_categories (tier_id, name, slug, sort_order)
values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', 'Noviembre', 'noviembre', 1)
on conflict (tier_id, slug) do update set name = excluded.name, sort_order = excluded.sort_order;
insert into public.membership_content_categories (tier_id, name, slug, sort_order)
values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', 'Diciembre', 'diciembre', 2)
on conflict (tier_id, slug) do update set name = excluded.name, sort_order = excluded.sort_order;
insert into public.membership_content_categories (tier_id, name, slug, sort_order)
values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', 'Enero', 'enero', 3)
on conflict (tier_id, slug) do update set name = excluded.name, sort_order = excluded.sort_order;
insert into public.membership_content_categories (tier_id, name, slug, sort_order)
values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', 'Febrero', 'febrero', 4)
on conflict (tier_id, slug) do update set name = excluded.name, sort_order = excluded.sort_order;
insert into public.membership_content_categories (tier_id, name, slug, sort_order)
values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', 'Marzo', 'marzo', 5)
on conflict (tier_id, slug) do update set name = excluded.name, sort_order = excluded.sort_order;
insert into public.membership_content_categories (tier_id, name, slug, sort_order)
values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', 'Abril', 'abril', 6)
on conflict (tier_id, slug) do update set name = excluded.name, sort_order = excluded.sort_order;
insert into public.membership_content_categories (tier_id, name, slug, sort_order)
values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', 'Mayo', 'mayo', 7)
on conflict (tier_id, slug) do update set name = excluded.name, sort_order = excluded.sort_order;

-- 5. Insertar items por categoría
-- (usamos CTE para resolver el category_id por slug)

-- Mi Club
do $$ declare cat_id uuid; begin
  select id into cat_id from public.membership_content_categories where tier_id='8431e60a-aaa4-4248-b818-bd433d6d94a3' and slug='mi-club';
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Bienvenida al Club VeCKA', 'Video de bienvenida de Vero', 'https://player.vimeo.com/video/1084634197?badge=0&autopause=0&player_id=0&app_id=58479', 0, 'published', '2025-10-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
end $$;

-- Noviembre
do $$ declare cat_id uuid; begin
  select id into cat_id from public.membership_content_categories where tier_id='8431e60a-aaa4-4248-b818-bd433d6d94a3' and slug='noviembre';
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Primera Clase en Vivo – Jueves 20/11', 'Vestido Bohemio · Clase 1', 'https://player.vimeo.com/video/1139071266?badge=0&autopause=0&player_id=0&app_id=58479', 0, 'published', '2025-11-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Segunda Clase en Vivo – Jueves 27/11', 'Vestido Bohemio · Clase 2', 'https://player.vimeo.com/video/1141278258?badge=0&autopause=0&player_id=0&app_id=58479', 1, 'published', '2025-11-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Clase de Consultas – Martes 2/12', 'Vestido Bohemio · Consultas', 'https://player.vimeo.com/video/1144002124?badge=0&autopause=0&player_id=0&app_id=58479', 2, 'published', '2025-11-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Vestido Bohemio 38-48 (A4)', 'PDF para imprimir en A4', 'https://vecka.com.ar/wp-content/uploads/2025/11/6-Vestido-Bohemio-38-48-A4.pdf', 3, 'published', '2025-11-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Vestido Bohemio 38-48 (Plotter)', 'PDF tamaño poster/plotter', 'https://vecka.com.ar/wp-content/uploads/2025/11/6-Vestido-Bohemio-38-48-poster.pdf', 4, 'published', '2025-11-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Vestido Bohemio 48-58 (A4)', 'PDF para imprimir en A4', 'https://vecka.com.ar/wp-content/uploads/2025/11/6-Vestido-Bohemio-48-58-A4.pdf', 5, 'published', '2025-11-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Vestido Bohemio 48-58 (Plotter)', 'PDF tamaño poster/plotter', 'https://vecka.com.ar/wp-content/uploads/2025/11/6-Vestido-Bohemio-48-58-poster.pdf', 6, 'published', '2025-11-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Guía Vestido Bohemio', 'Instrucciones completas', 'https://vecka.com.ar/wp-content/uploads/2025/11/6-Guia-Vestido.pdf', 7, 'published', '2025-11-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Ficha de Transformación', 'Material complementario', 'https://vecka.com.ar/wp-content/uploads/2025/11/transformacion.pdf', 8, 'published', '2025-11-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
end $$;

-- Diciembre
do $$ declare cat_id uuid; begin
  select id into cat_id from public.membership_content_categories where tier_id='8431e60a-aaa4-4248-b818-bd433d6d94a3' and slug='diciembre';
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Introducción al Traje de Baño', 'Presentación del proyecto de diciembre', 'https://player.vimeo.com/video/1145667997?badge=0&autopause=0&player_id=0&app_id=58479', 0, 'published', '2025-12-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Primera Clase en Vivo – Jueves 11/12', 'Traje de baño · Clase 1', 'https://player.vimeo.com/video/1145705800?badge=0&autopause=0&player_id=0&app_id=58479', 1, 'published', '2025-12-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Clase Especial – Lunes 16/12', 'Traje de baño · Clase especial', 'https://player.vimeo.com/video/1147080402?badge=0&autopause=0&player_id=0&app_id=58479', 2, 'published', '2025-12-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Segunda Clase en Vivo – Jueves 18/12', 'Traje de baño · Clase 2', 'https://player.vimeo.com/video/1148633103?badge=0&autopause=0&player_id=0&app_id=58479', 3, 'published', '2025-12-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Clase de Consultas – Martes 30/12', 'Traje de baño · Consultas', 'https://player.vimeo.com/video/1151443462?badge=0&autopause=0&player_id=0&app_id=58479', 4, 'published', '2025-12-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Corpiño Bikini (A4)', 'PDF para imprimir en A4', 'https://vecka.com.ar/wp-content/uploads/2025/12/7-Corpino-bikini-A4.pdf', 5, 'published', '2025-12-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Corpiño Bikini (Plotter)', 'PDF tamaño poster/plotter', 'https://vecka.com.ar/wp-content/uploads/2025/12/7-Corpino-bikini-poster.pdf', 6, 'published', '2025-12-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Corpiño Tankini (A4)', 'PDF para imprimir en A4', 'https://vecka.com.ar/wp-content/uploads/2025/12/7-Corpino-tankini-A4.pdf', 7, 'published', '2025-12-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Corpiño Tankini (Plotter)', 'PDF tamaño poster/plotter', 'https://vecka.com.ar/wp-content/uploads/2025/12/7-Corpino-tankini-poster.pdf', 8, 'published', '2025-12-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Vedetina (A4)', 'PDF para imprimir en A4', 'https://vecka.com.ar/wp-content/uploads/2025/12/7-Vedetina-A4.pdf', 9, 'published', '2025-12-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Vedetina (Plotter)', 'PDF tamaño poster/plotter', 'https://vecka.com.ar/wp-content/uploads/2025/12/7-Vedetina-poster.pdf', 10, 'published', '2025-12-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Guía Traje de Baño', 'Instrucciones completas', 'https://vecka.com.ar/wp-content/uploads/2025/12/7-Guia-Malla-1.pdf', 11, 'published', '2025-12-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Anexo Vedetina', 'Material complementario', 'https://vecka.com.ar/wp-content/uploads/2025/12/Anexo-Vedetina.pdf', 12, 'published', '2025-12-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
end $$;

-- Enero
do $$ declare cat_id uuid; begin
  select id into cat_id from public.membership_content_categories where tier_id='8431e60a-aaa4-4248-b818-bd433d6d94a3' and slug='enero';
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Mini Tote Bag (A4)', 'PDF para imprimir en A4', 'https://vecka.com.ar/wp-content/uploads/2025/12/1-molde-tote-mini-A4.pdf', 0, 'published', '2026-01-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Guía Taller Mini Tote Bag', 'Instrucciones completas del proyecto', 'https://vecka.com.ar/wp-content/uploads/2025/12/1-Guia-taller-tote-bag-MINI.pdf', 1, 'published', '2026-01-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
end $$;

-- Febrero
do $$ declare cat_id uuid; begin
  select id into cat_id from public.membership_content_categories where tier_id='8431e60a-aaa4-4248-b818-bd433d6d94a3' and slug='febrero';
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Primera Clase en Vivo – Jueves 5/2', 'Conjunto deportivo · Clase 1', 'https://player.vimeo.com/video/1162673637?badge=0&autopause=0&player_id=0&app_id=58479', 0, 'published', '2026-02-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Clase Especial – Martes 10/2', 'Conjunto deportivo · Clase especial', 'https://player.vimeo.com/video/1163731995?badge=0&autopause=0&player_id=0&app_id=58479', 1, 'published', '2026-02-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Segunda Clase en Vivo – Jueves 12/2', 'Conjunto deportivo · Clase 2', 'https://player.vimeo.com/video/1164456730?badge=0&autopause=0&player_id=0&app_id=58479', 2, 'published', '2026-02-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Tercera Clase en Vivo – Jueves 19/2', 'Conjunto deportivo · Clase 3', 'https://player.vimeo.com/video/1166677519?badge=0&autopause=0&player_id=0&app_id=58479', 3, 'published', '2026-02-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Clase de Consultas – Jueves 26/2', 'Conjunto deportivo · Consultas', 'https://player.vimeo.com/video/1168590594?badge=0&autopause=0&player_id=0&app_id=58479', 4, 'published', '2026-02-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Pantalón 38-48 (A4)', 'PDF para imprimir en A4', 'https://vecka.com.ar/wp-content/uploads/2026/02/08-pantalon-38-48-A4.pdf', 5, 'published', '2026-02-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Pantalón 38-48 (Plotter)', 'PDF tamaño poster/plotter', 'https://vecka.com.ar/wp-content/uploads/2026/02/08-pantalon-38-48-POSTER.pdf', 6, 'published', '2026-02-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Pantalón 48-58 (A4)', 'PDF para imprimir en A4', 'https://vecka.com.ar/wp-content/uploads/2026/02/08-pantalon-48-58-A4.pdf', 7, 'published', '2026-02-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Pantalón 48-58 (Plotter)', 'PDF tamaño poster/plotter', 'https://vecka.com.ar/wp-content/uploads/2026/02/08-pantalon-48-58-POSTER.pdf', 8, 'published', '2026-02-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Ficha Técnica Pantalón Deportivo', 'Especificaciones técnicas', 'https://vecka.com.ar/wp-content/uploads/2026/02/08-FICHATECNICA-pantalon.pdf', 9, 'published', '2026-02-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Campera 38-48 (A4)', 'PDF para imprimir en A4', 'https://vecka.com.ar/wp-content/uploads/2026/02/08-campera-38-48-A4.pdf', 10, 'published', '2026-02-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Campera 38-48 (Plotter)', 'PDF tamaño poster/plotter', 'https://vecka.com.ar/wp-content/uploads/2026/02/08-campera-38-48-POSTER.pdf', 11, 'published', '2026-02-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Campera 48-58 (A4)', 'PDF para imprimir en A4', 'https://vecka.com.ar/wp-content/uploads/2026/02/08-campera-48-58-A4.pdf', 12, 'published', '2026-02-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Campera 48-58 (Plotter)', 'PDF tamaño poster/plotter', 'https://vecka.com.ar/wp-content/uploads/2026/02/08-campera-48-58-POSTER.pdf', 13, 'published', '2026-02-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Ficha Técnica Campera Deportiva', 'Especificaciones técnicas', 'https://vecka.com.ar/wp-content/uploads/2026/02/Ficha-Tecnica-conjunto-deportivo-CAMPERA-1.pdf', 14, 'published', '2026-02-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
end $$;

-- Marzo
do $$ declare cat_id uuid; begin
  select id into cat_id from public.membership_content_categories where tier_id='8431e60a-aaa4-4248-b818-bd433d6d94a3' and slug='marzo';
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Clase en Vivo – Jueves 5/3', 'Camisa clásica · Clase 1', 'https://player.vimeo.com/video/1171489843?badge=0&autopause=0&player_id=0&app_id=58479', 0, 'published', '2026-03-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Clase en Vivo – Jueves 12/3', 'Camisa clásica · Clase 2', 'https://player.vimeo.com/video/1173034533?badge=0&autopause=0&player_id=0&app_id=58479', 1, 'published', '2026-03-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Clase en Vivo – Jueves 19/3', 'Camisa clásica · Clase 3', 'https://player.vimeo.com/video/1178560786?badge=0&autopause=0&player_id=0&app_id=58479', 2, 'published', '2026-03-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Clase en Vivo – Jueves 26/3', 'Camisa clásica · Clase 4', 'https://player.vimeo.com/video/1177431020?badge=0&autopause=0&player_id=0&app_id=58479', 3, 'published', '2026-03-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Camisa Cuello Mao 38-48 (A4)', 'PDF para imprimir en A4', 'https://vecka.com.ar/wp-content/uploads/2026/03/09-Camisa-cuello-mao-A4-38-48-capas.pdf', 4, 'published', '2026-03-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Camisa Cuello Mao 38-48 (Plotter)', 'PDF tamaño poster/plotter', 'https://vecka.com.ar/wp-content/uploads/2026/03/09-Camisa-cuello-mao-poster-38-48-capas.pdf', 5, 'published', '2026-03-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Camisa Cuello Mao 48-58 (A4)', 'PDF para imprimir en A4', 'https://vecka.com.ar/wp-content/uploads/2026/03/09-Camisa-cuello-mao-A4-48-58-capas.pdf', 6, 'published', '2026-03-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Camisa Cuello Mao 48-58 (Plotter)', 'PDF tamaño poster/plotter', 'https://vecka.com.ar/wp-content/uploads/2026/03/09-Camisa-cuello-mao-poster-48-58-capas.pdf', 7, 'published', '2026-03-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Guía Camisa Cuello Mao', 'Instrucciones completas', 'https://vecka.com.ar/wp-content/uploads/2026/03/09-Guia-camisa-cuelo-mao.pdf', 8, 'published', '2026-03-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
end $$;

-- Abril
do $$ declare cat_id uuid; begin
  select id into cat_id from public.membership_content_categories where tier_id='8431e60a-aaa4-4248-b818-bd433d6d94a3' and slug='abril';
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Primera Clase en Vivo – Jueves 9/4', 'Campera Bomber · Clase 1', 'https://player.vimeo.com/video/1181751795?badge=0&autopause=0&player_id=0&app_id=58479', 0, 'published', '2026-04-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Segunda Clase en Vivo – Jueves 16/4', 'Campera Bomber · Clase 2', 'https://player.vimeo.com/video/1185565656?badge=0&autopause=0&player_id=0&app_id=58479', 1, 'published', '2026-04-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Tercera Clase en Vivo – Jueves 23/4', 'Campera Bomber · Clase 3', 'https://player.vimeo.com/video/1187421085?badge=0&autopause=0&player_id=0&app_id=58479', 2, 'published', '2026-04-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'embed', 'Clase de Consultas – Jueves 30/4', 'Campera Bomber · Consultas', 'https://player.vimeo.com/video/1188632763?badge=0&autopause=0&player_id=0&app_id=58479', 3, 'published', '2026-04-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Guía Campera Bomber', 'Instrucciones completas', 'https://vecka.com.ar/wp-content/uploads/2026/04/10-Guia-campera-bomber-1.pdf', 4, 'published', '2026-04-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Campera Bomber 38-48 (A4)', 'PDF para imprimir en A4', 'https://vecka.com.ar/wp-content/uploads/2026/04/10-Campera-bomber-A4-38-48-capas.pdf', 5, 'published', '2026-04-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Campera Bomber 38-48 (Plotter)', 'PDF tamaño poster/plotter', 'https://vecka.com.ar/wp-content/uploads/2026/04/10-Campera-bomber-poster-38-48-capas.pdf', 6, 'published', '2026-04-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Campera Bomber 48-58 (A4)', 'PDF para imprimir en A4', 'https://vecka.com.ar/wp-content/uploads/2026/04/10-Campera-bomber-A4-48-58-capas-2.pdf', 7, 'published', '2026-04-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'download', 'Molde Campera Bomber 48-58 (Plotter)', 'PDF tamaño poster/plotter', 'https://vecka.com.ar/wp-content/uploads/2026/04/10-Campera-bomber-poster-48-58-capas-2.pdf', 8, 'published', '2026-04-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
end $$;

-- Mayo
do $$ declare cat_id uuid; begin
  select id into cat_id from public.membership_content_categories where tier_id='8431e60a-aaa4-4248-b818-bd433d6d94a3' and slug='mayo';
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'text', 'Clases en Vivo', 'Jueves 14/5 · Jueves 21/5 · Jueves 28/5 — Grabaciones disponibles próximamente.', null, 0, 'published', '2026-05-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
  insert into public.membership_content_items (tier_id, category_id, type, title, summary, media_url, sort_order, status, available_from)
  values ('8431e60a-aaa4-4248-b818-bd433d6d94a3', cat_id, 'text', 'Clases Pregrabadas', 'Próximamente…', null, 1, 'published', '2026-05-01T00:00:00Z'::timestamptz)
  on conflict do nothing;
end $$;
