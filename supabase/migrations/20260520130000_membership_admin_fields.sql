-- Membership admin fields used by the public checkout, coupons and admin screens.
-- This migration is intentionally additive so it is safe for databases that
-- already received some of these columns manually.

alter table public.membership_tiers
  add column if not exists price_ars integer not null default 0,
  add column if not exists price_usd numeric(12,2) not null default 0,
  add column if not exists billing_period text not null default 'monthly',
  add column if not exists trial_days integer not null default 0,
  add column if not exists features jsonb not null default '[]'::jsonb,
  add column if not exists is_featured boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'membership_tiers_billing_period_check'
  ) then
    alter table public.membership_tiers
      add constraint membership_tiers_billing_period_check
      check (billing_period in ('monthly', 'annual', 'lifetime', 'one_time'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'membership_tiers_price_ars_nonnegative'
  ) then
    alter table public.membership_tiers
      add constraint membership_tiers_price_ars_nonnegative
      check (price_ars >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'membership_tiers_trial_days_nonnegative'
  ) then
    alter table public.membership_tiers
      add constraint membership_tiers_trial_days_nonnegative
      check (trial_days >= 0);
  end if;
end $$;

create table if not exists public.membership_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null default 'percent',
  discount_value numeric(12,2) not null default 0,
  max_uses integer,
  uses_count integer not null default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  tier_ids uuid[],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.membership_coupons
  add column if not exists description text,
  add column if not exists discount_type text not null default 'percent',
  add column if not exists discount_value numeric(12,2) not null default 0,
  add column if not exists max_uses integer,
  add column if not exists uses_count integer not null default 0,
  add column if not exists valid_from timestamptz,
  add column if not exists valid_until timestamptz,
  add column if not exists tier_ids uuid[],
  add column if not exists active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'membership_coupons_discount_type_check'
  ) then
    alter table public.membership_coupons
      add constraint membership_coupons_discount_type_check
      check (discount_type in ('percent', 'fixed_ars'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'membership_coupons_discount_value_nonnegative'
  ) then
    alter table public.membership_coupons
      add constraint membership_coupons_discount_value_nonnegative
      check (discount_value >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'membership_coupons_uses_nonnegative'
  ) then
    alter table public.membership_coupons
      add constraint membership_coupons_uses_nonnegative
      check (uses_count >= 0 and (max_uses is null or max_uses > 0));
  end if;
end $$;

create index if not exists membership_coupons_active_idx
  on public.membership_coupons (active);

create unique index if not exists membership_coupons_code_upper_idx
  on public.membership_coupons (upper(code));

alter table public.membership_grants
  add column if not exists grant_type text not null default 'manual',
  add column if not exists starts_at timestamptz not null default now(),
  add column if not exists trial_ends_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists payment_reference text,
  add column if not exists coupon_id uuid references public.membership_coupons(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'membership_grants_grant_type_check'
  ) then
    alter table public.membership_grants
      add constraint membership_grants_grant_type_check
      check (grant_type in ('manual', 'admin', 'payment', 'trial'));
  end if;
end $$;

create index if not exists membership_grants_grant_type_idx
  on public.membership_grants (grant_type);

create index if not exists membership_grants_coupon_idx
  on public.membership_grants (coupon_id);

alter table public.membership_coupons enable row level security;

drop policy if exists "staff_manage_membership_coupons" on public.membership_coupons;
create policy "staff_manage_membership_coupons"
on public.membership_coupons
for all
to authenticated
using (public.has_staff_role(auth.uid()))
with check (public.has_staff_role(auth.uid()));

drop trigger if exists membership_coupons_set_updated_at on public.membership_coupons;
create trigger membership_coupons_set_updated_at
before update on public.membership_coupons
for each row execute procedure public.set_current_timestamp_updated_at();
