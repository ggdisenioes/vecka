-- Recurring membership subscriptions.
--
-- Tracks MercadoPago preapprovals separately from membership_grants. A grant is
-- activated only when MercadoPago confirms an authorized/approved subscription
-- payment through the webhook.

create table if not exists public.membership_subscriptions (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('mercadopago')),
  provider_subscription_id text,
  tier_id uuid not null references public.membership_tiers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'authorized', 'paused', 'cancelled', 'expired', 'failed')),
  amount numeric(12,2) not null default 0,
  currency text not null default 'ARS',
  billing_period text not null default 'monthly',
  next_payment_at timestamptz,
  started_at timestamptz,
  cancelled_at timestamptz,
  last_payment_at timestamptz,
  coupon_id uuid references public.membership_coupons(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subscription_id),
  unique (provider, tier_id, user_id)
);

create index if not exists membership_subscriptions_user_idx
  on public.membership_subscriptions (user_id);

create index if not exists membership_subscriptions_tier_idx
  on public.membership_subscriptions (tier_id);

create index if not exists membership_subscriptions_status_idx
  on public.membership_subscriptions (status);

create index if not exists membership_subscriptions_next_payment_idx
  on public.membership_subscriptions (next_payment_at)
  where status = 'authorized';

drop trigger if exists membership_subscriptions_set_updated_at on public.membership_subscriptions;
create trigger membership_subscriptions_set_updated_at
before update on public.membership_subscriptions
for each row execute procedure public.set_current_timestamp_updated_at();

create table if not exists public.membership_payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('mercadopago')),
  provider_event_id text,
  provider_payment_id text,
  provider_subscription_id text,
  subscription_id uuid references public.membership_subscriptions(id) on delete set null,
  tier_id uuid references public.membership_tiers(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  amount numeric(12,2),
  currency text not null default 'ARS',
  status text not null,
  event_type text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists membership_payment_events_provider_event_key
  on public.membership_payment_events (provider, provider_event_id)
  where provider_event_id is not null;

create unique index if not exists membership_payment_events_provider_payment_event_key
  on public.membership_payment_events (provider, provider_payment_id, event_type)
  where provider_payment_id is not null;

create index if not exists membership_payment_events_subscription_idx
  on public.membership_payment_events (subscription_id);

create index if not exists membership_payment_events_user_idx
  on public.membership_payment_events (user_id);

alter table public.membership_subscriptions enable row level security;
alter table public.membership_payment_events enable row level security;

drop policy if exists "users_read_own_membership_subscriptions_or_staff" on public.membership_subscriptions;
create policy "users_read_own_membership_subscriptions_or_staff"
on public.membership_subscriptions
for select
to authenticated
using (user_id = auth.uid() or public.has_staff_role(auth.uid()));

drop policy if exists "staff_manage_membership_subscriptions" on public.membership_subscriptions;
create policy "staff_manage_membership_subscriptions"
on public.membership_subscriptions
for all
to authenticated
using (public.has_staff_role(auth.uid()))
with check (public.has_staff_role(auth.uid()));

drop policy if exists "users_read_own_membership_payment_events_or_staff" on public.membership_payment_events;
create policy "users_read_own_membership_payment_events_or_staff"
on public.membership_payment_events
for select
to authenticated
using (user_id = auth.uid() or public.has_staff_role(auth.uid()));

drop policy if exists "staff_manage_membership_payment_events" on public.membership_payment_events;
create policy "staff_manage_membership_payment_events"
on public.membership_payment_events
for all
to authenticated
using (public.has_staff_role(auth.uid()))
with check (public.has_staff_role(auth.uid()));
