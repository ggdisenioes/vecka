-- Agenda del Club: clases en vivo futuras y publicaciones de contenido
-- programadas, cargadas por el admin y visibles para las socias con acceso.

create table if not exists public.membership_agenda_events (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references public.membership_tiers(id) on delete cascade,
  title text not null,
  description text,
  event_type text not null default 'live_class'
    check (event_type in ('live_class', 'content_release', 'other')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location_url text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists membership_agenda_events_tier_starts_idx
  on public.membership_agenda_events (tier_id, starts_at);

create index if not exists membership_agenda_events_upcoming_idx
  on public.membership_agenda_events (tier_id, status, starts_at)
  where status = 'scheduled';

alter table public.membership_agenda_events enable row level security;

drop policy if exists "staff_manage_membership_agenda" on public.membership_agenda_events;
create policy "staff_manage_membership_agenda"
on public.membership_agenda_events
for all
to authenticated
using (public.has_staff_role(auth.uid()))
with check (public.has_staff_role(auth.uid()));

drop policy if exists "members_read_membership_agenda" on public.membership_agenda_events;
create policy "members_read_membership_agenda"
on public.membership_agenda_events
for select
to authenticated
using (
  exists (
    select 1
    from public.membership_tiers t
    where t.id = membership_agenda_events.tier_id
      and t.status = 'published'
      and public.has_active_membership_access(t.id, auth.uid())
  )
);

drop trigger if exists membership_agenda_events_set_updated_at on public.membership_agenda_events;
create trigger membership_agenda_events_set_updated_at
before update on public.membership_agenda_events
for each row execute procedure public.set_current_timestamp_updated_at();
