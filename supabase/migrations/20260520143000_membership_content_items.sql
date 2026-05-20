-- Native membership content that is not necessarily a course.
-- Supports exclusive articles/text, image posts, PDF downloads/moldes,
-- external links, and embeds attached directly to a membership tier.

create table if not exists public.membership_content_items (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references public.membership_tiers(id) on delete cascade,
  type text not null default 'text',
  title text not null,
  summary text,
  body text,
  media_url text,
  bucket_name text,
  storage_path text,
  file_name text,
  mime_type text,
  size_bytes bigint not null default 0,
  sort_order integer not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'membership_content_items_type_check'
  ) then
    alter table public.membership_content_items
      add constraint membership_content_items_type_check
      check (type in ('text', 'image', 'download', 'link', 'embed'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'membership_content_items_status_check'
  ) then
    alter table public.membership_content_items
      add constraint membership_content_items_status_check
      check (status in ('draft', 'published', 'archived'));
  end if;
end $$;

create index if not exists membership_content_items_tier_idx
  on public.membership_content_items (tier_id, sort_order, created_at);

create index if not exists membership_content_items_published_idx
  on public.membership_content_items (tier_id, status)
  where status = 'published';

create or replace function public.has_active_membership_access(target_tier uuid, target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.membership_grants
    where tier_id = target_tier
      and user_id = target_user
      and access_status = 'active'
      and (expires_at is null or expires_at > now())
  );
$$;

alter table public.membership_content_items enable row level security;

drop policy if exists "staff_manage_membership_content_items" on public.membership_content_items;
create policy "staff_manage_membership_content_items"
on public.membership_content_items
for all
to authenticated
using (public.has_staff_role(auth.uid()))
with check (public.has_staff_role(auth.uid()));

drop policy if exists "members_read_published_membership_content_items" on public.membership_content_items;
create policy "members_read_published_membership_content_items"
on public.membership_content_items
for select
to authenticated
using (
  status = 'published'
  and public.has_active_membership_access(tier_id, auth.uid())
  and exists (
    select 1
    from public.membership_tiers t
    where t.id = membership_content_items.tier_id
      and t.status = 'published'
  )
);

drop trigger if exists membership_content_items_set_updated_at on public.membership_content_items;
create trigger membership_content_items_set_updated_at
before update on public.membership_content_items
for each row execute procedure public.set_current_timestamp_updated_at();
