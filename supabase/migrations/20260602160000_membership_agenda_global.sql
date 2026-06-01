-- La agenda del Club pasa a ser global (no atada a un tier puntual). Se
-- gestiona desde un panel propio del admin. tier_id queda opcional por
-- compatibilidad; los eventos nuevos son globales (tier_id null) y los ve
-- cualquier socia con una membresía activa del Club.

alter table public.membership_agenda_events
  alter column tier_id drop not null;

create index if not exists membership_agenda_events_global_idx
  on public.membership_agenda_events (status, starts_at)
  where tier_id is null;

-- RLS: socias con cualquier membresía activa (en un tier publicado) pueden
-- leer los eventos globales.
drop policy if exists "members_read_global_agenda" on public.membership_agenda_events;
create policy "members_read_global_agenda"
on public.membership_agenda_events
for select
to authenticated
using (
  membership_agenda_events.tier_id is null
  and exists (
    select 1
    from public.membership_grants g
    join public.membership_tiers t on t.id = g.tier_id
    where g.user_id = auth.uid()
      and g.access_status = 'active'
      and (g.expires_at is null or g.expires_at > now())
      and t.status = 'published'
  )
);
