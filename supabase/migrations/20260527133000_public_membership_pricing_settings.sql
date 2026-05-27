alter table public.platform_settings
  add column if not exists public_membership_monthly_price_ars integer,
  add column if not exists public_membership_annual_price_ars integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'platform_settings_public_membership_monthly_price_ars_nonnegative'
  ) then
    alter table public.platform_settings
      add constraint platform_settings_public_membership_monthly_price_ars_nonnegative
      check (public_membership_monthly_price_ars is null or public_membership_monthly_price_ars >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'platform_settings_public_membership_annual_price_ars_nonnegative'
  ) then
    alter table public.platform_settings
      add constraint platform_settings_public_membership_annual_price_ars_nonnegative
      check (public_membership_annual_price_ars is null or public_membership_annual_price_ars >= 0);
  end if;
end $$;
