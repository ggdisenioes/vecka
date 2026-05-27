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

alter table public.membership_content_items
  add column if not exists category_id uuid references public.membership_content_categories(id) on delete set null;

create index if not exists membership_content_items_category_idx
  on public.membership_content_items (tier_id, category_id, status, sort_order, created_at);

alter table public.membership_content_categories enable row level security;

drop policy if exists "staff_manage_membership_content_categories" on public.membership_content_categories;
create policy "staff_manage_membership_content_categories"
on public.membership_content_categories
for all
to authenticated
using (public.has_staff_role(auth.uid()))
with check (public.has_staff_role(auth.uid()));

drop policy if exists "members_read_membership_content_categories" on public.membership_content_categories;
create policy "members_read_membership_content_categories"
on public.membership_content_categories
for select
to authenticated
using (
  exists (
    select 1
    from public.membership_tiers t
    where t.id = membership_content_categories.tier_id
      and t.status = 'published'
      and public.has_active_membership_access(t.id, auth.uid())
  )
);

drop trigger if exists membership_content_categories_set_updated_at on public.membership_content_categories;
create trigger membership_content_categories_set_updated_at
before update on public.membership_content_categories
for each row execute procedure public.set_current_timestamp_updated_at();
