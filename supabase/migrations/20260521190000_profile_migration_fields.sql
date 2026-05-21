alter table public.profiles
  add column if not exists legacy_wp_id bigint,
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists phone text,
  add column if not exists bio text;

create unique index if not exists profiles_legacy_wp_id_key
  on public.profiles (legacy_wp_id)
  where legacy_wp_id is not null;

create index if not exists profiles_email_idx
  on public.profiles (lower(email));
