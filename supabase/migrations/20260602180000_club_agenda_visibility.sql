-- Toggles del admin para mostrar/ocultar, de forma independiente, la agenda
-- del Club y el bloque "Próxima clase en vivo" en la página de la membresía.

alter table public.platform_settings
  add column if not exists club_agenda_visible boolean not null default true,
  add column if not exists club_next_live_visible boolean not null default true;
