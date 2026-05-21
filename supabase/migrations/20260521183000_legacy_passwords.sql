create table if not exists public.legacy_passwords (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phpass_hash text not null,
  migrated boolean not null default false,
  migrated_at timestamptz
);

alter table public.legacy_passwords enable row level security;
