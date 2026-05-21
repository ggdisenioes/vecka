alter table public.membership_tiers
  add column if not exists legacy_wp_id bigint,
  add column if not exists legacy_product_wp_ids bigint[],
  add column if not exists legacy_access_length text;

create unique index if not exists membership_tiers_legacy_wp_id_key
  on public.membership_tiers (legacy_wp_id)
  where legacy_wp_id is not null;

alter table public.membership_grants
  add column if not exists legacy_wp_id bigint,
  add column if not exists legacy_order_wp_id bigint,
  add column if not exists legacy_product_wp_id bigint,
  add column if not exists legacy_status text;

create unique index if not exists membership_grants_legacy_wp_id_key
  on public.membership_grants (legacy_wp_id)
  where legacy_wp_id is not null;
